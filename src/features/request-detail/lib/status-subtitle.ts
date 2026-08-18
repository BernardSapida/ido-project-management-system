/**
 * What the page says under the title, in the requestor's words rather than the
 * system's.
 *
 * The status chip already prints the status. Repeating it here as a sentence -
 * "Status: Under IDO Final Review" - spends the one line under the heading
 * saying the thing the chip beside it just said. What the chip cannot say is
 * whose desk it is on and whether the reader has to do anything, and that is
 * what these are for.
 *
 * A status with no entry falls back to `undefined`, and `AppPageHeader` then
 * renders no subtitle at all - which is the right failure. A sentence invented
 * for an unknown status would be a guess about a stage nobody has written yet.
 */
const SUBTITLE_BY_STATUS: Record<string, string> = {
	APPROVED: "Approved. The work can go ahead.",
	BUDGET_OFFICER_REJECTED: "Rejected at the budget stage — see the note below.",
	COMPLETED: "Completed and closed. Thank you for the feedback.",
	DIRECTOR_REJECTED: "Rejected by the Campus Director — see the note below.",
	DRAFT: "This request is a draft and has not been submitted yet.",
	FINAL_REJECTED: "Rejected by the Campus Director at final approval — see the note below.",
	FOR_NEXT_YEAR_PPMP: "Valid, but this year's budget is committed — it has been carried to next year's PPMP.",
	IDO_FINAL_REJECTED: "Rejected at the IDO final review — see the note below.",
	REJECTED_BY_IDO: "Rejected by IDO — see the note below.",
	RETURNED: "This request was returned by IDO — update it and resubmit.",
	SUBMITTED: "Submitted to IDO. It is waiting to be picked up for review.",
	UNDER_DIRECTOR_REVIEW: "Under review by the Campus Director.",
	UNDER_FINAL_DIRECTOR_REVIEW: "With the Campus Director for final approval.",
	UNDER_IDO_FINAL_REVIEW: "Under final review by the IDO Chairperson.",
	UNDER_IDO_REVIEW: "Under review by the IDO.",
};

export function requestStatusSubtitle(masterStatus: string): string | undefined {
	return SUBTITLE_BY_STATUS[masterStatus];
}
