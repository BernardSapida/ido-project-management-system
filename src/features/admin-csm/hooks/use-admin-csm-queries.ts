import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

export interface AdminCsmListParams {
	page: number;
	pageSize: number;
	rating?: string;
	search?: string;
	status?: string;
}

/**
 * The report: one page of records, and the figures over all of them.
 *
 * Two queries rather than one, because they answer to different things. The list
 * re-runs on every filter, page and search change; the summary is keyed on
 * nothing and must not, or the average would flicker each time somebody typed a
 * letter into the search box - and worse, would look as though it had moved.
 *
 * `refetchOnMount: "always"` on both, for the reason the accounts list gives:
 * these keys carry no identity, so a cached page would survive a sign out and a
 * sign in as somebody else.
 */
export function useAdminCsmQueries(params: AdminCsmListParams) {
	const trpc = useTRPC();

	const records = useQuery({
		...trpc.adminCsm.list.queryOptions(params),
		refetchOnMount: "always",
	});

	const summary = useQuery({
		...trpc.adminCsm.summary.queryOptions(),
		refetchOnMount: "always",
	});

	return { records, summary };
}

/**
 * One record, by its own id.
 *
 * A plain `useQuery` rather than a suspense one: this page has an error state of
 * its own to draw - a `csmId` that no longer exists is a NOT_FOUND worth a
 * sentence and a way back, not a boundary that replaces the screen.
 */
export function useAdminCsmRecord(csmId: string) {
	const trpc = useTRPC();

	return useQuery({
		...trpc.adminCsm.getById.queryOptions({ csmId }),
		refetchOnMount: "always",
	});
}
