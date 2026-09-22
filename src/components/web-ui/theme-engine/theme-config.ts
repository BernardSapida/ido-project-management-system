/**
 * The shape of a project's `src/config/theme.config.ts` export.
 *
 * A project imports `ThemeConfig` from `@bernardsapida/web-ui/theme-engine` and
 * types its `THEME` constant with it, so the customizer and the generator agree
 * about what a committed theme is. `palette` is a bare string here because the
 * package cannot know a project's palette names - the project narrows it to its
 * own union in `theme.config.ts`.
 */

import type { CARD_OPTIONS, COLOR_SCHEME_OPTIONS, FONT_OPTIONS, RADIUS_OPTIONS } from "./options";
import type { SurfaceStrategy } from "./palette.build";

export type CardStyle = keyof typeof CARD_OPTIONS;
export type ColorScheme = keyof typeof COLOR_SCHEME_OPTIONS;
export type FontName = keyof typeof FONT_OPTIONS;
export type RadiusName = keyof typeof RADIUS_OPTIONS;

export interface ThemeConfig {
	/** What a card is made of - translucent `glass` or an opaque `solid` fill. Defaults to `glass`. */
	card?: CardStyle;
	/** One scheme (`light-only` / `dark-only`) or `user` choice. Defaults to `user`. */
	colorScheme?: ColorScheme;
	/** Inputs, selects, textareas. Independent of `uiRadius`. */
	formRadius: RadiusName;
	/** The face - one of the template's or an OS font. */
	font: FontName;
	/** The palette preset name. Narrowed to the project's own union in theme.config.ts. */
	palette: string;
	/** How light mode separates page from card. `flat` (default) or `raised`. Dark mode ignores it. */
	surface?: SurfaceStrategy;
	/** Cards, menus, dialogs, tiles. */
	uiRadius: RadiusName;
}
