import { Badge } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import type { ComponentProps, MouseEvent } from "react";
import { useState } from "react";
import { AppTooltip } from "../AppTooltip";
import type { NavItem } from "../../lib/nav";
import { isNavItemActive } from "../../lib/nav";
import { markMatches } from "../../lib/mark-matches";
import { cn } from "../../lib/cn";

export interface AppNavListProps {
	/** The current pathname. Active state is DERIVED from it - see isNavItemActive. */
	activeHref: string;
	/**
	 * The id of the heading this list sits under, when the frame has drawn one.
	 * The `<ul>` is then a named list inside the landmark rather than an
	 * anonymous run of links a screen reader has to infer the grouping of.
	 */
	"aria-labelledby"?: string;
	/** Unread counts keyed by href. An href with no entry renders no badge. */
	badges?: Record<string, number>;
	className?: string;
	/**
	 * Test hook on the `<ul>`. The frame that owns the landmark supplies it -
	 * a sidebar renders TWO of these lists, so they cannot share one value.
	 */
	"data-cy"?: string;
	/** Icon rail: labels move into tooltips. A response to width or a click, never the initial state. */
	isCollapsed?: boolean;
	items: NavItem[];
	/**
	 * The live search term the list was filtered by. When set, each row's label
	 * marks the run of text matching it - the same `<mark>` treatment the table
	 * uses, so a match looks the same wherever the user typed. Unset (the resting
	 * state) leaves the labels as plain text. Ignored on the rail, where the
	 * labels are `sr-only` and there is nothing to mark.
	 */
	searchQuery?: string;
	/**
	 * Called on every item press, before navigation. The drawer closes itself
	 * with it; the component lab calls `event.preventDefault()` so a specimen
	 * cannot navigate the page out from under the reader.
	 */
	onNavigate?: (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * The destination list, and the only thing that knows how a nav item looks.
 *
 * Every nav in the app renders this: the desktop sidebar, the same sidebar
 * collapsed to a rail, the mobile drawer's secondary block, the More sheet. Two
 * hand-written lists drift the first time a route is added and only one of them
 * gets it, so there is one renderer and one config array behind it.
 *
 * The frame owns the `<nav>` landmark and its label - this is a bare `<ul>`, so
 * a sidebar holding a main list and an account list is two labelled landmarks
 * rather than four.
 */
export function AppNavList({
	activeHref,
	"aria-labelledby": ariaLabelledBy,
	badges,
	className,
	"data-cy": dataCy,
	isCollapsed = false,
	items,
	onNavigate,
	searchQuery,
}: AppNavListProps) {
	return (
		<ul
			aria-labelledby={ariaLabelledBy}
			className={cn("flex flex-col", isCollapsed ? "items-center gap-1" : "gap-0.5", className)}
			data-collapsed={isCollapsed}
			data-cy={dataCy}
		>
			{items.map((item) => (
				<NavRow
					activeHref={activeHref}
					badges={badges}
					isCollapsed={isCollapsed}
					item={item}
					key={item.href}
					onNavigate={onNavigate}
					searchQuery={searchQuery}
				/>
			))}
		</ul>
	);
}

interface NavRowProps {
	activeHref: string;
	badges?: Record<string, number>;
	isCollapsed: boolean;
	item: NavItem;
	onNavigate?: (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void;
	searchQuery?: string;
}

function NavRow({ activeHref, badges, isCollapsed, item, onNavigate, searchQuery }: NavRowProps) {
	const children = item.children ?? [];
	const hasChildren = children.length > 0;
	const isActive = isNavItemActive(item, activeHref);
	// A section holding the current page opens itself. `undefined` means "not
	// touched yet", so the route can keep driving it until the user disagrees.
	const [isOpenOverride, setIsOpenOverride] = useState<boolean | undefined>(undefined);
	const isOpen = isOpenOverride ?? isActive;

	return (
		// Addressed by href rather than by a per-item `data-cy`: the href is the
		// item's identity in the config, so a spec never has to be kept in step
		// with a second naming scheme.
		<li data-nav-item={item.href}>
			{/*
			 * A row does ONE thing. An item with children is a disclosure and nothing
			 * else: pressing anywhere on it opens the section, and it never
			 * navigates. It used to be a link with a separate chevron button beside
			 * it, which made one row two controls a few pixels apart - press the
			 * label and the page changes, press the caret and it does not, and the
			 * only way to know which you hit is to watch what happens.
			 *
			 * This is the rule `SiteHeaderMenu` already holds for the same reason: a
			 * control that navigates on click AND discloses on click does the wrong
			 * one of those about half the time. If a section has a landing page of
			 * its own, it goes in as the FIRST CHILD - which is also where a reader
			 * looks for it.
			 */}
			{hasChildren ? (
				<NavDisclosure
					isActive={isActive}
					isCollapsed={isCollapsed}
					isOpen={isOpen}
					item={item}
					onToggle={() => setIsOpenOverride(!isOpen)}
					searchQuery={searchQuery}
				/>
			) : (
				<NavLink
					activeHref={activeHref}
					badge={badges?.[item.href]}
					isCollapsed={isCollapsed}
					item={item}
					onNavigate={onNavigate}
					searchQuery={searchQuery}
				/>
			)}

			{/*
			 * Nested sections expand IN PLACE. Never a flyout and never a second
			 * drawer inside the first: on mobile the parent is a screen listing its
			 * children, which is a place you can go back from.
			 *
			 * The rail down the left is what stops the indent alone from carrying
			 * the nesting once a child's label wraps. On the icon rail it is all
			 * there is - a child glyph and a parent glyph are otherwise the same
			 * thing - so the indent is smaller but the line stays.
			 */}
			{hasChildren && isOpen ? (
				<ul
					className={cn(
						"mt-1 flex flex-col gap-1 border-l border-border",
						isCollapsed ? "ml-3 items-center pl-1" : "ml-5 pl-2",
					)}
					data-nav-children={item.href}
				>
					{children.map((child) => (
						<li
							data-nav-item={child.href}
							key={child.href}
						>
							<NavLink
								activeHref={activeHref}
								badge={badges?.[child.href]}
								isCollapsed={false}
								item={child}
								onNavigate={onNavigate}
								searchQuery={searchQuery}
							/>
						</li>
					))}
				</ul>
			) : null}
		</li>
	);
}

/**
 * The shape of a row, shared by the links and the disclosures.
 *
 * Both have to be the same object at a glance - a section that opens and a
 * destination that navigates differ in what they DO, not in how they sit in the
 * column - so the recipe lives in one place rather than being copied into the
 * second control and drifting.
 */
function rowClassName(isActive: boolean, isCollapsed: boolean): string {
	return cn(
		"relative flex items-center rounded-xl text-sm transition",
		"focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:outline-none",
		// A SQUARE tile on the rail, not a full-width row with its label removed.
		// Stretched across 72px the active pill became a lozenge taller than the
		// glyph inside it - a blob with an icon floating in the middle, which is
		// not the shape the expanded sidebar taught. 44px keeps the touch target
		// and makes the fill sit around the icon rather than around the column.
		isCollapsed ? "size-11 shrink-0 justify-center" : "min-h-11 w-full gap-3 px-3 py-2.5",
		// A TINT of the accent, not the hero gradient. The gradient pill won its
		// contrast by being the loudest thing in the column, which is fine with one
		// destination and wrong with nine: every section heading, badge and label
		// had to be read past it. At 10% the row still reads as chosen and the list
		// beside it stays legible.
		//
		// Colour is not carrying it alone, which is what a tint this quiet requires:
		// the row is tinted, the label goes semibold, and aria-current says it
		// outright. Greyscale, colour-blind, sunlight - three signals, and the
		// state survives losing any one of them. The glyph deliberately is NOT one
		// of them; see the icon below.
		isActive
			? "bg-[color-mix(in_oklab,var(--accent)_10%,var(--surface))] font-semibold text-accent"
			: "font-medium text-foreground/70 hover:bg-muted-surface hover:text-foreground",
	);
}

/**
 * A section that opens, and does nothing else.
 *
 * No `href`, no `aria-current`, and NO ACTIVE TINT. It is not a place, so it
 * must not look like the place you are: with the parent tinted and the child
 * tinted under it, two rows claimed to be the current page and the eye had no
 * way to tell which one the content belonged to.
 *
 * Holding the current page still has one visible consequence - the section
 * opens itself - and that is enough. `data-contains-current` reports the same
 * fact for a test without pretending it is the row's own state.
 */
function NavDisclosure({
	isActive,
	isCollapsed,
	isOpen,
	item,
	onToggle,
	searchQuery,
}: {
	isActive: boolean;
	isCollapsed: boolean;
	isOpen: boolean;
	item: NavItem;
	onToggle: () => void;
	searchQuery?: string;
}) {
	// `false`, always: a section is never the current page, and tinting it beside
	// a tinted child put two "you are here" marks on screen at once.
	const className = cn(rowClassName(false, isCollapsed), "cursor-pointer");

	const buttonProps = {
		"aria-expanded": isOpen,
		// The name says what the control DOES, because the glyph and the label
		// alone read as a destination. On the rail there is no label at all.
		"aria-label": `${item.title}, ${isOpen ? "collapse" : "expand"} section`,
		// Whether the CURRENT PAGE is somewhere inside - not whether this row is
		// it. Named apart from `data-active` so the two can never be confused for
		// each other in a spec.
		"data-contains-current": isActive,
		"data-nav-toggle": item.href,
		onClick: onToggle,
		type: "button" as const,
	};

	const content = (
		<>
			<item.icon
				aria-hidden="true"
				className={isCollapsed ? "size-5 shrink-0" : "size-4.5 shrink-0"}
			/>
			{isCollapsed ? null : (
				<>
					<span className="truncate">{markMatches(item.title, searchQuery ?? "")}</span>
					{/* Rotates rather than swapping glyph, so the state reads as one
					    object moving rather than two icons alternating. */}
					<ChevronDown
						aria-hidden="true"
						className={cn(
							"ml-auto size-4 shrink-0 text-muted transition-transform duration-200",
							isOpen && "rotate-180",
						)}
					/>
				</>
			)}
		</>
	);

	if (!isCollapsed) {
		return (
			<button
				className={className}
				{...buttonProps}
			>
				{content}
			</button>
		);
	}

	/*
	 * The rail has no label and no chevron, so the tooltip is the only thing that
	 * can say this opens a section rather than going somewhere.
	 *
	 * `render` makes the trigger BE the button rather than a div wrapped around
	 * one - the same call NavLink makes for its anchor. Wrapping would nest a
	 * button inside a button and add a second tab stop per rail item.
	 */
	return (
		<AppTooltip
			description={`${item.description}. Opens a section rather than a page.`}
			icon={item.icon}
			placement="right"
			title={item.title}
		>
			<AppTooltip.Trigger
				className={className}
				render={(props) => (
					<button
						{...(props as ComponentProps<"button">)}
						{...buttonProps}
					>
						{content}
					</button>
				)}
			/>
		</AppTooltip>
	);
}

interface NavLinkProps {
	activeHref: string;
	badge?: number;
	isCollapsed: boolean;
	item: NavItem;
	onNavigate?: (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void;
	searchQuery?: string;
}

function NavLink({ activeHref, badge, isCollapsed, item, onNavigate, searchQuery }: NavLinkProps) {
	const isActive = isNavItemActive(item, activeHref);

	const className = rowClassName(isActive, isCollapsed);

	const content = (
		<>
			<item.icon
				aria-hidden="true"
				// The active glyph changes COLOUR and nothing else. It used to also
				// take a 25% fill of the current colour, and a filled lucide icon
				// does not read as emphasis - the fill lands inside the stroke, so the
				// glyph looks embossed or shadowed rather than selected, and the
				// thinner shapes (a bar chart, a table) turn into blobs.
				//
				// Dropping it costs nothing in redundancy. "You are here" is still
				// carried by the tinted row behind it, the semibold label and
				// aria-current - three signals, none of which is colour alone, so the
				// state still survives greyscale, colour-blindness and sunlight.
				className={cn(
					// 18px in a row, 20px on the rail: on the rail the glyph IS the
					// item, so it carries the weight the label carries elsewhere.
					isCollapsed ? "size-5 shrink-0" : "size-4.5 shrink-0",
				)}
			/>
			{isCollapsed ? (
				<span className="sr-only">{item.title}</span>
			) : (
				<span className="truncate">{markMatches(item.title, searchQuery ?? "")}</span>
			)}
			{/* Raw Badge, deliberately. AppBadge is the ANCHORED badge - it wraps the
			    thing it annotates and pins itself to a corner of it. This one sits
			    inline at the end of the row as its own element, with nothing to
			    anchor to, so there is no anchor for AppBadge to be. */}
			{badge && !isCollapsed ? <Badge className="ml-auto shrink-0">{badge > 99 ? "99+" : badge}</Badge> : null}
			{/*
			 * Collapsed, a count has nowhere to sit, so it becomes a dot on the
			 * glyph - a rail must still be able to say something arrived. It is
			 * drawn rather than announced on its own: the count joins the link's
			 * accessible name instead, so the rail reads "Notifications, 3 unread"
			 * rather than firing a live region every time the nav re-renders.
			 */}
			{badge && isCollapsed ? (
				<>
					<span
						aria-hidden="true"
						className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background"
					/>
					<span className="sr-only">{`, ${badge} unread`}</span>
				</>
			) : null}
		</>
	);

	// Derived from the pathname rather than TanStack's own activeProps: the same
	// rule then decides the sidebar, the tab bar and the More sheet, and the
	// component lab can drive it from a state variable to show both states.
	const linkProps = {
		"aria-current": isActive ? ("page" as const) : undefined,
		// Active state as data as well as as ARIA: `aria-current` is the promise
		// to a screen reader, and this is the same fact in a form a spec can read
		// without asserting on a gradient class.
		"data-active": isActive,
		"data-nav-href": item.href,
		onClick: (event: MouseEvent<HTMLAnchorElement>) => onNavigate?.(item, event),
		to: item.href,
	};

	if (!isCollapsed) {
		return (
			<Link
				className={className}
				{...linkProps}
			>
				{content}
			</Link>
		);
	}

	/*
	 * The rail's labels have to live somewhere reachable, and a rail of nine
	 * glyphs is a quiz without them.
	 *
	 * AppTooltip, not a hand-built Tooltip.Content: title over one sentence is
	 * exactly the shape it owns, and a second copy of that card here is the one
	 * that drifts - the rail was already a bolder line and a smaller one at 80%
	 * opacity while every other tooltip in the app had an icon and a muted
	 * description. The item's own glyph goes in it, so the card names the tile
	 * the arrow is pointing at.
	 *
	 * `render` makes the tooltip trigger BE the link rather than a div wrapped
	 * around one. HeroUI's trigger is a `role="button"` div carrying the focus
	 * and hover handlers: wrapping the anchor in it puts a button around a link
	 * and adds a second tab stop per rail item. Rendered this way there is one
	 * element, it is the anchor, and it opens the tooltip on focus as well as on
	 * hover - so the rail is usable from the keyboard. The name is still on the
	 * link itself (sr-only above), never only in the tooltip.
	 */
	return (
		<AppTooltip
			description={item.description}
			icon={item.icon}
			placement="right"
			title={item.title}
		>
			<AppTooltip.Trigger
				className={className}
				render={(props) => (
					<Link
						{...(props as LinkDOMProps)}
						{...linkProps}
					>
						{content}
					</Link>
				)}
				role="link"
			/>
		</AppTooltip>
	);
}

/**
 * What HeroUI hands a `render` function: DOM props typed for a `<div>`, because
 * that is the element the trigger would have rendered. They are plain
 * attributes and a ref, and they go onto an anchor here.
 */
type LinkDOMProps = Omit<ComponentProps<typeof Link>, "to">;
