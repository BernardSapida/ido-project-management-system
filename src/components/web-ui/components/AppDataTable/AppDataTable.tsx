import { useDebounce } from "../../internal";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppColumnPicker, useTableColumns } from "../AppColumnPicker";
import { AppEmptyState } from "../AppEmptyState";
import type { FilterDef } from "../AppFilterBar";
import { AppFilterBar } from "../AppFilterBar";
import { AppPagination } from "../AppPagination";
import { AppSearchField } from "../AppSearchField";
import type { ColumnDef, TableSortDescriptor } from "../AppTable";
import { AppTable, useTableSort } from "../AppTable";
import { AppTableSelectionBar } from "../AppTableSelectionBar";
import { useStoredTableFilters } from "./use-stored-table-filters";

/**
 * A filter, plus how a chosen value narrows the rows.
 *
 * The predicate is what makes the bar work rather than merely look right. A
 * filter def carrying only its options describes a dropdown; this describes a
 * filter, and there is no way to add one here without saying what it does.
 *
 * Server mode takes a bare `FilterDef` instead - there the query is what
 * narrows, so a predicate here would be a second, quieter answer to the same
 * question.
 */
export interface DataTableFilter<T> extends FilterDef {
	predicate: (row: T, value: string) => boolean;
}

/**
 * Hands the narrowing to whoever owns the query.
 *
 * Pass this and the table stops filtering, sorting and slicing: `rows` is one
 * page, already ordered, and `total` is the server's count. Everything else -
 * the title, the filter bar, the search box, the column picker, the empty
 * states, the tracker - behaves exactly as it does in client mode, because none
 * of it ever depended on where the rows came from.
 *
 * Every handler is required, and that is the safety. The component can hand you
 * the search term but cannot check that you put it in your query key: wire
 * `onSearchChange` and ignore it, and the search box will mark matches while the
 * row set never moves. Requiring all of them narrows that mistake from "forgot
 * the mechanism" to "received the value and dropped it", which is visible in one
 * place in the caller.
 */
interface DataTableServerBase {
	/**
	 * True while a page/search/filter change is in flight. Draws the skeletons
	 * again, so a table that is refetching does not sit showing the previous
	 * page's rows under a tracker that already reads the new total.
	 */
	isFetching?: boolean;
	/**
	 * The whole selected-filter record, not one key. Restoring a stored filter
	 * set arrives as one change rather than as N, and the caller has the complete
	 * state to hang its query key on.
	 */
	onFiltersChange: (filters: Record<string, string | null>) => void;
	/**
	 * Uncontrolled server mode only: called with 1 after any change to WHICH rows
	 * exist, so a filter set from page 7 does not land on page 7 of a two-page
	 * result.
	 *
	 * A CONTROLLED caller is not sent this, and must reset the page inside its own
	 * filter and search handlers. It owns one piece of state holding all of it,
	 * and a page reset arriving as a second message would be a second write to
	 * that store - which for the router these callers usually are means two
	 * history entries per filter change, and a back button that goes nowhere on
	 * the first press.
	 */
	onPageChange: (page: number) => void;
	/** Already debounced and trimmed - one per settled term, not per keystroke. */
	onSearchChange: (search: string) => void;
	onSortChange?: (descriptor: TableSortDescriptor | undefined) => void;
	page: number;
	/** The server's count for the CURRENT filters, never the table's row length. */
	total: number;
}

/**
 * Server mode, in one of its two shapes.
 *
 * ── Uncontrolled (the default) ──
 *
 * Pass the handlers alone and the TABLE owns the filter values and the search
 * term: it holds them, persists them under `storageKey`, and tells you what they
 * are. Right for most screens, where the filters are a reading preference and
 * the only thing that has to survive is "leave and come back to what I set".
 *
 * ── Controlled ──
 *
 * Pass `filters` and `search` as well and the CALLER owns them. The table
 * renders what it is given and reports edits through the same handlers; it never
 * holds a second copy, and it does not persist them - the caller's store, in
 * practice a URL, IS the store.
 *
 * That is not a stylistic preference. Three things are impossible while the
 * table owns this state, and all three are the same bug wearing different
 * clothes - a control on screen that disagrees with the rows underneath it:
 *
 *   1. **A shareable link.** Open `?status=rejected` and the query narrows while
 *      the bar reads "All statuses" and "0 active" - and a stored filter set
 *      restoring a tick later fires `onFiltersChange` and overwrites the status
 *      the link carried.
 *   2. **A second control setting the same filter.** A row of counter tiles, a
 *      segmented control, a link from another page. There is no way to push a
 *      value INTO the table, so the tile and the dropdown end up as two pieces
 *      of state that drift.
 *   3. **The back button.** Filters the table holds are not in history.
 *
 * Both values or neither - the union is what stops half of one. A controlled
 * `filters` beside a table-owned search is a screen where "Clear all" clears one
 * of the two things it just claimed to clear, and which one depends on where the
 * value happened to live.
 */
export type DataTableServer = DataTableServerBase &
	(
		| { filters?: undefined; search?: undefined }
		| {
				/** Controlled. The value per filter key; absent or null means "all". */
				filters: Record<string, string | null>;
				/**
				 * "Clear all", as ONE message instead of three.
				 *
				 * Optional, and worth passing whenever the caller's store is a router.
				 * Without it the button reports the clear as `onFiltersChange({})`, then
				 * `onSearchChange("")`, then `onPageChange(1)` - three navigations, three
				 * history entries, and a back button that needs three presses to undo one
				 * click. With it, the caller writes the whole cleared state at once.
				 *
				 * It is also the only way to clear state this table cannot see. A page
				 * whose counter tiles narrow the same rows (see `externalFilterCount`)
				 * clears them here; there is nothing else "Clear all" could call that
				 * would reach them.
				 */
				onReset?: () => void;
				/**
				 * Controlled, and ALREADY TRIMMED - it is what `onSearchChange` last
				 * handed you, not what is in the box.
				 *
				 * The box keeps its own live copy while somebody is typing, because a
				 * character that has to complete a round trip through a router before
				 * it appears is a search field that drops keystrokes. This value seeds
				 * that copy and replaces it whenever it changes for a reason other than
				 * the typing - a back button, a cleared filter set, a link.
				 */
				search: string;
		  }
	);

interface AppDataTableBaseProps<T extends { id: string | number }> {
	"data-cy"?: string;
	/**
	 * The table's own actions - Create, Export - on the TITLE row, right-aligned.
	 *
	 * They used to sit in the filter bar's header strip, beside "Clear all" and
	 * "Hide". That put a page's primary button inside a panel that can be folded
	 * away, three rows down from the heading it belongs to, in a strip whose other
	 * two controls act on the filters rather than on the data - so "Create blog"
	 * read as a third filter control, and the button most likely to be pressed on
	 * an empty table was the one furthest from the eye's entry point. The column
	 * picker stays down there, because it IS table chrome.
	 */
	actions?: ReactNode;
	columns: ColumnDef<T>[];
	/**
	 * One sentence under the title: what this set IS, or what to do with it.
	 * Not a restatement of the title - "Orders" over "A list of orders"
	 * spends a line saying nothing. Say what makes this set the one on screen.
	 */
	description?: string;
	/** Shown when the table is empty for no reason a filter explains. */
	emptyAction?: { label: string; onPress: () => void };
	/**
	 * How many controls OUTSIDE this table are narrowing the same rows - counter
	 * tiles, a segmented control, a scope the page owns.
	 *
	 * It buys two things, and the second is the one that matters. It joins the
	 * "N active" count in the filter bar; and it makes the empty state say
	 * **filtered** rather than **no data**. A desk that pressed "Waiting on you",
	 * got nothing back, and was told "nothing here yet" has been told there is no
	 * work when there are forty rows behind the tile it just pressed - which is a
	 * worse answer than no answer.
	 *
	 * "Clear all" still calls only what this table knows about, so clear the
	 * outside controls in the same handler you clear the inside ones.
	 */
	externalFilterCount?: number;
	/** Turns on the column picker, in the filter bar's non-collapsing header. */
	hasColumnPicker?: boolean;
	/**
	 * Where the title sits in the page's outline. Defaults to 2, which is right
	 * for one table under a page's `<h1>`. Drop it to 3 inside a section that
	 * already has its own heading, so the outline never skips a level.
	 */
	headingLevel?: 2 | 3 | 4;
	isLoading?: boolean;
	/** Plural, lower case - "orders". Used by the tracker and the empty state. */
	noun?: string;
	onRowAction?: (id: string | number) => void;
	/**
	 * Turns on a leading checkbox column plus the floating selection bar. Only
	 * `"multiple"` - a paginated table with single selection is a radio list
	 * wearing the wrong control.
	 *
	 * Selection is CALLER-OWNED, for the same reason controlled filters are: a
	 * second copy in here would drift from yours the moment a row leaves the
	 * page. Hold the `Set` yourself, keyed by `row.id`, and it survives paging
	 * and sorting.
	 *
	 * The header's select-all covers the VISIBLE PAGE only. "Select all 400
	 * across every page" needs a server count and an `"all"` path, and is not
	 * this prop.
	 */
	selectionMode?: "none" | "multiple";
	/** Controlled selected row ids. Pair with `onSelectionChange`. */
	selectedKeys?: Set<string | number>;
	onSelectionChange?: (keys: Set<string | number>) => void;
	/**
	 * The actions for the current selection, shown in the floating bar. A node,
	 * or a function of the selected ids when the buttons need to know what they
	 * will act on. Nothing renders until at least one row is selected.
	 */
	bulkActions?: ReactNode | ((selectedKeys: Set<string | number>) => ReactNode);
	rows: T[];
	rowsPerPage?: number;
	searchPlaceholder?: string;
	/** Persists the hidden-column set across sessions when the picker is on. */
	storageKey?: string;
	/**
	 * What this table is holding. Also becomes the table's accessible name, so a
	 * screen reader announces "Orders" rather than "Data table".
	 */
	title?: string;
}

interface ClientModeProps<T> {
	filters?: DataTableFilter<T>[];
	server?: never;
}

interface ServerModeProps {
	filters?: FilterDef[];
	server: DataTableServer;
}

export type AppDataTableProps<T extends { id: string | number }> = AppDataTableBaseProps<T> &
	(ClientModeProps<T> | ServerModeProps);

/** Ten. The tracker reads "Showing 1-10 of 53", which is the point of the number. */
const DEFAULT_ROWS_PER_PAGE = 10;

/**
 * A table and everything that goes around one: search, filters, column picker,
 * sorting, pagination, empty states and match highlighting.
 *
 * By default it takes the WHOLE row set and owns the narrowing, which is what
 * lets it keep the eight moving parts in step. Every screen that composed these
 * by hand had to re-derive the same four rules, and the failures were always the
 * same ones: a page number left pointing past the end of a filtered set, a
 * tracker counting the unfiltered total, an empty state blaming "no data" for
 * what the filters did, and a sort applied to the ten rows already on screen
 * rather than to all 53.
 *
 * Order on the page is title, filters, search, table, tracker. Title first
 * because a grid of records under no heading makes the reader infer the set
 * from the rows - which stops working the moment a filter cuts it to three.
 * Then the filters, which decide which rows exist; then search, which finds one
 * among them. That is the order the two are actually used in, and it puts the
 * search box directly above the rows it marks.
 *
 * The search box is OUTSIDE the filter panel either way. It is the most-used
 * control on the screen and the panel's whole job is to fold away; while the
 * two were together, pressing Hide took the search box with it.
 *
 * ── Client or server ──
 *
 * Client mode narrows in the browser, so it needs every row in memory. That is
 * right for the hundreds these screens usually hold and wrong for tens of
 * thousands. For those, pass `server` (see `DataTableServer`) and let the query
 * do the narrowing - the chrome is identical, only the arithmetic moves.
 *
 * The mode is EXPLICIT, never inferred. A component that quietly decides
 * whether it owns the filtering based on what it was handed is one whose tracker
 * is right half the time; this one is told, and the discriminated union means a
 * server caller cannot supply half the handlers.
 *
 * ── Who owns the filter values ──
 *
 * By default this table does, in both modes, and persists them under
 * `storageKey`. Add `filters` and `search` to `server` and the caller owns them
 * instead - which is what a screen needs when the values belong in the URL, or
 * when a second control on the page sets the same filter a dropdown here does.
 * See `DataTableServer` for the three things that are impossible without it.
 */
export function AppDataTable<T extends { id: string | number }>(props: AppDataTableProps<T>) {
	const {
		actions,
		bulkActions,
		columns,
		"data-cy": dataCy,
		description,
		emptyAction,
		externalFilterCount = 0,
		filters = [],
		hasColumnPicker = false,
		headingLevel = 2,
		isLoading = false,
		noun = "rows",
		onRowAction,
		onSelectionChange,
		rows,
		rowsPerPage = DEFAULT_ROWS_PER_PAGE,
		searchPlaceholder = "Search...",
		selectedKeys,
		selectionMode = "none",
		storageKey,
		title,
	} = props;
	const server = props.server;
	const isServer = server !== undefined;

	/*
	 * The controlled half of server mode, or undefined. Narrowed once here rather
	 * than tested at each of the six places below, so "the caller owns this" is a
	 * single fact the type system carries instead of a boolean six functions have
	 * to be trusted to have checked.
	 */
	const controlled = server?.filters !== undefined ? server : undefined;

	/*
	 * Filters and search survive leaving the page; the PAGE does not. A page is a
	 * position in a row set that may have changed since - restoring page 4 of a
	 * list that is now two pages long lands the user on an empty table.
	 *
	 * Controlled callers get NO storage - the key is withheld, which is all it
	 * takes to switch both the read and the write off. Their store is the URL, and
	 * a second copy in localStorage would race it on every mount: whichever landed
	 * last would win, and the one that lands last is the restore.
	 */
	const stored = useStoredTableFilters(controlled ? undefined : storageKey, filters);
	const [clientPage, setClientPage] = useState(1);

	/*
	 * The live text in the box, which is NOT always the term the rows were fetched
	 * for. A controlled search term makes the round trip through the caller's
	 * store, and a field that waits for that before showing the character you
	 * typed is a field that drops characters. So the box is always locally
	 * responsive; `search` below is that local copy, and the caller's value is
	 * what seeds and re-seeds it.
	 */
	const [typedSearch, setTypedSearch] = useState(() => props.server?.search ?? "");

	const selected = controlled ? controlled.filters : stored.state.filters;
	const search = controlled ? typedSearch : stored.state.search;

	/*
	 * Read through a ref inside the effects below. `server` is a fresh object
	 * literal on every render of the caller, so depending on it directly would
	 * fire the sync effects on every render and refetch in a loop.
	 */
	const serverRef = useRef(server);
	serverRef.current = server;

	function goToPage(page: number) {
		if (server) server.onPageChange(page);
		else setClientPage(page);
	}

	function setSearch(value: string) {
		if (controlled) {
			// Local only. The debounce effect below is what tells the caller, one
			// message per settled term rather than one per keystroke.
			setTypedSearch(value);
			return;
		}
		stored.setState((prev) => ({ ...prev, search: value }));
	}

	function setFilter(key: string, value: string | null) {
		if (controlled) {
			// Straight out to the caller, undebounced: a dropdown produces one change
			// per decision, and there is nothing to smooth.
			controlled.onFiltersChange({ ...controlled.filters, [key]: value });
			return;
		}
		stored.setState((prev) => ({ ...prev, filters: { ...prev.filters, [key]: value } }));
	}

	/*
	 * The typed value drives the INPUT and the highlight; the debounced one
	 * drives the filtering. Marking on every keystroke is what makes the search
	 * feel like it is answering, and it is pure render work over one page of
	 * rows - while re-filtering the full set on each key is the part worth
	 * delaying. In server mode the delay is buying more: one request per settled
	 * term instead of one per character.
	 */
	const debouncedSearch = useDebounce(search, 200);

	/*
	 * Both sync effects compare against what was last SENT rather than firing on
	 * every change. Two things arrive after mount that must not be mistaken for
	 * user input: the initial empty values, and whatever useStoredTableFilters
	 * restores a tick later. The first must not fire (it would reset the caller's
	 * page before it has fetched anything); the second must, because a restored
	 * filter that never reaches the query shows a full table under a bar claiming
	 * it is filtered.
	 */
	const lastSentSearch = useRef<string | null>(null);
	useEffect(() => {
		if (!isServer) return;
		const term = debouncedSearch.trim();
		if (lastSentSearch.current === null) {
			lastSentSearch.current = term;
			return;
		}
		if (lastSentSearch.current === term) return;
		lastSentSearch.current = term;
		serverRef.current?.onSearchChange(term);
		// Uncontrolled only - a controlled caller resets the page in its own
		// handler, in the same write. See `onPageChange`.
		if (serverRef.current?.filters === undefined) serverRef.current?.onPageChange(1);
	}, [debouncedSearch, isServer]);

	/*
	 * The caller's term, adopted into the box.
	 *
	 * It fires for a back button, a cleared filter set, a link opened with a term
	 * already in it - and NOT for the echo of what this table just sent, which is
	 * what `lastSentSearch` is doing here. Without that test every settled term
	 * would come back a render later, be adopted as if it were external, and reset
	 * the cursor to the end of the box while somebody was still typing.
	 *
	 * Declared after the effect above so the mount ordering is the useful one: the
	 * send effect records the initial term first, and this one then sees its own
	 * value and does nothing.
	 */
	const controlledSearch = controlled?.search;
	useEffect(() => {
		if (controlledSearch === undefined) return;
		if (controlledSearch === lastSentSearch.current) return;
		lastSentSearch.current = controlledSearch;
		setTypedSearch(controlledSearch);
	}, [controlledSearch]);

	const isControlled = controlled !== undefined;
	const lastSentFilters = useRef<string | null>(null);
	useEffect(() => {
		// Controlled filters need no sync at all: `setFilter` already handed the
		// change straight to the caller, and there is no second copy here that
		// could fall behind the first.
		if (!isServer || isControlled) return;
		const serialised = JSON.stringify(selected);
		if (lastSentFilters.current === null) {
			lastSentFilters.current = serialised;
			return;
		}
		if (lastSentFilters.current === serialised) return;
		lastSentFilters.current = serialised;
		serverRef.current?.onFiltersChange(selected);
		serverRef.current?.onPageChange(1);
	}, [isControlled, isServer, selected]);

	const matching = useMemo(() => {
		// Server mode: these rows ARE the answer - already filtered, already the
		// page. Running the client narrowing over them would filter a filtered set.
		if (isServer) return rows;

		const needle = debouncedSearch.trim().toLowerCase();

		return rows.filter((row) => {
			for (const filter of filters as DataTableFilter<T>[]) {
				const value = selected[filter.key];
				if (value && !filter.predicate(row, value)) return false;
			}
			if (!needle) return true;
			// Across every column, so a user does not have to know which one holds
			// the thing they typed - that is the difference between search and a
			// filter, and it is why the search box is not one of the dropdowns.
			return columns.some((column) => searchableText(row, column).toLowerCase().includes(needle));
		});
	}, [columns, debouncedSearch, filters, isServer, rows, selected]);

	/*
	 * Called in both modes, but for different halves of what it returns. Client
	 * mode uses its sorted rows; server mode uses only its descriptor, to draw the
	 * header arrows, and throws the rows away - ordering one page of ten here
	 * would reorder the page rather than the set, which is the exact lie the
	 * client path exists to avoid.
	 */
	const sorted = useTableSort(matching, columns);
	// Against the full column list, not the visible one: hiding an unrelated
	// column must not unsort the rows underneath it.
	const liveColumns = useTableColumns(columns, storageKey ? `${storageKey}:columns` : undefined);

	function handleSortChange(descriptor: TableSortDescriptor) {
		sorted.onSortChange(descriptor);
		if (server) {
			server.onSortChange?.(descriptor);
			server.onPageChange(1);
		}
	}

	/*
	 * Clamped rather than reset. Filtering from page 6 down to two pages has to
	 * land somewhere, and page 2 is the nearest thing to where the user was -
	 * snapping to 1 throws away their position every time they touch a filter,
	 * and leaving it at 6 shows an empty table with a tracker claiming rows exist.
	 */
	const total = isServer ? server.total : sorted.rows.length;
	const page = isServer ? server.page : clientPage;
	const pageCount = Math.max(1, Math.ceil(total / rowsPerPage));
	const safePage = Math.min(page, pageCount);
	const pageRows = isServer ? rows : sorted.rows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

	const hasSelection = selectionMode !== "none";
	/*
	 * React Aria reports a full-page tick as the string `"all"`. The caller only
	 * ever deals in real ids, so it is expanded here against the rows actually on
	 * screen - select-all means "this page", never the unseen rest of the set.
	 */
	function handleSelectionChange(keys: "all" | Set<string | number>) {
		if (!onSelectionChange) return;
		onSelectionChange(keys === "all" ? new Set(pageRows.map((row) => row.id)) : keys);
	}
	const selectedCount = selectedKeys?.size ?? 0;

	const hasQuery = search.trim().length > 0;
	// Including what the PAGE is narrowing by, not only what this bar renders.
	// It decides the empty state's reason, and "nothing here yet" told to someone
	// whose own filter emptied the table is the one wrong answer available.
	const hasFilters = filters.some((filter) => selected[filter.key]) || externalFilterCount > 0;
	// isFetching too, or a refetching table shows the previous page's rows beneath
	// a tracker that has already moved to the new total.
	const isBusy = isLoading || Boolean(server?.isFetching);

	function reset() {
		if (controlled) {
			/*
			 * The box is cleared HERE as well as reported, and `lastSentSearch` is
			 * moved with it. Without both, the empty term settles through the debounce
			 * a moment later, reads as a fresh edit, and sends a second
			 * `onSearchChange("")` + `onPageChange(1)` on top of this one - a second
			 * navigation the user did not ask for, landing after they may have started
			 * typing again.
			 */
			setTypedSearch("");
			lastSentSearch.current = "";

			// One write where the caller offers one, three where it does not. See
			// `onReset` for why the difference is a back button that works.
			if (controlled.onReset) controlled.onReset();
			else {
				controlled.onFiltersChange({});
				controlled.onSearchChange("");
				controlled.onPageChange(1);
			}
			return;
		}
		stored.setState({ filters: {}, search: "" });
		goToPage(1);
	}

	return (
		<div
			className="flex flex-col gap-4"
			data-cy={dataCy}
		>
			{/*
			 * The table says what it is holding before it shows any of it. A grid of
			 * records under no heading makes the reader infer the set from the rows,
			 * which works until the rows are filtered to three or to none - and an
			 * empty table with no title is a page that has lost its subject.
			 *
			 * The heading also NAMES the table for a screen reader, through
			 * `label` below. Fourteen tables in this app were announced as "Data
			 * table", which is the accessible-name equivalent of an untitled page.
			 */}
			{(title || description) && (
				<div className="space-y-1">
					{title && <Heading level={headingLevel}>{title}</Heading>}
					{description && <p className="text-sm leading-relaxed text-muted">{description}</p>}
				</div>
			)}

			{(filters.length > 0 || hasColumnPicker) && (
				<AppFilterBar
					// The picker only. What acts on the DATA is on the title row above;
					// what acts on the table's own chrome stays down here with the
					// filters.
					actions={hasColumnPicker ? <AppColumnPicker state={liveColumns} /> : undefined}
					externalFilterCount={externalFilterCount}
					/*
					 * The panel opens on every mount and this component exposes no way
					 * to change that, which is what makes restoring filters safe: a
					 * restored filter folded away is three rows of fifty-three with
					 * nothing on screen saying why, and the reading is "the data is
					 * gone". The count and "Clear all" are the only things that
					 * correct it, so they are never behind a fold on arrival.
					 *
					 * If a `defaultOpen` ever reaches this component, it has to be
					 * ignored whenever `stored.hasRestored` is true - AppFilterBar
					 * latches the value at mount, and the restore lands after it.
					 */
					filters={selected}
					onFilterChange={(key, value) => {
						setFilter(key, value);
						// Uncontrolled only. `setFilter` has already handed a controlled
						// caller the new values, and they reset the page in that same
						// write rather than taking a second message for it.
						if (!controlled) goToPage(1);
					}}
					onReset={reset}
					searchTerm={search}
					selects={filters}
				/>
			)}

			{/*
			 * The row that sits on the TABLE: search at one end, the actions at the
			 * other, directly above the grid they both belong to.
			 *
			 * Search is here because it is against the thing it acts on - the filters
			 * shape which rows exist, then search finds one among them, and the
			 * reading order matches that. It is outside the filter panel either way,
			 * so Hide never takes it with it, and capped rather than full-bleed: a
			 * search input running the whole width of a wide table reads as a
			 * page-level search over the whole app.
			 *
			 * The actions share the row rather than sitting on the page title, which
			 * is where they went first. Both are wrong in the same way the filter bar
			 * was: the button belongs to the TABLE, so it belongs on the table's own
			 * row - level with the search, at the end the eye finishes on, one line
			 * above the grid it adds to.
			 */}
			<div className="flex items-center justify-between gap-3">
				<AppSearchField
					aria-label={`Search ${noun}`}
					/* `min-w-0 flex-1` under the cap, or the field refuses to go
					   narrower than its own content on a phone and pushes the button
					   off the row instead of giving way to it. */
					className="min-w-0 flex-1 sm:max-w-sm"
					onValueChange={(value) => {
						setSearch(value);
						// Client mode only. Server mode moves the page from the debounce
						// effect instead, so a half-typed term does not reset the page on
						// every keystroke and then again when the request settles.
						if (!isServer) setClientPage(1);
					}}
					placeholder={searchPlaceholder}
					value={search}
				/>

				{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
			</div>

			<AppTable
				columns={liveColumns.visibleColumns}
				emptyContent={
					<AppEmptyState
						// "Clear all filters" only when there is something to clear.
						// Offering it over an empty database is a button that changes
						// nothing and tells the user they did something wrong.
						action={hasFilters || hasQuery ? { label: "Clear all filters", onPress: reset } : emptyAction}
						query={search}
						reason={hasFilters ? "filtered" : hasQuery ? "no-results" : "no-data"}
					/>
				}
				highlightQuery={search}
				isLoading={isBusy}
				label={title}
				onRowAction={onRowAction}
				onSelectionChange={hasSelection ? handleSelectionChange : undefined}
				onSortChange={handleSortChange}
				rows={pageRows}
				selectedKeys={hasSelection ? selectedKeys : undefined}
				selectionMode={selectionMode}
				skeletonRowCount={rowsPerPage}
				sortDescriptor={sorted.sortDescriptor}
			/>

			{/*
			 * The NARROWED total, never the unfiltered row count. A tracker reading
			 * "of 53" under four visible rows is the table contradicting itself.
			 *
			 * Nothing at all at zero. The tracker answers "is that everything?", and
			 * with no rows the empty state directly above has already answered it in
			 * a heading, a sentence and an action - so "No blogs" underneath is the
			 * same fact a third time, in the smallest type on the screen, reading
			 * like a stray label that failed to render. It stays for every non-empty
			 * table, including a single page, which is the case it was brought back
			 * for.
			 */}
			{total > 0 ? (
				<AppPagination
					noun={noun}
					onPageChange={goToPage}
					page={safePage}
					rowsPerPage={rowsPerPage}
					total={total}
				/>
			) : null}

			{/*
			 * Last child, and only while a selection stands. It adds no layout
			 * height (zero-height line), so nothing here moves as rows are picked;
			 * at rest it overlaps the pagination row, which the grip handle is there
			 * to solve. `sticky` within THIS block - floats into view on a long
			 * table, travels no further than the block. `-mt-4` swallows the
			 * column's `gap-4` so the line sits flush at the bottom.
			 */}
			{hasSelection && selectedCount > 0 ? (
				<AppTableSelectionBar
					className="-mt-4"
					count={selectedCount}
					data-cy={dataCy ? `${dataCy}-selection-bar` : undefined}
					noun={noun}
					onClear={() => onSelectionChange?.(new Set())}
				>
					{typeof bulkActions === "function" ? bulkActions(selectedKeys ?? new Set()) : bulkActions}
				</AppTableSelectionBar>
			) : null}
		</div>
	);
}

/**
 * The title, at whichever level keeps the page's outline intact.
 *
 * A fixed `<h2>` would be wrong half the time - inside a section that already
 * has one it repeats the level, and under a bare `<h1>` on a settings page it
 * is right. The level is the caller's to know, so it is theirs to pass.
 */
function Heading({ children, level }: { children: string; level: 2 | 3 | 4 }) {
	const Tag = `h${level}` as const;
	return <Tag className="text-lg font-semibold">{children}</Tag>;
}

/**
 * What the search box reads for one cell.
 *
 * `searchValue` first, because a column rendering "Yesterday" over a timestamp
 * has nothing useful in either its rendered text or its raw value. Falls back to
 * the raw field, which is right for the plain-text columns that are most of any
 * table.
 *
 * A column's `render` output is deliberately not consulted: it is a ReactNode,
 * and flattening one to text to search it would quietly start matching against
 * button labels and aria strings.
 */
function searchableText<T>(row: T, column: ColumnDef<T>): string {
	if (column.searchValue) return column.searchValue(row);
	const raw = (row as Record<string, unknown>)[column.key];
	return raw == null ? "" : String(raw);
}
