/**
 * The six roles, and the single source for role typing across navigation, route
 * gates and the auth server functions.
 *
 * It mirrors the `Role` enum in `prisma/models/user.prisma`. Keeping the literal
 * keys here rather than importing the generated enum is deliberate: the client
 * bundle must not reach into `prisma/generated`, and `UserRole` has to be a
 * union of six literals so a route gate naming a role the enum does not have is
 * a compile error rather than a redirect nobody notices.
 */
export const USER_ROLES = {
	ADMIN: "ADMIN",
	USER: "USER",
	IDO_OFFICER: "IDO_OFFICER",
	IDO_CHAIRPERSON: "IDO_CHAIRPERSON",
	DIRECTOR: "DIRECTOR",
	BUDGET_OFFICER: "BUDGET_OFFICER",
} as const;

export type UserRole = keyof typeof USER_ROLES;
