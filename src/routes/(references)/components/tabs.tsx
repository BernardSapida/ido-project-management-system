import {
	AppButton,
	AppGlassCard,
	AppInputGroup,
	AppPageHeader,
	AppReadOnlyField,
	AppSwitch,
	AppTabs,
} from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { seo } from "@/config/seo.config";

/**
 * Tabs lab. Developer reference under /components, which owns the backdrop and
 * the nav; every page there is noindex.
 *
 * The settings page at the top is the point of this one. Tabs are never a
 * control on their own - they are the frame around panels that each have their
 * own content, their own loading and their own way of failing, and none of that
 * is visible in a row of tabs holding one line of placeholder text each.
 *
 * Two things to check by hand:
 *
 * 1. Click the tab that is ALREADY selected, on the "controlled" section. The
 *    change counter must not move. React Aria fires `onSelectionChange` on
 *    re-selection, and callers routinely hang a fetch or a URL write off it -
 *    so without the guard inside AppTabs, clicking the active tab refetches,
 *    and a handler that sets state from the key loops.
 * 2. Tab into the list, then use the arrow keys. One tab stop for the whole
 *    list, arrows between tabs, and the panel is the next stop after it.
 */
export const Route = createFileRoute("/(references)/components/tabs")({
	head: () => ({
		meta: [{ title: seo.title("Tabs lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Tabs" },
	component: TabsLabPage,
});

function TabsLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Peer views of one subject, one visible at a time."
				title="Tabs lab"
			/>
			<SettingsSection />
			<PanelFailureSection />
			<ControlledSection />
			<DisabledSection />
			<NamingSection />
			<NotAStepperSection />
			<OverflowSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* The assembly                                                               */
/* -------------------------------------------------------------------------- */

/** Where tabs actually live. Everything below this is reference. */
function SettingsSection() {
	// `useForm`, not `useAppForm`, deliberately: a `control` for the specimen, not
	// a form. Nothing here is submitted. See the note in date-picker.tsx.
	const { control } = useForm({
		defaultValues: {
			displayName: "Maria Santos",
			digest: true,
			mentions: false,
			timezone: "Asia/Manila",
		},
	});

	return (
		<LabSection
			description="A settings page, which is where most tab lists in an application end up. Each panel is a real section with real fields rather than a line of placeholder text, because the thing worth looking at is what happens to the layout when the panels disagree about their height - and a row of one-line panels can never show it. Billing is disabled with its reason stated beside the list, since the tab itself cannot be hovered for a tooltip."
			title="In a settings page"
			usedIn={["Account settings", "Workspace admin", "Any detail page with peer sections"]}
		>
			<AppTabs
				data-cy="settings"
				disabledKeys={["billing"]}
				items={[
					{
						key: "profile",
						label: "Profile",
						content: (
							<div className="grid gap-4 sm:grid-cols-2">
								<AppInputGroup
									control={control}
									data-cy="settings-name"
									label="Display name"
									name="displayName"
								/>
								<AppInputGroup
									control={control}
									label="Timezone"
									name="timezone"
								/>
								<AppReadOnlyField
									className="sm:col-span-2"
									description="Changing this needs a verification email, so it is not editable here."
									label="Email"
									value="maria.santos@example.com"
								/>
							</div>
						),
					},
					{
						key: "notifications",
						label: "Notifications",
						content: (
							<div className="flex flex-col gap-3">
								<AppSwitch
									control={control}
									label="Weekly digest"
									name="digest"
								/>
								<AppSwitch
									control={control}
									label="Someone mentions me"
									name="mentions"
								/>
								<p className="text-sm text-muted">
									A shorter panel than the one beside it, on purpose. The list must not jump when you move between them.
								</p>
							</div>
						),
					},
					{
						key: "billing",
						label: "Billing",
						content: <Panel>Not reachable - this tab is disabled.</Panel>,
					},
				]}
				label="Account settings"
			/>
			<p className="text-sm text-muted">
				Billing is unavailable on this plan. A disabled tab says the view exists and why you cannot have it; if there is
				no why to give, remove the tab instead - a permanently dead tab is furniture.
			</p>
		</LabSection>
	);
}

/**
 * The state a tab list reaches that a prop matrix never shows: one panel is
 * broken and the rest of the page is fine.
 */
function PanelFailureSection() {
	const [isBroken, setIsBroken] = useState(true);

	return (
		<LabSection
			description="One panel failed to load; its siblings did not. The failure is drawn INSIDE the panel, so the tab list still works and the other views are still reachable - a component that took the whole page down with it would have cost the user two working views to report one broken one. The tab itself is not marked: there is no way to know a panel will fail until it is opened."
			title="When one panel fails"
			usedIn={["Any tab whose panel fetches its own data"]}
		>
			<AppTabs
				data-cy="failure"
				items={[
					{
						key: "summary",
						label: "Summary",
						content: <Panel>This one loaded. It keeps working while the one beside it does not.</Panel>,
					},
					{
						key: "activity",
						label: "Activity",
						content: isBroken ? (
							<div
								className="flex flex-col items-start gap-3 rounded-2xl border border-border p-4"
								data-cy="failure-panel-error"
							>
								<div className="flex items-center gap-2 text-sm font-medium">
									<WifiOff
										aria-hidden="true"
										className="size-4 text-danger"
									/>
									Couldn&apos;t load activity
								</div>
								<p className="text-sm text-muted">
									Check your connection and try again. Nothing here was lost - the other tabs are unaffected.
								</p>
								<AppButton
									data-cy="failure-retry"
									icon={RefreshCw}
									onPress={() => setIsBroken(false)}
									size="sm"
									variant="secondary"
								>
									Try again
								</AppButton>
							</div>
						) : (
							<Panel>Loaded on the second attempt. 14 events in the last day.</Panel>
						),
					},
					{
						key: "members",
						label: "Members",
						content: <Panel>Six people, three of them admins.</Panel>,
					},
				]}
				label="Project views"
			/>
			<AppButton
				data-cy="failure-break"
				isDisabled={isBroken}
				onPress={() => setIsBroken(true)}
				size="sm"
				variant="secondary"
			>
				Break it again
			</AppButton>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */
/* Reference                                                                  */
/* -------------------------------------------------------------------------- */

function Panel({ children }: { children: ReactNode }) {
	return <div className="rounded-2xl border border-border p-4 text-sm text-muted">{children}</div>;
}

/** The guard, made visible as a number that must not move. */
function ControlledSection() {
	const [selectedKey, setSelectedKey] = useState("day");
	const [changes, setChanges] = useState(0);

	return (
		<LabSection
			description="The counter is incremented by onSelectionChange. Click 'Day' three times while Day is active: it stays at whatever it was. Then move to Week and it goes up by exactly one. That difference is the whole reason this component wraps HeroUI's Tabs instead of re-exporting it."
			title="Controlled, and re-selection is silent"
			usedIn={["Any tab that triggers a fetch or writes to the URL"]}
		>
			<AppTabs
				data-cy="controlled"
				items={[
					{
						key: "day",
						label: "Day",
						content: <Panel>24 hours, hourly buckets.</Panel>,
					},
					{
						key: "week",
						label: "Week",
						content: <Panel>7 days, daily buckets.</Panel>,
					},
					{
						key: "month",
						label: "Month",
						content: <Panel>30 days, daily buckets.</Panel>,
					},
				]}
				label="Report range"
				onSelectionChange={(key) => {
					setSelectedKey(key);
					setChanges((count) => count + 1);
				}}
				selectedKey={selectedKey}
			/>
			<p className="text-sm text-muted">
				Selected:{" "}
				<span
					className="font-medium"
					data-cy="controlled-key"
				>
					{selectedKey}
				</span>{" "}
				· onSelectionChange fired:{" "}
				<span
					className="font-medium"
					data-cy="controlled-changes"
				>
					{changes}
				</span>
			</p>
		</LabSection>
	);
}

function DisabledSection() {
	return (
		<LabSection
			description="Arrow-key navigation skips the disabled tab rather than landing on it and refusing to open - a stop that does nothing is worse than no stop. Tab into the list and hold the right arrow to watch it pass over Billing."
			title="Disabled keys"
			usedIn={["Plan-gated sections", "Permissions the current role lacks"]}
		>
			<AppTabs
				data-cy="disabled"
				disabledKeys={["billing"]}
				items={[
					{
						key: "profile",
						label: "Profile",
						content: <Panel>Name, avatar, timezone.</Panel>,
					},
					{
						key: "security",
						label: "Security",
						content: <Panel>Password and sessions.</Panel>,
					},
					{
						key: "billing",
						label: "Billing",
						content: <Panel>Not reachable - this tab is disabled.</Panel>,
					},
				]}
				label="Account sections"
			/>
		</LabSection>
	);
}

/** Why `label` is required rather than optional with a default. */
function NamingSection() {
	return (
		<LabSection
			description="Two tab sets on one page. `label` is required precisely for this: both announced as 'Tabs' would be two controls sharing one name, and a screen-reader user arrowing between them could not tell which set they had landed in."
			title="Every list needs its own name"
			usedIn={["Any page with more than one tab list"]}
		>
			<div className="grid gap-6 md:grid-cols-2">
				<AppTabs
					data-cy="named-display"
					items={[
						{ key: "table", label: "Table", content: <Panel>Rows.</Panel> },
						{ key: "chart", label: "Chart", content: <Panel>A line.</Panel> },
					]}
					label="Result display"
				/>
				<AppTabs
					data-cy="named-scope"
					items={[
						{
							key: "mine",
							label: "Mine",
							content: <Panel>Assigned to you.</Panel>,
						},
						{
							key: "all",
							label: "All",
							content: <Panel>Everything in the team.</Panel>,
						},
					]}
					label="Result scope"
				/>
			</div>
		</LabSection>
	);
}

function NotAStepperSection() {
	return (
		<LabSection
			description="Tabs are for content you switch BETWEEN. A sequence with an order, a finish line and a notion of 'done so far' is AppStepper - and if each panel would want its own URL, these are routes, and the nav belongs in the route tree rather than here."
			title="Not a stepper, not a router"
			usedIn={["Read this before reaching for tabs at all"]}
		>
			<div className="flex flex-col gap-3">
				<p className="text-sm text-muted">
					The test: can a user open the third one first? If yes, tabs. If the third only makes sense after the second,
					you want the stepper - a tab list gives no sense of progress and no way to say a step is incomplete.
				</p>
				<p className="text-sm text-muted">
					Second test: should a reload land back where they were? If yes, that state belongs in the URL, which means
					routes.
				</p>
			</div>
		</LabSection>
	);
}

/** The case a lab has to include because a real screen will hit it. */
function OverflowSection() {
	return (
		<LabSection
			description="Eight tabs in a narrow column. Shrink the window and watch what the list does at the edge - whether it scrolls, wraps or truncates is the thing to decide about this component, and right now it is HeroUI's default rather than a choice anyone made."
			title="Too many tabs"
			usedIn={["Admin screens that grew a section at a time"]}
		>
			<div className="max-w-sm">
				<AppTabs
					data-cy="overflow"
					items={[
						"Overview",
						"Activity",
						"Members",
						"Billing",
						"Integrations",
						"Webhooks",
						"Audit log",
						"Danger zone",
					].map((label) => ({
						key: label.toLowerCase().replace(/\s+/g, "-"),
						label,
						content: <Panel>{label}</Panel>,
					}))}
					label="Workspace settings"
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
	/** Where this shape is used on a real screen. A specimen with no stated
	 *  purpose is a screenshot. */
	usedIn?: string[];
}

function LabSection({ children, description, title, usedIn }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
					{usedIn ? (
						<ul className="mt-2 flex flex-wrap gap-1.5">
							{usedIn.map((use) => (
								<li
									className="rounded-full bg-muted-surface px-2.5 py-0.5 text-xs text-muted"
									key={use}
								>
									{use}
								</li>
							))}
						</ul>
					) : null}
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
