import { TRPCError } from "@trpc/server";
import { ACTION_LABELS, ALL_ACTIONS, ROLE_DEFAULT_PERMISSIONS } from "@/lib/permission-actions";
import { prisma } from "@/lib/prisma";
import type { Action } from "../../prisma/generated/enums.ts";

/**
 * Permissions, and why they are not roles.
 *
 * A ROLE says what somebody is. An ACTION says what they may do. The two are
 * related only at GRANT time: `ROLE_DEFAULT_PERMISSIONS` is what a new account
 * of that role starts with, and `UserPermission` is the truth from then on. That
 * is what lets an admin revoke `APPROVE_BUDGET` from one budget officer without
 * inventing a role for them - and why `assertPermission` never reads the role.
 *
 * The three CONSTANTS live in `lib/permission-actions.ts` and are re-exported
 * here, so every existing import of this module is unchanged. They moved because
 * the admin permissions modal has to label the seven switches in the browser,
 * and this file drags Prisma and tRPC in behind it.
 */

export { ACTION_LABELS, ALL_ACTIONS, ROLE_DEFAULT_PERMISSIONS };

/**
 * The slice of the client this module writes through.
 *
 * Typed as a slice rather than as `PrismaClient` so a `$transaction` callback's
 * client - which is a `PrismaClient` minus `$transaction` and friends - is
 * accepted without a cast. That is what lets an account creation and its grants
 * commit or fail together; see `authSignup.signUp`.
 */
type PermissionWriter = Pick<typeof prisma, "userPermission">;

/**
 * Grant a new account its role defaults. Additive and duplicate-safe, so calling
 * it twice on the same user is a no-op rather than a unique-constraint error.
 *
 * Pass `client` to run inside an open transaction. Left out, it writes on its
 * own connection - which is correct only where a user with no permissions is
 * recoverable, because every action they attempt will 403 until somebody grants
 * them by hand.
 */
export async function seedUserPermissions(
	userId: string,
	role: string,
	grantedBy: string,
	client: PermissionWriter = prisma,
): Promise<void> {
	const actions = ROLE_DEFAULT_PERMISSIONS[role] ?? [];
	if (actions.length === 0) return;

	await client.userPermission.createMany({
		data: actions.map((action) => ({ action, grantedBy, userId })),
		skipDuplicates: true,
	});
}

/**
 * Re-grant from scratch after a role change. It DELETES first: merging would
 * leave a director demoted to USER still holding `APPROVE_DIRECTOR`, which is
 * the whole reason this is a separate function from `seedUserPermissions`.
 */
export async function resetAndSeedPermissions(
	userId: string,
	role: string,
	grantedBy: string,
	/**
	 * Pass an open transaction's client to make this part of a LARGER unit of
	 * work. `adminAccounts.updateUserRole` does, and has to: the role column and
	 * the grants are one decision, and a reset that fails after the update lands
	 * leaves a director demoted to USER still holding `APPROVE_DIRECTOR` - which
	 * is the exact leak this function exists to close.
	 *
	 * Left out it opens its own transaction, so the two writes still commit or
	 * fail together.
	 */
	client?: PermissionWriter,
): Promise<void> {
	const run = async (writer: PermissionWriter) => {
		await writer.userPermission.deleteMany({ where: { userId } });

		const actions = ROLE_DEFAULT_PERMISSIONS[role] ?? [];
		if (actions.length === 0) return;

		await writer.userPermission.createMany({
			data: actions.map((action) => ({ action, grantedBy, userId })),
		});
	};

	if (client) return await run(client);

	await prisma.$transaction(run);
}

/**
 * Does this user hold the grant? Reads `UserPermission` and nothing else - a
 * role that WOULD hold the action by default does not help if the grant row has
 * been revoked.
 *
 * The non-throwing half of `assertPermission`, and it exists for one thing: a
 * screen that has to DISABLE a control rather than let it fail. The comment
 * composer (spec 008) is the case - a requestor whose `ADD_COMMENT` was revoked
 * can still read the thread, so the box has to be there and refuse, with a
 * reason, rather than either vanish or throw when they press Comment.
 *
 * It is never the gate. Answering this question for the client is a courtesy;
 * `assertPermission` on the write is what actually decides.
 */
export async function hasPermission(userId: string, action: Action): Promise<boolean> {
	const perm = await prisma.userPermission.findUnique({
		where: { userId_action: { action, userId } },
	});

	return perm !== null;
}

/**
 * The gate. Reads `UserPermission` and nothing else - a role that WOULD hold the
 * action by default does not help if the grant row has been revoked.
 */
export async function assertPermission(userId: string, action: Action): Promise<void> {
	if (!(await hasPermission(userId, action))) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You don't have permission to perform this action",
		});
	}
}
