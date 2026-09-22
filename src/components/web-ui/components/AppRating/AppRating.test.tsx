import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppRatingSummary } from "./AppRatingSummary";
import { AppStarRating } from "./AppStarRating";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * hover preview, the click-to-clear and the staggered first paint are the lab's
 * to watch; what is pinned here is that the two components stay two, and the
 * structure a spec addresses.
 *
 * - `AppStarRating` is a real RadioGroup - one tab stop, a `name` for a form,
 *   and every star carries its own spoken name because "Star" five times says
 *   nothing.
 * - The Clear route out of a rating exists only while there IS a rating and the
 *   control is enabled.
 * - `AppRatingSummary` is a figure: one `role="img"` with an `aria-label`
 *   sentence, and `count === 0` is its own "No ratings yet" state, never 0.0
 *   with five empty stars.
 */

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

describe("AppStarRating", () => {
	it("names the group and every star", () => {
		const html = markup(<AppStarRating data-cy="rate" label="Rate this product" />);
		expect(html).toContain('data-cy="rate"');
		expect(html).toContain("Rate this product");
		expect(html).toContain("1 star");
		expect(html).toContain("5 stars");
		expect(html).not.toContain("6 stars");
	});

	it("renders `max` stars", () => {
		expect(markup(<AppStarRating label="Rate" max={10} />)).toContain("10 stars");
	});

	it("shows the running readout for the current value", () => {
		expect(markup(<AppStarRating label="Rate" value={3} />)).toContain("3 of 5");
		// unrated still renders the readout - it is only visually hidden with opacity
		expect(markup(<AppStarRating label="Rate" value={0} />)).toContain("0 of 5");
	});

	it("takes an uncontrolled starting value", () => {
		expect(markup(<AppStarRating defaultValue={4} label="Rate" />)).toContain("4 of 5");
	});

	describe("the Clear route out", () => {
		it("appears once there is a rating", () => {
			expect(markup(<AppStarRating label="Rate" value={2} />)).toContain("Clear");
		});

		it("is absent when unrated", () => {
			expect(markup(<AppStarRating label="Rate" value={0} />)).not.toContain(">Clear<");
		});

		it("is absent when disabled, even with a value", () => {
			expect(markup(<AppStarRating defaultValue={4} isDisabled label="Rate" />)).not.toContain(">Clear<");
		});
	});

	it("carries a form name when asked", () => {
		expect(markup(<AppStarRating label="Rate" name="product_rating" value={3} />)).toContain(
			'name="product_rating"',
		);
	});

	it("renders helper text when given", () => {
		expect(markup(<AppStarRating description="Whole stars only." label="Rate" />)).toContain(
			"Whole stars only.",
		);
	});
});

describe("AppRatingSummary", () => {
	describe("the unrated state", () => {
		it("is its own sentence, not five empty stars", () => {
			const html = markup(<AppRatingSummary count={0} data-cy="sum" value={0} />);
			expect(html).toContain("No ratings yet");
			expect(html).toContain('data-cy="sum"');
			expect(html).not.toContain('role="img"');
		});
	});

	describe("the figure", () => {
		it("is one role=img carrying the whole sentence", () => {
			const html = markup(<AppRatingSummary count={212} value={4.5} />);
			expect(html).toContain('role="img"');
			expect(html).toContain('aria-label="Rated 4.5 out of 5, 212 ratings"');
		});

		it("uses the caller's noun", () => {
			expect(markup(<AppRatingSummary count={88} noun="reviews" value={4} />)).toContain(
				'aria-label="Rated 4.0 out of 5, 88 reviews"',
			);
		});

		it("clamps the average to max", () => {
			expect(markup(<AppRatingSummary count={5} value={7} />)).toContain(
				'aria-label="Rated 5.0 out of 5, 5 ratings"',
			);
		});
	});

	describe("the breakdown and the ring", () => {
		it("renders the distribution as a <dl> when one is passed", () => {
			const html = markup(
				<AppRatingSummary count={212} distribution={[4, 8, 19, 53, 128]} value={4.5} />,
			);
			expect(html).toContain("<dl");
		});

		it("drops the ring when showRing is false and there is no distribution", () => {
			const html = markup(<AppRatingSummary count={212} showRing={false} value={4.5} />);
			expect(html).not.toContain("-rotate-90");
			expect(html).not.toContain("<dl");
		});
	});
});
