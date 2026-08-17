/**
 * The eight presets: a name, a hue, and nothing else.
 *
 * Eight rather than four because the trap this slice exists to close is
 * "a sibling passed, so this one will" - and the only way to show that is false
 * is to carry hues that behave differently. Amber and emerald run out of chroma
 * a full 0.1 of lightness apart; violet clears the text bar at a lightness where
 * teal is still short. Each is solved and measured on its own.
 *
 * Adding a ninth is a line here plus `pnpm --filter @app/web generate:palettes`.
 * It inherits the same guarantee because the guarantee is the solver, not the
 * numbers.
 */

export interface PalettePreset {
	/** Accent hue in degrees - the one number a solved preset is. */
	accentHue: number;
	/** Chroma of the near-neutrals under this palette. */
	baseTint: number;
	/**
	 * Which theme `supplied.brand` is the real brand for. Defaults to `light`.
	 *
	 * Only meaningful on a designer palette: a solved preset has no hex to anchor
	 * and simply gets the correct fill in each theme.
	 */
	brandTheme?: "dark" | "light";
	description: string;
	name: string;
	/**
	 * Five hex values a designer supplied, present only on a designer palette.
	 *
	 * When set, these override the solve for the tokens they name and the rest of
	 * the palette is still derived from `accentHue` and `baseTint` above - which
	 * are themselves read off the supplied accent, so the derived half and the
	 * supplied half agree about what hue this palette is.
	 *
	 * A preset carrying this makes a DIFFERENT promise from one without it. The
	 * solved presets cannot fail their bars; a designer palette can, deliberately,
	 * because the alternative is editing somebody's brand. The measurement suite
	 * reports both and only holds the solved ones to the guarantee.
	 */
	supplied?: {
		/** Optional: derived from the brand when absent, exactly as the form does. */
		accent?: string;
		background: string;
		brand: string;
		foreground: string;
		/** Optional: derived from the brand when absent. */
		secondary?: string;
		/**
		 * Optional, and the one whose absence means something different.
		 *
		 * `accent` and `secondary` are DERIVED when absent - this file works out a
		 * value and the palette carries it. A missing card is not derived at all:
		 * it is left to the surface strategy, so `flat` keeps the card at the
		 * page's colour and `raised` steps it off. Deriving one here would pin the
		 * card and leave the Surface control with nothing to do.
		 */
		surface?: string;
	};
}

/**
 * `baseTint` is the ground, not the brand: how much of the accent hue is mixed
 * into the greys. 0.012 is the template's long-standing value and reads as
 * "cool", not as "blue".
 *
 * The warm hues carry LESS, and this used to be a comment claiming that while
 * every preset shipped the same 0.012. It is now a difference in the values,
 * because at the dark ramp's lightnesses the same chroma is not the same effect
 * either side of the wheel - the card token multiplies it by 1.25, and warm
 * lands on the brown axis where cool lands on a grey that still reads as grey:
 *
 *   tint    netflix (h28)      coinbase (h264)   page / card
 *   0       #060606 / #181818  #060606 / #181818  the untinted anchors
 *   0.008   #080504 / #1C1615  #040608 / #15181C
 *   0.012   #090404 / #1E1514  #04060A / #14181F
 *
 * At 0.012 netflix's card is a 10-point spread with red on top of it, which is
 * a brown card rather than a warm-grey one - the brand hue arriving as a colour
 * on the 60 and the 30 instead of as a bias in them. 0.008 keeps the hue legible
 * against the neutral #181818 without the ground taking on a tone of its own.
 * The three warm presets are the ones this is about; the cool half is unchanged.
 *
 * The customizer's Base tint control moves this live, so the value to commit is
 * one you can look at first rather than one derived here.
 */
export const PALETTE_PRESETS = [
	{
		accentHue: 28,
		baseTint: 0.006,
		description: "Supplied by a designer - measured, not solved.",
		name: "netflix",
		supplied: { background: "#ffffff", brand: "#e50914", foreground: "#111111" },
	},
	{
		accentHue: 262,
		baseTint: 0,
		description: "Supplied by a designer - measured, not solved.",
		name: "uber",
		supplied: { background: "#ffffff", brand: "#0549c0", foreground: "#111111", surface: "#ffffff" },
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

/**
 * Both derived from the array above, so a palette is added in ONE place.
 *
 * They used to be a hand-maintained list beside it, which meant adding a hue
 * was two edits that had to agree - and the failure when they did not was
 * silent: the name typechecked, the preset was generated, and the picker simply
 * never offered it. A `satisfies` keeps the shape checked without widening the
 * literal names away.
 */
export type PaletteName = (typeof PALETTE_PRESETS)[number]["name"];

export const PALETTE_NAMES = PALETTE_PRESETS.map((preset) => preset.name) as readonly PaletteName[];

export const PRESET_BY_NAME: Readonly<Record<PaletteName, PalettePreset>> = Object.fromEntries(
	PALETTE_PRESETS.map((preset) => [preset.name, preset]),
) as Record<PaletteName, PalettePreset>;
