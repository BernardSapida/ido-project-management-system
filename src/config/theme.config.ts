/**
 * The project's look, in one exported constant.
 *
 * Change THEME and every screen follows - no component file, no stylesheet, no
 * hunting for a hex. That is the whole point of the token layer, and this line
 * is where a new project spends its five minutes on branding.
 *
 * To choose one with the numbers in front of you, open
 * `/components/theme-customizer`, click through the presets, and press "Copy
 * the project default". It hands you the exact line to paste below.
 *
 * The customizer previews into localStorage and NEVER writes here. A preview
 * silently becoming the committed default is how an unnoticed change ships.
 */

import type { CardStyle, ColorScheme, FontName, RadiusName, SurfaceStrategy } from "@bernardsapida/web-ui/theme-engine";
import { RADIUS_OPTIONS } from "@bernardsapida/web-ui/theme-engine";
import type { PaletteName } from "./theme/presets";

export type { CardStyle, ColorScheme, FontName, RadiusName };

export interface ThemeConfig {
	/**
	 * What a card is made of - translucent glass, or an opaque fill.
	 *
	 * `glass` is the default and is what every project shipped before this
	 * existed, so omitting it changes nothing. `solid` matters for one structural
	 * reason beyond taste: a glass card composites 75% of a tint over the page, so
	 * it has no colour of its own and cannot honour a card colour somebody chose.
	 */
	card?: CardStyle;
	/**
	 * Whether this project ships in one colour scheme or lets the reader choose.
	 *
	 * `user` is the default and is what every project shipped before this existed,
	 * so omitting it changes nothing. Setting it to `light-only` or `dark-only`
	 * makes that scheme the only one the app renders: the OS preference stops
	 * applying, a previously stored choice stops applying, and the app shell stops
	 * mounting a toggle. See COLOR_SCHEME_OPTIONS in theme/options.ts.
	 */
	colorScheme?: ColorScheme;
	/** Inputs, selects, textareas. Independent of `uiRadius` on purpose. */
	formRadius: RadiusName;
	/** The face. Only what the template ships or the OS already has - see theme/options.ts. */
	font: FontName;
	/** One of the nine measured presets. See theme/presets.ts. */
	palette: PaletteName;
	/**
	 * How light mode separates the page from the cards on it.
	 *
	 * `flat` is both the default and what every project shipped before this
	 * existed: page and card are the same white, separated by a border and a
	 * shadow. `raised` steps the page down to a tinted ground and leaves cards
	 * white on top of it - the structural layer a 60-30-10 reading calls the 30,
	 * and the one dark mode has always had.
	 *
	 * Dark mode ignores this. It already ladders `#060606` under `#181818`.
	 */
	surface?: SurfaceStrategy;
	/** Cards, menus, dialogs, tiles. */
	uiRadius: RadiusName;
}

// ---- The line. This is what the customizer's copy action hands you. --------
export const THEME: ThemeConfig = {
	palette: "ipms",
	font: "inter",
	uiRadius: "md",
	formRadius: "sm",
	surface: "raised",
	card: "solid",
	colorScheme: "light-only",
};
// ---------------------------------------------------------------------------

/**
 * The scheme this project is locked to, or `null` when the reader chooses.
 *
 * One place answers this, because four things need the answer and they must not
 * be able to disagree: the markup below, the pre-paint script in `__root.tsx`,
 * `applyThemeMode` in the store, and whether a toggle is mounted at all.
 */
export function lockedScheme(theme: ThemeConfig = THEME): "dark" | "light" | null {
	if (theme.colorScheme === "light-only") return "light";
	if (theme.colorScheme === "dark-only") return "dark";
	return null;
}

/**
 * The attributes and inline custom properties `<html>` carries for a theme.
 *
 * Written server-side in __root.tsx so the palette is correct in the very first
 * painted frame. It needs no pre-paint script of its own precisely because it
 * is not a user preference: it is a build-time constant, and the markup can
 * simply carry it.
 *
 * A LOCKED colour scheme is the same kind of thing, so it is carried here too -
 * and that is strictly better than the script, because markup does not need
 * JavaScript to have run. The light/dark script stays exactly as it was for the
 * `user` case, which is the only case where light/dark is a reader's choice, and
 * `__root.tsx` drops it entirely when locked.
 *
 * `applyThemeMode` in the store still rewrites these on rehydration, so this is
 * not the only writer - but it clamps through `lockedScheme` too, so the two
 * cannot disagree. That is the invariant worth keeping: not one writer, one
 * ANSWER, and everything that writes reads it from here.
 */
export function themeAttributes(theme: ThemeConfig = THEME) {
	const locked = lockedScheme(theme);

	return {
		"data-font": theme.font,
		"data-palette": theme.palette,
		// The resolved scheme, on the same three surfaces the script and the store
		// write: the class Tailwind's `dark:` variants key off, the attribute HeroUI
		// v3 publishes its dark palette under, and the CSS property that decides
		// what the BROWSER paints - form controls, scrollbars, its own surfaces.
		...(locked ? { className: locked, "data-theme": locked } : {}),
		// Omitted entirely on `flat`, so the base palette block resolves untouched
		// and the attribute only appears when somebody has opted in.
		...(theme.surface && theme.surface !== "flat" ? { "data-surface": theme.surface } : {}),
		// Same rule for the same reason: `glass` is the shipped default, so a
		// project that has not opted out carries no attribute and the utilities
		// resolve exactly as they always did.
		...(theme.card && theme.card !== "glass" ? { "data-card": theme.card } : {}),
		style: {
			...(locked ? { colorScheme: locked } : {}),
			"--field-radius": RADIUS_OPTIONS[theme.formRadius].value,
			"--radius": RADIUS_OPTIONS[theme.uiRadius].value,
		} as React.CSSProperties,
	};
}
