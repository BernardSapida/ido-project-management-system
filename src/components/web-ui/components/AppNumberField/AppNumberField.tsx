import { Description, FieldError, Label, NumberField } from "@heroui/react";
import type { FieldValues } from "react-hook-form";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

interface AppNumberFieldBaseProps {
	className?: string;
	"data-cy"?: string;
	/**
	 * State the accepted range here whenever `minValue`/`maxValue` are set:
	 * NumberField clamps out-of-range input on commit, so a limit the user was
	 * never told about reads as the field rewriting what they typed.
	 */
	description?: string;
	formatOptions?: Intl.NumberFormatOptions;
	isDisabled?: boolean;
	isRequired?: boolean;
	label: string;
	maxValue?: number;
	minValue?: number;
	step?: number;
	/**
	 * Drop the label and the stepper buttons' spacing to a compact inline row -
	 * the "number stepper" shape, for a quantity in a cart line or a table cell
	 * where typing the number is the rare path. Same component, because the
	 * behaviour, the clamping and the locale formatting are all identical; only
	 * the density differs. See `/components/number-stepper`.
	 */
	variant?: "compact" | "field";
}

type AppNumberFieldProps<T extends FieldValues> = AppNumberFieldBaseProps & FieldBindingProps<number | null, T>;

/** A number with locale-aware formatting, clamped bounds, and no way to type
 *  letters into it. */
export function AppNumberField<T extends FieldValues>({
	className,
	"data-cy": dataCy,
	description,
	formatOptions,
	isDisabled,
	isRequired,
	label,
	maxValue,
	minValue,
	step,
	variant = "field",
	...binding
}: AppNumberFieldProps<T>) {
	return (
		<FieldBinding
			binding={binding}
			emptyValue={null}
		>
			{(field) => (
				<NumberFieldControl
					className={className}
					data-cy={dataCy}
					description={description}
					field={field}
					formatOptions={formatOptions}
					isDisabled={isDisabled}
					isRequired={isRequired}
					label={label}
					maxValue={maxValue}
					minValue={minValue}
					step={step}
					variant={variant}
				/>
			)}
		</FieldBinding>
	);
}

function NumberFieldControl({
	className,
	"data-cy": dataCy,
	description,
	field,
	formatOptions,
	isDisabled,
	isRequired,
	label,
	maxValue,
	minValue,
	step,
	variant,
}: AppNumberFieldBaseProps & { field: BoundField<number | null> }) {
	const isCompact = variant === "compact";

	return (
		<NumberField
			className={cn(isCompact ? "w-auto" : "w-full", className)}
			data-cy={dataCy}
			formatOptions={formatOptions}
			isDisabled={isDisabled}
			isInvalid={field.isInvalid}
			isRequired={isRequired}
			maxValue={maxValue}
			minValue={minValue}
			onBlur={field.onBlur}
			// An empty field parses as NaN, which is not a number the form should
			// store - `null` is what "they cleared it" means, and what a schema can
			// then reject with a message.
			onChange={(val) => field.onChange(Number.isNaN(val) ? null : val)}
			step={step}
			// NumberField wants `undefined` for empty; the form stores `null`.
			value={field.value ?? undefined}
		>
			{/* The compact variant still HAS a label - it is just not drawn. An
			    unlabelled spinner is unreachable by voice control and unnameable to a
			    screen reader, and "the row it sits in explains it" is only true for
			    someone who can see the row. */}
			<Label className={cn(isCompact && "sr-only")}>{label}</Label>
			<NumberField.Group>
				<NumberField.DecrementButton />
				<NumberField.Input className={cn(isCompact && "w-12 text-center")} />
				<NumberField.IncrementButton />
			</NumberField.Group>
			{description ? <Description>{description}</Description> : null}
			<FieldError>{field.errorMessage}</FieldError>
		</NumberField>
	);
}
