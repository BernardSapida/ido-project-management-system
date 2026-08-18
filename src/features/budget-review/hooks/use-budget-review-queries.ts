import { useRequestById } from "@/features/request-form/hooks/use-user-request-queries";

/**
 * One request, for the budget officer review page (spec 011).
 *
 * A thin wrapper over `useRequestById` and deliberately nothing more, for the
 * reason `useIdoReviewRequest` gives: there is one `request.getById` procedure
 * and one cache entry per request, and a second `useQuery` against the same key
 * would be a second set of options fighting the first over the same data.
 *
 * It exists so this page does not import the requestor's hook by name. The day
 * the budget desk needs something the requestor's page must not have, the change
 * lands here rather than in a hook five other pages read.
 *
 * Refetch-on-focus stays ON. Nothing on this page is bound through RHF's
 * `values` to the query - the rejection note lives in a dialog that seeds itself
 * once - so a refetch cannot wipe what the officer is typing. And a request the
 * Campus Director approved while this tab sat behind another one is precisely
 * what the officer needs to come back to: it is the one case where the controls
 * on this page have to disappear without them having done anything.
 */
export function useBudgetReviewRequest(requestId: string) {
	return useRequestById(requestId);
}
