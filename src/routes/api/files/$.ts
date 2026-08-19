import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/features/auth/utils/better-auth";
import { readUploadedObject } from "@/lib/s3.server";
import { UPLOAD_ACCEPTED_TYPES, UPLOAD_ALL_ACCEPTED_TYPES, UPLOAD_FOLDERS } from "@/lib/upload-constraints";

/**
 * Serve one uploaded object, from this app's origin, behind a session.
 *
 * ## Why this exists at all
 *
 * `s3.server.ts` used to build its addresses "given the public-read bucket
 * policy". There is no such policy - the bucket answers 403 to an anonymous GET
 * - so every saved signature was a broken image on the profile, a broken image
 * on the four review pages, and, worst of all, a SILENTLY blank cell on the
 * printed form: `signatureAsDataUri` resolves every failure to `null` by
 * design, so the document printed without the signature and said nothing.
 *
 * The two ways out were opening the bucket and this. A signature is a person's
 * handwriting reused on every approval they make; a URL that anybody who has
 * ever seen it can hand to anybody else is the wrong shape for that, so the
 * bucket stays private and the bytes come through here.
 *
 * ## What guards it
 *
 * 1. **A session.** Any signed-in account, not the object's owner - the same
 *    answer the app already gives, since a reviewer has to see the requestor's
 *    signature and a requestor sees the approvers' on their own form. It is a
 *    real gate against the open internet, not an ownership check, and it should
 *    become one if this ever serves something only one person may read.
 * 2. **A folder prefix we own.** The key comes from the URL, so without this a
 *    caller could ask for any object in the bucket by name.
 * 3. **The stored content type, if we accept it.** Anything else is served as
 *    `application/octet-stream` rather than trusted.
 *
 * ## The same-origin caveat, which is new
 *
 * `upload-constraints.ts` says a mislabelled file is harmless because "the
 * bucket is a different origin", and warns that putting it behind the app's
 * domain changes that answer. This route IS that change, so it undoes the
 * assumption deliberately: `nosniff` stops the browser second-guessing the
 * type, a `sandbox` CSP means an HTML or SVG body cannot run script or reach a
 * session cookie, and documents are sent as attachments rather than rendered
 * inline. Images stay inline because an `<img>` is the whole point.
 */

/** Types safe to hand a browser inline. Images only - a PDF viewer is a script
 *  host, and a document that opens in Word has no business rendering in a tab. */
const INLINE_TYPES: readonly string[] = UPLOAD_ACCEPTED_TYPES;

/**
 * A minute in the browser, a year in nothing else.
 *
 * `private` because the response is session-gated and a shared cache holding it
 * would serve a signature to whoever asked next. The objects themselves are
 * immutable - keys are random and a replacement is a new key - so the browser
 * may keep one for as long as it likes; `immutable` is what stops a re-render
 * of the review page re-fetching four signatures.
 */
const CACHE_CONTROL = "private, max-age=31536000, immutable";

function deny(status: number, message: string): Response {
	return new Response(message, {
		headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
		status,
	});
}

export const Route = createFileRoute("/api/files/$")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const session = await auth.api.getSession({ headers: request.headers });

				if (!session) return deny(401, "Sign in to view this file.");

				// The splat is everything after `/api/files/`, which is exactly the
				// storage key - see `fileSrc` in `lib/upload-urls.ts`.
				const key = decodeURIComponent(params._splat ?? "");
				const folder = key.split("/")[0];

				if (!key || !(UPLOAD_FOLDERS as readonly string[]).includes(folder)) {
					return deny(404, "No such file.");
				}

				let object: Awaited<ReturnType<typeof readUploadedObject>>;

				try {
					object = await readUploadedObject(key);
				} catch (error) {
					// `assertS3Config` names the variables that are missing, and that
					// sentence is for whoever is running the app. It never reaches a
					// user: this is a 500 they see as a broken image either way.
					console.error(`[files] could not read ${key}`, error);

					return deny(500, "That file could not be read.");
				}

				if (!object) return deny(404, "No such file.");

				const stored = object.contentType ?? "";
				const contentType = (UPLOAD_ALL_ACCEPTED_TYPES as readonly string[]).includes(stored)
					? stored
					: "application/octet-stream";

				const headers = new Headers({
					"Cache-Control": CACHE_CONTROL,
					// An HTML or SVG body that somehow got stored cannot run script,
					// reach a cookie, or call home. See the note above.
					"Content-Security-Policy": "default-src 'none'; sandbox",
					"Content-Type": contentType,
					"X-Content-Type-Options": "nosniff",
				});

				if (!INLINE_TYPES.includes(contentType)) {
					// The stored name is gone - keys are random - so the browser falls
					// back to the last path segment, which is the same thing every S3
					// download already did.
					headers.set("Content-Disposition", "attachment");
				}

				if (object.contentLength !== undefined) {
					headers.set("Content-Length", String(object.contentLength));
				}

				return new Response(object.body, { headers });
			},
		},
	},
});
