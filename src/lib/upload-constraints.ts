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

/**
 * What a supporting DOCUMENT may be — the second half of the gate above, and
 * the reason it is a separate list rather than five more entries in it.
 *
 * A signature is a picture of ink and nothing else; a request attachment is a
 * quotation, a floor plan or a spreadsheet. Folding the two together would let
 * somebody upload a PDF as their signature, which prints as a blank box on the
 * form nobody notices until it is signed. `UPLOAD_FOLDER_ACCEPTED_TYPES` below
 * is what keeps them apart, per folder, on the server.
 *
 * The note above about bytes not being inspected applies here too, and harder:
 * these formats are opened by desktop applications rather than by an `<img>`.
 * The bucket is a different origin and objects are served with the stored
 * `Content-Type`, so a mislabelled file is a download that fails to open — but
 * putting the bucket behind the app's own domain would change that answer.
 */
export const UPLOAD_ACCEPTED_DOCUMENT_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"text/csv",
	"text/plain",
] as const;

/** Every type the presign endpoint will sign for, in any folder. */
export const UPLOAD_ALL_ACCEPTED_TYPES = [...UPLOAD_ACCEPTED_TYPES, ...UPLOAD_ACCEPTED_DOCUMENT_TYPES] as const;

export type UploadAcceptedType = (typeof UPLOAD_ALL_ACCEPTED_TYPES)[number];

/** The `accept` attribute for a file input, derived so the two never disagree. */
export const UPLOAD_ACCEPT_ATTRIBUTE = UPLOAD_ACCEPTED_TYPES.join(",");

/** The same, for a field that takes supporting documents as well as pictures. */
export const UPLOAD_ATTACHMENT_ACCEPT_ATTRIBUTE = UPLOAD_ALL_ACCEPTED_TYPES.join(",");

/**
 * How many files one field may hold.
 *
 * Ten, set against what a request is actually supported by — a quotation, a
 * plan, a few photographs of the thing that is broken. It is not a technical
 * limit: the flush sends three at a time and would happily send fifty, but a
 * fifty-file attachment list is a reviewer scrolling past the one document
 * they needed.
 */
export const UPLOAD_MAX_FILES = 10;

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
 *
 * `signatures` is the one this project actually uses (spec 003). It is separate
 * from `uploads` because a signature is the longest-lived object in the bucket -
 * it is stamped onto every approval a person has ever made - so it must never
 * share a prefix with anything a lifecycle rule might expire.
 *
 * `request-attachments` is spec 005's, and it is separate for the opposite
 * reason: it is the one prefix that grows without bound, one request at a time,
 * so it is the one a lifecycle rule or a cost question will ever be pointed at.
 */
export const UPLOAD_FOLDERS = ["uploads", "signatures", "request-attachments"] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

/**
 * Which types each folder will take.
 *
 * The gate is per FOLDER rather than global because the two uploads in this app
 * want different answers: a signature has to be an image (it is stamped onto a
 * printed form), and an attachment is whatever the requestor was given by the
 * supplier. One combined list would quietly allow a PDF signature.
 *
 * Read by `assertAcceptedUpload` in the browser and by `upload.presign` on the
 * server. The server copy is the gate; the browser copy is the message arriving
 * while the author is still looking at the drop zone.
 */
export const UPLOAD_FOLDER_ACCEPTED_TYPES: Record<UploadFolder, readonly string[]> = {
	"request-attachments": UPLOAD_ALL_ACCEPTED_TYPES,
	signatures: UPLOAD_ACCEPTED_TYPES,
	uploads: UPLOAD_ALL_ACCEPTED_TYPES,
};
