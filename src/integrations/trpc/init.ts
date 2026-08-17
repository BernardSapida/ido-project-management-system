import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/features/auth/utils/better-auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "../../../prisma/generated/enums.ts";

interface TRPCContext {
	headers: Headers;
}

const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Authenticated, and holding an ACTIVE account.
 *
 * The status read is a second round trip on every protected call, and it is
 * worth it: Better Auth's session hook only refuses to MINT a session for a
 * suspended user, so an account suspended mid-session keeps a valid cookie until
 * it expires. Checking here means the suspension takes effect on the next call
 * rather than next week.
 *
 * The row is also where `status` and the IRMS profile fields live at all - the
 * session user carries only the Better Auth `additionalFields`.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	const session = await auth.api.getSession({ headers: ctx.headers });

	if (!session) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
	}

	const account = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { position: true, profileComplete: true, role: true, signatureUrl: true, status: true },
	});

	if (!account || account.status !== "active") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Your account is not active. Please contact an administrator.",
		});
	}

	return next({ ctx: { ...ctx, user: { ...session.user, ...account }, session } });
});

/**
 * Authenticated AND holding one of `roles`.
 *
 * Exists so the role check is part of choosing the procedure rather than a line
 * somebody has to remember to write inside the resolver. An inline
 * `if (ctx.user.role !== "ADMIN")` is correct until the next admin procedure is
 * added without it, and nothing in the type system notices - which is the whole
 * failure mode. Route groups and tab configs only ORGANISE the UI; a user can
 * always deep-link to another role's screen, so this is the only real gate.
 *
 * FORBIDDEN, not UNAUTHORIZED: the caller is authenticated, they simply are not
 * allowed. Answering 401 sends the client to the sign-in page for a session it
 * already has.
 */
export const roleProcedure = (...roles: Role[]) =>
	protectedProcedure.use(async ({ ctx, next }) => {
		if (!roles.includes(ctx.user.role)) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
		}

		return next({ ctx });
	});

export const adminProcedure = roleProcedure("ADMIN");
