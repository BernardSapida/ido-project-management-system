import type { LucideIcon } from "lucide-react";
import type { CardFooterLink as AppCardFooterLink, CardHeadingLevel } from "../AppCard";
import type { DropdownSection } from "../AppDropdown";

/** Which way the number moved between the two periods being compared. */
export type KpiDeltaDirection = "down" | "flat" | "up";

/**
 * The three tones a movement can wear - a subset of `ChipTone`, because the
 * other two have no meaning here. There is no such thing as an `accent`
 * movement, and a `warning` one would be a severity, which is a different
 * question from a direction.
 */
export type KpiDeltaTone = "danger" | "default" | "success";

/**
 * The movement since the last period, drawn as the tile's chip.
 *
 * `period` is REQUIRED, and that is the whole reason this is a shape rather
 * than a string. "+11.5%" against nothing is not a fact - it is a number the
 * reader has to guess the denominator of, and the guess is usually wrong.
 * Naming the comparison is what turns it into something actionable.
 */
export interface KpiDelta {
	direction: KpiDeltaDirection;
	/**
	 * Whether UP is the good direction. Defaults to true, which is right for
	 * revenue, signups and uptime - and wrong for bounce rate, churn and latency,
	 * where a rise is the bad news and the chip has to be red for it.
	 *
	 * Colour is derived from `direction` AND this together; a caller never picks
	 * the tone, because "which colour is a falling number" is exactly the decision
	 * that gets made differently on two tiles of the same dashboard.
	 */
	isUpGood?: boolean;
	/** Already formatted, sign included - "+11.5%", "-5.9%", "+122". */
	label: string;
	/** What it is measured against - "vs last 30 days", "vs last quarter". */
	period: string;
}

/** One reading in a series. `value` is plotted; `label` names its position. */
export interface KpiPoint {
	/** The x-axis name for this reading - "Mar 3", "Week 12". Shown on hover. */
	label: string;
	value: number;
}

export interface KpiLineChart {
	/**
	 * How a plotted value is written in the hover readout. Defaults to
	 * `toLocaleString`, which is right for counts and wrong for money - a tooltip
	 * saying `21300` under a value reading `$21,300` is the same number twice in
	 * two currencies.
	 */
	formatValue?: (value: number) => string;
	kind: "line";
	/**
	 * In time order, oldest first. Under two readings the chart is dropped
	 * entirely rather than drawn flat: one point is not a trend, and a horizontal
	 * line through it claims a stability nobody measured.
	 */
	points: KpiPoint[];
}

export interface KpiProgressChart {
	/** What the bar is counting off - "3,420 of 5,000 seats". Sits under it. */
	caption?: string;
	kind: "progress";
	/**
	 * The accessible name of the bar - "Seats used". Never drawn: the tile's own
	 * title is directly above it, so printing it again is the same word twice.
	 */
	label: string;
	/** Defaults to 100, so a caller holding a percentage passes only `value`. */
	max?: number;
	/**
	 * SEVERITY, not direction - `accent` while a quota is fine, `warning` as it
	 * gets close, `danger` past it. This is the one tone a caller does pick,
	 * because where a quota becomes worrying is a product decision and no formula
	 * here can know it.
	 */
	tone?: "accent" | "danger" | "success" | "warning";
	value: number;
}

/**
 * What goes under the value. Absent means nothing does - which is the right
 * answer for a number with no history to draw and no ceiling to fill.
 */
export type KpiChart = KpiLineChart | KpiProgressChart;

/**
 * The one way out of the tile - into the report the number came from.
 *
 * A LINK, and only a link. A tile's footer is always "show me the rest of
 * this", which is a navigation; it can be middle-clicked, opened in a tab and
 * seen by the router, none of which a button can do. Anything that ACTS on the
 * tile - pin it, export it, remove it - is an `actions` item, and a tile with a
 * second way out has become a page.
 */
export type KpiFooter = AppCardFooterLink;

export interface AppKpiProps {
	/**
	 * The overflow menu, in `AppDropdown`'s own section shape rather than a
	 * second menu type invented here - which is what keeps destructive items
	 * hoisted to the end, disabled items in the menu with their reason, and the
	 * bottom sheet on a touch device.
	 */
	actions?: DropdownSection[];
	chart?: KpiChart;
	className?: string;
	"data-cy"?: string;
	delta?: KpiDelta;
	footer?: KpiFooter;
	/**
	 * The tile's title tag. @default 3 - a KPI row usually sits under the page's
	 * `h1` and a section's `h2`. Raise it where the row is nested deeper; a
	 * document that skips a level is unnavigable by heading.
	 */
	headingLevel?: CardHeadingLevel;
	/**
	 * Required. A dashboard is read by shape before it is read by word: the glyph
	 * is what lets somebody find the revenue tile in a grid of nine without
	 * reading nine titles, and it is the only thing telling them apart at a
	 * glance on a phone.
	 */
	icon: LucideIcon;
	/** What is being measured - "Monthly revenue". Sentence case, no colon. */
	title: string;
	/**
	 * The number, already formatted - "$21,300", "3.8%", "71,897".
	 *
	 * A string rather than a number with a formatter prop: the tile has no way to
	 * know a currency, a locale or how many significant digits are honest, and
	 * every caller that has those facts already has a formatter holding them.
	 */
	value: string;
}

/**
 * The chip's colour, from the direction and whether up is good.
 *
 * Exported because the lab asserts on the pairing, and because it is the rule
 * this component exists to hold: nothing outside here decides that a falling
 * bounce rate is green.
 */
export function kpiDeltaTone(delta: KpiDelta): KpiDeltaTone {
	if (delta.direction === "flat") return "default";

	const isGood = delta.direction === "up" ? delta.isUpGood !== false : delta.isUpGood === false;
	return isGood ? "success" : "danger";
}
