import { z } from "zod";

/**
 * The Campus Director's two inputs at the FINAL approval.
 *
 * ## Why approving takes only the id
 *
 * There is nothing for the director to fill in, and at this stage that matters
 * more than it did at their first approval. The decision IS the input: the
 * signature is copied from their own row by the procedure - never sent by the
 * browser, which would let a crafted call stamp somebody else's image onto the
 * document this approval releases - the six status columns are derived, and the
 * `Csm` row is created from the request id alone. So the approve schema is the
 * request id and nothing else, and it is a NAMED schema rather than an inline
 * `z.object` so the procedure and the mutation hook parse the same thing.
 *
 * ## Why rejecting requires a note
 *
 * A rejection here stops a request that has already satisfied four desks, and
 * the note is the entire explanation the requestor gets for why the last one
 * said no. `masterStatus` becomes `FINAL_REJECTED` - labelled "Director Final
 * Rejected" everywhere - and nothing in the app re-opens it.
 *
 * ## Why the form schema has no `id`
 *
 * The request id comes from the route, not from a field - the same rule the
 * three approver schemas before it state. A form field for it would be a value
 * the browser could change, and nothing on this page should be able to point the
 * final approval at a different request.
 */

const requestIdRule = z.string().min(1);

/** `.trim()` before `.min(1)`: a note of three spaces is not a reason, and it is
 *  exactly what a required-field gate that only counts characters accepts. */
const requiredNoteRule = z.string().trim().min(1, "Note is required");

/* -------------------------------------------------------------------------- */
/* What the procedures parse                                                   */

export const finalDirectorApproveSchema = z.object({
	id: requestIdRule,
});

export const finalDirectorRejectSchema = z.object({
	id: requestIdRule,
	note: requiredNoteRule,
});

/* -------------------------------------------------------------------------- */
/* What the form binds to                                                      */

export const finalDirectorRejectFormSchema = z.object({ note: requiredNoteRule });

export type FinalDirectorRejectFormValues = z.infer<typeof finalDirectorRejectFormSchema>;
