import { Description, Label, Switch } from "@heroui/react";
import type { FieldValues } from "react-hook-form";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

interface AppSwitchBaseProps {
	className?: string;
	"data-cy"?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	label: string;
}

type AppSwitchProps<T extends FieldValues> = AppSwitchBaseProps & FieldBindingProps<boolean, T>;

/**
 * A setting that applies the moment it moves - no Save, no confirmation.
 *
 * Not interchangeable with `AppCheckbox`: a checkbox states an intention that a
 * Save button later commits, a switch has already done the thing. Picking the
 * wrong one changes what the user thinks pressing it did.
 */
export function AppSwitch<T extends FieldValues>({
	className,
	"data-cy": dataCy,
	description,
	isDisabled,
	isRequired,
	label,
	...binding
}: AppSwitchProps<T>) {
	return (
		<FieldBinding
			binding={binding}
			emptyValue={false}
		>
			{(field) => (
				<SwitchField
					className={className}
					data-cy={dataCy}
					description={description}
					field={field}
					isDisabled={isDisabled}
					isRequired={isRequired}
					label={label}
				/>
			)}
		</FieldBinding>
	);
}

function SwitchField({
	className,
	"data-cy": dataCy,
	description,
	field,
	isDisabled,
	isRequired,
	label,
}: AppSwitchBaseProps & { field: BoundField<boolean> }) {
	return (
		<div
			className={cn("flex flex-col gap-1", className)}
			data-cy={dataCy}
		>
			<Switch
				className="w-full"
				isDisabled={isDisabled}
				isRequired={isRequired}
				isSelected={Boolean(field.value)}
				name={field.name}
				onBlur={field.onBlur}
				/* onBlur fires on change as well as on tab-out. A toggle has no
				   "still typing" state, so the answer is final the moment it
				   flips - and without this the field is never marked touched, so
				   `mode: "onBlur"` can never validate it. Same reason
				   AppRadioGroup and AppCheckboxGroup do it. */
				onChange={(val) => {
					field.onChange(val);
					field.onBlur();
				}}
			>
				<Switch.Content className="w-full items-center justify-between gap-3">
					<span className="flex flex-col gap-0.5 text-left">
						<Label>{label}</Label>
						{description ? <Description>{description}</Description> : null}
					</span>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
				</Switch.Content>
			</Switch>
			{/* NOT HeroUI's <FieldError>. That one is react-aria-components' FieldError,
			    which reads its state from a Field context - and there is no Field here,
			    only a bare Switch in a div. Outside that context it renders NOTHING, so
			    this field silently had no way to show a validation message at all.
			    A plain element with the same data-slot is what actually renders. */}
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
