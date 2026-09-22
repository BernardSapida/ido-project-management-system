import { Skeleton } from "@heroui/react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Folder, MoreHorizontal } from "lucide-react";
import { AppButton } from "../AppButton";
import { AppDropdown } from "../AppDropdown";
import { cn } from "../../lib/cn";

export interface BreadcrumbItem {
	/** Omitted on the current page. Every other crumb is a link. */
	href?: string;
	icon?: LucideIcon;
	/**
	 * A dynamic segment whose record has not arrived. Renders a skeleton rather
	 * than the raw id - "cm3x9k2" is not where the user is, it is how the route
	 * spells where they are.
	 */
	isPending?: boolean;
	/** Stable across that load, so the skeleton and the name are one crumb, not two. */
	key: string;
	/** The full text. Stays the accessible name even when the visible label truncates. */
	label: string;
	/**
	 * Roughly how wide the pending skeleton should be, in characters. Tune it to
	 * the records this segment actually holds: the point of the skeleton is that
	 * the trail does not jump sideways when the name lands.
	 */
	pendingWidthCh?: number;
}

interface AppBreadcrumbsProps {
	className?: string;
	/** Test hook on the `<nav>`. Each crumb carries `data-crumb-key` of its own. */
	"data-cy"?: string;
	items: BreadcrumbItem[];
	/** Characters a label keeps before it middle-truncates. */
	maxLabelChars?: number;
	/** Crumbs shown before the middle collapses into the overflow menu. */
	maxVisible?: number;
	/**
	 * Levels below which the trail renders nothing. Defaults to
	 * `BREADCRUMB_MIN_LEVELS`, which is the right answer in the place this
	 * component was written for: above a page's `<h1>`, where "Home > Page" is a
	 * row of chrome saying what the heading underneath already said.
	 *
	 * `AppHeader` sets it to 1, because in a bar there is no `<h1>` beside the
	 * trail for it to be redundant with - the trail IS the bar's content, and
	 * suppressing it leaves an empty strip with two icons floating in it. Same
	 * component, opposite correct answer, which is why this is a prop rather than
	 * a constant.
	 */
	minLevels?: number;
}

/**
 * Levels a trail needs before it is worth printing. Exported so a caller can ask
 * the same question the component asks - anything laid out around the trail has
 * to know when it is about to render nothing.
 */
export const BREADCRUMB_MIN_LEVELS = 3;

const DEFAULT_MAX_VISIBLE = 4;
const DEFAULT_MAX_LABEL_CHARS = 24;
const DEFAULT_PENDING_WIDTH_CH = 14;

/**
 * The trail that answers "where am I?" - never "where can I go?". If a screen is
 * using this as its navigation, the navigation is missing; add it there instead
 * of widening this.
 *
 * Renders nothing below three levels by default. On a two-level site
 * "Home > Page" is a row of chrome that tells the user something the page title
 * already said - but see `minLevels`, because a header bar has no page title
 * beside it and wants the opposite.
 *
 * Two renderings of the same trail, switched in CSS rather than in JS: the full
 * `<ol>` from `@xs` (20rem) up, and a single back affordance below it.
 *
 * That threshold is low because this container is often NOT a page column. In a
 * header the trail gets what is left after a hamburger, a logo and two actions -
 * around 21rem inside a 735px frame - so a threshold sized for a main column
 * (36rem) degraded the trail to a back link on nearly every bar, which is the
 * one place the trail IS the content. A three-level trail truncates into 20rem;
 * under that a back link really is the better answer. A chevron trail
 * wraps to two lines on a phone, which pushes the page title under the fold - so
 * the narrow rendering gets the one crumb that matters, the parent LEVEL. That
 * is not the previous page: back has to be predictable from where the user is
 * standing, not from the route they happened to arrive by. The switch is CSS
 * because the component server-renders, and a `matchMedia` read would ship the
 * wrong branch to the first paint; `display: none` keeps the unused one out of
 * the accessibility tree, so only one of them is ever announced.
 *
 * The query is on the CONTAINER, not the viewport, and that distinction is a bug
 * this had: dropped into `AppHeader` - itself a `@container` - a viewport `sm:`
 * matched on a desktop while the bar around it was 390px wide, so the full trail
 * rendered into a space that could not hold it. Every crumb is `whitespace-nowrap`
 * inside a `min-w-0` flex item, so they collapsed to zero width and painted on
 * top of one another. Reading the width it was GIVEN is the same call
 * `AppSiteHeader` and `AppKpi` make, for the same reason.
 *
 * Place it ABOVE the page title, never beside it, and never inside the card it
 * describes - a trail inside a card describes the card. The exception is a
 * header bar, which has no title of its own; that is what `minLevels` is for.
 */
export function AppBreadcrumbs({
	className,
	"data-cy": dataCy,
	items,
	maxLabelChars = DEFAULT_MAX_LABEL_CHARS,
	maxVisible = DEFAULT_MAX_VISIBLE,
	minLevels = BREADCRUMB_MIN_LEVELS,
}: AppBreadcrumbsProps) {
	const navigate = useNavigate();

	if (items.length < minLevels || items.length === 0) {
		return null;
	}

	// Past ~4 levels the middle is the part nobody reads: the root says which
	// section, the last two say where the user is. What gets swallowed stays
	// reachable in the menu - an ellipsis that is not a control is just a lie
	// about there being more.
	const isCollapsed = items.length > maxVisible;
	const overflowItems = isCollapsed ? items.slice(1, -2) : [];
	const slots: BreadcrumbSlot[] = isCollapsed
		? [
				{ item: items[0], type: "crumb" },
				{ items: overflowItems, type: "overflow" },
				...items.slice(-2).map((item) => ({ item, type: "crumb" as const })),
			]
		: items.map((item) => ({ item, type: "crumb" as const }));

	const parent = items[items.length - 2];

	return (
		<nav
			aria-label="Breadcrumb"
			className={cn("@container min-w-0", className)}
			data-collapsed={isCollapsed}
			data-cy={dataCy}
			data-levels={items.length}
		>
			{/*
			 * `flex min-w-0 overflow-hidden`, and each of the three is load-bearing.
			 * The affordance inside is a flex box that sizes to its content, so in a
			 * plain block it happily grows past the bar and paints over whatever sits
			 * to its right - which is how a truncating label still collided with the
			 * header's action icons. The row has to BE a flex container, its item has
			 * to be allowed below content width, and the box has to clip.
			 */}
			<div
				className="flex min-w-0 overflow-hidden @xs:hidden"
				data-rendering="back"
			>
				{/*
				 * At one level there is no parent to go back TO, so the compact
				 * rendering states where the user is instead. A back link that points
				 * at nothing is the version of this that renders an empty row.
				 */}
				{parent ? <BackToParent parent={parent} /> : <CurrentOnly item={items[items.length - 1]} />}
			</div>

			{/*
			 * `overflow-hidden` is load-bearing, not tidiness. Every crumb label is
			 * nowrap inside a `min-w-0` flex item, so when the trail is wider than
			 * the space it was given the items shrink toward zero and their text
			 * spills - and with nothing clipping it, four labels paint on top of one
			 * another into an unreadable smear. `maxVisible` collapses the trail by
			 * COUNT, which cannot see that six short crumbs fit where three long ones
			 * do not; this is the backstop for the width the count rule cannot know.
			 */}
			<ol
				className="hidden min-w-0 items-center gap-1.5 overflow-hidden text-sm @xs:flex"
				data-rendering="trail"
			>
				{slots.map((slot, index) => {
					const isLast = index === slots.length - 1;

					if (slot.type === "overflow") {
						return (
							<li
								className="flex shrink-0 items-center gap-1.5"
								data-crumb-overflow=""
								key="overflow"
							>
								<OverflowMenu
									items={slot.items}
									onSelect={(href) => navigate({ to: href })}
								/>
								<Separator />
							</li>
						);
					}

					return (
						<li
							aria-busy={slot.item.isPending || undefined}
							className="flex min-w-0 items-center gap-1.5"
							data-crumb-key={slot.item.key}
							key={slot.item.key}
						>
							{isLast || !slot.item.href ? (
								/*
								 * The current page is not a link to itself. `aria-current="page"`
								 * is what tells a screen reader the trail has ended here; without
								 * it the last crumb reads as one more place to go.
								 */
								<span
									aria-current={isLast ? "page" : undefined}
									className="flex items-center gap-1.5 font-semibold text-foreground"
								>
									<CrumbLabel
										item={slot.item}
										maxLabelChars={maxLabelChars}
									/>
								</span>
							) : (
								<Link
									// Every ancestor's path is a prefix of the current one - that is
									// what a trail IS - and the router's default prefix match would
									// hand `aria-current="page"` to every crumb in it. It spreads its
									// active props last, so passing `aria-current` here cannot win;
									// the only lever is what counts as active.
									activeOptions={{ exact: true }}
									className="flex items-center gap-1.5 rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
									to={slot.item.href}
								>
									<CrumbLabel
										item={slot.item}
										maxLabelChars={maxLabelChars}
									/>
								</Link>
							)}
							{isLast ? null : <Separator />}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

/* -------------------------------------------------------------------------- */

type BreadcrumbSlot = { item: BreadcrumbItem; type: "crumb" } | { items: BreadcrumbItem[]; type: "overflow" };

/** Decorative. The `<ol>` already says these are steps in a list. */
function Separator() {
	return (
		<ChevronRight
			aria-hidden="true"
			className="size-3.5 shrink-0 text-muted/60"
		/>
	);
}

/**
 * The label, middle-truncated rather than end-truncated. A record called
 * "Manila Bayside Warehouse - East Wing" and one called "...- West Wing" are the
 * same string until the last few characters, so cutting the tail off is cutting
 * off the part that identifies it.
 *
 * The truncated text is hidden from assistive tech and the full string is
 * carried beside it, because the accessible name has to stay whole - a record
 * referred to by its number must not be announced as "…".
 */
function CrumbLabel({ item, maxLabelChars }: { item: BreadcrumbItem; maxLabelChars: number }) {
	const icon = item.icon ? (
		<item.icon
			aria-hidden="true"
			className="size-3.5 shrink-0"
		/>
	) : null;

	if (item.isPending) {
		return (
			<>
				{icon}
				<Skeleton
					className="h-3.5 rounded-md"
					style={{ width: `${item.pendingWidthCh ?? DEFAULT_PENDING_WIDTH_CH}ch` }}
				/>
				<span className="sr-only">Loading</span>
			</>
		);
	}

	const display = middleTruncate(item.label, maxLabelChars);

	if (display === item.label) {
		return (
			<>
				{icon}
				{/* `truncate`, not `whitespace-nowrap`: the label has to be able to
				    give way inside its own crumb. Nowrap alone overflows the item
				    silently, which is how the trail ended up painting on itself. */}
				<span className="truncate">{item.label}</span>
			</>
		);
	}

	return (
		<>
			{icon}
			<span
				aria-hidden="true"
				className="truncate"
				title={item.label}
			>
				{display}
			</span>
			<span className="sr-only">{item.label}</span>
		</>
	);
}

/** Keeps both ends of the string and eats the middle. */
function middleTruncate(text: string, max: number): string {
	if (max < 5 || text.length <= max) {
		return text;
	}

	const head = text.slice(0, Math.ceil((max - 1) / 2)).trimEnd();
	const tail = text.slice(text.length - Math.floor((max - 1) / 2)).trimStart();

	return `${head}…${tail}`;
}

/**
 * What the ellipsis swallowed, as a real menu. Uses the app's dropdown so the
 * keyboard and focus behaviour is the one every other menu here has.
 *
 * Navigation goes through the router rather than an `<a href>`: HeroUI's link is
 * a plain anchor, and a plain anchor inside a single-page app reloads the whole
 * document to move one level up its own trail.
 */
function OverflowMenu({ items, onSelect }: { items: BreadcrumbItem[]; onSelect: (href: string) => void }) {
	return (
		<AppDropdown
			label="Hidden levels"
			sections={[
				{
					items: items.map((item) => ({
						/*
						 * The crumb's own glyph where it has one, so a level looks the
						 * same swallowed by the ellipsis as it does on the trail. The
						 * fallback is a folder rather than nothing: every row in a menu
						 * carries an icon, and these rows are levels above the current
						 * page.
						 */
						icon: item.icon ?? Folder,
						key: item.key,
						label: item.label,
						onAction: () => {
							if (item.href) onSelect(item.href);
						},
					})),
					key: "levels",
				},
			]}
			trigger={
				/* A Button, not a Dropdown.Trigger: on touch the menu is a sheet, and
				   there is no Dropdown above the trigger to trigger. */
				<AppButton
					aria-label={`Show ${items.length} hidden ${items.length === 1 ? "level" : "levels"}`}
					className="size-6 bg-transparent p-0 text-muted hover:bg-surface hover:text-foreground"
					icon={MoreHorizontal}
					isIconOnly
					size="sm"
					variant="ghost"
				/>
			}
		/>
	);
}

/**
 * The compact rendering when there is nowhere above to go - a one-level trail,
 * which only happens where `minLevels` has been lowered for a header bar.
 *
 * It states the current page rather than offering a back link to nothing, and it
 * carries `aria-current="page"` like the last crumb of the full trail does, so
 * the two renderings say the same thing about where the user is.
 */
function CurrentOnly({ item }: { item: BreadcrumbItem }) {
	return (
		<span
			aria-current="page"
			className="flex min-h-11 min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground"
		>
			{item.isPending ? (
				<Skeleton
					className="h-3.5 rounded-md"
					style={{ width: `${item.pendingWidthCh ?? DEFAULT_PENDING_WIDTH_CH}ch` }}
				/>
			) : (
				<span className="truncate">{item.label}</span>
			)}
		</span>
	);
}

/**
 * The narrow rendering's whole trail: one target, naming the level above.
 * `aria-label` carries the full parent name so a truncated one still announces
 * in full, and the row is 44px tall because it is the only way out of this
 * screen that is not the system back gesture.
 */
function BackToParent({ parent }: { parent: BreadcrumbItem }) {
	const content = (
		<>
			<ChevronLeft
				aria-hidden="true"
				className="size-4 shrink-0"
			/>
			{parent.isPending ? (
				<Skeleton
					className="h-3.5 rounded-md"
					style={{ width: `${parent.pendingWidthCh ?? DEFAULT_PENDING_WIDTH_CH}ch` }}
				/>
			) : (
				<span className="truncate">{parent.label}</span>
			)}
		</>
	);

	if (!parent.href || parent.isPending) {
		return <span className="flex min-h-11 min-w-0 items-center gap-1 text-sm font-semibold text-muted">{content}</span>;
	}

	return (
		<Link
			// Same reason as the trail's links: the parent's path is a prefix of
			// where the user is standing, so a prefix match would call it the
			// current page.
			activeOptions={{ exact: true }}
			aria-label={`Back to ${parent.label}`}
			className="flex min-h-11 min-w-0 items-center gap-1 rounded-md text-sm font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
			to={parent.href}
		>
			{content}
		</Link>
	);
}
