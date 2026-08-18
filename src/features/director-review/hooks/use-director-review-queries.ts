import { useRequestById } from "@/features/request-form/hooks/use-user-request-queries";

/**
 * One request, for the Campus Director's first approval (spec 012).
 *
 * A thin wrapper over `useRequestById` and deliberately nothing more, for the
 * reason `useBudgetReviewRequest` gives: there is one `request.getById`
 * procedure and one cache entry per request, and a second `useQuery` against
 * the same key would be a second set of options fighting the first over the
 * same data.
 *
 * It exists so this page does not import the requestor's hook by name. The day
 * the director's desk needs something the requestor's page must not have, the
 * change lands here rather than in a hook five other pages read.
 *
 * Refetch-on-focus stays ON, and it matters more here than anywhere else in the
 * workflow. This is the one stage with a genuine two-desk race: the budget
 * officer may approve or reject while this tab sits behind another one, and in
 * one of those cases the controls on this page have to disappear without the
 * director having done anything. Nothing here is bound through RHF's `values` -
 * the rejection note lives in a dialog that seeds itself once - so a refetch
 * cannot wipe what is being typed.
 */
export function useDirectorReviewRequest(requestId: string) {
	return useRequestById(requestId);
}
