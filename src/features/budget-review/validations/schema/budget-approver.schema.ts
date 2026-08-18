import { z } from "zod";

/**
 * The budget officer's two inputs, and the one place each rule is written.
 *
 * ## Why approving takes no fields at all
 *
 * There is no amount, no PPMP line and no reference here, and none is being
 * added - see the spec's `out_of_scope`. The system records that a budget desk
 * SAID YES, not what they looked at to decide; the allocation lives in the PPMP
 * workbook this app never sees. So the approve schema is the request id and
 * nothing else, and it exists as a named schema rather than an inline
 * `z.object` so the procedure and the mutation hook are parsing the same thing.
 *
 * ## Why rejecting requires a note and approving does not
 *
 * A rejection is the only budget event the REQUESTOR ever sees - approving here
 * deliberately leaves `masterStatus` alone, so their view says "Director Review"
 * throughout. The note is therefore the whole of the explanation for a request
 * that has just stopped, and an empty one leaves them with a dead request and no
 * reason for it.
 *
 * ## Why the form schema has no `id`
 *
 * The request id comes from the route, not from a field. Putting it in the form
 * would make it a value the browser could change, and nothing on this page
 * should be able to point a decision at a different request. The form schema is
 * the procedure schema minus that one key.
 */

const requestIdRule = z.string().min(1);

/**
 * `.trim()` before `.min(1)`, and it is not tidiness.
 *
 * A note of three spaces is not a reason, and it is exactly what a required-field
 * gate that only counts characters accepts.
 */
const requiredNoteRule = z.string().trim().min(1, "Note is required");

/* -------------------------------------------------------------------------- */
/* What the procedures parse                                                   */

export const budgetApproveSchema = z.object({
	id: requestIdRule,
});

export const budgetRejectSchema = z.object({
	id: requestIdRule,
	note: requiredNoteRule,
});

/* -------------------------------------------------------------------------- */
/* What the form binds to                                                      */

export const budgetRejectFormSchema = z.object({ note: requiredNoteRule });

export type BudgetRejectFormValues = z.infer<typeof budgetRejectFormSchema>;
