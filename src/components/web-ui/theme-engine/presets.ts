/**
 * The built-in palette presets, and the helpers that turn a merged preset list
 * into the name union and lookup a project uses.
 *
 * A preset is a name, a hue, a ground tint, and - only on a designer palette -
 * up to five supplied hex values. The solved presets (no `supplied`) cannot
 * fail their contrast bars; a designer palette can, deliberately, because the
 * alternative is editing somebody's brand.
 *
 * These SEVEN ship with `@bernardsapida/web-ui`. A project adds its own brand
 * palettes in its `src/config/theme/presets.ts`, which spreads `BUILTIN_PRESETS`
 * and re-derives the name union from the merged array - so a palette is added in
 * one place and a fix to a built-in travels with a version bump.
 */

export interface PalettePreset {
	/** Accent hue in degrees - the one number a solved preset is. */
	accentHue: number;
	/** Chroma of the near-neutrals under this palette. */
	baseTint: number;
	/**
	 * Which theme `supplied.brand` is the real brand for. Defaults to `light`.
	 * Only meaningful on a designer palette.
	 */
	brandTheme?: "dark" | "light";
	description: string;
	name: string;
	/**
	 * Five hex values a designer supplied, present only on a designer palette.
	 * When set, these override the solve for the tokens they name; the rest of
	 * the palette is still derived from `accentHue` and `baseTint`.
	 *
	 * `accent` and `secondary` are DERIVED when absent. A missing `surface` is
	 * left to the surface strategy so `flat` keeps the card at the page's colour
	 * and `raised` steps it off.
	 */
	supplied?: {
		accent?: string;
		background: string;
		brand: string;
		foreground: string;
		secondary?: string;
		surface?: string;
	};
}

/**
 * `baseTint` is the ground, not the brand: how much of the accent hue is mixed
 * into the greys. The warm hues carry less - at the dark ramp's lightnesses the
 * same chroma lands on the brown axis where cool lands on a grey that still
 * reads as grey. A project's Base tint control in the customizer moves this
 * live, so the value it commits is one that was looked at first.
 */
export const BUILTIN_PRESETS = [
	{
		accentHue: 28,
		baseTint: 0.006,
		description: "Supplied by a designer - measured, not solved.",
		name: "netflix",
		supplied: { background: "#ffffff", brand: "#e50914", foreground: "#111111" },
	},
	{
		accentHue: 262,
		baseTint: 0.01,
		description: "Supplied by a designer - measured, not solved.",
		name: "uber",
		supplied: { background: "#ffffff", brand: "#0549c0", foreground: "#111111", surface: "#f7f8fa" },
	},
	{
		accentHue: 152,
		baseTint: 0.012,
		description:
			"The green everybody knows - and 2.58:1 against white, so its buttons have no edge of their own. Shipped that way by Spotify too.",
		name: "spotify",
		supplied: { background: "#FFFFFF", brand: "#1DB954", foreground: "#111111" },
	},
	{
		accentHue: 272,
		baseTint: 0.012,
		description: "Blurple. Friendly, and deep enough to carry white copy.",
		name: "discord",
		supplied: { background: "#FFFFFF", brand: "#5865F2", foreground: "#111111" },
	},
	{
		accentHue: 22,
		baseTint: 0.001,
		description: "Supplied by a designer - measured, not solved.",
		name: "airbnb",
		supplied: { background: "#ffffff", brand: "#ff5a5f", foreground: "#111111" },
	},
	{
		accentHue: 264,
		baseTint: 0.012,
		description: "Saturated finance blue. The cleanest of the seven on every row.",
		name: "coinbase",
	},
	{
		accentHue: 36,
		baseTint: 0.008,
		description: "Orange, and the one whose accent most needs keeping clear of --warning.",
		name: "rabbit",
		supplied: { background: "#FFFFFF", brand: "#F55036", foreground: "#111111" },
	},
] as const satisfies readonly PalettePreset[];

/** The built-in names as a literal union - a project widens this with its own. */
export type BuiltinPaletteName = (typeof BUILTIN_PRESETS)[number]["name"];

/**
 * Derive the flat name list and the by-name lookup from a merged preset array.
 *
 * A project calls this on `[...BUILTIN_PRESETS, ...projectPresets]` so adding a
 * palette is one line and the picker, the generator and the type all follow.
 */
export function buildPresetIndex<T extends readonly PalettePreset[]>(presets: T) {
	const names = presets.map((preset) => preset.name) as { [K in keyof T]: T[K]["name"] };
	const byName = Object.fromEntries(presets.map((preset) => [preset.name, preset])) as Record<
		T[number]["name"],
		PalettePreset
	>;
	return { names, byName };
}
