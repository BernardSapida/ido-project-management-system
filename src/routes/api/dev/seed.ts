import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";
import { auth } from "@/features/auth/utils/better-auth";
import { prisma } from "@/lib/prisma";

const TEST_USERS = [
	{
		email: "user@test.com",
		password: "Password123!",
		name: "Test User",
		firstname: "Test",
		lastname: "User",
		role: "USER" as const,
		status: "active" as const,
	},
	{
		email: "admin@test.com",
		password: "Password123!",
		name: "Test Admin",
		firstname: "Test",
		lastname: "Admin",
		role: "ADMIN" as const,
		status: "active" as const,
	},
	{
		email: "locked@test.com",
		password: "Password123!",
		name: "Locked User",
		firstname: "Locked",
		lastname: "User",
		role: "USER" as const,
		status: "inactive" as const,
	},
];

export const Route = createFileRoute("/api/dev/seed")({
	server: {
		handlers: {
			POST: async () => {
				if (env.NODE_ENV !== "development") {
					return new Response("Not found", { status: 404 });
				}

				const results: { email: string; action: string }[] = [];

				for (const userData of TEST_USERS) {
					const existing = await prisma.user.findUnique({ where: { email: userData.email } });
					if (existing) {
						results.push({ action: "skipped", email: userData.email });
						continue;
					}

					try {
						await auth.api.signUpEmail({
							body: {
								email: userData.email,
								firstname: userData.firstname,
								lastname: userData.lastname,
								name: userData.name,
								password: userData.password,
							},
						});

						await prisma.user.update({
							data: { emailVerified: true, role: userData.role, status: userData.status },
							where: { email: userData.email },
						});

						results.push({ action: "created", email: userData.email });
					} catch {
						results.push({ action: "error", email: userData.email });
					}
				}

				return new Response(JSON.stringify({ results }), {
					headers: { "Content-Type": "application/json" },
				});
			},
		},
	},
});
