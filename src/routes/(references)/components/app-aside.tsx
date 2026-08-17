import { AppAside, AppButton, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";
import { LabSection } from "@/features/labs/components/LabSection";
import { cn } from "@/utils/cn";

const TITLE = "App aside";

/**
 * App aside lab - the supporting pane.
 *
 * The whole component is one decision repeated: what is allowed in here. The
 * layout part is small - a column on the right that stacks below when there is
 * no room - and the part that goes wrong is putting a subject in it that should
 * have been a page.
 *
 * Things to check by hand:
 *
 * 1. **Narrow the window past `xl`.** The pane leaves the row and lands under
 *    the content, full width, still in reading order. It does not vanish and it
 *    does not become a second overlay.
 * 2. **Scroll the tall specimen.** Above `xl` the pane is sticky and scrolls
 *    inside itself; it can never be taller than the viewport, so its foot is
 *    always reachable.
 * 3. **Switch the surface.** Floating is a glass card in a padded row; flush
 *    meets the edge with a hairline - and the hairline MOVES: on top when the
 *    pane is stacked, on the left when it is beside the content.
 * 4. **Turn the pane off.** The row is two columns, not two columns and a hole.
 */
export const Route = createFileRoute("/(references)/components/app-aside")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: AppAsideLab,
});

function AppAsideLab() {
	const [surface, setSurface] = useState<"flush" | "floating">("floating");
	const [hasAside, setHasAside] = useState(true);

	const isFloating = surface === "floating";

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A second column beside the main content, holding the things that only mean something next to it. Optional in every layout, and the hardest part is not the column - it is what you are allowed to put in it."
				title="App aside lab"
			/>

			<LabSection
				description="Both specimens below read these."
				title="The controls"
			>
				<Control label="Surface">
					<AppButton
						data-cy="aside-floating"
						onPress={() => setSurface("floating")}
						size="sm"
						variant={isFloating ? "primary" : "secondary"}
					>
						Floating
					</AppButton>
					<AppButton
						data-cy="aside-flush"
						onPress={() => setSurface("flush")}
						size="sm"
						variant={isFloating ? "secondary" : "primary"}
					>
						Flush
					</AppButton>
				</Control>

				<Control label="Pane">
					<AppButton
						data-cy="aside-on"
						onPress={() => setHasAside(true)}
						size="sm"
						variant={hasAside ? "primary" : "secondary"}
					>
						Shown
					</AppButton>
					<AppButton
						data-cy="aside-off"
						onPress={() => setHasAside(false)}
						size="sm"
						variant={hasAside ? "secondary" : "primary"}
					>
						Absent
					</AppButton>
				</Control>
				<p className="text-sm text-muted">
					Turn it off and the row is two columns rather than two columns and a hole. The pane carries its own width, so
					a layout that renders nothing here does not have to remember to collapse a track - an empty third of the
					screen reads worse than a page that never had one.
				</p>
			</LabSection>

			<LabSection
				description="Above @4xl of the ROW the pane is a 20rem column on the RIGHT - always the right, because left is navigation's edge and a supporting pane arriving there competes with the sidebar for what that side of the screen means. Below that it leaves the row and stacks under the content, full width and still in reading order: after the thing it supports, which is the order it should be read in anyway. Narrow this window to watch it move - the query is on the row, not the window. The breakpoint is @4xl of the row rather than Material's md because this layout has already given ~260px to a sidebar, so three columns do not fit at 48rem the way two would."
				title="Beside the content, then under it"
			>
				<Frame>
					<main className="min-w-0 flex-1 space-y-3">
						<div className="h-8 w-2/3 rounded-xl bg-muted-surface" />
						<div className="h-24 rounded-2xl bg-muted-surface" />
						<div className="h-24 rounded-2xl bg-muted-surface" />
					</main>
					{hasAside ? (
						<AppAside
							data-cy="aside"
							title="Filters"
							variant={surface}
						>
							<div className="space-y-2">
								<div className="h-9 rounded-xl bg-muted-surface" />
								<div className="h-9 rounded-xl bg-muted-surface" />
								<div className="h-9 rounded-xl bg-muted-surface" />
							</div>
							<p className="mt-3 text-xs text-muted">
								These act on the list beside them. Alone they mean nothing, which is the test for whether something
								belongs in here.
							</p>
						</AppAside>
					) : null}
				</Frame>
			</LabSection>

			<LabSection
				description="A pane taller than the screen. Above @4xl it is sticky and scrolls inside itself, so its foot is always reachable and it never pushes the page taller than the content does. Scroll this frame and watch the main column move under a pane that stays put."
				title="When the pane is long"
			>
				<Frame className="h-[26rem] overflow-y-auto">
					<main className="min-w-0 flex-1 space-y-3">
						{Array.from({ length: 8 }, (_, index) => (
							<div
								className="h-24 rounded-2xl bg-muted-surface"
								key={`row-${index}`}
							/>
						))}
					</main>
					{hasAside ? (
						<AppAside
							data-cy="aside-tall"
							title="Activity"
							variant={surface}
						>
							<ol className="space-y-2 text-sm text-muted">
								{Array.from({ length: 12 }, (_, index) => (
									<li key={`event-${index}`}>Something happened, {index + 1} hours ago.</li>
								))}
							</ol>
						</AppAside>
					) : null}
				</Frame>
			</LabSection>

			<RulesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

const RULES: { body: string; title: string }[] = [
	{
		body: "Material's canonical layouts draw the line at whether the content stands alone. A supporting pane holds what is meaningful only in relation to the primary content: the filters acting on this list, the activity on this record, the help for this form.",
		title: "What it is for",
	},
	{
		body: "It is a page, and it needs a URL. A pane cannot be linked to, bookmarked or shared, so putting a subject in one hides it from every route into the app except the screen it hangs off.",
		title: "If it stands on its own",
	},
	{
		body: "It is AppDialog. A pane that exists to be answered and then dismissed is a dialog that forgot to be modal - and it will be ignored, because nothing about a side panel says a decision is waiting.",
		title: "If it is one question",
	},
	{
		body: "That is list-detail, not a supporting pane, and the detail deserves the larger half rather than a third. The two look identical in a mockup and behave nothing alike once the record is the thing the user came for.",
		title: "If it is the record you selected",
	},
	{
		body: "Always the right. Left is navigation's edge - the same rule AppDrawer states - and a supporting pane arriving there competes with the sidebar for what that side of the screen means.",
		title: "Which side",
	},
	{
		body: "It stacks BELOW the main content rather than vanishing or becoming a second overlay. Material offers a sheet for compact widths; these layouts have already spent their overlay on navigation, and a drawer over a drawer is the shape they exist to avoid.",
		title: "When there is no room",
	},
	{
		body: "Sticky above @4xl of its row, with its own scroll and a dvh-based cap, so it is never taller than the viewport and its foot is always reachable. dvh rather than vh because a mobile URL bar makes 100vh overshoot.",
		title: "It never outgrows the screen",
	},
	{
		body: "The pane carries its own width, so a layout that renders nothing here gets a two-column row without having to collapse a track. An empty third of the screen reads worse than a page that never had one.",
		title: "Optional, and cheap to omit",
	},
];

function RulesSection() {
	return (
		<LabSection
			description="What is allowed in the pane, in the order the argument usually goes."
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

function Control({ children, label }: { children: ReactNode; label: string }) {
	return (
		<div className="space-y-2">
			<p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
			<div className="flex flex-wrap gap-2">{children}</div>
		</div>
	);
}

/**
 * The content row: a column and an optional pane.
 *
 * `@container` plus `flex-col @4xl:flex-row` is the whole responsive rule. A
 * CONTAINER query, not a viewport one: this row is often much narrower than the
 * window - inside a frame, or beside a sidebar - and a viewport `xl:` there says
 * "plenty of room" while the actual space is 475px. The pane is last in the DOM,
 * so stacking puts it under the content without anything reordering.
 *
 * The two live on SEPARATE elements because a container query never sees the
 * container-type on its own element - only on an ancestor. Together they read as
 * one rule and behave as two: the row asking whatever box happens to be outside
 * it, the pane inside asking this one, and the pair disagreeing at exactly the
 * widths the rule exists for.
 */
function Frame({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div className={cn("@container rounded-3xl border border-border bg-background p-4", className)}>
			<div className="flex flex-col gap-4 @4xl:flex-row">{children}</div>
		</div>
	);
}
