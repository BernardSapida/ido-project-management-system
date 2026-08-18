import { TRPCError } from "@trpc/server";
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
 */

export const ALL_ACTIONS: Action[] = [
	"CREATE_REQUEST",
	"SUBMIT_REQUEST",
	"ADD_COMMENT",
	"REVIEW_REQUEST",
	"APPROVE_BUDGET",
	"APPROVE_DIRECTOR",
	"SUBMIT_CSM",
];

/** Label and description per action - read by the admin permissions modal. */
export const ACTION_LABELS: Record<Action, { description: string; label: string }> = {
	ADD_COMMENT: { label: "Add Comments", description: "Post comments on requests" },
	APPROVE_BUDGET: { label: "Approve Budget", description: "Approve or reject budget officer stage" },
	APPROVE_DIRECTOR: { label: "Approve as Director", description: "Approve or reject at director stage" },
	CREATE_REQUEST: { label: "Create Request", description: "Create new request drafts" },
	REVIEW_REQUEST: {
		label: "Review Request",
		description: "Recommend, return, reject, or defer requests at IDO stage",
	},
	SUBMIT_CSM: { label: "Submit CSM Feedback", description: "Submit client satisfaction feedback after approval" },
	SUBMIT_REQUEST: { label: "Submit Request", description: "Submit draft requests for review" },
};

/**
 * What each role starts with. ADMIN gets nothing on purpose - an administrator
 * manages accounts and never touches a request.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, Action[]> = {
	ADMIN: [],
	BUDGET_OFFICER: ["ADD_COMMENT", "APPROVE_BUDGET"],
	DIRECTOR: ["ADD_COMMENT", "APPROVE_DIRECTOR"],
	IDO_CHAIRPERSON: ["ADD_COMMENT", "REVIEW_REQUEST"],
	IDO_OFFICER: ["ADD_COMMENT", "REVIEW_REQUEST"],
	USER: ["CREATE_REQUEST", "SUBMIT_REQUEST", "ADD_COMMENT", "SUBMIT_CSM"],
};

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
export async function resetAndSeedPermissions(userId: string, role: string, grantedBy: string): Promise<void> {
	await prisma.$transaction(async (tx) => {
		await tx.userPermission.deleteMany({ where: { userId } });

		const actions = ROLE_DEFAULT_PERMISSIONS[role] ?? [];
		if (actions.length === 0) return;

		await tx.userPermission.createMany({
			data: actions.map((action) => ({ action, grantedBy, userId })),
		});
	});
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
