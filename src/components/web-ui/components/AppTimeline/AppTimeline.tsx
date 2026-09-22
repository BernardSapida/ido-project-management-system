import {
	formatAbsolute,
	formatDate,
	formatRelative,
	formatUtcDate,
	toDate,
	useTickingClock,
} from "../../internal";
import { Button, Skeleton } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { ArrowUp, ChevronDown, Cog, MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import type { EmptyReason } from "../AppEmptyState";
import { AppEmptyState } from "../AppEmptyState";
import { cn } from "../../lib/cn";

/**
 * What happened, not how badly. The type picks the glyph AND the colour, and
 * the glyph is what makes a rail skimmable - the colours only sort what the
 * icons already said.
 */
export type TimelineEventType = "commented" | "created" | "deleted" | "system" | "updated";

/** Newest-first for a feed ("what just happened"), oldest-first for a process. */
export type TimelineOrder = "newest-first" | "oldest-first";

export interface TimelineEntry {
	/** WHO. A person's name, or the app's own for an automated event. */
	actor: string;
	/** The collapsible half - a diff, a comment body, a payload. */
	detail?: ReactNode;
	key: string;
	/** One line, always visible, even while `detail` is collapsed. */
	summary?: string;
	/** WHEN, as an instant. Shown relative, kept absolute. */
	timestamp: Date | string;
	/** WHAT - the rest of the sentence after the actor: "archived request ORD-25841". */
	title: string;
	type: TimelineEventType;
}

interface TimelineEmpty {
	action?: { label: string; onPress: () => void };
	/** Overrides the preset copy when this feed has something better to say. */
	description?: string;
	/** Echoed back in the no-results copy. */
	query?: string;
	reason: EmptyReason;
}

interface AppTimelineProps {
	className?: string;
	/**
	 * Cap the rail at this many entries and put the rest behind one "Show N
	 * older entries" press. Unset renders everything.
	 *
	 * Settled: a COUNT, not a pixel height, and no inner scroll container. A
	 * feed given its own `overflow-y-auto` box gets a second scrollbar the page
	 * already has - the wheel does one thing over the rail and another beside
	 * it, a phone shows no bar at all to warn you, and "Load more" ends up
	 * hidden inside a region nobody knew was scrollable. Cutting the list
	 * instead keeps one scrollbar on the page, and the button states the number
	 * of entries it is hiding, which a fading edge only gestures at.
	 *
	 * Counting entries rather than measuring height is the same call
	 * `EntryDetail` makes: a "is this tall enough to matter" threshold makes two
	 * feeds behave differently for a reason the reader cannot see.
	 */
	collapseAfter?: number;
	/**
	 * Test hook on the feed's root, in all three of its states - loading, empty
	 * and loaded - so a spec can address one feed across them. The empty state
	 * inside it derives `-empty`.
	 */
	"data-cy"?: string;
	/** Why the feed is empty, and the way out of it. */
	empty?: TimelineEmpty;
	entries: TimelineEntry[];
	/**
	 * The day headers are real headings. The same feed sits under an `h1` on one
	 * screen and inside an `h2` section on another, and a document that skips a
	 * level is unnavigable by heading.
	 */
	headingLevel?: 2 | 3 | 4;
	isLoading?: boolean;
	isLoadingMore?: boolean;
	/** Names the feed for a screen reader - "Request activity", not "List". */
	label: string;
	/**
	 * Any CSS length (`"24rem"`, `"60dvh"`, `480`). Given one, the feed becomes
	 * its own scroll region instead of growing the page.
	 *
	 * For the fixed-height shell ONLY - a detail drawer, a right-hand panel, a
	 * dashboard card in a grid that cannot be allowed to grow. On an ordinary
	 * page this is the worse of the two caps and `collapseAfter` is the one to
	 * reach for: an inner scroll region hands the page a second scrollbar, so
	 * the wheel does one thing over the rail and another beside it, a phone
	 * shows no bar at all to warn you, and the "Load more" at the bottom is
	 * buried inside a region nobody knew was scrollable. The cost is real and
	 * it is paid on purpose when the container's height is not negotiable.
	 *
	 * Settled: it beats `collapseAfter` when both are passed, and the two never
	 * stack. A box you scroll that ALSO hides entries behind a button is two
	 * different cuts in one list, and reaching the second one means scrolling a
	 * region to the bottom to find out the list was not over.
	 */
	maxHeight?: number | string;
	/** Given one, a "Load more" lands at the bottom. Stop passing it when the history is exhausted. */
	onLoadMore?: () => void;
	order?: TimelineOrder;
}

/**
 * A vertical rail with events attached to it: who did what, when.
 *
 * One direction, stated once by the caller and never mixed - a feed that flips
 * order between screens makes every timestamp a thing to re-read. Newest-first
 * is the activity feed, because the answer is usually "what just happened";
 * oldest-first is a process being followed through, which is `AppTracking`'s
 * job when the steps are known in advance and this one's when they are not.
 *
 * Every entry has to answer WHO, WHAT and WHEN, which is why `actor`, `title`
 * and `timestamp` are all required. Drop the actor and it is a log nobody can
 * audit; drop the object and "Updated" is not information.
 *
 * Settled: time is rendered twice over. What is SHOWN is relative ("3h ago"),
 * because that is the question being asked while scanning; what is KEPT is the
 * instant, in `<time datetime>` with the full local timestamp as its title,
 * because "3h ago" is unusable the moment someone needs to match it against
 * anything else.
 *
 * Settled: relative time and the day grouping are both deferred to after mount,
 * and the first render - the server's, and the client's hydrating pass - draws
 * absolute dates grouped by the instant's UTC day. Both halves need to know
 * `now` and the viewer's time zone, and the server has neither: rendering "3h
 * ago" or "Today" during SSR is a hydration mismatch on every entry, and the
 * day grouping is a *structural* one, which React cannot patch over. Deferring
 * costs one extra render on mount, keeps the crawler a real date in a real
 * `<time>` element, and is the same trap `AppDateRangeFilter` hit with Intl.
 */
export function AppTimeline({
	className,
	collapseAfter,
	"data-cy": dataCy,
	empty,
	entries,
	headingLevel = 3,
	isLoading = false,
	isLoadingMore = false,
	label,
	maxHeight,
	onLoadMore,
	order = "newest-first",
}: AppTimelineProps) {
	const now = useTickingClock();
	const headingId = useId();
	const rootRef = useRef<HTMLElement>(null);
	const topRef = useRef<HTMLDivElement>(null);
	const { heldCount, revealHeld, shown } = useHeldEntries(entries, order, topRef);
	/* The two caps never stack - see the note on `maxHeight`. */
	const { expand, hiddenCount, visible } = useCollapsed(shown, maxHeight === undefined ? collapseAfter : undefined, rootRef);
	const scroll = scrollBox(maxHeight);

	if (isLoading) {
		return (
			<TimelineSkeleton
				className={className}
				data-cy={dataCy}
				label={label}
				scroll={scroll}
			/>
		);
	}

	if (entries.length === 0) {
		return (
			<div
				className={className}
				data-cy={dataCy}
				data-state="empty"
			>
				{/*
				 * The table's empty state, not a second copy of it. The reasons are
				 * about *why* a list is empty, which is the same question here.
				 */}
				<AppEmptyState
					action={empty?.action}
					data-cy={dataCy ? `${dataCy}-empty` : undefined}
					description={empty?.description}
					query={empty?.query}
					reason={empty?.reason ?? "no-data"}
					title={empty?.reason ? undefined : "No activity yet"}
				/>
			</div>
		);
	}

	const groups = groupByDay(visible, now);

	return (
		<section
			aria-label={label}
			className={cn("relative", scroll.className, className)}
			data-cy={dataCy}
			data-order={order}
			data-scrolls={scroll.isBox ? "" : undefined}
			data-state="ready"
			ref={rootRef}
			style={scroll.style}
			tabIndex={scroll.tabIndex}
		>
			{/*
			 * The sentinel the held-back rule watches, and the thing "3 new" scrolls
			 * back to. It sits above the pill so revealing lands on the first entry.
			 */}
			<div ref={topRef} />

			{heldCount > 0 ? (
				<NewEntriesPill
					count={heldCount}
					onPress={revealHeld}
				/>
			) : null}

			{groups.map((group, groupIndex) => (
				<div key={group.key}>
					<DayHeading
						hasRailAbove={groupIndex > 0}
						id={`${headingId}-${group.key}`}
						level={headingLevel}
						text={group.heading}
					/>
					{/*
					 * One `<ol>` per day rather than one for the feed, labelled by the
					 * heading above it. Order is the meaning here, so it has to be a
					 * numbered list either way - and per day the count a screen reader
					 * reads out ("list of 5, item 2") is a count of something, where a
					 * global "item 47 of 300" answers nothing.
					 */}
					<ol aria-labelledby={`${headingId}-${group.key}`}>
						{group.entries.map((entry, entryIndex) => (
							<TimelineRow
								entry={entry}
								/* The rail stops at the last dot. A line running past the final
								   entry into empty space reads as content that failed to load -
								   but it must still cross the day headings between groups, and
								   the collapsed tail, where the line carrying on into the
								   button is what says the feed has not ended. */
								hasRailBelow={
									hiddenCount > 0 || groupIndex < groups.length - 1 || entryIndex < group.entries.length - 1
								}
								/* The gap to the NEXT day is the heading's to own, not this
								   row's - see the note on TimelineRow. */
								isLastInGroup={entryIndex === group.entries.length - 1}
								key={entry.key}
								now={now}
							/>
						))}
					</ol>
				</div>
			))}

			{hiddenCount > 0 ? (
				<TimelineExpander
					count={hiddenCount}
					onPress={expand}
					order={order}
				/>
			) : null}

			{/*
			 * Never both. Asking the server for older history while this feed is
			 * still sitting on entries it already has is two "there is more" buttons
			 * stacked, and the wrong one is on top.
			 */}
			{onLoadMore && hiddenCount === 0 ? (
				<div className={cn("pt-3", CONTENT_INSET)}>
					{/*
					 * At the bottom, and only ever appending. Older entries arriving
					 * below the fold move nothing that is being read, which is what
					 * "keeps scroll position" means here - there is nothing to restore.
					 */}
					{/* Raw Button, deliberately. `data-load-more` is the selector
					    AppTimeline.cy.ts clicks, and AppButton forwards only `data-cy` -
					    its constrained surface is the point of it. Converting this would
					    typecheck, look tidier, and break a passing spec. */}
					<Button
						data-load-more=""
						isDisabled={isLoadingMore}
						isPending={isLoadingMore}
						onPress={onLoadMore}
						size="sm"
						variant="secondary"
					>
						{isLoadingMore ? "Loading…" : "Load more"}
					</Button>
				</div>
			) : null}
		</section>
	);
}

/* -------------------------------------------------------------------------- */

interface EventPreset {
	/** The tone lands on the GLYPH, not on a fill - see the note below. */
	color: string;
	icon: LucideIcon;
	/** Read out in place of the glyph, which is decoration. */
	label: string;
}

/**
 * Five types, five glyphs, five tones - and the glyph is the one that carries
 * it. `system` is amber because it is the only row nobody chose: an auto-expiry
 * or a failed sync is the entry most likely to need an eye. `commented` is the
 * neutral one, since a thread full of comments should not be a wall of colour.
 *
 * Settled: the colour is on the ICON, and the marker itself is the same
 * outlined circle every time - NOT a `chip-soft-*` filled disc per type. Five
 * pastel fills stacked down one rail is the loudest thing on the card and it
 * reads as five kinds of badge rather than one kind of event; the outline is
 * also the marker AppTracking already draws, so the two components stop being
 * two different-looking vertical runs of dots. Colour is still never the only
 * channel here - the glyph differs first, and each marker carries its type as
 * screen-reader text.
 */
const EVENT: Record<TimelineEventType, EventPreset> = {
	commented: { color: "text-muted", icon: MessageSquare, label: "Comment" },
	created: { color: "text-success", icon: Plus, label: "Created" },
	deleted: { color: "text-danger", icon: Trash2, label: "Deleted" },
	system: { color: "text-warning", icon: Cog, label: "System" },
	updated: { color: "text-accent", icon: Pencil, label: "Updated" },
};

/**
 * The rail is one unbroken line from the first dot to the last, and it runs
 * BEHIND the day headings rather than being cut by them: "one vertical rail"
 * is the first rule, and a pill sitting across it turned it into three.
 *
 * Its x is 13px - half the 28px marker, minus half the 2px line. Every offset
 * in this component derives from those two numbers, so changing the marker size
 * has exactly one other place to go.
 */
const RAIL = "absolute left-[13px] w-0.5 bg-border";

/** The content column: the marker's width plus the gap after it. */
const CONTENT_INSET = "pl-10";

/**
 * Settled: the row's bottom padding is the gap to the next ENTRY, and it is
 * dropped at a day boundary because `DayHeading` already carries the gap to the
 * next DAY (its `h-3` spacer). Charging both produced a feed whose rhythm depended on the
 * data: one event per day - an approval trail, where that is the normal shape -
 * put a heading between every pair of rows and doubled every gap in the card,
 * while a busy day stayed tight. The rail is a separate question and still
 * crosses the boundary, so `hasRailBelow` stays its own prop.
 */
function TimelineRow({
	entry,
	hasRailBelow,
	isLastInGroup,
	now,
}: {
	entry: TimelineEntry;
	hasRailBelow: boolean;
	isLastInGroup: boolean;
	now: Date | null;
}) {
	const preset = EVENT[entry.type];
	const date = toDate(entry.timestamp);

	return (
		<li
			className={cn(
				"relative flex gap-3",
				hasRailBelow && !isLastInGroup ? "pb-5" : "pb-0",
				"rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus",
			)}
			data-entry-key={entry.key}
			data-type={entry.type}
			/* Out of the tab order, but reachable programmatically: expanding the
			   collapsed tail destroys the button that was focused, and focus landing
			   on <body> drops a keyboard user back at the top of the document. */
			tabIndex={-1}
		>
			{/*
			 * Starts below the marker rather than behind it, so a translucent surface
			 * cannot show the line crossing the glyph.
			 */}
			{hasRailBelow ? (
				<span
					aria-hidden="true"
					className={cn(RAIL, "top-8 bottom-0 rounded-full")}
				/>
			) : null}

			{/* Opaque, so the rail passing behind it does not show through the glyph. */}
			<span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-surface">
				<preset.icon
					aria-hidden="true"
					className={cn("size-3.5", preset.color)}
				/>
				{/* Colour is never the only channel, and neither is a glyph. */}
				<span className="sr-only">{preset.label}:</span>
			</span>

			<div className="min-w-0 flex-1 pt-0.5">
				{/*
				 * Wraps rather than truncating: the sentence IS the entry, and a feed
				 * that ellipsises "archived order ORD-258…" has thrown away the object
				 * the row exists to name. The stamp is shrink-0 and drops to its own
				 * line on a phone instead of squeezing the sentence.
				 */}
				<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
					<p className="min-w-0 text-sm">
						<span className="font-semibold">{entry.actor}</span> <span className="text-muted">{entry.title}</span>
					</p>
					<EntryTime
						date={date}
						now={now}
					/>
				</div>

				{entry.summary ? <p className="mt-0.5 text-sm text-muted">{entry.summary}</p> : null}

				{entry.detail ? <EntryDetail>{entry.detail}</EntryDetail> : null}
			</div>
		</li>
	);
}

/**
 * Relative in the text, absolute in the markup - and absolute in the text too
 * until the clock arrives, because the server has no "now" to be relative to.
 *
 * `datetime` is the ISO instant at every stage, which is the only unambiguous
 * form and the one a crawler and a copy-paste both get.
 */
function EntryTime({ date, now }: { date: Date; now: Date | null }) {
	return (
		<time
			className="shrink-0 text-xs text-muted tabular-nums"
			dateTime={date.toISOString()}
			title={now ? formatAbsolute(date) : undefined}
		>
			{now ? formatRelative(date, now) : formatUtcDate(date)}
		</time>
	);
}

/**
 * A timeline is scanned first and read second, so nothing may cost a scroll
 * before it can be skipped. The summary line above stays put; only the body
 * folds away, and it is collapsed on arrival rather than on a height threshold
 * - a "is this tall enough to matter" measurement makes two adjacent entries
 * behave differently for no reason the user can see.
 */
function EntryDetail({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const bodyId = useId();

	return (
		<div className="mt-2">
			<button
				aria-controls={bodyId}
				aria-expanded={isOpen}
				className={cn(
					"flex cursor-pointer items-center gap-1 rounded-lg text-xs font-semibold text-accent",
					"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				)}
				onClick={() => setIsOpen((open) => !open)}
				type="button"
			>
				{isOpen ? "Show less" : "Show more"}
				<ChevronDown
					aria-hidden="true"
					className={cn("size-3.5 transition-transform motion-reduce:transition-none", isOpen && "rotate-180")}
				/>
			</button>
			{isOpen ? (
				<div
					className="mt-2 rounded-2xl border border-border bg-muted-surface/60 p-3 text-sm break-words"
					id={bodyId}
				>
					{children}
				</div>
			) : null}
		</div>
	);
}

/* -------------------------------------------------------------------------- */

const HEADINGS = { 2: "h2", 3: "h3", 4: "h4" } as const;

/**
 * A long feed of relative stamps has no anchors, so the days are the anchors -
 * and they are sticky, because the anchor is worthless once it has scrolled
 * away from the entries it is anchoring.
 *
 * Settled: it is a quiet label in the CONTENT column, not a pill on the rail.
 * A bordered pill is the shape a status chip has in this app, so a date wearing
 * one reads as a badge on the entry under it; and sitting at the left edge it
 * straddled the rail and the text, aligning with neither, while cutting the
 * rail into a segment per day. Set in the content column it lines up with every
 * actor name below it, and the rail runs behind it unbroken.
 *
 * The row is opaque and outranks the markers (z-20 over z-10) so entries pass
 * UNDER it while it is pinned - which means the component assumes it is on a
 * plain surface. That is the same assumption AppUserList makes, and the price
 * of a sticky header anywhere.
 */
function DayHeading({
	hasRailAbove,
	id,
	level,
	text,
}: {
	hasRailAbove: boolean;
	id: string;
	level: 2 | 3 | 4;
	text: string;
}) {
	const Tag = HEADINGS[level];

	return (
		<>
			{/*
			 * The gap to the next DAY, and a SIBLING of the sticky box rather than
			 * padding inside it.
			 *
			 * Settled: padding on the pinned element pins with it, so as `pt-5` this
			 * left every heading but the first hanging 20px below the top of the
			 * scroll container while "Today" - which has no gap, having nothing
			 * above it - sat flush against it. One element with two different pinned
			 * appearances, decided by nothing more than whether the day happened to
			 * be the newest one. Out here the gap scrolls away with the content it
			 * separates and every heading pins to the same place, which is also what
			 * let it come down to 12px: it is now only ever seen doing its one job.
			 *
			 * It stays a sibling INSIDE the group wrapper for a second reason: a
			 * sticky element only travels within its own parent, so wrapping the
			 * label in its own padded box would end its run at the heading instead
			 * of at the end of the day it heads.
			 */}
			{hasRailAbove ? (
				<div
					aria-hidden="true"
					className="relative h-3"
				>
					<span className={cn(RAIL, "inset-y-0")} />
				</div>
			) : null}
			<div
				className={cn("sticky top-0 z-20 bg-surface pb-2", CONTENT_INSET)}
				data-day-heading=""
			>
				{/* The first heading has nothing above it to join up to. */}
				{hasRailAbove ? (
					<span
						aria-hidden="true"
						className={cn(RAIL, "inset-y-0")}
					/>
				) : null}
				<Tag
					className="text-xs font-semibold text-muted"
					id={id}
				>
					{text}
				</Tag>
			</div>
		</>
	);
}

/**
 * The cut in a collapsed feed, and the only thing marking it - no fading edge
 * over the last row. A gradient buys a hint at the cost of a half-legible
 * entry, where the button says the exact number being withheld.
 *
 * Settled: it expands once and does not offer the way back. A "Show less" for a
 * feed this long lands at the bottom of everything it just revealed, which
 * means scrolling past the whole list to undo the press - and a second copy
 * pinned at the top is chrome for an action nobody takes twice.
 *
 * The rail runs on into it (`pt-5` owns the gap to the last entry, the same way
 * `DayHeading`'s spacer owns the gap to the next day), because a line stopping
 * dead at the last dot is how this component says a feed has ENDED.
 */
function TimelineExpander({ count, onPress, order }: { count: number; onPress: () => void; order: TimelineOrder }) {
	/* Newest-first hides the tail, which is the old end; oldest-first hides the
	   tail too, which is the new one. "More" would be true of both and useful
	   for neither. */
	const word = order === "newest-first" ? "older" : "newer";

	return (
		<div
			className={cn("relative pt-5", CONTENT_INSET)}
			data-timeline-expander=""
		>
			<span
				aria-hidden="true"
				className={cn(RAIL, "top-0 h-5")}
			/>
			{/* Raw Button for the same reason as the load-more and the pill: the data
			    attribute is the spec's handle on it. */}
			<Button
				data-expand=""
				onPress={onPress}
				size="sm"
				variant="secondary"
			>
				<ChevronDown
					aria-hidden="true"
					className="size-3.5"
				/>
				{`Show ${count} ${word} entries`}
			</Button>
		</div>
	);
}

/**
 * Out of flow (`h-0`) on purpose. A pill that took its own height would push
 * the entry being read down the page at the exact moment it arrived, which is
 * the thing the held-back rule exists to stop.
 */
function NewEntriesPill({ count, onPress }: { count: number; onPress: () => void }) {
	return (
		<div className="pointer-events-none sticky top-2 z-30 flex h-0 justify-center">
			{/* Raw Button for the same reason as the load-more above: this data
			    attribute is the spec's handle on the pill. */}
			<Button
				className="pointer-events-auto shadow-soft"
				data-new-entries=""
				onPress={onPress}
				size="sm"
				variant="primary"
			>
				<ArrowUp
					aria-hidden="true"
					className="size-3.5"
				/>
				{count === 1 ? "1 new entry" : `${count} new entries`}
			</Button>
		</div>
	);
}

/** The rail and four dots at the real row height, so nothing jumps on arrival. */
function TimelineSkeleton({
	className,
	"data-cy": dataCy,
	label,
	scroll,
}: {
	className?: string;
	"data-cy"?: string;
	label: string;
	scroll: ScrollBox;
}) {
	return (
		/* A `<section>` rather than a div, and the same one the loaded feed uses:
		   a name only counts on an element that has a role to hang it on, and a
		   bare div has none. Naming it "loading" is also what stops a screen
		   reader announcing an empty region while the entries are in flight. */
		<section
			aria-busy="true"
			aria-label={`${label}, loading`}
			/* The cap applies here too. Four skeleton rows are shorter than most
			   panels, but a `maxHeight` below them would otherwise make the loading
			   state TALLER than the feed it is standing in for - the one jump this
			   component exists to avoid. */
			className={cn("relative", scroll.className, className)}
			data-cy={dataCy}
			data-state="loading"
			style={scroll.style}
			tabIndex={scroll.tabIndex}
		>
			{[0, 1, 2, 3].map((row, index, rows) => (
				<div
					className={cn("relative flex gap-3", index < rows.length - 1 ? "pb-5" : "pb-0")}
					key={row}
				>
					{index < rows.length - 1 ? <span className={cn(RAIL, "top-8 bottom-0 rounded-full")} /> : null}
					<Skeleton className="size-7 shrink-0 rounded-full" />
					<div className="min-w-0 flex-1 space-y-2 pt-0.5">
						<Skeleton className="h-4 w-64 max-w-full rounded-md" />
						<Skeleton className="h-3 w-40 max-w-full rounded-md" />
					</div>
				</div>
			))}
		</section>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * Live arrivals must not shove what is being read.
 *
 * The list is anchored on whichever entry is currently at its top. While that
 * anchor is not the newest one, everything above it is held back and counted
 * into the pill; entries arriving at the OTHER end (a "Load more" page) flow
 * straight in, because appending below the fold moves nothing.
 *
 * "Is the user at the top" is an IntersectionObserver on a sentinel rather than
 * a scroll listener, because this component does not own its scroll container -
 * on some screens that is the page, on others a panel - and the observer does
 * not need to know which.
 *
 * Oldest-first never holds anything: new entries land at the bottom there, and
 * the bottom is not where the reader is.
 */
function useHeldEntries(entries: TimelineEntry[], order: TimelineOrder, topRef: { current: HTMLDivElement | null }) {
	const holdsNew = order === "newest-first";
	const isTopVisible = useRef(true);
	const [anchorKey, setAnchorKey] = useState<string | null>(() => entries[0]?.key ?? null);

	useEffect(() => {
		const node = topRef.current;
		if (!node) return;

		const observer = new IntersectionObserver((records) => {
			isTopVisible.current = records[0]?.isIntersecting ?? true;
		});
		observer.observe(node);
		return () => observer.disconnect();
	}, [topRef]);

	const newestKey = entries[0]?.key ?? null;
	const anchorIndex = anchorKey ? entries.findIndex((entry) => entry.key === anchorKey) : -1;

	useEffect(() => {
		if (newestKey === anchorKey) return;
		// A dropped anchor (the feed was replaced, not appended to) re-anchors too.
		if (holdsNew && anchorIndex > 0 && !isTopVisible.current) return;
		setAnchorKey(newestKey);
	}, [anchorIndex, anchorKey, holdsNew, newestKey]);

	const heldCount = holdsNew && anchorIndex > 0 ? anchorIndex : 0;

	return {
		heldCount,
		revealHeld: () => {
			setAnchorKey(newestKey);
			topRef.current?.scrollIntoView({
				behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
				block: "start",
			});
		},
		shown: heldCount > 0 ? entries.slice(heldCount) : entries,
	};
}

/* -------------------------------------------------------------------------- */

interface ScrollBox {
	className: string | undefined;
	isBox: boolean;
	style: { maxHeight: number | string } | undefined;
	tabIndex: number | undefined;
}

/**
 * Turns the feed into its own scroll region, or leaves it alone.
 *
 * `tabIndex={0}` is not decoration: a region that scrolls and cannot be focused
 * is unreachable by keyboard, because there is nothing to put the arrow keys
 * on. It only appears when the box does, so an ordinary feed does not grow a
 * pointless tab stop - and it brings a focus ring with it, since a tab stop
 * that shows nothing on arrival is worse than none.
 *
 * `overscroll-contain` stops the page taking over the moment the box hits its
 * end, which is the flick that otherwise throws the reader down the document.
 *
 * The held-back rule needs nothing here. Its sentinel is watched by an
 * IntersectionObserver against the viewport, and an observer clips the target
 * through every scrolling ancestor on the way up - so a sentinel scrolled out
 * of THIS box already reports as hidden, exactly as it does when the page is
 * what scrolled.
 *
 * The sticky day headings need nothing either: they pin to the nearest
 * scrolling ancestor, which is now the box rather than the page.
 */
function scrollBox(maxHeight: number | string | undefined): ScrollBox {
	if (maxHeight === undefined) return { className: undefined, isBox: false, style: undefined, tabIndex: undefined };

	return {
		className: cn(
			"overflow-y-auto overscroll-contain",
			"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
		),
		isBox: true,
		style: { maxHeight },
		tabIndex: 0,
	};
}

/* -------------------------------------------------------------------------- */

/**
 * The tail of a long feed, and the press that brings it back.
 *
 * Hiding exactly one entry is never worth it - the button is taller than the
 * row it is covering up - so the cut only happens with at least two to hide.
 *
 * Expanding removes the button the user just pressed, so focus is handed to the
 * first entry it revealed. Dropping it on `<body>` instead sends a keyboard
 * user back to the top of the page to find their place again, which is the same
 * failure the held-back pill exists to prevent.
 */
function useCollapsed(entries: TimelineEntry[], collapseAfter: number | undefined, rootRef: { current: HTMLElement | null }) {
	const [isExpanded, setIsExpanded] = useState(false);
	const focusKey = useRef<string | null>(null);

	const cut = !isExpanded && collapseAfter !== undefined && entries.length > collapseAfter + 1 ? collapseAfter : null;
	const visible = cut === null ? entries : entries.slice(0, cut);

	useEffect(() => {
		const key = focusKey.current;
		if (!key) return;
		focusKey.current = null;
		rootRef.current?.querySelector<HTMLElement>(`[data-entry-key="${CSS.escape(key)}"]`)?.focus();
	}, [isExpanded, rootRef]);

	return {
		expand: () => {
			focusKey.current = cut === null ? null : (entries[cut]?.key ?? null);
			setIsExpanded(true);
		},
		hiddenCount: cut === null ? 0 : entries.length - cut,
		visible,
	};
}

/* -------------------------------------------------------------------------- */

interface DayGroup {
	entries: TimelineEntry[];
	heading: string;
	key: string;
}

/**
 * Groups in the order they arrive, never sorted - the caller stated the
 * direction, and a component that re-sorts can only disagree with it.
 */
function groupByDay(entries: TimelineEntry[], now: Date | null): DayGroup[] {
	const groups: DayGroup[] = [];

	for (const entry of entries) {
		const date = toDate(entry.timestamp);
		const key = now ? localDayKey(date) : utcDayKey(date);
		const current = groups.at(-1);

		if (current?.key === key) current.entries.push(entry);
		else groups.push({ entries: [entry], heading: dayHeading(date, now), key });
	}

	return groups;
}

/** Pre-mount: UTC, because it is the one day boundary both machines agree on. */
function utcDayKey(date: Date): string {
	return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

function localDayKey(date: Date): string {
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayHeading(date: Date, now: Date | null): string {
	if (!now) return formatUtcDate(date);

	const today = localDayKey(now);
	const yesterday = localDayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
	const key = localDayKey(date);

	if (key === today) return "Today";
	if (key === yesterday) return "Yesterday";
	return formatDate(date, now.getFullYear());
}
