import { z } from "zod";
import { POSITION_VALUES } from "@/features/request-form/lib/request-options";

/**
 * What the sign-up form collects, and what the server re-checks.
 *
 * The same object validates both sides. The client copy is a convenience that
 * saves a round trip; `authSignup.signUp` runs it again on the input it is
 * handed, because a form is not a gate.
 *
 * There is no `role` field, and there must never be one - the router writes the
 * literal `"USER"`. Every staff account comes from the admin page (spec 017).
 */
export const SignUpSchema = z
	.object({
		confirmPassword: z.string().min(1, "Please confirm your password"),
		email: z.string().min(1, "Email is required").email("Enter a valid email"),
		firstname: z.string().min(1, "First name is required").min(2, "At least 2 characters"),
		lastname: z.string().min(1, "Last name is required").min(2, "At least 2 characters"),
		password: z.string().min(1, "Password is required").min(8, "At least 8 characters"),
		position: z.enum(POSITION_VALUES, { message: "Please select a position" }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type SignUpFormData = z.infer<typeof SignUpSchema>;

/**
 * The router's input: the form's fields minus `confirmPassword`, with the email
 * normalised.
 *
 * Dropping the confirmation in a `.transform` rather than in the handler means
 * the second password is gone before anything can persist it, log it or put it
 * in an error report - the handler never receives a shape that has it.
 *
 * Lowercasing here rather than at the call site covers BOTH uses of the email
 * inside the handler: the uniqueness check and the account creation. Normalise
 * only one of them and `A@x.com` passes a check that `a@x.com` would have
 * failed, which is two accounts for one person.
 */
export const SignUpInputSchema = SignUpSchema.transform(({ confirmPassword: _confirmPassword, ...rest }) => ({
	...rest,
	email: rest.email.trim().toLowerCase(),
}));

export type SignUpInput = z.infer<typeof SignUpInputSchema>;
