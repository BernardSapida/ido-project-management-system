import { ComboBox, Description, FieldError, Input, Label, ListBox } from "@heroui/react";
import type { FieldValues } from "react-hook-form";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

interface ComboBoxItem {
	label: string;
	value: string;
}

interface AppComboBoxBaseProps {
	/**
	 * Let the user commit a value that is not on the list.
	 *
	 * THIS is what separates a ComboBox from an Autocomplete, and it is the only
	 * thing that does - both narrow a list by typing, but only this one's trigger
	 * is a real text input, so only this one can keep what was typed. Without it
	 * the component is a worse-looking Autocomplete, which is exactly what it was
	 * until `allowsCustomValue` was wired up.
	 *
	 * Off by default: accepting arbitrary text is a decision about the DATA - a
	 * `role` column with three legal values must never take a fourth - so it has
	 * to be asked for rather than inherited.
	 */
	allowsCustomValue?: boolean;
	className?: string;
	"data-cy"?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	items: ComboBoxItem[];
	label: string;
	placeholder?: string;
}

type AppComboBoxProps<T extends FieldValues> = AppComboBoxBaseProps & FieldBindingProps<string | null, T>;

/**
 * One choice from a list you can also type into.
 *
 * Reach for this over `AppAutocomplete` ONLY when `allowsCustomValue` is the
 * point - "pick a client, or type a new one". The two look different closed
 * (this is a text field with a caret; Autocomplete is a button showing the
 * value) and the rule for choosing lives in apps/web/CLAUDE.md, but free-text
 * entry is the capability Autocomplete structurally cannot have: its trigger is
 * a button, so there is nowhere for unlisted text to live.
 */
export function AppComboBox<T extends FieldValues>({
	allowsCustomValue,
	className,
	"data-cy": dataCy,
	description,
	isDisabled,
	isRequired,
	items,
	label,
	placeholder,
	...binding
}: AppComboBoxProps<T>) {
	return (
		<FieldBinding
			binding={binding}
			emptyValue={null}
		>
			{(field) => (
				<ComboBoxField
					allowsCustomValue={allowsCustomValue}
					className={className}
					data-cy={dataCy}
					description={description}
					field={field}
					isDisabled={isDisabled}
					isRequired={isRequired}
					items={items}
					label={label}
					placeholder={placeholder}
				/>
			)}
		</FieldBinding>
	);
}

function ComboBoxField({
	allowsCustomValue,
	className,
	"data-cy": dataCy,
	description,
	field,
	isDisabled,
	isRequired,
	items,
	label,
	placeholder,
}: AppComboBoxBaseProps & { field: BoundField<string | null> }) {
	return (
		<ComboBox
			allowsCustomValue={allowsCustomValue}
			className={cn("w-full", className)}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={field.isInvalid}
			isRequired={isRequired}
			name={field.name}
			onBlur={field.onBlur}
			onChange={(key) => {
				field.onChange(key ? String(key) : null);
				/*
				 * Committing IS leaving, for a control whose value arrives from a
				 * popover. Without this the field stays untouched until focus moves
				 * somewhere else, so `mode: "onBlur"` never re-checks it and a
				 * required error sits under a field that has just been answered.
				 */
				field.onBlur();
			}}
			value={field.value}
		>
			<Label>{label}</Label>
			<ComboBox.InputGroup>
				<Input placeholder={placeholder} />
				<ComboBox.Trigger />
			</ComboBox.InputGroup>
			<ComboBox.Popover>
				{/* Custom values need somewhere to be typed, not somewhere to be
				    picked - so an empty filtered list is a normal state here rather
				    than the dead end it is in a closed list. */}
				<ListBox
					renderEmptyState={
						allowsCustomValue
							? () => <p className="p-3 text-sm text-text-secondary">Press Enter to use what you typed</p>
							: undefined
					}
				>
					{items.map((item) => (
						<ListBox.Item
							id={item.value}
							key={item.value}
							textValue={item.label}
						>
							{item.label}
							<ListBox.ItemIndicator />
						</ListBox.Item>
					))}
				</ListBox>
			</ComboBox.Popover>
			{description ? <Description>{description}</Description> : null}
			<FieldError>{field.errorMessage}</FieldError>
		</ComboBox>
	);
}
