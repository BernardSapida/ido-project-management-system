/**
 * The two lists that have to agree, and the failure when they do not.
 *
 * `configOutput` decides which flags the customizer sends; `FLAGS` decides which
 * ones the dev endpoint will run. They are edited in different files by different
 * changes - a new control goes in the page, a new flag goes in the generator -
 * and nothing but this test connects them.
 *
 * The drift is not a partial failure. `argvFrom` rejects a body carrying an
 * unknown key rather than dropping it, deliberately, so ONE missing entry here
 * means Apply writes nothing and the toast reads "unknown flag(s):
 * --color-scheme" - a flag the generator had supported since the day the control
 * shipped. Remove "--color-scheme" from FLAGS and both cases below fail.
 */

import { describe, expect, it } from "vitest";
import { applyPreset, committedDraft, configOutput } from "@/features/theme-customizer/theme-draft";
import { FLAGS } from "./vite-plugin-apply-theme";

const allowed = new Set<string>(FLAGS);

describe("the flags the customizer sends", () => {
	it("are all ones the dev endpoint will run, on a preset", () => {
		const output = configOutput(applyPreset(committedDraft(), "uber"));

		expect(output.flags).not.toBeNull();
		expect(Object.keys(output.flags ?? {}).filter((flag) => !allowed.has(flag))).toEqual([]);
	});

	it("are all ones the dev endpoint will run, off a preset", () => {
		// The other branch: an edited hex sends --apply and --colors as well, so a
		// preset-only check would miss a drift in the path that writes presets.ts.
		const draft = committedDraft();
		const output = configOutput({ ...draft, designer: { ...draft.designer, brand: "#123456" } });

		expect(output.flags).not.toBeNull();
		expect(Object.keys(output.flags ?? {}).filter((flag) => !allowed.has(flag))).toEqual([]);
	});

	it("carry the colour scheme, which is the one that was dropped", () => {
		const output = configOutput({ ...committedDraft(), colorScheme: "dark-only" });

		expect(output.flags?.["--color-scheme"]).toBe("dark-only");
		expect(allowed.has("--color-scheme")).toBe(true);
	});
});
