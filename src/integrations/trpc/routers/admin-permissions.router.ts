import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { ACTION_VALUES } from "@/lib/permission-actions";
import { resetAndSeedPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { adminProcedure } from "../init";

/**
 * Grants, one person at a time.
 *
 * A ROLE decides what somebody STARTS with; `UserPermission` is the truth from
 * then on, and `assertPermission` reads only this table. That is what lets an
 * admin revoke `APPROVE_BUDGET` from one budget officer without inventing a role
 * for them - and it is why revoking a grant does not empty that person's queue.
 * The row stays; the action fails.
 */

/**
 * The seven, as the parser sees them.
 *
 * From `ACTION_VALUES` rather than a literal list, so an eighth capability added
 * to the Prisma enum and to the labels is accepted here without a second edit -
 * and a value that is in neither is a BAD_REQUEST rather than a grant row for an
 * action nothing checks.
 */
const actionSchema = z.enum(ACTION_VALUES);

const userIdSchema = z.object({ userId: z.string().min(1, "User ID is required") });

/** The target row, or NOT_FOUND. Every procedure here writes or reads against a
 *  person, and "no rows" is indistinguishable from "no permissions" without it. */
async function assertUserExists(userId: string): Promise<{ id: string; role: string }> {
	const user = await prisma.user.findUnique({ select: { id: true, role: true }, where: { id: userId } });

	if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

	return user;
}

export const adminPermissionsRouter = {
	/** What one person currently holds. `grantedActions` is the switch state; the
	 *  rows carry the grant dates the modal does not show but a later audit will. */
	getUserPermissions: adminProcedure.input(userIdSchema).query(async ({ input }) => {
		await assertUserExists(input.userId);

		const permissions = await prisma.userPermission.findMany({
			orderBy: { grantedAt: "asc" },
			select: { action: true, grantedAt: true, id: true },
			where: { userId: input.userId },
		});

		return { grantedActions: permissions.map((permission) => permission.action), permissions };
	}),

	/**
	 * Reapply the role's defaults, wiping anything hand-set.
	 *
	 * It reads the user's CURRENT role rather than taking one as input: an admin
	 * pressing "Reset to role defaults" means the role in front of them, and
	 * accepting a role here would be a second, undocumented way to change
	 * somebody's permissions without changing their role.
	 */
	resetToRoleDefaults: adminProcedure.input(userIdSchema).mutation(async ({ ctx, input }) => {
		const user = await assertUserExists(input.userId);

		await resetAndSeedPermissions(input.userId, user.role, ctx.user.id);

		return { role: user.role };
	}),

	/**
	 * One switch, in one direction.
	 *
	 * Idempotent both ways - an upsert on grant, a `deleteMany` on revoke - so the
	 * modal never has to know the current state to send the next one. Two admins
	 * granting the same action at the same moment is a no-op rather than a unique
	 * constraint error, and revoking something already absent succeeds.
	 */
	setPermission: adminProcedure
		.input(z.object({ action: actionSchema, granted: z.boolean(), userId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			await assertUserExists(input.userId);

			if (input.granted) {
				await prisma.userPermission.upsert({
					create: { action: input.action, grantedBy: ctx.user.id, userId: input.userId },
					// Nothing. Re-granting must not move `grantedAt` - the date the
					// capability was first given is the fact worth keeping.
					update: {},
					where: { userId_action: { action: input.action, userId: input.userId } },
				});
			} else {
				await prisma.userPermission.deleteMany({
					where: { action: input.action, userId: input.userId },
				});
			}

			return { action: input.action, granted: input.granted };
		}),
} satisfies TRPCRouterRecord;
