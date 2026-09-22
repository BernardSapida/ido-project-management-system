import type { SiteHeaderLogo } from "../AppSiteHeader/site-header.types";
import type { ComponentType } from "react";

/**
 * How the brand is drawn in the footer, forwarded to `AppLogo`.
 *
 * The same set as the header's, and an alias rather than a copy because it is
 * the same question asked of the same component: the footer does not read any of
 * these, it hands the object on. Two identical interfaces under two names is how
 * a caller ends up believing the footer takes a different logo from the header
 * and passing it a second object that has drifted from the first.
 *
 * It is a type from the PACKAGE, which is the right direction of dependency: a
 * Project Component may build on the Component Labs, and nothing in the package
 * may ever reach back in here. It gets its own name so a footer-only option - if
 * one ever earns its place - can be added here without a package release.
 */
export type SiteFooterLogo = SiteHeaderLogo;

/** One destination in a footer column, or in the legal row. */
export interface SiteFooterLink {
	/**
	 * A section within `href`, for a marketing page whose "destinations" are
	 * mostly its own anchors.
	 *
	 * It travels through the router rather than being a raw `<a href="#">`, which
	 * is what makes the item work from the other pages of the site too - a bare
	 * fragment on `/pricing` scrolls nowhere and quietly does nothing. Same rule,
	 * and the same reason, as the header's.
	 */
	hash?: string;
	href: string;
	/** Opens in a new tab, and says so to a screen reader. */
	isExternal?: boolean;
	label: string;
}

/**
 * A column of links under a heading.
 *
 * The heading is REQUIRED. A column of links with nothing at the top of it is
 * indistinguishable from the column beside it - the whole reason a footer splits
 * its links into columns is that "Pricing" and "Status" answer different
 * questions, and only the heading says which.
 */
export interface SiteFooterGroup {
	heading: string;
	links: SiteFooterLink[];
}

/** Anything that renders a glyph from a `className` - every Lucide icon qualifies. */
export type SocialIcon = ComponentType<{ className?: string }>;

/** The platforms this package ships a glyph for. */
export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "tiktok";

interface SiteSocialLinkBase {
	href: string;
	/**
	 * REQUIRED, because the link renders as a glyph and nothing else.
	 *
	 * It is the accessible name - "Facebook", "Revolve on TikTok" - and there is
	 * no visible text for a screen reader to fall back to. An optional label here
	 * would mean an icon-only link announced as "link" whenever a caller left it
	 * out, which is the single most common footer accessibility defect.
	 */
	label: string;
}

/** A platform this package draws itself. */
export interface SiteSocialPlatformLink extends SiteSocialLinkBase {
	platform: SocialPlatform;
}

/** Any other platform - the caller brings the glyph. */
export interface SiteSocialCustomLink extends SiteSocialLinkBase {
	icon: SocialIcon;
}

/**
 * A union rather than two optional fields, so that "neither was supplied" cannot
 * be written down. With `platform?` and `icon?` both optional, a link missing
 * both type-checks and renders an empty 44px hole in the row - a defect nothing
 * catches until somebody looks at the footer on a phone.
 */
export type SiteSocialLink = SiteSocialCustomLink | SiteSocialPlatformLink;

export function isSocialCustomLink(link: SiteSocialLink): link is SiteSocialCustomLink {
	return "icon" in link;
}

/**
 * What the footer band is MADE of - see the prop doc on `AppSiteFooter`.
 *
 * `brand` and `surface` are the header's two, under the same names and pointing
 * at the same tokens, because a page whose header is the brand and whose footer
 * is a card does not read as one site. The footer carries no third tone: the
 * last band closes the page either as the neutral card or as the brand's own
 * fill, and nothing in between.
 */
export type SiteFooterTone = "brand" | "surface";
