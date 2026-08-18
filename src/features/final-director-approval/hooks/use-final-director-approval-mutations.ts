import { AppToast, reason } from "@bernardsapida/web-ui";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheckBig, XCircle } from "lucide-react";
import { useCallback } from "react";
import { useTRPC } from "@/integrations/trpc/react";

/** The one sentence every failure on this page gets. Which of the two actions
 *  failed is already on screen - the director pressed it - so the toast spends
 *  its title on what to do and its description on the server's own reason. */
const FAILURE_TITLE = "Failed to process the action. Please try again.";

/**
 * The director's two outcomes at the final approval.
 *
 * ## Why a refusal is worth reading here more than anywhere else
 *
 * `finalDirectorApprove` has one refusal the four stages before it do not: the
 * unique constraint on `Csm.requestId`, which the procedure translates into
 * "this request has already been approved". `reason(error)` is what puts that
 * sentence in front of the director instead of a generic failure, and the
 * refetch that follows every action is what makes the page agree with it a
 * moment later.
 *
 * ## Why both re-throw
 *
 * Both are fired from an `AppDialog`'s `onConfirm`, whose contract is that a
 * rejected promise leaves the dialog open with what was typed still in it.
 * Swallowing the error would close the dialog over a decision that never
 * committed - and on the rejection that means losing the note as well. The toast
 * is the explanation; the throw is what keeps the note on screen.
 *
 * ## Why `isAnyPending` is one flag
 *
 * The two outcomes are mutually exclusive and both are terminal for the whole
 * workflow, not merely for a stage. Approving stamps a signature onto a document
 * nothing in the app can unstamp, so both controls disable together the moment
 * either starts.
 *
 * ## Why the pending flags come from the CACHE
 *
 * `useIsMutating` reads react-query's own store rather than the local mutation
 * objects, so the flag is genuinely page-wide however many components call this
 * hook - the same reason the four review hooks before it do.
 */
export function useFinalDirectorApprovalMutations(requestId: string) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const approveMutation = useMutation(trpc.request.finalDirectorApprove.mutationOptions());
	const rejectMutation = useMutation(trpc.request.finalDirectorReject.mutationOptions());

	const approveCount = useIsMutating({ mutationKey: trpc.request.finalDirectorApprove.mutationKey() });
	const rejectCount = useIsMutating({ mutationKey: trpc.request.finalDirectorReject.mutationKey() });

	/**
	 * Everything the final approval moves, in one await.
	 *
	 * `getById` because this page reads from that cache and every control on it
	 * has to change - and because the REQUESTOR's detail page reads the same key,
	 * where the approval is what makes the CSM banner appear. Both halves of the
	 * staff queue, which have to move together or the desk reads a tracker that
	 * disagrees with its own rows. `myList` and `mySummary` because both outcomes
	 * move `masterStatus` to a terminal value, so the requestor's list and
	 * counters are stale the moment either commits.
	 *
	 * The spec also names `csm.getMyCsm`, `request.getForPdf` and
	 * `request.getSignaturesAsBase64`. None of those procedures exist yet - they
	 * ship with specs 015 and 016 - and a `queryKey()` for a procedure the router
	 * does not define will not compile. Add them here when those specs land;
	 * nothing else in this hook has to change.
	 *
	 * AWAITED, and every caller awaits it in turn. Resolving before the refetch
	 * lands would let the dialog close and the page re-render from the pre-action
	 * cache, with both buttons still live on a request that has already moved.
	 */
	const invalidateAfterAction = useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: trpc.request.getById.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.staffList.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.staffSummary.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.myList.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.mySummary.queryKey() }),
		]);
	}, [queryClient, trpc]);

	const finalDirectorApprove = useCallback(async () => {
		try {
			await approveMutation.mutateAsync({ id: requestId });
		} catch (error) {
			AppToast.error(FAILURE_TITLE, {
				description: reason(error, "Nothing was changed — the request is still at your desk."),
				icon: CircleAlert,
			});

			throw error;
		}

		await invalidateAfterAction();

		AppToast.success("Approved. The request is complete.", {
			description: "The signed form is released and the requestor has been asked for their feedback.",
			icon: CircleCheckBig,
		});
	}, [approveMutation, invalidateAfterAction, requestId]);

	const finalDirectorReject = useCallback(
		async (note: string) => {
			try {
				await rejectMutation.mutateAsync({ id: requestId, note });
			} catch (error) {
				AppToast.error(FAILURE_TITLE, {
					description: reason(error, "Your note is still here — try again."),
					icon: CircleAlert,
				});

				throw error;
			}

			await invalidateAfterAction();

			// `warning`, not `success`. Nothing good happened to the request, and a
			// green tick over a rejection reads as a confirmation that the director
			// pressed the button they meant to - the one thing it cannot confirm.
			AppToast.warning("Request rejected.", {
				description: "This is final, and the requestor can now see that it stopped at the last approval.",
				icon: XCircle,
			});
		},
		[invalidateAfterAction, rejectMutation, requestId],
	);

	return {
		finalDirectorApprove,
		finalDirectorReject,
		/** True while EITHER action is in flight, in ANY component on this page.
		 *  Both controls disable on it. */
		isAnyPending: approveCount + rejectCount > 0,
	};
}
