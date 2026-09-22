import { Label, ProgressBar } from "@heroui/react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

type ProgressBarColor = ComponentProps<typeof ProgressBar>["color"];
type ProgressBarSize = ComponentProps<typeof ProgressBar>["size"];

interface AppProgressBarProps {
	className?: string;
	color?: ProgressBarColor;
	/** Test hook on the progressbar. */
	"data-cy"?: string;
	isIndeterminate?: boolean;
	/**
	 * What is progressing - "Uploading contract.pdf", "Importing rows". Required:
	 * an unlabelled progressbar is announced as a bare percentage with nothing
	 * saying what it measures, and "67%" of an unnamed thing is not information.
	 *
	 * Use `isLabelHidden` where the surrounding copy already names it - the name
	 * still reaches a screen reader, it just is not drawn twice.
	 */
	label: string;
	/** Hides the label visually. It remains the accessible name. */
	isLabelHidden?: boolean;
	showValueLabel?: boolean;
	size?: ProgressBarSize;
	value?: number;
}

/**
 * Determinate progress along a line: an upload, an import, a quota.
 *
 * `label` is required rather than defaulted. It used to fall back to the string
 * "Progress", which is not a name - it is the word for the category of thing
 * being unnamed, and a screen reader reading "Progress, 67%" has told the user
 * nothing they could act on.
 *
 * `isIndeterminate` drops `value` entirely instead of passing 0 - a bar sitting
 * at 0% claims it knows the work has not started, which is the opposite of what
 * indeterminate means. If the number is unknown, say so; if the wait is short
 * and has no measurable steps, `AppSpinner` is the smaller promise.
 */
export function AppProgressBar({
	className,
	color,
	"data-cy": dataCy,
	isIndeterminate = false,
	isLabelHidden = false,
	label,
	showValueLabel = false,
	size,
	value = 0,
}: AppProgressBarProps) {
	/*
	 * HeroUI lays the component out as a grid - "label output" over "track" -
	 * with a gap between the two rows. A hidden label is `sr-only`, so it is out
	 * of flow and its row collapses to nothing; with no value label either, that
	 * gap is 4px of dead space above the track and every caller that draws its
	 * own caption ends up nudging the bar back up with a negative margin. The
	 * gap only exists when there is something in the row above.
	 */
	const hasHeaderRow = !isLabelHidden || (showValueLabel && !isIndeterminate);

	/*
	 * The size and the colour, restated as attributes React rewrites on every
	 * render - `styles.css` draws the height and the gradient off these, not off
	 * HeroUI's own `progress-bar--sm` / `progress-bar--accent`.
	 *
	 * That indirection is a workaround for a real bug, not a preference. HeroUI
	 * memoises its slot classes on [color, size], and tailwind-variants 3.3.0
	 * resolves a memoised slot function against the props of the last call
	 * anywhere on the page. A bar therefore renders correctly once and then,
	 * on its next re-render, wears the size and colour of whichever bar rendered
	 * last - which is how a 4px bar in an upload queue turned 12px the moment
	 * its percentage moved. The full note is on the `.progress-bar` block in
	 * styles.css. Drop both attributes when the upstream fix lands.
	 */
	return (
		<ProgressBar
			aria-label={label}
			className={cn(!hasHeaderRow && "gap-0", className)}
			color={color}
			data-color={color ?? "accent"}
			data-cy={dataCy}
			data-size={size ?? "md"}
			isIndeterminate={isIndeterminate}
			size={size}
			value={isIndeterminate ? undefined : value}
		>
			<Label className={cn(isLabelHidden && "sr-only")}>{label}</Label>
			{showValueLabel && !isIndeterminate && <ProgressBar.Output />}
			<ProgressBar.Track>
				<ProgressBar.Fill />
			</ProgressBar.Track>
		</ProgressBar>
	);
}
