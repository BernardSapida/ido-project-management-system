import { Time } from "@internationalized/date";
import { renderToStaticMarkup } from "react-dom/server";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { AppTimePicker } from "./AppTimePicker";

/**
 * What this file can and cannot check.
 *
 * No DOM here - see `vitest.config.ts` - so these are assertions about the
 * MARKUP the wheel produces on a static render. Unlike `AppDatePicker`, the
 * whole control is on the page from the first paint, so the columns, their
 * `spinbutton` wiring, the readout and the disabled/required states are all
 * reachable.
 *
 * NOT covered here, and living in `apps/web/src/components/time-picker.test.tsx`
 * because it needs a real DOM: the arrow keys and a row click actually moving
 * the bound value, and hour/minute wrapping where AM/PM does not. The scroll
 * settle is covered nowhere - jsdom has no layout, so `scrollTop` is always 0.
 */

interface Form {
	when: Time | null;
}

/** `useForm`, not `useAppForm` - a specimen, there to hand over a `control`. */
function Harness({
	isDisabled,
	isRequired,
	minuteStep,
	value = null,
}: {
	isDisabled?: boolean;
	isRequired?: boolean;
	minuteStep?: number;
	value?: Time | null;
}) {
	const { control } = useForm<Form>({ defaultValues: { when: value } });

	return (
		<AppTimePicker
			control={control}
			defaultTime={new Time(9, 0)}
			isDisabled={isDisabled}
			isRequired={isRequired}
			label="Reminder time"
			minuteStep={minuteStep}
			name="when"
		/>
	);
}

describe("AppTimePicker markup", () => {
	it("names the field and gives each column a spinbutton", () => {
		const html = renderToStaticMarkup(<Harness />);
		expect(html).toContain("Reminder time");
		expect(html).toContain('role="spinbutton"');
		expect(html).toContain('aria-label="Hour"');
		expect(html).toContain('aria-label="Minute"');
		expect(html).toContain('aria-label="AM or PM"');
	});

	/*
	 * The empty-state trade: something is always under the band, but the form
	 * value is still null, so the readout has to SAY it is unset - it is the only
	 * tell that a required wheel was never touched.
	 */
	it("reads as not set while the field is empty, showing the default underneath", () => {
		const html = renderToStaticMarkup(<Harness value={null} />);
		expect(html).toContain("Not set");
		expect(html).toContain("9:00 AM");
	});

	it("reads back the committed value once the field holds one", () => {
		const html = renderToStaticMarkup(<Harness value={new Time(15, 30)} />);
		expect(html).toContain("Selected");
		expect(html).toContain("3:30 PM");
		expect(html).not.toContain("Not set");
	});

	// The columns speak their value, so the drum is answerable without seeing it.
	it("carries the current row as aria-valuetext on each column", () => {
		const html = renderToStaticMarkup(<Harness value={new Time(15, 30)} />);
		expect(html).toContain('aria-valuetext="3"');
		expect(html).toContain('aria-valuetext="30"');
		expect(html).toContain('aria-valuetext="PM"');
	});

	it("coarsens the minute column to the step", () => {
		const fine = renderToStaticMarkup(<Harness />);
		expect(fine).toContain(">59<");

		const coarse = renderToStaticMarkup(<Harness minuteStep={15} />);
		expect(coarse).toContain(">45<");
		expect(coarse).not.toContain(">59<");
		expect(coarse).not.toContain(">07<");
	});

	it("marks a required field and still reports through the schema, not a default write", () => {
		const html = renderToStaticMarkup(<Harness isRequired value={null} />);
		expect(html).toContain("*");
		// Nothing was written just because a value is showing.
		expect(html).toContain("Not set");
	});

	// A dead control keeps its value readable and leaves the tab order.
	it("drops the columns out of the tab order while disabled", () => {
		const html = renderToStaticMarkup(<Harness isDisabled value={new Time(9, 0)} />);
		expect(html).toContain('tabindex="-1"');
		expect(html).not.toContain('tabindex="0"');
	});
});
