import { createContext, useContext } from "react";

export interface AppLayoutContextValue {
	/**
	 * Whether a bar is rendered above the content. FALSE in the sidebar-only
	 * shape, and that is what tells the column to draw its OWN toggle: with no
	 * bar there is nowhere else for the one control to live, and a rail whose
	 * labels exist only in tooltips with no way to see the menu whole is a dead
	 * end.
	 */
	hasNavbar: boolean;
	/** True below `md`, where the sidebar is a drawer rather than a column. */
	isCompact: boolean;
	/** The supporting pane's own open state. */
	isAsideOpen: boolean;
	/** The rail. Meaningless while `isCompact` - use `isDrawerOpen` there. */
	isSidebarCollapsed: boolean;
	/** The off-canvas sidebar, on a phone. */
	isDrawerOpen: boolean;
	setDrawerOpen: (isOpen: boolean) => void;
	toggleAside: () => void;
	/**
	 * The one sidebar control. Collapses the rail where the column is on screen
	 * and opens the drawer where it is not - see `AppLayout`.
	 */
	toggleSidebar: () => void;
}

/**
 * What the frame knows and its slotted parts need.
 *
 * `AppLayout` takes its header and sidebar as SLOTS - the caller passes
 * `<AppHeader />` and `<AppSidebar />` rather than the data to build them - which
 * means the frame cannot hand them props. The state they share travels through
 * here instead, the way shadcn's `SidebarProvider` and `useSidebar` do.
 *
 * Every consumer treats its own props as the override and this as the fallback,
 * so a component lab can still drive a part directly with no provider above it.
 * That is why the default is `null` rather than a set of made-up values: a part
 * has to be able to tell "no frame" from "a frame that says false".
 */
export const AppLayoutContext = createContext<AppLayoutContextValue | null>(null);

/** The frame's state, or `null` when the component is used on its own. */
export function useAppLayout(): AppLayoutContextValue | null {
	return useContext(AppLayoutContext);
}
