import type { ReactNode } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

/**
 * The two ways every App* field can be driven, in one place.
 *
 * Not exported from the barrel - this is machinery the field wrappers share,
 * not something a screen imports. What a screen sees is the union it produces:
 * pass `control` + `name`, or pass `value` + `onChange` (+ optional
 * `errorMessage`), and never a mixture.
 *
 * ## Why both exist
 *
 * Every wrapper used to require `control`, which meant a value with another
 * owner - a zustand draft, a wizard step, a filter bar two controls write to -
 * had no way to use these components at all. The two escape hatches that did
 * exist (`AppTextInput`, `AppHexField`) deliberately had no error state, so
 * "validated but not owned by react-hook-form" was not expressible.
 *
 * ## Why this is a render prop and not a hook
 *
 * `useController` cannot be called conditionally, and a standalone field has no
 * `control` to give it. A hook would have to be called either way; a component
 * can simply not be mounted. That is the whole reason for the shape.
 */

/** What a wrapper renders from, once the binding is resolved. */
export interface BoundField<TValue> {
	errorMessage?: string;
	isInvalid: boolean;
	name?: string;
	onBlur: () => void;
	onChange: (value: TValue) => void;
	value: TValue;
}

export interface FormBoundBinding<TForm extends FieldValues> {
	control: Control<TForm>;
	errorMessage?: never;
	name: Path<TForm>;
	onBlur?: never;
	onChange?: never;
	value?: never;
}

export interface StandaloneBinding<TValue> {
	control?: never;
	/** Shown under the field, and it is what makes it invalid. Falsy = valid. */
	errorMessage?: string;
	/** Only for a real `<form>` submit or an autofill hint; nothing reads it back. */
	name?: string;
	onBlur?: () => void;
	onChange: (value: TValue) => void;
	value: TValue;
}

/**
 * Spread this into a wrapper's props to give it both modes. They are mutually
 * exclusive through the `never`s, so a half-wired field - `control` with a
 * stray `value`, or `value` with no `onChange` - is a compile error rather than
 * a field that silently ignores what you typed.
 */
export type FieldBindingProps<TValue, TForm extends FieldValues> = FormBoundBinding<TForm> | StandaloneBinding<TValue>;

export function isFormBound<TValue, TForm extends FieldValues>(
	binding: FieldBindingProps<TValue, TForm>,
): binding is FormBoundBinding<TForm> {
	return binding.control !== undefined;
}

interface FieldBindingRenderProps<TValue, TForm extends FieldValues> {
	binding: FieldBindingProps<TValue, TForm>;
	children: (field: BoundField<TValue>) => ReactNode;
	/**
	 * What an absent value reads as - `""`, `null`, `false`, `[]`.
	 *
	 * React Hook Form hands back `undefined` for a field with no default, and an
	 * `undefined` value is what flips a controlled input to uncontrolled mid-life:
	 * React warns, and the caret jumps to the end of the text on the next
	 * keystroke. Every wrapper has to normalise it, so it is a required prop here
	 * rather than a default somebody can forget.
	 */
	emptyValue: TValue;
}

export function FieldBinding<TValue, TForm extends FieldValues>({
	binding,
	children,
	emptyValue,
}: FieldBindingRenderProps<TValue, TForm>) {
	if (isFormBound(binding)) {
		return (
			<FormBoundField
				control={binding.control}
				emptyValue={emptyValue}
				name={binding.name}
			>
				{children}
			</FormBoundField>
		);
	}

	return children({
		errorMessage: binding.errorMessage,
		// The message IS the invalid state. A separate `isInvalid` would let a
		// caller paint the field red with nothing to read - the one error state a
		// user cannot act on.
		isInvalid: Boolean(binding.errorMessage),
		name: binding.name,
		onBlur: binding.onBlur ?? noop,
		onChange: binding.onChange,
		value: binding.value,
	});
}

function FormBoundField<TValue, TForm extends FieldValues>({
	children,
	control,
	emptyValue,
	name,
}: {
	children: (field: BoundField<TValue>) => ReactNode;
	control: Control<TForm>;
	emptyValue: TValue;
	name: Path<TForm>;
}) {
	const {
		field,
		fieldState: { error, invalid },
	} = useController({ control, name });

	return children({
		errorMessage: error?.message,
		isInvalid: invalid,
		name: field.name,
		onBlur: field.onBlur,
		onChange: field.onChange,
		value: (field.value ?? emptyValue) as TValue,
	});
}

function noop() {
	// A standalone caller that does not care about blur still gets a handler, so
	// no wrapper has to guard the call.
}
