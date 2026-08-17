import { AppDatePicker, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import type { CalendarDate, DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { seo } from "@/config/seo.config";

/**
 * Date picker lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The thing to actually DO on this page is resize it. The month count is the
 * component's main idea and it is invisible at a single width: drag the window
 * under 40rem for one grid, past 48rem for two, past 90rem for three - and at
 * three, check that the month you are on is the MIDDLE one.
 *
 * The second thing is to press a month title. Every one of them opens the year
 * list, which is the only navigation that scales past a few months out.
 */
export const Route = createFileRoute("/(references)/components/date-picker")({
	head: () => ({
		meta: [{ title: seo.title("Date picker lab") }, { content: "noindex", name: "robots" }],
	}),
	component: DatePickerLabPage,
});

interface LabForm {
	appointment: CalendarDate | null;
	birthDate: CalendarDate | null;
	bounded: CalendarDate | null;
	delivery: CalendarDate | null;
	optional: CalendarDate | null;
	weekday: CalendarDate | null;
}

function DatePickerLabPage() {
	/*
	 * `useForm`, not `useAppForm`, and that is not an oversight - see
	 * hooks/use-app-form.ts. This is not a form: no schema, no handleSubmit, no
	 * submit button. It exists to hand a `control` to the field components so
	 * they can be rendered. useAppForm requires a schema and always wires a
	 * resolver, so using it here would mean inventing validation rules for a
	 * specimen and printing their errors under a lab that is about something
	 * else. Any form a user SUBMITS uses useAppForm.
	 */
	const { control } = useForm<LabForm>({
		defaultValues: {
			appointment: null,
			birthDate: null,
			bounded: null,
			delivery: null,
			optional: null,
			weekday: null,
		},
	});

	const now = today(getLocalTimeZone());

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Presets, one to three months, and the bounds said out loud. Resize the window."
				title="Date picker lab"
			/>

			<LabSection
				description="The default. Type into the segments or open the calendar - both write the same value. The month count follows the viewport: one under 40rem, two past 48rem, three past 90rem, and at three the current month sits in the MIDDLE so there is a month of context either side. Page with the arrows and only one month moves; paging by the group would swap all three and throw away the context they exist to give. Once a date is set an X appears in the field - always, on every picker, because a date that can be set can be unset."
				title="Default"
			>
				<div className="max-w-sm">
					<AppDatePicker
						control={control}
						data-cy="appointment"
						label="Appointment"
						name="appointment"
					/>
				</div>
			</LabSection>

			<LabSection
				description="Press any month title. The grids give way to a list of years, and pressing one jumps straight there - the arrows move a month at a time, which is right for an appointment and useless for a date four years out. Every title opens the same list, because a year belongs to the group rather than to one of its months. Escape puts the months back."
				title="Year navigation"
			>
				<div className="max-w-sm">
					<AppDatePicker
						control={control}
						data-cy="optional"
						label="Renewal date"
						name="optional"
					/>
				</div>
			</LabSection>

			<LabSection
				description="presets={[]} drops the rail. Right whenever every day is equally likely - a birth date is the obvious one, where 'Tomorrow' is noise and the year list above is the only navigation that matters. Open it and pick 1990 rather than pressing an arrow four hundred times."
				title="No presets"
			>
				<div className="max-w-sm">
					<AppDatePicker
						control={control}
						data-cy="birthDate"
						label="Birth date"
						name="birthDate"
						presets={[]}
					/>
				</div>
			</LabSection>

			<LabSection
				description="minValue and maxValue cut the range off at the ends, and the bound is stated in words under the field. That sentence is not decoration: a greyed-out cell cannot be hovered for a reason on touch, and a user who has just been refused a date is looking at the date. Open this one and watch the presets - 'Yesterday' is disabled rather than hidden, because a rail whose contents change per screen is one nobody can learn. The year list narrows to the bounds too, so a 30-day window offers exactly the years it can reach."
				title="Bounded"
			>
				<div className="max-w-sm">
					<AppDatePicker
						control={control}
						data-cy="bounded"
						label="Booking date"
						maxValue={now.add({ days: 30 })}
						minValue={now}
						name="bounded"
					/>
				</div>
			</LabSection>

			<LabSection
				description="isDateUnavailable punches holes in the middle of the range rather than cutting it off at an end - a fully booked slot, a closed weekend. This one refuses Saturdays and Sundays. The presets respect it too: whichever of them lands on a weekend this week is disabled."
				title="Unavailable days"
			>
				<div className="max-w-sm">
					<AppDatePicker
						control={control}
						data-cy="weekday"
						isDateUnavailable={isWeekend}
						label="Delivery (weekdays only)"
						name="weekday"
					/>
				</div>
			</LabSection>

			<LabSection
				description="Disabled and required, side by side. A disabled field must still be legible - it is saying the field exists and cannot be answered yet, so bleaching it just makes it look broken."
				title="States"
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<AppDatePicker
						control={control}
						isDisabled
						label="Locked date"
						name="delivery"
					/>
					<AppDatePicker
						control={control}
						isRequired
						label="Required date"
						name="delivery"
					/>
				</div>
			</LabSection>
		</div>
	);
}

/** Saturday and Sunday, in the picker's own calendar system. */
function isWeekend(date: DateValue): boolean {
	const day = date.toDate(getLocalTimeZone()).getDay();
	return day === 0 || day === 6;
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
}

function LabSection({ children, description, title }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
