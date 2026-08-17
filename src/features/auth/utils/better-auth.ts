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
		additionalFields: {
			firstname: { type: "string", required: true },
			lastname: { type: "string", required: true },
			role: { type: "string", required: true, defaultValue: "USER" },
		},
	},
	trustedOrigins: [env.VITE_BASE_URL, env.MOBILE_DEV_URL ?? "http://localhost:8081"],
	plugins: [tanstackStartCookies(), bearer()],
});
