import type { BreadcrumbItem } from "@bernardsapida/web-ui";
import { AppBreadcrumbs, AppButton, AppGlassCard, AppPageHeader, BREADCRUMB_MIN_LEVELS } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Breadcrumbs lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The trails below are a synthetic hierarchy laid over real lab pages, so every
 * crumb actually navigates - the depth is invented, the destinations are not.
 *
 * Three things a screenshot will not show.
 *
 * 1. **Narrow the window.** Past `@xs` of the trail's own CONTAINER - not the
 *    window - the whole thing becomes one back affordance naming the parent
 *    level. A container query, because in a header bar the trail gets what is
 *    left after a hamburger and two actions, which is nothing like the width of
 *    the page around it.
 * 2. **Switch Placement.** The same trail at one or two levels renders nothing
 *    above a page title and renders in full inside a header bar. That is not an
 *    inconsistency: above an `h1` a two-level trail repeats the heading, and in
 *    a bar the trail IS the title. `minLevels` is the prop that says which.
 * 3. **Tab into a collapsed trail.** The ellipsis has to be a real menu of what
 *    it swallowed, opening on Enter, or it is just a glyph claiming there is
 *    more.
 */
export const Route = createFileRoute("/(references)/components/breadcrumbs")({
	head: () => ({
		meta: [{ title: seo.title("Breadcrumbs lab") }, { content: "noindex", name: "robots" }],
	}),
	component: BreadcrumbsLabPage,
});

function BreadcrumbsLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle='The trail answers "where am I?". If a screen is using it to answer "where can I go?", that screen is missing its navigation.'
				title="Breadcrumbs lab"
			/>
			<DepthSection />
			<ContentSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
}

function LabSection({ children, description, title }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

/** A frame, so a trail that renders nothing is visibly nothing rather than missing. */
function Stage({ children }: { children: ReactNode }) {
	return <div className="min-h-11 rounded-2xl border border-dashed border-border px-3 py-2">{children}</div>;
}

/* -------------------------------------------------------------------------- */

const TRAIL: BreadcrumbItem[] = [
	{ href: "/components", key: "components", label: "Components" },
	{ href: "/components/table", key: "table", label: "Table" },
	{ href: "/components/tracking", key: "tracking", label: "Tracking" },
	{ href: "/components/search-bar", key: "search", label: "Search bar" },
	{ href: "/components/users-list", key: "users", label: "Users list" },
	{ key: "breadcrumbs", label: "Breadcrumbs" },
];

/** The last N levels of the trail, so the current page stays last. */
function depth(levels: number): BreadcrumbItem[] {
	return [TRAIL[0], ...TRAIL.slice(TRAIL.length - (levels - 1))];
}

/*
 * 5 is the interesting one and it was missing: `maxVisible` is 4, so the
 * ellipsis appears the moment there are FIVE levels. Jumping 4 → 6 made
 * collapsing look like it started at six, which is the sort of off-by-one a
 * reader then carries into their own config.
 */
const DEPTHS = [1, 2, 3, 4, 5, 6];

function DepthSection() {
	const [levels, setLevels] = useState(6);
	const [placement, setPlacement] = useState<"bar" | "standalone">("standalone");

	const minLevels = placement === "bar" ? 1 : BREADCRUMB_MIN_LEVELS;

	return (
		<LabSection
			description="Two things at once: how deep the trail is, and WHERE it is standing. The middle collapses into a menu from FIVE levels up - maxVisible is 4, so five is the first depth that does not fit - and what survives is the root and the last two. The swallowed levels stay reachable, because an ellipsis that is not a control is a lie about there being more."
			title="Depth, and where the trail is standing"
		>
			<div className="space-y-2">
				<p className="text-xs font-semibold tracking-wide text-muted uppercase">Levels</p>
				<div className="flex flex-wrap gap-2">
					{DEPTHS.map((value) => (
						<AppButton
							data-cy={`depth-${value}`}
							key={value}
							onPress={() => setLevels(value)}
							size="sm"
							variant={levels === value ? "primary" : "secondary"}
						>
							{value === 1 ? "1 level" : `${value} levels`}
						</AppButton>
					))}
				</div>
			</div>

			<div className="space-y-2">
				<p className="text-xs font-semibold tracking-wide text-muted uppercase">Placement</p>
				<div className="flex flex-wrap gap-2">
					<AppButton
						data-cy="placement-standalone"
						onPress={() => setPlacement("standalone")}
						size="sm"
						variant={placement === "standalone" ? "primary" : "secondary"}
					>
						Above a page title
					</AppButton>
					<AppButton
						data-cy="placement-bar"
						onPress={() => setPlacement("bar")}
						size="sm"
						variant={placement === "bar" ? "primary" : "secondary"}
					>
						In a header bar
					</AppButton>
				</div>
				<p className="text-sm text-muted">
					The same component, and the opposite correct answer at one and two levels. <strong>Above a page title</strong>{" "}
					it renders nothing under three: <code className="font-mono">&quot;Home &gt; Page&quot;</code> is a row of
					chrome saying what the <code className="font-mono">h1</code> underneath already said.{" "}
					<strong>In a header bar</strong> there is no <code className="font-mono">h1</code> beside it - the trail IS
					the bar&apos;s content, and it doubles as the page title - so it passes{" "}
					<code className="font-mono">minLevels={"{1}"}</code> and shows every depth. Suppressing it there leaves an
					empty strip with a hamburger and two icons floating in it. That is why this is a prop and not a constant.
				</p>
			</div>

			{/*
			 * The note goes INSIDE the frame, in the space the trail would have
			 * occupied. Under it, an empty box reads as a component that failed
			 * to render rather than one that declined to.
			 */}
			<Stage>
				{levels < minLevels ? (
					<p className="text-sm text-muted italic">
						Nothing rendered - above a page title the component returns null below three levels rather than leaving
						every caller to remember the rule. Switch Placement to a header bar and this same trail appears.
					</p>
				) : (
					<AppBreadcrumbs
						data-cy="depth"
						items={depth(levels)}
						minLevels={minLevels}
					/>
				)}
			</Stage>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const RECORD_NAME = "Manila Bayside Warehouse - East Wing";

function ContentSection() {
	const [isLoaded, setIsLoaded] = useState(false);

	const items: BreadcrumbItem[] = [
		{ href: "/components", key: "home", label: "Home" },
		{ href: "/components/table", key: "warehouses", label: "Warehouses" },
		{
			isPending: !isLoaded,
			key: "warehouse",
			label: isLoaded ? RECORD_NAME : "",
			pendingWidthCh: 24,
		},
	];

	return (
		<LabSection
			description="A dynamic segment shows the record's name once it loads and a skeleton of roughly that width before - never the id, and never a jump in width when the name arrives. The name itself truncates in the MIDDLE, because two wings of the same warehouse are the same string until the last few characters; hover it for the full text, and a screen reader gets the full text either way."
			title="Dynamic segments and long names"
		>
			<div className="flex flex-wrap gap-2">
				<AppButton
					data-cy="record-loading"
					onPress={() => setIsLoaded(false)}
					size="sm"
					variant={isLoaded ? "secondary" : "primary"}
				>
					Loading
				</AppButton>
				<AppButton
					data-cy="record-loaded"
					onPress={() => setIsLoaded(true)}
					size="sm"
					variant={isLoaded ? "primary" : "secondary"}
				>
					Loaded
				</AppButton>
			</div>

			<Stage>
				<AppBreadcrumbs
					data-cy="record"
					items={items}
				/>
			</Stage>
		</LabSection>
	);
}
