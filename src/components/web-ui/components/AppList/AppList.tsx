import { Checkbox, Skeleton } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, GripVertical, MoreHorizontal } from "lucide-react";
import type { DragEvent, KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";
import { AppAvatar } from "../AppAvatar";
import { AppButton } from "../AppButton";
import type { ChipTone } from "../AppChip";
import { AppChip } from "../AppChip";
import type { DropdownSection } from "../AppDropdown";
import { AppDropdown } from "../AppDropdown";
import type { EmptyReason } from "../AppEmptyState";
import { AppEmptyState } from "../AppEmptyState";
import { AppTooltip } from "../AppTooltip";
import { cn } from "../../lib/cn";

/**
 * The leading slot: an avatar or a glyph, never both, and never a third thing.
 * A union rather than two optional fields, so a row cannot ask for one of each
 * and get whichever the implementation happened to check first.
 */
export type ListLeading = { icon: LucideIcon; kind: "icon" } | { kind: "avatar"; name: string; src?: string };

export interface ListItem {
	/** Trailing pill. Icon and label both, as everywhere else in the app. */
	chip?: { icon: LucideIcon; label: string; tone?: ChipTone };
	key: string;
	leading?: ListLeading;
	/**
	 * One trailing fact - a count, a size, a date. Not a sentence: this is the
	 * first thing to run out of room.
	 */
	meta?: string;
	/**
	 * What tells this row from the one with the same primary line - an email, an
	 * ID. Folded into the row's accessible name and nowhere else, because the
	 * name has to disambiguate without reading out every string in the row.
	 */
	nameDetail?: string;
	primary: string;
	secondary?: string;
}

/** A verb the caller can run against a row. Icon-only, so it carries a tooltip. */
export interface ListAction {
	/** The one sentence under the verb. Say whether it can be taken back. */
	description: string;
	icon: LucideIcon;
	/** The verb alone - "Edit". The row's own name is appended for the a11y name. */
	label: string;
	onPress: (item: ListItem) => void;
	tone?: "danger" | "default";
}

/**
 * The row's menu, built per row so its actions are already bound to it.
 *
 * It returns `AppDropdown`'s own sections rather than a second menu shape of
 * this component's invention - which is what keeps destructive items hoisted to
 * the end, disabled items in the menu with their reason, and the sheet on touch.
 */
export type ListRowMenu = (item: ListItem) => DropdownSection[];

export interface ListSelection {
	onChange: (keys: string[]) => void;
	selectedKeys: string[];
}

export interface ListReorder {
	/** The whole key order after the move, in the order it should now render. */
	onReorder: (keys: string[]) => void;
}

interface ListEmpty {
	action?: { label: string; onPress: () => void };
	/** Overrides the preset copy when this list has something better to say. */
	description?: string;
	/** Echoed back in the no-results copy. */
	query?: string;
	reason: EmptyReason;
}

interface AppListBaseProps {
	className?: string;
	/**
	 * Test hook on the surface, in every one of its three states - loading,
	 * empty and loaded - so a spec can address the same list across all of
	 * them. The empty state inside it derives `-empty`.
	 */
	"data-cy"?: string;
	/** Why the list is empty, and the way out of it. */
	empty?: ListEmpty;
	isLoading?: boolean;
	items: ListItem[];
	/** Names the list for a screen reader - "Saved warehouses", not "List". */
	label: string;
	/** Presence turns on the drag handle AND the keyboard route. */
	reorder?: ListReorder;
	/** Presence turns on the leading checkbox. Selecting is never navigating. */
	selection?: ListSelection;
}

interface PressableListProps extends AppListBaseProps {
	actions?: never;
	/** Given one, the whole row leads somewhere and gains the chevron. */
	onSelectItem: (item: ListItem) => void;
	/** The ONE trailing control a pressable row may hold. */
	rowMenu?: ListRowMenu;
}

interface InertListProps extends AppListBaseProps {
	/** The row leads nowhere, so these are the only targets in it. */
	actions?: ListAction[];
	onSelectItem?: never;
	rowMenu?: never;
}

export type AppListProps = InertListProps | PressableListProps;

/**
 * The list primitive: one surface, hairline separators, and four slots per row -
 * leading (avatar, icon, checkbox or drag handle), a primary line, an optional
 * secondary line, and trailing (meta, chip, action, chevron).
 *
 * AppUserList is one configuration of this shape. Anything that cannot be said
 * in those four slots is a different component, not a fifth slot - which is why
 * every slot here is a typed prop rather than a `ReactNode`.
 *
 * `onSelectItem` and `actions` are mutually exclusive IN THE TYPE. A pressable
 * row may not contain another button: it is invalid HTML and unresolvable for a
 * keyboard, since Tab would have to stop on the row and on the thing inside it
 * with no way to say which is about to fire. So either the row is the target and
 * the only trailing control is a menu (`rowMenu`), or the row is inert and the
 * actions are the targets. That is a decision per LIST, and the compiler holds
 * it - two rows in one list behaving differently is worse than either choice.
 *
 * A pressable row is a real `<button>` on the primary line with a stretched
 * `::after` covering the row, the same recipe AppCard uses for a whole-card
 * link, NOT a `<button>` wrapped around everything. That is what keeps the
 * accessible name down to the primary line plus `nameDetail`: wrapping the row
 * makes the name every string in it - "Aria Coffee Roasters, Ethiopia Guji, 4.5
 * stars, 212 ratings, verified" - and leaves nowhere to put the menu.
 */
export function AppList({
	actions,
	className,
	"data-cy": dataCy,
	empty,
	isLoading = false,
	items,
	label,
	onSelectItem,
	reorder,
	rowMenu,
	selection,
}: AppListProps) {
	const instructionsId = useId();
	/** What the keyboard reorder route says out loud. Empty until it is used. */
	const [announcement, setAnnouncement] = useState("");
	/** The row the keyboard has picked up. Null when nothing is being moved. */
	const [grabbedKey, setGrabbedKey] = useState<string | null>(null);
	/** The row the pointer is dragging. Separate state: the two never overlap. */
	const [draggingKey, setDraggingKey] = useState<string | null>(null);
	/** The order at pick-up, so Escape can put it back exactly as it was. */
	const orderBeforeGrab = useRef<string[] | null>(null);

	const surface = cn("overflow-hidden rounded-3xl border border-border bg-surface", className);

	function moveTo(key: string, toIndex: number): boolean {
		if (!reorder) return false;
		const keys = items.map((item) => item.key);
		const from = keys.indexOf(key);
		if (from === -1 || toIndex < 0 || toIndex >= keys.length || from === toIndex) return false;

		const next = [...keys];
		next.splice(from, 1);
		next.splice(toIndex, 0, key);
		reorder.onReorder(next);
		return true;
	}

	/**
	 * The keyboard route, which is not optional: drag-and-drop is unusable by
	 * keyboard and unreliable on touch inside a scrolling list, so a reorderable
	 * list that only drags is a reorderable list for some people.
	 */
	function onHandleKeyDown(event: KeyboardEvent<HTMLButtonElement>, item: ListItem, index: number) {
		const total = items.length;

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			if (grabbedKey === item.key) {
				setGrabbedKey(null);
				orderBeforeGrab.current = null;
				setAnnouncement(`${item.primary} dropped at position ${index + 1} of ${total}.`);
				return;
			}
			orderBeforeGrab.current = items.map((entry) => entry.key);
			setGrabbedKey(item.key);
			setAnnouncement(
				`${item.primary} grabbed, position ${index + 1} of ${total}. Arrow keys move it, Enter drops it, Escape cancels.`,
			);
			return;
		}

		if (grabbedKey !== item.key) return;

		if (event.key === "ArrowUp" || event.key === "ArrowDown") {
			event.preventDefault();
			const to = event.key === "ArrowUp" ? index - 1 : index + 1;
			// The row keeps focus across the move because the `<li>` is keyed on the
			// item: React relocates the same DOM node rather than rebuilding it.
			if (moveTo(item.key, to)) setAnnouncement(`${item.primary} moved to position ${to + 1} of ${total}.`);
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			const original = orderBeforeGrab.current;
			setGrabbedKey(null);
			orderBeforeGrab.current = null;
			if (original) reorder?.onReorder(original);
			setAnnouncement(`Move cancelled. ${item.primary} is back at its original position.`);
		}
	}

	if (isLoading) {
		return (
			<div
				className={surface}
				data-cy={dataCy}
				/* Which of the three surfaces this is. A spec that had to tell them
				   apart by what is inside them would be asserting on skeleton markup
				   and on empty-state copy, both of which are free to change. */
				data-state="loading"
			>
				{/*
				 * A refetch still has the old rows to take the shape from; a first
				 * load has nothing, and the leading circle is the right bet - a list
				 * without one is the exception, and the skeleton being 40px too wide
				 * costs nothing next to a row that changes height when the data lands.
				 */}
				<ListSkeleton
					hasLeading={items.length === 0 || items.some((item) => Boolean(item.leading))}
					label={label}
				/>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div
				className={surface}
				data-cy={dataCy}
				data-state="empty"
			>
				{/*
				 * The table's empty state, not a second copy of it. "Why is this empty"
				 * has the same three answers here, and telling someone whose filters
				 * hid every row that there is no data is the same defect either way.
				 */}
				<AppEmptyState
					action={empty?.action}
					data-cy={dataCy ? `${dataCy}-empty` : undefined}
					description={empty?.description}
					query={empty?.query}
					reason={empty?.reason ?? "no-data"}
				/>
			</div>
		);
	}

	return (
		<div
			className={surface}
			data-cy={dataCy}
			data-state="ready"
		>
			{reorder ? (
				<>
					{/*
					 * Announced on every move; the visual order is the only other
					 * feedback, and it is no feedback at all to a screen reader.
					 *
					 * `<output>` rather than a `<p role="status">` - it is the element
					 * that role belongs to, and Biome's semantic-element rule is right
					 * here in a way it is not for the `role="group"` cases AppSearchBar
					 * and AppDropdown both had to work around.
					 */}
					<output
						aria-live="polite"
						className="sr-only"
					>
						{announcement}
					</output>
					<p
						className="sr-only"
						id={instructionsId}
					>
						Press Enter or Space to pick this row up, then the arrow keys to move it, Enter to drop it and Escape to
						cancel.
					</p>
				</>
			) : null}

			<ul
				aria-label={label}
				className="divide-y divide-border"
			>
				{items.map((item, index) => (
					<ListRow
						action={actions}
						index={index}
						isDragging={draggingKey === item.key}
						isGrabbed={grabbedKey === item.key}
						isSelected={selection?.selectedKeys.includes(item.key) ?? false}
						item={item}
						key={item.key}
						onDragEnd={() => setDraggingKey(null)}
						onDragEnter={() => {
							if (draggingKey && draggingKey !== item.key) moveTo(draggingKey, index);
						}}
						onDragStart={() => setDraggingKey(item.key)}
						onHandleKeyDown={(event) => onHandleKeyDown(event, item, index)}
						onSelect={onSelectItem}
						onToggleSelected={
							selection
								? () =>
										selection.onChange(
											selection.selectedKeys.includes(item.key)
												? selection.selectedKeys.filter((key) => key !== item.key)
												: [...selection.selectedKeys, item.key],
										)
								: undefined
						}
						reorderInstructionsId={reorder ? instructionsId : undefined}
						rowMenu={rowMenu}
						total={items.length}
					/>
				))}
			</ul>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface ListRowProps {
	action?: ListAction[];
	index: number;
	isDragging: boolean;
	isGrabbed: boolean;
	isSelected: boolean;
	item: ListItem;
	onDragEnd: () => void;
	onDragEnter: () => void;
	onDragStart: () => void;
	onHandleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
	onSelect?: (item: ListItem) => void;
	onToggleSelected?: () => void;
	/** Given one, the handle renders and the row is draggable. */
	reorderInstructionsId?: string;
	rowMenu?: ListRowMenu;
	total: number;
}

function ListRow({
	action,
	index,
	isDragging,
	isGrabbed,
	isSelected,
	item,
	onDragEnd,
	onDragEnter,
	onDragStart,
	onHandleKeyDown,
	onSelect,
	onToggleSelected,
	reorderInstructionsId,
	rowMenu,
	total,
}: ListRowProps) {
	const isPressable = Boolean(onSelect);
	const hasTrailing = Boolean(item.meta || item.chip || rowMenu || (action && action.length > 0) || isPressable);

	return (
		<li
			className={cn(
				/*
				 * A minimum height that holds with or without the secondary line. A
				 * list whose rows change height with their content reads as broken
				 * alignment rather than as varying data - and 64px clears the 44px
				 * touch floor with the padding to spare that makes it comfortable.
				 */
				"group/row relative flex min-h-16 items-center gap-3 px-4 py-3 transition-colors",
				/*
				 * The hover and press wash is a few per cent of the brand red over the
				 * surface, NOT `bg-surface-hover`: HeroUI mixes that one from
				 * `--surface-foreground`, which is a dark red here rather than a
				 * neutral, so it lands as a muddy brown that reads as "selected".
				 * The press is keyed to the ROW's own button - `has-[button:active]`
				 * would flash the whole row when the trailing menu is pressed.
				 */
				isPressable && "hover:bg-[color-mix(in_oklab,var(--accent)_4%,var(--surface))]",
				isPressable && "has-[[data-row-press]:active]:bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))]",
				isGrabbed && "bg-[color-mix(in_oklab,var(--accent)_8%,var(--surface))]",
				isDragging && "opacity-50",
			)}
			/*
			 * The row's own state, as data. Grabbed and dragging are otherwise only
			 * a background colour, and selected is only a tick inside a HeroUI
			 * checkbox - so a spec would be asserting on a `color-mix` string.
			 */
			data-dragging={isDragging}
			data-grabbed={isGrabbed}
			data-pressable={isPressable}
			data-row-key={item.key}
			data-selected={isSelected}
			onDragEnter={reorderInstructionsId ? onDragEnter : undefined}
			// Firefox will not fire `drop` without this, and the browser's own
			// "open this as a URL" default is the wrong thing on every one of them.
			onDragOver={reorderInstructionsId ? (event: DragEvent) => event.preventDefault() : undefined}
		>
			{reorderInstructionsId ? (
				<ReorderHandle
					index={index}
					instructionsId={reorderInstructionsId}
					isGrabbed={isGrabbed}
					item={item}
					onDragEnd={onDragEnd}
					onDragStart={onDragStart}
					onKeyDown={onHandleKeyDown}
					total={total}
				/>
			) : null}

			{onToggleSelected ? (
				/*
				 * Selection is not navigation. On a pressable list the checkbox is a
				 * sibling of the row's button rather than inside it, so the two
				 * gestures cannot collide - selecting five rows and having the fifth
				 * navigate away loses the other four.
				 *
				 * Raw Checkbox, deliberately: AppCheckbox is a react-hook-form field,
				 * generic over FieldValues and taking `control` and `name`. This is row
				 * selection - there is no form, and the state lives in the list.
				 */
				<Checkbox
					aria-label={`Select ${item.primary}`}
					className="relative z-10 shrink-0"
					isSelected={isSelected}
					onChange={onToggleSelected}
				>
					<Checkbox.Content>
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
					</Checkbox.Content>
				</Checkbox>
			) : null}

			{item.leading ? <ListLeadingSlot leading={item.leading} /> : null}

			<div className="min-w-0 flex-1">
				<p className="truncate font-semibold">
					{isPressable && onSelect ? (
						/*
						 * The link/button is on the primary line and its `::after` grows
						 * the hit area to the whole row. The focus ring is drawn on that
						 * pseudo-element - ringing the text alone tells a keyboard user
						 * nothing about what they are on the edge of opening - and it is
						 * INSET, because the list clips its corners and an outward ring on
						 * the first or last row would be sliced in half by that clip.
						 */
						<button
							className={cn(
								"cursor-pointer text-left outline-none after:absolute after:inset-0 after:content-['']",
								"focus-visible:after:-outline-offset-2 focus-visible:after:outline-2 focus-visible:after:outline-focus",
							)}
							data-row-press=""
							onClick={() => onSelect(item)}
							type="button"
						>
							{item.primary}
							{/* The disambiguator rides in the name and nowhere else. */}
							{item.nameDetail ? <span className="sr-only">, {item.nameDetail}</span> : null}
						</button>
					) : (
						item.primary
					)}
				</p>

				{item.secondary ? <p className="truncate text-sm text-muted">{item.secondary}</p> : null}

				{/*
				 * Below `sm` the meta drops out of the trailing block and under the
				 * secondary line, where there is room for it. Both copies are in the
				 * markup and `display: none` keeps the unused one out of the
				 * accessibility tree, so only ever one is announced - the same trick
				 * AppBreadcrumbs uses for its desktop trail and mobile back link.
				 */}
				{item.meta ? <p className="truncate text-sm text-muted sm:hidden">{item.meta}</p> : null}
			</div>

			{hasTrailing ? (
				/*
				 * `shrink-0`, always. Without it one long email crushes the status chip
				 * the row exists to show. `z-10` puts it over the stretched `::after`,
				 * which is what makes the menu pressable on a pressable row.
				 */
				<div className="relative z-10 flex shrink-0 items-center gap-2">
					{item.meta ? <span className="hidden text-sm text-muted tabular-nums sm:inline">{item.meta}</span> : null}

					{item.chip ? (
						<AppChip
							icon={item.chip.icon}
							label={item.chip.label}
							size="sm"
							tone={item.chip.tone}
						/>
					) : null}

					{action?.map((entry) => (
						<RowAction
							action={entry}
							item={item}
							key={entry.label}
						/>
					))}

					{rowMenu ? (
						<AppDropdown
							label={`Actions for ${item.primary}`}
							sections={rowMenu(item)}
							trigger={
								/* Icon-only, and it names its row: a list of ten "More"
								   buttons is ten controls with one name between them. */
								<AppButton
									aria-label={`More actions for ${item.primary}`}
									icon={MoreHorizontal}
									isIconOnly
									size="sm"
									variant="ghost"
								/>
							}
						/>
					) : null}

					{/* Decoration, and only when the row leads somewhere. The button
					    beside it is already the name and the target. */}
					{isPressable ? (
						<ChevronRight
							aria-hidden="true"
							className="size-4 text-muted"
						/>
					) : null}
				</div>
			) : null}
		</li>
	);
}

/* -------------------------------------------------------------------------- */

/** An avatar or a glyph, at one size, so a list of them shares a left edge. */
function ListLeadingSlot({ leading }: { leading: ListLeading }) {
	if (leading.kind === "avatar") {
		return (
			<span className="shrink-0">
				<AppAvatar
					name={leading.name}
					size="md"
					src={leading.src}
				/>
			</span>
		);
	}

	const Icon = leading.icon;

	return (
		<span
			aria-hidden="true"
			className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted-surface text-muted"
		>
			<Icon className="size-5" />
		</span>
	);
}

/**
 * The drag handle, and the only place the keyboard route is reachable from.
 *
 * `draggable` sits on the HANDLE rather than the row: making the whole row
 * draggable turns every attempt to select its text into a drag, and on a
 * pressable row it competes with the press.
 */
function ReorderHandle({
	index,
	instructionsId,
	isGrabbed,
	item,
	onDragEnd,
	onDragStart,
	onKeyDown,
	total,
}: {
	index: number;
	instructionsId: string;
	isGrabbed: boolean;
	item: ListItem;
	onDragEnd: () => void;
	onDragStart: () => void;
	onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
	total: number;
}) {
	return (
		<button
			aria-describedby={instructionsId}
			aria-label={`Reorder ${item.primary}, position ${index + 1} of ${total}`}
			aria-pressed={isGrabbed}
			className={cn(
				"relative z-10 -m-1 flex size-11 shrink-0 cursor-grab items-center justify-center rounded-xl text-muted",
				"hover:bg-muted-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				isGrabbed && "cursor-grabbing bg-muted-surface text-foreground",
			)}
			/* The keyboard route's only entry point, and the one control in a row
			   with no name of its own to select on. */
			data-reorder-handle=""
			draggable
			onDragEnd={onDragEnd}
			onDragStart={(event) => {
				// Firefox refuses to start a drag without data on the transfer.
				event.dataTransfer.setData("text/plain", item.key);
				event.dataTransfer.effectAllowed = "move";
				onDragStart();
			}}
			onKeyDown={onKeyDown}
			type="button"
		>
			<GripVertical
				aria-hidden="true"
				className="size-4"
			/>
		</button>
	);
}

/**
 * One verb, icon-only, and therefore tooltipped: a pencil and a bin sit 8px
 * apart and are only obvious to someone who has used the list before. The
 * `aria-label` stays on the button as well - a tooltip is a hover affordance and
 * must never be the only place a control's name exists.
 */
function RowAction({ action, item }: { action: ListAction; item: ListItem }) {
	const Icon = action.icon;

	return (
		<AppTooltip
			description={action.description}
			icon={action.icon}
			title={action.label}
		>
			<AppButton
				aria-label={`${action.label} ${item.primary}`}
				className={cn(action.tone === "danger" && "text-danger!")}
				icon={Icon}
				isIconOnly
				onPress={() => action.onPress(item)}
				size="sm"
				variant="ghost"
			/>
		</AppTooltip>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * Three rows at the real row height, with the leading circle and both lines
 * already in place - never a spinner in an empty box, which makes the page jump
 * when the data lands.
 */
function ListSkeleton({ hasLeading, label }: { hasLeading: boolean; label: string }) {
	return (
		<ul
			aria-busy="true"
			aria-label={`${label}, loading`}
			className="divide-y divide-border"
		>
			{[0, 1, 2].map((row) => (
				<li
					className="flex min-h-16 items-center gap-3 px-4 py-3"
					key={row}
				>
					{hasLeading ? <Skeleton className="size-10 shrink-0 rounded-full" /> : null}
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-4 w-40 max-w-full rounded-md" />
						<Skeleton className="h-3 w-56 max-w-full rounded-md" />
					</div>
					<Skeleton className="h-6 w-16 shrink-0 rounded-full" />
				</li>
			))}
		</ul>
	);
}
