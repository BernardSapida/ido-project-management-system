import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

type TileSize = "lg" | "md" | "sm";

/**
 * There used to be two tones, `hero` and `warm`.
 *
 * `warm` is gone and this type is what is left of it. It was a second brand
 * gradient kept for "when two tiles sit side by side and need to differ" - a
 * requirement that never actually arrived, against a real cost: a second ramp
 * to solve, clamp and re-measure on all eight palettes and both themes, for a
 * distinction nobody could name. One brand gradient, one contrast guarantee.
 *
 * The attribute below survives its removal on purpose, so the design-reference
 * spec keeps a selector for "is this a brand tile" rather than losing its only
 * hook when the second value went.
 */
type TileTone = "brand";

const TILE: Record<TileSize, string> = {
	lg: "h-12 w-12 rounded-2xl",
	md: "h-11 w-11 rounded-2xl",
	sm: "h-10 w-10 rounded-xl",
};

const ICON: Record<TileSize, string> = {
	lg: "h-6 w-6",
	md: "h-5 w-5",
	sm: "h-5 w-5",
};

interface GradientIconTileProps {
	className?: string;
	icon: LucideIcon;
	/**
	 * What the tile is sitting on. Defaults to the page, which is every card,
	 * dialog and list in the app.
	 *
	 * `"brand-surface"` is for the one case that needs saying: a tile ON a brand
	 * panel. The default fill is the brand fill, so on a brand panel it is the
	 * same colour as its background - 1.00:1, visible only by its shadow. There
	 * is no automatic version of this; CSS cannot see what is behind an element,
	 * and a caller putting a tile on a brand panel knows that it is.
	 */
	on?: "brand-surface" | "page";
	size?: TileSize;
}

/**
 * The rounded gradient square holding a white icon that sits on nearly every
 * card.
 *
 * Deliberately NOT a HeroUI component: it is a decorative container, not a
 * control. It has no press behaviour and must never be given any - if
 * something here needs to be clickable, wrap it in a Button instead.
 */
export function AppGradientIconTile({ className, icon: Icon, on = "page", size = "md" }: GradientIconTileProps) {
	const tone: TileTone = "brand";

	return (
		<div
			className={cn(
				"grid shrink-0 place-items-center shadow-glow",
				on === "brand-surface" ? "brand-surface-inverse" : "gradient-brand",
				TILE[size],
				className,
			)}
			/* Size and tone as data. They are otherwise only in a class name, and
			   the design-reference lab is the one page where every size is on
			   screen together. */
			data-tile-size={size}
			data-tile-tone={tone}
		>
			{/* No colour here. `gradient-brand` sets `color` alongside its
			    background, and that pairing is the accessible part: the glyph has to
			    be near-white on the light theme's deep fill and near-black on the
			    dark theme's pale one, which a hard-coded `text-white` cannot do. */}
			<Icon
				aria-hidden="true"
				className={ICON[size]}
			/>
		</div>
	);
}
