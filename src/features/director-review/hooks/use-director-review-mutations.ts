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
 * The director's two outcomes at the first approval.
 *
 * ## Why a refusal reads as "already moved on"
 *
 * This is the one stage of the workflow with a real race. A director may approve
 * while the budget officer is mid-approval, and whichever transaction commits
 * first wins - the loser's stage guard then refuses, correctly. `reason(error)`
 * puts the server's own sentence in the toast, and that sentence NAMES the stage
 * the request is now in, so what the director reads is where it went rather than
 * "something failed". The refetch that follows every action is what makes the
 * page agree with it a moment later.
 *
 * ## Why both re-throw
 *
 * Both are fired from an `AppDialog`'s `onConfirm`, whose contract is that a
 * rejected promise leaves the dialog open with what was typed still in it.
 * Swallowing the error would close the dialog over a decision that never
 * committed - and on the rejection that means losing the note as well as the
 * decision. The toast is the explanation; the throw is what keeps the note on
 * screen.
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
 * hook - the same reason `useBudgetReviewMutations` does it.
 */
export function useDirectorReviewMutations(requestId: string) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const approveMutation = useMutation(trpc.request.approveByDirector.mutationOptions());
	const rejectMutation = useMutation(trpc.request.rejectByDirector.mutationOptions());

	const approveCount = useIsMutating({ mutationKey: trpc.request.approveByDirector.mutationKey() });
	const rejectCount = useIsMutating({ mutationKey: trpc.request.rejectByDirector.mutationKey() });

	/**
	 * Everything a director's decision moves, in one await.
	 *
	 * `getById` because this page reads from that cache and every control on it
	 * has to change. Both halves of the staff queue - the table AND the counters
	 * above it, which have to move together or the desk reads a tracker that
	 * disagrees with its own rows. The chairperson's queue is the same
	 * `staffList` key, so an approval landing in their final-review queue costs
	 * nothing extra here.
	 *
	 * `myList` and `mySummary` are NOT optional at this stage, unlike the budget
	 * approval where they were carried for the rejection alone. Both director
	 * outcomes move `masterStatus` - to `UNDER_IDO_FINAL_REVIEW` or to
	 * `DIRECTOR_REJECTED` - which is the first time the requestor's own view has
	 * changed since they submitted. Nothing about the requestor changed, and
	 * their counters did.
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

	const approveByDirector = useCallback(async () => {
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

		AppToast.success("Approved. The request has moved to the IDO Chairperson.", {
			description: "Your signature is stamped on it and you can no longer change this decision.",
			icon: CircleCheckBig,
		});
	}, [approveMutation, invalidateAfterAction, requestId]);

	const rejectByDirector = useCallback(
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
				description: "This is final, and the requestor can now see that it stopped here.",
				icon: XCircle,
			});
		},
		[invalidateAfterAction, rejectMutation, requestId],
	);

	return {
		approveByDirector,
		/** True while EITHER action is in flight, in ANY component on this page.
		 *  Both controls disable on it. */
		isAnyPending: approveCount + rejectCount > 0,
		rejectByDirector,
	};
}
