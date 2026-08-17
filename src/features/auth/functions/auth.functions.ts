import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { User } from "@/types/auth.types";
import { USER_ROLES } from "@/utils/config";
import { getSession } from "../lib/session";

const userRoleSchema = z.enum(Object.keys(USER_ROLES) as [string, ...string[]]);

const allowedRolesSchema = z.object({
	allowedRoles: z.array(userRoleSchema).min(1, "At least one role required"),
});

export const redirectAuthenticatedUserFn = createServerFn().handler(async () => {
	const session = await getSession();
	if (session) {
		throw redirect({ to: "/dashboard" });
	}
});

export const assertAuthenticatedFn = createServerFn().handler(async () => {
	const session = await getSession();
	if (!session) throw redirect({ to: "/sign-in" });
	if (!session.user.emailVerified) throw redirect({ to: "/verify-email" });
	return session;
});

export const assertAuthenticatedRoleFn = createServerFn()
	.validator(allowedRolesSchema)
	.handler(async ({ data }) => {
		const session = await assertAuthenticatedFn();
		if (!data.allowedRoles.includes((session.user as unknown as User).role)) {
			throw redirect({ to: "/unauthorized" });
		}
		return session;
	});
