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
	ShieldCheck,
	Undo2,
	Wallet,
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
 * The statuses in which the request is still SITTING on a bad answer.
 *
 * It is what decides whether the detail page shows the reviewer's note at all,
 * and the reason is the resubmit: a request returned in March, fixed and sent
 * back is under review again, and a banner still repeating March's complaint
 * describes a document that no longer exists. Reading the current status rather
 * than the presence of a returned audit entry is what makes the notice
 * disappear the moment the request moves on - the entry stays in the log
 * forever, which is the point of a log.
 */
export const NEGATIVE_STATUSES = ["RETURNED", "FOR_NEXT_YEAR_PPMP", ...REJECTED_STATUSES] as const;

export function isNegativeStatus(masterStatus?: string | null): boolean {
	if (!masterStatus) return false;

	return (NEGATIVE_STATUSES as readonly string[]).includes(masterStatus);
}

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
 * The two statuses in which the FIRST IDO desk may still act.
 *
 * `SUBMITTED` is a request nobody has picked up; `UNDER_IDO_REVIEW` is one an
 * officer has. Every other status means the request has left this desk, and the
 * four review procedures (spec 010) refuse it - which is what stops a second
 * officer recommending a request the first one already rejected.
 *
 * It sits beside `EDITABLE_STATUSES` for the same reason that list does: the
 * server guard and the read-only branch of the review page both read it, so the
 * button and the gate cannot disagree about which request is actionable.
 */
export const IDO_ACTIONABLE_STATUSES = ["SUBMITTED", "UNDER_IDO_REVIEW"] as const;

/** `undefined`/`null` is NOT actionable - unlike `isEditableStatus`, which treats
 *  an absent status as the create page. A request with no status is not one an
 *  IDO officer can recommend. */
export function isIdoActionableStatus(masterStatus?: string | null): boolean {
	if (!masterStatus) return false;

	return (IDO_ACTIONABLE_STATUSES as readonly string[]).includes(masterStatus);
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

/**
 * The `directorReviewStatus` column - the sub-stage `masterStatus` deliberately
 * cannot express.
 *
 * `masterStatus` reads `UNDER_DIRECTOR_REVIEW` for BOTH the budget desk and the
 * director's own desk, because the requestor is told "the approvers have it" and
 * nothing finer. Which of the two actually holds it lives here, and every guard
 * at either stage reads this column rather than the headline one - reading
 * `masterStatus` would make the two stages indistinguishable and let a budget
 * officer act after the director has finished.
 *
 * `UNDER_BUDGET_OFFICER_REVIEW` has no `masterStatus` twin at all, which is why
 * it is absent from `masterStatusMap` and why a chip for this stage has to come
 * from here.
 */
export const directorReviewStatusMap: Record<string, StatusMapEntry> = {
	UNDER_BUDGET_OFFICER_REVIEW: { icon: Wallet, label: "Budget Review", tone: "warning" },
	UNDER_DIRECTOR_REVIEW: { icon: Gavel, label: "Director Review", tone: "warning" },
	BUDGET_OFFICER_REJECTED: { icon: XCircle, label: "Budget Rejected", tone: "danger" },
	DIRECTOR_APPROVED: { icon: CheckCircle2, label: "Approved by Director", tone: "success" },
	DIRECTOR_REJECTED: { icon: XCircle, label: "Director Rejected", tone: "danger" },
};

/**
 * The ONE `directorReviewStatus` in which the budget desk may still act.
 *
 * A single value rather than a list, and that is the pair spec 011 names: this
 * accepts only `UNDER_BUDGET_OFFICER_REVIEW`, while the director's own approval
 * (spec 012) accepts that value OR `UNDER_DIRECTOR_REVIEW`. The asymmetry is
 * what encodes the intended race - the director may approve past an open budget
 * stage, and the budget officer may not act once the director has. Widening
 * either side breaks the other.
 */
export const BUDGET_ACTIONABLE_DIRECTOR_STATUS = "UNDER_BUDGET_OFFICER_REVIEW";

/** `null` - a request that never reached the approvers - is NOT actionable. */
export function isBudgetActionableStatus(directorReviewStatus?: string | null): boolean {
	return directorReviewStatus === BUDGET_ACTIONABLE_DIRECTOR_STATUS;
}

/**
 * The two `directorReviewStatus` values in which the Campus Director may
 * APPROVE - and the one in which they may REJECT.
 *
 * ## The asymmetry is the rule, not an oversight
 *
 * This is the single most fragile rule in the workflow and the spec says so.
 * Approving accepts `UNDER_BUDGET_OFFICER_REVIEW` as well as
 * `UNDER_DIRECTOR_REVIEW`, so the director can approve past an open budget
 * stage and end it without a budget approval - the documented two-scenario
 * routing, budget-then-director or director alone. Rejecting accepts only
 * `UNDER_DIRECTOR_REVIEW`, so a request cannot be KILLED at a stage it has not
 * reached: while the budget officer still holds it, the director has not been
 * asked the question yet, and a rejection would end a request the desk before
 * them might still have stopped for a reason of its own.
 *
 * A refactor that folds these two into one list, or one predicate with a
 * parameter defaulted to the wider set, breaks the documented behaviour in the
 * direction nothing on screen would report. They are two constants on purpose.
 *
 * The pair also has to hold with `BUDGET_ACTIONABLE_DIRECTOR_STATUS` above it:
 * the budget desk acts only at `UNDER_BUDGET_OFFICER_REVIEW`, so once the
 * director has approved from there, the budget desk's own guard refuses. That
 * is the intended race, and it is decided by whichever transaction commits
 * first.
 */
export const DIRECTOR_APPROVABLE_STATUSES = ["UNDER_BUDGET_OFFICER_REVIEW", "UNDER_DIRECTOR_REVIEW"] as const;

/** The ONE status a director may reject from. Deliberately narrower than
 *  `DIRECTOR_APPROVABLE_STATUSES` - see the note there. */
export const DIRECTOR_REJECTABLE_STATUS = "UNDER_DIRECTOR_REVIEW";

/** `null` - a request that never reached the approvers - is NOT approvable. */
export function isDirectorApprovableStatus(directorReviewStatus?: string | null): boolean {
	if (!directorReviewStatus) return false;

	return (DIRECTOR_APPROVABLE_STATUSES as readonly string[]).includes(directorReviewStatus);
}

/** Narrower than `isDirectorApprovableStatus` on purpose. The page HIDES Reject
 *  where this is false and Approve is true, because there is nothing the
 *  director can do to enable it. */
export function isDirectorRejectableStatus(directorReviewStatus?: string | null): boolean {
	return directorReviewStatus === DIRECTOR_REJECTABLE_STATUS;
}

/**
 * The `idoFinalStatus` column - the IDO Chairperson's own stage.
 *
 * A THIRD status vocabulary beside `masterStatus` and `directorReviewStatus`,
 * and it earns its place the same way that one did: `masterStatus` reads
 * `UNDER_IDO_FINAL_REVIEW` while the chairperson holds the request and
 * `UNDER_FINAL_DIRECTOR_REVIEW` once they have signed, so it can say where the
 * request IS but never what this desk DECIDED. `IDO_FINAL_APPROVED` has no
 * `masterStatus` twin at all - the headline moves to the director's stage
 * instead - which is why a chip for this desk has to come from here.
 *
 * It is also what tells the chairperson's two appearances apart. They review at
 * the first stage as well, and `resolveReviewRoute` keys on the PRESENCE of this
 * column to decide which of their two pages a queue row opens.
 */
export const idoFinalStatusMap: Record<string, StatusMapEntry> = {
	UNDER_IDO_FINAL_REVIEW: { icon: ClipboardCheck, label: "IDO Final Review", tone: "warning" },
	IDO_FINAL_APPROVED: { icon: CheckCircle2, label: "Approved by IDO", tone: "success" },
	IDO_FINAL_REJECTED: { icon: XCircle, label: "IDO Final Rejected", tone: "danger" },
};

/**
 * The ONE `idoFinalStatus` in which the chairperson may act.
 *
 * Written by the DIRECTOR's approval (`approveByDirector`), never here - which
 * is the coupling to watch: move that write and this stage's guard has nothing
 * left to match, and the symptom is a queue that fills with requests no
 * procedure will accept.
 *
 * A single value rather than a list, unlike `DIRECTOR_APPROVABLE_STATUSES`.
 * There is no race at this stage - one desk holds the request and the two
 * outcomes are both terminal for it - so both procedures read the same constant
 * and the approval's extra guard is the signature rather than a second status.
 */
export const IDO_FINAL_ACTIONABLE_STATUS = "UNDER_IDO_FINAL_REVIEW";

/** `null` - a request that has not reached the chairperson's final desk - is NOT
 *  actionable. */
export function isIdoFinalActionableStatus(idoFinalStatus?: string | null): boolean {
	return idoFinalStatus === IDO_FINAL_ACTIONABLE_STATUS;
}

/**
 * The `finalDirectorStatus` column - the Campus Director's SECOND appearance.
 *
 * A FOURTH status vocabulary, and it is the one that carries the most weight in
 * the app: `finalDirectorStatus === "APPROVED"` is the gate the printed form's
 * signatures hang on (spec 016), not `masterStatus`. Both are set by the same
 * approval, so today they agree - but they are read by different code for
 * different questions, and a future change that moves one without the other
 * silently releases or withholds every signature on the document.
 *
 * It earns its place the same way the three columns above it do.
 * `masterStatus` reads `UNDER_FINAL_DIRECTOR_REVIEW` while this desk holds the
 * request and `APPROVED` once it has signed, so it can say where the request IS
 * but never which of the director's TWO decisions produced it - the first
 * approval writes `directorReviewStatus` and this one writes this column, and
 * that separation is the only thing telling their two stages apart.
 * `resolveReviewRoute` keys on the PRESENCE of this column to decide which of
 * the director's two pages a queue row opens.
 *
 * `FINAL_REJECTED` keeps the label `masterStatusMap` fixed for it - "Director
 * Final Rejected", never "Final Rejected" - because `IDO_FINAL_REJECTED` is the
 * chairperson's terminal no and the two must not read alike.
 */
export const finalDirectorStatusMap: Record<string, StatusMapEntry> = {
	UNDER_FINAL_DIRECTOR_APPROVAL: { icon: ShieldCheck, label: "Final Approval", tone: "warning" },
	APPROVED: { icon: CheckCircle2, label: "Approved", tone: "success" },
	FINAL_REJECTED: { icon: XCircle, label: "Director Final Rejected", tone: "danger" },
};

/**
 * The ONE `finalDirectorStatus` in which the Campus Director may give the final
 * approval.
 *
 * Written by the CHAIRPERSON's approval (`idoFinalApprove`), never here - the
 * same coupling `IDO_FINAL_ACTIONABLE_STATUS` documents one stage earlier. Move
 * that write and this stage's guard has nothing left to match, and the symptom
 * is a director's queue that fills with requests no procedure will accept.
 *
 * A single value, and both procedures read it - unlike the director's FIRST
 * approval, whose approve and reject guards are deliberately different widths.
 * There is no race at this stage: one desk holds the request, both outcomes are
 * terminal for the whole workflow, and the approval's extra guard is the
 * signature rather than a second status.
 */
export const FINAL_DIRECTOR_ACTIONABLE_STATUS = "UNDER_FINAL_DIRECTOR_APPROVAL";

/** `null` - a request that has not reached the final approval - is NOT
 *  actionable. So is `"APPROVED"`: this stage is over and nothing re-opens it. */
export function isFinalDirectorActionableStatus(finalDirectorStatus?: string | null): boolean {
	return finalDirectorStatus === FINAL_DIRECTOR_ACTIONABLE_STATUS;
}
