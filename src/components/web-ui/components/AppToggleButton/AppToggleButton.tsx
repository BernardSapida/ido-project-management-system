import { ToggleButton } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type ToggleButtonVariant = ComponentProps<typeof ToggleButton>["variant"];
type ToggleButtonSize = ComponentProps<typeof ToggleButton>["size"];

interface AppToggleButtonBaseProps {
	className?: string;
	/**
	 * Test hook on the button. There is no companion `data-selected` here on
	 * purpose: react-aria already writes `aria-pressed` with BOTH values, so the
	 * pressed state can be asserted through the accessibility contract itself
	 * rather than through a mirror of it that could drift out of step.
	 */
	"data-cy"?: string;
	isDisabled?: boolean;
	isSelected: boolean;
	onChange: (isSelected: boolean) => void;
	size?: ToggleButtonSize;
	/**
	 * Pass-through to HeroUI - `default` or `ghost`. Deliberately NOT the seven
	 * semantic variants `AppButton` carries: those name what an action DOES to
	 * the user's data (moves them forward, dismisses, destroys), and a toggle
	 * does none of them. It flips a mode. `ghost` is the toolbar case, where the
	 * frame around it already supplies the edges.
	 */
	variant?: ToggleButtonVariant;
}

interface LabelledProps {
	"aria-label"?: string;
	children: ReactNode;
	isIconOnly?: false;
}

interface IconOnlyProps {
	/**
	 * Required, and that is the point of splitting the type. An icon-only toggle
	 * has no text to announce, so without this it reaches a screen reader as an
	 * unnamed control that also happens to have a pressed state - and it cannot
	 * be hovered for a tooltip either. `AppButton` closes this the same way;
	 * making it a type error is the only version of the rule that survives a
	 * deadline.
	 */
	"aria-label": string;
	/** The glyph. Mark it `aria-hidden` - the name comes from `aria-label`. */
	children: ReactNode;
	isIconOnly: true;
}

export type AppToggleButtonProps = AppToggleButtonBaseProps & (LabelledProps | IconOnlyProps);

/**
 * A button that stays pressed - bold, a map layer, a view mode.
 *
 * Controlled only: `isSelected` and `onChange` are both required, so the
 * pressed state always has exactly one owner. An uncontrolled toggle looks
 * identical on the first press and then silently disagrees with the state it is
 * supposed to be showing, which is the bug this shape rules out.
 *
 * Not a checkbox: a toggle button applies immediately to something visible on
 * screen, while a checkbox states an intention that a Save button later
 * commits. Not a switch either - a switch is for a setting that stays on after
 * you leave, a toggle button for a mode you flip while working.
 *
 * Exclusivity is the caller's, not this component's: a row where exactly one
 * must stay pressed is one piece of state and a handler that ignores the
 * de-select, because "aligned to nothing" is not a state a paragraph can be in.
 */
export function AppToggleButton(props: AppToggleButtonProps) {
	const { className, "data-cy": dataCy, isDisabled = false, isSelected, onChange, size, variant } = props;

	const isIconOnly = props.isIconOnly === true;

	return (
		<ToggleButton
			aria-label={props["aria-label"]}
			className={className}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isIconOnly={isIconOnly}
			isSelected={isSelected}
			onChange={onChange}
			size={size}
			variant={variant}
		>
			{props.children}
		</ToggleButton>
	);
}
