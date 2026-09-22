import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppPressable } from "./AppPressable";

/**
 * What this file can and cannot check.
 *
 * There is no DOM here - see `vitest.config.ts` for why one cannot currently be
 * installed - so these are assertions about the MARKUP the component produces,
 * not about what it does when pressed. That covers the decisions that are
 * structural: which element it renders, whether that element is reachable and
 * announced, and whether the ripple layer exists at all.
 *
 * NOT covered, and worth writing the moment a DOM is available here:
 *
 * - `onPress` firing on click, and NOT firing when disabled.
 * - The native-button key contract on the `div` branch: Enter acts on the way
 *   down, Space acts on RELEASE so that moving away mid-press is an escape.
 * - `data-pressed` appearing while Space is held and clearing on blur.
 * - A ripple being spawned on pointerdown and removed on animationend.
 *
 * Those are the behaviours most likely to regress, and their absence here is a
 * gap in coverage rather than a judgement that they do not matter.
 */
describe("AppPressable markup", () => {
	it("renders a real button by default, typed so it cannot submit a form", () => {
		const html = renderToStaticMarkup(<AppPressable>Press</AppPressable>);
		expect(html).toContain("<button");
		expect(html).toContain('type="button"');
	});

	it('renders a focusable, announced div when as="div"', () => {
		/*
		 * The div branch exists for content a <button> may not hold. If it ever
		 * loses the role or the tab stop it becomes decoration that looks like a
		 * control - unreachable by keyboard and silent to a screen reader.
		 */
		const html = renderToStaticMarkup(<AppPressable as="div">Press</AppPressable>);
		expect(html).toContain("<div");
		expect(html).toContain('role="button"');
		expect(html).toContain('tabindex="0"');
	});

	it("disables the button branch natively", () => {
		const html = renderToStaticMarkup(<AppPressable isDisabled>Press</AppPressable>);
		expect(html).toContain("disabled");
	});

	it("takes the div branch out of the tab order and says so when disabled", () => {
		const html = renderToStaticMarkup(
			<AppPressable
				as="div"
				isDisabled
			>
				Press
			</AppPressable>,
		);
		expect(html).toContain('aria-disabled="true"');
		expect(html).toContain('tabindex="-1"');
	});

	it("looks pressable, and looks unpressable when it is", () => {
		expect(renderToStaticMarkup(<AppPressable>Press</AppPressable>)).toContain("cursor-pointer");
		expect(renderToStaticMarkup(<AppPressable isDisabled>Press</AppPressable>)).toContain("cursor-not-allowed");
	});

	it("carries a focus ring on both branches", () => {
		expect(renderToStaticMarkup(<AppPressable>Press</AppPressable>)).toContain("focus-visible:outline-focus");
		expect(renderToStaticMarkup(<AppPressable as="div">Press</AppPressable>)).toContain(
			"focus-visible:outline-focus",
		);
	});

	describe("the ripple layer", () => {
		/*
		 * The layer is what clips the ripple to the caller's radius, so its
		 * presence is the difference between a circle cut to the corners and a
		 * square one overflowing them. It must also be ABSENT when there is no
		 * ripple - an empty clipping layer is a stacking context and a paint
		 * boundary charged to every press target that opted out.
		 */
		it("is present for the effects that draw one", () => {
			expect(renderToStaticMarkup(<AppPressable effect="both">Press</AppPressable>)).toContain(
				"press-ripple-layer",
			);
			expect(renderToStaticMarkup(<AppPressable effect="ripple">Press</AppPressable>)).toContain(
				"press-ripple-layer",
			);
		});

		it("is absent for the effects that do not", () => {
			expect(renderToStaticMarkup(<AppPressable effect="scale">Press</AppPressable>)).not.toContain(
				"press-ripple-layer",
			);
			expect(renderToStaticMarkup(<AppPressable effect="none">Press</AppPressable>)).not.toContain(
				"press-ripple-layer",
			);
		});

		it("is absent when disabled, whatever the effect asks for", () => {
			const html = renderToStaticMarkup(
				<AppPressable
					effect="both"
					isDisabled
				>
					Press
				</AppPressable>,
			);
			expect(html).not.toContain("press-ripple-layer");
		});
	});

	describe("the scale", () => {
		it("is applied only under motion-safe, with the reduced-motion fade beside it", () => {
			/*
			 * Both halves matter. A bare `active:scale-*` would keep moving for
			 * someone who asked it not to; dropping the fade would leave that person
			 * with a control that answers a press with nothing at all.
			 */
			const html = renderToStaticMarkup(<AppPressable effect="scale">Press</AppPressable>);
			expect(html).toContain("motion-safe:active:scale-[0.96]");
			expect(html).toContain("motion-reduce:active:opacity-80");
		});

		it("moves less at soft than at firm", () => {
			expect(renderToStaticMarkup(<AppPressable intensity="soft">Press</AppPressable>)).toContain("scale-[0.98]");
			expect(renderToStaticMarkup(<AppPressable intensity="firm">Press</AppPressable>)).toContain("scale-[0.96]");
		});

		it("is dropped entirely when disabled", () => {
			const html = renderToStaticMarkup(<AppPressable isDisabled>Press</AppPressable>);
			expect(html).not.toContain("scale-[0.96]");
		});
	});
});
