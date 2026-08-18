import type { CommentItem, CommentPerson, CommentReaction } from "@bernardsapida/web-ui";
import { AppButton, AppCommentSection, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Comment section lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The thread at the top is the one to poke at. Type "@" and the menu opens on a
 * word boundary only; press Reply and the composer lands inline with the
 * mention already in it as a token one backspace removes. The second thread
 * always fails to post, which is the only way to see that a rejected comment
 * keeps its words.
 */
export const Route = createFileRoute("/(references)/components/comments")({
	head: () => ({
		meta: [{ title: seo.title("Comment section lab") }, { content: "noindex", name: "robots" }],
	}),
	component: CommentsLabPage,
});

function CommentsLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A conversation that reads down, a composer that grows, and text that never goes missing."
				title="Comment section lab"
			/>
			<LiveSection />
			<FailureSection />
			<DeskSection />
			<HistorySection />
			<ContentSection />
			<StatesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
}

function LabSection({ children, description, title }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

/** A thread in its own panel, at the width one really gets. */
function Frame({ children }: { children: ReactNode }) {
	return <div className="max-w-2xl rounded-3xl border border-border bg-surface p-4 sm:p-5">{children}</div>;
}

/* -------------------------------------------------------------------------- */

/**
 * A fixed instant for the first render and the real one after mount - the same
 * anchoring the timeline lab uses, and for the same reason: the fixtures below
 * are offsets from "now", and "now" differs between the server's render and the
 * browser's, which would put a different `datetime` in the markup on each side.
 */
const FIXED_BASE = Date.parse("2026-08-03T09:00:00Z");

function useLabClock(): number {
	const [now, setNow] = useState<number | null>(null);

	useEffect(() => {
		setNow(Date.now());
	}, []);

	return now ?? FIXED_BASE;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/* -------------------------------------------------------------------------- */

const YOU: CommentPerson = {
	email: "mara.villanueva@example.com",
	handle: "mara",
	id: "u-mara",
	name: "Mara Villanueva",
};

const JOSEFA: CommentPerson = {
	email: "josefa.ramos@qcgh.ph",
	handle: "josefa",
	id: "u-josefa",
	name: "Josefa Ramos",
};
const BEN: CommentPerson = {
	email: "ben.cortez@example.com",
	handle: "ben",
	id: "u-ben",
	name: "Ben Cortez",
};
const ARIA: CommentPerson = {
	email: "aria.chen@example.com",
	handle: "aria",
	id: "u-aria",
	name: "Aria Chen",
};
const BERNARD: CommentPerson = {
	email: "bernard.sy@example.com",
	handle: "bernard",
	id: "u-bernard",
	name: "Bernard Sy",
};

/** Everyone the @ menu may resolve, including people who have not spoken yet. */
const DIRECTORY = [YOU, JOSEFA, BEN, ARIA, BERNARD];

interface Seed {
	author: CommentPerson;
	body: string;
	dislikes?: number;
	editedOffset?: number;
	likes?: number;
	/** What YOU have already voted on it, counted inside `likes`/`dislikes`. */
	myReaction?: CommentReaction;
	offset: number;
	parentIndex?: number;
}

const THREAD_SEEDS: Seed[] = [
	{
		author: JOSEFA,
		body: "The courier arrived at 14:05 but the last weight check was two days old, so we repeated screening in full before pickup. Nothing else on the checklist changed.",
		likes: 4,
		offset: 5 * HOUR,
	},
	{
		author: BEN,
		body: "@Josefa Ramos thanks - was that inside the two-hour window, or did it push us past it? The manifest still says 14:00.",
		offset: 4 * HOUR,
		parentIndex: 0,
	},
	{
		author: JOSEFA,
		body: "@Ben Cortez inside it, just. Pickup closed at 14:52. I have updated the manifest.",
		editedOffset: 3 * HOUR,
		likes: 2,
		// Already yours, and the 2 above includes it - so withdrawing it reads 1.
		myReaction: "like",
		offset: 3 * HOUR + 20 * MINUTE,
		parentIndex: 0,
	},
	{
		author: ARIA,
		body: "Filed the discrepancy under https://example.com/ops/discrepancies/ORD-25841 so the reconciliation picks it up on Friday. Nothing needed from anyone here.",
		dislikes: 1,
		likes: 1,
		offset: 90 * MINUTE,
	},
];

function toComments(seeds: Seed[], base: number, prefix: string): CommentItem[] {
	return seeds.map((seed, index) => ({
		author: seed.author,
		body: seed.body,
		createdAt: new Date(base - seed.offset),
		dislikeCount: seed.dislikes,
		editedAt: seed.editedOffset ? new Date(base - seed.editedOffset) : undefined,
		id: `${prefix}-${index}`,
		likeCount: seed.likes,
		myReaction: seed.myReaction,
		parentId: seed.parentIndex === undefined ? undefined : `${prefix}-${seed.parentIndex}`,
	}));
}

/**
 * A vote, committed the way a server would commit it: the reader's own reaction
 * AND the totals, together.
 *
 * Moving one without the other is what makes a Like count snap back a moment
 * after it moved - the thread applies its optimistic +1 against the caller's
 * number, so a caller that records the vote and leaves the total alone is
 * telling it the vote is already counted when it is not.
 */
function applyVote(comment: CommentItem, votes: Record<string, CommentReaction | null>): CommentItem {
	if (!(comment.id in votes)) return comment;

	const next = votes[comment.id];
	const delta = (kind: CommentReaction) => Number(next === kind) - Number(comment.myReaction === kind);

	return {
		...comment,
		dislikeCount: Math.max(0, (comment.dislikeCount ?? 0) + delta("dislike")),
		likeCount: Math.max(0, (comment.likeCount ?? 0) + delta("like")),
		myReaction: next ?? undefined,
	};
}

/* -------------------------------------------------------------------------- */

/** The working thread: posts land, replies nest one level, mentions resolve. */
function LiveSection() {
	const base = useLabClock();
	const [posted, setPosted] = useState<CommentItem[]>([]);
	const [deleted, setDeleted] = useState<Set<string>>(new Set());
	const [edits, setEdits] = useState<Record<string, string>>({});
	/** The lab is the server here, so it holds the votes rather than the thread. */
	const [votes, setVotes] = useState<Record<string, CommentReaction | null>>({});

	const comments = [...toComments(THREAD_SEEDS, base, "live"), ...posted].map((comment) =>
		applyVote(
			{
				...comment,
				body: edits[comment.id] ?? comment.body,
				editedAt: edits[comment.id] ? new Date() : comment.editedAt,
				isDeleted: deleted.has(comment.id),
			},
			votes,
		),
	);

	return (
		<LabSection
			description="Oldest at the top, the composer at the bottom, newest nearest the box you type in. Enter adds a line and Cmd/Ctrl+Enter posts, because a comment is prose and Enter-to-send posts half-written thoughts. Press Reply and the composer opens inline with '@name ' already in it - one backspace removes the whole name, not the last letter of it. Type '@' anywhere at a word boundary to summon the menu; type it mid-word, as in an email address, and it stays shut. Like and Dislike are one vote, not two: pressing the one you hold withdraws it and pressing the other moves it, so nobody agrees and disagrees with the same sentence. Both flip on the press, half a second before this lab's 'server' answers - and if it refuses, the button and the count go back to where they were."
			title="A thread"
		>
			<div className="space-y-4">
				<Frame>
					<AppCommentSection
						comments={comments}
						currentUser={YOU}
						data-cy="comments-live"
						heading="Discussion"
						mentionables={DIRECTORY}
						onDelete={(id) => setDeleted((current) => new Set(current).add(id))}
						onEdit={(id, nextBody) => setEdits((current) => ({ ...current, [id]: nextBody }))}
						onReact={async (id, reaction) => {
							// Deliberately slow, and deliberately not awaited by the thread:
							// the thumb has already flipped. This is the trip it flips
							// ahead of.
							await delay(500);
							setVotes((current) => ({ ...current, [id]: reaction }));
						}}
						onSubmit={async ({ body, parentId }) => {
							// A real round trip, and it does not resolve until the comment
							// is in `comments` - which is the prop's contract.
							await delay(600);
							setPosted((current) => [
								...current,
								{
									author: YOU,
									body,
									createdAt: new Date(),
									id: `posted-${current.length}`,
									parentId,
								},
							]);
						}}
						threadId="lab-live"
					/>
				</Frame>
				<div className="flex flex-wrap items-center gap-2">
					<AppButton
						isDisabled={
							posted.length === 0 &&
							deleted.size === 0 &&
							Object.keys(edits).length === 0 &&
							Object.keys(votes).length === 0
						}
						onPress={() => {
							setPosted([]);
							setDeleted(new Set());
							setEdits({});
							setVotes({});
						}}
						size="sm"
						variant="secondary"
					>
						Reset
					</AppButton>
					<p className="text-sm text-muted">{posted.length} posted this session</p>
				</div>
			</div>
		</LabSection>
	);
}

/** The one that always fails, because it is the only way to see the rule. */
function FailureSection() {
	const base = useLabClock();

	return (
		<LabSection
			description="This composer's post always rejects. The comment still appears the instant it is written - dimmed, without actions - and when the request fails it stays exactly where it is with the text intact and a Retry beside it. A toast saying 'failed' while the words are gone is the worst outcome this component has, so there is no toast. Retry sends the same text again; the bin discards it, and that is the only thing that throws it away."
			title="A post that fails"
		>
			<Frame>
				<AppCommentSection
					comments={toComments(THREAD_SEEDS.slice(0, 1), base, "fail")}
					currentUser={YOU}
					data-cy="comments-fail"
					heading="Discussion"
					mentionables={DIRECTORY}
					onSubmit={async () => {
						await delay(700);
						throw new Error("The lab rejects every post in this section.");
					}}
					threadId="lab-fail"
				/>
			</Frame>
		</LabSection>
	);
}

/**
 * The same people, doing a job.
 *
 * A `title` is what the person IS in THIS conversation, and it is the fact that
 * changes how a sentence is read: "we will not fund the second unit" is one
 * thing from a colleague and another from the Campus Director. It is the reason
 * the field prints on the line rather than living in the popover behind the
 * name - a fact a reader has to press for is a fact most readers never see.
 */
const DESK_SEEDS: Seed[] = [
	{
		author: {
			...JOSEFA,
			title: "Requestor",
		},
		body: "Attaching the revised quotation - the supplier moved the unit price after the site visit, so the total is 18,400 rather than the 21,000 in the original.",
		offset: 6 * HOUR,
	},
	{
		author: {
			...BEN,
			title: "IDO Chairperson",
		},
		body: "Received. I am recommending it at the new figure. @Aria Chen this is the one waiting on the budget certificate.",
		offset: 3 * HOUR,
	},
	{
		author: {
			...ARIA,
			title: "Budget Officer",
		},
		body: "Certificate is issued against this year's allocation. Nothing further needed from the requestor.",
		offset: 40 * MINUTE,
	},
];

/**
 * The three settings a thread hanging off a RECORD usually needs, together -
 * because they tend to be true at the same time and for the same reason.
 */
function DeskSection() {
	const base = useLabClock();
	const [posted, setPosted] = useState<CommentItem[]>([]);

	return (
		<LabSection
			description="Every author carries a title, and it prints on the line beside the name - muted and small, because forty comments carry forty of them and only one of them is the 'You' the reader is scanning for. Replies are OFF: this thread's rows have nowhere to store a parent, and a Reply that silently posts at the bottom teaches people not to trust the button, so the control is not offered at all. And the composer is capped at 280 characters - the count stays out of the way until the last tenth of the allowance, then turns red and holds the Submit. It does NOT truncate what you type: paste six paragraphs in and every word is still there, refused rather than quietly cut, because a paste that loses its second half loses it invisibly."
			title="Titles, a cap, and no replies"
		>
			<Frame>
				<AppCommentSection
					allowsReplies={false}
					comments={[...toComments(DESK_SEEDS, base, "desk"), ...posted]}
					currentUser={{ ...YOU, title: "Requestor" }}
					data-cy="comments-desk"
					heading="Discussion"
					maxLength={280}
					onSubmit={async ({ body }) => {
						await delay(400);
						setPosted((current) => [
							...current,
							{
								author: { ...YOU, title: "Requestor" },
								body,
								createdAt: new Date(),
								id: `desk-posted-${current.length}`,
							},
						]);
					}}
					threadId="lab-desk"
				/>
			</Frame>
		</LabSection>
	);
}

const OLDER_SEEDS: Seed[] = [
	{
		author: BEN,
		body: "Opening this up so the night desk has somewhere to put the handover notes.",
		offset: 9 * DAY,
	},
	{
		author: ARIA,
		body: "Noted. I will keep the reconciliation thread separate from this one.",
		offset: 8 * DAY,
	},
	{
		author: BERNARD,
		body: "Same here - anything about the permit renewal goes on the warehouse record, not here.",
		offset: 7 * DAY,
	},
];

/** History arriving above the fold, without moving what is being read. */
function HistorySection() {
	const base = useLabClock();
	const [hasEarlier, setHasEarlier] = useState(true);
	const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);

	const earlier = hasEarlier ? [] : toComments(OLDER_SEEDS, base, "older");

	return (
		<LabSection
			description="A long thread paginates UPWARD: the recent comments are visible by default and the history is one press away at the top. Loading it holds scroll position rather than jumping - prepending grows the list upward and pushes everything below it down, so the component measures the list's bottom edge before and after and scrolls by the difference. The same words stay under the same pixel."
			title="Earlier comments"
		>
			<Frame>
				<AppCommentSection
					comments={[...earlier, ...toComments(THREAD_SEEDS, base, "history")]}
					currentUser={YOU}
					earlierCount={hasEarlier ? OLDER_SEEDS.length : 0}
					heading="Discussion"
					isLoadingEarlier={isLoadingEarlier}
					mentionables={DIRECTORY}
					onLoadEarlier={() => {
						setIsLoadingEarlier(true);
						setTimeout(() => {
							setHasEarlier(false);
							setIsLoadingEarlier(false);
						}, 700);
					}}
					onSubmit={() => {}}
					threadId="lab-history"
				/>
			</Frame>
		</LabSection>
	);
}

const LONG_BODY = `We reopened order #ORD-25841 for the night desk after the quantity was revised upward from 4 pallets to 6, which pushed the original allocation outside the warehouse's capacity window.

The two warehouses already confirmed were kept. The remaining two slots were reopened to the 25km radius and the SMS batch went out at 14:12 - no warehouse was contacted twice, and the dedupe log is on the reconciliation record if anyone wants to check it.

One thing worth flagging for next time: the revision came in over the phone rather than through the portal, so the audit trail starts at our end rather than at the warehouse's. @Ben Cortez is that something the intake form can capture, or does it need a separate route? Not urgent - Friday is fine.

Reference for whoever picks this up: https://example.com/ops/requests/ORD-25841 and the older thread at https://example.com/ops/requests/ORD-25702, which is the one that expired.`;

const CONTENT_SEEDS: Seed[] = [
	{ author: JOSEFA, body: LONG_BODY, offset: 40 * MINUTE },
	{
		author: BEN,
		body: "Short answer: yes, but not before the next release. @Josefa Ramos I will put it on the intake backlog with your name on it.",
		offset: 20 * MINUTE,
		parentIndex: 0,
	},
	{
		author: ARIA,
		body: "Email me at aria.chen@example.com if it slips - and no, typing that address did not open the mention menu, which is the point.",
		offset: 8 * MINUTE,
		parentIndex: 0,
	},
];

/** The content that breaks the row. */
function ContentSection() {
	const base = useLabClock();
	const comments = toComments(CONTENT_SEEDS, base, "content");

	return (
		<LabSection
			description="A comment long enough to fold, a URL that has to stay clickable, an edited comment keeping its original stamp, and a deleted one that had replies. Long bodies clamp at about eight lines with Show more - measured, not counted, because the same paragraph is six lines on a desktop and fourteen on a phone. A deleted comment with replies under it leaves a tombstone rather than vanishing: the answers stop making sense without something to answer."
			title="Long content, links and tombstones"
		>
			<Frame>
				<AppCommentSection
					comments={[
						...comments,
						{
							author: BERNARD,
							body: "This one was deleted.",
							createdAt: new Date(base - 30 * MINUTE),
							id: "content-tombstone",
							isDeleted: true,
						},
						{
							author: ARIA,
							body: "@Bernard Sy answered here, which is why the node above stays put.",
							createdAt: new Date(base - 25 * MINUTE),
							id: "content-tombstone-reply",
							parentId: "content-tombstone",
						},
					]}
					currentUser={YOU}
					heading="Discussion"
					mentionables={DIRECTORY}
					onSubmit={() => {}}
					threadId="lab-content"
				/>
			</Frame>
		</LabSection>
	);
}

/** The two states that are not a conversation. */
function StatesSection() {
	return (
		<LabSection
			description="Loading is skeleton comments at the real row height with the avatar circle already drawn, so nothing jumps when the thread lands. Empty is a sentence AND the composer - never a bare box, because the one thing a reader can do with an empty thread is start it."
			title="Loading and empty"
		>
			<div className="grid gap-4 lg:grid-cols-2">
				<Frame>
					<AppCommentSection
						comments={[]}
						currentUser={YOU}
						heading="Discussion"
						isLoading
						onSubmit={() => {}}
						threadId="lab-loading"
					/>
				</Frame>
				<Frame>
					<AppCommentSection
						comments={[]}
						currentUser={YOU}
						heading="Discussion"
						mentionables={DIRECTORY}
						onSubmit={() => {}}
						threadId="lab-empty"
					/>
				</Frame>
			</div>
		</LabSection>
	);
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
