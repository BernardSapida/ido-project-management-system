import { AppToast, reason } from "@bernardsapida/web-ui";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheckBig, XCircle } from "lucide-react";
import { useCallback } from "react";
import { useTRPC } from "@/integrations/trpc/react";

/** The one sentence every failure on this page gets. Which of the two actions
 *  failed is already on screen - the officer pressed it - so the toast spends its
 *  title on what to do and its description on the server's own reason. */
const FAILURE_TITLE = "Failed to process the action. Please try again.";

/**
 * The budget desk's two outcomes, and the fact that only one of them may be in
 * flight.
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
 * Approve stamps a signature onto a document and nothing in the app can unstamp
 * it, so both controls disable together the moment either starts. The server's
 * stage guard would refuse the second call, but a button that fires a call it
 * knows will be refused is not a guard, it is a race the user gets to lose.
 *
 * ## Why the pending flags come from the CACHE
 *
 * `useIsMutating` reads react-query's own store rather than the local mutation
 * objects, so the flag is genuinely page-wide however many components call this
 * hook - the same reason `useIdoReviewMutations` does it.
 */
export function useBudgetReviewMutations(requestId: string) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const approveMutation = useMutation(trpc.request.approveBudget.mutationOptions());
	const rejectMutation = useMutation(trpc.request.rejectBudget.mutationOptions());

	const approveCount = useIsMutating({ mutationKey: trpc.request.approveBudget.mutationKey() });
	const rejectCount = useIsMutating({ mutationKey: trpc.request.rejectBudget.mutationKey() });

	/**
	 * Everything a budget decision moves, in one await.
	 *
	 * `getById` because this page is reading from that cache and every control on
	 * it has to change. Both halves of the staff queue - the table AND the counters
	 * above it, which have to move together or the desk reads a tracker that
	 * disagrees with its own rows.
	 *
	 * `myList` and `mySummary` too, and an APPROVAL changes neither: it leaves
	 * `masterStatus` alone on purpose, so nothing in the requestor's view moves.
	 * They are here for the rejection, which sets `masterStatus` and does land on
	 * the requestor's desk - and invalidating a key that happens not to have
	 * changed costs a refetch, while missing one shows a stale status.
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

	const approveBudget = useCallback(async () => {
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

		AppToast.success("Budget approved. The request has moved to the Campus Director.", {
			description: "Your signature is stamped on it and you can no longer change this decision.",
			icon: CircleCheckBig,
		});
	}, [approveMutation, invalidateAfterAction, requestId]);

	const rejectBudget = useCallback(
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
			// green tick over a rejection reads as a confirmation that the officer
			// pressed the button they meant to - the one thing it cannot confirm.
			AppToast.warning("Request rejected.", {
				description: "This is final, and the requestor can now see that it stopped here.",
				icon: XCircle,
			});
		},
		[invalidateAfterAction, rejectMutation, requestId],
	);

	return {
		approveBudget,
		/** True while EITHER action is in flight, in ANY component on this page.
		 *  Both controls disable on it. */
		isAnyPending: approveCount + rejectCount > 0,
		rejectBudget,
	};
}
