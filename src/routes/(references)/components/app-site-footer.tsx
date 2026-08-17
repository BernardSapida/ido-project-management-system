import type { SiteFooterGroup, SiteFooterLink, SiteFooterTone, SiteSocialLink } from "@bernardsapida/web-ui";
import { AppButton, AppPageHeader, AppSiteFooter } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";
import { LabSection } from "@/features/labs/components/LabSection";

const TITLE = "Site footer";

/**
 * Site footer lab - the last band of a public page.
 *
 * Filed under `Reusable`, with the other ASSEMBLIES. It was a Project Component
 * until it was promoted into `@bernardsapida/web-ui`: every part of the footer
 * that is genuinely the SITE's - platforms, copyright, column names - is already
 * a prop, and what is left is the arrangement, which is the same kind of thing
 * the site header is. It ships in the package now and is imported from it.
 *
 * It is the SIGNED-OUT counterpart to `AppSiteHeader` and shares its vocabulary
 * deliberately: the same `logo` object, the same `brand | surface` tones under
 * the same names, the same external-link rule. What it does not share is a
 * variant axis - a footer is never fixed, never sticky, and has no scrolled
 * state, because there is nothing under it to sit over.
 *
 * Things to check by hand:
 *
 * 1. **Tab through the social row.** Four rings, each clearly around one circle.
 *    The targets are 44px for a 24px glyph; at 24px they would be the smallest
 *    targets on the page sitting in a row, which is how a mis-tap happens.
 * 2. **Narrow the phone frame's specimen and read the alignment.** Everything
 *    centres below `@2xl` rather than stacking left. Three short blocks against
 *    a shared left edge read as rows that failed to fill; centred, they read as
 *    one closing plate.
 * 3. **Switch to the brand tone and toggle the theme.** The band keeps its
 *    footing in both, because the fill and the ink are the solved `brand-fill`
 *    pair - and the focus ring changes colour with it, since `--focus` is the
 *    brand as INK and lands dark-on-dark on the brand's own fill.
 * 4. **Compare the two shapes.** With no `groups`, the footer is brand, social
 *    and a centred copyright. The columns are a band of their own when they
 *    exist - never a grid the brand is squeezed into as its first cell.
 */
export const Route = createFileRoute("/(references)/components/app-site-footer")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: SiteFooterLab,
});

/**
 * Real destinations, like every nav specimen in these labs.
 *
 * TanStack renders `href=""` for a `to` it does not recognise - a link that
 * looks right and goes nowhere - and a lab must not be the thing that
 * introduces that.
 */
const GROUPS: SiteFooterGroup[] = [
	{
		heading: "Product",
		links: [
			{ href: "/components/card", label: "Features" },
			{ href: "/components/theme-customizer", label: "Theming" },
			{ href: "/components/kpi", label: "Reports" },
			{ href: "https://github.com", isExternal: true, label: "Changelog" },
		],
	},
	{
		heading: "Resources",
		links: [
			{ href: "/components", label: "Components" },
			{ href: "/components/form-reference", label: "Forms" },
			{ href: "https://docs.heroui.com", isExternal: true, label: "HeroUI docs" },
		],
	},
	{
		heading: "Company",
		links: [
			{ href: "/components/profile-banner", label: "About" },
			{ href: "/components/blog-post", label: "Blog" },
			{ href: "/sign-up", label: "Get started" },
		],
	},
];

const LEGAL: SiteFooterLink[] = [
	{ href: "/components/checkbox", label: "Privacy" },
	{ href: "/components/list", label: "Terms" },
	{ href: "/components/switch", label: "Cookies" },
];

/**
 * The four platforms the package draws.
 *
 * `label` is required rather than optional, and this is the fixture that shows
 * why: every one of these renders as a glyph and nothing else, so the label IS
 * the link's name. Without it a screen reader announces four links called
 * "link".
 */
const SOCIAL: SiteSocialLink[] = [
	{ href: "https://facebook.com", label: "Facebook", platform: "facebook" },
	{ href: "https://instagram.com", label: "Instagram", platform: "instagram" },
	{ href: "https://linkedin.com", label: "LinkedIn", platform: "linkedin" },
	{ href: "https://tiktok.com", label: "TikTok", platform: "tiktok" },
];

function SiteFooterLab() {
	const [tone, setTone] = useState<SiteFooterTone>("muted");

	/* Stop the navigation - the same rule every nav specimen in these labs
	   follows. Social links are not routed through it: they are external, and a
	   new tab does not take the reader away from the lab. */
	const onNavigate = (_link: SiteFooterLink, event: { preventDefault: () => void }) => {
		event.preventDefault();
	};

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The band that closes a public page: who publishes the site, where else to go, and the small print. The signed-out counterpart to the site header - and the one surface with no sticky variant, because there is nothing under it to sit over."
				title="Site footer lab"
			/>

			<LabSection
				description="Three fills, and only ONE of them changes anything but the fill. Surface is the card - a neutral band closing the page. Muted is the pale brand tint, and it is what most sites actually want: it marks the end of the document without claiming to be a statement. Brand fills the band with the brand-surface pair inverted, which is worth it when the header does the same and heavy-handed when it does not. Switch to brand and toggle the theme: the band keeps its footing in both, because the pair is solved per theme - a band pinned to bg-app-brand instead goes pale in dark while its contents stay light."
				title="Tone"
			>
				<div className="flex flex-wrap gap-2">
					{(["surface", "muted", "brand"] as const).map((value) => (
						<AppButton
							data-cy={`site-footer-tone-${value}`}
							key={value}
							onPress={() => setTone(value)}
							size="sm"
							variant={tone === value ? "primary" : "secondary"}
						>
							{value === "surface" ? "Surface" : value === "muted" ? "Muted" : "Brand"}
						</AppButton>
					))}
				</div>
			</LabSection>

			<LabSection
				description="The small-site shape: brand at one end, social at the other, and a copyright under the rule. No columns at all, and the copyright CENTRES because it is alone - one short line pinned to the left edge of a 1152px band reads as the start of a sentence that never arrives, and with nothing at the other end there is nothing for it to be balanced against. This is the whole footer a five-page site needs, and it is what the component renders when `groups` is omitted."
				title="Shape one: brand, social, copyright"
			>
				<LabFrame label="Desktop">
					<AppSiteFooter
						data-cy="minimal-footer"
						onNavigate={onNavigate}
						social={SOCIAL}
						tone={tone}
					/>
				</LabFrame>
			</LabSection>

			<LabSection
				description="Everything on: a tagline, three link columns, the social row and the legal links beside the copyright. The columns are a BAND of their own rather than a grid the brand is squeezed into as its first cell - the common shape, which hands the social icons a cell whose width is decided by how long the word Documentation happens to be, and at the width where the grid drops to two columns leaves the brand beside a column of links with nothing marking it as different. The columns themselves are auto-fit with a 9rem minimum, not a fixed count: a fraction grid divides whatever width there is, so grid-cols-3 in a narrow container gives 70px columns and one word per line."
				title="Shape two: columns, tagline and the legal row"
			>
				<LabFrame label="Desktop">
					<AppSiteFooter
						data-cy="full-footer"
						groups={GROUPS}
						legal={LEGAL}
						onNavigate={onNavigate}
						owner="Bernard Sapida"
						social={SOCIAL}
						tagline="The unified monolith template for TanStack Start, HeroUI and Better Auth."
						tone={tone}
					/>
				</LabFrame>
				<p className="text-sm text-muted">
					The external links in the columns carry the arrow; the ones in the legal row do not. Three of four legal links
					are external on most sites, so the glyph stops distinguishing anything and becomes a texture across the row.{" "}
					<code className="font-mono">(opens in a new tab)</code> stays on both - it is the half a screen reader user
					cannot do without, and it costs nothing on screen.
				</p>
			</LabSection>

			<LabSection
				description="The same component at 390px, and the rule is centred, not stacked-left. A stacked footer on a phone is three short blocks in a column; against a shared left edge they read as rows that failed to fill, and centred they read as one closing plate. This is the one surface where 'centre only short, isolated things' is satisfied by every element at once. Note that the social glyphs still line up with the logo above them: the row is pulled back by the padding inside its first and last 44px target, so what aligns is the glyphs rather than the invisible boxes around them."
				title="Phone"
			>
				<div className="flex flex-wrap gap-6">
					<LabFrame
						className="w-[390px] max-w-full"
						label="390px - no columns"
					>
						<AppSiteFooter
							data-cy="phone-footer"
							onNavigate={onNavigate}
							social={SOCIAL}
							tone={tone}
						/>
					</LabFrame>
					<LabFrame
						className="w-[390px] max-w-full"
						label="390px - with columns"
					>
						<AppSiteFooter
							data-cy="phone-footer-full"
							groups={GROUPS}
							legal={LEGAL}
							onNavigate={onNavigate}
							social={SOCIAL}
							tone={tone}
						/>
					</LabFrame>
				</div>
			</LabSection>

			<LabSection
				description="The same logo object AppSiteHeader takes, forwarded to the same component - a square mark with the name as text, or a lockup that already contains the name and is sized by height. A lockup suppresses the text wordmark, because rendering both spells the name twice. On the brand tone the component reaches for logo.brandSrc: an <img> is a replaced element, so no class or token on the page reaches the pixels inside it, and a dark lockup on a dark brand band is invisible with no styling answer available."
				title="Brand: square and lockup"
			>
				<div className="grid gap-4 @2xl:grid-cols-2">
					<LabFrame label="Square + wordmark (default)">
						<AppSiteFooter
							data-cy="logo-square-footer"
							onNavigate={onNavigate}
							social={SOCIAL}
							tone={tone}
						/>
					</LabFrame>
					<LabFrame label="Lockup">
						<AppSiteFooter
							data-cy="logo-lockup-footer"
							logo={{
								brandSrc: "/images/logo-lockup-light.svg",
								mark: "lockup",
								src: "/images/logo-lockup.svg",
							}}
							onNavigate={onNavigate}
							social={SOCIAL}
							tone={tone}
						/>
					</LabFrame>
				</div>
			</LabSection>

			<RulesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

const RULES: { body: string; title: string }[] = [
	{
		body: "A social link renders as a glyph and nothing else, so `label` is required and becomes the accessible name. The type is a union of platform and icon rather than two optional fields, so 'neither was supplied' - which renders a 44px hole nobody notices until they look at a phone - cannot be written down.",
		title: "Icon-only links carry their own name",
	},
	{
		body: "24px glyph, 44px target. These are the smallest tap targets on the page and they sit in a row, which is the exact combination that produces a mis-tap. Nothing is drawn around the circle at rest - the hit area is not a button.",
		title: "The social targets are bigger than the glyphs",
	},
	{
		body: "The marks are inline components with fill=currentColor, not files in /public. An <img> is a replaced element, so an asset with its colour baked in is correct on exactly one of the three tones. Lucide covers three of the four and will never carry TikTok - it does not do brand marks - and three Lucide strokes beside one drawn fill is the icon-consistency failure.",
		title: "The glyphs are inline, one set, one weight",
	},
	{
		body: "External links get rel=noreferrer, target=_blank and the words 'opens in a new tab'; internal ones are TanStack Links, so they prefetch and never reload the app. The landing page's hand-rolled footer had neither - every link in it was a bare <a href> to another origin.",
		title: "External and internal links are different objects",
	},
	{
		body: "A footer is a list of places you can go, read at the end of a page you are already on. Lighting the current page answers a question nobody asked and costs the row its evenness - which is why nothing here takes an activeHref, unlike the header. aria-current still has to be truthful, so the links match EXACTLY: the router's default prefix match had Components announcing itself as the current page from every page under /components, and the Features hash item doing the same from the moment you landed on the page its section lives in.",
		title: "Nothing is styled for the current page",
	},
	{
		body: "There is no sticky or fixed variant and there will not be one. A bar pinned to the bottom of the viewport is a toolbar, and a toolbar holding a cookie policy is 56px of every screen spent on the least urgent content the site has.",
		title: "The footer is never pinned",
	},
	{
		body: "It is a @container, not a viewport listener - the footer rearranges off the width it was GIVEN, which in production is the viewport and in this lab is a 390px frame on a 1280px screen. Same call AppSiteHeader and AppKpi make.",
		title: "Breakpoints are container queries",
	},
	{
		body: "`--focus` is `--brand-primary`, the brand as INK, solved against a light page - so on the brand's own dark fill it is the one ring that lands dark-on-dark. The brand tone swaps it for the paired foreground, because a focus ring is held to 3:1 like any other UI boundary.",
		title: "The focus ring changes with the tone",
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
 * A labelled box standing in for a viewport.
 *
 * Simpler than the header lab's `DeviceFrame`, and the difference is the whole
 * point of the component: the header has a FIXED variant, so its frame needs
 * `transform-gpu` to become the containing block and its own scroller to keep
 * the bar off the page's toolbar. A footer is in the flow at every width, so
 * the frame is a box with a border and an `@container` context - which is the
 * part that matters, since the two columns of the brand section are each about
 * half the page and would otherwise resolve their breakpoints against the lab.
 */
function LabFrame({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
	return (
		<div className={className ?? "w-full"}>
			<p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
			<div className="@container mt-1 overflow-hidden rounded-3xl border border-border">{children}</div>
		</div>
	);
}
