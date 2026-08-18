import { z } from "zod";

/**
 * The one rule this feature has, and both sides read it from here.
 *
 * `.trim()` runs BEFORE `.min(1)`, which is the whole of the whitespace rule: a
 * composer holding three spaces and a newline is empty, and a schema that
 * checked length first would accept it and put a blank row in a thread that is
 * meant to be a conversation. The server re-parses the same schema, so the
 * stored message is the trimmed one either way - the client is not trusted to
 * have trimmed it, it is merely told sooner.
 *
 * 2000 is the cap. It is not a database limit - the column is unbounded text -
 * it is a decision about what a comment IS: a question or an answer, not the
 * document. Anything longer belongs in the request itself, or as an attachment.
 */
export const commentMessageSchema = z
	.string()
	.trim()
	.min(1, "Message is required")
	.max(2000, "Messages are limited to 2000 characters");

/** The cap, exported so the composer can count against the same number. */
export const COMMENT_MAX_LENGTH = 2000;

export const listCommentsSchema = z.object({
	requestId: z.string().min(1),
});

export const createCommentSchema = z.object({
	message: commentMessageSchema,
	requestId: z.string().min(1),
});

/**
 * `id` and a message, and deliberately no `requestId`.
 *
 * The comment's own row says which request it belongs to, so accepting one from
 * the client would only create a second answer to a question that already has
 * one - and the guard reads `comment.userId`, not the request, so a mismatched
 * `requestId` would sail past it.
 */
export const updateCommentSchema = z.object({
	id: z.string().min(1),
	message: commentMessageSchema,
});

export const deleteCommentSchema = z.object({
	id: z.string().min(1),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
