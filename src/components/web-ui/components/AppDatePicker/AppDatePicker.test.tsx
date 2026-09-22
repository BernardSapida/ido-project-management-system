import { CalendarDate } from "@internationalized/date";
import { renderToStaticMarkup } from "react-dom/server";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { AppDatePicker } from "./AppDatePicker";

/**
 * What this file can and cannot check.
 *
 * There is no DOM here - see `vitest.config.ts` for why one cannot currently be
 * installed - so these are assertions about the MARKUP the component produces.
 * That is a harder limit than usual for this component: **the calendar is inside
 * a popover, and a closed popover renders nothing at all.** Everything below is
 * therefore about the FIELD.
 *
 * The panel - three months framed around today, the year list, the preset rail -
 * is covered in `apps/web/src/components/date-picker-panel.test.tsx`, which has
 * jsdom and can open it. That split is the same one `AppButton` uses for `hold`.
 *
 * NOT covered anywhere, and worth writing the moment a DOM lands here:
 *
 * - Pressing clear actually writes `null` through react-hook-form. The markup
 *   proves the button is there and what it is called, not what it does.
 * - The responsive month count, which is three media queries and no DOM to
 *   answer them - `useMediaQuery` returns its server value here, so every render
 *   in this file is the one-month case.
 */

interface Form {
	when: CalendarDate | null;
}

/**
 * `useForm`, not `useAppForm` - this is a specimen, not a form. It exists to
 * hand a `control` to the field so it can render.
 */
function Harness({ isDisabled, value }: { isDisabled?: boolean; value: CalendarDate | null }) {
	const { control } = useForm<Form>({ defaultValues: { when: value } });

	return (
		<AppDatePicker
			control={control}
			isDisabled={isDisabled}
			label="Appointment"
			name="when"
		/>
	);
}

const AUGUST = new CalendarDate(2026, 8, 15);

describe("AppDatePicker markup", () => {
	it("offers no clear button while the field is empty", () => {
		const html = renderToStaticMarkup(<Harness value={null} />);
		expect(html).not.toContain("Clear Appointment");
	});

	/*
	 * The whole of the `isClearable` contract. That prop was removed BECAUSE it
	 * was opt-in and most call sites forgot it, so the thing worth pinning is
	 * that nothing has to be passed to get this button - the harness above passes
	 * a value and a label and nothing else.
	 */
	it("offers a clear button once a date is set, with no prop asking for one", () => {
		const html = renderToStaticMarkup(<Harness value={AUGUST} />);
		expect(html).toContain('aria-label="Clear Appointment"');
	});

	// It would be the one live control in a dead field.
	it("withdraws the clear button while disabled", () => {
		const html = renderToStaticMarkup(
			<Harness
				isDisabled
				value={AUGUST}
			/>,
		);
		expect(html).not.toContain("Clear Appointment");
	});

	/*
	 * HeroUI's trigger is `w-full`, which is a no-op while it is the suffix's
	 * only child and claims the width of BOTH once the clear button joins it -
	 * the surplus lands after the glyph, so the calendar icon walks left and
	 * leaves a gap against the field's edge. The override is invisible in every
	 * screenshot of an EMPTY field, which is exactly why it needs pinning.
	 */
	it("does not let the calendar trigger claim the clear button's width", () => {
		const html = renderToStaticMarkup(<Harness value={AUGUST} />);
		const trigger = html.slice(html.indexOf('data-slot="date-picker-trigger"'));
		expect(trigger.slice(0, trigger.indexOf(">"))).toContain("w-auto");
	});

	/*
	 * The bound is a sentence under the FIELD, not a tooltip on the greyed cells:
	 * a disabled cell is the one thing that cannot be hovered on touch, and a
	 * user who has just been refused a date is looking at the field.
	 */
	it("says the bounds in words", () => {
		function Bounded() {
			const { control } = useForm<Form>({ defaultValues: { when: null } });
			return (
				<AppDatePicker
					control={control}
					label="Booking date"
					maxValue={new CalendarDate(2026, 9, 14)}
					minValue={AUGUST}
					name="when"
				/>
			);
		}

		const html = renderToStaticMarkup(<Bounded />);
		expect(html).toContain("Pick a date between Aug 15, 2026 and Sep 14, 2026.");
	});
});
