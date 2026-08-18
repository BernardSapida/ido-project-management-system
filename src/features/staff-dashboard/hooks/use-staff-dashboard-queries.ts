import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

export interface StaffListParams {
	page: number;
	pageSize: number;
	priority?: string;
	search?: string;
	stage?: "handled" | "waiting";
	status?: string;
}

/**
 * The two queries behind /staff/dashboard: one page of rows, and the two
 * counters.
 *
 * Separate on purpose, for the reason `use-user-dashboard-queries` gives: the
 * counters are unfiltered and the list is not, so one query could not serve both
 * without recounting the whole desk on every page change - and keeping them
 * apart is what lets the table fail while the tiles still render, and the other
 * way round.
 *
 * `refetchOnMount: "always"` on both, and here it matters more than it does on
 * the requestor's list. Neither query key carries the role - the scope is
 * decided on the SERVER from the session - so signing out and back in as a
 * different desk hits the identical key and the cache answers with the previous
 * role's queue. That is not a stale list, it is one staff member looking at
 * another's work. It is not an optimisation to remove.
 */
export function useStaffDashboardQueries(params: StaffListParams) {
	const trpc = useTRPC();

	const requests = useQuery({
		...trpc.request.staffList.queryOptions(params),
		refetchOnMount: "always",
	});

	const summary = useQuery({
		...trpc.request.staffSummary.queryOptions(),
		refetchOnMount: "always",
	});

	return { requests, summary };
}
