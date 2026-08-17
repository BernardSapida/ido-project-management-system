import type { DateRangePreset, DateRangeValue } from "@bernardsapida/web-ui";
import {
	AppDateRangeFilter,
	AppDateRangePicker,
	AppGlassCard,
	AppPageHeader,
	DEFAULT_DATE_RANGE_PRESETS,
} from "@bernardsapida/web-ui";
import { getLocalTimeZone, today } from "@internationalized/date";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { seo } from "@/config/seo.config";

/**
 * Date range picker lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The thing to actually do on this page is resize the window. The month count
 * is the only thing that changes across breakpoints - the cells, the presets
 * rail and the header all stay put - and it is the whole reason the component
 * is not a pair of date inputs. One under 40rem, two past 48rem, three past
 * 90rem.
 *
 * The second thing is to press a month title. Every one of them opens the year
 * list, which is the only navigation in the popover that scales past a few
 * months out. The phone sheet has none - it scrolls, and the typed fields
 * beside the trigger are the way to another year there.
 */
export const Route = createFileRoute("/(references)/components/date-range-picker")({
	head: () => ({
		meta: [{ title: seo.title("Date range picker lab") }, { content: "noindex", name: "robots" }],
	}),
	component: DateRangePickerLabPage,
});

function DateRangePickerLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Presets on the left, one to three months on the right, and nothing written until Apply."
				title="Date range picker lab"
			/>
			<ReportFilterSection />
			<LiveSection />
			<FormFieldSection />
			<BoundedSection />
			<CustomPresetsSection />
			<DisabledSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
	/** Where this shape is used on a real screen. A specimen with no stated
	 *  purpose is a screenshot. */
	usedIn?: string[];
}

function LabSection({ children, description, title, usedIn }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
					{usedIn ? (
						<ul className="mt-2 flex flex-wrap gap-1.5">
							{usedIn.map((use) => (
								<li
									className="rounded-full bg-muted-surface px-2.5 py-0.5 text-xs text-muted"
									key={use}
								>
									{use}
								</li>
							))}
						</ul>
					) : null}
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

/* -------------------------------------------------------------------------- */
/* The assembly                                                               */
/* -------------------------------------------------------------------------- */

interface Shipment {
	day: string;
	reference: string;
	units: number;
}

const SHIPMENTS: Shipment[] = [
	{ day: "-2", reference: "SHP-4471", units: 120 },
	{ day: "-9", reference: "SHP-4390", units: 64 },
	{ day: "-20", reference: "SHP-4218", units: 210 },
	{ day: "-64", reference: "SHP-3902", units: 18 },
];

/** Where this component actually lives: over the report it filters. */
function ReportFilterSection() {
	const now = today(getLocalTimeZone());
	const [value, setValue] = useState<DateRangeValue | null>(null);

	const rows = SHIPMENTS.filter((row) => {
		if (!value) return true;
		const date = now.add({ days: Number(row.day) });
		return date.compare(value.start) >= 0 && date.compare(value.end) <= 0;
	});

	return (
		<LabSection
			description="The filter over the report it filters, which is the only arrangement that shows what the Apply gate is for. Pick a start day and watch the table below: it does not move. A range is two values, and committing on the first click would filter the report to a single day while the user is still mid-gesture - they would watch their data vanish and then come back, every single time. The two states worth reaching are an empty result, where the filter must stay on screen and stay changeable, and Clear, which is not the same as picking the widest range."
			title="Over a report"
			usedIn={["Reporting screens", "Order and shipment tables", "Any list with a date column"]}
		>
			<div className="flex flex-wrap items-center gap-3">
				<AppDateRangeFilter
					data-cy="report-filter"
					onChange={setValue}
					value={value}
				/>
				<p
					className="text-sm text-muted"
					data-cy="report-summary"
				>
					{value ? `${rows.length} of ${SHIPMENTS.length} shipments` : `All ${SHIPMENTS.length} shipments`}
				</p>
			</div>

			{rows.length === 0 ? (
				<div
					className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted"
					data-cy="report-empty"
				>
					No shipments in that range. The filter is still up there and still changeable - widening it is the fix, and it
					is one click away.
				</div>
			) : (
				<ul
					className="divide-y divide-border overflow-hidden rounded-2xl border border-border"
					data-cy="report-rows"
				>
					{rows.map((row) => (
						<li
							className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
							key={row.reference}
						>
							<span className="font-medium">{row.reference}</span>
							<span className="text-muted">
								{now.add({ days: Number(row.day) }).toString()} · {row.units} units
							</span>
						</li>
					))}
				</ul>
			)}
		</LabSection>
	);
}

/**
 * The other component this route covers. It had no specimen anywhere before
 * this, which is how it nearly got retired: `AppDateRangeField` covers the same
 * ground on the form-reference page, and nothing pointed at this one.
 */
function FormFieldSection() {
	// `useForm`, not `useAppForm`, deliberately: a `control` for the specimen, not
	// a form. Nothing here is submitted. See the note in date-picker.tsx.
	const { control } = useForm({ defaultValues: { window: null } });

	return (
		<LabSection
			description="AppDateRangePicker is the FORM-bound sibling of the filter above: it takes `control` and `name`, writes through react-hook-form, and reports its own validation error under the field. The filter is for a toolbar, where the value drives what is on screen right now and nothing is submitted; this is for a form, where the value is part of a record that a Save button commits. Reach for the filter when there is no Save button on the screen."
			title="The form-bound one"
			usedIn={["Booking and reservation forms", "Any record with a start and an end"]}
		>
			<div className="max-w-md">
				<AppDateRangePicker
					control={control}
					data-cy="form-range"
					label="Coverage window"
					name="window"
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** What the caller actually receives, printed so the Apply gate is visible. */
function ValueReadout({ value }: { value: DateRangeValue | null }) {
	return (
		<p
			aria-live="polite"
			className="font-mono text-sm text-muted"
		>
			{value ? `${value.start.toString()} → ${value.end.toString()}` : "null"}
		</p>
	);
}

/* -------------------------------------------------------------------------- */

function LiveSection() {
	const [value, setValue] = useState<DateRangeValue | null>(null);

	return (
		<LabSection
			description="Open it, click a start day in one month and an end day in another, and watch the span preview across every grid on screen before the second click lands. Nothing below the picker moves until Apply - a range is two values, and committing on the first click would filter the table to a one-day range while the user is still mid-gesture. Escape, a click outside and Cancel all throw the draft away. Press a preset and the group repositions to frame what it just set; then touch any day and the preset quietly goes out, because 'Last 30 days' must never stay lit next to a range that is not the last 30 days. Press a month title and the grids give way to a list of years - the arrows move one month, which is right for last quarter and useless for the same quarter three years ago."
			title="Interactive"
			usedIn={["The component on its own, with its value printed"]}
		>
			<div className="space-y-3">
				<AppDateRangeFilter
					data-cy="range-live"
					onChange={setValue}
					value={value}
				/>
				<ValueReadout value={value} />
			</div>
		</LabSection>
	);
}

/** The bounded case, where days have to be refused. */
function BoundedSection() {
	const now = today(getLocalTimeZone());
	const [value, setValue] = useState<DateRangeValue | null>(null);

	return (
		<LabSection
			description="Bounded to the last 90 days and no later than today - the shape of nearly every reporting filter. Out-of-range days are announced as disabled rather than only greyed, and the reason is a line under the field rather than a tooltip on the cells: a user who has just been refused a date is looking at the field, and a disabled cell is exactly the thing that cannot be hovered on touch. The presets still resolve; 'Last quarter' can land wholly outside the window, which is the case worth poking at."
			title="With a min and a max"
			usedIn={["Reporting filters", "Anything bounded by a retention window"]}
		>
			<div className="space-y-3">
				<AppDateRangeFilter
					data-cy="range-bounded"
					label="Reporting period"
					maxValue={now}
					minValue={now.subtract({ days: 90 })}
					onChange={setValue}
					value={value}
				/>
				<ValueReadout value={value} />
			</div>
		</LabSection>
	);
}

/*
 * Presets are resolved against today rather than stored as dates, so a tab left
 * open overnight cannot serve yesterday's "This month".
 */
const FISCAL_PRESETS: DateRangePreset[] = [
	...DEFAULT_DATE_RANGE_PRESETS,
	{
		key: "this-month",
		label: "This month",
		resolve: (now) => ({ end: now, start: now.set({ day: 1 }) }),
	},
	{
		key: "this-year",
		label: "This year",
		resolve: (now) => ({ end: now, start: now.set({ day: 1, month: 1 }) }),
	},
];

function CustomPresetsSection() {
	const [value, setValue] = useState<DateRangeValue | null>(null);

	return (
		<LabSection
			description="The rail is the caller's. These add 'This month' and 'This year' to the defaults, and both resolve to a period with a name - so the header chip says 'August 2026' rather than reciting two dates back at you. A range one day short of a whole month is not that month and does not get the name."
			title="Custom presets"
			usedIn={["Fiscal calendars", "Domain-specific ranges"]}
		>
			<div className="space-y-3">
				<AppDateRangeFilter
					data-cy="range-custom"
					label="Fiscal range"
					onChange={setValue}
					presets={FISCAL_PRESETS}
					value={value}
				/>
				<ValueReadout value={value} />
			</div>
		</LabSection>
	);
}

/** A picker holding a long range, and the same one switched off. */
function DisabledSection() {
	const now = today(getLocalTimeZone());
	const longRange: DateRangeValue = {
		end: now.set({ day: 31, month: 3 }),
		start: now.set({ day: 1, month: 1 }),
	};

	return (
		<LabSection
			description="Left: a range long enough to test the trigger, which prints the resolved dates and only falls back to the period's name when they will not fit. Right: disabled - the trigger keeps its value, because a switched-off filter still has to say what it is filtering by."
			title="Long value, and disabled"
			usedIn={["The two states that break a filter bar's layout"]}
		>
			<div className="grid gap-4 lg:grid-cols-2">
				<AppDateRangeFilter
					data-cy="range-long"
					onChange={() => undefined}
					value={longRange}
				/>
				<AppDateRangeFilter
					data-cy="range-disabled"
					isDisabled
					onChange={() => undefined}
					value={longRange}
				/>
			</div>
		</LabSection>
	);
}
