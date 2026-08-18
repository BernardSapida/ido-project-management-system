import {
	AppChip,
	AppDataTable,
	AppTableHighlight,
	type ColumnDef,
	type DataTableServer,
	type FilterDef,
} from "@bernardsapida/web-ui";
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
	/** How many requests the desk can see at all, ignoring every filter. */
	inScope: number;
	isLoading: boolean;
	onRowAction: (row: StaffRequestRow) => void;
	rows: StaffRequestRow[];
	/** The controlled contract: values in, edits out. Assembled by the page,
	 *  which is the thing that owns the URL they live in. */
	server: DataTableServer;
	/** 1 while a counter tile is narrowing the queue, 0 otherwise. See below. */
	stageFilterCount: number;
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
		//
		// `AppTableHighlight` by hand, because a column with its own `render` is
		// the one place the table cannot mark matches for you. Without it a desk
		// searching for a document number gets the right row and no indication of
		// why - and the number is the thing they searched BY.
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
 * The staff queue.
 *
 * `AppDataTable` in CONTROLLED server mode (web-ui 0.4.7), which is what lets
 * this page keep every filter in the URL while the table still draws the bar, the
 * search box, the column picker, the two empty states and the tracker. Before
 * 0.4.7 the table owned those values and there was no way to hand them over, so
 * this screen had to compose the six lab components by hand to get a queue view
 * that was a link somebody could send.
 *
 * The page owns the state and passes it down; this file owns the columns and the
 * two filter definitions. Nothing here holds a copy of anything.
 *
 * ── `stageFilterCount` ──
 *
 * The counter tiles above the table narrow these same rows, and the table cannot
 * see them - "waiting on you" is a different set of statuses at every desk and
 * only the server knows which. Passing the count through
 * `externalFilterCount` buys the one thing that matters: a desk that pressed a
 * tile and got nothing back is told its FILTERS emptied the table, not that it
 * has no work. "Your queue is clear" is the worst available answer to somebody
 * who has forty rows sitting behind the tile they just pressed.
 */
export function StaffRequestsTable({
	inScope,
	isLoading,
	onRowAction,
	rows,
	server,
	stageFilterCount,
}: StaffRequestsTableProps) {
	return (
		<AppDataTable
			columns={columns}
			data-cy="staff-requests-table"
			/*
			 * How many are in scope, not how many matched. The tracker under the table
			 * counts the FILTERED set and cannot say what the desk holds in total -
			 * which is the number that makes a queue of three read as three out of
			 * forty rather than as a desk with nothing on it. It also warns the reader
			 * that the list includes what they have already dealt with, so an
			 * unexpectedly long queue is not a mystery.
			 */
			description={`${inScope.toLocaleString("en-PH")} in your queue, including what you have already handled.`}
			externalFilterCount={stageFilterCount}
			filters={[STATUS_FILTER, PRIORITY_FILTER]}
			// Six columns, and a desk reads all six. The picker is here because a
			// queue is looked at every day and the one column somebody never uses is
			// worth letting them drop; `storageKey` is what makes that choice last.
			hasColumnPicker
			// h3: the page's AppPageHeader owns the h1 and this table sits under it
			// with no section heading between, so h2 would be the level to take - but
			// the KPI tiles above already occupy it.
			headingLevel={3}
			isLoading={isLoading}
			noun="requests"
			onRowAction={(id) => {
				const row = rows.find((candidate) => candidate.id === String(id));
				// The ROW, not the id. The destination depends on the request's stage
				// columns, and the page has no other copy of them to look it up in.
				if (row) onRowAction(row);
			}}
			rows={rows}
			searchPlaceholder="Search by title or document number"
			server={server}
			storageKey="staff-queue"
			title="Queue"
		/>
	);
}
