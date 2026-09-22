/**
 * The draft, and the two ways stored state has broken this page.
 *
 * Both were the same shape of bug: a value read back from localStorage that the
 * current build no longer understands. A theme customizer is exactly where that
 * happens, because the thing it persists - a palette name, a set of fields - is
 * also the thing developers edit between runs.
 */

import { describe, expect, it } from "vitest";
import { BUILTIN_PRESETS, type ThemeConfig } from "../../theme-engine";
import { createThemeDraftKit } from "./theme-draft";

const TEST_CONFIG: ThemeConfig = {
	palette: "uber",
	font: "inter",
	formRadius: "sm",
	uiRadius: "md",
	surface: "raised",
};

const { applyPreset, committedDraft, draftOverrides, fiveOf, isKnownPalette, isOnPreset } = createThemeDraftKit({
	current: TEST_CONFIG,
	presets: BUILTIN_PRESETS,
});

describe("a draft read back from storage", () => {
	it("survives a palette name this build no longer ships", () => {
		expect(() => fiveOf("sky")).not.toThrow();
		expect(Object.keys(fiveOf("sky")).length).toBeGreaterThan(0);
	});

	it("knows which names are real", () => {
		expect(isKnownPalette(BUILTIN_PRESETS[0].name)).toBe(true);
		expect(isKnownPalette("a-preset-that-was-deleted")).toBe(false);
	});

	it("starts on its preset, with the five filled in", () => {
		const draft = committedDraft();

		expect(isOnPreset(draft)).toBe(true);
		expect(draft.designer.brand).toBeTruthy();
		expect(draft.designer.background).toBeTruthy();
		expect(draft.designer.foreground).toBeTruthy();
	});

	it("leaves the preset the moment a value is edited", () => {
		const draft = committedDraft();
		const edited = { ...draft, designer: { ...draft.designer, brand: "#123456" } };

		expect(isOnPreset(edited)).toBe(false);
	});

	it("leaves the preset when only the tint moves", () => {
		const draft = committedDraft();
		const tinted = { ...draft, baseTint: draft.baseTint + 0.008 };

		expect(isOnPreset(tinted)).toBe(false);
	});

	it("paints a moved tint, rather than deferring to a stylesheet that does not carry it", () => {
		const draft = committedDraft();
		const tinted = { ...draft, baseTint: draft.baseTint + 0.008 };

		expect(Object.keys(draftOverrides(draft, "dark"))).toHaveLength(0);
		expect(Object.keys(draftOverrides(tinted, "dark")).length).toBeGreaterThan(0);
	});

	it("carries the picked theme's name into the save field", () => {
		const picked = applyPreset(committedDraft(), "uber");
		expect(picked.saveAs).toBe("uber");

		const edited = { ...picked, designer: { ...picked.designer, brand: "#123456" } };
		expect(isOnPreset(edited)).toBe(false);
		expect(edited.saveAs).toBe("uber");
	});

	it("gives every shipped preset a complete five", () => {
		for (const preset of BUILTIN_PRESETS) {
			const five = fiveOf(preset.name);

			expect(five.brand, `${preset.name} brand`).toBeTruthy();
			expect(five.background, `${preset.name} background`).toBeTruthy();
			expect(five.foreground, `${preset.name} foreground`).toBeTruthy();
		}
	});
});
