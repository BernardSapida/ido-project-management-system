/**
 * AppDateRangePicker - RHF-bound date range picker.
 * Return type: { start: CalendarDate; end: CalendarDate } | null
 * Use `calendarDateRangeSchema` from @/lib/schemas/date.schema for Zod validation.
 *
 * Clearing is always available once both ends are set, as it is on
 * `AppDatePicker`. A range is the value most worth being able to retract: it is
 * two dates, so it is the one a user is most likely to get half wrong, and
 * emptying four segments by hand to start again is not an answer.
 */
import { DateField, DateRangePicker, FieldError, Label, RangeCalendar } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import { X } from "lucide-react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";
import { AppButton } from "../AppButton";
import { cn } from "../../lib/cn";

interface AppDateRangePickerProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	minValue?: CalendarDate;
	maxValue?: CalendarDate;
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppDateRangePicker<T extends FieldValues>({
	name,
	label,
	control,
	minValue,
	maxValue,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppDateRangePickerProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	const selected = (field.value ?? null) as { end: CalendarDate; start: CalendarDate } | null;

	function commit(next: { end: CalendarDate; start: CalendarDate } | null) {
		field.onChange(next);
		field.onBlur();
	}

	return (
		<DateRangePicker
			className={cn("w-full", className)}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={invalid}
			isRequired={isRequired}
			maxValue={maxValue}
			minValue={minValue}
			onBlur={field.onBlur}
			onChange={(val) => commit(val as { end: CalendarDate; start: CalendarDate } | null)}
			value={selected}
		>
			<Label>{label}</Label>
			<DateField.Group fullWidth>
				<DateField.Input slot="start">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
				<DateRangePicker.RangeSeparator />
				<DateField.Input slot="end">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
				{/*
				 * `gap-1`, because HeroUI's suffix has none - it was built for one
				 * glyph. The calendar trigger stays exactly where it sits on an empty
				 * field: the suffix is anchored to the right, so the clear button is
				 * inserted to its LEFT and nothing after it moves.
				 */}
				<DateField.Suffix className="gap-1">
					{/*
					 * `size-6` overrides the sm icon button's 32px box down to the 24px
					 * the calendar trigger beside it occupies. Two affordances in one
					 * field have to be the same weight, or the clear button reads as the
					 * field's main control and the calendar as its decoration.
					 *
					 * Hidden while disabled, where it would be the one live control in a
					 * dead field.
					 */}
					{selected && !isDisabled ? (
						<AppButton
							aria-label={`Clear ${label}`}
							className="size-6"
							icon={X}
							isIconOnly
							onPress={() => commit(null)}
							size="sm"
							variant="ghost"
						/>
					) : null}
					{/*
					 * `w-auto`, undoing HeroUI's `w-full`. That width is a no-op while
					 * the trigger is the suffix's only child - 100% of a box it is the
					 * whole content of - but the clear button makes it a second child,
					 * and the trigger then claims the width of BOTH. It is a flex row
					 * aligned to the start, so the surplus lands after the glyph.
					 */}
					<DateRangePicker.Trigger className="w-auto shrink-0">
						<DateRangePicker.TriggerIndicator />
					</DateRangePicker.Trigger>
				</DateField.Suffix>
			</DateField.Group>
			<DateRangePicker.Popover>
				<RangeCalendar aria-label={label}>
					<RangeCalendar.Header>
						<RangeCalendar.YearPickerTrigger>
							<RangeCalendar.YearPickerTriggerHeading />
							<RangeCalendar.YearPickerTriggerIndicator />
						</RangeCalendar.YearPickerTrigger>
						<RangeCalendar.NavButton slot="previous" />
						<RangeCalendar.NavButton slot="next" />
					</RangeCalendar.Header>
					<RangeCalendar.Grid>
						<RangeCalendar.GridHeader>
							{(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
						</RangeCalendar.GridHeader>
						<RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
					</RangeCalendar.Grid>
					<RangeCalendar.YearPickerGrid>
						<RangeCalendar.YearPickerGridBody>
							{({ year }) => <RangeCalendar.YearPickerCell year={year} />}
						</RangeCalendar.YearPickerGridBody>
					</RangeCalendar.YearPickerGrid>
				</RangeCalendar>
			</DateRangePicker.Popover>
			<FieldError>{error?.message}</FieldError>
		</DateRangePicker>
	);
}
