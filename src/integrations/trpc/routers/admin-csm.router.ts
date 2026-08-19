import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import {
	adminCsmDetailSchema,
	adminCsmListSchema,
	parseRatingFilter,
} from "@/features/admin-csm/validations/schema/admin-csm.schema";
import { CSM_MAX_RATING } from "@/features/csm/validations/schema/submit-csm.schema";
import { prisma } from "@/lib/prisma";
import type { CsmWhereInput } from "../../../../prisma/generated/models.ts";
import { adminProcedure } from "../init";

/**
 * The satisfaction report: every answered form in one place, which spec 015 left
 * out of scope because nothing read the ratings yet.
 *
 * ## Why an administrator may read this and NOT the requests
 *
 * `request-access.ts` leaves ADMIN out of `REQUEST_READER_ROLES` on purpose -
 * they manage accounts, they hold no review grant, and the role that can reset
 * anybody's password must not also be the role that reads everybody's requests.
 * None of that reasoning covers the measure of how the office performed, which
 * is an administrative figure and belongs to whoever runs the office.
 *
 * So this router serves the CSM columns plus ENOUGH OF THE REQUEST TO IDENTIFY
 * ONE - its document number, its title and who filed it - and nothing else. The
 * `select` below is that boundary, and it is an ALLOW-list for the reason
 * `ACCOUNT_ROW_SELECT` is one: a column added to `Request` later cannot arrive
 * here by being added upstream.
 *
 * There is deliberately no procedure here that returns `details`,
 * `justification`, `attachments`, a signature or a comment thread, and no link
 * from these screens into a request. `request.getById` would refuse an ADMIN
 * anyway, and a control whose only possible answer is FORBIDDEN is worse than
 * no control at all.
 *
 * Everything here is an `adminProcedure`. Not one resolver falls back to an
 * inline `ctx.user.role !== "ADMIN"`, for the reason `roleProcedure` documents:
 * an inline check is correct until the next procedure is added without it, and
 * nothing in the type system notices.
 */

/**
 * One row of the report: the whole `Csm` record, and four identifying fields
 * from the request behind it.
 *
 * `comment` is in the ROW select rather than fetched per record on the detail
 * screen. It is capped at 1000 characters by the schema that writes it, ten of
 * them is a small payload, and the first line of one is what tells an admin
 * which record is worth opening.
 */
const CSM_ROW_SELECT = {
	comment: true,
	createdAt: true,
	id: true,
	rating: true,
	submittedAt: true,
	request: {
		select: {
			documentNumber: true,
			finalTitle: true,
			id: true,
			title: true,
			user: { select: { email: true, name: true } },
		},
	},
} as const;

interface CsmRowPayload {
	comment: string | null;
	createdAt: Date;
	id: string;
	rating: number | null;
	submittedAt: Date | null;
	request: {
		documentNumber: string | null;
		finalTitle: string | null;
		id: string;
		title: string;
		user: { email: string; name: string };
	};
}

/**
 * The nested payload flattened into the row the table renders.
 *
 * Here rather than in the component, because a column that reads
 * `row.request.user.name` is a column that breaks the moment the query changes
 * shape - and a satisfaction table has no business knowing that a CSM hangs off
 * a request which hangs off a user.
 *
 * `finalTitle ?? title` is the precedence the request detail page uses: IDO may
 * retitle a request, and the final title is the one the document carries.
 */
function toRow(row: CsmRowPayload) {
	return {
		comment: row.comment,
		createdAt: row.createdAt,
		documentNumber: row.request.documentNumber,
		id: row.id,
		rating: row.rating,
		requestId: row.request.id,
		requestTitle: row.request.finalTitle ?? row.request.title,
		requestorEmail: row.request.user.email,
		requestorName: row.request.user.name,
		submittedAt: row.submittedAt,
	};
}

/** `undefined` rather than `""`, so an empty search never becomes a filter. */
function trimmed(value: string | undefined): string | undefined {
	const next = value?.trim();

	return next ? next : undefined;
}

export const adminCsmRouter = {
	/**
	 * One page of the report.
	 *
	 * ## The order, and why `nulls: "last"`
	 *
	 * Answered first and newest first, with the forms nobody has filled in yet at
	 * the bottom. `submittedAt` is null on every one of those, and Postgres sorts
	 * nulls FIRST on a descending order - which would open the report on a page of
	 * blank rows and bury the thing it exists to show.
	 *
	 * `createdAt` breaks the tie, and it is what orders the awaiting rows among
	 * themselves: the oldest unanswered form is the one worth chasing.
	 */
	list: adminProcedure.input(adminCsmListSchema).query(async ({ input }) => {
		const { page, pageSize } = input;
		const search = trimmed(input.search);
		const rating = parseRatingFilter(input.rating);

		// An AND of conditions rather than one spread object, so a search term can
		// never overwrite the rating or status clause beside it.
		const conditions: CsmWhereInput[] = [];

		if (rating) conditions.push({ rating });

		// A `status` outside the two known values is ignored rather than refused,
		// which is what a hand-edited query string deserves: the table renders
		// unfiltered instead of throwing an error boundary over a typo.
		if (input.status === "submitted") conditions.push({ submittedAt: { not: null } });
		if (input.status === "awaiting") conditions.push({ submittedAt: null });

		if (search) {
			conditions.push({
				request: {
					OR: [
						{ documentNumber: { contains: search, mode: "insensitive" } },
						{ title: { contains: search, mode: "insensitive" } },
						{ finalTitle: { contains: search, mode: "insensitive" } },
						{ user: { name: { contains: search, mode: "insensitive" } } },
						{ user: { email: { contains: search, mode: "insensitive" } } },
					],
				},
			});
		}

		const where = conditions.length ? { AND: conditions } : {};

		const [items, total] = await prisma.$transaction([
			prisma.csm.findMany({
				orderBy: [{ submittedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
				select: CSM_ROW_SELECT,
				skip: (page - 1) * pageSize,
				take: pageSize,
				where,
			}),
			prisma.csm.count({ where }),
		]);

		return { items: items.map(toRow), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
	}),

	/**
	 * The figures above the table, over EVERY record rather than the current page.
	 *
	 * A separate procedure from `list` for the reason `staffSummary` is separate
	 * from `staffList`: "how satisfied is the office" and "which records match
	 * these filters" are two questions. Folding the first into the second would
	 * recompute the average on every page turn and, worse, make it the average of
	 * whatever happened to be filtered - a number that moves when you search.
	 *
	 * ## Three counts, because "how many" has three honest answers
	 *
	 * `rated` is the denominator of the average and the only one that belongs
	 * under it. `unrated` is the rows answered under the old acknowledgement
	 * contract, which carry a `submittedAt` and no rating (see the note on the
	 * model) - counting those in would drag the average towards a score nobody
	 * gave. `awaiting` is the forms still out, the one figure here that is about
	 * work rather than about satisfaction.
	 */
	summary: adminProcedure.query(async () => {
		/*
		 * The breakdown as one COUNT per star rather than a `groupBy`.
		 *
		 * A `groupBy` is the obvious query and it is the wrong one here for two
		 * reasons. It returns only the stars somebody has actually given, so a
		 * score nobody has ever used comes back missing rather than as a zero - and
		 * an array built from those rows would shift the whole breakdown one star to
		 * the left and say nothing about it. And its `_count` shape does not survive
		 * `$transaction`'s tuple typing, which leaves the distribution typed as
		 * something other than the numbers it plainly is.
		 *
		 * Five indexed counts inside the transaction the other three are already in
		 * costs nothing and is exact. Built FROM the scale, so a sixth star is one
		 * edit in one place.
		 */
		const perStar = Array.from({ length: CSM_MAX_RATING }, (_, index) =>
			prisma.csm.count({ where: { rating: index + 1 } }),
		);

		const [awaiting, submitted, aggregate, ...distribution] = await prisma.$transaction([
			prisma.csm.count({ where: { submittedAt: null } }),
			prisma.csm.count({ where: { submittedAt: { not: null } } }),
			prisma.csm.aggregate({ _avg: { rating: true }, _count: { rating: true }, where: { rating: { not: null } } }),
			...perStar,
		]);

		const rated = aggregate._count.rating;

		return {
			/*
			 * The average of nothing is not zero - zero stars reads as the worst score
			 * possible for an office nobody has rated yet. `AppRatingSummary` draws
			 * its own unrated state from `count`, so the value beside it only has to
			 * be a number it will not print.
			 */
			average: aggregate._avg.rating ?? 0,
			awaiting,
			distribution,
			rated,
			submitted,
			unrated: submitted - rated,
		};
	}),

	/**
	 * One record in full.
	 *
	 * Returns rows that have NOT been answered as well, deliberately: an admin who
	 * opened a row from the table has to be told what it is, rather than sent to a
	 * NOT_FOUND for a record that plainly exists in the list behind them. The page
	 * draws the awaiting state from `submittedAt` - the flag the model documents
	 * as the answer to "has this been filled in", never the presence of a rating.
	 */
	getById: adminProcedure.input(adminCsmDetailSchema).query(async ({ input }) => {
		const csm = await prisma.csm.findUnique({
			select: CSM_ROW_SELECT,
			where: { id: input.csmId },
		});

		if (!csm) throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found" });

		return toRow(csm);
	}),
} satisfies TRPCRouterRecord;
