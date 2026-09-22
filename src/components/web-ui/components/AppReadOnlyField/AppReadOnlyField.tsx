import { Description, Input, Label, TextField } from "@heroui/react";
import { cn } from "../../lib/cn";

interface ReadOnlyFieldProps {
	label: string;
	value: string;
	description?: string;
	className?: string;
}

/**
 * A value that belongs in a form's layout but is not editable there - an email
 * address, an assigned warehouse. It is a real TextField rather than a styled
 * div so it lines up with the fields beside it on every breakpoint, and it takes
 * no `control`: there is nothing to register when nothing can be typed.
 */
export function AppReadOnlyField({ label, value, description, className }: ReadOnlyFieldProps) {
	return (
		<TextField
			className={cn("w-full", className)}
			isDisabled
			isReadOnly
			value={value}
		>
			<Label>{label}</Label>
			<Input />
			{description ? <Description>{description}</Description> : null}
		</TextField>
	);
}
