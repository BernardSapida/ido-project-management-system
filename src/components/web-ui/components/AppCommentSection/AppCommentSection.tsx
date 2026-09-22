import { formatAbsolute, formatRelative, formatUtcDate, toDate, useTickingClock } from "../../internal";
import { Button, InputGroup, Popover, Skeleton } from "@heroui/react";
import {
	ArrowDown,
	AtSign,
	CornerUpLeft,
	Mail,
	MoreHorizontal,
	Pencil,
	RotateCcw,
	Send,
	ThumbsDown,
	ThumbsUp,
	Trash2,
	UserRound,
} from "lucide-react";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AppAvatar } from "../AppAvatar";
import { AppButton } from "../AppButton";
import { AppChip } from "../AppChip";
import { AppDialog } from "../AppDialog";
import { AppDropdown } from "../AppDropdown";
import { AppToggleButton } from "../AppToggleButton";
import { cn } from "../../lib/cn";

/**
 * Somebody who can write a comment, be mentioned in one, or both.
 *
 * `email` is deliberately optional and deliberately never printed on a comment
 * line - see `AuthorName`. It is the hovercard's payload.
 */
export interface CommentPerson {
	avatarSrc?: string;
	/** The hovercard's second line. NOT printed on the comment itself. */
	email?: string;
	/** What the @ menu filters on beside the name. Without the "@". */
	handle: string;
	id: string;
	name: string;
	/**
	 * What this person IS in this conversation - "IDO Chairperson", "Support",
	 * "Moderator", "Author". Printed ON the line, beside the name.
	 *
	 * It is the one fact about an author that changes how their words are read,
	 * which is why it is here and not in the popover with the handle and the
	 * email. On a request being reviewed by four desks, "Carlos Santos" tells a
	 * requestor nothing and "IDO Chairperson" tells them everything - and a fact
	 * they have to press a name to discover is a fact most readers never see.
	 *
	 * Quiet, deliberately: muted, small, and not a chip. Forty comments carry
	 * forty of these, and a badge on every row would outrank the "You" marker
	 * that has to stay findable. Omit it in a thread where everybody is the same
	 * kind of person - a title nobody varies is noise on every line.
	 */
	title?: string;
}

/**
 * The one reaction a person is allowed to hold on a comment. They are exclusive
 * - liking a comment you had disliked moves the vote rather than casting a
 * second one - which is why this is one field and not two booleans.
 */
export type CommentReaction = "dislike" | "like";

export interface CommentItem {
	author: CommentPerson;
	/**
	 * Plain text, exactly as it was typed. URLs in it are linked and mentions
	 * that resolve to a known person are linked; everything else renders as
	 * text. This field is never treated as markup.
	 */
	body: string;
	createdAt: Date | string;
	/** EVERYONE's, the current user's own included. Absent is zero. */
	dislikeCount?: number;
	/** Set on an edit. `createdAt` keeps the ORIGINAL instant either way. */
	editedAt?: Date | string;
	id: string;
	/**
	 * Deleted, but with replies hanging off it. The node stays as a tombstone -
	 * removing it leaves the answers underneath talking to nobody.
	 */
	isDeleted?: boolean;
	/** See `dislikeCount`. */
	likeCount?: number;
	/**
	 * What the CURRENT USER has already voted, if anything. It is counted inside
	 * `likeCount`/`dislikeCount` like anybody else's - the component subtracts it
	 * before applying its own optimistic one, so a press never double-counts.
	 */
	myReaction?: CommentReaction;
	/**
	 * The comment this answers. One level: a parent that is itself a reply is
	 * flattened onto ITS parent, so nothing ever renders at depth 2.
	 */
	parentId?: string;
}

interface AppCommentSectionProps {
	/**
	 * Whether one comment may answer another. On by default.
	 *
	 * Turn it OFF where the data has nowhere to put the answer. A thread whose
	 * rows have no parent column would take a reply, drop the `parentId` on the
	 * floor and post it at the bottom as an ordinary comment - so the reader
	 * pressed Reply, watched their answer land somewhere else, and learned not to
	 * trust the control. A flat thread is a fine thing to be; a broken reply is
	 * not.
	 *
	 * It is a flag rather than the absent-callback idiom `onReact` uses because
	 * there is no separate callback to leave out: a reply arrives through
	 * `onSubmit` with a `parentId` beside it.
	 */
	allowsReplies?: boolean;
	className?: string;
	"data-cy"?: string;
	/** Oldest first. The component never re-sorts - see the note below. */
	comments: CommentItem[];
	/**
	 * Replaces this component's own composer.
	 *
	 * The built-in one writes as `currentUser`, which is the right shape when
	 * there IS one. A guest has no id, no handle and no avatar, and needs to give
	 * a name and an email before anything can be posted - none of which the
	 * composer has a place for. Rather than growing an identity form inside a
	 * component that is about a thread, the caller passes its own.
	 *
	 * The same reason AppBlogPost takes comments as a slot: the thing that needs
	 * a session stays with the code that has one.
	 */
	composerSlot?: ReactNode;
	/** Who is writing. Their own comments are the ones that get Edit and Delete. */
	currentUser: CommentPerson;
	/** How many are still above the first one shown. Drives the "Show N earlier" row with `onLoadEarlier`. */
	earlierCount?: number;
	/** The section's own heading, and the list's accessible name. */
	heading?: string;
	/** A thread sits under an `h1` on one screen and inside an `h2` section on another. */
	headingLevel?: 2 | 3 | 4;
	isLoading?: boolean;
	isLoadingEarlier?: boolean;
	/**
	 * The longest comment this thread accepts, in characters. Unlimited when
	 * omitted.
	 *
	 * The count appears only as the cap comes into range - a number counting down
	 * from 2000 under an empty box is a budget nobody asked for, and it makes a
	 * comment feel like a form field. Past the cap it turns danger-toned and
	 * Submit refuses.
	 *
	 * What it deliberately does NOT do is stop the typing. The textarea takes no
	 * `maxLength` attribute, because that one silently truncates a paste: somebody
	 * pastes four paragraphs, the browser keeps two and a half, and the half that
	 * went missing is invisible until after it was posted. Losing words is the one
	 * thing this component is built not to do, so the overflow stays on screen,
	 * counted, and refused at the button - where it can be edited down instead.
	 *
	 * It applies to edits as well as to new comments: a cap that a rewrite can
	 * step over is not a cap the server can rely on.
	 */
	maxLength?: number;
	/** Everyone the @ menu may resolve. Thread participants are ranked above the rest. */
	mentionables?: CommentPerson[];
	onDelete?: (commentId: string) => Promise<void> | void;
	onEdit?: (commentId: string, body: string) => Promise<void> | void;
	onLoadEarlier?: () => void;
	/**
	 * Records the current user's vote, or clears it with `null`. Omit it and the
	 * two buttons do not render at all - a Like nobody is listening to is worse
	 * than no Like.
	 *
	 * Unlike `onSubmit` this does NOT have to resolve before `comments` updates:
	 * the button flips on the press and the count moves with it, because nobody
	 * waits 300ms to find out whether their own thumb landed. A rejection rolls
	 * both back to what they were, and that is the whole of the contract - there
	 * is nothing to lose here, which is what separates a vote from a paragraph.
	 */
	onReact?: (commentId: string, reaction: CommentReaction | null) => Promise<void> | void;
	/**
	 * Posts one comment.
	 *
	 * It MUST NOT resolve until the comment is in `comments`. Until it does, the
	 * thread is showing a pending copy of it, and dropping that copy before the
	 * real one lands is a comment that blinks out of the thread it was just
	 * written into. Reject to leave it in place, dimmed, with the text intact
	 * and a Retry beside it.
	 */
	onSubmit: (draft: { body: string; parentId?: string }) => Promise<void> | void;
	/** Keys the saved drafts. Two threads on one screen must not share a box. */
	threadId: string;
}

/**
 * A comment thread: the conversation, and the box to add to it.
 *
 * Who uses it: everyone, and mostly to READ. A thread is opened forty times for
 * every time it is written into, which is why the composer is one box at the
 * bottom rather than the thing the layout is built around, and why nothing is
 * ever autofocused on arrival - on a phone that throws the keyboard up over the
 * conversation the user came to read.
 *
 * Worst mistake available here: losing a paragraph somebody wrote. Not posting
 * to the wrong thread, not deleting the wrong comment - those are recoverable
 * and rare. Text vanishing is neither. So the composer keeps a draft per thread
 * that survives navigating away, a failed post stays on screen with its words
 * rather than becoming a toast, and an edit that fails leaves the editor open.
 *
 * Order is fixed, not configurable: oldest at the top, newest nearest the box
 * you type in. Newest-first is for an activity feed nobody replies to, which is
 * `AppTimeline`. What the component does NOT do is sort - the caller passes the
 * thread in reading order and a component that re-sorts can only disagree with
 * it, which is the same rule the timeline settled.
 */
export function AppCommentSection({
	allowsReplies = true,
	className,
	"data-cy": dataCy,
	comments,
	composerSlot,
	currentUser,
	earlierCount = 0,
	heading = "Comments",
	headingLevel = 2,
	isLoading = false,
	isLoadingEarlier = false,
	maxLength,
	mentionables = [],
	onDelete,
	onEdit,
	onLoadEarlier,
	onReact,
	onSubmit,
	threadId,
}: AppCommentSectionProps) {
	const now = useTickingClock();
	const headingId = useId();
	const listRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	const { discard, pending, post, retry } = usePendingComments(onSubmit);
	const { react, reactionsOf } = useReactions(onReact);
	const { count: newCount, jumpToNewest } = useNewArrivals(comments, bottomRef);
	const loadEarlier = useHeldScroll(listRef, comments.length, onLoadEarlier);

	/** Everyone who has spoken here. They rank first in the @ menu. */
	const participants = useMemo(
		() =>
			uniqueBy(
				comments.map((comment) => comment.author),
				(person) => person.id,
			),
		[comments],
	);
	const directory = useMemo(
		() => uniqueBy([...participants, ...mentionables, currentUser], (person) => person.id),
		[participants, mentionables, currentUser],
	);
	/**
	 * The names that need their email printed beside them - the one case the
	 * address is allowed on the line, and the case the rule exists to solve.
	 */
	const ambiguousNames = useMemo(() => duplicateNames(participants), [participants]);

	const thread = useMemo(() => buildThread(comments, pending, currentUser), [comments, pending, currentUser]);
	const total = comments.length + pending.length;

	const Heading = HEADINGS[headingLevel];

	return (
		<section
			aria-labelledby={headingId}
			className={cn("relative flex flex-col gap-4", className)}
			data-cy={dataCy}
		>
			<div className="flex items-baseline gap-2">
				<Heading
					className="font-semibold"
					id={headingId}
				>
					{heading}
				</Heading>
				{!isLoading && total > 0 ? <span className="text-sm text-muted tabular-nums">{total}</span> : null}
			</div>

			{isLoading ? (
				<ThreadSkeleton label={heading} />
			) : (
				<>
					{onLoadEarlier && earlierCount > 0 ? (
						<div>
							{/*
							 * Upward, and only ever on request. A thread that auto-loads its
							 * history as you scroll up moves the page under the reader for
							 * as long as there is history left.
							 */}
							<AppButton
								isDisabled={isLoadingEarlier}
								isPending={isLoadingEarlier}
								onPress={loadEarlier}
								size="sm"
								variant="secondary"
							>
								{isLoadingEarlier ? "Loading…" : `Show ${earlierCount} earlier ${plural(earlierCount, "comment")}`}
							</AppButton>
						</div>
					) : null}

					<div ref={listRef}>
						{thread.length === 0 ? (
							/*
							 * Empty is a sentence and a composer, never a bare box. The
							 * composer below is part of this state, which is why the empty
							 * copy sits inside the list rather than replacing the section.
							 */
							<p className="rounded-3xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
								No comments yet. Start the conversation below.
							</p>
						) : (
							<ul
								aria-labelledby={headingId}
								className="space-y-4"
							>
								{thread.map((node) => (
									<li key={node.comment.id}>
										<CommentNode
											allowsReplies={allowsReplies}
											ambiguousNames={ambiguousNames}
											currentUser={currentUser}
											directory={directory}
											maxLength={maxLength}
											node={node}
											now={now}
											onDelete={onDelete}
											onDiscard={discard}
											onEdit={onEdit}
											onReact={onReact ? react : undefined}
											onReply={post}
											onRetry={retry}
											reactionsOf={reactionsOf}
											threadId={threadId}
										/>
									</li>
								))}
							</ul>
						)}
					</div>

					{/* The sentinel "is the newest comment on screen" is measured against. */}
					<div ref={bottomRef} />

					{/*
					 * Arrivals are announced rather than pointed at. They land BELOW what
					 * is being read, so nothing has to be held back - but a thread being
					 * read from the top has no way of knowing three more turned up at the
					 * bottom, and a screen reader has no way at all.
					 */}
					<p
						aria-live="polite"
						className="sr-only"
					>
						{newCount > 0 ? `${newCount} new ${plural(newCount, "comment")}` : ""}
					</p>
					{newCount > 0 ? (
						<NewCommentsPill
							count={newCount}
							onPress={jumpToNewest}
						/>
					) : null}

					{/* The caller's composer wins. It is how a guest - who has no
					    currentUser to write as - gets somewhere to give a name and an
					    email before posting. */}
					{composerSlot ?? (
						<Composer
							author={currentUser}
							directory={directory}
							draftKey={draftKey(threadId)}
							label="Write a comment"
							maxLength={maxLength}
							onSubmit={(body) => post(body)}
							participantIds={participants.map((person) => person.id)}
							placeholder="Add a comment…"
							submitLabel="Comment"
						/>
					)}
				</>
			)}
		</section>
	);
}

const HEADINGS = { 2: "h2", 3: "h3", 4: "h4" } as const;

/* -------------------------------------------------------------------------- */
/* The thread                                                                  */
/* -------------------------------------------------------------------------- */

/** A comment as the component sees it: the data plus its optimistic state. */
interface ThreadComment extends CommentItem {
	/** Absent once the server has it. `failed` keeps the text and offers Retry. */
	pendingState?: "failed" | "sending";
}

interface ThreadNode {
	comment: ThreadComment;
	replies: ThreadComment[];
}

/**
 * Flattens everything to at most one level of nesting and slots the optimistic
 * entries into the bucket they were written into.
 *
 * A reply to a reply is re-parented onto the top-level comment rather than
 * dropped or indented again: a second indent is unreadable on a phone and a
 * third is unreachable, and the "@name" the reply carries already says who it
 * answers.
 */
function buildThread(comments: CommentItem[], pending: PendingComment[], author: CommentPerson): ThreadNode[] {
	const byId = new Map(comments.map((comment) => [comment.id, comment]));
	const rootIdOf = (comment: CommentItem): string => {
		if (!comment.parentId) return comment.id;
		const parent = byId.get(comment.parentId);
		// One hop only. A parent that is itself a reply resolves to ITS parent.
		return parent?.parentId ?? comment.parentId;
	};

	const nodes: ThreadNode[] = [];
	const index = new Map<string, ThreadNode>();

	for (const comment of comments) {
		if (!comment.parentId) {
			const node: ThreadNode = { comment, replies: [] };
			nodes.push(node);
			index.set(comment.id, node);
		}
	}

	for (const comment of comments) {
		if (!comment.parentId) continue;
		index.get(rootIdOf(comment))?.replies.push(comment);
	}

	for (const entry of pending) {
		const comment: ThreadComment = {
			author,
			body: entry.body,
			createdAt: entry.createdAt,
			id: entry.id,
			parentId: entry.parentId,
			pendingState: entry.state,
		};
		const parent = entry.parentId ? index.get(rootIdOf(comment)) : undefined;
		if (parent) parent.replies.push(comment);
		else nodes.push({ comment, replies: [] });
	}

	return nodes;
}

interface CommentNodeProps {
	allowsReplies: boolean;
	/** Lower-cased names carried by two different people in this thread. */
	ambiguousNames: Set<string>;
	currentUser: CommentPerson;
	directory: CommentPerson[];
	maxLength?: number;
	node: ThreadNode;
	now: Date | null;
	onDelete?: (commentId: string) => Promise<void> | void;
	onDiscard: (pendingId: string) => void;
	onEdit?: (commentId: string, body: string) => Promise<void> | void;
	onReact?: (comment: ThreadComment, reaction: CommentReaction) => void;
	onReply: (body: string, parentId: string) => void;
	onRetry: (pendingId: string) => void;
	reactionsOf: (comment: ThreadComment) => Reactions;
	threadId: string;
}

/** A top-level comment, its replies, and the inline composer under them. */
function CommentNode({
	allowsReplies,
	ambiguousNames,
	currentUser,
	directory,
	maxLength,
	node,
	now,
	onDelete,
	onDiscard,
	onEdit,
	onReact,
	onReply,
	onRetry,
	reactionsOf,
	threadId,
}: CommentNodeProps) {
	const [replyingTo, setReplyingTo] = useState<CommentPerson | null>(null);

	const openReply = (person: CommentPerson) => setReplyingTo(person);

	return (
		<div>
			<CommentRow
				ambiguousNames={ambiguousNames}
				comment={node.comment}
				currentUser={currentUser}
				directory={directory}
				maxLength={maxLength}
				now={now}
				onDelete={onDelete}
				onDiscard={onDiscard}
				onEdit={onEdit}
				onReact={onReact}
				onReply={allowsReplies ? () => openReply(node.comment.author) : undefined}
				onRetry={onRetry}
				reactions={reactionsOf(node.comment)}
			/>

			{node.replies.length > 0 ? (
				/*
				 * Depth 1 and no further. The rail is a hairline rather than an indent
				 * alone, so on a phone - where the indent has to be small enough to
				 * leave room for the text - it is still obvious which comment these
				 * belong to.
				 */
				<ul className="mt-3 space-y-3 border-l border-border pl-3 sm:ml-5 sm:pl-4">
					{node.replies.map((reply) => (
						<li key={reply.id}>
							<CommentRow
								ambiguousNames={ambiguousNames}
								comment={reply}
								currentUser={currentUser}
								directory={directory}
								isReply
								maxLength={maxLength}
								now={now}
								onDelete={onDelete}
								onDiscard={onDiscard}
								onEdit={onEdit}
								onReact={onReact}
								onReply={allowsReplies ? () => openReply(reply.author) : undefined}
								onRetry={onRetry}
								reactions={reactionsOf(reply)}
							/>
						</li>
					))}
				</ul>
			) : null}

			{replyingTo ? (
				<div className="mt-3 border-l border-border pl-3 sm:ml-5 sm:pl-4">
					<Composer
						author={currentUser}
						/*
						 * Focused, unlike the thread composer. This one was opened by a
						 * press, so the user has already asked for the caret - and the
						 * mention is prefilled, so it has to land AFTER it.
						 */
						autoFocus
						directory={directory}
						draftKey={draftKey(threadId, node.comment.id)}
						/*
						 * Only when answering someone else. Prefixing a reply to yourself
						 * with your own name is noise.
						 */
						initialValue={replyingTo.id === currentUser.id ? "" : `@${replyingTo.name} `}
						label={`Reply to ${replyingTo.name}`}
						maxLength={maxLength}
						onCancel={() => setReplyingTo(null)}
						onSubmit={(body) => {
							onReply(body, node.comment.id);
							setReplyingTo(null);
						}}
						participantIds={[node.comment.author.id, ...node.replies.map((reply) => reply.author.id)]}
						placeholder="Write a reply…"
						submitLabel="Reply"
					/>
				</div>
			) : null}
		</div>
	);
}

interface CommentRowProps {
	ambiguousNames: Set<string>;
	comment: ThreadComment;
	currentUser: CommentPerson;
	directory: CommentPerson[];
	isReply?: boolean;
	maxLength?: number;
	now: Date | null;
	onDelete?: (commentId: string) => Promise<void> | void;
	onDiscard: (pendingId: string) => void;
	onEdit?: (commentId: string, body: string) => Promise<void> | void;
	onReact?: (comment: ThreadComment, reaction: CommentReaction) => void;
	/** Absent where the thread is flat - see `allowsReplies`. */
	onReply?: () => void;
	onRetry: (pendingId: string) => void;
	reactions: Reactions;
}

/** One comment: who, when, what, and what can be done about it. */
function CommentRow({
	ambiguousNames,
	comment,
	currentUser,
	directory,
	isReply = false,
	maxLength,
	now,
	onDelete,
	onDiscard,
	onEdit,
	onReact,
	onReply,
	onRetry,
	reactions,
}: CommentRowProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

	const created = toDate(comment.createdAt);
	const isMine = comment.author.id === currentUser.id;
	const isPending = comment.pendingState !== undefined;
	const canEdit = Boolean(onEdit) && isMine && !isPending && !comment.isDeleted;
	const canDelete = Boolean(onDelete) && isMine && !isPending && !comment.isDeleted;

	const when = now ? formatRelative(created, now) : formatUtcDate(created);
	/*
	 * The article's name carries the author and the time, because forty unnamed
	 * articles give a screen reader forty identical landmarks to walk past - and
	 * it says which one is YOURS, since a reader who cannot see the marker beside
	 * the name has nothing else to go on.
	 */
	const author = isMine ? `${comment.author.name}, you` : comment.author.name;
	const label = `Comment by ${author}${comment.author.title ? `, ${comment.author.title}` : ""}, ${when}`;

	if (comment.isDeleted) {
		return <Tombstone />;
	}

	return (
		<article
			aria-label={label}
			className={cn(
				"flex gap-3",
				// Dimmed while it is in flight, and its actions withheld: there is
				// nothing to reply to or edit until the server has agreed it exists.
				comment.pendingState === "sending" && "opacity-60",
			)}
			/* The optimistic state as DATA. "sending" and "failed" are the two
			   states this component exists to get right, and neither is legible
			   from the DOM otherwise - one is an opacity class and the other is
			   the presence of a Retry button. */
			data-pending-state={comment.pendingState ?? "sent"}
		>
			<AuthorAvatar
				isSmall={isReply}
				person={comment.author}
			/>

			<div className="min-w-0 flex-1">
				{/*
				 * The menu rides the TOP-RIGHT of the comment, not the action row -
				 * the arrangement every thread people already use has settled on. Two
				 * reasons, and neither is fashion: it is the only element here that
				 * acts on the comment as an object rather than on the conversation, so
				 * sitting among Like and Reply mixes two kinds of verb; and an
				 * overflow menu pinned to a corner is a fixed target, while one
				 * trailing "Like 12 · Dislike · Reply" moves horizontally with the
				 * counts beside it and lands under a thumb aiming at Reply.
				 */}
				<div className="flex items-center gap-2">
					<div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
						<AuthorName
							person={comment.author}
							showEmail={ambiguousNames.has(comment.author.name.toLowerCase())}
						/>
						{/*
						 * Which one is YOURS, said in a word rather than left to be worked
						 * out from the name. In a thread of five people the reader knows
						 * their own name; in a thread of forty, on a phone, six hours
						 * later, they are scanning for the comment they have to go back
						 * and edit - and "which of these did I write" is the question the
						 * avatar cannot answer, because it is the same face they have
						 * never seen from the outside.
						 *
						 * It is a marker, not a status: quiet enough that it does not
						 * outrank the name it sits beside, and beside the name rather than
						 * in the action row because it is part of the attribution.
						 */}
						{isMine ? (
							<AppChip
								icon={UserRound}
								label="You"
								size="sm"
								tone="accent"
							/>
						) : null}
						<CommentTime
							comment={comment}
							created={created}
							now={now}
						/>
					</div>

					{!isEditing && (canEdit || canDelete) ? (
						<CommentMenu
							canDelete={canDelete}
							canEdit={canEdit}
							onDelete={() => setIsConfirmingDelete(true)}
							onEdit={() => setIsEditing(true)}
							when={when}
						/>
					) : null}
				</div>

				{isEditing ? (
					<div className="mt-2">
						<Composer
							author={currentUser}
							autoFocus
							directory={directory}
							initialValue={comment.body}
							label="Edit your comment"
							maxLength={maxLength}
							onCancel={() => setIsEditing(false)}
							/*
							 * Awaited, and the editor only closes once it has landed. An
							 * edit that fails with the box already gone is the paragraph
							 * this component exists not to lose.
							 */
							onSubmit={async (body) => {
								await onEdit?.(comment.id, body);
								setIsEditing(false);
							}}
							participantIds={[]}
							showAvatar={false}
							submitLabel="Save"
						/>
					</div>
				) : (
					<CommentBody
						body={comment.body}
						directory={directory}
					/>
				)}

				{comment.pendingState === "failed" ? (
					<FailedNotice
						onDiscard={() => onDiscard(comment.id)}
						onRetry={() => onRetry(comment.id)}
					/>
				) : null}

				{/* Nothing to render when the thread has neither votes nor replies -
				    an empty action row is 6px of margin under every comment saying
				    there is nothing to do, which there already was. */}
				{!isEditing && !isPending && (onReact || onReply) ? (
					<CommentActions
						onReact={onReact ? (reaction) => onReact(comment, reaction) : undefined}
						onReply={onReply}
						reactions={reactions}
					/>
				) : null}
			</div>

			{/*
			 * Mounted only while it is being asked. A thread is forty of these, and
			 * forty dormant modals is forty portals nobody opened.
			 */}
			{isConfirmingDelete ? (
				<AppDialog
					cancelLabel="Keep it"
					confirmLabel="Delete"
					description="This removes the comment for everyone. If anyone has replied to it, a placeholder stays behind so their replies still make sense."
					icon={Trash2}
					isOpen
					onClose={() => setIsConfirmingDelete(false)}
					onConfirm={() => onDelete?.(comment.id)}
					pendingLabel="Deleting…"
					title="Delete this comment?"
					tone="danger"
				/>
			) : null}
		</article>
	);
}

/**
 * What is left when a comment with replies is deleted. The node stays, because
 * the answers underneath it stop making sense without something to answer.
 */
function Tombstone() {
	return (
		<p className="rounded-2xl border border-dashed border-border px-3 py-2 text-sm text-muted italic">
			Comment deleted
		</p>
	);
}

function AuthorAvatar({ isSmall, person }: { isSmall: boolean; person: CommentPerson }) {
	/*
	 * A plain avatar. It used to be wrapped in a gradient ring, matching the
	 * users list - the argument being that one person looks the same everywhere,
	 * which makes a thread scannable by face.
	 *
	 * The face already does that. In a thread of four the rings were the loudest
	 * thing on screen, four brand-coloured halos competing with the words they
	 * were introducing, and they added a second shape to keep in step with the
	 * radius scale for no gain. An avatar is an avatar.
	 */
	return (
		<AppAvatar
			className="shrink-0"
			name={person.name}
			size={isSmall ? "sm" : "md"}
			src={person.avatarSrc}
		/>
	);
}

/**
 * The name, and the identity behind it.
 *
 * The EMAIL does not print on the line. Forty comments print the same address
 * forty times, and in any thread visible outside the team that is an address
 * leak - so it lives in the card behind the name, and on the line only where
 * two people in the thread share a name, which is the case it exists to solve.
 *
 * Settled: a popover, not a hover card. Hover does not exist on a phone, and
 * "who is this person" is exactly the question a phone reader has - so the name
 * is a real press target on every pointer. That is the same conclusion
 * `AppRichTooltip` reached, for the same reason.
 */
function AuthorName({ person, showEmail }: { person: CommentPerson; showEmail: boolean }) {
	return (
		<span className="flex min-w-0 items-baseline gap-1.5">
			<Popover>
				<Popover.Trigger>
					{/*
					 * HeroUI's Button, not a bare `<button>`: React Aria's trigger
					 * wires press handling and the expanded state onto the child, and
					 * a plain DOM button receives none of it. The variant is stripped
					 * back to text - the name has to read as a name.
					 */}
					{/* The one raw Button left in this file, and deliberately: it is a
					    `Popover.Trigger` child, so react-aria injects a ref and press
					    handlers into it. AppButton owns its own onPress and forwards
					    neither, so converting this would silently stop the popover
					    opening. A trigger belongs to the component that triggers it. */}
					<Button
						className="h-auto max-w-full min-w-0 justify-start truncate p-0 text-sm font-semibold hover:underline"
						variant="ghost"
					>
						{person.name}
					</Button>
				</Popover.Trigger>
				<Popover.Content
					className="max-w-xs rounded-3xl border-0 p-0 shadow-soft"
					placement="top start"
				>
					<Popover.Arrow />
					<Popover.Dialog className="p-0">
						<div className="flex items-center gap-3 p-4">
							<AppAvatar
								name={person.name}
								size="md"
								src={person.avatarSrc}
							/>
							<div className="min-w-0">
								<p className="truncate text-sm font-semibold">{person.name}</p>
								{/* Repeated from the line on purpose. The card is what a
								    reader opens to ask "who is this", and answering with a
								    handle and an email while omitting the one thing already
								    on screen reads as a different person. */}
								{person.title ? <p className="truncate text-xs text-muted">{person.title}</p> : null}
								<p className="flex items-center gap-1 truncate text-xs text-muted">
									<AtSign
										aria-hidden="true"
										className="size-3 shrink-0"
									/>
									{person.handle}
								</p>
								{person.email ? (
									<p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
										<Mail
											aria-hidden="true"
											className="size-3 shrink-0"
										/>
										{person.email}
									</p>
								) : null}
							</div>
						</div>
					</Popover.Dialog>
				</Popover.Content>
			</Popover>
			{/*
			 * The desk, not the person. It sits after the name and before the email,
			 * because in the one thread that shows both - two people sharing a name
			 * on a request under review - "IDO Chairperson" is what tells them apart
			 * and the address is only the tiebreaker.
			 *
			 * The separator is a middle dot rather than a bullet or a dash: it is the
			 * one that does not read as punctuation belonging to either side.
			 */}
			{person.title ? (
				<span className="truncate text-xs text-muted">
					<span aria-hidden="true">· </span>
					{person.title}
				</span>
			) : null}
			{showEmail && person.email ? <span className="truncate text-xs text-muted">{person.email}</span> : null}
		</span>
	);
}

/**
 * Relative in the text, absolute in the markup - and absolute in the text too
 * until the clock arrives, because the server has no "now" to be relative to.
 *
 * An edit keeps the ORIGINAL stamp and adds a marker beside it. Moving the
 * timestamp to the edit rewrites when the thread happened.
 */
function CommentTime({ comment, created, now }: { comment: ThreadComment; created: Date; now: Date | null }) {
	if (comment.pendingState === "sending") {
		return <span className="text-xs text-muted">Sending…</span>;
	}
	if (comment.pendingState === "failed") {
		return <span className="text-xs font-semibold text-danger">Not sent</span>;
	}

	const edited = comment.editedAt ? toDate(comment.editedAt) : null;

	return (
		<span className="flex items-baseline gap-1.5">
			<time
				className="text-xs text-muted tabular-nums"
				dateTime={created.toISOString()}
				title={now ? formatAbsolute(created) : undefined}
			>
				{now ? formatRelative(created, now) : formatUtcDate(created)}
			</time>
			{edited ? (
				<time
					className="text-xs text-muted"
					dateTime={edited.toISOString()}
					title={now ? `Edited ${formatAbsolute(edited)}` : undefined}
				>
					(edited)
				</time>
			) : null}
		</span>
	);
}

/**
 * What can be done to the CONVERSATION: agree with it, disagree with it, answer
 * it. Editing and deleting are not here - they act on the comment as an object
 * and live in the menu at the top right, see `CommentMenu`.
 *
 * Settled: they are always visible, on every pointer. The alternative - revealed
 * on hover for a mouse, pinned for touch - is two behaviours to keep in step for
 * a row 24px tall, and the hover half is invisible to a keyboard as well as to a
 * phone. A thread where the actions are simply there is quieter than one where
 * they appear under the cursor.
 *
 * Settled: a zero is not printed. A 0 beside every one of forty comments is
 * forty numbers that say nothing, and it makes the first real vote a change of
 * value rather than something appearing - which is the harder thing to notice.
 */
function CommentActions({
	onReact,
	onReply,
	reactions,
}: {
	onReact?: (reaction: CommentReaction) => void;
	onReply?: () => void;
	reactions: Reactions;
}) {
	return (
		<div className="mt-1.5 flex flex-wrap items-center gap-1">
			{onReact ? (
				<>
					<ReactionButton
						count={reactions.likeCount}
						icon={ThumbsUp}
						isSelected={reactions.mine === "like"}
						label="Like"
						onPress={() => onReact("like")}
					/>
					<ReactionButton
						count={reactions.dislikeCount}
						icon={ThumbsDown}
						isSelected={reactions.mine === "dislike"}
						label="Dislike"
						onPress={() => onReact("dislike")}
					/>
				</>
			) : null}

			{/* The glyph goes through `icon` rather than as a child: AppButton sizes
			    it against the button and marks it aria-hidden, so a decorative icon
			    beside a label cannot end up announced twice. */}
			{onReply ? (
				<AppButton
					icon={CornerUpLeft}
					onPress={onReply}
					size="sm"
					variant="ghost"
				>
					Reply
				</AppButton>
			) : null}
		</div>
	);
}

/**
 * One vote: the glyph, and the number beside it.
 *
 * `AppToggleButton` and not `AppButton`: this has a state that persists after
 * the press, and the pressed state has to reach a screen reader as one - which
 * `aria-pressed` does and a colour cannot. The glyph FILLS when the vote is
 * yours, so the state survives greyscale, a bad screen, and anyone who cannot
 * separate the accent from the body text.
 *
 * No visible word. A thumb is one of the few glyphs that genuinely needs no
 * label - the rule in `hierarchy.md` is that an icon may drop its text once it
 * is universally understood, and this is the canonical example - and the row is
 * quieter for it beside a Reply that does need its word. The name is still
 * there for anyone not looking at it: `aria-label` carries the verb AND the
 * count, and the visible number is hidden from the accessibility tree so it is
 * not read out twice.
 */
function ReactionButton({
	count,
	icon: Icon,
	isSelected,
	label,
	onPress,
}: {
	count: number;
	icon: typeof ThumbsUp;
	isSelected: boolean;
	label: string;
	onPress: () => void;
}) {
	return (
		<span className="flex items-center">
			<AppToggleButton
				aria-label={count > 0 ? `${label}, ${count}` : label}
				/*
				 * A vote reads as the FILLED glyph, not as a pill behind it. Forty
				 * comments each carrying two round tinted chips is a column of blue
				 * dots down the thread that outranks the words beside them, which is
				 * the decoration-over-data inversion in `hierarchy.md`.
				 *
				 * Done by retuning the component's own selected tokens rather than by
				 * overriding its background: `--toggle-button-bg-selected` is the hook
				 * the stylesheet exposes for exactly this, and going through it keeps
				 * hover and press feeling the same whether the vote is held or not -
				 * a `bg-transparent` utility would have flattened those two as well.
				 */
				className="[--toggle-button-bg-selected:transparent] [--toggle-button-bg-selected-hover:var(--default)] [--toggle-button-bg-selected-pressed:var(--default)]"
				isIconOnly
				isSelected={isSelected}
				/* The toggle is the affordance; which way it moves is this row's
				   business - pressing Like while Dislike is held moves the vote, it does
				   not cast a second one. See `useReactions`. */
				onChange={onPress}
				size="sm"
				variant="ghost"
			>
				<Icon
					aria-hidden="true"
					className={cn(isSelected && "fill-current")}
				/>
			</AppToggleButton>
			{count > 0 ? (
				<span
					aria-hidden="true"
					className="pe-1 text-xs text-muted tabular-nums"
				>
					{count}
				</span>
			) : null}
		</span>
	);
}

/**
 * Edit and Delete, on your own comments only.
 *
 * It sits at the top right of the comment rather than in the action row: those
 * are verbs aimed at the conversation and these are aimed at the comment, and a
 * corner is a target that does not move when a count beside it changes width.
 * That is the arrangement every thread the reader has already used - Facebook's
 * among them - and matching it costs nothing.
 */
function CommentMenu({
	canDelete,
	canEdit,
	onDelete,
	onEdit,
	when,
}: {
	canDelete: boolean;
	canEdit: boolean;
	onDelete: () => void;
	onEdit: () => void;
	/** The comment's own timestamp, which is what tells forty of these apart. */
	when: string;
}) {
	return (
		<AppDropdown
			className="shrink-0"
			label="Comment actions"
			sections={[
				{
					items: [
						...(canEdit ? [{ icon: Pencil, key: "edit", label: "Edit", onAction: onEdit }] : []),
						...(canDelete
							? [{ icon: Trash2, isDestructive: true, key: "delete", label: "Delete", onAction: onDelete }]
							: []),
					],
					key: "comment",
				},
			]}
			trigger={
				/*
				 * Icon-only, so it carries a name of its own - and the name carries the
				 * timestamp. The menu only ever appears on the reader's OWN comments,
				 * so "your comment" alone would be the same name forty times over.
				 */
				<AppButton
					aria-label={`More actions for your comment from ${when}`}
					className="shrink-0"
					icon={MoreHorizontal}
					isIconOnly
					size="sm"
					variant="ghost"
				/>
			}
		/>
	);
}

/**
 * A post that did not land. The words are still on screen and one press away
 * from being sent again - a toast that says "failed" while the text is gone is
 * the worst outcome this component has.
 */
function FailedNotice({ onDiscard, onRetry }: { onDiscard: () => void; onRetry: () => void }) {
	return (
		<div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl bg-[color-mix(in_oklab,var(--danger)_8%,var(--surface))] px-3 py-2">
			<p className="min-w-0 flex-1 text-xs text-danger">This did not send. Your text is safe here.</p>
			<AppButton
				icon={RotateCcw}
				onPress={onRetry}
				size="sm"
				variant="secondary"
			>
				Retry
			</AppButton>
			<AppButton
				aria-label="Discard this unsent comment"
				icon={Trash2}
				isIconOnly
				onPress={onDiscard}
				size="sm"
				variant="ghost"
			/>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* The body                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The comment text, clamped.
 *
 * Nothing may cost a scroll before it can be skipped, so a long comment folds
 * to eight lines - but only when it is actually longer than eight. The button
 * appears from a measurement rather than a character count: the same paragraph
 * is six lines on a desktop and fourteen on a phone, so a length threshold
 * would put "Show more" under text that is entirely visible.
 */
function CommentBody({ body, directory }: { body: string; directory: CommentPerson[] }) {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const bodyId = useId();

	useEffect(() => {
		const node = textRef.current;
		if (!node) return;

		// Only meaningful while clamped: expanded, scrollHeight equals clientHeight
		// and the measurement would hide the "Show less" the user just pressed.
		const measure = () => {
			if (isOpen) return;
			setIsOverflowing(node.scrollHeight - node.clientHeight > 1);
		};

		measure();
		// Re-measured on resize, because the wrap point is what decides this and a
		// rotated phone changes it: the same paragraph is six lines on a desktop
		// and fourteen on a phone.
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	}, [isOpen, body]);

	return (
		<div className="mt-0.5">
			{/* ~8 lines. Nothing may cost a scroll before it can be skipped. */}
			<p
				className={cn("text-sm whitespace-pre-wrap wrap-break-word", !isOpen && "line-clamp-8")}
				id={bodyId}
				ref={textRef}
			>
				<CommentText
					body={body}
					directory={directory}
				/>
			</p>
			{isOverflowing ? (
				<button
					aria-controls={bodyId}
					aria-expanded={isOpen}
					className={cn(
						"mt-1 cursor-pointer rounded-lg text-xs font-semibold text-accent",
						"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
					)}
					onClick={() => setIsOpen((open) => !open)}
					type="button"
				>
					{isOpen ? "Show less" : "Show more"}
				</button>
			) : null}
		</div>
	);
}

/**
 * The body, turned into text, links and mentions - and nothing else.
 *
 * A comment is user content. It is rendered as React children, so every
 * character in it is escaped by construction; there is no `dangerouslySet`
 * anything in this file and there must never be one. URLs are linked because
 * an unclickable URL in a comment is a thing people copy by hand, and that is
 * the whole of the "markup" this field supports.
 */
function CommentText({ body, directory }: { body: string; directory: CommentPerson[] }) {
	const tokens = useMemo(() => tokenizeBody(body, directory), [body, directory]);

	return (
		<>
			{tokens.map((token, index) => {
				const key = `${index}-${token.kind}`;

				if (token.kind === "link") {
					return (
						<a
							className="font-medium text-accent underline underline-offset-2"
							href={token.href}
							key={key}
							rel="noopener noreferrer nofollow"
							target="_blank"
						>
							{token.text}
						</a>
					);
				}

				if (token.kind === "mention") {
					return (
						/*
						 * Only a RESOLVED mention is styled like one. Text that merely
						 * starts with "@" stays plain text, or the writer believes they
						 * have summoned somebody who will never arrive.
						 */
						<a
							className="rounded font-semibold text-accent"
							href={`#user-${token.person.id}`}
							key={key}
						>
							@{token.person.name}
						</a>
					);
				}

				return <span key={key}>{token.text}</span>;
			})}
		</>
	);
}

type BodyToken =
	| { href: string; kind: "link"; text: string }
	| { kind: "mention"; person: CommentPerson }
	| { kind: "text"; text: string };

/**
 * Walks the body once, lifting out URLs and mentions.
 *
 * Settled: a mention is resolved against the DIRECTORY, not against a syntax.
 * "@Aria Chen" has a space in it, so no regex can tell where the name ends -
 * only the list of people can. Matching the longest name or handle at each "@"
 * is what makes "an unresolved mention must not be styled like one" something
 * the component can actually enforce.
 */
function tokenizeBody(body: string, directory: CommentPerson[]): BodyToken[] {
	const tokens: BodyToken[] = [];
	let text = "";
	let index = 0;

	const flush = () => {
		if (text) tokens.push({ kind: "text", text });
		text = "";
	};

	while (index < body.length) {
		const atBoundary = index === 0 || /\s/.test(body[index - 1]);

		if (atBoundary && body[index] === "@") {
			const match = matchMention(body, index, directory);
			if (match) {
				flush();
				tokens.push({ kind: "mention", person: match.person });
				index += match.length + 1;
				continue;
			}
		}

		if (atBoundary && (body.startsWith("http://", index) || body.startsWith("https://", index))) {
			const raw = body.slice(index).split(/\s/)[0];
			// Trailing punctuation belongs to the sentence, not to the URL:
			// "see https://example.com." must not link the full stop.
			const href = raw.replace(/[.,!?;:'")\]]+$/, "");
			if (href.length > "https://".length) {
				flush();
				tokens.push({ href, kind: "link", text: href });
				index += href.length;
				continue;
			}
		}

		text += body[index];
		index += 1;
	}

	flush();
	return tokens;
}

/** The longest name or handle sitting immediately after an "@", if any. */
function matchMention(
	body: string,
	at: number,
	directory: CommentPerson[],
): { length: number; person: CommentPerson } | null {
	let best: { length: number; person: CommentPerson } | null = null;

	for (const person of directory) {
		for (const candidate of [person.name, person.handle]) {
			const { length } = candidate;
			if (body.slice(at + 1, at + 1 + length).toLowerCase() !== candidate.toLowerCase()) continue;
			// "@Ben" must not match inside "@Bernard": the run has to end at a
			// boundary, or half a name comes out styled as a whole one.
			const next = body[at + 1 + length];
			if (next && /[\p{L}\p{N}]/u.test(next)) continue;
			if (!best || length > best.length) best = { length, person };
		}
	}

	return best;
}

/* -------------------------------------------------------------------------- */
/* The composer                                                                */
/* -------------------------------------------------------------------------- */

interface ComposerProps {
	author: CommentPerson;
	/** Only ever true for a box the user opened by pressing something. */
	autoFocus?: boolean;
	directory: CommentPerson[];
	/** Given one, the text survives unmounting. Omit for the edit box. */
	draftKey?: string;
	initialValue?: string;
	/** The field's accessible name. */
	label: string;
	/** Characters. The counter appears near the cap; see `AppCommentSectionProps`. */
	maxLength?: number;
	onCancel?: () => void;
	onSubmit: (body: string) => Promise<void> | void;
	/** Ranked to the top of the @ menu: the person being answered is usually the person being named. */
	participantIds: string[];
	placeholder?: string;
	showAvatar?: boolean;
	submitLabel: string;
}

/**
 * The box. One textarea that grows with the text, an @ menu over it, and a
 * Submit beside it.
 *
 * Enter inserts a newline and Cmd/Ctrl+Enter submits. A comment is prose:
 * Enter-to-send belongs to chat, and here it posts half-written thoughts. The
 * Submit button is real and always visible for exactly the same reason - a
 * keyboard shortcut is not an affordance.
 */
function Composer({
	author,
	autoFocus = false,
	directory,
	draftKey,
	initialValue = "",
	label,
	maxLength,
	onCancel,
	onSubmit,
	participantIds,
	placeholder = "Add a comment…",
	showAvatar = true,
	submitLabel,
}: ComposerProps) {
	const [body, setBody] = useState(initialValue);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	/** Where the caret has to land after a programmatic write. */
	const nextCaret = useRef<number | null>(null);
	const baseId = useId();
	const fieldId = `${baseId}-field`;
	const menuId = `${baseId}-menu`;
	const hintId = `${baseId}-hint`;

	const mention = useMentionMenu(body, directory, participantIds);

	/**
	 * The cap is 40% of the viewport, at which point it scrolls inside itself.
	 * A fixed three-row box that starts scrolling at the fourth line hides the
	 * beginning of what somebody is writing at the moment they are checking it.
	 */
	const syncHeight = useCallback(() => {
		const node = textareaRef.current;
		if (!node) return;
		node.style.height = "auto";
		node.style.height = `${node.scrollHeight}px`;
	}, []);

	useDraft(draftKey, body, setBody);

	useEffect(() => {
		if (!autoFocus) return;
		const node = textareaRef.current;
		node?.focus();
		// After the prefilled "@name ", not before it.
		node?.setSelectionRange(node.value.length, node.value.length);
	}, [autoFocus]);

	/**
	 * The backstop for every value change that did NOT come from typing - a
	 * restored draft, a picked mention, a swallowed "@name", the clear after a
	 * post. Typing re-measures inline in `onChange` so the box never grows a
	 * frame late; this catches the rest and puts the caret where it belongs.
	 */
	useEffect(() => {
		syncHeight();
		const caret = nextCaret.current;
		if (caret === null) return;
		nextCaret.current = null;
		textareaRef.current?.setSelectionRange(caret, caret);
	}, [body, syncHeight]);

	/** Writes the value and asks for a caret position once React has painted it. */
	function write(next: string, caret?: number) {
		if (caret !== undefined) nextCaret.current = caret;
		setBody(next);
	}

	function insertMention(person: CommentPerson) {
		const node = textareaRef.current;
		const caret = node?.selectionStart ?? body.length;
		const start = mention.query?.start ?? caret;
		const inserted = `@${person.name} `;
		mention.close();
		write(body.slice(0, start) + inserted + body.slice(caret), start + inserted.length);
		node?.focus();
	}

	async function submit() {
		const trimmed = body.trim();
		if (!trimmed || isSubmitting) return;
		// Measured on the TRIMMED text, the same string the caller is handed.
		// Refusing a comment for trailing whitespace nobody can see is a cap that
		// looks broken.
		if (maxLength !== undefined && trimmed.length > maxLength) return;

		setIsSubmitting(true);
		try {
			await onSubmit(trimmed);
			// Cleared and still focused: the next comment is the likeliest next
			// action. On a rejection the text stays exactly where it is - the
			// caller keeps it, either in the thread or in this box.
			write("", 0);
			textareaRef.current?.focus();
		} catch {
			// Deliberately swallowed. A thread post keeps the words in the thread
			// with a Retry; an edit keeps this editor open. Neither is this
			// component's to announce a second time.
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (mention.isOpen) {
			if (event.key === "ArrowDown" || event.key === "ArrowUp") {
				event.preventDefault();
				mention.move(event.key === "ArrowDown" ? 1 : -1);
				return;
			}
			if (event.key === "Enter") {
				event.preventDefault();
				const person = mention.active;
				if (person) insertMention(person);
				return;
			}
			if (event.key === "Escape") {
				// Closes without picking and leaves the "@" in the text, so the
				// keystroke is not also undone.
				event.preventDefault();
				event.stopPropagation();
				mention.close();
				return;
			}
			if (event.key === "Tab") mention.close();
		}

		if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			void submit();
			return;
		}

		if (event.key === "Backspace") {
			const node = event.currentTarget;
			if (node.selectionStart !== node.selectionEnd) return;
			const run = mentionRunBefore(body, node.selectionStart, directory);
			if (run !== null) {
				// One backspace removes the whole "@name", never the "e" off the end
				// of somebody's name - which is what makes the prefill a token.
				event.preventDefault();
				write(body.slice(0, run) + body.slice(node.selectionStart), run);
			}
			return;
		}

		if (event.key === "Escape" && onCancel) {
			event.preventDefault();
			event.stopPropagation();
			onCancel();
		}
	}

	const trimmedLength = body.trim().length;
	const isEmpty = trimmedLength === 0;
	const remaining = maxLength === undefined ? null : maxLength - trimmedLength;
	const isOverCap = remaining !== null && remaining < 0;
	/*
	 * "Approaching" is the last tenth of the allowance, never fewer than 20
	 * characters of warning. A fixed threshold is wrong at both ends - 50 left of
	 * 2000 arrives with a word to spare, and 50 left of 80 has been on screen
	 * since the first keystroke.
	 */
	const showsCount =
		remaining !== null && maxLength !== undefined && remaining <= Math.max(20, Math.round(maxLength / 10));

	return (
		<div className="flex gap-3">
			{showAvatar ? (
				<AuthorAvatar
					isSmall
					person={author}
				/>
			) : null}

			<div className="relative min-w-0 flex-1">
				<label
					className="sr-only"
					htmlFor={fieldId}
				>
					{label}
				</label>

				<InputGroup fullWidth>
					{/*
					 * `aria-activedescendant` and `aria-controls` without `role="combobox"`
					 * and without `aria-expanded`: neither is valid on a textarea, and a
					 * composer that permanently announces itself as a combobox is worse
					 * for the 99% of the time no menu is open. The live region below is
					 * what tells a screen reader the menu arrived.
					 */}
					<InputGroup.TextArea
						aria-activedescendant={mention.activeId}
						aria-controls={mention.isOpen ? menuId : undefined}
						aria-describedby={hintId}
						className="max-h-[40dvh] resize-none overflow-y-auto"
						id={fieldId}
						onChange={(event) => {
							setBody(event.target.value);
							mention.detect(event.target.value, event.target.selectionStart);
							syncHeight();
						}}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						ref={textareaRef}
						rows={2}
						value={body}
					/>
				</InputGroup>

				<p
					className="sr-only"
					id={hintId}
				>
					Enter adds a line. Press Control or Command and Enter to post. Type @ to mention somebody.
				</p>
				{/*
				 * One region, two things worth interrupting for: a menu that opened,
				 * and a comment that can no longer be posted. Announcing the count on
				 * every keystroke as it runs down would read the number aloud forty
				 * times, so only crossing the line is spoken.
				 */}
				<p
					aria-live="polite"
					className="sr-only"
				>
					{mention.isOpen
						? `${mention.matches.length} ${mention.matches.length === 1 ? "person" : "people"} to mention. Use the arrow keys and Enter to pick one.`
						: isOverCap
							? `${Math.abs(remaining)} characters over the limit of ${maxLength}. Shorten the comment to post it.`
							: ""}
				</p>

				{mention.isOpen ? (
					<MentionMenu
						activeId={mention.activeId}
						id={menuId}
						matches={mention.matches}
						onPick={insertMention}
						optionId={mention.optionId}
					/>
				) : null}

				<div className="mt-2 flex items-center justify-end gap-2">
					{/*
					 * The shortcut hint and the counter share the one slot on the left,
					 * and the counter wins it. Both are secondary, but only one of them
					 * is about to stop the post going through - and stacking them puts
					 * two lines of small grey text under a box somebody is typing in.
					 */}
					{showsCount ? (
						<p
							className={cn("mr-auto text-xs tabular-nums", isOverCap ? "text-danger" : "text-muted")}
							data-cy="composer-remaining"
						>
							{isOverCap ? `${Math.abs(remaining)} over the limit` : `${remaining} left`}
						</p>
					) : (
						<p
							aria-hidden="true"
							className="mr-auto hidden text-xs text-muted sm:block"
						>
							⌘/Ctrl + Enter to post
						</p>
					)}
					{onCancel ? (
						<AppButton
							isDisabled={isSubmitting}
							onPress={onCancel}
							size="sm"
							variant="tertiary"
						>
							Cancel
						</AppButton>
					) : null}
					{/*
					 * Disabled on empty or whitespace-only. A Submit that accepts a
					 * spacebar is a blank comment in the thread.
					 *
					 * And disabled past the cap, where the counter beside it is already
					 * saying by how much. The words stay in the box - it is the POST
					 * that is refused, not the typing.
					 */}
					<AppButton
						icon={Send}
						isDisabled={isEmpty || isSubmitting || isOverCap}
						isPending={isSubmitting}
						onPress={() => void submit()}
						size="sm"
						variant="primary"
					>
						{submitLabel}
					</AppButton>
				</div>
			</div>
		</div>
	);
}

/** The @ menu: a listbox over the composer, driven from the field. */
function MentionMenu({
	activeId,
	id,
	matches,
	onPick,
	optionId,
}: {
	activeId?: string;
	id: string;
	matches: CommentPerson[];
	onPick: (person: CommentPerson) => void;
	optionId: (person: CommentPerson) => string;
}) {
	return (
		/*
		 * Above the field, not below it. The composer is at the bottom of the
		 * thread and on a phone the keyboard is under it, so a menu opening
		 * downward opens into the keyboard.
		 *
		 * mousedown is swallowed so pressing a row does not pull the caret out of
		 * the textarea before the click lands.
		 */
		<div
			aria-label="Mention somebody"
			className="absolute inset-x-0 bottom-full z-40 mb-2 max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-1 shadow-soft"
			id={id}
			onMouseDown={(event) => event.preventDefault()}
			role="listbox"
		>
			{matches.map((person) => (
				<div
					aria-selected={optionId(person) === activeId}
					className={cn(
						"flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-colors",
						"hover:bg-[color-mix(in_oklab,var(--accent)_6%,var(--surface))]",
						optionId(person) === activeId && "bg-[color-mix(in_oklab,var(--accent)_10%,var(--surface))]",
					)}
					id={optionId(person)}
					key={person.id}
					onClick={() => onPick(person)}
					role="option"
					// Focus never leaves the textarea in an activedescendant listbox.
					tabIndex={-1}
				>
					<AppAvatar
						name={person.name}
						size="sm"
						src={person.avatarSrc}
					/>
					<span className="min-w-0 flex-1 truncate text-sm font-medium">{person.name}</span>
					<span className="shrink-0 text-xs text-muted">@{person.handle}</span>
				</div>
			))}
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                       */
/* -------------------------------------------------------------------------- */

interface PendingComment {
	body: string;
	createdAt: Date;
	id: string;
	parentId?: string;
	state: "failed" | "sending";
}

let pendingSeq = 0;

/**
 * The optimistic half of posting.
 *
 * The comment appears the instant it is written, dimmed and without actions,
 * and it is dropped only once `onSubmit` resolves - which is why the prop's
 * contract says it must not resolve before the real one is in `comments`. On a
 * rejection it stays exactly where it is, with the text, and offers Retry.
 *
 * The component owns this rather than leaving it to the caller because "the
 * words must not vanish" is the one rule here that cannot be optional.
 */
function usePendingComments(onSubmit: AppCommentSectionProps["onSubmit"]) {
	const [pending, setPending] = useState<PendingComment[]>([]);
	const bodies = useRef(new Map<string, { body: string; parentId?: string }>());

	const send = useCallback(
		async (id: string, body: string, parentId?: string) => {
			try {
				await onSubmit({ body, parentId });
				bodies.current.delete(id);
				setPending((current) => current.filter((entry) => entry.id !== id));
			} catch {
				setPending((current) => current.map((entry) => (entry.id === id ? { ...entry, state: "failed" } : entry)));
			}
		},
		[onSubmit],
	);

	const post = useCallback(
		(body: string, parentId?: string) => {
			pendingSeq += 1;
			const id = `pending-${pendingSeq}`;
			bodies.current.set(id, { body, parentId });
			setPending((current) => [...current, { body, createdAt: new Date(), id, parentId, state: "sending" }]);
			void send(id, body, parentId);
		},
		[send],
	);

	const retry = useCallback(
		(id: string) => {
			const entry = bodies.current.get(id);
			if (!entry) return;
			setPending((current) => current.map((item) => (item.id === id ? { ...item, state: "sending" } : item)));
			void send(id, entry.body, entry.parentId);
		},
		[send],
	);

	const discard = useCallback((id: string) => {
		bodies.current.delete(id);
		setPending((current) => current.filter((entry) => entry.id !== id));
	}, []);

	return { discard, pending, post, retry };
}

/** One comment's vote line, with the reader's own press already applied. */
interface Reactions {
	dislikeCount: number;
	likeCount: number;
	mine: CommentReaction | null;
}

/**
 * The optimistic half of voting.
 *
 * The button flips and the count moves on the press, before anything is sent.
 * Nobody waits 300ms to find out whether their own thumb landed, and a Like that
 * lags is one people press twice. A rejection puts both back exactly as they
 * were - which is the entire error handling this needs, because unlike a
 * comment there is nothing here to lose: the "text" is one bit and it is still
 * on screen as a button.
 *
 * The count is derived, never stored: the caller's `likeCount` includes the
 * reader's own vote like anybody else's, so the delta between what they had and
 * what they now have is what moves. Storing a count instead would double it the
 * moment the caller refetched.
 */
function useReactions(onReact: AppCommentSectionProps["onReact"]) {
	/** Only the ones pressed this session. Absent means "whatever the caller says". */
	const [mine, setMine] = useState<Record<string, OwnVote>>({});

	const reactionsOf = useCallback(
		(comment: ThreadComment): Reactions => {
			const own = ownVote(comment, mine);
			const delta = (kind: CommentReaction) => Number(own === kind) - Number(comment.myReaction === kind);

			return {
				// Clamped: a caller that omits the counts but sets `myReaction` would
				// otherwise render a -1 the first time the vote is withdrawn.
				dislikeCount: Math.max(0, (comment.dislikeCount ?? 0) + delta("dislike")),
				likeCount: Math.max(0, (comment.likeCount ?? 0) + delta("like")),
				mine: own,
			};
		},
		[mine],
	);

	const react = useCallback(
		(comment: ThreadComment, kind: CommentReaction) => {
			const base = comment.myReaction ?? null;
			const previous = ownVote(comment, mine);
			// Pressing what you already hold withdraws it; pressing the other one
			// MOVES it. Two independent booleans would let somebody both agree and
			// disagree with the same sentence.
			const next = previous === kind ? null : kind;

			setMine((current) => ({ ...current, [comment.id]: { base, value: next } }));

			void (async () => {
				try {
					await onReact?.(comment.id, next);
				} catch {
					setMine((current) => ({ ...current, [comment.id]: { base, value: previous } }));
				}
			})();
		},
		[mine, onReact],
	);

	return { react, reactionsOf };
}

/**
 * One optimistic vote, and the caller's value at the moment it was cast.
 *
 * `base` is what makes this safe to keep around. Without it the guess would
 * outlive the thing it was guessing about: the caller commits the vote, or
 * resets the thread, or loads a different one over the top, and a plain
 * "value" would keep asserting a press from ten minutes ago over data that has
 * since moved.
 */
interface OwnVote {
	base: CommentReaction | null;
	value: CommentReaction | null;
}

/**
 * The reader's vote: the optimistic one while it is still standing, the
 * caller's the moment it stops.
 *
 * It stops the instant `myReaction` differs from what it was when the button
 * was pressed - which covers both endings. The caller agreeing (the vote landed
 * and came back in the data) and the caller disagreeing (a reset, a refetch, a
 * vote cast on another device) are the same test, and the first one changes
 * nothing on screen because the two values match.
 */
function ownVote(comment: ThreadComment, mine: Record<string, OwnVote>): CommentReaction | null {
	const truth = comment.myReaction ?? null;
	const own = mine[comment.id];

	return own && own.base === truth ? own.value : truth;
}

/**
 * Counts comments that arrived while the bottom of the thread was off screen.
 *
 * Nothing is held back: arrivals land BELOW what is being read, so appending
 * moves nothing. The only thing missing is that the reader has no way of
 * knowing - hence a count and a way down to it.
 *
 * "Is the newest one on screen" is an IntersectionObserver on a sentinel rather
 * than a scroll listener, because this component does not own its scroll
 * container - the page on some screens, a panel on others - and the observer
 * does not need to know which.
 */
function useNewArrivals(comments: CommentItem[], bottomRef: RefObject<HTMLDivElement | null>) {
	const isBottomVisible = useRef(true);
	const [seenId, setSeenId] = useState<string | null>(() => comments.at(-1)?.id ?? null);

	const newestId = comments.at(-1)?.id ?? null;
	/*
	 * Read from a ref inside the observer rather than closed over. `comments` is
	 * a fresh array on every render of most callers, and a dependency on it would
	 * tear down and rebuild the observer on each one.
	 */
	const newestIdRef = useRef(newestId);
	newestIdRef.current = newestId;

	useEffect(() => {
		const node = bottomRef.current;
		if (!node) return;

		const observer = new IntersectionObserver((records) => {
			isBottomVisible.current = records[0]?.isIntersecting ?? true;
			// Scrolling back down to the newest one is what marks them read.
			if (isBottomVisible.current) setSeenId(newestIdRef.current);
		});
		observer.observe(node);
		return () => observer.disconnect();
	}, [bottomRef]);

	useEffect(() => {
		if (isBottomVisible.current) setSeenId(newestId);
	}, [newestId]);

	const seenIndex = seenId ? comments.findIndex((comment) => comment.id === seenId) : -1;
	// A dropped anchor means the thread was replaced rather than appended to,
	// and a count against a list that no longer exists is noise.
	const count = seenIndex >= 0 ? comments.length - 1 - seenIndex : 0;

	return {
		count,
		jumpToNewest: () => {
			setSeenId(newestId);
			bottomRef.current?.scrollIntoView({
				behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
				block: "end",
			});
		},
	};
}

/**
 * Keeps the reader where they were when a page of older comments is prepended.
 *
 * Prepending grows the list upward in document flow, which pushes everything
 * below it down by exactly the added height. Measuring the list's BOTTOM edge
 * before and after gives that height without needing to know which element is
 * on screen, and scrolling by the difference puts the same words back under the
 * same pixel.
 */
function useHeldScroll(listRef: RefObject<HTMLDivElement | null>, length: number, onLoadEarlier?: () => void) {
	const anchor = useRef<number | null>(null);

	useEffect(() => {
		const held = anchor.current;
		anchor.current = null;
		const node = listRef.current;
		if (held === null || !node) return;

		const delta = node.getBoundingClientRect().bottom - held;
		if (Math.abs(delta) < 1) return;

		const scroller = scrollParentOf(node);
		if (scroller) scroller.scrollTop += delta;
		else window.scrollBy(0, delta);
	}, [length, listRef]);

	return () => {
		anchor.current = listRef.current?.getBoundingClientRect().bottom ?? null;
		onLoadEarlier?.();
	};
}

/**
 * The nearest ancestor that actually scrolls, or `null` for the document.
 *
 * A thread is the page on one screen and a panel on another, and the two need
 * different calls - `element.scrollTop` versus `window.scrollBy`.
 */
function scrollParentOf(node: HTMLElement): HTMLElement | null {
	let current = node.parentElement;

	while (current) {
		const { overflowY } = window.getComputedStyle(current);
		if ((overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight) return current;
		current = current.parentElement;
	}

	return null;
}

/**
 * The unsent text, per thread.
 *
 * sessionStorage, read after mount: an unsent paragraph has to survive
 * navigating away and back, which is the whole rule, but it should not still be
 * sitting in the box next week. Reading it in a lazy initialiser would render a
 * filled box on the server over an empty one in the browser, which React
 * resolves by throwing the markup away.
 *
 * Without a key - the edit box - it does nothing at all. An edit is already
 * holding text that exists somewhere; persisting a second copy of it means a
 * stale draft reappearing over a comment that has since changed.
 */
function useDraft(storageKey: string | undefined, body: string, setBody: (value: string) => void): void {
	const hasRestored = useRef(false);

	useEffect(() => {
		if (!storageKey || hasRestored.current) return;
		hasRestored.current = true;
		try {
			const stored = window.sessionStorage.getItem(storageKey);
			if (stored) setBody(stored);
		} catch {
			// Private mode, or a full quota. A lost draft must not take the
			// composer down with it.
		}
	}, [storageKey, setBody]);

	// One writer, so the stored copy can never disagree with the rendered one:
	// clearing the box clears the draft, which is what makes posting final.
	useEffect(() => {
		if (!storageKey || !hasRestored.current) return;
		try {
			if (body) window.sessionStorage.setItem(storageKey, body);
			else window.sessionStorage.removeItem(storageKey);
		} catch {
			// See above.
		}
	}, [body, storageKey]);
}

interface MentionQuery {
	start: number;
	text: string;
}

/** Past this it is prose, not a name being looked up. */
const MENTION_QUERY_MAX = 24;

/** Six is what fits over the composer without the menu becoming a page. */
const MENTION_MATCH_LIMIT = 6;

/**
 * The @ menu's state, derived from the text and the caret.
 *
 * It opens on an "@" at a WORD BOUNDARY only. Mid-word it stays shut, or every
 * email address typed into a comment summons it.
 */
function useMentionMenu(body: string, directory: CommentPerson[], participantIds: string[]) {
	const [query, setQuery] = useState<MentionQuery | null>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const baseId = useId();

	// Re-validated against the text, so deleting back past the "@" closes the
	// menu without needing a second code path to notice.
	useEffect(() => {
		setQuery((current) => (current && body[current.start] === "@" ? current : null));
	}, [body]);

	const matches = useMemo(() => {
		if (!query) return [];
		const needle = query.text.trim().toLowerCase();
		const participants = new Set(participantIds);

		return (
			directory
				.filter(
					(person) =>
						!needle || person.name.toLowerCase().includes(needle) || person.handle.toLowerCase().includes(needle),
				)
				/*
				 * Thread participants first. The person being answered is almost
				 * always the person being named, and in an org of four hundred that
				 * is the difference between one keystroke and eight.
				 */
				.sort((a, b) => Number(participants.has(b.id)) - Number(participants.has(a.id)))
				.slice(0, MENTION_MATCH_LIMIT)
		);
	}, [query, directory, participantIds]);

	// A highlight pointing at a row that has been filtered away is worse than none.
	useEffect(() => {
		setActiveIndex(0);
	}, [query?.text]);

	const optionId = (person: CommentPerson) => `${baseId}-${person.id}`;
	const isOpen = query !== null && matches.length > 0;
	const active = isOpen ? matches[Math.min(activeIndex, matches.length - 1)] : undefined;

	return {
		active,
		activeId: active ? optionId(active) : undefined,
		close: () => setQuery(null),
		/** Re-reads the text behind the caret and opens, updates or closes the menu. */
		detect: (value: string, caret: number) => setQuery(detectMention(value, caret)),
		isOpen,
		matches,
		move: (step: number) =>
			setActiveIndex((current) => (current + step + matches.length) % Math.max(matches.length, 1)),
		optionId,
		query,
	};
}

/**
 * The "@…" run the caret is sitting in, if it is sitting in one.
 *
 * A single space is allowed inside the query, because the names being looked up
 * have spaces in them and "@Aria Ch" has to keep matching. Two closes it: past
 * that the "@" is three words back and the user is writing a sentence.
 */
function detectMention(value: string, caret: number): MentionQuery | null {
	const upto = value.slice(0, caret);
	const at = upto.lastIndexOf("@");
	if (at < 0) return null;

	// Word boundary only. Mid-word - an email address, most often - it stays shut.
	const before = at === 0 ? "" : upto[at - 1];
	if (before && !/\s/.test(before)) return null;

	const text = upto.slice(at + 1);
	if (text.length > MENTION_QUERY_MAX) return null;
	if (/[\n@]/.test(text)) return null;
	if ((text.match(/ /g)?.length ?? 0) > 1) return null;

	return { start: at, text };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The start index of an "@name" run ending at the caret, if there is one.
 *
 * The optional trailing space is part of the run: the prefill is "@name " and
 * removing the name while leaving its space behind is the same half-deletion
 * the token rule exists to stop.
 */
function mentionRunBefore(body: string, caret: number, directory: CommentPerson[]): number | null {
	const upto = body.slice(0, caret);
	const trimmed = upto.endsWith(" ") ? upto.slice(0, -1) : upto;
	let best: number | null = null;

	for (const person of directory) {
		for (const candidate of [person.name, person.handle]) {
			const run = `@${candidate}`;
			if (trimmed.toLowerCase().endsWith(run.toLowerCase())) {
				const start = trimmed.length - run.length;
				const before = start === 0 ? "" : trimmed[start - 1];
				if (before && !/\s/.test(before)) continue;
				if (best === null || start < best) best = start;
			}
		}
	}

	return best;
}

/**
 * Three comments at the real row height, avatar circle included.
 *
 * The root is an `<output>`, not a div with `role="status"`: it carries the
 * role natively, which is the one thing a screen reader is guaranteed to
 * honour. It is inline by default, hence the explicit `block`.
 */
function ThreadSkeleton({ label }: { label: string }) {
	return (
		<output
			aria-busy="true"
			aria-label={`${label}, loading`}
			className="block space-y-4"
		>
			{[0, 1, 2].map((row) => (
				<div
					className="flex gap-3"
					key={row}
				>
					<Skeleton className="size-10 shrink-0 rounded-full" />
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-4 w-40 max-w-full rounded-md" />
						<Skeleton className="h-3 w-full rounded-md" />
						<Skeleton className="h-3 w-3/4 rounded-md" />
					</div>
				</div>
			))}
		</output>
	);
}

/**
 * Out of flow (`h-0`) on purpose, the same way the timeline's is. A pill that
 * took its own height would push the composer down the page at the moment it
 * appeared.
 */
function NewCommentsPill({ count, onPress }: { count: number; onPress: () => void }) {
	return (
		<div className="pointer-events-none sticky bottom-2 z-30 flex h-0 justify-center">
			<AppButton
				className="pointer-events-auto shadow-soft"
				icon={ArrowDown}
				onPress={onPress}
				size="sm"
				variant="primary"
			>
				{count} new {plural(count, "comment")}
			</AppButton>
		</div>
	);
}

function draftKey(threadId: string, parentId?: string): string {
	return parentId ? `app:comment-draft:${threadId}:${parentId}` : `app:comment-draft:${threadId}`;
}

function plural(count: number, word: string): string {
	return count === 1 ? word : `${word}s`;
}

/**
 * The names two different people in the thread both answer to.
 *
 * This is the ONLY thing that puts an email on a comment line. Printing it on
 * every comment leaks the same address forty times over; withholding it when
 * two "Maria Santos" are arguing makes the thread unreadable.
 */
function duplicateNames(people: CommentPerson[]): Set<string> {
	const seen = new Map<string, string>();
	const duplicates = new Set<string>();

	for (const person of people) {
		const name = person.name.toLowerCase();
		const owner = seen.get(name);
		if (owner && owner !== person.id) duplicates.add(name);
		else seen.set(name, person.id);
	}

	return duplicates;
}

function uniqueBy<T>(items: T[], keyOf: (item: T) => string): T[] {
	const seen = new Set<string>();
	const result: T[] = [];

	for (const item of items) {
		const key = keyOf(item);
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(item);
	}

	return result;
}
