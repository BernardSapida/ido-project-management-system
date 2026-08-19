import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";

/**
 * S3, wrapped.
 *
 * Every AWS import in the project is in this file. The rest of the app deals in
 * a `key` and a `url` and never learns which bucket, region or provider is
 * behind them — which is what makes moving to Cloudflare R2 a change to the two
 * functions below rather than a change to every form.
 *
 * SERVER ONLY. It reads `APP_AWS_SECRET_ACCESS_KEY`. Nothing under `components/`,
 * `features/*\/components/` or `routes/` may import it; the browser reaches this
 * through the `upload` tRPC router and gets back a URL that expires.
 */

interface S3Config {
	accessKeyId: string;
	bucket: string;
	region: string;
	secretAccessKey: string;
}

/**
 * The four variables, or a readable failure.
 *
 * They are `.optional()` in `env.ts` so the app boots without an AWS account,
 * which moves the check here. Naming the ones actually missing matters because
 * the alternative — the SDK's own `Resolved credential object is not valid` —
 * is the same message whether the key is absent, empty or a typo'd variable
 * name.
 */
function assertS3Config(): S3Config {
	const { APP_AWS_ACCESS_KEY_ID, APP_AWS_REGION, APP_AWS_S3_BUCKET, APP_AWS_SECRET_ACCESS_KEY } = env;

	const missing = [
		["APP_AWS_REGION", APP_AWS_REGION],
		["APP_AWS_S3_BUCKET", APP_AWS_S3_BUCKET],
		["APP_AWS_ACCESS_KEY_ID", APP_AWS_ACCESS_KEY_ID],
		["APP_AWS_SECRET_ACCESS_KEY", APP_AWS_SECRET_ACCESS_KEY],
	]
		.filter(([, value]) => !value)
		.map(([name]) => name);

	if (missing.length > 0) {
		throw new Error(`Image uploads are not configured. Missing in .env: ${missing.join(", ")}`);
	}

	return {
		accessKeyId: APP_AWS_ACCESS_KEY_ID as string,
		bucket: APP_AWS_S3_BUCKET as string,
		region: APP_AWS_REGION as string,
		secretAccessKey: APP_AWS_SECRET_ACCESS_KEY as string,
	};
}

/**
 * One client for the process, built on first use.
 *
 * Not at module scope: this file is imported by the tRPC router, so a top-level
 * `new S3Client(assertS3Config())` would make a missing variable crash the
 * whole API rather than the one procedure that needs it.
 */
let client: S3Client | undefined;

function s3(config: S3Config): S3Client {
	if (!client) {
		client = new S3Client({
			credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
			region: config.region,
		});
	}

	return client;
}

/**
 * The canonical address of an object, and what goes on the row.
 *
 * NOT a URL a browser can open. The bucket is private - it answers 403 to an
 * anonymous GET - so this is an identifier that happens to look like a URL, and
 * `readUploadedObject` below is what actually serves the bytes, through
 * `/api/files/*`. Screens turn one into the other with `fileSrc` in
 * `lib/upload-urls.ts`.
 *
 * Kept in this shape rather than storing a bare key because every row in the
 * database already holds one, `keyFromPublicUrl` reads it back, and
 * `scripts/s3-sweep.ts` compares rows to bucket listings through both.
 */
function publicUrl(config: S3Config, key: string): string {
	return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

/**
 * A storage key for an uploaded file.
 *
 * Date-partitioned and randomly named, which settles three things at once. Two
 * people uploading `banner.jpg` get two objects rather than one overwriting the
 * other; the original name never reaches a path, so it cannot carry a `../` or
 * a character that has to be escaped by every reader; and the prefixes give a
 * lifecycle rule or a bulk delete something to select on later.
 *
 * The extension is kept only so a URL looks like a picture in a browser bar and
 * in logs. Nothing reads it — `Content-Type` is stored on the object.
 */
function keyFor(folder: string, fileName: string): string {
	const now = new Date();
	const yyyy = now.getUTCFullYear();
	const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

	const extension = fileName.toLowerCase().match(/\.([a-z0-9]{1,5})$/)?.[1] ?? "bin";

	return `${folder}/${yyyy}/${mm}/${crypto.randomUUID()}.${extension}`;
}

/** How long a minted upload URL stays usable. Long enough for a slow phone on
 *  hotel wifi, short enough that a URL copied out of devtools is dead by the
 *  time anybody pastes it. */
const UPLOAD_URL_TTL_SECONDS = 300;

export interface PresignedUpload {
	/** Stored on the row, and what `deleteImage` takes back. */
	key: string;
	/** Fetchable by anyone. This is the value that goes in `bannerUrl`. */
	url: string;
	/** PUT the bytes here, with the exact `Content-Type` that was signed. */
	uploadUrl: string;
}

/**
 * Mint a one-shot upload URL.
 *
 * The bytes go from the browser straight to S3 — they never pass through this
 * app. That is the whole reason for presigning: routing a 10 MB photo through
 * a serverless function would spend the request timeout on a copy, and the
 * function would need somewhere to buffer it.
 *
 * `contentType` is signed into the URL, so it is a promise the client has to
 * keep. Send different bytes-with-a-different-header and S3 returns 403.
 */
export async function presignImageUpload({
	contentType,
	fileName,
	folder,
}: {
	contentType: string;
	fileName: string;
	folder: string;
}): Promise<PresignedUpload> {
	const config = assertS3Config();
	const key = keyFor(folder, fileName);

	const uploadUrl = await getSignedUrl(
		s3(config),
		new PutObjectCommand({ Bucket: config.bucket, ContentType: contentType, Key: key }),
		{ expiresIn: UPLOAD_URL_TTL_SECONDS },
	);

	return { key, uploadUrl, url: publicUrl(config, key) };
}

/**
 * The key inside one of our own URLs, or `null`.
 *
 * Rows store the public URL rather than the key, because that is what a `<img
 * src>` needs and what every component already reads. Deleting therefore starts
 * from a URL and has to get back to a key.
 *
 * A URL pointing anywhere else returns `null` rather than throwing. Blog banners
 * predating S3 are `data:` URLs and Unsplash links, and asking to delete one of
 * those is not an error — there is simply no object to remove.
 */
export function keyFromPublicUrl(url: string): string | null {
	const config = assertS3Config();

	let parsed: URL;

	try {
		parsed = new URL(url);
	} catch {
		return null;
	}

	// Both addressing styles, because a bucket created today is virtual-hosted
	// but an older key or a copied console link can be path-style.
	const virtualHosted = `${config.bucket}.s3.${config.region}.amazonaws.com`;
	const pathStyle = `s3.${config.region}.amazonaws.com`;

	if (parsed.hostname === virtualHosted) {
		return decodeURIComponent(parsed.pathname).replace(/^\//, "") || null;
	}

	if (parsed.hostname === pathStyle) {
		const withoutBucket = decodeURIComponent(parsed.pathname).replace(new RegExp(`^/${config.bucket}/`), "");
		return withoutBucket === parsed.pathname ? null : withoutBucket || null;
	}

	return null;
}

/** One object's bytes and what it is. `null` when the bucket has no such key. */
export interface UploadedObject {
	body: ReadableStream;
	contentLength?: number;
	contentType?: string;
}

/**
 * Read one object with the SERVER's credentials.
 *
 * This is the half that replaces a public-read bucket policy. Objects are
 * private, so nothing anonymous can fetch a signature by guessing a key; the
 * app reads them here and serves them from its own origin, behind a session -
 * see `routes/api/files/$.ts`.
 *
 * A web stream rather than a buffer, because attachments run to 10 MB and this
 * runs in a serverless function: piping straight into the `Response` keeps a
 * download from being copied into memory first.
 *
 * A missing key comes back as `null` rather than throwing. It is the ordinary
 * case - a row pointing at an object the sweep has already collected - and it
 * is a 404, not a fault.
 */
export async function readUploadedObject(key: string): Promise<UploadedObject | null> {
	const config = assertS3Config();

	try {
		const result = await s3(config).send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));

		if (!result.Body) return null;

		return {
			body: result.Body.transformToWebStream(),
			contentLength: result.ContentLength,
			contentType: result.ContentType,
		};
	} catch (error) {
		// `NoSuchKey` is the documented name; `NotFound` comes back from a HEAD-like
		// path and from some S3-compatible providers. Anything else is a real fault
		// - credentials, region, a bucket that has gone - and has to surface.
		const name = error instanceof Error ? error.name : "";

		if (name === "NoSuchKey" || name === "NotFound") return null;

		throw error;
	}
}

/**
 * Remove one object. Succeeds whether or not it was there.
 *
 * S3 answers 204 for a delete of a key that does not exist, and that is the
 * behaviour we want rather than one to correct: deleting a blog twice, or
 * deleting one whose banner was already swapped, is not a failure the author
 * should see.
 */
export async function deleteImage(key: string): Promise<void> {
	const config = assertS3Config();

	await s3(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

/**
 * Delete a batch of images by URL, and never throw.
 *
 * This is called AFTER the database write has committed, and that ordering is
 * the whole design. A blog is deleted, then its pictures are; if S3 is
 * unreachable at that moment the post is still gone and some objects are
 * orphaned. The other order - pictures first - risks a post that survives with
 * its images missing, which is worse to look at and harder to fix.
 *
 * So the failure mode is deliberately "leaves rubbish", and the sweep is what
 * collects it. Nothing here is allowed to surface as a failed mutation: an
 * author who deleted a post does not want a red toast about a bucket.
 *
 * URLs that are not ours resolve to no key and are skipped - a banner that is a
 * stock photo link or a leftover `data:` URL has nothing to remove.
 */
export async function deleteImagesByUrl(urls: string[]): Promise<{ deleted: number; failed: number }> {
	if (urls.length === 0) return { deleted: 0, failed: 0 };

	let deleted = 0;
	let failed = 0;

	for (const url of urls) {
		try {
			const key = keyFromPublicUrl(url);
			if (!key) continue;

			await deleteImage(key);
			deleted++;
		} catch (error) {
			failed++;
			// Logged rather than thrown, and logged with the URL, because the only
			// way to notice a bucket that has started refusing deletes is a run of
			// these in the server output.
			console.error(`[s3] could not delete ${url}`, error);
		}
	}

	return { deleted, failed };
}
