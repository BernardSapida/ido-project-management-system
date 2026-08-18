import { AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { StaffQueueSummary } from "@/features/staff-dashboard/components/StaffQueueSummary";
import { StaffRequestsTable } from "@/features/staff-dashboard/components/StaffRequestsTable";
import { useStaffDashboardQueries } from "@/features/staff-dashboard/hooks/use-staff-dashboard-queries";
import { resolveReviewRoute } from "@/features/staff-dashboard/lib/resolve-review-route";
import type { StaffRequestRow, StageKey } from "@/features/staff-dashboard/types";
import { USER_ROLES, type UserRole } from "@/utils/config";

/** The four desks this queue serves. The server names the same four in
 *  `STAFF_QUEUE_ROLES`, and that copy is the one that enforces. */
const STAFF_ROLES: UserRole[] = [
	USER_ROLES.IDO_OFFICER,
	USER_ROLES.IDO_CHAIRPERSON,
	USER_ROLES.BUDGET_OFFICER,
	USER_ROLES.DIRECTOR,
];

/**
 * Filter, search, stage and page live in the URL, not in component state.
 *
 * That is what makes a filtered queue a link one desk can send another, and the
 * back button walk the filters rather than leave the page. `.catch` rather than
 * a plain default throughout: a hand-edited `?page=abc` or `?stage=nonsense` has
 * to land on something, and a thrown validation error here would replace the
 * whole screen with an error boundary over a typo in a query string.
 */
const searchSchema = z.object({
	page: z.number().int().min(1).catch(1),
	pageSize: z.number().int().min(1).max(100).catch(10),
	priority: z.string().optional(),
	search: z.string().optional(),
	stage: z.enum(["handled", "waiting"]).optional().catch(undefined),
	status: z.string().optional(),
});

type StaffSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/staff/dashboard/")({
	/**
	 * The four staff desks. Requestors have their own list at /requests.
	 *
	 * This gate ORGANISES; it does not protect. `staffList` and `staffSummary` are
	 * `roleProcedure`s over the same four roles and build their WHERE clause from
	 * `ctx.user.role`, so a USER or ADMIN who gets past this - by any route - gets
	 * FORBIDDEN from the server rather than somebody else's queue.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({ data: { allowedRoles: STAFF_ROLES } });
	},
	validateSearch: searchSchema,
	head: () => ({
		meta: [{ title: seo.title("Dashboard") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Dashboard",
		mainWidth: "wide",
	},
	component: StaffDashboardPage,
});

function StaffDashboardPage() {
	const navigate = Route.useNavigate();
	const router = useRouter();
	const { page, pageSize, priority, search, stage, status } = Route.useSearch();
	const { user } = useAuth();

	// The gate above guarantees one of the four; the fallback exists only for the
	// tick before the session resolves, and it changes nothing the server reads.
	const role = user?.role ?? USER_ROLES.IDO_OFFICER;

	const { requests, summary } = useStaffDashboardQueries({ page, pageSize, priority, search, stage, status });

	/**
	 * Any change to WHICH rows exist resets the page.
	 *
	 * Without it, filtering from page 7 down to two results leaves the desk on
	 * page 7 of a two-row set - an empty table under a tracker that disagrees with
	 * it, which reads as "nothing to do" to the one person who has to act.
	 */
	const setFilters = (next: Partial<StaffSearch>) => {
		void navigate({ search: (prev) => ({ ...prev, ...next, page: 1 }) });
	};

	const setPage = (next: number) => {
		void navigate({ search: (prev) => ({ ...prev, page: next }) });
	};

	/**
	 * The row click, and the only navigation in the app that reasons about the
	 * workflow. `resolveReviewRoute` holds the rule; this hands it the role and
	 * the row and goes where it says.
	 *
	 * Through `href` rather than `to`: the five destinations ship in specs
	 * 010-014, and a typed route cannot name a route that does not exist yet.
	 */
	const openReview = (row: StaffRequestRow) => {
		void router.navigate({ href: resolveReviewRoute(role, row) });
	};

	const inScope = summary.data ? summary.data.handled + summary.data.waiting : 0;

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				subtitle="Requests waiting on you, and the ones you have already handled."
				title="Dashboard"
			/>

			{/* The counters and the queue are two queries and fail independently: a
			    summary that 500s must not blank the table the desk came to read. */}
			{summary.isError ? (
				<AppQueryError
					error={summary.error}
					onRetry={() => void summary.refetch()}
				/>
			) : (
				<StaffQueueSummary
					activeStage={(stage as StageKey) ?? null}
					counts={summary.data}
					isLoading={summary.isPending}
					onStageClick={(next) => setFilters({ stage: next ?? undefined })}
					role={role}
				/>
			)}

			{requests.isError ? (
				<AppQueryError
					error={requests.error}
					onRetry={() => void requests.refetch()}
				/>
			) : (
				<StaffRequestsTable
					inScope={inScope}
					isLoading={requests.isPending}
					onRowAction={openReview}
					rows={requests.data?.items ?? []}
					/*
					 * The controlled contract, assembled here because this is the thing
					 * that owns the URL every one of these values lives in.
					 *
					 * `onPageChange` is the only handler that does NOT reset the page, for
					 * the obvious reason. The other two do it in the same write that
					 * changes the filter - controlled mode leaves the page reset to the
					 * caller precisely so it is one navigation rather than two, and two
					 * would be two history entries per filter change and a back button
					 * that goes nowhere on the first press.
					 */
					server={{
						filters: { priority: priority ?? null, status: status ?? null },
						isFetching: requests.isFetching,
						onFiltersChange: (next) =>
							setFilters({ priority: next.priority ?? undefined, status: next.status ?? undefined }),
						onPageChange: setPage,
						// "Clear all" as ONE write, and the only handler that can reach the
						// stage the counter tiles set - the table cannot see that filter, so
						// nothing else it calls would clear it.
						onReset: () => setFilters({ priority: undefined, search: undefined, stage: undefined, status: undefined }),
						// Already trimmed by the table. Empty means "no search", not "search
						// for nothing" - left as `""` the parameter stays in the URL and the
						// query key changes for a filter that narrows nothing.
						onSearchChange: (next) => setFilters({ search: next || undefined }),
						page,
						search: search ?? "",
						total: requests.data?.total ?? 0,
					}}
					// 1 while a tile is pressed. It is what makes an empty queue say
					// "filtered" rather than "your queue is clear".
					stageFilterCount={stage ? 1 : 0}
				/>
			)}
		</div>
	);
}
