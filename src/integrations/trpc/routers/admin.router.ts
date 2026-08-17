import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminProcedure } from "../init";

export const adminRouter = {
	listUsers: adminProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(10),
				page: z.number().min(1).default(1),
			}),
		)
		.query(async ({ input }) => {
			const skip = (input.page - 1) * input.limit;
			const [users, total] = await Promise.all([
				prisma.user.findMany({ orderBy: { createdAt: "desc" }, skip, take: input.limit }),
				prisma.user.count(),
			]);

			return {
				limit: input.limit,
				page: input.page,
				total,
				totalPages: Math.ceil(total / input.limit),
				users,
			};
		}),
} satisfies TRPCRouterRecord;
