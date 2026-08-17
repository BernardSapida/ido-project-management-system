import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";
import { PrismaClient } from "../../prisma/generated/client.ts";

const adapter = new PrismaPg({
	connectionString: env.DATABASE_URL,
});

declare global {
	var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = globalThis.__prisma || new PrismaClient({ adapter });

if (env.NODE_ENV !== "production") {
	globalThis.__prisma = prisma;
}
