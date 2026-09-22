import { CalendarDate } from "@internationalized/date";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppDateRangeFilter } from "./AppDateRangeFilter";

/**
 * The standalone toolbar filter - a plain `value`/`onChange`, an Apply gate, and
 * a panel of one to three months.
 *
 * No DOM here (see `vitest.config.ts`), and the panel lives in a popover that
 * renders nothing while closed. So what is reachable is the TRIGGER - which is
 * the part carrying the component's least obvious decision: what a range is
 * CALLED. Everything below is that naming, driven through the rendered label.
 *
 * The panel itself - the month group, the preset rail, the year list - needs a
 * DOM to open. `apps/web/src/components/date-picker-panel.test.tsx` covers the
 * equivalent panel on `AppDatePicker`; the two are the same shape at different
 * arities, and a range-specific panel test is the obvious next one to write.
 */

const range = (start: CalendarDate, end: CalendarDate) => ({ end, start });

function trigger(value: { end: CalendarDate; start: CalendarDate } | null) {
	return renderToStaticMarkup(
		<AppDateRangeFilter
			onChange={() => undefined}
			value={value}
		/>,
	);
}

describe("AppDateRangeFilter trigger", () => {
	it("asks for a range when it has none", () => {
		expect(trigger(null)).toContain("Select date range");
	});

	/*
	 * "Aug 2, 2026 - Oct 23, 2026" says 2026 twice and puts a comma in the middle
	 * of each end, so the eye parses four numbers to find the two that differ. A
	 * range inside one year writes the year ONCE.
	 */
	it("writes the year once for a range inside one year", () => {
		const html = trigger(range(new CalendarDate(2026, 8, 2), new CalendarDate(2026, 10, 23)));
		expect(html).toContain("Aug 2 - Oct 23, 2026");
	});

	// Only a range that crosses a year boundary has earned both years.
	it("writes both years for a range that crosses one", () => {
		const html = trigger(range(new CalendarDate(2025, 12, 30), new CalendarDate(2026, 1, 2)));
		expect(html).toContain("Dec 30, 2025 - Jan 2, 2026");
	});

	it("collapses a single day to one date", () => {
		const html = trigger(range(new CalendarDate(2026, 8, 15), new CalendarDate(2026, 8, 15)));
		expect(html).toContain("Aug 15, 2026");
		expect(html).not.toContain(" - ");
	});

	/*
	 * The TRIGGER prints dates even where the range is exactly a period, and that
	 * is deliberately the opposite of the chip inside the popover. The chip names
	 * the period because it is confirming what a preset resolved to; the trigger
	 * is the only thing on the page saying what the filter is set to, and if both
	 * said "Q1 2026" nothing would ever tell the user which days that is.
	 */
	it("prints the dates even for a range that has a period's name", () => {
		const html = trigger(range(new CalendarDate(2026, 1, 1), new CalendarDate(2026, 3, 31)));
		expect(html).toContain("Jan 1 - Mar 31, 2026");
		expect(html).not.toContain("Q1 2026");
	});

	/*
	 * The bound is a sentence under the control, not a tooltip on the greyed
	 * cells - a disabled cell is the one thing that cannot be hovered on touch.
	 */
	it("says the bounds in words", () => {
		const html = renderToStaticMarkup(
			<AppDateRangeFilter
				maxValue={new CalendarDate(2026, 8, 31)}
				minValue={new CalendarDate(2026, 8, 1)}
				onChange={() => undefined}
				value={null}
			/>,
		);
		expect(html).toContain("Pick a range between Aug 1, 2026 and Aug 31, 2026.");
	});

	// A switched-off filter still has to say what it is filtering by.
	it("keeps its value while disabled", () => {
		const html = renderToStaticMarkup(
			<AppDateRangeFilter
				isDisabled
				onChange={() => undefined}
				value={range(new CalendarDate(2026, 8, 2), new CalendarDate(2026, 10, 23))}
			/>,
		);
		expect(html).toContain("Aug 2 - Oct 23, 2026");
	});
});
