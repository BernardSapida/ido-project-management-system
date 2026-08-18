import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { deleteImage, keyFromPublicUrl, presignImageUpload } from "@/lib/s3.server";
import {
	UPLOAD_ALL_ACCEPTED_TYPES,
	UPLOAD_FOLDER_ACCEPTED_TYPES,
	UPLOAD_FOLDERS,
	UPLOAD_MAX_BYTES,
} from "@/lib/upload-constraints";
import { adminProcedure, protectedProcedure } from "../init";

/**
 * Minting upload URLs, and removing what they wrote.
 *
 * ## Why `presign` is no longer admin-only
 *
 * It was `adminProcedure` while the only uploads were blog and event banners,
 * with a note saying that the day a USER uploads something this becomes a
 * deliberate edit rather than a gate that was already open. Spec 003 is that
 * day: every role has to upload a signature before it can do anything at all,
 * so an admin-only presign would lock the entire app behind a role nobody
 * signing up has.
 *
 * What holds it now is `protectedProcedure` plus the input schema: the caller is
 * an authenticated, ACTIVE account, `folder` is a closed enum rather than a
 * string that could carry `../`, and the content type is one of five image
 * formats and is signed INTO the URL, so S3 itself refuses a PUT that claims
 * anything else.
 *
 * ## Why `remove` stayed admin-only
 *
 * It takes a URL and deletes the object behind it, with no way to prove the
 * caller owns that object — opening it to every signed-in account would let any
 * user delete any other user's signature by guessing a key. The one non-admin
 * caller is the flush's own rollback in `use-deferred-upload.ts`, and it already
 * swallows failures (`Promise.allSettled`): a rollback that 403s leaves the
 * orphan for `npm run s3:sweep`, which is exactly what the sweep is for.
 */

const presignInputSchema = z
	.object({
		contentType: z.enum(UPLOAD_ALL_ACCEPTED_TYPES),
		fileName: z.string().min(1).max(255),
		/** Closed list — it becomes a path prefix. See `UPLOAD_FOLDERS`. */
		folder: z.enum(UPLOAD_FOLDERS),
		/**
		 * Checked before a URL is issued, not by S3.
		 *
		 * A presigned PUT cannot be capped by size without moving to a POST policy,
		 * so this refuses to MINT a URL for a file the browser has already measured
		 * as too big. A caller who lies about the number gets a URL and can push
		 * more through it — they are an authenticated admin, and the honest summary
		 * is that this stops accidents, not attacks. The bucket's cost ceiling is a
		 * billing alarm, not this line.
		 */
		size: z.number().int().positive().max(UPLOAD_MAX_BYTES),
	})
	/*
	 * The type has to be accepted BY THIS FOLDER, not merely accepted somewhere.
	 *
	 * Spec 005 opened the enum above to PDFs and Office documents so a requestor
	 * can attach a quotation. Without this line that also opens `signatures` to
	 * them — a caller asks for `application/pdf` into `signatures`, gets a signed
	 * URL, and the printed form carries a blank signature box nobody notices
	 * until it has been signed. `UPLOAD_FOLDER_ACCEPTED_TYPES` is the same map the
	 * drop zone checks, so the browser's refusal and this one cannot disagree.
	 */
	.refine(({ contentType, folder }) => UPLOAD_FOLDER_ACCEPTED_TYPES[folder].includes(contentType), {
		message: "That file type is not accepted for this kind of upload.",
		path: ["contentType"],
	});

export const uploadRouter = {
	/**
	 * Hand back a URL the browser can PUT one file to.
	 *
	 * Returns the PUBLIC url alongside it, because the caller needs to know
	 * where the file will end up before the upload finishes — that is the value
	 * that goes into the form field and then into `bannerUrl`.
	 */
	presign: protectedProcedure.input(presignInputSchema).mutation(async ({ input }) => {
		try {
			return await presignImageUpload({
				contentType: input.contentType,
				fileName: input.fileName,
				folder: input.folder,
			});
		} catch (error) {
			// `assertS3Config` throws with the variable names in it. That message is
			// for whoever is running the app, so it is worth passing through rather
			// than flattening to "Internal server error" in the browser console.
			throw new TRPCError({
				cause: error,
				code: "INTERNAL_SERVER_ERROR",
				message: error instanceof Error ? error.message : "Could not start the upload",
			});
		}
	}),

	/**
	 * Delete the object behind a public URL.
	 *
	 * Takes a URL rather than a key because that is what the rows hold. A URL
	 * that is not ours resolves to no key and returns `{ deleted: false }` — see
	 * `keyFromPublicUrl`. Not an error: a banner that was a `data:` URL or a
	 * stock photo link has nothing in the bucket to remove, and failing there
	 * would block deleting the blog itself.
	 */
	remove: adminProcedure.input(z.object({ url: z.string().min(1) })).mutation(async ({ input }) => {
		const key = keyFromPublicUrl(input.url);

		if (!key) return { deleted: false };

		await deleteImage(key);

		return { deleted: true };
	}),
} satisfies TRPCRouterRecord;
