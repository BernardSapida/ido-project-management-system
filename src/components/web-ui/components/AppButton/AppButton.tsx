import { Button, buttonVariants, Spinner } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Check, Timer } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import type { HoldSpeed } from "../../hooks/use-hold-to-confirm";
import { HOLD_DURATION_MS, useHoldToConfirm } from "../../hooks/use-hold-to-confirm";
import { cn } from "../../lib/cn";
import type { AppTooltipTone } from "../AppTooltip";
import { AppTooltip } from "../AppTooltip";

type ButtonSize = NonNullable<ComponentProps<typeof Button>["size"]>;
type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>;

/**
 * Glyph size per button size, so a button never has an icon taller than its
 * label. Every call site used to hard-code `size-4`, which left a large button
 * wearing a small button's icon.
 */
const ICON_SIZE: Record<ButtonSize, string> = {
	lg: "size-5",
	md: "size-4",
	sm: "size-3.5",
};

interface AppButtonBaseProps {
	/**
	 * For a button that OPENS something - a drawer, a menu, a dialog.
	 *
	 * Explicit rather than a `...rest` spread, which is what this component
	 * deliberately does not have: the constrained surface is why an icon-only
	 * button cannot forget its name. But a button that opens a dialog has to say
	 * so, and the migration off raw HeroUI Buttons found one that already did -
	 * converting it without this would have quietly dropped the attribute and
	 * left a screen-reader user with no warning that pressing it opens anything.
	 */
	"aria-haspopup"?: "dialog" | "grid" | "listbox" | "menu" | "tree" | true;
	/**
	 * Disclosure state, for a button that shows and hides a region.
	 *
	 * Paired with `aria-controls`, which names the region it governs. Both are
	 * here for the same reason as `aria-haspopup`: without them a disclosure
	 * button is impossible to build on this component, so every one in the app
	 * reached past it for a raw HeroUI Button - and a wrapper that cannot express
	 * a common control is a wrapper people route around.
	 */
	"aria-controls"?: string;
	"aria-expanded"?: boolean;
	/**
	 * Toggle state, for a button that stays on - a collapse control, a preset
	 * that is currently applied.
	 *
	 * If the toggle is the button's whole purpose, {@link AppToggleButton} is the
	 * better component: it makes the state required rather than optional. This is
	 * for the ones where pressing is the point and the state is a detail.
	 */
	"aria-pressed"?: boolean;
	/** Points at the hint or error text that explains this button. */
	"aria-describedby"?: string;
	/**
	 * Test hook. The button also carries `data-async-pending`, which is the
	 * pending flag as a boolean a spec can assert `false` on. Our own name,
	 * because HeroUI's Button emits a `data-pending` that is PRESENT while
	 * pending and removed otherwise - an attribute that vanishes rather than
	 * turning false is one a spec cannot wait for.
	 */
	"data-cy"?: string;
	autoFocus?: boolean;
	className?: string;
	/**
	 * The mobile default for a form's submit: a thumb aims at a bar, not at a
	 * 96px pill in the corner.
	 */
	fullWidth?: boolean;
	/**
	 * A lucide component, not an element. Passing the component rather than
	 * `<Plus className="size-4" />` is what lets this size the glyph against the
	 * button and mark it `aria-hidden` - a decorative icon beside a label that is
	 * announced twice is the most common button a11y defect here.
	 */
	icon?: LucideIcon;
	/** `end` for a glyph that means "onward" - a chevron on a Next. */
	iconPosition?: "start" | "end";
	isDisabled?: boolean;
	/**
	 * Held open by the caller. Only for a pending state this button does not own
	 * - a form submitting through react-hook-form, say. An `onPress` that returns
	 * a promise needs nothing here; see below.
	 */
	isPending?: boolean;
	size?: ButtonSize;
	variant?: ButtonVariant;
}

interface LabelledProps {
	"aria-label"?: string;
	children: ReactNode;
	isIconOnly?: false;
}

interface IconOnlyProps {
	/**
	 * Required, and that is the point of splitting the type. An icon-only button
	 * has no text to announce, so without this it reaches a screen reader as an
	 * unnamed control - and it cannot be hovered for a tooltip either. Making it
	 * a type error is the only version of this rule that survives a deadline.
	 */
	"aria-label": string;
	children?: never;
	icon: LucideIcon;
	isIconOnly: true;
}

/**
 * Turns the button into a press-and-hold confirmation.
 *
 * **This is not a replacement for AppDialog, and choosing between them is the
 * whole decision.** A hold has nowhere to put a sentence: it can say "hold to
 * delete" and nothing else. So it fits the action whose consequence the user
 * already understands from where they are standing - the trash glyph on a row,
 * the Revoke beside a key they just read the name of. The moment the answer
 * depends on something the button cannot show - how many members lose access,
 * that the invoices go too, which of three projects this actually is - the
 * dialog wins, because that sentence IS the confirmation and a hold silently
 * drops it.
 *
 * What it buys where it does fit: no modal, no context switch, no second click
 * on a screen the user is working through at speed, and no "Are you sure?"
 * charged to everyone for the one person who missed. What it costs: it is
 * invisible until tried, which is what the tooltip and the too-short-tap hint
 * are for - and it is still not a substitute for undo. If the action can be
 * reversed, act immediately and put Undo in the toast instead of asking for two
 * seconds of the user's thumb.
 */
export interface HoldToConfirm {
	/**
	 * The verb, lower case, as it completes "Hold to _____": `"delete"`,
	 * `"revoke this key"`. It is the tooltip's title and the label of the hint
	 * shown after a tap too short to be a hold, so it has to read as an
	 * instruction rather than as a noun.
	 */
	action: string;
	/**
	 * Replaces the label once the action has SUCCEEDED - "Deleted!". Omit it and
	 * only the glyph changes, which is the right choice for a button whose width
	 * sits in a row with others.
	 *
	 * It is never shown for a rejected promise, and it is not a substitute for
	 * the toast: this button is usually about to be unmounted along with the row
	 * it deleted, so the confirmation that outlives the action has to be queued
	 * by the caller.
	 */
	confirmedLabel?: string;
	/** `fast` 800ms · `default` 2s · `slow` 4s · or an explicit millisecond count. */
	speed?: HoldSpeed | number;
}

interface ActionProps {
	/**
	 * Require a press-and-hold instead of a click, and fire `onPress` only when
	 * it completes. See {@link HoldToConfirm} for when this beats a dialog and
	 * when it quietly loses to one.
	 */
	hold?: HoldToConfirm;
	/**
	 * Return a promise and the button owns its own pending state: it disables for
	 * the life of the promise and swaps the icon for a spinner, so a slow request
	 * cannot be fired twice by an impatient second click. That guard is the single
	 * most common thing missing from a hand-rolled async button.
	 *
	 * The rejection is deliberately NOT swallowed - what a failure should say
	 * belongs to the caller, where AppToast.error and the error's message are.
	 * But it must be caught THERE: react-aria does not await the handler, so an
	 * error left to propagate becomes an unhandled rejection.
	 */
	onPress?: () => void | Promise<void>;
	to?: never;
	type?: "button" | "reset" | "submit";
}

interface NavigationProps {
	hold?: never;
	onPress?: never;
	/**
	 * Renders a link that LOOKS like a button, rather than a button inside a link.
	 *
	 * Wrapping is the trap this closes: `<Link><Button/></Link>` nests one
	 * interactive element inside another, which is two tab stops for one target
	 * and an anchor whose accessible name a screen reader reads twice. Five
	 * screens in this app did it before this prop existed.
	 */
	to: string;
	type?: never;
}

export type AppButtonProps = AppButtonBaseProps & (LabelledProps | IconOnlyProps) & (ActionProps | NavigationProps);

/**
 * Every button in the app: variants, sizes, icons, icon-only, async and links.
 *
 * The variants are semantic, not decorative. `primary` is the one action moving
 * the user forward and there is at most one per view, `tertiary` dismisses,
 * `danger` destroys, `danger-soft` is the destructive action that is not the
 * point of the screen. Picking one by how it looks is how a page ends up with
 * three primaries and no answer to "what do I press".
 *
 * Two things here cannot be got wrong by omission, which is why they are in the
 * type rather than in a comment: an icon-only button must carry an `aria-label`,
 * and a button that navigates must be a link. Everything else is a pass-through
 * to HeroUI.
 *
 * `hold` is the one prop that changes what pressing MEANS - the click stops
 * firing the action and a sustained press starts it instead. Read
 * {@link HoldToConfirm} before reaching for it; it is a narrower tool than it
 * looks, and a dialog is the right answer more often than not.
 */
export function AppButton(props: AppButtonProps) {
	const {
		autoFocus,
		className,
		"data-cy": dataCy,
		fullWidth = false,
		icon: Icon,
		iconPosition = "start",
		isDisabled = false,
		isPending: isPendingProp = false,
		size = "md",
		variant = "primary",
	} = props;

	const isIconOnly = props.isIconOnly === true;
	const [isAwaiting, setIsAwaiting] = useState(false);
	const [isTooltipOpen, setIsTooltipOpen] = useState(false);

	const hold = props.to === undefined ? props.hold : undefined;
	const holdDurationMs = resolveHoldDuration(hold?.speed);
	const {
		holdRef,
		isHinting,
		onPressEnd,
		onPressStart,
		phase: holdPhase,
	} = useHoldToConfirm({
		durationMs: holdDurationMs,
		isDisabled: isDisabled || isPendingProp,
		onConfirm: props.to === undefined ? props.onPress : undefined,
	});

	const isPending = isPendingProp || isAwaiting || holdPhase === "working";
	const isConfirmed = holdPhase === "confirmed";

	/*
	 * Only a handler that actually returns a promise turns the spinner on. A
	 * synchronous onPress would otherwise flash it for one frame on every press,
	 * which reads as the interface stuttering rather than working.
	 *
	 * In hold mode this fires and does nothing on purpose: the press still ends
	 * in a click, and the action belongs to the hold that completed, not to the
	 * release that happens whether it completed or not.
	 */
	async function handlePress() {
		if (props.to !== undefined || hold) return;
		const result = props.onPress?.();
		if (!(result instanceof Promise)) return;
		setIsAwaiting(true);
		try {
			await result;
		} finally {
			setIsAwaiting(false);
		}
	}

	/*
	 * A confirmed hold swaps the glyph even when the button had none, because
	 * the tick is the only feedback an icon-only button can give - its label is
	 * an aria-label nobody sees.
	 */
	const Glyph = isConfirmed ? Check : Icon;

	/*
	 * The spinner takes the ICON's place, never the label's: the width holds, so
	 * a row of buttons does not reflow the moment one of them is pressed.
	 */
	const glyph = isPending ? (
		<Spinner
			color="current"
			size="sm"
		/>
	) : Glyph ? (
		<Glyph
			aria-hidden="true"
			className={cn("shrink-0", ICON_SIZE[size])}
		/>
	) : null;

	const label = isConfirmed && hold?.confirmedLabel ? hold.confirmedLabel : props.children;

	const content = (
		<>
			{iconPosition === "start" && glyph}
			{!isIconOnly && label}
			{iconPosition === "end" && glyph}
		</>
	);

	if (props.to !== undefined) {
		return (
			<Link
				aria-label={props["aria-label"]}
				className={cn(buttonVariants({ fullWidth, isIconOnly, size, variant }), className)}
				data-cy={dataCy}
				to={props.to}
			>
				{content}
			</Link>
		);
	}

	const button = (
		<Button
			aria-controls={props["aria-controls"]}
			aria-describedby={props["aria-describedby"]}
			aria-expanded={props["aria-expanded"]}
			aria-haspopup={props["aria-haspopup"]}
			aria-label={props["aria-label"]}
			aria-pressed={props["aria-pressed"]}
			autoFocus={autoFocus}
			className={cn(hold && "button--hold", className)}
			data-async-pending={isPending}
			data-cy={dataCy}
			data-hold-phase={hold ? holdPhase : undefined}
			fullWidth={fullWidth}
			isDisabled={isPending || isDisabled}
			isIconOnly={isIconOnly}
			isPending={isPending}
			onPress={handlePress}
			onPressEnd={hold ? onPressEnd : undefined}
			onPressStart={hold ? onPressStart : undefined}
			ref={hold ? holdRef : undefined}
			size={size}
			/*
			 * A hold button is NEVER a submit. Suppressing our own onPress does
			 * not suppress the native click that react-aria still lets through,
			 * so a `type="submit"` here would post the form on the first tap -
			 * the exact click this component exists to refuse to act on.
			 */
			type={hold ? "button" : props.type}
			variant={variant}
		>
			{content}
		</Button>
	);

	if (!hold) return button;

	/*
	 * The tooltip is not optional decoration on this button, it is the label of
	 * the interaction: a control that ignores clicks and explains itself nowhere
	 * is indistinguishable from a broken one. react-aria wires it as the
	 * button's accessible description, so it is read out rather than only drawn.
	 *
	 * It is controlled because it has a second job - see `isHinting`. A tooltip
	 * cannot open on touch, and a phone user who taps and sees nothing has no
	 * other way to find out that this button wants a hold.
	 */
	return (
		<AppTooltip
			description={`Keep pressing for ${formatSeconds(holdDurationMs)}. Let go to cancel.`}
			icon={Timer}
			isOpen={isTooltipOpen || isHinting}
			onOpenChange={setIsTooltipOpen}
			title={`Hold to ${hold.action}`}
			tone={TOOLTIP_TONE[variant]}
		>
			{button}
		</AppTooltip>
	);
}

/**
 * The tooltip's glyph takes the BUTTON's colour, never the brand.
 *
 * A red Delete button with a brand-primary glyph in its tooltip is two
 * differently-coloured marks reading as two different subjects, and it spends the
 * one moment the hint has to say "this one destroys something" saying "this is
 * our product" instead. Only the danger pair carries a hue of its own - the
 * other five are the brand or neutral - so this map is the whole rule.
 */
const TOOLTIP_TONE: Record<ButtonVariant, AppTooltipTone> = {
	danger: "danger",
	"danger-soft": "danger",
	ghost: "brand",
	outline: "brand",
	primary: "brand",
	secondary: "brand",
	tertiary: "brand",
};

function resolveHoldDuration(speed: HoldSpeed | number | undefined): number {
	if (typeof speed === "number") return speed;
	return HOLD_DURATION_MS[speed ?? "default"];
}

/** "0.8 seconds" / "2 seconds" - never "2000ms", which is not a unit users think in. */
function formatSeconds(ms: number): string {
	const seconds = Math.round(ms / 100) / 10;
	return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
}
