import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface StepperStep {
	/** One short line under the label on wide screens. Optional. */
	description?: string;
	/**
	 * Replaces the step number in the circle. Give every step one or none - a
	 * row that is half glyphs and half digits reads as two different steppers.
	 */
	icon?: LucideIcon;
	key: string;
	label: string;
}

interface AppStepperProps {
	className?: string;
	/**
	 * Test hook on the root, which holds BOTH renderings - the bar and the
	 * circles - so a spec can follow one stepper across the breakpoint.
	 */
	"data-cy"?: string;
	/** Zero-based index of the step being worked on. */
	currentStep: number;
	/**
	 * Called when a *completed* step is clicked. Omit and the stepper is a
	 * read-only indicator - which is the right default, because a step the user
	 * has not reached has not been validated yet.
	 */
	onStepChange?: (index: number) => void;
	steps: StepperStep[];
}

/**
 * Progress through a multi-step form.
 *
 * Two renderings of the same state, chosen by width AND by length - length
 * first. A run of five or more does not survive a phone: the columns fall under
 * 70px and every label becomes a stump, so below `sm` it collapses to a bar
 * with "Step 5 of 7" and the current step's name, which is the part people
 * actually read at that width. Four or fewer keeps its circles the whole way
 * down - the columns are still wide enough to read there, and swapping them for
 * a bar would trade the entire map away for a count the row already shows. Such
 * a stepper has no bar in the tree at all. See `COMPACT_MAX_STEPS`.
 *
 * Only one rendering is ever in the DOM's accessibility tree - `hidden` is
 * `display: none` - so a screen reader never hears the position twice.
 *
 * Backwards navigation is opt-in via `onStepChange`, and only ever to a step
 * already completed. Jumping forward would skip that step's validation, so
 * upcoming circles are never interactive.
 *
 * Every state change is animated rather than swapped: the rail wipes from the
 * step you left towards the one you moved to, the circle floods with the
 * gradient, and the digit cross-fades into the tick. That motion is the only
 * thing that tells the eye *which way* it moved - a stepper that repaints
 * instantly leaves the user to diff two static rows. 300ms, the entrance band,
 * because it is a forward step rather than a hover; the global
 * prefers-reduced-motion rule in styles.css flattens all of it to the end state.
 */
/**
 * At or below this many steps the circles keep their place on a phone. Four
 * 32px markers and four short labels clear a 360px viewport, so collapsing to
 * the bar there would trade the whole map away for a count the row already
 * shows. Past four they genuinely do not fit, and the count is the part people
 * read anyway - which is the bar's argument.
 */
const COMPACT_MAX_STEPS = 4;

export function AppStepper({ className, "data-cy": dataCy, currentStep, onStepChange, steps }: AppStepperProps) {
	const total = steps.length;
	const safeIndex = Math.min(Math.max(currentStep, 0), total - 1);
	const active = steps[safeIndex];
	/** Short enough that the circles survive a phone - see COMPACT_MAX_STEPS. */
	const isCompact = total <= COMPACT_MAX_STEPS;

	return (
		<div
			className={className}
			data-compact={isCompact}
			data-current={safeIndex}
			/* The clamped index, not the one that was asked for: a caller that
			   passes 9 for a four-step flow gets step 4, and a spec can see that
			   it did rather than having to infer it from which circle is lit. */
			data-cy={dataCy}
			data-total={total}
		>
			{/* Mobile: a bar plus the words - but only for a run too long to fit as
			    circles. A compact stepper has no bar at all, so `data-rendering`
			    tells a spec which renderings exist as well as which one is showing:
			    both present means the row collapses at `sm`, circles alone means it
			    never does. `hidden` is `display: none`, so at most one of the two is
			    ever in the accessibility tree. */}
			{!isCompact && (
				<div
					className="sm:hidden"
					data-rendering="bar"
				>
					<div className="flex items-baseline justify-between gap-3">
						<p className="text-sm font-medium">{active?.label}</p>
						<p className="shrink-0 text-xs text-muted">
							Step {safeIndex + 1} of {total}
						</p>
					</div>
					{/*
					 * A native progress element rather than HeroUI's ProgressBar: this
					 * one needs its label to be the visible text above rather than a
					 * second copy of it, and the value is a step count, not a percent
					 * anyone should read off the bar.
					 */}
					<progress
						aria-label={`Step ${safeIndex + 1} of ${total}: ${active?.label ?? ""}`}
						className="mt-2 h-1.5 w-full appearance-none overflow-hidden rounded-full bg-border [&::-moz-progress-bar]:[background-image:var(--gradient-brand)] [&::-moz-progress-bar]:transition-[width] [&::-moz-progress-bar]:duration-300 [&::-moz-progress-bar]:ease-out [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-border [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:[background-image:var(--gradient-brand)] [&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-300 [&::-webkit-progress-value]:ease-out"
						max={total}
						value={safeIndex + 1}
					/>
					{active?.description ? <p className="mt-2 text-xs text-muted">{active.description}</p> : null}
				</div>
			)}

			{/* The circles. From `sm` up normally; at every width when compact. */}
			<nav
				aria-label="Progress"
				className={isCompact ? "block" : "hidden sm:block"}
				data-rendering="circles"
			>
				<ol className="flex items-start">
					{steps.map((step, index) => {
						const isDone = index < safeIndex;
						const isActive = index === safeIndex;
						const canGoBack = isDone && Boolean(onStepChange);

						return (
							<li
								aria-current={isActive ? "step" : undefined}
								className="relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
								data-state={isDone ? "done" : isActive ? "current" : "upcoming"}
								data-step-key={step.key}
								key={step.key}
							>
								{/*
								 * The rail into this circle from the one before it. Every
								 * item is `flex-1` so they are equal width, which is what
								 * lets the offsets be written against 50% of one item.
								 * 1.25rem is half the circle plus the gap, so the line
								 * stops short of both glyphs instead of running under them.
								 */}
								{index > 0 && (
									<span
										aria-hidden="true"
										className="absolute top-4 right-[calc(50%+1.25rem)] left-[calc(-50%+1.25rem)] h-0.5 overflow-hidden rounded-full bg-border"
									>
										{/*
										 * The fill is a child scaled along x rather than the track
										 * recolouring, so the segment wipes towards the step you
										 * moved to - and unwipes back the other way - instead of
										 * flicking on whole. Transform, not width: it stays on the
										 * compositor and cannot reflow the row.
										 */}
										<span
											className={cn(
												"block h-full w-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out motion-reduce:transition-none",
												isDone || isActive ? "scale-x-100" : "scale-x-0",
											)}
										/>
									</span>
								)}
								<StepMarker
									icon={step.icon}
									index={index}
									isActive={isActive}
									isDone={isDone}
									label={step.label}
									onPress={canGoBack ? () => onStepChange?.(index) : undefined}
								/>
								{/*
								 * w-full, not just min-w-0: the column is `items-center`, so this
								 * div is NOT stretched to the item and would otherwise size to the
								 * label's max-content width. min-w-0 has nothing to bite on at that
								 * point and `truncate` never fires - the label just spills over its
								 * neighbours, which at seven steps is two names printed on top of
								 * each other rather than one ellipsis.
								 */}
								<div className="w-full min-w-0 px-1">
									<p
										className={cn(
											"truncate text-sm transition-colors duration-300 ease-out motion-reduce:transition-none",
											isActive ? "font-semibold text-foreground" : "font-medium",
											isDone && "text-foreground",
											!(isActive || isDone) && "text-muted",
										)}
									>
										{step.label}
									</p>
									{/*
									 * `hidden sm:block` rather than always-on: a compact row keeps
									 * its circles on a phone, and four descriptions in four 80px
									 * columns is four stacks of one word each. The label survives
									 * down there; the supporting line does not, and there is no bar
									 * underneath to carry it instead.
									 */}
									{step.description ? (
										<p className="mt-0.5 hidden text-xs text-muted sm:block">{step.description}</p>
									) : null}
								</div>
							</li>
						);
					})}
				</ol>
			</nav>
		</div>
	);
}

interface StepMarkerProps {
	/** When set, the circle carries this instead of the step number. */
	icon?: LucideIcon;
	index: number;
	isActive: boolean;
	isDone: boolean;
	label: string;
	/** Present only for a completed step in an interactive stepper. */
	onPress?: () => void;
}

/**
 * The circle, in whichever of the two modes the step asked for: a number, which
 * becomes a tick once the step is done, or a glyph, which keeps its shape and
 * just changes colour.
 *
 * Done fills with the brand gradient and turns white - the same treatment as
 * AppGradientIconTile and the active nav pill, so "finished" looks like the rest
 * of the app rather than like a flat swatch. The shape changes with it: the
 * palette is a single red hue, so filled-vs-outlined is too fine a distinction
 * to be the only signal, and it is no signal at all to a colour-blind reader.
 */
function StepMarker({ icon: Icon, index, isActive, isDone, label, onPress }: StepMarkerProps) {
	/** Both glyphs stay mounted and cross-fade; a swap would be the one instant edge left. */
	const swap =
		"col-start-1 row-start-1 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none";
	let content: ReactNode = (
		<span className="grid place-items-center">
			<span className={cn(swap, isDone ? "scale-50 opacity-0" : "scale-100 opacity-100")}>{index + 1}</span>
			<Check
				aria-hidden="true"
				className={cn(swap, "size-4", isDone ? "scale-100 opacity-100" : "scale-50 opacity-0")}
			/>
		</span>
	);
	if (Icon) {
		content = (
			<Icon
				aria-hidden="true"
				className="size-4"
			/>
		);
	}

	const shape = cn(
		"relative z-10 grid size-8 place-items-center rounded-full border-2 bg-background text-sm font-semibold",
		"transition-[border-color,color,box-shadow,transform,opacity] duration-300 ease-out motion-reduce:transition-none",
		// Not shadow-glow: that is tuned for a 40-48px tile, and its 20px drop
		// under a 32px circle reads as a smudge rather than a glow.
		// The paired foreground, not white - see AppTracking's marker for the
		// measurement. The gradient is a sibling layer here too, so the colour has
		// to be stated rather than inherited.
		isDone &&
			"border-transparent shadow-[0_6px_14px_-8px_var(--brand-primary)] text-[color:var(--gradient-brand-foreground)]",
		// The current circle sits slightly proud of the row, so the eye is pulled
		// to it as it grows rather than having to find the one colour that moved.
		isActive && "border-accent text-accent motion-safe:scale-110",
		!(isDone || isActive) && "border-border text-muted",
	);

	const state = isDone ? "completed" : isActive ? "current step" : "not started";
	/*
	 * A background-image cannot be transitioned, so the gradient is a layer that
	 * fades in over the circle instead of a class that toggles on it. -inset-0.5
	 * covers the 2px border, which the fill has to swallow the way `border-box`
	 * did. It precedes the content and the content is positioned, so paint order
	 * keeps the digit on top without another z-index.
	 */
	const fill = (
		<span
			aria-hidden="true"
			className={cn(
				"absolute -inset-0.5 rounded-full gradient-brand transition-opacity duration-300 ease-out motion-reduce:transition-none",
				isDone ? "opacity-100" : "opacity-0",
			)}
		/>
	);

	if (!onPress) {
		return (
			<span className={shape}>
				{fill}
				<span className="relative col-start-1 row-start-1">{content}</span>
				<span className="sr-only">{`${label}, ${state}`}</span>
			</span>
		);
	}

	return (
		<button
			className={cn(
				shape,
				"cursor-pointer hover:opacity-80 focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:outline-none",
			)}
			onClick={onPress}
			type="button"
		>
			{fill}
			<span className="relative col-start-1 row-start-1">{content}</span>
			<span className="sr-only">{`Go back to ${label}, ${state}`}</span>
		</button>
	);
}
