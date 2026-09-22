import { Checkbox, Label } from "@heroui/react";
import type { ReactNode } from "react";
import type { FieldValues } from "react-hook-form";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

interface AppCheckboxBaseProps {
	className?: string;
	"data-cy"?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	/**
	 * A node rather than a string, because the most common checkbox in any app is
	 * a consent one and its label has links in it - "I agree to the Terms and
	 * Privacy". A string type here is what pushes that single case back onto a
	 * raw HeroUI Checkbox, which is how the app ends up with one unwired consent
	 * box outside the form.
	 *
	 * Keep it to a phrase. Anything that needs a paragraph is a description
	 * beside the field, not the thing the box is labelled with.
	 */
	label: ReactNode;
}

type AppCheckboxProps<T extends FieldValues> = AppCheckboxBaseProps & FieldBindingProps<boolean, T>;

/** A single boolean. For several under one legend, `AppCheckboxGroup`. */
export function AppCheckbox<T extends FieldValues>({
	className,
	"data-cy": dataCy,
	isDisabled,
	isRequired,
	label,
	...binding
}: AppCheckboxProps<T>) {
	return (
		<FieldBinding
			binding={binding}
			emptyValue={false}
		>
			{(field) => (
				<CheckboxField
					className={className}
					data-cy={dataCy}
					field={field}
					isDisabled={isDisabled}
					isRequired={isRequired}
					label={label}
				/>
			)}
		</FieldBinding>
	);
}

function CheckboxField({
	className,
	"data-cy": dataCy,
	field,
	isDisabled,
	isRequired,
	label,
}: AppCheckboxBaseProps & { field: BoundField<boolean> }) {
	return (
		<div
			className={cn("flex flex-col gap-1", className)}
			data-cy={dataCy}
		>
			<Checkbox
				isDisabled={isDisabled}
				isRequired={isRequired}
				isSelected={Boolean(field.value)}
				name={field.name}
				onBlur={field.onBlur}
				/* onBlur fires on change as well as on tab-out - a box is either
				   ticked or it is not, so the answer is final the moment it
				   changes. Without this the field is never marked touched and
				   `mode: "onBlur"` can never validate it. */
				onChange={(checked) => {
					field.onChange(checked);
					field.onBlur();
				}}
			>
				<Checkbox.Content>
					<Checkbox.Control>
						<Checkbox.Indicator />
					</Checkbox.Control>
					<Label>{label}</Label>
				</Checkbox.Content>
			</Checkbox>
			{/* Not HeroUI's <FieldError> - see AppSwitch. It needs a Field context that
			    a bare Checkbox in a div does not provide, and renders nothing without
			    one, which left this field unable to show its error. */}
			{field.errorMessage ? (
				<p
					className="text-sm text-danger"
					data-slot="field-error"
				>
					{field.errorMessage}
				</p>
			) : null}
		</div>
	);
}
