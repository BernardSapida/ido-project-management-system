import { Description, FieldError, Label, ListBox, Select } from "@heroui/react";
import type { FieldValues } from "react-hook-form";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

interface SelectItem {
	label: string;
	value: string;
}

interface AppSelectBaseProps {
	className?: string;
	"data-cy"?: string;
	description?: string;
	isDisabled?: boolean;
	isLoading?: boolean;
	isRequired?: boolean;
	items: SelectItem[];
	label: string;
	placeholder?: string;
}

type AppSelectProps<T extends FieldValues> = AppSelectBaseProps & FieldBindingProps<string | null, T>;

/**
 * One choice from a short, closed list. No typing.
 *
 * Under ~10 options - past that the user is scrolling a viewport-height list to
 * find "Philippines" and the answer is `AppAutocomplete`. The rule is in
 * apps/web/CLAUDE.md; it is a judgement no lint rule can make.
 */
export function AppSelect<T extends FieldValues>({
	className,
	"data-cy": dataCy,
	description,
	isDisabled,
	isLoading,
	isRequired,
	items,
	label,
	placeholder,
	...binding
}: AppSelectProps<T>) {
	return (
		<FieldBinding
			binding={binding}
			emptyValue={null}
		>
			{(field) => (
				<SelectField
					className={className}
					data-cy={dataCy}
					description={description}
					field={field}
					isDisabled={isDisabled}
					isLoading={isLoading}
					isRequired={isRequired}
					items={items}
					label={label}
					placeholder={placeholder}
				/>
			)}
		</FieldBinding>
	);
}

function SelectField({
	className,
	"data-cy": dataCy,
	description,
	field,
	isDisabled,
	isLoading,
	isRequired,
	items,
	label,
	placeholder,
}: AppSelectBaseProps & { field: BoundField<string | null> }) {
	return (
		/* The wrapper carries `data-cy` because HeroUI's Select renders its popover
		   in a portal - a hook on the Select itself would not contain the listbox
		   a test needs to click through. */
		<div data-cy={dataCy}>
			<Select
				className={cn("w-full", className)}
				isDisabled={isDisabled || isLoading}
				isInvalid={field.isInvalid}
				isRequired={isRequired}
				name={field.name}
				onChange={(val) => {
					field.onChange((val as string | null) ?? null);
					// Choosing IS leaving, for a value that arrives from a popover.
					field.onBlur();
				}}
				onOpenChange={(isOpen) => {
					if (!isOpen) field.onBlur();
				}}
				placeholder={placeholder}
				selectionMode="single"
				value={field.value}
			>
				<Label>{label}</Label>
				<Select.Trigger>
					<Select.Value />
					<Select.Indicator />
				</Select.Trigger>
				<Select.Popover>
					<ListBox>
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
				</Select.Popover>
				{description ? <Description>{description}</Description> : null}
				<FieldError>{field.errorMessage}</FieldError>
			</Select>
		</div>
	);
}
