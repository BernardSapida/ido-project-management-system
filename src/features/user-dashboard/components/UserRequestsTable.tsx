import {
	AppFilterBar,
	AppPagination,
	AppSearchField,
	AppTable,
	AppTableEmptyState,
	AppTableHighlight,
	type ColumnDef,
	type TableSortDescriptor,
} from "@bernardsapida/web-ui";
import { ListFilter } from "lucide-react";
import { FILTER_OPTIONS } from "@/lib/status-maps/request-status";
import type { RequestRow } from "../types";
import { RequestStatusChip } from "./RequestStatusChip";

interface UserRequestsTableProps {
	/** A page/filter/search change in flight. Redraws the skeletons over stale rows. */
	isFetching: boolean;
	isLoading: boolean;
	onClearFilters: () => void;
	onNewRequest: () => void;
	onPageChange: (page: number) => void;
	onRowAction: (id: string) => void;
	onSearchChange: (search: string) => void;
	onSortChange: (descriptor: TableSortDescriptor) => void;
	onStatusChange: (status: string | null) => void;
	page: number;
	pageSize: number;
	rows: RequestRow[];
	search: string;
	sortDescriptor?: TableSortDescriptor;
	status?: string;
	/** The server's count for the CURRENT filters, never `rows.length`. */
	total: number;
}

const STATUS_FILTER = {
	allLabel: "All statuses",
	icon: ListFilter,
	key: "status",
	label: "Status",
	// The six coarse groups, not the fifteen raw statuses. A requestor filters by
	// "Under Review"; which of the four review desks currently holds the paper is
	// the reviewers' vocabulary, and offering it here is a dropdown of jargon.
	options: FILTER_OPTIONS,
};

/** `dd MMM yyyy`, en-PH. Client-side only - these rows never render on the server. */
function formatDateFiled(value: Date): string {
	return new Date(value).toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" });
}

/** `TYPE_OF_REQUEST` is a stored enum; nobody wants to read one in a table cell. */
function toTitleCase(value: string): string {
	return value.replace(/_/g, " ").replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

const columns: ColumnDef<RequestRow>[] = [
	{
		key: "documentNumber",
		label: "Doc. #",
		// An em dash, not a blank cell and not "null". A draft genuinely has no
		// number yet - one is issued at submit - and an empty cell reads as data
		// that failed to load.
		render: (row) =>
			row.documentNumber ? (
				<AppTableHighlight>{row.documentNumber}</AppTableHighlight>
			) : (
				<span className="text-muted">—</span>
			),
	},
	{ key: "title", label: "Title", maxWidthClassName: "max-w-xs", wrap: "truncate" },
	{ key: "typeOfRequest", label: "Type", render: (row) => toTitleCase(row.typeOfRequest) },
	{ key: "priority", label: "Priority", render: (row) => toTitleCase(row.priority) },
	{ key: "masterStatus", label: "Status", render: (row) => <RequestStatusChip masterStatus={row.masterStatus} /> },
	{
		// The only sortable column. Type, Priority and Status have no meaningful
		// order, and offering the control on a header implies one exists.
		allowsSorting: true,
		key: "createdAt",
		label: "Date Filed",
		render: (row) => formatDateFiled(row.createdAt),
	},
];

/**
 * The requestor's own list: status filter, search, rows, and the page controls.
 *
 * ── Why the pieces and not `AppDataTable` ──
 *
 * `AppDataTable` owns its search and filter state internally and restores it
 * from localStorage. This page needs the opposite: the URL is the source of
 * truth, so a filtered list is a link somebody can send and the back button
 * walks the filters. It also needs a SECOND control - the counter tiles - to set
 * the same status the dropdown sets, and there is no way to push a value into
 * `AppDataTable`'s filter bar from outside it. Composing the same lab components
 * it composes keeps one piece of state, in the URL, that both controls edit.
 *
 * Everything below the state is still the package's: the bar, the search field,
 * the table, the empty states and the tracker.
 */
export function UserRequestsTable({
	isFetching,
	isLoading,
	onClearFilters,
	onNewRequest,
	onPageChange,
	onRowAction,
	onSearchChange,
	onSortChange,
	onStatusChange,
	page,
	pageSize,
	rows,
	search,
	sortDescriptor,
	status,
	total,
}: UserRequestsTableProps) {
	const hasQuery = search.trim().length > 0;
	const hasFilters = Boolean(status);
	const isBusy = isLoading || isFetching;

	return (
		<div
			className="flex flex-col gap-4"
			data-cy="user-requests-table"
		>
			<AppFilterBar
				filters={{ status: status ?? null }}
				onFilterChange={(_key, value) => onStatusChange(value)}
				onReset={onClearFilters}
				// The search term is counted in the bar's "N active" chip and cleared by
				// its "Clear all", even though the box itself is below. A table narrowed
				// to three rows under a chip reading "0 active" is the lie the chip
				// exists to prevent.
				searchTerm={search}
				selects={[STATUS_FILTER]}
			/>

			<AppSearchField
				className="sm:max-w-sm"
				data-cy="requests-search"
				debounceMs={300}
				label="Search requests"
				onValueChange={onSearchChange}
				placeholder="Search by title or document number"
				value={search}
			/>

			<AppTable
				columns={columns}
				data-cy="requests-table"
				emptyContent={
					<AppTableEmptyState
						action={
							hasFilters || hasQuery
								? { label: "Clear filters", onPress: onClearFilters }
								: { label: "New Request", onPress: onNewRequest }
						}
						description={hasFilters || hasQuery ? undefined : "File your first request and it will show up here."}
						query={search}
						// Three reasons, never one. Telling somebody whose filter matched
						// nothing that they have never filed a request says their history
						// is gone, which is the worst thing an empty table can say.
						reason={hasFilters ? "filtered" : hasQuery ? "no-results" : "no-data"}
						title={hasFilters ? "No requests match these filters" : hasQuery ? undefined : "No requests yet"}
					/>
				}
				highlightQuery={search}
				isLoading={isBusy}
				label="My requests"
				onRowAction={(id) => onRowAction(String(id))}
				onSortChange={onSortChange}
				rows={rows}
				// The page size, so the skeleton is the height the rows will be and the
				// content does not jump when they land.
				skeletonRowCount={pageSize}
				sortDescriptor={sortDescriptor}
			/>

			{/* Nothing at zero: the empty state directly above has already said it, in
			    a heading, a sentence and an action. */}
			{total > 0 ? (
				<AppPagination
					data-cy="requests-pagination"
					noun="requests"
					onPageChange={onPageChange}
					page={page}
					rowsPerPage={pageSize}
					total={total}
				/>
			) : null}
		</div>
	);
}
