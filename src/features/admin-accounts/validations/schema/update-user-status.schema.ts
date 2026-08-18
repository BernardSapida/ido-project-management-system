import { z } from "zod";
import { STATUS_VALUES } from "@/features/admin-accounts/lib/account-options";

/**
 * The account switch.
 *
 * There is no "deleted" here on purpose (see the spec's out-of-scope): a removed
 * account would orphan the requests, audit rows and signatures that point at it,
 * so the three states below are the whole of the lifecycle.
 */
export const UpdateUserStatusSchema = z.object({
	status: z.enum(STATUS_VALUES, { message: "Please select a valid status" }),
	userId: z.string().min(1, "User ID is required"),
});

export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;

/** The MODAL's half - the row already knows whose status it is changing. */
export const UpdateUserStatusFormSchema = UpdateUserStatusSchema.pick({ status: true });

export type UpdateUserStatusFormData = z.infer<typeof UpdateUserStatusFormSchema>;
