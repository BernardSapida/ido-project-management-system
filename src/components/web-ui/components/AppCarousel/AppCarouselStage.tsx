import type { ReactNode, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { CarouselNavButton } from "./CarouselNavButton";
import type { CarouselDirection, CarouselImage } from "./carousel.types";
import { directionBetween, neighbourIndex, prefersReducedMotion } from "./carousel.types";

/** One slide's worth of travel. Entrance range from the motion rules; exits are the same move backwards. */
const SLIDE_MS = 300;

/** How far a drag has to get before letting go moves the deck: 18% of the frame, never less than 48px. */
const COMMIT_RATIO = 0.18;
const COMMIT_MIN_PX = 48;

/** Movement under this is a press that wobbled, not a drag. */
const DRAG_START_PX = 6;

/** How much of the finger a drag with nothing behind it follows. The rubber band at the end of a deck. */
const RESISTANCE = 0.25;

interface AppCarouselStageProps {
	className?: string;
	"data-cy"?: string;
	/** What the thumbnail strip's `aria-controls` points at. The frame itself is unnamed - the slides inside carry the names. */
	id: string;
	images: CarouselImage[];
	index: number;
	isLooping: boolean;
	/** Silences the announcement while the deck is advancing on its own. */
	isPlaying: boolean;
	/** `inside` overlays the arrows on the picture; `outside` means the caller draws them. */
	navPlacement: "inside" | "outside";
	onNavigate: (index: number) => void;
	/** Set when pressing the picture opens the viewer. */
	onOpenViewer?: () => void;
	/** Pinned to the top corner of the frame - the counter, the autoplay control. */
	overlay?: ReactNode;
}

/**
 * The square the pictures happen in.
 *
 * ## The square is the promise, and `object-contain` is how it is kept
 *
 * Every picture is shown WHOLE, scaled until its longest side meets the frame:
 * a landscape photo spans the full width with the field showing above and
 * below, a portrait one spans the full height with the field either side, and a
 * square one fills it exactly. Nothing is ever cropped to fit.
 *
 * That costs empty space, and it is worth it. A gallery of user-supplied
 * pictures has no common aspect ratio, and the alternative - `object-cover` -
 * silently eats the top of every portrait shot. Cropping a product photo to a
 * square is how a shoe loses its heel. The field behind the picture is a real
 * surface rather than transparency, so the letterbox reads as a mount around
 * the picture instead of as a rendering fault.
 *
 * The frame keeps its aspect ratio at every width, so the page reserves the
 * space before the first byte of the first image arrives. A gallery that sizes
 * itself to whatever loads first is the biggest single source of layout shift
 * on a product page.
 *
 * ## Three slides, never all of them
 *
 * The track holds the previous, current and next picture and nothing else. That
 * is what makes the loop honest: wrapping from the last picture to the first
 * slides forward, because the first picture is genuinely sitting in the next
 * slot, rather than whipping backwards through four pictures the user did not
 * ask to see. It is also the preload - the neighbour is already decoded by the
 * time it is asked for - and it means a deck of eighty images costs three.
 *
 * The commit at the end of a slide swaps the track's contents and returns the
 * offset to the middle in the same paint. Those two states are the same pixels,
 * so the reset is invisible.
 *
 * ## Dragging
 *
 * The picture follows the finger, and the neighbour follows it in. Letting go
 * past the commit line finishes the move from wherever the finger stopped -
 * the transition interpolates from the current transform, so nothing snaps back
 * to a start position first. Short of the line it settles back.
 *
 * `touch-pan-y` is what lets the page still scroll vertically through the
 * carousel; without it, a thumb travelling down the page over a gallery locks
 * against a horizontal control that had no intention of moving.
 */
export function AppCarouselStage({
	className,
	"data-cy": dataCy,
	id,
	images,
	index,
	isLooping,
	isPlaying,
	navPlacement,
	onNavigate,
	onOpenViewer,
	overlay,
}: AppCarouselStageProps) {
	const count = images.length;

	/** What the track is actually showing. Trails `index` by one slide's worth of animation. */
	const [settled, setSettled] = useState(index);
	/** The leg in flight: which way, and which picture is coming in. */
	const [move, setMove] = useState<null | {
		direction: CarouselDirection;
		target: number;
	}>(null);
	const [hasTransition, setHasTransition] = useState(false);
	const [dragPx, setDragPx] = useState(0);

	const frameRef = useRef<HTMLDivElement>(null);
	const legRef = useRef(false);
	const legTimerRef = useRef<number | undefined>(undefined);
	const settleTimerRef = useRef<number | undefined>(undefined);
	const frameHandleRef = useRef<number | undefined>(undefined);
	const dragRef = useRef<null | { pointerId: number; startX: number }>(null);
	const hasDraggedRef = useRef(false);

	useEffect(
		() => () => {
			window.clearTimeout(legTimerRef.current);
			window.clearTimeout(settleTimerRef.current);
			if (frameHandleRef.current !== undefined) cancelAnimationFrame(frameHandleRef.current);
		},
		[],
	);

	/*
	 * Walks the track to wherever `index` has got to, one leg at a time.
	 *
	 * A leg in flight is left alone: the commit below moves `settled`, which
	 * re-runs this effect, which starts the next leg if the index has moved on
	 * again. That is what makes a double-press of Next scroll through two
	 * pictures instead of snapping to the second. Interrupting the leg instead
	 * would mean resetting the offset mid-flight, and a reset is only invisible
	 * once the slide it belongs to has finished.
	 *
	 * The offset is set a frame AFTER the incoming picture is put in its slot,
	 * because a jump straight to a picture three along has to be painted in the
	 * next-door slot before there is anything to animate towards.
	 */
	useEffect(() => {
		if (legRef.current || index === settled || count === 0) return;

		legRef.current = true;
		setMove({
			direction: directionBetween(settled, index, count, isLooping),
			target: index,
		});

		frameHandleRef.current = requestAnimationFrame(() => setHasTransition(true));

		legTimerRef.current = window.setTimeout(
			() => {
				legRef.current = false;
				setHasTransition(false);
				setMove(null);
				setDragPx(0);
				setSettled(index);
			},
			/*
			 * Reduced motion commits on the next tick. The app's global reduced-motion
			 * rule has already flattened the transition itself, so waiting 300ms here
			 * would only delay the next press against a picture that already changed.
			 */
			prefersReducedMotion() ? 0 : SLIDE_MS,
		);
	}, [count, index, isLooping, settled]);

	const previousIndex = neighbourIndex(index, -1, count, isLooping);
	const nextIndex = neighbourIndex(index, 1, count, isLooping);

	/*
	 * The slot in the direction of travel shows the picture being moved to,
	 * which is the neighbour anyway unless this is a jump from the strip.
	 */
	const leftSlot = move?.direction === -1 ? move.target : neighbourIndex(settled, -1, count, isLooping);
	const rightSlot = move?.direction === 1 ? move.target : neighbourIndex(settled, 1, count, isLooping);

	/*
	 * One expression for every position the track can be in. While a leg is
	 * animating the drag distance is dropped, which is what lets the transition
	 * run from wherever the finger let go all the way to the next slot.
	 */
	const shift = move && hasTransition ? `${move.direction * -100}%` : `${dragPx}px`;

	function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
		if (count < 2) return;
		if (event.pointerType === "mouse" && event.button !== 0) return;

		dragRef.current = { pointerId: event.pointerId, startX: event.clientX };
		hasDraggedRef.current = false;
	}

	function continueDrag(event: ReactPointerEvent<HTMLDivElement>) {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;

		const delta = event.clientX - drag.startX;

		/*
		 * The pointer is only captured once the movement is unmistakably a drag.
		 * Capturing on contact would swallow the click that opens the viewer.
		 */
		if (!hasDraggedRef.current) {
			if (Math.abs(delta) < DRAG_START_PX) return;

			hasDraggedRef.current = true;
			event.currentTarget.setPointerCapture(event.pointerId);
			window.clearTimeout(settleTimerRef.current);
			setHasTransition(false);
		}

		const towards: CarouselDirection = delta < 0 ? 1 : -1;
		const hasNeighbour = neighbourIndex(settled, towards, count, isLooping) !== null;

		setDragPx(hasNeighbour ? delta : delta * RESISTANCE);
	}

	function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;

		dragRef.current = null;
		if (!hasDraggedRef.current) return;

		const width = frameRef.current?.clientWidth ?? 0;
		const commitPx = Math.max(COMMIT_MIN_PX, width * COMMIT_RATIO);
		const towards: CarouselDirection = dragPx < 0 ? 1 : -1;
		const target = neighbourIndex(settled, towards, count, isLooping);

		if (target !== null && Math.abs(dragPx) > commitPx) {
			/* The leg effect picks it up from here and finishes the travel. */
			onNavigate(target);
			return;
		}

		setHasTransition(true);
		setDragPx(0);
		settleTimerRef.current = window.setTimeout(() => setHasTransition(false), SLIDE_MS);
	}

	const current = images[settled];
	/*
	 * Read off `index` rather than `settled`, with the counter and the strip: the
	 * caption is pinned to the FRAME, not to the slide, so it does not travel with
	 * the picture and there is nothing to be gained by holding it back 300ms.
	 */
	const caption = images[index]?.caption;

	return (
		<div className={cn("relative isolate w-full", className)}>
			{/*
			 * The frame carries no role and no name of its own. The section above it
			 * is the carousel, each slide inside is a labelled `slide`, and adding a
			 * third named region between them means a screen reader reads a wrapper
			 * before it reads the picture.
			 */}
			<div
				className={cn(
					"relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-muted-surface",
					"touch-pan-y select-none",
				)}
				data-cy={dataCy}
				id={id}
				onPointerCancel={endDrag}
				onPointerDown={startDrag}
				onPointerMove={continueDrag}
				onPointerUp={endDrag}
				ref={frameRef}
			>
				<div
					className={cn("flex h-full w-full", hasTransition && "transition-transform duration-300 ease-out")}
					style={{ transform: `translate3d(calc(-100% + ${shift}), 0, 0)` }}
				>
					{[leftSlot, settled, rightSlot].map((slotIndex, position) => (
						<CarouselSlide
							count={count}
							image={slotIndex === null ? undefined : images[slotIndex]}
							isCurrent={position === 1}
							/* Keyed by SLOT, not by picture: re-keying on the picture would
							   remount the img on every move and flash an empty frame mid-slide. */
							key={position}
							slideNumber={slotIndex === null ? 0 : slotIndex + 1}
						/>
					))}
				</div>

				{/*
				 * The whole picture is the target, because that is what people press.
				 * A separate expand button in the corner is a 40px target for an
				 * intent the other 90% of the frame already communicates - the cursor
				 * says the same thing, and the corner hint says it for anyone whose
				 * cursor does not. It is a sibling of the track rather than a wrapper
				 * around it so the arrows are not buttons inside a button.
				 */}
				{onOpenViewer && current ? (
					<button
						aria-label={current.alt ? `View ${current.alt} full size` : `View image ${settled + 1} full size`}
						className="absolute inset-0 z-10 cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-focus"
						onClick={() => {
							if (!hasDraggedRef.current) onOpenViewer();
						}}
						type="button"
					/>
				) : null}

				{/*
				 * The caption belongs ON the picture, at the foot of it, because that is
				 * where it is read as a label FOR this picture rather than as a line of
				 * page copy that happens to sit under a frame. It also stops the deck
				 * changing height when only some pictures are captioned.
				 *
				 * A scrim, not a tint: the caption has to survive a white sky and a
				 * black shadow in the same deck, and a gradient that fades to nothing is
				 * the only treatment that covers both without putting a bar across the
				 * bottom of every picture. `pointer-events-none` so the press it sits on
				 * still opens the viewer.
				 */}
				{caption ? (
					<div
						className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/70 via-black/30 to-transparent px-4 pt-12 pb-3"
						data-cy="carousel-caption"
					>
						<p className="text-sm font-medium text-white">{caption}</p>
					</div>
				) : null}

				{overlay ? <div className="absolute end-3 top-3 z-20 flex items-center gap-2">{overlay}</div> : null}

				{navPlacement === "inside" && count > 1 ? (
					<>
						<CarouselNavButton
							className="absolute start-3 top-1/2 z-20 -translate-y-1/2"
							data-cy="carousel-previous"
							direction="previous"
							isDisabled={previousIndex === null}
							onPress={() => previousIndex !== null && onNavigate(previousIndex)}
							placement="over"
						/>
						<CarouselNavButton
							className="absolute end-3 top-1/2 z-20 -translate-y-1/2"
							data-cy="carousel-next"
							direction="next"
							isDisabled={nextIndex === null}
							onPress={() => nextIndex !== null && onNavigate(nextIndex)}
							placement="over"
						/>
					</>
				) : null}
			</div>

			{/*
			 * Says which picture you landed on, once, after the move settles. Off
			 * while the slideshow is running: a region that announces itself every
			 * four seconds makes the rest of the page unusable with a screen reader.
			 */}
			<span
				aria-live={isPlaying ? "off" : "polite"}
				className="sr-only"
			>
				{count > 0 ? `${index + 1} of ${count}${images[index]?.alt ? `: ${images[index].alt}` : ""}` : ""}
			</span>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * One picture in the track, or the empty field at the end of a deck that does
 * not loop - the slot still has to exist there, or the two beside it collapse
 * and the drag has nothing to pull against.
 */
function CarouselSlide({
	count,
	image,
	isCurrent,
	slideNumber,
}: {
	count: number;
	image?: CarouselImage;
	isCurrent: boolean;
	slideNumber: number;
}) {
	/*
	 * The empty end of a non-looping deck. A slot with no picture is not a slide
	 * and must not be announced as one - it exists only so the two beside it keep
	 * their positions and the drag has something to pull against.
	 */
	if (!image) return <div className="h-full w-full shrink-0" />;

	return (
		// biome-ignore lint/a11y/useSemanticElements: the rule offers <fieldset>, which is a form control container. A slide is a named region, which is what role="group" plus aria-roledescription is for.
		<div
			aria-hidden={!isCurrent}
			aria-label={`${slideNumber} of ${count}`}
			aria-roledescription="slide"
			className="flex h-full w-full shrink-0 items-center justify-center"
			role="group"
		>
			<img
				alt={image.alt}
				className="h-full w-full object-contain"
				decoding="async"
				draggable={false}
				src={image.src}
			/>
		</div>
	);
}
