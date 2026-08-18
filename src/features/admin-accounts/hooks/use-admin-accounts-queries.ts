import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

export interface AdminAccountsListParams {
	page: number;
	pageSize: number;
	role?: string;
	search?: string;
	status?: string;
}

/**
 * One page of accounts.
 *
 * `refetchOnMount: "always"` for the reason the staff queue gives, and it matters
 * more here: the list is the admin's only view of what they have just changed, so
 * coming back to this page from anywhere - a modal that failed, another tab, the
 * back button - has to show the database rather than a cache from before the
 * change.
 */
export function useAdminAccountsQueries(params: AdminAccountsListParams) {
	const trpc = useTRPC();

	const users = useQuery({
		...trpc.adminAccounts.listAllUsers.queryOptions(params),
		refetchOnMount: "always",
	});

	return { users };
}
