/**
 * The five positions a requestor can hold, and the single place they are named.
 *
 * This file belongs to the request form (spec 005) rather than to sign-up, and
 * it is created early because sign-up is the first screen that asks for the
 * value. The old repo had the same five options copied into three files, and by
 * the time one of them gained a sixth the PDF was filling the wrong row - so
 * there is exactly one list, and everything that needs it imports from here.
 *
 * `POSITION_VALUES` is what is STORED (and what `z.enum` gates on);
 * `POSITION_OPTIONS` is what is SHOWN, in the order the printed form lists the
 * representatives. The order lives in the array on purpose - an object keyed by
 * position would be sorted alphabetically by the formatter and the select would
 * silently reorder itself.
 */

export const POSITION_VALUES = [
	"STUDENT_REPRESENTATIVE",
	"ADMINISTRATION_REPRESENTATIVE",
	"FACULTY_REPRESENTATIVE",
	"ALUMNI_REPRESENTATIVE",
	"DEPARTMENT_HEAD",
] as const;

export type Position = (typeof POSITION_VALUES)[number];

const POSITION_LABELS: Record<Position, string> = {
	ADMINISTRATION_REPRESENTATIVE: "Administration Representative",
	ALUMNI_REPRESENTATIVE: "Alumni Representative",
	DEPARTMENT_HEAD: "Department Head",
	FACULTY_REPRESENTATIVE: "Faculty Representative",
	STUDENT_REPRESENTATIVE: "Student Representative",
};

/** Ready for `AppSelect`'s `items`. */
export const POSITION_OPTIONS: { label: string; value: Position }[] = POSITION_VALUES.map((value) => ({
	label: POSITION_LABELS[value],
	value,
}));

/** The stored value as it should read on screen and on the printed form. */
export function positionLabel(value: string | null | undefined): string {
	if (!value) return "—";
	return POSITION_LABELS[value as Position] ?? value;
}
