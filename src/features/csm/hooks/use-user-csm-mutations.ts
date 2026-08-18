import { AppToast, reason } from "@bernardsapida/web-ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, PartyPopper } from "lucide-react";
import { useCallback } from "react";
import type { CsmFormValues } from "@/features/csm/validations/schema/submit-csm.schema";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * The one write this feature has, and the last one in the request's life.
 *
 * ## Why the invalidation is awaited, and why it is this wide
 *
 * Submitting moves `masterStatus` as well as `completionStatus`, so four cached
 * answers are wrong the moment it commits: this page's own record, the request
 * detail behind it - where the banner has to disappear and the chip has to read
 * Completed - and both halves of the requestor's dashboard, whose list rows and
 * counters are keyed on the status that just changed.
 *
 * Awaited because the caller navigates on the resolve. Returning early would
 * land the requestor back on a detail page rendered from the pre-submit cache,
 * still showing the banner that took them to the form they have just filled in.
 *
 * ## Why it re-throws
 *
 * The form leaves the answers on screen and lets the requestor press again. A
 * swallowed error would resolve the submit, navigate away from a form that never
 * saved, and leave a request stuck at CSM_PENDING with a rating nobody has any
 * more. The toast explains; the throw is what keeps the words.
 */
export function useUserCsmMutations(requestId: string) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const submitMutation = useMutation(trpc.csm.submitCsm.mutationOptions());

	const submitCsm = useCallback(
		async (values: CsmFormValues) => {
			try {
				await submitMutation.mutateAsync({ ...values, requestId });
			} catch (error) {
				AppToast.error("Your feedback was not submitted.", {
					description: reason(error, "Nothing was saved — your answers are still on this page."),
					icon: CircleAlert,
				});

				throw error;
			}

			await Promise.all([
				queryClient.invalidateQueries({ queryKey: trpc.csm.getMyCsm.queryKey({ requestId }) }),
				queryClient.invalidateQueries({ queryKey: trpc.request.getById.queryKey({ id: requestId }) }),
				queryClient.invalidateQueries({ queryKey: trpc.request.myList.queryKey() }),
				queryClient.invalidateQueries({ queryKey: trpc.request.mySummary.queryKey() }),
			]);

			AppToast.success("Thank you. Your request is now complete.", {
				description: "The signed form stays available for as long as you need it.",
				icon: PartyPopper,
			});
		},
		[queryClient, requestId, submitMutation, trpc],
	);

	return { isSubmitting: submitMutation.isPending, submitCsm };
}
