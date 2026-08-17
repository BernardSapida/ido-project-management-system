/**
 * The palette generator.
 *
 * Every brand colour in this template is SOLVED against a contrast bar rather
 * than picked, and this is where the solving happens. Give it an accent hue and
 * it returns a full brand palette for both themes in which every text pairing
 * clears 7:1 and every non-text pairing clears 3:1 - by construction, at that
 * hue, not by inheritance from a hue that happened to work.
 *
 * Three things this file is built around, all of them learned the expensive way:
 *
 * 1. **A single fill lightness cannot serve both themes.** 7:1 under near-white
 *    ink needs relative luminance at or below ~0.10; 7:1 under near-black ink
 *    needs it at or above ~0.44. No colour is both. So the brand fill INVERTS -
 *    deep in light under pale ink, pale in dark under deep ink - and carries its
 *    own paired foreground so a caller can never mismatch them.
 *
 * 2. **A gradient used as text answers to the page, not to ink on top of it.**
 *    That is the opposite obligation, so it is a second ramp
 *    (`--gradient-brand-ink`) and not a reuse of the fill. Painting the wordmark
 *    in the fill ramp is what put it at 1.4:1 on a dark page.
 *
 * 3. **Hue moves luminance.** Amber at oklch L 0.62 and blue at oklch L 0.62 are
 *    nowhere near the same brightness, and amber runs out of chroma at a
 *    lightness where blue has plenty left. Every lightness below is therefore
 *    the OUTPUT of a search at that specific hue, and every chroma is clamped to
 *    what sRGB can actually paint there - see oklch.ts for why an unclamped
 *    value measures as a colour the browser never draws.
 *
 * The near-neutrals are generated here too, but they are not SOLVED - their
 * lightnesses are fixed and only the tint (chroma) and hue move with the
 * palette. At chroma 0.045 and below the gamut ceiling is nowhere near, so
 * there is nothing to solve; what matters is that the ground carries the
 * brand's hue rather than sitting on a neutral axis beside it. A neutral grey
 * surrounded by tinted dark does not read as grey - the eye subtracts the
 * surround's hue and what is left reads as its opposite, which is how a table
 * header bar came out brown on a blue-black page.
 *
 * At the default tint of 0.02 every neutral below reproduces the template's
 * committed value exactly, so switching the ground onto the generator is not a
 * visual change until someone moves the slider.
 */

import { inkFor, inkForAll } from "./designer-palette";
import type { Oklch } from "./oklch";
import { clampToGamut, contrastRatio, maxChroma } from "./oklch";

/* -------------------------------------------------------------------------- */
/* The bars                                                                    */
/* -------------------------------------------------------------------------- */

/** SC 1.4.6 enhanced, the bar this template holds every brand text pairing to. */
export const AAA_TEXT = 7;
/** SC 1.4.3, reported alongside so a failure says how far it fell. */
export const AA_TEXT = 4.5;
/** SC 1.4.11 non-text: a glyph or a control's own fill against what is behind it. */
export const NON_TEXT = 3;

/**
 * What the solver aims for, above what the report demands.
 *
 * The gap absorbs two roundings: the four decimal places the stylesheet carries,
 * and the browser's 8-bit quantisation of the result. Solving to exactly 7.0
 * produces values that measure 6.98 once shipped.
 */
const TEXT_TARGET = 7.2;
const NON_TEXT_TARGET = 3.25;

/* -------------------------------------------------------------------------- */
/* Shape of a palette                                                          */
/* -------------------------------------------------------------------------- */

/** Every colour token a palette owns. Neutrals are not here - see the header. */
export type BrandToken =
	| "--brand-accent"
	| "--brand-muted"
	| "--brand-pale"
	| "--brand-primary"
	| "--brand-primary-foreground"
	| "--brand-secondary"
	| "--brand-secondary-foreground"
	| "--brand-edge"
	| "--chip-accent-soft"
	| "--chip-accent-soft-foreground"
	| "--gradient-brand-ink-from"
	| "--gradient-brand-ink-to"
	/*
	 * The brand FILL, and it is per-theme now. It used to be stable - see the
	 * note on StableBrandToken for what that bought and why it could not hold.
	 */
	| "--gradient-brand-foreground"
	| "--gradient-brand-from"
	/**
	 * The brand fill's INTERACTION step - hover and pressed on a primary control.
	 *
	 * Its own token rather than the ramp's end stop, which is what `ui.css` used to
	 * read. Those are two different jobs that happened to share a name: `from`,
	 * `via` and `to` describe a decorative SWEEP, and a supplied brand flattens all
	 * three to the one hex on purpose (sweeping it pushes the lightest stop under
	 * the ink bar). Flat is right for the surface and fatal for the state - it made
	 * `--button-bg-hover` resolve to exactly `--button-bg`, so the primary button
	 * and the checked switch had no visible hover or pressed state on eight of the
	 * nine palettes. Only `custom`, the one solved palette, still had a real ramp
	 * to walk.
	 *
	 * Solved rather than mixed, so it cannot break the label: it is a step away
	 * from the fill that still clears the same ink at 7.2.
	 */
	| "--gradient-brand-hover"
	| "--gradient-brand-to"
	| "--gradient-brand-via";

/**
 * Theme-stable tokens: the same value in light and dark.
 *
 * ## The brand fill used to be here, and is not any more
 *
 * It was locked to one colour in both themes on the argument that this is what
 * makes a brand recognisable, with `--brand-edge` drawing an outline in light
 * where the fill itself could not clear SC 1.4.11. That reasoning was sound and
 * the implementation outlived it: the outline was removed from `ui.css` as "a
 * hairline nobody asked for", which left the light side resting on an edge that
 * is generated and never drawn.
 *
 * Measured across the nine palettes, a single locked lightness left four of them
 * under 3:1 against one of their two grounds - spotify, coinbase and custom on
 * the light page, revolve on the dark page and every dark card. The luminance
 * windows are simply disjoint above the non-text bar once both grounds and their
 * cards are counted, so no single value clears all four.
 *
 * So the fill is per-theme now, and it is ANCHORED rather than solved twice: one
 * theme carries the brand exactly as supplied, and the other carries the nearest
 * lightness at the same hue and chroma that clears its own grounds. See
 * `PaletteRequest.brandTheme` for which theme is which, and `fillClearing` for
 * the derivation.
 *
 * The two values are identical whenever the anchor already clears both. That is
 * the case worth stating: a brand that works in both themes is still ONE colour,
 * and only a brand that cannot be gets a second, close sibling.
 *
 * What is NOT anchored, and cannot be: `--accent`. HeroUI chains
 * `--color-accent: var(--accent)`, so one token colours both its filled controls
 * AND every `text-accent` in the app - 112 call sites here. Text has no border
 * exemption, so brand-coloured text must still darken on a light page.
 * `--accent` therefore keeps its per-theme inversion and stays AAA.
 */
export type StableBrandToken =
	/**
	 * The large brand SURFACE, and the ink it carries. A separate pair from the
	 * gradient fill, because one token was doing two jobs that pull opposite ways.
	 *
	 * A control - a button, a switch, a chip - has to read as an action, so its
	 * fill is saturated. That saturation is what forces its ink to near-black:
	 * `--gradient-brand-foreground` comes out around #000610, and it cannot be
	 * made more brand-coloured because at that lightness the chroma is already at
	 * the sRGB ceiling. Push it toward a navy and 7:1 fails.
	 *
	 * A card does not need to read as an action. Freed from that, the surface can
	 * be a pale tint and the ink a real brand navy - the pairing every generator
	 * reaches for, and the one a designer recognises. It measures over 10:1 at
	 * every hue, against 7.2 for the fill.
	 *
	 * Genuinely theme-stable, unlike the fill above: it is a PALE tint carrying a
	 * deep ink, and a pale surface clears its ground in both themes - 1.41 on the
	 * white page as a decorative tint with a solved 10.2:1 ink on it, 14.45 on the
	 * dark page. It is the direction that survives being locked; the fill's does
	 * not.
	 */
	| "--brand-surface"
	| "--brand-surface-foreground"
	| "--rail-accent-from"
	| "--rail-accent-tint"
	| "--rail-accent-to"
	/**
	 * The brand at eleven lightnesses - Tailwind's scale, on this palette's hue.
	 * See {@link brandRamp} for the derivation and for why these are the one part
	 * of the brand that does NOT invert between themes.
	 */
	| `--brand-${RampStep}`;

/**
 * The stable tokens that are SOLVED, as opposed to the ramp.
 *
 * The ramp is derived from the finished brand fill - which `applySupplied` may
 * still replace - so it is composed at the very end of `buildPalette` rather
 * than alongside these. Everything before that point works with this narrower
 * type, so the ordering is a type error rather than a convention.
 */
export type SolvedStableToken = Exclude<StableBrandToken, `--brand-${RampStep}`>;

/**
 * The ground. Fixed lightnesses, tinted by the palette.
 *
 * `--field-border` is dark-only by design: in light a white field on a white
 * card is separated by its shadow, and in dark HeroUI leaves both the border
 * and the shadow transparent, so without one an input dissolves into the card.
 * The emitter simply skips a token a theme does not carry.
 */
export type NeutralToken =
	| "--background"
	| "--border"
	| "--default"
	| "--field-background"
	| "--field-border"
	| "--foreground"
	| "--glass-opaque"
	| "--glass-opaque-strong"
	| "--glass-tint"
	| "--muted"
	| "--overlay"
	| "--overlay-foreground"
	| "--separator"
	| "--surface"
	| "--surface-foreground"
	| "--surface-secondary"
	| "--surface-tertiary";

export type ThemeName = "dark" | "light";

/**
 * The ceiling on `baseTint`, and the one place it is stated.
 *
 * Not a gamut limit - the neutrals are dark enough that far more chroma would
 * still resolve. It is the point past which a "tinted grey" has stopped being
 * one: at 0.04 the card token's 1.25x multiplier puts the ground on a colour
 * somebody would name, and the palette's actual accent no longer has a neutral
 * to be an accent against.
 *
 * Exported because two things enforce it - the customizer's slider and the
 * generator's `--apply` validation - and a ceiling written down twice is a
 * ceiling that ends up being two different numbers.
 */
export const TINT_MAX = 0.04;

export interface PaletteRequest {
	/** Accent hue in degrees. The one number a preset is. */
	accentHue: number;
	/**
	 * Which theme the supplied brand hex is the REAL brand for.
	 *
	 * A four-colour brand deck says "our green is #315443" and does not say which
	 * mode that green is the green of. It has to, because no single lightness
	 * clears the non-text bar against both a white page and a dark card - so one
	 * theme gets the hex verbatim and the other gets a sibling.
	 *
	 * `light` for a project that ships light by default, `dark` for one that ships
	 * dark. Ignored when nothing is supplied: a solved palette has no hex to
	 * anchor and simply gets the right fill in each theme.
	 */
	brandTheme?: ThemeName;
	/** Chroma of the near-neutrals: 0 is a pure grey ground, 0.04 is strongly tinted. */
	baseTint: number;
	/**
	 * Light mode's page/card ladder. Defaults to `flat`, which is what every
	 * palette shipped before this existed, so an omitted value cannot change a
	 * committed theme. Dark mode ignores it - it already ladders.
	 */
	surface?: SurfaceStrategy;
	/**
	 * Colours a designer supplied, which override the solve rather than seed it.
	 *
	 * LIGHT ONLY, and that is a limitation rather than an oversight: a brand deck
	 * is drawn against a white page. A supplied `#EEF0E5` background is meaningless
	 * on a dark theme, so dark keeps its solved neutrals and takes only the brand
	 * fills, which are theme-stable anyway. The customizer says so on screen; see
	 * spec 003's edge case about surviving a theme flip.
	 *
	 * Every value here lands verbatim. What IS solved is the ink that goes on each
	 * one - no brand deck contains it and it cannot be guessed - which is why the
	 * companions below are computed and the fills are not.
	 */
	supplied?: SuppliedColors;
}

/** The roles, already parsed and with any absent ones derived. */
export interface SuppliedColors {
	accent: Oklch;
	background: Oklch;
	brand: Oklch;
	foreground: Oklch;
	secondary: Oklch;
	/**
	 * The card, and the ONLY optional member - which is the whole of how a typed
	 * card colour and the Surface control avoid fighting.
	 *
	 * Present means somebody typed one, and it wins outright like every other
	 * supplied value. Absent means they did not, and the surface strategy decides:
	 * `flat` leaves the card at the page's colour, `raised` steps it off. If this
	 * were derived and always present, the strategy could never act - which is
	 * exactly the bug a supplied `--background` used to cause for the old page-
	 * moving version of `raised`.
	 */
	surface?: Oklch;
}

export type PaletteThemeColors = Partial<Record<NeutralToken, Oklch>> & Record<BrandToken, Oklch>;

export interface BuiltPalette {
	accentHue: number;
	baseTint: number;
	dark: PaletteThemeColors;
	light: PaletteThemeColors;
	/** Declared once, on the light block, and inherited by dark. */
	stable: Record<StableBrandToken, Oklch>;
}

/* -------------------------------------------------------------------------- */
/* Solvers                                                                     */
/* -------------------------------------------------------------------------- */

/** Chroma we would like, before the gamut has its say. */
const FILL_CHROMA = 0.21;
const INK_CHROMA = 0.19;

/**
 * The bar the brand SURFACE's ink is solved to, and deliberately far above the
 * 7.2 the rest of the system targets.
 *
 * Not ambition for its own sake - it is contrast that costs nothing here. The
 * fill's ink is pinned near-black by the fill's own saturation and lands at 7.2
 * with no headroom. A tint has no such constraint, so aiming at 7.2 would stop
 * the solver at the first navy that clears it and leave several stops of legibility
 * unclaimed. 10.2 puts it where the reference generators put theirs.
 */
const SURFACE_TEXT_TARGET = 10.2;
const RAIL_CHROMA = 0.19;

/**
 * The ink on a secondary fill, and the reason it is brand-coloured rather than
 * the page's own foreground.
 *
 * A secondary control is a pale, nearly neutral fill - see the derivation in
 * designer-palette.ts. What makes it read as a CONTROL rather than as a slab of
 * grey is that its label is in the brand's hue: that is the whole visual
 * identity of the pattern in HeroUI, shadcn and Material alike, and a near-black
 * label on the same fill reads as a disabled button.
 *
 * Shared by both paths on purpose. The solved palette and a designer's five now
 * produce the same treatment, and these two constants are what guarantee it -
 * two hand-written 0.14s is how they drifted apart the first time.
 */
const SECONDARY_INK_CHROMA = 0.14;
const SECONDARY_INK_HUE_SHIFT = 8;

/** The gradient travels hue, not just lightness - a one-hue ramp reads as a
 *  badly printed flat colour. This is how far, start to end. */
const HUE_TRAVEL = 26;

const at = (l: number, c: number, h: number): Oklch => clampToGamut({ c, h, l });

/* -------------------------------------------------------------------------- */
/* The brand ramp                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Tailwind's own oklch lightnesses, which is the whole reason for the numbers.
 *
 * A designer handing over a screen says "the brand at 100" and means the tint
 * they get from `blue-100`. Inventing our own eleven lightnesses would make the
 * scale technically a scale and practically a guessing game.
 */
const RAMP_L = {
	50: 0.971,
	100: 0.932,
	200: 0.882,
	300: 0.809,
	// Tailwind's own lightness for step 400. Its nearness to Math.SQRT1_2 is a
	// coincidence, and substituting the constant would silently move the step.
	// biome-ignore lint/suspicious/noApproximativeNumericConstant: see above
	400: 0.707,
	500: 0.623,
	600: 0.546,
	700: 0.488,
	800: 0.424,
	900: 0.379,
	950: 0.282,
} as const;

/**
 * Chroma per step, as a fraction of the brand's own.
 *
 * A ramp at flat chroma is the failure mode: the pale end comes out chalky and
 * the dark end muddy, because a colour needs less chroma to read as coloured
 * when it is light and more when it is dark. Peaking just past the middle is
 * what Tailwind's own palettes do, and 600 sitting fractionally above 500 is
 * deliberate - it is where sRGB has the most room at this hue.
 */
const RAMP_C = {
	50: 0.1,
	100: 0.19,
	200: 0.36,
	300: 0.58,
	400: 0.82,
	500: 1,
	600: 1.02,
	700: 0.98,
	800: 0.86,
	900: 0.76,
	950: 0.6,
} as const;

export type RampStep = keyof typeof RAMP_L;

export const RAMP_STEPS = Object.keys(RAMP_L).map(Number) as RampStep[];

/**
 * How much either half of the ramp may be squeezed before the warp stops being
 * worth doing, as a fraction of the span it would have had on the canonical
 * curve.
 *
 * Measured rather than picked. `revolve`'s brand is a near-black green at L
 * 0.2949, barely above the 950 step's 0.282 - warping through it leaves the
 * whole deep half 0.013 of lightness to cover in five steps, which is 0.0026
 * each and indistinguishable on screen. 800, 900 and 950 come out as the same
 * colour three times.
 *
 * At 0.45 the tightest half still gets ~0.031 per step, which is a visible
 * difference at every hue. Eight of the nine shipped palettes clear it; the one
 * that does not falls back to the canonical curve, which is a real scale that
 * merely does not have the brand sitting exactly on 500. A degenerate scale that
 * keeps the anchor is the worse trade - the anchor is already addressable as
 * `bg-app-brand`, and what a ramp is FOR is the steps.
 */
const RAMP_MIN_SPAN = 0.45;

/**
 * The brand at eleven lightnesses, on ONE hue.
 *
 * **Theme-stable, and that is the rule the whole thing rests on.** Every other
 * brand token here inverts - deep under pale ink in light, pale under dark ink
 * in dark - because that is the only way to reach AAA in both themes. A numeric
 * scale cannot follow: `50` means THE LIGHTEST STEP, exactly as it does in stock
 * Tailwind, and a ramp that flipped would turn a designer's
 * `text-app-brand-900` on `bg-app-brand-50` into dark-on-dark the moment
 * somebody toggled the theme. So this is emitted once, on the light block, and
 * dark inherits it unchanged. A dark-mode design reaches for `dark:bg-app-brand-950`.
 *
 * **Nothing in the package reads these, and nothing should.** The semantic
 * tokens are solved against their grounds and measured; these eleven are raw
 * paint, carrying no contrast guarantee on their own. They exist for UI a
 * designer drew against specific tints, which the semantic set cannot express
 * because it is solved for a ROLE and not for a value. Reaching for a step means
 * taking on the pairing yourself - the same obligation `--brand-surface` already
 * states in tokens.css.
 *
 * **500 is the brand itself.** The canonical lightnesses are warped piecewise
 * through the anchor rather than the anchor being snapped onto the nearest of
 * them, so `bg-app-brand-500` is exactly the hex a designer handed over. Both
 * halves stay monotonic by construction: 50 and 950 are pinned and each side
 * interpolates to the anchor.
 *
 * The case that cannot hold is a brand already near an endpoint - `revolve`'s
 * near-black green is the shipped example. Warping through it would leave one
 * half of the ramp no lightness to spend, so below `RAMP_MIN_SPAN` the anchor is
 * dropped and the canonical curve is used unwarped. That palette's 500 is then
 * the brand's hue and chroma at the canonical lightness rather than the brand
 * itself, and {@link isRampAnchored} reports which case a palette is in.
 * Ordering and distinguishability are the contract; 500-is-exact is the
 * courtesy, and it is the one that gives way.
 */
export function isRampAnchored(brand: Oklch): boolean {
	const paleSpan = (RAMP_L[50] - brand.l) / (RAMP_L[50] - RAMP_L[500]);
	const deepSpan = (brand.l - RAMP_L[950]) / (RAMP_L[500] - RAMP_L[950]);

	return Math.min(paleSpan, deepSpan) >= RAMP_MIN_SPAN;
}

export function brandRamp(brand: Oklch): Record<RampStep, Oklch> {
	// Falling back means anchoring on the canonical 500, which makes `warp` the
	// identity - so the two paths are one piece of arithmetic rather than a
	// branch that could drift.
	const anchored = isRampAnchored(brand);
	const anchor = anchored ? brand.l : RAMP_L[500];

	const warp = (l: number) => {
		if (l >= RAMP_L[500]) {
			// The pale half: 500 → 50 stretched onto anchor → 50.
			const t = (l - RAMP_L[500]) / (RAMP_L[50] - RAMP_L[500]);
			return anchor + t * (RAMP_L[50] - anchor);
		}

		// The deep half: 950 → 500 stretched onto 950 → anchor.
		const t = (l - RAMP_L[950]) / (RAMP_L[500] - RAMP_L[950]);
		return RAMP_L[950] + t * (anchor - RAMP_L[950]);
	};

	const ramp = Object.fromEntries(
		RAMP_STEPS.map((step) => [step, at(warp(RAMP_L[step]), brand.c * RAMP_C[step], brand.h)]),
	) as Record<RampStep, Oklch>;

	/*
	 * 500 is the anchor VERBATIM, not the anchor run back through `at`.
	 *
	 * `clampToGamut` takes a deliberate 3% haircut off the sRGB boundary, and
	 * applying it to a value that has already been through it shaves the colour a
	 * second time - netflix came out at chroma 0.2306 against a brand of 0.2349.
	 * Small, and still a broken promise: the whole reason the curve is warped
	 * through the anchor is so a designer's hex survives as its own 500. The
	 * anchor is a shipped token, so it is in gamut already and needs no clamping.
	 *
	 * Only on the anchored path, though. A palette that fell back to the canonical
	 * curve has no anchor to be exact about, and 500 there is a step like the
	 * other ten.
	 */
	if (anchored) ramp[500] = brand;

	return ramp;
}

/** The same ramp, keyed by the custom property each step is emitted as. */
function rampTokens(brand: Oklch): Record<`--brand-${RampStep}`, Oklch> {
	return Object.fromEntries(
		Object.entries(brandRamp(brand)).map(([step, color]) => [`--brand-${step}`, color]),
	) as Record<`--brand-${RampStep}`, Oklch>;
}

/**
 * The lightest this hue can be and still clear `bar` against `against`.
 *
 * A downward scan rather than a bisection, deliberately: chroma is re-clamped at
 * every step, and the gamut ceiling is not monotonic in lightness, so contrast
 * is not guaranteed monotonic either. A 0.002 scan is ~490 evaluations of some
 * cheap arithmetic and it cannot land on the wrong side of a kink.
 */
function lightestPassing(hue: number, chroma: number, against: Oklch, bar: number): number {
	for (let l = 0.98; l >= 0.02; l -= 0.002) {
		if (contrastRatio(at(l, chroma, hue), against) >= bar) return Number(l.toFixed(3));
	}
	return 0.02;
}

/** The darkest this hue can be and still clear `bar`. The dark theme's half. */
function darkestPassing(hue: number, chroma: number, against: Oklch, bar: number): number {
	for (let l = 0.02; l <= 0.98; l += 0.002) {
		if (contrastRatio(at(l, chroma, hue), against) >= bar) return Number(l.toFixed(3));
	}
	return 0.98;
}

/**
 * Place a ramp so that EVERY stop passes, keeping the shape the offsets describe.
 *
 * The naive version solves the limiting stop and spaces the others off it, which
 * is wrong as soon as the ramp travels hue: the stop that limits at blue is not
 * the stop that limits at amber. This solves each stop at its own hue and then
 * slides the whole ramp to the tightest of them, so the ramp keeps its travel
 * and no stop is left over the line.
 */
function placeRamp(
	hues: number[],
	offsets: number[],
	chroma: number,
	solve: (hue: number) => number,
	direction: "down" | "up",
): Oklch[] {
	const limits = hues.map(solve);
	const anchors = limits.map((limit, index) => limit - offsets[index]);
	const anchor = direction === "down" ? Math.min(...anchors) : Math.max(...anchors);

	return hues.map((hue, index) => at(Math.min(0.97, Math.max(0.05, anchor + offsets[index])), chroma, hue));
}

/* -------------------------------------------------------------------------- */
/* The build                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The dark page, as the ink ramp sees it.
 *
 * Kept in step with `--background` in the `.dark` block of styles.css by the
 * measurement suite, which reads the shipped value rather than this constant.
 */
/**
 * The dark page, as a lightness.
 *
 * 0.11863 is `#060606` at zero tint - chosen as a hex first and converted, so
 * the ground is a value someone can recognise rather than a number that happens
 * to land near one. Everything measured against the page reads it from here.
 */
const DARK_PAGE_L = 0.11863;

/**
 * The light page a wordmark has to survive, and it is a constant again.
 *
 * `--brand-*` ink and the `text-gradient` ramp are solved to 7:1 against the
 * page, so while `raised` moved the page this had to move with it - that is what
 * made the raised variant emit new brand ink rather than just a new background.
 *
 * Now that `raised` moves the CARD instead, the page is pure white under every
 * strategy and the brand ramp is solved against one ground again. The raised
 * variant emits the card and the glass tokens that have to agree with it, and
 * nothing else.
 */
const LIGHT_PAGE_L = 1;

/**
 * The ground, as [lightness, tint multiplier] per token.
 *
 * The multipliers are not decoration - they are the relationships the two
 * themes were tuned to and they have to survive the tint slider moving. A
 * border at the same chroma as the page it separates stops being a border.
 *
 * Pure white entries carry a multiplier of 0: `--background`, `--surface` and
 * `--overlay` in light are white, full stop. Tinting the page as well as the
 * components on it is what makes a light theme look like a filter was left on.
 */
const LIGHT_NEUTRALS: Partial<Record<NeutralToken, [lightness: number, tint: number]>> = {
	"--background": [1, 0],
	"--border": [0.9, 0.75],
	"--default": [0.94, 0.4],
	"--foreground": [0.23, 2],
	"--glass-opaque": [1, 0],
	"--glass-opaque-strong": [1, 0],
	"--glass-tint": [1, 0],
	"--muted": [0.5, 1.5],
	"--overlay": [1, 0],
	"--overlay-foreground": [0.23, 2],
	"--separator": [0.92, 0.75],
	"--surface": [1, 0],
	"--surface-foreground": [0.23, 2],
	"--surface-secondary": [0.955, 0.4],
	"--surface-tertiary": [0.94, 0.4],
};

/**
 * The dark ground, and the block where every lightness here was argued for.
 *
 * `--surface` sits a step ABOVE `--background`, not below it: on a dark ground
 * a card reads as raised by being lighter, which is the inverse of light mode
 * where the page is tinted and the card is pure white. Getting that backwards
 * makes a dark UI look like the cards are holes cut in the page.
 *
 * The three neutrals under it - `--surface-secondary`, `--surface-tertiary` and
 * `--default` - are all overridden because HeroUI's own dark defaults are TRUE
 * greys (hue 286 at 0.0037 chroma, hue 248 at 0.0024, hue 286 at 0.006 - which
 * is to say no hue at all). A neutral grey surrounded by tinted dark does not
 * read as grey: the eye judges hue against its surround, subtracts the
 * surround's, and what is left reads as the opposite. On a blue-black table the
 * header bar came out brown. The tint multipliers put them back on the
 * palette's axis, which is why this looks like a colour change and is really an
 * alignment.
 *
 * Two of them also moved in LIGHTNESS, which no amount of tint would have fixed:
 *
 *   --surface-tertiary  the skeleton block, drawn at 70%. At HeroUI's 0.272 over
 *                       a 0.21 surface it composites to about 0.25 - a 0.04 step
 *                       that reads as a smudge rather than as placeholder rows.
 *                       0.34 lands the composite near 0.30. The shimmer follows
 *                       on its own; `via-surface-tertiary` is the same token.
 *   --default           the widest-reaching neutral in HeroUI: the tertiary
 *                       Button's fill, ghost and outline hover, and the row
 *                       hover a Table drops on its cells as `bg-default/50`,
 *                       which AppTable then color-mixes to repaint its pinned
 *                       column opaque. At 0.274 the row hover was a 0.03 step -
 *                       close enough to invisible that a table gave no feedback
 *                       under the cursor. 0.32 puts the hover near 0.265, where
 *                       it reads as a hover without reading as a selection.
 *                       --default-hover and the two soft variants are mixed FROM
 *                       this by HeroUI, so they follow.
 *
 * `--field-background` is opaque here, unlike its translucent light-theme twin:
 * the same field appears on `--surface` (0.21) and directly on `--background`
 * (0.16), and a translucent fill would tint differently on each, inverting the
 * recess on one of them. `--field-border` is dark-only for the same reason it
 * exists at all - HeroUI leaves both the border and the field shadow
 * transparent in dark, so without it an input dissolves into the card.
 */
const DARK_NEUTRALS: Partial<Record<NeutralToken, [lightness: number, tint: number]>> = {
	// #060606 and #181818 at zero tint. Both are hexes first, converted to the
	// lightness that produces them exactly, so the two anchors of the dark theme
	// are values a designer can name. The gap between them is wider than it was
	// (0.088 against 0.05): a card now reads as clearly raised off a near-black
	// page rather than as a slightly different near-black.
	"--background": [DARK_PAGE_L, 1],
	"--border": [0.32, 1.5],
	"--default": [0.32, 1.5],
	// Recessed, and now genuinely between the page and the card rather than a
	// hair under the card - which is what a field wants on a dark ground.
	"--field-background": [0.17, 1.1],
	"--field-border": [0.38, 1.5],
	"--foreground": [0.95, 0.6],
	"--glass-opaque": [0.23, 1.4],
	"--glass-opaque-strong": [0.25, 1.5],
	// Glass tints from the surface rather than from white. A white-tinted panel
	// over a dark page is fog, not glass.
	"--glass-tint": [0.26, 1.5],
	// Muted TEXT, so it is held above the 4.5:1 line against --surface rather
	// than set to whatever looks recessive.
	"--muted": [0.72, 1.5],
	"--overlay": [0.23, 1.4],
	"--overlay-foreground": [0.95, 0.6],
	"--separator": [0.28, 1.5],
	"--surface": [0.20684, 1.25],
	"--surface-foreground": [0.95, 0.6],
	"--surface-secondary": [0.26, 1.4],
	"--surface-tertiary": [0.34, 1.5],
};

/**
 * How light mode separates the page from the cards on it.
 *
 * Dark mode has always laddered - `#060606` page under `#181818` cards, a gap
 * of 0.088 - but light mode shipped both at pure white and let a `0.9` border
 * and a shadow do all the separating. That is a real choice (it is the
 * monochromatic option), but it leaves light mode with three background layers
 * where dark has four, and with no structural surface at all.
 *
 * `raised` gives it one, and it does so by moving the CARD.
 *
 * ## It used to move the page, and that was the wrong end
 *
 * The first version stepped `--background` down to 0.98 and left cards at pure
 * white. It read correctly and it was measured carefully, but it could not
 * survive contact with the other half of this system: `applySupplied` runs last
 * and writes a designer's `--background` verbatim, so on any palette with a
 * supplied page - which is every preset, and every draft in the customizer -
 * pressing Raised moved nothing at all. The control was inert exactly where it
 * was most wanted, and the page ended up explaining that instead of fixing it.
 *
 * Moving the card has none of that problem: nobody supplies a card unless they
 * mean to, and when they do it wins, which is the same rule every other supplied
 * value follows. It is also what the ladder already implies - `--surface-
 * secondary` and `--surface-tertiary` sit at 0.955 and 0.94, BELOW the page, so
 * a card at 1.0 was the one rung out of order. And it is the standard pattern
 * rather than an invention: Material's light surface containers get darker as
 * they get more prominent, not lighter.
 *
 * ## What it costs, which is the glass recipe
 *
 * A card here is `color-mix(--glass-tint 75%, transparent)` over the page, so it
 * has no colour of its own - three quarters of a tint plus a quarter of whatever
 * is behind it. Moving the card therefore means solving the tint backwards from
 * the colour we want, which is what `glassTintFor` below does. The exact version
 * of that is `card: "solid"`, where the card simply IS `--surface`; see
 * CARD_OPTIONS.
 */
export type SurfaceStrategy = "flat" | "raised";

/**
 * The card, one step off the page.
 *
 * 0.98 with 0.6 of the base tint - the same two numbers the page-moving version
 * used, kept deliberately. The step size was never the part that was wrong, and
 * reusing it means the ladder a project already looked at and approved lands in
 * the same place, one rung lower down the stack.
 *
 * What DOES go away with the reversal is the 0.98-vs-0.975 argument that used to
 * live here. It existed because dropping the page darkened what the brand fill
 * sits on, and `brand-fill-on-page` is pinned above 2.2: the row ran
 * 2.37 -> 2.27 -> 2.24 -> 2.20 across 1.0 / 0.985 / 0.98 / 0.975 and 0.975
 * landed exactly on the pin. The page no longer moves, so that row no longer
 * moves with it and the constraint is simply gone. It is recorded here rather
 * than deleted because the next person to reach for this number deserves to know
 * it was once load-bearing and why it stopped being.
 */
const RAISED_CARD: [lightness: number, tint: number] = [0.98, 0.6];

/**
 * The tint a glass card needs in order to LOOK like `RAISED_CARD`.
 *
 * `.glass-strong` composites `--glass-tint` at 75% over whatever is behind the
 * card, which on every screen that matters is the page. So the painted result is
 * roughly `0.75 * tint + 0.25 * page`, and the tint that lands on a target is
 * that solved for `tint`. At a white page and a 0.98 target this gives 0.973 -
 * a tint slightly darker than the card it produces, which looks wrong written
 * down and is right on screen.
 *
 * Solved for the STRONG strength rather than for both, because there is one tint
 * token and two strengths and they cannot both be exact. `glass-strong` is what
 * `AppGlassCard` defaults to and what every content card wears; `.glass` is the
 * lighter chip-like surface and lands a little lighter than the target, which is
 * the direction it is supposed to differ in anyway.
 *
 * The approximation is in oklab lightness rather than per-channel sRGB. It is
 * near-exact for the near-neutral values this is used on and it keeps the whole
 * file in one colour space; the version that needs no approximation at all is
 * `card: "solid"`.
 */
const GLASS_STRONG_FILL = 0.75;

function glassTintFor(cardLightness: number, pageLightness: number): number {
	return (cardLightness - (1 - GLASS_STRONG_FILL) * pageLightness) / GLASS_STRONG_FILL;
}

/**
 * What each strategy overrides on top of LIGHT_NEUTRALS. `flat` is the shipped
 * ladder unchanged, so it overrides nothing.
 *
 * 0.6 of the base tint rather than the full amount: a card is a large surface,
 * and at the full multiplier a 0.02 tint reads as a colour rather than a ground.
 *
 * The two opaque entries are the no-backdrop-filter fallback, and they take the
 * card's colour DIRECTLY rather than the solved tint - nothing composites in
 * that branch, so the tint's correction for a page showing through would be a
 * correction for something that is not happening.
 */
const LIGHT_SURFACES: Record<SurfaceStrategy, Partial<Record<NeutralToken, [lightness: number, tint: number]>>> = {
	flat: {},
	raised: {
		"--glass-opaque": RAISED_CARD,
		"--glass-opaque-strong": RAISED_CARD,
		"--glass-tint": [glassTintFor(RAISED_CARD[0], LIGHT_NEUTRALS["--background"]![0]), RAISED_CARD[1]],
		"--surface": RAISED_CARD,
	},
};

function buildNeutrals(
	ramp: Partial<Record<NeutralToken, [lightness: number, tint: number]>>,
	hue: number,
	baseTint: number,
): Partial<Record<NeutralToken, Oklch>> {
	const neutrals: Partial<Record<NeutralToken, Oklch>> = {};

	for (const [token, step] of Object.entries(ramp) as [NeutralToken, [number, number]][]) {
		const [lightness, tint] = step;
		neutrals[token] = at(lightness, baseTint * tint, hue);
	}

	return neutrals;
}

/**
 * Lay a designer's five colours over a solved palette.
 *
 * Runs LAST, after every other token has been solved, so the derived ones -
 * borders, muted text, glass, fields, rails - are the ones the solver produced
 * for this hue and are not re-derived from the overrides. That is deliberate: a
 * designer supplies a brand, not a field border, and a border recomputed from
 * their background would drift away from the ladder the rest of the theme uses.
 *
 * The supplied values are written in unchanged. Everything this function
 * COMPUTES is an ink - the colour that goes on top of one of theirs - because no
 * brand deck contains those and guessing them is how a palette ends up with an
 * unreadable button label.
 *
 * The gradient is rebuilt around the supplied accent rather than replaced by it:
 * three stops are what the brand utilities paint, so a single value has to
 * become a ramp. It travels lightness only, at the accent's own hue, so the
 * middle stop is exactly what the designer gave.
 */
function applySupplied(
	light: PaletteThemeColors,
	dark: PaletteThemeColors,
	stable: Record<SolvedStableToken, Oklch>,
	supplied: SuppliedColors,
	/*
	 * The LIGHTEST dark ground a brand fill can land on, passed in rather than
	 * assumed - the tint slider moves it, so a remembered constant here would
	 * measure against a page this palette does not have.
	 *
	 * The lightest, not the page, and that distinction is the whole value of this
	 * argument. Solving against `--background` clears the page and nothing else:
	 * a dark card is LIGHTER than the page it sits on, so a fill that just clears
	 * the page fails against every card drawn on it. Measured on revolve, a floor
	 * solved against the page gives 3.27 on the page and 2.87 on `--surface` -
	 * which is precisely the case in the bug report, a brand control on a dark
	 * card on a dark background.
	 */
	{ brandTheme, darkGround, lightPage }: { brandTheme: ThemeName; darkGround: Oklch; lightPage: Oklch },
): void {
	const { accent, background, brand, foreground, secondary } = supplied;

	light["--background"] = background;
	light["--foreground"] = foreground;
	// The card and the overlay carry the same body copy as the page does.
	light["--surface-foreground"] = foreground;
	light["--overlay-foreground"] = foreground;

	/*
	 * The card, and the ONE value here that is written conditionally.
	 *
	 * Absent means nobody typed a card colour, and the surface strategy has
	 * already put one in `light` - leaving it alone is what lets flat/raised do
	 * their job. Present means somebody did, and then it wins outright like every
	 * other supplied value.
	 *
	 * The glass tokens follow it rather than being solved backwards from the page
	 * the way the strategy does. A typed card is a statement about what the card
	 * IS, and `glassTintFor` would correct it for a page showing through - which
	 * would paint something other than the hex that was typed. In `glass` the
	 * result is therefore approximate by construction; in `solid` the card is this
	 * value exactly, which is the honest way to honour it and the reason that
	 * option exists.
	 */
	if (supplied.surface) {
		light["--surface"] = supplied.surface;
		light["--glass-tint"] = supplied.surface;
		light["--glass-opaque"] = supplied.surface;
		light["--glass-opaque-strong"] = supplied.surface;
	}

	/*
	 * BRAND drives the two dominant fills, and that is the whole point of the
	 * mapping. `--gradient-brand-*` paints buttons, active tabs, switches, chips,
	 * avatars and the brand cards; `--brand-primary` paints the flat brand button
	 * and the active page number. Between them they are most of what a reader
	 * points at and calls "the brand", so the role named brand has to be what
	 * lands there. Putting the accent here - as the first version of this did -
	 * makes the accent the brand and leaves the brand almost invisible.
	 */
	light["--brand-primary"] = brand;
	light["--brand-primary-foreground"] = inkFor(brand, foreground);

	/*
	 * DARK's accent is anchored too, and leaving it out was a visible bug.
	 *
	 * `--brand-primary` is HeroUI's `--accent`: it paints brand-coloured TEXT -
	 * links, `text-accent`, the italic word in a hero - as well as some fills. It
	 * has to invert per theme because text has no border exemption, and that much
	 * was already right. What was wrong is WHICH colour it inverted to: dark kept
	 * the solved ramp, built from the palette's hue at `FILL_CHROMA`, so it never
	 * saw the supplied chroma at all.
	 *
	 * Measured on revolve, that put two brands on one dark screen - a `#7ba48d`
	 * button beside a `#19bb9b` link, 2.3x the saturation and 13 degrees of hue
	 * apart. Both were "the brand"; neither looked like the other.
	 *
	 * So it takes the supplied HUE and CHROMA and moves only lightness, exactly
	 * like the fill. Solved against `darkGround` rather than the page because that
	 * is the lightest ground brand text lands on, and legible text on a card is the
	 * binding case; at the TEXT bar, because this is type.
	 */
	const darkAccentL = darkestPassing(brand.h, brand.c, darkGround, TEXT_TARGET);
	const darkAccent = liftedFrom(brand, darkAccentL);
	dark["--brand-primary"] = darkAccent;
	// Re-solved: `--accent` is a fill as well as a text colour, so it carries its
	// own label and the old near-black ink was paired with a different colour.
	dark["--brand-primary-foreground"] = inkFor(darkAccent, foreground, TEXT_TARGET);
	/*
	 * The secondary's ink is SOLVED at the brand's hue, not taken from the
	 * designer's foreground, and it is the one place this function prefers
	 * something over a supplied value.
	 *
	 * `inkFor` normally prefers the foreground because a palette that already
	 * works should keep its own values. That is right for every other fill here
	 * and wrong for this one: the secondary is pale, a near-black foreground
	 * clears on it easily, and `inkFor` would therefore stop at the first
	 * candidate and paint a grey pill with black type - which is what a DISABLED
	 * button looks like. The brand-hued ink is what makes it read as a control.
	 *
	 * It is still passed as the PREFERRED value rather than written directly, so
	 * the full fallback chain survives: a fill this ink cannot clear falls back to
	 * white and then to a walked-down variant, exactly as before.
	 */
	light["--brand-secondary"] = secondary;
	light["--brand-secondary-foreground"] = inkFor(
		secondary,
		at(
			lightestPassing(brand.h + SECONDARY_INK_HUE_SHIFT, SECONDARY_INK_CHROMA, secondary, TEXT_TARGET),
			SECONDARY_INK_CHROMA,
			brand.h + SECONDARY_INK_HUE_SHIFT,
		),
	);

	const ramp = (seed: Oklch, span: number) => ({
		from: clampToGamut({ c: seed.c, h: seed.h, l: Math.min(0.97, seed.l + span) }),
		to: clampToGamut({ c: seed.c, h: seed.h, l: Math.max(0.06, seed.l - span) }),
	});

	/*
	 * A supplied brand is FLAT - all three stops are the one colour.
	 *
	 * The solved presets sweep because the sweep is theirs to choose. A designer
	 * gave one hex, and inventing a ramp around it does two bad things at once: it
	 * paints a colour they did not pick, and it breaks the ink. Netflix red is the
	 * clearest case - white on it measures 4.57:1, right on the AA line and
	 * shipped that way by Netflix - so any sweep at all pushes the lightest stop
	 * under, and `inkForAll` then falls back to a near-black that reads 3.89:1 on
	 * the other end. Measured at four spans, only zero works.
	 *
	 * The utilities still paint `linear-gradient(...)` with three stops. Three
	 * identical stops is a flat fill, which is what a brand deck meant.
	 *
	 * ## The one thing a supplied fill is not allowed to be: too dark for dark
	 *
	 * `--gradient-brand` is theme-STABLE - one colour in both themes, deliberately,
	 * so the most brand-looking thing on the page does not change between modes
	 * (see StableBrandToken and the `.button--primary` block in the package's
	 * ui.css). Everything downstream of that decision assumes the stable fill is a
	 * LIGHT one:
	 *
	 *   - the dark theme sets `--brand-edge` to the fill itself, on the stated
	 *     grounds that "the fill already clears 3:1 against a near-black page";
	 *   - `.button--primary` walks hover and pressed DOWN the ramp, "because the
	 *     fill is light in both themes now";
	 *   - and ui.css accepts soft edges on the LIGHT page as a measured trade,
	 *     which is the only direction it accepts them in.
	 *
	 * A supplied hex can violate all three at once by simply being dark. Measured
	 * across the nine palettes: eight clear the dark page comfortably (4.24 to
	 * 8.41), and `revolve`'s #315443 lands at 2.41 - under SC 1.4.11's 3:1, with
	 * no edge to fall back on because dark deliberately has none. A primary CTA
	 * whose label is perfectly legible while the button itself is invisible.
	 *
	 * So the hex is honoured until it stops being usable as a stable fill, and
	 * then it is LIFTED - hue and chroma kept, lightness raised to the first value
	 * that clears the dark page. This is asymmetric on purpose. It does not touch
	 * the light-page side, where sitting under 3:1 is a documented, accepted trade
	 * with a named failing row in the report; it enforces only the floor that the
	 * dark theme's own edge policy already assumes is met.
	 *
	 * `--brand-primary` still carries the exact hex in light, so the colour the
	 * designer picked is what paints brand text, links and the flat brand button.
	 * What moves is the FILL role, and only when it could not do that job.
	 */
	/*
	 * The supplied hex is the ANCHOR, and `brandTheme` says which theme it anchors.
	 *
	 * This is the answer to "is #315443 my light brand or my dark brand?" - a
	 * question the four-colour form cannot infer and must therefore ask. A project
	 * that ships light by default hands over the colour it looks like in light;
	 * one that ships dark hands over the dark one. Either way that theme paints
	 * the hex EXACTLY, and the other theme paints the nearest lightness at the
	 * same hue and chroma that clears its own grounds.
	 *
	 * Which is why the fill stopped being theme-stable. Locked, revolve's #315443
	 * measured 8.47 on the white page and 2.40 on the dark one - so honouring it
	 * meant failing dark, and my first attempt at rescuing dark cost light its
	 * exact hex (8.47 down to 4.73) to buy a number nobody asked for. Anchoring
	 * gives both: light keeps the hex, dark gets a sibling a viewer reads as the
	 * same green.
	 */
	const brandInk = at(DARK_PAGE_L, 0.03, brand.h);
	/*
	 * SYMMETRIC. The anchored theme takes the hex; the other derives.
	 *
	 * `lightFillBrand` was unconditionally `brand`, which made `brandTheme: "dark"`
	 * only half a setting: dark got the hex, and light got it too rather than a
	 * sibling. That happens to be right whenever the hex clears a white page - a
	 * dark green does - and silently wrong for exactly the palettes the option
	 * exists for, where the brand is a LIGHT colour chosen for a dark product and
	 * would sit at about 2:1 on white.
	 */
	const lightInkRef = at(0.99, 0.005, brand.h);
	const lightFillBrand = brandTheme === "light" ? brand : fillClearingLight(brand, lightPage, lightInkRef);
	const darkFillBrand = brandTheme === "dark" ? brand : fillClearing(brand, darkGround, brandInk);

	for (const [theme, value] of [
		[light, lightFillBrand],
		[dark, darkFillBrand],
	] as const) {
		theme["--gradient-brand-from"] = value;
		theme["--gradient-brand-via"] = value;
		theme["--gradient-brand-to"] = value;
		/*
		 * Re-solved per theme, at the TEXT target rather than the module default.
		 *
		 * Two reasons it has to be explicit here. The fills sit at different
		 * lightnesses, so one ink cannot be assumed to clear both - and the derived
		 * fill is the lighter of the two, which is exactly where a designer's dark
		 * foreground stops working: on revolve it measured 4.72:1, AA but well under
		 * the 7.2 every other brand pairing in this generator holds. `inkFor` keeps
		 * the supplied foreground when it clears and falls back to white or a walked
		 * near-black when it does not, so the designer's ink is still preferred - it
		 * is just no longer preferred past the point of being legible.
		 */
		theme["--gradient-brand-foreground"] = inkFor(value, foreground, TEXT_TARGET);
		theme["--gradient-brand-hover"] = hoverStepFor(value, theme["--gradient-brand-foreground"]);
	}

	/*
	 * ACCENT goes on the status rail - the accent toast, banner and dialog - which
	 * is deliberately a small surface. An accent is the colour a design reaches
	 * for occasionally; a role that painted every button would be a second brand,
	 * and the palette already has one of those.
	 *
	 * The supplied value is the TINT, the rail's middle, so the exact hex a
	 * designer gave still appears somewhere verbatim. The two ends are derived
	 * around it, like the brand ramp above.
	 */
	const accentRamp = ramp(accent, 0.075);
	stable["--rail-accent-from"] = accentRamp.from;
	stable["--rail-accent-tint"] = accent;
	stable["--rail-accent-to"] = accentRamp.to;
}

/**
 * The anchor fill if it already clears `ground`, otherwise the nearest lightness
 * at the SAME hue and chroma that does.
 *
 * Nearest, and only lightness, because the whole point of the anchored fill is
 * that the two themes read as the same colour. Moving hue would make them two
 * brands; moving chroma would make one of them look washed beside the other.
 * Lightness is the axis a viewer forgives, and it is the only axis that can
 * actually buy contrast against a ground.
 *
 * Returning the anchor UNCHANGED when it already clears is not an optimisation.
 * It is what keeps a brand that works in both themes a single colour, so the
 * second value only ever appears where arithmetic forces it.
 */
/**
 * A visibly different step from `fill` that still carries `ink`.
 *
 * Darker first, because that is what a hover reads as on almost every design
 * system and it is the direction the fill's own ramp used to walk. Lighter is the
 * fallback for the case darkening cannot serve: a light fill under near-black ink
 * loses its 7.2 as it darkens, and a hover that costs the label its contrast is a
 * worse bug than the one this fixes.
 *
 * STEP is perceptual, not a percentage of anything - oklch lightness is roughly
 * uniform, so one number reads as the same amount of change at every hue. 0.06 is
 * the smallest step that survives 8-bit quantisation as a visible difference on a
 * large fill without reading as a second colour.
 */
const HOVER_STEP = 0.06;

function hoverStepFor(fill: Oklch, ink: Oklch): Oklch {
	/*
	 * The bar is "no worse than the fill already is", not a flat 7.2.
	 *
	 * A designer palette ships its hex verbatim and may sit under the target -
	 * netflix red carries its ink at 4.38:1, which is the documented cost of not
	 * editing somebody's brand. Holding the HOVER step to 7.2 there asks it to be
	 * more legible than the button it belongs to, so both directions fail and the
	 * step collapses back onto the fill: hover dead again, for the palettes that
	 * had the problem in the first place.
	 *
	 * Capping at the fill's own ratio keeps the guarantee that matters - a state
	 * change never costs the label anything - without inventing a bar the resting
	 * state was never held to.
	 */
	const bar = Math.min(TEXT_TARGET, contrastRatio(fill, ink));
	const clears = (candidate: Oklch) => contrastRatio(candidate, ink) >= bar;

	const darker = clampToGamut({ c: fill.c, h: fill.h, l: Math.max(0.06, fill.l - HOVER_STEP) });
	if (clears(darker)) return darker;

	const lighter = clampToGamut({ c: fill.c, h: fill.h, l: Math.min(0.97, fill.l + HOVER_STEP) });
	if (clears(lighter)) return lighter;

	// Neither direction survives - the fill is already at the edge of what its ink
	// allows. The fill itself is the honest answer: no hover is better than an
	// unreadable one, and the report will show the pairing that caused it.
	return fill;
}

/**
 * The anchor moved to a new lightness, keeping its HUE and its perceived
 * saturation - which means chroma has to go UP, not stay put.
 *
 * oklch chroma is absolute, not relative. A brand at C 0.056 and L 0.29 reads
 * rich because that colour is spread over very little light; hold the same chroma
 * and lift to L 0.68 and it is diluted across more than twice as much, so it
 * arrives grey. Measured on revolve: the faithful lift is #7ba48d, a dead sage,
 * against a #0c3523 that does not look dead at all.
 *
 * So what is preserved is the RATIO c/l, the rough stand-in for "how colourful
 * for its brightness". At revolve's hue that puts the dark fill at C 0.130 -
 * almost exactly the C 0.131 the old solved ramp used, which is why THAT value
 * looked alive. Its mistake was never the chroma, it was drifting the hue 13
 * degrees and making the brand two brands.
 *
 * Clamped twice over: to what sRGB can paint at this lightness and hue, and by
 * `clampToGamut` after. A ratio is a target, not a promise the display can keep.
 */
function liftedFrom(anchor: Oklch, l: number): Oklch {
	// Guard the ratio: an anchor at l = 0 is black, which has no saturation to
	// preserve and would divide by zero on the way to finding out.
	const ratio = anchor.c / Math.max(anchor.l, 0.01);

	return clampToGamut({ c: Math.min(ratio * l, maxChroma(l, anchor.h)), h: anchor.h, l });
}

/**
 * The nearest sibling of `anchor` that clears BOTH its bars - measured on the
 * value that will actually ship.
 *
 * ## Why this is a search and not two `darkestPassing` calls
 *
 * It used to solve the lightness from `anchor.c` and then hand the result to
 * `liftedFrom`, which SCALES chroma - so the colour that shipped was never the
 * colour that was measured. Raising chroma moves luminance, so the solve was
 * being invalidated by the step that came after it. Every palette happened to
 * land above the bar anyway, which is the worst kind of pass: a guarantee that
 * holds by luck reads exactly like one that holds by construction, right up until
 * a new hue does not.
 *
 * So each candidate is BUILT first and then measured, including the ink it would
 * actually be given. `inkFor` is the same call the caller will make, so what is
 * tested here is what gets painted rather than a near-enough stand-in.
 *
 * ## Both bars, and the ink is the strict one
 *
 * The ground bar is SC 1.4.11's 3:1 - a fill is a graphic, not text. The INK bar
 * is 7:1, and that is the contract this exists to keep: the anchored theme ships
 * whatever hex was handed over, and the DERIVED theme is the generator's own
 * work, so it has no excuse for being less than AAA.
 *
 * Walking from the anchor outward returns the nearest passing value, which is
 * what keeps the sibling recognisable as the same brand. `null` when the whole
 * range fails - the caller decides what to do rather than being handed a value
 * that quietly does not clear.
 */
function solvedSibling(anchor: Oklch, ground: Oklch, preferredInk: Oklch, direction: 1 | -1): Oklch | null {
	const STEP = 0.002;

	for (let l = anchor.l; l >= 0.06 && l <= 0.97; l += STEP * direction) {
		const candidate = liftedFrom(anchor, l);
		if (contrastRatio(candidate, ground) < NON_TEXT_TARGET) continue;

		const ink = inkFor(candidate, preferredInk, TEXT_TARGET);
		if (contrastRatio(ink, candidate) >= TEXT_TARGET) return candidate;
	}

	return null;
}

/** Does this colour already do both jobs, so no sibling is needed at all? */
function alreadyClears(anchor: Oklch, ground: Oklch, preferredInk: Oklch): boolean {
	if (contrastRatio(anchor, ground) < NON_TEXT_TARGET) return false;

	return contrastRatio(inkFor(anchor, preferredInk, TEXT_TARGET), anchor) >= TEXT_TARGET;
}

/**
 * The DARK theme's sibling: lighter, because a dark ground needs the fill above
 * it and the ink dead band sits between them.
 */
function fillClearing(anchor: Oklch, ground: Oklch, ink: Oklch): Oklch {
	if (alreadyClears(anchor, ground, ink)) return anchor;

	return solvedSibling(anchor, ground, ink, 1) ?? anchor;
}

/**
 * The LIGHT theme's sibling: darker, for a dark-anchored palette whose hex is a
 * light colour and would sit at about 2:1 on a white page.
 */
function fillClearingLight(anchor: Oklch, page: Oklch, ink: Oklch): Oklch {
	if (alreadyClears(anchor, page, ink)) return anchor;

	return solvedSibling(anchor, page, ink, -1) ?? anchor;
}

export function buildPalette({
	accentHue,
	baseTint,
	brandTheme = "light",
	supplied,
	surface = "flat",
}: PaletteRequest): BuiltPalette {
	const hue = ((accentHue % 360) + 360) % 360;
	// The page every light-mode ink below is solved against - one ground under
	// both strategies now that `raised` moves the card rather than the page.
	const lightPage = at(LIGHT_PAGE_L, 0, hue);
	const rampHues = [hue, hue + HUE_TRAVEL / 2, hue + HUE_TRAVEL];
	const inkHues = [hue, hue + HUE_TRAVEL];

	/* ---- the brand fill, solved ONCE for both themes --------------------- */

	// Near-black, carrying the brand hue. The fill's ink in light AND dark, which
	// is what lets the fill itself stay put: it is the ink that used to flip.
	const brandInk = at(DARK_PAGE_L, 0.03, hue);

	// Light enough to clear 7:1 under that ink, at every stop. The DARKEST stop
	// is the binding one here - the opposite of a deep fill under pale ink, where
	// the lightest stop binds - so the ramp is placed upwards from a floor.
	const fill = placeRamp(
		rampHues,
		[0.075, 0.035, 0],
		FILL_CHROMA,
		(stopHue) => darkestPassing(stopHue, FILL_CHROMA, brandInk, TEXT_TARGET),
		"up",
	);

	/* ---- the brand surface, solved once for both themes ------------------ */

	// A tint, not a fill: light enough that a brand navy can sit on it, dark
	// enough to still read as brand rather than as a grey. 0.06 is capped to the
	// gamut per hue by `at`, so the warm hues that run out early simply carry
	// less rather than being silently remapped by the browser.
	const brandSurface = at(0.88, 0.06, hue);
	// The LIGHTEST navy that still clears the text bar on it - lightest, so it
	// keeps as much of the hue as the bar allows rather than collapsing to black.
	// +20 degrees for the same reason the ramps travel hue: an ink at exactly the
	// surface's hue reads as the surface dimmed rather than as its own colour.
	const brandSurfaceInk = at(lightestPassing(hue + 20, 0.09, brandSurface, SURFACE_TEXT_TARGET), 0.09, hue + 20);

	/* ---- light ---------------------------------------------------------- */

	// Still near-white, and still per-theme: this is `--accent`'s ink, not the
	// gradient's. HeroUI chains --color-accent to --accent, so that token colours
	// text as well as fills and has to keep inverting. See StableBrandToken.
	const lightInk = at(0.99, 0.005, hue);
	const lightFill = placeRamp(
		rampHues,
		[0, -0.045, -0.09],
		FILL_CHROMA,
		(stopHue) => lightestPassing(stopHue, FILL_CHROMA, lightInk, TEXT_TARGET),
		"down",
	);
	const lightWordmark = placeRamp(
		inkHues,
		[0, -0.1],
		INK_CHROMA,
		(stopHue) => lightestPassing(stopHue, INK_CHROMA, lightPage, TEXT_TARGET),
		"down",
	);

	const lightSecondary = at(0.94, Math.min(0.035, maxChroma(0.94, hue) * 0.9), hue);
	const lightSecondaryInk = at(
		lightestPassing(hue + SECONDARY_INK_HUE_SHIFT, SECONDARY_INK_CHROMA, lightSecondary, TEXT_TARGET),
		SECONDARY_INK_CHROMA,
		hue + SECONDARY_INK_HUE_SHIFT,
	);

	// The soft accent chip. It was a hard-coded oklch pair at hue 255 in
	// styles.css, which is a brand surface carrying brand text that did not move
	// with the brand - an amber palette with a blue "info" chip on it.
	const lightChip = at(0.95, Math.min(0.035, maxChroma(0.95, hue) * 0.9), hue);
	const lightChipInk = at(lightestPassing(hue + 4, 0.17, lightChip, TEXT_TARGET), 0.17, hue + 4);

	const light: PaletteThemeColors = {
		...buildNeutrals({ ...LIGHT_NEUTRALS, ...LIGHT_SURFACES[surface] }, hue, baseTint),
		// Translucent, and the one neutral that is: on an auth or landing page the
		// field sits on a glass panel and the backdrop has to show through it. On a
		// plain white card 60% of white over white is still white, so the light
		// theme pays nothing for it.
		"--field-background": { alpha: 0.6, c: 0, h: 0, l: 1 },
		"--brand-accent": at(0.85, 0.09, hue - 6),
		"--brand-muted": at(0.96, 0.018, hue),
		"--brand-pale": at(0.92, 0.05, hue - 8),
		"--brand-primary": lightFill[1],
		"--brand-primary-foreground": lightInk,
		"--brand-secondary": lightSecondary,
		"--brand-secondary-foreground": lightSecondaryInk,
		"--chip-accent-soft": lightChip,
		"--chip-accent-soft-foreground": lightChipInk,
		// The outline that makes a light brand fill identifiable on a white page.
		// Deep enough to clear 3:1 against it, in the brand's own hue so it reads
		// as the edge of the thing rather than as a grey stroke around it.
		"--brand-edge": at(lightestPassing(hue + 6, FILL_CHROMA, lightPage, NON_TEXT_TARGET), FILL_CHROMA, hue + 6),
		/* Seeded from the solved ramp and re-solved per theme just below - the
		   record requires them at construction, and the derivation needs both
		   theme objects to exist first. */
		"--gradient-brand-foreground": brandInk,
		"--gradient-brand-hover": fill[1],
		"--gradient-brand-from": fill[0],
		"--gradient-brand-to": fill[2],
		"--gradient-brand-via": fill[1],
		"--gradient-brand-ink-from": lightWordmark[0],
		"--gradient-brand-ink-to": lightWordmark[1],
	};

	/* ---- dark ------------------------------------------------------------ */

	// Deep ink on a pale fill: the inversion edge case 1 forces. Its lightness is
	// the page's, so a brand button reads as a lit panel with the page punched
	// through it rather than as a lighter rectangle with white writing.
	const darkInk = brandInk;
	// The page the wordmark is measured against is the one this palette generates,
	// not a remembered constant - the tint slider moves it.
	const darkPage = at(DARK_PAGE_L, baseTint, hue);
	// `--accent`'s dark half. Identical maths to the locked fill above, and it
	// lands in the same place - which is why the brand looks continuous in dark
	// and only parts company in light.
	const darkFill = fill;
	const darkWordmark = placeRamp(
		inkHues,
		[0.08, 0],
		INK_CHROMA,
		(stopHue) => darkestPassing(stopHue, INK_CHROMA, darkPage, TEXT_TARGET),
		"up",
	);

	const darkSecondary = at(0.32, Math.min(0.06, maxChroma(0.32, hue) * 0.9), hue);
	const darkSecondaryInk = at(darkestPassing(hue - 6, 0.09, darkSecondary, TEXT_TARGET), 0.09, hue - 6);

	// Opaque, like every other soft chip pair here: a translucent chip takes the
	// colour of whatever card it landed on, so a row of identical chips reads as
	// two different chips.
	const darkChip = at(0.3, Math.min(0.06, maxChroma(0.3, hue) * 0.9), hue);
	const darkChipInk = at(darkestPassing(hue + 4, 0.13, darkChip, TEXT_TARGET), 0.13, hue + 4);
	const darkPrimaryL = darkFill[1].l;

	const dark: PaletteThemeColors = {
		...buildNeutrals(DARK_NEUTRALS, hue, baseTint),
		"--brand-accent": at(Math.max(0.4, darkPrimaryL - 0.28), 0.12, hue - 6),
		"--brand-muted": at(0.26, 0.03, hue),
		"--brand-pale": at(Math.max(0.34, darkPrimaryL - 0.38), 0.07, hue - 8),
		"--brand-primary": darkFill[1],
		"--brand-primary-foreground": darkInk,
		"--brand-secondary": darkSecondary,
		"--brand-secondary-foreground": darkSecondaryInk,
		"--chip-accent-soft": darkChip,
		"--chip-accent-soft-foreground": darkChipInk,
		// No visible outline is needed here - the fill already clears 3:1 against
		// a near-black page - so the edge is the fill's own colour and vanishes.
		// It stays a real colour rather than `transparent` so the report can
		// measure the same row in both themes instead of skipping one.
		"--brand-edge": fill[1],
		/* Seeded from the solved ramp and re-solved per theme just below - the
		   record requires them at construction, and the derivation needs both
		   theme objects to exist first. */
		"--gradient-brand-foreground": brandInk,
		"--gradient-brand-hover": fill[1],
		"--gradient-brand-from": fill[0],
		"--gradient-brand-to": fill[2],
		"--gradient-brand-via": fill[1],
		"--gradient-brand-ink-from": darkWordmark[0],
		"--gradient-brand-ink-to": darkWordmark[1],
	};

	/* ---- the accent status rail ------------------------------------------ */

	// Theme-stable, like the other four rails - a status is a status. It is not
	// theme-stable by accident though: it carries a white glyph on a tile in both
	// themes, so its LIGHT end is solved against white at the non-text bar and
	// the rest of the ramp hangs below that. Left at a fixed lightness it passes
	// on blue and fails on amber, which is the whole hue-vs-luminance trap.
	const railWhite: Oklch = { c: 0, h: 0, l: 0.99 };
	const railTopHue = hue - 3;
	const railTop = lightestPassing(railTopHue, RAIL_CHROMA, railWhite, NON_TEXT_TARGET);

	const solvedStable: Record<SolvedStableToken, Oklch> = {
		"--brand-surface": brandSurface,
		"--brand-surface-foreground": brandSurfaceInk,
		"--rail-accent-from": at(Math.max(0.2, railTop - 0.15), RAIL_CHROMA, hue + 10),
		"--rail-accent-tint": at(Math.max(0.2, railTop - 0.075), RAIL_CHROMA, hue + 4),
		"--rail-accent-to": at(railTop, RAIL_CHROMA, railTopHue),
	};

	/*
	 * `--surface-secondary` is where the line is drawn: page, card and nested
	 * panel are all at or below it, so a fill that clears it clears every ground a
	 * brand control realistically sits on in dark. `--surface-tertiary` would be
	 * safer still and costs more of the designer's colour - at revolve's hue it
	 * pulls the fill to L 0.582 against 0.550 - for a ground a brand button is
	 * rarely drawn on. The fallbacks are ordered lightest-first for the same
	 * reason, and end at the page so this is never solved against nothing.
	 */
	const darkGround = dark["--surface-secondary"] ?? dark["--surface"] ?? darkPage;
	/*
	 * The SOLVED path's fill, per theme, from the one ramp.
	 *
	 * `fill` is solved so near-black ink clears 7:1 on it, which makes it a light
	 * ramp - correct on a dark page and, locked, too light for a white one:
	 * spotify, coinbase and custom measured 2.59, 2.41 and 2.46 there. `ui.css`
	 * accepted that as a trade on the grounds that `--brand-edge` would outline
	 * the control instead, and then the outline was removed as "a hairline nobody
	 * asked for" - leaving the trade with nothing paying for it.
	 *
	 * Darkening only where it is needed costs those three some brightness in light
	 * and changes nothing for the six already clearing it.
	 */
	/*
	 * The SOLVED path. Light keeps the solved ramp untouched; only dark is floored.
	 *
	 * Asymmetric, and measured rather than chosen. Darkening the light fill to
	 * clear 3:1 against a white page pushes it into the ink dead band described in
	 * `fillClearing`, and coinbase and custom came back at 6.39:1 with no ink able
	 * to reach 7.2 - a button that is easier to see and harder to read. `ui.css`
	 * already accepts the soft light-page edge as a trade with a named failing row,
	 * and that trade is the correct side of this one.
	 *
	 * Dark needs no lift on any solved palette - the ramp is light by construction
	 * - so this is a no-op there and exists for the anchored case below.
	 */
	for (const [index, token] of (
		["--gradient-brand-from", "--gradient-brand-via", "--gradient-brand-to"] as const
	).entries()) {
		light[token] = fill[index];
		dark[token] = fillClearing(fill[index], darkGround, brandInk);
	}
	light["--gradient-brand-foreground"] = brandInk;
	light["--gradient-brand-hover"] = hoverStepFor(light["--gradient-brand-via"], brandInk);
	dark["--gradient-brand-foreground"] = inkForAll(
		[dark["--gradient-brand-from"], dark["--gradient-brand-via"], dark["--gradient-brand-to"]],
		brandInk,
		TEXT_TARGET,
	);
	dark["--gradient-brand-hover"] = hoverStepFor(dark["--gradient-brand-via"], dark["--gradient-brand-foreground"]);

	if (supplied) applySupplied(light, dark, solvedStable, supplied, { brandTheme, darkGround, lightPage });

	/*
	 * The ramp is composed LAST, and from the finished fill rather than from the
	 * `brand` that was requested. `applySupplied` may have just replaced that
	 * fill with a designer's hex, and a ramp built before it would be a scale
	 * around a colour the palette no longer ships.
	 *
	 * `--gradient-brand-via` is the middle stop, which on a supplied palette is
	 * the hex verbatim - tokens.css says the same thing about the token it maps
	 * onto. Which theme holds it is `brandTheme`'s whole job: the anchored theme
	 * carries the colour exactly, the other carries its solved sibling, and the
	 * ramp has to hang off the one that was actually handed over.
	 */
	const brandAnchor = brandTheme === "dark" ? dark["--gradient-brand-via"] : light["--gradient-brand-via"];
	const stable: Record<StableBrandToken, Oklch> = { ...solvedStable, ...rampTokens(brandAnchor) };

	return { accentHue: hue, baseTint, dark, light, stable };
}
