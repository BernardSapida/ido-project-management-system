/**
 * The draft, and the two ways stored state has broken this page.
 *
 * Both were the same shape of bug: a value read back from localStorage that the
 * current build no longer understands. A theme customizer is exactly where that
 * happens, because the thing it persists - a palette name, a set of fields - is
 * also the thing developers edit between runs.
 */

import { describe, expect, it } from "vitest";
import { PALETTE_PRESETS } from "@/config/theme/presets";
import { applyPreset, committedDraft, draftOverrides, fiveOf, isKnownPalette, isOnPreset } from "./theme-draft";

describe("a draft read back from storage", () => {
	it("survives a palette name this build no longer ships", () => {
		// The crash: a draft saved against "sky" after sky was removed took the
		// whole page down with "Cannot read properties of undefined".
		expect(() => fiveOf("sky" as never)).not.toThrow();
		expect(Object.keys(fiveOf("sky" as never)).length).toBeGreaterThan(0);
	});

	it("knows which names are real", () => {
		expect(isKnownPalette(PALETTE_PRESETS[0].name)).toBe(true);
		expect(isKnownPalette("a-preset-that-was-deleted")).toBe(false);
	});

	it("starts on its preset, with the five filled in", () => {
		const draft = committedDraft();

		expect(isOnPreset(draft)).toBe(true);
		// Not empty: the five ARE the theme, so a fresh draft has to carry them.
		expect(draft.designer.brand).toBeTruthy();
		expect(draft.designer.background).toBeTruthy();
		expect(draft.designer.foreground).toBeTruthy();
	});

	it("leaves the preset the moment a value is edited", () => {
		const draft = committedDraft();
		const edited = { ...draft, designer: { ...draft.designer, brand: "#123456" } };

		expect(isOnPreset(edited)).toBe(false);
	});

	/*
	 * The base tint is the one palette input that no hex on the form carries, so
	 * it is the one an on-preset check can silently omit. These two are here
	 * because the omission is invisible from the outside: the slider moves, the
	 * readout updates, and nothing repaints - which reads as a broken slider
	 * rather than as a draft that thinks it is still on its preset.
	 *
	 * Delete the tint comparison in isOnPreset and BOTH of these fail.
	 */
	it("leaves the preset when only the tint moves", () => {
		const draft = committedDraft();
		const tinted = { ...draft, baseTint: draft.baseTint + 0.008 };

		expect(isOnPreset(tinted)).toBe(false);
	});

	it("paints a moved tint, rather than deferring to a stylesheet that does not carry it", () => {
		const draft = committedDraft();
		const tinted = { ...draft, baseTint: draft.baseTint + 0.008 };

		// On the preset there is deliberately nothing to write - the page paints
		// from the generated stylesheet. Off it, there is no stylesheet for this
		// tint and the inline path is the only thing that can show it.
		expect(Object.keys(draftOverrides(draft, "dark"))).toHaveLength(0);
		expect(Object.keys(draftOverrides(tinted, "dark")).length).toBeGreaterThan(0);
	});

	it("carries the picked theme's name into the save field", () => {
		/*
		 * The field only appears once a value has been edited - the moment somebody
		 * has stopped browsing and started changing a SPECIFIC theme - and it used
		 * to appear empty and fall back to "my-theme". So tweaking uber and pressing
		 * save wrote a new preset called my-theme and left uber exactly as it was,
		 * which is the opposite of what the action reads as.
		 */
		const picked = applyPreset(committedDraft(), "uber");
		expect(picked.saveAs).toBe("uber");

		// And it survives the edit that makes the field appear in the first place.
		const edited = { ...picked, designer: { ...picked.designer, brand: "#123456" } };
		expect(isOnPreset(edited)).toBe(false);
		expect(edited.saveAs).toBe("uber");
	});

	it("gives every shipped preset a complete five", () => {
		// A theme that cannot fill the form is a theme the picker would break on.
		for (const preset of PALETTE_PRESETS) {
			const five = fiveOf(preset.name);

			expect(five.brand, `${preset.name} brand`).toBeTruthy();
			expect(five.background, `${preset.name} background`).toBeTruthy();
			expect(five.foreground, `${preset.name} foreground`).toBeTruthy();
		}
	});
});
