/**
 * Files that have been CHOSEN but not yet uploaded.
 *
 * The drop zones and the forms need to agree on one thing: a file the author
 * picked is held in the browser until they press Create or Save. Between those
 * two moments the form still has to show a preview, and a preview needs a
 * `src` - so the file is parked here under an object URL, and that URL travels
 * through the form in the same field a real S3 URL would occupy.
 *
 * At submit, `useFlushPendingUploads` trades every object URL in the form for
 * the S3 URL of the same bytes. Nothing else in the app should ever see one:
 * `blogInputSchema` and `eventInputSchema` both refuse a `blob:` src, so a flush
 * that was skipped fails at the boundary rather than storing a URL that dies
 * with the tab.
 *
 * Module-level rather than a ref because two hooks in the same form (the event
 * page has one uploader for the banner and another for speaker photos) register
 * into it and ONE flush drains it. Object URLs are unique per document, so
 * sharing one map across forms cannot collide.
 *
 * Pure and React-free so the forms, the hooks and the tests can all read it.
 */

import { z } from "zod";
import type { UploadFolder } from "./upload-constraints";

interface PendingUpload {
	file: File;
	/** Which prefix these bytes are destined for. Captured at pick time because
	 *  the flush sees a flat list of URLs and cannot tell a speaker photo from a
	 *  banner by looking at it. */
	folder: UploadFolder;
}

const registry = new Map<string, PendingUpload>();

/**
 * Is this URL a file still sitting in the browser?
 *
 * A prefix test, not a registry lookup. A `blob:` URL that is NOT registered is
 * a bug worth surfacing - see `takePending` - and answering "no" here would
 * quietly let it through to the server instead.
 */
export function isPendingUrl(url: string): boolean {
	return url.startsWith("blob:");
}

/**
 * A URL that is fit to be STORED.
 *
 * The one thing it rules out is an object URL. Those are how a picked file
 * travels through the form before submit, they are valid `string`s, and they
 * stop resolving the moment the tab closes - so without this line, a flush that
 * failed to run saves a record whose image is permanently blank and whose
 * failure is invisible until a reader loads the page.
 *
 * **Apply it to every field an image URL can reach**, on the SERVER's shape
 * rather than the form's - the form legitimately holds object URLs between pick
 * and submit, and only the stored shape must not:
 *
 * ```ts
 * export const blogInputSchema = z.object({
 *   bannerUrl: storedImageUrl.nullable(),
 *   carousel: z.array(z.object({ alt: z.string(), src: storedImageUrl.min(1) })),
 * });
 * ```
 *
 * It is the backstop, not the mechanism - `useUploadingSubmit` is what makes
 * the flush happen. A backstop that fires is still a failed save; it just fails
 * at the boundary with a sentence the author can act on, rather than silently.
 */
export const storedImageUrl = z
	.string()
	.refine((url) => !isPendingUrl(url), { message: "That image was never uploaded. Re-add it and save again." });

/**
 * Park a file and get back the URL that stands in for it.
 *
 * The object URL is created here rather than by the caller so that creation and
 * registration cannot drift apart - an unregistered object URL is a preview
 * that shows and then fails to save.
 */
export function registerPending(file: File, folder: UploadFolder): string {
	const url = URL.createObjectURL(file);

	registry.set(url, { file, folder });

	return url;
}

/**
 * The file behind a pending URL, or `undefined` if there is none.
 *
 * Does NOT remove it. The flush can be retried after a failed save, and a
 * lookup that consumed its entry would make the second attempt upload nothing
 * and save a URL to a file that was never sent.
 */
export function readPending(url: string): PendingUpload | undefined {
	return registry.get(url);
}

/**
 * Forget these URLs and release their bytes.
 *
 * Called when a form unmounts, and after a flush the save accepted. Skipping it
 * keeps every file the author ever dropped alive for the lifetime of the tab -
 * ten banners at 10 MB is 100 MB of retained memory on a page that has already
 * navigated away.
 */
export function releasePending(urls: Iterable<string>): void {
	for (const url of urls) {
		if (!registry.delete(url)) continue;

		URL.revokeObjectURL(url);
	}
}

/* -------------------------------------------------------------------------- */
/* Reading and rewriting the form's upload fields                             */

/** Object URL → the S3 URL holding the same bytes, as a flush hands it back.
 *  Declared here rather than beside the hook so the schema files can rewrite
 *  with it without importing React. */
export type UploadedUrlMap = ReadonlyMap<string, string>;

/** The shape both `UploadedFile` and `UploadedFileValue` share. Structural on
 *  purpose: this file may not import the schemas that import it. */
interface HasUrl {
	url?: string;
}

/** Which of these rows are still files in the browser. */
export function pendingUrlsIn(files: readonly HasUrl[]): string[] {
	return files.flatMap((file) => (file.url !== undefined && isPendingUrl(file.url) ? [file.url] : []));
}

/**
 * The same rows, with every uploaded object URL swapped for its S3 URL.
 *
 * A URL with no entry in the map is left exactly as it is - that is every image
 * the record already had, which the flush never touched.
 */
export function withUploadedUrls<T extends HasUrl>(files: readonly T[], uploaded: UploadedUrlMap): T[] {
	return files.map((file) => {
		const url = file.url === undefined ? undefined : uploaded.get(file.url);

		return url === undefined ? file : { ...file, url };
	});
}
