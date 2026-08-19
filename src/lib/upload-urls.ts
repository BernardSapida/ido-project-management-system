/**
 * Turning a stored upload address into something a browser can open.
 *
 * The bucket is PRIVATE. `publicUrl` in `s3.server.ts` builds an S3-looking
 * address and every row holds one, but an anonymous GET against it answers 403
 * - which is the point, and why nothing may put one straight into an `<img>` or
 * a link. `fileSrc` maps it onto this app's own `/api/files/*`, which reads the
 * object with the server's credentials behind a session.
 *
 * Pure and dependency-free, like `image-urls.ts` beside it: the browser calls it
 * to render and the server route parses the same shape back, so neither may pull
 * in React or the AWS SDK.
 */

import { UPLOAD_FOLDERS } from "./upload-constraints";

/** Where the read route lives. One constant, because the route file and every
 *  caller have to agree and a literal in two places is a literal that drifts. */
export const FILE_ROUTE_PREFIX = "/api/files/";

/**
 * The storage key inside one of our own upload addresses, or `null`.
 *
 * Two tests, and the second is the one that matters. The host has to be an S3
 * one, and the first path segment has to be a folder we actually upload into -
 * so a row carrying somebody else's `amazonaws.com` link is left alone rather
 * than being handed to the read route as though we owned it.
 *
 * The bucket name is deliberately NOT checked. This runs in the browser, where
 * the bucket is not configured and should not be; the read route re-derives the
 * bucket from the server's own environment, so a key naming a bucket we do not
 * own resolves to nothing there.
 */
export function storageKeyOf(url: string): string | null {
	if (!url.startsWith("https://")) return null;

	let parsed: URL;

	try {
		parsed = new URL(url);
	} catch {
		return null;
	}

	if (!parsed.hostname.endsWith(".amazonaws.com")) return null;

	const key = decodeURIComponent(parsed.pathname).replace(/^\//, "");
	const folder = key.split("/")[0];

	return (UPLOAD_FOLDERS as readonly string[]).includes(folder) ? key : null;
}

/**
 * What to put in a `src` or an `href`.
 *
 * Everything that is not one of our own S3 addresses passes through untouched,
 * and all three of those cases are real: a `blob:` URL is a file the author has
 * picked but not saved, a `data:` URI is a seeded signature, and an `https:`
 * link to anywhere else is somebody's stock photo. Rewriting any of them would
 * break a preview that works today.
 */
export function fileSrc(url: string): string;
export function fileSrc(url: string | null | undefined): string | null;
export function fileSrc(url: string | null | undefined): string | null {
	if (!url) return null;

	const key = storageKeyOf(url);

	return key === null ? url : `${FILE_ROUTE_PREFIX}${key}`;
}
