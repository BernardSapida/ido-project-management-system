import { z } from "zod";

/**
 * The IDO Chairperson's two inputs at the final review.
 *
 * ## Why the title is OPTIONAL here and required at the first review
 *
 * `idoRecommendSchema` demands a final title because that stage is where one is
 * set - the request arrives carrying only the requestor's wording. By the time
 * it reaches this desk a final title already exists, so the field here is an
 * OVERRIDE, and the common case is leaving it alone. An empty value therefore
 * has to mean "keep what is there", never "blank it": the write is conditional
 * in the procedure, and this schema is what makes `undefined` reachable at all.
 *
 * `.max(255)` and nothing else. There is no `.min(1)` - that is the whole point
 * of the field - and no `.trim().min(1)` either, because a title of three spaces
 * must be treated as "left empty" rather than rejected as invalid. `optionalText`
 * in the IDO first-review schema is what performs that flattening, and this
 * feature reuses it.
 *
 * ## Why rejecting requires a note
 *
 * A rejection here is terminal and it is the last thing anybody will say about a
 * request that has already been through four desks. `masterStatus` becomes
 * `IDO_FINAL_REJECTED`, the requestor sees it stop, and the note is the whole of
 * the explanation they get.
 *
 * ## Why the form schemas have no `id`
 *
 * The request id comes from the route, not from a field. A form field for it
 * would be a value the browser could change, and nothing on this page should be
 * able to point a decision at a different request.
 */

const requestIdRule = z.string().min(1);

/**
 * The override. Optional, capped, and deliberately NOT trimmed to a minimum.
 *
 * The cap matches `finalTitleRule` at the first review, because both write the
 * same column and the printed form is laid out for one width. A rule relaxed at
 * one end only is how a 256-character title reaches the PDF through a field that
 * never complained.
 */
const finalTitleOverrideRule = z.string().max(255).optional();

/** `.trim()` before `.min(1)`: a note of three spaces is not a reason, and it is
 *  exactly what a required-field gate that only counts characters accepts. */
const requiredNoteRule = z.string().trim().min(1, "Note is required");

/* -------------------------------------------------------------------------- */
/* What the procedures parse                                                   */

export const idoFinalApproveSchema = z.object({
	finalTitle: finalTitleOverrideRule,
	id: requestIdRule,
});

export const idoFinalRejectSchema = z.object({
	id: requestIdRule,
	note: requiredNoteRule,
});

/* -------------------------------------------------------------------------- */
/* What the forms bind to                                                      */

/**
 * The override field, on its own.
 *
 * It lives in a form rather than in a `useState` for one reason beyond the
 * project's `useAppForm` rule: `.max(255)` has to be reported UNDER the field
 * while it is being typed in, and the only thing that does that is a resolver
 * with `control` bound to the input. A hand-held string would have to reach the
 * server to find out it was too long.
 */
export const idoFinalApproveFormSchema = z.object({
	finalTitle: finalTitleOverrideRule,
});

export type IdoFinalApproveFormValues = z.infer<typeof idoFinalApproveFormSchema>;

export const idoFinalRejectFormSchema = z.object({ note: requiredNoteRule });

export type IdoFinalRejectFormValues = z.infer<typeof idoFinalRejectFormSchema>;
