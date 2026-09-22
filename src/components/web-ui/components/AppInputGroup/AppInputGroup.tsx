import { Description, FieldError, InputGroup, Label, TextField } from "@heroui/react";
import type { ReactNode } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";
import { cn } from "../../lib/cn";

/**
 * THE single-line text input. There is no second one.
 *
 * ## Why the affixes are optional rather than a separate component
 *
 * There used to be an `AppTextField` beside this - the same forty lines with
 * `<Input>` where this has `<InputGroup><InputGroup.Input/></InputGroup>` - and
 * picking between them came down to "does this field have an icon yet". That is
 * not a question a component boundary should turn on: adding an icon later
 * meant swapping the component, and `SignUpForm` had shipped with both, four
 * fields, one form.
 *
 * It also was not only a naming problem. HeroUI styles the two differently in
 * two states that a mixed form shows off:
 *
 * - **Autofill.** `input-group.css` neutralises the browser's per-input paint
 *   and lifts the highlight onto the shell so the rounded border and the
 *   affixes share it. Plain `.input` has none of that, so a signup form with
 *   both went half browser-yellow with square corners on autofill.
 * - **Invalid.** `.input-group[data-invalid]` also recolours its border;
 *   `.input` gets only the danger outline.
 *
 * With no affixes this renders 38px tall at `sm+`, the same as `.input` did -
 * `min-h-9` sits under the natural height, so the shell adds nothing.
 *
 * ## The two ways to drive it
 *
 * Pass `control` + `name` for a react-hook-form field, or `value` + `onChange`
 * (+ optional `errorMessage`) for a value that already has another owner - a
 * zustand draft, a wizard step, a filter bar. They are mutually exclusive in
 * the type, so a half-wired field is a compile error rather than a field that
 * silently ignores what you typed.
 *
 * `useController` cannot be called conditionally, which is why the two modes
 * are two components under one name rather than one component with a branch.
 */

/** Everything both modes share. */
interface InputGroupBaseProps {
	/**
	 * Extra element ids to name in the field's `aria-describedby`, on top of the
	 * `description` and error message HeroUI wires itself. React Aria merges
	 * rather than replaces, so a wrapper can point a screen reader at its own
	 * out-of-field guidance - `AppPasswordField`'s strength meter is the caller.
	 */
	"aria-describedby"?: string;
	/**
	 * Passed to the inner `<input>`, where the browser and password managers
	 * actually look for it. A field with the wrong hint is one autofill either
	 * skips or fills with the wrong value.
	 */
	autoComplete?: string;
	className?: string;
	"data-cy"?: string;
	/** Guidance under the field. HeroUI hides it while an error is showing. */
	description?: string;
	/** After the input: a unit, a spinner, a small button. */
	endContent?: ReactNode;
	isDisabled?: boolean;
	isReadOnly?: boolean;
	isRequired?: boolean;
	label: string;
	placeholder?: string;
	/** Before the input: an icon, a currency symbol, a protocol. */
	startContent?: ReactNode;
	type?: "email" | "password" | "tel" | "text" | "url";
}

interface FormBoundProps<T extends FieldValues> extends InputGroupBaseProps {
	control: Control<T>;
	/** Not available in this mode - the error comes from the resolver. */
	errorMessage?: never;
	name: Path<T>;
	onChange?: never;
	value?: never;
}

interface StandaloneProps extends InputGroupBaseProps {
	control?: never;
	/** Shown when set, and it is what marks the field invalid. Falsy = valid. */
	errorMessage?: string;
	/** Only for a real `<form>` submit or an autofill hint; nothing reads it back. */
	name?: string;
	onBlur?: () => void;
	onChange: (value: string) => void;
	value: string;
}

type AppInputGroupProps<T extends FieldValues> = FormBoundProps<T> | StandaloneProps;

export function AppInputGroup<T extends FieldValues>(props: AppInputGroupProps<T>) {
	// `control` is the discriminant, and it is never conditional at a call site -
	// a field is bound to a form or it is not - so this never swaps mid-life and
	// remounts the input.
	return isFormBound(props) ? <FormBoundInputGroup {...props} /> : <StandaloneInputGroup {...props} />;
}

function isFormBound<T extends FieldValues>(props: AppInputGroupProps<T>): props is FormBoundProps<T> {
	return props.control !== undefined;
}

/* -------------------------------------------------------------------------- */

function FormBoundInputGroup<T extends FieldValues>({ control, name, ...rest }: FormBoundProps<T>) {
	const {
		field,
		fieldState: { error, invalid },
	} = useController({ control, name });

	return (
		<InputGroupField
			{...rest}
			errorMessage={error?.message}
			isInvalid={invalid}
			name={field.name}
			onBlur={field.onBlur}
			onChange={field.onChange}
			// RHF hands back `undefined` for a field with no default, and an
			// `undefined` value is what flips a controlled input to uncontrolled
			// mid-life - React warns and the caret jumps to the end.
			value={field.value ?? ""}
		/>
	);
}

function StandaloneInputGroup({ errorMessage, ...rest }: StandaloneProps) {
	return (
		<InputGroupField
			{...rest}
			errorMessage={errorMessage}
			// The message IS the invalid state here. A separate `isInvalid` prop
			// would let a caller paint the field red with nothing to read, which is
			// the one error state a user cannot act on.
			isInvalid={Boolean(errorMessage)}
		/>
	);
}

/* -------------------------------------------------------------------------- */

interface InputGroupFieldProps extends InputGroupBaseProps {
	errorMessage?: string;
	isInvalid: boolean;
	name?: string;
	onBlur?: () => void;
	onChange: (value: string) => void;
	value: string;
}

/** The markup both modes render. Knows nothing about where the value lives. */
function InputGroupField({
	"aria-describedby": ariaDescribedBy,
	autoComplete,
	className,
	"data-cy": dataCy,
	description,
	endContent,
	errorMessage,
	isDisabled,
	isInvalid,
	isReadOnly,
	isRequired,
	label,
	name,
	onBlur,
	onChange,
	placeholder,
	startContent,
	type = "text",
	value,
}: InputGroupFieldProps) {
	return (
		<TextField
			aria-describedby={ariaDescribedBy}
			/*
			 * `className="w-full"`, not `fullWidth`. HeroUI's `.textfield--full-width`
			 * only widens `[data-slot="input"]` and `[data-slot="textarea"]` - an
			 * InputGroup is neither, so `fullWidth` would silently do nothing here.
			 * The field fills its column because `.textfield` is a flex column and
			 * the group stretches.
			 */
			className={cn("w-full", className)}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={isInvalid}
			isReadOnly={isReadOnly}
			isRequired={isRequired}
			name={name}
			onBlur={onBlur}
			onChange={onChange}
			type={type}
			validationBehavior="aria"
			value={value}
		>
			<Label>{label}</Label>
			{/* React Aria's TextField provides GroupContext with `isInvalid` and
			    `isDisabled`, so the group picks both up from above - there is
			    nothing to forward by hand. */}
			<InputGroup>
				{startContent ? <InputGroup.Prefix>{startContent}</InputGroup.Prefix> : null}
				{/* No `onBlur` here. TextField already wires its handler down through
				    InputContext, and RAC's mergeProps CHAINS rather than overrides -
				    passing it again fired the handler twice per blur, which under
				    `mode: "onBlur"` meant validating the field twice. */}
				<InputGroup.Input
					autoComplete={autoComplete}
					placeholder={placeholder}
				/>
				{endContent ? <InputGroup.Suffix>{endContent}</InputGroup.Suffix> : null}
			</InputGroup>
			{description ? <Description>{description}</Description> : null}
			<FieldError>{errorMessage}</FieldError>
		</TextField>
	);
}
