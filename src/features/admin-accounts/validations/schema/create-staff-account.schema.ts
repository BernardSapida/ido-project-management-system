import { z } from "zod";
import { STAFF_ROLE_VALUES } from "@/features/admin-accounts/lib/account-options";
import { POSITION_VALUES } from "@/features/request-form/lib/request-options";

/**
 * What the create form collects, and what `createStaffAccount` re-checks.
 *
 * The `role` enum is the security half of this file, not a convenience: it names
 * the four staff roles and nothing else, so a crafted call with `"ADMIN"` or
 * `"USER"` fails at the parse rather than reaching a handler that has to
 * remember to check. The router asserts the same thing again anyway - see
 * `assertStaffRole` - because a schema that later gains a fifth value should not
 * silently widen who can be minted.
 */
export const CreateStaffAccountSchema = z
	.object({
		confirmPassword: z.string().min(1, "Please confirm your password"),
		email: z.string().min(1, "Email is required").email("Enter a valid email"),
		firstname: z.string().min(1, "First name is required").min(2, "At least 2 characters"),
		lastname: z.string().min(1, "Last name is required").min(2, "At least 2 characters"),
		password: z.string().min(1, "Password is required").min(8, "At least 8 characters"),
		/*
		 * Optional, unlike sign-up's. Staff do not file requests, so nothing prints
		 * their position on a form - it is here only for the day one of them does.
		 */
		position: z.enum(POSITION_VALUES).optional(),
		role: z.enum(STAFF_ROLE_VALUES, { message: "Please select a valid role" }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type CreateStaffAccountFormData = z.infer<typeof CreateStaffAccountSchema>;

/**
 * The router's input: the form's fields minus `confirmPassword`, with the email
 * normalised.
 *
 * Dropping the confirmation in a `.transform` rather than in the handler means
 * the second password is gone before anything can persist it, log it or put it
 * in an error report - exactly as `SignUpInputSchema` does it.
 *
 * Lowercasing here covers BOTH uses of the email inside the handler: the
 * uniqueness check and the credential row's `accountId`. Normalise only one and
 * `A@x.com` passes a check `a@x.com` would have failed, which is two accounts
 * for one person - and a `accountId` that sign-in will not match.
 */
export const CreateStaffAccountInputSchema = CreateStaffAccountSchema.transform(
	({ confirmPassword: _confirmPassword, ...rest }) => ({
		...rest,
		email: rest.email.trim().toLowerCase(),
	}),
);

export type CreateStaffAccountInput = z.infer<typeof CreateStaffAccountInputSchema>;
