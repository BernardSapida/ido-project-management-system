import { Star } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";

export type RatingSize = "lg" | "md" | "sm";

/** The glyph box. The hit target around it is the input's business, not this. */
export const RATING_STAR_SIZE: Record<RatingSize, string> = {
	lg: "size-9",
	md: "size-7",
	sm: "size-5",
};

interface RatingStarProps {
	/** ms into the enter stagger. Omit for a star that should not animate. */
	delayMs?: number;
	/** 0-100. Anything between the two is a real fraction, not a half glyph. */
	fillPercent: number;
	size?: RatingSize;
}

/**
 * One star, filled to a percentage.
 *
 * A solid star is laid over the outlined one and clipped to the fraction, which
 * is the only way 4.4 and 4.7 can look different: a half-star glyph can say
 * exactly one thing, and rounding to it turns "not quite" into "yes". The
 * average is the number people decide on, so it is the last place to round.
 *
 * Filled and empty differ by fill, not only by hue, so the value survives
 * greyscale and a colour-blind reader.
 *
 * Both layers are `aria-hidden`: the glyphs are decoration, and whoever renders
 * a row of these owns the one accessible name that says what they add up to.
 */
export function RatingStar({ delayMs, fillPercent, size = "md" }: RatingStarProps) {
	/* Rounded to 2dp: 4.4 lands on 40.000000000000036 in binary floating point,
	   and that whole number ends up in the markup twice per star. */
	const clamped = Math.round(Math.min(100, Math.max(0, fillPercent)) * 100) / 100;

	/*
	 * The clip is the resting style, not the end frame of an animation - so the
	 * server-rendered star is already at the right fraction and the keyframes
	 * (which read the same custom property) only decide when it sweeps in.
	 */
	const style = {
		"--star-delay": delayMs === undefined ? undefined : `${delayMs}ms`,
		"--star-fill": `${clamped}%`,
		clipPath: `inset(0 calc(100% - ${clamped}%) 0 0)`,
	} as CSSProperties;

	return (
		<span className={cn("relative inline-flex shrink-0", RATING_STAR_SIZE[size])}>
			<Star
				aria-hidden="true"
				className="size-full text-muted/40"
				strokeWidth={1.5}
			/>
			<span
				aria-hidden="true"
				className={cn("absolute inset-0", delayMs !== undefined && "star-sweep")}
				style={style}
			>
				<Star
					className="size-full fill-current text-rating-star"
					strokeWidth={1.5}
				/>
			</span>
		</span>
	);
}

/** How full star `index` is when the rating is `value`. 4.4 leaves the fifth at 40%. */
export function starFillPercent(index: number, value: number): number {
	return Math.min(100, Math.max(0, (value - index) * 100));
}
