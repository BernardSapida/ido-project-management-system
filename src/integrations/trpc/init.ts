import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/features/auth/utils/better-auth";
import type { Role } from "../../../prisma/generated/enums.ts";

interface TRPCContext {
	headers: Headers;
}

const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	const session = await auth.api.getSession({ headers: ctx.headers });

	if (!session) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
	}

	return next({ ctx: { ...ctx, user: session.user, session } });
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
		if (!roles.includes(ctx.user.role as Role)) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
		}

		return next({ ctx });
	});

export const adminProcedure = roleProcedure("ADMIN");
