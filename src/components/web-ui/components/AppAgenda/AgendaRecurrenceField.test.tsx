import { renderToStaticMarkup } from "react-dom/server";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { AgendaRecurrenceField } from "./AgendaRecurrenceField";
import type { AgendaEntryFormValues } from "./AgendaEntryForm";

/**
 * Markup-only - this package has no DOM (see `vitest.config.ts`). The lab and
 * its Cypress specs own the behaviour: that a toggle rewrites the rule, that
 * "Edit as text" swaps the panels, that the write-back effect reaches the parent
 * form. The conversion itself is covered in `recurrence-rule.test.ts`.
 *
 * What is pinned here is which panel the field opens on for a given incoming
 * rule, and that each panel renders the controls a spec reaches for.
 */

/** `useForm`, not `useAppForm` - a specimen that only exists to supply `control`. */
function Harness({
	referenceISODate = "2026-01-05",
	rrule,
}: {
	referenceISODate?: string;
	rrule: string;
}) {
	const { control } = useForm<AgendaEntryFormValues>({ defaultValues: { rrule } });
	return <AgendaRecurrenceField control={control} referenceISODate={referenceISODate} />;
}

const markup = (rrule: string, referenceISODate?: string) =>
	renderToStaticMarkup(<Harness referenceISODate={referenceISODate} rrule={rrule} />);

describe("AgendaRecurrenceField markup", () => {
	it("opens the visual builder for a rule it can represent", () => {
		const html = markup("FREQ=WEEKLY;BYDAY=MO,WE");
		expect(html).toContain("Repeat every");
		expect(html).toContain("On these days");
		expect(html).toContain('aria-label="Days of the week"');
		expect(html).toContain("Ends");
		// the live preview, straight from summariseRecurrence
		expect(html).toContain("Repeats weekly on Mon, Wed");
		expect(html).not.toContain("A raw RFC 5545 RRULE");
	});

	it("shows the day field and the short-month checkbox for a 29+ monthly day", () => {
		const html = markup("FREQ=MONTHLY;BYMONTHDAY=30");
		expect(html).toContain("Day of month");
		expect(html).toContain("Last day");
		expect(html).toContain("of the month");
		expect(html).toContain("Use the last day when a month is shorter");
	});

	it("keeps the clamp checkbox hidden for a day every month has", () => {
		const html = markup("FREQ=MONTHLY;BYMONTHDAY=12");
		expect(html).toContain("Day of month");
		expect(html).not.toContain("Use the last day when a month is shorter");
	});

	it("opens the raw editor for a rule the builder cannot show", () => {
		const html = markup("FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1");
		expect(html).toContain("A raw RFC 5545 RRULE");
		expect(html).toContain("options the visual builder can");
		expect(html).toContain("Too specific for the visual builder");
	});
});
