/** One picture in a carousel. */
export interface CarouselImage {
	/**
	 * What the picture shows. Required, for the same reason `AppButton` makes an
	 * icon-only button's name required: a gallery of six unnamed images is six
	 * announcements of the word "image", and the person who cannot see them has
	 * no way to tell which one they are on. Pass `""` for a picture that is
	 * genuinely decorative - that is a decision, not an omission.
	 */
	alt: string;
	/** One line under the stage, and the line the viewer repeats in its header. */
	caption?: string;
	src: string;
	/** A smaller file for the strip. Defaults to `src`. */
	thumbnailSrc?: string;
}

/** Which way the deck is moving. `1` is towards the end. */
export type CarouselDirection = -1 | 1;

/**
 * What sits under the stage and says where you are.
 *
 * `thumbnails` is the default because a picture is its own label - a row of
 * dots tells you there are six of something and nothing else. `dots` is for a
 * hero banner, where the thumbnails would be a second gallery under the first.
 */
export type CarouselIndicator = "dots" | "none" | "thumbnails";

/**
 * The picture one step away, or `null` when there is not one.
 *
 * `null` is the whole non-looping story: it disables an arrow, it stops the
 * autoplay at the end, and it is what makes a swipe past the last picture drag
 * against a resistance instead of revealing a blank frame.
 */
export function neighbourIndex(
	index: number,
	offset: CarouselDirection,
	count: number,
	isLooping: boolean,
): null | number {
	if (count < 2) return null;

	const raw = index + offset;
	if (raw >= 0 && raw < count) return raw;

	return isLooping ? (raw + count) % count : null;
}

/** Wraps when looping, clamps when not. The one place either rule is written. */
export function resolveIndex(target: number, count: number, isLooping: boolean): number {
	if (count === 0) return 0;
	if (isLooping) return ((target % count) + count) % count;

	return Math.min(Math.max(target, 0), count - 1);
}

/**
 * The shortest way round from one picture to another.
 *
 * Only matters when looping: going from the last picture to the first should
 * slide forward, the way the wrap actually happened, and a plain `to > from`
 * test would send it backwards through the whole deck.
 */
export function directionBetween(from: number, to: number, count: number, isLooping: boolean): CarouselDirection {
	if (!isLooping) return to > from ? 1 : -1;

	const forward = (((to - from) % count) + count) % count;

	return forward <= count - forward ? 1 : -1;
}

/** The id of the thumbnail that selects a given picture. Shared by the tab and the stage it labels. */
export function carouselTabId(baseId: string, index: number): string {
	return `${baseId}-tab-${index}`;
}

/**
 * Read at the moment of use rather than through a hook, because the answer is
 * only ever needed inside an event handler or an effect - both client-only, so
 * there is no SSR value to get wrong and nothing to re-render on.
 */
export function prefersReducedMotion(): boolean {
	return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
