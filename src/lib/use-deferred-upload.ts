import type { UploadHandler } from "@bernardsapida/web-ui";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useTRPC } from "@/integrations/trpc/react";
import { isPendingUrl, readPending, registerPending, releasePending, type UploadedUrlMap } from "@/lib/pending-uploads";
import type { UploadFolder } from "@/lib/upload-constraints";
import { assertAcceptedUpload, useS3Uploader } from "@/lib/use-s3-upload";

/**
 * Picking a file, without uploading it.
 *
 * `AppFileUpload` asks for an `UploadHandler` and expects a URL back. This
 * satisfies that contract without touching the network: the file is parked in
 * `pending-uploads`, and the object URL standing in for it is what lands in the
 * form field. The bytes move later, in `useFlushPendingUploads`, when the
 * author presses Create or Save.
 *
 * The reason is the abandoned form. Uploading on drop meant every picture
 * somebody dropped and then thought better of - or dropped before closing the
 * tab - was already in the bucket with nothing pointing at it, and only the
 * nightly sweep to collect it. Now nothing reaches S3 until a save is on its
 * way.
 *
 * What this costs: the drop zone's progress bar is no longer a real upload. It
 * completes at once, because the "upload" is a `URL.createObjectURL` call. The
 * honest bar moved to the submit button, which is where the waiting now
 * happens - see `useFlushPendingUploads`.
 */
export function useDeferredUpload(folder: UploadFolder): UploadHandler {
	// Everything this hook parked, so unmounting the form can release it. Scoped
	// per hook rather than draining the whole registry, because the event form
	// runs two of these and one unmount must not free the other's files.
	const parked = useRef(new Set<string>());

	useEffect(() => {
		const urls = parked.current;

		return () => releasePending(urls);
	}, []);

	return useCallback<UploadHandler>(
		async (file, { onProgress }) => {
			// Checked HERE rather than only at submit, so a file the bucket would
			// refuse is refused while the author is still looking at the drop zone.
			// `useS3Uploader` checks again; that copy is the gate, this one is the
			// message arriving in time to be useful.
			assertAcceptedUpload(file, folder);

			const url = registerPending(file, folder);

			parked.current.add(url);

			// The row is complete the moment it is parked, and saying so is more
			// honest than animating a bar for work that has not started.
			onProgress(file.size);

			return { url };
		},
		[folder],
	);
}

/** How far along a flush is, in bytes across every file it is sending. Bytes
 *  rather than a file count because a flush is usually one big banner and a few
 *  small photos, and a counter that jumps 1/5 → 2/5 on the small ones reads as
 *  a stall on the big one. */
export interface FlushProgress {
	loadedBytes: number;
	totalBytes: number;
}

/** Three at a time. Enough to keep a carousel save from being a queue of
 *  round trips, few enough that a phone on hotel wifi is not sending eight
 *  10 MB files at once and timing all of them out. */
const FLUSH_CONCURRENCY = 3;

/**
 * Send everything the form is still holding, and say where it landed.
 *
 * Hand it every image URL in the form - real ones included. It picks out the
 * pending ones itself, so callers do not each need their own idea of what
 * counts as unsaved.
 *
 * ## If it fails partway
 *
 * The files that already went up are deleted again before the error is
 * rethrown. That is the whole point of doing this at submit: an author whose
 * connection drops on image four of five is left with nothing in the bucket
 * rather than three orphans. `upload.remove` is admin-gated and takes a URL, so
 * this is the one caller that can undo its own work precisely.
 *
 * Cleanup failures are swallowed. The save has already failed and that is the
 * error worth reporting; a second one about tidying up would bury it, and the
 * sweep collects whatever the cleanup missed.
 */
export function useFlushPendingUploads() {
	const trpc = useTRPC();
	const upload = useS3Uploader();
	const { mutateAsync: removeUploaded } = useMutation(trpc.upload.remove.mutationOptions());

	return useCallback(
		async (urls: readonly string[], onProgress?: (progress: FlushProgress) => void): Promise<UploadedUrlMap> => {
			// Deduped, because a form can legitimately hold the same object URL in
			// two places and uploading those bytes twice would store two objects
			// where the record references one.
			const pending = [...new Set(urls.filter(isPendingUrl))];

			if (pending.length === 0) return new Map();

			const files = pending.map((url) => {
				const entry = readPending(url);

				// Only reachable if a form value outlived the registry - a restored
				// draft, or a hook that released while its value was still on screen.
				// Loud, because the alternative is saving a URL that is dead the
				// moment the tab closes.
				if (!entry) throw new Error("That image is no longer available in this tab. Re-add it and save again.");

				return { ...entry, url };
			});

			const totalBytes = files.reduce((sum, { file }) => sum + file.size, 0);
			const loadedPerUrl = new Map<string, number>();
			const uploaded = new Map<string, string>();

			const report = () => {
				let loadedBytes = 0;

				for (const bytes of loadedPerUrl.values()) loadedBytes += bytes;

				onProgress?.({ loadedBytes, totalBytes });
			};

			report();

			// One controller for the whole flush. There is no cancel button on the
			// submit path today; this exists because `putWithProgress` requires a
			// signal, and giving every file the same one means a future cancel is
			// one `abort()` rather than a rewrite.
			const controller = new AbortController();

			// A hand-rolled pool rather than `Promise.all`, so a carousel of eight
			// does not open eight sockets. Each worker pulls the next index until
			// the list runs out.
			let next = 0;
			const worker = async () => {
				while (next < files.length) {
					const { file, folder, url } = files[next++];

					const result = await upload(file, folder, {
						onProgress: (loadedBytes) => {
							loadedPerUrl.set(url, loadedBytes);
							report();
						},
						signal: controller.signal,
					});

					uploaded.set(url, result.url);
				}
			};

			try {
				await Promise.all(Array.from({ length: Math.min(FLUSH_CONCURRENCY, files.length) }, worker));
			} catch (error) {
				controller.abort();

				await Promise.allSettled([...uploaded.values()].map((url) => removeUploaded({ url })));

				throw error;
			}

			return uploaded;
		},
		[removeUploaded, upload],
	);
}

/** Drop the parked copies of files that are now in S3. Called after a save the
 *  server accepted - before that the flush may still need to be retried, and a
 *  released file cannot be re-sent. */
export function releaseFlushed(uploaded: UploadedUrlMap): void {
	releasePending(uploaded.keys());
}
