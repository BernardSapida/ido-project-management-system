import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
	baseURL: env.VITE_BASE_URL ?? "http://localhost:4000",
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const user = await prisma.user.findUnique({ where: { id: session.userId } });
					if (!user || user.status === "suspended") {
						return false;
					}
				},
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			// Replace with your email provider (Resend, Nodemailer, etc.)
			console.log(`[DEV] Password reset for ${user.email}: ${url}`);
		},
	},
	emailVerification: {
		sendOnSignUp: false,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			// Replace with your email provider (Resend, Nodemailer, etc.)
			console.log(`[DEV] Verify email for ${user.email}: ${url}`);
		},
	},
	secret: env.BETTER_AUTH_SECRET,
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	user: {
		/**
		 * Every custom column on `User` has to be declared here or Better Auth
		 * silently drops it: `signUpEmail` writes the fields it knows about and
		 * throws the rest away, so an undeclared `position` is not an error, it
		 * is a null column nobody notices until the PDF prints blank.
		 *
		 * `input: false` on the last four is the security half of the same
		 * declaration. Declaring a field makes it writable from the client by
		 * default, so `authClient.signUp.email({ role: "DIRECTOR" })` would be a
		 * privilege escalation that never touches our router - and
		 * `profileComplete: true` would walk straight past spec 003's gate.
		 * These four are written by server code only: `role` and `position` by
		 * `authSignup.signUp` (and by the admin page, spec 017), `signatureUrl`
		 * and `profileComplete` by the profile flow (spec 003).
		 */
		additionalFields: {
			firstname: { type: "string", required: true },
			lastname: { type: "string", required: true },
			position: { type: "string", required: false, input: false },
			profileComplete: { type: "boolean", required: false, defaultValue: false, input: false },
			role: { type: "string", required: false, defaultValue: "USER", input: false },
			signatureUrl: { type: "string", required: false, input: false },
		},
	},
	trustedOrigins: [env.VITE_BASE_URL, env.MOBILE_DEV_URL ?? "http://localhost:8081"],
	plugins: [tanstackStartCookies(), bearer()],
});
