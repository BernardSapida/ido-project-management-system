/**
 * This project's palette presets: the seven that ship with
 * `@bernardsapida/web-ui`, plus the ones added here.
 *
 * The built-ins travel with the package. A palette added below is this
 * project's own. Adding one is a line in `PROJECT_PRESETS` plus
 * `npx tsx scripts/generate-palettes.ts`.
 */

import { BUILTIN_PRESETS, buildPresetIndex, type PalettePreset } from "@bernardsapida/web-ui/theme-engine";

export type { PalettePreset };

/** This project's own brand palettes. Never published. */
const PROJECT_PRESETS = [
	{ accentHue: 128, baseTint: 0.02, description: "Added from the theme customizer.", name: "custom" },
	{
		accentHue: 161,
		baseTint: 0,
		description: "Supplied by a designer - measured, not solved.",
		name: "revolve",
		supplied: { background: "#ffffff", brand: "#0c3523", foreground: "#111111", surface: "#fbf7f7" },
	},
	{
		accentHue: 28,
		baseTint: 0,
		description: "Supplied by a designer - measured, not solved.",
		name: "ipms",
		supplied: { background: "#ffffff", brand: "#b20d0e", foreground: "#111111", surface: "#ffffff" },
	},
] as const satisfies readonly PalettePreset[];

export const PALETTE_PRESETS = [...BUILTIN_PRESETS, ...PROJECT_PRESETS] as const;

/** The literal union of every palette name this project ships. */
export type PaletteName = (typeof PALETTE_PRESETS)[number]["name"];

const { names, byName } = buildPresetIndex(PALETTE_PRESETS);

export const PALETTE_NAMES = names as readonly PaletteName[];

export const PRESET_BY_NAME = byName as Readonly<Record<PaletteName, PalettePreset>>;
