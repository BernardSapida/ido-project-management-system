import { describe, expect, it } from "vitest";
import {
	EMPTY_RICH_TEXT_DOCUMENT,
	isEmptyDocument,
	MAX_NODE_DEPTH,
	readingTimeMinutes,
	RichTextDocumentSchema,
} from "./rich-text-document";

/**
 * The editor itself is a Tiptap instance that only builds against a DOM, so what
 * gets pinned here is the part that outlives the widget: the STORED SHAPE. This
 * schema is the whole safety argument for keeping rich text as JSON rather than
 * HTML - a document that parses against it can only carry nodes and marks named
 * here, so a paste out of Word has nowhere to land its font tags and inline
 * styles. Adding a node type is a data-format decision every existing row is
 * bound by, which is why it has a test and the toolbar does not.
 */

/** A doc wrapping one paragraph of the given inline children. */
function docWith(...content: unknown[]) {
	return { type: "doc", content: [{ type: "paragraph", content }] };
}

describe("isEmptyDocument", () => {
	it("treats Tiptap's empty document - one empty paragraph - as empty", () => {
		// The reason the check is not `if (!value)`: this object is truthy.
		expect(isEmptyDocument(EMPTY_RICH_TEXT_DOCUMENT)).toBe(true);
	});

	it("treats null and undefined as empty", () => {
		expect(isEmptyDocument(null)).toBe(true);
		expect(isEmptyDocument(undefined)).toBe(true);
	});

	it("treats a paragraph of only whitespace as empty", () => {
		expect(isEmptyDocument(docWith({ type: "text", text: "   \n\t" }))).toBe(true);
	});

	it("is not empty once there is a word in it", () => {
		expect(isEmptyDocument(docWith({ type: "text", text: "Hello" }))).toBe(false);
	});
});

describe("readingTimeMinutes", () => {
	it("rounds up at 200 words per minute", () => {
		expect(readingTimeMinutes(200)).toBe(1);
		expect(readingTimeMinutes(201)).toBe(2);
		expect(readingTimeMinutes(1000)).toBe(5);
	});

	it("floors at one minute - '0 min read' is not information", () => {
		expect(readingTimeMinutes(0)).toBe(1);
		expect(readingTimeMinutes(12)).toBe(1);
	});
});

describe("RichTextDocumentSchema", () => {
	it("accepts a plain document and the empty one", () => {
		expect(RichTextDocumentSchema.safeParse(EMPTY_RICH_TEXT_DOCUMENT).success).toBe(true);
		expect(RichTextDocumentSchema.safeParse(docWith({ type: "text", text: "A post." })).success).toBe(true);
	});

	it("requires a `doc` root - a bare array or a naked paragraph is not one", () => {
		expect(RichTextDocumentSchema.safeParse({ type: "paragraph" }).success).toBe(false);
		expect(RichTextDocumentSchema.safeParse([{ type: "paragraph" }]).success).toBe(false);
	});

	it("rejects a node type it does not name", () => {
		const withIframe = { type: "doc", content: [{ type: "iframe", attrs: { src: "https://evil.example" } }] };

		expect(RichTextDocumentSchema.safeParse(withIframe).success).toBe(false);
	});

	describe("links", () => {
		it("keeps http, https, mailto and tel", () => {
			for (const href of ["https://example.com", "http://example.com", "mailto:a@b.co", "tel:+15551234"]) {
				const doc = docWith({ marks: [{ type: "link", attrs: { href } }], text: "link", type: "text" });
				expect(RichTextDocumentSchema.safeParse(doc).success, href).toBe(true);
			}
		});

		it("rejects a javascript: URL, control characters and all", () => {
			for (const href of ["javascript:alert(1)", "java\tscript:alert(1)", "data:text/html,<script>"]) {
				const doc = docWith({ marks: [{ type: "link", attrs: { href } }], text: "x", type: "text" });
				expect(RichTextDocumentSchema.safeParse(doc).success, href).toBe(false);
			}
		});
	});

	describe("images", () => {
		it("requires an http or https src", () => {
			const dataUrl = { type: "doc", content: [{ type: "image", attrs: { alt: "", src: "data:image/png;base64,AAAA" } }] };
			const httpUrl = { type: "doc", content: [{ type: "image", attrs: { alt: "A chart", src: "https://cdn.example/c.png" } }] };

			expect(RichTextDocumentSchema.safeParse(dataUrl).success).toBe(false);
			expect(RichTextDocumentSchema.safeParse(httpUrl).success).toBe(true);
		});

		it("requires the alt key to exist - an empty string is the only 'decorative' signal", () => {
			const noAlt = { type: "doc", content: [{ type: "image", attrs: { src: "https://cdn.example/c.png" } }] };
			const emptyAlt = { type: "doc", content: [{ type: "image", attrs: { alt: "", src: "https://cdn.example/c.png" } }] };

			expect(RichTextDocumentSchema.safeParse(noAlt).success).toBe(false);
			expect(RichTextDocumentSchema.safeParse(emptyAlt).success).toBe(true);
		});
	});

	it("rejects a document nested past the depth cap", () => {
		let node: Record<string, unknown> = { type: "paragraph", content: [{ type: "text", text: "deep" }] };
		for (let i = 0; i < MAX_NODE_DEPTH + 2; i += 1) {
			node = { type: "blockquote", content: [node] };
		}

		expect(RichTextDocumentSchema.safeParse({ type: "doc", content: [node] }).success).toBe(false);
	});
});
