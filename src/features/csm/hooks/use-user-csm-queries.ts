import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * The caller's own satisfaction record for one request, or `null`.
 *
 * `useQuery` rather than `useSuspenseQuery`: `null` is a legitimate answer here
 * - it is what "not yours" and "never approved" both come back as - and the page
 * turns it into a redirect. Thrown to a boundary a suspense query would make
 * that answer look like a failure, and the whole point of the null is that the
 * page treats it as an ordinary outcome.
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
export function useMyCsm(requestId: string) {
	const trpc = useTRPC();

	return useQuery({
		...trpc.csm.getMyCsm.queryOptions({ requestId }),
		refetchOnMount: "always",
	});
}
