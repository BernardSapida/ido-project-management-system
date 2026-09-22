import { Description, Label, Radio, RadioGroup } from "@heroui/react";
import type { PointerEvent } from "react";
import { useState } from "react";
import { cn } from "../../lib/cn";
import type { RatingSize } from "./RatingStar";
import { RatingStar } from "./RatingStar";

interface AppStarRatingProps {
	className?: string;
	"data-cy"?: string;
	/** Names the group for a screen reader and heads the control. Required. */
	label: string;
	/** Helper text under the stars. */
	description?: string;
	/** Uncontrolled starting value. 0 means unrated. */
	defaultValue?: number;
	isDisabled?: boolean;
	/** Whole stars only - see the note on half stars below. */
	max?: number;
	/** Submitted name when the rating sits in a real form. */
	name?: string;
	onChange?: (value: number) => void;
	size?: RatingSize;
	/** Controlled value. 0 means unrated. */
	value?: number;
}

/** How wide the press target is. Every size clears 44px on touch except `sm`. */
const HIT_AREA: Record<RatingSize, string> = {
	lg: "min-h-12 min-w-12",
	md: "min-h-11 min-w-11",
	sm: "min-h-9 min-w-9",
};

/**
 * The rating INPUT: five stars you press.
 *
 * Deliberately not the same component as AppRatingSummary with a `readOnly`
 * prop. A summary is an average someone else produced - a figure, not a control
 * - and bolting a disabled state onto this one leaves a thing the keyboard
 * still stops on and a screen reader still calls a radio group.
 *
 * Hover fills the stars up to the cursor BEFORE the click, because a widget
 * that only repaints after the press makes the user press to find out what they
 * were about to pick. The preview and the value are two separate pieces of
 * state: if hover wrote into the value, dragging across the row would rewrite
 * the rating on every star and the caption under it would flicker on a gesture
 * that has committed to nothing. Mouse-out drops the preview and the stars snap
 * back to what was actually chosen.
 *
 * The keyboard needs no preview layer of its own: a radio group selects as it
 * moves, so arrowing along the row fills the stars as it goes and the user is
 * never picking blind. That is also why this is a real RadioGroup rather than
 * five buttons - one tab stop, arrow keys, and "one of these" announced once.
 *
 * Half stars are display-only (AppRatingSummary renders true fractions). A
 * ten-position target split across five glyphs cannot be hit reliably with a
 * thumb, and there is no sane way to name the halves for a screen reader.
 */
export function AppStarRating({
	className,
	"data-cy": dataCy,
	defaultValue = 0,
	description,
	isDisabled = false,
	label,
	max = 5,
	name,
	onChange,
	size = "md",
	value,
}: AppStarRatingProps) {
	const [internalValue, setInternalValue] = useState(defaultValue);
	const [preview, setPreview] = useState<null | number>(null);

	const current = value ?? internalValue;
	/* The preview wins while it exists; the value is what is left when it goes. */
	const display = preview ?? current;

	const commit = (next: number) => {
		if (isDisabled) return;
		if (value === undefined) setInternalValue(next);
		onChange?.(next);
	};

	/*
	 * Mouse only. On touch the pointer "enters" the star it is already tapping,
	 * so previewing there paints a rating the user has not chosen and leaves it
	 * painted - there is no pointer to move away.
	 */
	const previewOn = (star: number) => (event: PointerEvent) => {
		if (event.pointerType === "mouse" && !isDisabled) setPreview(star);
	};

	const stars = Array.from({ length: max }, (_, index) => index + 1);

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<RadioGroup
				className="gap-0.5! flex-nowrap!"
				data-cy={dataCy}
				isDisabled={isDisabled}
				name={name}
				onChange={(next) => commit(Number(next))}
				onPointerLeave={() => setPreview(null)}
				orientation="horizontal"
				/* No radio carries "", so this is the unrated state. */
				value={current > 0 ? String(current) : ""}
			>
				<Label className="w-full">{label}</Label>

				{stars.map((star) => (
					<span
						key={star}
						onClick={() => {
							if (current === star) commit(0);
						}}
						/*
						 * Pressing the star that is already selected clears the rating.
						 * React Aria fires no change for a re-press of the current value,
						 * so this closure still sees it and can undo it. Five values and
						 * no way out of them is a trap the first time someone mis-taps,
						 * and "not rated" is a legitimate answer.
						 */
						onPointerEnter={previewOn(star)}
					>
						<Radio
							className="mt-0!"
							value={String(star)}
						>
							<Radio.Content
								className={cn(
									"justify-center rounded-lg transition-transform duration-150 motion-reduce:transition-none",
									"data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-offset-2 data-[focus-visible=true]:outline-focus",
									!isDisabled && "hover:scale-110 active:scale-95",
									HIT_AREA[size],
								)}
							>
								<RatingStar
									fillPercent={star <= display ? 100 : 0}
									size={size}
								/>
								{/* The one name this star has. "Star" five times says nothing. */}
								<span className="sr-only">
									{star} {star === 1 ? "star" : "stars"}
								</span>
							</Radio.Content>
						</Radio>
					</span>
				))}
			</RadioGroup>

			<div className="flex min-h-6 items-center gap-3 text-sm">
				{/*
				 * Says where the press will land before it lands. Decorative for a
				 * screen reader - the radio it belongs to announces the same number.
				 */}
				<span
					aria-hidden="true"
					className={cn("text-muted", display === 0 && "opacity-0")}
				>
					{display} of {max}
				</span>

				{/*
				 * The keyboard's route out. Re-pressing the selected star clears it
				 * too, but a radio group has no "deselect" key, so without this the
				 * only way back to unrated is a mouse.
				 */}
				{current > 0 && !isDisabled ? (
					<button
						className="cursor-pointer rounded-sm text-muted underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
						onClick={() => commit(0)}
						type="button"
					>
						Clear
					</button>
				) : null}
			</div>

			{description ? <Description>{description}</Description> : null}
		</div>
	);
}
