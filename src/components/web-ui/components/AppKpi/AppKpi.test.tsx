import { Activity } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppKpi } from "./AppKpi";
import { kpiDeltaTone } from "./kpi.types";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * container-query reflow (chart beside the value, then under it) is the lab's to
 * watch; what is pinned here is the shape rules.
 *
 * `footer` is deliberately never passed: it renders a router `<Link>`, which
 * needs a RouterProvider this node test has no way to give it. The lab covers
 * the footer.
 *
 * - `data-variant` reports what was DRAWN, not what was asked for: a one-point
 *   line falls back to `value`, so a spec never asserts on a chart that is not
 *   there.
 * - The delta's tone is `direction` AND `isUpGood` together - `kpiDeltaTone` is
 *   the rule, exported so it can be tested without rendering.
 * - `value` is rendered verbatim; the tile does no formatting.
 */

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

const LINE_POINTS = [
	{ label: "Wk 1", value: 10 },
	{ label: "Wk 2", value: 12 },
	{ label: "Wk 3", value: 11 },
];

describe("kpiDeltaTone", () => {
	it("is success for a rise and danger for a fall when up is good (the default)", () => {
		expect(kpiDeltaTone({ direction: "up", label: "+1%", period: "x" })).toBe("success");
		expect(kpiDeltaTone({ direction: "down", label: "-1%", period: "x" })).toBe("danger");
	});

	it("flips when up is NOT good - a falling bounce rate is green", () => {
		expect(kpiDeltaTone({ direction: "down", isUpGood: false, label: "-1%", period: "x" })).toBe("success");
		expect(kpiDeltaTone({ direction: "up", isUpGood: false, label: "+1%", period: "x" })).toBe("danger");
	});

	it("is default for a flat movement, whichever way is good", () => {
		expect(kpiDeltaTone({ direction: "flat", label: "0%", period: "x" })).toBe("default");
		expect(kpiDeltaTone({ direction: "flat", isUpGood: false, label: "0%", period: "x" })).toBe("default");
	});
});

describe("AppKpi", () => {
	describe("the value and the title", () => {
		it("renders the value string verbatim and the title", () => {
			const html = markup(<AppKpi icon={Activity} title="Monthly revenue" value="$21,300" />);
			expect(html).toContain("$21,300");
			expect(html).toContain("Monthly revenue");
			expect(html).toContain('data-cy="kpi-value"');
		});
	});

	describe("data-variant is what was drawn", () => {
		it("is `value` with no chart", () => {
			const html = markup(<AppKpi icon={Activity} title="Open incidents" value="0" />);
			expect(html).toContain('data-variant="value"');
		});

		it("is `line` for a series of two or more, with a derived chart data-cy", () => {
			const html = markup(
				<AppKpi
					chart={{ kind: "line", points: LINE_POINTS }}
					data-cy="rev"
					icon={Activity}
					title="Revenue"
					value="$21,300"
				/>,
			);
			expect(html).toContain('data-variant="line"');
			expect(html).toContain('data-cy="rev-chart"');
		});

		it("falls back to `value` for a one-point series - one reading is not a trend", () => {
			const html = markup(
				<AppKpi
					chart={{ kind: "line", points: [{ label: "Today", value: 40 }] }}
					data-cy="one"
					icon={Activity}
					title="One reading only"
					value="40"
				/>,
			);
			expect(html).toContain('data-variant="value"');
			expect(html).not.toContain('data-cy="one-chart"');
		});

		it("is `progress` for a progress chart, with the percent and caption drawn", () => {
			const html = markup(
				<AppKpi
					chart={{ caption: "3,420 of 5,000 seats", kind: "progress", label: "Seats used", max: 5000, value: 3420 }}
					data-cy="seats"
					icon={Activity}
					title="Seats used"
					value="3,420"
				/>,
			);
			expect(html).toContain('data-variant="progress"');
			expect(html).toContain('data-cy="seats-progress"');
			expect(html).toContain("68%");
			expect(html).toContain("3,420 of 5,000 seats");
		});

		it("clamps an over-ceiling progress chart to 100%", () => {
			const html = markup(
				<AppKpi
					chart={{ kind: "progress", label: "Seats used", max: 5000, value: 6200 }}
					icon={Activity}
					title="Over the ceiling"
					value="6,200"
				/>,
			);
			expect(html).toContain("100%");
		});
	});

	describe("the delta chip", () => {
		it("draws the label and the period", () => {
			const html = markup(
				<AppKpi
					delta={{ direction: "up", label: "+11.5%", period: "vs previous 30 days" }}
					icon={Activity}
					title="Revenue"
					value="$21,300"
				/>,
			);
			expect(html).toContain("+11.5%");
			expect(html).toContain("vs previous 30 days");
			expect(html).toContain('data-cy="kpi-delta"');
		});
	});

	describe("the test hook", () => {
		it("passes data-cy through to the card", () => {
			expect(
				markup(<AppKpi data-cy="tile" icon={Activity} title="Revenue" value="$1" />),
			).toContain('data-cy="tile"');
		});
	});
});
