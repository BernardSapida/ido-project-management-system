import { AppToast, reason } from "@bernardsapida/web-ui";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CircleAlert, CircleCheckBig, Undo2, XCircle } from "lucide-react";
import { useCallback } from "react";
import { type IdoApproverFormValues, optionalText } from "@/features/ido-review/validations/schema/ido-approver.schema";
import { useTRPC } from "@/integrations/trpc/react";

/** The one sentence every failure on this page gets. Which of the four actions
 *  failed is already on screen - the reviewer pressed it - so the toast spends
 *  its title on what to do and its description on the server's own reason. */
const FAILURE_TITLE = "Failed to process the action. Please try again.";

/**
 * The four IDO outcomes, and the fact that only one of them may be in flight.
 *
 * ## Why every action re-throws
 *
 * Three of the four are fired from an `AppDialog`'s `onConfirm`, whose contract is
 * that a rejected promise leaves the dialog open with what was typed still in it.
 * Swallowing the error would close the dialog over a decision that never
 * committed, and the reviewer would go back to a queue still holding the request
 * with no idea why. The toast is the explanation; the throw is what keeps the
 * note on screen.
 *
 * ## Why `isAnyPending` is one flag and not four
 *
 * The outcomes are mutually exclusive and each is terminal for this stage. Two
 * presses on a slow connection is the one failure that cannot be undone by
 * anybody in the app, so all four controls disable together the moment any of
 * them starts - the server's status guard would refuse the second call, but a
 * button that fires a call it knows will be refused is not a guard, it is a race
 * the user gets to lose.
 *
 * ## Why the pending flags come from the CACHE and not from the mutations above
 *
 * Two components call this hook - the approver panel owns Recommend and the
 * actions card owns the other three - so each of them holds its own
 * `useMutation` objects. Reading `recommendMutation.isPending` for the flag would
 * therefore mean the panel never learns that a rejection is in flight, and the
 * lockout that is the entire point of `isAnyPending` would only ever lock the
 * component that started it. `useIsMutating` asks react-query's own store, which
 * is one store for both, so the flag is genuinely page-wide however many
 * components read it.
 */
export function useIdoReviewMutations(requestId: string) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const recommendMutation = useMutation(trpc.request.recommend.mutationOptions());
	const returnMutation = useMutation(trpc.request.returnToRequestor.mutationOptions());
	const rejectMutation = useMutation(trpc.request.rejectByIdo.mutationOptions());
	const deferMutation = useMutation(trpc.request.deferToNextYearPpmp.mutationOptions());

	const recommendCount = useIsMutating({ mutationKey: trpc.request.recommend.mutationKey() });
	const returnCount = useIsMutating({ mutationKey: trpc.request.returnToRequestor.mutationKey() });
	const rejectCount = useIsMutating({ mutationKey: trpc.request.rejectByIdo.mutationKey() });
	const deferCount = useIsMutating({ mutationKey: trpc.request.deferToNextYearPpmp.mutationKey() });

	/**
	 * Everything an IDO decision moves, in one await.
	 *
	 * Six keys, because one action changes six screens: this page's own read of the
	 * request, both halves of the staff queue - the table AND the counters above it,
	 * which have to move together or the desk reads a tracker that disagrees with
	 * its own rows - the narrow IDO inbox, and the requestor's list and tiles, since
	 * a returned request lands back on their desk in the same beat.
	 *
	 * `getById` is invalidated by prefix rather than by id: the page the reviewer is
	 * standing on is the one whose stepper, chips and controls all have to change,
	 * and it is reading from this cache.
	 *
	 * AWAITED, and every caller awaits it in turn. Resolving before the refetch
	 * lands would let a dialog close and the page re-render from the pre-action
	 * cache - the request briefly still actionable, its four buttons still live.
	 */
	const invalidateAfterAction = useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: trpc.request.getById.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.staffList.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.staffSummary.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.listSubmitted.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.myList.queryKey() }),
			queryClient.invalidateQueries({ queryKey: trpc.request.mySummary.queryKey() }),
		]);
	}, [queryClient, trpc]);

	const recommend = useCallback(
		async (values: IdoApproverFormValues) => {
			try {
				await recommendMutation.mutateAsync({
					finalTitle: values.finalTitle,
					id: requestId,
					// `""` would print as a blank line on the form where `null` prints
					// nothing at all. See `optionalText`.
					note: optionalText(values.note),
					reference: optionalText(values.reference),
				});
			} catch (error) {
				AppToast.error(FAILURE_TITLE, {
					description: reason(error, "Nothing was changed — the request is still at your desk."),
					icon: CircleAlert,
				});

				throw error;
			}

			await invalidateAfterAction();

			AppToast.success("Recommended. The request has moved to the next approver.", {
				description: "It is out of your queue and you can no longer change this decision.",
				icon: CircleCheckBig,
			});
		},
		[invalidateAfterAction, recommendMutation, requestId],
	);

	const returnToRequestor = useCallback(
		async (note: string) => {
			try {
				await returnMutation.mutateAsync({ id: requestId, note });
			} catch (error) {
				AppToast.error(FAILURE_TITLE, {
					description: reason(error, "Your note is still here — try again."),
					icon: CircleAlert,
				});

				throw error;
			}

			await invalidateAfterAction();

			AppToast.success("Request returned to the requestor.", {
				description: "They can edit it and resubmit under the same document number.",
				icon: Undo2,
			});
		},
		[invalidateAfterAction, requestId, returnMutation],
	);

	const rejectByIdo = useCallback(
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
			// green tick over a rejection reads as a confirmation that the reviewer
			// pressed the button they meant to - which is the one thing it cannot
			// confirm.
			AppToast.warning("Request rejected.", {
				description: "This is final. The requestor will have to file a new request.",
				icon: XCircle,
			});
		},
		[invalidateAfterAction, rejectMutation, requestId],
	);

	const deferToNextYearPpmp = useCallback(
		async (note?: string) => {
			try {
				await deferMutation.mutateAsync({ id: requestId, note: optionalText(note) });
			} catch (error) {
				AppToast.error(FAILURE_TITLE, {
					description: reason(error, "Nothing was changed — the request is still at your desk."),
					icon: CircleAlert,
				});

				throw error;
			}

			await invalidateAfterAction();

			AppToast.warning("Request deferred to next year's PPMP.", {
				description: "The request was valid; there is no budget for it this year.",
				icon: CalendarClock,
			});
		},
		[deferMutation, invalidateAfterAction, requestId],
	);

	return {
		deferToNextYearPpmp,
		/** True while ANY of the four is in flight, in ANY component on this page.
		 *  All four controls disable on it. */
		isAnyPending: recommendCount + returnCount + rejectCount + deferCount > 0,
		/** Only Recommend. The spinner belongs on the button that was pressed - a
		 *  pending state on the other three says the app is doing something the
		 *  reviewer did not ask for. The three dialogs get theirs from `AppDialog`,
		 *  which owns the promise its confirm button returned. */
		isRecommending: recommendCount > 0,
		recommend,
		rejectByIdo,
		returnToRequestor,
	};
}
