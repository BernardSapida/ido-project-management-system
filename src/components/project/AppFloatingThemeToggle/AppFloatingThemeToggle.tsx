// The one sanctioned store read in components/custom, and the reason the rule
// exists rather than a hole in it: this file IS the app binding. It is dev-only
// scaffolding the app mounts for itself, so it is allowed to know where the theme
// lives; AppThemeToggle beside it must not, and the rule now says so out loud.
// A second disable in this folder means a component is being coupled, not bound.
// eslint-disable-next-line no-restricted-imports

import { AppThemeToggle } from "@bernardsapida/web-ui";
import { LOCKED_SCHEME, useUIStore } from "@/store/ui.store";

/**
 * The theme toggle pinned to the top-right corner of every page - in a
 * DEVELOPMENT BUILD ONLY.
 *
 * This is also the store-bound half of the pair. `AppThemeToggle` is props in,
 * markup out; the binding to `ui.store` lives here, in the wrapper the app
 * mounts for itself, so the button underneath stays reusable by a project that
 * keeps its theme somewhere else.
 *
 * It is scaffolding, not a feature. Checking a screen in both themes is
 * something whoever is building it does constantly and every user does once, so
 * the control that makes it one click from anywhere belongs to the person with
 * the dev server open. In production the app keeps exactly the toggles it puts
 * on screen deliberately - the marketing header, an appearance setting - and
 * this one is not there to float over their content.
 *
 * `import.meta.env.DEV` is fixed at build time, so the production bundle drops
 * this subtree rather than shipping a hidden button. It is also the same value
 * on the server and in the browser, so nothing here can cause a hydration
 * mismatch.
 *
 * Two placement decisions worth keeping:
 *
 * - `z-40` is level with the app bar (`AppHeader`, which it never overlaps -
 *   opposite corners) and above everything under it, but below HeroUI's
 *   overlays, whose `.modal__overlay` is `z-50`. A dev affordance floating on
 *   top of an open modal would be the toggle testing the app rather than the
 *   other way round.
 * - The surface and shadow are on the wrapper, not on the button. The button
 *   stays a plain `AppButton` with no `className` - the thing the styling
 *   section of its lab exists to protect - so the wrapper has to trace the
 *   button's shape from the outside.
 *
 *   It does that with `rounded-3xl`, the same step `.button` itself uses, NOT
 *   with `rounded-full`. That was right while an icon-only button was always a
 *   40px circle; it stopped being right the moment --radius became a project
 *   setting, because `rounded-full` is a flat 9999px that ignores the scale.
 *   On a squared-off theme the button went square inside a wrapper that stayed
 *   a circle, and the surface underneath showed at all four corners.
 */
export function AppFloatingThemeToggle() {
	const setThemeMode = useUIStore((state) => state.setThemeMode);
	const themeMode = useUIStore((state) => state.themeMode);

	if (!import.meta.env.DEV) return null;
	// A project that ships one colour scheme has nothing to toggle. Scaffolding
	// that flips a theme the app does not have would only ever show you a page
	// that cannot be shipped.
	if (LOCKED_SCHEME) return null;

	return (
		<div className="fixed end-4 top-4 z-40 rounded-3xl bg-surface shadow-soft print:hidden">
			<AppThemeToggle
				data-cy="floating-theme-toggle"
				isIconOnly
				mode={themeMode}
				onModeChange={setThemeMode}
			/>
		</div>
	);
}
