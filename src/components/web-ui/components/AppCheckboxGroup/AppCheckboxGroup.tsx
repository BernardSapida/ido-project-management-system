import { Checkbox, CheckboxGroup, Description, FieldError, Label } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import type { FieldValues } from "react-hook-form";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

interface CheckboxGroupItem {
	description?: string;
	/** An optional leading Lucide icon, muted until the tile is selected. */
	icon?: LucideIcon;
	label: string;
	value: string;
}

interface AppCheckboxGroupBaseProps {
	className?: string;
	"data-cy"?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	items: CheckboxGroupItem[];
	label: string;
	/**
	 * How the tiles are arranged.
	 * - `auto` (default) - a wrapping grid from the `sm` breakpoint up, a single
	 *   column below it.
	 * - `horizontal` - always a wrapping grid, at every width.
	 * - `vertical` - always a single column.
	 */
	orientation?: "auto" | "horizontal" | "vertical";
}

type AppCheckboxGroupProps<T extends FieldValues> = AppCheckboxGroupBaseProps & FieldBindingProps<string[], T>;

/* A compact selectable tile. The whole tile is the hit target - the padding
   lives on Checkbox.Content, which is the button. A 3% wash and a tinted edge on
   hover, then a 2px accent border, a 4% wash and an accent label once selected;
   the accent mixes climb 3 -> 4 -> 8% so hover never out-shouts the resting
   selected state. Tile size is border-box, so the 1 -> 2px border only nudges
   the inner content, never the grid around it. */
const TILE_BASE =
	"group relative rounded-lg border border-border bg-surface transition-[background-color,border-color] duration-200 motion-reduce:transition-none " +
	"hover:border-[color-mix(in_oklab,var(--accent)_30%,var(--border))] hover:bg-[color-mix(in_oklab,var(--accent)_3%,var(--surface))] " +
	"has-[[data-focus-visible]]:outline-2 has-[[data-focus-visible]]:outline-offset-2 has-[[data-focus-visible]]:outline-focus " +
	"data-selected:border-2 data-selected:border-accent " +
	"data-selected:bg-[color-mix(in_oklab,var(--accent)_4%,var(--surface))] " +
	"data-selected:hover:border-accent data-selected:hover:bg-[color-mix(in_oklab,var(--accent)_8%,var(--surface))] " +
	"data-disabled:cursor-not-allowed data-disabled:opacity-60";

const GRID_BY_ORIENTATION = {
	auto: "sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]",
	horizontal: "grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]",
	vertical: "",
} as const;

/** Several booleans under one legend, holding a `string[]`. One error for the
 *  group, not one per box - the rule is about the answer, not about a tick. */
export function AppCheckboxGroup<T extends FieldValues>({
	className,
	"data-cy": dataCy,
	description,
	isDisabled,
	isRequired,
	items,
	label,
	orientation = "auto",
	...binding
}: AppCheckboxGroupProps<T>) {
	return (
		<FieldBinding
			binding={binding}
			emptyValue={EMPTY}
		>
			{(field) => (
				<CheckboxGroupField
					className={className}
					data-cy={dataCy}
					description={description}
					field={field}
					isDisabled={isDisabled}
					isRequired={isRequired}
					items={items}
					label={label}
					orientation={orientation}
				/>
			)}
		</FieldBinding>
	);
}

/** Hoisted, not inline: a fresh `[]` on every render is a new value identity,
 *  which is enough to retrigger effects a caller hangs off the field. */
const EMPTY: string[] = [];

/** Icon on the label's line, description beneath. */
function OptionLabel({ description, icon: Icon, label }: Omit<CheckboxGroupItem, "value">) {
	return (
		<span className="flex min-w-0 flex-col gap-0.5 text-left">
			<span className="flex items-center gap-2">
				{Icon ? (
					<Icon
						aria-hidden
						className="size-4 shrink-0 text-muted transition-colors group-data-selected:text-accent motion-reduce:transition-none"
					/>
				) : null}
				<Label className="text-text-primary! transition-colors group-data-selected:text-accent!">{label}</Label>
			</span>
			{description ? <Description>{description}</Description> : null}
		</span>
	);
}

function CheckboxGroupField({
	className,
	"data-cy": dataCy,
	description,
	field,
	isDisabled,
	isRequired,
	items,
	label,
	orientation,
}: AppCheckboxGroupBaseProps & { field: BoundField<string[]> }) {
	return (
		<CheckboxGroup
			/* `gap-2` spaces the label, group description and error from the grid;
			   `mt-0` cancels the `mt-4` HeroUI puts between items, since the tiles
			   live in our own grid and its `gap` owns their spacing. */
			className={cn("gap-2 **:data-[slot=checkbox]:mt-0", className)}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={field.isInvalid}
			isRequired={isRequired}
			name={field.name}
			/* Same reason as AppRadioGroup: leaving the group untouched is an
			   answer, and `mode: "onBlur"` can only see it if blur is wired. */
			onBlur={field.onBlur}
			onChange={(val) => {
				field.onChange(val);
				field.onBlur();
			}}
			value={field.value}
		>
			<Label>{label}</Label>
			{description ? <Description>{description}</Description> : null}
			<div className={cn("grid grid-cols-1 gap-3", GRID_BY_ORIENTATION[orientation ?? "auto"])}>
				{/* Raw Checkbox, deliberately. AppCheckbox registers ONE checkbox as
				    its own form field; the options inside a group are not individual
				    fields, they are values of the single field this component already
				    is. */}
				{items.map((item) => (
					<Checkbox
						className={cn("w-full", TILE_BASE)}
						isInvalid={false}
						key={item.value}
						value={item.value}
					>
						<Checkbox.Content className="w-full items-center gap-2.5 p-3 pe-8">
							{/* The tick lives in the corner and only appears once selected;
							    the accent border carries the state the rest of the time. */}
							<Checkbox.Control className="absolute end-2 top-2 size-4 rounded-full border-transparent opacity-0 transition-opacity group-data-selected:opacity-100 motion-reduce:transition-none">
								<Checkbox.Indicator />
							</Checkbox.Control>
							<OptionLabel
								description={item.description}
								icon={item.icon}
								label={item.label}
							/>
						</Checkbox.Content>
					</Checkbox>
				))}
			</div>
			<FieldError>{field.errorMessage}</FieldError>
		</CheckboxGroup>
	);
}
