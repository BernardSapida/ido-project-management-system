import { Description, FieldError, Label, Radio, RadioGroup } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import type { FieldValues } from "react-hook-form";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

interface RadioItem {
	description?: string;
	/** An optional leading Lucide icon, muted until the tile is selected. */
	icon?: LucideIcon;
	label: string;
	value: string;
}

interface AppRadioGroupBaseProps {
	className?: string;
	"data-cy"?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	items: RadioItem[];
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

type AppRadioGroupProps<T extends FieldValues> = AppRadioGroupBaseProps & FieldBindingProps<string, T>;

/* A compact selectable tile. The whole tile is the hit target - the padding
   lives on Radio.Content, which is the button, so there is no dead border area
   to miss with a thumb. Everything the tile says it says in accent: a 3% wash
   and a tinted edge on hover, then a 2px accent border, a 4% wash and an accent
   label once selected. The four accent mixes climb 3 -> 4 -> 8%, so hover never
   out-shouts the resting selected state. Tile size is border-box, so the 1 -> 2px
   border only nudges the inner content, never the grid around it. */
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

/** One choice from a visible few, as tiles. Past ~10 options this is the wrong
 *  control and the answer is `AppSelect` or `AppAutocomplete`. */
export function AppRadioGroup<T extends FieldValues>({
	className,
	"data-cy": dataCy,
	description,
	isDisabled,
	isRequired,
	items,
	label,
	orientation = "auto",
	...binding
}: AppRadioGroupProps<T>) {
	return (
		<FieldBinding
			binding={binding}
			emptyValue=""
		>
			{(field) => (
				<RadioGroupField
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

/** The label column: an optional leading icon on the label's line, description
 *  beneath. One child or three, it lays out the same. */
function OptionLabel({ description, icon: Icon, label }: Omit<RadioItem, "value">) {
	return (
		<span className="flex min-w-0 flex-col gap-0.5 text-left">
			<span className="flex items-center gap-2">
				{Icon ? (
					<Icon
						aria-hidden
						className="size-4 shrink-0 text-muted transition-colors group-data-selected:text-accent motion-reduce:transition-none"
					/>
				) : null}
				<Label className="transition-colors group-data-selected:text-accent">{label}</Label>
			</span>
			{description ? <Description>{description}</Description> : null}
		</span>
	);
}

function RadioGroupField({
	className,
	"data-cy": dataCy,
	description,
	field,
	isDisabled,
	isRequired,
	items,
	label,
	orientation,
}: AppRadioGroupBaseProps & { field: BoundField<string> }) {
	return (
		<RadioGroup
			/* `gap-2` spaces the label, group description and error from the grid;
			   `mt-0` cancels the `mt-4` HeroUI puts between vertical items, since the
			   tiles live in our own grid and its `gap` owns their spacing. */
			className={cn("gap-2 **:data-[slot=radio]:mt-0", className)}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={field.isInvalid}
			isRequired={isRequired}
			name={field.name}
			/* Tabbing through the group without picking anything has to mark it
			   touched, or an untouched required group stays silent until submit
			   while every text field beside it has already reported. */
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
				{items.map((item) => (
					<Radio
						className={cn("w-full", TILE_BASE)}
						key={item.value}
						value={item.value}
					>
						<Radio.Content className="w-full items-center gap-2.5 p-3">
							<OptionLabel
								description={item.description}
								icon={item.icon}
								label={item.label}
							/>
						</Radio.Content>
					</Radio>
				))}
			</div>
			<FieldError>{field.errorMessage}</FieldError>
		</RadioGroup>
	);
}
