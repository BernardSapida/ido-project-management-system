import { Chip, Label, ListBox, Select } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { AppButton } from "../AppButton";
import { cn } from "../../lib/cn";

export interface FilterOption {
	label: string;
	value: string;
}

export interface FilterDef {
	/** Shown as the value when nothing is picked, and the "all" choice. */
	allLabel: string;
	icon: LucideIcon;
	key: string;
	label: string;
	options: FilterOption[];
}

interface AppFilterBarProps {
	/**
	 * Controls that shape the TABLE rather than the row set - a column picker,
	 * a density toggle, an export. They sit in the header strip, which never
	 * collapses, behind a divider that separates them from `Clear all`.
	 *
	 * Deliberately not in the panel below. A column picker folded away with the
	 * filters leaves "3 active" - a count of filters - sitting above a table
	 * missing four columns and saying nothing about it, and it puts two resets
	 * with different scopes in one box, where "Clear all" either silently
	 * restores columns or silently does not. Both are wrong; the divider is the
	 * cheaper answer.
	 */
	actions?: ReactNode;
	className?: string;
	/**
	 * Whether the controls start open. Leave it on for a table whose filters are
	 * the point; turn it off on a page where the rows matter more than the
	 * controls above them.
	 */
	defaultOpen?: boolean;
	/**
	 * How many OTHER controls, ones this bar does not render, are narrowing the
	 * same rows - a row of counter tiles, a segmented control, a scope the page
	 * owns.
	 *
	 * A count rather than the controls themselves, because the bar has no job
	 * drawing them; it only has to stop lying about them. A page whose tiles have
	 * cut the table to three rows while the chip reads "0 active" is the exact
	 * failure the chip exists to prevent, and it does not become less of one
	 * because the control lives forty pixels higher up the page.
	 *
	 * "Clear all" still calls `onReset` and nothing else, so whoever owns those
	 * controls clears them there - the same way `searchTerm` is counted here and
	 * cleared by the caller.
	 */
	externalFilterCount?: number;
	/** Current value per filter key. A key absent or null means "all". */
	filters: Record<string, string | null>;
	onFilterChange: (key: string, value: string | null) => void;
	onReset: () => void;
	/**
	 * Counted in the "N active" chip and cleared by "Clear all", even though the
	 * search box itself lives OUTSIDE this bar.
	 *
	 * Both halves are deliberate. The count answers "is anything narrowing these
	 * rows?", and a table filtered to three results while the chip reads "0
	 * active" is the exact lie the chip exists to prevent. And a "Clear all" that
	 * left a search term behind would leave the table filtered by something the
	 * button just claimed to have cleared.
	 */
	searchTerm?: string;
	selects: FilterDef[];
}

/**
 * The filter bar that sits above a table.
 *
 * A bar rather than a modal on purpose: filtering is iterative - set one, look
 * at the rows, adjust - and a modal makes every one of those a three-click
 * round trip while hiding the result you are filtering towards. The count and
 * "Clear all" live in the header because the worst state a filtered table can
 * be in is empty with no visible reason why.
 *
 * Every control carries a leading glyph. That is not decoration: a row of four
 * identical grey boxes is unreadable at a glance, and the glyph is what makes
 * "Status" findable without reading all four labels.
 *
 * SEARCH IS NOT IN HERE. It used to be the first cell of the grid below, which
 * put the single most-used control in the box that folds away - press Hide and
 * the search field goes with it, so the fastest way to find a row was hidden
 * behind a control whose whole purpose is to hide the *slow* way. It also read
 * as a peer of the four dropdowns, and it is not one: the selects narrow by
 * known dimensions from a fixed list, search is free text and answers a
 * different question ("where is this one row?"). It now sits above the table in
 * `AppDataTable`, always visible, and only its VALUE reaches this bar - see
 * `searchTerm`.
 *
 * The controls collapse. Five inputs is a lot of vertical furniture to scroll
 * past once you have set them, so the header stays put and the grid folds away
 * under it. The header is the whole reason that is safe: the live count and
 * "Clear all" never collapse, so a folded bar can still say that four filters
 * are on and still let you drop them - the failure mode of every collapsible
 * filter panel is hiding the fact that anything is filtered at all.
 *
 * It is a panel with its own surface, and that is load-bearing rather than
 * decorative. Laid out as bare fields on the page background, the five controls
 * had nothing grouping them but proximity - the weakest cue there is, and one
 * the table 16px below competes with directly. A shared background is what makes
 * a set of controls read as one region, so without it "Filters" stops being the
 * name of the panel and becomes a heading over the whole page, table included.
 *
 * The collapse needs it too. With no container, pressing Hide leaves the header
 * floating over the table with no body it could have folded into - a stray row
 * of text and buttons rather than a panel in its closed state. Bounded, the same
 * press visibly shrinks the panel to its own header, which is the one reading
 * that makes Show the obvious way back.
 */
export function AppFilterBar({
	actions,
	className,
	defaultOpen = true,
	externalFilterCount = 0,
	filters,
	onFilterChange,
	onReset,
	searchTerm = "",
	selects,
}: AppFilterBarProps) {
	const activeCount =
		selects.filter((select) => filters[select.key]).length + (searchTerm ? 1 : 0) + externalFilterCount;
	const hasActive = activeCount > 0;
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const panelId = useId();

	return (
		/* `rounded-xl` is 20px on this theme's scale, under AppGlassCard's 28px. An
		   inset panel matching its container's radius reads as a second card
		   floating inside the first; a step down reads as part of it. */
		<div className={cn("rounded-xl border border-border bg-surface", className)}>
			<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
				<div className="flex items-center gap-2">
					<span className="grid size-8 place-items-center rounded-xl bg-muted-surface text-accent">
						<SlidersHorizontal
							aria-hidden="true"
							className="size-4"
						/>
					</span>
					<p className="font-semibold">Filters</p>
					{/*
					 * The count is live and always rendered, including at zero. A
					 * count that appears only when non-zero is a count you have to
					 * notice the absence of.
					 *
					 * FLAT TONE CLASSES, and no `color`/`variant` reaching HeroUI -
					 * the same rule AppChip follows, for the same reason. HeroUI's
					 * `.chip--accent.chip--soft` resolves `--accent-soft`, which is
					 * `color-mix(in oklab, var(--accent) 15%, transparent)` declared
					 * across four theme scopes behind an `@supports color-mix` guard
					 * whose fallback is SOLID `var(--accent)`. A translucent fill takes
					 * its colour from whatever is behind it, so the same chip does not
					 * reliably render the same twice - which is what made this one read
					 * pink on one pass and grey on the next with the count unchanged.
					 * `chip-soft-*` is one opaque declaration with nothing to derive.
					 */}
					{/* Raw Chip, deliberately. AppChip requires a glyph as well as a
					    label, and that rule is right for the chips it is for - a bare word
					    in a table cell carries no category. A count does: "3 active" says
					    what it is, and a glyph beside it would be decoration. The palette
					    is not lost either way - this reads the same flat chip-soft-* pair
					    AppChip itself renders. */}
					<Chip
						className={cn("border-0", hasActive ? "chip-soft-accent" : "chip-soft-default")}
						size="sm"
					>
						<Chip.Label>{activeCount} active</Chip.Label>
					</Chip>
				</div>
				<div className="flex items-center gap-1">
					{/* The divider is the whole point of the slot. Without it "Columns"
					    sits flush against "Clear all" and reads as one group of three
					    controls that all do the same kind of thing - and the first press
					    of "Clear all" by someone expecting their columns back is a
					    misunderstanding the layout invited. */}
					{actions ? (
						<>
							{actions}
							<span
								aria-hidden="true"
								className="mx-2 h-5 w-px bg-border"
							/>
						</>
					) : null}
					<AppButton
						isDisabled={!hasActive}
						onPress={onReset}
						size="sm"
						variant="ghost"
					>
						Clear all
					</AppButton>
					{/*
					 * A worded toggle, not a bare chevron. "Hide"/"Show" says what the
					 * press does without the user having to work out which way the arrow
					 * is pointing, and it gives the control a name to announce.
					 */}
					<AppButton
						aria-controls={panelId}
						aria-expanded={isOpen}
						icon={ChevronDown}
						iconPosition="end"
						onPress={() => setIsOpen((open) => !open)}
						size="sm"
						variant="ghost"
					>
						{isOpen ? "Hide" : "Show"}
					</AppButton>
				</div>
			</div>

			{/*
			 * `hidden` rather than unmounting: the panel has to exist for the
			 * header's aria-controls to point at something, and a collapse that
			 * remounts throws away the focus position and any half-typed search.
			 * Swapped against `grid` rather than added to it - both set `display`,
			 * and which of the two wins would otherwise come down to Tailwind's
			 * emit order.
			 */}
			{/* The rule is on the panel, not under the header, so it exists exactly
			    when the panel does. A divider that stayed put through the collapse
			    would leave a closed panel underlined for no reason - a line under
			    nothing, which reads as content that failed to render. */}
			<div
				className={cn(
					isOpen ? "grid" : "hidden",
					"gap-3 border-t border-border px-4 py-4 sm:grid-cols-2 lg:grid-cols-4",
				)}
				id={panelId}
			>
				{selects.map((select) => (
					<FilterSelect
						def={select}
						key={select.key}
						onChange={(value) => onFilterChange(select.key, value)}
						value={filters[select.key] ?? null}
					/>
				))}
			</div>
		</div>
	);
}

interface FilterSelectProps {
	def: FilterDef;
	onChange: (value: string | null) => void;
	value: string | null;
}

/**
 * A single dropdown. The "all" choice is a real option rather than a separate
 * clear button, because clearing one filter is the commonest thing a user does
 * here and it should not need a different control from setting it.
 */
function FilterSelect({ def, onChange, value }: FilterSelectProps) {
	const ALL = "__all__";
	const Icon = def.icon;

	return (
		<div>
			{/* Raw Select, deliberately. AppSelect is a react-hook-form field - it
			    takes `control` and `name` and registers itself. This is a filter, not
			    a form field: it owns its value, reports through onChange, and carries
			    a glyph in the trigger that a form select has no slot for. Wrong tool,
			    not a missed migration. */}
			<Select
				className="w-full space-y-1.5"
				onChange={(next) => onChange(next === ALL || next == null ? null : String(next))}
				value={value ?? ALL}
			>
				{/* INSIDE the Select, not a sibling above it. Only in here does React
				    Aria wire it to the trigger and pass the name down to the ListBox in
				    the popover - outside, it is an orphan `<label>` with no `htmlFor`,
				    and the ListBox warns for having no accessible name the moment the
				    popover mounts. `AppSelect` does the same thing for the same reason. */}
				<Label className="text-xs font-medium text-muted">{def.label}</Label>
				{/* HeroUI's `.select__trigger` is an `inline-flex` with no gap, so the
				    glyph and the value render flush against each other - "All cities"
				    reads as part of the icon. The search field two columns over already
				    sets its own gap, and this matches it. */}
				<Select.Trigger className="items-center gap-2">
					<Icon
						aria-hidden="true"
						className="size-4 shrink-0 text-muted"
					/>
					<Select.Value />
					<Select.Indicator />
				</Select.Trigger>
				<Select.Popover>
					<ListBox>
						<ListBox.Item
							id={ALL}
							textValue={def.allLabel}
						>
							{def.allLabel}
							<ListBox.ItemIndicator />
						</ListBox.Item>
						{def.options.map((option) => (
							<ListBox.Item
								id={option.value}
								key={option.value}
								textValue={option.label}
							>
								{option.label}
								<ListBox.ItemIndicator />
							</ListBox.Item>
						))}
					</ListBox>
				</Select.Popover>
			</Select>
		</div>
	);
}
