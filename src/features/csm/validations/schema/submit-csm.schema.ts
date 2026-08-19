import { z } from "zod";

/** The scale, in one place. The stars, the schema and the copy all count to it,
 *  and a five that disagreed with a control drawing four would be invisible
 *  until somebody rated the top and was told it was out of range. */
export const CSM_MAX_RATING = 5;

/** The cap on the optional comment. Exported so the field can count against the
 *  same number the parse refuses on. */
export const CSM_COMMENT_MAX_LENGTH = 1000;

/**
 * The rating, and why it is required.
 *
 * A satisfaction form whose satisfaction measure is optional collects nothing -
 * the submission would then say only that the requestor pressed a button, which
 * is exactly the acknowledgement this spec replaced. `.int()` is not pedantry
 * either: the control emits whole stars, so a fractional value can only have
 * come from a hand-built payload, and `Csm.rating` is an `Int` column that would
 * reject it one layer later with a Prisma error nobody can read.
 *
 * `0` is the control's UNRATED value, which is why the message reads "Please
 * choose a rating" rather than "must be at least 1": zero stars is not a low
 * score, it is an unanswered question.
 */
export const csmRatingSchema = z.number().int().min(1, "Please choose a rating").max(CSM_MAX_RATING);

/**
 * The optional comment.
 *
 * `.trim()` before the cap, the same order `commentMessageSchema` uses - and
 * here it also decides what "optional" means: whitespace survives `.optional()`,
 * so a box the user tabbed through and left with a stray newline would be stored
 * as a comment. `submitCsm` maps the empty string to `null` on the way in.
 */
export const csmCommentSchema = z
	.string()
	.trim()
	.max(CSM_COMMENT_MAX_LENGTH, `Limited to ${CSM_COMMENT_MAX_LENGTH} characters`)
	.optional();

/**
 * What the browser sends and what `csm.submitCsm` parses. One schema, both
 * sides - the client is told sooner, it is not trusted to have checked.
 */
export const submitCsmSchema = z.object({
	comment: csmCommentSchema,
	rating: csmRatingSchema,
	requestId: z.string().min(1, "Request ID is required"),
});

/**
 * The FORM's own shape: the same two answers without `requestId`.
 *
 * The request id is a route param, not something anybody types, and putting it
 * in the form would mean a hidden field that could be edited to submit feedback
 * against another request - which `submitCsm` refuses on ownership, but it has
 * no business being offered in the first place. `CsmForm` takes it as a prop and
 * the mutation adds it.
 */
export const csmFormSchema = submitCsmSchema.omit({ requestId: true });

export type SubmitCsmInput = z.infer<typeof submitCsmSchema>;
export type CsmFormValues = z.infer<typeof csmFormSchema>;

/** The read query's input. Inline in the router would do; it is here so both
 *  procedures' shapes live beside each other. */
export const csmForRequestSchema = z.object({
	requestId: z.string().min(1, "Request ID is required"),
});
