import { Badge } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

/** Exported so a component that owns a badge can type its own prop
 *  against this rather than reaching back into HeroUI for the union. */
export type BadgeColor = ComponentProps<typeof Badge>["color"];
type BadgeVariant = ComponentProps<typeof Badge>["variant"];
type BadgePlacement = ComponentProps<typeof Badge>["placement"];
type BadgeSize = ComponentProps<typeof Badge>["size"];

/** Every platform caps at two digits. Past that the badge stops being a count
 *  and becomes a width problem. */
const DEFAULT_MAX = 99;

interface AppBadgeProps {
	children: ReactNode;
	className?: string;
	color?: BadgeColor;
	/** A number, or a node for the cases a number cannot express. Omit it for a
	 *  dot. Numbers over `max` render as `{max}+`. */
	content?: ReactNode;
	/** Test hook on the anchor - the outermost element, which wraps both the
	 *  thing being annotated and the badge itself. */
	"data-cy"?: string;
	isInvisible?: boolean;
	/**
	 * What the badge MEANS, as a noun phrase - "unread messages", "items in your
	 * cart". Required, and that is the point.
	 *
	 * A badge is not part of its anchor's accessible name: a bell wearing a `4`
	 * is announced as "Notifications", full stop, and the number is decoration a
	 * screen reader never reaches. The component has the number but not the noun,
	 * so the noun is demanded from the caller and the two are announced together
	 * - "4 unread messages" - from visually-hidden text inside the anchor. The
	 * visible count is `aria-hidden`, so nobody hears "4" twice.
	 *
	 * For a dot this is the whole message, since there is no number to read.
	 */
	label: string;
	/** @default 99 */
	max?: number;
	placement?: BadgePlacement;
	size?: BadgeSize;
	variant?: BadgeVariant;
}

/**
 * A count or a dot pinned to the corner of whatever it wraps.
 *
 * `color` defaults to `accent` - the brand colour - rather than `danger`. A
 * badge's job is to pull the eye, and the brand colour does that without
 * claiming anything is wrong. `danger` was the old default and it made every
 * unread count read as an error: a page whose only red thing is "3 messages"
 * has spent its alarm colour on something nobody needs to fix, and by the time
 * a real failure appears the user has learned to ignore red. Reach for `danger`
 * when the count IS the problem - failed jobs, overdue invoices - and pass it
 * explicitly, which is what makes it mean something.
 *
 * `size` defaults to `sm`, overriding HeroUI's `md`. This is not a taste
 * preference: `md` is `min-h-7 min-w-7` - 28px - and the thing a badge is
 * almost always pinned to is an icon-only button, which is 40px. A 28px badge
 * covers 70% of its anchor and hides the glyph it exists to annotate, so the
 * default read as a rendering fault rather than as a count. `sm` is 16px, which
 * is the proportion every platform uses for a notification badge. `md` and `lg`
 * are still there for a large anchor - an avatar, a card, a thumbnail.
 *
 * `isInvisible` unmounts the badge rather than hiding it with opacity, so a
 * zero count is absent from the accessibility tree instead of being announced
 * as an empty element beside its anchor. It takes the hidden label with it:
 * "0 unread messages" is a thing to say, not a thing to leave lying in the
 * page for a screen reader to find.
 */
export function AppBadge({
	children,
	className,
	color = "accent",
	content,
	"data-cy": dataCy,
	isInvisible,
	label,
	max = DEFAULT_MAX,
	placement,
	size = "sm",
	variant,
}: AppBadgeProps) {
	/*
	 * Only a number can overflow. A node was chosen by the caller for a reason -
	 * an icon, a pre-formatted string - and capping it would be this component
	 * second-guessing a decision it cannot see the whole of.
	 */
	const isOverflowing = typeof content === "number" && content > max;
	const displayed = isOverflowing ? `${max}+` : content;

	/*
	 * The spoken form uses the REAL number, not the capped one. "99+ unread" is
	 * a layout compromise; there is no reason to make a screen reader inherit it
	 * when the actual figure is right here.
	 */
	const spokenCount = typeof content === "number" || typeof content === "string" ? `${content} ` : "";

	return (
		<Badge.Anchor
			className={className}
			data-cy={dataCy}
		>
			{children}
			{!isInvisible && (
				<>
					<Badge
						aria-hidden="true"
						color={color}
						data-overflowing={isOverflowing}
						placement={placement}
						size={size}
						variant={variant}
					>
						{displayed}
					</Badge>
					{/* Its own attribute rather than a `.sr-only` selector: the class is a
					    styling decision and specs are not allowed to depend on one. */}
					<span
						className="sr-only"
						data-badge-label=""
					>{`${spokenCount}${label}`}</span>
				</>
			)}
		</Badge.Anchor>
	);
}
