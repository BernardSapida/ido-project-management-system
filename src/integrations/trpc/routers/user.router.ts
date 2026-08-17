import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { auth } from "@/features/auth/utils/better-auth";
import { UpdateProfileSchema } from "@/features/user/validations/schema/update-profile.schema";
import { prisma } from "@/lib/prisma";
import { protectedProcedure } from "../init";

export const userRouter = {
	updateProfile: protectedProcedure.input(UpdateProfileSchema).mutation(async ({ input, ctx }) => {
		const result = await auth.api.updateUser({
			body: {
				firstname: input.firstname,
				lastname: input.lastname,
				name: `${input.firstname} ${input.lastname}`.trim(),
			},
			headers: ctx.headers,
		});
		return result;
	}),

	changePassword: protectedProcedure
		.input(z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(8) }))
		.mutation(async ({ input, ctx }) => {
			try {
				await auth.api.changePassword({
					body: { currentPassword: input.currentPassword, newPassword: input.newPassword, revokeOtherSessions: false },
					headers: ctx.headers,
				});
				return { success: true };
			} catch {
				throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_CURRENT_PASSWORD" });
			}
		}),

	deleteAccount: protectedProcedure
		.input(z.object({ password: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.user.id;
			const email = ctx.user.email;

			try {
				await auth.api.signInEmail({
					body: { email, password: input.password },
					headers: ctx.headers,
				});
			} catch {
				throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_PASSWORD" });
			}

			await prisma.session.deleteMany({ where: { userId } });
			await prisma.account.deleteMany({ where: { userId } });
			await prisma.user.delete({ where: { id: userId } });

			return { success: true };
		}),
} satisfies TRPCRouterRecord;
