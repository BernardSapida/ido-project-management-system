import { AppToast, reason } from "@bernardsapida/web-ui";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheckBig, XCircle } from "lucide-react";
import { useCallback } from "react";
import { optionalText } from "@/features/ido-review/validations/schema/ido-approver.schema";
import { useTRPC } from "@/integrations/trpc/react";

/** The one sentence every failure on this page gets. Which of the two actions
 *  failed is already on screen - the chairperson pressed it - so the toast
 *  spends its title on what to do and its description on the server's own
 *  reason. */
const FAILURE_TITLE = "Failed to process the action. Please try again.";

/**
 * The chairperson's two outcomes at the final review.
 *
 * ## Why the override goes through `optionalText`
 *
 * `""` and `undefined` mean different things to `idoFinalApprove`: one is a
 * value to write and the other is "leave the column alone". RHF hands back `""`
 * for a field nobody typed in, so the flattening happens HERE, once, before the
 * request leaves the browser - the procedure flattens it again, because a
 * crafted call is not obliged to.
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
 * The two outcomes are mutually exclusive and both are terminal for this stage.
 * Approving stamps a signature onto a document nothing in the app can unstamp,
 * so both controls disable together the moment either starts.
 *
 * ## Why the pending flags come from the CACHE
 *
 * `useIsMutating` reads react-query's own store rather than the local mutation
 * objects, so the flag is genuinely page-wide however many components call this
 * hook - the same reason the three review hooks before it do.
 */
export function useIdoFinalReviewMutations(requestId: string) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const approveMutation = useMutation(trpc.request.idoFinalApprove.mutationOptions());
	const rejectMutation = useMutation(trpc.request.idoFinalReject.mutationOptions());

	const approveCount = useIsMutating({ mutationKey: trpc.request.idoFinalApprove.mutationKey() });
	const rejectCount = useIsMutating({ mutationKey: trpc.request.idoFinalReject.mutationKey() });

	/**
	 * Everything a final-review decision moves, in one await.
	 *
	 * `getById` because this page reads from that cache and every control on it
	 * has to change. Both halves of the staff queue - the table AND the counters
	 * above it, which have to move together or the desk reads a tracker that
	 * disagrees with its own rows. The director's final-approval queue is the same
	 * `staffList` key, so an approval landing there costs nothing extra.
	 *
	 * `myList` and `mySummary` because BOTH outcomes move `masterStatus` - to
	 * `UNDER_FINAL_DIRECTOR_REVIEW` or to `IDO_FINAL_REJECTED` - so the
	 * requestor's list and counters are stale the moment either commits, even
	 * though nothing about the requestor changed.
	 *
	 * `listSubmitted` is deliberately absent, unlike the first-stage hook. That
	 * key is the IDO inbox of requests waiting to be picked up, and nothing at
	 * this stage can put a request back into it.
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

	const idoFinalApprove = useCallback(
		async (finalTitle?: string) => {
			try {
				await approveMutation.mutateAsync({ finalTitle: optionalText(finalTitle), id: requestId });
			} catch (error) {
				AppToast.error(FAILURE_TITLE, {
					description: reason(error, "Nothing was changed — the request is still at your desk."),
					icon: CircleAlert,
				});

				throw error;
			}

			await invalidateAfterAction();

			AppToast.success("Approved and signed. The request has moved to the Campus Director.", {
				description: "Your signature is stamped on it and you can no longer change this decision.",
				icon: CircleCheckBig,
			});
		},
		[approveMutation, invalidateAfterAction, requestId],
	);

	const idoFinalReject = useCallback(
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
			// green tick over a rejection reads as a confirmation that the chairperson
			// pressed the button they meant to - the one thing it cannot confirm.
			AppToast.warning("Request rejected.", {
				description: "This is final, and the requestor can now see that it stopped here.",
				icon: XCircle,
			});
		},
		[invalidateAfterAction, rejectMutation, requestId],
	);

	return {
		idoFinalApprove,
		idoFinalReject,
		/** True while EITHER action is in flight, in ANY component on this page.
		 *  Both controls disable on it. */
		isAnyPending: approveCount + rejectCount > 0,
	};
}
