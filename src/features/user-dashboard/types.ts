/**
 * One row of the requestor's list.
 *
 * It mirrors `REQUEST_ROW_SELECT` in `request.router.ts` rather than the Prisma
 * `Request` model - the query sends six columns and an id, and a type promising
 * the other twenty-five would let a cell reach for a field that never arrives.
 */
export interface RequestRow {
	createdAt: Date;
	/** `null` on a draft: a number is issued at submit, not at creation. */
	documentNumber: string | null;
	id: string;
	masterStatus: string;
	priority: string;
	title: string;
	typeOfRequest: string;
}

/** The four counters. See `request.mySummary` for why they do not add up. */
export interface RequestSummary {
	approved: number;
	pending: number;
	rejected: number;
	total: number;
}

/**
 * What the counter tiles put in the URL's `status`.
 *
 * `null` is the Total tile - no filter at all - and the three others are values
 * `FILTER_OPTIONS` also offers, so a press on a tile and a pick in the dropdown
 * are the same edit to the same piece of state.
 */
export type StatusGroupKey = "APPROVED" | "PENDING" | "REJECTED" | null;
