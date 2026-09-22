import { Checkbox, Skeleton, Table } from "@heroui/react";
import { ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AppTableHighlight, AppTableHighlightProvider } from "../AppTableHighlight";

export interface ColumnDef<T> {
	key: string;
	/** May be empty - `columnLabel` falls back to the key. */
	label: string;
	render?: (row: T) => ReactNode;
	/**
	 * Turns the header into a sort control. Opt-in per column, because most
	 * columns have no meaningful order - sorting a service-level column alphabetically
	 * produces a sequence nobody asked for, and offering the control implies one
	 * exists.
	 */
	allowsSorting?: boolean;
	/**
	 * What the column orders by, when the cell shows something that cannot be
	 * ordered as it reads.
	 *
	 * This is the trap sorting usually falls into: an "Updated" column rendering
	 * "3 days ago" sorts as text, which puts "3 days ago" after "20 days ago"
	 * because `2` precedes `3`. Point this at the underlying timestamp and the
	 * column sorts by the thing it is describing. Defaults to `row[key]`.
	 */
	sortValue?: (row: T) => string | number | boolean | null | undefined;
	/**
	 * Set `false` to keep a column out of `AppColumnPicker` - a status column on
	 * a queue that exists to triage status, say.
	 *
	 * The first column and the actions column are already excluded and cannot be
	 * opted back in; see `isColumnHideable`. Defaults to true, so a table that
	 * adopts the picker offers everything else without a per-column edit.
	 */
	isHideable?: boolean;
	/**
	 * What the search box matches this column against, when the cell shows
	 * something the raw field does not contain.
	 *
	 * Same trap as `sortValue`: an "Updated" column rendering "3 days ago" over a
	 * timestamp matches neither "3 days" nor a date the user types. Point this at
	 * whatever a person would actually search for. Defaults to `row[key]`.
	 */
	searchValue?: (row: T) => string;
	/**
	 * What the cell does when its content is wider than the column.
	 *
	 * Defaults to `nowrap`, and that default is the point. The table already owns
	 * a horizontal scroll container and a pinned actions column - it has somewhere
	 * to put the overflow - so a column that squeezes its content into three
	 * lines is spending the reader's vertical space to avoid using the scroll it
	 * already paid for. Let the column be as wide as it needs and let the table
	 * scroll.
	 *
	 * - `nowrap` - one line, column sizes to its content. Right for almost
	 *   everything: ids, codes, dates, counts, emails, names.
	 * - `wrap` - allowed to run onto more lines, breaking at spaces only. For a
	 *   genuinely long free-text column - an address, a note - where one line
	 *   would make the table absurdly wide.
	 * - `truncate` - one line, clipped with an ellipsis at `maxWidthClassName`.
	 *   The full value stays in the DOM, so a screen reader still reads all of
	 *   it, and `title` gives it back to a mouse.
	 */
	wrap?: ColumnWrap;
	/**
	 * The cap a `truncate` column clips at - `"max-w-48"`. Without it there is no
	 * width to clip against and `truncate` does nothing, so the two go together.
	 */
	maxWidthClassName?: string;
}

export type ColumnWrap = "nowrap" | "truncate" | "wrap";

/**
 * `<body>` carries `wrap-anywhere` (`overflow-wrap: anywhere`) to stop a long
 * unbroken string blowing out a card. Inside a table it does something much
 * worse than it looks, and it is why columns were shrinking instead of
 * scrolling.
 *
 * Unlike `break-word`, `anywhere` is counted when the browser computes a box's
 * MIN-CONTENT width. A cell holding "desk-1@long.example" therefore reports a
 * min-content width of roughly one character, so the table's own min-content
 * width collapses, `table-layout: auto` happily squeezes every column down to
 * the `min-w-32` floor, and the ScrollContainer never has anything to scroll.
 * The email then breaks mid-token across three lines - unreadable, and
 * unselectable as one string.
 *
 * Resetting it per cell restores honest intrinsic sizing: columns ask for the
 * width they need, the table overflows, and the scroll container does its job.
 */
const CELL_WRAP_RESET = "[&_th]:[overflow-wrap:normal] [&_td]:[overflow-wrap:normal]";

const WRAP_CLASS: Record<ColumnWrap, string> = {
	nowrap: "whitespace-nowrap",
	// The clip lives on the inner block, not here - see CellBody.
	truncate: "",
	wrap: "",
};

/**
 * The inside of a cell.
 *
 * `truncate` needs a real width to clip against, and `max-width` on a `<td>` is
 * not honoured under `table-layout: auto` - the cell sizes to its content and
 * the ellipsis never appears. A block-level child inside the cell DOES respect
 * one, so the cap and the clip both go here.
 *
 * Every other mode renders its children unwrapped, so the common case adds no
 * element to the DOM at all.
 */
function CellBody<T>({ children, column }: { children: ReactNode; column: ColumnDef<T> }) {
	if (column.wrap !== "truncate") return <>{children}</>;

	return <span className={`block truncate ${column.maxWidthClassName ?? "max-w-48"}`}>{children}</span>;
}

export type TableSortDirection = "ascending" | "descending";

export interface TableSortDescriptor {
	column: string;
	direction: TableSortDirection;
}

/**
 * Every column gets a visible header, including the actions column that ten of
 * these tables shipped with `label: ""`. An empty `<th>` is announced as nothing
 * by a screen reader, so the column has no name to navigate by - and sighted
 * users lose the one cue that the column is a column at all once it is pinned.
 *
 * Falling back to the key rather than requiring a label everywhere means a new
 * table cannot reintroduce the gap by omission.
 */
function columnLabel<T>(column: ColumnDef<T>): string {
	if (column.label) return column.label;
	return column.key.charAt(0).toUpperCase() + column.key.slice(1);
}

interface AppTableProps<T extends { id: string | number }> {
	"data-cy"?: string;
	columns: ColumnDef<T>[];
	rows: T[];
	isLoading?: boolean;
	/**
	 * What to show when there are no rows. A string gets centred muted copy; pass
	 * an `AppEmptyState` when the table can say *why* it is empty, which is the
	 * version a user can act on.
	 *
	 * It renders in one cell spanning every column, under a header that stays
	 * put. This used to be dropped into the first cell with the rest of the row
	 * left blank, which is not an empty state - it is a broken row that says
	 * "no data" in the Name column and leaves four empty boxes beside it.
	 */
	emptyContent?: string | ReactNode;
	onRowAction?: (id: string | number) => void;
	/**
	 * Adds a leading checkbox column. `"multiple"` also puts a select-all box in
	 * the header, checked when every visible row is selected and dashed on a
	 * partial one. `"none"` renders no column at all.
	 *
	 * The table only paints the control - it holds no selection state. Give it
	 * `selectedKeys` and `onSelectionChange` and keep the set yourself, keyed by
	 * `row.id`, or reach for `AppDataTable` which wires the action bar too.
	 */
	selectionMode?: "none" | "single" | "multiple";
	/** Controlled selection, by `row.id`. `"all"` is React Aria's every-row sentinel. */
	selectedKeys?: "all" | Set<string | number>;
	onSelectionChange?: (keys: "all" | Set<string | number>) => void;
	className?: string;
	/**
	 * Per-column floor, applied to every column rather than to the table as a
	 * whole. A table with no floor does not overflow at all - it shrinks columns
	 * until words break one character per line - so the ScrollContainer never
	 * engages. A single table-wide floor cannot work here: 56rem is generous for
	 * four columns and far too tight for eight, which is how an eight-column
	 * table ends up at its minimum width and still compressing.
	 */
	columnMinWidthClassName?: string;
	/**
	 * Pins the last column to the right edge while the rest scrolls under it, so
	 * row actions stay reachable without scrolling to the end.
	 *
	 * Defaults to on when the last column's key is `actions`, which is the
	 * convention 11 of this app's 14 tables already follow. The three that end in
	 * a data column are left alone - pinning `expiresAt` would be nonsense.
	 */
	hasStickyActions?: boolean;
	/**
	 * How many skeleton rows to draw while loading. Set it to the page size: a
	 * skeleton shorter than the real page makes the content jump when it lands,
	 * which reads as slower than showing nothing.
	 */
	skeletonRowCount?: number;
	/**
	 * Which column is sorted, and which way. Controlled, and deliberately so.
	 *
	 * The table is handed one page of rows and cannot see the rest, so it must
	 * not be the thing that sorts them: sorting page 1 of 6 in here would order
	 * ten rows and quietly lie about the other 43. Whoever owns the full set
	 * sorts it *before* paginating - `useTableSort` below for a client-side list,
	 * the query for a server-side one.
	 */
	sortDescriptor?: TableSortDescriptor;
	onSortChange?: (descriptor: TableSortDescriptor) => void;
	/**
	 * The live search term. Every plain-text cell marks its matches, and the term
	 * is published on context so a column's own `render` can mark its matches too
	 * with `<AppTableHighlight>`.
	 *
	 * Searching a table that then looks identical is the defect this closes: the
	 * rows changed, nothing said which words caused it, and on a ten-column table
	 * the matched cell is often not even the one being read. `AppDataTable` wires
	 * this for you; pass it by hand only when composing the pieces yourself.
	 */
	highlightQuery?: string;
	/**
	 * The table's accessible name. Defaults to "Data table", which is what all
	 * fourteen of this app's tables announced themselves as - the accessible-name
	 * equivalent of an untitled page, and useless the moment a screen has two.
	 * `AppDataTable` passes its own title here.
	 */
	label?: string;
}

/**
 * Blanks sort to the bottom in **both** directions, so this answer is returned
 * unmultiplied by the direction factor. Flipping it would park every empty cell
 * at the top of a descending sort, which is the one position nobody sorts a
 * column to reach.
 *
 * Returns `null` when neither side is blank and the real comparison should run.
 */
function compareBlanks(a: unknown, b: unknown): number | null {
	const aBlank = a === null || a === undefined || a === "";
	const bBlank = b === null || b === undefined || b === "";
	if (!aBlank && !bBlank) return null;
	if (aBlank && bBlank) return 0;
	return aBlank ? 1 : -1;
}

function compareValues(a: string | number | boolean, b: string | number | boolean): number {
	if (typeof a === "number" && typeof b === "number") return a - b;
	if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
	// `numeric` because table labels routinely end in a number - "Warehouse 10"
	// belongs after "Warehouse 9", and a plain codepoint comparison puts it after
	// "Warehouse 1" instead. Every list of numbered records sorts wrong without it.
	return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Client-side sorting for a table whose rows are all in memory.
 *
 * Sort the full list with this and paginate the result - never the other way
 * round. Returns the sorted rows plus the two props `AppTable` needs, so a
 * caller wires it in one spread.
 *
 * A server-paginated table does not use this: it puts the descriptor in its
 * query key and lets the api do the ordering.
 */
export function useTableSort<T>(rows: T[], columns: ColumnDef<T>[], initialDescriptor?: TableSortDescriptor) {
	const [sortDescriptor, setSortDescriptor] = useState<TableSortDescriptor | undefined>(initialDescriptor);

	const sortedRows = useMemo(() => {
		if (!sortDescriptor) return rows;
		const column = columns.find((col) => col.key === sortDescriptor.column);
		// A descriptor naming a column that has since lost `allowsSorting` - a
		// filter swapped the columns out, say - orders nothing rather than falling
		// back to an arbitrary key.
		if (!column?.allowsSorting) return rows;

		const read = column.sortValue ?? ((row: T) => (row as Record<string, unknown>)[column.key] as string | number);
		const factor = sortDescriptor.direction === "descending" ? -1 : 1;

		// Copied, because `sort` mutates and `rows` is state owned by the caller.
		// Sorting it in place makes the memo's own dependency change under it.
		return [...rows].sort((a, b) => {
			const left = read(a);
			const right = read(b);
			const blanks = compareBlanks(left, right);
			if (blanks !== null) return blanks;
			return compareValues(left as string | number | boolean, right as string | number | boolean) * factor;
		});
	}, [columns, rows, sortDescriptor]);

	return { onSortChange: setSortDescriptor, rows: sortedRows, sortDescriptor };
}

/**
 * The header bar is painted behind the header cells, not by them.
 *
 * The `secondary` variant draws the bar as a background on each `th` and rounds
 * the ends on whichever cells sit at them - `th:first-child` takes the left
 * pair, `th:last-child` the right. A cell scrolls, so a radius on a cell
 * scrolls: swipe sideways and the first column carries the left curve out of
 * view, leaving the edge you are actually looking at square.
 *
 * Emptying the cells and putting one rounded bar behind them, outside the
 * scroll container, makes the corners a property of the frame instead of
 * whichever column is currently parked against it. The right end is the
 * exception and needs no help - that cell is pinned, so the radius HeroUI gives
 * it is already at the visible edge at every scroll position, and it has to
 * stay opaque anyway to stop the scrolling columns showing through it.
 *
 * `!` because HeroUI's `.table-root--secondary .table__column` is (0,2,0) and
 * an arbitrary variant is (0,1,1). The pinned cell then wins its background
 * back at (0,2,1), important against important.
 */
const HEADER_BAR_BEHIND = "[&_th]:bg-transparent!";

/**
 * Height of that bar, and the one number here that is not derived.
 *
 * `.table__column` is `py-2.5 text-xs`: 10px of padding either side of a 16px
 * line box, so 36px. Nothing computes it for us - the bar lives outside the
 * scroll container precisely so it does not move with the table, which also
 * means it cannot measure it. Change the header's padding or type scale and
 * this has to change with it, or the grey stops meeting the first row.
 */
const HEADER_BAR_HEIGHT = "h-9";

/**
 * HeroUI has no column pinning, so this is done through its documented CSS
 * hooks. The header cell sits above the body cell (z-20 over z-10) because the
 * header is itself sticky in some tables and the two would otherwise fight.
 */
const STICKY_LAST_COLUMN = [
	// th/td rather than HeroUI's .table__column / .table__cell: Tailwind turns
	// every underscore in an arbitrary variant into a space, so a BEM class with
	// a double underscore compiles to a selector that matches nothing. These are
	// the same elements by another name.
	//
	// The actions column is sized to its buttons rather than left on the
	// per-column floor below. `.table__content` is `w-full` with an auto layout,
	// so a 128px floor on a cell holding two 32px icon buttons parks the buttons
	// against the left of a column half of which is dead space - and because it
	// is the last column, every pixel of the table's slack lands in that gap. The
	// `:last-child` selector outranks the `[&_th]` floor on specificity, and
	// `w-px` in an auto layout means "as narrow as the content allows", which
	// hands the slack back to the first column where the names are.
	"[&_th:last-child]:w-px",
	"[&_th:last-child]:min-w-0",
	"[&_th:last-child]:whitespace-nowrap",
	"[&_td:last-child:not(:first-child)]:whitespace-nowrap",
	"[&_th:last-child]:sticky",
	"[&_th:last-child]:right-0",
	"[&_th:last-child]:z-20",
	// surface-secondary, not surface: this is the token .table__column already
	// uses, and anything else reads as a white block floating in the header.
	// Important, to win back the background HEADER_BAR_BEHIND takes off every
	// other header cell - this one is opaque or the columns scroll through it.
	"[&_th:last-child]:bg-surface-secondary!",
	// Being opaque, it covers the right end of the bar behind it and has to
	// finish the curve itself. `rounded-r-sm` to match, rather than the 24px
	// HeroUI gives this cell - two radii on the same corner is one too many.
	"[&_th:last-child]:rounded-r-sm!",
	// The column reads as raised over the ones sliding beneath it, which is the
	// honest description of what it is doing. A border says "there is an edge
	// here"; elevation says "the rest of the table is underneath", and it is the
	// second one that tells you to keep scrolling.
	//
	// Drawn as a gradient on a pseudo-element rather than a `box-shadow`, because
	// a shadow is cast per cell and arrives in per-row segments: an outer one
	// blurs past the cell's top and bottom edges, where the next row's opaque
	// cell paints over it, and an inset one stops short at both ends. This strip
	// is `inset-y-0` - exactly the cell's own height, no blur to spill - so
	// stacked cells abut into one unbroken gradient down the whole table.
	//
	// `right-full` parks it entirely outside the left edge; the pinned cell's own
	// z-index carries it over the columns passing below.
	"[&_th:last-child]:relative",
	"[&_th:last-child]:before:absolute",
	"[&_th:last-child]:before:inset-y-0",
	"[&_th:last-child]:before:right-full",
	"[&_th:last-child]:before:w-3",
	"[&_th:last-child]:before:content-['']",
	"[&_th:last-child]:before:bg-[linear-gradient(to_left,rgba(0,0,0,0.10),transparent)]",
	"[&_td:last-child:not(:first-child)]:relative",
	"[&_td:last-child:not(:first-child)]:before:absolute",
	"[&_td:last-child:not(:first-child)]:before:inset-y-0",
	"[&_td:last-child:not(:first-child)]:before:right-full",
	"[&_td:last-child:not(:first-child)]:before:w-3",
	"[&_td:last-child:not(:first-child)]:before:content-['']",
	"[&_td:last-child:not(:first-child)]:before:bg-[linear-gradient(to_left,rgba(0,0,0,0.10),transparent)]",
	// `:not(:first-child)` spares the empty-state row. renderEmptyState puts one
	// cell spanning every column, so it is both first and last child - left
	// alone it would be pinned to the right edge of the table.
	"[&_td:last-child:not(:first-child)]:sticky",
	"[&_td:last-child:not(:first-child)]:right-0",
	"[&_td:last-child:not(:first-child)]:z-10",
	// surface, not background: `--background` is the page behind the card, so the
	// pinned column came out a shade off every other cell in its own row.
	"[&_td:last-child:not(:first-child)]:bg-surface",
	// ...and the hover tint has to be repainted opaque here. HeroUI hovers a row
	// by dropping `bg-default/50` on its cells, which this rule outranks - so the
	// pinned column stayed white while the rest of its row went grey. It cannot
	// simply lose: a translucent pinned cell lets the scrolled columns show
	// through it. This is the same colour, composited against the surface
	// underneath rather than layered over it.
	"[&_tr:hover_td:last-child:not(:first-child)]:bg-[color-mix(in_srgb,var(--default)_50%,var(--surface))]",
].join(" ");

/**
 * The selection checkbox column, sized to the box rather than left on the
 * per-column floor.
 *
 * `columnMinWidthClassName` puts `min-w-32` on every `th`, which on a ~20px
 * checkbox is 7rem of dead space between the tick and the first real column.
 * `w-px` under `table-layout: auto` means "as narrow as the content allows" -
 * the same trick STICKY_LAST_COLUMN plays on the actions column at the other
 * end - and it has to be an arbitrary `[&_th:first-child]` variant, not a plain
 * `min-w-0` utility, to outrank that floor on specificity. `pe-0` closes the gap
 * to the first column so the checkbox reads as gutter, not as its own field.
 */
const SELECTION_COLUMN = [
	"[&_th:first-child]:w-px",
	"[&_th:first-child]:min-w-0",
	"[&_th:first-child]:pe-0",
	"[&_td:first-child]:pe-0",
].join(" ");

/**
 * One row's - or the header's - selection control. `slot="selection"` is what
 * wires it to React Aria's selection state; the compound children are HeroUI's
 * required checkbox anatomy. The header instance keeps the default variant so
 * its indeterminate dash reads at a glance; rows use `secondary` to sit quieter
 * against a tinted selected row.
 */
function SelectionCheckbox({ isHeader = false, label }: { isHeader?: boolean; label: string }) {
	return (
		<Checkbox
			aria-label={label}
			slot="selection"
			variant={isHeader ? undefined : "secondary"}
		>
			<Checkbox.Content>
				<Checkbox.Control>
					<Checkbox.Indicator />
				</Checkbox.Control>
			</Checkbox.Content>
		</Checkbox>
	);
}

export function AppTable<T extends { id: string | number }>({
	columns,
	rows,
	"data-cy": dataCy,
	isLoading = false,
	emptyContent = "No data available.",
	onRowAction,
	selectionMode = "none",
	selectedKeys,
	onSelectionChange,
	className,
	columnMinWidthClassName = "[&_th]:min-w-32",
	hasStickyActions,
	skeletonRowCount = 5,
	sortDescriptor,
	onSortChange,
	highlightQuery = "",
	label,
}: AppTableProps<T>) {
	// The convention, not a flag every caller has to remember to set.
	const isStickyActions = hasStickyActions ?? columns.at(-1)?.key === "actions";
	const skeletonRows = Array.from({ length: skeletonRowCount }, (_, i) => i);
	// HeroUI draws no checkbox column on its own - `selectionMode` alone just
	// makes a row-click select. The leading column and cells below are what turn
	// it into a visible multi-select.
	const hasSelection = selectionMode !== "none";

	return (
		<AppTableHighlightProvider value={highlightQuery}>
			{/* The hook goes on the Table, not on the provider: the provider renders
			    no DOM, and a spec needs the element it can scope rows to. */}
			<Table
				className={className}
				data-cy={dataCy}
				variant="secondary"
			>
				{/* `min-w-0` because this div now stands between the root grid's
			    `minmax(0, 1fr)` and the scroll container. That track is the hard
			    width boundary the table cannot push past; without the floor here the
			    boundary lands on a div that happily stretches, and the container
			    never scrolls. */}
				<div className="relative min-w-0">
					{/* The header bar. Outside the scroll container, so it holds its
				    corners while the columns slide beneath it - see HEADER_BAR_BEHIND.
				    Decorative: the header it sits behind is the real one.

				    `rounded-sm` is 12px, the bottom of this theme's radius scale, in
				    place of the 24px HeroUI computes from `min(32px,
				    var(--radius-2xl))`. Two thirds of a 36px bar's own height is not a
				    corner, it is a lozenge, and it makes a table of records read as a
				    badge. A small radius says panel. */}
					<div
						aria-hidden="true"
						className={`pointer-events-none absolute inset-x-0 top-0 rounded-sm bg-surface-secondary ${HEADER_BAR_HEIGHT}`}
					/>
					{/* Without a ScrollContainer a wide table crushes or clips its last
				    columns instead of scrolling - and the last column is where the row
				    actions live, so the actions become unreachable rather than merely
				    ugly. Every HeroUI Table example wraps Content in this. `relative`
				    so it paints over the bar rather than under it. */}
					<Table.ScrollContainer className="relative">
						<Table.Content
							aria-label={label ?? "Data table"}
							className={`${columnMinWidthClassName} ${CELL_WRAP_RESET} ${HEADER_BAR_BEHIND}${isStickyActions ? ` ${STICKY_LAST_COLUMN}` : ""}${hasSelection ? ` ${SELECTION_COLUMN}` : ""}`}
							onRowAction={onRowAction ? (key) => onRowAction(key as string | number) : undefined}
							onSelectionChange={
								onSelectionChange
									? (keys) => onSelectionChange(keys === "all" ? "all" : new Set(keys as Set<string | number>))
									: undefined
							}
							// React Aria reports the column by its `id`, which is why every
							// column below sets one. Narrowed back to our own descriptor type so
							// callers never handle a bare `Key`.
							onSortChange={
								onSortChange
									? (descriptor) =>
											onSortChange({
												column: String(descriptor.column),
												direction: descriptor.direction,
											})
									: undefined
							}
							selectedKeys={selectedKeys}
							selectionMode={selectionMode}
							sortDescriptor={sortDescriptor}
						>
							<Table.Header>
								{/* The selection column, ahead of every real one. Its header
								    holds the select-all box in `multiple` mode; in `single`
								    mode there is nothing to select all, so it carries only an
								    sr-only name and React Aria renders the per-row control. */}
								{hasSelection ? (
									<Table.Column>
										{selectionMode === "multiple" ? (
											<SelectionCheckbox
												isHeader
												label="Select all rows"
											/>
										) : (
											<span className="sr-only">Select</span>
										)}
									</Table.Column>
								) : null}
								{columns.map((col, i) => (
									<Table.Column
										allowsSorting={col.allowsSorting}
										// Headers never wrap, whatever the column's cells do. A two-word
										// label folding onto a second line makes the header row taller
										// than HEADER_BAR_HEIGHT - and that bar is painted from outside
										// the scroll container, so it cannot measure the row it sits
										// behind and simply stops covering it.
										className="whitespace-nowrap"
										// Explicit, rather than left to React Aria's generated key:
										// it is what comes back through `onSortChange`, and a
										// generated one would not match the `key` a caller sorts by.
										id={col.key}
										isRowHeader={i === 0}
										key={col.key}
									>
										{col.allowsSorting
											? ({ sortDirection }) => (
													/* `justify-start`, against the slot's own
												   `justify-between`: that pushes the chevron to the far
												   right of the cell, so on a wide column the arrow ends
												   up nearer the next column's label than its own and
												   reads as belonging to it. Beside the label it is
												   unambiguous. */
													<Table.SortableColumnHeader
														className="justify-start gap-1.5"
														sortDirection={sortDirection}
													>
														{columnLabel(col)}
														{/* HeroUI draws its chevron only once a column is
													    sorted, which leaves an unsorted sortable column
													    looking exactly like an inert one - the control is
													    there, and nothing says so until you have already
													    guessed. This dimmed pair is the affordance, and it
													    is swapped for the real indicator on sort so the
													    label never shifts. */}
														{sortDirection ? null : (
															<ChevronsUpDown
																aria-hidden="true"
																className="size-3 shrink-0 text-muted opacity-60"
															/>
														)}
													</Table.SortableColumnHeader>
												)
											: columnLabel(col)}
									</Table.Column>
								))}
							</Table.Header>
							{/* renderEmptyState, not a hand-built row: React Aria draws it in a
					    single cell spanning every column, so the empty state is centred
					    under a header that stays put rather than crammed into the first
					    column. It only fires when the body has no children, which is why
					    the loading branch below still has to return its skeletons. */}
							<Table.Body
								renderEmptyState={
									isLoading
										? undefined
										: () =>
												typeof emptyContent === "string" ? (
													<p className="px-6 py-12 text-center text-sm text-muted">{emptyContent}</p>
												) : (
													emptyContent
												)
								}
							>
								{isLoading
									? skeletonRows.map((i) => (
											<Table.Row
												id={`skeleton-${i}`}
												key={`skeleton-${i}`}
											>
												{hasSelection ? (
													<Table.Cell>
														<Skeleton className="size-4 rounded" />
													</Table.Cell>
												) : null}
												{columns.map((col) => (
													<Table.Cell key={col.key}>
														<Skeleton className="h-4 w-full rounded" />
													</Table.Cell>
												))}
											</Table.Row>
										))
									: rows.map((row) => (
											/*
											 * The pointer is only correct when the row actually does
											 * something. Tailwind's reset leaves interactive elements on
											 * the default arrow, so a row wired to onRowAction gives no
											 * sign it can be pressed until it is - and a row wired to
											 * nothing must keep the arrow, or every table promises a
											 * click it will not honour.
											 */
											<Table.Row
												className={onRowAction ? "cursor-pointer" : undefined}
												id={row.id}
												key={row.id}
											>
												{/* The checkbox toggles selection; a row wired to
												    `onRowAction` still activates on a click anywhere
												    else in the row - React Aria keeps the two apart
												    once a `slot="selection"` cell exists. */}
												{hasSelection ? (
													<Table.Cell>
														<SelectionCheckbox label={`Select row ${row.id}`} />
													</Table.Cell>
												) : null}
												{columns.map((col) => (
													<Table.Cell
														className={WRAP_CLASS[col.wrap ?? "nowrap"]}
														key={col.key}
													>
														{/*
														 * A cell with its own `render` is left alone - it may be a
														 * chip, a button or a whole layout, and walking a
														 * ReactNode tree to find text to mark would mangle it.
														 * Those columns opt in with `<AppTableHighlight>` instead.
														 */}
														<CellBody column={col}>
															{col.render ? (
																col.render(row)
															) : (
																<AppTableHighlight>
																	{String((row as Record<string, unknown>)[col.key] ?? "")}
																</AppTableHighlight>
															)}
														</CellBody>
													</Table.Cell>
												))}
											</Table.Row>
										))}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</div>
			</Table>
		</AppTableHighlightProvider>
	);
}
