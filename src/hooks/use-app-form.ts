import { zodResolver } from "@hookform/resolvers/zod";
import type { DefaultValues, FieldValues, UseFormProps, UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { z } from "zod";

interface AppFormOptions<TFieldValues extends FieldValues> extends Omit<UseFormProps<TFieldValues>, "resolver"> {
	/**
	 * The empty form. Required, not optional: RHF treats a field with no default
	 * as uncontrolled until something writes to it, and the first keystroke then
	 * flips it - which React reports as the uncontrolled-to-controlled warning
	 * and a lost cursor position. Every field the schema names belongs here, at
	 * `""`, `null` or `false`.
	 */
	defaultValues: DefaultValues<TFieldValues>;
}

/**
 * `useForm`, with this project's validation timing already decided.
 *
 * ## What it settles
 *
 * **`mode: "onBlur"`** - a field is checked when you leave it, not while you are
 * still typing in it. Validating on change means telling somebody their email is
 * invalid at `b@`, which is true, useless, and the reason forms feel hostile.
 *
 * **`reValidateMode: "onChange"`** - once a field HAS an error, it is rechecked
 * on every keystroke, so the message clears the moment the fix lands rather than
 * waiting for another blur. The pair is the whole behaviour: quiet until you are
 * done, responsive once you are wrong.
 *
 * These were already written out at five call sites and missing from two, which
 * is the usual shape of a convention that lives in a doc - `UpdateProfileForm`
 * and `DeleteAccountCard` validated on submit and nobody chose that.
 *
 * ## Editing an existing record
 *
 * Pass `values`. RHF resets the form when it changes, so a record that arrives
 * from a query lands in the fields with no effect to write:
 *
 * ```ts
 * const { control } = useAppForm(UpdateProfileSchema, {
 *   defaultValues: { firstname: "", lastname: "" },
 *   values: user && { firstname: user.firstname, lastname: user.lastname },
 * });
 * ```
 *
 * `defaultValues` is still required alongside it: `values` is undefined until
 * the query resolves, and the fields have to be controlled before then.
 *
 * ## What it deliberately does not do
 *
 * It returns RHF's own `UseFormReturn` and takes RHF's own options. It is a
 * default, not a wrapper - `handleSubmit`, `control`, `formState` and the rest
 * are unchanged, and any option passed here wins over the defaults above,
 * including `mode` on the rare form that needs different timing. Nothing in the
 * app should have to work around this hook; if it does, use `useForm` directly
 * and say why in a comment.
 *
 * It also does not render anything. The submit button, the layout and the error
 * summary belong to the form, which is why this is a hook and not an
 * `<AppForm>`: those three differ on every screen and the validation timing
 * does not.
 */
export function useAppForm<TFieldValues extends FieldValues>(
	/*
	 * Typed as the VALUES rather than as the schema, so the generic is the thing
	 * every call site already names - `useAppForm<SignInFormValues>(...)` reads
	 * like the `useForm<SignInFormValues>(...)` it replaces, and the resolver
	 * lines up without a cast. A schema-first generic infers the same shape and
	 * then loses it again inside RHF's third type parameter.
	 */
	schema: z.ZodType<TFieldValues, TFieldValues>,
	options: AppFormOptions<TFieldValues>,
): UseFormReturn<TFieldValues> {
	return useForm<TFieldValues>({
		mode: "onBlur",
		reValidateMode: "onChange",
		// Spread AFTER the defaults so a caller can override the timing, and
		// BEFORE the resolver so nothing can quietly detach the schema.
		...options,
		resolver: zodResolver(schema),
	});
}
