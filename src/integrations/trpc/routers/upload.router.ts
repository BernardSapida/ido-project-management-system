import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { deleteImage, keyFromPublicUrl, presignImageUpload } from "@/lib/s3.server";
import { UPLOAD_ACCEPTED_TYPES, UPLOAD_FOLDERS, UPLOAD_MAX_BYTES } from "@/lib/upload-constraints";
import { adminProcedure } from "../init";

/**
 * Minting upload URLs, and removing what they wrote.
 *
 * `adminProcedure`, both of them, because an upload URL is a write to a bucket
 * that anyone on the internet can then read — and today the only things being
 * uploaded are blog banners, event banners and speaker photos, all of which are
 * behind the admin area already. The day a USER uploads an avatar, this becomes
 * `protectedProcedure` with a `folder` the caller does not choose, and that
 * should be a deliberate edit rather than a gate that was already open.
 */

const presignInputSchema = z.object({
	contentType: z.enum(UPLOAD_ACCEPTED_TYPES),
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
});

export const uploadRouter = {
	/**
	 * Hand back a URL the browser can PUT one file to.
	 *
	 * Returns the PUBLIC url alongside it, because the caller needs to know
	 * where the file will end up before the upload finishes — that is the value
	 * that goes into the form field and then into `bannerUrl`.
	 */
	presign: adminProcedure.input(presignInputSchema).mutation(async ({ input }) => {
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
