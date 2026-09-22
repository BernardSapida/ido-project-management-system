import {
	Autocomplete,
	Description,
	EmptyState,
	FieldError,
	Label,
	ListBox,
	SearchField,
	useFilter,
} from "@heroui/react";
import type { FieldValues } from "react-hook-form";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

interface AutocompleteItem {
	label: string;
	value: string;
}

interface AppAutocompleteBaseProps {
	className?: string;
	"data-cy"?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	items: AutocompleteItem[];
	label: string;
	placeholder?: string;
}

type AppAutocompleteProps<T extends FieldValues> = AppAutocompleteBaseProps & FieldBindingProps<string | null, T>;

/**
 * One choice from a long or fetched list.
 *
 * Closed it reads as a Select - a button showing the value - and the search
 * field lives inside the popover. That is the difference from `AppComboBox`,
 * whose trigger is a real text input and which can therefore accept a value
 * that is not on the list. This one cannot, structurally: there is nowhere for
 * unlisted text to go. Pick by the list, not by the look - the rule is in
 * apps/web/CLAUDE.md.
 */
export function AppAutocomplete<T extends FieldValues>({
	className,
	"data-cy": dataCy,
	description,
	isDisabled,
	isRequired,
	items,
	label,
	placeholder,
	...binding
}: AppAutocompleteProps<T>) {
	return (
		<FieldBinding
			binding={binding}
			emptyValue={null}
		>
			{(field) => (
				<AutocompleteField
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

function AutocompleteField({
	className,
	"data-cy": dataCy,
	description,
	field,
	isDisabled,
	isRequired,
	items,
	label,
	placeholder,
}: AppAutocompleteBaseProps & { field: BoundField<string | null> }) {
	const { contains } = useFilter({ sensitivity: "base" });

	return (
		<Autocomplete
			className={cn("w-full", className)}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={field.isInvalid}
			isRequired={isRequired}
			onChange={(key) => {
				field.onChange(key ? String(key) : null);
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
			<Autocomplete.Trigger>
				<Autocomplete.Value />
				<Autocomplete.ClearButton />
				<Autocomplete.Indicator />
			</Autocomplete.Trigger>
			<Autocomplete.Popover>
				<Autocomplete.Filter filter={contains}>
					{/* The placeholder is not an accessible name - React Aria warns for
					    this field having none, and re-warns on every render, which hovering
					    an option causes. There is deliberately no visible label: the search
					    icon and placeholder carry it for sighted users inside a popover
					    that is already named by the field's own Label. */}
					<SearchField
						aria-label={`Search ${label.toLowerCase()}`}
						autoFocus
						name={field.name ? `${field.name}-search` : undefined}
						variant="secondary"
					>
						<SearchField.Group>
							<SearchField.SearchIcon />
							<SearchField.Input placeholder={`Search ${label.toLowerCase()}...`} />
							<SearchField.ClearButton />
						</SearchField.Group>
					</SearchField>
					<ListBox renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
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
				</Autocomplete.Filter>
			</Autocomplete.Popover>
			{description ? <Description>{description}</Description> : null}
			<FieldError>{field.errorMessage}</FieldError>
		</Autocomplete>
	);
}
