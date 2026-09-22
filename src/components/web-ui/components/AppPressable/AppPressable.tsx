import type {
	KeyboardEvent as ReactKeyboardEvent,
	MouseEvent as ReactMouseEvent,
	ReactNode,
	PointerEvent as ReactPointerEvent,
} from "react";
import { useState } from "react";
import { type PressEffect, type PressIntensity, usePressFeedback } from "../../hooks/use-press-feedback";
import { cn } from "../../lib/cn";

const FOCUS_RING =
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus focus-visible:outline-solid";

/**
 * A `<button>` defaults to `cursor: default` and a div to the text caret, so
 * without this the one thing on the page that answers a press is also the one
 * thing that does not look pressable before you touch it. `not-allowed` on the
 * disabled branch for the same reason in reverse: the surface still looks like
 * a control, and the cursor is the only warning that it is not one.
 */
const CURSOR = { disabled: "cursor-not-allowed", enabled: "cursor-pointer" };

interface AppPressableProps {
	/**
	 * Required when the content is not text - an icon tile, a thumbnail. A
	 * pressable surface with no accessible name is a control a screen reader
	 * announces as "button", which is every button on the page.
	 */
	"aria-label"?: string;
	/**
	 * `button` unless the content contains something else interactive.
	 *
	 * A `<button>` may not contain a link or another button - it is invalid HTML
	 * and the inner control becomes unreachable - so a pressable CARD holding a
	 * "Read more" link has to be the div. The div is not the default because it
	 * costs real behaviour to rebuild: focusability, Enter, Space, and the
	 * pressed look while Space is held, all of which the button gets from the
	 * browser. Reach for it when the content forces it, not by preference.
	 */
	as?: "button" | "div";
	children: ReactNode;
	className?: string;
	/** Test hook. */
	"data-cy"?: string;
	effect?: PressEffect;
	intensity?: PressIntensity;
	isDisabled?: boolean;
	onPress?: () => void;
}

/**
 * A surface that answers a press - a scale, a ripple from where the pointer
 * landed, or both.
 *
 * For the things that are NOT already components: a tile, a list row, a
 * selectable card, a swatch. It owns its element rather than wrapping one,
 * which is the part that is easy to get backwards. Wrapping an `AppButton` in
 * this would nest a button inside a button, produce two focus rings, and put
 * the ripple's clip on the OUTER box - so it would miss the button's own
 * corners, because `border-radius: inherit` reads the parent's radius and the
 * radius here would be on the child. Components with their own element take
 * {@link usePressFeedback} instead.
 *
 * The radius is handled and needs nothing from the caller: the ripple is
 * clipped by a layer that inherits whatever radius this element has, so
 * `rounded-full`, `rounded-t-xl` and a plain square all clip correctly. The one
 * case it approximates is a THICK border - the clip sits on the padding box
 * while the inherited radius was measured on the border box, which leaves a
 * hairline gap at each corner. Invisible at 1px, which is every border in this
 * package.
 *
 * It draws nothing of its own - no background, no padding, no radius. Those are
 * the caller's, and the ripple follows them.
 */
export function AppPressable({
	"aria-label": ariaLabel,
	as = "button",
	children,
	className,
	"data-cy": dataCy,
	effect = "both",
	intensity = "firm",
	isDisabled = false,
	onPress,
}: AppPressableProps) {
	const { pressClassName, rippleLayer, spawnFromCenter, spawnFromPointer } = usePressFeedback({
		effect,
		intensity,
		isDisabled,
	});
	const [isSpaceHeld, setIsSpaceHeld] = useState(false);

	const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
		if (isDisabled) return;
		spawnFromPointer(event);
	};

	const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
		if (isDisabled) return;

		/*
		 * `detail` counts the clicks behind the event, so zero means nothing was
		 * clicked - the browser synthesised this from Enter or Space on a real
		 * button. There are no coordinates on such an event (`clientX` is 0, which
		 * is a real position, not a missing one), so the ripple has to start from
		 * the middle rather than from the top-left corner.
		 */
		if (event.detail === 0) spawnFromCenter(event.currentTarget);
		onPress?.();
	};

	const className_ = cn(isDisabled ? CURSOR.disabled : CURSOR.enabled, FOCUS_RING, pressClassName, className);

	if (as === "button") {
		return (
			<button
				aria-label={ariaLabel}
				className={className_}
				data-cy={dataCy}
				disabled={isDisabled}
				onClick={handleClick}
				onPointerDown={handlePointerDown}
				type="button"
			>
				{children}
				{rippleLayer}
			</button>
		);
	}

	/*
	 * Everything below is what the `<button>` branch got for free. A div fires no
	 * click of its own from the keyboard, so Enter and Space are handled here -
	 * and they are NOT the same key. Enter acts on the way down; Space acts on
	 * release, so that holding it and moving away is an escape rather than a
	 * commitment. That is the native button contract, and a control that breaks
	 * it is one a keyboard user cannot back out of.
	 */
	const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
		if (isDisabled || event.repeat) return;

		if (event.key === "Enter") {
			event.preventDefault();
			spawnFromCenter(event.currentTarget);
			onPress?.();
			return;
		}

		if (event.key === " ") {
			/* Unclaimed, Space scrolls the page under the control being pressed. */
			event.preventDefault();
			setIsSpaceHeld(true);
			spawnFromCenter(event.currentTarget);
		}
	};

	const handleKeyUp = (event: ReactKeyboardEvent<HTMLElement>) => {
		if (event.key !== " ") return;
		setIsSpaceHeld(false);
		if (!isDisabled) onPress?.();
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: the semantic element is the other branch of this component, and is the default. This branch exists for the case a <button> cannot serve - content holding a link or another control, which a button may not contain - so swapping it for one would make the inner control unreachable. Focus, Enter, Space and the pressed state are all rebuilt below.
		<div
			aria-disabled={isDisabled || undefined}
			aria-label={ariaLabel}
			className={className_}
			data-cy={dataCy}
			/* Space on a div never sets `:active`, so the pressed look is state. */
			data-pressed={isSpaceHeld || undefined}
			/* Tabbing away mid-press leaves the surface stuck in its pressed look. */
			onBlur={() => setIsSpaceHeld(false)}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onKeyUp={handleKeyUp}
			onPointerDown={handlePointerDown}
			role="button"
			tabIndex={isDisabled ? -1 : 0}
		>
			{children}
			{rippleLayer}
		</div>
	);
}
