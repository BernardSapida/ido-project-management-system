import type { CommentItem, CommentPerson } from "@bernardsapida/web-ui";
import { AppCommentSection, AppQueryError } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { Lock } from "lucide-react";
import { getRoleLabel } from "@/config/navigation.config";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRequestCommentMutations } from "@/features/request-comments/hooks/use-comment-mutations";
import { useRequestComments } from "@/features/request-comments/hooks/use-comment-queries";
import type { UserRole } from "@/utils/config";

interface CommentAuthor {
	firstname: string | null;
	id: string;
	lastname: string | null;
	role: string;
}

interface RequestCommentThreadProps {
	/**
	 * A reason the CALLER wants the composer closed, over and above the
	 * `ADD_COMMENT` grant. Nothing passes one today; the review pages (specs
	 * 010-014) are where a page-level reason would come from.
	 */
	disabledReason?: string;
	isDisabled?: boolean;
	requestId: string;
}

/**
 * The conversation on one request.
 *
 * It is the ONLY channel this system has. There is no email, so a reviewer who
 * needs a clarification either returns the request - which sends it all the way
 * back to the requestor - or asks here. That is why it is mounted on every page
 * that shows a request rather than only on the detail page, and why it is the
 * same component with the same props on all of them: a question asked on the
 * review page has to be the one answered on the edit page.
 *
 * ## What it does NOT wire, and why that is the whole design
 *
 * `mentionables` and `onReact` are left unset. `RequestComment` has no
 * `parentId` and there is no reaction table, so a Like here would be a press
 * that goes nowhere and a mention would resolve against a directory query that
 * does not exist. `AppCommentSection` renders neither control when the props are
 * absent - which is the point of leaving them absent rather than passing a
 * no-op.
 *
 * ## The read rule is not enforced here
 *
 * `comment.list` refuses before a single message body comes back, using the same
 * helper `request.getById` uses. Whatever this component renders, it renders for
 * somebody the server has already decided may read the request.
 */
export function RequestCommentThread({ disabledReason, isDisabled = false, requestId }: RequestCommentThreadProps) {
	const { user } = useAuth();
	const { data, error, isError, isPending, refetch } = useRequestComments(requestId);
	const { addComment, deleteComment, editComment } = useRequestCommentMutations(requestId);

	/*
	 * The thread's own error, not the page's. A request whose detail loaded fine
	 * but whose conversation did not is a partial failure, and replacing the whole
	 * page over it would take away the form the reader came for. `AppQueryError`
	 * tells FORBIDDEN and NOT_FOUND apart, which matters here for the same reason
	 * it does on the request: only one of them is worth pressing Retry over.
	 */
	if (isError) {
		return (
			<AppQueryError
				data-cy="request-comments-error"
				error={error}
				onRetry={() => void refetch()}
			/>
		);
	}

	const comments = data?.comments ?? [];

	/*
	 * Signed out is not a real state on these pages - `_authenticated` gates all
	 * of them - but `useAuth` is pending for a beat on first paint, and
	 * `currentUser` is required. A placeholder with an empty id matches no
	 * author, so nothing is offered an Edit control it should not have.
	 */
	const currentUser: CommentPerson = {
		handle: user ? getRoleLabel(user.role as UserRole) : "",
		id: user?.id ?? "",
		name: user ? fullName(user.firstname, user.lastname) : "",
	};

	/*
	 * The grant decides the composer, and the server decides the grant. A revoked
	 * `ADD_COMMENT` leaves the thread READABLE - being unable to add to a
	 * conversation is not the same as being shut out of it - so the box is
	 * replaced by a line saying why, rather than removed. A composer that simply
	 * vanished would read as a bug in the page.
	 */
	const canComment = (data?.canComment ?? false) && !isDisabled;
	const closedReason = isDisabled
		? (disabledReason ?? "Commenting is closed on this request.")
		: "You no longer have permission to comment. An administrator can restore it.";

	return (
		/*
		 * The panel is HERE rather than at each mount site. Seven pages show this
		 * thread, and it has to be the same object on all of them - a conversation
		 * that is a bordered card on the detail page and a bare column on the
		 * review page reads as two different things to the two people using it.
		 */
		<div className="flex flex-col gap-2 rounded-3xl border border-border bg-surface p-4 sm:p-5">
			<AppCommentSection
				comments={comments.map(toCommentItem)}
				composerSlot={canComment ? undefined : <ClosedComposer reason={closedReason} />}
				currentUser={currentUser}
				data-cy="request-comments"
				heading="Discussion"
				isLoading={isPending}
				onDelete={deleteComment}
				onEdit={editComment}
				onSubmit={({ body }) => addComment(body)}
				// Per request, so two threads never share a saved draft - a
				// half-written question about one request must not surface on another.
				threadId={`request-${requestId}`}
			/>

			{/* Part of the empty state, and only of it. An empty thread is the one
			    moment somebody needs to be told who will read what they write; on a
			    thread that already has four messages the same line is a fact they
			    worked out from the four messages. */}
			{!isPending && comments.length === 0 ? (
				<Typography
					color="muted"
					data-cy="request-comments-visibility"
					type="body-sm"
				>
					Visible to you and everyone processing this request.
				</Typography>
			) : null}
		</div>
	);
}

/**
 * What stands where the composer would be when the caller may not write.
 *
 * `composerSlot` REPLACES the built-in box rather than disabling it, which is
 * the right shape here: there is nothing to type into, so a greyed-out textarea
 * would only invite somebody to try. The reason is stated, because "the box is
 * gone" is not a message.
 */
function ClosedComposer({ reason }: { reason: string }) {
	return (
		<div
			className="flex items-center gap-2 rounded-3xl border border-dashed border-border px-4 py-3"
			data-cy="request-comments-closed"
		>
			<Lock
				aria-hidden="true"
				className="size-4 shrink-0 text-muted"
			/>
			<Typography
				color="muted"
				type="body-sm"
			>
				{reason}
			</Typography>
		</div>
	);
}

/**
 * A row from `comment.list` as the thread reads it.
 *
 * `handle` carries the ROLE LABEL rather than a username. This app has no
 * handles - people sign in with an email - and the fact a reader actually needs
 * beside a name is which desk it belongs to: "Carlos Santos" means nothing to a
 * requestor and "IDO Chairperson" tells them who is asking.
 *
 * `editedAt` is set only when the row has genuinely moved. Prisma writes
 * `updatedAt` on create as well as on update, so passing it unconditionally
 * would put an "edited" marker on every comment in the thread the moment it was
 * posted.
 */
function toCommentItem(row: {
	createdAt: Date;
	id: string;
	message: string;
	updatedAt: Date;
	user: CommentAuthor;
}): CommentItem {
	const wasEdited = row.updatedAt.getTime() - row.createdAt.getTime() > 1000;

	return {
		author: {
			handle: getRoleLabel(row.user.role as UserRole),
			id: row.user.id,
			name: fullName(row.user.firstname, row.user.lastname),
		},
		body: row.message,
		createdAt: row.createdAt,
		editedAt: wasEdited ? row.updatedAt : undefined,
		id: row.id,
	};
}

/**
 * From `firstname`/`lastname` rather than from `name`, for the reason
 * `request.create` builds `requestedBy` the same way: those two are the fields
 * the record is laid out for, and `name` is a display string a user can put
 * anything into.
 */
function fullName(firstname: string | null, lastname: string | null): string {
	return `${firstname ?? ""} ${lastname ?? ""}`.trim() || "Unknown user";
}
