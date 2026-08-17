import { useCallback, useState } from "react";
import type { UploadedUrlMap } from "@/lib/pending-uploads";
import { releaseFlushed, useFlushPendingUploads } from "@/lib/use-deferred-upload";

/**
 * Submit in two stages: send the pictures, then save the record.
 *
 * Every create and edit page for a form with uploads does the same four things
 * in the same order, and the order is the part worth centralising:
 *
 *   1. flush - the files parked in the browser go to S3
 *   2. rewrite - every object URL in the values becomes its S3 URL
 *   3. save - the mutation runs on values that name objects which EXIST
 *   4. release - the parked copies are freed, once the server has accepted
 *
 * Step 3 must not see an object URL and step 4 must not run before step 3
 * succeeds. Getting either backwards produces a record pointing at a URL that
 * dies with the tab, and `storedImageUrl` is the backstop for exactly that -
 * but a backstop that fires is still a failed save, so the sequence lives in
 * one place instead of four.
 *
 * @param collect Which URLs in these values are still files in the browser.
 * @param apply The same values with the uploaded ones swapped in.
 */
export function useUploadingSubmit<TValues>({
	apply,
	collect,
}: {
	apply: (values: TValues, uploaded: UploadedUrlMap) => TValues;
	collect: (values: TValues) => string[];
}) {
	const flush = useFlushPendingUploads();
	const [pendingLabel, setPendingLabel] = useState<string | undefined>(undefined);

	const submit = useCallback(
		async (values: TValues, save: (resolved: TValues) => Promise<void>) => {
			const pending = collect(values);

			try {
				let uploaded: UploadedUrlMap = new Map();

				if (pending.length > 0) {
					// A percentage rather than "2 of 5". The files in one save are wildly
					// uneven - a 9 MB banner beside three 200 KB headshots - so a count
					// would sit on 1/4 for most of the wait and then finish in a blink.
					setPendingLabel("Uploading images... 0%");

					uploaded = await flush(pending, ({ loadedBytes, totalBytes }) => {
						const percent = totalBytes === 0 ? 100 : Math.round((loadedBytes / totalBytes) * 100);

						setPendingLabel(`Uploading images... ${percent}%`);
					});
				}

				setPendingLabel("Saving...");

				await save(apply(values, uploaded));

				// Only now. Before the save returns, a retry still needs these bytes -
				// releasing on the way in would make the second attempt upload nothing.
				releaseFlushed(uploaded);

				/*
				 * And deliberately NOTHING in a catch here. A failed save leaves the
				 * uploaded objects in the bucket, and deleting them from the browser
				 * looks like the tidy thing to do until you write out the case that
				 * matters: a request that times out AFTER the write committed. The
				 * save looks failed from here and succeeded from the database, and a
				 * cleanup would strip the pictures off a post that is live.
				 *
				 * So the cleanup lives where the outcome is actually known. The
				 * mutations delete `addedImageUrls` when their own write throws, and
				 * `scripts/s3-sweep.ts` collects what a dropped connection stranded.
				 * Both are certain; this would be a guess.
				 */
			} finally {
				setPendingLabel(undefined);
			}
		},
		[apply, collect, flush],
	);

	return {
		/** True from the first byte to the server's answer. The mutation's own
		 *  `isPending` covers only the tail of that, so a form driven by it alone
		 *  looks idle for the whole upload. */
		isSubmitting: pendingLabel !== undefined,
		pendingLabel,
		submit,
	};
}
