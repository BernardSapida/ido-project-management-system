import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * One request, for the detail page and (spec 007) the edit page.
 *
 * `useQuery` rather than `useSuspenseQuery`, which is the one decision in this
 * file. Suspense throws its failures to the nearest error boundary, and the two
 * failures this query actually has - a `FORBIDDEN` on somebody else's id and a
 * `NOT_FOUND` on a mistyped one - are both things the reader has to be told
 * about ON the page, next to a way back. Handed to a boundary they replace the
 * whole route with a generic screen that has forgotten which request was being
 * asked for.
 *
 * `refetchOnMount: "always"` for the reason the dashboard's queries carry it:
 * the key is the request id and nothing else, so a cached copy survives a sign
 * out and a sign in as somebody else. It also means a request approved while the
 * tab sat open is not still showing yesterday's stage when the user comes back
 * to it.
 */
export function useRequestById(id: string) {
	const trpc = useTRPC();

	return useQuery({
		...trpc.request.getById.queryOptions({ id }),
		refetchOnMount: "always",
	});
}
