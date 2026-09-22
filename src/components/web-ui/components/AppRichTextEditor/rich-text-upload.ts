import type { UploadHandler } from "../AppFileUpload";
import { ALLOWED_IMAGE_PROTOCOLS } from "./rich-text-document";

/**
 * Uploading an image from the editor.
 *
 * ## It reuses AppFileUpload's contract rather than inventing one
 *
 * `UploadHandler` is already the shape this app uploads with, and `xhrUpload`
 * already implements it against an endpoint - fetch still cannot report upload
 * progress in any browser, which is why that helper exists. A second upload
 * contract here would mean two places to wire an endpoint and two ways for a
 * progress bar to be wrong.
 *
 * ## The editor does not know where files go
 *
 * It takes a handler or it takes nothing. With one, the image dialog grows a
 * file picker and the editor accepts drops and pastes; without one, images are
 * added by address and the drop zone never appears - which is the honest state
 * for a project that has not built storage yet, rather than a button that fails
 * when pressed.
 */

/** How large a file may be before it is refused at the door. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** What a browser can actually display, and what an endpoint should expect. */
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

export interface ImageUploadRejection {
	reason: string;
}

/**
 * The checks that must happen BEFORE bytes leave the browser.
 *
 * Not because the server can be trusted to skip them - it cannot, and it must
 * repeat every one - but because a rejection after a 5MB upload wastes the
 * user's connection and arrives a minute after the mistake.
 */
export function rejectImage(file: File): ImageUploadRejection | null {
	if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
		return { reason: `${file.name} is not an image this editor can show.` };
	}
	if (file.size > MAX_IMAGE_BYTES) {
		return {
			reason: `${file.name} is ${Math.round(file.size / 1024 / 1024)}MB, over the ${Math.round(
				MAX_IMAGE_BYTES / 1024 / 1024,
			)}MB limit.`,
		};
	}
	return null;
}

/**
 * Runs a handler and returns a URL the schema will accept.
 *
 * A handler that resolves with no URL, or with a `blob:` or `data:` one, has
 * not produced something storable - and inserting it anyway gives the author an
 * image that works until they reload. Failing here is the honest outcome.
 */
export async function uploadImageFile(file: File, upload: UploadHandler, signal: AbortSignal): Promise<string> {
	const result = await upload(file, { onProgress: () => {}, signal });
	const url = result.url;

	if (!url || !isStorableUrl(url)) {
		throw new Error("The upload finished but returned no usable address.");
	}
	return url;
}

function isStorableUrl(url: string): boolean {
	try {
		const protocol = new URL(url, window.location.origin).protocol.replace(":", "");
		return (ALLOWED_IMAGE_PROTOCOLS as readonly string[]).includes(protocol);
	} catch {
		return false;
	}
}
