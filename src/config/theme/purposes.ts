/**
 * The hues this app has already spent on MEANING, and the guard against a brand
 * colliding with one.
 *
 * This began as a "what is this product for" picker that mapped intent onto a
 * preset. That control is gone - a theme is five colours now, and a named brand
 * says what it is for far better than a category ever did. What survives is the
 * part that was never about intent: the semantic hues, and the check that says
 * when a brand is close enough to one of them to be confused with it.
 *
 * Kept in step with styles.css by the measurement suite, which reads the shipped
 * `--danger`, `--warning` and `--success` and fails if these drift. Hard-coding
 * them without that check is how a guard quietly stops guarding.
 */
export const SEMANTIC_HUES = { danger: 25, success: 160, warning: 62 } as const;

/**
 * How close is too close.
 *
 * 20 degrees, and the number is a judgement rather than a threshold anybody can
 * derive. At 3 degrees - amber against warning - the brand and the caution
 * banner are the same colour and nothing but position tells them apart. By 40
 * degrees - teal against success - they read as different colours in the same
 * family, which is fine. 20 is the middle of the range where reasonable people
 * would start to worry.
 */
export const COLLISION_DEGREES = 20;

/** Shortest angular distance between two hues, in degrees. */
export function hueDistance(a: number, b: number): number {
	const d = Math.abs(a - b) % 360;
	return d > 180 ? 360 - d : d;
}

export interface HueCollision {
	degrees: number;
	/** The semantic role this hue is crowding. */
	role: keyof typeof SEMANTIC_HUES;
}

/**
 * The semantic colour this hue crowds, if any.
 *
 * Returns the NEAREST one rather than all of them: a hue can only really be
 * confused with one thing at a time, and listing two would bury the one that
 * matters.
 *
 * This is a warning and never a block. A red fitness brand is a legitimate
 * choice that plenty of real products make - it just has to be made knowing
 * that the delete button is also red, and that the glyph and the verb are then
 * doing the work colour usually does.
 */
export function collisionFor(hue: number): HueCollision | null {
	const nearest = (Object.keys(SEMANTIC_HUES) as (keyof typeof SEMANTIC_HUES)[])
		.map((role) => ({ degrees: hueDistance(hue, SEMANTIC_HUES[role]), role }))
		.sort((a, b) => a.degrees - b.degrees)[0];

	return nearest && nearest.degrees <= COLLISION_DEGREES ? nearest : null;
}

/** One line saying what the collision means, for the control to show. */
export function describeCollision({ degrees, role }: HueCollision): string {
	return `${Math.round(degrees)}° from --${role}. The brand and the ${role} state will read as the same colour, so the glyph and the wording have to carry the difference.`;
}
