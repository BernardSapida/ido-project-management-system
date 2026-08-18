import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { auth } from "@/features/auth/utils/better-auth";
import { updateProfileInputSchema } from "@/features/user-profile/validations/schema/update-profile.schema";
import { prisma } from "@/lib/prisma";
import { protectedProcedure } from "../init";

/**
 * The signed-in user's own profile. Both procedures address `ctx.user` and
 * nothing else — there is no `userId` input on either, so there is nothing to
 * tamper with. Reading or writing somebody else's profile is the admin page's
 * job (spec 017), on its own gated router.
 */
export const profileRouter = {
	getMyProfile: protectedProcedure.query(async ({ ctx }) => {
		return await prisma.user.findUniqueOrThrow({
			where: { id: ctx.user.id },
			select: {
				email: true,
				firstname: true,
				id: true,
				lastname: true,
				name: true,
				position: true,
				profileComplete: true,
				role: true,
				signatureUrl: true,
				status: true,
				createdAt: true,
			},
		});
	}),

	/**
	 * Save name, position and signature.
	 *
	 * ## `profileComplete` is computed here, and only here
	 *
	 * It is not in the input schema and could not be honoured if it were: it is
	 * `signatureUrl` being present, restated as a boolean so the route gate can
	 * read it off the session without a join. A client that sends it is ignored,
	 * and `input: false` in `better-auth.ts` stops `authClient.updateUser` from
	 * being used to set it directly either.
	 *
	 * ## Why Prisma rather than `auth.api.updateUser`
	 *
	 * `position`, `signatureUrl` and `profileComplete` are declared with
	 * `input: false`, and Better Auth does not merely ignore such a field — it
	 * throws `BAD_REQUEST: <field> is not allowed to be set`, server-side callers
	 * included. That declaration is what protects them from the client, so the
	 * server writes the row directly. The session is refreshed separately below.
	 *
	 * ## The cookie refresh
	 *
	 * A session cookie can cache the user, and this mutation changes the one
	 * field the route gate reads. Left stale, `profileComplete` stays false in
	 * the browser and the user is bounced back to /profile immediately after
	 * saving — a loop that looks exactly like the save having failed. Re-reading
	 * with `disableCookieCache` mints a fresh cookie, and forwarding its
	 * `set-cookie` through `ctx.responseHeaders` is what gets it to the browser;
	 * tRPC gives a resolver no other way to touch the response.
	 */
	updateMyProfile: protectedProcedure.input(updateProfileInputSchema).mutation(async ({ ctx, input }) => {
		const existing = ctx.user;

		// Absent means "leave it as it was"; `null` means "clear it". The two have
		// to stay distinguishable, so neither can be flattened with `??` here.
		const nextPosition = input.position === undefined ? (existing.position ?? null) : (input.position ?? null);
		const nextSignature =
			input.signatureUrl === undefined ? (existing.signatureUrl ?? null) : (input.signatureUrl ?? null);

		// The server half of the rule the form applies per role. The form is a
		// convenience; this is the gate — a requestor's position prints on the
		// request form as their designation, and a blank one there is a form that
		// has to be filled in again by hand.
		if (existing.role === "USER" && !nextPosition) {
			throw new TRPCError({ code: "BAD_REQUEST", message: "Position is required." });
		}

		const user = await prisma.user.update({
			where: { id: existing.id },
			data: {
				name: input.name,
				position: nextPosition,
				signatureUrl: nextSignature,
				profileComplete: Boolean(nextSignature),
			},
			select: {
				id: true,
				name: true,
				position: true,
				profileComplete: true,
				signatureUrl: true,
			},
		});

		const refreshed = await auth.api.getSession({
			asResponse: true,
			headers: ctx.headers,
			query: { disableCookieCache: true },
		});

		for (const cookie of refreshed.headers.getSetCookie()) {
			ctx.responseHeaders.append("set-cookie", cookie);
		}

		return user;
	}),
} satisfies TRPCRouterRecord;
