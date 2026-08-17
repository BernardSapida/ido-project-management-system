import { AppThemeToggle } from "@bernardsapida/web-ui";
import type { ComponentProps } from "react";
import { useUIStore } from "@/store/ui.store";

/**
 * The theme toggle, bound to this project's store.
 *
 * `AppThemeToggle` is props in, markup out - it takes `mode` and `onModeChange`
 * and knows nothing about where the theme lives. That is what lets it be
 * published. The binding to `ui.store` is app-specific, so it lives here, in
 * Project Components, where a sync will never overwrite it.
 *
 * This is the pattern for every lab component that needs to know something about
 * this project: wrap it here, do not edit it upstream.
 */
export function ThemeToggle(props: Omit<ComponentProps<typeof AppThemeToggle>, "mode" | "onModeChange">) {
	const setThemeMode = useUIStore((state) => state.setThemeMode);
	const themeMode = useUIStore((state) => state.themeMode);

	return (
		<AppThemeToggle
			{...props}
			mode={themeMode}
			onModeChange={setThemeMode}
		/>
	);
}
