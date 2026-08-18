import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * The two reads the printed form is drawn from.
 *
 * Two queries rather than one, and the split is the point: `getForPdf` is a row
 * read and answers in milliseconds, while `getSignaturesAsBase64` fetches up to
 * three images out of S3 and inlines them. Merged, the whole document would wait
 * on the slowest picture. Split, the page can name the document, decide whether
 * to show the not-yet-approved line, and enable its controls while the images
 * are still moving.
 *
 * Both are `useQuery` rather than `useSuspenseQuery`, for the reason
 * `useRequestById` gives: the failure that matters here is a FORBIDDEN on
 * somebody else's request, and that has to be shown ON the page rather than
 * thrown to a boundary that has forgotten which request was asked for.
 */

/** The printable projection. `refetchOnMount: "always"` because the key is the
 *  request id alone, so a cached copy would otherwise survive a sign out and a
 *  sign in as somebody else - and because a request approved while this tab sat
 *  open should come back with its signatures, not without them. */
export function useRequestForPdf(id: string) {
	const trpc = useTRPC();

	return useQuery({
		...trpc.request.getForPdf.queryOptions({ id }),
		refetchOnMount: "always",
	});
}

/**
 * The three signature images, inlined by the server.
 *
 * `enabled` is what keeps a forbidden request from paying for two refusals: the
 * page passes `Boolean(request)`, so the S3 fetches only start once the access
 * check on `getForPdf` has already come back clean. The guard is repeated on the
 * server regardless - this only avoids the second round trip.
 *
 * No `refetchOnWindowFocus`: a signature image does not change under a reader,
 * and re-fetching three objects every time the tab regains focus would redraw
 * the whole document for nothing.
 */
export function useSignaturesForPdf(requestId: string, enabled: boolean) {
	const trpc = useTRPC();

	return useQuery({
		...trpc.request.getSignaturesAsBase64.queryOptions({ requestId }),
		enabled,
		refetchOnWindowFocus: false,
	});
}
