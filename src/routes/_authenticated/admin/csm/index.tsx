import { AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { AdminCsmSummary } from "@/features/admin-csm/components/AdminCsmSummary";
import { AdminCsmTable } from "@/features/admin-csm/components/AdminCsmTable";
import { useAdminCsmQueries } from "@/features/admin-csm/hooks/use-admin-csm-queries";

/**
 * Filter, search and page live in the URL, not in component state.
 *
 * `.catch` throughout rather than a plain default, the same as the accounts
 * list: a hand-edited `?page=abc` has to land on something, and a thrown
 * validation error here would replace the whole screen with an error boundary
 * over a typo in a query string.
 */
const searchSchema = z.object({
	page: z.number().int().min(1).catch(1),
	pageSize: z.number().int().min(1).max(100).catch(10),
	rating: z.string().optional(),
	search: z.string().optional(),
	status: z.string().optional(),
});

type AdminCsmSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/admin/csm/")({
	/*
	 * No `beforeLoad` here. `_authenticated/admin.tsx` holds the ADMIN gate for
	 * everything under this folder, which is the reason it is written there: a
	 * gate written per route is the gate missing from the next route somebody
	 * adds. Every procedure this page calls is an `adminProcedure` regardless.
	 */
	head: () => ({
		meta: [{ title: seo.title("Satisfaction") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Satisfaction",
		mainWidth: "wide",
	},
	validateSearch: searchSchema,
	component: AdminCsmPage,
});

function AdminCsmPage() {
	const navigate = Route.useNavigate();
	const { page, pageSize, rating, search, status } = Route.useSearch();

	const { records, summary } = useAdminCsmQueries({ page, pageSize, rating, search, status });

	/**
	 * Any change to WHICH rows exist resets the page.
	 *
	 * Without it, filtering from page 4 down to two results leaves the reader on
	 * page 4 of a two-row set - an empty table under a tracker that disagrees with
	 * it, which reads as "these records do not exist".
	 */
	const setFilters = (next: Partial<AdminCsmSearch>) => {
		void navigate({ search: (prev) => ({ ...prev, ...next, page: 1 }) });
	};

	const setPage = (next: number) => {
		void navigate({ search: (prev) => ({ ...prev, page: next }) });
	};

	const openRecord = (csmId: string) => void navigate({ params: { csmId }, to: "/admin/csm/$csmId" });

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				subtitle="What requestors said about the way their requests were handled."
				title="Satisfaction"
			/>

			{/*
			 * The summary keeps its own error to itself.
			 *
			 * It is a second query, and a failure in it must not take the table down
			 * with it: the records are the thing this page is for, and a page that
			 * refuses to list them because an average could not be computed has
			 * turned a degraded screen into a broken one. `isLoading` covers the
			 * failed case as well - the tiles stay as skeletons rather than drawing
			 * zeros, which would be a satisfaction score of nothing rather than an
			 * absent one.
			 */}
			<AdminCsmSummary
				data={summary.data}
				isLoading={summary.isPending || summary.isError}
			/>

			{records.isError ? (
				<AppQueryError
					error={records.error}
					onRetry={() => void records.refetch()}
				/>
			) : (
				<AdminCsmTable
					isLoading={records.isPending}
					onRowAction={openRecord}
					rows={records.data?.items ?? []}
					/*
					 * The controlled contract, assembled here because this is the thing
					 * that owns the URL every one of these values lives in.
					 *
					 * `onPageChange` is the only handler that does not reset the page, for
					 * the obvious reason. The other three do it in the same write that
					 * changes the filter - one navigation rather than two, so the back
					 * button undoes one filter change per press.
					 */
					server={{
						filters: { rating: rating ?? null, status: status ?? null },
						isFetching: records.isFetching,
						onFiltersChange: (next) =>
							setFilters({ rating: next.rating ?? undefined, status: next.status ?? undefined }),
						onPageChange: setPage,
						onReset: () => setFilters({ rating: undefined, search: undefined, status: undefined }),
						// Already trimmed by the table. Empty means "no search", not "search
						// for nothing" - left as `""` the parameter stays in the URL and the
						// query key changes for a filter that narrows nothing.
						onSearchChange: (next) => setFilters({ search: next || undefined }),
						page,
						search: search ?? "",
						total: records.data?.total ?? 0,
					}}
				/>
			)}
		</div>
	);
}
