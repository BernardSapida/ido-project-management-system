import { CalendarDate } from "@internationalized/date";
import { renderToStaticMarkup } from "react-dom/server";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { AppDateRangePicker } from "./AppDateRangePicker";

/**
 * The FORM-bound range field - `control` and `name`, one grid, its own error.
 * Not to be confused with `AppDateRangeFilter`, the standalone toolbar control
 * that commits on Apply and is tested beside it.
 *
 * No DOM here (see `vitest.config.ts`), and the calendar is inside a popover
 * that renders nothing while closed, so this file is about the FIELD.
 */

interface Form {
	window: { end: CalendarDate; start: CalendarDate } | null;
}

function Harness({
	isDisabled,
	value,
}: {
	isDisabled?: boolean;
	value: { end: CalendarDate; start: CalendarDate } | null;
}) {
	const { control } = useForm<Form>({ defaultValues: { window: value } });

	return (
		<AppDateRangePicker
			control={control}
			isDisabled={isDisabled}
			label="Coverage window"
			name="window"
		/>
	);
}

const RANGE = { end: new CalendarDate(2026, 8, 29), start: new CalendarDate(2026, 8, 18) };

describe("AppDateRangePicker markup", () => {
	it("offers no clear button while the field is empty", () => {
		const html = renderToStaticMarkup(<Harness value={null} />);
		expect(html).not.toContain("Clear Coverage window");
	});

	/*
	 * A range is the value most worth being able to retract - two dates, so the
	 * one a user is most likely to get half wrong, and emptying four segments by
	 * hand is not an answer. Nothing has to be passed to get this.
	 */
	it("offers a clear button once a range is set, with no prop asking for one", () => {
		const html = renderToStaticMarkup(<Harness value={RANGE} />);
		expect(html).toContain('aria-label="Clear Coverage window"');
	});

	it("withdraws the clear button while disabled", () => {
		const html = renderToStaticMarkup(
			<Harness
				isDisabled
				value={RANGE}
			/>,
		);
		expect(html).not.toContain("Clear Coverage window");
	});

	/*
	 * HeroUI's trigger is `w-full`: a no-op while it is the suffix's only child,
	 * and a claim on the width of BOTH once the clear button joins it. The
	 * surplus lands after the glyph, so the calendar icon walks left and leaves a
	 * gap against the field's edge - invisible on an empty field, which is why it
	 * needs pinning.
	 */
	it("does not let the calendar trigger claim the clear button's width", () => {
		const html = renderToStaticMarkup(<Harness value={RANGE} />);
		const trigger = html.slice(html.indexOf('data-slot="date-range-picker-trigger"'));
		expect(trigger.slice(0, trigger.indexOf(">"))).toContain("w-auto");
	});
});
