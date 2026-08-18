import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

interface RequestByIdOptions {
	/**
	 * Whether a tab regaining focus may refetch this request.
	 *
	 * `true` on a page that only READS the request - a status that changed while
	 * the tab sat behind another one is exactly what a reader wants to come back
	 * to. `false` on the edit page (spec 007), and that is not a preference: the
	 * form binds through RHF's `values`, so every refetch that comes back with
	 * different data RESETS the whole form. Half a paragraph typed while a
	 * reviewer touches the request in another tab would vanish between two
	 * keystrokes, with nothing on screen to say what happened.
	 */
	refetchOnWindowFocus?: boolean;
}

/**
 * One request, for the detail page (spec 006) and the edit page (spec 007).
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
 * to it. On mount only - see `refetchOnWindowFocus` above for the one page that
 * cannot afford the same query mid-edit.
 */
export function useRequestById(id: string, { refetchOnWindowFocus = true }: RequestByIdOptions = {}) {
	const trpc = useTRPC();

	return useQuery({
		...trpc.request.getById.queryOptions({ id }),
		refetchOnMount: "always",
		refetchOnWindowFocus,
	});
}
