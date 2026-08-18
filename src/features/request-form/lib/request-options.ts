/**
 * Every closed list the request form offers, and the single place each is named.
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

/* -------------------------------------------------------------------------- */
/* The request itself                                                          */

/**
 * The six kinds of work that can be asked for.
 *
 * The VALUES are load-bearing beyond the select: the printed form has a row of
 * checkboxes, one per kind, and the PDF (spec 016) ticks the one whose value
 * matches. A seventh entry here without a seventh box there is a request that
 * prints with nothing ticked, so this list and that row change together.
 */
export const TYPE_OF_REQUEST_VALUES = [
	"NEW_CONSTRUCTION",
	"RENOVATION",
	"ADDITION",
	"REHABILITATION",
	"MINOR_REPAIR",
	"OTHER",
] as const;

export type TypeOfRequest = (typeof TYPE_OF_REQUEST_VALUES)[number];

const TYPE_OF_REQUEST_LABELS: Record<TypeOfRequest, string> = {
	ADDITION: "Addition",
	MINOR_REPAIR: "Minor Repair",
	NEW_CONSTRUCTION: "New Construction",
	OTHER: "Other",
	REHABILITATION: "Rehabilitation",
	RENOVATION: "Renovation",
};

export const TYPE_OF_REQUEST_OPTIONS: { label: string; value: TypeOfRequest }[] = TYPE_OF_REQUEST_VALUES.map(
	(value) => ({ label: TYPE_OF_REQUEST_LABELS[value], value }),
);

export function typeOfRequestLabel(value: string | null | undefined): string {
	if (!value) return "—";
	return TYPE_OF_REQUEST_LABELS[value as TypeOfRequest] ?? value;
}

export const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH"] as const;

export type Priority = (typeof PRIORITY_VALUES)[number];

const PRIORITY_LABELS: Record<Priority, string> = {
	HIGH: "High",
	LOW: "Low",
	MEDIUM: "Medium",
};

/** Low to high, not alphabetical. The order IS the scale. */
export const PRIORITY_OPTIONS: { label: string; value: Priority }[] = PRIORITY_VALUES.map((value) => ({
	label: PRIORITY_LABELS[value],
	value,
}));

export function priorityLabel(value: string | null | undefined): string {
	if (!value) return "—";
	return PRIORITY_LABELS[value as Priority] ?? value;
}

export const JUSTIFICATION_VALUES = [
	"OPERATIONAL_NEED",
	"SYSTEM_UPGRADE",
	"NEW_FUNCTIONALITY",
	"COMPLIANCE",
	"COST_REDUCTION",
	"OTHER",
] as const;

export type Justification = (typeof JUSTIFICATION_VALUES)[number];

const JUSTIFICATION_LABELS: Record<Justification, string> = {
	COMPLIANCE: "Compliance Requirement",
	COST_REDUCTION: "Cost Reduction",
	NEW_FUNCTIONALITY: "New Functionality",
	OPERATIONAL_NEED: "Operational Need",
	OTHER: "Other",
	SYSTEM_UPGRADE: "System Upgrade",
};

export const JUSTIFICATION_OPTIONS: { label: string; value: Justification }[] = JUSTIFICATION_VALUES.map((value) => ({
	label: JUSTIFICATION_LABELS[value],
	value,
}));

export function justificationLabel(value: string | null | undefined): string {
	if (!value) return "—";
	return JUSTIFICATION_LABELS[value as Justification] ?? value;
}
