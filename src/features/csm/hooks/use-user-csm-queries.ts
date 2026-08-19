import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * The satisfaction record for one request, or `null`.
 *
 * Not "the caller's own" any more: since spec 018 the four review desks read it
 * too, and the record carries `isOwner` so the page knows which of the two
 * things to draw. Who may call it is `assertCanReadRequest`'s decision - see the
 * note on `csm.getForRequest`.
 *
 * `useQuery` rather than `useSuspenseQuery`: `null` is a legitimate answer here
 * - it is what a request that was never finally approved comes back as - and the
 * page turns it into a redirect. Thrown to a boundary a suspense query would
 * make that answer look like a failure, and the whole point of the null is that
 * the page treats it as an ordinary outcome.
 *
 * `refetchOnMount: "always"` because the key is the request id and nothing else,
 * so a cached record would survive a sign out and a sign in as somebody else -
 * the same reason `useRequestComments` sets it.
 *
 * Refetch-on-focus is left ON despite the page holding a form. What the form
 * binds to is its own `defaultValues`, not this query - nothing here is fed
 * through RHF's `values` - so a refetch cannot wipe a comment half typed. What
 * it CAN do is notice that the feedback was submitted in another tab, which is
 * the one thing this page should not be the last to hear about.
 */
export function useRequestCsm(requestId: string) {
	const trpc = useTRPC();

	return useQuery({
		...trpc.csm.getForRequest.queryOptions({ requestId }),
		refetchOnMount: "always",
	});
}
