import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTRPC } from "@/integrations/trpc/react";
import {
	UPLOAD_ACCEPTED_TYPES,
	UPLOAD_FOLDER_ACCEPTED_TYPES,
	type UploadAcceptedType,
	type UploadFolder,
} from "@/lib/upload-constraints";

/**
 * The real uploader - the one that actually moves bytes.
 *
 * Two hops, and the reason for the first is that the browser must never hold an
 * AWS key:
 *
 *   1. ask the server for a URL that is signed, single-object and short-lived
 *   2. PUT the bytes to S3 directly
 *
 * The file never passes through this app. A 10 MB photo uploaded to a
 * serverless function would spend its request timeout being copied; here the
 * function only signs a string.
 *
 * NOT wired to the drop zones. The forms hand `AppFileUpload` a DEFERRED
 * handler (see `use-deferred-upload.ts`) that parks the file in the browser, and
 * this runs at submit for everything that was parked. Uploading on drop meant a
 * form the author abandoned still left objects in the bucket.
 *
 * A hook rather than a plain function because step 1 is a tRPC call and tRPC is
 * reached through context.
 */

/** Progress and cancellation, as the drop zone hands them over. Named here
 *  because `useS3Uploader` takes the same pair without being a `UploadHandler`
 *  itself - it needs the folder as an argument. */
export interface UploadProgress {
	onProgress: (loadedBytes: number) => void;
	signal: AbortSignal;
}

/**
 * `fetch` still cannot report upload progress in any browser - `ReadableStream`
 * request bodies do not help, and no `onprogress` equivalent exists. An honest
 * bar means `XMLHttpRequest`. Reaching for `fetch` here turns the row's
 * progress into a spinner that jumps 0 → 100.
 */
function putWithProgress(
	uploadUrl: string,
	file: File,
	contentType: string,
	{ onProgress, signal }: UploadProgress,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		const onAbort = () => xhr.abort();

		signal.addEventListener("abort", onAbort, { once: true });

		const settle = (finish: () => void) => {
			signal.removeEventListener("abort", onAbort);
			finish();
		};

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) onProgress(event.loaded);
		};

		xhr.onload = () => {
			settle(() => {
				if (xhr.status >= 200 && xhr.status < 300) {
					onProgress(file.size);
					resolve();
					return;
				}

				// S3 answers in XML and the body is the only place the reason lives.
				// 403 here is almost always the bucket's CORS rules or a clock skew,
				// and both are invisible without it.
				reject(new Error(`S3 rejected the upload (${xhr.status}). ${xhr.responseText.slice(0, 200)}`));
			});
		};

		xhr.onerror = () => {
			// A network-level failure has no status and no body. In practice this is
			// the bucket having no CORS rule for this origin: the browser blocks the
			// request before it is sent, so there is nothing to report but the guess.
			settle(() => reject(new Error("Could not reach S3. Check the bucket's CORS rules for this origin.")));
		};

		xhr.onabort = () => settle(() => reject(new Error("Upload cancelled")));

		xhr.open("PUT", uploadUrl);
		// Signed, so it has to match byte for byte. Setting anything else - or
		// letting the browser default it - is a 403 from S3.
		xhr.setRequestHeader("Content-Type", contentType);
		xhr.send(file);
	});
}

/**
 * Refuse a file the bucket will not take, in words about the file.
 *
 * Runs at PICK time in the deferred handler and again here at submit. The
 * duplication is the point: the author finds out that their `.bmp` is no good
 * while they are still looking at the drop zone, not after pressing Create.
 *
 * The FOLDER is an argument because the answer differs by destination -
 * `signatures` takes images only, `request-attachments` takes documents too -
 * and a single global list would let a PDF through as somebody's signature.
 * `UPLOAD_FOLDER_ACCEPTED_TYPES` is the one place that mapping is written down,
 * and `upload.presign` checks the same map server-side.
 *
 * Browsers derive `type` from the extension and occasionally give up, leaving
 * `""` - which is why the empty case gets its own sentence rather than being
 * reported as `"" is not an accepted format`.
 */
export function assertAcceptedUpload(
	file: File,
	folder: UploadFolder,
): asserts file is File & { type: UploadAcceptedType } {
	const accepted = UPLOAD_FOLDER_ACCEPTED_TYPES[folder];

	if (accepted.includes(file.type)) return;

	const isImageOnly = accepted === UPLOAD_ACCEPTED_TYPES;

	throw new Error(
		file.type
			? `${file.type} is not accepted here.${isImageOnly ? " Upload a JPG, PNG or WebP." : ""}`
			: `Could not tell what kind of file ${file.name} is. Try a JPG, PNG${isImageOnly ? " or WebP." : ", PDF or Word document."}`,
	);
}

/** Uploads one file to one folder. The folder is an argument rather than
 *  captured in a closure because the flush drains a mixed list - an event save
 *  sends a banner to `events/` and every speaker photo to `speakers/` through
 *  this one function. */
export type S3Uploader = (file: File, folder: UploadFolder, progress: UploadProgress) => Promise<{ url: string }>;

export function useS3Uploader(): S3Uploader {
	const trpc = useTRPC();
	const { mutateAsync } = useMutation(trpc.upload.presign.mutationOptions());

	return useCallback<S3Uploader>(
		async (file, folder, progress) => {
			assertAcceptedUpload(file, folder);

			const { uploadUrl, url } = await mutateAsync({
				contentType: file.type,
				fileName: file.name,
				folder,
				size: file.size,
			});

			await putWithProgress(uploadUrl, file, file.type, progress);

			return { url };
		},
		[mutateAsync],
	);
}
