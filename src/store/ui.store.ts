import { create } from "zustand";
import { persist } from "zustand/middleware";
import { lockedScheme } from "@/config/theme.config";

/**
 * The scheme this project is locked to, or `null` when the reader chooses.
 *
 * Read once here rather than per call: it is a build-time constant, and this is
 * also where `components/custom` reads it from. That folder is copied into other
 * projects and may not import app config, so re-exporting the answer from the
 * store - which has to know it anyway, to clamp below - keeps the one binding
 * those components already have instead of adding a second.
 */
export const LOCKED_SCHEME = lockedScheme();

type ThemeMode = "light" | "dark" | "auto";

interface UIState {
	themeMode: ThemeMode;
	setThemeMode: (mode: ThemeMode) => void;
	/**
	 * The mobile drawer. Transient by nature - it is the phone nav being open
	 * right now, not a preference.
	 */
	isSidebarOpen: boolean;
	toggleSidebar: () => void;
	/**
	 * The user's own choice to collapse the sidebar to an icon rail. FALSE by
	 * default and deliberately so: the sidebar is expanded on first load, always.
	 * Collapsed-by-default hides the map, and a new user cannot want what they
	 * have not seen - a standing list of what the app does is the entire reason a
	 * sidebar beats a drawer.
	 *
	 * This is the user's choice and nothing else writes it. No width forces the
	 * rail any more: the frame has one trigger that means the same thing at every
	 * width, so a 1024px laptop is somewhere the person decides for themselves
	 * rather than somewhere the layout decides for them.
	 *
	 * `AppLayout` seeds itself from this at mount and reports changes back through
	 * `onPreferenceChange`, rather than reading it every render - see
	 * `SignedInLayout`.
	 */
	isSidebarCollapsed: boolean;
	setSidebarCollapsed: (isCollapsed: boolean) => void;
	toggleSidebarCollapsed: () => void;
}

const applyThemeMode = (mode: ThemeMode) => {
	if (typeof window === "undefined") return;

	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	// The lock wins over both the stored mode and the OS. Clamping HERE rather than
	// at each call site is what makes it hold: every path that changes the theme -
	// setThemeMode from a toggle a project mounted itself, rehydration from
	// localStorage, the OS listener below - ends up in this function.
	const resolved = LOCKED_SCHEME ?? (mode === "auto" ? (prefersDark ? "dark" : "light") : mode);

	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);
	// The RESOLVED theme, not the mode. HeroUI v3 publishes its dark palette under
	// [data-theme='dark'], so writing "auto" here left every HeroUI component in its
	// light palette on a dark page while Tailwind's `dark:` variants (which key off
	// the class) worked - "some components look a bit off" rather than a clear break.
	// Anything needing to know the user picked "auto" reads it from this store.
	document.documentElement.setAttribute("data-theme", resolved);
	document.documentElement.style.colorScheme = resolved;
};

export const useUIStore = create<UIState>()(
	persist(
		(set) => ({
			themeMode: "auto",
			setThemeMode: (mode) => {
				set({ themeMode: mode });
				applyThemeMode(mode);
			},
			isSidebarOpen: true,
			toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
			isSidebarCollapsed: false,
			setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),
			toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
		}),
		{
			name: "app-ui-storage",
			onRehydrateStorage: () => (state) => {
				if (state) {
					applyThemeMode(state.themeMode);
				}
			},
		},
	),
);

/**
 * `auto` following the OS while the page is open.
 *
 * `__root.tsx` resolves the class before first paint and `setThemeMode` re-resolves
 * it on every press, but neither covers the case where nothing on the page changed
 * and the OS appearance flipped underneath it.
 *
 * It belongs here rather than in `AppThemeToggle` for two reasons. One listener
 * exists per app instead of one per rendered toggle - the toggle's own lab puts six
 * on screen, which was six handlers racing to write the same three attributes. And
 * the copy that lived in the component set only the class and `colorScheme`, never
 * `data-theme`, so an OS flip under an `auto` page left every HeroUI component in
 * its light palette - exactly the failure `applyThemeMode` documents above. Going
 * through `applyThemeMode` means there is now one writer of those attributes.
 *
 * A locked project attaches nothing at all: there is no OS preference to follow,
 * and the cheapest way to guarantee that is to never listen in the first place.
 */
if (typeof window !== "undefined" && !LOCKED_SCHEME) {
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
		if (useUIStore.getState().themeMode === "auto") applyThemeMode("auto");
	});
}
