import { Star } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";
import type { RatingSize } from "./RatingStar";
import { RatingStar, starFillPercent } from "./RatingStar";

/** ms between one star lighting and the next. Enough to read as counting out. */
const STAGGER_MS = 30;

interface AppRatingSummaryProps {
	className?: string;
	"data-cy"?: string;
	/** How many ratings produced the average. 0 renders the unrated state. */
	count: number;
	/**
	 * Ratings per star, lowest first: `[1★, 2★, 3★, 4★, 5★]`. Omit to hide the
	 * breakdown - but it is what makes an average honest, so pass it if you have it.
	 */
	distribution?: number[];
	max?: number;
	/** Plural noun for the count. "ratings", "reviews". */
	noun?: string;
	/** The ring reads faster than the number. Drop it only where there is no room. */
	showRing?: boolean;
	size?: RatingSize;
	/** The average, unrounded. 4.4 must arrive here as 4.4. */
	value: number;
}

/**
 * The rating SUMMARY: an average someone else produced.
 *
 * A figure, not a control - nothing here is focusable, and the stars, ring and
 * bars are decoration around one accessible sentence. Making a reader walk five
 * glyphs to learn one number is the usual way this component fails.
 *
 * Stars carry the shape of the answer, the number carries its precision, the
 * count carries whether either is worth believing: 5.0 from two people is not
 * 4.6 from four hundred. The ring is there because an arc is read faster than a
 * number and much faster than counted glyphs - stars to rate, a ring to
 * summarise. There is deliberately no ring on the input; a circle is not
 * something you can press a value into.
 */
export function AppRatingSummary({
	className,
	"data-cy": dataCy,
	count,
	distribution,
	max = 5,
	noun = "ratings",
	showRing = true,
	size = "md",
	value,
}: AppRatingSummaryProps) {
	if (count === 0) {
		// The hook has to be passed through here too: this is an EARLY return, so
		// the root below never runs for an unrated summary - and unrated is exactly
		// the state a spec most wants to address.
		return (
			<UnratedState
				className={className}
				data-cy={dataCy}
			/>
		);
	}

	const average = Math.min(max, Math.max(0, value));
	const sentence = `Rated ${average.toFixed(1)} out of ${max}, ${count.toLocaleString()} ${noun}`;

	return (
		<div
			className={cn("flex flex-col gap-5", className)}
			data-cy={dataCy}
		>
			{/*
			 * One element, one name. Everything inside it is `aria-hidden`, so the
			 * whole figure is announced as a sentence rather than as five stars, a
			 * progress circle and a pile of percentages.
			 */}
			<div
				aria-label={sentence}
				className="flex flex-wrap items-center gap-x-3 gap-y-1"
				role="img"
			>
				<span
					aria-hidden="true"
					className="flex items-center gap-1"
				>
					{Array.from({ length: max }, (_, index) => (
						<RatingStar
							delayMs={index * STAGGER_MS}
							fillPercent={starFillPercent(index, average)}
							key={index}
							size={size}
						/>
					))}
				</span>
				<span aria-hidden="true">
					<span className="font-semibold">{average.toFixed(1)}</span>
					<span className="text-muted"> / {max}</span>
				</span>
				<span
					aria-hidden="true"
					className="text-sm text-muted"
				>
					{count.toLocaleString()} {noun}
				</span>
			</div>

			{showRing || distribution ? (
				<div className="flex flex-wrap items-center gap-6">
					{showRing ? (
						<RatingRing
							max={max}
							value={average}
						/>
					) : null}
					{distribution ? (
						<RatingDistribution
							distribution={distribution}
							max={max}
						/>
					) : null}
				</div>
			) : null}
		</div>
	);
}

/* -------------------------------------------------------------------------- */

const RING_SIZE = 132;
const RING_STROKE = 12;

/**
 * One continuous arc swept to value/max, with the average at its centre.
 *
 * The sweep animates `stroke-dashoffset` from empty to the resting offset, on
 * the same curve as the stars and slightly longer, so the two halves of the
 * summary land as one movement instead of two widgets loading.
 */
function RatingRing({ max, value }: { max: number; value: number }) {
	const radius = (RING_SIZE - RING_STROKE) / 2;
	const length = 2 * Math.PI * radius;
	const offset = length * (1 - value / max);

	const style = {
		"--ring-length": `${length}`,
		"--ring-offset": `${offset}`,
		strokeDasharray: length,
		strokeDashoffset: offset,
	} as CSSProperties;

	return (
		<div
			aria-hidden="true"
			className="relative shrink-0"
			style={{ height: RING_SIZE, width: RING_SIZE }}
		>
			{/* Decoration, and marked as such on the svg itself rather than only on
			    the wrapper: the arc restates the average that the summary already
			    says in words, so announcing it again is a second reading of one
			    fact. */}
			<svg
				aria-hidden="true"
				className="-rotate-90"
				height={RING_SIZE}
				viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
				width={RING_SIZE}
			>
				<circle
					className="text-border"
					cx={RING_SIZE / 2}
					cy={RING_SIZE / 2}
					fill="none"
					r={radius}
					stroke="currentColor"
					strokeWidth={RING_STROKE}
				/>
				<circle
					className="ring-sweep text-accent"
					cx={RING_SIZE / 2}
					cy={RING_SIZE / 2}
					fill="none"
					r={radius}
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth={RING_STROKE}
					style={style}
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-3xl font-bold tabular-nums">{value.toFixed(1)}</span>
				<span className="text-xs text-muted">/ {max}</span>
			</div>
		</div>
	);
}

/**
 * The per-star breakdown, highest first.
 *
 * This is what keeps the average honest: 4.5 from a flat spread and 4.5 from a
 * wall of fives with a tail of ones are different products. The percentages are
 * real text in a `<dl>` rather than bar widths alone, and every track shares one
 * baseline width so the eye compares lengths and not scale.
 */
function RatingDistribution({ distribution, max }: { distribution: number[]; max: number }) {
	const total = distribution.reduce((sum, n) => sum + n, 0);

	return (
		<dl className="flex min-w-56 flex-1 flex-col gap-1.5">
			{Array.from({ length: max }, (_, index) => max - index).map((star) => {
				const share = total === 0 ? 0 : ((distribution[star - 1] ?? 0) / total) * 100;

				return (
					<div
						className="flex items-center gap-2"
						key={star}
					>
						<dt className="flex w-10 shrink-0 items-center gap-1 text-xs text-muted">
							{star}
							<Star
								aria-hidden="true"
								className="size-3 fill-current text-rating-star"
								strokeWidth={1.5}
							/>
							<span className="sr-only">{star === 1 ? "star" : "stars"}</span>
						</dt>
						<div
							aria-hidden="true"
							className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border"
						>
							<div
								className="h-full rounded-full bg-accent"
								style={{ width: `${share}%` }}
							/>
						</div>
						<dd className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">{Math.round(share)}%</dd>
					</div>
				);
			})}
		</dl>
	);
}

/**
 * Not 0.0 with five empty stars and an empty ring. Empty stars are what the
 * INPUT looks like, so a summary in that shape reads as a control the user has
 * failed to use - and an average of nothing is not zero, it is absent.
 */
function UnratedState({ className, "data-cy": dataCy }: { className?: string; "data-cy"?: string }) {
	return (
		<div
			className={cn("flex items-center gap-2 text-sm text-muted", className)}
			data-cy={dataCy}
		>
			<Star
				aria-hidden="true"
				className="size-4 shrink-0"
				strokeWidth={1.5}
			/>
			<span>No ratings yet</span>
		</div>
	);
}
