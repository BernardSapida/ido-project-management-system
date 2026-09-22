import { markMatches, useDebounce } from "../../internal";
import { InputGroup, Skeleton, Spinner } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ChevronRight, Clock, Search, SearchX, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import { AppButton } from "../AppButton";
import { AppGradientIconTile } from "../AppGradientIconTile";
import { cn } from "../../lib/cn";

/**
 * How many results the panel shows before the "See all" row is worth offering.
 * It is the number that fits without scrolling: a "See all" under a list you can
 * already see all of is furniture.
 */
const SEE_ALL_THRESHOLD = 6;

/** The pill on the right of a row. Status, not decoration. */
export type SearchResultBadgeTone = "accent" | "danger" | "default" | "success" | "warning";

export interface SearchResultItem {
	/** A status worth seeing before opening the record - "Urgent", "Closed". */
	badge?: { label: string; tone?: SearchResultBadgeTone };
	/**
	 * Groups the results. Rows carrying the same one render under a single
	 * heading, in the order the categories first appear. Give every result one or
	 * none - a half-grouped list reads as a bug.
	 */
	category?: string;
	/** The tile's glyph when there is no image. Falls back to initials. */
	icon?: LucideIcon;
	/** Thumbnail. A 404 falls back to the icon, then to initials. */
	imageSrc?: string;
	key: string;
	/** The matched text. The typed substring is highlighted inside it. */
	label: string;
	/**
	 * Discrete facts, joined with dots on the second line - ["Makati", "24/7",
	 * "Cross-dock"], NOT one prose sentence. The line is one row tall, and
	 * separate facts let the overflow drop a whole fact rather than clip a
	 * sentence mid-word.
	 */
	meta?: string[];
	/** The one number worth the right-hand column: a price, a count, a distance. */
	trailing?: string;
}

interface AppSearchBarProps {
	className?: string;
	"data-cy"?: string;
	debounceMs?: number;
	/** A search is in flight. Shows a spinner without emptying the panel. */
	isLoading?: boolean;
	/** The field's accessible name - "Search warehouses", not "Search". */
	label: string;
	maxRecents?: number;
	/** Fires on every keystroke after `debounceMs`, already trimmed. */
	onQueryChange?: (query: string) => void;
	/** A row was picked. The query is remembered either way. */
	onSelectResult?: (result: SearchResultItem) => void;
	/** Enter with nothing highlighted, or a recent chip pressed. */
	onSubmit?: (query: string) => void;
	/**
	 * Onboarding, not decoration. "Search" says nothing; name what can be typed.
	 */
	placeholder?: string;
	/**
	 * The glyph for one recent chip, looked up by the remembered text.
	 *
	 * Recents persist as plain strings - an icon is a React component, and nothing
	 * that survives localStorage can carry one - so this component cannot know that
	 * "Drawer" was a lab with a panel glyph rather than a word someone typed. The
	 * caller can: it owns the catalogue the results came from. Return that record's
	 * own icon when the text still matches one, and `undefined` when it does not -
	 * an unmatched chip falls back to the clock, which is the honest glyph for a
	 * bare query and the right one for a record that has since been deleted.
	 *
	 * Match case-insensitively: recents de-duplicate that way, so the stored casing
	 * is whichever spelling arrived first.
	 */
	recentIcon?: (query: string) => LucideIcon | undefined;
	results?: SearchResultItem[];
	/**
	 * localStorage key for the recents. Omit it and the recents live for as long
	 * as the component is mounted - fine for a lab page, wrong for the real bar.
	 */
	storageKey?: string;
}

/**
 * The search bar: a field, and a panel under it that is never blank.
 *
 * Who uses it: everyone, from someone's first minute in the app to a
 * coordinator running the same three searches forty times a day. That split is
 * the whole design. The novice gets a placeholder that names what can be typed,
 * results that show *why* they matched, and a no-results state with a way out.
 * The regular gets recents on focus - one press instead of retyping - and a
 * keyboard path that never moves the caret out of the field.
 *
 * Worst mistake available here: none that destroys anything. The real failure is
 * softer - a user types, gets a blank panel, and concludes the app has nothing.
 * So there is no blank panel. Three states live under the field (recents,
 * results, no results) and the loading spinner replaces none of them.
 *
 * Deliberately not HeroUI's ComboBox. A ComboBox exists to put one of N known
 * values into a field; this runs a search, and its two modes do not fit that
 * contract: an empty query has to show recents rather than every option, Escape
 * has to clear the text before it closes anything, and a recent chip has to
 * carry its own remove button. The panel is therefore hand-wired against the
 * combobox/listbox roles, and the field itself is HeroUI's InputGroup so it
 * matches every other input in the app.
 *
 * PLACEMENT CONSTRAINT. The panel is absolutely positioned inside this wrapper
 * rather than portalled, because the focusout handler below closes the panel by
 * asking whether focus is still inside the wrapper - and the panel's own buttons
 * have to count as inside. That buys correct focus behaviour and costs the
 * ability to escape an ancestor's stacking context.
 *
 * So: if you put this inside anything that creates one - `backdrop-filter`
 * (every `glass` surface), `transform`, `filter`, `opacity` below 1, or an
 * explicit `z-index` - the panel cannot rise above that ancestor's siblings, and
 * a card further down the page will paint straight over it. Give the containing
 * element `relative focus-within:z-50`. Lifting on focus-within is the trick
 * worth copying: the panel is only open while this field has focus, so the right
 * card rises without anyone numbering the page by hand. See the search-bar lab.
 *
 * An ancestor with `overflow: hidden` or `overflow-y: auto` clips it outright,
 * which no z-index fixes - put the field outside the scrollport instead. The
 * component labs' nav drawer does exactly that, for exactly this reason.
 */
export function AppSearchBar({
	className,
	"data-cy": dataCy,
	debounceMs = 250,
	isLoading = false,
	label,
	maxRecents = 6,
	onQueryChange,
	onSelectResult,
	onSubmit,
	placeholder = "Search by name, city or reference",
	recentIcon,
	results = [],
	storageKey,
}: AppSearchBarProps) {
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	/**
	 * -1 means "nothing highlighted", and it is the state the panel opens in.
	 * A search bar is not a picker: Enter on an untouched panel has to run what
	 * was typed, so the first row cannot be pre-selected the way a command
	 * palette's is.
	 */
	const [activeIndex, setActiveIndex] = useState(-1);

	const inputRef = useRef<HTMLInputElement>(null);
	/**
	 * The last query the caller has been told about - NOT "have I rendered
	 * before". A first-render flag lives on the fiber and is already spent by the
	 * time React re-runs a reconnected subtree's effects, so the debounce below
	 * would re-announce a query nobody typed. See `AppSearchField` for the
	 * navigation this breaks when the caller puts the term in the URL.
	 */
	const lastEmitted = useRef("");

	const baseId = useId();
	const inputId = `${baseId}-input`;
	const listId = `${baseId}-list`;
	const hintId = `${baseId}-hint`;

	const recents = useRecentSearches(storageKey, maxRecents);

	const trimmed = query.trim();
	const mode: PanelMode = trimmed === "" ? "recents" : "results";
	const options = buildOptions(baseId, mode, recents.items, results);

	const debouncedQuery = useDebounce(trimmed, debounceMs);

	// Debounced rather than per-keystroke: the caller is usually a network call,
	// and a request per character arrives out of order as often as not.
	useEffect(() => {
		if (debouncedQuery === lastEmitted.current) return;
		lastEmitted.current = debouncedQuery;
		onQueryChange?.(debouncedQuery);
	}, [debouncedQuery]);

	// A highlight pointing at a row that has been replaced is worse than none.
	useEffect(() => {
		setActiveIndex(-1);
	}, [trimmed, results.length]);

	// Keep the highlighted row on screen. `nearest` scrolls the panel only when
	// it has to, so arrowing through visible rows does not jump the list.
	//
	// getElementById rather than a querySelector on an id: `useId` produces ids
	// containing characters a CSS selector treats as syntax, and the escaping
	// that fixes it (CSS.escape) does not exist everywhere this renders.
	// scrollIntoView is optional-called for the same reason.
	useEffect(() => {
		if (activeIndex < 0) return;
		const option = options[activeIndex];
		if (!option) return;
		document.getElementById(option.id)?.scrollIntoView?.({ block: "nearest" });
	}, [activeIndex]);

	function closePanel() {
		setIsOpen(false);
		setActiveIndex(-1);
	}

	/** Clearing is a correction, not an exit: the panel stays, on recents. */
	function clearQuery() {
		setQuery("");
		setActiveIndex(-1);
		setIsOpen(true);
		inputRef.current?.focus();
	}

	function runSearch(next: string) {
		const value = next.trim();
		if (!value) return;
		setQuery(value);
		recents.add(value);
		onSubmit?.(value);
		closePanel();
	}

	function selectOption(option: PanelOption) {
		if (option.kind === "recent") {
			runSearch(option.value);
			return;
		}
		// The RECORD's name, not the query that found it. "Medical" is what the
		// user typed on the way to Makati Medical Center, and it is not what they
		// meant to keep - pressing it later reopens the ambiguity they just
		// resolved. The label is a search that returns the thing they picked,
		// which is the trip they are most likely to want again.
		recents.add(option.result.label);
		onSelectResult?.(option.result);
		closePanel();
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				return;
			}
			if (options.length === 0) return;
			const isDown = event.key === "ArrowDown";
			setActiveIndex((prev) => {
				// Both ends wrap through -1, so arrowing past the last row lands
				// back on the typed text rather than teleporting to the top.
				if (isDown) return prev + 1 >= options.length ? -1 : prev + 1;
				return prev - 1 < -1 ? options.length - 1 : prev - 1;
			});
			return;
		}

		if (event.key === "Enter") {
			const option = isOpen ? options[activeIndex] : undefined;
			if (option) {
				event.preventDefault();
				selectOption(option);
				return;
			}
			if (trimmed) {
				event.preventDefault();
				runSearch(trimmed);
			}
			return;
		}

		if (event.key === "Escape") {
			// Two presses, two different jobs. One Escape undoes the typing, the
			// second dismisses the panel - so a mistyped query costs one key, not
			// a reopened panel.
			event.preventDefault();
			if (query) {
				clearQuery();
				return;
			}
			closePanel();
			return;
		}

		// Only while a chip is highlighted. With the caret in the text and nothing
		// selected, Delete belongs to the input.
		if (event.key === "Delete" && isOpen && activeIndex >= 0) {
			const option = options[activeIndex];
			if (option?.kind === "recent") {
				event.preventDefault();
				recents.remove(option.value);
				setActiveIndex(-1);
			}
			return;
		}

		if (event.key === "Tab") closePanel();
	}

	const activeId = activeIndex >= 0 ? options[activeIndex]?.id : undefined;
	// A spinner is not a state: it says a request is out, not that there is
	// nothing to show. So "no results" waits for the request to land, and until
	// it does the panel holds rows at the height the real ones will be.
	const showSkeleton = mode === "results" && results.length === 0 && isLoading;
	const showNoResults = mode === "results" && results.length === 0 && !isLoading;
	// Only once the panel is holding more than it can show. Under that, the rows
	// on screen ARE all the results and the row would be a lie.
	const showSeeAll = mode === "results" && results.length > SEE_ALL_THRESHOLD && !isLoading;

	return (
		<div
			className={cn("relative w-full", className)}
			data-cy={dataCy}
			// focusout, not blur: the panel's own buttons are inside this wrapper,
			// so leaving the input for one of them must not close what it is in.
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) closePanel();
			}}
		>
			<label
				className="sr-only"
				htmlFor={inputId}
			>
				{label}
			</label>

			<InputGroup className="w-full">
				<InputGroup.Prefix>
					<Search
						aria-hidden="true"
						className="size-4 text-muted"
					/>
				</InputGroup.Prefix>
				{/*
				 * `type="text"`, not `type="search"`. WebKit paints its own clear
				 * button inside a search input, and two Xs on one field is a question
				 * about which one does what.
				 */}
				<InputGroup.Input
					aria-activedescendant={activeId}
					aria-autocomplete="list"
					aria-controls={listId}
					aria-describedby={hintId}
					aria-expanded={isOpen}
					autoComplete="off"
					id={inputId}
					onChange={(event) => {
						setQuery(event.target.value);
						setIsOpen(true);
					}}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					ref={inputRef}
					role="combobox"
					type="text"
					value={query}
				/>
				{(isLoading || query) && (
					<InputGroup.Suffix className="gap-1 pe-1">
						{isLoading && (
							<Spinner
								aria-label="Searching"
								size="sm"
							/>
						)}
						{query && (
							/*
							 * Not "Clear search": the no-results panel has a button by that
							 * name, and two controls answering to one name is a screen
							 * reader user being asked to guess which is which.
							 */
							<AppButton
								aria-label="Clear the search field"
								icon={X}
								isIconOnly
								onPress={clearQuery}
								size="sm"
								variant="ghost"
							/>
						)}
					</InputGroup.Suffix>
				)}
			</InputGroup>

			<p
				className="sr-only"
				id={hintId}
			>
				Use the up and down arrows to move through suggestions, Enter to search, and Delete to remove a recent search.
			</p>
			<p
				aria-live="polite"
				className="sr-only"
			>
				{isOpen && mode === "results" && !isLoading
					? `${results.length} ${results.length === 1 ? "result" : "results"} for ${trimmed}`
					: ""}
			</p>

			{isOpen && (
				/*
				 * Anchored to the field and exactly its width, so the panel reads as
				 * the field growing rather than as a second surface floating near it.
				 * On a phone the field is full-width, which makes this full-width too
				 * with no separate mobile branch.
				 *
				 * mousedown is swallowed rather than handled: pressing a row must not
				 * pull focus out of the input, or the caret leaves mid-search and the
				 * blur above closes the panel before the click lands.
				 */
				<div
					className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
					onMouseDown={(event) => event.preventDefault()}
				>
					<PanelHeader
						mode={mode}
						onClearRecents={recents.clear}
						recentCount={recents.items.length}
						resultCount={results.length}
					/>

					{/*
					 * ~6 of the 56px rows before it scrolls internally, rather than
					 * growing past the fold and taking the page's scroll with it. The
					 * cap is a height, not a row count: a panel taller than about 420px
					 * stops reading as an extension of the field and starts covering the
					 * page it is meant to be filtering.
					 */}
					<div className="max-h-104 overflow-y-auto overscroll-contain px-2 pb-2">
						{/*
						 * One listbox across both modes. The panel swaps what is inside
						 * it; it never stacks a second overlay on the first, and the
						 * arrow keys walk recents and results the same way.
						 */}
						<div
							aria-label={mode === "recents" ? "Recent searches" : "Search results"}
							className={mode === "recents" ? "flex flex-wrap gap-2 py-1" : "flex flex-col gap-1"}
							id={listId}
							role="listbox"
						>
							{mode === "recents"
								? options.map((option, index) =>
										option.kind === "recent" ? (
											<RecentChip
												icon={recentIcon?.(option.value)}
												id={option.id}
												isActive={index === activeIndex}
												key={option.id}
												onPress={() => selectOption(option)}
												onRemove={() => recents.remove(option.value)}
												value={option.value}
											/>
										) : null,
									)
								: /*
									 * One heading per category, in the order the categories first
									 * appear - warehouses do not become more important than
									 * requests because F sorts first.
									 *
									 * The headings and the rows are SIBLINGS inside the listbox
									 * rather than rows wrapped in a labelled group. A listbox may
									 * only contain options and groups, and a group has to be a
									 * `<fieldset>` to be both valid and semantic - which is a form
									 * element with a form element's semantics, inside a search
									 * panel. So the heading is hidden from assistive tech and each
									 * row carries its own category in an `sr-only` span instead:
									 * the grouping is announced per option, where it is unambiguous,
									 * rather than as a container to navigate in and out of.
									 */
									groupOptions(options).map((group) => (
										<Fragment key={group.label ?? "__ungrouped__"}>
											{group.label && (
												<p
													aria-hidden="true"
													className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase"
												>
													{group.label}
												</p>
											)}
											{group.entries.map(({ index, option }) =>
												option.kind === "result" ? (
													<ResultRow
														id={option.id}
														isActive={index === activeIndex}
														key={option.id}
														onPress={() => selectOption(option)}
														query={trimmed}
														result={option.result}
													/>
												) : null,
											)}
										</Fragment>
									))}
						</div>

						{mode === "recents" && recents.items.length === 0 && <NoRecents />}
						{showSkeleton && <ResultsSkeleton />}
						{showNoResults && (
							<NoResults
								onClear={clearQuery}
								query={trimmed}
							/>
						)}
						{showSeeAll && (
							/*
							 * The way out of a panel that scrolls. It is a mouse affordance
							 * mirroring a keyboard path that already exists - Enter with
							 * nothing highlighted runs the same search - so it is not a tab
							 * stop; adding one would put it between the field and the rows.
							 */
							<button
								className="mt-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))]"
								onClick={() => runSearch(trimmed)}
								tabIndex={-1}
								type="button"
							>
								<span className="truncate">See all results for “{trimmed}”</span>
								<ArrowRight
									aria-hidden="true"
									className="size-4 shrink-0"
								/>
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

/* -------------------------------------------------------------------------- */

type PanelMode = "recents" | "results";

type PanelOption =
	| { id: string; kind: "recent"; value: string }
	| { id: string; kind: "result"; result: SearchResultItem };

interface OptionGroup {
	entries: { index: number; option: PanelOption }[];
	label?: string;
}

/**
 * Groups the results by category while keeping each option's index in the FLAT
 * list. The arrow keys walk one sequence from the first row of the first group
 * to the last row of the last; the headings are a visual grouping of that one
 * sequence, not a set of lists to tab between.
 */
function groupOptions(options: PanelOption[]): OptionGroup[] {
	const groups: OptionGroup[] = [];

	options.forEach((option, index) => {
		const label = option.kind === "result" ? option.result.category : undefined;
		const existing = groups.find((group) => group.label === label);
		if (existing) {
			existing.entries.push({ index, option });
			return;
		}
		groups.push({ entries: [{ index, option }], label });
	});

	return groups;
}

function buildOptions(baseId: string, mode: PanelMode, recents: string[], results: SearchResultItem[]): PanelOption[] {
	if (mode === "recents") {
		return recents.map((value, index) => ({ id: `${baseId}-recent-${index}`, kind: "recent", value }));
	}
	return results.map((result) => ({ id: `${baseId}-result-${result.key}`, kind: "result", result }));
}

/**
 * The panel's own header. It names which of the two modes is showing, which is
 * what makes swapping the contents legible instead of startling, and it is
 * where "Clear all" lives - a recents list you cannot prune becomes a list of
 * yesterday's typos.
 */
function PanelHeader({
	mode,
	onClearRecents,
	recentCount,
	resultCount,
}: {
	mode: PanelMode;
	onClearRecents: () => void;
	recentCount: number;
	resultCount: number;
}) {
	return (
		<div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
			<p className="text-xs font-semibold tracking-wide text-muted uppercase">
				{mode === "recents" ? "Recent searches" : `${resultCount} ${resultCount === 1 ? "result" : "results"}`}
			</p>
			{mode === "recents" && recentCount > 0 && (
				<AppButton
					onPress={onClearRecents}
					size="sm"
					variant="ghost"
				>
					Clear all
				</AppButton>
			)}
		</div>
	);
}

/**
 * A recent search: a chip, not a log line. It exists to be pressed - one press
 * fills the field and runs it - so it is sized like a target rather than like
 * text, and it wraps on a phone rather than scrolling sideways out of reach.
 *
 * The remove button sits inside the option and is deliberately not tabbable:
 * six chips would otherwise put twelve stops between the field and the results.
 * Keyboard users remove one with Delete while it is highlighted, which is what
 * the field's hint announces.
 *
 * The glyph is the RECORD's icon when the caller can still find the record, and
 * the clock only when it cannot. A chip is one press away from the thing it
 * names, so carrying that thing's icon lets the eye pick "the warehouse one" out
 * of six chips without reading any of them - and it matches the tile the same
 * record shows in the results below, which is what makes a chip legible as a
 * shortcut rather than as a log line. The clock is then not decoration either:
 * it means precisely "this one is just text you typed".
 */
function RecentChip({
	icon,
	id,
	isActive,
	onPress,
	onRemove,
	value,
}: {
	icon?: LucideIcon;
	id: string;
	isActive: boolean;
	onPress: () => void;
	onRemove: () => void;
	value: string;
}) {
	const Icon = icon ?? Clock;

	return (
		<div
			aria-selected={isActive}
			className={cn(
				"group flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-muted-surface ps-3 pe-1.5 text-sm transition-colors",
				"hover:bg-[color-mix(in_oklab,var(--accent)_8%,var(--surface))]",
				// The keyboard highlight is deliberately NOT the gradient pill. That
				// pill means "this is the current one" on the nav and the pagination;
				// a highlight that moves with every arrow press is a different claim.
				isActive && "bg-[color-mix(in_oklab,var(--accent)_12%,var(--surface))] ring-2 ring-accent/40",
			)}
			id={id}
			onClick={onPress}
			role="option"
			// -1, never 0. In an aria-activedescendant listbox the options are
			// never focused: focus stays in the input the whole time, and the
			// highlight is announced from there. Six chips at tabIndex 0 would be
			// six Tab stops between the field and the rest of the page.
			tabIndex={-1}
		>
			<Icon
				aria-hidden="true"
				className="size-3.5 shrink-0 text-muted"
			/>
			<span className="max-w-52 truncate">{value}</span>
			<button
				aria-label={`Remove ${value} from recent searches`}
				className="grid size-6 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground"
				onClick={(event) => {
					event.stopPropagation();
					onRemove();
				}}
				tabIndex={-1}
				type="button"
			>
				<X
					aria-hidden="true"
					className="size-3.5"
				/>
			</button>
		</div>
	);
}

/**
 * One result: a thumbnail, a name, the facts that tell it apart, and at most one
 * number and one status on the right.
 *
 * Four columns rather than a line of text, because a result list is scanned
 * vertically, not read: the eye runs down the tiles to find the shape it wants,
 * down the names to find the word, down the right edge to compare the numbers.
 * A row that concatenates all of that into one sentence makes every one of those
 * three passes a reading task.
 *
 * The matched substring is highlighted inside the label, because the question a
 * user asks of a result list is not "what came back" but "why did THAT come
 * back" - a row matched on its meta line otherwise looks like a mistake.
 */
function ResultRow({
	id,
	isActive,
	onPress,
	query,
	result,
}: {
	id: string;
	isActive: boolean;
	onPress: () => void;
	query: string;
	result: SearchResultItem;
}) {
	return (
		<div
			aria-selected={isActive}
			className={cn(
				// The row is 56px tall, which is the thumbnail plus its padding. That
				// is well past the 44px touch target, and the height is what lets the
				// eye run down the tiles rather than reading each row.
				"group relative flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2",
				// The lift is a ring and a soft shadow rather than a stronger fill.
				// A fill that carries the whole hover has to be dark enough to see,
				// and at that strength it fights the badges sitting on top of it;
				// an edge reads as "this row" at a tenth of the contrast.
				"ring-1 ring-transparent transition duration-150",
				"hover:bg-[color-mix(in_oklab,var(--accent)_5%,var(--surface))] hover:shadow-soft hover:ring-border",
				isActive && "bg-[color-mix(in_oklab,var(--accent)_9%,var(--surface))] shadow-soft ring-border",
			)}
			id={id}
			onClick={onPress}
			role="option"
			// See RecentChip: focus never leaves the input in this pattern.
			tabIndex={-1}
		>
			{/* The group heading above is hidden from assistive tech, so the kind
			    rides on the option itself - and it comes first, because "Warehouse,
			    Makati Medical Center" is the order the eye reads the row in too. */}
			{result.category && <span className="sr-only">{result.category}</span>}

			<ResultThumbnail result={result} />

			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold">
					<HighlightedText
						query={query}
						text={result.label}
					/>
				</p>
				<ResultMeta meta={result.meta} />
			</div>

			{(result.trailing || result.badge) && (
				<div className="flex shrink-0 flex-col items-end gap-1 ps-1 text-right">
					{/* Tabular figures: the distances sit in a column and are read as a
					    column, and proportional digits make 2.4 and 11 different widths. */}
					{result.trailing && (
						<span className="text-sm font-semibold tabular-nums whitespace-nowrap">{result.trailing}</span>
					)}
					{result.badge && (
						<span
							className={cn(
								"rounded-full px-2 py-0.5 text-[0.6875rem] leading-4 font-semibold whitespace-nowrap",
								BADGE_TONE[result.badge.tone ?? "default"],
							)}
						>
							{result.badge.label}
						</span>
					)}
				</div>
			)}

			{/*
			 * Says the row goes somewhere. Fades in under the cursor or the
			 * highlight rather than sitting on all six rows as a column of
			 * furniture - but it keeps its width the whole time, because a chevron
			 * that appears into the layout would shove every badge left as the
			 * mouse moved down the list.
			 */}
			<ChevronRight
				aria-hidden="true"
				className={cn(
					"size-4 shrink-0 text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100",
					isActive && "opacity-100",
				)}
			/>
		</div>
	);
}

/**
 * Opaque fills mixed against the surface rather than translucent ones. A
 * translucent pill changes colour with whatever is behind it, and behind it here
 * is a row that goes accent-tinted on hover - so the same "Urgent" badge would
 * read as two different colours depending on where the cursor was.
 */
const BADGE_TONE: Record<SearchResultBadgeTone, string> = {
	accent: "bg-[color-mix(in_oklab,var(--accent)_14%,var(--surface))] text-accent",
	danger: "bg-[color-mix(in_oklab,var(--danger)_14%,var(--surface))] text-danger",
	default: "bg-[color-mix(in_oklab,var(--foreground)_8%,var(--surface))] text-muted",
	success: "bg-[color-mix(in_oklab,var(--success)_16%,var(--surface))] text-success",
	warning: "bg-[color-mix(in_oklab,var(--warning)_18%,var(--surface))] text-warning",
};

/**
 * The image, the glyph, or the initials - in that order, and always at the same
 * size. A row whose thumbnail failed to load must not be shorter than the row
 * above it, so the fallbacks are the same box rather than nothing.
 */
function ResultThumbnail({ result }: { result: SearchResultItem }) {
	const [hasFailed, setHasFailed] = useState(false);
	const Icon = result.icon;
	/*
	 * The hairline ring is what stops a white logo from dissolving into a white
	 * panel, and it gives all three variants the same silhouette - so a row whose
	 * image 404s still reads as the same kind of thing as the row above it.
	 */
	const box = "grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl ring-1 ring-border/70";

	if (result.imageSrc && !hasFailed) {
		return (
			<span className={cn(box, "bg-muted-surface")}>
				{/*
				 * Decorative: the name is right beside it. Alt text here would have a
				 * screen reader announce every result twice.
				 */}
				<img
					alt=""
					className="size-full object-cover"
					loading="lazy"
					onError={() => setHasFailed(true)}
					src={result.imageSrc}
				/>
			</span>
		);
	}

	/*
	 * A tint of the accent rather than the full gradient tile used on cards. Six
	 * saturated tiles stacked in a 400px panel stop being an accent and start
	 * being the background; at this weight the glyph still carries the kind of
	 * record without the column shouting over the names beside it.
	 */
	const tinted = "bg-[color-mix(in_oklab,var(--accent)_10%,var(--surface))] text-accent ring-accent/15";

	if (Icon) {
		return (
			<span className={cn(box, tinted)}>
				<Icon
					aria-hidden="true"
					className="size-5"
				/>
			</span>
		);
	}

	return (
		<span
			aria-hidden="true"
			className={cn(box, tinted, "text-sm font-semibold")}
		>
			{initials(result.label)}
		</span>
	);
}

function initials(label: string): string {
	const words = label.trim().split(/\s+/).slice(0, 2);
	return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

/**
 * The facts, dot-separated. The first one truncates and the rest hold their
 * width, because the later facts are the short ones - a city, a status, a date -
 * and dropping the end of "Barangay Bagong Silangan, Quezon City" costs less
 * than losing the word "Closed" off the end of the line.
 */
function ResultMeta({ meta }: { meta?: string[] }) {
	if (!meta || meta.length === 0) return null;

	return (
		<p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
			{meta.map((fact, index) => (
				<span
					className={cn("flex items-center gap-1.5", index === 0 ? "min-w-0 truncate" : "shrink-0")}
					key={fact}
				>
					{index > 0 && (
						<span
							aria-hidden="true"
							className="text-muted/60"
						>
							•
						</span>
					)}
					<span className={index === 0 ? "truncate" : undefined}>{fact}</span>
				</span>
			))}
		</p>
	);
}

/**
 * The matched runs, marked.
 *
 * Delegates to the shared `markMatches`, which the table uses too - the two are
 * the only places a user types something and expects to see where it landed, and
 * the same word looking like two different kinds of match on two screens is
 * worse than either treatment being wrong.
 *
 * It marks EVERY occurrence, where this used to mark only the first. A row
 * reading "Makati Medical Centre, Makati" highlighted one of the two and left
 * the reader wondering what was different about the other.
 */
function HighlightedText({ query, text }: { query: string; text: string }) {
	return <>{markMatches(text, query)}</>;
}

/**
 * First run. An empty panel would read as a broken one.
 *
 * Same shape as the no-results state below - tile, headline, one line of
 * explanation - because they are the two ways this panel comes up empty and a
 * user who has seen one should recognise the other. The tile is the calm tone
 * of the two: nothing has gone wrong here, there is simply no history yet.
 */
function NoRecents() {
	return (
		<div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
			<span className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--accent)_10%,var(--surface))] text-accent ring-1 ring-accent/15">
				<Clock
					aria-hidden="true"
					className="size-5"
				/>
			</span>
			<p className="text-sm font-semibold">No recent searches</p>
			<p className="max-w-xs text-xs text-muted">Searches you run show up here, so you only have to type them once.</p>
		</div>
	);
}

/** Three rows in the real row's shape, so nothing jumps when the data lands. */
function ResultsSkeleton() {
	return (
		<div
			aria-hidden="true"
			className="flex flex-col gap-1"
		>
			{[0, 1, 2].map((row) => (
				<div
					className="flex min-h-14 items-center gap-3 px-2 py-2"
					key={row}
				>
					<Skeleton className="size-10 shrink-0 rounded-xl" />
					<div className="min-w-0 flex-1 space-y-1.5">
						<Skeleton className="h-3.5 w-44 max-w-full rounded-md" />
						<Skeleton className="h-3 w-60 max-w-full rounded-md" />
					</div>
					<Skeleton className="h-4 w-12 shrink-0 rounded-md" />
				</div>
			))}
		</div>
	);
}

/**
 * Not a dead end: it names what was searched, so the user can see the typo, and
 * carries the one action that gets them out of it.
 */
function NoResults({ onClear, query }: { onClear: () => void; query: string }) {
	return (
		<div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
			<AppGradientIconTile
				icon={SearchX}
				size="sm"
			/>
			<p className="text-sm font-semibold">No results for “{query}”</p>
			<p className="max-w-xs text-xs text-muted">Check the spelling, or search for less of it.</p>
			<AppButton
				className="mt-1"
				onPress={onClear}
				size="sm"
				variant="secondary"
			>
				Clear search
			</AppButton>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface RecentSearches {
	add: (query: string) => void;
	clear: () => void;
	items: string[];
	remove: (query: string) => void;
}

/**
 * The recents list: most-recent-first, de-duplicated case-insensitively, capped,
 * and persisted. Persisted is the point - a recents list that dies with the tab
 * is a list nobody comes back to.
 */
function useRecentSearches(storageKey: string | undefined, limit: number): RecentSearches {
	const [items, setItems] = useState<string[]>([]);

	// Read after mount, never in a lazy initialiser: this renders on the server
	// too, and a panel of chips hydrating over a server-rendered empty one is a
	// mismatch React resolves by throwing the markup away.
	useEffect(() => {
		if (!storageKey) return;
		setItems(readStoredRecents(storageKey, limit));
	}, [storageKey, limit]);

	/**
	 * Every mutation goes through one updater so the stored copy can never
	 * disagree with the rendered one. It is a functional update because `add`
	 * fires from a keypress handler that may already be holding a stale list.
	 */
	function update(next: (prev: string[]) => string[]) {
		setItems((prev) => {
			const value = next(prev);
			persist(storageKey, value);
			return value;
		});
	}

	return {
		add: (query) => {
			const value = query.trim();
			if (!value) return;
			update((prev) => [value, ...prev.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, limit));
		},
		clear: () => update(() => []),
		items,
		remove: (query) => update((prev) => prev.filter((item) => item !== query)),
	};
}

function persist(storageKey: string | undefined, next: string[]) {
	if (!storageKey) return;
	try {
		window.localStorage.setItem(storageKey, JSON.stringify(next));
	} catch {
		// Private mode, or a full quota. The recents are a convenience; losing
		// them must not take the search down with them.
	}
}

function readStoredRecents(storageKey: string, limit: number): string[] {
	try {
		const raw = window.localStorage.getItem(storageKey);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item): item is string => typeof item === "string" && item.trim() !== "").slice(0, limit);
	} catch {
		return [];
	}
}
