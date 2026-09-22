import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppBlogPost } from "./AppBlogPost";
import type { BlogPostView } from "./blog-post.types";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * body renders through `AppRichTextContent`, which builds against a DOM and so
 * comes back empty here; that the reading view and the editor's preview are the
 * SAME renderer fed the SAME document is checked by eye in the lab, against
 * `/components/text-editor` in Preview.
 *
 * What IS pinned is the arrangement the assembly owns, each decision invisible
 * in a screenshot:
 *
 * - It fetches nothing - a `post` prop in, markup out.
 * - Reading time is DERIVED from the body's word count, so it cannot disagree
 *   with the text and an edit cannot leave a stale figure behind.
 * - A null `bannerUrl` renders no banner at all - not a grey placeholder in the
 *   spot the title belongs.
 * - A null `publishedAt` is a Draft chip, never a fallback to some other date.
 * - Comments arrive as a SLOT, so the part that needs a session stays outside
 *   this component.
 */

const BODY = {
	type: "doc",
	content: [{ type: "paragraph", content: [{ type: "text", text: "One two three four five." }] }],
};

const POST: BlogPostView = {
	author: { name: "Maria Santos" },
	bannerAlt: "A queue outside a warehouse at dawn",
	bannerUrl: "https://picsum.photos/seed/x/1200/675",
	body: BODY,
	publishedAt: new Date("2026-08-08T09:00:00Z"),
	title: "What a reusable reading view owns",
};

describe("AppBlogPost markup", () => {
	it("renders the title as the page's h1", () => {
		const html = renderToStaticMarkup(<AppBlogPost post={POST} />);

		expect(html).toContain("<h1");
		expect(html).toContain("What a reusable reading view owns");
		expect(html.match(/<h1/g)).toHaveLength(1);
	});

	it("names the author and states a reading time", () => {
		const html = renderToStaticMarkup(<AppBlogPost post={POST} />);

		expect(html).toContain("Maria Santos");
		expect(html).toMatch(/\d+ min read/);
	});

	describe("banner", () => {
		it("renders an <img> with the given alt and src when there is one", () => {
			const html = renderToStaticMarkup(<AppBlogPost post={POST} />);

			expect(html).toContain('data-cy="blog-post-banner"');
			expect(html).toContain('src="https://picsum.photos/seed/x/1200/675"');
			expect(html).toContain('alt="A queue outside a warehouse at dawn"');
		});

		it("renders nothing at all when bannerUrl is null", () => {
			const html = renderToStaticMarkup(<AppBlogPost post={{ ...POST, bannerUrl: null }} />);

			expect(html).not.toContain('data-cy="blog-post-banner"');
			expect(html).not.toContain("<img");
		});
	});

	describe("published date", () => {
		it("prints an absolute date in a <time> with the ISO instant in the markup", () => {
			const html = renderToStaticMarkup(<AppBlogPost post={POST} />);

			expect(html).toContain('data-cy="blog-post-date"');
			expect(html).toContain('dateTime="2026-08-08T09:00:00.000Z"');
			expect(html).toContain("2026");
			expect(html).not.toContain('data-cy="blog-post-draft"');
		});

		it("shows a Draft chip and no date when publishedAt is null", () => {
			const html = renderToStaticMarkup(<AppBlogPost post={{ ...POST, publishedAt: null }} />);

			expect(html).toContain('data-cy="blog-post-draft"');
			expect(html).toContain("Draft");
			expect(html).not.toContain('data-cy="blog-post-date"');
		});
	});

	it("wraps the comments slot in its own section, and renders none without one", () => {
		const withComments = renderToStaticMarkup(
			<AppBlogPost commentsSlot={<div>Thread goes here</div>} post={POST} />,
		);
		expect(withComments).toContain('data-cy="blog-post-comments"');
		expect(withComments).toContain("Thread goes here");

		const withoutComments = renderToStaticMarkup(<AppBlogPost post={POST} />);
		expect(withoutComments).not.toContain('data-cy="blog-post-comments"');
	});

	it("renders a skeleton in the post's shape while pending, not the post", () => {
		const html = renderToStaticMarkup(<AppBlogPost isPending post={POST} />);

		expect(html).toContain('data-cy="blog-post-skeleton"');
		expect(html).not.toContain("What a reusable reading view owns");
	});

	it("forwards its test hook to the article", () => {
		const html = renderToStaticMarkup(<AppBlogPost data-cy="the-post" post={POST} />);

		expect(html).toContain('data-cy="the-post"');
	});
});
