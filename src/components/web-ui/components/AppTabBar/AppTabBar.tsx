import { Drawer } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";
import type { NavItem } from "../../lib/nav";
import { isNavItemActive, splitForTabBar } from "../../lib/nav";
import { cn } from "../../lib/cn";

interface AppTabBarProps {
	/** The current pathname; every tab's active state is derived from it. */
	activeHref: string;
	badges?: Record<string, number>;
	/**
	 * Positioning, supplied by the caller: the shell pins it to the viewport,
	 * the component lab pins it inside a phone frame. Everything else about the
	 * bar - height, safe area, the row of tabs - lives here.
	 */
	className?: string;
	/**
	 * Test hook on the `<nav>`. The More button and the sheet it opens derive
	 * theirs from it - `-more` and `-more-sheet` - because the sheet renders in
	 * a portal, outside the bar's own subtree.
	 */
	"data-cy"?: string;
	/**
	 * The landmark's name. Leave it alone in the app - "Main" is the one main
	 * nav. The component lab overrides it because it puts three specimens on
	 * one page.
	 */
	navLabel?: string;
	navigation: NavItem[];
	onNavigate?: (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * The mobile navigation: a bar of tabs at the BOTTOM of the screen.
 *
 * Bottom, not top, because the top of a phone is the part the thumb cannot
 * reach. It never hides on scroll either - it is the only way out of the
 * screen, and a nav that disappears while you read has to be summoned back by
 * scrolling the wrong way.
 *
 * Five slots, and the fifth becomes "More" the moment a role has more than five
 * destinations (splitForTabBar). Not a sixth tab and not a bar that scrolls
 * sideways: a bar has to be parsed in under a second, and a destination you
 * have to scroll to find is not a top-level destination.
 *
 * Labels sit under the icons at every width. An icon-only bar is a quiz, and
 * the two pixels it saves cost every first-time user a tap to find out what a
 * glyph meant.
 */
export function AppTabBar({
	activeHref,
	badges,
	className,
	"data-cy": dataCy,
	navLabel = "Main",
	navigation,
	onNavigate,
}: AppTabBarProps) {
	const [isMoreOpen, setIsMoreOpen] = useState(false);
	const { overflow, tabs } = splitForTabBar(navigation);
	// The More tab is lit when the page you are on lives inside it. Otherwise a
	// user who navigated from the sheet is on a screen with nothing lit at all.
	const isMoreActive = overflow.some((item) => isNavItemActive(item, activeHref));

	return (
		<>
			<nav
				aria-label={navLabel}
				className={cn(
					// The bar sits above the safe area rather than under the home
					// indicator. The scroll container's matching bottom padding is the
					// frame's job - see AppMain's `hasBottomBar`.
					"border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-soft",
					className,
				)}
				data-cy={dataCy}
			>
				<ul className="flex items-stretch">
					{tabs.map((item) => (
						<TabSlot
							activeHref={activeHref}
							badge={badges?.[item.href]}
							item={item}
							key={item.href}
							onNavigate={onNavigate}
						/>
					))}

					{overflow.length > 0 ? (
						<li className="flex-1">
							<button
								aria-expanded={isMoreOpen}
								aria-haspopup="dialog"
								className={cn(
									"flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 px-1 py-2 transition",
									"focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset focus-visible:outline-none",
									isMoreActive ? "text-primary" : "text-foreground/70",
								)}
								data-active={isMoreActive}
								data-cy={dataCy ? `${dataCy}-more` : undefined}
								onClick={() => setIsMoreOpen(true)}
								type="button"
							>
								{/* No pill here either - see TabSlot. */}
								<span className="grid place-items-center">
									<MoreHorizontal
										aria-hidden="true"
										className="size-5"
									/>
								</span>
								<span className={cn("text-[11px] leading-none", isMoreActive ? "font-semibold" : "font-medium")}>
									More
								</span>
							</button>
						</li>
					) : null}
				</ul>
			</nav>

			{overflow.length > 0 ? (
				<AppMoreSheet
					activeHref={activeHref}
					badges={badges}
					data-cy={dataCy ? `${dataCy}-more-sheet` : undefined}
					isOpen={isMoreOpen}
					items={overflow}
					onNavigate={onNavigate}
					onOpenChange={setIsMoreOpen}
				/>
			) : null}
		</>
	);
}

interface TabSlotProps {
	activeHref: string;
	badge?: number;
	item: NavItem;
	onNavigate?: (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void;
}

function TabSlot({ activeHref, badge, item, onNavigate }: TabSlotProps) {
	const isActive = isNavItemActive(item, activeHref);

	return (
		<li
			className="flex-1"
			data-nav-item={item.href}
		>
			<Link
				aria-current={isActive ? "page" : undefined}
				className={cn(
					// min-h-14 with the label under the glyph clears 44px comfortably,
					// and the whole slot is the target rather than the icon inside it.
					"flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 py-2 transition",
					"focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset focus-visible:outline-none",
					isActive ? "text-primary" : "text-foreground/70",
				)}
				data-active={isActive}
				data-nav-href={item.href}
				onClick={(event) => onNavigate?.(item, event)}
				to={item.href}
			>
				{/*
				 * The active tab is a COLOURED GLYPH, not a filled pill.
				 *
				 * It used to be the same gradient pill the active sidebar item and the
				 * active page number wear, sized to a bar. That works in a sidebar,
				 * where the pill is one lit row in a column of quiet ones. In a 5-up
				 * bar pinned over the content it does not: the pill is a filled,
				 * glowing 56x32 block sitting under the thumb on every screen, which
				 * makes the loudest thing in the viewport a label for where you already
				 * are - the one fact on screen the user does not need told. Brand hue
				 * plus the semibold label says the same thing at a fraction of the
				 * weight, and hands the emphasis back to the content above it.
				 *
				 * Colour is not carrying this alone (SC 1.4.1): the label goes semibold
				 * with it, and `aria-current="page"` is what a screen reader gets.
				 */}
				<span className="relative grid place-items-center">
					<item.icon
						aria-hidden="true"
						className="size-5"
					/>
					{/* Decorative: the count joins the tab's accessible name below,
					    rather than being a live region that re-announces on every
					    render. Offsets are off the GLYPH now - against the old pill it
					    sat on a 56px edge, which with the pill gone would have left it
					    floating in space well clear of the icon. */}
					{badge ? (
						<span
							aria-hidden="true"
							className="absolute -top-1 -right-1.5 size-2 rounded-full bg-primary ring-2 ring-surface"
						/>
					) : null}
				</span>
				{/* Always a label. At every width, in every state. */}
				<span
					className={cn("max-w-full truncate text-[11px] leading-none", isActive ? "font-semibold" : "font-medium")}
				>
					{item.title}
				</span>
			</Link>
		</li>
	);
}

interface AppMoreSheetProps {
	activeHref: string;
	badges?: Record<string, number>;
	"data-cy"?: string;
	isOpen: boolean;
	items: NavItem[];
	onNavigate?: (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void;
	onOpenChange: (isOpen: boolean) => void;
}

/**
 * What the fifth tab opens: the destinations that did not fit, as a bottom
 * sheet.
 *
 * A sheet rather than a menu because it comes off the bar it was opened from,
 * and each row gets its subtitle - these are the items a user has seen least,
 * so this is the one place in the nav where the description earns its space.
 *
 * HeroUI's Drawer brings the focus trap, the scroll lock, Escape and focus
 * restore. Reaching for a hand-rolled fixed overlay here is how a nav ends up
 * with none of the four.
 */
function AppMoreSheet({
	activeHref,
	badges,
	"data-cy": dataCy,
	isOpen,
	items,
	onNavigate,
	onOpenChange,
}: AppMoreSheetProps) {
	return (
		<Drawer.Backdrop
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			<Drawer.Content placement="bottom">
				<Drawer.Dialog
					className="max-h-[80dvh] rounded-t-3xl bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
					data-cy={dataCy}
				>
					<Drawer.Handle />
					<Drawer.Header className="p-0">
						<Drawer.Heading className="px-2 py-2 text-base font-semibold">More</Drawer.Heading>
					</Drawer.Header>
					<Drawer.Body className="overflow-y-auto p-0">
						<nav aria-label="More destinations">
							<ul className="flex flex-col gap-1">
								{items.map((item) => (
									<MoreRow
										activeHref={activeHref}
										badge={badges?.[item.href]}
										item={item}
										key={item.href}
										onNavigate={(navItem, event) => {
											onNavigate?.(navItem, event);
											onOpenChange(false);
										}}
									/>
								))}
							</ul>
						</nav>
					</Drawer.Body>
				</Drawer.Dialog>
			</Drawer.Content>
		</Drawer.Backdrop>
	);
}

function MoreRow({ activeHref, badge, item, onNavigate }: TabSlotProps) {
	const isActive = isNavItemActive(item, activeHref);

	return (
		<li data-nav-item={item.href}>
			<Link
				aria-current={isActive ? "page" : undefined}
				className={cn(
					"flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 transition",
					"focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:outline-none",
					isActive ? "gradient-brand shadow-glow" : "text-foreground hover:bg-muted-surface",
				)}
				data-active={isActive}
				data-nav-href={item.href}
				onClick={(event) => onNavigate?.(item, event)}
				to={item.href}
			>
				<item.icon
					aria-hidden="true"
					className="size-5 shrink-0"
				/>
				<span className="min-w-0 flex-1">
					<span className={cn("block truncate text-sm", isActive ? "font-semibold" : "font-medium")}>{item.title}</span>
					<span className={cn("block truncate text-xs", isActive ? "opacity-80" : "text-muted")}>
						{item.subtitle ?? item.description}
					</span>
				</span>
				{badge ? (
					<span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
						{badge > 99 ? "99+" : badge}
					</span>
				) : null}
			</Link>
		</li>
	);
}
