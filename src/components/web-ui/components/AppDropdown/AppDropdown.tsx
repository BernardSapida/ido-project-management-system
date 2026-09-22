import { useMediaQuery } from "../../internal";
import { Description, Drawer, Dropdown, Header, Kbd, Label, Separator } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement, useState } from "react";
import { cn } from "../../lib/cn";

/**
 * The keys `Kbd.Abbr` can draw as a glyph. Anything else in a `shortcut` array
 * is a literal - "N", "Enter" - and renders as text.
 */
const KBD_KEYS = [
	"alt",
	"capslock",
	"command",
	"ctrl",
	"delete",
	"down",
	"end",
	"enter",
	"escape",
	"fn",
	"help",
	"home",
	"left",
	"option",
	"pagedown",
	"pageup",
	"right",
	"shift",
	"space",
	"tab",
	"up",
	"win",
] as const;

type KbdKeyName = (typeof KBD_KEYS)[number];

/** One thing the menu can DO. It is not a value - see the component's doc. */
export interface DropdownAction {
	/**
	 * Why it cannot be pressed. Shown under the label, because a disabled item
	 * with no reason is a dead end the user has to guess their way out of.
	 */
	disabledReason?: string;
	/**
	 * Leads the row, and it is REQUIRED - the same way `AppButton` makes an
	 * icon-only button's name a type error to omit.
	 *
	 * A menu is read by shape before it is read by word: the glyph is what lets
	 * somebody who has opened this menu twice hit Duplicate without reading the
	 * four labels around it, and it is the only thing distinguishing the rows at
	 * a glance on a phone. Left optional it was a rule nobody broke on the first
	 * three items and everybody broke on the sixth, added a month later - which
	 * is the failure the type now prevents rather than documents.
	 *
	 * `isDestructive` colours it red; otherwise it is muted.
	 */
	icon: LucideIcon;
	/**
	 * Red on the label and the icon, no filled background - and the component
	 * MOVES it to the end of the menu behind a separator, wherever it was
	 * declared. It must not be reachable by a slip from the item above it.
	 *
	 * A destructive action still acts immediately and reports with an Undo
	 * toast, exactly as a table row action does. Where there is no undo, that is
	 * `AppDialog`'s job and this label ends in an ellipsis to say so.
	 */
	isDestructive?: boolean;
	/** Stays in the menu, greyed. Hiding it reshapes the menu on every open. */
	isDisabled?: boolean;
	key: string;
	/** Names the verb - "Duplicate request", never "Duplicate…" unless a dialog follows. */
	label: string;
	/** What pressing it does. The menu closes first, then this runs. */
	onAction: () => void;
	/** Trails the row: `["command", "delete"]` renders as ⌘⌫. Unknown tokens print as text. */
	shortcut?: string[];
}

/**
 * A submenu's children are actions and nothing else - no second `items`, so a
 * second level cannot be typed. A two-level menu cannot be traversed diagonally
 * with a mouse and cannot be opened at all on a phone.
 *
 * `isDestructive` is off the table down here too: the whole point of hoisting
 * destructive items to the end of the menu is that they are hard to reach by
 * accident, and one hidden behind a hover intent delay is the opposite of that.
 */
export type DropdownSubAction = Omit<DropdownAction, "isDestructive">;

export interface DropdownSubmenu {
	disabledReason?: string;
	/** Required, as on an action - see `DropdownAction.icon`. */
	icon: LucideIcon;
	isDisabled?: boolean;
	/** One level. The type is the enforcement. */
	items: DropdownSubAction[];
	key: string;
	label: string;
}

/** One value in a checkbox or radio group. It changes state; it does not act. */
export interface DropdownChoice {
	disabledReason?: string;
	/**
	 * Optional here, and ONLY here. A choice is a value, not a verb: the column
	 * list in `AppColumnPicker` is whatever columns the table happens to have,
	 * and "Newest first" has no glyph that means it. The selection indicator is
	 * this row's leading column anyway, so a forced icon would be a second one.
	 *
	 * The all-or-nothing rule below still applies to a section that uses them.
	 */
	icon?: LucideIcon;
	isDisabled?: boolean;
	key: string;
	label: string;
}

export interface DropdownActionSection {
	/** A heading above the group. Worth adding once the menu is past ~5 items. */
	label?: string;
	items: (DropdownAction | DropdownSubmenu)[];
	key: string;
}

export interface DropdownChoiceSection {
	/**
	 * How the chosen row is marked.
	 *
	 * `indicator` (the default) reserves a leading column for a dot or a
	 * checkmark. It is right when the rows are VALUES - "Newest first", a column
	 * name - because there is nothing else about the row that could carry the
	 * state.
	 *
	 * `emphasis` drops that column and puts the row's own icon and label in the
	 * accent colour at a heavier weight. It is for a menu whose rows already have
	 * a distinguishing glyph - a block type, a list style, an alignment - where
	 * the dot is a second marker beside a mark that could carry it, and the
	 * indent it costs pushes every glyph away from the trigger it belongs to.
	 *
	 * Weight as well as colour, deliberately: colour alone is not a channel, and
	 * roughly 8% of men would be reading an unmarked menu.
	 */
	indicator?: "emphasis" | "indicator";
	label?: string;
	items: DropdownChoice[];
	key: string;
	onSelectionChange: (keys: string[]) => void;
	selectedKeys: string[];
	/** `multiple` renders checkmarks, `single` a dot. Either way the menu STAYS OPEN. */
	selectionMode: "multiple" | "single";
}

export type DropdownSection = DropdownActionSection | DropdownChoiceSection;

interface AppDropdownProps {
	className?: string;
	"data-cy"?: string;
	/**
	 * Names the MENU, not the current state - "Actions", "Sort by". A menu whose
	 * name reads "Newest first" is a Select wearing a menu's clothes.
	 *
	 * This is the menu's accessible name and the heading of the sheet on touch.
	 * The TRIGGER's own name is the trigger's business, and an icon-only one
	 * still needs an `aria-label` of its own - "More actions for Aria Coffee
	 * Roasters", not "More".
	 */
	label: string;
	/** In order. Separators are drawn between them; destructive items are hoisted past all of them. */
	sections: DropdownSection[];
	/**
	 * A single element that takes `onPress` - a HeroUI `Button`, usually.
	 *
	 * NOT a `Dropdown.Trigger`: on a coarse pointer this renders a sheet and
	 * there is no `Dropdown` above it to trigger, so the element is cloned with
	 * the open handler and the `aria-haspopup`/`aria-expanded` pair instead.
	 */
	trigger: ReactElement;
}

/**
 * A menu that fires ACTIONS.
 *
 * It is not a Select (which puts a value into a field) and not a Combobox
 * (which filters one). Reaching for a menu to collect a form value gives you a
 * field with no name, no validation and nothing to submit; reaching for a
 * Select to run an action gives you a "choice" that navigates. Which of the
 * three this is has to be decided before anything is styled.
 *
 * Settled: the API is a list of typed sections rather than `children`. Three of
 * the rules here are ones a caller cannot be trusted to remember at 5pm and
 * none of them fail loudly - destructive last behind a separator, disabled
 * items kept rather than filtered out, and no text field anywhere inside. A
 * `children` slot re-opens all three; a `sections` array can only express what
 * the type allows, and the one rule with a natural home in code (hoisting
 * destructive items) is done by the component rather than asked for.
 *
 * Settled: destructive items are MOVED, not just marked. They are pulled out of
 * whichever section declared them and re-emitted as the last group behind a
 * separator, so "Delete" can never sit one arrow key under "Duplicate". The
 * separator is structural for exactly that reason.
 *
 * Settled: every ACTION carries an icon, and the type says so. A menu is read
 * by shape before it is read by word, and the ragged left edge left by the one
 * item somebody forgot reads as a rendering fault rather than as an omission.
 * It was a convention first and was broken exactly where conventions are - on
 * the item added a month after the other five.
 *
 * A CHOICE may still go without: it is a value rather than a verb, its
 * selection indicator is already the leading column, and the values are often
 * not the caller's to name - `AppColumnPicker` lists whatever columns a table
 * has. There the older rule stands: an icon on any item in the section reserves
 * the column for every item in it, spacer and all.
 *
 * Settled: choice sections pass `shouldCloseOnSelect={false}`. React Aria
 * closes on select for everything except multiple-selection, so a radio group
 * would have shut the menu on the first press - and the point of a group is
 * comparing the options while picking one.
 *
 * Settled: on a coarse pointer this becomes a bottom sheet of >=44px rows, and
 * the sheet is a list of BUTTONS in a dialog rather than a `role="menu"`. A
 * menu role promises arrow-key management, which is a promise about a keyboard
 * that is not there; the choice rows carry `aria-pressed` for the same reason
 * `AppSearchBar` avoids `role="group"` - the semantic-element lint rule wants a
 * `<fieldset>`, and a fieldset in a sheet of actions is a form that is not one.
 *
 * The popover is portalled to the body by React Aria, which is what keeps it
 * out of the first `overflow: hidden` ancestor - a table's scroll container, a
 * card - and it flips rather than rendering off-screen. The last row of a table
 * is where menus go to die.
 */
export function AppDropdown({ className, "data-cy": dataCy, label, sections, trigger }: AppDropdownProps) {
	/*
	 * A menu only exists after a press, which is long after hydration - so the
	 * server's bet costs nothing but the trigger's own attributes. Fine pointer
	 * is the bet because the sheet is the branch that needs a real gesture.
	 */
	const isTouch = useMediaQuery("(pointer: coarse)", false);
	const ordered = hoistDestructive(sections);

	if (isTouch) {
		return (
			<DropdownSheet
				className={className}
				data-cy={dataCy}
				label={label}
				sections={ordered}
				trigger={trigger}
			/>
		);
	}

	return (
		<Dropdown className={className}>
			{trigger}
			<Dropdown.Popover
				/*
				 * At least the trigger's width so the panel reads as belonging to it,
				 * capped so one long label cannot stretch it across the page.
				 * `--trigger-width` is React Aria's, set on the popover element.
				 */
				className="min-w-(--trigger-width) max-w-[min(20rem,calc(100vw-2rem))]"
				/*
				 * `bottom end` rather than the centred default: a row action's trigger
				 * sits at the right edge of a table, and a centred panel hangs off it.
				 */
				placement="bottom end"
			>
				<Dropdown.Menu
					aria-label={label}
					/* Scrolls internally past ~8-10 rows rather than growing past the fold. */
					className="max-h-[min(20rem,60vh)] overflow-y-auto"
					data-cy={dataCy}
					onAction={(key) => dispatch(ordered, String(key))}
				>
					{renderSections(ordered)}
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}

/* -------------------------------------------------------------------------- */
/* The popover                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Sections and the separators between them, as one flat array.
 *
 * Written as functions rather than components on purpose: React Aria builds its
 * collection by walking these children, and the elements it is looking for -
 * `Dropdown.Section`, `Dropdown.Item` - have to be the elements it finds.
 */
function renderSections(sections: DropdownSection[]): ReactNode[] {
	return sections.flatMap((section, index) => [
		...(index > 0 ? [<Separator key={`separator-${section.key}`} />] : []),
		isChoiceSection(section) ? renderChoiceSection(section) : renderActionSection(section),
	]);
}

function renderActionSection(section: DropdownActionSection) {
	return (
		<Dropdown.Section key={section.key}>
			{section.label ? <Header>{section.label}</Header> : null}
			{section.items.map((item) => (isSubmenu(item) ? renderSubmenu(item) : renderAction(item)))}
		</Dropdown.Section>
	);
}

function renderAction(action: DropdownAction) {
	return (
		<Dropdown.Item
			id={action.key}
			isDisabled={action.isDisabled}
			key={action.key}
			textValue={action.label}
			variant={action.isDestructive ? "danger" : undefined}
		>
			{/* No spacer branch and no `withIcons`: an action always has one, so the
			    column is always there and cannot go ragged. */}
			<ItemIcon
				icon={action.icon}
				isDestructive={action.isDestructive}
				withIcons
			/>
			<ItemText
				disabledReason={action.isDisabled ? action.disabledReason : undefined}
				label={action.label}
			/>
			<ItemShortcut shortcut={action.shortcut} />
		</Dropdown.Item>
	);
}

function renderSubmenu(submenu: DropdownSubmenu) {
	return (
		<Dropdown.SubmenuTrigger key={submenu.key}>
			<Dropdown.Item
				id={submenu.key}
				isDisabled={submenu.isDisabled}
				textValue={submenu.label}
			>
				<ItemIcon
					icon={submenu.icon}
					withIcons
				/>
				<ItemText
					disabledReason={submenu.isDisabled ? submenu.disabledReason : undefined}
					label={submenu.label}
				/>
				<Dropdown.SubmenuIndicator className="ms-auto" />
			</Dropdown.Item>
			<Dropdown.Popover className="max-w-[min(18rem,calc(100vw-2rem))]">
				<Dropdown.Menu
					aria-label={submenu.label}
					className="max-h-[min(20rem,60vh)] overflow-y-auto"
					onAction={(key) => {
						submenu.items.find((item) => item.key === String(key))?.onAction();
					}}
				>
					{submenu.items.map((item) => renderAction(item))}
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown.SubmenuTrigger>
	);
}

function renderChoiceSection(section: DropdownChoiceSection) {
	const withIcons = section.items.some((item) => Boolean(item.icon));
	const isEmphasis = section.indicator === "emphasis";

	return (
		<Dropdown.Section
			key={section.key}
			onSelectionChange={(keys) =>
				section.onSelectionChange(keys === "all" ? section.items.map((item) => item.key) : [...keys].map(String))
			}
			selectedKeys={new Set(section.selectedKeys)}
			selectionMode={section.selectionMode}
		>
			{section.label ? <Header>{section.label}</Header> : null}
			{section.items.map((item) => (
				<Dropdown.Item
					className={
						isEmphasis && section.selectedKeys.includes(item.key)
							? // Colour AND weight. Colour on its own is not a channel.
								"font-semibold text-accent"
							: undefined
					}
					id={item.key}
					isDisabled={item.isDisabled}
					key={item.key}
					/*
					 * The one place this is needed. React Aria closes on select for
					 * every mode except `multiple`, so a radio group would shut the
					 * menu on the first press - and picking from a group means seeing
					 * the group.
					 */
					shouldCloseOnSelect={false}
					textValue={item.label}
				>
					{/* The indicator column is dropped entirely under `emphasis` - kept
					    as an empty slot it would still reserve the indent it exists to
					    fill, which is most of what makes it worth dropping. */}
					{isEmphasis ? null : (
						<Dropdown.ItemIndicator type={section.selectionMode === "single" ? "dot" : "checkmark"} />
					)}
					<ItemIcon
						icon={item.icon}
						withIcons={withIcons}
					/>
					<ItemText
						disabledReason={item.isDisabled ? item.disabledReason : undefined}
						label={item.label}
					/>
				</Dropdown.Item>
			))}
		</Dropdown.Section>
	);
}

/**
 * The icon column, or the space where it would be.
 *
 * The spacer is the point, and it is now only reachable from a choice section:
 * one where a single item has a glyph reserves the column for all of them, so
 * the labels keep one left edge. Actions always pass one.
 */
function ItemIcon({
	icon: Icon,
	isDestructive,
	withIcons,
}: {
	icon?: LucideIcon;
	isDestructive?: boolean;
	withIcons: boolean;
}) {
	if (!withIcons) return null;
	if (!Icon) return <span className="size-4 shrink-0" />;

	return (
		<Icon
			aria-hidden="true"
			className={cn("size-4 shrink-0", isDestructive ? "text-danger" : "text-muted")}
		/>
	);
}

function ItemText({ disabledReason, label }: { disabledReason?: string; label: string }) {
	if (!disabledReason) return <Label>{label}</Label>;

	return (
		<div className="flex min-w-0 flex-col">
			<Label>{label}</Label>
			<Description>{disabledReason}</Description>
		</div>
	);
}

function ItemShortcut({ shortcut }: { shortcut?: string[] }) {
	if (!shortcut?.length) return null;

	return (
		<Kbd
			className="ms-auto"
			slot="keyboard"
			variant="light"
		>
			{shortcut.map((token) =>
				isKbdKey(token) ? (
					<Kbd.Abbr
						key={token}
						keyValue={token}
					/>
				) : (
					<Kbd.Content key={token}>{token}</Kbd.Content>
				),
			)}
		</Kbd>
	);
}

/* -------------------------------------------------------------------------- */
/* The sheet                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The same menu on a coarse pointer.
 *
 * A 32px-row panel pinned to the corner of a phone is a set of targets nobody
 * can hit, so the rows are >=44px and the whole thing comes up from the bottom
 * where the thumb is. Focus returns to the trigger on close - React Aria's
 * modal does that, the same as the popover does.
 */
function DropdownSheet({
	className,
	"data-cy": dataCy,
	label,
	sections,
	trigger,
}: {
	className?: string;
	"data-cy"?: string;
	label: string;
	sections: DropdownSection[];
	trigger: ReactElement;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			{isValidElement(trigger)
				? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
						"aria-expanded": isOpen,
						"aria-haspopup": "menu",
						onPress: () => setIsOpen(true),
					})
				: trigger}

			<Drawer.Backdrop
				isOpen={isOpen}
				onOpenChange={setIsOpen}
			>
				<Drawer.Content placement="bottom">
					{/*
					 * Content-driven up to a cap, unlike AppDrawer's fixed 85%. There is
					 * nothing async in a menu, so the sheet cannot grow under a thumb
					 * already moving toward it - and a two-item sheet at 85% of a phone
					 * is a wall with two things on it.
					 */}
					<Drawer.Dialog className={cn("max-h-[85%] w-full p-0", className)}>
						<Drawer.Handle className="pt-3 pb-2" />
						<Drawer.Header className="border-b border-border px-5 pb-3">
							<Drawer.Heading className="text-base font-semibold">{label}</Drawer.Heading>
						</Drawer.Header>
						<Drawer.Body
							className="mt-0 p-2"
							data-cy={dataCy}
						>
							{sections.map((section, index) => (
								<div
									className={cn(index > 0 && "mt-1 border-t border-border pt-1")}
									key={section.key}
								>
									{section.label ? <SheetGroupLabel label={section.label} /> : null}
									{isChoiceSection(section)
										? renderSheetChoices(section)
										: renderSheetActions(section, () => setIsOpen(false))}
								</div>
							))}
						</Drawer.Body>
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</>
	);
}

/**
 * Submenus FLATTEN here, into their own labelled block at the end of the
 * section they were declared in. A submenu on a phone is a sheet opening a
 * sheet, which is two focus traps and a back gesture that means two things.
 */
function renderSheetActions(section: DropdownActionSection, close: () => void) {
	const actions = section.items.filter((item): item is DropdownAction => !isSubmenu(item));
	const submenus = section.items.filter(isSubmenu);

	return (
		<>
			{actions.map((action) => (
				<SheetRow
					disabledReason={action.isDisabled ? action.disabledReason : undefined}
					icon={action.icon}
					isDestructive={action.isDestructive}
					isDisabled={action.isDisabled}
					key={action.key}
					label={action.label}
					onPress={() => {
						close();
						action.onAction();
					}}
				/>
			))}
			{submenus.map((submenu) => (
				<div
					className="mt-1"
					key={submenu.key}
				>
					<SheetGroupLabel label={submenu.label} />
					{submenu.items.map((item) => (
						<SheetRow
							disabledReason={item.isDisabled ? item.disabledReason : undefined}
							icon={item.icon}
							isDisabled={submenu.isDisabled || item.isDisabled}
							key={item.key}
							label={item.label}
							onPress={() => {
								close();
								item.onAction();
							}}
						/>
					))}
				</div>
			))}
		</>
	);
}

/** Pressing one toggles it and the sheet stays put, exactly as the menu does. */
function renderSheetChoices(section: DropdownChoiceSection) {
	return section.items.map((item) => {
		const isSelected = section.selectedKeys.includes(item.key);

		return (
			<SheetRow
				disabledReason={item.isDisabled ? item.disabledReason : undefined}
				icon={item.icon}
				isDisabled={item.isDisabled}
				isSelected={isSelected}
				key={item.key}
				label={item.label}
				onPress={() => {
					if (section.selectionMode === "single") {
						section.onSelectionChange([item.key]);
						return;
					}
					section.onSelectionChange(
						isSelected ? section.selectedKeys.filter((key) => key !== item.key) : [...section.selectedKeys, item.key],
					);
				}}
			/>
		);
	});
}

function SheetGroupLabel({ label }: { label: string }) {
	return <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>;
}

function SheetRow({
	disabledReason,
	icon: Icon,
	isDestructive,
	isDisabled,
	isSelected,
	label,
	onPress,
}: {
	disabledReason?: string;
	icon?: LucideIcon;
	isDestructive?: boolean;
	isDisabled?: boolean;
	isSelected?: boolean;
	label: string;
	onPress: () => void;
}) {
	return (
		<button
			/*
			 * `aria-pressed` rather than a radio or checkbox role: a role here would
			 * want a fieldset around it to satisfy the same lint rule AppSearchBar
			 * documents, and a fieldset in a sheet of actions is a form that is not
			 * one. Undefined on a plain action, so it stays a plain button.
			 */
			aria-pressed={isSelected}
			className={cn(
				"flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm",
				"transition-colors hover:bg-muted-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				isDestructive && "text-danger",
				isDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
			)}
			disabled={isDisabled}
			onClick={onPress}
			type="button"
		>
			{isSelected === undefined ? null : (
				<Check
					aria-hidden="true"
					className={cn("size-4 shrink-0", isSelected ? "text-accent" : "invisible")}
				/>
			)}
			{Icon ? (
				<Icon
					aria-hidden="true"
					className={cn("size-4 shrink-0", isDestructive ? "text-danger" : "text-muted")}
				/>
			) : null}
			<span className="flex min-w-0 flex-col">
				<span className="truncate font-medium">{label}</span>
				{disabledReason ? <span className="truncate text-xs text-muted">{disabledReason}</span> : null}
			</span>
		</button>
	);
}

/* -------------------------------------------------------------------------- */
/* Shape                                                                      */
/* -------------------------------------------------------------------------- */

function isChoiceSection(section: DropdownSection): section is DropdownChoiceSection {
	return "selectionMode" in section;
}

function isSubmenu(item: DropdownAction | DropdownSubmenu): item is DropdownSubmenu {
	return "items" in item;
}

function isKbdKey(token: string): token is KbdKeyName {
	return (KBD_KEYS as readonly string[]).includes(token);
}

/**
 * Every destructive action, pulled out of wherever it was declared and put in
 * one section at the end.
 *
 * It is done here rather than asked of the caller because the failure is silent
 * and expensive: a "Delete" sitting one arrow key below "Duplicate" looks
 * completely normal until someone presses it.
 */
function hoistDestructive(sections: DropdownSection[]): DropdownSection[] {
	const destructive = sections.flatMap((section) =>
		isChoiceSection(section)
			? []
			: section.items.filter((item): item is DropdownAction => !isSubmenu(item) && Boolean(item.isDestructive)),
	);

	if (destructive.length === 0) return sections;

	const kept = sections
		.map((section) =>
			isChoiceSection(section)
				? section
				: { ...section, items: section.items.filter((item) => isSubmenu(item) || !item.isDestructive) },
		)
		.filter((section) => section.items.length > 0);

	return [...kept, { items: destructive, key: "destructive" }];
}

/** The menu hands back a key; the item that owns it knows what to do. */
function dispatch(sections: DropdownSection[], key: string) {
	for (const section of sections) {
		if (isChoiceSection(section)) continue;

		for (const item of section.items) {
			if (!isSubmenu(item) && item.key === key) {
				item.onAction();
				return;
			}
		}
	}
}
