import { z } from "zod";
import { CSM_MAX_RATING } from "@/features/csm/validations/schema/submit-csm.schema";

/**
 * The two states a `Csm` row can be in, as the filter names them.
 *
 * They are derived from `submittedAt` and never stored: a row is created empty
 * by the final director's approval (spec 014) and stays "awaiting" until the
 * requestor answers. A third value would be inventing a state the column cannot
 * express.
 */
export const CSM_STATUS_VALUES = ["submitted", "awaiting"] as const;

export type CsmStatusValue = (typeof CSM_STATUS_VALUES)[number];

/**
 * What the admin list accepts. Every filter is optional and every one of them
 * arrives from the URL, which is why none of them is an enum: a hand-edited
 * `?rating=nonsense` has to land on something rather than replacing the screen
 * with an error boundary, and the resolver decides what "something" is.
 */
export const adminCsmListSchema = z.object({
	page: z.number().int().min(1).default(1),
	// Capped, not merely defaulted - the same reason `request.myList` caps it.
	// Without the max a caller asks for 100000 and turns a paginated endpoint into
	// a full table scan it will happily serve.
	pageSize: z.number().int().min(1).max(100).default(10),
	rating: z.string().optional(),
	search: z.string().optional(),
	status: z.string().optional(),
});

/** One record, by its own id rather than the request's - the admin arrives from
 *  a row in the table, and the row IS the `Csm`. */
export const adminCsmDetailSchema = z.object({
	csmId: z.string().min(1, "Feedback ID is required"),
});

/**
 * A `rating` query parameter as the WHERE clause sees it: a whole star inside
 * the scale, or nothing at all.
 *
 * `undefined` rather than a clause that matches nothing, which is the opposite
 * of what `adminAccounts.listAllUsers` does with a bad `role` - and deliberately
 * so. `rating` is an `Int` column, so a non-numeric value cannot be handed to
 * Prisma as a filter at all; it would arrive as `NaN` and fail the query rather
 * than empty the table. Ignoring it is the only answer that still renders.
 */
export function parseRatingFilter(value: string | undefined): number | undefined {
	if (!value) return undefined;

	const rating = Number(value);

	if (!Number.isInteger(rating) || rating < 1 || rating > CSM_MAX_RATING) return undefined;

	return rating;
}

export type AdminCsmListInput = z.infer<typeof adminCsmListSchema>;
