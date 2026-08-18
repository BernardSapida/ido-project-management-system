import { z } from "zod";
import { ASSIGNABLE_ROLE_VALUES } from "@/features/admin-accounts/lib/account-options";

/**
 * The five roles an account may be moved to.
 *
 * ADMIN is not among them, and that omission is a guard rather than an
 * oversight: an administrator who could promote somebody to ADMIN could
 * manufacture the second account the self-check (`userId !== ctx.user.id`) is
 * designed to make impossible to work around.
 */
export const UpdateUserRoleSchema = z.object({
	role: z.enum(ASSIGNABLE_ROLE_VALUES, { message: "Please select a valid role" }),
	userId: z.string().min(1, "User ID is required"),
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

/** The MODAL's half - the row already knows whose role it is changing. */
export const UpdateUserRoleFormSchema = UpdateUserRoleSchema.pick({ role: true });

export type UpdateUserRoleFormData = z.infer<typeof UpdateUserRoleFormSchema>;
