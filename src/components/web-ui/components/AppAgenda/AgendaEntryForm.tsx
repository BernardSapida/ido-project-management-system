import {
	CalendarDate,
	CalendarDateTime,
	getLocalTimeZone,
	Time,
} from "@internationalized/date";
import { type Control, useController, useForm } from "react-hook-form";
import { cn } from "../../lib/cn";
import { AppButton } from "../AppButton";
import { AppDateRangePicker } from "../AppDateRangePicker";
import { AppInputGroup } from "../AppInputGroup";
import { AppSelect } from "../AppSelect";
import { AppSwitch } from "../AppSwitch";
import { AppTextArea } from "../AppTextArea";
import { AppTimeField } from "../AppTimeField";
import { AgendaRecurrenceField } from "./AgendaRecurrenceField";
import type { AgendaEntryDraft } from "./agenda.types";
import {
	presetToRule,
	type RecurrencePreset,
	ruleToPreset,
} from "./recurrence-summary";

type CalendarDateRange = { start: CalendarDate; end: CalendarDate } | null;

/**
 * The flat values the form binds to. Dates and times are the
 * `@internationalized/date` shapes the App date/time wrappers return; the web
 * layer composes them into an ISO `startsAt`/`endsAt` on submit.
 *
 * The day span is ONE `AppDateRangePicker` (`dateRange`), and for a timed entry
 * the hour of each end is a separate `AppTimeField` - a range picker has no time
 * segments, and an all-day entry needs none.
 *
 * NOTE: this schema lives here, not in `@app/shared-schemas`, because
 * `libs/web/ui` is published and cannot import app code. The api still validates
 * the composed `CreateSchedulerEntryInput` against the shared object - this form
 * only enforces "the required fields are filled", and the bare `useForm` (no
 * resolver) is the sanctioned lab-style exception.
 */
export interface AgendaEntryFormValues {
	title: string;
	isAllDay: boolean;
	dateRange: CalendarDateRange;
	startTime: Time | null;
	endTime: Time | null;
	description: string;
	repeat: RecurrencePreset;
	rrule: string;
	color: string;
}

interface AgendaEntryFormProps {
	mode: "create" | "edit";
	initial?: AgendaEntryDraft;
	/** IANA zone the composed instants are resolved against. */
	timeZone?: string;
	onSubmit: (draft: AgendaEntryDraft) => void | Promise<void>;
	onCancel: () => void;
}

const REPEAT_ITEMS: { label: string; value: RecurrencePreset }[] = [
	{ label: "Does not repeat", value: "none" },
	{ label: "Daily", value: "daily" },
	{ label: "Weekly", value: "weekly" },
	{ label: "Monthly", value: "monthly" },
	{ label: "Custom rule", value: "custom" },
];

/**
 * A fixed palette, picked not typed. A hex text field is the wrong control for a
 * value nobody in this form needs to be exact about - the reader only ever wants
 * "the blue one", and a swatch says that in one click.
 */
const COLOUR_SWATCHES: { hex: string; name: string }[] = [
	{ hex: "#2563eb", name: "Blue" },
	{ hex: "#16a34a", name: "Green" },
	{ hex: "#d97706", name: "Amber" },
	{ hex: "#dc2626", name: "Red" },
	{ hex: "#7c3aed", name: "Violet" },
	{ hex: "#db2777", name: "Pink" },
	{ hex: "#0d9488", name: "Teal" },
	{ hex: "#475569", name: "Slate" },
];

export function AgendaEntryForm({
	mode,
	initial,
	timeZone = getLocalTimeZone(),
	onSubmit,
	onCancel,
}: AgendaEntryFormProps) {
	const { control, handleSubmit, watch } = useForm<AgendaEntryFormValues>({
		defaultValues: toFormValues(initial),
	});

	const isAllDay = watch("isAllDay");
	const repeat = watch("repeat");
	const dateRange = watch("dateRange");
	const referenceISODate = isoDay(dateRange?.start ?? null);

	const submit = handleSubmit(async (values) => {
		const start = compose(
			values.dateRange?.start ?? null,
			values.isAllDay ? null : values.startTime,
			timeZone,
		);
		const end = compose(
			values.dateRange?.end ?? null,
			values.isAllDay ? null : values.endTime,
			timeZone,
		);
		if (!start || !end) return;
		await onSubmit({
			entryId: initial?.entryId,
			title: values.title.trim(),
			description: values.description.trim() || undefined,
			// No location input in this form; an edit keeps whatever the entry had.
			location: initial?.location ?? undefined,
			color: values.color.trim() || undefined,
			isAllDay: values.isAllDay,
			startsAt: start.toISOString(),
			endsAt: end.toISOString(),
			recurrenceRule: presetToRule(values.repeat, values.rrule),
			scope: initial?.scope,
			occurrenceStart: initial?.occurrenceStart,
		});
	});

	return (
		<form className="flex flex-col gap-4" onSubmit={submit}>
			<AppInputGroup control={control} isRequired label="Title" name="title" placeholder="What is it?" />

			<AppSwitch control={control} label="All day" name="isAllDay" />

			<AppDateRangePicker control={control} isRequired label="Dates" name="dateRange" />
			{!isAllDay && (
				<div className="grid grid-cols-2 gap-3">
					<AppTimeField control={control} isRequired label="Start time" name="startTime" />
					<AppTimeField control={control} isRequired label="End time" name="endTime" />
				</div>
			)}

			<AppTextArea
				control={control}
				label="Notes"
				maxLength={4000}
				name="description"
				placeholder="Optional"
				rows={3}
			/>

			<AppSelect control={control} items={REPEAT_ITEMS} label="Repeat" name="repeat" />
			{repeat === "custom" && (
				<AgendaRecurrenceField control={control} referenceISODate={referenceISODate} />
			)}

			<ColourSwatchField control={control} />

			<div className="flex justify-end gap-2 pt-2">
				<AppButton onPress={onCancel} type="button" variant="tertiary">
					Cancel
				</AppButton>
				<AppButton type="submit">{mode === "create" ? "Create" : "Save"}</AppButton>
			</div>
		</form>
	);
}

function ColourSwatchField({ control }: { control: Control<AgendaEntryFormValues> }) {
	const { field } = useController({ control, name: "color" });
	const current = ((field.value as string) || "").toLowerCase();

	return (
		<div className="flex flex-col gap-1.5">
			<span className="font-medium text-muted-foreground text-xs">Colour</span>
			<div aria-label="Colour" className="flex flex-wrap gap-2" role="radiogroup">
				{COLOUR_SWATCHES.map((swatch) => {
					const isSelected = current === swatch.hex;
					return (
						<button
							aria-checked={isSelected}
							aria-label={swatch.name}
							className={cn(
								"size-7 cursor-pointer rounded-full outline-none ring-offset-2 transition-transform hover:scale-110",
								"focus-visible:ring-2 focus-visible:ring-focus",
								isSelected && "ring-2 ring-foreground",
							)}
							key={swatch.hex}
							onClick={() => {
								field.onChange(isSelected ? "" : swatch.hex);
								field.onBlur();
							}}
							role="radio"
							style={{ backgroundColor: swatch.hex }}
							type="button"
						/>
					);
				})}
			</div>
		</div>
	);
}

function toFormValues(draft?: AgendaEntryDraft): AgendaEntryFormValues {
	if (!draft) {
		return {
			title: "",
			isAllDay: false,
			dateRange: null,
			startTime: null,
			endTime: null,
			description: "",
			repeat: "none",
			rrule: "",
			color: "",
		};
	}
	const start = new Date(draft.startsAt);
	const end = new Date(draft.endsAt);
	return {
		title: draft.title,
		isAllDay: draft.isAllDay,
		dateRange: { start: toCalendarDate(start), end: toCalendarDate(end) },
		startTime: draft.isAllDay ? null : toTime(start),
		endTime: draft.isAllDay ? null : toTime(end),
		description: draft.description ?? "",
		repeat: ruleToPreset(draft.recurrenceRule),
		rrule: draft.recurrenceRule ?? "",
		color: draft.color ?? "",
	};
}

function toCalendarDate(date: Date): CalendarDate {
	return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * `YYYY-MM-DD` for the recurrence builder to phrase its monthly options against
 * ("day 15", "the third Monday"). Falls back to today while the date range is
 * still empty, so the builder always has a reference day.
 */
function isoDay(date: CalendarDate | null): string {
	const d = date ?? toCalendarDate(new Date());
	return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

function toTime(date: Date): Time {
	return new Time(date.getHours(), date.getMinutes());
}

function compose(date: CalendarDate | null, time: Time | null, timeZone: string): Date | null {
	if (!date) return null;
	const dt = new CalendarDateTime(
		date.year,
		date.month,
		date.day,
		time?.hour ?? 0,
		time?.minute ?? 0,
	);
	return dt.toDate(timeZone);
}
