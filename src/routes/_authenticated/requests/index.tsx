import { AppButton, AppPageHeader, AppQueryError, type TableSortDescriptor } from "@bernardsapida/web-ui";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { UserRequestsTable } from "@/features/user-dashboard/components/UserRequestsTable";
import { UserSummaryCards } from "@/features/user-dashboard/components/UserSummaryCards";
import { useUserDashboardQueries } from "@/features/user-dashboard/hooks/use-user-dashboard-queries";
import type { StatusGroupKey } from "@/features/user-dashboard/types";
import { USER_ROLES } from "@/utils/config";

/**
 * Filter, search and page live in the URL, not in component state.
 *
 * That is what makes a filtered list a link somebody can send and the back
 * button walk the filters rather than leave the page. `.catch` rather than a
 * plain default on the two numbers: a hand-edited `?page=abc` has to land on
 * page 1, and a thrown validation error here would replace the whole screen with
 * an error boundary over a typo in a query string.
 */
const searchSchema = z.object({
	page: z.number().int().min(1).catch(1),
	pageSize: z.number().int().min(1).max(100).catch(10),
	search: z.string().optional(),
	status: z.string().optional(),
});

type RequestsSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/requests/")({
	/**
	 * Requestors only. Staff have their own queue (spec 009) and reach requests
	 * through it.
	 *
	 * This gate ORGANISES; it does not protect. `myList` and `mySummary` scope
	 * every query to `ctx.user.id` with no `userId` input, so a staff member who
	 * gets past this - by any route - reads their own empty list rather than
	 * somebody else's.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({ data: { allowedRoles: [USER_ROLES.USER] } });
	},
	validateSearch: searchSchema,
	head: () => ({
		meta: [{ title: seo.title("My Requests") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Requests",
		mainWidth: "wide",
	},
	component: RequestsListPage,
});

function RequestsListPage() {
	const navigate = Route.useNavigate();
	const router = useRouter();
	const { page, pageSize, search, status } = Route.useSearch();

	/**
	 * Sort is the one control that is NOT in the URL. It is a reading preference
	 * rather than a description of the set - two people opening the same link
	 * should see the same requests, and whether the newest is at the top is not
	 * part of that.
	 */
	const [sort, setSort] = useState<TableSortDescriptor | undefined>(undefined);

	const { requests, summary } = useUserDashboardQueries({
		masterStatus: status,
		page,
		pageSize,
		search,
		sortBy: sort ? "createdAt" : undefined,
		sortDir: sort ? (sort.direction === "ascending" ? "asc" : "desc") : undefined,
	});

	/**
	 * Any change to WHICH rows exist resets the page.
	 *
	 * Without it, filtering from page 7 down to two results leaves the user on
	 * page 7 of a two-row set: an empty table, a tracker that disagrees with it,
	 * and nothing on screen explaining either.
	 */
	const setFilters = (next: Partial<RequestsSearch>) => {
		void navigate({ search: (prev) => ({ ...prev, ...next, page: 1 }) });
	};

	const setPage = (next: number) => {
		void navigate({ search: (prev) => ({ ...prev, page: next }) });
	};

	const handleSortChange = (descriptor: TableSortDescriptor) => {
		setSort(descriptor);
		if (page !== 1) setPage(1);
	};

	/**
	 * Which tile is selected. `null` is the Total tile, and it means "no filter" -
	 * so picking Draft in the dropdown selects no tile at all rather than lighting
	 * up Total, which would claim the list is unfiltered while it is not.
	 */
	const activeGroup: string | null = status ?? null;

	/**
	 * Through `router.navigate` rather than `Route.useNavigate()`: this route has
	 * required search params, so its bound navigate demands a `search` for every
	 * call - which is right for the four below that edit those params, and wrong
	 * for a jump to a route that does not have them.
	 */
	const goToRequest = (requestId: string) => {
		void router.navigate({ params: { requestId }, to: "/requests/$requestId" });
	};

	const goToNew = () => {
		void router.navigate({ to: "/requests/new" });
	};

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				action={
					<AppButton
						data-cy="new-request"
						icon={Plus}
						onPress={goToNew}
						variant="primary"
					>
						New Request
					</AppButton>
				}
				subtitle="Track every request you have filed."
				title="My Requests"
			/>

			{/* The counters and the list are two queries and fail independently: a
			    summary that 500s must not blank the table the user came to read. */}
			{summary.isError ? (
				<AppQueryError
					error={summary.error}
					onRetry={() => void summary.refetch()}
				/>
			) : (
				<UserSummaryCards
					activeGroup={activeGroup}
					isLoading={summary.isPending}
					onCardClick={(group: StatusGroupKey) => setFilters({ status: group ?? undefined })}
					summary={summary.data}
				/>
			)}

			{requests.isError ? (
				<AppQueryError
					error={requests.error}
					onRetry={() => void requests.refetch()}
				/>
			) : (
				<UserRequestsTable
					isFetching={requests.isFetching}
					isLoading={requests.isPending}
					onClearFilters={() => setFilters({ search: undefined, status: undefined })}
					onNewRequest={goToNew}
					onPageChange={setPage}
					onRowAction={goToRequest}
					// An empty box means "no search", not "search for nothing" - left as
					// `""` the parameter stays in the URL and the query key changes for a
					// filter that narrows nothing.
					onSearchChange={(value) => setFilters({ search: value.trim() || undefined })}
					onSortChange={handleSortChange}
					onStatusChange={(value) => setFilters({ status: value ?? undefined })}
					page={page}
					pageSize={pageSize}
					rows={requests.data?.items ?? []}
					search={search ?? ""}
					sortDescriptor={sort}
					status={status}
					total={requests.data?.total ?? 0}
				/>
			)}
		</div>
	);
}
