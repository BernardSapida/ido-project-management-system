import { z } from "zod";

/**
 * The Campus Director's two inputs at the first approval.
 *
 * ## Why approving takes only the id
 *
 * There is nothing for the director to fill in. The decision IS the input: the
 * signature is copied from their own row by the procedure - never sent by the
 * browser, which would let a crafted call stamp somebody else's image - and the
 * three status columns are derived rather than chosen. So the approve schema is
 * the request id and nothing else, and it is a NAMED schema rather than an
 * inline `z.object` so the procedure and the mutation hook parse the same thing.
 *
 * ## Why rejecting requires a note and approving does not
 *
 * A rejection here is terminal and it is the last thing anybody will say about
 * the request. `masterStatus` becomes `DIRECTOR_REJECTED`, the requestor sees it
 * stop, and the note is the whole of the explanation they get. An approval needs
 * no words because the request simply carries on to the next desk.
 *
 * ## Why the form schema has no `id`
 *
 * The request id comes from the route, not from a field - the same rule the
 * budget schema states. A form field for it would be a value the browser could
 * change, and nothing on this page should be able to point a decision at a
 * different request.
 */

const requestIdRule = z.string().min(1);

/** `.trim()` before `.min(1)`: a note of three spaces is not a reason, and it is
 *  exactly what a required-field gate that only counts characters accepts. */
const requiredNoteRule = z.string().trim().min(1, "Note is required");

/* -------------------------------------------------------------------------- */
/* What the procedures parse                                                   */

export const directorApproveSchema = z.object({
	id: requestIdRule,
});

export const directorRejectSchema = z.object({
	id: requestIdRule,
	note: requiredNoteRule,
});

/* -------------------------------------------------------------------------- */
/* What the form binds to                                                      */

export const directorRejectFormSchema = z.object({ note: requiredNoteRule });

export type DirectorRejectFormValues = z.infer<typeof directorRejectFormSchema>;
