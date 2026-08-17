import type { ChipTone } from "@bernardsapida/web-ui";
import {
	CalendarClock,
	CheckCircle2,
	CircleCheckBig,
	ClipboardCheck,
	FileText,
	Gavel,
	type LucideIcon,
	Search,
	Send,
	Undo2,
	XCircle,
} from "lucide-react";

/**
 * One name and one colour per status, read by every chip in the app - the table,
 * the timeline and the detail page all come here. That is the point: a status
 * that reads "Returned by IDO" in a table and "Returned" on a detail page is two
 * statuses as far as the reader is concerned.
 *
 * `tone` is a `ChipTone`, never a raw colour, because `AppChip` takes a tone.
 * `icon` is here for the same reason the label is: `AppChip` requires one, and a
 * status that picks a different glyph per page is the same drift in another
 * form.
 */
export interface StatusMapEntry {
	icon: LucideIcon;
	label: string;
	tone: ChipTone;
}

export const masterStatusMap: Record<string, StatusMapEntry> = {
	DRAFT: { icon: FileText, label: "Draft", tone: "default" },
	SUBMITTED: { icon: Send, label: "Submitted", tone: "accent" },
	RETURNED: { icon: Undo2, label: "Returned by IDO", tone: "warning" },
	UNDER_IDO_REVIEW: { icon: Search, label: "IDO Review", tone: "warning" },
	UNDER_DIRECTOR_REVIEW: { icon: Gavel, label: "Director Review", tone: "warning" },
	UNDER_IDO_FINAL_REVIEW: { icon: ClipboardCheck, label: "IDO Final Review", tone: "warning" },
	UNDER_FINAL_DIRECTOR_REVIEW: { icon: Gavel, label: "Final Review", tone: "warning" },
	APPROVED: { icon: CheckCircle2, label: "Approved", tone: "success" },
	FOR_NEXT_YEAR_PPMP: { icon: CalendarClock, label: "For Next Year PPMP", tone: "accent" },
	REJECTED_BY_IDO: { icon: XCircle, label: "Rejected by IDO", tone: "danger" },
	BUDGET_OFFICER_REJECTED: { icon: XCircle, label: "Budget Rejected", tone: "danger" },
	DIRECTOR_REJECTED: { icon: XCircle, label: "Director Rejected", tone: "danger" },
	IDO_FINAL_REJECTED: { icon: XCircle, label: "IDO Final Rejected", tone: "danger" },
	// "Director Final Rejected", not "Final Rejected": IDO_FINAL_REJECTED sits
	// right above it, and two statuses both reading "Final Rejected" is what this
	// label was fixed to stop. Do not shorten it.
	FINAL_REJECTED: { icon: XCircle, label: "Director Final Rejected", tone: "danger" },
	COMPLETED: { icon: CircleCheckBig, label: "Completed", tone: "success" },
};

/** Every master status as a select option, in lifecycle order. */
export const MASTER_STATUS_OPTIONS = Object.entries(masterStatusMap).map(([value, { label }]) => ({
	value,
	label,
}));

/** The IDO officer's own verdict at the first review stage. */
export const idoEvaluationStatusMap: Record<string, StatusMapEntry> = {
	RECOMMENDED_BY_IDO: { icon: CheckCircle2, label: "Recommended by IDO", tone: "success" },
	RETURNED_TO_REQUESTOR: { icon: Undo2, label: "Returned to Requestor", tone: "warning" },
	REJECTED_BY_IDO: { icon: XCircle, label: "Rejected by IDO", tone: "danger" },
	FOR_NEXT_YEAR_PPMP: { icon: CalendarClock, label: "For Next Year PPMP", tone: "accent" },
};

/**
 * What a list filter offers - deliberately coarser than `masterStatusMap`.
 * Fifteen statuses is the right vocabulary for a chip and the wrong one for a
 * dropdown; a requestor filters by "Under Review", not by which of the four
 * review desks currently holds it.
 */
export const FILTER_OPTIONS = [
	{ label: "Draft", value: "DRAFT" },
	{ label: "Returned by IDO", value: "RETURNED" },
	{ label: "Under Review", value: "PENDING" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Rejected", value: "REJECTED" },
	{ label: "Completed", value: "COMPLETED" },
];
