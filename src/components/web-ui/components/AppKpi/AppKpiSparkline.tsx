import type { KeyboardEvent, PointerEvent } from "react";
import { useId, useState } from "react";
import { cn } from "../../lib/cn";
import type { KpiPoint } from "./kpi.types";

/**
 * The drawing space, in viewBox units. Not pixels: the chart is stretched to
 * whatever width the tile got, so only the ASPECT of these numbers matters.
 */
const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 32;

/**
 * Vertical room for the stroke at the extremes. Without it the highest and
 * lowest readings are drawn ON the boundary and lose their outer half to the
 * clip, so a peak reads as a plateau.
 */
const PAD = 3;

/** Where the readout stops being centred and starts hugging the edge, in %. */
const EDGE = 18;

export type SparklineTone = "accent" | "danger" | "success";

const TONE: Record<SparklineTone, string> = {
	accent: "text-accent",
	danger: "text-danger",
	success: "text-success",
};

interface AppKpiSparklineProps {
	className?: string;
	"data-cy"?: string;
	formatValue: (value: number) => string;
	/** At least two. `AppKpi` drops the chart below that rather than passing one. */
	points: KpiPoint[];
	/** Names the series in the chart's accessible label - the tile's own title. */
	title: string;
	tone: SparklineTone;
}

/**
 * The trend under a KPI value: one line, one fill, and a readout on hover.
 *
 * Hand-drawn SVG rather than a charting library, and that is a decision rather
 * than an omission. A sparkline is a path and a gradient; the smallest chart
 * library that would draw one is heavier than this whole component folder, and
 * it would arrive with an axis system, a legend and a tooltip of its own that
 * all have to be turned off again.
 *
 * WHAT IS NOT DRAWN is most of the design. No axes, no gridlines, no ticks, no
 * legend, no value labels: a sparkline sits under a number that already says
 * where the series ended, and everything else is ink competing with it. The one
 * thing added back is the hover readout, because "what was it in March" is the
 * only question the shape cannot answer on its own.
 *
 * `preserveAspectRatio="none"` stretches the path to the tile's width, which is
 * what makes this work at any column width with no measuring. The stroke is
 * pinned at 2px through `vector-effect` so the stretch cannot thin it, and
 * everything ROUND - the crosshair dot, the readout - is HTML positioned in
 * percent rather than SVG, because a circle in a stretched viewBox is an
 * ellipse.
 *
 * Accessibility: the chart itself is `aria-hidden` and the series is published
 * as an `sr-only` list underneath. That list is the point - a tooltip that is
 * the only way to a value has gated the data behind a pointer, and a sparkline
 * has few enough readings that the honest answer is to just write them out.
 * The visible readout is sugar on top, reachable with arrow keys as well as a
 * pointer.
 */
export function AppKpiSparkline({
	className,
	"data-cy": dataCy,
	formatValue,
	points,
	title,
	tone,
}: AppKpiSparklineProps) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	/*
	 * `useId` wraps its value in characters that are not legal inside a CSS
	 * `url(#...)` reference, and the failure is silent: the fill resolves to
	 * nothing and the area under the line just does not paint.
	 */
	const gradientId = `kpi-sparkline-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

	const { area, coords, line } = toGeometry(points);
	const activePoint = activeIndex === null ? null : points[activeIndex];
	const activeCoord = activeIndex === null ? null : coords[activeIndex];

	function moveTo(index: number) {
		setActiveIndex(Math.min(points.length - 1, Math.max(0, index)));
	}

	function handlePointer(event: PointerEvent<HTMLButtonElement>) {
		moveTo(indexAtClientX(event.currentTarget, event.clientX, points.length));
	}

	function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		const last = points.length - 1;

		if (event.key === "Escape") {
			setActiveIndex(null);
			return;
		}

		if (!["ArrowLeft", "ArrowRight", "End", "Home"].includes(event.key)) return;
		event.preventDefault();

		/*
		 * The first arrow press lands ON a point rather than stepping off an
		 * imaginary one - from nothing, Left and End open at the newest reading,
		 * which is the one the value above the chart is reporting.
		 */
		if (activeIndex === null) {
			setActiveIndex(event.key === "ArrowRight" || event.key === "Home" ? 0 : last);
			return;
		}

		if (event.key === "Home") moveTo(0);
		else if (event.key === "End") moveTo(last);
		else moveTo(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
	}

	return (
		<div
			className={cn("min-w-0", TONE[tone], className)}
			data-cy={dataCy}
			data-tone={tone}
		>
			{/*
			 * The top strip is the readout's home, reserved whether or not anything
			 * is hovering. Floating it above the chart on `bottom-full` put it
			 * outside the card, where the card's own rounded overflow clipped it in
			 * half; keeping it inside means the tile never has to leak to explain
			 * itself. Empty, the strip is the gap the value needs from the chart
			 * anyway.
			 */}
			<div className="relative pt-7">
				{activePoint && activeCoord ? (
					<>
						<span
							aria-hidden="true"
							className="pointer-events-none absolute top-7 bottom-0 w-px -translate-x-1/2 bg-current opacity-30"
							style={{ left: `${activeCoord.x}%` }}
						/>
						{/* Ringed in the surface colour so the marker stays legible where
						    it crosses its own line. Positioned off the strip and the plot
						    height in rem rather than in percent of this box, which is the
						    two of them added together. */}
						<span
							aria-hidden="true"
							className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-surface"
							style={{
								left: `${activeCoord.x}%`,
								top: `calc(1.75rem + ${(activeCoord.y / VIEW_HEIGHT) * 4}rem)`,
							}}
						/>
						{/*
						 * Value first, label second - the reader already knows which
						 * series they are pointing at and came for the number. Text wears
						 * text tokens, never the line's colour: a pale trend line is
						 * illegible as type.
						 */}
						<span
							aria-hidden="true"
							className="pointer-events-none absolute top-0 z-10 flex items-baseline gap-1.5 rounded-lg border border-border bg-surface px-2 py-0.5 whitespace-nowrap shadow-soft"
							data-cy={dataCy ? `${dataCy}-readout` : undefined}
							style={{ left: `${activeCoord.x}%`, transform: `translateX(${readoutShift(activeCoord.x)})` }}
						>
							<span className="text-xs font-semibold text-foreground">{formatValue(activePoint.value)}</span>
							<span className="text-[0.6875rem] text-muted">{activePoint.label}</span>
						</span>
					</>
				) : null}

				{/*
				 * A real button, not a focusable div. It has a job on a device with no
				 * hover: tapping the chart reads out the point under the thumb, which
				 * is the only way to a value on a phone.
				 */}
				<button
					aria-label={`${title} trend, ${points.length} readings from ${points[0].label} to ${points[points.length - 1].label}. Arrow keys read each one.`}
					className="relative block h-16 w-full cursor-crosshair rounded-md focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
					data-cy={dataCy ? `${dataCy}-surface` : undefined}
					onBlur={() => setActiveIndex(null)}
					onKeyDown={handleKeyDown}
					onPointerDown={handlePointer}
					onPointerLeave={() => setActiveIndex(null)}
					onPointerMove={handlePointer}
					type="button"
				>
					<svg
						aria-hidden="true"
						className="h-full w-full"
						preserveAspectRatio="none"
						viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
					>
						<defs>
							<linearGradient
								id={gradientId}
								x1="0"
								x2="0"
								y1="0"
								y2="1"
							>
								<stop
									offset="0%"
									stopColor="currentColor"
									stopOpacity={0.24}
								/>
								<stop
									offset="100%"
									stopColor="currentColor"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<path
							d={area}
							fill={`url(#${gradientId})`}
						/>
						<path
							d={line}
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							/* Pins the stroke at 2px through the horizontal stretch. */
							vectorEffect="non-scaling-stroke"
						/>
					</svg>
				</button>
			</div>

			{/* The series in full, for anyone not using a pointer. */}
			<ol className="sr-only">
				{points.map((point) => (
					<li key={point.label}>
						{point.label}: {formatValue(point.value)}
					</li>
				))}
			</ol>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface Coord {
	x: number;
	y: number;
}

/**
 * The two paths and the point coordinates, in viewBox units.
 *
 * The scale is the series' OWN min and max rather than zero-based, which is the
 * opposite of the rule for bars - and deliberately. A bar's length IS its
 * value, so a truncated baseline turns a 2% move into a cliff. A sparkline's
 * job is the shape of the change; zero-basing a revenue line that never goes
 * near zero flattens the whole series into a strip along the top and reports
 * "nothing happened" about a quarter where plenty did. The value above the
 * chart carries the magnitude; this carries the direction.
 */
function toGeometry(points: KpiPoint[]): { area: string; coords: Coord[]; line: string } {
	const values = points.map((point) => point.value);
	const min = Math.min(...values);
	const span = Math.max(...values) - min;

	const coords = points.map((point, index) => ({
		x: (index / (points.length - 1)) * VIEW_WIDTH,
		/*
		 * A series that never moved sits on the CENTRE line. Divided by a zero
		 * span it would land on the floor, and a line pinned to the bottom of its
		 * box reads as a collapse to zero - which is a different fact entirely.
		 */
		y: span === 0 ? VIEW_HEIGHT / 2 : VIEW_HEIGHT - PAD - ((point.value - min) / span) * (VIEW_HEIGHT - PAD * 2),
	}));

	const line = toLinePath(coords);

	return { area: `${line} L${VIEW_WIDTH} ${VIEW_HEIGHT} L0 ${VIEW_HEIGHT} Z`, coords, line };
}

/**
 * The `d` for the trend line: a monotone cubic through the readings rather than
 * a dot-to-dot of straight segments.
 *
 * Monotone (Fritsch-Carlson), not a plain Catmull-Rom spline, because the curve
 * has 3px of vertical room before the clip eats it. Catmull-Rom overshoots a
 * peak - the line arcs ABOVE the highest reading on its way in - and that
 * invented bump would be sheared flat by `PAD`. Monotone flattens the tangent
 * to zero at every local max and min instead, so the drawn curve never leaves
 * the range its own points define.
 *
 * Two points can't bend, and one control-point-per-side needs a neighbour on
 * each side, so anything under three stays a straight `L`.
 */
function toLinePath(coords: Coord[]): string {
	if (coords.length < 3) {
		return coords.map((coord, index) => `${index === 0 ? "M" : "L"}${round(coord.x)} ${round(coord.y)}`).join(" ");
	}

	const last = coords.length - 1;

	/* Secant slope of each gap, and the horizontal step (constant here, but the
	   maths is the general one). */
	const dx = coords.slice(1).map((coord, index) => coord.x - coords[index].x);
	const slope = coords.slice(1).map((coord, index) => (coord.y - coords[index].y) / dx[index]);

	/* Tangent at each point. Endpoints take the neighbouring secant; an interior
	   point whose neighbours disagree in sign is a turning point and gets a flat
	   tangent, otherwise a dx-weighted harmonic mean that can't exceed either
	   secant - which is what kills the overshoot. */
	const tangent = coords.map((_, index) => {
		if (index === 0) return slope[0];
		if (index === last) return slope[last - 1];
		if (slope[index - 1] * slope[index] <= 0) return 0;

		const wPrev = 2 * dx[index] + dx[index - 1];
		const wNext = dx[index] + 2 * dx[index - 1];

		return (wPrev + wNext) / (wPrev / slope[index - 1] + wNext / slope[index]);
	});

	let d = `M${round(coords[0].x)} ${round(coords[0].y)}`;

	for (let index = 0; index < last; index++) {
		const c1x = coords[index].x + dx[index] / 3;
		const c1y = coords[index].y + (tangent[index] * dx[index]) / 3;
		const c2x = coords[index + 1].x - dx[index] / 3;
		const c2y = coords[index + 1].y - (tangent[index + 1] * dx[index]) / 3;

		d += ` C${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(coords[index + 1].x)} ${round(coords[index + 1].y)}`;
	}

	return d;
}

/**
 * The reading nearest the pointer, not the one under it.
 *
 * Snapping to the nearest is what makes the chart hittable: the readings are a
 * few pixels apart and nobody aims at a 2px line, so the pointer only has to be
 * closest.
 */
function indexAtClientX(element: HTMLElement, clientX: number, count: number): number {
	const rect = element.getBoundingClientRect();
	if (rect.width === 0) return 0;

	return Math.round(((clientX - rect.left) / rect.width) * (count - 1));
}

/**
 * How the readout sits over its point: centred in the middle of the chart, and
 * pinned by an edge near the ends so it cannot hang off the tile.
 */
function readoutShift(x: number): string {
	if (x < EDGE) return "0%";
	if (x > 100 - EDGE) return "-100%";
	return "-50%";
}

function round(value: number): string {
	return value.toFixed(2);
}
