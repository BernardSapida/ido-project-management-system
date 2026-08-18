import { useRequestById } from "@/features/request-form/hooks/use-user-request-queries";

/**
 * One request, for the Campus Director's FINAL approval (spec 014).
 *
 * A thin wrapper over `useRequestById` and deliberately nothing more, for the
 * reason `useDirectorReviewRequest` gives: there is one `request.getById`
 * procedure and one cache entry per request, and a second `useQuery` against the
 * same key would be a second set of options fighting the first over the same
 * data.
 *
 * It is the SECOND wrapper for the same role, beside the one their first
 * approval uses, and that is on purpose - the two stages are separate specs with
 * separate lifetimes, and the day one of them needs different query options the
 * change must not land on the other.
 *
 * Refetch-on-focus stays ON. Nothing on this page is bound through RHF's
 * `values` - the rejection note lives in a dialog that seeds itself once - so a
 * refetch cannot wipe what is being typed.
 */
export function useFinalDirectorApprovalRequest(requestId: string) {
	return useRequestById(requestId);
}
