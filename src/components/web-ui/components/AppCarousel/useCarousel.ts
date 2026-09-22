import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion, resolveIndex } from "./carousel.types";

interface UseCarouselOptions {
	/** Dwell time per picture. */
	autoPlayMs: number;
	count: number;
	defaultIndex: number;
	/** Controlled index. Leave undefined to let the hook own it. */
	index?: number;
	isAutoPlaying: boolean;
	isLooping: boolean;
	onIndexChange?: (index: number) => void;
}

export interface CarouselModel {
	canGoNext: boolean;
	canGoPrevious: boolean;
	/** Moves, and stops the slideshow for good - see the note below. */
	goTo: (index: number) => void;
	/** Pointer over the carousel, or focus inside it. */
	hold: () => void;
	index: number;
	/** True only while the timer is actually running. Silences the live region while it is. */
	isPlaying: boolean;
	next: () => void;
	previous: () => void;
	release: () => void;
	/** Held off while the viewer is open over it. */
	suspend: (isSuspended: boolean) => void;
}

/**
 * The index, and everything that is allowed to change it.
 *
 * Split out of the components because three of them move the same number - the
 * stage's arrows and swipe, the thumbnail strip, and the timer - and the rules
 * about what that number may become (wrap or clamp) have to be the same for
 * all three or the strip highlights a picture the stage is not showing.
 *
 * ## Autoplay stops when the user takes over, and does not come back
 *
 * Any manual move - an arrow, a thumbnail, a swipe - ends the slideshow, rather
 * than resuming after a delay. Someone who reached for a control is reading;
 * yanking the deck out from under them four seconds later is the single most
 * complained-about behaviour a carousel has. There is no Play control to
 * restart it: `isAutoPlaying` is a property of the deck the caller mounted, not
 * a mode the reader is expected to manage, and the one thing a reader ever
 * wants from a slideshow is for it to stop.
 *
 * That interaction IS the pause mechanism auto-advancing content is required to
 * have, which is why it has to be permanent rather than a hover reprieve -
 * anything that restarts itself is not a way to stop it.
 *
 * It also pauses while the pointer is over the carousel, while focus is inside
 * it, while the tab is in the background, and while the viewer is open over it.
 * All four are the same rule: the timer runs only when nobody is looking at a
 * particular picture.
 */
export function useCarousel({
	autoPlayMs,
	count,
	defaultIndex,
	index,
	isAutoPlaying,
	isLooping,
	onIndexChange,
}: UseCarouselOptions): CarouselModel {
	const [internalIndex, setInternalIndex] = useState(() => resolveIndex(defaultIndex, count, isLooping));
	const [hasTakenOver, setHasTakenOver] = useState(false);
	const [isHeld, setIsHeld] = useState(false);
	const [isSuspended, setIsSuspended] = useState(false);
	const [isTabHidden, setIsTabHidden] = useState(false);

	const activeIndex = index ?? internalIndex;

	/*
	 * Reduced motion never starts the slideshow at all. The preference is about
	 * movement nobody asked for, and a deck that advances on its own is the
	 * definition of it. Read once on mount rather than as a live binding: a media
	 * query cannot be read during SSR, and this is a starting position.
	 */
	useEffect(() => {
		if (prefersReducedMotion()) setHasTakenOver(true);
	}, []);

	/*
	 * A background tab still runs timers, so without this the deck advances four
	 * or five pictures while the user is somewhere else and they come back to a
	 * carousel that has silently moved.
	 */
	useEffect(() => {
		const sync = () => setIsTabHidden(document.hidden);

		sync();
		document.addEventListener("visibilitychange", sync);

		return () => document.removeEventListener("visibilitychange", sync);
	}, []);

	const move = useCallback(
		(target: number, isManual: boolean) => {
			if (isManual) setHasTakenOver(true);

			const next = resolveIndex(target, count, isLooping);
			if (next === activeIndex) return;

			if (index === undefined) setInternalIndex(next);
			onIndexChange?.(next);
		},
		[activeIndex, count, index, isLooping, onIndexChange],
	);

	const canGoPrevious = count > 1 && (isLooping || activeIndex > 0);
	const canGoNext = count > 1 && (isLooping || activeIndex < count - 1);

	const isPlaying =
		isAutoPlaying && canGoNext && !hasTakenOver && !isHeld && !isSuspended && !isTabHidden && autoPlayMs > 0;

	/*
	 * The timer is keyed on the index as well as on `isPlaying`, so every move -
	 * including a manual one - restarts the dwell rather than leaving the next
	 * picture with whatever was left of the last one's four seconds.
	 */
	const moveRef = useRef(move);
	moveRef.current = move;

	useEffect(() => {
		if (!isPlaying) return;

		const timer = window.setTimeout(() => moveRef.current(activeIndex + 1, false), autoPlayMs);

		return () => window.clearTimeout(timer);
	}, [activeIndex, autoPlayMs, isPlaying]);

	return {
		canGoNext,
		canGoPrevious,
		goTo: (target: number) => move(target, true),
		hold: () => setIsHeld(true),
		index: activeIndex,
		isPlaying,
		next: () => move(activeIndex + 1, true),
		previous: () => move(activeIndex - 1, true),
		release: () => setIsHeld(false),
		suspend: setIsSuspended,
	};
}
