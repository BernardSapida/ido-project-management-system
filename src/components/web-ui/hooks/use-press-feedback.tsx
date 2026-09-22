import { type ReactNode, type PointerEvent as ReactPointerEvent, useCallback, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { useMediaQuery } from "./use-media-query";

/**
 * Which half of the press response an element gets.
 *
 * They are separable because they answer different questions. The scale is the
 * ACKNOWLEDGEMENT - "the press landed" - and it has to be under 100ms or it
 * reads as lag. The ripple is the LOCATION - "it landed here" - and it is only
 * worth drawing on a surface big enough for "here" to be ambiguous. A 32px icon
 * button wants `scale`; a full-width list row wants `both`.
 */
export type PressEffect = "both" | "none" | "ripple" | "scale";

/**
 * How far the surface gives under the press.
 *
 * `firm` is the default because most press targets are buttons and tiles, where
 * 2% is too small to register. Use `soft` on anything wider than ~400px - a
 * full-width card shrinking by 4% does not read as a press, it reads as the
 * card collapsing.
 */
export type PressIntensity = "firm" | "soft";

const SCALE: Record<PressIntensity, string> = {
	firm: "motion-safe:active:scale-[0.96] motion-safe:data-[pressed]:scale-[0.96]",
	soft: "motion-safe:active:scale-[0.98] motion-safe:data-[pressed]:scale-[0.98]",
};

/**
 * Both selectors, on purpose, because neither covers every input on its own.
 *
 * `:active` is free and correct for pointers on any element, and for Space held
 * on a real `<button>` - the browser sets it. It does NOT fire for Space on a
 * `role="button"` div, which is the case `data-pressed` exists for. Applying
 * both means one class string works for both elements; on a pointer press they
 * simply agree.
 *
 * 90ms because the press response is feedback, and feedback slower than 100ms
 * is read as lag rather than as animation.
 */
const SCALE_BASE = "transition-transform duration-[90ms] ease-out";

/**
 * The reduced-motion substitute. `prefers-reduced-motion` means replace the
 * movement, not remove the state change - an element that answers a press with
 * nothing at all is the worse failure. A cross-fade is the standing swap for a
 * transform, and the global rule in `ui.css` already flattens its duration to
 * zero, so it lands instantly.
 */
const SCALE_REDUCED = "motion-reduce:active:opacity-80 motion-reduce:data-[pressed]:opacity-80";

interface Ripple {
	id: number;
	size: number;
	x: number;
	y: number;
}

/**
 * How wide the circle has to be to cover the whole box from where it started.
 *
 * From an off-centre origin the far corner is further away than half the
 * diagonal is, so the radius is the distance to the FURTHEST of the four
 * corners - the larger horizontal gap paired with the larger vertical one.
 * Getting this wrong is not subtle: press near an edge and the ripple stops in
 * open space partway across, which reads as a rendering fault rather than as a
 * press.
 *
 * Exported because it is the one piece of this hook that is pure arithmetic,
 * and arithmetic is worth pinning in a test - a jsdom element has no layout, so
 * it cannot be checked through the component.
 */
export function rippleDiameter({
	height,
	width,
	x,
	y,
}: {
	height: number;
	width: number;
	x: number;
	y: number;
}): number {
	return 2 * Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
}

export interface PressFeedbackOptions {
	effect?: PressEffect;
	intensity?: PressIntensity;
	isDisabled?: boolean;
}

export interface PressFeedback {
	/** Merge into the pressable element's own `className`. */
	pressClassName: string;
	/** Render as a child of the pressable element. `null` when there is no ripple to draw. */
	rippleLayer: ReactNode;
	/** For a press with no pointer behind it - a keyboard activation. */
	spawnFromCenter: (host: HTMLElement) => void;
	/** Call from `onPointerDown`. */
	spawnFromPointer: (event: ReactPointerEvent<HTMLElement>) => void;
}

/**
 * The press response, as a hook, so the wrapper is not the only way to get it.
 *
 * {@link AppPressable} is this hook wired to an element it owns, which covers a
 * tile, a row or any bare surface. But the components that most need a press
 * response - buttons, cards - already own their element, and wrapping one in
 * another pressable element would give it two press targets and two focus
 * rings. Those adopt the hook instead. That is also the point: the scale value
 * lives in ONE place, so a button and a card do not press by different amounts.
 *
 * Nothing here needs a motion library. The scale is a CSS transition, the
 * ripple is a CSS animation, and the only thing JavaScript contributes is where
 * to put the circle and how big it has to be.
 */
export function usePressFeedback({
	effect = "both",
	intensity = "firm",
	isDisabled = false,
}: PressFeedbackOptions = {}): PressFeedback {
	const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const [ripples, setRipples] = useState<Ripple[]>([]);
	const nextId = useRef(0);

	const wantsRipple = (effect === "both" || effect === "ripple") && !isDisabled && !prefersReducedMotion;
	const wantsScale = (effect === "both" || effect === "scale") && !isDisabled;

	/*
	 * The media query is not the only signal. HeroUI defines `motion-safe` and
	 * `motion-reduce` to fire on EITHER the OS setting or a
	 * `data-reduce-motion="true"` ancestor, so the scale above already answers to
	 * both - and a JS gate that only watched the query would turn the scale off
	 * while leaving the ripple running. Read at press time rather than
	 * subscribed: it costs one DOM walk on a press, against a MutationObserver
	 * standing by for an attribute that changes at most once a session.
	 */
	const isMotionReduced = useCallback(
		(host: HTMLElement) => prefersReducedMotion || host.closest('[data-reduce-motion="true"]') !== null,
		[prefersReducedMotion],
	);

	const add = useCallback((host: HTMLElement, x: number, y: number) => {
		/*
		 * `offsetWidth`, not `getBoundingClientRect().width`: the rect includes
		 * the press scale, so measuring the box that way during a press returns
		 * one 4% too small and the circle stops short of the corners. The layout
		 * box is the one the ripple has to cover.
		 */
		const size = rippleDiameter({ height: host.offsetHeight, width: host.offsetWidth, x, y });

		nextId.current += 1;
		const id = nextId.current;
		setRipples((current) => [...current, { id, size, x, y }]);
	}, []);

	const remove = useCallback((id: number) => {
		setRipples((current) => current.filter((ripple) => ripple.id !== id));
	}, []);

	const spawnFromPointer = useCallback(
		(event: ReactPointerEvent<HTMLElement>) => {
			/* Secondary and middle buttons open menus and paste; neither is a press. */
			if (!wantsRipple || event.button !== 0) return;

			const host = event.currentTarget;
			if (isMotionReduced(host)) return;

			const rect = host.getBoundingClientRect();

			/*
			 * `:active` may already have applied by the time this reads the rect -
			 * asking for a rect flushes style - so the box can be the SCALED one
			 * while the pointer coordinates are in untransformed page space.
			 * Dividing the two out again puts the origin back under the finger;
			 * without it the ripple drifts toward the centre by half the scale.
			 */
			const scale = host.offsetWidth > 0 ? rect.width / host.offsetWidth : 1;

			add(host, (event.clientX - rect.left) / scale, (event.clientY - rect.top) / scale);
		},
		[add, isMotionReduced, wantsRipple],
	);

	const spawnFromCenter = useCallback(
		(host: HTMLElement) => {
			if (!wantsRipple || isMotionReduced(host)) return;
			add(host, host.offsetWidth / 2, host.offsetHeight / 2);
		},
		[add, isMotionReduced, wantsRipple],
	);

	const pressClassName = cn(
		/* The layer is absolute and sits at a negative z; both need the host to
		   be positioned and to be its own stacking context, or the ripple paints
		   behind the page instead of behind the label. */
		wantsRipple && "relative isolate",
		wantsScale && SCALE_BASE,
		wantsScale && SCALE[intensity],
		wantsScale && SCALE_REDUCED,
	);

	const rippleLayer = wantsRipple ? (
		<span
			aria-hidden="true"
			className="press-ripple-layer"
		>
			{ripples.map((ripple) => (
				<span
					className="press-ripple"
					key={ripple.id}
					onAnimationEnd={() => remove(ripple.id)}
					style={{ height: ripple.size, left: ripple.x, top: ripple.y, width: ripple.size }}
				/>
			))}
		</span>
	) : null;

	return { pressClassName, rippleLayer, spawnFromCenter, spawnFromPointer };
}
