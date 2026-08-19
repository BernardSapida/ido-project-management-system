import {
	AppChip,
	AppDataTable,
	AppTableHighlight,
	type ColumnDef,
	type DataTableServer,
	type FilterDef,
} from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { CircleCheckBig, Star } from "lucide-react";
import { RATING_FILTER_OPTIONS, ratingTone, STATUS_FILTER_OPTIONS, statusChip } from "../lib/csm-options";
import type { AdminCsmRow } from "../types";

interface AdminCsmTableProps {
	isLoading: boolean;
	/** Open one record. The page owns the destination. */
	onRowAction: (id: string) => void;
	rows: AdminCsmRow[];
	/** The controlled contract: values in, edits out. Assembled by the page, which
	 *  is the thing that owns the URL they live in. */
	server: DataTableServer;
}

const RATING_FILTER: FilterDef = {
	allLabel: "Any rating",
	icon: Star,
	key: "rating",
	label: "Rating",
	options: RATING_FILTER_OPTIONS,
};

const STATUS_FILTER: FilterDef = {
	allLabel: "All records",
	icon: CircleCheckBig,
	key: "status",
	label: "Status",
	options: STATUS_FILTER_OPTIONS,
};

/** `dd MMM yyyy`, en-PH. Client-side only - these rows never render on the server. */
function formatDay(value: Date): string {
	return new Date(value).toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Every satisfaction record, answered or not.
 *
 * `AppDataTable` in CONTROLLED server mode, so every filter lives in the URL and
 * a filtered view is a link somebody can send. The page owns those values; this
 * file owns the columns, the two filter definitions and the row press.
 *
 * ## Awaiting rows are listed, and they are openable
 *
 * A table of answered forms alone would be a report that quietly disagrees with
 * the "Awaiting response" tile above it, and it would make the one question an
 * administrator actually acts on - which requests are still owed an answer -
 * unanswerable from the screen that counts them. Pressing one opens the record
 * and is told what it is; nothing here is a dead row.
 *
 * ## Why the comment is a column at all
 *
 * A rating says how it went and a comment says why, and the second is the only
 * part worth opening a record for. One truncated line is what makes the choice
 * of which to open possible without opening all of them.
 */
export function AdminCsmTable({ isLoading, onRowAction, rows, server }: AdminCsmTableProps) {
	const columns: ColumnDef<AdminCsmRow>[] = [
		{
			key: "documentNumber",
			label: "Document No.",
			// The title under the number, the same way the accounts table puts the
			// email under the name: the number identifies the record and the title is
			// what makes it recognisable, so they have to be read together.
			render: (row) => (
				<div className="flex flex-col">
					<AppTableHighlight>{row.documentNumber ?? "—"}</AppTableHighlight>

					<Typography
						className="line-clamp-1"
						color="muted"
						type="body-xs"
					>
						<AppTableHighlight>{row.requestTitle}</AppTableHighlight>
					</Typography>
				</div>
			),
			searchValue: (row) => `${row.documentNumber ?? ""} ${row.requestTitle}`,
		},
		{
			key: "requestor",
			label: "Requestor",
			render: (row) => (
				<div className="flex flex-col">
					<AppTableHighlight>{row.requestorName}</AppTableHighlight>

					<Typography
						color="muted"
						type="body-xs"
					>
						<AppTableHighlight>{row.requestorEmail}</AppTableHighlight>
					</Typography>
				</div>
			),
			searchValue: (row) => `${row.requestorName} ${row.requestorEmail}`,
		},
		{
			key: "rating",
			label: "Rating",
			/*
			 * A chip carrying the number, not five glyphs.
			 *
			 * `AppRatingSummary` is the figure for ONE average with room around it;
			 * forty of them stacked in a column is forty rings and two hundred stars
			 * to compare six values through. The tone is what makes the column
			 * scannable - a run of red is visible before a single number is read.
			 *
			 * An answered record with no rating is the old acknowledgement contract,
			 * and it says so rather than drawing a zero: zero stars is not a low
			 * score, it is a question that was never asked.
			 */
			render: (row) => {
				if (row.rating === null) {
					return (
						<Typography
							color="muted"
							type="body-xs"
						>
							{row.submittedAt ? "Not rated" : "—"}
						</Typography>
					);
				}

				return (
					<AppChip
						icon={Star}
						label={`${row.rating}`}
						size="sm"
						tone={ratingTone(row.rating)}
					/>
				);
			},
		},
		{
			key: "status",
			label: "Status",
			render: (row) => (
				<AppChip
					{...statusChip(row.submittedAt)}
					size="sm"
				/>
			),
		},
		{
			key: "comment",
			label: "Comment",
			// One line, clamped. The record is where the rest of it lives, and a cell
			// that grows to a paragraph turns the row height into the longest thing
			// anybody has ever typed.
			render: (row) =>
				row.comment ? (
					<Typography
						className="line-clamp-1 max-w-xs"
						type="body-sm"
					>
						{row.comment}
					</Typography>
				) : (
					<Typography
						color="muted"
						type="body-xs"
					>
						No comment
					</Typography>
				),
		},
		{
			key: "submittedAt",
			label: "Submitted",
			render: (row) =>
				row.submittedAt ? (
					formatDay(row.submittedAt)
				) : (
					<Typography
						color="muted"
						type="body-xs"
					>
						Sent {formatDay(row.createdAt)}
					</Typography>
				),
		},
	];

	return (
		<AppDataTable
			columns={columns}
			data-cy="admin-csm-table"
			description="One record per approved request. Answered first, then the forms still waiting on a requestor."
			filters={[RATING_FILTER, STATUS_FILTER]}
			hasColumnPicker
			// h2: this table is the page's second section, under the summary, and both
			// sit directly under the AppPageHeader's h1.
			headingLevel={2}
			isLoading={isLoading}
			noun="records"
			onRowAction={(id) => onRowAction(String(id))}
			rows={rows}
			searchPlaceholder="Search by document number, title or requestor"
			server={server}
			storageKey="admin-csm"
			title="Satisfaction records"
		/>
	);
}
