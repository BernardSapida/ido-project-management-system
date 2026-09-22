import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppButton } from "../AppButton";
import { cn } from "../../lib/cn";

interface CarouselNavButtonProps {
	className?: string;
	"data-cy"?: string;
	direction: "next" | "previous";
	isDisabled: boolean;
	onPress: () => void;
	/**
	 * Over the picture, or beside it. The glass treatment is only for `over` -
	 * frosting a button that sits on the page background is a frame around
	 * nothing.
	 */
	placement: "beside" | "over";
}

/**
 * One step through the deck.
 *
 * Its own component because the inline carousel draws these over the picture
 * and the viewer draws them either side of it, and everything except that one
 * decision is the same: the same glyph, the same name, the same 44px target,
 * and the same disabled rule at the ends of a deck that does not loop.
 *
 * Disabled rather than hidden at those ends. A control that disappears takes
 * its own position with it - the picture shifts, and the button the user was
 * about to press for the OTHER direction moves under their cursor.
 */
export function CarouselNavButton({
	className,
	"data-cy": dataCy,
	direction,
	isDisabled,
	onPress,
	placement,
}: CarouselNavButtonProps) {
	const isNext = direction === "next";

	return (
		<AppButton
			aria-label={isNext ? "Next image" : "Previous image"}
			className={cn(
				"size-11 shrink-0 rounded-full",
				placement === "over" && "glass-strong border-0 shadow-soft",
				className,
			)}
			data-cy={dataCy}
			icon={isNext ? ChevronRight : ChevronLeft}
			isDisabled={isDisabled}
			isIconOnly
			onPress={onPress}
			variant={placement === "over" ? "ghost" : "tertiary"}
		/>
	);
}
