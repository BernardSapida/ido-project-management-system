import { Label } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";
import type { DateRangePreset, DateRangeValue } from "../AppDateRangeFilter";
import { AppDateRangeFilter } from "../AppDateRangeFilter";
import { cn } from "../../lib/cn";

interface AppDateRangeFieldProps<T extends FieldValues> {
	className?: string;
	control: Control<T>;
	"data-cy"?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	label: string;
	maxValue?: CalendarDate;
	minValue?: CalendarDate;
	name: Path<T>;
	presets?: DateRangePreset[];
}

/**
 * AppDateRangeField - the react-hook-form binding for `AppDateRangeFilter`.
 * Return type: `{ start: CalendarDate; end: CalendarDate } | null`.
 *
 * `AppDateRangeFilter` is deliberately a standalone control: it takes a plain
 * `value`/`onChange` and reports a committed range, which is what a filter above
 * a table needs and what a form field cannot use directly. Rather than teach
 * that component about `control` and `name` - two jobs in one component, which
 * is the split its own doc comment draws - the RHF concerns live here: the
 * label, the required marker, the error message, and when the field counts as
 * touched.
 *
 * Prefer this over `AppDateRangePicker` when the range is a real choice the user
 * makes: it brings the presets rail and one-to-three month grids. The older
 * field is two segmented inputs and nothing else, which is still the right
 * answer for a range that is nearly always typed.
 *
 * ## data-cy
 *
 * The hook goes on the WRAPPER, so `[data-cy="x"]` scopes the label, the
 * control and the error message together. The control underneath gets
 * `x-picker`, and its popover - which renders in a portal, outside this DOM -
 * gets `x-picker-panel`.
 */
export function AppDateRangeField<T extends FieldValues>({
	className,
	control,
	"data-cy": dataCy,
	description,
	isDisabled,
	isRequired,
	label,
	maxValue,
	minValue,
	name,
	presets,
}: AppDateRangeFieldProps<T>) {
	const {
		field,
		fieldState: { error, invalid },
	} = useController({ name, control });

	return (
		<div
			className={cn("flex w-full flex-col gap-1.5", className)}
			data-cy={dataCy}
			/*
			 * Focus-within, not a plain onBlur. This control holds a trigger and two
			 * segmented date fields, so a bare handler would fire every time focus
			 * crossed between them - putting "Select a date range" under a field the
			 * user is still halfway through typing. Only focus actually LEAVING the
			 * control is an answer.
			 */
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					field.onBlur();
				}
			}}
		>
			{/* A span, not a label: the control below is a button plus two date
			    fields, so there is no single input for a `for` to point at. */}
			<Label
				elementType="span"
				isDisabled={isDisabled}
				isInvalid={invalid}
				isRequired={isRequired}
			>
				{label}
			</Label>

			<AppDateRangeFilter
				data-cy={dataCy ? `${dataCy}-picker` : undefined}
				isDisabled={isDisabled}
				label={label}
				maxValue={maxValue}
				minValue={minValue}
				/* Apply is the commit, so a change here is always a final answer -
				   marking it touched at the same moment is what lets a correction
				   clear the error immediately rather than on the next focus change. */
				onChange={(next) => {
					field.onChange(next);
					field.onBlur();
				}}
				presets={presets}
				value={(field.value as DateRangeValue | null) ?? null}
			/>

			{description && <p className="text-xs text-muted">{description}</p>}
			{/* Not HeroUI's <FieldError>: it is react-aria-components' FieldError and
			    reads its state from a Field context, which a trigger-plus-two-date-fields
			    control does not provide. Outside that context it renders nothing at all -
			    the same trap AppSwitch and AppCheckbox were in. */}
			{invalid && error?.message && (
				<p
					className="text-sm text-danger"
					data-slot="field-error"
				>
					{error.message}
				</p>
			)}
		</div>
	);
}
