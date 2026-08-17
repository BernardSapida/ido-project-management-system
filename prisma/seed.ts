import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";
import { auth } from "../src/features/auth/utils/better-auth";

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

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
	{
		title: "Type-safe APIs with tRPC v11",
		description: "End-to-end type safety from the database all the way to your React components.",
		author: "Linus Torvalds",
	},
	{
		title: "Shipping the Native App",
		description: "The Expo client fetches this exact row from the monolith to prove the DB connection.",
		author: "Margaret Hamilton",
	},
];

const TEST_USERS = [
	{
		email: "user@gmail.com",
		password: "@Password123",
		name: "Test User",
		firstname: "Test",
		lastname: "User",
		role: "USER" as const,
		status: "active" as const,
	},
	{
		email: "admin@gmail.com",
		password: "@Password123",
		name: "Test Admin",
		firstname: "Test",
		lastname: "Admin",
		role: "ADMIN" as const,
		status: "active" as const,
	},
	{
		email: "locked@gmail.com",
		password: "@Password123",
		name: "Locked User",
		firstname: "Locked",
		lastname: "User",
		role: "USER" as const,
		status: "inactive" as const,
	},
];

async function main() {
	console.log("🌱 Seeding database...");

	console.log("🗑️  Deleting existing data...");
	await prisma.session.deleteMany();
	await prisma.account.deleteMany();
	await prisma.verification.deleteMany();
	await prisma.user.deleteMany();
	await prisma.post.deleteMany();
	console.log("✅ Deleted existing data");

	await prisma.post.createMany({ data: TEST_POSTS });
	console.log(`✅ Created ${TEST_POSTS.length} posts`);

	for (const userData of TEST_USERS) {
		try {
			await auth.api.signUpEmail({
				body: {
					email: userData.email,
					password: userData.password,
					name: userData.name,
					firstname: userData.firstname,
					lastname: userData.lastname,
				},
			});
		} catch (err) {
			// signUpEmail creates the user + account before attempting session creation.
			// Our session hook blocks inactive users, so FAILED_TO_CREATE_SESSION is expected.
			const code = (err as { body?: { code?: string } })?.body?.code;
			if (code !== "FAILED_TO_CREATE_SESSION") {
				console.error(`❌ Failed to create ${userData.email}:`, err);
				continue;
			}
		}

		try {
			await prisma.verification.deleteMany({ where: { identifier: userData.email } });

			await prisma.user.update({
				where: { email: userData.email },
				data: {
					role: userData.role,
					status: userData.status,
					emailVerified: true,
				},
			});

			console.log(`✅ Created ${userData.role} — ${userData.email}`);
		} catch (err) {
			console.error(`❌ Failed to update ${userData.email}:`, err);
		}
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
