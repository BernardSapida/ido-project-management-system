import { useAppUI } from "../../internal";
import type { MouseEvent } from "react";
import { useId } from "react";
import { AppLogo } from "../AppLogo";
import { cn } from "../../lib/cn";
import { SiteFooterLink } from "./SiteFooterLink";
import type {
	SiteFooterGroup,
	SiteFooterLink as SiteFooterLinkModel,
	SiteFooterLogo,
	SiteFooterTone,
	SiteSocialLink,
} from "./site-footer.types";
import { isSocialCustomLink } from "./site-footer.types";
import { SOCIAL_ICONS } from "./social-icons";

/**
 * The band itself. Two fills, and only the fill changes between them.
 *
 * `brand` and `surface` are the header's tokens under the header's names, so a
 * page can wear the same tone top and bottom. `surface` is the neutral card
 * closing the page; `brand` fills the least important band with the brand's own
 * dark surface, which is worth it only when the header does the same.
 */
const BAND: Record<SiteFooterTone, string> = {
	brand: "bg-brand-fill text-brand-fill-foreground",
	surface: "bg-card text-foreground",
};

/**
 * Every interactive item in the footer, minus its colour.
 *
 * The focus ring is an OUTLINE with an offset rather than a ring, because the
 * social row is a line of touching 44px circles: a ring drawn on the box edge
 * has a neighbour's box 4px away, and the offset is what keeps the focused one
 * legible as one target rather than as a seam between two.
 */
const ITEM_BASE = "rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";

export interface AppSiteFooterProps {
	className?: string;
	/**
	 * The line under the copyright's owner. Defaults to the phrase every footer
	 * on the web carries; pass your own for "Built with X." or a licence.
	 */
	copyrightNote?: string;
	"data-cy"?: string;
	/** Columns of links. Omit for the brand-and-social footer, which is the small-site shape. */
	groups?: SiteFooterGroup[];
	/** Where the logo goes. */
	homeHref?: string;
	/**
	 * Privacy, Terms, Cookies - the row beside the copyright.
	 *
	 * Separate from `groups` because they are not navigation: nobody arrives at a
	 * site meaning to read the cookie policy. They sit in the bottom row beside
	 * the copyright, which is where a reader who IS looking for them expects to
	 * find them and where everyone else can ignore them.
	 */
	legal?: SiteFooterLinkModel[];
	/** How the brand is drawn. Omit for the square mark plus a text wordmark. */
	logo?: SiteFooterLogo;
	/**
	 * Called on every column or legal link press, before navigation. The lab calls
	 * `event.preventDefault()` so a specimen cannot navigate the page out from
	 * under the reader.
	 *
	 * Social links are not routed through it: they always leave the site, and a
	 * new tab does not take the reader anywhere they were.
	 */
	onNavigate?: (link: SiteFooterLinkModel, event: MouseEvent<HTMLAnchorElement>) => void;
	/**
	 * Who holds the copyright. Defaults to `appName` from `AppUIProvider`.
	 *
	 * It is a separate prop because the two are genuinely different facts: the
	 * product is called Revolve and the copyright may belong to a company whose
	 * name is not that. Defaulting to the app name is right for the common case
	 * and wrong to hardcode.
	 */
	owner?: string;
	/** The icon-only links. Four is the usual maximum; the row does not wrap gracefully past six. */
	social?: SiteSocialLink[];
	/** Heads the social row. Pass `""` to drop it - the links keep their own accessible names. */
	socialLabel?: string;
	/** One line under the brand, for the sentence the site would say if asked what it is. */
	tagline?: string;
	/**
	 * What the band is MADE of.
	 *
	 * `surface` is the card - a neutral band closing the page, and the one most
	 * sites want: it marks the end of the document without claiming to be a
	 * statement. `brand` fills the band with the brand's own dark surface, which
	 * is worth it when the header does the same, and heavy-handed when it does not.
	 *
	 * **A dark band usually needs a light logo.** The component re-colours the
	 * text it renders and can do nothing about the pixels in an image, so a brand
	 * whose asset is dark ink needs `logo.brandSrc` pointed at a light variant -
	 * the same rule, and the same prop, as `AppSiteHeader`.
	 */
	tone?: SiteFooterTone;
	/**
	 * The copyright year. Defaults to the current one.
	 *
	 * Evaluated at render, which is what keeps it correct without anybody
	 * remembering to change it in January. The SSR/client pair can only disagree
	 * across the instant midnight passes between the two, and the cost of that is
	 * one hydration warning on one page view a year; pin the prop if a legal
	 * review wants a fixed year instead.
	 */
	year?: number;
}

/**
 * The public site footer: brand, social, links, copyright.
 *
 * ## The counterpart to `AppSiteHeader`, and packaged like one
 *
 * This started in `components/project/`, on the argument that a footer is mostly
 * the SITE saying who it is - its platforms, its copyright, its column names -
 * and so belongs to the project rather than to the template. That argument was
 * about the CONTENT, and every piece of it is already a prop. What is left when
 * the content is removed is the arrangement: three bands, one container
 * breakpoint, 44px social targets, the centring below `@2xl`. That is the same
 * kind of thing `AppSiteHeader` is, so it ships the same way.
 *
 * The pair matters more than either half. A project that installs the header and
 * hand-rolls its footer gets two bands that disagree about the logo object, the
 * tone names and the external-link rule - which is exactly the drift the package
 * exists to stop.
 *
 * A child project that needs it to BEHAVE differently wraps it in its own
 * `components/project/`, the way `AppFloatingThemeToggle` wraps `AppThemeToggle`.
 * It never edits it here.
 *
 * ## Three bands, and what decides which one an item goes in
 *
 * 1. **Identity** - the logo and the social row, at the two ends. These are the
 *    things that say WHO publishes the site.
 * 2. **Navigation** - the link columns, in their own band underneath.
 * 3. **Small print** - the copyright and the legal links, under a rule.
 *
 * The split is what stops the arrangement collapsing at a width. The common
 * shape puts the brand in the first cell of the column grid and the social row
 * under it, which means the social icons belong to a grid cell whose width is
 * decided by how long the words "Documentation" and "Changelog" happen to be -
 * and at the width where the grid drops to two columns, the brand ends up beside
 * a column of links with nothing marking it as different.
 *
 * ## Below the container's `@2xl`, everything centres
 *
 * Not "everything stacks and stays left". A stacked footer at 390px is three
 * short blocks in a column, and left-aligning them puts a 120px logo, a 100px
 * label and a 250px copyright against a shared left edge with nothing else on
 * those lines - which reads as a column of things that failed to fill their row.
 * Centred, the same three blocks read as one closing plate. This is the one
 * place `spacing.md`'s "centre only for short isolated things" is satisfied by
 * every element on the surface at once.
 *
 * ## What it decides for you
 *
 * - **A social link is icon-only, so `label` is required** and becomes its
 *   accessible name. There is no visible text to fall back to.
 * - **Every social target is 44px** even though the glyph is 24px. They are the
 *   smallest tap targets on the page and they sit in a row, which is the exact
 *   combination that produces a mis-tap.
 * - **External links get `rel="noreferrer"`, `target="_blank"` and "opens in a
 *   new tab"**, and internal ones stay in the SPA. See `SiteFooterLink`.
 * - **Nothing in the footer is STYLED for the current page**, which is why there
 *   is no `activeHref`. A footer is a list of places you can go, read at the end
 *   of a page you are already on; a lit item in it answers a question nobody
 *   asked and costs the row its evenness. `aria-current` still has to be
 *   truthful, and the router decides that one - see `SiteFooterLink`.
 *
 * The footer is not sticky and has no variant for it. A bar pinned to the bottom
 * of the viewport is a toolbar, and a toolbar holding a cookie policy is 56px of
 * every screen spent on the least urgent content the site has.
 */
export function AppSiteFooter({
	className,
	copyrightNote = "All rights reserved.",
	"data-cy": dataCy,
	groups = [],
	homeHref = "/",
	legal = [],
	logo,
	onNavigate,
	owner,
	social = [],
	socialLabel = "Connect with us!",
	tagline,
	tone = "surface",
	year,
}: AppSiteFooterProps) {
	const { appName } = useAppUI();
	const socialLabelId = useId();

	const isBrand = tone === "brand";
	/*
	 * The focus ring takes the PAIRED ink on the brand band. `--focus` is
	 * `--brand-primary` - the brand as ink, solved against a light page - so on
	 * the brand's own dark fill it is the one ring that lands dark-on-dark, and a
	 * focus ring is held to 3:1 like any other UI boundary.
	 */
	const item = cn(ITEM_BASE, isBrand ? "focus-visible:outline-brand-fill-foreground" : "focus-visible:outline-focus");
	const quiet = isBrand ? "text-brand-fill-foreground/70" : "text-text-secondary";
	const link = cn(
		item,
		isBrand
			? "text-brand-fill-foreground/70 hover:text-brand-fill-foreground"
			: "text-text-secondary hover:text-app-brand",
	);
	const divider = isBrand ? "border-brand-fill-foreground/20" : "border-border";

	return (
		<footer
			className={cn(
				/*
				 * A CONTAINER, not a viewport listener - the same call `AppSiteHeader`
				 * and `AppKpi` make. The footer rearranges off the width it was GIVEN,
				 * which in production is the viewport and in the lab is a 390px frame on
				 * a 1280px screen; a viewport breakpoint would render the desktop
				 * arrangement inside the phone frame and the specimen would prove
				 * nothing.
				 */
				"@container w-full border-t",
				BAND[tone],
				divider,
				className,
			)}
			data-cy={dataCy}
			data-tone={tone}
		>
			<div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 @2xl:gap-10 @2xl:py-12">
				<div className="flex flex-col items-center gap-8 text-center @2xl:flex-row @2xl:items-start @2xl:justify-between @2xl:gap-10 @2xl:text-left">
					<div className="flex min-w-0 flex-col items-center gap-3 @2xl:items-start">
						<AppLogo
							data-cy={dataCy ? `${dataCy}-logo` : undefined}
							href={homeHref}
							mark={logo?.mark}
							src={isBrand ? (logo?.brandSrc ?? logo?.src) : logo?.src}
							/*
							 * `onGradient` on the brand band, which is AppLogo's way of being
							 * told not to paint the wordmark itself: it drops `text-gradient`
							 * - an ink ramp solved against a light PAGE - and inherits the
							 * band's own foreground instead. A lockup ignores this, since its
							 * colours are in the file and `logo.brandSrc` is the only lever.
							 */
							tone={isBrand ? "onGradient" : "gradient"}
							wordmark={logo?.wordmark}
						/>
						{tagline ? (
							/* `max-w-sm`: the tagline is the only prose in the footer, and
							   prose past ~70 characters a line is measurably slower to read. */
							<p className={cn("max-w-sm text-sm leading-relaxed", quiet)}>{tagline}</p>
						) : null}
					</div>

					{social.length > 0 ? (
						<div className="flex flex-col items-center gap-2 @2xl:items-end">
							{socialLabel ? (
								<p
									className={cn("text-sm", quiet)}
									id={socialLabelId}
								>
									{socialLabel}
								</p>
							) : null}
							<ul
								aria-label={socialLabel ? undefined : "Social media"}
								aria-labelledby={socialLabel ? socialLabelId : undefined}
								/*
								 * `-mx-2.5` pulls the row's edges back by the padding inside the
								 * first and last 44px target, so the GLYPHS line up with the
								 * block above them rather than the invisible boxes around them.
								 * Symmetric, so it survives the row being centred below `@2xl`
								 * and right-aligned above it.
								 */
								className="-mx-2.5 flex items-center gap-1"
							>
								{social.map((entry) => {
									const Icon = isSocialCustomLink(entry) ? entry.icon : SOCIAL_ICONS[entry.platform];

									return (
										// `label`, not `href` - required on every social link and
										// the accessible name besides, where `href` is only usually
										// distinct per platform. See the group/legal fix below for
										// the case where it is not usually distinct at all.
										<li key={entry.label}>
											<a
												aria-label={entry.label}
												className={cn(
													link,
													/* 44px, for a 24px glyph. These are the smallest targets on the
													   page and they sit in a row - the exact combination that
													   produces a mis-tap. The circle is the hit area, not a button:
													   nothing is drawn around it at rest. */
													"flex size-11 items-center justify-center rounded-full",
													isBrand ? "hover:bg-brand-fill-foreground/15" : "hover:bg-foreground/5",
												)}
												data-cy={dataCy ? `${dataCy}-social` : undefined}
												href={entry.href}
												rel="noreferrer"
												target="_blank"
											>
												<Icon className="size-6" />
												<span className="sr-only">(opens in a new tab)</span>
											</a>
										</li>
									);
								})}
							</ul>
						</div>
					) : null}
				</div>

				{groups.length > 0 ? (
					<nav aria-label="Footer">
						{/*
						 * `auto-fit` with a MINIMUM, not a fixed column count. A fraction
						 * grid divides whatever width there is, so `grid-cols-4` in a
						 * narrow container gives 70px columns and one word per line; a
						 * column has a width below which it stops being readable, and under
						 * that the answer is fewer columns rather than thinner ones.
						 */}
						<ul className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-8 text-center @2xl:text-left">
							{groups.map((group) => (
								<li key={group.heading}>
									{/* Uppercase, tracked, and SMALLER than the links under it.
									    A heading that is merely bigger competes with the brand;
									    the case change is what separates it from the column
									    without adding weight to the band. */}
									<h2 className={cn("text-xs font-semibold uppercase tracking-widest", quiet)}>{group.heading}</h2>
									<ul className="mt-4 flex flex-col gap-3">
										{group.links.map((groupLink) => (
											// `label`, not `href` - a footer column's links are mostly
											// in-page anchors (see `SiteFooterLink.hash`'s doc), and
											// every one of those shares the SAME `href`. Keying off it
											// collided the moment a column had more than one hash link.
											<li key={groupLink.label}>
												<SiteFooterLink
													className={cn(link, "text-sm")}
													link={groupLink}
													onNavigate={onNavigate}
												/>
											</li>
										))}
									</ul>
								</li>
							))}
						</ul>
					</nav>
				) : null}

				<div
					className={cn(
						/*
						 * A lone copyright CENTRES, at every width. One short line pinned to
						 * the left edge of a 1152px band reads as the start of a sentence
						 * that never arrives - and with nothing at the other end there is no
						 * second object for it to be balanced against. It moves left only
						 * once the legal row gives it one.
						 */
						"flex flex-col items-center gap-3 border-t pt-6 text-center",
						divider,
						legal.length > 0 ? "@2xl:flex-row @2xl:justify-between @2xl:text-left" : "@2xl:justify-center",
					)}
				>
					<p className={cn("text-sm", quiet)}>
						{`© ${year ?? new Date().getFullYear()} ${owner ?? appName}. ${copyrightNote}`}
					</p>
					{legal.length > 0 ? (
						<nav aria-label="Legal">
							<ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
								{legal.map((legalLink) => (
									// `label`, not `href` - same reasoning as the group links above.
									<li key={legalLink.label}>
										<SiteFooterLink
											className={cn(link, "text-sm")}
											link={legalLink}
											onNavigate={onNavigate}
											/* No arrow here. Three of four legal links are external on
											   most sites, so the glyph stops distinguishing anything and
											   becomes a texture across the row. The sr-only text stays. */
											showExternalGlyph={false}
										/>
									</li>
								))}
							</ul>
						</nav>
					) : null}
				</div>
			</div>
		</footer>
	);
}
