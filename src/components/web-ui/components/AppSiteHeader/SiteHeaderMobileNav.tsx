import { Drawer } from "@heroui/react";
import type { MouseEvent } from "react";
import { AppButton } from "../AppButton";
import { AppLogo } from "../AppLogo";
import { cn } from "../../lib/cn";
import { SiteHeaderLink } from "./SiteHeaderLink";
import type { SiteHeaderAction, SiteHeaderLogo, SiteNavItem, SiteNavLink } from "./site-header.types";
import { isSiteNavMenu } from "./site-header.types";

interface SiteHeaderMobileNavProps {
	actions: SiteHeaderAction[];
	activeHref?: string;
	"data-cy"?: string;
	homeHref: string;
	isOpen: boolean;
	items: SiteNavItem[];
	logo?: SiteHeaderLogo;
	onNavigate?: (link: SiteNavLink, event: MouseEvent<HTMLAnchorElement>) => void;
	onOpenChange: (isOpen: boolean) => void;
}

/**
 * The whole header, on a phone.
 *
 * ## Everything expands in place
 *
 * A menu becomes a headed block of links, not a second panel you open. A drawer
 * that opens another drawer leaves the user two dismissals from the page they
 * were reading, and the first one is invisible behind the second. This is the
 * same rule `AppMobileDrawer` holds for the signed-in nav, for the same reason.
 *
 * ## The actions come with it
 *
 * Log in and Get started are the reason a marketing header exists, and they are
 * the first thing a `hidden md:flex` deletes on the screen where most of the
 * traffic is. They land at the FOOT of the sheet, full width, primary last -
 * the bottom of a phone is where the thumb already is, and the last row is the
 * easiest thing on the screen to hit.
 *
 * Built on HeroUI's Drawer for the focus trap, the scroll lock, Escape, the
 * backdrop tap and the return of focus to the hamburger - four things a
 * hand-rolled fixed overlay reliably ships without. Opaque rather than glass,
 * because it stands over live page content.
 */
export function SiteHeaderMobileNav({
	actions,
	activeHref,
	"data-cy": dataCy,
	homeHref,
	isOpen,
	items,
	logo,
	onNavigate,
	onOpenChange,
}: SiteHeaderMobileNavProps) {
	/* Every route out of here closes the sheet: a nav standing over the page it just navigated to asks to be dismissed twice. */
	const handleNavigate = (link: SiteNavLink, event: MouseEvent<HTMLAnchorElement>) => {
		onNavigate?.(link, event);
		onOpenChange(false);
	};

	return (
		<Drawer.Backdrop
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			{/* RIGHT, where the hamburger is. A sheet that flies in from the opposite edge of the button that opened it reads as a different surface. */}
			<Drawer.Content placement="right">
				<Drawer.Dialog
					className="flex h-full w-80 max-w-[85vw] flex-col bg-surface p-0"
					data-cy={dataCy}
				>
					<Drawer.CloseTrigger className="absolute end-3 top-3 z-10 rounded-full border border-border bg-background text-foreground shadow-soft" />

					{/*
					 * ALWAYS the light surface, whatever `tone` the bar is wearing.
					 *
					 * The band used to take the brand fill so that a light logo asset landed
					 * on the ground it was drawn for. That solved the asset and broke the
					 * sheet: this is a reading surface standing over live page content, and
					 * a brand-coloured band at the top of it makes the drawer look like a
					 * different component depending on a prop that describes the BAR.
					 *
					 * The asset is solved where it belongs instead - `logo.brandSrc` is the
					 * bar's, `logo.src` is this one's - so neither has to compromise.
					 */}
					<Drawer.Header className="border-b border-border p-4 pe-14">
						<Drawer.Heading className="sr-only">Site navigation</Drawer.Heading>
						<AppLogo
							href={homeHref}
							mark={logo?.mark}
							size="sm"
							src={logo?.src}
							wordmark={logo?.wordmark}
						/>
					</Drawer.Header>

					<Drawer.Body className="mt-0 flex-1 overflow-y-auto p-3">
						<nav aria-label="Site">
							<ul className="flex flex-col gap-0.5">
								{items.map((item) =>
									isSiteNavMenu(item) ? (
										<li
											className="pt-3 first:pt-0"
											key={item.label}
										>
											<p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">{item.label}</p>
											<ul className="flex flex-col gap-0.5">
												{item.groups
													.flatMap((group) => group.links)
													.map((link) => (
														// `label`, not `href` - see the same fix below.
														<li key={link.label}>
															<MobileRow
																activeHref={activeHref}
																link={link}
																onNavigate={handleNavigate}
															/>
														</li>
													))}
											</ul>
										</li>
									) : (
										/*
										 * `label`, not `href` - a marketing header's destinations
										 * are mostly its own in-page anchors (see `SiteNavLink.hash`'s
										 * doc), and every one of those items shares the SAME `href`.
										 * Keying off it collided the moment a page had more than one
										 * hash link, which is the common case rather than the
										 * exception.
										 */
										<li key={item.label}>
											<MobileRow
												activeHref={activeHref}
												link={item}
												onNavigate={handleNavigate}
											/>
										</li>
									),
								)}
							</ul>
						</nav>
					</Drawer.Body>

					{actions.length > 0 ? (
						/*
						 * The close is on the CONTAINER, not on each button. AppButton's link
						 * form takes no `onClick` - deliberately, so nobody hangs a second
						 * behaviour off a navigation - and a click on a link inside this box
						 * bubbles here, from a press and from Enter alike. Without it the
						 * sheet is still standing over the page it just sent the user to.
						 */
						<div
							className="flex flex-col gap-2 border-t border-border p-4"
							onClick={() => onOpenChange(false)}
						>
							{actions.map((action) => (
								<AppButton
									fullWidth
									key={action.to}
									to={action.to}
									variant={action.variant}
								>
									{action.label}
								</AppButton>
							))}
						</div>
					) : null}
				</Drawer.Dialog>
			</Drawer.Content>
		</Drawer.Backdrop>
	);
}

/* -------------------------------------------------------------------------- */

function MobileRow({
	activeHref,
	link,
	onNavigate,
}: {
	activeHref?: string;
	link: SiteNavLink;
	onNavigate: (link: SiteNavLink, event: MouseEvent<HTMLAnchorElement>) => void;
}) {
	const isCurrent = !link.isExternal && link.href === activeHref;

	return (
		<SiteHeaderLink
			className={cn(
				/* min-h-11: a row in a sheet is a thumb target, not a line of text. */
				"flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
				"hover:bg-muted-surface focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none",
				/* Brand and semibold, the same as the bar and the panel. See the note in SiteHeaderMenu. */
				isCurrent ? "bg-app-brand/10 font-semibold text-app-brand" : "font-medium",
			)}
			isActive={isCurrent}
			link={link}
			onNavigate={onNavigate}
		>
			{link.icon ? (
				<link.icon
					aria-hidden="true"
					className={cn("size-4 shrink-0", isCurrent ? "text-app-brand" : "text-muted")}
				/>
			) : null}
			<span className="min-w-0 flex-1 truncate">{link.label}</span>
		</SiteHeaderLink>
	);
}
