import { Popover, Tooltip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import { AppButton } from "../AppButton";

type Placement = ComponentProps<typeof Tooltip.Content>["placement"];

interface RichTooltipAction {
	label: string;
	onPress: () => void;
}

interface AppRichTooltipProps {
	/** Optional call to action at the foot of the card. */
	action?: RichTooltipAction;
	/** The trigger. Must be focusable - a Button, a Link, never a bare div. */
	children: ReactNode;
	/**
	 * Test hook on the card. It carries `data-surface` too - which of the two
	 * surfaces this instance became is the decision the whole component exists
	 * to make, and it is otherwise only visible in how it behaves.
	 */
	"data-cy"?: string;
	description: string;
	icon: LucideIcon;
	placement?: Placement;
	/** Optional ticked list between the description and the action. */
	points?: string[];
	title: string;
}

/**
 * The enriched tooltip: a gradient icon tile, a title, a description, an
 * optional tick list and an optional action.
 *
 * HeroUI's Tooltip is the right thing for a one-line label and the wrong thing
 * for this. Two reasons this is its own component rather than a fat `content`
 * prop on AppTooltip:
 *
 * 1. A tooltip that can contain a button is not a tooltip. React Aria's tooltip
 *    closes as soon as the pointer leaves the trigger, so a button inside one
 *    is unclickable, and its content is not in the tab order. When there is an
 *    action, this renders a Popover instead - same card, real focus management,
 *    dismissable with Escape.
 * 2. Tooltips do not exist on touch. There is no hover, so a hover-only
 *    disclosure is simply invisible to every phone user. On a coarse pointer
 *    this becomes a Popover the user can tap, which is why the trigger has to
 *    be a real focusable control either way.
 *
 * So: hover/focus tooltip on a mouse with no action, tap-and-Escape popover
 * otherwise. The card body is identical, which is the point.
 */
export function AppRichTooltip({
	action,
	children,
	"data-cy": dataCy,
	description,
	icon,
	placement = "top",
	points,
	title,
}: AppRichTooltipProps) {
	const isCoarsePointer = useIsCoarsePointer();
	const card = (
		<RichTooltipCard
			action={action}
			description={description}
			icon={icon}
			points={points}
			title={title}
		/>
	);

	if (action || isCoarsePointer) {
		return (
			<Popover>
				<Popover.Trigger>{children}</Popover.Trigger>
				<Popover.Content
					className="max-w-xs rounded-3xl border-0 p-0 shadow-soft"
					data-cy={dataCy}
					data-surface="popover"
					placement={placement}
				>
					<Popover.Arrow />
					<Popover.Dialog className="p-0">{card}</Popover.Dialog>
				</Popover.Content>
			</Popover>
		);
	}

	/* Raw Tooltip, deliberately. This is AppTooltip's sibling, not its caller -
	   both are built on the same primitive, the way AppDialog and AppModal both
	   build on Modal. AppTooltip is one sentence; this one holds a heading, a body
	   and actions, and nesting it inside AppTooltip would mean fighting a layout
	   designed to refuse exactly that. */
	return (
		<Tooltip
			closeDelay={100}
			delay={200}
		>
			{children}
			{/*
			 * max-w-xs, not a free-growing panel: a tooltip that stretches to its
			 * longest line becomes a banner nobody can read across.
			 *
			 * break-normal undoes HeroUI's `break-all` on the tooltip base, which
			 * hyphenates mid-word ("the car / d flips") as soon as the text wraps.
			 * The Popover branch never had it, so without this the same card reads
			 * differently on a mouse and on a phone.
			 */}
			<Tooltip.Content
				className="max-w-xs break-normal rounded-3xl border-0 bg-surface p-0 text-foreground shadow-soft"
				data-cy={dataCy}
				data-surface="tooltip"
				placement={placement}
				showArrow
			>
				<Tooltip.Arrow />
				{card}
			</Tooltip.Content>
		</Tooltip>
	);
}

interface RichTooltipCardProps {
	action?: RichTooltipAction;
	description: string;
	icon: LucideIcon;
	points?: string[];
	title: string;
}

/** The body, shared by both surfaces so the two can never drift apart. */
function RichTooltipCard({ action, description, icon: Icon, points, title }: RichTooltipCardProps) {
	return (
		<div className="space-y-3 p-4 text-left">
			{/* The same tile recipe as the banner and AppGradientIconTile. */}
			<span className="grid size-9 place-items-center rounded-2xl shadow-[0_6px_14px_-8px_var(--brand-primary)] gradient-brand">
				<Icon
					aria-hidden="true"
					// No colour: the "gradient-brand" tile around it sets its own paired
					// foreground, and that pairing is the accessible part.
					className="size-4.5"
				/>
			</span>
			<div className="space-y-1">
				<p className="text-sm font-semibold text-foreground">{title}</p>
				<p className="text-sm leading-relaxed text-muted">{description}</p>
			</div>
			{points && points.length > 0 && (
				<ul className="space-y-1.5">
					{points.map((point) => (
						<li
							className="flex items-start gap-2 text-sm text-foreground"
							key={point}
						>
							<CheckGlyph />
							<span className="min-w-0">{point}</span>
						</li>
					))}
				</ul>
			)}
			{action && (
				<AppButton
					fullWidth
					onPress={action.onPress}
					size="sm"
					variant="primary"
				>
					{action.label}
				</AppButton>
			)}
		</div>
	);
}

function CheckGlyph() {
	return (
		<svg
			aria-hidden="true"
			className="mt-0.5 size-4 shrink-0 text-accent"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2.5"
			viewBox="0 0 24 24"
		>
			<title>Included</title>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

/**
 * True where hover does not exist - phones and tablets.
 *
 * Resolved after mount rather than during render: the server has no matchMedia,
 * and guessing wrong would mean the markup React hydrates into does not match
 * what the server sent. Starting false means a touch device renders the tooltip
 * branch for one frame; the swap to a Popover is invisible because neither is
 * open yet.
 */
function useIsCoarsePointer(): boolean {
	const [isCoarse, setIsCoarse] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(hover: none)");
		setIsCoarse(query.matches);

		const onChange = (event: MediaQueryListEvent) => setIsCoarse(event.matches);
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);

	return isCoarse;
}
