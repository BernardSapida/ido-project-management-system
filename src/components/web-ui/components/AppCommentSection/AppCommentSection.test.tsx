import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppCommentSection } from "./AppCommentSection";
import type { CommentItem, CommentPerson } from "./AppCommentSection";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. So the
 * behaviours this component exists FOR are exercised in the lab and not here:
 * that a failed post keeps its words with a Retry, that a per-thread draft
 * survives navigating away, that the @ menu opens on a word boundary, that a
 * vote flips optimistically. `useTickingClock` returns null on the server, so
 * every timestamp below is the absolute UTC form the clock has not yet replaced.
 *
 * What IS pinned is the structure a caller depends on and cannot see move:
 *
 * - The thread is rendered in the order it was PASSED. The component never
 *   re-sorts - newest-first is `AppTimeline`, not this.
 * - One level of nesting, always. A reply to a reply is re-parented onto the
 *   top-level comment; nothing renders at depth 2.
 * - A deleted comment with replies stays as a tombstone, or the answers
 *   underneath it are talking to nobody.
 * - Each comment's `aria-label` carries the author and the time, and says which
 *   one is YOURS in a word rather than leaving it to be read off the name.
 * - Empty is a sentence and a composer, never a bare box.
 */

const ME: CommentPerson = { handle: "me", id: "u1", name: "Me" };
const ANA: CommentPerson = { handle: "ana", id: "u2", name: "Ana Reyes" };
const BEN: CommentPerson = { handle: "ben", id: "u3", name: "Ben Cruz" };

function comment(over: Partial<CommentItem> & Pick<CommentItem, "id" | "author" | "body">): CommentItem {
	return { createdAt: new Date("2026-01-01T00:00:00Z"), ...over };
}

const noop = () => undefined;

describe("AppCommentSection markup", () => {
	it("renders the heading, its count, and every comment body", () => {
		const html = renderToStaticMarkup(
			<AppCommentSection
				comments={[
					comment({ author: ANA, body: "First comment.", id: "c1" }),
					comment({ author: BEN, body: "Second comment.", id: "c2" }),
				]}
				currentUser={ME}
				onSubmit={noop}
				threadId="t1"
			/>,
		);

		expect(html).toContain("Comments");
		expect(html).toContain(">2<");
		expect(html).toContain("First comment.");
		expect(html).toContain("Second comment.");
	});

	it("takes the heading level a caller passes", () => {
		const h4 = renderToStaticMarkup(
			<AppCommentSection
				comments={[comment({ author: ANA, body: "Hi.", id: "c1" })]}
				currentUser={ME}
				headingLevel={4}
				onSubmit={noop}
				threadId="t1"
			/>,
		);

		expect(h4).toContain("<h4");
		expect(h4).not.toContain("<h2");
	});

	it("renders comments in the order they were passed - it never re-sorts", () => {
		const html = renderToStaticMarkup(
			<AppCommentSection
				comments={[
					comment({ author: ANA, body: "MARKER_THIRD", createdAt: new Date("2026-03-01T00:00:00Z"), id: "c3" }),
					comment({ author: BEN, body: "MARKER_FIRST", createdAt: new Date("2026-01-01T00:00:00Z"), id: "c1" }),
					comment({ author: ANA, body: "MARKER_SECOND", createdAt: new Date("2026-02-01T00:00:00Z"), id: "c2" }),
				]}
				currentUser={ME}
				onSubmit={noop}
				threadId="t1"
			/>,
		);

		expect(html.indexOf("MARKER_THIRD")).toBeLessThan(html.indexOf("MARKER_FIRST"));
		expect(html.indexOf("MARKER_FIRST")).toBeLessThan(html.indexOf("MARKER_SECOND"));
	});

	it("flattens a reply-to-a-reply onto the top-level comment - never depth 2", () => {
		const html = renderToStaticMarkup(
			<AppCommentSection
				comments={[
					comment({ author: ANA, body: "Root.", id: "a" }),
					comment({ author: BEN, body: "Reply to root.", id: "b", parentId: "a" }),
					comment({ author: ME, body: "Reply to the reply.", id: "c", parentId: "b" }),
				]}
				currentUser={ME}
				onSubmit={noop}
				threadId="t1"
			/>,
		);

		// One thread list plus exactly one replies list under the single root.
		expect(html.match(/<ul/g)).toHaveLength(2);
		expect(html.indexOf("Reply to root.")).toBeLessThan(html.indexOf("Reply to the reply."));
	});

	it("keeps a deleted comment as a tombstone so its replies still make sense", () => {
		const html = renderToStaticMarkup(
			<AppCommentSection
				comments={[
					comment({ author: ANA, body: "gone", id: "a", isDeleted: true }),
					comment({ author: BEN, body: "Still here.", id: "b", parentId: "a" }),
				]}
				currentUser={ME}
				onSubmit={noop}
				threadId="t1"
			/>,
		);

		expect(html).toContain("Comment deleted");
		expect(html).not.toContain("gone");
		expect(html).toContain("Still here.");
	});

	describe("the comment's accessible name", () => {
		it("carries the author and the time", () => {
			const html = renderToStaticMarkup(
				<AppCommentSection
					comments={[comment({ author: ANA, body: "Hi.", id: "c1" })]}
					currentUser={ME}
					onSubmit={noop}
					threadId="t1"
				/>,
			);

			expect(html).toMatch(/aria-label="Comment by Ana Reyes, [^"]+"/);
		});

		it("says which one is yours in a word", () => {
			const html = renderToStaticMarkup(
				<AppCommentSection
					comments={[comment({ author: ME, body: "Mine.", id: "c1" })]}
					currentUser={ME}
					onSubmit={noop}
					threadId="t1"
				/>,
			);

			expect(html).toMatch(/aria-label="Comment by Me, you, [^"]+"/);
		});
	});

	it("renders a sentence and a composer when the thread is empty", () => {
		const html = renderToStaticMarkup(
			<AppCommentSection comments={[]} currentUser={ME} onSubmit={noop} threadId="t1" />,
		);

		expect(html).toContain("No comments yet. Start the conversation below.");
		expect(html).toContain("<textarea");
	});

	it("forwards its test hook to the section", () => {
		const html = renderToStaticMarkup(
			<AppCommentSection
				comments={[]}
				currentUser={ME}
				data-cy="thread"
				onSubmit={noop}
				threadId="t1"
			/>,
		);

		expect(html).toContain('data-cy="thread"');
	});
});
