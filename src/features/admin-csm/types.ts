/**
 * One row of the satisfaction report.
 *
 * It mirrors what `toRow` returns in `admin-csm.router.ts` rather than the
 * Prisma `Csm` model, and the difference is the point: the router flattens the
 * request and its owner into four identifying fields, so nothing in this feature
 * can reach for a column of the request that was never meant to leave the
 * server. See the note at the top of that router for where that boundary is
 * drawn and why an ADMIN sits on this side of it.
 *
 * `rating` and `submittedAt` are both nullable and they are NOT redundant:
 * `submittedAt === null` is a form nobody has answered, while a `submittedAt`
 * with no rating is one answered under the old acknowledgement contract. Only
 * `submittedAt` may be read as "has this been filled in".
 */
export interface AdminCsmRow {
	comment: string | null;
	createdAt: Date;
	documentNumber: string | null;
	id: string;
	rating: number | null;
	requestId: string;
	requestTitle: string;
	requestorEmail: string;
	requestorName: string;
	submittedAt: Date | null;
}

/**
 * The figures above the table, over every record rather than the filtered page.
 *
 * Three counts because "how many" has three honest answers - see the note on
 * `adminCsm.summary`. `average` is over `rated` alone, and is `0` when nothing
 * has been rated, which the tile renders as its unrated state rather than as a
 * score.
 */
export interface AdminCsmSummaryData {
	average: number;
	awaiting: number;
	/** Ratings per star, lowest first: `[1★, 2★, 3★, 4★, 5★]`. */
	distribution: number[];
	rated: number;
	submitted: number;
	unrated: number;
}
