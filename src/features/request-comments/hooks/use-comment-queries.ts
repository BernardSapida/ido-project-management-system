import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * One request's thread, keyed by the request.
 *
 * `useQuery` rather than `useSuspenseQuery`, for the reason `useRequestById`
 * gives: the two failures this has - `FORBIDDEN` on a request the caller cannot
 * open and `NOT_FOUND` on a mistyped id - are both things to be told about ON
 * the page. Thrown to a boundary they would replace the whole request with a
 * generic error screen, when the request itself loaded perfectly well and it is
 * only the conversation under it that could not.
 *
 * `refetchOnMount: "always"` because the key is the request id and nothing else,
 * so a cached thread survives a sign out and a sign in as somebody else.
 *
 * Refetch-on-focus is left at the default ON, including on the edit page where
 * `useRequestById` has it turned off. Nothing here binds to a form: a message
 * arriving while the tab sat behind another one is the whole point of coming
 * back to it, and the composer's draft is kept by `AppCommentSection` itself,
 * not by this query.
 */
export function useRequestComments(requestId: string) {
	const trpc = useTRPC();

	return useQuery({
		...trpc.comment.list.queryOptions({ requestId }),
		refetchOnMount: "always",
	});
}
