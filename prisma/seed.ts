import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "./generated/client";
import type { Action, Role, STATUS } from "./generated/enums";

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

/**
 * Kept in step with `src/lib/permissions.ts` by hand, and duplicated on purpose:
 * importing it would drag `@/lib/prisma` and therefore `src/env.ts` into a
 * script that has already made its own client.
 */
const ROLE_DEFAULT_PERMISSIONS: Record<string, Action[]> = {
	ADMIN: [],
	BUDGET_OFFICER: ["ADD_COMMENT", "APPROVE_BUDGET"],
	DIRECTOR: ["ADD_COMMENT", "APPROVE_DIRECTOR"],
	IDO_CHAIRPERSON: ["ADD_COMMENT", "REVIEW_REQUEST"],
	IDO_OFFICER: ["ADD_COMMENT", "REVIEW_REQUEST"],
	USER: ["CREATE_REQUEST", "SUBMIT_REQUEST", "ADD_COMMENT", "SUBMIT_CSM"],
};

const PASSWORD = "@Password123";

/**
 * One sign-in-ready account per role.
 *
 * `emailVerified` is true on all of them because `assertAuthenticatedFn` bounces
 * an unverified user to `/verify-email`, and no mail provider is wired - the
 * resend button would print a link to the server console the user cannot see.
 *
 * `status: "active"` is explicit for the same kind of reason: the User default
 * is now `inactive`, so an admin has to activate staff deliberately.
 *
 * **Change these before any deployment reachable by anyone but you.**
 */
const ACCOUNTS = [
	{
		email: "admin@gmail.com",
		firstname: "Super",
		lastname: "Admin",
		name: "Super Admin",
		role: "ADMIN" as Role,
		position: null,
		status: "active" as STATUS,
		profileComplete: true,
		signatureUrl: null,
	},
	{
		email: "user@gmail.com",
		firstname: "Juan",
		lastname: "Dela Cruz",
		name: "Juan Dela Cruz",
		role: "USER" as Role,
		position: "FACULTY_REPRESENTATIVE",
		status: "active" as STATUS,
		profileComplete: true,
		signatureUrl: null,
	},
	{
		email: "ido-officer@gmail.com",
		firstname: "Ida",
		lastname: "Reyes",
		name: "Ida Reyes",
		role: "IDO_OFFICER" as Role,
		position: null,
		status: "active" as STATUS,
		profileComplete: true,
		signatureUrl: null,
	},
	{
		email: "ido-chairperson@gmail.com",
		firstname: "Carlos",
		lastname: "Santos",
		name: "Carlos Santos",
		role: "IDO_CHAIRPERSON" as Role,
		position: null,
		status: "active" as STATUS,
		profileComplete: true,
		signatureUrl: null,
	},
	{
		email: "director@gmail.com",
		firstname: "Divina",
		lastname: "Ramos",
		name: "Divina Ramos",
		role: "DIRECTOR" as Role,
		position: null,
		status: "active" as STATUS,
		profileComplete: true,
		signatureUrl: null,
	},
	{
		email: "budget-officer@gmail.com",
		firstname: "Ben",
		lastname: "Cruz",
		name: "Ben Cruz",
		role: "BUDGET_OFFICER" as Role,
		position: null,
		status: "active" as STATUS,
		profileComplete: true,
		signatureUrl: null,
	},
];

/** Template demo rows for `/test`. Not IRMS data - they go when that page does. */
const TEST_POSTS = [
	{
		title: "Getting Started with TanStack Start",
		description: "A quick tour of the monolith template — routing, tRPC, and Prisma wired together.",
		author: "Ada Lovelace",
	},
	{
		title: "Better Auth in Practice",
		description: "How the web and native clients share a single Better Auth session layer.",
		author: "Alan Turing",
	},
	{
		title: "Designing with HeroUI v3",
		description: "Compound components and semantic variants for a consistent UI across platforms.",
		author: "Grace Hopper",
	},
];

async function main() {
	console.log("🌱 Seeding database...");

	// Hashed with Better Auth's own function, not bcrypt directly: sign-in
	// verifies with the same one, so anything else produces an account that
	// exists and can never sign in.
	const hashedPassword = await hashPassword(PASSWORD);

	for (const account of ACCOUNTS) {
		const { email, ...fields } = account;

		// Upsert on email, so re-seeding never duplicates an account and never
		// undoes a role or status an admin changed by hand in the meantime.
		const user = await prisma.user.upsert({
			where: { email },
			update: { ...fields, emailVerified: true },
			create: { id: randomUUID(), email, ...fields, emailVerified: true },
		});

		const existingCredential = await prisma.account.findFirst({
			where: { userId: user.id, providerId: "credential" },
		});

		// Only CREATE the credential - never overwrite one. A password the owner
		// has since changed is theirs, and a seed that resets it silently locks
		// them out of the account they think they still control.
		if (!existingCredential) {
			await prisma.account.create({
				data: {
					id: randomUUID(),
					userId: user.id,
					accountId: email,
					providerId: "credential",
					password: hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});
		}

		const actions = ROLE_DEFAULT_PERMISSIONS[account.role] ?? [];
		if (actions.length > 0) {
			await prisma.userPermission.createMany({
				data: actions.map((action) => ({ action, grantedBy: user.id, userId: user.id })),
				skipDuplicates: true,
			});
		}

		const grants = actions.length ? ` — ${actions.length} permissions` : "";
		console.log(`  ✓ ${email} (${account.role})${grants}${existingCredential ? " — password left as-is" : ""}`);
	}

	// Only when empty, so a re-seed does not stack another three copies.
	if ((await prisma.post.count()) === 0) {
		await prisma.post.createMany({ data: TEST_POSTS });
		console.log(`  ✓ ${TEST_POSTS.length} demo posts`);
	}

	console.log("✅ Seeding complete");
}

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
