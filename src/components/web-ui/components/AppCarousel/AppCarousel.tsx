import { ImageOff } from "lucide-react";
import type { FocusEvent } from "react";
import { useEffect, useId, useState } from "react";
import { cn } from "../../lib/cn";
import { AppCarouselStage } from "./AppCarouselStage";
import { AppCarouselThumbs } from "./AppCarouselThumbs";
import { AppCarouselViewer } from "./AppCarouselViewer";
import type { CarouselImage, CarouselIndicator } from "./carousel.types";
import { useCarousel } from "./useCarousel";

export interface AppCarouselProps {
	/** Dwell per picture. Five seconds is about as fast as a caption can be read. */
	autoPlayMs?: number;
	className?: string;
	"data-cy"?: string;
	defaultIndex?: number;
	images: CarouselImage[];
	/** Controlled index. Pair with `onIndexChange`. */
	index?: number;
	indicator?: CarouselIndicator;
	/** Advances on its own. Off by default - see the pause rules in `useCarousel`. */
	isAutoPlaying?: boolean;
	/** Past the last picture is the first one, and the arrows never disable. */
	isLooping?: boolean;
	/** Pressing the picture opens it full size. On by default. */
	isZoomable?: boolean;
	/** What this gallery is OF. Names the region, and heads the viewer. Required. */
	label: string;
	onIndexChange?: (index: number) => void;
}

/**
 * A deck of pictures in a square, with the whole deck visible underneath it.
 *
 * ## The square, and why every picture keeps its own shape inside it
 *
 * The frame is square at every width and every picture is fitted whole inside
 * it - a wide photo shows its full width with the mount above and below, a tall
 * one its full height with the mount either side. See {@link AppCarouselStage},
 * which is where that decision lives and why it is not `object-cover`.
 *
 * ## Two ways to show one deck
 *
 * - **Inline** - this component. Arrows over the picture, thumbnails under it.
 *   Sized by the column it is given.
 * - **The viewer** - {@link AppCarouselViewer}, opened by pressing the picture.
 *   The same deck, as large as the window allows, with the arrows moved off the
 *   photograph.
 *
 * They share one index, so the picture you were on is the picture that opens,
 * and where you get to in the viewer is where the page is when you close it.
 * That continuity is the whole reason the viewer is part of this component
 * rather than a modal the caller wires up.
 *
 * ## What it will not do
 *
 * No captions over the picture, no crossfade between two pictures, no
 * multi-item mode showing three cards at a time. The first hides part of the
 * thing being shown, the second cannot be dragged, and the third is a scrolling
 * list wearing a carousel's controls - `AppList` in a horizontal container is
 * that, and it keeps its own semantics.
 */
export function AppCarousel({
	autoPlayMs = 5000,
	className,
	"data-cy": dataCy,
	defaultIndex = 0,
	images,
	index,
	indicator = "thumbnails",
	isAutoPlaying = false,
	isLooping = false,
	isZoomable = true,
	label,
	onIndexChange,
}: AppCarouselProps) {
	const baseId = useId();
	const stageId = `${baseId}-stage`;
	const count = images.length;

	const [isViewerOpen, setIsViewerOpen] = useState(false);

	const carousel = useCarousel({
		autoPlayMs,
		count,
		defaultIndex,
		index,
		isAutoPlaying,
		isLooping,
		onIndexChange,
	});

	/* The viewer is the same deck at a size worth looking at; running a slideshow underneath it is two decks. */
	const { suspend } = carousel;
	useEffect(() => {
		suspend(isViewerOpen);
	}, [isViewerOpen, suspend]);

	if (count === 0) return <CarouselEmpty className={className} />;

	const hasStrip = indicator !== "none" && count > 1;

	/*
	 * Hover and focus hold the slideshow. `onBlur` fires on every move BETWEEN
	 * controls inside the carousel as well as on the way out, so it checks where
	 * the focus actually went - without that, tabbing from the arrow to a
	 * thumbnail restarts the timer under the user's hands.
	 */
	function handleBlur(event: FocusEvent<HTMLElement>) {
		if (!event.currentTarget.contains(event.relatedTarget)) carousel.release();
	}

	return (
		<section
			aria-label={label}
			aria-roledescription="carousel"
			/*
			 * gap-2, not gap-4. The strip is not a second thing under the picture -
			 * it is the picture's own index, and eight pixels is close enough to read
			 * as attached to the frame while still separating the two surfaces.
			 */
			className={cn("flex w-full flex-col gap-2", className)}
			data-cy={dataCy}
			onBlur={handleBlur}
			onFocus={carousel.hold}
			onPointerEnter={carousel.hold}
			onPointerLeave={carousel.release}
		>
			<AppCarouselStage
				data-cy="carousel-stage"
				id={stageId}
				images={images}
				index={carousel.index}
				isLooping={isLooping}
				isPlaying={carousel.isPlaying}
				navPlacement="inside"
				onNavigate={carousel.goTo}
				onOpenViewer={isZoomable ? () => setIsViewerOpen(true) : undefined}
				overlay={
					count > 1 ? (
						<span className="glass-strong rounded-full px-2.5 py-1 text-xs font-medium tabular-nums">
							{carousel.index + 1} / {count}
						</span>
					) : null
				}
			/>

			{hasStrip ? (
				<AppCarouselThumbs
					baseId={baseId}
					data-cy="carousel-thumbs"
					images={images}
					index={carousel.index}
					isLooping={isLooping}
					kind={indicator}
					label={label}
					onSelect={carousel.goTo}
					stageId={stageId}
				/>
			) : null}

			{isZoomable ? (
				<AppCarouselViewer
					data-cy="carousel-viewer"
					images={images}
					index={carousel.index}
					indicator={indicator}
					isLooping={isLooping}
					isOpen={isViewerOpen}
					label={label}
					onClose={() => setIsViewerOpen(false)}
					onIndexChange={carousel.goTo}
				/>
			) : null}
		</section>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * No pictures at all.
 *
 * Holds the same square the deck would have, because the alternative - render
 * nothing - collapses the page around a gap that is about to be filled the
 * moment the images arrive, and the reader cannot tell an empty gallery from a
 * broken one.
 */
function CarouselEmpty({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-3xl",
				"border border-dashed border-border bg-muted-surface text-muted",
				className,
			)}
			data-cy="carousel-empty"
		>
			<ImageOff
				aria-hidden="true"
				className="size-6"
			/>
			<p className="text-sm">No images to show</p>
		</div>
	);
}
