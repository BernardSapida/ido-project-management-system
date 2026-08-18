import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

export interface MyListParams {
	masterStatus?: string;
	page: number;
	pageSize: number;
	search?: string;
	sortBy?: "createdAt";
	sortDir?: "asc" | "desc";
}

/**
 * The two queries behind /requests: one page of rows, and the four counters.
 *
 * They are separate on purpose. The counters are unfiltered and the list is not,
 * so one query could not serve both without recounting the whole set on every
 * page change - and keeping them apart is also what lets the table fail while
 * the tiles still render, and the other way round.
 *
 * `refetchOnMount: "always"` on both. Sign out, sign in as somebody else, and
 * the cache still holds the previous account's page under the same query key -
 * the key carries the filters, not the user. The stale rows then sit there until
 * a manual refresh, which is a requestor looking at another person's requests.
 * It is not an optimisation to remove.
 */
export function useUserDashboardQueries(params: MyListParams) {
	const trpc = useTRPC();

	const requests = useQuery({
		...trpc.request.myList.queryOptions(params),
		refetchOnMount: "always",
	});

	const summary = useQuery({
		...trpc.request.mySummary.queryOptions(),
		refetchOnMount: "always",
	});

	return { requests, summary };
}
