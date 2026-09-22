import { Eye, EyeOff, Lock } from "lucide-react";
import { useId, useState } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { AppButton } from "../AppButton";
import { AppInputGroup } from "../AppInputGroup";
import { type FieldBindingProps, isFormBound } from "../field-binding";
import { AppPasswordStrength } from "./AppPasswordStrength";

interface AppPasswordFieldBaseProps {
	/**
	 * `new-password` on a sign-up or change-password form, `current-password` on
	 * sign-in. Required rather than optional: a password field with the wrong
	 * hint is one a password manager either fails to fill or offers to overwrite,
	 * and the default browsers guess from the surrounding markup is frequently the
	 * wrong one of those two.
	 */
	autoComplete: "current-password" | "new-password";
	className?: string;
	"data-cy"?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	label?: string;
	placeholder?: string;
	/** Draw the lock in the prefix. Off inside a form that is only passwords -
	 *  three identical padlocks down a column is decoration, not information. */
	showIcon?: boolean;
	/**
	 * Show a strength meter and a live "better to have" checklist under the field.
	 *
	 * For choosing a password - sign-up, reset, change - never for entering a
	 * known one, so it pairs with `autoComplete="new-password"`. It coaches rather
	 * than gates: the field's own schema still decides valid, this only tells the
	 * user what would make the password stronger while they type.
	 */
	strength?: boolean;
}

type AppPasswordFieldProps<T extends FieldValues> = AppPasswordFieldBaseProps & FieldBindingProps<string, T>;

/**
 * A password, with the reveal toggle in the suffix.
 *
 * A thin composition over `AppInputGroup` rather than a fourth text input: the
 * shell, the binding, the affix slots and the invalid state all already exist
 * there, and what a password adds is exactly two things - a `type` that flips,
 * and a button to flip it.
 *
 * ## Why a reveal toggle at all
 *
 * Masking protects against someone reading over a shoulder, which is a real but
 * uncommon threat, and it costs every user the ability to check what they
 * typed - on a phone keyboard, on a field they cannot paste into. The toggle is
 * what makes masking the default rather than the only option, and it is why the
 * button says which state it will move to rather than which state it is in.
 *
 * ## Why the strength meter is inline, not a tooltip
 *
 * `strength` renders the meter and checklist as a sibling under the field, and
 * the field's `aria-describedby` points at it. A tooltip that only opens on
 * focus hides the rules until it is too late to act on them, is invisible to a
 * screen reader reading the field, and on a phone covers the field it describes.
 */
export function AppPasswordField<T extends FieldValues>({
	autoComplete,
	className,
	"data-cy": dataCy,
	description,
	isDisabled,
	isRequired,
	label = "Password",
	placeholder,
	showIcon = true,
	strength = false,
	...binding
}: AppPasswordFieldProps<T>) {
	const [isVisible, setIsVisible] = useState(false);
	const strengthId = useId();

	const field = (
		<AppInputGroup
			aria-describedby={strength ? strengthId : undefined}
			autoComplete={autoComplete}
			className={className}
			data-cy={dataCy}
			description={description}
			endContent={
				<AppButton
					/*
					 * The name says what pressing it DOES, not what the field currently
					 * is. "Password is hidden" describes state and leaves a screen
					 * reader user to infer the action; "Show password" is the action.
					 *
					 * It is also not in the tab order by accident - it is a real button,
					 * so it is reachable, which is the whole point for someone who
					 * cannot see the dots to count them.
					 */
					aria-label={isVisible ? "Hide password" : "Show password"}
					isDisabled={isDisabled}
					onPress={() => setIsVisible((visible) => !visible)}
					size="sm"
					variant="ghost"
				>
					{isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</AppButton>
			}
			isDisabled={isDisabled}
			isRequired={isRequired}
			label={label}
			placeholder={placeholder}
			startContent={showIcon ? <Lock className="size-4 text-text-secondary" /> : undefined}
			type={isVisible ? "text" : "password"}
			{...binding}
		/>
	);

	if (!strength) return field;

	return (
		<div className="flex flex-col gap-2">
			{field}
			<PasswordStrengthSlot
				binding={binding}
				id={strengthId}
			/>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * Reads the current value out of whichever binding the field is on and hands it
 * to the meter. Two paths because `useWatch` needs a `control` and a standalone
 * field has none - the same reason `field-binding` is two components under one
 * name.
 */
function PasswordStrengthSlot<T extends FieldValues>({
	binding,
	id,
}: {
	binding: FieldBindingProps<string, T>;
	id: string;
}) {
	if (isFormBound(binding)) {
		return (
			<FormBoundStrength
				control={binding.control}
				id={id}
				name={binding.name}
			/>
		);
	}

	return (
		<AppPasswordStrength
			id={id}
			value={binding.value ?? ""}
		/>
	);
}

function FormBoundStrength<T extends FieldValues>({
	control,
	id,
	name,
}: {
	control: Control<T>;
	id: string;
	name: Path<T>;
}) {
	// Read-only - it never writes, so watching rather than a second useController.
	const value = useWatch({ control, name });
	return (
		<AppPasswordStrength
			id={id}
			value={typeof value === "string" ? value : ""}
		/>
	);
}
