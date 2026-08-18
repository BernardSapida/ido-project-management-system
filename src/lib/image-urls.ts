/**
 * Which images does a record use?
 *
 * Uploads are presigned, so a file is in S3 the moment the author drops it on a
 * form — before Save, and whether or not Save ever happens. That leaves two
 * kinds of rubbish in the bucket, and only one is reachable from the app:
 *
 *   1. **Abandoned uploads.** No row ever referenced them. Nothing in a delete
 *      handler can find these, because there is nothing to delete FROM.
 *   2. **Superseded references.** A record was deleted, or its image replaced.
 *
 * `scripts/s3-sweep.ts` handles both by treating the database as the source of
 * truth: anything in the bucket that no row references, and is older than the
 * grace period, is garbage.
 *
 * **That makes this file load-bearing.** A URL it fails to report is an image
 * the sweep deletes out from under a live record. Adding an image field
 * somewhere without adding it here is not a missed cleanup — it is data loss on
 * a timer, which is why the tests beside it are worth keeping.
 *
 * ## What this project has to add
 *
 * The two helpers below are generic. The per-model collectors are not, so they
 * live here as you add models. The shape to copy:
 *
 * ```ts
 * export function collectBlogImageUrls(record: {
 *   bannerUrl?: unknown; body?: unknown; carousel?: unknown;
 * }): string[] {
 *   const urls: string[] = [];
 *   if (isUsableUrl(record.bannerUrl)) urls.push(record.bannerUrl);
 *   // ...every column that can hold a URL, INCLUDING rich-text bodies
 *   urls.push(...collectRichTextImageUrls(record.body));
 *   return unique(urls);
 * }
 * ```
 *
 * Then register it in `REFERENCE_SOURCES` in `scripts/s3-sweep.ts`, which
 * refuses to delete anything until at least one is registered.
 *
 * Pure and dependency-free on purpose: the browser diffs with it at submit time
 * and the server deletes with it, so it may import neither React nor the AWS
 * SDK.
 */

/** A rich-text body can nest. This caps the walk rather than trusting a Json
 *  column - the schema is validated on the way in, but a hand-edited row is not,
 *  and a cycle there would hang the sweep rather than fail it. */
const MAX_RICH_TEXT_DEPTH = 100;

/** Anything that is not a usable URL string. Exported because every per-model
 *  collector needs the same test, and an empty image is `null` in one column
 *  shape and `""` in another. */
export function isUsableUrl(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

/** De-duplicate. An image used as both banner and body illustration is one
 *  object, and reporting it twice would have the sweep count it twice. */
export function unique(urls: string[]): string[] {
	return [...new Set(urls)];
}

/**
 * Image `src`s inside a rich-text document.
 *
 * The one people forget. Images dropped into `AppRichTextEditor` mid-sentence
 * live in a Json column, and nothing about the row's shape suggests it holds
 * URLs — so a collector written from the visible upload fields misses every one
 * of them, and the sweep then deletes the pictures inside published articles.
 *
 * Iterative rather than recursive. A document is author-controlled and arrives
 * from a Json column, so its depth is not knowable in advance, and a stack
 * overflow inside the sweep would abort a run partway through — after some
 * deletes and before others, which is the one outcome worth engineering away.
 *
 * Takes `unknown` because callers hand it a Prisma Json value, which is exactly
 * as trustworthy as whatever last wrote the row.
 */
export function collectRichTextImageUrls(body: unknown): string[] {
	const urls: string[] = [];
	const stack: Array<{ depth: number; node: unknown }> = [{ depth: 0, node: body }];

	while (stack.length > 0) {
		const { depth, node } = stack.pop() as { depth: number; node: unknown };

		if (depth > MAX_RICH_TEXT_DEPTH || node === null || typeof node !== "object") continue;

		if (Array.isArray(node)) {
			for (const child of node) stack.push({ depth: depth + 1, node: child });
			continue;
		}

		const record = node as { attrs?: unknown; content?: unknown; type?: unknown };

		if (record.type === "image" && record.attrs !== null && typeof record.attrs === "object") {
			const { src } = record.attrs as { src?: unknown };
			if (isUsableUrl(src)) urls.push(src);
		}

		if (record.content !== undefined) stack.push({ depth: depth + 1, node: record.content });
	}

	return urls;
}

/* -------------------------------------------------------------------------- */
/* Per-model collectors                                                        */

/**
 * The images a `User` row uses. Today that is the signature and nothing else.
 *
 * This one is not optional decoration - it is the entry that keeps the sweep
 * from deleting a live signature. A signature is uploaded ONCE, usually on the
 * day the account is set up, and is then referenced by every approval that
 * person has ever stamped. It is therefore always older than the grace period
 * and always looks like garbage to a sweep that cannot see this column.
 *
 * Registered in `REFERENCE_SOURCES` in `scripts/s3-sweep.ts`.
 */
export function collectUserImageUrls(user: { signatureUrl?: unknown }): string[] {
	return isUsableUrl(user.signatureUrl) ? [user.signatureUrl] : [];
}

/**
 * The files a `Request` row references — its attachments, and nothing else.
 *
 * `attachments` is a Json column, so this reads it as `unknown` and checks every
 * step: what Prisma hands back is whatever last wrote the row, and a hand-edited
 * one is not covered by the Zod schema that guards the write path. A `[]`
 * default and a malformed row must both come out as no URLs rather than as a
 * throw — this runs inside the sweep, and an exception there aborts a run
 * partway through, after some deletes and before others.
 *
 * Registered in `REFERENCE_SOURCES` in `scripts/s3-sweep.ts`. Without that entry
 * every attachment older than the grace period looks unreferenced, and a
 * `--delete` strips the quotations off requests that are still under review.
 */
export function collectRequestImageUrls(request: { attachments?: unknown }): string[] {
	if (!Array.isArray(request.attachments)) return [];

	return unique(
		request.attachments.flatMap((entry) => {
			if (entry === null || typeof entry !== "object") return [];

			const { url } = entry as { url?: unknown };

			return isUsableUrl(url) ? [url] : [];
		}),
	);
}

/**
 * What an edit added and what it stranded.
 *
 * Set arithmetic, and `removed` is deliberately "was there, is not now" rather
 * than "the author pressed the trash icon". They differ in the case that
 * matters: remove an image, then put the SAME one back before saving. The trash
 * press happened; the image is still in use. Diffing two states cannot get that
 * wrong, and a queue of button presses can.
 *
 * Feed the result to an update mutation as `removedImageUrls`, and have the
 * SERVER intersect it with the URLs actually on the stored row before deleting —
 * otherwise a crafted payload can name another record's image.
 */
export function diffImageUrls(before: string[], after: string[]): { added: string[]; removed: string[] } {
	const beforeSet = new Set(before);
	const afterSet = new Set(after);

	return {
		added: [...afterSet].filter((url) => !beforeSet.has(url)),
		removed: [...beforeSet].filter((url) => !afterSet.has(url)),
	};
}
