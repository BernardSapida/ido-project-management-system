import type { LucideIcon } from "lucide-react";

/** One destination in the public header. */
export interface SiteNavLink {
	/**
	 * One line under the label, in the panel and the mobile sheet only. The bar
	 * itself never shows it - a row of descriptions is a paragraph, not a nav.
	 */
	description?: string;
	/**
	 * A section within `href`, for a marketing page whose "destinations" are
	 * mostly its own anchors.
	 *
	 * It goes through the router as a hash rather than being a raw `<a href="#">`,
	 * which is what makes the item work from the OTHER pages of the site too - a
	 * bare fragment on `/pricing` scrolls nowhere and quietly does nothing. The
	 * item then lights only once the hash matches, not merely because you are on
	 * the page that holds the section.
	 */
	hash?: string;
	href: string;
	/**
	 * REQUIRED, and drawn in the panel and the sheet but never on the bar.
	 *
	 * Required rather than optional because the sheet renders these as a LIST, and
	 * a list where most rows carry a glyph and one does not reads as a broken row
	 * rather than as a row without an icon: the labels no longer share a left edge,
	 * so the odd one out looks misaligned before anybody notices what is missing.
	 * Optional was the honest signature for a bar-only item and the wrong one for
	 * the surface that actually draws it - every bar item becomes a sheet row below
	 * `@3xl`, so there is no such thing as an item that never needs one.
	 *
	 * The bar still shows no icons at all. That is not an inconsistency: a row of
	 * glyphs across a horizontal bar is decoration competing with the wordmark and
	 * the primary action, and the bar has room for neither.
	 */
	icon: LucideIcon;
	/** Opens in a new tab, and says so to a screen reader. */
	isExternal?: boolean;
	label: string;
}

/** A column of links inside a menu panel. */
export interface SiteNavGroup {
	/** Heads the column. Omit for a single ungrouped column. */
	label?: string;
	links: SiteNavLink[];
}

/** A label on the bar that opens a panel of links. */
export interface SiteNavMenu {
	groups: SiteNavGroup[];
	label: string;
}

export type SiteNavItem = SiteNavLink | SiteNavMenu;

/**
 * What the bar is MADE of - see the prop doc on `AppSiteHeader`.
 *
 * It lives here rather than beside the component because the sheet needs it too,
 * and importing it from `AppSiteHeader.tsx` - which imports the sheet - would put
 * a cycle between the two files for a string union.
 */
export type SiteHeaderTone = "brand" | "surface";

/**
 * How the brand is drawn, forwarded to `AppLogo` on the bar AND in the sheet.
 *
 * One object rather than three flat props, because these travel together and
 * always to the same place: the header does not read any of them, it hands the
 * set on. Adding `logoMark`, `logoSrc` and `logoWordmark` beside `homeHref` grows
 * the component's surface by one prop every time `AppLogo` grows by one, and none
 * of them mean anything at this level.
 */
export interface SiteHeaderLogo {
	/** `lockup` for a brand image that already contains its own name. */
	mark?: "lockup" | "square";
	/**
	 * The asset for the BRAND bar only. Falls back to `src`.
	 *
	 * Two assets rather than one because the two grounds are different and always
	 * will be: the bar on `tone="brand"` is the brand fill, and the mobile sheet's
	 * header is a light reading surface whatever the bar is doing. A single `src`
	 * has to be wrong on one of them - a lockup light enough for the brand bar is
	 * invisible on the sheet, and a dark one is invisible on the bar. An `<img>` is
	 * a replaced element, so nothing on the page can recolour it either way.
	 */
	brandSrc?: string;
	/** The default asset, for every light ground: the sheet, and the bar on `tone="surface"`. */
	src?: string;
	/** Off renders the mark alone. Ignored by `mark="lockup"`, which has the name in it. */
	wordmark?: boolean;
}

/** A right-hand action - Log in, Get started. */
export interface SiteHeaderAction {
	label: string;
	/** Internal route. An action that leaves the site is a link, not an action. */
	to: string;
	variant?: "ghost" | "primary" | "secondary" | "tertiary";
}

export function isSiteNavMenu(item: SiteNavItem): item is SiteNavMenu {
	return "groups" in item;
}

/**
 * Whether a bar item is the page you are on.
 *
 * A menu is lit when ANY link inside it is, which is the whole reason this is a
 * function rather than an `isActive` flag on the item: a docs menu holding six
 * pages has to stay lit on all six, and a caller who has to work that out
 * themselves will get it right for the first five.
 *
 * Exact match, unlike the app's own `isNavItemActive`, which matches by prefix.
 * The app nav is a set of sections you go INTO; a marketing header is a set of
 * pages you go TO, and a prefix match there lights "Product" on every URL that
 * happens to start with the same word.
 *
 * An item with a `hash` is never decided here. A section cannot be resolved from
 * a pathname, and answering from the pathname alone lights "Features" the moment
 * you land on the page it is a section of - beside a "Home" item pointing at the
 * same page, that is two current pages at once. The ROUTER decides that one:
 * `SiteHeaderLink` passes `includeHash`, and the link's own active state carries
 * the same styling and `aria-current`.
 */
export function isSiteNavItemActive(item: SiteNavItem, activeHref?: string): boolean {
	if (!activeHref) return false;

	if (isSiteNavMenu(item)) {
		return item.groups.some((group) => group.links.some((link) => isSiteNavLinkActive(link, activeHref)));
	}

	return isSiteNavLinkActive(item, activeHref);
}

function isSiteNavLinkActive(link: SiteNavLink, activeHref: string): boolean {
	return !link.isExternal && !link.hash && link.href === activeHref;
}
