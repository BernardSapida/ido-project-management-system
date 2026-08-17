import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { auth } from "@/features/auth/utils/better-auth";
import { SignUpInputSchema } from "@/features/auth-signup/validations/schema/sign-up.schema";
import { seedUserPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { publicProcedure } from "../init";

/**
 * Undo a half-made account.
 *
 * Better Auth has already written `user`, `account` and (auto sign-in) `session`
 * rows by the time our own writes run, and those three are outside any
 * transaction we can open. If the IRMS half then fails, the alternative to
 * removing them is an account that can sign in, holds no permissions, and owns
 * the email address its owner would have to use to try again.
 *
 * The order is forced by the schema: `Session` and `Account` reference `User`
 * with Prisma's default `Restrict`, so the parent cannot go first.
 */
async function discardAccount(userId: string): Promise<void> {
	await prisma.session.deleteMany({ where: { userId } });
	await prisma.account.deleteMany({ where: { userId } });
	await prisma.user.delete({ where: { id: userId } });
}

export const authSignupRouter = {
	/**
	 * Register a requestor.
	 *
	 * Public by necessity - this is the front door. What makes that safe is that
	 * nothing the caller sends decides what they become: `role` is the literal
	 * `"USER"` written here, it is not in the input schema, and `input: false`
	 * in `better-auth.ts` stops `authClient.signUp.email` being used to set it
	 * directly either.
	 */
	signUp: publicProcedure.input(SignUpInputSchema).mutation(async ({ input }) => {
		// Case-insensitive, because the column is not. Postgres compares
		// `A@x.com` and `a@x.com` as different strings, so the unique index would
		// happily hold both; the input is lowercased by the schema, and this
		// catches an existing row that was stored before that was true.
		const existing = await prisma.user.findFirst({
			where: { email: { equals: input.email, mode: "insensitive" } },
			select: { id: true },
		});

		if (existing) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "An account with this email already exists.",
			});
		}

		const response = await auth.api
			.signUpEmail({
				body: {
					email: input.email,
					firstname: input.firstname,
					lastname: input.lastname,
					// Better Auth owns `name`; the form collects the two halves
					// because the printed request form prints them separately.
					name: `${input.firstname} ${input.lastname}`,
					password: input.password,
				},
			})
			.catch((error: unknown) => {
				const message = error instanceof Error ? error.message.toLowerCase() : "";
				if (message.includes("already exists") || message.includes("unique")) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "An account with this email already exists.",
					});
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Signup failed. Please try again.",
				});
			});

		if (!response?.user) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Signup failed. Please try again.",
			});
		}

		const userId = response.user.id;

		try {
			// One transaction, because the halves are worthless apart: an account
			// with no permissions 403s on every action it can reach, and grants
			// pointing at a user who was never finished are rows nobody reads.
			await prisma.$transaction(async (tx) => {
				await tx.user.update({
					where: { id: userId },
					data: {
						position: input.position,
						profileComplete: false,
						role: "USER",
						status: "active",
						// See the decision note in CLAUDE.md ("Self sign-ups are
						// marked verified"): there is no mail provider, and
						// `assertAuthenticatedFn` bounces an unverified user to
						// /verify-email, whose resend button prints the link to
						// the server console. Left false, every self sign-up is
						// locked out of the app it just registered for.
						emailVerified: true,
					},
				});

				await seedUserPermissions(userId, "USER", userId, tx);
			});
		} catch (error) {
			await discardAccount(userId).catch((cleanupError: unknown) => {
				// The account survives and the address is taken. Say so loudly -
				// an admin has to remove it before that person can register.
				console.error("[authSignup.signUp] orphaned account left behind", { userId, cleanupError });
			});

			console.error("[authSignup.signUp] failed after account creation", { userId, error });

			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Signup failed. Please try again.",
			});
		}

		return {
			email: response.user.email,
			id: userId,
			position: input.position,
			profileComplete: false,
			role: "USER" as const,
		};
	}),
} satisfies TRPCRouterRecord;
