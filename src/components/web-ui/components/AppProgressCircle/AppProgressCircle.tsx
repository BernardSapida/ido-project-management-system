import { ProgressCircle } from "@heroui/react";
import type { ComponentProps, CSSProperties } from "react";
import { useId } from "react";
import { cn } from "../../lib/cn";

type ProgressCircleColor = ComponentProps<typeof ProgressCircle>["color"];
type ProgressCircleSize = ComponentProps<typeof ProgressCircle>["size"];

interface AppProgressCircleProps {
	className?: string;
	color?: ProgressCircleColor;
	/** Test hook on the wrapper. */
	"data-cy"?: string;
	isIndeterminate?: boolean;
	/** Hides the caption under the ring. It remains the accessible name. */
	isLabelHidden?: boolean;
	/**
	 * What is progressing - "Storage used", "Uploading". Required for the same
	 * reason as on the bar: a ring announced as "Progress, 67%" has named the
	 * category of thing rather than the thing, and a tile in a grid of tiles is
	 * exactly where that ambiguity bites.
	 */
	label: string;
	size?: ProgressCircleSize;
	value?: number;
}

/**
 * The same measurement as AppProgressBar, wound into a ring.
 *
 * Use it where the progress is one tile in a grid of tiles and a full-width bar
 * would be the widest thing on the card - a dashboard stat, a compact quota.
 * A bar is better wherever there is horizontal room, because a line is easier
 * to compare against another line than one arc is against another arc.
 *
 * Same indeterminate rule as the bar: `value` is dropped rather than pinned at
 * 0, so an unknown duration does not claim to be a known one.
 *
 * The arc is painted with the brand gradient rather than a flat `--accent`, for
 * the reason the whole palette is: a flat brand fill is the one thing the
 * gradient tokens exist to replace. A stroke cannot take a `linear-gradient()`,
 * so the ramp arrives as an SVG paint server declared per instance below and
 * handed to HeroUI's own --progress-circle-stroke. The stop COLOURS are not
 * here - they are tokens keyed off HeroUI's colour class in styles.css, so this
 * file never learns what "danger" looks like.
 */
export function AppProgressCircle({
	className,
	color,
	"data-cy": dataCy,
	isIndeterminate = false,
	isLabelHidden = false,
	label,
	size,
	value = 0,
}: AppProgressCircleProps) {
	/*
	 * `useId` emits punctuation - `:r1:` on React 18, guillemets on 19 - and this
	 * value goes into a `url(#…)` FuncIRI, which is parsed as a CSS value. Strip
	 * it to word characters, as the error state's mark does: still unique per
	 * instance, still identical across SSR and hydration, safe in a reference.
	 */
	const gradientId = `progress-circle-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

	return (
		<div
			className={cn("flex flex-col items-center gap-2", className)}
			data-cy={dataCy}
		>
			<ProgressCircle
				aria-label={label}
				color={color}
				isIndeterminate={isIndeterminate}
				size={size}
				style={{ "--progress-circle-stroke": `url(#${gradientId})` } as CSSProperties}
				value={isIndeterminate ? undefined : value}
			>
				<ProgressCircle.Track>
					<defs>
						{/* Wound a quarter turn against the arc. HeroUI rotates the fill
						    circle by -90deg so the ring starts at twelve o'clock, and an
						    objectBoundingBox gradient rotates with the element it paints -
						    so the vector is declared pre-rotation, top-RIGHT to
						    bottom-LEFT, which lands on screen as the 135deg every other
						    gradient in the app runs at. Get this wrong and the light falls
						    the other way on the one surface that is a ring. */}
						<linearGradient
							gradientUnits="objectBoundingBox"
							id={gradientId}
							x1="1"
							x2="0"
							y1="0"
							y2="1"
						>
							<stop
								className="progress-circle__stop-from"
								offset="0%"
							/>
							<stop
								className="progress-circle__stop-via"
								offset="50%"
							/>
							<stop
								className="progress-circle__stop-to"
								offset="100%"
							/>
						</linearGradient>
					</defs>
					<ProgressCircle.TrackCircle />
					<ProgressCircle.FillCircle />
				</ProgressCircle.Track>
			</ProgressCircle>
			<span className={cn("text-xs text-muted", isLabelHidden && "sr-only")}>{label}</span>
		</div>
	);
}
