import { Chip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

type ChipSize = ComponentProps<typeof Chip>["size"];

export type ChipTone = "default" | "accent" | "success" | "warning" | "danger";
/** `soft` is the tinted pill for dense lists; `solid` is the filled one. */
export type ChipEmphasis = "soft" | "solid";

/** Icon size per chip size, so a chip never has a glyph taller than its text. */
const ICON: Record<NonNullable<ChipSize>, string> = {
	lg: "size-4",
	md: "size-3.5",
	sm: "size-3",
};

/**
 * `icon` and `label` are both required, which is one of two reasons this exists
 * over HeroUI's Chip. A chip is the smallest label in the app and usually the
 * only thing in its table cell: a bare word carries no category, and a glyph
 * with no word is a rebus.
 *
 * The other reason is colour. This does NOT forward `color` or `variant` to
 * HeroUI, so none of the `.chip--*` rules apply; the tone comes from a flat
 * `.chip-{emphasis}-{tone}` pair in styles.css. HeroUI's own chip colours are
 * translucent and derived through several `color-mix` hops declared in four
 * different theme scopes, which means the same chip renders differently
 * depending on the surface behind it - a row of identical "Done" chips could
 * come out part green, part pink. Ours are flat and opaque.
 */
interface AppChipProps {
	className?: string;
	"data-cy"?: string;
	emphasis?: ChipEmphasis;
	icon: LucideIcon;
	label: string;
	size?: ChipSize;
	tone?: ChipTone;
}

export function AppChip({
	className,
	"data-cy": dataCy,
	emphasis = "soft",
	icon: Icon,
	label,
	size = "md",
	tone = "default",
}: AppChipProps) {
	return (
		<Chip
			className={cn("gap-1 border-0", `chip-${emphasis}-${tone}`, className)}
			data-cy={dataCy}
			/* Tone and emphasis as data. They are otherwise only in a class name,
			   and a spec asserting on `chip-soft-danger` is asserting on styling. */
			data-emphasis={emphasis}
			data-tone={tone}
			size={size}
		>
			{/*
			 * The glyph is decoration: the label beside it already says the same
			 * thing, so announcing it again would double every chip in a table.
			 */}
			<Icon
				aria-hidden="true"
				className={cn("shrink-0", ICON[size])}
			/>
			<Chip.Label>{label}</Chip.Label>
		</Chip>
	);
}
