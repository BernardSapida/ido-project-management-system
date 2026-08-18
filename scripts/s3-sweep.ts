/**
 * Delete every object in the bucket that no database row references.
 *
 *   npm run s3:sweep              # dry run - lists what it WOULD delete
 *   npm run s3:sweep -- --delete  # actually deletes
 *
 * ## Why this exists
 *
 * Uploads are presigned, so a file is in S3 the moment the author drops it on
 * the form - before Save, and whether or not Save ever happens. Close the tab,
 * press Cancel, swap an image three times while drafting: every one of those is
 * an object the database has never heard of, and no delete handler can find
 * them, because no row ever referenced them. In practice this is the larger
 * pile.
 *
 * It is also the backstop for the delete-on-delete paths you write in your
 * routers, which should swallow their failures rather than block a save. What
 * they miss ends up here. That is what lets them stay best-effort.
 *
 * ## BEFORE THIS CAN RUN
 *
 * Fill in `REFERENCE_SOURCES` below. It is empty in the template, and the script
 * REFUSES TO RUN while it is - because with no sources every object in the
 * bucket looks unreferenced, and a `--delete` would empty it. Failing closed is
 * the only safe default for a file that ships without knowing your schema.
 *
 * ## The two things that make it safe once configured
 *
 * 1. **The grace period.** An object younger than `GRACE_HOURS` is never
 *    touched, however unreferenced it looks. Without it the sweep deletes the
 *    photo an author uploaded ninety seconds ago into a form they have not
 *    submitted yet - the most destructive thing this script can do, and it would
 *    look exactly like correct behaviour.
 *
 * 2. **Dry run by default.** `--delete` is opt-in. A sweep whose default is
 *    destructive gets run once, by somebody exploring, against production.
 */

import {
	DeleteObjectsCommand,
	ListObjectsV2Command,
	type ListObjectsV2CommandOutput,
	S3Client,
} from "@aws-sdk/client-s3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client.ts";
import { collectRequestImageUrls, collectUserImageUrls } from "../src/lib/image-urls.ts";

/**
 * Every table that can hold an image URL, and how to read the URLs out of it.
 *
 * ## Fill this in
 *
 * One entry per model with an image. For example, once you have a `blog` model
 * with a banner, a carousel and a rich-text body:
 *
 * ```ts
 * const REFERENCE_SOURCES: ReferenceSource[] = [
 *   {
 *     label: "blog",
 *     read: async (prisma) => {
 *       const rows = await prisma.blog.findMany({
 *         select: { bannerUrl: true, body: true, carousel: true },
 *       });
 *       return rows.flatMap((row) =>
 *         unique([
 *           ...(isUsableUrl(row.bannerUrl) ? [row.bannerUrl] : []),
 *           ...(Array.isArray(row.carousel) ? row.carousel.flatMap((i) =>
 *             i && typeof i === "object" && isUsableUrl((i as { src?: unknown }).src)
 *               ? [(i as { src: string }).src] : []) : []),
 *           ...collectRichTextImageUrls(row.body),
 *         ]),
 *       );
 *     },
 *   },
 * ];
 * ```
 *
 * **Every column that can hold a URL, including rich-text bodies.** Images
 * dropped into the editor mid-sentence live in a Json column and are the ones
 * nobody remembers - and a URL missing from here is an image this script
 * deletes out from under a published article.
 *
 * Prefer moving the per-model logic into `src/lib/image-urls.ts` and calling it
 * from both here and your routers, so the two can never disagree about what a
 * record uses.
 */
interface ReferenceSource {
	label: string;
	read: (prisma: PrismaClient) => Promise<string[]>;
}

const REFERENCE_SOURCES: ReferenceSource[] = [
	{
		label: "user.signatureUrl",
		read: async (prisma) => {
			const rows = await prisma.user.findMany({
				select: { signatureUrl: true },
				where: { signatureUrl: { not: null } },
			});

			return rows.flatMap((row) => collectUserImageUrls(row));
		},
	},
	{
		label: "request.attachments",
		read: async (prisma) => {
			// No `where` narrowing the Json column. `attachments` defaults to `[]`
			// rather than to null, so `{ not: null }` would match every row anyway -
			// and a filter that looks like it is doing work while doing none is worse
			// than none. `collectRequestImageUrls` skips the empty ones.
			const rows = await prisma.request.findMany({ select: { attachments: true } });

			return rows.flatMap((row) => collectRequestImageUrls(row));
		},
	},
];

/**
 * How old an object must be before it can be considered garbage.
 *
 * 24 hours, set against how long a draft sits open rather than against anything
 * technical. An author who uploads an image on Friday and finishes the record on
 * Monday is the case this protects, and the cost of being generous is storage
 * measured in cents.
 */
const GRACE_HOURS = 24;

/** S3 accepts at most 1000 keys per delete request. */
const DELETE_BATCH_SIZE = 1000;

function requireEnv(name: string): string {
	const value = process.env[name];

	if (!value) {
		console.error(`Missing ${name}. Add it to .env or .env.local.`);
		process.exit(1);
	}

	return value;
}

/** Every referenced URL, as a Set of KEYS - the bucket listing gives back keys,
 *  so converting once here beats re-deriving one per object. */
async function collectReferencedKeys(prisma: PrismaClient, toKey: (url: string) => string | null): Promise<Set<string>> {
	const keys = new Set<string>();

	for (const source of REFERENCE_SOURCES) {
		const urls = await source.read(prisma);

		for (const url of urls) {
			const key = toKey(url);
			if (key) keys.add(key);
		}

		console.log(`  ${source.label}: ${urls.length} urls`);
	}

	return keys;
}

interface BucketObject {
	key: string;
	lastModified: Date;
	size: number;
}

/**
 * Every object in the bucket, following the continuation token.
 *
 * The pagination is not optional. S3 returns at most 1000 keys per call, and a
 * truncated listing here would make every unlisted object look unreferenced - so
 * a bucket with 1001 objects would have the last one deleted on the next
 * `--delete` run. Reading one page is the bug that only appears once the bucket
 * is big enough to matter.
 */
async function listAllObjects(s3: S3Client, bucket: string): Promise<BucketObject[]> {
	const objects: BucketObject[] = [];
	let token: string | undefined;

	do {
		let page: ListObjectsV2CommandOutput;

		try {
			page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
		} catch (error) {
			// The app's own credentials do not need ListBucket - only this script
			// does - so a working site fails here on its first sweep. A stack trace
			// is a bad answer to a question with a three-line fix.
			if (error instanceof Error && error.name === "AccessDenied") {
				console.error(
					[
						"",
						"This key cannot list the bucket.",
						"",
						"The app only ever needs Put/Get/Delete on individual objects; the sweep",
						"is the one thing that has to enumerate them. Add this statement to the",
						"IAM policy (IAM > Policies > your policy > Edit):",
						"",
						`  { "Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::${bucket}" }`,
						"",
						"Note the ARN has NO /* - ListBucket is a permission on the bucket itself,",
						"which is why the existing object-level statement does not cover it.",
						"",
					].join("\n"),
				);
				process.exit(1);
			}

			throw error;
		}

		for (const item of page.Contents ?? []) {
			if (item.Key && item.LastModified) {
				objects.push({ key: item.Key, lastModified: item.LastModified, size: item.Size ?? 0 });
			}
		}

		token = page.IsTruncated ? page.NextContinuationToken : undefined;
	} while (token);

	return objects;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main(): Promise<void> {
	const shouldDelete = process.argv.includes("--delete");

	// Fail closed. With no sources the reference set is empty, so EVERY object
	// past the grace period reads as garbage - a `--delete` here would empty the
	// bucket. This is the one check that must run before anything else.
	if (REFERENCE_SOURCES.length === 0) {
		console.error(
			[
				"",
				"No reference sources registered - refusing to run.",
				"",
				"REFERENCE_SOURCES in this file is empty, so no database row would count",
				"as referencing anything, and every object in the bucket would look like",
				"garbage. Running --delete in that state empties the bucket.",
				"",
				"Add one entry per model that stores an image URL. The docblock above",
				"REFERENCE_SOURCES has a worked example.",
				"",
			].join("\n"),
		);
		process.exit(1);
	}

	const region = requireEnv("APP_AWS_REGION");
	const bucket = requireEnv("APP_AWS_S3_BUCKET");
	const accessKeyId = requireEnv("APP_AWS_ACCESS_KEY_ID");
	const secretAccessKey = requireEnv("APP_AWS_SECRET_ACCESS_KEY");

	const s3 = new S3Client({ credentials: { accessKeyId, secretAccessKey }, region });
	const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: requireEnv("DATABASE_URL") }) });

	// Inlined rather than imported from `s3.server.ts`, which pulls in `@/env`
	// and expects Vite. The rule it encodes is the same: a URL outside this
	// bucket has no key here, so a stock-photo link is skipped rather than
	// counted.
	const virtualHosted = `${bucket}.s3.${region}.amazonaws.com`;
	const pathStyle = `s3.${region}.amazonaws.com`;

	const toKey = (url: string): string | null => {
		try {
			const parsed = new URL(url);

			if (parsed.hostname === virtualHosted) {
				return decodeURIComponent(parsed.pathname).replace(/^\//, "") || null;
			}

			if (parsed.hostname === pathStyle) {
				const withoutBucket = decodeURIComponent(parsed.pathname).replace(new RegExp(`^/${bucket}/`), "");
				return withoutBucket === parsed.pathname ? null : withoutBucket || null;
			}

			return null;
		} catch {
			return null;
		}
	};

	try {
		console.log(`Bucket   ${bucket} (${region})`);
		console.log(`Mode     ${shouldDelete ? "DELETE" : "dry run - pass --delete to actually remove"}\n`);

		console.log("Reading references:");
		const referenced = await collectReferencedKeys(prisma, toKey);
		const objects = await listAllObjects(s3, bucket);

		const cutoff = new Date(Date.now() - GRACE_HOURS * 60 * 60 * 1000);

		const orphans = objects.filter((object) => !referenced.has(object.key) && object.lastModified < cutoff);
		const spared = objects.filter((object) => !referenced.has(object.key) && object.lastModified >= cutoff);

		console.log(`\n${objects.length} objects in bucket`);
		console.log(`${referenced.size} referenced by a row`);
		console.log(`${spared.length} unreferenced but younger than ${GRACE_HOURS}h - left alone`);
		console.log(`${orphans.length} orphaned\n`);

		if (orphans.length === 0) {
			console.log("Nothing to do.");
			return;
		}

		const reclaimed = orphans.reduce((total, object) => total + object.size, 0);

		for (const object of orphans) {
			console.log(`  ${object.key}  ${formatBytes(object.size)}  ${object.lastModified.toISOString().slice(0, 10)}`);
		}

		console.log(`\n${formatBytes(reclaimed)} across ${orphans.length} objects.`);

		if (!shouldDelete) {
			console.log("Dry run - nothing deleted. Re-run with --delete to remove these.");
			return;
		}

		let deleted = 0;

		for (let i = 0; i < orphans.length; i += DELETE_BATCH_SIZE) {
			const batch = orphans.slice(i, i + DELETE_BATCH_SIZE);

			const result = await s3.send(
				new DeleteObjectsCommand({
					Bucket: bucket,
					Delete: { Objects: batch.map((object) => ({ Key: object.key })) },
				}),
			);

			deleted += result.Deleted?.length ?? 0;

			for (const error of result.Errors ?? []) {
				console.error(`  FAILED ${error.Key}: ${error.Message}`);
			}
		}

		console.log(`\nDeleted ${deleted} of ${orphans.length}.`);
	} finally {
		await prisma.$disconnect();
		s3.destroy();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
