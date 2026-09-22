import { useIsScrolled } from "../../internal";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import type { BreadcrumbItem } from "../AppBreadcrumbs";
import { AppBreadcrumbs } from "../AppBreadcrumbs";
import { AppButton } from "../AppButton";
import { useAppLayout } from "../AppLayout/app-layout.context";
import { AppLogo } from "../AppLogo";
import { cn } from "../../lib/cn";

export interface AppHeaderProps {
	/**
	 * The right end of the bar: search, alerts, an account menu. Two or three,
	 * and they are the fixed cost of the bar - the breadcrumbs give way to them.
	 */
	actions?: ReactNode;
	/**
	 * The trail, and the bar's main content.
	 *
	 * It is rendered with `minLevels={1}`, against the component's own default of
	 * three. That default is right where the trail was designed to live - above a
	 * page's `<h1>`, where "Home > Page" repeats the heading underneath it. A bar
	 * has no heading beside it: suppress the trail here and what is left is an
	 * empty strip with two icons floating at the end of it, which reads as a
	 * component that failed to render rather than one that declined to.
	 *
	 * So at one level the bar states the page, at two it shows the pair, and from
	 * three the collapsing and overflow rules take over as usual.
	 */
	breadcrumbs?: BreadcrumbItem[];
	className?: string;
	/** Test hook on the `<header>`. `-logo`, `-crumbs`, `-hamburger` derive from it. */
	"data-cy"?: string;
	/**
	 * Off in a layout whose sidebar already carries the brand and stands beside
	 * this bar rather than under it. On in the Header layout, which has no
	 * sidebar, and in the Dashboard layout, where the bar spans the full width
	 * ABOVE the sidebar and is therefore the top-left corner of the app.
	 *
	 * Two logos on one screen is the failure this exists to prevent.
	 */
	hasLogo?: boolean;
	/** Where the logo goes. */
	homeHref?: string;
	/** Whether the sidebar is currently showing its labels (or, on a phone, open). */
	isSidebarExpanded?: boolean;
	/**
	 * Toggles the sidebar. Supplying it is what puts the trigger on the bar; a
	 * layout with no sidebar at all (the Header layout) leaves it unset.
	 *
	 * Drawn at EVERY width, which is the thing to understand about it. It is not
	 * "open the nav" - that would be a control with nothing to do on a desktop
	 * where the nav is already standing there. It is "how wide is the sidebar",
	 * and that is a real question at 1920px, because plenty of people would
	 * rather have the rail and the extra content width all day.
	 *
	 * One button, one position, one meaning; what it DOES follows the width,
	 * which the layout owns:
	 *
	 * - Tablet and up → the sidebar is on screen, so it toggles rail ↔ labels in
	 *   place. No overlay, and the page keeps its context.
	 * - Phone → the sidebar is not on screen at all, so it slides the whole
	 *   column in as a drawer.
	 */
	onToggleSidebar?: () => void;
	/**
	 * `floating` is the island: FIXED, out of the flow, so the page underneath
	 * owns the top padding that keeps its first element out from under it.
	 * `flush` is a full-width bar, STICKY and in the flow, so it needs none.
	 *
	 * Same pair of names, and the same distinction, as `AppSidebar` and
	 * `AppSiteHeader` - an object ON the page, or an edge OF it. App Layout
	 * passes one value down to the header and the sidebar together; a floating
	 * header over a flush sidebar is two decisions where there is one.
	 */
	variant?: "flush" | "floating";
}

/**
 * The signed-in app bar: where you are, and what you can do from here.
 *
 * `AppSiteHeader` is NOT this and must not grow into it. That one is the
 * marketing bar a signed-out visitor meets - brand, mega menus, Log in, Get
 * started - and it answers "what is this product?". This one answers "where am
 * I in it?", which is why the middle of the bar is a breadcrumb trail rather
 * than a destination list. The destinations are in the sidebar, or behind the
 * hamburger when there is no room for one.
 *
 * ## There is no page title in here, deliberately
 *
 * Every screen opens with its name in 30px type. A second copy of it in a bar
 * 40px above is the same word twice, and the one people read is the big one -
 * `AppMobileBar` learned this and only fades its title in once the `<h1>` has
 * scrolled away. Rather than repeat that machinery, this bar carries the trail,
 * whose last crumb IS the page name and which is doing a different job:
 * ancestry, not identity.
 *
 * ## What it decides for you
 *
 * - **The sidebar trigger is on the LEFT, at every width.** The side follows
 *   from what the button acts on: a control for the PRIMARY navigation is the
 *   leading element of a top app bar in Material, is where Android users reach
 *   for it, and is where shadcn puts its `SidebarTrigger` - and it mirrors the
 *   side its drawer arrives from. A trigger for account, settings or overflow
 *   belongs top-right instead, which is why `AppSiteHeader` keeps its own there:
 *   that one opens a sheet belonging to the bar rather than the column belonging
 *   to the page. See `onToggleSidebar` for why it has no breakpoint.
 * - **The brand gives way before the trail does**, and only where a hamburger
 *   has replaced it. See the logo in the markup below.
 * - **The bar gains its border and shadow on scroll**, not at rest, through the
 *   same `useIsScrolled` the site header uses.
 * - **Breadcrumbs are given, never derived here.** The trail comes from the
 *   route (`useRouteBreadcrumbs`); a bar that worked out its own would disagree
 *   with the one the page renders.
 */
export function AppHeader({
	actions,
	breadcrumbs = [],
	className,
	"data-cy": dataCy,
	hasLogo = true,
	homeHref = "/",
	isSidebarExpanded,
	onToggleSidebar,
	variant = "floating",
}: AppHeaderProps) {
	const isScrolled = useIsScrolled();
	/*
	 * Props win, context fills in. Inside `AppLayout` the bar is a SLOT and the
	 * frame cannot hand it props, so the trigger's state arrives this way; on a
	 * lab page there is no frame, and the props are the only source. Treating
	 * context as the fallback rather than the source is what lets both work.
	 */
	const layout = useAppLayout();
	const toggleSidebar = onToggleSidebar ?? layout?.toggleSidebar;
	const isExpanded =
		isSidebarExpanded ?? (layout ? (layout.isCompact ? layout.isDrawerOpen : !layout.isSidebarCollapsed) : undefined);
	const isFloating = variant === "floating";

	return (
		<header
			className={cn(
				"@container z-40 w-full",
				isFloating ? "fixed top-4 left-1/2 -translate-x-1/2 px-4" : "sticky top-0",
				className,
			)}
			data-cy={dataCy}
			data-variant={variant}
		>
			<div
				className={cn(
					"transition-shadow duration-200",
					/*
					 * The flush bar's gutter is `AppMain`'s, not the floating bar's.
					 *
					 * Flush spans the same column as the content beneath it, so the two
					 * gutters are read as one edge - both are `px-4` now, the frame's one
					 * standard, matching main's own `px-4 py-5`. The hamburger's `-ml-1`
					 * pulls the glyph's own padding back so the ICON, not its hit area,
					 * lands on that edge.
					 *
					 * Floating is an island inside its own padded row, so its gutter has
					 * nothing to line up with - it takes the same `px-4` for one standard
					 * across the frame.
					 */
					isFloating
						? "mx-auto max-w-full rounded-2xl border border-border bg-card px-4"
						: "border-b bg-card/95 px-4 backdrop-blur-sm",
					/*
					 * Transparent rather than absent at rest, so gaining the border on
					 * scroll cannot move the bar's contents by a pixel.
					 */
					isFloating
						? isScrolled
							? "shadow-lg"
							: "shadow-soft"
						: isScrolled
							? "border-border shadow-soft"
							: "border-transparent",
				)}
			>
				<div className="flex min-h-14 items-center gap-2 py-4">
					{/*
					 * Hamburger first, then brand: the button is the leftmost thing on
					 * the bar because it is the one control a thumb reaches for on a
					 * phone, and putting the logo before it pushes it inboard by the
					 * width of a wordmark.
					 *
					 * No breakpoint on it. It used to be `@5xl:hidden`, on the reasoning
					 * that a hamburger beside a visible nav opens what is already open -
					 * true of a button that OPENS, and this one toggles. "How wide is the
					 * sidebar" is a real question at 1920px, so the button is a fixture
					 * of the bar at every width, in the same corner, meaning the same
					 * thing. Only its effect changes with the width, and that is the
					 * layout's to decide.
					 *
					 * `aria-expanded` rather than `aria-haspopup="dialog"`: it is only a
					 * dialog on a phone, and claiming one on a desktop promises an
					 * overlay that never arrives.
					 */}
					{toggleSidebar ? (
						<AppButton
							aria-expanded={isExpanded}
							// True whichever thing the width makes it do - a rail is the
							// sidebar hidden as much as a closed drawer is.
							aria-label={isExpanded ? "Hide sidebar" : "Show sidebar"}
							className="-ml-1 shrink-0"
							data-cy={dataCy ? `${dataCy}-hamburger` : undefined}
							icon={Menu}
							isIconOnly
							onPress={toggleSidebar}
							variant="ghost"
						/>
					) : null}

					{/*
					 * The brand gives way before the trail does, and only where a
					 * hamburger has taken its place.
					 *
					 * Material's element order for a top app bar is navigation icon,
					 * title, actions - there is no logo in it at all, because a signed-in
					 * user knows which app they are in. The trail does not have that
					 * luxury: it is the only thing on the bar saying WHERE in the app
					 * they are, so on a 390px bar the wordmark is what can be spent.
					 * Nothing is lost outright - the drawer the hamburger opens carries
					 * the logo at its head.
					 *
					 * With no hamburger there is nothing standing in for it, so it stays
					 * at every width.
					 */}
					{hasLogo ? (
						<AppLogo
							className={cn("min-w-0 shrink-0", toggleSidebar && "hidden @5xl:flex")}
							data-cy={dataCy ? `${dataCy}-logo` : undefined}
							href={homeHref}
							size="sm"
						/>
					) : null}

					{/*
					 * The trail takes the slack. `min-w-0` is what lets it truncate
					 * instead of shoving the actions off the right edge - a flex child's
					 * default `min-width: auto` refuses to go narrower than its content,
					 * and a long trail then widens the row rather than collapsing its
					 * middle, which is the one thing AppBreadcrumbs is built to do.
					 *
					 * `minLevels={1}` because this bar has no `<h1>` beside the trail for
					 * it to be redundant with - see the prop's note above.
					 */}
					<div className="min-w-0 flex-1">
						<AppBreadcrumbs
							data-cy={dataCy ? `${dataCy}-crumbs` : undefined}
							items={breadcrumbs}
							minLevels={1}
						/>
					</div>

					{actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
				</div>
			</div>
		</header>
	);
}
