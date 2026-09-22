import { cn } from "../../lib/cn";

type BackdropVariant = "app" | "auth" | "landing";

interface Blob {
	className: string;
	delay?: string;
}

/**
 * The animated gradient blobs behind every page.
 *
 * Deliberately NOT a HeroUI component: this is decorative background with no
 * HeroUI equivalent - it renders no content, no text and no interactive
 * element. Values are per variant.
 *
 * The parent must be `relative overflow-hidden`; the blobs are positioned
 * outside their container's bounds and will otherwise create a horizontal
 * scrollbar at narrow widths.
 *
 * ## One hue, separated by opacity - not three
 *
 * Every blob is `--brand-primary` now. They were three different steps of the
 * brand ramp (`--brand-bright`, `--brand-deep`, primary), and the hue travel
 * between them was the effect: two blurred circles of different colours overlap
 * into a third.
 *
 * That was a real effect and this is deliberately a quieter one. A background
 * carrying three brand hues is three colours a designer has to keep in agreement
 * for something nobody is meant to look AT, and it is the only place in the
 * system where the brand appeared as a ramp rather than as a colour. Depth here
 * comes from opacity, size and position instead, which are the three channels
 * that survive a brand being one colour.
 *
 * The opacities are unchanged from when each blob had its own hue, so the stack
 * keeps its weight distribution - the difference is that overlaps now deepen the
 * same colour rather than mixing towards a new one.
 */
const BLOBS: Record<BackdropVariant, Blob[]> = {
	app: [
		{
			className: "bg-primary/40 w-[500px] h-[500px] top-[-150px] right-[-150px]",
		},
		{
			className: "bg-primary/30 w-[400px] h-[400px] bottom-[-100px] left-[-100px]",
			delay: "-5s",
		},
	],
	auth: [
		{
			className: "bg-primary/60 w-[500px] h-[500px] top-[-100px] left-[-100px]",
		},
		{
			className: "bg-primary/50 w-[420px] h-[420px] bottom-[-100px] right-[-120px]",
			delay: "-6s",
		},
	],
	landing: [
		{
			className: "bg-primary/60 w-[500px] h-[500px] top-[-100px] left-[-100px]",
		},
		{
			className: "bg-primary/50 w-[420px] h-[420px] top-[30%] right-[-120px]",
			delay: "-4s",
		},
		{
			className: "bg-primary/40 w-[380px] h-[380px] bottom-[-100px] left-[30%]",
			delay: "-8s",
		},
	],
};

interface AppBackdropProps {
	className?: string;
	variant: BackdropVariant;
}

export function AppBackdrop({ className, variant }: AppBackdropProps) {
	return (
		<div
			aria-hidden="true"
			className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
		>
			{BLOBS[variant].map((blob) => (
				<div
					className={cn("blob", blob.className)}
					key={blob.className}
					style={blob.delay ? { animationDelay: blob.delay } : undefined}
				/>
			))}
		</div>
	);
}
