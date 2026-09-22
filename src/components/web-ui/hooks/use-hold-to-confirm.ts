import { useCallback, useEffect, useRef, useState } from "react";

/**
 * How long the user has to keep pressing.
 *
 * Three named speeds rather than a free number at every call site, because the
 * number is a judgement about consequence and it should be made once. `fast` is
 * a deliberate press - long enough that a stray click cannot reach it, short
 * enough to sit on a row you use all day. `default` is the one to reach for
 * when you are not sure. `slow` is for the things that take a support ticket to
 * undo - a workspace, a billing plan, an API key another service is live on.
 *
 * Below ~600ms it stops being a confirmation: a click that lands slightly heavy
 * completes it, which is the whole failure this pattern exists to prevent.
 * Above ~4s the user assumes it is broken and lets go. A raw number is still
 * accepted for the case in between, but it should be a considered one.
 */
export const HOLD_DURATION_MS = {
	default: 2000,
	fast: 800,
	slow: 4000,
} as const;

export type HoldSpeed = keyof typeof HOLD_DURATION_MS;

/**
 * `idle` → `holding` → `working` → `confirmed` → `idle`.
 *
 * `working` only exists when the confirmed action returned a promise, and
 * `confirmed` is only ever reached when that promise RESOLVED - a rejected one
 * goes back to `idle`. That is the point of splitting them: "Deleted!" on a
 * delete that failed is worse than no feedback at all, because the user walks
 * away believing it.
 */
export type HoldPhase = "confirmed" | "holding" | "idle" | "working";

/**
 * Retreat is faster than the fill, and deliberately not symmetric with it: the
 * user has already decided to abandon the action, so making them watch four
 * seconds unwind is a punishment for changing their mind.
 */
const RETREAT_MS = 180;

/**
 * Under this, the press was a CLICK - the user did not know to hold. That is
 * the failure mode of this whole pattern, so it gets its own answer rather than
 * silently doing nothing: see `isHinting`.
 */
const TAP_MS = 350;

/** Long enough to read "Hold to delete" and try again without it vanishing. */
const HINT_MS = 1800;

/** How long the confirmed label holds before the button returns to normal. */
const CONFIRMED_MS = 1400;

/**
 * ONE CLOCK, and the frame callback's own timestamp is not it.
 *
 * `requestAnimationFrame` hands its callback the time the FRAME began, which can
 * predate the `performance.now()` captured when the press started - the handler
 * ran after the frame did. Subtracting one from the other then gives a negative
 * elapsed, so the fill paints `scaleX(-0.02)` and is simply not drawn. In a
 * browser that is a one-frame flicker; under jsdom the two clocks have different
 * origins entirely and the progress never climbs at all, so the hold never
 * completes and the button silently does nothing for ever.
 *
 * So the timestamp argument is ignored and every reading comes from
 * `performance.now()`, and the result is clamped rather than only capped - a
 * value below zero is as wrong as one above one.
 */
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export interface UseHoldToConfirmOptions {
	durationMs: number;
	isDisabled?: boolean;
	/**
	 * Fires once the hold completes. A returned promise is awaited, and only a
	 * RESOLVED one reaches the confirmed phase.
	 *
	 * The rejection is re-thrown rather than swallowed, exactly as AppButton's
	 * plain `onPress` does - what a failure should say belongs to the caller,
	 * where the toast and the error's message are. It must be caught there.
	 */
	onConfirm?: () => void | Promise<void>;
}

export interface UseHoldToConfirm {
	/**
	 * Put this on the element that draws the fill. The hook writes
	 * `--hold-progress` (0→1) onto its inline style once per frame.
	 */
	holdRef: (node: HTMLButtonElement | null) => void;
	/** The press was too short to be a hold - show the user what to do instead. */
	isHinting: boolean;
	onPressEnd: () => void;
	onPressStart: () => void;
	phase: HoldPhase;
}

/**
 * The press-and-hold confirmation, as a state machine plus one CSS variable.
 *
 * **Why a raf loop and not a CSS transition.** `ui.css` flattens every
 * `transition-duration` and `animation-duration` to 0.01ms under
 * `prefers-reduced-motion`, with `!important`. That is right for decoration and
 * fatal here: this bar is not decoration, it is the only thing telling the user
 * how much longer to keep pressing, and a CSS-driven one would snap to full
 * instantly for exactly the users least able to hold a button steady. An inline
 * style written per frame is untouched by that rule, and it costs no React
 * render - the variable goes straight onto the node.
 *
 * The handlers are react-aria's `onPressStart` / `onPressEnd`, not raw pointer
 * events, and that is what makes this reachable from a keyboard: react-aria
 * starts the press on Enter/Space keydown and ends it on keyup, ignores key
 * repeat, and ends the press when the pointer leaves the target - so dragging
 * off mid-hold cancels, for free and on every input.
 */
export function useHoldToConfirm({ durationMs, isDisabled = false, onConfirm }: UseHoldToConfirmOptions): UseHoldToConfirm {
	const nodeRef = useRef<HTMLButtonElement | null>(null);
	const frameRef = useRef(0);
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const startedAtRef = useRef(0);
	const confirmRef = useRef(onConfirm);

	const [phase, setPhaseState] = useState<HoldPhase>("idle");
	const [isHinting, setIsHinting] = useState(false);

	/*
	 * The phase is mirrored into a ref, and every GUARD reads the ref rather than
	 * the state. The hold completes inside a raf callback, which is not a React
	 * event - so between "the fill reached the end" and "the component re-rendered
	 * with the new phase" there is a window where `phase` still says `holding`,
	 * and the pointerup landing in that window would be read as an early release.
	 * That release would fire `retreat` over the top of a confirmed action and,
	 * on a fast finger, queue the too-short-tap hint for a hold that succeeded.
	 * A ref is written synchronously and closes the window entirely.
	 */
	const phaseRef = useRef<HoldPhase>("idle");
	const setPhase = useCallback((next: HoldPhase) => {
		phaseRef.current = next;
		setPhaseState(next);
	}, []);

	useEffect(() => {
		confirmRef.current = onConfirm;
	});

	const paint = useCallback((progress: number) => {
		nodeRef.current?.style.setProperty("--hold-progress", String(progress));
	}, []);

	const stopFrame = useCallback(() => {
		if (frameRef.current !== 0) cancelAnimationFrame(frameRef.current);
		frameRef.current = 0;
	}, []);

	const clearTimer = useCallback(() => {
		if (timerRef.current !== undefined) clearTimeout(timerRef.current);
		timerRef.current = undefined;
	}, []);

	/** Run the fill back to empty from wherever it got to. */
	const retreat = useCallback(() => {
		stopFrame();
		const from = Number(nodeRef.current?.style.getPropertyValue("--hold-progress") || 0);
		if (from <= 0) {
			paint(0);
			return;
		}
		const startedAt = performance.now();
		const step = () => {
			const elapsed = clamp((performance.now() - startedAt) / RETREAT_MS);
			paint(from * (1 - elapsed));
			frameRef.current = elapsed < 1 ? requestAnimationFrame(step) : 0;
		};
		frameRef.current = requestAnimationFrame(step);
	}, [paint, stopFrame]);

	const settle = useCallback(
		(didResolve: boolean) => {
			if (!didResolve) {
				setPhase("idle");
				retreat();
				return;
			}
			setPhase("confirmed");
			clearTimer();
			timerRef.current = setTimeout(() => {
				setPhase("idle");
				retreat();
			}, CONFIRMED_MS);
		},
		[clearTimer, retreat, setPhase],
	);

	const complete = useCallback(async () => {
		paint(1);

		/*
		 * A handler that throws SYNCHRONOUSLY has to be caught separately from one
		 * that rejects. Without this the throw escapes before `settle` is reached,
		 * the phase stays `holding` for ever, and the button is left dead - fill
		 * full, ignoring every later press, and reading the eventual release as an
		 * early one. Rethrown, like the rejection below, because whether the
		 * failure is announced is the caller's decision and not this hook's.
		 */
		let result: void | Promise<void>;
		try {
			result = confirmRef.current?.();
		} catch (cause) {
			settle(false);
			throw cause;
		}

		if (!(result instanceof Promise)) {
			settle(true);
			return;
		}
		setPhase("working");
		let didResolve = false;
		try {
			await result;
			didResolve = true;
		} finally {
			// `finally` rather than `catch`, so the rejection still propagates to
			// the caller - the button recovers either way, but it must not claim
			// the action succeeded.
			settle(didResolve);
		}
	}, [paint, settle]);

	const onPressStart = useCallback(() => {
		if (isDisabled || phaseRef.current === "holding" || phaseRef.current === "working") return;
		clearTimer();
		setIsHinting(false);
		setPhase("holding");
		// A press starting from `confirmed` inherits its full fill, which would
		// show for the one frame before the loop's first tick overwrites it.
		paint(0);
		const startedAt = performance.now();
		startedAtRef.current = startedAt;

		const step = () => {
			const progress = clamp((performance.now() - startedAt) / durationMs);
			paint(progress);
			if (progress < 1) {
				frameRef.current = requestAnimationFrame(step);
				return;
			}
			frameRef.current = 0;
			void complete();
		};
		frameRef.current = requestAnimationFrame(step);
	}, [clearTimer, complete, durationMs, isDisabled, paint, setPhase]);

	const onPressEnd = useCallback(() => {
		// Only a press that is still running can be released. Anything else is
		// react-aria tidying up after a hold that already completed, or after the
		// Escape below cancelled one.
		if (phaseRef.current !== "holding") return;
		stopFrame();
		const heldFor = performance.now() - startedAtRef.current;
		setPhase("idle");
		retreat();

		if (heldFor >= TAP_MS) return;
		setIsHinting(true);
		clearTimer();
		timerRef.current = setTimeout(() => setIsHinting(false), HINT_MS);
	}, [clearTimer, retreat, setPhase, stopFrame]);

	/*
	 * Escape abandons the hold without waiting for the finger to come off. It is
	 * the standing "get me out of this" key, and it is the only escape a user
	 * holding Space has - letting go is what they are trying to avoid needing to
	 * time correctly.
	 */
	useEffect(() => {
		if (phase !== "holding") return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			stopFrame();
			setPhase("idle");
			retreat();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [phase, retreat, setPhase, stopFrame]);

	useEffect(
		() => () => {
			if (frameRef.current !== 0) cancelAnimationFrame(frameRef.current);
			if (timerRef.current !== undefined) clearTimeout(timerRef.current);
		},
		[],
	);

	/*
	 * A callback ref, not an object one: the fill has to be painted back to zero
	 * when the node is REPLACED, which happens the moment a caller swaps the
	 * button's variant or key. An object ref gives no hook to do that on.
	 */
	const holdRef = useCallback((node: HTMLButtonElement | null) => {
		nodeRef.current = node;
		node?.style.setProperty("--hold-progress", "0");
	}, []);

	return { holdRef, isHinting, onPressEnd, onPressStart, phase };
}
