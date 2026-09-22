import type { LucideIcon } from "lucide-react";
import { Monitor, Moon, Sun } from "lucide-react";
import { AppButton } from "../AppButton";

/** The cycle order. `auto` last, so the two explicit answers come first. */
const MODES = ["light", "dark", "auto"] as const;

/**
 * Declared here rather than imported from the store, so this component names its
 * own contract and a project can bind it to whatever holds the mode. The store's
 * copy is the same three strings, and structural typing matches them without
 * either module importing the other.
 */
export type ThemeMode = (typeof MODES)[number];

const MODE: Record<ThemeMode, { icon: LucideIcon; label: string }> = {
	auto: { icon: Monitor, label: "Auto" },
	dark: { icon: Moon, label: "Dark" },
	light: { icon: Sun, label: "Light" },
};

/**
 * The theme switch: light → dark → auto, one control, one click per step.
 *
 * A three-state cycle rather than a two-state switch, because "follow the
 * system" is a real answer and a binary toggle has nowhere to put it. The
 * trade-off is that the next state is not visible before you press, which is
 * why the accessible name says where the press goes rather than only where you
 * are.
 *
 * Props in, markup out - it holds no state and reads no store. `auto` does have
 * live work to do (the class on `<html>` is resolved before first paint in
 * `__root.tsx`, and nothing would re-resolve it if the OS flipped while the page
 * was open), but that work does not belong to a button. It lives beside
 * `applyThemeMode` in `ui.store.ts`, where it runs once per app rather than once
 * per rendered toggle - this page's own lab renders six.
 *
 * `AppFloatingThemeToggle` in this folder is the store-bound wrapper. Bind this
 * one to whatever your project keeps the mode in.
 *
 * Styling is `AppButton` with no `className` at all. It used to be a raw HeroUI
 * `Button` carrying its own height, padding, border, blur and hover transform -
 * eight hard-coded utilities re-deciding what a button in this app looks like,
 * in the one component whose entire job is to prove the design tokens work in
 * both themes.
 */
interface AppThemeToggleProps {
	// A prop rather than a hard-coded string: this used to carry
	// `data-cy="theme-toggle"` itself, and its own lab renders two of them - one
	// hook matching two elements, which is the thing rule 2 forbids.
	"data-cy"?: string;
	/**
	 * Drops the label and keeps the glyph, for a control with no room for a word -
	 * the floating corner one, above all. Nothing is lost to a screen reader: the
	 * accessible name below is the same either way and already says both where you
	 * are and where the press goes. A sighted user does lose the written mode,
	 * which is why this is opt-in and the label is the default.
	 */
	isIconOnly?: boolean;
	/** The mode currently in effect. */
	mode: ThemeMode;
	/** Handed the NEXT mode in the cycle, already resolved. */
	onModeChange: (mode: ThemeMode) => void;
}

export function AppThemeToggle({
	"data-cy": dataCy,
	isIconOnly = false,
	mode: themeMode,
	onModeChange,
}: AppThemeToggleProps) {
	const next = MODES[(MODES.indexOf(themeMode) + 1) % MODES.length] ?? "light";

	// Says where the press GOES, not just where you are. A cycling control whose
	// name only reports its current state leaves a screen-reader user pressing it
	// to find out what it does.
	const label = `Theme: ${MODE[themeMode].label}. Switch to ${MODE[next].label}.`;

	// Two returns rather than one `isIconOnly={isIconOnly}`: AppButton's props are
	// a union, and `isIconOnly: true` is what makes `aria-label` required there.
	// Passing a boolean would collapse both halves of that union into neither.
	if (isIconOnly) {
		return (
			<AppButton
				aria-label={label}
				data-cy={dataCy}
				icon={MODE[themeMode].icon}
				isIconOnly
				onPress={() => onModeChange(next)}
				variant="outline"
			/>
		);
	}

	return (
		<AppButton
			aria-label={label}
			data-cy={dataCy}
			icon={MODE[themeMode].icon}
			onPress={() => onModeChange(next)}
			variant="outline"
		>
			{MODE[themeMode].label}
		</AppButton>
	);
}
