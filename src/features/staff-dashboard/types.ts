/**
 * One row of the staff queue.
 *
 * It mirrors `STAFF_ROW_SELECT` in `request.router.ts`, not the Prisma `Request`
 * model - the query sends nine fields, and a type promising the other twenty-odd
 * would let a cell reach for one that never arrives.
 *
 * The last two are NOT rendered anywhere. They are the request's stage, and
 * `resolveReviewRoute` reads them to decide where a row click goes.
 */
export interface StaffRequestRow {
	createdAt: Date;
	/** `null` only on a draft, which never reaches a staff queue. */
	documentNumber: string | null;
	/** Set once the director's FINAL approval stage has begun. */
	finalDirectorStatus: string | null;
	id: string;
	/** Set once the IDO chairperson's final review stage has begun. */
	idoFinalStatus: string | null;
	masterStatus: string;
	priority: string;
	title: string;
	typeOfRequest: string;
}

/**
 * The two counters, and the two halves of the queue.
 *
 * They partition the role's scope: `waiting + handled` is everything the desk
 * can see, which is what lets the count line above the table say how many are in
 * scope without a third query.
 */
export interface StaffQueueCounts {
	handled: number;
	waiting: number;
}

/**
 * What a counter tile puts in the URL's `stage`.
 *
 * `null` is neither tile pressed - the whole queue. The server expands each key
 * per role (`STAFF_WAITING_SCOPE`), because "waiting on you" means a different
 * set of statuses at every desk and only the session knows which desk is asking.
 */
export type StageKey = "handled" | "waiting" | null;
