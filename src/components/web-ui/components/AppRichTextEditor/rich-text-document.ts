import { z } from "zod";

/**
 * WHAT IS ALLOWED IN A STORED DOCUMENT, and the whole safety argument for
 * keeping rich text as JSON rather than as HTML.
 *
 * A document that parses against this schema can only contain nodes and marks
 * named here. That is what makes a paste out of Word or Google Docs safe: the
 * font tags, colours, classes and inline styles it carries have nowhere to land,
 * so they are dropped on the way in rather than sanitised on the way out. There
 * is no second list to keep in step - `RICH_TEXT_EXTENSIONS` builds the editor
 * from the same set, and `AppRichTextContent` renders with it.
 *
 * Adding a node type here is a data-format decision, not a UI one. Every
 * document already in the database was written under the old list.
 */

/**
 * Heading levels the editor offers.
 *
 * Four, not three. A long post genuinely reaches a fourth level, and a level the
 * schema does not name is a document that fails validation at save time - so
 * this list and the dropdown that writes it must move together.
 */
export const HEADING_LEVELS = [1, 2, 3, 4] as const;

/**
 * Alignments that may be stored.
 *
 * `left` is deliberately absent. It is the default, so writing it doubles the
 * attrs on every ordinary paragraph for no information and makes "did the author
 * align this?" unanswerable. Choosing left CLEARS the attribute.
 */
export const ALLOWED_TEXT_ALIGNMENTS = ["center", "right", "justify"] as const;

/**
 * Link protocols that may be stored.
 *
 * `javascript:` and `data:` are the two that turn a link into a script, and an
 * allowlist is the only form of this check that stays correct - a denylist is a
 * list of the tricks someone had already thought of.
 */
export const ALLOWED_LINK_PROTOCOLS = ["http", "https", "mailto", "tel"] as const;

/** A serialised document past this is a request body nobody budgeted for. */
export const MAX_DOCUMENT_BYTES = 512 * 1024;

/**
 * Deep nesting is cheap to type and expensive to render, and a list nested
 * forty deep is never a real post.
 */
export const MAX_NODE_DEPTH = 12;

const linkHrefSchema = z.string().refine(
	(href) => {
		try {
			/*
			 * Parsed rather than pattern-matched. `java\tscript:alert(1)` passes a
			 * naive regex and is still a script URL once the browser has stripped the
			 * control character; the URL parser does that normalisation for us.
			 */
			const protocol = new URL(href, "https://example.invalid").protocol.replace(":", "");
			return (ALLOWED_LINK_PROTOCOLS as readonly string[]).includes(protocol);
		} catch {
			return false;
		}
	},
	`Links must use one of: ${ALLOWED_LINK_PROTOCOLS.join(", ")}`,
);

const markSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("bold") }),
	z.object({ type: z.literal("italic") }),
	z.object({ type: z.literal("underline") }),
	z.object({ type: z.literal("strike") }),
	z.object({ type: z.literal("code") }),
	/*
	 * Highlight carries NO colour attribute, on purpose. A palette puts
	 * presentation in the document - the same objection that keeps text colour
	 * out - and a colour picked in one theme is the one that vanishes in the
	 * other. One mark meaning "marked", rendered from the theme.
	 */
	z.object({ type: z.literal("highlight") }),
	z.object({ type: z.literal("superscript") }),
	z.object({ type: z.literal("subscript") }),
	z.object({
		attrs: z.object({
			href: linkHrefSchema,
			target: z.string().nullable().optional(),
			rel: z.string().nullable().optional(),
			class: z.string().nullable().optional(),
		}),
		type: z.literal("link"),
	}),
]);

/**
 * Protocols an image may be loaded from.
 *
 * `data:` is deliberately absent. A pasted screenshot arrives as a data URL of
 * a megabyte or more, and inlining that into the document puts the whole image
 * inside the JSON column - the size cap below would reject the post, and the
 * author would be told their four-paragraph article is too long.
 */
export const ALLOWED_IMAGE_PROTOCOLS = ["http", "https"] as const;

/** Every node type the editor can produce, and nothing else. */
export const ALLOWED_NODE_TYPES = [
	"paragraph",
	"text",
	"heading",
	"bulletList",
	"orderedList",
	"listItem",
	"blockquote",
	"codeBlock",
	"horizontalRule",
	"hardBreak",
	"image",
] as const;

interface RichTextNode {
	type: (typeof ALLOWED_NODE_TYPES)[number];
	attrs?: Record<string, unknown>;
	content?: RichTextNode[];
	marks?: z.infer<typeof markSchema>[];
	text?: string;
}

const nodeSchema: z.ZodType<RichTextNode> = z.lazy(() =>
	z
		.object({
			attrs: z.record(z.string(), z.unknown()).optional(),
			content: z.array(nodeSchema).optional(),
			marks: z.array(markSchema).optional(),
			text: z.string().optional(),
			type: z.enum(ALLOWED_NODE_TYPES),
		})
		.superRefine((node, ctx) => {
			if (node.type !== "image") return;

			const src = node.attrs?.src;
			if (typeof src !== "string" || !isAllowedImageSrc(src)) {
				ctx.addIssue({
					code: "custom",
					message: `Images must be an ${ALLOWED_IMAGE_PROTOCOLS.join(" or ")} address`,
					path: ["attrs", "src"],
				});
			}

			/*
			 * ALT TEXT IS REQUIRED, and this is the only place that can enforce it.
			 * An image with no alt is invisible to a screen reader and to anyone on
			 * a connection where it fails to load - which on a blog is a paragraph
			 * of the argument silently missing. Empty string is allowed ONLY as the
			 * explicit "this is decorative" signal, which is why the check is for
			 * the key existing rather than for a truthy value.
			 */
			if (typeof node.attrs?.alt !== "string") {
				ctx.addIssue({
					code: "custom",
					message: "Images need alt text - use an empty string only for a decorative image",
					path: ["attrs", "alt"],
				});
			}
		}),
);

function isAllowedImageSrc(src: string): boolean {
	try {
		const protocol = new URL(src).protocol.replace(":", "");
		return (ALLOWED_IMAGE_PROTOCOLS as readonly string[]).includes(protocol);
	} catch {
		return false;
	}
}

/**
 * The stored shape. Always a `doc` root - a bare array or a naked paragraph is
 * a document that came from somewhere other than this editor.
 */
export const RichTextDocumentSchema = z
	.object({
		content: z.array(nodeSchema).optional(),
		type: z.literal("doc"),
	})
	.superRefine((document, ctx) => {
		if (depthOf(document as RichTextNodeLike) > MAX_NODE_DEPTH) {
			ctx.addIssue({
				code: "custom",
				message: `Content is nested more than ${MAX_NODE_DEPTH} levels deep`,
			});
		}

		/*
		 * Measured in BYTES, not characters. A post of emoji and accented text is
		 * several times its own length once encoded, and the limit that matters is
		 * the one the database column and the request body actually see.
		 */
		const bytes = new TextEncoder().encode(JSON.stringify(document)).length;
		if (bytes > MAX_DOCUMENT_BYTES) {
			ctx.addIssue({
				code: "custom",
				message: `Content is ${Math.round(bytes / 1024)}KB, over the ${Math.round(MAX_DOCUMENT_BYTES / 1024)}KB limit`,
			});
		}
	});

export type RichTextDocument = z.infer<typeof RichTextDocumentSchema>;

interface RichTextNodeLike {
	content?: RichTextNodeLike[];
	text?: string;
	type?: string;
}

function depthOf(node: RichTextNodeLike): number {
	if (!node.content || node.content.length === 0) return 1;
	return 1 + Math.max(...node.content.map(depthOf));
}

/**
 * The empty document, which is NOT `null` and not `{}`.
 *
 * Tiptap represents "nothing typed" as a doc holding one empty paragraph, and
 * that object is truthy - so a required check written as `if (!value)` passes on
 * an empty editor and lets a blank post through. Use `isEmptyDocument`.
 */
export const EMPTY_RICH_TEXT_DOCUMENT: RichTextDocument = {
	content: [{ type: "paragraph" }],
	type: "doc",
};

/**
 * Whether the document says anything.
 *
 * Whitespace-only counts as empty: a paragraph holding three spaces is not an
 * answer to a required field, and treating it as one is how a blank post gets
 * published.
 */
export function isEmptyDocument(document: RichTextDocument | null | undefined): boolean {
	if (!document) return true;
	return textOf(document as RichTextNodeLike).trim() === "";
}

function textOf(node: RichTextNodeLike): string {
	if (typeof node.text === "string") return node.text;
	if (!node.content) return node.type === "horizontalRule" ? "-" : "";
	return node.content.map(textOf).join(" ");
}

/**
 * Minutes to read, at 200 words per minute - the figure every reading-time
 * estimate on the web uses, so a post reading "4 min" here matches what a reader
 * expects from one elsewhere.
 *
 * Floored at one minute. "0 min read" is not information.
 */
export function readingTimeMinutes(words: number): number {
	return Math.max(1, Math.ceil(words / 200));
}
