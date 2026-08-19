import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { env } from "@/env";
import { auth } from "@/features/auth/utils/better-auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "../../../prisma/generated/enums.ts";

interface TRPCContext {
	headers: Headers;
	/**
	 * Headers a procedure wants on the HTTP response, drained by `responseMeta`
	 * in `src/routes/api.trpc.$.tsx`.
	 *
	 * It exists for exactly one thing: forwarding a refreshed Better Auth
	 * `set-cookie`. tRPC hands a resolver no way to touch the response, so a
	 * procedure that changes something the session cookie CACHES — see
	 * `profile.updateMyProfile` — has no other way to tell the browser about it,
	 * and the stale cookie then wins for as long as the cache lives.
	 */
	responseHeaders: Headers;
}

/**
 * The sentence a caller gets when nothing threw a `TRPCError`.
 *
 * tRPC sends `error.message` to the client verbatim, and an unhandled throw from
 * a library carries whatever that library felt like saying. Prisma's is the worst
 * case and the one that prompted this: a P2002 arrives as a paragraph naming the
 * server file, the line number, the invocation and the column that clashed - and
 * it lands in a toast, in front of the user, on somebody else's machine. A
 * requestor cannot act on any of it, and it should not be theirs to read.
 *
 * A procedure that knows what went wrong throws a `TRPCError` with a sentence of
 * its own, and those pass through untouched. This only replaces the ones nobody
 * translated.
 */
const INTERNAL_ERROR_MESSAGE = "Something went wrong on our end. Please try again.";

const t = initTRPC.context<TRPCContext>().create({
	/**
	 * Redact the message of an untranslated internal error, and keep the original
	 * where a developer will see it.
	 *
	 * The redaction is NOT conditional on the environment, which is the point: the
	 * screenshot that started this was a dev server, because a demo runs on one.
	 * Gating it on `production` would leave the leak in every situation anybody
	 * actually looks at the screen.
	 *
	 * `devMessage` is how the detail survives. In development it carries the real
	 * text into `error.data`, next to the stack tRPC already puts there, so the
	 * network tab and the devtools still answer "what actually failed" - and in
	 * production the key is absent entirely rather than empty.
	 */
	errorFormatter({ error, shape }) {
		if (error.code !== "INTERNAL_SERVER_ERROR") return shape;

		return {
			...shape,
			data: {
				...shape.data,
				...(env.NODE_ENV === "development" ? { devMessage: error.message } : {}),
			},
			message: INTERNAL_ERROR_MESSAGE,
		};
	},
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
