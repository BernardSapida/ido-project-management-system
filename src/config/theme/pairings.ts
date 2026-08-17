/**
 * Every pairing the palette affects, in one list.
 *
 * This is the single source the generator, the Vitest measurement suite and the
 * customizer's contrast report all read. Three places measuring the same thing
 * from three hand-written lists is how a pairing quietly stops being checked.
 *
 * A pairing is in here when at least one side is a brand token. Neutral-on-
 * neutral pairings - body copy on the page, muted copy on a card - are not
 * affected by the palette and are not this slice's audit; see the spec's
 * out-of-scope note about HeroUI foregrounds the template never defines.
 *
 * ## Why two bars
 *
 * `text` rows answer to SC 1.4.3 (4.5:1) and SC 1.4.6 (7:1). This template
 * targets the enhanced bar on brand surfaces, so 7:1 is what the presets are
 * solved to.
 *
 * `non-text` rows answer to SC 1.4.11 (3:1) and there is no enhanced
 * equivalent - SC 1.4.6 covers text only. Reporting an icon tile as "AAA fail"
 * would therefore be reporting against a criterion that does not exist, which
 * is worse than not reporting it: it trains the reader to ignore the column.
 */

import type { Rgb } from "./oklch";
import { contrastOfRgb, reportRatio, rgbToHex } from "./oklch";
import { AA_TEXT, AAA_TEXT, NON_TEXT } from "./palette.build";

export type PairingKind = "non-text" | "text";

export interface Pairing {
	/** The token painted on top - ink, or the glyph. */
	foreground: string;
	id: string;
	kind: PairingKind;
	/** What this pairing IS on screen, in the words a reader would use. */
	label: string;
	/** The token underneath. */
	background: string;
	/** Only on non-text rows: why 7:1 is the wrong bar here. */
	note?: string;
	/**
	 * Set only on a pairing that is KNOWN to be below its bar and shipped anyway.
	 *
	 * It exists so that a deliberate trade cannot be mistaken for an oversight,
	 * in either direction: the report still shows the row failing, and the
	 * measurement suite still pins the number so a drift is caught - it just
	 * does not fail the build over a decision that was made on purpose. A row
	 * without this field must pass.
	 */
	accepted?: string;
	/**
	 * The floor an accepted row is pinned above, so the trade cannot quietly get
	 * worse than the one that was signed off.
	 *
	 * Per row rather than one constant in the test, and that is not tidiness. The
	 * floor only means anything next to the reason beside it - `brand-fill-on-page`
	 * was accepted at ~2.4:1 and `secondary-fill-on-page` at ~1.2:1, and a single
	 * shared number would have to be the lower of the two, which would stop
	 * pinning the first one at all. Adding a second exception silently loosening
	 * the pin on the first is exactly the drift this field exists to catch.
	 */
	acceptedFloor?: number;
}

export const PAIRINGS: readonly Pairing[] = [
	{
		background: "--gradient-brand-from",
		foreground: "--gradient-brand-foreground",
		id: "gradient-start",
		kind: "text",
		label: "Brand gradient, start stop - active tab, date-filter preset, avatar initials",
	},
	{
		background: "--gradient-brand-via",
		foreground: "--gradient-brand-foreground",
		id: "gradient-mid",
		kind: "text",
		label: "Brand gradient, middle stop",
	},
	{
		background: "--gradient-brand-to",
		foreground: "--gradient-brand-foreground",
		id: "gradient-end",
		kind: "text",
		label: "Brand gradient, end stop",
	},
	{
		background: "--brand-primary",
		foreground: "--brand-primary-foreground",
		id: "brand-solid",
		kind: "text",
		label: "Flat brand fill - brand button, active page number, solid accent chip",
	},
	{
		background: "--background",
		foreground: "--gradient-brand-ink-from",
		id: "wordmark-start",
		kind: "text",
		label: "Logo wordmark, start stop - gradient AS text, so it answers to the page",
	},
	{
		background: "--background",
		foreground: "--gradient-brand-ink-to",
		id: "wordmark-end",
		kind: "text",
		label: "Logo wordmark, end stop",
	},
	{
		background: "--chip-accent-soft",
		foreground: "--chip-accent-soft-foreground",
		id: "chip-soft",
		kind: "text",
		label: "Soft accent chip",
	},
	{
		background: "--brand-secondary",
		foreground: "--brand-secondary-foreground",
		id: "brand-secondary",
		kind: "text",
		label: "Secondary brand surface",
	},
	{
		background: "--brand-muted",
		foreground: "--foreground",
		id: "brand-muted",
		kind: "text",
		label: "Muted brand surface - list icon wells, table row hover, search chips",
	},
	{
		background: "--brand-surface",
		foreground: "--brand-surface-foreground",
		id: "brand-surface",
		kind: "text",
		label: "Brand surface - the landing CTA card and any large brand panel",
	},
	{
		accepted:
			"The brand fill is locked to one colour across both themes so it stays recognisable, which makes it light - and a light fill on a white page cannot also clear 3:1 against it. Solved: 7:1 under near-black ink needs luminance at or above 0.313, 3:1 against white needs 0.30 or below, and those do not overlap. An outline would close it (--brand-edge is generated for exactly that and is one line away) and was removed as an unwanted hairline. Dark mode is unaffected, at about 7.5:1.",
		acceptedFloor: 2.2,
		background: "--background",
		foreground: "--gradient-brand-via",
		id: "brand-fill-on-page",
		kind: "non-text",
		label: "Brand surface against the page",
		note: "SC 1.4.11, 3:1. FAILS IN LIGHT BY DECISION - see the accepted note.",
	},
	/*
	 * The card layer, which had no row of its own until it could be chosen.
	 *
	 * It was always measurable - `--surface` has existed throughout - but while it
	 * was pinned to pure white in light and to one solved value in dark, nothing a
	 * palette did could move it and a row would have restated a constant. A typed
	 * card colour and a strategy that moves one are both new, and both can land
	 * somewhere body copy stops reading.
	 *
	 * ## And deliberately only ONE row, not two
	 *
	 * The obvious companion - the card measured against the page, at the 3:1
	 * non-text bar - was written, measured and removed, because contrast is the
	 * wrong instrument for it. Dark mode's ladder is a 0.088 step in LIGHTNESS
	 * between two dark colours, which is a clear perceptual difference and about
	 * 1.14:1 by the luminance formula. Shipping that row meant every palette
	 * failing on a ladder the template deliberately has, and it is the same trap
	 * `designerAdvisories` already documents: "two very different dark hues sit at
	 * 1.2:1 against each other, so a ratio would flag every dark-brand palette
	 * ever drawn."
	 *
	 * SC 1.4.11 also does not ask this question. It is about identifying user
	 * interface components, and a card is a rectangle rather than a control - what
	 * delineates it is `--border` and the shadow, which is exactly what the flat
	 * ladder relies on and has always relied on. Whether page and card differ at
	 * all is a real thing to want to know, and it is reported where it belongs:
	 * the 60-30-10 panel prints both hexes and says outright when they are one
	 * colour.
	 */
	{
		background: "--surface",
		foreground: "--surface-foreground",
		id: "copy-on-card",
		kind: "text",
		label: "Body copy on a card",
	},
	{
		accepted:
			"A secondary control is a pale fill carrying brand-coloured ink - the treatment HeroUI, shadcn and Material all render, and the one this template's own solver has always produced. Pale is the point: it is what makes the control read as lower-emphasis than the brand button beside it, and a fill that light cannot also clear 3:1 against a white page. The state is never carried by this edge alone - the label is brand-coloured at 7:1+ against the fill, which is the signal a reader actually uses, and HeroUI ships its own secondary button with no border either. Adding one would close the row and is one line away. Dark mode is unaffected: the fill sits at 0.32 against a 0.119 page.",
		acceptedFloor: 1.1,
		background: "--background",
		foreground: "--brand-secondary",
		id: "secondary-fill-on-page",
		kind: "non-text",
		label: "Secondary fill against the page",
		note: "SC 1.4.11, 3:1. FAILS IN LIGHT BY DECISION - see the accepted note.",
	},
	{
		background: "--background",
		foreground: "--brand-primary",
		id: "control-on-page",
		kind: "non-text",
		label: "Filled brand control against the page",
		note: "SC 1.4.11: the CONTROL must be identifiable, not merely its label legible.",
	},
	{
		background: "--surface",
		foreground: "--brand-primary",
		id: "control-on-card",
		kind: "non-text",
		label: "Filled brand control against a card",
		note: "SC 1.4.11 non-text, 3:1.",
	},
	{
		background: "--rail-accent-to",
		foreground: "--rail-foreground",
		id: "rail-glyph",
		kind: "non-text",
		label: "Accent status tile glyph - accent toast, banner, dialog",
		note: "Glyph on a fill. SC 1.4.11 non-text, 3:1.",
	},
] as const;

export interface MeasuredPairing extends Pairing {
	aa: boolean;
	aaa: boolean;
	backgroundHex: string;
	/** The bar this row is judged against: 7 for text, 3 for non-text. */
	bar: number;
	foregroundHex: string;
	passes: boolean;
	ratio: number;
}

/**
 * Measure every pairing against a resolver.
 *
 * The resolver deals in 8-bit sRGB, not in oklch, and that is the important
 * part: it is what the browser will actually put on screen. In the customizer
 * the resolver paints the token onto a probe element and reads the colour back
 * out, so a value the engine gamut-mapped is measured AS MAPPED rather than as
 * authored. In the test suite it reads the shipped stylesheet and converts
 * through the same clamp the generator used.
 *
 * Rows whose tokens do not resolve are dropped rather than reported as 1:1. A
 * missing token is a build error, not a contrast failure, and the measurement
 * suite asserts on the row count for exactly that reason.
 */
export function measurePairings(resolve: (token: string) => Rgb | null): MeasuredPairing[] {
	const measured: MeasuredPairing[] = [];

	for (const pairing of PAIRINGS) {
		const foreground = resolve(pairing.foreground);
		const background = resolve(pairing.background);
		if (!foreground || !background) continue;

		const ratio = reportRatio(contrastOfRgb(foreground, background));
		const bar = pairing.kind === "text" ? AAA_TEXT : NON_TEXT;

		measured.push({
			...pairing,
			aa: ratio >= AA_TEXT,
			aaa: ratio >= AAA_TEXT,
			backgroundHex: rgbToHex(background),
			bar,
			foregroundHex: rgbToHex(foreground),
			passes: ratio >= bar,
			ratio,
		});
	}

	return measured;
}
