import type { ColumnDef, DataTableFilter, EmptyReason } from "@bernardsapida/web-ui";
import {
	AppButton,
	AppChip,
	AppColumnPicker,
	AppDataTable,
	AppEmptyState,
	AppGlassCard,
	AppPageHeader,
	AppPagination,
	AppTable,
	AppToast,
	AppTooltip,
	useTableColumns,
	useTableSort,
} from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	CalendarDays,
	CheckCircle2,
	Clock,
	Layers,
	Package,
	Pencil,
	Plus,
	Trash2,
	Truck,
	Warehouse,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Table lab. Developer reference under /components, which owns the backdrop and
 * the nav; every page there is noindex.
 *
 * The first section is the whole thing wired together - filter bar, table,
 * empty states, tracker, pagination - because every one of those is only
 * correct in relation to the others. Filter the list down to nothing and the
 * empty state has to say *filters*, not "no data", and the tracker has to
 * agree with it. That interaction is the bug this page exists to catch.
 *
 * The sections below it freeze the states you would otherwise have to
 * manufacture: loading, each flavour of empty, and a table wide enough to make
 * the actions column pin.
 */
export const Route = createFileRoute("/(references)/components/table")({
	head: () => ({
		meta: [{ title: seo.title("Table lab") }, { content: "noindex", name: "robots" }],
	}),
	component: TableLabPage,
});

function TableLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Filter bar, rows of ten, a tracker that always speaks, and an empty state per reason."
				title="Table lab"
			/>
			<LiveSection />
			<ControlledSection />
			<LoadingSection />
			<EmptySection />
			<StickySection />
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

interface OrderRow {
	city: string;
	/** Drives both the Updated column and the date filter, so the two agree. */
	daysAgo: number;
	id: string;
	name: string;
	/** Express / Standard / Economy. Categorical, which is why it never sorts. */
	service: string;
	status: "active" | "pending" | "closed";
}

const CITIES = ["Quezon City", "Makati", "Cebu", "Davao", "Pasig"];
const SERVICES = ["Express", "Standard", "Economy", "Same-day", "Freight", "Pickup"];
const STATUSES: OrderRow["status"][] = ["active", "pending", "closed"];

/** 53 rows, so the tracker reads "Showing 1-10 of 53 orders" out of the box. */
const ALL_ROWS: OrderRow[] = Array.from({ length: 53 }, (_, i) => ({
	city: CITIES[i % CITIES.length] as string,
	daysAgo: i % 45,
	id: `o-${i + 1}`,
	name: `ORD-${4800 + i}`,
	service: SERVICES[i % SERVICES.length] as string,
	status: STATUSES[i % STATUSES.length] as OrderRow["status"],
}));

/** Windows for the date filter, in days. */
const DATE_WINDOWS: Record<string, number> = { "30d": 30, "7d": 7, "14d": 14 };

function formatUpdated(daysAgo: number): string {
	if (daysAgo === 0) return "Today";
	if (daysAgo === 1) return "Yesterday";
	return `${daysAgo} days ago`;
}

const STATUS_CHIP = {
	active: { icon: Truck, label: "In transit", tone: "success" },
	closed: { icon: CheckCircle2, label: "Delivered", tone: "default" },
	pending: { icon: Clock, label: "Pending", tone: "warning" },
} as const;

/**
 * Status is a lifecycle, not three words, so it sorts by where an order is in
 * that lifecycle rather than by the first letter of its chip. Alphabetically the
 * order would be Delivered, In transit, Pending - which puts the finished orders
 * first and interleaves the two an operator is actually working.
 */
const STATUS_ORDER: Record<OrderRow["status"], number> = {
	active: 1,
	closed: 2,
	pending: 0,
};

/**
 * Each filter carries its own predicate, which is what `AppDataTable` needs to
 * do the narrowing itself. A def with only options describes a dropdown; with
 * the predicate it describes a filter, and there is no way to add one to this
 * array without saying what it does to the rows.
 */
const FILTERS: DataTableFilter<OrderRow>[] = [
	{
		allLabel: "All cities",
		icon: Warehouse,
		key: "city",
		label: "Destination",
		options: CITIES.map((city) => ({ label: city, value: city })),
		predicate: (row, value) => row.city === value,
	},
	{
		allLabel: "All statuses",
		icon: Layers,
		key: "status",
		label: "Status",
		options: STATUSES.map((status) => ({
			label: STATUS_CHIP[status].label,
			value: status,
		})),
		predicate: (row, value) => row.status === value,
	},
	{
		allLabel: "Any service",
		icon: Package,
		key: "service",
		label: "Service",
		options: SERVICES.map((service) => ({ label: service, value: service })),
		predicate: (row, value) => row.service === value,
	},
	{
		allLabel: "Any time",
		icon: CalendarDays,
		key: "updated",
		label: "Updated",
		options: [
			{ label: "Last 7 days", value: "7d" },
			{ label: "Last 14 days", value: "14d" },
			{ label: "Last 30 days", value: "30d" },
		],
		predicate: (row, value) => row.daysAgo <= DATE_WINDOWS[value],
	},
];

const ROWS_PER_PAGE = 10;

/**
 * Four of the six columns sort; two do not, and that is the point.
 *
 * Sorting is offered where an order means something and withheld where it does
 * not. "Service" holds a shipping class - Express is not more or less than
 * Economy, and ordering it alphabetically would produce a sequence that looks
 * authoritative and answers no question anyone has. Actions is not data. A
 * sortable header on either would be a control that works and helps nobody.
 */
function orderColumns(onEdit: (row: OrderRow) => void, onDelete: (row: OrderRow) => void): ColumnDef<OrderRow>[] {
	return [
		{ allowsSorting: true, key: "name", label: "Order" },
		{ allowsSorting: true, key: "city", label: "Destination" },
		{
			key: "service",
			label: "Service",
			render: (row: OrderRow) => (
				<AppChip
					emphasis="soft"
					icon={Package}
					label={row.service}
					size="sm"
					tone="accent"
				/>
			),
		},
		{
			allowsSorting: true,
			key: "status",
			label: "Status",
			sortValue: (row: OrderRow) => STATUS_ORDER[row.status],
			render: (row: OrderRow) => {
				const chip = STATUS_CHIP[row.status];
				return (
					<AppChip
						emphasis="soft"
						icon={chip.icon}
						label={chip.label}
						size="sm"
						tone={chip.tone}
					/>
				);
			},
		},
		{
			allowsSorting: true,
			key: "updated",
			label: "Updated",
			/*
			 * The column this whole feature exists for, and the one that gets it
			 * wrong. The cell reads "Today" / "Yesterday" / "9 days ago", none of
			 * which order as text: sorted by what is rendered, "9 days ago" lands
			 * after "10 days ago", and "Today" sorts under T somewhere in the
			 * middle. `sortValue` points at the number the sentence was built from.
			 */
			sortValue: (row: OrderRow) => row.daysAgo,
			render: (row: OrderRow) => formatUpdated(row.daysAgo),
		},
		{
			key: "actions",
			label: "Actions",
			render: (row: OrderRow) => (
				<div className="flex items-center gap-1">
					{/*
					 * Every icon-only row action gets a tooltip. A pencil and a bin are
					 * only obvious to someone who has used this table before - and the
					 * two sit 4px apart, so "which one was which" is a question asked at
					 * the exact moment it is expensive to get wrong. The `aria-label`
					 * stays: a tooltip is a hover affordance, and it must never be the
					 * only place the name of a control exists.
					 */}
					<AppTooltip
						description="Opens the order's details. Nothing is saved until you submit."
						icon={Pencil}
						placement="top"
						title="Edit order"
					>
						<AppButton
							aria-label={`Edit ${row.name}`}
							icon={Pencil}
							isIconOnly
							onPress={() => onEdit(row)}
							size="sm"
							variant="ghost"
						/>
					</AppTooltip>
					{/*
					 * Destructive actions are red, everywhere, without exception. It is
					 * the only signal separating "delete this order" from the edit
					 * button 4px to its left, and an icon-only button has no verb to
					 * carry the warning instead.
					 *
					 * Red glyph on a ghost button, not the `danger-soft` variant: a
					 * filled red pill on all ten rows spends the whole red budget on a
					 * table nobody came here to delete from, and by the time a real
					 * confirmation appears red reads as decoration. The button keeps
					 * ghost's neutral hover - the colour is carried by the icon.
					 *
					 * `text-danger!` because `.button--ghost` sets `--button-fg` and
					 * `.button` reads it into `color` at the same specificity as the
					 * utility, which leaves the winner down to stylesheet order.
					 */}
					{/*
					 * The destructive one says what happens and that it is recoverable.
					 * "Delete order" alone reads as a point of no return, which is
					 * what makes people hunt for a confirmation dialogue that is not
					 * coming - the second sentence is what lets the press be casual.
					 */}
					<AppTooltip
						description="Removes it from the list. You get an Undo for a few seconds afterwards."
						icon={Trash2}
						placement="top"
						title="Delete order"
					>
						<AppButton
							aria-label={`Delete ${row.name}`}
							className="text-danger!"
							icon={Trash2}
							isIconOnly
							onPress={() => onDelete(row)}
							size="sm"
							variant="ghost"
						/>
					</AppTooltip>
				</div>
			),
		},
	];
}

/** Everything wired together. This is the section that catches real bugs. */
function LiveSection() {
	/*
	 * Every destructive row action confirms itself in a toast, and the toast
	 * carries the way back. This is the rule the table is here to demonstrate: a
	 * delete that removes the row and says nothing leaves the user unsure whether
	 * they hit the button or missed it, and one that opens "Are you sure?"
	 * punishes all ten rows for the one misclick. Act now, report it, offer Undo
	 * for as long as the toast is up - warning rather than success, because it
	 * holds for seven seconds rather than four, which is the window the Undo has
	 * to be reachable in.
	 */
	const columns = orderColumns(
		(row) =>
			AppToast.info(`Edit ${row.name}`, {
				description: "The lab does not open a form.",
				icon: Pencil,
			}),
		(row) =>
			AppToast.warning(`${row.name} deleted`, {
				action: {
					label: "Undo",
					onPress: () =>
						AppToast.success(`${row.name} restored`, {
							description: "Nothing left the lab - it deletes no rows and restores none.",
							icon: Trash2,
						}),
				},
				description: "It will be gone for good once this closes. The lab deletes nothing.",
				icon: Trash2,
			}),
	);

	return (
		<LabSection
			description="One component, not eight. AppDataTable owns the search, the filters, the column picker, the sort, the page and the empty state - so the four bugs that come from wiring those by hand cannot happen: a page left pointing past the end of a filtered set, a tracker counting the unfiltered total, an empty state blaming 'no data' for what the filters did, and a sort applied to the ten rows on screen rather than all 53. Type 'Makati' and every match lights up; filter down to nothing and the empty state has to name the filters as the reason and offer to clear them."
			title="Live"
		>
			<div data-cy="table-live">
				<AppDataTable
					/*
					 * On the TITLE row, right-aligned - not in the filter bar's header
					 * strip, where it sat until it was noticed that a page's primary
					 * button was inside a panel with a Hide control, beside two other
					 * buttons that both act on the filters rather than on the data.
					 */
					actions={
						<AppButton
							icon={Plus}
							onPress={() =>
								AppToast.info("The lab creates nothing", {
									description:
										"In an app this opens the new-order form. Here it is only showing you where the button lives.",
									/* `icon` is required - a toast with no indicator is a bare line
                     of text that reads as page copy the moment it lands. */
									icon: Plus,
								})
							}
							size="sm"
							variant="primary"
						>
							New order
						</AppButton>
					}
					columns={columns}
					description="Every order in the system. Delivered ones stay listed so their history survives, which is why the Status filter is the first thing most people reach for."
					/*
					 * On six columns this is a demonstration, not a recommendation: the
					 * five here are already what an admin decides with, and a picker over
					 * a table with a right answer only hides the answer behind a menu.
					 * The wide table at the bottom of the page is the shape that earns it.
					 */
					filters={FILTERS}
					// h3: this sits inside a LabSection that already owns the h2, and an
					// outline that skips a level is one a screen-reader user cannot walk.
					hasColumnPicker
					headingLevel={3}
					noun="orders"
					rows={ALL_ROWS}
					rowsPerPage={ROWS_PER_PAGE}
					searchPlaceholder="Search orders..."
					/*
					 * Turns on persistence: hidden columns under `<key>:columns`, filters
					 * and search under `<key>:filters`. Navigate away, come back, and the
					 * table is as you left it - with the filter panel open, so the active
					 * count explains why you are looking at three rows of fifty-three.
					 */
					storageKey="app.lab.table.orders"
					title="Orders"
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** Five, so the page control is real inside a specimen this small. */
const CONTROLLED_ROWS_PER_PAGE = 5;

/**
 * Server mode with the CALLER holding the filter values.
 *
 * This is the shape a page needs when its filters belong in the URL, and the
 * three things it buys are all visible here rather than described:
 *
 *   1. **The state line below the table is shareable.** It is built from the
 *      same values the table is rendering, so it cannot drift from them. In the
 *      uncontrolled specimen above there is nothing to build it from - the
 *      values are inside the component.
 *   2. **"Express only" sets the same row set the dropdowns do.** It is a
 *      control the table does not render and cannot know about, which is what
 *      `externalFilterCount` is for: the "N active" chip counts it, and - the
 *      part that matters - an empty table under it says *filtered* instead of
 *      "no orders yet". Turn it on with a city that has none and read the empty
 *      state; that sentence is the whole reason the prop exists.
 *   3. **One "Clear all" clears all three.** `onReset` is the only handler that
 *      can reach the toggle, and it writes every value in one go rather than
 *      three - which for a router caller is one history entry instead of three.
 *
 * The narrowing below stands in for a query. It is deliberately written out
 * rather than delegated to the table: in server mode the table does none of it,
 * and a specimen that hid that fact would be demonstrating client mode with
 * extra steps.
 */
function ControlledSection() {
	const [filters, setFilters] = useState<Record<string, string | null>>({});
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [isExpressOnly, setIsExpressOnly] = useState(false);

	const columns = orderColumns(
		() => undefined,
		() => undefined,
	);

	/*
	 * The "server". Filters, searches and slices exactly as a query would, and in
	 * that order - narrow, then find, then take one page.
	 *
	 * `FILTERS` is reused whole. A `DataTableFilter` is a `FilterDef` with a
	 * predicate, so the same array describes the dropdowns to the table and tells
	 * this fake backend what each choice means; the table ignores the predicates
	 * in server mode, which is the point of it being one array rather than two
	 * that could disagree.
	 */
	const matched = ALL_ROWS.filter((row) => {
		if (isExpressOnly && row.service !== "Express") return false;

		for (const filter of FILTERS) {
			const value = filters[filter.key];
			if (value && !filter.predicate(row, value)) return false;
		}

		const needle = search.trim().toLowerCase();
		if (!needle) return true;
		return row.name.toLowerCase().includes(needle) || row.city.toLowerCase().includes(needle);
	});

	const pageRows = matched.slice((page - 1) * CONTROLLED_ROWS_PER_PAGE, page * CONTROLLED_ROWS_PER_PAGE);

	/** What a router would be holding. Built from the state the table renders, so
	 *  the two cannot disagree - which is the property the whole mode exists for. */
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(filters)) {
		if (value) query.set(key, value);
	}
	if (search.trim()) query.set("search", search.trim());
	if (isExpressOnly) query.set("service", "express");
	if (page > 1) query.set("page", String(page));

	function reset() {
		setFilters({});
		setSearch("");
		setIsExpressOnly(false);
		setPage(1);
	}

	return (
		<LabSection
			description="Server mode, with the page holding the filters instead of the table. Everything the table renders comes from state above it, so the address line under the table is always what a link would carry - and the Express toggle, which the table cannot see, still counts as an active filter and still gets cleared by Clear all."
			title="Controlled filters"
		>
			<div
				className="space-y-4"
				data-cy="table-controlled"
			>
				{/*
				 * The outside control. A toggle rather than a dropdown on purpose: if it
				 * were a dropdown it would belong in the filter bar, and the case worth
				 * showing is the one where it cannot.
				 */}
				<AppButton
					data-cy="controlled-express"
					icon={Package}
					onPress={() => {
						setIsExpressOnly((previous) => !previous);
						// The page reset lives HERE, with the state change, for the reason
						// `onPageChange` gives: one write, one history entry.
						setPage(1);
					}}
					size="sm"
					variant={isExpressOnly ? "primary" : "ghost"}
				>
					{isExpressOnly ? "Express only" : "All services"}
				</AppButton>

				<AppDataTable
					columns={columns}
					// Counted in the bar's "N active", and - the reason it exists - what
					// makes an empty table blame the filters rather than the database.
					externalFilterCount={isExpressOnly ? 1 : 0}
					filters={FILTERS}
					headingLevel={3}
					noun="orders"
					rows={pageRows}
					rowsPerPage={CONTROLLED_ROWS_PER_PAGE}
					searchPlaceholder="Search orders..."
					server={{
						filters,
						onFiltersChange: (next) => {
							setFilters(next);
							setPage(1);
						},
						onPageChange: setPage,
						onReset: reset,
						onSearchChange: (next) => {
							setSearch(next);
							setPage(1);
						},
						page,
						search,
						total: matched.length,
					}}
					title="Orders"
				/>

				<p className="text-xs text-muted">
					<span className="font-medium">Address bar: </span>
					<code>/orders{query.size > 0 ? `?${query}` : ""}</code>
				</p>
			</div>
		</LabSection>
	);
}

/** Skeleton rows, held open. */
function LoadingSection() {
	return (
		<LabSection
			description="Ten skeleton rows, matching the page size. A skeleton shorter than the page makes the content jump when it lands, which reads as slower than showing nothing at all."
			title="Loading"
		>
			<AppTable
				columns={orderColumns(
					() => undefined,
					() => undefined,
				)}
				data-cy="table-loading"
				isLoading
				rows={[]}
				skeletonRowCount={ROWS_PER_PAGE}
			/>
		</LabSection>
	);
}

/**
 * The three reasons, each one inside a real table.
 *
 * They were three bare cards in a dashed box, which is the wrong specimen: an
 * empty state is only correct *in* a table, spanning the columns, under a header
 * that has not gone anywhere. Rendered on its own it cannot show the thing that
 * actually goes wrong - the header disappearing, or the copy landing in the
 * first column with four blank cells beside it. Stacked rather than in a row of
 * three, because a table squeezed to a third of the width is not the table
 * anyone ships.
 */
function EmptySection() {
	const columns = orderColumns(
		() => undefined,
		() => undefined,
	);

	return (
		<LabSection
			description="Three different states that all look like 'nothing here'. They are not interchangeable: the glyph, the sentence and the action differ, because the user's next move differs. None of them says 'refresh'. Each is shown inside a real table - the header stays, the empty state spans every column, and the tracker below it agrees."
			title="Empty states"
		>
			<div className="space-y-6">
				{EMPTY_CASES.map((empty) => (
					<div
						className="space-y-2"
						key={empty.reason}
					>
						<p className="text-xs font-medium text-muted">{empty.caption}</p>
						<AppTable
							columns={columns}
							data-cy={`table-empty-${empty.reason}`}
							emptyContent={
								<AppEmptyState
									action={{ label: empty.action, onPress: () => undefined }}
									data-cy={`empty-state-${empty.reason}`}
									query={empty.query}
									reason={empty.reason}
								/>
							}
							rows={[]}
						/>
						<AppPagination
							data-cy={`pagination-empty-${empty.reason}`}
							noun="orders"
							onPageChange={() => undefined}
							page={1}
							rowsPerPage={ROWS_PER_PAGE}
							total={0}
						/>
					</div>
				))}
			</div>
		</LabSection>
	);
}

const EMPTY_CASES: {
	action: string;
	caption: string;
	query?: string;
	reason: EmptyReason;
}[] = [
	{
		action: "Add an order",
		caption: "no-data - nothing has ever been added",
		reason: "no-data",
	},
	{
		action: "Clear search",
		caption: "no-results - the search matched nothing",
		query: "quezon medial",
		reason: "no-results",
	},
	{
		action: "Clear all filters",
		caption: "filtered - the filters hid every row",
		reason: "filtered",
	},
];

/* -------------------------------------------------------------------------- */

interface WideRow {
	audited: string;
	capacity: number;
	city: string;
	contact: string;
	id: string;
	siteCode: string;
	name: string;
	region: string;
	stock: number;
	updated: string;
}

const WIDE_ROWS: WideRow[] = Array.from({ length: 5 }, (_, i) => ({
	audited: "12 Jan 2026",
	capacity: 120 + i * 15,
	city: CITIES[i % CITIES.length] as string,
	contact: `desk-${i + 1}@example.com`,
	id: `w-${i + 1}`,
	siteCode: `WH-${4200 + i}`,
	name: `${CITIES[i % CITIES.length]} Distribution Centre`,
	region: i % 2 === 0 ? "NCR" : "Region VII",
	stock: 40 + i * 7,
	updated: "02 Aug 2026",
}));

/**
 * The shape that earns a column picker, and the only one that does.
 *
 * Ten columns, wider than the container, and two audiences reading the same
 * rows: someone checking stock wants Capacity and In stock, someone doing
 * compliance wants Site code and Audited, and neither wants the other four.
 * There is no default that serves both, which is the test - a picker over a
 * table that already has a right answer just hides the answer behind a menu.
 *
 * Region is `isHideable: false` to show the opt-out: on a national roster it is
 * how rows are grouped, so a table without it is a list nobody can navigate.
 */
const WIDE_COLUMNS: ColumnDef<WideRow>[] = [
	{ allowsSorting: true, key: "name", label: "Warehouse" },
	{ key: "siteCode", label: "Site code" },
	{ isHideable: false, key: "region", label: "Region" },
	{ allowsSorting: true, key: "city", label: "City" },
	{ allowsSorting: true, key: "capacity", label: "Capacity" },
	{ allowsSorting: true, key: "stock", label: "In stock" },
	/*
	 * The column that made the bug obvious. An email has no spaces, so under the
	 * body's `wrap-anywhere` it broke mid-token across three lines - and because
	 * `overflow-wrap: anywhere` counts toward MIN-CONTENT width, it also told the
	 * table this column could be one character wide, which is why every other
	 * column was being squeezed rather than the table scrolling.
	 *
	 * `truncate` rather than `nowrap` only because a support address can be long
	 * enough to push the sortable columns off screen on its own. The full value
	 * stays in the DOM for a screen reader.
	 */
	{
		key: "contact",
		label: "Contact",
		maxWidthClassName: "max-w-44",
		wrap: "truncate",
	},
	{ key: "audited", label: "Audited" },
	{ key: "updated", label: "Updated" },
	{
		key: "actions",
		label: "Actions",
		render: (row: WideRow) => (
			<AppTooltip
				description="Shows what is in transit to and from this centre."
				icon={Truck}
				placement="top"
				title="Open shipments"
			>
				<AppButton
					aria-label={`Open ${row.name}`}
					icon={Truck}
					isIconOnly
					size="sm"
					variant="ghost"
				/>
			</AppTooltip>
		),
	},
];

/** Ten columns, so the last one has to pin - and the only table here wide enough to want a picker. */
function StickySection() {
	const columns = useTableColumns(WIDE_COLUMNS, "lab:wide-table:columns");
	// Sorted against the FULL column list, not the visible one: hiding an
	// unrelated column must not silently unsort the rows, which is what looking
	// the descriptor up in a list it has just fallen out of would do.
	const sorted = useTableSort(WIDE_ROWS, WIDE_COLUMNS);

	return (
		<LabSection
			description="Ten columns in a container that cannot hold them. Scroll sideways: the actions column stays pinned to the right edge with a border and its own background, because row actions you have to scroll to reach are actions nobody uses. AppTable turns this on by itself whenever the last column's key is `actions`. This is also the only table on the page wide enough to justify a column picker - Warehouse and Actions are absent from it, and Region opted out."
			title="Sticky actions"
		>
			<div className="space-y-3">
				{/* Above the table and right-aligned: it changes the table's shape
				    rather than its contents, so it does not belong among the filters,
				    and a control that reshapes what is below it has to sit above it. */}
				<div
					className="flex justify-end"
					data-cy="wide-toolbar"
				>
					{/* `data-cy` on AppDropdown names the MENU, not the trigger - it is
					    cloned, and the attribute does not ride along. The toolbar around
					    it is what a test can hold on to. */}
					<AppColumnPicker
						data-cy="wide-columns-menu"
						state={columns}
					/>
				</div>
				<AppTable
					columns={columns.visibleColumns}
					onSortChange={sorted.onSortChange}
					rows={sorted.rows}
					sortDescriptor={sorted.sortDescriptor}
				/>
			</div>
		</LabSection>
	);
}
