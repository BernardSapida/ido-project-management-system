/**
 * What the uploader accepts, shared by the browser and the server.
 *
 * Its own file with no imports because both sides need it and neither may pull
 * in the other: `s3.server.ts` carries AWS credentials and `use-s3-upload.ts`
 * carries React. A constant duplicated in two places is a constant that drifts,
 * and the drift here is a picture the browser accepts and S3 then rejects.
 */

/**
 * 10 MB.
 *
 * Set against what a phone camera produces, not against what S3 can hold.
 * Raise it if the project genuinely stores originals; the number exists to stop
 * somebody putting a RAW file behind a thumbnail, not to be a technical limit.
 */
export const UPLOAD_MAX_BYTES = 10_000_000;

/**
 * The formats S3 will be handed.
 *
 * This list is the gate, not decoration. `presign` refuses anything absent from
 * it, and the type the browser declares is part of what gets SIGNED — so S3
 * itself rejects a PUT whose `Content-Type` header does not match the one the
 * URL was minted for. A caller cannot ask for `image/png` and then send
 * something claiming to be `text/html`.
 *
 * What it does NOT do is inspect bytes. Anyone who can reach `presign` is an
 * ADMIN, and the bucket is a different origin from the app, so a mislabelled
 * file is a broken image rather than a script with access to a session.
 *
 * Add `application/pdf` and friends here if the project uploads documents — but
 * read the note above first, because "a different origin" stops being true if
 * you ever put the bucket behind the app's own domain.
 */
export const UPLOAD_ACCEPTED_TYPES = ["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"] as const;

export type UploadAcceptedType = (typeof UPLOAD_ACCEPTED_TYPES)[number];

/** The `accept` attribute for a file input, derived so the two never disagree. */
export const UPLOAD_ACCEPT_ATTRIBUTE = UPLOAD_ACCEPTED_TYPES.join(",");

/**
 * Where an upload is allowed to land.
 *
 * A closed list, and this is the reason: the folder reaches `keyFor` and becomes
 * a path prefix. Left as a free string, a caller passes `../../`, or writes into
 * a prefix a lifecycle rule is about to empty.
 *
 * **Add one entry per feature that uploads** — `blogs`, `events`, `avatars`.
 * They are the unit a bulk cleanup or a per-section lifecycle rule selects on,
 * so "everything a speaker photo" should be `speakers/` and not a scan. The
 * single generic `uploads` below is a starting point, not a recommendation.
 */
export const UPLOAD_FOLDERS = ["uploads"] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];
