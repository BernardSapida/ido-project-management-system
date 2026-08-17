import type { TRPCRouterRecord } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { publicProcedure } from "../init";

export const postRouter = {
	list: publicProcedure.query(async () => {
		return prisma.post.findMany({
			orderBy: { createdAt: "asc" },
			select: {
				id: true,
				title: true,
				description: true,
				author: true,
				createdAt: true,
			},
		});
	}),
} satisfies TRPCRouterRecord;
