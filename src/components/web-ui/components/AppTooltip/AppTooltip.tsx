import { Tooltip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

type TooltipPlacement = ComponentProps<typeof Tooltip.Content>["placement"];

/**
 * A GLYPH TAKES THE COLOUR OF THE THING IT IS ABOUT, NEVER THE BRAND.
 *
 * A tooltip hanging off a red Delete button is explaining a destructive action,
 * so its icon is red. Painting it brand-primary says "this is our product" at
 * the exact moment the user needs it to say "this one destroys something", and
 * it also breaks the link between the hint and the control it belongs to - two
 * differently-coloured marks reading as two different subjects.
 *
 * Brand is the DEFAULT, not the norm: it is right for the plain "what is this?"
 * hint hanging off a neutral control, and wrong the moment the control carries a
 * status of its own. If the trigger has a tone, pass it.
 */
export type AppTooltipTone = "accent" | "brand" | "danger" | "success" | "warning";

const TONE_TEXT: Record<AppTooltipTone, string> = {
	accent: "text-accent",
	brand: "text-primary",
	danger: "text-danger",
	success: "text-success",
	warning: "text-warning",
};

interface AppTooltipProps {
	/**
	 * The trigger. Must be focusable - a Button, a Link, never a bare div.
	 *
	 * A control that is already focusable goes in as itself. Anything else - an
	 * avatar, a chip, a link that has to stay one tab stop - is wrapped in
	 * `AppTooltip.Trigger`, which is the HeroUI trigger re-exported so a call site
	 * never has to reach for the raw `Tooltip` to get it.
	 */
	children: ReactNode;
	className?: string;
	/**
	 * Test hook on the CARD, which is the only element this component owns -
	 * the trigger belongs to the caller, and it renders in a portal rather than
	 * under it.
	 */
	"data-cy"?: string;
	delay?: number;
	/** One sentence. If it needs a paragraph, reach for AppRichTooltip. */
	description: ReactNode;
	/** Defaults to Info - the right glyph for the plain "what is this?" hint. */
	icon?: LucideIcon;
	/**
	 * Controlled open state, for the rare case where something OTHER than the
	 * pointer has to show the hint.
	 *
	 * A tooltip is hover-and-focus only, so on touch it never opens at all - and
	 * a control whose instructions live exclusively in one is a control a phone
	 * user cannot work out. AppButton's hold-to-confirm is the case this exists
	 * for: a tap too short to be a hold forces the tooltip open, which is the
	 * only way that button can answer "why did nothing happen?" on a phone.
	 *
	 * Pass `onOpenChange` with it or the pointer stops working - a controlled
	 * value that nothing updates is a tooltip pinned to whatever it was given.
	 */
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	placement?: TooltipPlacement;
	showArrow?: boolean;
	title: string;
	/** The tone of the CONTROL this hangs off. See {@link AppTooltipTone}. */
	tone?: AppTooltipTone;
}

/**
 * The plain tooltip: a small inline icon, a title, and one sentence.
 *
 * The title is what makes it scannable - a bare sentence floating next to a
 * control makes the reader work out what it is answering. Anything heavier
 * (a tick list, an action, a gradient tile) is AppRichTooltip, which also knows
 * to become a Popover on touch. This one stays a real tooltip, so it must never
 * be the only place a piece of information exists.
 */
export function AppTooltip({
	children,
	className,
	"data-cy": dataCy,
	delay = 300,
	description,
	icon: Icon = Info,
	isOpen,
	onOpenChange,
	placement,
	showArrow = true,
	title,
	tone = "brand",
}: AppTooltipProps) {
	return (
		<Tooltip
			delay={delay}
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			{children}
			{/*
			 * break-normal undoes HeroUI's `break-all` on the tooltip base, which
			 * hyphenates mid-word once the content is long enough to wrap.
			 */}
			<Tooltip.Content
				className={cn("max-w-xs break-normal p-4", className)}
				data-cy={dataCy}
				placement={placement}
				showArrow={showArrow}
			>
				{showArrow && <Tooltip.Arrow />}
				<div className="flex items-start gap-2.5 text-left">
					<Icon
						aria-hidden="true"
						className={cn("mt-0.5 size-4 shrink-0", TONE_TEXT[tone])}
					/>
					<div className="space-y-0.5">
						<p className="text-sm font-semibold text-foreground">{title}</p>
						<p className="text-xs leading-relaxed text-muted">{description}</p>
					</div>
				</div>
			</Tooltip.Content>
		</Tooltip>
	);
}

/**
 * The trigger, for the cases where the child cannot simply be the control.
 *
 * Re-exported rather than re-implemented: it carries the hover, focus and
 * `aria-describedby` wiring, and it takes a `render` function, which is how a
 * trigger BECOMES an existing element instead of wrapping one. Wrapping is the
 * trap - HeroUI's trigger is a `role="button"` div, so putting it round a link
 * gives you a button containing a link and a second tab stop for every item.
 */
AppTooltip.Trigger = Tooltip.Trigger;
