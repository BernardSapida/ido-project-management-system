/**
 * AppTimeField - RHF-bound time input.
 * Return type: Time (from @internationalized/date).
 * Zod schema: z.custom<Time>((v) => v instanceof Time, "Select a time")
 */
import { Description, FieldError, Label, TimeField } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";
import { cn } from "../../lib/cn";

interface AppTimeFieldProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppTimeField<T extends FieldValues>({
	name,
	label,
	control,
	description,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppTimeFieldProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	return (
		<TimeField
			className={cn("w-full", className)}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={invalid}
			isRequired={isRequired}
			onBlur={field.onBlur}
			onChange={(val) => {
				field.onChange(val);
			}}
			value={field.value ?? null}
		>
			<Label>{label}</Label>
			<TimeField.Group>
				<TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
			</TimeField.Group>
			{description && <Description>{description}</Description>}
			<FieldError>{error?.message}</FieldError>
		</TimeField>
	);
}
