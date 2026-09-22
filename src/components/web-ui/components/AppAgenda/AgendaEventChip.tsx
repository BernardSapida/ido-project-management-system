import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";
import type { AgendaOccurrence } from "./agenda.types";

interface AgendaEventChipProps {
	occurrence: AgendaOccurrence;
	/** `month` is a one-line label in a grid cell; `time` fills a positioned block. */
	variant: "month" | "time";
	isSelected: boolean;
	onPress: () => void;
	className?: string;
	style?: CSSProperties;
	"data-cy"?: string;
}

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
	hour: "numeric",
	minute: "2-digit",
});

/** Used when an occurrence carries no colour of its own. */
const FALLBACK_COLOR = "#6366f1";

/**
 * One occurrence as a chip, in every view - month cell, and the positioned
 * block in Day and Week. The chip is washed in the event's own colour with the
 * title in that colour, rather than a neutral surface with a coloured edge. A
 * `source: "system"` occurrence keeps a dashed border so a programmatic hold
 * still reads as different from a personal event without a second component. The
 * title is always present - nothing here is icon-only, so a plain button with a
 * real label is the accessible name.
 */
export function AgendaEventChip({
	occurrence,
	variant,
	isSelected,
	onPress,
	className,
	style,
	"data-cy": dataCy,
}: AgendaEventChipProps) {
	const color = occurrence.color ?? FALLBACK_COLOR;
	// Month cells are one narrow column - a start time is all that fits beside the
	// title. The positioned Day/Week block has the width for the full range.
	const time = occurrence.isAllDay
		? "All day"
		: variant === "time"
			? `${TIME_FORMAT.format(occurrence.startsAt)} – ${TIME_FORMAT.format(occurrence.endsAt)}`
			: TIME_FORMAT.format(occurrence.startsAt);

	return (
		<button
			className={cn(
				"flex w-full min-w-0 cursor-pointer overflow-hidden rounded-md px-1.5 text-left text-xs leading-tight",
				"transition-[filter] hover:brightness-95 dark:hover:brightness-125",
				// Ring and outline are BOTH inset - a chip sits inside an
				// `overflow-hidden` cell, so an outward ring/offset gets clipped on
				// the side that meets the cell edge.
				"focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
				// Month: one narrow line, title then start time. Time block: title
				// on top, time under it. The title is FIRST in both, so on a
				// 15-/30-minute block too short for two lines it is the line that
				// survives the clip - never the other way round.
				variant === "month" ? "h-5 items-center gap-1.5 leading-5" : "h-full flex-col items-start pt-0.5",
				occurrence.source === "system" && "border border-current border-dashed",
				isSelected && "ring-2 ring-inset ring-primary",
				className,
			)}
			data-cy={dataCy}
			onClick={onPress}
			style={{
				backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
				color,
				...style,
			}}
			type="button"
		>
			{/* Title and time are BOTH always rendered. `truncate` + a bounded width
			    keep a long title inside the chip instead of spilling into the next
			    column. */}
			<span
				className={cn("truncate font-medium", variant === "month" ? "min-w-0 flex-1" : "w-full")}
			>
				{occurrence.title}
			</span>
			<span
				className={cn(
					"truncate opacity-70",
					variant === "month" ? "shrink-0 pl-1" : "w-full text-[0.7rem]",
				)}
			>
				{time}
			</span>
		</button>
	);
}
