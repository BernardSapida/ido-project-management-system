import { z } from "zod";

/**
 * The IDO first review's four inputs, and the one place each rule is written.
 *
 * ## Why the field rules are constants
 *
 * Every rule below is used TWICE - once by the form the officer types into and
 * once by the procedure that parses what arrives. Written out at both ends they
 * drift, and the drift is silent in the direction that matters: a client rule
 * relaxed without the server one only annoys somebody, but a server rule relaxed
 * without the client one means a 256-character final title reaches the printed
 * form through a field that never complained.
 *
 * ## Why the form schemas have no `id`
 *
 * The request id comes from the route, not from a field, so the form schemas are
 * the procedure schemas minus that one key. Putting `id` in the form would make
 * it a value the browser could change, and there is nothing on this page that
 * should be able to point the decision at a different request.
 */

const finalTitleRule = z.string().trim().min(1, "Final title is required").max(255);
const referenceRule = z.string().trim().max(255).optional();
const optionalNoteRule = z.string().trim().optional();

/**
 * `.trim()` before `.min(1)`, and it is not tidiness.
 *
 * A note of three spaces is not a reason, and it is what a required-field gate
 * that only counts characters accepts. The requestor reads this note as the
 * whole explanation of why their request came back, so an empty one is the
 * failure the rule exists to stop.
 */
const requiredNoteRule = z.string().trim().min(1, "Note is required");

const requestIdRule = z.string().min(1);

/* -------------------------------------------------------------------------- */
/* What the procedures parse                                                   */

export const idoRecommendSchema = z.object({
	finalTitle: finalTitleRule,
	id: requestIdRule,
	note: optionalNoteRule,
	reference: referenceRule,
});

export const idoReturnSchema = z.object({
	id: requestIdRule,
	note: requiredNoteRule,
});

export const idoRejectSchema = z.object({
	id: requestIdRule,
	note: requiredNoteRule,
});

export const idoDeferSchema = z.object({
	id: requestIdRule,
	note: optionalNoteRule,
});

/* -------------------------------------------------------------------------- */
/* What the forms bind to                                                      */

export const idoApproverFormSchema = z.object({
	finalTitle: finalTitleRule,
	note: optionalNoteRule,
	reference: referenceRule,
});

export type IdoApproverFormValues = z.infer<typeof idoApproverFormSchema>;

/** Return and Reject. The note is the message the requestor reads. */
export const idoRequiredNoteFormSchema = z.object({ note: requiredNoteRule });

/**
 * Defer. The note is optional because the request was not refused - there is
 * simply no budget this year - so there may genuinely be nothing to explain.
 */
export const idoOptionalNoteFormSchema = z.object({ note: optionalNoteRule });

export type IdoNoteFormValues = z.infer<typeof idoRequiredNoteFormSchema>;
export type IdoOptionalNoteFormValues = z.infer<typeof idoOptionalNoteFormSchema>;

/**
 * `""` → `undefined`, so an untouched optional field is absent rather than empty.
 *
 * Every one of these fields is nullable in the database, and the two states have
 * to stay distinguishable: `null` is "no reference was given", `""` is a
 * reference that prints as a blank line on the form. RHF hands back `""` for a
 * field nobody typed in, so the conversion belongs here rather than at each of
 * the four call sites.
 */
export function optionalText(value?: string | null): string | undefined {
	const trimmed = value?.trim();

	return trimmed ? trimmed : undefined;
}
