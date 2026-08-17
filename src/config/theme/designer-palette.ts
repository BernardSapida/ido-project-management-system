/**
 * A palette that arrives from a designer: five hex values, measured rather than
 * solved.
 *
 * ## The contract is the opposite way round from the rest of this directory
 *
 * Everywhere else, contrast is an OUTPUT: `palette.build.ts` is handed a hue and
 * returns whatever values clear the bar, so a generated palette cannot fail.
 * Here contrast is a MEASUREMENT. Supplied values ship exactly as given, and
 * this module's job is to say what that costs.
 *
 * The reason not to quietly "fix" them: a brand colour is not a suggestion. A
 * designer who hands over #78BF7B and gets #6FBB7E back has been overruled by a
 * build step - rude, and expensive the first time it contradicts a printed brand
 * guideline. So the palette ships verbatim and the report carries the argument.
 *
 * ## Three are required, two are derived
 *
 * `background`, `foreground` and `brand` have to be given; nothing sensible can
 * be inferred from an empty form. `secondary` and `accent` are computed from the
 * brand when absent, and DERIVED IS NOT MISSING - a palette of three still has a
 * secondary fill, it is just one this file worked out rather than one a designer
 * chose. What derivation cannot do is invent a second HUE, so the derived pair
 * are variants on the brand's own hue and the report says so.
 *
 * `foreground` is required rather than derived from `brand` because of a measured
 * fact rather than a preference: a colour good enough to be a button is usually
 * unusable as type. The reference palette this was built against measures 6.15:1
 * as a button with a dark label and 1.91:1 as body copy on its own page.
 *
 * Everything else - some seventy tokens - stays derived by the solver. Nobody
 * hands over a field border, a glass tint or a muted-text step.
 *
 * ## Where the roles came from
 *
 * Not invented here. The mapping below follows the systems that defined the
 * vocabulary, which agree with each other more than their naming suggests:
 *
 * - Material 3 calls the dominant one PRIMARY - "prominent buttons, active
 *   states, and the tint of elevated surfaces" - and SECONDARY "less prominent
 *   components... filter chips", with TERTIARY as "contrasting accents... to
 *   balance primary and secondary colors or bring enhanced attention".
 * - shadcn/ui says the same in different words: `primary` is "high-emphasis
 *   actions and brand surfaces", `secondary` is "lower-emphasis filled actions
 *   and supporting surfaces".
 * - The 60-30-10 convention this page is framed around puts the 60 on "the
 *   lightest neutral or main brand field", the 30 on "navigation, sidebars,
 *   cards", and the 10 on "primary buttons, active states, badges".
 *
 * So `brand` drives the buttons and `secondary` the lower-emphasis ones, which
 * is what `applySupplied` in palette.build.ts does. Note what "less prominent"
 * means in all three: a quieter CONTROL, not a bigger surface. It is rendered
 * everywhere as a pale fill under high-emphasis brand-coloured type - see the
 * derivation below, which got this wrong once by reading "fill" as "mid-tone".
 *
 * ## The one word everybody uses differently
 *
 * ACCENT. It is worth knowing before reading any of the above:
 *
 * | system | what "accent" means there |
 * |---|---|
 * | shadcn/ui | hover, focus and active surfaces - a STATE colour, usually neutral |
 * | Material 3 | the family primary/secondary/tertiary collectively |
 * | a brand deck (coolors) | the sparing highlight - what this file means |
 * | HeroUI, which this template runs on | the DOMINANT action colour |
 *
 * That last row is the trap. `--accent` in HeroUI is read by button, switch,
 * checkbox, radio, slider, tabs, chip and progress - it is their name for what
 * Material calls primary. A developer who reads HeroUI's docs and then this
 * form will find the same word meaning opposite things, which is why the
 * `accent` field says outright that a colour wanted on every button belongs in
 * `brand` instead.
 *
 * ## Why five in and seventy out
 *
 * Radix's twelve-step scale is the clearest published account of how many
 * distinct roles a UI actually needs: steps 1-2 app and subtle backgrounds, 3-5
 * component backgrounds by state, 6-8 borders by interactivity, 9-10 solid
 * fills, 11-12 text at two contrasts. Nobody hands over twelve steps per hue
 * from a brand deck, and asking them to would be asking the wrong question -
 * which is the argument for taking five and solving the rest.
 */

import type { Oklch, Rgb } from "./oklch";
import { clampToGamut, contrastOfRgb, hexToOklch, maxChroma, oklchToHex, oklchToRgb, reportRatio } from "./oklch";
import { buildPalette, type SurfaceStrategy } from "./palette.build";

/**
 * The four slots, ground up: the page, the cards on it, the brand those carry,
 * and the type.
 *
 * ## Two roles were removed, and neither was removed for being unimportant
 *
 * SECONDARY was offered for a while and painted nothing. HeroUI's own
 * `.button--secondary` is `--button-bg: var(--default)` - a neutral fill under
 * `--accent-soft-foreground` - and that is the correct rendering of the pattern:
 * a quiet pill with brand-coloured type, which is what their playground shows
 * and what every reference implementation does. Wiring `--brand-secondary` into
 * it produced a second SOLID button competing with the primary, which is the
 * exact thing "lower emphasis" exists to avoid. The token is still solved and
 * still measured, because `--color-secondary` aliases it; nothing paints with it
 * and nothing should have to.
 *
 * ACCENT drove `--rail-accent`, the informational member of the toast / banner /
 * dialog family. It is still derived from the brand, so that family still gets a
 * palette-aware colour - what went is the FIELD, because the labs already give
 * those surfaces a place to be chosen and looked at, and because the derivation
 * returns the brand unchanged for any brand that clears 3:1 on white. A field
 * whose default output is identical to another field's input is a field that
 * teaches the reader the form is longer than the decision.
 *
 * What remains is the set nothing can be inferred from, plus the one surface a
 * 60-30-10 reading has an opinion about.
 */
export const DESIGNER_ROLES = [
	{
		hint: "The page behind everything. The largest surface on screen.",
		key: "background",
		label: "Background",
		paints: "The page",
		required: true,
	},
	{
		hint: "Cards, panels, dialogs - the layer sitting on the page. The Surface control below fills this for you; type over it to choose your own.",
		key: "surface",
		label: "Surface",
		paints: "Cards and panels",
		required: false,
	},
	{
		hint: "The one that dominates. Buttons, active tabs, switches, chips, avatars, the brand cards - most of what a reader points at and calls your brand.",
		key: "brand",
		label: "Brand",
		paints: "Buttons and brand surfaces",
		required: true,
	},
	{
		hint: "Body copy. Has to be legible on the background above it, which is the first thing this page checks.",
		key: "foreground",
		label: "Foreground",
		paints: "Body text",
		required: true,
	},
] as const;

/** What the FORM asks for. Four fields. */
export type DesignerRole = (typeof DESIGNER_ROLES)[number]["key"];

/**
 * What a PALETTE has, which is two more than the form asks for.
 *
 * The distinction is the whole of this change. `secondary` and `accent` stopped
 * being questions - nothing paints the first and the labs already own the
 * surfaces the second colours - but they did not stop being tokens, and a
 * preset that already carries a designer's own values for them must keep them.
 * Dropping them from this union too would silently discard revolve's #78BF7B
 * and #5ABCDF the next time it was regenerated.
 *
 * So: the form draws DESIGNER_ROLES, the resolver reads and reports
 * PaletteRole, and anything already supplied still ships verbatim.
 */
export type PaletteRole = DesignerRole | "accent" | "secondary";

/**
 * The canonical order, derived from the array above so there is still exactly ONE
 * source. The form draws the fields in it, "Paste all" fills them in it, and
 * `--colors` reads them in it.
 *
 * ## It changed, and old commands are still safe
 *
 * It used to run brand-first and it now runs ground-first, which re-interprets
 * every position. A `--colors` string is positional, so a command copied out of
 * this page before the change would silently land a brand in the background
 * field and measure, generate and ship as a different palette - the exact
 * failure a single shared order exists to prevent, arriving through the order
 * itself rather than through a second list.
 *
 * What makes it safe is ARITY. The old order had five roles and no card; this
 * one has six, and the customizer now always emits six slots - using an EMPTY
 * slot for a role it wants derived rather than dropping it. So five values can
 * only ever be an old command and six can only ever be a new one, and
 * `parseColors` reads each in its own order. Nothing has to be remembered or
 * migrated.
 */
export const DESIGNER_ORDER = DESIGNER_ROLES.map((role) => role.key) as DesignerRole[];

/**
 * The order a FIVE-value `--colors` was written in, kept only to read those.
 *
 * Frozen on purpose. It is not "the old order" in a sense that could ever be
 * updated - it is the literal sequence some already-written command means, and
 * editing it would change the meaning of text that has already been saved.
 */
/**
 * Whether a palette role has a FIELD behind it.
 *
 * The report measures more roles than the form asks for, so a row can name a
 * role there is nowhere to write to - a suggested `secondary` has no input to
 * put it in. The suggestion button is gated on this rather than on the row
 * existing, so the report keeps reporting on those surfaces without offering an
 * action that cannot be taken.
 */
export function isDesignerRole(role: PaletteRole): role is DesignerRole {
	return (DESIGNER_ORDER as readonly string[]).includes(role);
}

export const LEGACY_DESIGNER_ORDER = ["brand", "secondary", "accent", "background", "foreground"] as const;

/** Hex strings, exactly as typed. */
export type DesignerPalette = Partial<Record<PaletteRole, string>>;

/** The roles that cannot be inferred from anything. */
export const REQUIRED_ROLES = DESIGNER_ROLES.filter((role) => role.required).map((role) => role.key);

/** SC 1.4.3, and the bar a derived value has to clear before it is offered. */
const TEXT_BAR = 4.5;
/** SC 1.4.11, which has no enhanced equivalent. */
const NON_TEXT_BAR = 3;

const WHITE: Oklch = { c: 0, h: 0, l: 1 };

/* -------------------------------------------------------------------------- */
/* Derivation                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Move in lightness at a fixed hue until every background clears the bar.
 *
 * Linear rather than a bisection, and chroma re-clamped at every step: the sRGB
 * ceiling is not monotonic in lightness, so a bisection can straddle it and land
 * on a colour the browser silently remaps - a value that measures one thing here
 * and paints another on screen.
 */
function walkUntil(seed: Oklch, chroma: number, against: readonly Oklch[], bar: number, direction: -1 | 1): Oklch {
	for (let step = 0; step <= 0.9; step += 0.004) {
		const l = seed.l + step * direction;
		if (l <= 0.04 || l >= 0.99) break;

		const candidate = clampToGamut({ c: Math.min(chroma, maxChroma(l, seed.h)), h: seed.h, l });
		const rgb = oklchToRgb(candidate);
		if (against.every((background) => contrastOfRgb(rgb, oklchToRgb(background)) >= bar)) return candidate;
	}

	const floor = direction === -1 ? 0.05 : 0.98;
	return clampToGamut({ c: Math.min(chroma, maxChroma(floor, seed.h)), h: seed.h, l: floor });
}

export interface ResolvedDesignerPalette {
	/** Which roles this file supplied rather than the designer. */
	derived: PaletteRole[];
	values: Record<PaletteRole, Oklch>;
}

/**
 * The whole palette, with anything absent filled in.
 *
 * Returns null when a required role is missing or half-typed, because a partial
 * palette has nothing meaningful to report and a form is a thing people type
 * into one character at a time.
 */
export function resolveDesignerPalette(palette: DesignerPalette): ResolvedDesignerPalette | null {
	const background = hexToOklch(palette.background ?? "");
	const foreground = hexToOklch(palette.foreground ?? "");
	const brand = hexToOklch(palette.brand ?? "");
	if (!background || !foreground || !brand) return null;

	const derived: PaletteRole[] = [];

	/*
	 * SECONDARY and ACCENT are resolved but no longer ASKED for.
	 *
	 * They left the form (see DESIGNER_ROLES) and not the palette: `--color-
	 * secondary` still aliases one and the status rails still read the other. A
	 * preset that supplied its own still gets it back verbatim - that contract is
	 * older than the form and does not depend on there being a field.
	 */
	let secondary = hexToOklch(palette.secondary ?? "");
	if (!secondary) {
		derived.push("secondary");
		// A pale, nearly neutral fill at the brand's hue - a step off the PAGE
		// toward the ink rather than a step off the brand. The anchors are not
		// symmetric: a light page at 1.0 takes 0.06 to reach 0.94, a dark page at
		// 0.119 takes 0.20 to reach 0.32, the same "dark needs roughly double the
		// distance" relationship the neutral ramps are built on.
		const isLightGround = background.l > 0.5;
		const lightness = isLightGround ? 0.94 : 0.32;
		secondary = clampToGamut({
			c: Math.min(isLightGround ? 0.035 : 0.06, maxChroma(lightness, brand.h) * 0.9),
			h: brand.h,
			l: lightness,
		});
	}

	// The rail carries a near-white glyph, so a derived one is walked until that
	// glyph reads on it. For any brand already clearing 3:1 on white it stops at
	// step zero and returns the brand unchanged - which is the measured reason
	// this stopped being worth asking for.
	let accent = hexToOklch(palette.accent ?? "");
	if (!accent) {
		derived.push("accent");
		accent = walkUntil(brand, brand.c, [WHITE], NON_TEXT_BAR, -1);
	}

	/*
	 * The card. Derived is the PAGE, a weaker claim than the two above make and
	 * deliberately so: a blank card's real answer belongs to the Surface control,
	 * which this function cannot see. Falling back to the page reports the card as
	 * the colour it will be if nothing intervenes, and never claims a ladder that
	 * may not exist.
	 */
	const surface = hexToOklch(palette.surface ?? "");
	if (!surface) derived.push("surface");

	return { derived, values: { accent, background, brand, foreground, secondary, surface: surface ?? background } };
}

/**
 * The ink a supplied fill needs, solved rather than supplied.
 *
 * Not a modification of the designer's colour - it is the colour that goes ON
 * theirs, which no brand deck includes and which cannot be guessed. Prefers
 * their own foreground when it clears, so a palette that already works keeps its
 * own values; falls back to the nearest of white or the foreground's hue walked
 * dark enough.
 */
/**
 * How much measured contrast a conventional ink is worth giving up, when neither
 * candidate clears its bar anyway. See the tie-break in `inkForAll`.
 */
const INK_TIE_MARGIN = 0.5;

export function inkForAll(fills: readonly Oklch[], preferred: Oklch, bar = TEXT_BAR): Oklch {
	const clears = (candidate: Oklch) =>
		fills.every((fill) => contrastOfRgb(oklchToRgb(candidate), oklchToRgb(fill)) >= bar);

	if (clears(preferred)) return preferred;
	if (clears(WHITE)) return WHITE;

	/*
	 * NOTHING clears. Take the best of what is left, not the first thing tried.
	 *
	 * This used to walk down from the preferred foreground and return whatever it
	 * reached, which threw away WHITE's actual ratio the moment white failed the
	 * bar. On a fill in the ink dead band both inks fail, so "failed the bar" told
	 * us nothing about which was better - and the walk reliably landed on a
	 * near-black. Measured: netflix picked black at 4.38 with white sitting at
	 * 4.79, and discord picked black at 4.56 with white at 4.61. Both shipped the
	 * WORSE ink, and both are saturated fills where near-black type is the thing a
	 * reader reports as looking broken.
	 *
	 * TIE-BREAK TO WHITE, within a margin. Below the bar the two are already
	 * inadequate, and the gap between uber's 4.59 and 4.58 is smaller than the
	 * 8-bit quantisation the value will be painted at - so it is not a measurement
	 * worth obeying. What is worth obeying is the convention every design system
	 * holds: light type on a saturated chromatic fill. 0.5 is wide enough to cover
	 * the ties and far too narrow to overturn a real preference - airbnb keeps its
	 * near-black at 6.88 against white's 3.05, as it should.
	 */
	const worstOn = (candidate: Oklch) =>
		Math.min(...fills.map((fill) => contrastOfRgb(oklchToRgb(candidate), oklchToRgb(fill))));

	const walked = walkUntil(preferred, preferred.c, fills, bar, -1);
	const best = [WHITE, walked, preferred].reduce((a, b) => (worstOn(b) > worstOn(a) ? b : a));

	return worstOn(WHITE) >= worstOn(best) - INK_TIE_MARGIN ? WHITE : best;
}

/** The single-fill case, which is most of them. */
export function inkFor(fill: Oklch, preferred: Oklch, bar = TEXT_BAR): Oklch {
	return inkForAll([fill], preferred, bar);
}

/* -------------------------------------------------------------------------- */
/* Measurement                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * ## The report asks what CAN pair, it does not assume what will
 *
 * The first version of this hard-coded pairings - "a white label on the accent",
 * "white copy on the brand" - and reported them as the palette's failures. That
 * was wrong twice over. Nothing in a five-colour palette says white is a text
 * colour: a designer who supplies a foreground has already told you what goes on
 * things. And exhaustively pairing five colours produces mostly nonsense, because
 * two light values are never a text-on-background pair and neither are two dark
 * ones - a report full of combinations nobody would build teaches the reader to
 * skim it.
 *
 * So the questions are the ones that actually have answers:
 *
 * 1. Is body copy legible? `foreground` on `background`, the one pairing that
 *    exists in every design.
 * 2. For each fill, WHICH of the supplied colours can sit on it? Not "does white
 *    work" - "what works", chosen from the palette, reported by name.
 * 3. Does each fill have an edge against the page? A 3:1 question about the fill
 *    itself, with no ink involved.
 *
 * A fill only fails when NOTHING in the palette is legible on it. That is a real
 * problem and worth stopping for; "the colour I picked out of thin air did not
 * work on it" was never one.
 */

/** How a supplied colour fares as ink on one of the fills. */
export interface InkOption {
	hex: string;
	passes: boolean;
	ratio: number;
	role: PaletteRole;
}

export type CheckKind = "body-copy" | "edge" | "ink";

export interface MeasuredCheck {
	background: string;
	bar: number;
	foreground: string;
	id: string;
	/** Every palette colour measured on this fill, best first. Only on `ink` rows. */
	inks: InkOption[];
	/** True when either side was computed rather than supplied. */
	isDerived: boolean;
	kind: CheckKind;
	label: string;
	passes: boolean;
	ratio: number;
	remedy: string;
	/** Which field a suggestion belongs in. */
	role: PaletteRole | null;
	/** The nearest value at the SAME hue that clears the bar, if one exists. */
	suggestion: string | null;
}

/**
 * The nearest value at this hue that clears the bar.
 *
 * Hue and chroma are held and only lightness moves: hue is the part a designer
 * chose, and a suggestion in a different colour is not a suggestion, it is a
 * replacement - which trains the reader to ignore all of them. Both directions
 * are searched and the smaller move wins.
 */
function nudge(color: Oklch, against: Rgb, bar: number): string | null {
	for (let step = 0.005; step <= 0.85; step += 0.005) {
		for (const direction of [-1, 1]) {
			const l = color.l + step * direction;
			if (l <= 0.02 || l >= 0.99) continue;

			const candidate = clampToGamut({ c: Math.min(color.c, maxChroma(l, color.h)), h: color.h, l });
			if (contrastOfRgb(oklchToRgb(candidate), against) >= bar) return oklchToHex(candidate);
		}
	}

	return null;
}

/**
 * The fills the REPORT covers - and it is one, where it used to be three.
 *
 * `secondary` and `accent` are still solved, still painted and still measured by
 * the suite next door. What they are not is ACTIONABLE: neither has a field any
 * more, so a row about them is a number the reader cannot move. One of them
 * shipped as a red Fail with no control anywhere on the page that would fix it,
 * which is the worst thing a report can do - it teaches the reader that red does
 * not mean act, and then the row that does mean act is read the same way.
 *
 * So the report answers only what the form can change. The full picture is still
 * available: PAIRINGS measures every brand token, the generator prints it, and
 * the suite fails the build over it.
 */
const FILLS: PaletteRole[] = ["brand"];

/**
 * Every supplied colour, measured as ink on one fill, best first.
 *
 * The fill itself is excluded for the obvious reason, and so is anything within
 * a hair of it - a colour that IS the fill is not a candidate for sitting on it.
 */
function inkOptionsFor(fill: PaletteRole, values: Record<PaletteRole, Oklch>): InkOption[] {
	const fillRgb = oklchToRgb(values[fill]);

	return (Object.keys(values) as PaletteRole[])
		.filter((role) => role !== fill)
		.map((role) => {
			const ratio = reportRatio(contrastOfRgb(oklchToRgb(values[role]), fillRgb));
			return { hex: oklchToHex(values[role]), passes: ratio >= TEXT_BAR, ratio, role };
		})
		.sort((a, b) => b.ratio - a.ratio);
}

const ROLE_LABEL: Record<PaletteRole, string> = {
	accent: "accent",
	background: "background",
	brand: "brand",
	foreground: "foreground",
	secondary: "secondary",
	surface: "surface",
};

/** Every question worth asking of five connected colours. */
export function measureDesignerPalette(palette: DesignerPalette): MeasuredCheck[] {
	const resolved = resolveDesignerPalette(palette);
	if (!resolved) return [];

	const { derived, values } = resolved;
	const isDerived = (...roles: PaletteRole[]) => roles.some((role) => (derived as string[]).includes(role));
	const rows: MeasuredCheck[] = [];

	/* 1. Body copy. The one pairing that exists in every design. */
	const bodyRatio = reportRatio(contrastOfRgb(oklchToRgb(values.foreground), oklchToRgb(values.background)));
	rows.push({
		background: oklchToHex(values.background),
		bar: TEXT_BAR,
		foreground: oklchToHex(values.foreground),
		id: "body-copy",
		inks: [],
		isDerived: false,
		kind: "body-copy",
		label: "Body copy on the page",
		passes: bodyRatio >= TEXT_BAR,
		ratio: bodyRatio,
		remedy: "If this fails nothing else on the page matters. Darken the foreground until it clears.",
		role: "foreground",
		suggestion: bodyRatio >= TEXT_BAR ? null : nudge(values.foreground, oklchToRgb(values.background), TEXT_BAR),
	});

	/* 2. Body copy on a card, now that the card is a field somebody can move. */
	const cardRatio = reportRatio(contrastOfRgb(oklchToRgb(values.foreground), oklchToRgb(values.surface)));
	rows.push({
		background: oklchToHex(values.surface),
		bar: TEXT_BAR,
		foreground: oklchToHex(values.foreground),
		id: "copy-on-card",
		inks: [],
		isDerived: isDerived("surface"),
		kind: "body-copy",
		label: "Body copy on a card",
		passes: cardRatio >= TEXT_BAR,
		ratio: cardRatio,
		remedy:
			"Most of the app's text sits on a card rather than on the page. Lighten the surface, or darken the foreground.",
		role: "surface",
		suggestion: cardRatio >= TEXT_BAR ? null : nudge(values.surface, oklchToRgb(values.foreground), TEXT_BAR),
	});

	for (const fill of FILLS) {
		const inks = inkOptionsFor(fill, values);
		const best = inks[0];
		const usable = inks.filter((ink) => ink.passes);

		/* 2. What can sit on this fill - answered from the palette, not assumed. */
		rows.push({
			background: oklchToHex(values[fill]),
			bar: TEXT_BAR,
			foreground: best.hex,
			id: `ink-on-${fill}`,
			inks,
			isDerived: isDerived(fill, best.role),
			kind: "ink",
			label: `Text on the ${ROLE_LABEL[fill]}`,
			passes: usable.length > 0,
			ratio: best.ratio,
			remedy:
				usable.length > 0
					? `Use your ${ROLE_LABEL[best.role]} for text on this - ${usable.length} of your colours work here.`
					: `Nothing in your palette is legible on this fill. Either darken it, or accept that it can only carry a glyph rather than a label.`,
			role: null,
			suggestion: null,
		});

		/* 3. Does the fill have an edge? A question about the fill alone. */
		const edgeRatio = reportRatio(contrastOfRgb(oklchToRgb(values[fill]), oklchToRgb(values.background)));
		rows.push({
			background: oklchToHex(values.background),
			bar: NON_TEXT_BAR,
			foreground: oklchToHex(values[fill]),
			id: `${fill}-on-page`,
			inks: [],
			isDerived: isDerived(fill),
			kind: "edge",
			label: `The ${ROLE_LABEL[fill]} against the page`,
			passes: edgeRatio >= NON_TEXT_BAR,
			ratio: edgeRatio,
			remedy:
				"Under 3:1 a filled control has no edge of its own against the page. Add a border, or accept it as a known trade - plenty of shipped design systems do.",
			role: fill,
			suggestion: edgeRatio >= NON_TEXT_BAR ? null : nudge(values[fill], oklchToRgb(values.background), NON_TEXT_BAR),
		});
	}

	return rows;
}

/* -------------------------------------------------------------------------- */
/* Advisories                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Things worth saying that are not contrast failures.
 *
 * Kept apart from the measured rows on purpose. Contrast is the wrong instrument
 * for "are these two the same colour" - two very different dark hues sit at
 * 1.2:1 against each other, so a ratio would flag every dark-brand palette ever
 * drawn. These are perceptual distances instead, and they are notes rather than
 * failures: nothing here is wrong, it is a consequence somebody should know
 * about before they build a page on it.
 */
export interface DesignerAdvisory {
	body: string;
	id: string;
	title: string;
}

/** Perceptual distance in oklab, where roughly 0.02 is "the same colour". */
function perceptualDistance(a: Oklch, b: Oklch): number {
	const toLab = (c: Oklch) => ({
		a: c.c * Math.cos((c.h * Math.PI) / 180),
		b: c.c * Math.sin((c.h * Math.PI) / 180),
		l: c.l,
	});
	const [x, y] = [toLab(a), toLab(b)];
	return Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b);
}

export function designerAdvisories(palette: DesignerPalette): DesignerAdvisory[] {
	const resolved = resolveDesignerPalette(palette);
	if (!resolved) return [];

	const { brand, foreground, secondary } = resolved.values;
	const notes: DesignerAdvisory[] = [];

	if (perceptualDistance(brand, foreground) < 0.02) {
		notes.push({
			body: "Brand-coloured text is therefore indistinguishable from body text. That is fine - plenty of brands do it - as long as the brand does its work as a FILL: buttons, bands, surfaces. It only bites if you wanted brand-coloured headings, in which case give foreground a near-black and keep this colour for surfaces.",
			id: "brand-is-foreground",
			title: "Your brand and foreground are the same colour.",
		});
	}

	if (perceptualDistance(brand, secondary) < 0.04) {
		notes.push({
			body: "They will read as one colour on screen, so the secondary is not buying you a second surface. Either push it further from the brand or leave it blank and let it be derived.",
			id: "secondary-too-close",
			title: "Your secondary is very close to your brand.",
		});
	}

	return notes;
}

/* -------------------------------------------------------------------------- */
/* The matrix                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Every colour against every other, as a grid.
 *
 * This is the form a designer already knows - UI Colors calls it a contrast
 * matrix, Coolors ships one, and every Figma contrast plugin draws the same
 * thing. It earns its place over a list of named pairings for a reason the list
 * cannot match: it makes no editorial choice at all. The reader scans for the
 * band they need and decides which pairs are real themselves, which is exactly
 * the judgement they were always going to make and are better placed to make -
 * they know what they are designing and this file does not.
 *
 * The named rows above are still worth having, but they answer a different
 * question. The matrix says WHAT IS TRUE of these five colours; the rows say
 * what to do about the two or three cases that usually bite.
 *
 * Bands are the four every contrast tool reports, so the numbers here can be
 * checked against any of them:
 *
 *   AAA   >= 7      normal text, enhanced (SC 1.4.6)
 *   AA    >= 4.5    normal text (SC 1.4.3)
 *   AA18  >= 3      large text only - 18pt, or 14pt bold
 *   fail  <  3      not usable for text at any size
 */
export type ContrastBand = "AA" | "AA18" | "AAA" | "fail";

export interface MatrixCell {
	band: ContrastBand;
	/** Null on the diagonal, where a colour is measured against itself. */
	ratio: number | null;
}

export interface ContrastMatrix {
	cells: MatrixCell[][];
	/** Row and column order, and the hex of each. */
	roles: { hex: string; isDerived: boolean; label: string; role: DesignerRole }[];
}

function bandFor(ratio: number): ContrastBand {
	if (ratio >= 7) return "AAA";
	if (ratio >= 4.5) return "AA";
	if (ratio >= 3) return "AA18";
	return "fail";
}

/**
 * Rows are the TEXT colour, columns are the background.
 *
 * Contrast is symmetric, so the grid is a mirror of itself - and it is drawn in
 * full anyway rather than as a triangle, because a reader looking up "my brand
 * as text on my background" should not have to work out which half of a triangle
 * that lives in.
 */
export function designerMatrix(palette: DesignerPalette): ContrastMatrix | null {
	const resolved = resolveDesignerPalette(palette);
	if (!resolved) return null;

	const roles = DESIGNER_ORDER.map((role) => ({
		hex: oklchToHex(resolved.values[role]),
		isDerived: (resolved.derived as string[]).includes(role),
		label: role,
		role,
	}));

	const cells = roles.map((row) =>
		roles.map((column): MatrixCell => {
			if (row.role === column.role) return { band: "fail", ratio: null };

			const ratio = reportRatio(
				contrastOfRgb(oklchToRgb(resolved.values[row.role]), oklchToRgb(resolved.values[column.role])),
			);
			return { band: bandFor(ratio), ratio };
		}),
	);

	return { cells, roles };
}

/**
 * The same grid for the DARK theme, built from what the generator will actually
 * emit rather than from the four hexes.
 *
 * ## Why the light grid alone was not enough
 *
 * The four supplied colours are LIGHT-theme inputs. Dark is derived: the ground
 * inverts, the ink inverts, `--brand-primary` inverts with them - and the brand
 * FILL does not, because it is theme-stable on purpose so the most brand-looking
 * thing on the page does not change between modes.
 *
 * That asymmetry is the whole problem, and one grid cannot show it. A designer
 * reading only the light grid sees their brand at 8.47:1 on the page and ships;
 * the same fill sits on a near-black page in dark and the light grid has no cell
 * for that. The failure it DOES contain - brand against foreground - reads as
 * "do not put brand text on your body colour", when what it means for this
 * system is "your brand fill is about to sit on the dark page".
 *
 * ## Brand here is the FILL, not the hex
 *
 * The light grid measures the hex the designer typed, because that is what they
 * are choosing and what `--brand-primary` carries. This one measures
 * `--gradient-brand-via` - the token that actually paints buttons, switches,
 * chips and brand cards. On most palettes they are the same colour; where they
 * are not, this is the one a reader points at, so this is the one to measure.
 *
 * Returns null on an incomplete palette, exactly like `designerMatrix`.
 */
export function designerDarkMatrix(
	palette: DesignerPalette,
	{ baseTint, brandTheme, surface }: { baseTint: number; brandTheme?: "dark" | "light"; surface: SurfaceStrategy },
): ContrastMatrix | null {
	const resolved = resolveDesignerPalette(palette);
	if (!resolved) return null;

	const built = buildPalette({
		accentHue: Math.round(resolved.values.brand.h),
		baseTint,
		brandTheme,
		// Same conditional the preview uses: handing the fallback card to the solver
		// would pin the card to the page and leave the Surface control inert.
		supplied: { ...resolved.values, surface: palette.surface ? resolved.values.surface : undefined },
		surface,
	});

	/*
	 * The neutrals are OPTIONAL on `PaletteThemeColors` - the emitter skips a token
	 * a theme does not carry, which is how `--field-border` stays dark-only. These
	 * four are always written for dark, but the type cannot know that, and reading
	 * them with a non-null assertion would turn a future emitter change into a
	 * `NaN` contrast rendered as a confident number. Bailing is the honest branch.
	 */
	const background = built.dark["--background"];
	const foreground = built.dark["--foreground"];
	const cardSurface = built.dark["--surface"];
	if (!background || !foreground || !cardSurface) return null;

	const value: Record<DesignerRole, Oklch> = {
		background,
		/*
		 * `--brand-primary`, the brand as TEXT - not the fill.
		 *
		 * This grid showed the FILL for a while, to expose the case where a brand
		 * button vanishes against a dark page. It exposed something else instead:
		 * every row of a contrast matrix is read as a TEXT colour - the header says
		 * so - and a fill measured as text answers a question nobody asks. Uber
		 * reported four AA cells that way, which read as "the derived theme is not
		 * AAA" when the actual pairings were 9.41, 8.27 and 7.22, all AAA. The fill
		 * was never type; it carries `--gradient-brand-foreground`, and that pairing
		 * is 7.20.
		 *
		 * So the grid measures the token that is actually type, and the fill's own
		 * two bars - its label at 7:1, its shape at 3:1 - are reported beneath it by
		 * `designerDarkFill`, where a non-text bar can be labelled as one.
		 */
		brand: built.dark["--brand-primary"],
		foreground,
		surface: cardSurface,
	};

	const roles = DESIGNER_ORDER.map((role) => ({
		hex: oklchToHex(value[role]),
		// Every value here is derived by definition: nobody types a dark theme.
		isDerived: true,
		label: role,
		role,
	}));

	const cells = roles.map((row) =>
		roles.map((column): MatrixCell => {
			if (row.role === column.role) return { band: "fail", ratio: null };

			const ratio = reportRatio(contrastOfRgb(oklchToRgb(value[row.role]), oklchToRgb(value[column.role])));
			return { band: bandFor(ratio), ratio };
		}),
	);

	return { cells, roles };
}

/* -------------------------------------------------------------------------- */
/* Reading a solved palette back out                                           */
/* -------------------------------------------------------------------------- */

/**
 * The five colours of a SOLVED palette, in the same shape a designer supplies.
 *
 * The exact inverse of `applySupplied` in palette.build.ts, and it exists so the
 * two kinds of theme stop being two kinds. A theme is five colours and a name;
 * some were solved to hit bars and some were handed over, and that difference is
 * a fact about their ORIGIN rather than about their shape. Once a preset can be
 * read back out in this shape, picking one and then editing a single value is
 * just editing - no mode to leave, nothing to convert.
 *
 * If the mapping in `applySupplied` moves, this has to move with it. They are
 * the two directions of one decision, and a test pins the round trip.
 */
export function paletteToDesigner(light: Record<string, Oklch>, stable: Record<string, Oklch>): DesignerPalette {
	return {
		accent: oklchToHex(stable["--rail-accent-tint"]),
		background: oklchToHex(light["--background"]),
		/*
		 * `light`, not `stable`. The brand fill moved into the per-theme blocks when
		 * it was anchored, and reading the old home returned `undefined` - which
		 * `oklchToHex` turned into a value that looked like a colour rather than
		 * into an error. LIGHT because that is the default anchor, and the round
		 * trip this feeds has to hand back the hex the designer typed.
		 */
		brand: oklchToHex(light["--gradient-brand-via"]),
		foreground: oklchToHex(light["--foreground"]),
		secondary: oklchToHex(light["--brand-secondary"]),
	};
}

/* -------------------------------------------------------------------------- */
/* Swatches for the picker                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Options to offer for one role, derived from the palette so far.
 *
 * ## Not a correction
 *
 * These are never framed as fixing a wrong hex, and that distinction is the
 * whole design of this function. Spotify green is 2.58:1 against white and
 * Spotify ships it; Netflix red with white text is 4.57:1, right on the AA line,
 * and Netflix ships that. A tool that called either "too bright to be a brand"
 * would be wrong about two of the most recognisable palettes in software.
 *
 * So each swatch carries WHY it is being offered, in terms of what it would buy,
 * and the value the reader typed is left exactly where it is until they press
 * one. The report says what the current choice costs; this says what the
 * alternatives would change. Neither says the designer was wrong.
 *
 * ## Where they come from
 *
 * The brand's own hue, held, with lightness walked in steps. Hue is the part
 * somebody chose - offering a different one is offering a different brand, which
 * is not a suggestion anybody asked for. Every swatch is gamut-clamped, so none
 * of them is a colour the browser would silently remap.
 */
export interface RoleSwatch {
	hex: string;
	/** What this value would buy, in the reader's terms. Empty for the current one. */
	why: string;
}

/** Steps away from a seed, at its own hue, skipping anything out of gamut. */
function ladder(seed: Oklch, steps: readonly number[]): Oklch[] {
	return steps
		.map((delta) => seed.l + delta)
		.filter((l) => l > 0.06 && l < 0.98)
		.map((l) => clampToGamut({ c: Math.min(seed.c, maxChroma(l, seed.h)), h: seed.h, l }));
}

export function swatchesFor(role: DesignerRole, palette: DesignerPalette): RoleSwatch[] {
	const resolved = resolveDesignerPalette(palette);
	if (!resolved) return [];

	const { values } = resolved;
	const current = values[role];
	const background = oklchToRgb(values.background);
	const out: RoleSwatch[] = [{ hex: oklchToHex(current), why: "" }];

	const push = (color: Oklch, why: string) => {
		const hex = oklchToHex(color);
		if (!out.some((swatch) => swatch.hex === hex)) out.push({ hex, why });
	};

	if (role === "background" || role === "foreground") {
		// The ground, tinted by the brand so the neutrals belong to the palette
		// rather than being a generic grey dropped beside it.
		const isPage = role === "background";
		const anchor = isPage ? 0.98 : 0.22;
		const noun = isPage ? "the page" : "the type";
		for (const [tint, why] of [
			[0, `a pure neutral - no brand in ${noun}`],
			[0.4, `a trace of the brand, so ${noun} belongs to the palette`],
			[0.9, `clearly tinted, for ${noun} reading as branded`],
		] as const) {
			push(
				clampToGamut({ c: Math.min(0.02 * tint, maxChroma(anchor, values.brand.h)), h: values.brand.h, l: anchor }),
				why,
			);
		}
		return out;
	}

	// A fill. What changes across the ladder is whether it has an edge against the
	// page and what can be written on it, so that is what each option says.
	for (const candidate of ladder(current, [-0.18, -0.12, -0.06, 0.06, 0.12])) {
		const edge = contrastOfRgb(oklchToRgb(candidate), background);
		const inks = inkOptionsFor(role, { ...values, [role]: candidate }).filter((ink) => ink.passes);

		const why =
			edge >= NON_TEXT_BAR && inks.length > 0
				? `${reportRatio(edge)}:1 against the page, and your ${inks[0].role} reads on it`
				: edge >= NON_TEXT_BAR
					? `${reportRatio(edge)}:1 against the page - but nothing in the palette reads on it`
					: `no edge against the page (${reportRatio(edge)}:1)`;

		push(candidate, why);
	}

	return out;
}

/**
 * The dark brand FILL's own two bars, reported beside the grid rather than in it.
 *
 * A fill has obligations a matrix cannot express, because a matrix reads every
 * value as text: it has to carry its own label (7:1) and be findable as a shape
 * against what is behind it (3:1, SC 1.4.11 - a fill is a graphic). Putting it in
 * the grid measured it against the wrong bar and reported AA on a pairing that
 * clears its real one twice over.
 */
export function designerDarkFill(
	palette: DesignerPalette,
	{ baseTint, brandTheme, surface }: { baseTint: number; brandTheme?: "dark" | "light"; surface: SurfaceStrategy },
): { hex: string; onGround: number; onInk: number } | null {
	const resolved = resolveDesignerPalette(palette);
	if (!resolved) return null;

	const built = buildPalette({
		accentHue: Math.round(resolved.values.brand.h),
		baseTint,
		brandTheme,
		supplied: { ...resolved.values, surface: palette.surface ? resolved.values.surface : undefined },
		surface,
	});

	const fill = built.dark["--gradient-brand-via"];
	const ink = built.dark["--gradient-brand-foreground"];
	// The lightest ground a brand control lands on, which is the binding one.
	const ground = built.dark["--surface-secondary"] ?? built.dark["--background"];
	if (!ground) return null;

	return {
		hex: oklchToHex(fill),
		onGround: reportRatio(contrastOfRgb(oklchToRgb(fill), oklchToRgb(ground))),
		onInk: reportRatio(contrastOfRgb(oklchToRgb(ink), oklchToRgb(fill))),
	};
}
