import { useMediaQuery } from "../../internal";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { MainWidth } from "../AppMain";
import { AppMain } from "../AppMain";
import { AppSkipToContent, MAIN_CONTENT_ID } from "../AppSkipToContent";
import { cn } from "../../lib/cn";
import type { AppLayoutContextValue } from "./app-layout.context";
import { AppLayoutContext } from "./app-layout.context";

/**
 * Where the sidebar stops being a column and becomes a drawer (`md`).
 *
 * Below it the in-place sidebar is not rendered at all. Two `<nav>` landmarks
 * with one of them hidden by a class is a screen reader reading out a nav nobody
 * can see.
 */
const SIDEBAR_ON_SCREEN = "(width >= 48rem)";

interface AppLayoutBaseProps {
	/**
	 * The supporting pane, on the right. Pass an `AppAside`.
	 *
	 * Rendered only while open - a pane that is merely hidden still costs its
	 * landmark in the accessibility tree.
	 */
	aside?: ReactNode;
	/** The page. */
	children: ReactNode;
	/**
	 * A bar rendered below `md` ONLY, and only when there is no `navbar`.
	 *
	 * The sidebar-only shape has no bar by design - the column carries its own
	 * toggle. But below `md` that column is off screen, so without this the shape
	 * has no sidebar AND no bar: the destinations exist and nothing on the page
	 * can reach them. This is the bar that takes the column's place, and its
	 * trigger opens the drawer through context like any other.
	 *
	 * It does not affect the SHAPE - a compact-only affordance is not a navbar
	 * the layout has, it is what a phone gets instead of the column.
	 */
	compactNavbar?: ReactNode;
	className?: string;
	"data-cy"?: string;
	/**
	 * The initial state of the pane and of the sidebar.
	 *
	 * Both are the USER's choice and both must survive a reload - but reading
	 * them from `localStorage` means the SERVER cannot know them, so every load
	 * renders the default and corrects itself a frame later. Anyone who collapsed
	 * the sidebar sees it flash open on every navigation.
	 *
	 * Passing them in fixes that: the route reads a cookie server-side and hands
	 * the answer down, so the first paint is already right. The frame owns the
	 * state from then on and reports changes through `onPreferenceChange` for the
	 * caller to write back.
	 */
	defaultAsideOpen?: boolean;
	defaultSidebarOpen?: boolean;
	/**
	 * The `<main>`'s id, and the landmark's name.
	 *
	 * Leave both alone in the app: there is one main region per page, and
	 * `AppSkipToContent` points at `MAIN_CONTENT_ID`. The component lab overrides
	 * them because it mounts a whole frame INSIDE a page that already has one, and
	 * two elements sharing `id="main-content"` is invalid HTML plus a skip link
	 * that lands on whichever the browser found first. Same escape hatch, for the
	 * same reason, as `AppMain`'s `id` and `AppSidebar`'s `navLabel`.
	 *
	 * Overriding the id also drops the skip link, because the link's target is
	 * hard-coded: a frame whose main is not THE main would be drawing a second
	 * link to somebody else's target.
	 */
	mainId?: string;
	mainLabel?: string;
	/** How wide the content column may get. Read from `staticData.mainWidth`. */
	mainWidth?: MainWidth;
	/**
	 * The bar. Pass an `AppHeader`, which finds the trigger's state through
	 * context. Named for what it IS rather than for the component, so a project
	 * can pass its own.
	 */
	navbar?: ReactNode;
	/** Fires when a stored preference changes, so the caller can persist it. */
	onPreferenceChange?: (preference: { isAsideOpen: boolean; isSidebarOpen: boolean }) => void;
	/** The nav column, rendered in place above `md`. Pass an `AppSidebar`. */
	sidebar?: ReactNode;
	/**
	 * Rendered below `md` INSTEAD of `sidebar`. Pass an `AppMobileDrawer`.
	 *
	 * The frame does not wrap the sidebar slot in a drawer itself: a drawer
	 * holding a nav is `AppMobileDrawer`'s job, and it needs the navigation data
	 * this frame deliberately does not have.
	 */
	sidebarDrawer?: ReactNode;
	/**
	 * `floating` is an island in a padded row; `flush` meets the edges.
	 *
	 * **Floating needs exactly ONE piece of chrome**, and the frame enforces it:
	 * with both a navbar and a sidebar it is flush whatever you ask for. Two
	 * islands - a bar hovering beside a column, each with its own shadow and
	 * gutter - read as two unrelated objects with the content stranded in the gap
	 * between them.
	 *
	 * It is also a tablet-and-up affordance: below `md` the frame is flush
	 * regardless, because a phone has no page to spare around an island.
	 *
	 * The frame does not restyle the slots - it cannot, they are nodes. Pass the
	 * same value to whatever you put in them; this decides the frame's own
	 * padding, and `data-surface` reports what it settled on.
	 */
	surface?: "flush" | "floating";
}

export type AppLayoutProps = AppLayoutBaseProps;

/**
 * The signed-in frame: sidebar, header, main, optional aside.
 *
 * ## The shape
 *
 * The sidebar is a SIBLING of the whole content column rather than a row beneath
 * the header, which is what makes it run the full height with the bar beside it:
 *
 * ```
 * ┌──────┬─────────────────────┐
 * │      │  header             │
 * │ side ├─────────────────────┤
 * │ bar  │  main      │ aside  │
 * └──────┴─────────────────────┘
 * ```
 *
 * ## It takes SLOTS, not data
 *
 * `sidebar`, `navbar` and `aside` are nodes the caller builds. The frame holds
 * no navigation array, no user and no role, so a project can pass its own bar
 * without this component growing a prop for every field inside it. What the
 * slots need back - is the rail collapsed, is the drawer open, what does the
 * trigger do - travels through `AppLayoutContext`, the way shadcn's
 * `SidebarProvider` and `useSidebar` do.
 *
 * ## The shape is DERIVED from the slots
 *
 * There is no `variant` prop. Passing both a navbar and a sidebar is the
 * dashboard shape; a navbar alone is the header shape; a sidebar alone is the
 * sidebar shape. A variant beside the slots would be a second source for one
 * fact, and `variant="dashboard"` with no sidebar passed had to mean something -
 * every answer to that was wrong. `data-shape` reports what it worked out.
 *
 * Which navbar is entirely the caller's: `AppHeader` for the signed-in app,
 * `AppSiteHeader` for the signed-out one - in either of ITS two shapes - or a
 * project's own. The frame never names a component it renders.
 *
 * ## What it decides
 *
 * 1. **The one trigger's effect.** Above `md` the sidebar is on screen, so
 *    toggling collapses the rail in place; below, it opens the drawer. One
 *    control, one corner, one meaning - only the effect follows the width.
 * 2. **Exactly one nav and one main.** Below `md` the in-place sidebar is not
 *    rendered, so only one `<nav>` is ever in the tree; `AppMain` is rendered
 *    once, here, so no page can add a second `<main>` or forget the skip target.
 *    The sidebar shape gets `compactNavbar` there, because a phone with neither
 *    a column nor a bar cannot reach the destinations at all.
 * 3. **Floating needs exactly one piece of chrome** - see `surface`. With both a
 *    navbar and a sidebar the frame is flush whatever was asked for, and below
 *    `md` it is flush regardless, because a phone has no page to spare around an
 *    island.
 *
 * `useMediaQuery` is a `useSyncExternalStore` hook rather than an effect because
 * the answer is needed during the first render, not after a paint. SSR has no
 * viewport, so the first answer is a bet, and it is placed on MOBILE - the
 * cheaper wrong guess is the one that renders less.
 */
export function AppLayout({
	aside,
	children,
	className,
	compactNavbar,
	"data-cy": dataCy,
	defaultAsideOpen = true,
	defaultSidebarOpen = true,
	mainId = MAIN_CONTENT_ID,
	mainLabel,
	mainWidth = "default",
	navbar,
	onPreferenceChange,
	sidebar,
	sidebarDrawer,
	surface = "flush",
}: AppLayoutProps) {
	const hasSidebarOnScreen = useMediaQuery(SIDEBAR_ON_SCREEN, false);

	const [isSidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen);
	const [isAsideOpen, setAsideOpen] = useState(defaultAsideOpen);
	const [isDrawerOpen, setDrawerOpen] = useState(false);

	/*
	 * The SHAPE is derived from the slots rather than declared. Passing both a
	 * navbar and a sidebar IS the dashboard shape; a navbar alone is the header
	 * shape; a sidebar alone is the sidebar shape. A `variant` prop beside these
	 * slots would be a second source for the same fact, and the two could
	 * disagree - `variant="dashboard"` with no sidebar passed had to mean
	 * something, and every answer was wrong.
	 */
	const hasSidebar = Boolean(sidebar);
	const hasNavbar = Boolean(navbar);
	/*
	 * The bar actually rendered. `compactNavbar` stands in for the column below
	 * `md` in the sidebar shape, and never appears beside a real navbar - two
	 * bars is worse than the problem it solves.
	 */
	const bar = navbar ?? (hasSidebarOnScreen ? null : compactNavbar);
	/*
	 * Floating needs exactly one piece of chrome, so both together is flush - and
	 * a phone has no room to spare around a floating panel either.
	 */
	const effectiveSurface = (hasSidebar && hasNavbar) || !hasSidebarOnScreen ? "flush" : surface;
	const isFloating = effectiveSurface === "floating";

	/*
	 * Where the gutter goes, and it depends on WHICH box is the island.
	 *
	 * A floating sidebar is an island, so the padding has to be on the row that
	 * holds it - the outer one - or the card sits jammed against the corner of
	 * the viewport with the page showing on only two of its sides, which is a
	 * rounded rectangle rather than an object on a page.
	 *
	 * A floating navbar is `fixed` and out of the flow instead, so what it needs
	 * is top clearance on the content beneath it rather than a gutter of its own.
	 */
	const isFloatingSidebar = isFloating && hasSidebar;
	const outerPadding = isFloatingSidebar ? "gap-4 px-4 py-5" : "";
	/*
	 * Written per SIDE when a floating bar is overhead, not as `p-* pt-*`.
	 *
	 * `p-4 sm:p-6 pt-22` looks like it clears the bar and does not: `sm:p-6` sits
	 * inside a media query, so at `sm` and up it comes later in the stylesheet
	 * than the base `pt-22` and wins on the top edge too. The clearance silently
	 * dropped from 88px to 24px above `sm`, which is every desktop - and the
	 * first block of every page sat under the fixed header.
	 *
	 * The numbers are the bar's own geometry plus the row's gutter, so that the
	 * gap under a FLOATING bar matches the gap under a flush one. A floating
	 * header sits at `top-4` (1rem) around a `py-4` content box (~4.5rem tall),
	 * so its bottom edge is ~5.5rem; add the 1.25rem gutter the flush row
	 * (`py-5`) would have used and the clearance is ~6.75rem - `pt-27`. The flush
	 * gutter no longer escalates at `sm`, so neither does this.
	 */
	const innerPadding = isFloatingSidebar
		? ""
		: isFloating && hasNavbar
			? "px-4 pt-27 pb-5"
			: "px-4 py-5";

	const value = useMemo<AppLayoutContextValue>(
		() => ({
			hasNavbar,
			isAsideOpen,
			isCompact: !hasSidebarOnScreen,
			isDrawerOpen,
			isSidebarCollapsed: !isSidebarOpen,
			setDrawerOpen,
			toggleAside: () => {
				setAsideOpen(!isAsideOpen);
				onPreferenceChange?.({ isAsideOpen: !isAsideOpen, isSidebarOpen });
			},
			// The one sidebar control: the rail where the column is on screen, the
			// drawer where it is not. Only the effect follows the width.
			toggleSidebar: () => {
				if (!hasSidebarOnScreen) {
					setDrawerOpen(!isDrawerOpen);
					return;
				}
				setSidebarOpen(!isSidebarOpen);
				onPreferenceChange?.({ isAsideOpen, isSidebarOpen: !isSidebarOpen });
			},
		}),
		[hasNavbar, hasSidebarOnScreen, isAsideOpen, isDrawerOpen, isSidebarOpen, onPreferenceChange],
	);

	return (
		<AppLayoutContext.Provider value={value}>
			{/*
			 * No `overflow-hidden` anywhere on this axis, deliberately: any overflow
			 * other than `visible` on an ancestor scopes the sticky sidebar, the
			 * sticky header and the sticky aside to THAT box instead of the viewport,
			 * which reads as "sticky is broken".
			 */}
			<div
				className={cn("relative flex min-h-screen", outerPadding, className)}
				data-cy={dataCy}
				data-shape={hasSidebar && hasNavbar ? "dashboard" : hasSidebar ? "sidebar" : "header"}
				data-surface={effectiveSurface}
			>
				{/* First focusable thing on the page, above everything including the bar -
				    but only when this frame owns the page's main. A specimen frame inside
				    a lab does not, and its link would point at the real one's target. */}
				{mainId === MAIN_CONTENT_ID ? <AppSkipToContent /> : null}

				{hasSidebarOnScreen ? sidebar : null}

				{/* Everything right of the sidebar: the bar, then the content under it. */}
				<div className="flex min-w-0 flex-1 flex-col">
					{bar}

					{/*
					 * Main and the aside share a row, so a stacked aside lands under the
					 * CONTENT rather than under a full-height sidebar.
					 *
					 * `@container`, and the row breaks at `@4xl` of the ROW rather than at
					 * a viewport `xl`. Beside a 260px sidebar - or inside a lab frame -
					 * the window can be 1600px while this row is 475px, and a viewport
					 * query there says "plenty of room" while the pane is squeezing the
					 * content into a third of it.
					 *
					 * Floating puts the bar out of the flow, so this row owns the padding
					 * that keeps its first element clear of it. Flush is in the flow and
					 * needs none - which is the whole difference between the two.
					 *
					 * The container is declared on a WRAPPER and the row is its child,
					 * which is not tidying: an element can never query its OWN
					 * container-type. CSS resolves a container query against the nearest
					 * ANCESTOR container, so `@container ... @4xl:flex-row` on one element
					 * asked a box that was never this row - NOTHING at all in the app,
					 * where the query could not match and the pane could only ever stack,
					 * and the OUTER frame's row inside a lab, where it was worse than
					 * dead: the row turned to `flex-row` off the outer width while the
					 * aside, reading the right container, kept `w-full shrink-0` and
					 * squeezed main to nothing. The padding goes on the wrapper too, so
					 * the container measures the width the row actually gets rather than
					 * that plus the gutter.
					 */}
					<div className={cn("@container flex min-w-0 flex-1 flex-col", innerPadding)}>
						<div className="flex flex-1 flex-col gap-4 @4xl:flex-row">
							<AppMain
								data-cy={dataCy ? `${dataCy}-main` : undefined}
								id={mainId}
								label={mainLabel}
								width={mainWidth}
							>
								{children}
							</AppMain>

							{/* Only while open - a hidden pane still costs a landmark. */}
							{isAsideOpen ? aside : null}
						</div>
					</div>
				</div>

				{hasSidebarOnScreen ? null : sidebarDrawer}
			</div>
		</AppLayoutContext.Provider>
	);
}
