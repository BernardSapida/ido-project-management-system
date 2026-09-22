import { Drawer } from "@heroui/react";
import type { MouseEvent } from "react";
import { useId } from "react";
import { useAppLayout } from "../AppLayout/app-layout.context";
import type { LogoMark } from "../AppLogo";
import { AppLogo } from "../AppLogo";
import { AppNavList } from "../AppNavList";
import { AppSidebarUserCard } from "../AppSidebarUserCard";
import type { NavGroup, NavItem } from "../../lib/nav";
import { groupNavItems } from "../../lib/nav";

interface AppMobileDrawerProps {
	activeHref: string;
	/** Test hook on the dialog - which is in a PORTAL, not under the caller. */
	"data-cy"?: string;
	/**
	 * Open state. OPTIONAL, and left unset inside `AppLayout`: the drawer is a
	 * slot there, so the caller building it sits outside the provider and cannot
	 * read the state the trigger is changing. It falls back to context, the same
	 * way `AppHeader` and `AppSidebar` do.
	 *
	 * The labs pass it explicitly, and a prop always wins - which is what lets the
	 * component be driven with no frame above it.
	 */
	isOpen?: boolean;
	/**
	 * The PRIMARY destinations, and the prop that decides which of the two
	 * drawers below this is.
	 *
	 * Leave it unset wherever a tab bar is on screen and this stays the account
	 * drawer it was written as. Set it in a layout that has no tab bar - which is
	 * every frame in the app now: the App Layout family is a hamburger and a
	 * drawer, not a bottom bar - and the drawer becomes the sidebar off-canvas,
	 * carrying the destinations above the account block.
	 *
	 * The two must never BOTH be true on one screen. Primary destinations in a
	 * drawer while the same destinations sit in a tab bar is the same nav twice,
	 * and the hidden copy is the one that gets stale.
	 */
	navigation?: NavItem[];
	/**
	 * Called instead of navigating when an ACCOUNT row in the user menu is
	 * chosen - nav mode only, where those rows live in the menu rather than in a
	 * list. Menu rows are actions rather than links, so there is no anchor and no
	 * event to `preventDefault`; see the same prop on `AppSidebar`.
	 */
	onAccountSelect?: (item: NavItem) => void;
	/**
	 * Off leaves the MARK alone at the head of the drawer - no app name, no role
	 * label. Same meaning, and the same reasons, as `AppSidebar`'s prop of this
	 * name: this drawer IS that column on a phone, and a brand that has decided
	 * its name does not belong in the corner has not decided it only below `md`.
	 * Pass the two the same value.
	 */
	hasWordmark?: boolean;
	/**
	 * What the brand image IS - `square` for an icon, `lockup` for a wide image
	 * that already contains the name. Same meaning, and the same consequence for
	 * getting it wrong, as `AppSidebar`'s prop of this name. Pass the two the
	 * same value.
	 */
	logoMark?: LogoMark;
	onLogout: () => void;
	onNavigate?: (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void;
	onOpenChange?: (isOpen: boolean) => void;
	roleLabel: string;
	/** Account and settings - the things that are not destinations. */
	secondaryNavigation: NavItem[];
	user: { email: string; name: string };
}

/**
 * The mobile drawer. One component, two jobs, and `navigation` is the switch.
 *
 * **Without `navigation` - the account drawer.** SECONDARY things only: account,
 * notifications, settings, sign out. Those are the things people already know
 * they want and go looking for, which is the only kind of thing that survives
 * being hidden. Every primary destination is in the tab bar, one thumb away.
 * This is the original shape of the component and it has no caller left in the
 * app - `AppTabBar` lost its last one when the signed-in frame moved to
 * `AppLayout`. The mode stays because the rule it encodes is the reason the
 * other mode is allowed to exist at all; the drawer lab is what exercises it.
 *
 * **With `navigation` - the sidebar, off-canvas.** The App Layout family has no
 * tab bar (this is web: a hamburger and a drawer, not a bottom bar), so on a
 * phone there is no other surface for the destinations to live on and the
 * "secondary only" rule above has nothing left to protect. They go in, above the
 * account block, grouped under the same section headings the sidebar draws.
 *
 * Which side it arrives from follows from that, rather than being a prop:
 *
 * - Account drawer → **RIGHT**, where its hamburger is.
 * - Nav drawer → **LEFT**, because it is the sidebar. Left is navigation's edge
 *   (the rule `AppDrawer` already states), and a nav that slides in from the
 *   opposite side to the column it replaces is a different object arriving, not
 *   the same one returning.
 *
 * Built on HeroUI's Drawer for the focus trap, the scroll lock, Escape, the
 * backdrop tap and focus restore to the button that opened it - four things a
 * hand-rolled fixed overlay reliably ships without.
 *
 * OPAQUE (`bg-surface`) rather than glass in both modes: it sits over live page
 * content, where frosting reads as a rendering fault.
 */
export function AppMobileDrawer({
	activeHref,
	"data-cy": dataCy,
	hasWordmark = true,
	isOpen: isOpenProp,
	logoMark = "square",
	navigation,
	onAccountSelect,
	onLogout,
	onNavigate,
	onOpenChange: onOpenChangeProp,
	roleLabel,
	secondaryNavigation,
	user,
}: AppMobileDrawerProps) {
	const headingId = useId();
	const layout = useAppLayout();
	const isOpen = isOpenProp ?? layout?.isDrawerOpen ?? false;
	const onOpenChange = onOpenChangeProp ?? layout?.setDrawerOpen ?? (() => undefined);

	// Present and non-empty. An empty array is a caller whose role filter matched
	// nothing, and it must not turn this into a nav drawer with no nav in it.
	const isNavDrawer = (navigation?.length ?? 0) > 0;
	const groups: NavGroup[] = isNavDrawer ? groupNavItems(navigation ?? []) : [];

	// One handler for both lists: navigate, then close. A drawer left open behind
	// the page it just moved to is the commonest bug in this component's shape.
	const onItemPress = (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => {
		onNavigate?.(item, event);
		onOpenChange(false);
	};

	return (
		<Drawer.Backdrop
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			<Drawer.Content placement={isNavDrawer ? "left" : "right"}>
				<Drawer.Dialog
					className="flex h-full w-72 flex-col bg-surface p-4"
					data-cy={dataCy}
					data-mode={isNavDrawer ? "navigation" : "account"}
				>
					{/* The default close trigger is a low-contrast ghost circle, which is
					    invisible on this surface. Give it a real border and background. */}
					<Drawer.CloseTrigger className="absolute top-3 right-3 z-10 rounded-full border border-border bg-background text-foreground shadow-soft" />

					<Drawer.Header className="p-0">
						<Drawer.Heading className="sr-only">{isNavDrawer ? "Navigation" : "Account and settings"}</Drawer.Heading>
						<AppLogo
							className="px-2 py-4"
							data-cy={dataCy ? `${dataCy}-logo` : undefined}
							mark={logoMark}
							/* Dropped with the name it captions - see `hasWordmark`. A lockup
							   suppresses the text wordmark inside AppLogo anyway, and this
							   caption would be left hanging under an image. */
							roleLabel={hasWordmark && logoMark !== "lockup" ? roleLabel : undefined}
							/* A lockup is wide, so it takes the largest step - see the same
							   decision in AppSidebar. */
							size={logoMark === "lockup" ? "lg" : "md"}
							wordmark={hasWordmark}
						/>
					</Drawer.Header>

					<Drawer.Body className="flex flex-1 flex-col gap-0 p-0">
						{/*
						 * The destinations, when this is the nav drawer. Its own landmark,
						 * separate from the account one below, and grouped under the same
						 * headings the sidebar draws - a drawer that flattens the groups is
						 * a different menu wearing the same items, and the grouping is what
						 * the eye learned on the desktop.
						 */}
						{isNavDrawer ? (
							<nav
								aria-label="Main"
								className="min-h-0 flex-1 overflow-y-auto"
								data-cy={dataCy ? `${dataCy}-primary` : undefined}
							>
								<div className="flex flex-col gap-4">
									{groups.map((group, index) => (
										<div
											data-nav-section={group.label ?? ""}
											key={group.label ?? "__ungrouped__"}
										>
											{group.label ? (
												<p
													className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted uppercase"
													id={`${headingId}-group-${index}`}
												>
													{group.label}
												</p>
											) : null}
											<AppNavList
												activeHref={activeHref}
												aria-labelledby={group.label ? `${headingId}-group-${index}` : undefined}
												items={group.items}
												onNavigate={onItemPress}
											/>
										</div>
									))}
								</div>
							</nav>
						) : null}

						{/*
						 * Only in ACCOUNT mode. There the secondary items are the drawer's
						 * whole content, so they stay a list - folding them into the card's
						 * menu would leave a drawer holding one avatar.
						 *
						 * In nav mode they go into that menu instead, exactly as they do in
						 * the sidebar this drawer is standing in for: the destinations own
						 * the panel, and the account rows are a menu press away.
						 */}
						{isNavDrawer ? null : (
							<nav
								aria-label="Account and settings"
								className="flex-1 overflow-y-auto"
							>
								<AppNavList
									activeHref={activeHref}
									data-cy={dataCy ? `${dataCy}-nav` : undefined}
									items={secondaryNavigation}
									onNavigate={onItemPress}
								/>
							</nav>
						)}
						<AppSidebarUserCard
							data-cy={dataCy ? `${dataCy}-user` : undefined}
							menuItems={isNavDrawer ? secondaryNavigation : undefined}
							onLogout={onLogout}
							onSelect={onAccountSelect}
							user={user}
						/>
					</Drawer.Body>
				</Drawer.Dialog>
			</Drawer.Content>
		</Drawer.Backdrop>
	);
}
