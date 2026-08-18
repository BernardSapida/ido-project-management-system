import { AppToast, reason } from "@bernardsapida/web-ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, FileText, Send } from "lucide-react";
import { useCallback } from "react";
import { type RequestFormValues, toRequestInput } from "@/features/request-form/validations/schema/request.schema";
import { useTRPC } from "@/integrations/trpc/react";
import { pendingUrlsIn, withUploadedUrls } from "@/lib/pending-uploads";
import { useUploadingSubmit } from "@/lib/use-uploading-submit";

/**
 * What a save needs to know, and what it reports back on the way.
 *
 * `onSaved` fires the moment the ROW exists - after the create, before the
 * submit - and it is the reason this is a callback rather than a return value.
 * Submitting from the create page is two mutations, and if the second one fails
 * the first one has already committed: without this the page would have a draft
 * in the database, no id in its hands, and a second press would file a duplicate.
 */
interface SaveArgs {
	/**
	 * A chance to take the SAVE failure and show it somewhere better than a toast.
	 *
	 * Return `true` and the hook stays quiet about it. That exists for exactly one
	 * failure: the status changed under an open edit page (spec 007), where the
	 * answer is a banner naming the new status with a Reload beside it, and a
	 * toast reading "Please try again" is wrong advice - trying again cannot work
	 * until the page is reloaded.
	 *
	 * Consulted on the save half only. A failure in the SUBMIT half always toasts,
	 * because the fact it carries - the draft is already in the database - is not
	 * in the error and cannot be reconstructed by whoever handles it. That half is
	 * also unreachable for a status change: `saveDraft` checks the same statuses
	 * and runs first.
	 */
	onError?: (error: unknown) => boolean;
	onSaved?: (id: string) => void;
	/** Absent on the create page. Present once a draft exists - including a draft
	 *  this hook created a moment ago on a submit that then failed. */
	requestId?: string;
	values: RequestFormValues;
}

/**
 * Creating, saving and submitting a request, with the uploads in the right order.
 *
 * `useUploadingSubmit` owns that order - flush the parked files to S3, rewrite
 * every `blob:` URL in the values to its S3 URL, save, and only then release the
 * parked copies. Wrapping it here rather than in the form is the point: a caller
 * cannot get the sequence wrong, because there is no sequence exposed to get
 * wrong.
 *
 * Every path resolves with the request's id, so the caller can navigate to it.
 */
export function useUserRequestMutations() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const create = useMutation(trpc.request.create.mutationOptions());
	const saveDraft = useMutation(trpc.request.saveDraft.mutationOptions());
	const submit = useMutation(trpc.request.submit.mutationOptions());

	const {
		isSubmitting,
		pendingLabel,
		submit: withUploads,
	} = useUploadingSubmit<RequestFormValues>({
		apply: (values, uploaded) => ({ ...values, attachments: withUploadedUrls(values.attachments, uploaded) }),
		collect: (values) => pendingUrlsIn(values.attachments),
	});

	/**
	 * The list, the counters and every open detail page, after any write.
	 *
	 * `getById` is invalidated without an id - the key prefix, so every cached
	 * request refetches rather than only the one just written. That is what makes
	 * Submit-in-place on the detail page (spec 006) work at all: the page the user
	 * is standing on is the one whose status chip, stepper and action buttons all
	 * have to change, and it is reading from this cache.
	 *
	 * The staff queue (spec 009) belongs here too the day that procedure exists -
	 * a submitted request has to leave the requestor's pending count and appear in
	 * IDO's queue in the same beat.
	 */
	const invalidateLists = useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: trpc.request.getById.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.myList.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.mySummary.queryKey() }),
		]);
	}, [queryClient, trpc]);

	/** Create or update, whichever this request needs, and hand back its id. */
	const persist = useCallback(
		async ({ onSaved, requestId, values }: SaveArgs): Promise<string> => {
			let id = requestId;

			await withUploads(values, async (resolved) => {
				const input = toRequestInput(resolved);

				if (id) {
					await saveDraft.mutateAsync({ id, ...input });
				} else {
					id = (await create.mutateAsync(input)).id;
				}

				onSaved?.(id);
			});

			// Only unreachable if `withUploads` resolved without running its save,
			// which it does not do - but the alternative to this line is a non-null
			// assertion on the one value every caller navigates with.
			if (!id) throw new Error("The request was not saved.");

			return id;
		},
		[create, saveDraft, withUploads],
	);

	const saveRequestDraft = useCallback(
		async (args: SaveArgs): Promise<string> => {
			let id: string;

			try {
				id = await persist(args);
			} catch (error) {
				if (!args.onError?.(error)) {
					AppToast.error("Failed to save the request. Please try again.", {
						description: reason(error, "Nothing was saved — your answers are still on this page."),
						icon: CircleAlert,
					});
				}

				throw error;
			}

			await invalidateLists();

			AppToast.success("Draft saved.", {
				description: "You can finish it later from My Requests.",
				icon: FileText,
			});

			return id;
		},
		[invalidateLists, persist],
	);

	/**
	 * Save, then send.
	 *
	 * Two mutations, and the failure between them is the case worth designing for:
	 * the draft is already committed, so the error names the submit rather than the
	 * save, and `onSaved` has already given the caller the id to take the user to.
	 * Retrying re-enters through `persist` with that id, so the second attempt
	 * updates the draft instead of filing a second one.
	 */
	const submitRequest = useCallback(
		async (args: SaveArgs): Promise<string> => {
			let id: string;

			try {
				id = await persist(args);
			} catch (error) {
				if (!args.onError?.(error)) {
					AppToast.error("Failed to save the request. Please try again.", {
						description: reason(error, "Nothing was saved — your answers are still on this page."),
						icon: CircleAlert,
					});
				}

				throw error;
			}

			try {
				await submit.mutateAsync({ id });
			} catch (error) {
				// A different sentence from the one above, because a different thing
				// happened: the draft is in the database. Telling this user that
				// nothing was saved would have them fill the form in again and file it
				// twice.
				AppToast.error("Saved as a draft, but not submitted.", {
					description: reason(error, "Open the draft and press Submit Request again."),
					icon: CircleAlert,
				});

				await invalidateLists();

				throw error;
			}

			await invalidateLists();

			AppToast.success("Request submitted.", {
				description: "Your request has been sent to IDO for review.",
				icon: Send,
			});

			return id;
		},
		[invalidateLists, persist, submit],
	);

	return {
		/** True from the first uploaded byte to the server's answer, on either path. */
		isSaving: isSubmitting,
		/** "Uploading images... 40%" / "Saving..." — the label of the button being waited on. */
		pendingLabel,
		saveRequestDraft,
		submitRequest,
	};
}
