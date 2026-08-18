import { AppToast, reason } from "@bernardsapida/web-ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import { useCallback } from "react";
import { commentMessageSchema } from "@/features/request-comments/validations/schema/comment.schema";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * Posting, editing and deleting on one thread.
 *
 * ## Where the optimism lives, and why it is not here
 *
 * `AppCommentSection` already renders the message the instant it is written, and
 * keeps it - dimmed, with its text, with a Retry - when the post rejects. Its
 * contract is the reverse of a react-query optimistic update: `onSubmit` MUST
 * NOT resolve until the comment is in the `comments` prop, and until it does the
 * thread is showing the pending copy. So a `setQueryData` here would put a
 * SECOND copy of the same message on screen beside the component's own.
 *
 * That is why every callback below is `mutateAsync` followed by an AWAITED
 * invalidation. The await is not tidiness - it is the contract. Resolving before
 * the refetch lands drops the pending copy while the real one is still in
 * flight, and the message the user just wrote blinks out of the thread.
 *
 * ## What throws, and what that buys
 *
 * All three re-throw. The component reads a rejection as "leave it on screen":
 * a failed post keeps its words with a Retry beside it, and a failed edit leaves
 * the editor open with the text still in it. Swallowing the error would close
 * the editor over an edit that never saved. The toast is the explanation; the
 * throw is what stops the words being thrown away.
 */
export function useRequestCommentMutations(requestId: string) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const create = useMutation(trpc.comment.create.mutationOptions());
	const update = useMutation(trpc.comment.update.mutationOptions());
	const remove = useMutation(trpc.comment.delete.mutationOptions());

	/** This thread only. Another request's conversation has not changed. */
	const invalidateThread = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: trpc.comment.list.queryKey({ requestId }) });
	}, [queryClient, requestId, trpc]);

	/**
	 * Post one message.
	 *
	 * The cap is checked here BEFORE the round trip, against the same schema the
	 * router parses with. It is not a second rule - it is the same rule arriving
	 * while the words are still on screen, rather than as a `BAD_REQUEST` from a
	 * server that has already refused them.
	 */
	const addComment = useCallback(
		async (body: string) => {
			const parsed = commentMessageSchema.safeParse(body);

			if (!parsed.success) {
				AppToast.error("That comment was not posted.", {
					description: parsed.error.issues[0]?.message,
					icon: CircleAlert,
				});

				throw new Error(parsed.error.issues[0]?.message ?? "Invalid comment");
			}

			try {
				await create.mutateAsync({ message: parsed.data, requestId });
			} catch (error) {
				AppToast.error("That comment was not posted.", {
					description: reason(error, "Your message is still here — press Retry to send it again."),
					icon: CircleAlert,
				});

				throw error;
			}

			await invalidateThread();
		},
		[create, invalidateThread, requestId],
	);

	const editComment = useCallback(
		async (id: string, body: string) => {
			const parsed = commentMessageSchema.safeParse(body);

			if (!parsed.success) {
				AppToast.error("That edit was not saved.", {
					description: parsed.error.issues[0]?.message,
					icon: CircleAlert,
				});

				throw new Error(parsed.error.issues[0]?.message ?? "Invalid comment");
			}

			try {
				await update.mutateAsync({ id, message: parsed.data });
			} catch (error) {
				AppToast.error("That edit was not saved.", {
					description: reason(error, "Your changes are still in the box — try again."),
					icon: CircleAlert,
				});

				throw error;
			}

			await invalidateThread();
		},
		[invalidateThread, update],
	);

	const deleteComment = useCallback(
		async (id: string) => {
			try {
				await remove.mutateAsync({ id });
			} catch (error) {
				AppToast.error("That comment was not deleted.", {
					description: reason(error, "It is still in the thread — try again."),
					icon: CircleAlert,
				});

				throw error;
			}

			await invalidateThread();
		},
		[invalidateThread, remove],
	);

	return { addComment, deleteComment, editComment };
}
