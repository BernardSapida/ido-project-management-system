import { useRequestById } from "@/features/request-form/hooks/use-user-request-queries";

/**
 * One request, for the IDO Chairperson's final review (spec 013).
 *
 * A thin wrapper over `useRequestById` and deliberately nothing more, for the
 * reason `useIdoReviewRequest` gives: there is one `request.getById` procedure
 * and one cache entry per request, and a second `useQuery` against the same key
 * would be a second set of options fighting the first over the same data.
 *
 * It exists so this page does not import the requestor's hook by name. It is
 * also a SECOND wrapper for the same role - the chairperson's first-stage page
 * has its own - and that is on purpose: the two stages are separate specs with
 * separate lifetimes, and the day one of them needs different query options the
 * change must not land on the other.
 *
 * Refetch-on-focus stays ON. The override field is a form seeded by
 * `defaultValues` rather than bound through RHF's `values`, so a refetch cannot
 * reset a title the chairperson is halfway through rewriting - see the note in
 * `IdoFinalApproverForm`.
 */
export function useIdoFinalReviewRequest(requestId: string) {
	return useRequestById(requestId);
}
