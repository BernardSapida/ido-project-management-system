import type { MainWidth } from "@bernardsapida/web-ui";
import { AppButton, AppMain, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";
import { LabSection } from "@/features/labs/components/LabSection";

const TITLE = "App main";

/**
 * App main lab - the content region.
 *
 * The point of this page is mostly what the component does NOT do. There is no
 * grid in `AppMain` and no vertical rhythm: a KPI row, a table, a form and a
 * reading column have nothing in common except that they sit in the middle, so
 * the frame hands the page a canvas of the right width and the page draws on it.
 *
 * Things to check by hand:
 *
 * 1. **Switch the width.** The measure is the one decision this component makes,
 *    and it belongs to the ROUTE rather than the frame - App Layout reads it
 *    from `staticData.mainWidth`, the same mechanism `breadcrumb` already uses.
 * 2. **The specimens below are renamed.** In the app this region carries
 *    `MAIN_CONTENT_ID` and is the one thing the skip link points at; a page with
 *    two of them has two "main content"s and an invalid duplicate id. The lab
 *    has two, so both are given their own `id` and `label` - the same escape
 *    hatch `AppSidebar` opens with `navLabel`, for the same reason.
 * 3. **Change the fade key.** The content cross-fades. App Layout passes the
 *    active SECTION rather than the pathname - changing destination is a change
 *    of place; moving around inside one is not.
 */
export const Route = createFileRoute("/(references)/components/app-main")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: AppMainLab,
});

const WIDTHS: { blurb: string; value: MainWidth }[] = [
	{
		blurb: "Reading. ~65 characters, the measure prose stops being comfortable past.",
		value: "prose",
	},
	{
		blurb: "Most screens. Room for a two- or three-column grid, short enough to scan.",
		value: "default",
	},
	{
		blurb: "Dense grids that still want a margin on a very large monitor.",
		value: "wide",
	},
	{
		blurb: "Dashboards and data tables, where the width IS the feature. No cap.",
		value: "full",
	},
];

function AppMainLab() {
	const [width, setWidth] = useState<MainWidth>("default");
	const [section, setSection] = useState("/dashboard");

	const active = WIDTHS.find((option) => option.value === width);

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The landmark, the measure, and nothing else. What goes inside is the page's business - which is the whole design, not a gap in it."
				title="App main lab"
			/>

			<LabSection
				description="The measure is the one decision AppMain makes. It belongs to the ROUTE rather than the frame, because a dashboard of tiles, a settings page and an article want different answers on the same screen - so App Layout will read it from staticData.mainWidth, exactly the way useRouteBreadcrumbs already reads staticData.breadcrumb. No page has to wrap itself in a container to get it."
				title="The measure"
			>
				<div className="flex flex-wrap gap-2">
					{WIDTHS.map((option) => (
						<AppButton
							data-cy={`width-${option.value}`}
							key={option.value}
							onPress={() => setWidth(option.value)}
							size="sm"
							variant={width === option.value ? "primary" : "secondary"}
						>
							{option.value}
						</AppButton>
					))}
				</div>
				<p className="text-sm text-muted">{active?.blurb}</p>

				<Stage>
					<AppMain
						data-cy="main"
						id="main-measure-specimen"
						label="Measure specimen"
						width={width}
					>
						<div className="space-y-3 rounded-2xl border border-dashed border-border p-3">
							<p className="text-xs font-semibold tracking-wide text-muted uppercase">The page draws here</p>
							{/*
							 * A grid the PAGE owns, not the frame. It is here to prove the
							 * point: AppMain has no opinion about it, and a different screen
							 * would put a table or a reading column in the same space.
							 */}
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{Array.from({ length: 6 }, (_, index) => (
									<div
										className="h-20 rounded-2xl bg-muted-surface"
										key={`tile-${index}`}
									/>
								))}
							</div>
							<p className="text-sm text-muted">
								This grid is the page&apos;s. <code className="font-mono">AppMain</code> contributes no columns and no
								vertical rhythm - a frame that imposed a grid would be overridden by the first screen wanting two
								columns of different widths, and every page after it would carry an override for a rule that never
								fitted.
							</p>
						</div>
					</AppMain>
				</Stage>
			</LabSection>

			<LabSection
				description="Change the destination and the content cross-fades. App Layout passes the active SECTION rather than the pathname: moving between destinations is a change of place and reads better with a beat, moving around inside one is not. A fade rather than a slide, because destinations are peers - a horizontal slide claims one is 'after' another, which is the transition a drill-down owns."
				title="The change of destination"
			>
				<div className="flex flex-wrap gap-2">
					{["/dashboard", "/reports", "/assets"].map((href) => (
						<AppButton
							data-cy={`section-${href}`}
							key={href}
							onPress={() => setSection(href)}
							size="sm"
							variant={section === href ? "primary" : "secondary"}
						>
							{href}
						</AppButton>
					))}
				</div>

				<Stage>
					<AppMain
						data-cy="main-fade"
						fadeKey={section}
						id="main-fade-specimen"
						label="Transition specimen"
						width="default"
					>
						<div className="space-y-3">
							<div className="h-8 w-2/3 rounded-xl bg-muted-surface" />
							<div className="h-20 rounded-2xl bg-muted-surface" />
							<p className="text-xs text-muted">
								Rendering <code className="font-mono">{section}</code>.
							</p>
						</div>
					</AppMain>
				</Stage>
			</LabSection>

			<RulesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

const RULES: { body: string; title: string }[] = [
	{
		body: "No grid, no space-y, no opinion about the page. A KPI row, a table, a form and a reading column have nothing in common except sitting in the middle. The frame gives a canvas of the right width; the page draws on it.",
		title: "It does not lay out the page",
	},
	{
		body: "One <main> per page, carrying MAIN_CONTENT_ID so the skip link has somewhere to land and tabIndex={-1} so focus can actually go there. Two landmarks is a screen reader with two 'main content's to choose between; none is a skip link pointing at nothing.",
		title: "One landmark",
	},
	{
		body: "prose for reading, default for most screens, wide for dense grids, full where the width IS the feature. It belongs to the route, not the frame - App Layout reads staticData.mainWidth, the same mechanism breadcrumbs already use.",
		title: "The measure is the one decision",
	},
	{
		body: "The cap sits on an inner element rather than on <main> itself, so the landmark still spans the region while the content centres inside it. Put max-w on the landmark and a page's own full-bleed section - a hero, a sticky toolbar - has nothing left to bleed into.",
		title: "Why the cap is not on the landmark",
	},
	{
		body: "Keyed rather than hand-animated, so a page cannot forget it or run a different one. Keyed on the SECTION, not the pathname: a detail screen inside a section is not a change of place.",
		title: "The transition",
	},
	{
		body: "Only the frames that have a fixed bottom bar ask for the padding, and it includes env(safe-area-inset-bottom). It is exposed as --tab-bar-height so a sticky page CTA stacks ABOVE the bar by reading the same number rather than guessing it.",
		title: "Room for a bottom bar",
	},
];

function RulesSection() {
	return (
		<LabSection
			description="What the region owns, and the much longer list of what it leaves alone."
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

/**
 * A box standing in for the frame around `main`.
 *
 * The specimens inside are REAL `<main>` elements, so this page carries more
 * than one - a rule the lab breaks to show the component, the way the
 * navigation lab renders more than one nav. Both are renamed and re-`id`d so
 * neither collides with the shell's own region or with each other.
 */
function Stage({ children }: { children: ReactNode }) {
	return <div className="rounded-3xl border border-border bg-background p-4">{children}</div>;
}
