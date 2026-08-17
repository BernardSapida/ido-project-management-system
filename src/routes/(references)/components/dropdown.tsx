import { AppButton, AppDropdown, AppGlassCard, AppPageHeader, AppToast } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowDownWideNarrow,
	Ban,
	Copy,
	Download,
	FileSpreadsheet,
	FileText,
	Link2,
	Mail,
	MessageSquare,
	MoreHorizontal,
	Pencil,
	RotateCcw,
	Share2,
	Trash2,
	Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Dropdown menu lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The two things worth actually doing on this page: press "Delete order" in
 * the third section and watch where it is (last, behind a separator) rather
 * than reading about it, and open any menu on a phone or with devtools in touch
 * emulation - the same `sections` array comes up as a bottom sheet with 44px
 * rows and no code path of its own to keep in step.
 *
 * Nothing here touches the api.
 */
export const Route = createFileRoute("/(references)/components/dropdown")({
	head: () => ({
		meta: [{ title: seo.title("Dropdown menu lab") }, { content: "noindex", name: "robots" }],
	}),
	component: DropdownLabPage,
});

function DropdownLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The surface that fires actions - not the one that puts a value in a field, and not the one that filters a list."
				title="Dropdown menu lab"
			/>
			<DefaultSection />
			<SectionsSection />
			<DestructiveSection />
			<DisabledSection />
			<SelectionSection />
			<SubmenuSection />
			<TouchSection />
			<RestraintSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

function LabSection({ children, description, title }: { children?: ReactNode; description: string; title: string }) {
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

function Row({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/** Stands in for the mutation every one of these would fire. */
function report(title: string, description: string) {
	AppToast.success(title, { description, icon: MessageSquare });
}

/* -------------------------------------------------------------------------- */

/** Icons lead, shortcut hints trail, and the trigger names the menu. */
function DefaultSection() {
	return (
		<LabSection
			description="The trigger says 'Actions' - what the menu is - never the state of anything, because a trigger reading 'Newest first' is a Select wearing a menu's clothes. Icons lead and shortcuts trail. The icon is REQUIRED on an action, the way an icon-only button's name is: a menu is read by shape before it is read by word, and the ragged edge left by the one item somebody forgot reads as a rendering fault. A shortcut stays optional. Only a choice - a value rather than a verb - may go without a glyph, and there an icon on ANY item still reserves the column for all of them: the component draws a spacer rather than letting the labels go ragged."
			title="Default"
		>
			<Row>
				<AppDropdown
					data-cy="menu-default"
					label="Actions"
					sections={[
						{
							items: [
								{
									icon: Pencil,
									key: "edit",
									label: "Edit order",
									onAction: () => report("Edit", "The edit drawer would open here."),
									shortcut: ["command", "E"],
								},
								{
									icon: Copy,
									key: "duplicate",
									label: "Duplicate order",
									onAction: () => report("Duplicated", "A copy was added to the roster."),
									shortcut: ["command", "D"],
								},
								{
									icon: Link2,
									key: "copy-link",
									label: "Copy link",
									onAction: () => report("Link copied", "The order's URL is on your clipboard."),
								},
							],
							key: "order",
						},
					]}
					trigger={
						<AppButton
							data-cy="trigger-default"
							variant="secondary"
						>
							Actions
						</AppButton>
					}
				/>
			</Row>
		</LabSection>
	);
}

/** Past ~5 items, grouped - and every group is a real section, not a spacer. */
function SectionsSection() {
	return (
		<LabSection
			description="An unbroken list of nine is read in full, every time. Past about five items the menu takes sections with labels, and the separators between them are drawn by the component rather than passed in - which is what stops a menu shipping with one group visually merged into the next."
			title="Sections"
		>
			<Row>
				<AppDropdown
					data-cy="menu-sections"
					label="Record actions"
					sections={[
						{
							items: [
								{
									icon: Pencil,
									key: "edit",
									label: "Edit",
									onAction: () => report("Edit", "The edit drawer would open here."),
								},
								{
									icon: Copy,
									key: "duplicate",
									label: "Duplicate",
									onAction: () => report("Duplicated", "A copy was added."),
								},
							],
							key: "manage",
							label: "Manage",
						},
						{
							items: [
								{
									icon: FileText,
									key: "pdf",
									label: "Export as PDF",
									onAction: () => report("Exporting", "The PDF will download shortly."),
								},
								{
									icon: FileSpreadsheet,
									key: "csv",
									label: "Export as CSV",
									onAction: () => report("Exporting", "The CSV will download shortly."),
								},
								{
									icon: Download,
									key: "archive",
									label: "Download archive",
									onAction: () => report("Preparing", "We will email you when it is ready."),
								},
							],
							key: "export",
							label: "Export",
						},
					]}
					trigger={
						<AppButton
							data-cy="trigger-sections"
							variant="secondary"
						>
							Record actions
						</AppButton>
					}
				/>
			</Row>
		</LabSection>
	);
}

/**
 * The one section to open and look at rather than read: "Delete" is declared
 * first in the array and rendered last.
 */
function DestructiveSection() {
	return (
		<LabSection
			description="Open this one. 'Delete order' is the FIRST item in the sections array and it renders last, behind a separator - the component hoists it, because a destructive item one arrow key below 'Duplicate' looks completely normal until someone presses it. It is red on the label and the icon only; a filled red row spends the whole red budget on a menu nobody opened to delete from. And it acts immediately with Undo in the toast rather than asking - an 'Are you sure?' on something recoverable punishes every correct press to catch the rare wrong one."
			title="Destructive items"
		>
			<Row>
				<AppDropdown
					data-cy="menu-destructive"
					label="Order actions"
					sections={[
						{
							items: [
								{
									icon: Trash2,
									isDestructive: true,
									key: "delete",
									label: "Delete order",
									onAction: () =>
										AppToast.warning("Order deleted", {
											action: {
												label: "Undo",
												onPress: () =>
													AppToast.success("Restored", {
														description: "Makati Central Hub is back on the roster.",
														icon: RotateCcw,
													}),
											},
											description: "Makati Central Hub was removed from the roster.",
											icon: Undo2,
										}),
								},
								{
									icon: Pencil,
									key: "edit",
									label: "Edit order",
									onAction: () => report("Edit", "The edit drawer would open here."),
								},
								{
									icon: Copy,
									key: "duplicate",
									label: "Duplicate order",
									onAction: () => report("Duplicated", "A copy was added to the roster."),
								},
							],
							key: "order",
						},
					]}
					trigger={
						<AppButton
							data-cy="trigger-destructive"
							variant="secondary"
						>
							Order actions
						</AppButton>
					}
				/>
			</Row>
		</LabSection>
	);
}

/** Greyed and still there, with the reason under the label. */
function DisabledSection() {
	return (
		<LabSection
			description="Disabled items STAY in the menu. Hiding them makes it a different shape every time it opens, so the user relearns the list on every use - and the one thing they wanted is missing with no explanation. The reason goes under the label rather than in a tooltip: the item cannot be hovered meaningfully on touch, and 'why is this grey' is the question the item exists to answer."
			title="Disabled items"
		>
			<Row>
				<AppDropdown
					data-cy="menu-disabled"
					label="Request actions"
					sections={[
						{
							items: [
								{
									icon: Share2,
									key: "share",
									label: "Share request",
									onAction: () => report("Shared", "The link is on your clipboard."),
								},
								{
									disabledReason: "Only the requester can edit this",
									icon: Pencil,
									isDisabled: true,
									key: "edit",
									label: "Edit request",
									onAction: () => undefined,
								},
								{
									disabledReason: "Two items have already shipped",
									icon: Ban,
									isDisabled: true,
									key: "cancel",
									label: "Cancel request",
									onAction: () => undefined,
								},
							],
							key: "request",
						},
					]}
					trigger={
						<AppButton
							data-cy="trigger-disabled"
							variant="secondary"
						>
							Request actions
						</AppButton>
					}
				/>
			</Row>
		</LabSection>
	);
}

/** Checkbox and radio groups - and the menu stays open through both. */
function SelectionSection() {
	const [columns, setColumns] = useState(["name", "type"]);
	const [sort, setSort] = useState(["recent"]);

	return (
		<LabSection
			description="Two selection sections and one action section in one menu. Press several checkboxes in a row without the menu closing - that is the whole point of a group, and React Aria would have closed on the radio press without shouldCloseOnSelect={false}. These render as menuitemcheckbox and menuitemradio, which is what makes them state rather than actions; the moment the answer needs to end up in a form field, this is the wrong component and it is a Select."
			title="Toggles and radios"
		>
			<Row>
				<AppDropdown
					data-cy="menu-selection"
					label="View options"
					sections={[
						{
							items: [
								{ key: "name", label: "Name" },
								{ key: "service", label: "Service level" },
								{ key: "distance", label: "Distance" },
								{ key: "status", label: "Status" },
							],
							key: "columns",
							label: "Columns",
							onSelectionChange: setColumns,
							selectedKeys: columns,
							selectionMode: "multiple",
						},
						{
							items: [
								{ key: "recent", label: "Most recent" },
								{ key: "nearest", label: "Nearest first" },
								{ key: "urgent", label: "Most urgent" },
							],
							key: "sort",
							label: "Sort by",
							onSelectionChange: setSort,
							selectedKeys: sort,
							selectionMode: "single",
						},
						{
							items: [
								{
									icon: RotateCcw,
									key: "reset",
									label: "Reset to defaults",
									onAction: () => {
										setColumns(["name", "type"]);
										setSort(["recent"]);
									},
								},
							],
							key: "reset",
						},
					]}
					trigger={
						<AppButton
							data-cy="trigger-selection"
							variant="secondary"
						>
							<ArrowDownWideNarrow
								aria-hidden="true"
								className="size-4"
							/>
							View options
						</AppButton>
					}
				/>
				<p className="text-sm text-muted">
					{columns.length} column{columns.length === 1 ? "" : "s"}, sorted by {sort[0]}
				</p>
			</Row>
		</LabSection>
	);
}

/** One level, and the type is what makes it one. */
function SubmenuSection() {
	return (
		<LabSection
			description="A submenu opens on hover with an intent delay and on ArrowRight. There is exactly one level of it, and that is enforced by the type rather than by review: a submenu's items are actions with no items of their own, and they cannot be marked destructive either - hiding a delete behind a hover delay is the opposite of putting it last behind a separator. On touch the submenu flattens into its own labelled block in the sheet, because a sheet opening a sheet is two focus traps and a back gesture that means two things."
			title="Submenus"
		>
			<Row>
				<AppDropdown
					data-cy="menu-submenu"
					label="Share"
					sections={[
						{
							items: [
								{
									icon: Link2,
									key: "copy-link",
									label: "Copy link",
									onAction: () => report("Link copied", "The URL is on your clipboard."),
								},
								{
									icon: Share2,
									items: [
										{
											icon: Mail,
											key: "email",
											label: "Email",
											onAction: () => report("Email", "Your mail client would open."),
										},
										{
											icon: MessageSquare,
											key: "sms",
											label: "SMS",
											onAction: () => report("SMS", "Your messages app would open."),
										},
									],
									key: "send",
									label: "Send to",
								},
							],
							key: "share",
						},
					]}
					trigger={
						<AppButton
							data-cy="trigger-submenu"
							variant="secondary"
						>
							Share
						</AppButton>
					}
				/>
			</Row>
		</LabSection>
	);
}

/** The row-action case, and the reason the popover is portalled. */
function TouchSection() {
	return (
		<LabSection
			description="The icon-only trigger a table row carries. It still needs a name of its own - 'More actions for Makati Central Hub', never 'More' - because the menu's label names the menu, not the row it belongs to. This is also the case the portal exists for: anchored inside the row, the first overflow: hidden ancestor clips the panel, and the bug only ever shows up on the last row of the table. Narrow the window to a phone (or turn on touch emulation) and the same menu arrives as a bottom sheet."
			title="Row action, and the sheet"
		>
			<Row>
				<div className="flex w-full max-w-md items-center justify-between rounded-2xl border border-border px-4 py-3">
					<div className="min-w-0">
						<p className="truncate text-sm font-medium">Makati Central Hub</p>
						<p className="truncate text-xs text-muted">Barangay Bel-Air, Makati · 24/7</p>
					</div>
					<AppDropdown
						label="Order actions"
						sections={[
							{
								items: [
									{
										icon: Pencil,
										key: "edit",
										label: "Edit order",
										onAction: () => report("Edit", "The edit drawer would open here."),
									},
									{
										icon: Trash2,
										isDestructive: true,
										key: "delete",
										label: "Delete order",
										onAction: () =>
											AppToast.warning("Order deleted", {
												action: {
													label: "Undo",
													onPress: () =>
														AppToast.success("Restored", {
															description: "Makati Central Hub is back on the roster.",
															icon: RotateCcw,
														}),
												},
												description: "Makati Central Hub was removed from the roster.",
												icon: Undo2,
											}),
									},
								],
								key: "order",
							},
						]}
						trigger={
							<AppButton
								aria-label="More actions for Makati Central Hub"
								data-cy="trigger-row"
								icon={MoreHorizontal}
								isIconOnly
								size="sm"
								variant="ghost"
							/>
						}
					/>
				</div>
			</Row>
		</LabSection>
	);
}

/** The section arguing for one of the other two components. */
function RestraintSection() {
	return (
		<LabSection
			description="A menu fires actions. If what comes back has to end up in a form - a value with a name, a validation rule and something to submit - it is a Select, and a menu used for it gives you a field that is none of those things. If the list is long enough to need filtering, it is a Combobox. And nothing that takes typing may live inside a menu: menu keyboard handling owns the arrows, the typeahead and Escape, which are exactly the keys a text field needs, so a search box in here is broken on the first keystroke. That one is a Popover."
			title="When not to use it"
		/>
	);
}
