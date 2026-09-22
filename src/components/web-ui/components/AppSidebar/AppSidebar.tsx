import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { AppButton } from "../AppButton";
import { useAppLayout } from "../AppLayout/app-layout.context";
import type { LogoMark, LogoSize } from "../AppLogo";
import { AppLogo } from "../AppLogo";
import type { AppNavListProps } from "../AppNavList";
import { AppNavList } from "../AppNavList";
import { AppSearchField } from "../AppSearchField";
import { AppSidebarUserCard } from "../AppSidebarUserCard";
import { AppTooltip } from "../AppTooltip";
import type { NavGroup, NavItem } from "../../lib/nav";
import { filterNavItems, groupNavItems } from "../../lib/nav";
import { cn } from "../../lib/cn";

/** The key that jumps to the search field. Drawn in the field, bound below. */
const SEARCH_SHORTCUT = "/";

interface AppSidebarProps {
	/** The current pathname; every item's active state is derived from it. */
	activeHref: string;
	badges?: Record<string, number>;
	/**
	 * Positioning and height, supplied by the caller. The shell makes it a
	 * sticky column; the component lab drops it into a fake desktop frame. A nav
	 * that hard-codes `fixed` cannot be shown inside anything.
	 */
	className?: string;
	/**
	 * Test hook on the `<aside>`. Everything inside derives its own from it -
	 * `-logo`, `-search`, `-nav`, `-secondary`, `-toggle`, `-user` - so a page
	 * holding two sidebars cannot end up with two of anything sharing a selector.
	 *
	 * `-nav` is the one that repeats: a menu with N sections renders N lists, and
	 * they all carry it, because a spec asking for "the destinations" wants all of
	 * them. Reach for a single group through its wrapper's `data-nav-section`
	 * instead of expecting `-nav` to match exactly one element.
	 */
	"data-cy"?: string;
	/**
	 * Off removes the search field and its shortcut entirely. Worth doing on a
	 * menu short enough to read in one glance, where a filter is furniture.
	 */
	hasSearch?: boolean;
	/**
	 * Off leaves the MARK alone at the head of the expanded column - no app name,
	 * no role label beneath it.
	 *
	 * It exists for the brand whose mark already carries its name, or is simply
	 * strong enough not to need one repeated beside it. The stacked
	 * mark + name + role label is three pieces of identity in the corner of a
	 * screen the user is signed into and therefore already knows the name of, and
	 * on a short menu it outweighs the destinations under it.
	 *
	 * Distinct from `AppLogo`'s own `wordmark`, which the rail already sets: that
	 * one means "there is no room for the name", and it comes back at 260px. This
	 * is the caller saying the name does not belong here at any width. When it is
	 * off, `roleLabel` is dropped with it - a role stranded under a bare mark is a
	 * caption for something that is no longer there.
	 */
	hasWordmark?: boolean;
	isCollapsed?: boolean;
	/**
	 * What the brand image IS, which decides how it is sized. Passed straight to
	 * `AppLogo` - see the prop there.
	 *
	 * `square` is an icon, fitted to a square box. `lockup` is a WIDE image that
	 * already contains the product's name, sized by height with the width left to
	 * its aspect ratio. Getting this wrong is not a matter of taste: a 256x76
	 * lockup fitted to a 40x40 square is painted at 40x12, so a perfectly good
	 * horizontal logo arrives as an unreadable smudge in the corner of the
	 * column. If the brand is wider than it is tall, it is a `lockup`.
	 *
	 * A lockup carries its own name, so it suppresses the text wordmark by
	 * itself - `hasWordmark` has nothing left to do beside one.
	 */
	logoMark?: LogoMark;
	/**
	 * The landmark's name. Leave it alone in the app - "Main" is the one main
	 * nav. The component lab overrides it because it puts three specimens on one
	 * page, and three landmarks called "Main" is exactly the thing this nav
	 * renders one-at-a-time to avoid.
	 */
	navLabel?: string;
	navigation: NavItem[];
	/**
	 * Called instead of navigating when an ACCOUNT row in the user menu is
	 * chosen. Separate from `onNavigate` because those rows are menu actions
	 * rather than links - there is no anchor and so no event to `preventDefault`,
	 * and passing a synthetic one would be a lie the labs would come to depend
	 * on. The app leaves it unset; the labs set it so a specimen cannot navigate
	 * the page out from under the reader.
	 */
	onAccountSelect?: (item: NavItem) => void;
	onLogout: () => void;
	/**
	 * Called on every item press, before navigation. The app leaves it unset -
	 * a sidebar link navigates, which is the whole point of it. The component
	 * lab sets it and calls `preventDefault`, so a specimen cannot navigate the
	 * page it is being read on out from under the reader.
	 */
	onNavigate?: AppNavListProps["onNavigate"];
	/**
	 * Omitted when the sidebar's width is not this column's to change - which,
	 * in the App Layout family, is always: the trigger lives in `AppHeader` and
	 * the layout owns the state, so there is exactly one control and it is in the
	 * same place at every width.
	 *
	 * Nothing in the app passes it any more. It is still here for the column that
	 * has no bar above it - the sidebar-only shape, where the frame hands the
	 * toggle over through context - and for the labs, which drive a specimen with
	 * no frame at all.
	 */
	onToggleCollapsed?: () => void;
	roleLabel: string;
	secondaryNavigation: NavItem[];
	user: { email: string; name: string };
	/**
	 * The SKIN, not the position. Both variants are the same column at the same
	 * two widths; what changes is how the panel meets the page around it.
	 *
	 * `floating` is the island: glass, fully rounded, meant to sit inside a padded
	 * row with the page showing behind and around it. It suits a surface with
	 * something worth showing through - a backdrop, a gradient, a landing-adjacent
	 * app - and it is what the template has always shipped.
	 *
	 * `flush` is the edge: an opaque `bg-card` column with a hairline on its right
	 * and no radius at all, meeting the viewport edge and running the full height.
	 * It suits a dense app where the sidebar is furniture rather than an object -
	 * a rounded island spends ~24px of gutter on every side, which is the width of
	 * a rail's worth of glyph, and buys nothing on a screen the user has open all
	 * day.
	 *
	 * Positioning stays the caller's, through `className`, in both. A variant that
	 * also decided `fixed` or `sticky` could not be shown inside a lab frame.
	 */
	variant?: "flush" | "floating";
}

/**
 * The desktop navigation: a persistent sidebar, always on screen, never behind
 * a hamburger. Hidden navigation takes roughly 40% fewer clicks and a hamburger
 * on a desktop costs about 56% engagement against a visible nav - the pixels
 * are there, so they get spent on a standing list of what the app does.
 *
 * Who uses it, and how often: everyone signed in, on every screen, all day. That
 * is what buys the search field and the `/` shortcut - a surface this frequent
 * pays back a keyboard path - and it is also why nothing here is hidden behind a
 * hover. The worst mistake available is not destructive but navigational: ending
 * up on the wrong screen and not noticing. So the active row is stated three ways
 * (tint, weight, filled glyph) and `aria-current` says it outright.
 *
 * Four blocks, top to bottom:
 *
 * 1. **Header** - the mark, the wordmark, and the collapse toggle beside it. The
 *    toggle sits on the title row rather than at the foot because it acts on the
 *    whole column, and a control that reshapes a panel belongs at the panel's
 *    corner, not buried under the thing it reshapes.
 * 2. **Search** - filters the destinations as you type. See the note on it below.
 * 3. **Destinations** - grouped under their section headings when the config
 *    supplies them (`NavItem.section`). Grouping is what lets a nav be grasped in
 *    one pass instead of read item by item.
 * 4. **Account, then the user** - the things mobile hides in the drawer. There is
 *    no reason to hide them at 1440px, so they stand at the foot, and one rule
 *    separates the identity row from the navigation above it.
 *
 * Two widths, one list. Expanded is 260px with labels; collapsed is a ~72px icon
 * rail with the labels moved into tooltips. The items, their order and their
 * icons are identical across the two, so muscle memory survives the breakpoint -
 * it is the same nav, narrower, not a different one. The section headings drop on
 * the rail but their GAPS do not: the grouping is what the eye learned, and it
 * survives losing the words.
 *
 * Collapsing happens for one of two reasons: the viewport is under `lg`, or the
 * user pressed the button. It is never the initial state on a screen wide
 * enough for labels (see ui.store).
 *
 * This column never holds the trigger in the App Layout family. There is exactly
 * ONE control for the sidebar's width and it lives in `AppHeader`, in the same
 * corner at every width, because it means the same thing at every width: wide
 * screens toggle the rail in place, phones slide the whole column in as a
 * drawer. A second trigger in here would be a different button doing the same
 * job in a place it only sometimes appears. The one exception is the shape with
 * no bar at all, where the frame hands this column the toggle through context
 * because there is nowhere else for it to go.
 *
 * Two skins, on an axis independent of the two widths: `floating` is the glass
 * island in a padded row, `flush` is the opaque column against the viewport
 * edge. See `variant`. Everything else - the items, the search, the groups, the
 * rail's tooltips, the user card - is identical across both, because the skin is
 * a decision about the page around the nav and not about the nav.
 */
export function AppSidebar({
	activeHref,
	badges,
	className,
	"data-cy": dataCy,
	hasSearch = true,
	hasWordmark = true,
	isCollapsed: collapsedProp,
	logoMark = "square",
	navLabel = "Main",
	navigation,
	onAccountSelect,
	onLogout,
	onNavigate,
	onToggleCollapsed,
	roleLabel,
	secondaryNavigation,
	user,
	variant = "floating",
}: AppSidebarProps) {
	/*
	 * Prop wins, context fills in - the column is a SLOT inside `AppLayout`, so
	 * the frame cannot hand it props, but a lab drives it directly with no frame
	 * above it.
	 */
	const layout = useAppLayout();
	const isCollapsed = collapsedProp ?? layout?.isSidebarCollapsed ?? false;
	/*
	 * The column draws its own toggle only where there is no bar to hold one -
	 * the sidebar-only shape. Everywhere else the single control lives in the
	 * header, and a second one here would be the same job done twice in a place
	 * it only sometimes appears.
	 */
	const toggleCollapsed = onToggleCollapsed ?? (layout && !layout.hasNavbar ? layout.toggleSidebar : undefined);
	/*
	 * Three reasons the text name can be absent, and they are not the same
	 * reason. The rail has no ROOM for it and gets it back at 260px;
	 * `hasWordmark={false}` is the caller saying it does not belong here at all;
	 * and a lockup has the name inside the IMAGE, so drawing it again would spell
	 * the brand twice. All three land on one flag because the markup only ever
	 * needs the answer, not the reason.
	 */
	const isLockup = logoMark === "lockup";
	const showWordmark = hasWordmark && !isCollapsed && !isLockup;
	/*
	 * A lockup is the widest thing in this header and the only one that can use
	 * the room, so it gets the largest step - `lg` is `h-10 w-auto`, which on a
	 * wide mark reads considerably bigger than the same number on a square one.
	 * A square mark standing alone takes `md`; beside its own wordmark, or on the
	 * rail where 72px is the constraint rather than the composition, `sm`.
	 */
	const logoSize: LogoSize = isCollapsed ? "sm" : isLockup ? "lg" : hasWordmark ? "sm" : "md";

	const [searchQuery, setSearchQuery] = useState("");
	const searchInputRef = useRef<HTMLInputElement>(null);
	/** Set when the shortcut fires on the rail: focus has to wait for the width. */
	const wantsSearchFocus = useRef(false);
	const headingId = useId();

	const focusSearch = () => {
		// Expanded already: the field is in the DOM, so take it now.
		if (!isCollapsed) {
			searchInputRef.current?.focus();
			return;
		}
		// On the rail the field does not exist yet. Expanding is only ours to do
		// when the toggle was handed to us; below `lg` the width decides, and
		// nothing here may argue with it.
		if (!onToggleCollapsed) return;
		wantsSearchFocus.current = true;
		onToggleCollapsed();
	};

	// The field mounts with the expansion, so the focus lands on the render after
	// the one that asked for it.
	useEffect(() => {
		if (isCollapsed || !wantsSearchFocus.current) return;
		wantsSearchFocus.current = false;
		searchInputRef.current?.focus();
	}, [isCollapsed]);

	// The `/` shortcut, bound because the field draws a hint promising it. A hint
	// for a key nobody listens to is worse than no hint - the slash lands in
	// whatever the user was typing and they stop trusting the chrome.
	useEffect(() => {
		if (!hasSearch) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== SEARCH_SHORTCUT) return;
			// A bare slash only. With a modifier it belongs to the browser, and
			// mid-composition it belongs to the IME.
			if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
			// Inside a field it is a character the user meant to type. Both the
			// event's target AND the focused element are checked, because they can
			// disagree for a frame while React is re-rendering the thing being
			// typed into - and when they do, the target is `body` and this handler
			// eats a keystroke out of the field the user is looking at.
			if (isTypingTarget(event.target) || isTypingTarget(document.activeElement)) return;
			event.preventDefault();
			focusSearch();
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [hasSearch, isCollapsed, onToggleCollapsed]);

	// Searching filters the DESTINATIONS only. Account and the identity row are
	// fixed furniture at the foot of the panel; hiding them because a query did
	// not match takes the way out of the screen with it.
	const isSearching = hasSearch && !isCollapsed && searchQuery.trim() !== "";
	const visibleNavigation = isSearching ? filterNavItems(navigation, searchQuery) : navigation;
	const groups: NavGroup[] = groupNavItems(visibleNavigation);

	return (
		<aside
			className={cn(
				"flex flex-col p-4 transition-[width] duration-200 ease-out",
				/*
				 * The skin, and the only thing the variant decides. Flush paints
				 * `bg-card` rather than glass because it meets the viewport edge: a
				 * translucent panel with nothing behind it to show through is a panel
				 * that has thrown away its own reason, and it reads as a rendering
				 * fault - the same call AppMobileDrawer already makes for the same
				 * reason. Its hairline is on the RIGHT only; the other three edges are
				 * the viewport, and a border there is a box drawn around the window.
				 */
				variant === "floating" ? "glass-strong rounded-3xl" : "border-r border-border bg-card",
				isCollapsed ? "w-18 items-center px-2" : "w-65",
				className,
			)}
			data-collapsed={isCollapsed}
			data-cy={dataCy}
			data-variant={variant}
		>
			{/*
			 * The header slot. Expanded it is the mark, the wordmark and the toggle on
			 * one row; collapsed, the identity gives the slot up to the toggle.
			 *
			 * The wordmark could not survive 72px either way, and the mark on its own
			 * above a toggle above a magnifier made the rail three stacked glyphs deep
			 * before a single destination - the top of a nav has to be the nav. The
			 * mark is a link home, and home is the first item in the list two rows
			 * below it, so nothing is lost that was not already there.
			 *
			 * The one exception is the forced rail with no control of any kind in it.
			 * A nav with nothing at its top reads as clipped, so the mark stays, and
			 * it is also the only place it can still be pressed. Give the rail either
			 * control and the mark yields the slot to it - the top of a nav has to be
			 * the nav, and a mark stacked above a button is a glyph the rail cannot
			 * afford.
			 */}
			{/*
			 * `justify-between` rather than leaning on the logo's `flex-1` to do it.
			 * The toggle belongs at the column's trailing edge, and it only landed
			 * there while the brand cell was greedy - so a mark with no wordmark to
			 * stretch left the button jammed against the logo with 180px of empty row
			 * beside it. The logo keeps `flex-1` where it has a NAME to truncate;
			 * this is what puts the toggle at the end in every other case.
			 */}
			<div
				className={cn(
					"flex shrink-0 gap-2",
					isCollapsed ? "flex-col items-center pb-2" : "items-center justify-between pb-4",
				)}
			>
				{isCollapsed && toggleCollapsed ? null : (
					<AppLogo
						/*
						 * `flex-1` only while the name is drawn. It is there so a long app
						 * name takes the slack and truncates rather than shoving the toggle
						 * off the column - with no name there is nothing to truncate, and
						 * stretching a 40px mark across 260px would turn the whole header
						 * row into one link home.
						 */
						className={!isCollapsed && (showWordmark || isLockup) ? "min-w-0 flex-1" : undefined}
						data-cy={dataCy ? `${dataCy}-logo` : undefined}
						href="/"
						mark={logoMark}
						roleLabel={showWordmark ? roleLabel : undefined}
						size={logoSize}
						wordmark={showWordmark}
					/>
				)}

				{/*
				 * The toggle carries an aria-label and an aria-pressed state, and no
				 * tooltip: a tooltip is how a DESTINATION keeps its name on the rail,
				 * and this is a control that changes the furniture rather than a place
				 * to go. It is icon-only in both widths now that it sits on the title
				 * row - the glyph is a panel with an arrow, which says which way the
				 * column is about to move without a word beside it.
				 */}
				{toggleCollapsed ? (
					<AppButton
						aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
						aria-pressed={isCollapsed}
						className="shrink-0 text-muted"
						data-cy={dataCy ? `${dataCy}-toggle` : undefined}
						icon={isCollapsed ? PanelLeftOpen : PanelLeftClose}
						isIconOnly
						onPress={toggleCollapsed}
						size="sm"
						variant="ghost"
					/>
				) : null}
			</div>

			{hasSearch ? (
				<div className={cn("shrink-0", isCollapsed ? "pb-2" : "pb-3")}>
					{isCollapsed ? (
						// The rail's stand-in. It is a real control - it expands the column
						// and puts the caret in the field - which is the only honest way to
						// keep a magnifier on a 72px rail. Without a toggle to press there
						// is no field to reach, so the button goes rather than sitting
						// there doing nothing.
						onToggleCollapsed ? (
							<AppTooltip
								description={`Expands the sidebar and puts the caret in the field. ${SEARCH_SHORTCUT} does the same from anywhere.`}
								icon={Search}
								placement="right"
								title="Search"
							>
								{/* Already focusable, so it goes in as itself rather than
								    wrapped in a Trigger - see AppTooltip. */}
								<AppButton
									aria-label="Search navigation"
									className="text-muted"
									data-cy={dataCy ? `${dataCy}-search-trigger` : undefined}
									icon={Search}
									isIconOnly
									onPress={focusSearch}
									size="sm"
									variant="ghost"
								/>
							</AppTooltip>
						) : null
					) : (
						<AppSearchField
							data-cy={dataCy ? `${dataCy}-search` : undefined}
							// Local filtering over an array this size: a delay would only
							// put the list behind the typing.
							debounceMs={0}
							inputRef={searchInputRef}
							label="Search navigation"
							onValueChange={setSearchQuery}
							placeholder="Search"
							value={searchQuery}
						/>
					)}
				</div>
			) : null}

			<nav
				aria-label={navLabel}
				className="scrollbar-none scroll-fade-y min-h-0 flex-1 overflow-y-auto"
			>
				{groups.length > 0 ? (
					<div className={cn("flex flex-col", isCollapsed ? "gap-3" : "gap-4")}>
						{groups.map((group, index) => (
							<div
								data-nav-section={group.label ?? ""}
								key={group.label ?? "__ungrouped__"}
							>
								{/*
								 * The heading is drawn only where there is room to read it.
								 * On the rail the gap between groups carries the grouping on
								 * its own, which is why the rail's gap is larger than the gap
								 * between the items inside a group - inner smaller than outer,
								 * or there are no groups.
								 */}
								{group.label && !isCollapsed ? (
									<p
										className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted uppercase"
										id={`${headingId}-group-${index}`}
									>
										{group.label}
									</p>
								) : null}
								<AppNavList
									activeHref={activeHref}
									aria-labelledby={group.label && !isCollapsed ? `${headingId}-group-${index}` : undefined}
									badges={badges}
									data-cy={dataCy ? `${dataCy}-nav` : undefined}
									isCollapsed={isCollapsed}
									items={group.items}
									onNavigate={onNavigate}
									// Only while the list is actually filtered - the marks are the
									// answer to what was typed, so an unsearched nav shows none.
									searchQuery={isSearching ? searchQuery : undefined}
								/>
							</div>
						))}
					</div>
				) : (
					/*
					 * Searched, matched nothing. Not a blank column: it names what was
					 * typed so the typo is visible, and carries the way out. The account
					 * block below is untouched, so the screen is never a dead end even
					 * while this is showing.
					 */
					<div
						className="px-3 py-6 text-center"
						data-cy={dataCy ? `${dataCy}-nav-empty` : undefined}
					>
						<p className="text-sm font-semibold text-foreground">No matches</p>
						<p className="mt-1 text-xs text-muted">
							Nothing here is called “{searchQuery.trim()}”. Check the spelling, or search for less of it.
						</p>
						<AppButton
							className="mt-3"
							onPress={() => {
								setSearchQuery("");
								searchInputRef.current?.focus();
							}}
							size="sm"
							variant="secondary"
						>
							Clear search
						</AppButton>
					</div>
				)}
			</nav>

			{/*
			 * The account block is INSIDE the card's menu now, not a standing run of
			 * rows above it. It was a heading, a row and a divider of permanent
			 * column height spent on things reached a few times a month - and on the
			 * rail it was a second set of unlabelled glyphs below the first. Sign out
			 * mattered most: the one irreversible control in the nav, permanently in
			 * its tab order, a slip away from the profile link above it.
			 */}
			<AppSidebarUserCard
				data-cy={dataCy ? `${dataCy}-user` : undefined}
				isCollapsed={isCollapsed}
				menuItems={secondaryNavigation}
				onLogout={onLogout}
				onSelect={onAccountSelect}
				user={user}
			/>
		</aside>
	);
}

/**
 * Whether a keystroke belongs to something the user is typing into. A global
 * single-key shortcut that skips this check eats a character out of every form
 * on the page.
 */
function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	return ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}
