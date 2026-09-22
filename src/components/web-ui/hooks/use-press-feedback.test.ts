import { describe, expect, it } from "vitest";
import { rippleDiameter } from "./use-press-feedback";

/**
 * The circle has to reach the furthest corner from wherever the press landed.
 *
 * This is the one part of the ripple that can be wrong quietly. Everything else
 * either works or is obviously absent; a diameter that is too small produces a
 * ripple that stops in open space partway across the surface, which reads as a
 * half-finished render rather than as a bug in a formula. The tempting wrong
 * answers are both here as cases: half the diagonal (right only from the
 * centre) and the distance to the nearest corner.
 */
describe("rippleDiameter", () => {
	it("spans the full diagonal when the press is dead centre", () => {
		// 300x400 box, pressed in the middle: every corner is 250 away.
		expect(rippleDiameter({ height: 400, width: 300, x: 150, y: 200 })).toBe(500);
	});

	it("reaches the FAR corner when the press is off centre", () => {
		// Pressed at the top-left. The far corner is the full diagonal away, so
		// the diameter is twice that - not the diagonal itself.
		expect(rippleDiameter({ height: 400, width: 300, x: 0, y: 0 })).toBe(1000);
	});

	it("is the same from either end of an edge", () => {
		const fromLeft = rippleDiameter({ height: 400, width: 300, x: 0, y: 200 });
		const fromRight = rippleDiameter({ height: 400, width: 300, x: 300, y: 200 });
		expect(fromLeft).toBe(fromRight);
	});

	it("pairs the larger horizontal gap with the larger vertical one", () => {
		/*
		 * 100x100, pressed at (10, 90). The furthest corner is (100, 0) - the far
		 * side horizontally AND the far side vertically, which are opposite
		 * corners of the press point. Taking the nearest corner, or pairing the
		 * two gaps on the same side, both give a smaller and wrong answer.
		 */
		expect(rippleDiameter({ height: 100, width: 100, x: 10, y: 90 })).toBeCloseTo(2 * Math.hypot(90, 90), 10);
	});

	it("does not collapse on a zero-sized box", () => {
		// An element not yet laid out. Zero is the honest answer; NaN is not.
		expect(rippleDiameter({ height: 0, width: 0, x: 0, y: 0 })).toBe(0);
	});
});
