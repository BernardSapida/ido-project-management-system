import { randomUUID } from "node:crypto";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { CreateStaffAccountInputSchema } from "@/features/admin-accounts/validations/schema/create-staff-account.schema";
import { UpdateUserRoleSchema } from "@/features/admin-accounts/validations/schema/update-user-role.schema";
import { UpdateUserStatusSchema } from "@/features/admin-accounts/validations/schema/update-user-status.schema";
import { resetAndSeedPermissions, seedUserPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { UserWhereInput } from "../../../../prisma/generated/models.ts";
import { adminProcedure } from "../init";

/**
 * The administrator's only endpoints, and the whole of this app's authorization
 * surface.
 *
 * Everything here is an `adminProcedure`. Not one resolver falls back to an
 * inline `ctx.user.role !== "ADMIN"`, for the reason `roleProcedure` documents:
 * an inline check is correct until the next procedure is added without it, and
 * nothing in the type system notices.
 */

/**
 * The columns the browser is allowed to see - an ALLOW-list, never an omission
 * list.
 *
 * A `findMany` with no `select` returns every column on `User`, so the day
 * somebody adds one that should not leave the server it would already be on the
 * wire. Naming the ten means a new column is invisible here until somebody
 * decides otherwise. Nothing from `account` is joined at all; the password hash
 * lives there and this router has no reason to read it.
 */
const ACCOUNT_ROW_SELECT = {
	createdAt: true,
	email: true,
	firstname: true,
	id: true,
	lastname: true,
	name: true,
	position: true,
	profileComplete: true,
	role: true,
	status: true,
} as const;

const listInputSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(10),
	role: z.string().optional(),
	search: z.string().optional(),
	status: z.string().optional(),
});

/**
 * The four roles this endpoint will mint, as the SERVER sees them.
 *
 * The input schema already refuses anything else, and this is the second reading
 * of the same rule: a schema is one edit away from gaining a fifth value, and
 * that edit must not be able to widen who can be created without touching this
 * line too.
 */
const CREATABLE_ROLES = new Set(["IDO_OFFICER", "IDO_CHAIRPERSON", "DIRECTOR", "BUDGET_OFFICER"]);

/** `undefined` rather than `""`, so an empty search never becomes a filter. */
function trimmed(value: string | undefined): string | undefined {
	const next = value?.trim();

	return next ? next : undefined;
}

/**
 * The self-guard, and it compares against `ctx.user.id` rather than anything in
 * the payload.
 *
 * It is the only thing standing between an administrator and a system nobody can
 * administer: there is one ADMIN by default, this router refuses to create a
 * second, and an admin who demotes or suspends themselves has locked the last
 * door behind them with no recovery short of a database console.
 */
function assertNotSelf(actorId: string, targetId: string, what: "role" | "status"): void {
	if (actorId === targetId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: `You cannot change your own ${what}`,
		});
	}
}

/**
 * The target row, or NOT_FOUND. Read before every write, because `P2025` from a
 * bare `update` is a Prisma code rather than a sentence.
 */
async function findTarget(userId: string) {
	const user = await prisma.user.findUnique({
		select: { id: true, role: true, status: true },
		where: { id: userId },
	});

	if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

	return user;
}

export const adminAccountsRouter = {
	/**
	 * Create a staff account.
	 *
	 * ## Why this does not go through Better Auth
	 *
	 * `auth.api.signUpEmail` auto-signs-in whoever it creates, which on this
	 * screen would replace the ADMIN's own session with the new officer's. So the
	 * two rows are written directly, exactly as `prisma/seed.ts` writes them -
	 * `providerId: "credential"`, `accountId` the lowercased email, and the
	 * password put through Better Auth's OWN `hashPassword`. Any other hash
	 * produces an account that exists and can never sign in, and the failure looks
	 * to its owner like a wrong password.
	 *
	 * ## One transaction, three writes
	 *
	 * The user, its credential row and the role's default grants. Apart they are
	 * each worthless: a user with no credential cannot sign in and owns the email
	 * address its owner would need to try again; grants pointing at a half-made
	 * user are rows nobody reads; and a staff member with no grants signs in and
	 * 403s on everything they were hired to do.
	 *
	 * ## Three flags that are all deliberate
	 *
	 * `status: "active"` is load-bearing rather than decoration - the `User.status`
	 * default is `inactive` (spec 001) so that staff are activated deliberately,
	 * and an admin filling in this form IS that deliberate act. `emailVerified:
	 * true` for the reason CLAUDE.md gives: with no mail provider an unverified
	 * account is parked at /verify-email forever. `profileComplete: false` is
	 * deliberate the other way - the new staff member is sent to /profile to add
	 * the signature their approvals are stamped with.
	 */
	createStaffAccount: adminProcedure.input(CreateStaffAccountInputSchema).mutation(async ({ ctx, input }) => {
		if (!CREATABLE_ROLES.has(input.role)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Cannot assign USER or ADMIN through this endpoint",
			});
		}

		// Case-insensitive, because the column is not: Postgres holds `A@x.com` and
		// `a@x.com` as two rows under one unique index. The input schema lowercases
		// what arrives; this catches a row stored before that was true.
		const existing = await prisma.user.findFirst({
			select: { id: true },
			where: { email: { equals: input.email, mode: "insensitive" } },
		});

		if (existing) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "An account with this email already exists.",
			});
		}

		const hashedPassword = await hashPassword(input.password);
		const userId = randomUUID();

		try {
			await prisma.$transaction(async (tx) => {
				await tx.user.create({
					data: {
						email: input.email,
						emailVerified: true,
						firstname: input.firstname,
						id: userId,
						lastname: input.lastname,
						// Better Auth owns `name`; the two halves are collected
						// separately because the printed form prints them separately.
						name: `${input.firstname} ${input.lastname}`,
						position: input.position ?? null,
						profileComplete: false,
						role: input.role,
						status: "active",
					},
				});

				await tx.account.create({
					data: {
						accountId: input.email,
						createdAt: new Date(),
						id: randomUUID(),
						password: hashedPassword,
						providerId: "credential",
						updatedAt: new Date(),
						userId,
					},
				});

				await seedUserPermissions(userId, input.role, ctx.user.id, tx);
			});
		} catch (error) {
			// Loud rather than swallowed. The transaction rolled back, so there is
			// nothing to clean up - but an admin who pressed Create and got a generic
			// failure needs somebody to be able to find out why.
			console.error("[adminAccounts.createStaffAccount] failed", { email: input.email, error });

			// The unique index is the last word on the email, and it is what a second
			// admin creating the same address at the same moment hits.
			if (error instanceof Error && error.message.includes("Unique constraint")) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "An account with this email already exists.",
				});
			}

			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "The account could not be created. Nothing was saved.",
			});
		}

		return { email: input.email, id: userId, role: input.role, status: "active" as const };
	}),

	/**
	 * One page of accounts.
	 *
	 * Newest first and not sortable: every other column is a closed enum with no
	 * order worth offering, and the thing an admin scans this list for is the
	 * account somebody has just asked them to make.
	 */
	listAllUsers: adminProcedure.input(listInputSchema).query(async ({ input }) => {
		const { page, pageSize } = input;
		const search = trimmed(input.search);

		// An AND of conditions rather than one spread object, so a search term can
		// never overwrite the role or status clause beside it.
		const conditions: UserWhereInput[] = [];

		// Cast, because `role` and `status` arrive as free strings from a URL. A
		// value outside the enum simply matches nothing, which is the right answer
		// to a hand-edited query string - `?role=nonsense` should empty the table,
		// not replace it with an error boundary.
		if (input.role) conditions.push({ role: input.role as UserWhereInput["role"] });
		if (input.status) conditions.push({ status: input.status as UserWhereInput["status"] });

		if (search) {
			conditions.push({
				OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }],
			});
		}

		const where = conditions.length ? { AND: conditions } : {};

		const [items, total] = await prisma.$transaction([
			prisma.user.findMany({
				orderBy: { createdAt: "desc" },
				select: ACCOUNT_ROW_SELECT,
				skip: (page - 1) * pageSize,
				take: pageSize,
				where,
			}),
			prisma.user.count({ where }),
		]);

		return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
	}),

	/**
	 * Move an account to another role, and RESET its permissions to that role's
	 * defaults.
	 *
	 * The reset is the surprising half, and it is why both writes share one
	 * transaction. Merging instead would leave a director demoted to USER still
	 * holding `APPROVE_DIRECTOR`; landing the update without the reset does
	 * exactly the same thing, which is why `resetAndSeedPermissions` is handed the
	 * open client rather than opening its own.
	 */
	updateUserRole: adminProcedure.input(UpdateUserRoleSchema).mutation(async ({ ctx, input }) => {
		assertNotSelf(ctx.user.id, input.userId, "role");

		await findTarget(input.userId);

		return await prisma.$transaction(async (tx) => {
			const user = await tx.user.update({
				data: { role: input.role },
				select: { id: true, role: true },
				where: { id: input.userId },
			});

			await resetAndSeedPermissions(input.userId, input.role, ctx.user.id, tx);

			return user;
		});
	}),

	/**
	 * The account switch.
	 *
	 * `protectedProcedure` re-reads `status` on every call, so a suspension takes
	 * effect on the person's next request rather than when their cookie expires -
	 * they keep a valid session and can do nothing with it.
	 */
	updateUserStatus: adminProcedure.input(UpdateUserStatusSchema).mutation(async ({ ctx, input }) => {
		assertNotSelf(ctx.user.id, input.userId, "status");

		await findTarget(input.userId);

		return await prisma.user.update({
			data: { status: input.status },
			select: { id: true, status: true },
			where: { id: input.userId },
		});
	}),
} satisfies TRPCRouterRecord;
