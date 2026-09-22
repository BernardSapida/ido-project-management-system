import { Card, Skeleton } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ImageOff, MoreHorizontal } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { Fragment, useId, useState } from "react";
import { AppButton } from "../AppButton";
import type { DropdownSection } from "../AppDropdown";
import { AppDropdown } from "../AppDropdown";
import { AppGlassCard } from "../AppGlassCard";
import { AppGradientIconTile } from "../AppGradientIconTile";
import { cn } from "../../lib/cn";
import { createSlots, type SlottedProps } from "../../lib/slots";

/** A card's heading tag. Never hard-coded: the same card lands under an `h1` on
 *  one screen and inside an `h2` section on another. */
export type CardHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * What the title IS, which decides how the header is drawn.
 *
 * `subject` - the title is what the card is about: a warehouse, a post, a
 * product. It gets the heading treatment (base, semibold) and the icon tile sits
 * on its own line above it, where it reads as the card's badge.
 *
 * `label` - the title NAMES something else the card holds, and that something
 * else is what the reader came for: a metric, a chart, a total. It drops to the
 * small muted style and the icon moves up beside it, because the biggest thing
 * in a tile has to be the value, not the word for it. Shipping `Monthly revenue`
 * at 16px semibold over `$21,300` is the hierarchy inverted, and it is the most
 * common defect in a dashboard.
 *
 * The tag is unaffected: a `label` title is still a real heading at
 * `headingLevel`, so the page stays navigable by heading either way.
 */
export type CardTitleRole = "label" | "subject";

/**
 * The quiet way out of a card - "View report", "See all 24".
 *
 * A LINK, always, so it can be middle-clicked, opened in a tab and seen by the
 * router. It is the tertiary rung of the ladder and renders as a ghost, under
 * any real actions - a card with three solid buttons has no primary action.
 */
export interface CardFooterLink {
	label: string;
	to: string;
}

/**
 * The parts of a card a caller may restyle, and the first component in this
 * package to carry a slot map. See `lib/slots.ts` for the standard and
 * `markdowns/Web/Slot API Checklist.md` for which components have adopted it.
 *
 * What is deliberately NOT here, because a slot for it would be a way to break
 * the rule the component exists to hold:
 *
 * - **Padding.** `.card` is a flex column at 16px, and a wrapper you have to
 *   hand a `p-*` to is one that will be handed a different `p-*` on the next
 *   screen. If the number is wrong it is wrong everywhere, and the fix is here.
 * - **The description clamp.** `descriptionLines` is the prop for it, and it is
 *   deliberately a closed set - ragged descriptions are what make a grid of
 *   cards look broken rather than varied.
 * - **The stretched `::after` and its focus ring.** A whole-card link's hit area
 *   and the ring the keyboard lands on are the accessibility contract of the
 *   `to` branch, not decoration on it.
 * - **The gap between parts.** Same argument as the padding.
 *
 * `content` is the wrapper around `children` and did not exist as an element
 * before this: children used to be rendered bare into the card's flex column.
 * It is a `contents`-display span when unstyled, so a caller who never touches
 * the slot gets the layout they had - the box only becomes a box when asked for.
 */
export type AppCardSlot =
	| "actions"
	| "base"
	| "content"
	| "description"
	| "footer"
	| "header"
	| "icon"
	| "media"
	| "meta"
	| "title";

export type CardMediaRatio = "1/1" | "4/3" | "16/9";

/** Fixed ratios only. A card whose media height comes from the image is a card
 *  that changes height when the image lands. */
const MEDIA_RATIO: Record<CardMediaRatio, string> = {
	"1/1": "aspect-square",
	"4/3": "aspect-[4/3]",
	"16/9": "aspect-video",
};

export interface CardMedia {
	alt: string;
	/** @default "16/9" */
	ratio?: CardMediaRatio;
	/** Absent, slow or 404 all land on the same placeholder. */
	src?: string;
}

export interface CardMetaItem {
	icon?: LucideIcon;
	label: string;
}

export interface CardAction {
	label: string;
	onPress: () => void;
}

interface AppCardBaseProps extends SlottedProps<AppCardSlot> {
	/**
	 * Anything the structured slots do not cover, between the meta row and the
	 * footer - a small chart, a definition list, a row of stats.
	 *
	 * The title, description, media, meta and actions stay props rather than
	 * children on purpose: those five are what makes a row of cards scan as a row
	 * rather than as five unrelated boxes, and a slot would let each call site
	 * re-decide their order. This is the escape hatch for the rest, not a way to
	 * opt out of them. A dashboard tile IS this component - it has a title, the
	 * title just is not the loudest thing in it, which is what `titleRole="label"`
	 * says. Only a surface with NO title at all - a form panel, a lab section -
	 * was never this component; that is AppGlassCard.
	 */
	children?: ReactNode;
	/** Test hook on the card. It carries `data-target` too - link or actions. */
	"data-cy"?: string;
	/** Clamped so a row of cards keeps one baseline - see `descriptionLines`. */
	description?: string;
	/**
	 * How many lines the description gets before it is cut off.
	 *
	 * Two by default, and that default is the rule: ragged descriptions are what
	 * make a grid of cards look broken rather than varied, and a card is a
	 * summary - if the whole thing has to be read, it is a page.
	 *
	 * Raise it where the description IS the content rather than a preview of it,
	 * which in practice means marketing copy - a feature grid where each card is
	 * making its own argument and there is nothing to click through to. `"none"`
	 * only when every card in the row is the same length anyway; one long card
	 * among five short ones drags the whole row's height with it.
	 */
	descriptionLines?: 2 | 3 | 4 | "none";
	/** @default 3 */
	headingLevel?: CardHeadingLevel;
	icon?: LucideIcon;
	media?: CardMedia;
	/** Discrete facts, joined with dots - never one prose sentence. */
	meta?: CardMetaItem[];
	title: string;
	/** @default "subject" - see {@link CardTitleRole}. */
	titleRole?: CardTitleRole;
}

interface LinkedAppCardProps extends AppCardBaseProps {
	actions?: never;
	footerLink?: never;
	primaryAction?: never;
	secondaryAction?: never;
	/** Makes the WHOLE card the link. Mutually exclusive with the actions. */
	to: string;
}

interface ActionableAppCardProps extends AppCardBaseProps {
	/**
	 * The overflow menu in the card's top-right corner, in `AppDropdown`'s own
	 * section shape rather than a menu type invented here - which is what keeps
	 * destructive items hoisted to the end behind a separator, disabled ones in
	 * the menu with their reason, and the whole thing rendered as a bottom sheet
	 * on a touch device.
	 *
	 * On this branch only, for the same reason the buttons are: the moment a card
	 * holds a second interactive element it stops being a link. A `to` card's
	 * stretched `::after` would swallow the menu's clicks anyway.
	 */
	actions?: DropdownSection[];
	footerLink?: CardFooterLink;
	primaryAction?: CardAction;
	secondaryAction?: CardAction;
	to?: never;
}

export type AppCardProps = ActionableAppCardProps | LinkedAppCardProps;

/** Spelled out, never `line-clamp-${n}` - Tailwind only emits classes it can see. */
const DESCRIPTION_CLAMP: Record<2 | 3 | 4 | "none", string> = {
	2: "line-clamp-2",
	3: "line-clamp-3",
	4: "line-clamp-4",
	none: "",
};

/**
 * One subject, in one surface: icon, title, description, then optional media,
 * meta and actions, in that order down the card.
 *
 * **It carries its own padding.** `.card` is a flex column at 16px with a 16px
 * gap between its parts, and that is the whole point of reaching for this rather
 * than a div - a wrapper you have to hand a `p-*` to is one that will be handed
 * a different `p-*` on the next screen. Never pass padding through `className`;
 * if the number is wrong it is wrong everywhere, and the fix is here.
 *
 * The test for whether something belongs in a card is whether it could be a row
 * in a list. If the answer is no because it holds two unrelated things, it is a
 * section and it needs a heading, not a border. And never wrap something that
 * already owns a surface - AppTable, AppUserList, AppSectionPanel - in one of
 * these; that is two borders and two paddings around one object.
 *
 * `titleRole` decides which way the header is drawn, and it is the difference
 * between a content card and a dashboard tile. `subject` puts the tile above a
 * semibold heading; `label` puts a small tile beside a muted one and hands the
 * rank to whatever is in `children`. See {@link CardTitleRole}.
 *
 * `to` and the actions are mutually exclusive IN THE TYPE, which is the rule
 * "the moment a card holds a second interactive element, the card itself stops
 * being the target" made unbreakable. A whole-card link is an `<a>` on the title
 * with a stretched `::after`, so the click target is the card while the thing
 * the keyboard lands on and the screen reader announces is a real link with a
 * real name. A `<div onClick>` would have none of that: no keyboard, no
 * middle-click, no open-in-new-tab - and the first control dropped inside it
 * would be a button nested in a button.
 *
 * Loading is {@link AppCardSkeleton}, not a prop here: a card that is still
 * loading has no title to require, and the grid renders N of them.
 */
export function AppCard({
	actions,
	children,
	className,
	classNames,
	"data-cy": dataCy,
	description,
	descriptionLines = 2,
	footerLink,
	headingLevel = 3,
	icon,
	media,
	meta,
	primaryAction,
	secondaryAction,
	title,
	titleRole = "subject",
	to,
}: AppCardProps) {
	const slot = createSlots<AppCardSlot>(classNames, className);
	const titleId = useId();
	// `as ElementType` rather than a union of tags: the tag is a runtime string,
	// and typing it as one intrinsic element would reject the props of the next.
	const Heading = `h${headingLevel}` as ElementType;
	const isLabel = titleRole === "label";
	const hasButtons = Boolean(primaryAction || secondaryAction);
	const hasFooter = hasButtons || Boolean(footerLink);
	const menu = actions?.length ? (
		<AppDropdown
			className={slot("actions")}
			label={`Actions for ${title}`}
			sections={actions}
			/* Icon-only, and it names its card: nine "More" buttons on a dashboard
			   are nine controls with one name between them. */
			trigger={
				<AppButton
					aria-label={`More actions for ${title}`}
					icon={MoreHorizontal}
					isIconOnly
					size="sm"
					variant="ghost"
				/>
			}
		/>
	) : null;

	const header = (
		<Card.Header
			className={slot("header")}
			data-app-slot="header"
		>
			{/*
			 * `render` swaps the tag while keeping HeroUI's title slot - a document
			 * that skips heading levels is unnavigable by heading, and the level
			 * depends on where the card is placed, not on what it holds.
			 */}
			<Card.Title
				className={slot(
					"title",
					isLabel
						? // HeroUI's own card-title size, dropped to muted: a label has to
							// lose to the value under it. `truncate` because it is sharing a
							// row with a tile and a menu.
							"truncate text-muted"
						: "text-base leading-6 font-semibold",
				)}
				data-app-slot="title"
				id={titleId}
				render={(props) => <Heading {...props} />}
			>
				{to ? (
					/*
					 * The link is on the title and only the title; `::after` grows its
					 * hit area to the card. The focus ring is drawn on that same
					 * pseudo-element, so the keyboard sees the card it is about to
					 * open rather than three words of it.
					 */
					<Link
						className={cn(
							"outline-none after:absolute after:inset-0 after:rounded-3xl after:content-['']",
							"focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus",
						)}
						to={to}
					>
						{title}
						<ArrowRight
							aria-hidden="true"
							className="ml-1.5 inline size-4 align-[-2px] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-60"
						/>
					</Link>
				) : (
					title
				)}
			</Card.Title>

			{/*
			 * A fixed clamp, not a caller's choice. Ragged descriptions are what
			 * make a grid of cards look broken rather than varied.
			 */}
			{description ? (
				/* The clamp is appended AFTER the caller's classes rather than before,
				   which is the one place in this component the merge order is not the
				   standard one. `descriptionLines` is the prop for this decision and it
				   is a closed set; letting `classNames.description` carry a
				   `line-clamp-*` would be a second, unbounded way to answer the same
				   question, and tailwind-merge would hand it the win. */
				<Card.Description
					className={cn(slot("description", "mt-1"), DESCRIPTION_CLAMP[descriptionLines])}
					data-app-slot="description"
				>
					{description}
				</Card.Description>
			) : null}
		</Card.Header>
	);

	return (
		// `h-full` by default so a grid of these shares a height without every
		// caller remembering to ask. `.card` is already `relative`, which is what
		// the stretched `::after` below anchors to.
		<AppGlassCard
			aria-labelledby={titleId}
			className={slot("base", "group h-full gap-4 transition-transform", to && "motion-safe:hover:-translate-y-0.5")}
			data-cy={dataCy}
			data-app-slot="base"
			/* Which branch of the union this card took. The two are mutually
			   exclusive in the TYPE, and this is that fact at runtime. */
			data-target={to ? "link" : "actions"}
			role="article"
		>
			{isLabel ? (
				/*
				 * One row: tile, label, menu. The tile drops to `sm` and moves beside
				 * the words because in this role it is a marker on a line of text
				 * rather than the card's badge - at `md` on its own line it is the
				 * largest thing above a value that is supposed to be the largest
				 * thing in the card.
				 */
				<div className="flex items-center gap-3">
					{icon ? (
						<AppGradientIconTile
							className={slot("icon")}
							icon={icon}
							size="sm"
						/>
					) : null}
					<div className="min-w-0 flex-1">{header}</div>
					{menu}
				</div>
			) : (
				<>
					{/* `ms-auto` rather than `justify-between`, so the menu is right-aligned
					    whether or not there is a tile to be opposite. */}
					{icon || menu ? (
						<div className="flex items-start gap-3">
							{icon ? (
								<AppGradientIconTile
									className={slot("icon")}
									icon={icon}
								/>
							) : null}
							{menu ? <div className="ms-auto">{menu}</div> : null}
						</div>
					) : null}
					{header}
				</>
			)}

			{media ? (
				<CardMediaFrame
					className={slot("media")}
					fallbackIcon={icon}
					media={media}
				/>
			) : null}

			{meta && meta.length > 0 ? (
				<CardMetaRow
					className={slot("meta")}
					meta={meta}
				/>
			) : null}

			{/*
			 * `display: contents` when the slot is untouched, so a card that never
			 * asks for it lays out exactly as it did before this element existed -
			 * children go straight into the card's own flex column. Passing anything
			 * to `content` makes it a real box, which is the point: "give the chart
			 * its own padding" had no answer at all before.
			 *
			 * `cn` rather than the resolver, because the DEFAULT here has to be
			 * dropped when a caller overrides rather than merged with - `contents`
			 * and `flex` are both `display`, and tailwind-merge would keep only the
			 * caller's anyway. Written out so that is a decision rather than a
			 * coincidence of merge order.
			 */}
			{children ? (
				<div
					className={classNames?.content ?? "contents"}
					data-app-slot="content"
				>
					{children}
				</div>
			) : null}

			{hasFooter ? (
				// `mt-auto` is what aligns the footers of a row of cards whose
				// descriptions ran to different lengths.
				<Card.Footer
					className={slot("footer", "mt-auto flex-wrap gap-2 pt-1")}
					data-app-slot="footer"
				>
					{/* The three-step ladder, in order: solid, muted, text-only. Giving
					    all three the same weight in three colours is not hierarchy. */}
					{primaryAction ? (
						<AppButton
							onPress={primaryAction.onPress}
							size="sm"
						>
							{primaryAction.label}
						</AppButton>
					) : null}
					{secondaryAction ? (
						<AppButton
							onPress={secondaryAction.onPress}
							size="sm"
							variant="secondary"
						>
							{secondaryAction.label}
						</AppButton>
					) : null}
					{footerLink ? (
						<AppButton
							/*
							 * Pulled left by its own horizontal padding ONLY when it stands
							 * alone, so its label starts on the same edge as the title above
							 * it. Beside a solid button it lines up with that instead, and
							 * the negative margin would break the row.
							 */
							className={cn(!hasButtons && "-ms-3")}
							icon={ArrowRight}
							iconPosition="end"
							size="sm"
							to={footerLink.to}
							variant="ghost"
						>
							{footerLink.label}
						</AppButton>
					) : null}
				</Card.Footer>
			) : null}
		</AppGlassCard>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * The image sits ON the placeholder rather than replacing it, so a slow image
 * fades in over a box that was already the right size and a 404 leaves that box
 * exactly as it was. Nothing in the layout moves in either case.
 */
function CardMediaFrame({
	className,
	fallbackIcon,
	media,
}: {
	className?: string;
	fallbackIcon?: LucideIcon;
	media: CardMedia;
}) {
	const [hasFailed, setHasFailed] = useState(false);
	const Fallback = fallbackIcon ?? ImageOff;

	return (
		<div
			className={cn("relative overflow-hidden rounded-2xl bg-muted-surface", MEDIA_RATIO[media.ratio ?? "16/9"], className)}
			data-app-slot="media"
		>
			{/* Decoration: it stands in for an image, and an image that failed has
			    nothing to say to a screen reader. */}
			<span
				aria-hidden="true"
				className="absolute inset-0 grid place-items-center"
			>
				<Fallback className="size-8 text-muted opacity-40" />
			</span>
			{media.src && !hasFailed ? (
				<img
					alt={media.alt}
					className="absolute inset-0 size-full object-cover"
					loading="lazy"
					onError={() => setHasFailed(true)}
					src={media.src}
				/>
			) : null}
		</div>
	);
}

/**
 * Facts, dot-separated. The first one truncates and the short ones after it hold
 * their width - the short ones are the status-bearing half, so "Quezon City ·
 * 24/7" must never come out as "Quezon Cit…".
 */
function CardMetaRow({ className, meta }: { className?: string; meta: CardMetaItem[] }) {
	return (
		<p
			className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted", className)}
			data-app-slot="meta"
		>
			{meta.map((item, index) => (
				<Fragment key={item.label}>
					{index > 0 ? (
						<span
							aria-hidden="true"
							className="opacity-50"
						>
							•
						</span>
					) : null}
					<CardMetaFact item={item} />
				</Fragment>
			))}
		</p>
	);
}

function CardMetaFact({ item }: { item: CardMetaItem }) {
	const Icon = item.icon;

	return (
		<span className="flex min-w-0 items-center gap-1.5">
			{Icon ? (
				<Icon
					aria-hidden="true"
					className="size-3.5 shrink-0"
				/>
			) : null}
			<span className="truncate">{item.label}</span>
		</span>
	);
}

/* -------------------------------------------------------------------------- */

interface AppCardSkeletonProps {
	className?: string;
	hasActions?: boolean;
	hasIcon?: boolean;
	hasMeta?: boolean;
	/** Given one, the media frame is drawn at the ratio the real card will use. */
	mediaRatio?: CardMediaRatio;
}

/**
 * The card's own layout at the card's real height - never a spinner in an empty
 * box, which makes the whole grid jump when the data lands.
 *
 * It is `aria-hidden`: a grid of nine of these would otherwise be nine
 * announcements of the same fact. Put `aria-busy="true"` on the grid instead.
 */
export function AppCardSkeleton({
	className,
	hasActions = false,
	hasIcon = false,
	hasMeta = false,
	mediaRatio,
}: AppCardSkeletonProps) {
	return (
		<AppGlassCard
			aria-hidden="true"
			className={cn("h-full gap-4", className)}
		>
			{hasIcon ? <Skeleton className="size-11 shrink-0 rounded-2xl" /> : null}

			<div className="space-y-2">
				<Skeleton className="h-5 w-40 max-w-full rounded-md" />
				<Skeleton className="h-4 w-full rounded-md" />
				<Skeleton className="h-4 w-3/5 rounded-md" />
			</div>

			{mediaRatio ? <Skeleton className={cn("w-full rounded-2xl", MEDIA_RATIO[mediaRatio])} /> : null}

			{hasMeta ? <Skeleton className="h-4 w-48 max-w-full rounded-md" /> : null}

			{hasActions ? (
				<div className="mt-auto flex gap-2 pt-1">
					<Skeleton className="h-8 w-24 rounded-full" />
					<Skeleton className="h-8 w-20 rounded-full" />
				</div>
			) : null}
		</AppGlassCard>
	);
}
