import type { KeyboardEvent } from "react";
import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn";
import type { CarouselImage } from "./carousel.types";
import { carouselTabId, prefersReducedMotion, resolveIndex } from "./carousel.types";

interface AppCarouselThumbsProps {
	/** The id every tab is derived from. Shared with the stage, which they name. */
	baseId: string;
	className?: string;
	"data-cy"?: string;
	images: CarouselImage[];
	index: number;
	isLooping: boolean;
	kind: "dots" | "thumbnails";
	label: string;
	onSelect: (index: number) => void;
	/** The stage these pick for. */
	stageId: string;
}

/**
 * Where you are in the deck, and the fastest way to anywhere else.
 *
 * Tabs, not a row of buttons. The relationship is exactly the one `role="tab"`
 * describes - one of these is selected, it governs the region below, and the
 * arrow keys move between them - and spelling it out is what gives the strip a
 * single tab stop instead of eighty. Tab reaches the strip, the arrows move
 * inside it, Tab leaves. Eighty individual tab stops between the gallery and
 * the Add to basket button is the most common keyboard defect a gallery has.
 *
 * Selecting as the arrow moves - rather than waiting for Enter - is the right
 * call here because the panel is one picture that is already decoded. Nobody
 * arrows through a gallery to reach the fifth picture without looking at the
 * three in between.
 *
 * The thumbnails letterbox exactly as the stage does. A cropped thumbnail is a
 * miniature of a picture the carousel will not show, which turns the strip into
 * a set of small lies about what pressing them gets you.
 */
export function AppCarouselThumbs({
	baseId,
	className,
	"data-cy": dataCy,
	images,
	index,
	isLooping,
	kind,
	label,
	onSelect,
	stageId,
}: AppCarouselThumbsProps) {
	const stripRef = useRef<HTMLDivElement>(null);
	const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

	/*
	 * Keeps the selected thumbnail in view when the deck was moved from
	 * somewhere else - an arrow, a swipe, the slideshow. Scrolled by hand rather
	 * than with scrollIntoView, which also scrolls the PAGE to bring the strip
	 * into view and yanks the picture out of the viewport when the carousel is
	 * halfway down a long page. Nothing moves while the thumbnail is already
	 * fully visible, so a strip of five never twitches.
	 */
	useEffect(() => {
		const strip = stripRef.current;
		const tab = tabsRef.current[index];
		if (!strip || !tab) return;

		const isFullyVisible =
			tab.offsetLeft >= strip.scrollLeft && tab.offsetLeft + tab.clientWidth <= strip.scrollLeft + strip.clientWidth;
		if (isFullyVisible) return;

		strip.scrollTo({
			behavior: prefersReducedMotion() ? "auto" : "smooth",
			left: tab.offsetLeft - strip.clientWidth / 2 + tab.clientWidth / 2,
		});
	}, [index]);

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		const target = {
			ArrowLeft: index - 1,
			ArrowRight: index + 1,
			End: images.length - 1,
			Home: 0,
		}[event.key];

		if (target === undefined) return;

		event.preventDefault();

		const next = resolveIndex(target, images.length, isLooping);
		onSelect(next);
		tabsRef.current[next]?.focus();
	}

	return (
		<div
			aria-label={`${label} images`}
			className={cn(
				/*
				 * `shrink-0` because the viewer puts this in a full-height flex column:
				 * without it the strip is the first thing the layout takes height from,
				 * and eighty pixels of thumbnail compress to a row of coloured lines.
				 */
				"shrink-0",
				kind === "thumbnails"
					? /*
						 * The `p-1` and the `gap-3` are both the selected ring's clearance.
						 * It is drawn 4px outside the thumbnail, and a scroll container
						 * clips on BOTH axes - so with the old gap-2 the ring ran under the
						 * next thumbnail and was cut off top and bottom by the scrollport.
						 *
						 * `w-fit max-w-full mx-auto` is how the strip centres under the
						 * picture, and it is deliberately not `justify-center`. Centring the
						 * CONTENT of a scroll container puts the overflow on both sides at
						 * once, and `scrollLeft` cannot go below zero - so a deck of twenty
						 * would centre its middle and leave the first thumbnails permanently
						 * unreachable. Sizing the BOX to its content instead means a short
						 * strip shrinks and the auto margins centre it, while a long one hits
						 * `max-w-full`, fills the width and scrolls from its first thumbnail
						 * exactly as before.
						 */
						"mx-auto flex w-fit max-w-full gap-3 overflow-x-auto scroll-smooth p-1"
					: "flex flex-wrap items-center justify-center gap-0",
				className,
			)}
			data-cy={dataCy}
			onKeyDown={handleKeyDown}
			ref={stripRef}
			role="tablist"
		>
			{images.map((image, position) => {
				const isSelected = position === index;
				/* The picture is the label; its alt text is the only real name it has. */
				const name = image.alt || image.caption || `Image ${position + 1}`;

				return (
					<button
						aria-controls={stageId}
						aria-selected={isSelected}
						className={cn(
							"shrink-0 cursor-pointer rounded-xl transition",
							"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
							kind === "thumbnails"
								? "size-16 overflow-hidden border border-border bg-muted-surface sm:size-20"
								: /*
									 * 24×28 rather than the 44px square a standalone control gets.
									 * A row of dots reads as ONE control, and spacing six of them at
									 * a thumb's width each puts 250px of nothing under a 400px
									 * picture - it stops looking like an indicator for the frame
									 * above it. It still clears the 24px minimum, and the dots are
									 * never the only way to move: the arrows, the swipe and the
									 * arrow keys all do the same job at full size.
									 */
									"flex h-7 w-6 items-center justify-center",
							/*
							 * Selection is a ring AND full opacity, because a ring alone is a
							 * colour, and a colour on its own is invisible to about one man in
							 * twelve. The unselected thumbnails are held back rather than the
							 * selected one being lit, so the strip does not glow.
							 */
							kind === "thumbnails" &&
								(isSelected
									? "opacity-100 ring-2 ring-primary ring-offset-2 ring-offset-background"
									: "opacity-60 hover:opacity-100"),
						)}
						id={carouselTabId(baseId, position)}
						key={carouselTabId(baseId, position)}
						onClick={() => onSelect(position)}
						ref={(element) => {
							tabsRef.current[position] = element;
						}}
						role="tab"
						/* One tab stop for the strip: the selected thumbnail is the way in, the arrows do the rest. */
						tabIndex={isSelected ? 0 : -1}
						type="button"
					>
						{kind === "thumbnails" ? (
							<img
								alt=""
								className="h-full w-full object-contain"
								decoding="async"
								draggable={false}
								loading="lazy"
								src={image.thumbnailSrc ?? image.src}
							/>
						) : (
							<span
								aria-hidden="true"
								className={cn(
									"size-2.5 rounded-full transition",
									isSelected ? "scale-125 bg-primary" : "bg-border hover:bg-muted",
								)}
							/>
						)}
						<span className="sr-only">{name}</span>
					</button>
				);
			})}
		</div>
	);
}
