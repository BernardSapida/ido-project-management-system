import type { SiteHeaderAction, SiteNavItem, SiteNavLink } from "@bernardsapida/web-ui";
import { AppButton, AppPageHeader, AppSiteHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	BookOpen,
	Building2,
	FileText,
	Github,
	Home,
	LifeBuoy,
	MessageSquare,
	Newspaper,
	Palette,
	PlayCircle,
	Rocket,
	Scale,
	SquareStack,
	Table as TableIcon,
	Tag,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";
import { LabSection } from "@/features/labs/components/LabSection";
import { cn } from "@/utils/cn";

const TITLE = "Site header";

/**
 * Site header lab - the SIGNED-OUT bar.
 *
 * The first thing to be clear about is which header this is. `AppHeader` - the
 * DASHBOARD header, on its own lab - is the signed-in app bar: a sidebar trigger, a breadcrumb trail and
 * page actions, answering "where am I in this app?". This one is the marketing
 * bar a visitor meets before they have an account, and it answers "what is this
 * product, and how do I start?". They share a surface vocabulary
 * (`floating | flush`) and nothing else - neither should grow the other's props.
 *
 * Two shapes, and the difference is only what a bar item opens:
 *
 * 1. **Logo - links - actions.** Every item is a destination. This is the right
 *    default: a site with six pages does not need a panel to list them, and a
 *    menu holding one column is a dropdown standing in for a link.
 * 2. **Logo - menus - actions.** An item opens a panel of grouped links, each
 *    with an icon and a line of description. Worth it once a section has enough
 *    pages that their names alone stop distinguishing them.
 *
 * Things to check by hand:
 *
 * 1. **Hover a menu, then Tab to it and press Enter or ArrowDown.** Hover is the
 *    shortcut, never the mechanism - a menu that only opens on hover is
 *    invisible to every phone and every keyboard.
 * 2. **Tab out of the last link in an open panel.** It closes. A panel standing
 *    open behind the focus ring is a 400px box over the page with nothing in it
 *    the user is looking at.
 * 3. **Open the phone frame's sheet.** Every destination AND both actions are in
 *    it. The common shape - `hidden md:flex` on the nav, actions left on the bar
 *    - is backwards: the actions are what fits.
 * 4. **Both frames are the same component.** It rearranges off the width it was
 *    GIVEN, not the window's, so a 390px frame on a desktop shows the real phone
 *    bar.
 */
export const Route = createFileRoute("/(references)/components/app-site-header")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: SiteHeaderLab,
});

/**
 * Shape one: every item is a destination. No panels at all.
 *
 * The hrefs are REAL routes on purpose. TanStack renders `href=""` for a `to` it
 * does not recognise - a link that looks right and goes nowhere - and a lab must
 * not be the thing that introduces that.
 */
const SIMPLE_NAV: SiteNavItem[] = [
	{ href: "/", icon: Home, label: "Home" },
	{ href: "/components", icon: SquareStack, label: "Components" },
	{ href: "/components/theme-customizer", icon: Tag, label: "Pricing" },
	// The anchor case: a section rather than a page. It travels as a router hash,
	// so the item works from any page of the site rather than only the one that
	// holds the section - and it lights on the hash, not on the page.
	{ hash: "features", href: "/", icon: Zap, label: "Features" },
	{ href: "https://github.com", icon: Github, isExternal: true, label: "GitHub" },
];

/**
 * Shape two: menus holding grouped links.
 *
 * Three deliberately different panels - four groups, two groups, and a single
 * ungrouped one. The panel is always the width of the BAR, so what the group
 * count changes is how many columns `auto-fit` lands on inside it; one group is
 * the case that regresses, because a lone 14rem column in a 72rem panel is the
 * shape that looks like a bug if the grid is wrong.
 *
 * **No href appears twice in this set.** A menu is lit when any link inside it
 * is current, so one route reached from two menus lights BOTH - three items here
 * once pointed at the same page, and Products, Docs and Pricing all read as the
 * current page at once. That is a fixture rule rather than a component bug: a real site
 * putting one destination in two menus is just as ambiguous to a reader, and the
 * answer there is the same one.
 */
const MEGA_NAV: SiteNavItem[] = [
	{
		groups: [
			{
				label: "Products",
				links: [
					{
						description: "Learn about your users.",
						href: "/components/kpi",
						icon: TrendingUp,
						label: "Interactive reports",
					},
					{
						description: "Monitor your metrics.",
						href: "/components/table",
						icon: TableIcon,
						label: "Team dashboard",
					},
					{
						description: "Surface hidden trends.",
						href: "/components/list",
						icon: SquareStack,
						label: "Segmentation",
					},
				],
			},
			{
				label: "Use cases",
				links: [
					{
						description: "Analyze conversion rates.",
						href: "/components/stepper",
						icon: Rocket,
						label: "Convert",
					},
					{
						description: "Measure active usage.",
						href: "/components/tracking",
						icon: Users,
						label: "Engage",
					},
					{
						description: "Find retention drivers.",
						href: "/components/timeline",
						icon: TrendingUp,
						label: "Retain",
					},
				],
			},
			{
				label: "Resources",
				links: [
					{
						description: "The latest industry news.",
						href: "/components/blog-post",
						icon: Newspaper,
						label: "Blog",
					},
					{
						description: "Learn how our customers work.",
						href: "/components/comments",
						icon: MessageSquare,
						label: "Customer stories",
					},
					{
						description: "New features and techniques.",
						href: "/components/carousel",
						icon: PlayCircle,
						label: "Video",
					},
				],
			},
			{
				label: "Company",
				links: [
					{
						description: "Learn about our story.",
						href: "/components/profile-banner",
						icon: Building2,
						label: "About us",
					},
					{
						description: "News and press resources.",
						href: "/components/banner",
						icon: FileText,
						label: "Press",
					},
					{
						description: "All the boring stuff.",
						href: "/components/list",
						icon: Scale,
						label: "Legal",
					},
				],
			},
		],
		label: "Products",
	},
	{
		groups: [
			{
				label: "Get started",
				links: [
					{
						description: "Tokens, gradients, surfaces.",
						href: "/components/theme-toggle",
						icon: Palette,
						label: "Design tokens",
					},
					{
						description: "Canonical form wiring.",
						href: "/components/form-reference",
						icon: BookOpen,
						label: "Forms",
					},
				],
			},
			{
				label: "Support",
				links: [
					{
						description: "All the boring stuff.",
						href: "/components/accordion",
						icon: FileText,
						label: "Documentation",
					},
					{
						description: "Learn, fix a problem.",
						href: "/components/error-state",
						icon: LifeBuoy,
						label: "Help centre",
					},
				],
			},
		],
		label: "Resources",
	},
	{
		/* No group label: one ungrouped column, which is the narrow panel. */
		groups: [
			{
				links: [
					{
						description: "What this template is for.",
						href: "/components",
						icon: MessageSquare,
						label: "Overview",
					},
					{
						description: "Pick a palette and measure it.",
						href: "/components/theme-customizer",
						icon: Palette,
						label: "Theming",
					},
				],
			},
		],
		label: "Docs",
	},
	{ href: "/components/card", icon: Tag, label: "Pricing" },
];

const ACTIONS: SiteHeaderAction[] = [
	{ label: "Log in", to: "/sign-in", variant: "ghost" },
	{ label: "Get started", to: "/sign-up", variant: "primary" },
];

function SiteHeaderLab() {
	const [surface, setSurface] = useState<"flush" | "floating">("floating");
	const [tone, setTone] = useState<"brand" | "surface">("surface");
	const [activeHref, setActiveHref] = useState("/components");

	const isFloating = surface === "floating";
	const isBrand = tone === "brand";

	/* Stop the navigation, move the pathname the header reads - the same rule
	   every nav specimen in these labs follows. */
	const onNavigate = (link: SiteNavLink, event: { preventDefault: () => void }) => {
		event.preventDefault();
		if (!link.isExternal) setActiveHref(link.href);
	};

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The bar a signed-out visitor meets: brand, destinations, and the two actions the site exists to drive. Not the app header - that one is signed-in, and it answers a different question."
				title="Site header lab"
			/>

			<LabSection
				description="Both frames below read this. Floating is FIXED and out of the flow, so the page under it owns the padding that keeps its first element clear - scroll a frame and the hero passes underneath. Flush is STICKY and in the flow, so it needs none, and it takes its border on scroll rather than at rest: a line under a bar sitting on a hero cuts the page in two before there is anything to separate. Same pair of names as AppSidebar and AppHeader, and the same distinction - an object ON the page, or an edge OF it."
				title="Surface"
			>
				<div className="flex flex-wrap gap-2">
					<AppButton
						data-cy="site-header-floating"
						onPress={() => setSurface("floating")}
						size="sm"
						variant={isFloating ? "primary" : "secondary"}
					>
						Floating
					</AppButton>
					<AppButton
						data-cy="site-header-flush"
						onPress={() => setSurface("flush")}
						size="sm"
						variant={isFloating ? "secondary" : "primary"}
					>
						Flush
					</AppButton>
				</div>
				<p className="text-sm text-muted">
					Rendering <code className="font-mono">{activeHref}</code>. Specimen links do not navigate.
				</p>
			</LabSection>

			<LabSection
				description="A separate axis from the surface above, and the two compose: brand answers what the bar is MADE of, floating/flush answers where it sits. Surface is the card - a neutral bar with the brand on it only as the active item and the primary button. Brand fills the bar with brand-surface INVERTED, a dark brand ground under the pale one, so the header reads as a band of the brand rather than a container for it. Flip it and watch what has to swap: the active item cannot be the brand colour when the bar IS the brand, so the channel changes from hue to BRIGHTNESS - the current item is the paired ink at full strength and the rest sit at 70% of it, which keeps the bar one uninterrupted band with one item lit. The primary action goes the other way and takes the pale ink as a FILL, which is why every brand-coloured marketing bar converges on a pale pill - one of them, at the end of the bar, where the action is. Not bg-app-brand, which is the accent as INK and inverts per theme; not gradient-brand, which is the CONTROL fill and leaves a button on top of it with nothing to be."
				title="Tone"
			>
				<div className="flex flex-wrap gap-2">
					<AppButton
						data-cy="site-header-tone-surface"
						onPress={() => setTone("surface")}
						size="sm"
						variant={isBrand ? "secondary" : "primary"}
					>
						Surface
					</AppButton>
					<AppButton
						data-cy="site-header-tone-brand"
						onPress={() => setTone("brand")}
						size="sm"
						variant={isBrand ? "primary" : "secondary"}
					>
						Brand
					</AppButton>
				</div>
				<p className="text-sm text-muted">
					Toggle the theme while this is on <strong>Brand</strong>. The bar keeps its footing in both, because the two
					colours are the <code className="font-mono">brand-surface</code> pair and each theme solves that pair for
					itself. A bar pinned to <code className="font-mono">bg-app-brand</code> instead goes pale in dark while its
					contents stay light - that is the failure this tone exists to avoid, not a hypothetical one.
				</p>
			</LabSection>

			<LabSection
				description="Every item is a destination, and nothing opens a panel. This is the right default: a site with six pages does not need a mega menu to list them, and a menu holding one column is a dropdown standing in for a link. The external item carries its own affordance and opens in a new tab; Features is an ANCHOR - a section of a page rather than a page - which travels as a router hash so the item still works from every other page of the site. Note the order - brand first, primary action last: the two ends of a bar are what get read, and the middle is the skipping zone. This is the shape the landing page uses."
				title="Shape one: logo, links, actions"
			>
				<DeviceFrame
					height={360}
					label="Desktop"
				>
					<AppSiteHeader
						actions={ACTIONS}
						activeHref={activeHref}
						data-cy="simple-header"
						items={SIMPLE_NAV}
						onNavigate={onNavigate}
						tone={tone}
						variant={surface}
					/>
					<FramePage isFloating={isFloating} />
				</DeviceFrame>
			</LabSection>

			<LabSection
				description="An item opens a panel of grouped links, each with an icon and a line of description - worth it once a section has enough pages that their names alone stop telling them apart. The panel spans the BAR rather than hanging under its trigger: a four-column menu centred on the word Products is a tooltip that grew, and it lands half off the edge as soon as the trigger is near one. Three panels on purpose - Products has four groups, Resources two, Docs one ungrouped - because the columns are auto-fit with a minimum rather than a fixed count, and one group is the case that regresses. Hover Products, then Tab to it and press Enter or ArrowDown; hover is the shortcut, never the mechanism. Pricing is a plain link beside them, which is the point: the two shapes mix on one bar."
				title="Shape two: logo, mega menus, actions"
			>
				<DeviceFrame
					height={560}
					label="Desktop"
				>
					<AppSiteHeader
						actions={ACTIONS}
						activeHref={activeHref}
						data-cy="mega-header"
						items={MEGA_NAV}
						onNavigate={onNavigate}
						tone={tone}
						variant={surface}
					/>
					<FramePage isFloating={isFloating} />
				</DeviceFrame>
				<p className="text-sm text-muted">
					The columns are <code className="font-mono">auto-fit, minmax(14rem, 1fr)</code> - a MINIMUM, not a count. A
					fraction grid divides whatever width there is, so <code className="font-mono">grid-cols-4</code> in a narrow
					container gives 60px columns and one letter per line. A column has a width below which it stops being
					readable; under that the answer is fewer columns, never thinner ones, and auto-fit drops to three, then two,
					then one on its own. The panel also scrolls inside itself past 70vh - a menu you cannot reach the end of is
					worse than a menu with fewer items in it.
				</p>
			</LabSection>

			<LabSection
				description="The same component at 390px. The bar keeps three things - mark, name, way in - and the actions leave it entirely. Keeping the primary button here was the old rule, on the grounds that a header with no way to sign up has no job; it cost the wordmark, which was crushed to two letters and an ellipsis beside it, and a brand nobody can read is the worse trade when the sheet puts sign-up one tap away instead of nought. Every destination AND both actions move into the sheet - the common shape, hidden md:flex on the nav with the actions left on the bar, is backwards: the actions are what fits and the destinations are what gets lost. Menus expand IN PLACE as headed blocks rather than opening a second panel, because a drawer that opens another drawer leaves the user two dismissals from the page they were reading. The sheet opens over the whole window rather than inside the frame, since a modal belongs to the viewport."
				title="Phone: the sheet"
			>
				<DeviceFrame
					className="mx-auto w-[390px] max-w-full"
					height={420}
					label="390 × 420"
				>
					<AppSiteHeader
						actions={ACTIONS}
						activeHref={activeHref}
						data-cy="mobile-header"
						items={MEGA_NAV}
						onNavigate={onNavigate}
						tone={tone}
						variant={surface}
					/>
					<FramePage isFloating={isFloating} />
				</DeviceFrame>
			</LabSection>

			<LabSection
				description="Three ways to draw the brand, and the prop that picks one is about what the IMAGE is rather than how big it should be. Square is an icon in a fixed square box with the name rendered as text beside it - the default, and right for a brand whose mark is a mark. Square with the wordmark off is the collapsed-sidebar case: no room for the name, so the accessible name moves onto the link and the mark stands alone. Lockup is an image that already contains the name, so it is sized by HEIGHT with the width left to its aspect ratio, and the text wordmark is suppressed because rendering both spells the name twice. The fourth frame is the failure: the same lockup forced through the square slot, which is what happens today to any project whose logo is horizontal."
				title="Brand: square, mark-only, lockup"
			>
				<div className="grid gap-4 @2xl:grid-cols-2">
					<LogoFrame label="Square + wordmark (default)">
						<AppSiteHeader
							actions={ACTIONS}
							activeHref={activeHref}
							data-cy="logo-square"
							items={SIMPLE_NAV}
							onNavigate={onNavigate}
							tone={tone}
							variant="flush"
						/>
					</LogoFrame>

					<LogoFrame label="Square, wordmark off">
						<AppSiteHeader
							actions={ACTIONS}
							activeHref={activeHref}
							data-cy="logo-mark-only"
							items={SIMPLE_NAV}
							logo={{ wordmark: false }}
							onNavigate={onNavigate}
							tone={tone}
							variant="flush"
						/>
					</LogoFrame>

					<LogoFrame label="Lockup">
						<AppSiteHeader
							actions={ACTIONS}
							activeHref={activeHref}
							data-cy="logo-lockup"
							items={SIMPLE_NAV}
							/*
							 * TWO assets, and the component picks. An <img> is a replaced element,
							 * so no class or token on the page reaches the pixels inside it - the
							 * bar on the brand fill needs a light lockup and the mobile sheet, a
							 * light reading surface whatever the bar is doing, needs the dark one.
							 * The caller supplies both and never has to know which is on screen.
							 */
							logo={{
								brandSrc: "/images/logo-lockup-light.svg",
								mark: "lockup",
								src: "/images/logo-lockup.svg",
							}}
							onNavigate={onNavigate}
							tone={tone}
							variant="flush"
						/>
					</LogoFrame>

					<LogoFrame label="Lockup in the square slot - the bug">
						<AppSiteHeader
							actions={ACTIONS}
							activeHref={activeHref}
							data-cy="logo-lockup-squashed"
							items={SIMPLE_NAV}
							/* mark omitted on purpose: this is today's behaviour. */
							logo={{
								brandSrc: "/images/logo-lockup-light.svg",
								src: "/images/logo-lockup.svg",
								wordmark: false,
							}}
							onNavigate={onNavigate}
							tone={tone}
							variant="flush"
						/>
					</LogoFrame>
				</div>
				<p className="text-sm text-muted">
					The last frame is <code className="font-mono">object-contain</code> doing exactly what it is told: a 256×76
					image fitted into a 40×40 box is painted at <strong>40×12</strong>. Nothing is broken and nothing warns -
					which is why a brand shipped as a horizontal image arrives as an unreadable stamp with the component&apos;s
					own wordmark spelling the name out beside it.
				</p>
			</LabSection>

			<RulesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

const RULES: { body: string; title: string }[] = [
	{
		body: "This is the signed-OUT bar. The dashboard header (AppHeader) is the signed-in one - sidebar trigger, breadcrumbs, page actions. They share floating | flush and nothing else, and neither should grow the other's props.",
		title: "Two headers, on purpose",
	},
	{
		body: "A menu opens on hover, AND on click, Enter, Space and ArrowDown - hover does not exist on a touch screen and cannot be reached from a keyboard. Escape closes it and returns focus to the trigger; tabbing out of the last link closes it too.",
		title: "Hover is the shortcut, never the mechanism",
	},
	{
		body: "menu and menuitem describe ACTIONS: they take over the arrow keys and remove the links from a screen reader's link list. A button with aria-expanded over a plain list of anchors keeps every 'list the links' shortcut working.",
		title: "The panel is a disclosure, not a role=menu",
	},
	{
		body: "There is no href on it. A control that navigates on click and opens on hover does the wrong one of those on a phone, where the first tap has to be the open. A section with a landing page puts it first inside the panel.",
		title: "The trigger does not navigate",
	},
	{
		body: "Actions leave the bar one at a time rather than all at once, and the LAST one is the primary - a header with no way to sign up has no job. Both are repeated at the foot of the sheet, full width: a duplicated control costs nothing and a missing one costs the click.",
		title: "The primary action survives to the narrowest width",
	},
	{
		body: "The current item is the brand colour and semibold - two channels, and the heavier one is the weight. A 10% tint behind body text reads as a shade nobody can name against the rows either side and fails contrast outright.",
		title: "Active state",
	},
	{
		body: "Exact match, unlike the app nav's prefix match. The app is a set of sections you go INTO; a marketing site is a set of pages you go TO, and a prefix match lights Product on every URL that starts with the same word. A menu is lit when any link inside it is. An item with a hash also matches on the hash, so Features is not lit merely because you are on the page its section lives in.",
		title: "Active is derived, and matched exactly",
	},
	{
		body: "There is no slot for one, and no theme toggle on the bar. A visitor who has not signed up yet is not carrying a preference the site has to honour - the OS is, and the app reads it. The bar holds destinations and the two actions the site exists to drive; anything else on it competes with the one button that matters.",
		title: "No trailing control",
	},
	{
		body: "It is a @container, not a viewport listener - the bar rearranges off the width it was GIVEN, which in production is the viewport and in this lab is a 390px frame on a 1280px screen. Same call AppKpi and AppHeader make.",
		title: "Breakpoints are container queries",
	},
];

function RulesSection() {
	return (
		<LabSection
			description="The decisions behind the frames above, in the order they get argued about."
			title="The rules"
		>
			<dl className="grid gap-3 sm:grid-cols-2">
				{RULES.map((rule) => (
					<div
						className="rounded-2xl border border-border p-3"
						key={rule.title}
					>
						<dt className="text-sm font-semibold">{rule.title}</dt>
						<dd className="mt-1 text-sm text-muted">{rule.body}</dd>
					</div>
				))}
			</dl>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * A bar on its own, with no page under it.
 *
 * The brand frames are about the LOGO, so there is nothing to scroll and nothing
 * for the bar to sit over - a `DeviceFrame` here would be 360px of placeholder
 * blocks under the 8px of specimen anybody is looking at. It is `flush` for the
 * same reason: floating is fixed, and a fixed bar in a box this short overhangs
 * everything below it.
 *
 * `@container` on the box, not just on the bar. The bar rearranges off the width
 * it is GIVEN, and in a two-column grid that is roughly half the page - so
 * without a container context here the two columns would resolve their breakpoints
 * against the lab page and render the desktop bar in a 300px cell.
 */
function LogoFrame({ children, label }: { children: ReactNode; label: string }) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
			<div className="@container overflow-hidden rounded-2xl border border-border bg-background">{children}</div>
		</div>
	);
}

/** A fake page, so the bar has something to sit over and scroll against. */
function FramePage({ isFloating }: { isFloating: boolean }) {
	return (
		<div className={cn("space-y-3 p-4", isFloating && "pt-24")}>
			<div className="h-32 rounded-2xl gradient-brand" />
			<div className="h-20 rounded-2xl bg-muted-surface" />
			<div className="h-20 rounded-2xl bg-muted-surface" />
		</div>
	);
}

/**
 * A labelled box standing in for a viewport.
 *
 * `transform-gpu` is load-bearing: a transformed ancestor is the containing
 * block for fixed descendants, so the floating bar pins to THIS box rather than
 * sitting over the page's own toolbar. The sheet still opens over the whole
 * window, because a modal belongs to the viewport.
 *
 * The frame owns its scroller, and that scroller is `scrollbar-none`. Both are
 * consequences of the line above. The bar is FIXED to the frame, so it is as
 * wide as the frame; the page under it lives in the scroller, so it is as wide
 * as the frame MINUS the scrollbar - and the bar ends up centred on a box 15px
 * wider than the one the content is centred on, overhanging it on the right and
 * sitting half a scrollbar right of the middle. A real viewport does not have
 * this problem, because a classic scrollbar is outside the box a fixed element
 * measures itself against; a nested scroller puts it inside. Taking the bar out
 * is what puts the two back on the same width.
 *
 * Not solvable by making the frame itself the scroller: the fixed bar then
 * scrolls away with the page, which is the one thing it must not do.
 *
 * `scrollbar-none` normally owes an affordance in its place (see styles.css).
 * Here the frame is a screen, and content sliced by its bottom edge is that
 * affordance - a fade would be a rendering effect no device has.
 */
function DeviceFrame({
	children,
	className,
	height,
	label,
}: {
	children: ReactNode;
	className?: string;
	height: number;
	label: string;
}) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
			{/*
			 * As wide as the page gives it, and it never scrolls sideways - a lab you
			 * have to drag horizontally to read is worse than one that adapts. The
			 * bar inside is a @container, so a narrow frame simply gets the narrow
			 * bar, which is the correct specimen rather than a squeezed one.
			 */}
			<div
				className={cn(
					"relative transform-gpu overflow-hidden rounded-3xl border border-border bg-background shadow-soft",
					className,
				)}
				style={{ height }}
			>
				{/* The scroller belongs to the frame, not to the caller - see above. */}
				<div className="scrollbar-none h-full overflow-y-auto">{children}</div>
			</div>
		</div>
	);
}
