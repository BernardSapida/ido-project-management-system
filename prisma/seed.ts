import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "./generated/client";
import type { Action, Role, STATUS } from "./generated/enums";
import { type FlowActors, seedFlows } from "./seed-flows";
import { signatureDataUri } from "./seed-signature";

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
		/*
		 * The requestor signs too, and leaving this null was wrong for the demo
		 * data even though flow 01 step 2 is where a real user uploads theirs.
		 * Every seeded request is ALREADY filed, and the requestor's signature is
		 * on the form from the moment it is - so a null here printed fifteen
		 * historical forms with the Faculty Representative row carrying a date and
		 * a time under an empty name and an empty signature box. Step 2 is still
		 * demonstrable from Profile, and a genuinely new sign-up still has nothing
		 * here until they upload one.
		 */
		signatureUrl: signatureDataUri("Juan Dela Cruz"),
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
		signatureUrl: signatureDataUri("Ida Reyes"),
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
		signatureUrl: signatureDataUri("Carlos Santos"),
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
		signatureUrl: signatureDataUri("Divina Ramos"),
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
		signatureUrl: signatureDataUri("Ben Cruz"),
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

	/** Every seeded account by role, so the flow fixtures can name their actors. */
	const byRole = new Map<Role, { id: string; name: string; signatureUrl: string }>();

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

		byRole.set(account.role, {
			id: user.id,
			name: account.name,
			signatureUrl: account.signatureUrl ?? "",
		});

		const grants = actions.length ? ` — ${actions.length} permissions` : "";
		console.log(`  ✓ ${email} (${account.role})${grants}${existingCredential ? " — password left as-is" : ""}`);
	}

	// Only when empty, so a re-seed does not stack another three copies.
	if ((await prisma.post.count()) === 0) {
		await prisma.post.createMany({ data: TEST_POSTS });
		console.log(`  ✓ ${TEST_POSTS.length} demo posts`);
	}

	await seedFlowDemo();

	console.log("✅ Seeding complete");

	/**
	 * The demo data for `IRMS-old/flows/`, and the document counter that has to
	 * agree with it.
	 *
	 * Nested so it can read `byRole` without threading six ids through a
	 * parameter list, and it runs last because every fixture references an account
	 * the loop above has just created.
	 */
	async function seedFlowDemo(): Promise<void> {
		const actors: FlowActors = {
			budgetOfficer: requireActor("BUDGET_OFFICER"),
			chairperson: requireActor("IDO_CHAIRPERSON"),
			director: requireActor("DIRECTOR"),
			idoOfficer: requireActor("IDO_OFFICER"),
			requestor: requireActor("USER"),
		};

		const { count, highestSequence, walkthrough } = await seedFlows(prisma, actors);

		/*
		 * The counter has to be told what the fixtures used, and this is the whole
		 * reason it is here rather than left at whatever it was. `document_sequences`
		 * is what `generateDocumentNumber` counts from; seeding sixteen requests
		 * numbered 2026-0001 upward while the counter still reads 0 hands the next
		 * real submit a number one of them already holds, and the unique index kills
		 * it. The generator now floors itself against the requests table so it would
		 * survive that, but a seed that leaves a knowingly-wrong counter behind is
		 * still a seed that plants the bug.
		 */
		const year = new Date().getFullYear();

		await prisma.documentSequence.upsert({
			create: { lastSequence: highestSequence, year },
			update: { lastSequence: highestSequence },
			where: { year },
		});

		console.log(`  ✓ ${count} flow demo requests — document numbers up to ${year}-${String(highestSequence).padStart(4, "0")}`);
		console.log("");
		console.log("  Walkthrough (IRMS-old/flows):");
		for (const line of walkthrough) {
			console.log(`    ${line}`);
		}
		console.log("");
	}

	/** A missing actor is a broken seed, not something to paper over: the fixtures
	 *  reference it by id, and a silent fallback would file the whole demo under
	 *  the wrong account. */
	function requireActor(role: Role): { id: string; name: string; signatureUrl: string } {
		const actor = byRole.get(role);

		if (!actor) {
			throw new Error(`Seed is missing the ${role} account the flow demo data needs.`);
		}

		return actor;
	}
}

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
