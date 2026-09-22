import type { LucideIcon } from "lucide-react";
import { Check, CircleDot, Clock } from "lucide-react";
import type { ReactNode } from "react";
import { AppButton } from "../AppButton";
import { AppChip } from "../AppChip";
import { AppGradientIconTile } from "../AppGradientIconTile";
import { cn } from "../../lib/cn";

export type TrackingStatus = "done" | "live" | "pending";

/**
 * Which way the run of steps reads. This is a fact about the *container*, not
 * about the device - see the note on `AppTracking`.
 */
export type TrackingOrientation = "horizontal" | "vertical";

export interface TrackingItem {
	key: string;
	/** The step name. "Packed", "Shipped". */
	label: string;
	/** When it happened, or what is happening. Required - see the note below. */
	sublabel: string;
	status: TrackingStatus;
}

interface TrackingAction {
	label: string;
	onPress: () => void;
}

interface TrackingFooter {
	/** The one thing to do about this. Rendered full-width. */
	action?: TrackingAction;
	/** Right-aligned detail, e.g. a time. */
	detail?: string;
	/** e.g. "Expected delivery". */
	label: string;
	/** A way out, under the primary. Never a second primary. */
	secondaryAction?: TrackingAction;
	/** e.g. "Tomorrow". */
	value: string;
}

interface AppTrackingProps {
	className?: string;
	/**
	 * Test hook on the card. It carries `data-orientation` too - which run was
	 * ASKED for, not which one is showing, since that is the container's answer
	 * and each `<ol>` reports its own.
	 */
	"data-cy"?: string;
	description: string;
	footer?: TrackingFooter;
	/** Right of the header - an ETA chip, usually. */
	headerAction?: ReactNode;
	icon: LucideIcon;
	items: TrackingItem[];
	/**
	 * `horizontal` is a *request*, not a promise: the run only lies down once the
	 * card itself is at least 42rem wide, and drops back to the vertical run
	 * below that. Default `vertical`, which is right everywhere the card is a
	 * card. See the note on `AppTracking`.
	 */
	orientation?: TrackingOrientation;
	title: string;
}

/**
 * The tracking card: a header, a run of steps, and an optional footer
 * summarising where things stand.
 *
 * Unlike AppStepper, this is not a form. A stepper is a control - the user is
 * moving through it and can go back. This is a *report* on something happening
 * elsewhere, which is why the steps are not interactive and why each step
 * carries a timestamp rather than a description of what to do.
 *
 * ## Which way it runs
 *
 * Not "horizontal on web, vertical on mobile" - the deciding fact is how wide
 * the card is and what job it is doing on the page, and desktop has both:
 *
 * - **Vertical** (the default) for a card in a column - a dashboard tile, a
 *   sidebar, a modal, a row expanded out of a table, and every phone. One step
 *   per row means the label, the timestamp and the status chip all fit on the
 *   line, and it takes any number of steps.
 * - **Horizontal** for the status band across the top of a detail page, where
 *   the card has the full content width and the real content is underneath it.
 *   Standing the timeline up there would spend 300px of height on a column that
 *   is 80% empty, and push the thing the page is actually about below the fold.
 *
 * So the orientation is a property of the slot, and the call site owns it. It is
 * also only ever honoured when there is room: `orientation="horizontal"` renders
 * the vertical run until the card's own container passes 42rem, which is a
 * container query rather than a viewport one - a two-up grid of tracking cards
 * on a 1440px desktop is a narrow container, and the viewport cannot tell you
 * that. The two renderings are never both in the accessibility tree, since
 * `hidden` is `display: none`.
 *
 * Horizontal costs something, which is why it is not the default: it takes about
 * five steps before the columns are too narrow to read, and each column's
 * sublabel wants to be a timestamp rather than a sentence. If either is untrue
 * of your data, stay vertical - it has no such ceiling.
 *
 * `sublabel` is required on every item for the same reason the banner requires
 * a description: a tracking step with no time or detail is just a word the user
 * cannot act on. If nothing has happened yet, say so - "Expected tomorrow" is a
 * sublabel; blank is not.
 *
 * Status is carried three ways on purpose - the marker's shape, the connector
 * colour, and the chip's words - because this card is most often read at a
 * glance on a phone, and colour alone says nothing to a colour-blind reader.
 */
export function AppTracking({
	className,
	"data-cy": dataCy,
	description,
	footer,
	headerAction,
	icon,
	items,
	orientation = "vertical",
	title,
}: AppTrackingProps) {
	const liveItem = items.find((item) => item.status === "live");
	const isWide = orientation === "horizontal";

	return (
		// The card is its own container, so every `@2xl:` below asks about the
		// space this card was given rather than the size of the window.
		<div
			className={cn("@container space-y-5", className)}
			data-cy={dataCy}
			data-orientation={orientation}
		>
			<header className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-start gap-3">
					<AppGradientIconTile
						icon={icon}
						size="md"
					/>
					<div className="min-w-0">
						<p className="font-semibold">{title}</p>
						<p className="truncate text-sm text-muted">{description}</p>
					</div>
				</div>
				{headerAction ? <div className="shrink-0">{headerAction}</div> : null}
			</header>

			{/* Both runs can be in the DOM at once - `hidden` is `display: none` -
			    so each says which it is rather than leaving a spec to guess. */}
			<ol
				className={cn("relative", isWide && "@2xl:hidden")}
				data-rendering="rows"
			>
				{items.map((item, index) => (
					<TrackingRow
						isLast={index === items.length - 1}
						item={item}
						key={item.key}
					/>
				))}
			</ol>

			{isWide ? (
				<ol
					className="hidden @2xl:flex @2xl:items-start"
					data-rendering="columns"
				>
					{items.map((item, index) => (
						<TrackingColumn
							isLast={index === items.length - 1}
							item={item}
							key={item.key}
						/>
					))}
				</ol>
			) : null}

			{footer ? (
				<TrackingFooterRow
					data-cy={dataCy ? `${dataCy}-footer` : undefined}
					footer={footer}
					icon={icon}
					isWide={isWide}
					liveLabel={liveItem?.label}
				/>
			) : null}
		</div>
	);
}

/* -------------------------------------------------------------------------- */

const CHIP = {
	done: { icon: Check, label: "Done", tone: "success" },
	live: { icon: CircleDot, label: "Live", tone: "accent" },
	pending: { icon: Clock, label: "Pending", tone: "default" },
} as const;

function TrackingRow({ isLast, item }: { isLast: boolean; item: TrackingItem }) {
	const isDone = item.status === "done";
	const isLive = item.status === "live";
	const chip = CHIP[item.status];

	return (
		<li
			aria-current={isLive ? "step" : undefined}
			className={cn("relative flex gap-3", isLast ? "pb-0" : "pb-6")}
			data-item-key={item.key}
			data-status={item.status}
		>
			{/*
			 * The rail down to the next marker. 13px is half the 28px marker minus
			 * half the 2px line, so it runs through the marker's centre; it starts
			 * below the marker rather than behind it so a translucent surface does
			 * not show the line crossing the glyph.
			 */}
			{!isLast && (
				<span
					aria-hidden="true"
					className="absolute top-8 bottom-0 left-3.25 w-0.5 overflow-hidden rounded-full bg-border"
				>
					{/*
					 * The fill is a child scaled along y from the top rather than the
					 * track recolouring, so progress runs *down* the timeline the way
					 * the events did. Transform, not height: it stays on the compositor
					 * and cannot push the row below it.
					 */}
					<span
						className={cn(
							"block h-full w-full origin-top rounded-full bg-accent transition-transform duration-300 ease-out motion-reduce:transition-none",
							isDone ? "scale-y-100" : "scale-y-0",
						)}
					/>
				</span>
			)}

			<TrackingMarker
				isDone={isDone}
				isLive={isLive}
			/>

			<div className="flex min-w-0 flex-1 items-start justify-between gap-3">
				<div className="min-w-0">
					<p
						className={cn(
							"text-sm font-semibold transition-colors duration-300 ease-out motion-reduce:transition-none",
							isDone || isLive ? "text-foreground" : "text-muted",
						)}
					>
						{item.label}
					</p>
					<p className="text-xs text-muted">{item.sublabel}</p>
				</div>
				<AppChip
					emphasis="soft"
					icon={chip.icon}
					label={chip.label}
					size="sm"
					tone={chip.tone}
				/>
			</div>
		</li>
	);
}

/**
 * The same step, laid on its side: marker on a rail, words underneath, columns
 * of equal width so the rail segments are equal too.
 *
 * Two things change with the axis, and both are forced by it. The rail now runs
 * *between* two markers rather than under one, so it is pinned off both edges of
 * an item that is exactly one column wide - `flex-1` on every item is what makes
 * `50%` mean "half a column" - and it wipes left-to-right, which is again the
 * direction the events happened in.
 *
 * The status chip drops to the live step alone. Vertically it sits in the row's
 * spare width and costs nothing; here it would be a fourth line under every
 * column, four pills repeating what four markers already show, and the one that
 * matters - the step actually running - would stop standing out. The words are
 * still there for a screen reader, so the three-way redundancy holds: shape,
 * colour, words.
 */
function TrackingColumn({ isLast, item }: { isLast: boolean; item: TrackingItem }) {
	const isDone = item.status === "done";
	const isLive = item.status === "live";
	const chip = CHIP[item.status];

	return (
		<li
			aria-current={isLive ? "step" : undefined}
			className="relative flex min-w-0 flex-1 flex-col items-center gap-2 px-2 text-center"
			data-item-key={item.key}
			data-status={item.status}
		>
			{/*
			 * 13px is the marker's vertical centre (half of 28) minus half the 2px
			 * line; 1.25rem is half the marker plus a gap, so the segment stops short
			 * of both glyphs instead of running under them.
			 */}
			{!isLast && (
				<span
					aria-hidden="true"
					className="absolute top-3.25 right-[calc(-50%+1.25rem)] left-[calc(50%+1.25rem)] h-0.5 overflow-hidden rounded-full bg-border"
				>
					<span
						className={cn(
							"block h-full w-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out motion-reduce:transition-none",
							isDone ? "scale-x-100" : "scale-x-0",
						)}
					/>
				</span>
			)}

			<TrackingMarker
				isDone={isDone}
				isLive={isLive}
			/>

			<div className="min-w-0">
				<p
					className={cn(
						"text-sm font-semibold text-balance transition-colors duration-300 ease-out motion-reduce:transition-none",
						isDone || isLive ? "text-foreground" : "text-muted",
					)}
				>
					{item.label}
				</p>
				{/* Read out where the visible chip would have been, in step order. */}
				{isLive ? null : <span className="sr-only">{chip.label}</span>}
				<p className="text-xs text-balance text-muted">{item.sublabel}</p>
			</div>

			{isLive ? (
				<AppChip
					emphasis="soft"
					icon={chip.icon}
					label={chip.label}
					size="sm"
					tone={chip.tone}
				/>
			) : null}
		</li>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * Done fills with the brand gradient and takes a tick; live is an open ring with
 * a pulsing core; pending is an empty outline. Three shapes, not three shades.
 *
 * One element carrying all three rather than three returns: a branch would
 * unmount the marker on every change, and an unmounted node cannot transition -
 * the card would repaint between states instead of moving between them. So the
 * ring stays put and recolours, the core scales in and out, and the gradient is
 * a layer that fades (a background-image cannot be transitioned at all).
 */
function TrackingMarker({ isDone, isLive }: { isDone: boolean; isLive: boolean }) {
	const swap = "col-start-1 row-start-1 duration-300 ease-out motion-reduce:transition-none";

	return (
		<span
			className={cn(
				"relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 bg-background",
				"transition-[border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none",
				// The tick takes the fill's PAIRED foreground, not white. The fill is
				// the brand gradient, which is light in both themes now, so a white
				// tick on it measures about 2.4:1 - under the 3:1 that SC 1.4.11 asks
				// of a glyph. The paired ink is 8.4:1 and matches every other glyph on
				// a brand surface, which is the consistency this was missing.
				//
				// It is set here rather than inherited because the gradient is an
				// absolutely-positioned SIBLING layer, not this element's background -
				// so "gradient-brand"'s own "color" never reaches the tick.
				isDone &&
					"border-transparent shadow-[0_6px_14px_-8px_var(--brand-primary)] text-[color:var(--gradient-brand-foreground)]",
				isLive && "border-accent",
				!(isDone || isLive) && "border-border",
			)}
		>
			{/* -inset-0.5 so the fill swallows the 2px ring, which `border-box` did. */}
			<span
				aria-hidden="true"
				className={cn(
					"absolute -inset-0.5 rounded-full gradient-brand transition-opacity duration-300 ease-out motion-reduce:transition-none",
					isDone ? "opacity-100" : "opacity-0",
				)}
			/>
			{/*
			 * The pulse and the scale live on separate elements on purpose: an
			 * animation beats a transition on the same property, so pulsing the
			 * opacity here would eat the fade and the core would pop in.
			 *
			 * motion-safe: a pulse is the one thing on this card that moves by
			 * itself, and it is decorative - the chip already says "Live".
			 */}
			<span className={cn(swap, "transition-transform", isLive ? "scale-100" : "scale-0")}>
				<span className="block size-2.5 rounded-full bg-accent motion-safe:animate-pulse" />
			</span>
			<Check
				aria-hidden="true"
				className={cn(
					swap,
					// Positioned, so it paints over the gradient layer above it.
					"relative size-3.5 transition-[opacity,transform]",
					isDone ? "scale-100 opacity-100" : "scale-50 opacity-0",
				)}
			/>
		</span>
	);
}

/* -------------------------------------------------------------------------- */

interface TrackingFooterRowProps {
	"data-cy"?: string;
	footer: TrackingFooter;
	icon: LucideIcon;
	isWide: boolean;
	liveLabel?: string;
}

/**
 * The footer restates where things stand, because the timeline above it can be
 * long enough to scroll past on a phone.
 *
 * In words, not a bar. A percentage here would be the timeline again with the
 * step names stripped off, and it could only be invented - "a live step counts
 * as half" is a fiction that renders as a precise-looking number, and on a
 * four-item list it can only ever say 13, 38, 63 or 88. Two renderings of one
 * state also have to be kept in agreement forever. The line below names the
 * step that is actually running, which is the thing the bar was standing in for.
 *
 * One tree that reflows, not two that are hidden past each other: these are the
 * card's only real controls, and a second copy of "Cancel request" sitting in
 * the DOM under `display: none` is a second thing for a test - or anything
 * walking the page - to find and press.
 */
function TrackingFooterRow({ "data-cy": dataCy, footer, icon: Icon, isWide, liveLabel }: TrackingFooterRowProps) {
	return (
		<div
			className={cn(
				"space-y-3 rounded-2xl border border-border bg-muted-surface/60 p-4",
				isWide && "@2xl:flex @2xl:flex-wrap @2xl:items-center @2xl:gap-x-6 @2xl:gap-y-3 @2xl:space-y-0",
			)}
			data-cy={dataCy}
			data-running={Boolean(liveLabel)}
		>
			<div className="flex min-w-0 items-center gap-2">
				<Icon
					aria-hidden="true"
					className="size-4 shrink-0 text-accent"
				/>
				<p className="min-w-0 flex-1 truncate text-sm font-semibold">{liveLabel ?? footer.value}</p>
				{/*
				 * Only when something is actually live. Once every step is done there
				 * is nothing in progress for it to report, and a dot that pulses on a
				 * finished card is the card claiming work that has stopped.
				 */}
				{liveLabel ? (
					<span
						aria-hidden="true"
						className="size-2 shrink-0 rounded-full bg-accent motion-safe:animate-pulse"
						data-live-dot=""
					/>
				) : null}
			</div>

			<div className={cn("flex min-w-0 items-end justify-between gap-3", isWide && "@2xl:justify-start @2xl:gap-4")}>
				<div className="min-w-0">
					<p className="text-xs text-muted">{footer.label}</p>
					<p className="truncate text-sm font-semibold">{footer.value}</p>
				</div>
				{footer.detail ? <p className="shrink-0 text-sm font-semibold text-accent">{footer.detail}</p> : null}
			</div>

			{/*
			 * Full-width, and below a rule. A small pill floating at the bottom-left
			 * of a tinted panel reads as something left over rather than the thing
			 * to do; at a card's width there is no second column for it to sit
			 * beside, so the button may as well be the width of the panel.
			 *
			 * The wide footer *is* that second column, so the reasoning inverts: the
			 * pair shrinks to its labels and moves to the end of the row, where a
			 * 900px-wide primary button would have read as a banner rather than a
			 * button. Primary first in both axes, so the visual order and the tab
			 * order never disagree.
			 */}
			{(footer.action || footer.secondaryAction) && (
				<div
					className={cn(
						"space-y-2 border-t border-border/70 pt-3",
						isWide && "@2xl:ms-auto @2xl:flex @2xl:items-center @2xl:gap-2 @2xl:space-y-0 @2xl:border-t-0 @2xl:pt-0",
					)}
				>
					{footer.action && (
						<AppButton
							className={cn(isWide && "@2xl:w-auto")}
							fullWidth
							onPress={footer.action.onPress}
							size="sm"
							variant="primary"
						>
							{footer.action.label}
						</AppButton>
					)}
					{footer.secondaryAction && (
						<AppButton
							className={cn(isWide && "@2xl:w-auto")}
							fullWidth
							onPress={footer.secondaryAction.onPress}
							size="sm"
							variant="ghost"
						>
							{footer.secondaryAction.label}
						</AppButton>
					)}
				</div>
			)}
		</div>
	);
}
