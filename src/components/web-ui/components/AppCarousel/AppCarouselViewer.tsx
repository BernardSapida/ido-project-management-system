import type { KeyboardEvent } from "react";
import { useId } from "react";
import { AppModal } from "../AppModal";
import { cn } from "../../lib/cn";
import { AppCarouselStage } from "./AppCarouselStage";
import { AppCarouselThumbs } from "./AppCarouselThumbs";
import { CarouselNavButton } from "./CarouselNavButton";
import type { CarouselImage, CarouselIndicator } from "./carousel.types";
import { neighbourIndex } from "./carousel.types";

export interface AppCarouselViewerProps {
	className?: string;
	"data-cy"?: string;
	images: CarouselImage[];
	/** Controlled: the viewer is a second window onto the caller's index, never a copy of it. */
	index: number;
	indicator?: CarouselIndicator;
	isLooping?: boolean;
	isOpen: boolean;
	/** Names the gallery. Becomes the modal's heading, so it says what these pictures are OF. */
	label: string;
	onClose: () => void;
	onIndexChange: (index: number) => void;
}

/**
 * The same deck, big, on top of the page.
 *
 * ## Why the arrows move outside the picture
 *
 * The inline carousel puts them over the picture because it has 400px of width
 * and cannot spend 100 of it on furniture. Here there is room, and the reason
 * to take it is that this surface exists for LOOKING: a control sitting on top
 * of the photograph is covering the thing the user opened the viewer to see,
 * and on a picture with a pale edge it also becomes the hardest kind of button
 * to see. Outside, nothing is hidden and nothing has to be frosted.
 *
 * On a phone there is no outside, so they move UNDER the picture, into the
 * thumb zone, either side of the counter. That is a better place for them than
 * the middle of the screen anyway - the top corners of a phone are where the
 * close button goes, and the bottom third is where the hands are.
 *
 * ## It is an AppModal, not a new overlay
 *
 * Focus trapping, the escape route, the scroll lock, the return of focus to the
 * picture that opened it, and the dev-time guard against two of these at once
 * are all already solved there, and AppModal is explicitly the surface for
 * "something to LOOK at, full size, without losing the page behind it". A
 * hand-rolled lightbox is how an app ends up with two focus traps that behave
 * differently.
 */
export function AppCarouselViewer({
	className,
	"data-cy": dataCy,
	images,
	index,
	indicator = "thumbnails",
	isLooping = false,
	isOpen,
	label,
	onClose,
	onIndexChange,
}: AppCarouselViewerProps) {
	const baseId = useId();
	const stageId = `${baseId}-stage`;
	const count = images.length;

	const previousIndex = neighbourIndex(index, -1, count, isLooping);
	const nextIndex = neighbourIndex(index, 1, count, isLooping);
	const hasStrip = indicator !== "none" && count > 1;

	/*
	 * Left and right anywhere in the viewer, not only on the strip. The strip
	 * handles its own arrows and calls preventDefault, so this never fires twice
	 * for one press.
	 */
	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.defaultPrevented) return;

		if (event.key === "ArrowLeft" && previousIndex !== null) {
			event.preventDefault();
			onIndexChange(previousIndex);
		}

		if (event.key === "ArrowRight" && nextIndex !== null) {
			event.preventDefault();
			onIndexChange(nextIndex);
		}
	}

	return (
		<AppModal
			data-cy={dataCy}
			/* The caption is on the picture; repeating it here would be the same line twice, 500px apart. */
			description={count > 0 ? `${index + 1} of ${count}` : undefined}
			isOpen={isOpen}
			onClose={onClose}
			size="cover"
			title={label}
		>
			{/* The arrow keys belong to the whole viewer, not to one control inside it. */}
			<div
				className={cn("flex h-full flex-col items-center justify-center gap-4", className)}
				onKeyDown={handleKeyDown}
			>
				<div className="flex w-full items-center justify-center gap-4">
					<CarouselNavButton
						className="max-sm:hidden"
						data-cy="viewer-previous"
						direction="previous"
						isDisabled={previousIndex === null}
						onPress={() => previousIndex !== null && onIndexChange(previousIndex)}
						placement="beside"
					/>

					{/*
					 * Sized off the VIEWPORT HEIGHT rather than the width it is given,
					 * because this is the one place a square is at risk of not fitting:
					 * a full-width square on a laptop is taller than the window, and the
					 * user would have to scroll a photo viewer to see the bottom of the
					 * photo.
					 *
					 * The 22rem is everything else in the dialog MEASURED - header,
					 * footer, the strip, the gaps and the dialog's own padding - not
					 * guessed at a fraction of the height. A fraction that fits a 900px
					 * window puts the thumbnails under the fold on a 720px one, which is
					 * the shape of every laptop; at 21rem the strip was still 7px short.
					 */}
					<AppCarouselStage
						className="w-[min(calc(100dvh-22rem),34rem)] max-w-full"
						data-cy="viewer-stage"
						id={stageId}
						images={images}
						index={index}
						isLooping={isLooping}
						isPlaying={false}
						navPlacement="outside"
						onNavigate={onIndexChange}
					/>

					<CarouselNavButton
						className="max-sm:hidden"
						data-cy="viewer-next"
						direction="next"
						isDisabled={nextIndex === null}
						onPress={() => nextIndex !== null && onIndexChange(nextIndex)}
						placement="beside"
					/>
				</div>

				{/* The phone's controls: within reach, and either side of the count they change. */}
				{count > 1 ? (
					<div className="flex items-center gap-6 sm:hidden">
						<CarouselNavButton
							data-cy="viewer-previous-mobile"
							direction="previous"
							isDisabled={previousIndex === null}
							onPress={() => previousIndex !== null && onIndexChange(previousIndex)}
							placement="beside"
						/>
						<span className="text-sm font-medium text-muted tabular-nums">
							{index + 1} / {count}
						</span>
						<CarouselNavButton
							data-cy="viewer-next-mobile"
							direction="next"
							isDisabled={nextIndex === null}
							onPress={() => nextIndex !== null && onIndexChange(nextIndex)}
							placement="beside"
						/>
					</div>
				) : null}

				{hasStrip ? (
					<AppCarouselThumbs
						baseId={baseId}
						className="max-w-full"
						data-cy="viewer-thumbs"
						images={images}
						index={index}
						isLooping={isLooping}
						kind={indicator}
						label={label}
						onSelect={onIndexChange}
						stageId={stageId}
					/>
				) : null}
			</div>
		</AppModal>
	);
}
