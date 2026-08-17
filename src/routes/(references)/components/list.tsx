import type { EmptyReason, ListItem } from "@bernardsapida/web-ui";
import { AppButton, AppGlassCard, AppList, AppPageHeader, AppToast } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	Building2,
	CircleCheck,
	Clock,
	FileText,
	Package,
	Pencil,
	ShieldCheck,
	Trash2,
	TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * List primitive lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The thing to check here is the pair of shapes a row can take, and that they
 * are never mixed: a pressable list where the row is the target and the only
 * other control is a menu, and an inert list where the row leads nowhere and
 * the icon buttons are the targets. Tab through both - the pressable one is one
 * stop per row plus its menu, and the ring lands on the whole row, not on three
 * words of its title.
 */
export const Route = createFileRoute("/(references)/components/list")({
	head: () => ({
		meta: [{ title: seo.title("List lab") }, { content: "noindex", name: "robots" }],
	}),
	component: ListLabPage,
});

function ListLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Four slots per row - leading, primary, secondary, trailing - on one surface with hairline separators. The users list is one configuration of this."
				title="List lab"
			/>
			<PressableSection />
			<InertSection />
			<SelectionSection />
			<ReorderSection />
			<StatesSection />
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

/* -------------------------------------------------------------------------- */

const WAREHOUSES: ListItem[] = [
	{
		chip: { icon: CircleCheck, label: "Verified", tone: "success" },
		key: "qc-north",
		leading: { icon: Building2, kind: "icon" },
		meta: "12 bays",
		nameDetail: "Quezon City",
		primary: "Quezon City North Depot",
		secondary: "Seminary Road, Barangay Bahay Toro",
	},
	{
		chip: { icon: Clock, label: "Pending", tone: "warning" },
		key: "makati-hub",
		leading: { icon: Building2, kind: "icon" },
		meta: "4 bays",
		nameDetail: "Makati",
		primary: "Makati Central Hub",
		secondary: "2 Amorsolo Street, Legazpi Village",
	},
	{
		chip: { icon: TriangleAlert, label: "Low stock", tone: "danger" },
		key: "manila-bay",
		leading: { icon: Building2, kind: "icon" },
		meta: "1 bay",
		nameDetail: "Manila",
		primary: "Manila Bayside Warehouse",
		secondary: "Taft Avenue, Ermita",
	},
	{
		chip: { icon: ShieldCheck, label: "Verified", tone: "success" },
		key: "bgc",
		leading: { icon: Building2, kind: "icon" },
		meta: "27 bays",
		nameDetail: "Taguig",
		primary: "BGC Fulfilment Centre",
		secondary: "Rizal Drive corner 32nd Street, BGC",
	},
];

/** The row is the target, and the menu is the one other control allowed in it. */
function PressableSection() {
	return (
		<LabSection
			description="Press anywhere in a row and it opens; press the ⋮ and it does not. The row's button is on the primary line with a stretched ::after over the whole row, so the accessible name is 'Quezon City North Depot, Quezon City' - not every string in the row. The trailing menu sits above that ::after and names its own row, because ten buttons called 'More' is ten controls with one name between them."
			title="Pressable rows, one menu each"
		>
			<AppList
				data-cy="pressable"
				items={WAREHOUSES}
				label="Warehouses"
				onSelectItem={(item) =>
					AppToast.info(item.primary, {
						description: "Opening the warehouse.",
						icon: Building2,
					})
				}
				rowMenu={(item) => [
					{
						items: [
							{
								icon: Pencil,
								key: "edit",
								label: "Edit warehouse",
								onAction: () =>
									AppToast.info(item.primary, {
										description: "Opening the editor.",
										icon: Pencil,
									}),
							},
							{
								icon: FileText,
								key: "duplicate",
								label: "Duplicate",
								onAction: () =>
									AppToast.success(`${item.primary} duplicated`, {
										description: "The lab does not actually change anything.",
										icon: FileText,
									}),
							},
							{
								icon: Trash2,
								isDestructive: true,
								key: "archive",
								label: "Archive warehouse",
								onAction: () =>
									AppToast.warning(`${item.primary} archived`, {
										action: {
											label: "Undo",
											onPress: () =>
												AppToast.success("Restored", {
													description: `${item.primary} is back in the list.`,
													icon: CircleCheck,
												}),
										},
										description: "Nothing was actually archived here.",
										icon: Trash2,
									}),
							},
						],
						key: "manage",
					},
				]}
			/>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** The other half of the type: no row press, so the icon buttons are the targets. */
function InertSection() {
	return (
		<LabSection
			description="The same rows with onSelectItem removed: no chevron, no hover, no pointer cursor - a row that leads nowhere must not look like it does - and the two icon buttons become the only targets. This is the other branch of the union: onSelectItem and actions cannot both be passed, because a pressable row containing a button is invalid HTML and a keyboard cannot resolve it. Hover either icon for the tooltip; the destructive one says the delete is recoverable."
			title="Inert rows, actions as the targets"
		>
			<AppList
				actions={[
					{
						description: "Opens the warehouse's details in a drawer. Nothing is saved until you press Save.",
						icon: Pencil,
						label: "Edit",
						onPress: (item) =>
							AppToast.info(item.primary, {
								description: "Editing.",
								icon: Pencil,
							}),
					},
					{
						description: "Removes it from the list. You get an Undo for a few seconds.",
						icon: Trash2,
						label: "Delete",
						onPress: (item) =>
							AppToast.warning(`${item.primary} deleted`, {
								action: {
									label: "Undo",
									onPress: () =>
										AppToast.success("Restored", {
											description: `${item.primary} is back in the list.`,
											icon: CircleCheck,
										}),
								},
								description: "Nothing was actually deleted here.",
								icon: Trash2,
							}),
						tone: "danger",
					},
				]}
				data-cy="inert"
				items={WAREHOUSES.slice(0, 3)}
				label="Warehouses, read only"
			/>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const CUSTOMERS: ListItem[] = [
	{
		chip: { icon: Package, label: "Express", tone: "danger" },
		key: "emma",
		leading: { kind: "avatar", name: "Emma Wilson" },
		meta: "3 orders",
		nameDetail: "emma.wilson@example.com",
		primary: "Emma Wilson",
		secondary: "Last ordered 4 March 2026",
	},
	{
		chip: { icon: Package, label: "Standard", tone: "accent" },
		key: "daniel",
		leading: { kind: "avatar", name: "Daniel Carter" },
		meta: "11 orders",
		nameDetail: "daniel.carter@example.com",
		primary: "Daniel Carter",
		secondary: "Last ordered 19 January 2026",
	},
	{
		chip: { icon: Package, label: "Economy", tone: "warning" },
		key: "sophia",
		leading: { kind: "avatar", name: "Sophia Anderson" },
		meta: "1 order",
		nameDetail: "sophia.anderson@example.com",
		primary: "Sophia Anderson",
		secondary: "Last ordered 2 December 2025",
	},
];

/** Selection and navigation in one list, kept apart. */
function SelectionSection() {
	const [selected, setSelected] = useState<string[]>(["daniel"]);

	return (
		<LabSection
			description="Pressing the row opens the customer; pressing the checkbox selects them. They are two gestures and never the same one - selecting five people and having the fifth navigate away loses the other four. The checkbox is a sibling of the row's button rather than inside it, which is what makes that true rather than merely intended."
			title="Selection is not navigation"
		>
			<div className="space-y-3">
				<p
					className="text-sm text-muted"
					data-cy="selection-count"
				>
					{selected.length} selected
					{selected.length > 0 ? ` · ${selected.join(", ")}` : ""}
				</p>
				<AppList
					data-cy="selection"
					items={CUSTOMERS}
					label="Customers"
					onSelectItem={(item) =>
						AppToast.info(item.primary, {
							description: "Opening the customer.",
							icon: Package,
						})
					}
					selection={{ onChange: setSelected, selectedKeys: selected }}
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const PRIORITIES: ListItem[] = [
	{
		key: "urgent",
		leading: { icon: TriangleAlert, kind: "icon" },
		meta: "1st",
		primary: "Urgent requests",
		secondary: "Anything flagged in the last 6 hours",
	},
	{
		key: "nearby",
		leading: { icon: Building2, kind: "icon" },
		meta: "2nd",
		primary: "Nearby warehouses",
		secondary: "Within 10km of the address",
	},
	{
		key: "matched",
		leading: { icon: Package, kind: "icon" },
		meta: "3rd",
		primary: "Service level matches",
		secondary: "Exact service before slower ones",
	},
	{
		key: "recent",
		leading: { icon: Clock, kind: "icon" },
		meta: "4th",
		primary: "Recently active customers",
		secondary: "Signed in within the last 30 days",
	},
];

/** Drag AND a keyboard route, because drag alone reorders for some people only. */
function ReorderSection() {
	const [order, setOrder] = useState<string[]>(PRIORITIES.map((item) => item.key));
	const items = order.flatMap((key) => PRIORITIES.filter((item) => item.key === key));

	return (
		<LabSection
			description="Drag a handle with a mouse, or tab to one and press Enter: the row is picked up, the arrow keys move it, Enter drops it and Escape puts it back where it started. Every move is announced in a live region, because the visual order is no feedback at all to a screen reader. Drag-only reordering is unusable by keyboard and unreliable on touch inside a scrolling list, so the keyboard route is not the fallback - it is half the feature."
			title="Reorderable, by drag and by keyboard"
		>
			<AppList
				data-cy="reorder"
				items={items}
				label="Allocation priorities"
				reorder={{ onReorder: setOrder }}
			/>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const EMPTY_COPY: Record<EmptyReason, string> = {
	filtered: "Filters hid every row",
	"no-data": "Nothing added yet",
	"no-results": "Search found nothing",
};

type ListState = "empty-filtered" | "empty-no-data" | "empty-no-results" | "loaded" | "loading";

function emptyReason(state: ListState): EmptyReason {
	if (state === "empty-no-results") return "no-results";
	if (state === "empty-filtered") return "filtered";
	return "no-data";
}

/** Everything other than the happy path, which is where lists ship broken. */
function StatesSection() {
	const [state, setState] = useState<ListState>("loading");

	return (
		<LabSection
			description="The skeleton is three rows at the real row height with the leading circle and both lines already drawn, so nothing moves when the data lands. The three empty states are not interchangeable: someone whose filters hid every row must not be told the system has nothing, or they leave."
			title="Loading and empty"
		>
			<div className="space-y-4">
				<div className="flex flex-wrap gap-2">
					{(["loading", "loaded", "empty-no-data", "empty-no-results", "empty-filtered"] as const).map((value) => (
						<AppButton
							data-cy={`state-${value}`}
							key={value}
							onPress={() => setState(value)}
							size="sm"
							variant={state === value ? "primary" : "secondary"}
						>
							{STATE_LABELS[value]}
						</AppButton>
					))}
				</div>

				<AppList
					data-cy="states"
					empty={{
						action: {
							label: state === "empty-no-data" ? "Add a warehouse" : "Clear filters",
							onPress: () =>
								AppToast.success(EMPTY_COPY[emptyReason(state)], {
									description: "The lab does not actually change anything.",
									icon: Building2,
								}),
						},
						query: state === "empty-no-results" ? "bgc depot" : undefined,
						reason: emptyReason(state),
					}}
					isLoading={state === "loading"}
					items={state === "loaded" ? WAREHOUSES : []}
					label="Warehouses"
					onSelectItem={(item) =>
						AppToast.info(item.primary, {
							description: "Opening the warehouse.",
							icon: Building2,
						})
					}
				/>
			</div>
		</LabSection>
	);
}

const STATE_LABELS: Record<ListState, string> = {
	"empty-filtered": "Filtered out",
	"empty-no-data": "No data",
	"empty-no-results": "No results",
	loaded: "Loaded",
	loading: "Loading",
};

/* -------------------------------------------------------------------------- */

const AWKWARD: ListItem[] = [
	{
		chip: { icon: CircleCheck, label: "Verified", tone: "success" },
		key: "long",
		leading: { icon: Building2, kind: "icon" },
		meta: "142 items",
		nameDetail: "reference ORD-2258",
		primary: "Quezon City North Distribution Centre, Night Desk and Overflow Bays",
		secondary:
			"Seminary Road corner Baler Street, Barangay Bahay Toro, Project 8, Quezon City, Metro Manila 1106, Philippines",
	},
	{
		key: "bare",
		primary: "No leading, no secondary, no chip",
	},
	{
		chip: { icon: Package, label: "Freight", tone: "accent" },
		key: "short",
		leading: { kind: "avatar", name: "Jo" },
		meta: "0",
		primary: "Jo",
	},
];

/** The content that breaks a row, and the row with nothing in it. */
function ContentSection() {
	return (
		<LabSection
			description="A title long enough to truncate, an address long enough to truncate under it, a row with only a primary line, and a row with a one-word name. Narrow the window: the primary and secondary truncate and the trailing block holds its width, because a long address must never crush the chip the row exists to show. Every row keeps the same height whether or not it has a secondary line."
			title="Long content, and the minimum row"
		>
			<AppList
				data-cy="awkward"
				items={AWKWARD}
				label="Awkward rows"
				onSelectItem={(item) =>
					AppToast.info(item.primary, {
						description: "Opening the row.",
						icon: FileText,
					})
				}
			/>
		</LabSection>
	);
}
