import type { UserRole } from "@/utils/config";
import type { StaffRequestRow } from "../types";

/**
 * The stage columns a destination depends on. A `StaffRequestRow` satisfies it.
 *
 * A `Pick` rather than the whole row, for one reason: this is the only piece of
 * workflow reasoning in the app's navigation, and it has to be testable by
 * handing it two nullable strings. Requiring a full row would mean every case
 * built a title, a priority and a date that change nothing about the answer.
 */
type StageOf = Pick<StaffRequestRow, "finalDirectorStatus" | "id" | "idoFinalStatus">;

/**
 * Where a row click goes - the only navigation in the app that has to reason
 * about the workflow.
 *
 * ## Two roles, two destinations each
 *
 * The chairperson reviews at the first IDO stage AND at the final one; the
 * director approves once early and once at the end. Their queues therefore hold
 * requests bound for two different pages, and the ROLE alone cannot say which:
 * only the request can.
 *
 * ## Why the stage column and not `masterStatus`
 *
 * A director whose request has moved on to IDO-final still carries
 * `directorReviewStatus: DIRECTOR_APPROVED`, and its `masterStatus` reads
 * `UNDER_IDO_FINAL_REVIEW` - a status that names somebody else's desk entirely.
 * Keying on the PRESENCE of the stage column asks the only question that matters
 * ("has my final stage begun for this request?"); keying on `masterStatus` sends
 * the director to a page that will refuse them.
 *
 * ## Read-only is the destination's job
 *
 * A request the desk has already finished with stays in the queue as history and
 * still resolves to its review page. That page must render read-only rather than
 * throw - the alternative is IRMS-old's "Request is not available for IDO
 * review", shown to somebody who clicked a row the app itself put in front of
 * them.
 *
 * Returns a path string rather than a typed `to`, because these five pages ship
 * in specs 010-014 and a typed route cannot name a route that does not exist
 * yet. The caller navigates with `href`.
 */
export function resolveReviewRoute(role: UserRole, request: StageOf): string {
	const base = `/requests/${request.id}`;

	switch (role) {
		case "BUDGET_OFFICER":
			// One stage, one destination. A budget officer never sees anything else.
			return `${base}/budget-review`;
		case "DIRECTOR":
			return request.finalDirectorStatus ? `${base}/final-director-approval` : `${base}/director-review`;
		case "IDO_CHAIRPERSON":
			return request.idoFinalStatus ? `${base}/final-review` : `${base}/review`;
		default:
			// IDO_OFFICER, and the only role left that this queue can hold. USER and
			// ADMIN never reach here - the route gate and `staffList` both refuse
			// them - so falling through to the first-stage review page is the right
			// answer for the one role remaining rather than a guess.
			return `${base}/review`;
	}
}
