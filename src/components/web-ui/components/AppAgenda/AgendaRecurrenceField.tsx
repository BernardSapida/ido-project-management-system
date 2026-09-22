import { getLocalTimeZone, today } from "@internationalized/date";
import { Info } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type Control, useController, useForm } from "react-hook-form";
import { cn } from "../../lib/cn";
import { AppButton } from "../AppButton";
import { AppCheckbox } from "../AppCheckbox";
import { AppDatePicker } from "../AppDatePicker";
import { AppInputGroup } from "../AppInputGroup";
import { AppNumberField } from "../AppNumberField";
import { AppRichTooltip } from "../AppRichTooltip";
import { AppToggleButton } from "../AppToggleButton";
import type { AgendaEntryFormValues } from "./AgendaEntryForm";
import {
	buildRecurrenceRule,
	defaultRecurrenceState,
	monthlyWeekdayOrdinal,
	mondayIndexOf,
	parseRecurrenceRule,
	type RecurrenceBuilderState,
} from "./recurrence-rule";
import { summariseRecurrence } from "./recurrence-summary";

/* -------------------------------------------------------------------------- */

interface AgendaRecurrenceFieldProps {
	control: Control<AgendaEntryFormValues>;
	/**
	 * The entry's start day, as `YYYY-MM-DD`. The monthly options are phrased
	 * against it ("on day 15", "on the third Monday"), and it is a string rather
	 * than a `Date` so a new object every parent render does not re-seed the
	 * builder.
	 */
	referenceISODate: string;
}

const UNITS: { value: RecurrenceBuilderState["unit"]; one: string; many: string }[] = [
	{ value: "day", one: "Day", many: "Days" },
	{ value: "week", one: "Week", many: "Weeks" },
	{ value: "month", one: "Month", many: "Months" },
	{ value: "year", one: "Year", many: "Years" },
];

/** MO-indexed, matching `rrule`'s `Weekday.weekday`. */
const WEEKDAYS: { index: number; short: string; long: string }[] = [
	{ index: 0, short: "M", long: "Monday" },
	{ index: 1, short: "T", long: "Tuesday" },
	{ index: 2, short: "W", long: "Wednesday" },
	{ index: 3, short: "T", long: "Thursday" },
	{ index: 4, short: "F", long: "Friday" },
	{ index: 5, short: "S", long: "Saturday" },
	{ index: 6, short: "S", long: "Sunday" },
];

const ORDINAL_WORD: Record<number, string> = {
	[-1]: "last",
	1: "first",
	2: "second",
	3: "third",
	4: "fourth",
	5: "fifth",
};

const RRULE_TOKENS = [
	"FREQ=DAILY | WEEKLY | MONTHLY | YEARLY — how often it repeats",
	"INTERVAL=2 — skip to every 2nd day / week / …",
	"BYDAY=MO,WE,FR — which weekdays (weekly)",
	"BYDAY=3MO or -1FR — the nth or last weekday (monthly)",
	"BYMONTHDAY=15 — a fixed day of the month (-1 = last day)",
	"BYMONTHDAY=28,29,30;BYSETPOS=-1 — day 30, or month-end if shorter",
	"COUNT=10 — stop after 10 occurrences",
	"UNTIL=20261231T235959Z — stop on a date",
];

/* -------------------------------------------------------------------------- */

function parseISODate(iso: string): Date {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y, (m || 1) - 1, d || 1);
}

function clamp(n: number, lo: number, hi: number): number {
	return Math.min(Math.max(n, lo), hi);
}

/**
 * The builder's starting values: a parsed rule when there is one, the default
 * shape otherwise. When the parsed rule was not a fixed-day-of-month rule its
 * `monthDay` is a placeholder, so seed that from the entry's start day - a user
 * who switches to "Day of month" should land on the start date, not the 1st.
 */
function seedFrom(parsed: RecurrenceBuilderState | null, reference: Date): RecurrenceBuilderState {
	if (!parsed) return defaultRecurrenceState(reference);
	if (parsed.monthlyMode === "day-of-month") return parsed;
	return { ...parsed, monthDay: reference.getDate() };
}

function normalise(state: RecurrenceBuilderState): RecurrenceBuilderState {
	return {
		...state,
		interval: state.interval && state.interval >= 1 ? Math.floor(state.interval) : 1,
		endCount: state.endCount && state.endCount >= 1 ? Math.floor(state.endCount) : 1,
		monthDay: Number.isFinite(state.monthDay) ? clamp(Math.trunc(state.monthDay), 1, 31) : 1,
		weekdays: state.weekdays ?? [],
	};
}

/**
 * The "Custom" branch of the entry form's Repeat control: a visual builder for
 * the common shapes - "every 2 weeks on Mon and Wed, until a date" - that writes
 * a bare RRULE string into the form's `rrule` field, with a raw-text editor
 * behind it for anything the builder cannot express.
 */
export function AgendaRecurrenceField({ control, referenceISODate }: AgendaRecurrenceFieldProps) {
	const { field } = useController({ control, name: "rrule" });
	const reference = useMemo(() => parseISODate(referenceISODate), [referenceISODate]);

	// `field.onChange`'s identity churns every render; the write-back effect must
	// not depend on it or it re-subscribes on every keystroke elsewhere.
	const writeRule = useRef(field.onChange);
	writeRule.current = field.onChange;

	// Parse the incoming value exactly once, to decide the starting mode.
	const initial = useRef<{ raw: string; state: RecurrenceBuilderState | null } | undefined>(undefined);
	if (!initial.current) {
		const raw = (field.value as string | undefined) ?? "";
		initial.current = { raw, state: parseRecurrenceRule(raw) };
	}
	const openedOnUnrepresentable = Boolean(initial.current.raw) && initial.current.state === null;

	const [mode, setMode] = useState<"builder" | "raw">(openedOnUnrepresentable ? "raw" : "builder");

	const builderForm = useForm<RecurrenceBuilderState>({
		// A control host that is never submitted - the sanctioned bare `useForm`.
		defaultValues: seedFrom(initial.current.state, reference),
	});
	const state = normalise(builderForm.watch());

	// Builder -> form string. Seeds once on entry so picking "Custom" is never an
	// empty rule, then mirrors every change.
	useEffect(() => {
		if (mode !== "builder") return;
		writeRule.current(buildRecurrenceRule(normalise(builderForm.getValues()), reference));
		const sub = builderForm.watch((value) => {
			writeRule.current(buildRecurrenceRule(normalise(value as RecurrenceBuilderState), reference));
		});
		return () => sub.unsubscribe();
	}, [builderForm, reference, mode]);

	const rawValue = (field.value as string | undefined) ?? "";
	const rawIsRepresentable = useMemo(
		() => !rawValue.trim() || parseRecurrenceRule(rawValue) !== null,
		[rawValue],
	);

	const preview = summariseRecurrence(
		mode === "builder" ? buildRecurrenceRule(state, reference) : rawValue,
	);

	/* ---------------------------------------------------------------------- */

	if (mode === "raw") {
		return (
			<div className="flex flex-col gap-2 rounded-lg border border-border p-3">
				<AppInputGroup
					description="A raw RFC 5545 RRULE with no DTSTART line."
					endContent={
						<AppRichTooltip
							description="Join tokens with semicolons. No DTSTART line."
							icon={Info}
							points={RRULE_TOKENS}
							title="Recurrence rule syntax"
						>
							<AppButton
								aria-label="Recurrence rule syntax"
								icon={Info}
								isIconOnly
								size="sm"
								type="button"
								variant="tertiary"
							/>
						</AppRichTooltip>
					}
					label="Recurrence rule"
					name="rrule-raw"
					onBlur={field.onBlur}
					onChange={field.onChange}
					placeholder="FREQ=WEEKLY;BYDAY=MO,WE"
					value={rawValue}
				/>
				<PreviewLine text={preview} />
				{openedOnUnrepresentable && (
					<p className="text-warning text-xs">
						This rule uses options the visual builder can’t show. Edit it here, or clear it and switch back
						to start over.
					</p>
				)}
				<button
					className="self-start text-muted-foreground text-xs underline underline-offset-2 disabled:no-underline disabled:opacity-60"
					disabled={!rawIsRepresentable}
					onClick={() => {
						builderForm.reset(seedFrom(parseRecurrenceRule(rawValue), reference));
						setMode("builder");
					}}
					type="button"
				>
					{rawIsRepresentable ? "Use the visual builder" : "Too specific for the visual builder"}
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 rounded-lg border border-border p-3">
			<Row label="Repeat every">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<AppNumberField
						control={builderForm.control}
						label="Interval"
						maxValue={999}
						minValue={1}
						name="interval"
						step={1}
						variant="compact"
					/>
					<UnitPicker control={builderForm.control} plural={state.interval > 1} />
				</div>
			</Row>

			{state.unit === "week" && <WeekdayPicker control={builderForm.control} />}

			{state.unit === "month" && (
				<Row label="On">
					<SegmentedPicker
						aria-label="Monthly repeat"
						control={builderForm.control}
						name="monthlyMode"
						options={monthlyOptions(reference)}
					/>
					{state.monthlyMode === "day-of-month" && (
						<div className="flex flex-col gap-2 pt-1">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground text-sm">Day</span>
								<AppNumberField
									control={builderForm.control}
									label="Day of the month"
									maxValue={31}
									minValue={1}
									name="monthDay"
									step={1}
									variant="compact"
								/>
								<span className="text-muted-foreground text-sm">of the month</span>
							</div>
							{state.monthDay >= 29 && (
								<div className="flex flex-col gap-0.5">
									<AppCheckbox
										control={builderForm.control}
										label="Use the last day when a month is shorter"
										name="monthDayClamp"
									/>
									<p className="pl-6 text-muted-foreground text-xs">
										{state.monthDayClamp
											? `Months with no day ${state.monthDay} fall back to their last day.`
											: `Months with no day ${state.monthDay} are skipped — February always, plus the 30-day months for 31.`}
									</p>
								</div>
							)}
						</div>
					)}
				</Row>
			)}

			<Row label="Ends">
				<SegmentedPicker
					aria-label="Ends"
					control={builderForm.control}
					name="endMode"
					options={[
						{ value: "never", label: "Never" },
						{ value: "on", label: "On a date" },
						{ value: "after", label: "After…" },
					]}
				/>
				{state.endMode === "on" && (
					<div className="pt-1">
						<AppDatePicker
							control={builderForm.control}
							label="End date"
							minValue={today(getLocalTimeZone())}
							name="endDate"
							presets={[]}
						/>
					</div>
				)}
				{state.endMode === "after" && (
					<div className="flex items-center gap-2 pt-1">
						<AppNumberField
							control={builderForm.control}
							label="Occurrences"
							maxValue={999}
							minValue={1}
							name="endCount"
							step={1}
							variant="compact"
						/>
						<span className="text-muted-foreground text-sm">occurrences</span>
					</div>
				)}
			</Row>

			<div className="flex items-baseline justify-between gap-3 border-border/60 border-t pt-3">
				<PreviewLine text={preview} />
				<button
					className="shrink-0 text-muted-foreground text-xs underline underline-offset-2"
					onClick={() => setMode("raw")}
					type="button"
				>
					Edit as text
				</button>
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="font-medium text-muted-foreground text-xs">{label}</span>
			{children}
		</div>
	);
}

function SegmentedPicker({
	"aria-label": ariaLabel,
	control,
	name,
	options,
}: {
	"aria-label": string;
	control: Control<RecurrenceBuilderState>;
	name: "endMode" | "monthlyMode";
	options: { label: string; value: string }[];
}) {
	const { field } = useController({ control, name });
	return (
		<div aria-label={ariaLabel} className="flex flex-wrap gap-1" role="group">
			{options.map((option) => (
				<AppToggleButton
					isSelected={field.value === option.value}
					key={option.value}
					onChange={() => field.onChange(option.value)}
					size="sm"
					variant="ghost"
				>
					{option.label}
				</AppToggleButton>
			))}
		</div>
	);
}

function PreviewLine({ text }: { text: string | null }) {
	return (
		<p aria-live="polite" className="text-muted-foreground text-xs">
			{text ?? "Does not repeat"}
		</p>
	);
}

function UnitPicker({ control, plural }: { control: Control<RecurrenceBuilderState>; plural: boolean }) {
	const { field } = useController({ control, name: "unit" });
	return (
		<div aria-label="Repeat unit" className="flex flex-wrap gap-1" role="group">
			{UNITS.map((unit) => (
				<AppToggleButton
					isSelected={field.value === unit.value}
					key={unit.value}
					onChange={() => field.onChange(unit.value)}
					size="sm"
					variant="ghost"
				>
					{plural ? unit.many : unit.one}
				</AppToggleButton>
			))}
		</div>
	);
}

function WeekdayPicker({ control }: { control: Control<RecurrenceBuilderState> }) {
	const { field } = useController({ control, name: "weekdays" });
	const selected: number[] = field.value ?? [];

	return (
		<div className="flex flex-col gap-1.5">
			<span className="font-medium text-muted-foreground text-xs">On these days</span>
			<div aria-label="Days of the week" className="flex flex-wrap gap-1.5" role="group">
				{WEEKDAYS.map((day) => {
					const isOn = selected.includes(day.index);
					return (
						<AppToggleButton
							aria-label={day.long}
							className={cn("min-w-9", isOn && "font-semibold")}
							isSelected={isOn}
							key={day.long}
							onChange={() => {
								field.onChange(
									isOn
										? selected.filter((d) => d !== day.index)
										: [...selected, day.index].sort((a, b) => a - b),
								);
								field.onBlur();
							}}
							size="sm"
						>
							{day.short}
						</AppToggleButton>
					);
				})}
			</div>
		</div>
	);
}

function monthlyOptions(reference: Date): { label: string; value: string }[] {
	const ordinal = ORDINAL_WORD[monthlyWeekdayOrdinal(reference)] ?? "";
	const weekdayName = WEEKDAYS[mondayIndexOf(reference)].long;
	return [
		{ label: "Day of month", value: "day-of-month" },
		{ label: "Last day", value: "last-day" },
		{ label: `${ordinal ? `${ordinal[0].toUpperCase()}${ordinal.slice(1)} ` : ""}${weekdayName}`, value: "weekday-of-month" },
	];
}
