// Deep imports, not `@/components/custom`. Vite does not tree-shake in dev, so
// touching that 62-export barrel makes the browser fetch all 130 files behind
// it - and this nav is mounted on every /components/* page, so it did that on
// all of them.
import { AppButton, AppSearchField, AppTooltip, markMatches } from "@bernardsapida/web-ui";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import type { LabEntry, LabGroup } from "@/features/labs/labs.registry";
import { LAB_GROUPS } from "@/features/labs/labs.registry";
import { getLabStatusMeta } from "@/features/labs/labs.status";
import { cn } from "@/utils/cn";

/** The index page, drawn as the first row of the nav rather than as a heading. */
const ALL_LABS_ENTRY: LabEntry = {
	blurb: "Every lab as a card, grouped the same way this list is.",
	icon: LayoutGrid,
	label: "All labs",
	to: "/components",
};

interface LabNavPanelProps {
	/**
	 * Test hook on the `<nav>`. `-search` and `-empty` derive from it.
	 *
	 * The panel is mounted TWICE on a narrow-then-wide session - once as the
	 * column, once inside the drawer - so the caller supplies this rather than the
	 * panel naming itself, or a spec matching "the lab nav" would sometimes match
	 * two elements.
	 */
	"data-cy"?: string;
	/** Icon rail: the field goes, the headings go, the labels move into tooltips. */
	isCollapsed?: boolean;
	/**
	 * The landmark's name. The drawer and the column are never in the tree at the
	 * same time (`AppLayout` renders one or the other), so both may say the same
	 * thing.
	 */
	navLabel?: string;
	/** Called on every row press. The drawer closes itself with it. */
	onNavigate?: () => void;
}

/**
 * The list of labs: a filter, then every lab grouped the way the registry groups
 * them.
 *
 * One component for the standing column and for the compact drawer, because they
 * are the same nav at two widths - the thing that differs is the panel AROUND it,
 * which is the caller's. It renders a search field and a `<nav>` and nothing
 * else: no heading, no chrome, no width. Both callers are flex columns and this
 * expects to be a flex child of one, with the list taking the free height.
 *
 * ## The filter is in-place, not a result panel
 *
 * `AppSearchField` over the list, the way `AppSidebar` filters its destinations -
 * not `AppSearchBar`, which is what the drawer used when it was the only nav.
 * A floating result panel earns its keep over a list you cannot see; over one
 * standing right underneath it, it is a second copy of the same rows drawn on
 * top of the first. Filtering in place also gets rid of the reason the field had
 * to live outside the scrollport: there is no absolutely-positioned panel left
 * for an `overflow-y-auto` ancestor to clip.
 *
 * There is deliberately no `/` shortcut, though `AppSidebar` has one. Two labs -
 * `app-sidebar` and `navigation` - mount real `AppSidebar` specimens, and that
 * component binds `/` globally; a second binding here would race it on those two
 * pages and steal the key from whichever field the reader was looking at.
 */
export function LabNavPanel({
	"data-cy": dataCy,
	isCollapsed = false,
	navLabel = "Component labs",
	onNavigate,
}: LabNavPanelProps) {
	const [query, setQuery] = useState("");
	const searchInputRef = useRef<HTMLInputElement>(null);
	const navRef = useRef<HTMLElement>(null);
	const pathname = useRouterState({ select: (state) => state.location.pathname });

	// The rail has no field, so it can have no query - and a filter still applied
	// from before it collapsed would hide rows with nothing on screen saying why.
	const isSearching = !isCollapsed && query.trim() !== "";
	const groups = isSearching ? filterLabs(query) : LAB_GROUPS;

	// Pressing a row is the filter's whole job done - so clear it. A stale "tab"
	// still narrowing the list on the next page is the reader's problem to notice,
	// and the drawer-close hook the caller may have passed still fires. Left on
	// the panel rather than the row so a row stays a plain link.
	const handleNavigate = () => {
		onNavigate?.();
		setQuery("");
	};

	// With the filter cleared the full column is back, and the row just pressed
	// can be anywhere in a run of sixty - usually past the fold. Bring the active
	// row into view so the nav still answers "where am I". Keyed on the pathname,
	// so a lab opened from a deep link or the browser's back button lands the same
	// way. `nearest` so a row already on screen does not move.
	useEffect(() => {
		if (isCollapsed) return;
		const raf = requestAnimationFrame(() => {
			navRef.current
				?.querySelector<HTMLElement>('[data-status="active"], [aria-current="page"]')
				?.scrollIntoView({ block: "nearest" });
		});
		return () => cancelAnimationFrame(raf);
	}, [pathname, isCollapsed]);

	return (
		<>
			{isCollapsed ? null : (
				<div className="shrink-0 pb-3">
					<AppSearchField
						// Local filtering over an array this size: a delay would only put
						// the list behind the typing.
						data-cy={dataCy ? `${dataCy}-search` : undefined}
						debounceMs={0}
						inputRef={searchInputRef}
						label="Search component labs"
						onValueChange={setQuery}
						placeholder="Search labs"
						value={query}
					/>
				</div>
			)}

			<nav
				aria-label={navLabel}
				className="scrollbar-none -mx-1 min-h-0 flex-1 overflow-y-auto px-1"
				data-cy={dataCy}
				ref={navRef}
			>
				{/*
				 * The way back to the index, and a real destination rather than a
				 * heading - so it is the first ROW, above the groups, at both widths.
				 * It is outside the filter for the same reason `AppSidebar` keeps its
				 * account block out of one: a query that matches nothing must not take
				 * the way out of the screen with it.
				 */}
				<LabNavRow
					hasStatus={false}
					isCollapsed={isCollapsed}
					isExact
					lab={ALL_LABS_ENTRY}
					onNavigate={handleNavigate}
				/>

				{groups.length > 0 ? (
					<div className={cn("flex flex-col", isCollapsed ? "gap-3 pt-3" : "gap-4 pt-2")}>
						{groups.map((group) => (
							<LabNavGroup
								group={group}
								isCollapsed={isCollapsed}
								key={group.heading}
								onNavigate={handleNavigate}
								searchQuery={isSearching ? query : undefined}
							/>
						))}
					</div>
				) : (
					/*
					 * Searched, matched nothing. Not a blank column: it names what was
					 * typed so the typo is visible, and carries the way out. The row above
					 * is untouched, so this is never a dead end.
					 */
					<div
						className="px-3 py-6 text-center"
						data-cy={dataCy ? `${dataCy}-empty` : undefined}
					>
						<p className="text-sm font-semibold text-foreground">No matches</p>
						<p className="mt-1 text-xs text-muted">
							No lab is called “{query.trim()}”. Check the spelling, or search for less of it.
						</p>
						<AppButton
							className="mt-3"
							onPress={() => {
								setQuery("");
								searchInputRef.current?.focus();
							}}
							size="sm"
							variant="secondary"
						>
							Clear search
						</AppButton>
					</div>
				)}
			</nav>
		</>
	);
}

/**
 * A heading and its links, or nothing at all - a heading left standing over an
 * empty group reads as a section that failed to load rather than as one the
 * filter emptied.
 *
 * The heading is drawn only where there is room to read it. On the rail the gap
 * between groups carries the grouping on its own, which is why that gap is
 * larger than the gap between the rows inside a group: inner smaller than outer,
 * or there are no groups.
 */
function LabNavGroup({
	group,
	isCollapsed,
	onNavigate,
	searchQuery,
}: {
	group: LabGroup;
	isCollapsed: boolean;
	onNavigate?: () => void;
	searchQuery?: string;
}) {
	if (group.labs.length === 0) return null;

	return (
		<div data-nav-section={group.heading}>
			{isCollapsed ? null : (
				<p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">{group.heading}</p>
			)}
			<div className={cn("flex flex-col", isCollapsed ? "items-center gap-1" : "gap-0.5")}>
				{group.labs.map((lab) => (
					<LabNavRow
						isCollapsed={isCollapsed}
						key={lab.to}
						lab={lab}
						onNavigate={onNavigate}
						searchQuery={searchQuery}
					/>
				))}
			</div>
		</div>
	);
}

type LinkDOMProps = Omit<ComponentProps<typeof Link>, "to">;

/**
 * One lab.
 *
 * On the rail the label moves into an `AppTooltip` - a column of sixty glyphs is
 * a quiz without them - and `render` makes the tooltip's trigger BE the anchor
 * rather than a div wrapped around one, which is what keeps the rail at one tab
 * stop per row. The same call, for the same reason, as `AppNavList`'s rail. The
 * name stays on the link itself as `sr-only`, never only in the tooltip.
 */
function LabNavRow({
	hasStatus = true,
	isCollapsed,
	isExact = false,
	lab,
	onNavigate,
	searchQuery,
}: {
	/** False for the index row: "All labs" is the way back, not a lab with a state. */
	hasStatus?: boolean;
	isCollapsed: boolean;
	/** Prefix matching would light this row on every child route. See `/components`. */
	isExact?: boolean;
	lab: LabEntry;
	onNavigate?: () => void;
	/**
	 * The live filter term. When set, the run of the label matching it is marked -
	 * the same `<mark>` the app sidebar and the data table use, so a hit looks the
	 * same wherever it is typed. Never passed on the rail, where the label is
	 * `sr-only`.
	 */
	searchQuery?: string;
}) {
	const status = getLabStatusMeta(lab.to);
	const linkProps = {
		activeOptions: isExact ? { exact: true } : undefined,
		activeProps: { className: "gradient-brand shadow-glow" },
		inactiveProps: { className: "text-foreground/70" },
		// Pressing the lab you are already on is a no-op navigation, so a drawer
		// close cannot be hung off the route change - it goes on the click.
		onClick: onNavigate,
		to: lab.to,
	};

	const className = cn(
		"flex items-center rounded-xl text-sm font-medium transition hover:bg-muted-surface",
		"focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none",
		isCollapsed ? "size-11 shrink-0 justify-center" : "gap-2 px-3 py-2",
	);

	const content = (
		<>
			<lab.icon
				aria-hidden="true"
				className={isCollapsed ? "size-5 shrink-0" : "size-4 shrink-0"}
			/>
			{isCollapsed ? (
				<span className="sr-only">{lab.label}</span>
			) : (
				<span className="truncate">{markMatches(lab.label, searchQuery ?? "")}</span>
			)}
			{/*
			 * A dot only on the labs that are NOT done yet - complete is the resting
			 * state and carries no mark, an unfinished lab is the one thing worth
			 * spotting in a column of sixty. It is `bg-warning`, the same "on
			 * progress" colour the index card's chip wears. The row is 16rem wide and
			 * already holds an icon and a name, so it is a dot and not the word; the
			 * rail drops it entirely and says the state in the tooltip instead.
			 */}
			{hasStatus && !isCollapsed && status.status !== "complete" ? (
				<span
					aria-label={status.label}
					className="ml-auto size-1.5 shrink-0 rounded-full bg-warning"
					role="img"
				/>
			) : null}
		</>
	);

	if (!isCollapsed) {
		return (
			<Link
				className={className}
				{...linkProps}
			>
				{content}
			</Link>
		);
	}

	/*
	 * The rail has no room for the dot, so the state has to be said in words
	 * here or it is not said at all. "Not built yet" wins over "On progress" for
	 * a stub - both are true, and one of them tells the reader what they will
	 * find on the page.
	 */
	const railDescription = hasStatus ? `${lab.isStub ? "Not built yet" : status.label}. ${lab.blurb}` : lab.blurb;

	return (
		<AppTooltip
			description={railDescription}
			icon={lab.icon}
			placement="right"
			title={lab.label}
		>
			<AppTooltip.Trigger
				className={className}
				render={(props) => (
					<Link
						{...(props as LinkDOMProps)}
						{...linkProps}
					>
						{content}
					</Link>
				)}
			/>
		</AppTooltip>
	);
}

/**
 * Substring, not fuzzy: "bar" should find the search bar, "br" should not.
 *
 * Groups whose every lab was filtered out come back empty rather than removed,
 * so `LabNavGroup` is the one place that decides what an empty group looks like.
 */
function filterLabs(query: string): LabGroup[] {
	const needle = query.trim().toLowerCase();

	return LAB_GROUPS.map((group) => ({
		heading: group.heading,
		labs: group.labs.filter((lab) => lab.label.toLowerCase().includes(needle)),
	})).filter((group) => group.labs.length > 0);
}
