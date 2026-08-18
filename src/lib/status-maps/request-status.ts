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

/**
 * In flight - somebody else is holding it and the requestor is waiting.
 *
 * DRAFT and RETURNED are deliberately NOT here: both are on the requestor's own
 * desk, and counting them as "under review" tells a user to wait for a reply to
 * something they have not sent.
 */
export const PENDING_STATUSES = [
	"SUBMITTED",
	"UNDER_IDO_REVIEW",
	"UNDER_DIRECTOR_REVIEW",
	"UNDER_IDO_FINAL_REVIEW",
	"UNDER_FINAL_DIRECTOR_REVIEW",
] as const;

/** The five terminal noes. Which desk said it does not change what it means. */
export const REJECTED_STATUSES = [
	"REJECTED_BY_IDO",
	"BUDGET_OFFICER_REJECTED",
	"DIRECTOR_REJECTED",
	"IDO_FINAL_REJECTED",
	"FINAL_REJECTED",
] as const;

/**
 * The only two statuses in which a requestor may still change the text.
 *
 * DRAFT has never been sent; RETURNED has been sent back to be fixed. Every
 * other status means somebody else is reading it, and letting a requestor edit
 * then would change the document under the desk that is reviewing it. Both the
 * server guards (`request.saveDraft`, `request.submit`) and the form's read-only
 * mode read this list, so the button and the gate cannot disagree about which
 * request is editable.
 */
export const EDITABLE_STATUSES = ["DRAFT", "RETURNED"] as const;

/** `undefined` is a request that does not exist yet - the create page - which is
 *  editable by definition. */
export function isEditableStatus(masterStatus?: string | null): boolean {
	if (!masterStatus) return true;

	return (EDITABLE_STATUSES as readonly string[]).includes(masterStatus);
}

/**
 * The two `FILTER_OPTIONS` values that are not a literal status, and what each
 * expands to.
 *
 * This is the single place that expansion is written down, and both halves of
 * the app read it from here: the query builds its `masterStatus IN (…)` from it,
 * and the counter tiles send the same key back. Written twice they drift, and
 * the failure is silent - a tile reading 5 over a table showing 4, with nothing
 * on screen saying which is wrong.
 *
 * A key absent from here is passed through as a literal status, so `DRAFT`,
 * `APPROVED`, `RETURNED` and `COMPLETED` need no entry.
 */
export const STATUS_GROUPS: Record<string, readonly string[]> = {
	PENDING: PENDING_STATUSES,
	REJECTED: REJECTED_STATUSES,
};
