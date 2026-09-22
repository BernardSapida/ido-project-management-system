import { useIsScrolled } from "../../internal";
import { Menu } from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";
import { AppButton } from "../AppButton";
import { AppLogo } from "../AppLogo";
import { cn } from "../../lib/cn";
import { SiteHeaderLink } from "./SiteHeaderLink";
import { SiteHeaderMenu } from "./SiteHeaderMenu";
import { SiteHeaderMobileNav } from "./SiteHeaderMobileNav";
import type { SiteHeaderAction, SiteHeaderLogo, SiteHeaderTone, SiteNavItem, SiteNavLink } from "./site-header.types";
import { isSiteNavItemActive, isSiteNavMenu } from "./site-header.types";

/**
 * The bar's own item styling, shared by the links and the menu triggers so a
 * menu label never sits a pixel off its neighbours.
 *
 * The current section is the BRAND colour and semibold - two channels, and the
 * heavier one is the weight. A tint of the brand at 10% reads as "slightly
 * different grey" against `text-secondary` and fails contrast outright; the
 * full brand token is the only value on this surface that is both obviously
 * different and legible.
 */
const BAR_ITEM_BASE =
	"flex items-center rounded-lg py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none";

const BAR_ITEM_SURFACE =
	"px-1 text-text-secondary hover:text-app-brand data-[active]:font-semibold data-[active]:text-app-brand aria-[current=page]:font-semibold aria-[current=page]:text-app-brand";

/**
 * The same two channels - colour and weight - inverted for the brand bar.
 *
 * On the surface tone the current item is `--brand-primary`, which works because
 * the bar is a near-white card and the brand is the one saturated thing on it.
 * On the brand tone that colour IS the bar, so lighting the current item with it
 * makes the current item the only invisible one. The pairing has to swap.
 *
 * It swaps by BRIGHTNESS, not by fill. The current item is the paired ink at full
 * strength - the value the bar was solved against - and the rest sit at 70% of it,
 * so the bar reads as one band with one item lit rather than as a band with a
 * white pill stamped on it. A pill is a second shape on a surface whose whole job
 * is to be a single uninterrupted one, and at the size of a nav label it is the
 * loudest object on the header, louder than the primary action beside it.
 *
 * **The dim is only as safe as the palette's own headroom.** 70% is a fixed mix
 * toward the fill, and what it costs depends on how far apart the pair started:
 * on a deep brand (revolve, 13.56:1) the rest items still measure 7.41:1, and on
 * the two supplied palettes that sit ON the AA line to begin with (discord 4.61,
 * netflix 4.79) they land near 3:1 and no longer clear it. The durable fix is a
 * SOLVED muted ink - a `--gradient-brand-foreground-muted` searched per palette
 * for the dimmest value still clearing 4.5:1, which would degrade to "barely
 * dimmed at all" exactly where there is no room - not a different constant here,
 * because every constant fails those two and only the strength of the effect
 * changes.
 *
 * Hover restores the full ink and adds the 15% tint: it is a transient affordance
 * carrying no information of its own, so nothing a reader has to make out rests on
 * the mix, and taking hover to full means it can never fight the active item for
 * ordering with `data-[active]`.
 */
const BAR_ITEM_BRAND =
	"px-3 text-brand-fill-foreground/70 hover:bg-brand-fill-foreground/15 hover:text-brand-fill-foreground data-[active]:font-semibold data-[active]:text-brand-fill-foreground aria-[current=page]:font-semibold aria-[current=page]:text-brand-fill-foreground";

export interface AppSiteHeaderProps {
	/** Log in, Get started. Rendered on the bar from `sm` up, and at the foot of the sheet below it. */
	actions?: SiteHeaderAction[];
	/** The current pathname. Active state is DERIVED from it - the header is told where the user is. */
	activeHref?: string;
	className?: string;
	"data-cy"?: string;
	/** Where the logo goes. */
	homeHref?: string;
	items: SiteNavItem[];
	/** How the brand is drawn. Omit for the square mark plus a text wordmark. */
	logo?: SiteHeaderLogo;
	/**
	 * Called on every destination press, before navigation. The sheet closes
	 * itself with it; the lab calls `event.preventDefault()` so a specimen cannot
	 * navigate the page out from under the reader.
	 */
	onNavigate?: (link: SiteNavLink, event: MouseEvent<HTMLAnchorElement>) => void;
	/**
	 * What the bar is MADE of, which is a separate question from where it sits.
	 *
	 * `surface` is the card: the bar is a neutral object and the brand appears on
	 * it only as the active item and the primary button. `brand` fills the bar
	 * with the brand's own dark surface, so the header reads as a band of the
	 * brand rather than as a container for it.
	 *
	 * It composes with `variant` rather than replacing it - a brand bar can be an
	 * island or an edge - but the two do pull in the same direction: a full-width
	 * `flush` bar in the brand colour is the strongest statement the pair makes,
	 * and it is the one most marketing sites that do this are actually after.
	 *
	 * The fill is the `brand-surface` pair INVERTED - a dark brand ground under
	 * the pale one. Not `bg-app-brand`, which is the accent as INK and flips
	 * lightness between themes, so a bar pinned to it goes pale in dark while its
	 * contents stay light; and not `gradient-brand`, which is the CONTROL fill,
	 * saturated so a button reads as pressable, which leaves a primary action on
	 * top of it with nothing to be. The inverse pair is the only one of the three
	 * that is already solved for a large surface carrying interactive children.
	 *
	 * **A dark bar usually needs a light logo.** The component can re-colour the
	 * text it renders and can do nothing about the pixels in a PNG, so a brand
	 * whose asset is dark ink needs `logo.src` pointed at a light variant.
	 */
	tone?: SiteHeaderTone;
	/**
	 * Starts fully invisible - no fill, no border, no shadow - so a hero's own
	 * background shows through until the reader scrolls. It gains everything
	 * `tone` and `variant` already draw the moment `useIsScrolled` flips, using
	 * the same threshold and the same classes the scrolled state renders today:
	 * this prop changes what the AT-REST state looks like, not what "scrolled"
	 * means or what it draws once it is.
	 *
	 * Only for a hero light enough that the bar's own ink - `tone`'s, unchanged -
	 * still reads against it. There is no automatic version of that: CSS cannot
	 * see what image or gradient sits behind an invisible bar, so a hero dark
	 * enough to need light ink needs `tone="brand"` and its own opaque fill
	 * instead of this prop pretending to be invisible over it.
	 *
	 * @default false
	 */
	transparentAtTop?: boolean;
	/**
	 * `floating` is the island: FIXED, out of the flow, so the page underneath
	 * owns the top padding that keeps its first element out from under it.
	 * `flush` is a full-width bar, STICKY and in the flow, so it needs none.
	 *
	 * That difference is the whole choice. Floating suits a landing page with a
	 * coloured hero, where the bar is meant to read as an object ON the page;
	 * flush suits documentation and app-adjacent pages, where a bar that hovers
	 * over content the user is scrolling through is one more thing between them
	 * and the text.
	 *
	 * Named to match `AppSidebar`'s own `floating | flush`, and it was `solid`
	 * until that one shipped. Two components making the same choice under two
	 * names is how a caller ends up believing they are unrelated - and `solid`
	 * described the fill, which was never the difference: both bars are opaque,
	 * and what changes is whether the bar is an object on the page or an edge of
	 * it.
	 */
	variant?: "floating" | "flush";
}

/**
 * The public site header: brand, destinations, actions.
 *
 * ## The three-part layout is a grid, not `justify-between`
 *
 * `1fr auto 1fr` - brand left, menus centre, actions right. With
 * `justify-between` the menus sit at the centre of whatever space the other two
 * left over, so they drift left the moment an action's label grows by a word,
 * and they land somewhere different on every page of a site whose header is
 * supposed to be the one fixed thing. The equal side columns are what makes the
 * middle the middle.
 *
 * Pass no `actions` and it drops to `1fr auto` and the destinations go RIGHT.
 * There is nothing left for the middle to be the middle of, and a nav centred
 * against an empty half-bar reads as misplaced rather than as centred.
 *
 * ## Below `md` the destinations move, they do not disappear
 *
 * The hamburger is on the RIGHT - the far corner from the brand, next to where
 * a thumb already is on a phone, and the edge the sheet arrives from. Every
 * destination AND every action goes into that sheet. A header that hides its
 * nav behind `hidden md:flex` and leaves the actions on the bar is the common
 * shape and it is backwards: the actions are what fits, and the destinations
 * are what gets lost.
 *
 * ## What it decides for you
 *
 * - **The brand is a link home.** Users click a logo to get back; a `<div>` with
 *   `cursor-pointer` is the version of that which does nothing.
 * - **The bar gains its border and shadow on scroll**, not at rest. A line
 *   under a header sitting on a hero cuts the page in two before there is
 *   anything to separate it from.
 * - **Active state is derived from `activeHref`**, never set by the page, and
 *   carried by `aria-current="page"` as well as colour.
 *
 * The header does not render the skip link. `AppSkipToContent` must stay the
 * first focusable thing on the page, which means it belongs to the layout,
 * above this.
 */
export function AppSiteHeader({
	actions = [],
	activeHref,
	className,
	"data-cy": dataCy,
	homeHref = "/",
	items,
	logo,
	onNavigate,
	tone = "surface",
	transparentAtTop = false,
	variant = "floating",
}: AppSiteHeaderProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const isScrolled = useIsScrolled();

	const isFloating = variant === "floating";
	const isBrand = tone === "brand";
	const hasActions = actions.length > 0;
	const barItem = cn(BAR_ITEM_BASE, isBrand ? BAR_ITEM_BRAND : BAR_ITEM_SURFACE);
	/* Everything below reads THIS instead of `isScrolled` directly - once
	   scrolled, or when the caller never asked for the invisible start, the bar
	   draws exactly what it always has. */
	const showChrome = !transparentAtTop || isScrolled;

	return (
		<header
			className={cn(
				/*
				 * A CONTAINER, not a viewport listener. The bar rearranges off the width
				 * it was GIVEN, which in production is the viewport and in the lab is a
				 * 390px frame on a 1280px screen - a viewport breakpoint renders the
				 * desktop bar inside a phone and the specimen proves nothing. Same call
				 * AppKpi makes, for the same reason.
				 */
				"@container z-50 w-full",
				isFloating ? "fixed top-4 left-1/2 -translate-x-1/2 px-4" : "sticky top-0",
				className,
			)}
			data-cy={dataCy}
			data-tone={tone}
			data-variant={variant}
		>
			<div
				className={cn(
					/*
					 * `relative` is what makes a menu panel span the BAR. The panels are
					 * `absolute inset-x-0` and resolve against the nearest positioned
					 * ancestor; without this they would fall back to the viewport, and
					 * with `relative` on each trigger instead they would be as wide as the
					 * word "Products" - the centred-tooltip shape this replaced.
					 */
					"relative transition-[background-color,border-color,box-shadow] duration-200",
					isFloating ? "mx-auto max-w-6xl rounded-2xl border px-4" : "border-b",
					/*
					 * The brand bar is OPAQUE where the surface one is `/95` with a blur.
					 * Translucency is what lets a near-white bar admit that content is
					 * moving under it; a brand ground is a statement of identity, and one
					 * that changes colour according to what happens to be scrolling
					 * beneath is a worse version of both.
					 *
					 * `showChrome` gates the whole thing on `transparentAtTop`'s AT-REST
					 * case: no fill at all, not even the brand one, so the hero shows
					 * through until `useIsScrolled` says otherwise - at which point this
					 * branch draws exactly what it always has.
					 */
					showChrome
						? isBrand
							? cn("bg-brand-fill text-brand-fill-foreground", isFloating && "border-brand-fill-foreground/20")
							: isFloating
								? "border-border bg-card"
								: "bg-card/95 backdrop-blur-sm"
						: "bg-transparent",
					/*
					 * The border is transparent rather than absent at rest, so gaining it
					 * on scroll cannot move the bar's contents by a pixel.
					 *
					 * On the brand tone the scrolled border is the PALE foreground at 25%,
					 * not `--border`: that token is a hairline solved for a light page and
					 * on a dark brand ground it is the lighter of the two, so it reads as
					 * a drawn line rather than an edge. The shadow does most of the work
					 * here anyway.
					 */
					showChrome
						? isFloating
							? isScrolled
								? "shadow-lg"
								: "shadow-soft"
							: isScrolled
								? cn("shadow-soft", isBrand ? "border-brand-fill-foreground/25" : "border-border")
								: "border-transparent"
						: "border-transparent shadow-none",
				)}
			>
				<div
					className={cn(
						/* gap-2 narrow: the centre column is empty below @3xl, and two 16px gaps either side of nothing is 32px a phone does not have. */
						"grid min-h-16 items-center gap-2 py-4 @3xl:gap-4",
						/*
						 * Equal side columns ONLY where there is something between them to
						 * centre. From `@3xl` the nav is on the bar, and `1fr auto 1fr` is
						 * what makes the middle the actual middle rather than the centre of
						 * whatever the other two left over - otherwise the menus drift left
						 * the moment an action's label grows by a word.
						 *
						 * Below that the nav is `display: none`, so the side columns are
						 * centring nothing and the symmetry costs real money: the trailing
						 * 1fr claimed half the bar to hold one hamburger, and the brand -
						 * which is all that is left on a phone - was truncated to "Templ..."
						 * against ~100px of empty cell beside it. `auto` there gives the
						 * button its width and the wordmark everything else.
						 *
						 * A bar with NO actions is that same bill one column over. The
						 * trailing 1fr exists to balance the actions against the brand, so
						 * with nothing in it the nav is centred against half a bar of
						 * nothing - which does not read as centred, it reads as a nav that
						 * has drifted left of the empty space beside it. `1fr auto` puts the
						 * destinations where the actions would have been, which is the only
						 * other position on this bar that is a decision rather than an
						 * accident of what is missing.
						 */
						hasActions ? "grid-cols-[1fr_auto_auto] @3xl:grid-cols-[1fr_auto_1fr]" : "grid-cols-[1fr_auto_auto] @3xl:grid-cols-[1fr_auto]",
						isFloating ? "" : "mx-auto max-w-6xl px-4",
					)}
				>
					{/*
					 * `min-w-0` AND `overflow-hidden`, or the wordmark refuses to shrink
					 * and runs UNDER the actions on a phone instead of clipping. A grid
					 * cell's default `min-width: auto` is the whole reason - AppLogo
					 * truncates internally, but only once it is allowed to be narrower
					 * than its own content.
					 */}
					<div className="flex min-w-0 items-center overflow-hidden">
						<AppLogo
							className="min-w-0"
							data-cy={dataCy ? `${dataCy}-logo` : undefined}
							href={homeHref}
							mark={logo?.mark}
							src={isBrand ? (logo?.brandSrc ?? logo?.src) : logo?.src}
							/*
							 * `onGradient` on the brand bar, which is AppLogo's way of saying
							 * "do not paint the wordmark yourself". It drops `text-gradient` -
							 * an ink ramp solved against a light PAGE, which is where it
							 * measured 1.4:1 on a dark one - and the text inherits the bar's
							 * own `text-brand-surface` instead, the value the fill was solved
							 * against. A lockup ignores this: its colours are in the file, and
							 * `logo.src` is the only lever over them.
							 */
							tone={isBrand ? "onGradient" : "gradient"}
							wordmark={logo?.wordmark}
						/>
					</div>

					{/* The destinations. 48rem is where three or four labels plus two actions stop fitting beside each other. */}
					<nav
						aria-label="Site"
						className="hidden items-center gap-6 @3xl:flex @5xl:gap-8"
						data-cy={dataCy ? `${dataCy}-nav` : undefined}
					>
						{items.map((item) =>
							isSiteNavMenu(item) ? (
								<SiteHeaderMenu
									activeHref={activeHref}
									isActive={isSiteNavItemActive(item, activeHref)}
									key={item.label}
									menu={item}
									onNavigate={onNavigate}
									triggerClassName={barItem}
									variant={variant}
								/>
							) : (
								<SiteHeaderLink
									className={barItem}
									isActive={isSiteNavItemActive(item, activeHref)}
									/*
									 * `label`, not `href` - a marketing header's destinations are
									 * mostly its own in-page anchors (see `SiteNavLink.hash`'s
									 * doc), and every one of those items shares the SAME `href`.
									 * Keying off it collided the moment a page had more than one
									 * hash link, which is the common case rather than the
									 * exception.
									 */
									key={item.label}
									link={item}
									onNavigate={onNavigate}
								>
									{item.label}
								</SiteHeaderLink>
							),
						)}
					</nav>

					{/* The middle column is `auto`, so with no menus on the bar it collapses and the two ends stay put. */}
					{/* `shrink-0`: the actions are the fixed cost of the bar, and the brand is what gives way to them. */}
					{/*
					 * With no actions this cell holds only the hamburger, which is already
					 * gone by `@3xl` - so from there it is an empty grid item, and an empty
					 * grid item still claims a `gap`. Taking it out of the flow entirely is
					 * what lets the nav finish flush against the bar's padding instead of
					 * 16px shy of it, the way an action button would have.
					 */}
					<div className={cn("flex shrink-0 items-center justify-end gap-2 @2xl:gap-3", !hasActions && "@3xl:hidden")}>
						{/*
						 * Below `@2xl` the actions leave the bar ENTIRELY, and the sheet is
						 * where they are - full width, at the foot, where the thumb is.
						 *
						 * Keeping the primary on a phone bar was the previous rule, on the
						 * grounds that a header with no way to sign up has no job. It is
						 * still true, and the sheet is still where that job gets done: the
						 * button cost the wordmark, which was crushed to "T.." beside it,
						 * and a brand nobody can read is a worse trade than a sign-up that
						 * is one tap away instead of nought. Three things fit on a 390px
						 * bar - mark, name, way in - and the hamburger is the way in.
						 */}
						{actions.map((action, position) => (
							<AppButton
								className={cn(
									"hidden @2xl:inline-flex",
									/*
									 * The brand bar eats its own primary button. `variant="primary"`
									 * is the brand as a fill, and on a bar that IS the brand it is
									 * the same hue at a slightly different lightness - the one
									 * control the header exists to drive, rendered as the least
									 * visible thing on it.
									 *
									 * So on this tone the pale half of the pair becomes the fill and
									 * the dark half the ink, which is the bar's own colours read the
									 * other way round: the button is the lightest object on a dark
									 * band, which is what makes it the loudest, and the pairing is
									 * the one already measured at 10.22:1. This is the pale pill
									 * every brand-coloured marketing bar converges on, and the
									 * reason it does.
									 *
									 * Secondary and ghost actions keep their own variants: they are
									 * meant to recede, and on this ground they do that by staying
									 * text.
									 */
									isBrand &&
										action.variant === "primary" &&
										"bg-brand-fill-foreground text-brand-fill hover:bg-brand-fill-foreground/90",
									isBrand && action.variant !== "primary" && "text-brand-fill-foreground hover:bg-brand-fill-foreground/15",
								)}
								data-cy={dataCy ? `${dataCy}-action-${position}` : undefined}
								key={action.to}
								to={action.to}
								variant={action.variant}
							>
								{action.label}
							</AppButton>
						))}

						{items.length > 0 ? (
							<AppButton
								aria-controls={dataCy ? `${dataCy}-sheet` : undefined}
								aria-expanded={isMenuOpen}
								aria-haspopup="dialog"
								aria-label="Open navigation"
								/* Ghost takes its ink from the page, which on a dark bar is the
								   dark ink - the hamburger is the ONE control on a phone bar and
								   it would arrive near-invisible. */
								className={cn("@3xl:hidden", isBrand && "text-brand-fill-foreground hover:bg-brand-fill-foreground/15")}
								data-cy={dataCy ? `${dataCy}-hamburger` : undefined}
								icon={Menu}
								isIconOnly
								onPress={() => setIsMenuOpen(true)}
								variant="ghost"
							/>
						) : null}
					</div>
				</div>
			</div>

			<SiteHeaderMobileNav
				actions={actions}
				activeHref={activeHref}
				data-cy={dataCy ? `${dataCy}-sheet` : undefined}
				homeHref={homeHref}
				isOpen={isMenuOpen}
				items={items}
				logo={logo}
				onNavigate={onNavigate}
				onOpenChange={setIsMenuOpen}
			/>
		</header>
	);
}
