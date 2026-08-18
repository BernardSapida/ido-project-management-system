import { useRequestById } from "@/features/request-form/hooks/use-user-request-queries";

/**
 * One request, for the IDO first review page (spec 010).
 *
 * A thin wrapper over `useRequestById` and deliberately nothing more. There is
 * one `request.getById` procedure and one cache entry per request, and a second
 * `useQuery` against the same key here would be a second set of options fighting
 * the first over the same data - the requestor's page turning refetch-on-focus on
 * while this one left it off is the kind of disagreement that shows up as a form
 * resetting on tab switch for reasons nobody can find.
 *
 * It exists so the review page does not import the requestor's hook by name.
 * That is not tidiness: the day this stage needs something the requestor's page
 * must not have, the change lands here rather than in a hook four other pages
 * read.
 *
 * Refetch-on-focus stays ON, unlike the edit page. Nothing on this page is bound
 * through RHF's `values` to the query - the approver panel seeds itself once from
 * `defaultValues` - so a refetch cannot wipe what a reviewer is typing, and a
 * request a colleague acted on while this tab sat behind another one is exactly
 * what the reviewer needs to come back to.
 */
export function useIdoReviewRequest(requestId: string) {
	return useRequestById(requestId);
}
