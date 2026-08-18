import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import {
	createCommentSchema,
	deleteCommentSchema,
	listCommentsSchema,
	updateCommentSchema,
} from "@/features/request-comments/validations/schema/comment.schema";
import { assertPermission, hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { assertCanReadRequest } from "@/lib/request-access";
import { protectedProcedure } from "../init";

/**
 * The thread on one request: read by everyone who can open the request, written
 * by everyone who holds `ADD_COMMENT`, edited and deleted by its AUTHOR alone.
 *
 * ## Two different gates, deliberately
 *
 * Reading and posting are gated on the REQUEST - `assertCanReadRequest`, the
 * same helper `request.getById` uses, plus a grant on the write. Editing and
 * deleting are gated on the COMMENT, and only on who wrote it. No role short-
 * circuits that, DIRECTOR included: a thread where a reviewer can rewrite a
 * requestor's words is worthless as the record of what was asked and answered,
 * and it is the only record this app keeps of a clarification. There is no
 * moderation model here because there is no moderator.
 */

/**
 * The author, as a comment line needs them.
 *
 * Four columns and no more. `email` is absent on purpose - the thread prints a
 * name and a role, and a comment payload is not a reason to hand every reviewer
 * on a request the email address of everybody else on it.
 *
 * `role` is read LIVE on every list rather than stamped onto the row at write
 * time. An officer promoted to chairperson therefore reads as a chairperson on
 * comments they wrote before the promotion, which is a known and accepted
 * oddity: the alternative is a `roleAtWrite` column that is wrong in the other
 * direction the moment somebody asks "who is the chair, and what did they say".
 */
const COMMENT_AUTHOR_SELECT = { firstname: true, id: true, lastname: true, role: true } as const;

const COMMENT_SELECT = {
	createdAt: true,
	id: true,
	message: true,
	updatedAt: true,
	user: { select: COMMENT_AUTHOR_SELECT },
	userId: true,
} as const;

/**
 * Load a comment and prove the caller wrote it.
 *
 * Existence first, then authorship, for the reason `assertCanReadRequest`
 * orders its two the same way - and here the ids being probed are ones the
 * caller has already seen in a thread they were allowed to read.
 *
 * Returns `requestId` because both callers need it and neither has it: the
 * update and delete inputs carry the comment's id alone.
 */
async function loadOwnComment(id: string, userId: string, verb: "edit" | "delete") {
	const existing = await prisma.requestComment.findUnique({
		where: { id },
		select: { id: true, requestId: true, userId: true },
	});

	if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });

	if (existing.userId !== userId) {
		throw new TRPCError({ code: "FORBIDDEN", message: `Cannot ${verb} another user's comment` });
	}

	return existing;
}

export const commentRouter = {
	/**
	 * One request's thread, oldest-first.
	 *
	 * Oldest-first is not a preference the client can override: it is a
	 * conversation, so the newest message sits nearest the box you type into.
	 * `AppCommentSection` never re-sorts, which means this `orderBy` IS the
	 * reading order on screen.
	 *
	 * ## Why the answer carries `canComment`
	 *
	 * The composer has to be present and disabled - with a reason - for a reader
	 * whose `ADD_COMMENT` was revoked, and the browser has no other way to learn
	 * that: the session carries a role, and permissions are per-user grants that
	 * an admin can revoke without touching the role. Sending it beside the thread
	 * costs one indexed lookup on a query the page already makes, where a
	 * separate `permission.mine` procedure would be a second round trip for the
	 * same fact. It decides nothing - `create` re-checks the grant itself.
	 */
	list: protectedProcedure.input(listCommentsSchema).query(async ({ ctx, input }) => {
		const { user } = ctx;

		const request = await prisma.request.findUnique({
			where: { id: input.requestId },
			select: { userId: true },
		});

		assertCanReadRequest(request, user);

		const [comments, canComment] = await Promise.all([
			prisma.requestComment.findMany({
				where: { requestId: input.requestId },
				select: COMMENT_SELECT,
				orderBy: { createdAt: "asc" },
			}),
			hasPermission(user.id, "ADD_COMMENT"),
		]);

		return { canComment, comments };
	}),

	/**
	 * Post one message.
	 *
	 * `userId` is `ctx.user.id` and the input has no author field at all, which is
	 * the whole of the attribution rule: there is nothing a crafted payload could
	 * send that would sign somebody else's name to a comment.
	 *
	 * Access before grant, in that order. A caller who cannot read the request
	 * must not be able to learn from the error whether they merely lack
	 * `ADD_COMMENT` - "you don't have permission to post here" confirms there is a
	 * "here" to post to.
	 */
	create: protectedProcedure.input(createCommentSchema).mutation(async ({ ctx, input }) => {
		const { user } = ctx;

		const request = await prisma.request.findUnique({
			where: { id: input.requestId },
			select: { userId: true },
		});

		assertCanReadRequest(request, user);
		await assertPermission(user.id, "ADD_COMMENT");

		return await prisma.requestComment.create({
			data: { message: input.message, requestId: input.requestId, userId: user.id },
			select: COMMENT_SELECT,
		});
	}),

	/**
	 * Rewrite your own message.
	 *
	 * No `ADD_COMMENT` re-check, and that is deliberate: revoking the grant stops
	 * somebody adding to the conversation, it does not strand a typo they made
	 * yesterday. The gate here is authorship and nothing else.
	 *
	 * `updatedAt` is what the client renders as the "edited" marker, and Prisma's
	 * `@updatedAt` moves it on this write - there is no separate `editedAt`
	 * column because nothing else ever updates the row.
	 */
	update: protectedProcedure.input(updateCommentSchema).mutation(async ({ ctx, input }) => {
		await loadOwnComment(input.id, ctx.user.id, "edit");

		return await prisma.requestComment.update({
			where: { id: input.id },
			data: { message: input.message },
			select: COMMENT_SELECT,
		});
	}),

	/**
	 * Remove your own message, outright.
	 *
	 * A hard delete, because there is no soft-delete column and no reader for one
	 * if there were. The thread is a conversation; `AuditLog` is the record that
	 * is not allowed to lose anything, and nothing in the workflow is decided by
	 * reading a comment.
	 */
	delete: protectedProcedure.input(deleteCommentSchema).mutation(async ({ ctx, input }) => {
		const existing = await loadOwnComment(input.id, ctx.user.id, "delete");

		await prisma.requestComment.delete({ where: { id: input.id } });

		// The request id goes back with it so the caller can invalidate the thread
		// it came out of - the input only ever named the comment.
		return { id: existing.id, requestId: existing.requestId };
	}),
} satisfies TRPCRouterRecord;
