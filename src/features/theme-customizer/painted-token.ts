/**
 * Reading a token back out of the LIVE document, as the browser painted it.
 *
 * Everything on this page that shows a colour has to come through here, and the
 * reason is a bug this closes rather than a principle:
 *
 *   The bar used to read its swatches from GENERATED_PALETTES[draft.palette] -
 *   the PRESET record. That is correct only while the draft is still on its
 *   preset. Drag the hue and the page repaints from a palette generated in the
 *   browser while the swatch keeps showing the preset it started from, so the
 *   accent dot was indigo next to a teal card. The control lied about the one
 *   thing it exists to show.
 *
 * Reading the document cannot drift, because there is nothing to drift from.
 * It also closes the gamut hole for free: `oklch()` is not bounded by sRGB, and
 * an authored chroma the display cannot reach is silently mapped by the engine -
 * so the value in the stylesheet is not the value on screen. A probe gets the
 * post-mapping colour from the engine itself.
 */

import { clampToGamut, oklchToRgb, parseOklch, type Rgb, rgbToHex } from "@/config/theme/oklch";

function parseRgbFunction(value: string): Rgb | null {
	const match = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(value.trim());
	if (!match) return null;

	return { b: Math.round(Number(match[3])), g: Math.round(Number(match[2])), r: Math.round(Number(match[1])) };
}

/**
 * One offscreen probe, reused for every token.
 *
 * It has to be IN the document - a detached element has no computed style - and
 * a child of <body>, so it inherits the same custom properties the app does.
 * `aria-hidden` plus `visibility: hidden` keeps it out of the accessibility tree
 * and off the screen without `display: none`, which would stop the engine
 * resolving `background-color` at all.
 */
export function createProbe(): HTMLElement {
	const probe = document.createElement("div");
	probe.setAttribute("aria-hidden", "true");
	probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:0";
	document.body.appendChild(probe);
	return probe;
}

/**
 * The 8-bit sRGB a token resolves to right now.
 *
 * Engines that hand back `rgb(…)` give us the rasterised colour directly;
 * engines that hand back `oklch(…)` are converted through the same clamp the
 * generator uses. Either way the answer is pixels, not intentions.
 */
export function readPaintedToken(probe: HTMLElement, token: string): Rgb | null {
	probe.style.backgroundColor = "";
	probe.style.backgroundColor = `var(${token})`;

	const painted = getComputedStyle(probe).backgroundColor;
	const fromRgb = parseRgbFunction(painted);
	if (fromRgb) return fromRgb;

	const authored = parseOklch(painted);
	return authored === null ? null : oklchToRgb(clampToGamut(authored));
}

/** The same, as a hex string - what a swatch's `background-color` wants. */
export function readPaintedHex(probe: HTMLElement, token: string): string | null {
	const rgb = readPaintedToken(probe, token);
	return rgb === null ? null : rgbToHex(rgb);
}
