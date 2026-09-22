import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StepperStep } from "./AppStepper";
import { AppStepper } from "./AppStepper";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. That
 * is a real limit here: `onStepChange` firing on a click is not reachable, so
 * what is pinned instead is WHICH steps got a button at all, which is the half
 * that decides whether a user can skip an unvalidated step.
 *
 * The two rules with the most room to regress are the ones with no visual tell
 * until a specific width or a specific step count, so both are pinned by class:
 *
 * - The label wrapper is `w-full`. Drop it and nothing breaks until a label is
 *   wider than its column, at which point it prints over its neighbour rather
 *   than truncating - the column is `items-center`, so without a width the div
 *   sizes to its own text and `min-w-0`/`truncate` never engage.
 * - Four steps or fewer keep the circles at every width and render no bar. Five
 *   or more still collapse under `sm`.
 *
 * NOT covered, and the first thing to write when a DOM arrives: that a click on
 * a completed circle calls `onStepChange` with that index, and that the rail
 * and the marker actually transition rather than repaint.
 */

function stepsOf(count: number): StepperStep[] {
	return Array.from({ length: count }, (_, index) => ({
		key: `step-${index}`,
		label: `Step ${index + 1}`,
	}));
}

/** The `class` of the circles nav, which is where the compact rule shows up. */
function navClass(markup: string) {
	return /<nav[^>]*class="([^"]*)"/.exec(markup)?.[1] ?? "";
}

describe("AppStepper", () => {
	describe("compact runs keep their circles", () => {
		it("renders no progress bar at four steps or fewer", () => {
			const markup = renderToStaticMarkup(<AppStepper currentStep={1} steps={stepsOf(4)} />);

			expect(markup).toContain('data-compact="true"');
			expect(markup).not.toContain('data-rendering="bar"');
			expect(markup).toContain('data-rendering="circles"');
		});

		it("does not hide the circles below sm at four steps or fewer", () => {
			const markup = renderToStaticMarkup(<AppStepper currentStep={0} steps={stepsOf(4)} />);

			// `block`, not `hidden sm:block` - the row has to survive a phone.
			expect(navClass(markup)).toBe("block");
		});

		it("still collapses to the bar at five steps", () => {
			const markup = renderToStaticMarkup(<AppStepper currentStep={2} steps={stepsOf(5)} />);

			expect(markup).toContain('data-compact="false"');
			expect(markup).toContain('data-rendering="bar"');
			expect(navClass(markup)).toBe("hidden sm:block");
		});

		it("counts the bar in steps, not percent", () => {
			const markup = renderToStaticMarkup(<AppStepper currentStep={2} steps={stepsOf(7)} />);

			expect(markup).toContain('max="7"');
			expect(markup).toContain('value="3"');
		});
	});

	describe("labels", () => {
		it("gives the label wrapper a width to truncate inside", () => {
			const markup = renderToStaticMarkup(<AppStepper currentStep={0} steps={stepsOf(6)} />);

			expect(markup).toContain('class="w-full min-w-0 px-1"');
			expect(markup).toContain("truncate");
		});

		it("keeps per-step descriptions off the phone", () => {
			const steps: StepperStep[] = [
				{ description: "Who you are", key: "about", label: "About" },
				{ key: "done", label: "Done" },
			];
			const markup = renderToStaticMarkup(<AppStepper currentStep={0} steps={steps} />);

			// A compact row has no bar to carry the description instead, so the
			// only correct answer below sm is not to show it.
			expect(markup).toContain('class="mt-0.5 hidden text-xs text-muted sm:block"');
		});
	});

	describe("currentStep", () => {
		it("clamps an index past the end to the last step", () => {
			const markup = renderToStaticMarkup(<AppStepper currentStep={9} steps={stepsOf(4)} />);

			expect(markup).toContain('data-current="3"');
		});

		it("clamps a negative index to the first step", () => {
			const markup = renderToStaticMarkup(<AppStepper currentStep={-4} steps={stepsOf(4)} />);

			expect(markup).toContain('data-current="0"');
		});
	});

	describe("backwards navigation", () => {
		it("is off entirely without onStepChange", () => {
			const markup = renderToStaticMarkup(<AppStepper currentStep={3} steps={stepsOf(5)} />);

			expect(markup).not.toContain("<button");
		});

		it("offers a button for completed steps only, never the current or upcoming ones", () => {
			const markup = renderToStaticMarkup(
				<AppStepper currentStep={2} onStepChange={() => undefined} steps={stepsOf(5)} />,
			);

			// Steps 1 and 2 are done; 3 is current and 4-5 have not been validated.
			expect(markup.match(/<button/g)).toHaveLength(2);
			expect(markup).toContain("Go back to Step 1");
			expect(markup).toContain("Go back to Step 2");
			expect(markup).not.toContain("Go back to Step 3");
			expect(markup).not.toContain("Go back to Step 4");
		});
	});
});
