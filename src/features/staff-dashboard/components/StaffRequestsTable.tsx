import {
	AppChip,
	AppFilterBar,
	AppPagination,
	AppSearchField,
	AppTable,
	AppTableEmptyState,
	AppTableHighlight,
	type ColumnDef,
	type FilterDef,
} from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { Flag, ListFilter } from "lucide-react";
import {
	PRIORITY_OPTIONS,
	priorityChip,
	priorityLabel,
	typeOfRequestLabel,
} from "@/features/request-form/lib/request-options";
import { RequestStatusChip } from "@/features/user-dashboard/components/RequestStatusChip";
import { MASTER_STATUS_OPTIONS } from "@/lib/status-maps/request-status";
import type { StaffRequestRow } from "../types";

interface StaffRequestsTableProps {
	/** A page/filter/search change in flight. Redraws the skeletons over stale rows. */
	isFetching: boolean;
	/** How many requests the desk can see at all, ignoring the filters. */
	inScope: number;
	isLoading: boolean;
	onClearFilters: () => void;
	onPageChange: (page: number) => void;
	onPriorityChange: (priority: string | null) => void;
	onRowAction: (row: StaffRequestRow) => void;
	onSearchChange: (search: string) => void;
	onStatusChange: (status: string | null) => void;
	page: number;
	pageSize: number;
	priority?: string;
	rows: StaffRequestRow[];
	search: string;
	/** Set by the counter tiles. Narrows the queue as much as the two selects do,
	 *  so it has to count towards "filtered" for the empty state and the reset. */
	stage?: string;
	status?: string;
	/** The server's count for the CURRENT filters, never `rows.length`. */
	total: number;
}

/**
 * The RAW statuses, all fifteen - not the six coarse groups the requestor's list
 * offers.
 *
 * Staff read the workflow itself, and "Under Review" hides the only thing they
 * need from that column: which desk is holding the paper. `MASTER_STATUS_OPTIONS`
 * is generated from `masterStatusMap`, so the dropdown and the chips in the rows
 * can never offer different names for one status - including the one that was
 * explicitly fixed there, "Director Final Rejected" for `FINAL_REJECTED` beside
 * "IDO Final Rejected" for `IDO_FINAL_REJECTED`.
 */
const STATUS_FILTER: FilterDef = {
	allLabel: "All statuses",
	icon: ListFilter,
	key: "status",
	label: "Status",
	options: MASTER_STATUS_OPTIONS,
};

const PRIORITY_FILTER: FilterDef = {
	allLabel: "All priorities",
	icon: Flag,
	key: "priority",
	label: "Priority",
	// Low to high, as `PRIORITY_OPTIONS` defines it. The order IS the scale, and
	// sorting it alphabetically would put High between Low and Medium.
	options: PRIORITY_OPTIONS,
};

/** `dd MMM yyyy`, en-PH. Client-side only - these rows never render on the server. */
function formatDateFiled(value: Date): string {
	return new Date(value).toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" });
}

const columns: ColumnDef<StaffRequestRow>[] = [
	{
		key: "documentNumber",
		label: "Doc. #",
		// An em dash rather than a blank cell. Nothing without a number should
		// reach a staff queue - one is issued at submit - so a dash here is a
		// visible oddity rather than a cell that failed to load.
		render: (row) =>
			row.documentNumber ? (
				<AppTableHighlight>{row.documentNumber}</AppTableHighlight>
			) : (
				<span className="text-muted">—</span>
			),
	},
	{ key: "title", label: "Title", maxWidthClassName: "max-w-xs", wrap: "truncate" },
	{ key: "typeOfRequest", label: "Type", render: (row) => typeOfRequestLabel(row.typeOfRequest) },
	{
		key: "priority",
		label: "Priority",
		// A chip, not text. High has to be visible while scanning forty rows, and
		// "High" and "Low" are the same shape at a glance.
		render: (row) => (
			<AppChip
				{...priorityChip(row.priority)}
				label={priorityLabel(row.priority)}
				size="sm"
			/>
		),
	},
	{ key: "masterStatus", label: "Status", render: (row) => <RequestStatusChip masterStatus={row.masterStatus} /> },
	{ key: "createdAt", label: "Date Filed", render: (row) => formatDateFiled(row.createdAt) },
];

/**
 * The staff queue: two filters, search, rows and the page controls.
 *
 * ── Why the pieces and not `AppDataTable` ──
 *
 * `AppDataTable` owns its search and filter state internally and restores it
 * from localStorage. This page needs the opposite twice over. The URL has to be
 * the source of truth, so a filtered queue is a link one desk can send another
 * and the back button walks the filters; and the counter tiles above are a
 * SECOND control that sets the same state the filter bar does, which there is no
 * way to push into `AppDataTable` from outside it. Composing the same lab
 * components it composes keeps one piece of state, in the URL, that both
 * controls edit.
 *
 * Everything below the state is still the package's: the bar, the search field,
 * the table, the empty states and the tracker. Same trade the requestor's list
 * made, and for the same reasons - see `UserRequestsTable`.
 */
export function StaffRequestsTable({
	inScope,
	isFetching,
	isLoading,
	onClearFilters,
	onPageChange,
	onPriorityChange,
	onRowAction,
	onSearchChange,
	onStatusChange,
	page,
	pageSize,
	priority,
	rows,
	search,
	stage,
	status,
	total,
}: StaffRequestsTableProps) {
	const hasQuery = search.trim().length > 0;
	// The stage tiles count. A desk that pressed "Waiting on you" and got nothing
	// has filtered its way to an empty table exactly as much as one that picked a
	// status, and telling it the queue is clear would be a different - and wrong -
	// piece of news.
	const hasFilters = Boolean(status || priority || stage);
	const isBusy = isLoading || isFetching;
	const isNarrowed = hasFilters || hasQuery;

	return (
		<div
			className="flex flex-col gap-4"
			data-cy="staff-requests-table"
		>
			<AppFilterBar
				filters={{ priority: priority ?? null, status: status ?? null }}
				onFilterChange={(key, value) => (key === "status" ? onStatusChange(value) : onPriorityChange(value))}
				onReset={onClearFilters}
				// The search term is counted in the bar's "N active" chip and cleared by
				// its "Clear all", even though the box itself is below. A table narrowed
				// to three rows under a chip reading "0 active" is the lie the chip
				// exists to prevent.
				searchTerm={search}
				selects={[STATUS_FILTER, PRIORITY_FILTER]}
			/>

			<AppSearchField
				className="sm:max-w-sm"
				data-cy="staff-search"
				debounceMs={300}
				label="Search the queue"
				onValueChange={onSearchChange}
				placeholder="Search by title or document number"
				value={search}
			/>

			{/*
			 * How many are in scope, and how many are shown. The tracker under the
			 * table counts the FILTERED set and cannot say what the desk holds in
			 * total - which is the number that makes a queue of three read as three
			 * out of forty rather than as a desk with nothing on it.
			 */}
			<Typography
				aria-live="polite"
				color="muted"
				data-cy="staff-queue-count"
				type="body-sm"
			>
				{isNarrowed
					? `${total.toLocaleString("en-PH")} of ${inScope.toLocaleString("en-PH")} in your queue match these filters.`
					: `${inScope.toLocaleString("en-PH")} in your queue, including what you have already handled.`}
			</Typography>

			<AppTable
				columns={columns}
				data-cy="staff-queue-table"
				emptyContent={
					<AppTableEmptyState
						action={isNarrowed ? { label: "Clear filters", onPress: onClearFilters } : undefined}
						// Two distinct empty states, and the distinction is the whole point.
						// "Your queue is clear" to a desk whose filter matched nothing tells
						// them there is no work when there may be forty rows behind the
						// filter they just set.
						description={
							isNarrowed ? undefined : "Nothing is waiting on you, and nothing you have handled is on file yet."
						}
						query={search}
						reason={hasFilters ? "filtered" : hasQuery ? "no-results" : "no-data"}
						title={isNarrowed ? undefined : "Your queue is clear"}
					/>
				}
				highlightQuery={search}
				isLoading={isBusy}
				label="Staff queue"
				onRowAction={(id) => {
					const row = rows.find((candidate) => candidate.id === String(id));
					// The ROW, not the id. The destination depends on the request's stage
					// columns, and the page has no other copy of them to look it up in.
					if (row) onRowAction(row);
				}}
				rows={rows}
				// The page size, so the skeleton is the height the rows will be and the
				// content does not jump when they land.
				skeletonRowCount={pageSize}
			/>

			{/* Nothing at zero: the empty state directly above has already said it, in
			    a heading, a sentence and an action. */}
			{total > 0 ? (
				<AppPagination
					data-cy="staff-queue-pagination"
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
