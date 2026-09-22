import { Card } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

type GlassStrength = "glass" | "glass-strong";

interface GlassCardProps extends Omit<ComponentProps<typeof Card>, "children"> {
	children: ReactNode;
	className?: string;
	/** `glass-strong` is the frosted panel used for content cards; `glass` is the lighter chip-like surface. */
	strength?: GlassStrength;
}

/**
 * A HeroUI Card wearing the frosted glass surface.
 *
 * Styling only - no behaviour, no data. It exists so the glass recipe is
 * expressed once rather than on every call site, and so a later change to it is
 * a single edit. A caller's `className` still wins, since `cn()` merges last.
 *
 * This is the PLAIN SURFACE - a box to put anything in. When the thing inside is
 * one subject with a title, a description and maybe actions, that is
 * {@link AppCard} instead, which lays those out the same way every time. Reach
 * for this when the content has its own shape: a dashboard tile, a lab section,
 * a form panel.
 */
export function AppGlassCard({ children, className, strength = "glass-strong", ...props }: GlassCardProps) {
	return (
		<Card
			className={cn(strength, "rounded-3xl border-0", className)}
			{...props}
		>
			{children}
		</Card>
	);
}

/*
 * HeroUI's structural slots, re-exported off the surface that replaced its Card.
 *
 * `Card` itself is lint-banned, which would otherwise take `Card.Content` and
 * `Card.Header` with it and leave a plain surface with no way to use the padding
 * and spacing rules those carry. Hanging them here keeps the one import that a
 * call site is allowed to make sufficient.
 */
AppGlassCard.Content = Card.Content;
AppGlassCard.Description = Card.Description;
AppGlassCard.Footer = Card.Footer;
AppGlassCard.Header = Card.Header;
AppGlassCard.Title = Card.Title;
