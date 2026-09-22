/**
 * oklch → sRGB, and the WCAG arithmetic on top of it.
 *
 * This file exists because a palette cannot be eyeballed. Two facts make it
 * mandatory rather than nice to have:
 *
 * 1. **oklch is not gamut-bounded.** `oklch(0.75 0.22 250)` is a perfectly legal
 *    CSS colour and there is no sRGB pixel that matches it, so the browser
 *    silently gamut-maps it at paint time. The colour you authored is then not
 *    the colour on screen, and any contrast figure computed from the authored
 *    value is fiction. Everything generated here is clamped to
 *    `maxChroma(L, hue)` first, which is what makes the measurement true.
 *
 * 2. **Lightness is not luminance.** oklch L is perceptual; WCAG contrast is
 *    computed from relative luminance, and the two diverge with hue. A yellow
 *    and a blue at the same oklch L differ by more than 3:1 against white. That
 *    is the whole reason each preset is solved and measured on its own hue
 *    rather than one being trusted because a sibling passed.
 *
 * Conversion coefficients are Björn Ottosson's published oklab matrices; the
 * luminance and contrast formulae are WCAG 2.2 SC 1.4.3 / 1.4.6 verbatim.
 * No dependency, because this has to run in three places - the generator
 * script, the Vitest measurement suite, and the browser when the customizer's
 * free hue slider moves.
 */

export interface Oklch {
	/**
	 * Optional alpha, 0-1. Carried so a token like the light theme's translucent
	 * field fill can round-trip, and deliberately IGNORED by relativeLuminance:
	 * the contrast of a translucent colour depends on what is behind it, so a
	 * number computed without that context would be a guess wearing two decimal
	 * places. No pairing in pairings.ts uses a translucent token.
	 */
	alpha?: number;
	/** Chroma. Unbounded in the colour space, bounded by sRGB - see clampToGamut. */
	c: number;
	/** Hue angle in degrees. */
	h: number;
	/** Perceptual lightness, 0-1. */
	l: number;
}

export interface Rgb {
	r: number;
	g: number;
	b: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** oklch → linear-light sRGB. Channels may fall outside 0-1: that is out of gamut. */
function oklchToLinearRgb({ c, h, l }: Oklch): Rgb {
	const radians = (h * Math.PI) / 180;
	const a = c * Math.cos(radians);
	const b = c * Math.sin(radians);

	const lCubeRoot = l + 0.3963377774 * a + 0.2158037573 * b;
	const mCubeRoot = l - 0.1055613458 * a - 0.0638541728 * b;
	const sCubeRoot = l - 0.0894841775 * a - 1.291485548 * b;

	const lms = lCubeRoot ** 3;
	const mms = mCubeRoot ** 3;
	const sms = sCubeRoot ** 3;

	return {
		b: -0.0041960863 * lms - 0.7034186147 * mms + 1.707614701 * sms,
		g: -1.2684380046 * lms + 2.6097574011 * mms - 0.3413193965 * sms,
		r: 4.0767416621 * lms - 3.3077115913 * mms + 0.2309699292 * sms,
	};
}

/** The sRGB transfer function. WCAG's "linearise the channel" step, run backwards. */
function encodeGamma(channel: number): number {
	const value = clamp01(channel);
	return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
}

/** True when every channel lands inside sRGB, so the browser will not remap it. */
export function isInGamut(color: Oklch, tolerance = 0.0001): boolean {
	const { b, g, r } = oklchToLinearRgb(color);
	return [r, g, b].every((channel) => channel >= -tolerance && channel <= 1 + tolerance);
}

/**
 * The largest chroma that still paints at this lightness and hue.
 *
 * Bisection rather than an analytic solve: the sRGB gamut boundary in oklch is
 * a piecewise surface with no closed form, and 24 iterations lands inside
 * 0.0001 - two decimal places below anything we emit.
 */
export function maxChroma(l: number, h: number): number {
	let low = 0;
	let high = 0.45;

	for (let index = 0; index < 24; index += 1) {
		const mid = (low + high) / 2;
		if (isInGamut({ c: mid, h, l })) {
			low = mid;
		} else {
			high = mid;
		}
	}

	return low;
}

/**
 * Pull a colour back inside sRGB, keeping its lightness and hue.
 *
 * `safety` is a deliberate haircut off the boundary. Sitting exactly on it
 * means a rounding difference between our maths and the browser's decides
 * whether the pixel is remapped, and a value that is remapped on one engine and
 * not another is a colour that measures differently than it paints.
 */
export function clampToGamut(color: Oklch, safety = 0.97): Oklch {
	const ceiling = maxChroma(color.l, color.h) * safety;
	return { ...color, c: Math.min(color.c, ceiling) };
}

/** oklch → 8-bit sRGB. Out-of-gamut input is clipped, so clamp before calling. */
/** sRGB channel back to linear. The inverse of `encodeGamma`. */
function decodeGamma(channel: number): number {
	return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/**
 * A hex string back to oklch - the direction this module did not have.
 *
 * Needed because a designer hands over hexes, not lightness and chroma. Every
 * other input to this system is authored in oklch and converted downward; a
 * palette that arrives from Figma has to come the other way before any of the
 * solving or measuring here can touch it.
 *
 * Returns null on anything that is not a 3- or 6-digit hex, rather than
 * throwing or coercing: the caller is a text field somebody is still typing in.
 */
export function hexToOklch(value: string): Oklch | null {
	const raw = value.trim().replace(/^#/, "");
	const full = raw.length === 3 ? [...raw].map((d) => d + d).join("") : raw;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

	const n = Number.parseInt(full, 16);
	const r = decodeGamma(((n >> 16) & 255) / 255);
	const g = decodeGamma(((n >> 8) & 255) / 255);
	const b = decodeGamma((n & 255) / 255);

	const lCone = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const mCone = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const sCone = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

	const lightness = 0.2104542553 * lCone + 0.793617785 * mCone - 0.0040720468 * sCone;
	const a = 1.9779984951 * lCone - 2.428592205 * mCone + 0.4505937099 * sCone;
	const bAxis = 0.0259040371 * lCone + 0.7827717662 * mCone - 0.808675766 * sCone;

	const hue = (Math.atan2(bAxis, a) * 180) / Math.PI;
	return { c: Math.hypot(a, bAxis), h: hue < 0 ? hue + 360 : hue, l: lightness };
}

export function oklchToRgb(color: Oklch): Rgb {
	const linear = oklchToLinearRgb(color);
	return {
		b: Math.round(encodeGamma(linear.b) * 255),
		g: Math.round(encodeGamma(linear.g) * 255),
		r: Math.round(encodeGamma(linear.r) * 255),
	};
}

export function rgbToHex({ b, g, r }: Rgb): string {
	const pair = (channel: number) => channel.toString(16).padStart(2, "0");
	return `#${pair(r)}${pair(g)}${pair(b)}`;
}

export function oklchToHex(color: Oklch): string {
	return rgbToHex(oklchToRgb(color));
}

/**
 * WCAG relative luminance of an 8-bit sRGB colour.
 *
 * Everything measures through here, and it takes 8-bit channels rather than the
 * continuous colour on purpose: the number this file reports has to be the
 * contrast of the pixels a reader actually sees, and those pixels are 8 bits
 * per channel. Measuring the infinite-precision colour flatters every ratio by
 * a hair - exactly the kind of hair that turns a 6.99 into a "7.00".
 */
export function relativeLuminance({ b, g, r }: Rgb): number {
	const linearise = (channel8Bit: number) => {
		const channel = channel8Bit / 255;
		return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	};

	return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/** WCAG 2.2 contrast ratio, 1-21. Order of the arguments does not matter. */
export function contrastOfRgb(a: Rgb, b: Rgb): number {
	const luminanceA = relativeLuminance(a);
	const luminanceB = relativeLuminance(b);
	const lighter = Math.max(luminanceA, luminanceB);
	const darker = Math.min(luminanceA, luminanceB);

	return (lighter + 0.05) / (darker + 0.05);
}

/** The same ratio, for two authored colours. Clips out-of-gamut input first. */
export function contrastRatio(a: Oklch, b: Oklch): number {
	return contrastOfRgb(oklchToRgb(a), oklchToRgb(b));
}

/** Two decimal places, rounded DOWN - a 6.999 must never print as 7.00. */
export function reportRatio(ratio: number): number {
	return Math.floor(ratio * 100) / 100;
}

/** `oklch(0.4623 0.1712 250)`, at the precision the stylesheet carries. */
export function formatOklch({ alpha, c, h, l }: Oklch): string {
	const round = (value: number, places: number) => Number(value.toFixed(places));
	const chroma = round(c, 4);
	// A hue on an achromatic colour is noise that reads as meaning - `oklch(1 0 245)`
	// invites the next reader to "fix" a white that is already white.
	const channels = `${round(l, 4)} ${chroma} ${chroma === 0 ? 0 : round(h, 2)}`;
	return alpha === undefined ? `oklch(${channels})` : `oklch(${channels} / ${round(alpha * 100, 2)}%)`;
}

/**
 * Parse the values this file emits back out of a stylesheet.
 *
 * The measurement suite reads the SHIPPED css rather than the generator's
 * in-memory output, so a generator that is right and a stylesheet that was not
 * regenerated cannot pass together.
 */
export function parseOklch(value: string): Oklch | null {
	const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.-]+)\s*(?:\/\s*([\d.]+)%\s*)?\)$/.exec(value.trim());
	if (!match) return null;

	const color: Oklch = { c: Number(match[2]), h: Number(match[3]), l: Number(match[1]) };
	return match[4] === undefined ? color : { ...color, alpha: Number(match[4]) / 100 };
}
