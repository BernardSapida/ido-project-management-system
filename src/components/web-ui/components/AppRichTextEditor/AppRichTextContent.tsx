import { EditorContent, useEditor } from "@tiptap/react";
import { useMemo } from "react";
import { cn } from "../../lib/cn";
import type { RichTextDocument } from "./rich-text-document";
import { isEmptyDocument, RichTextDocumentSchema } from "./rich-text-document";
import { buildRichTextExtensions } from "./rich-text-extensions";

interface AppRichTextContentProps {
	className?: string;
	"data-cy"?: string;
	/** The stored document. A DOCUMENT, never an HTML string. */
	document: RichTextDocument | null | undefined;
	/** Shown when the body is empty. Omit it and an empty body renders nothing. */
	emptyText?: string;
}

/**
 * Renders a saved document for reading.
 *
 * ## Why this exists rather than a `dangerouslySetInnerHTML`
 *
 * It is the second half of the reason nothing is stored as HTML. The document
 * is rendered by the SAME extension set that produced it, so the only markup
 * that can ever reach the page is markup those extensions know how to make. A
 * node that arrived in the database from anywhere else - a bad migration, a
 * hand-written row, a compromised import - has nothing to render it into and is
 * dropped, rather than being handed to the browser as markup nobody vetted.
 *
 * That property is lost the instant someone gives this an HTML string or reaches
 * for `dangerouslySetInnerHTML` to "simplify" it. There is no sanitiser here
 * because there is nothing to sanitise, and that is the design.
 *
 * ## IT VALIDATES BEFORE IT RENDERS
 *
 * ProseMirror's `Node.fromJSON` THROWS on a node type its schema does not know.
 * Unguarded, that means one bad row takes down the whole article page - a blank
 * screen rather than a missing paragraph - and it is the failure most likely to
 * happen long after this code was written: a document saved by a NEWER editor,
 * carrying a node type this deployment has never heard of, is exactly what a
 * staged rollout produces.
 *
 * So the document is parsed against `RichTextDocumentSchema` first. A body that
 * does not parse renders as a stated problem in place of the text, and the rest
 * of the page - title, byline, comments - survives.
 *
 * ## Why an editor instance, not a renderer
 *
 * `editable: false`. Tiptap can render a document to a static string, but that
 * path uses a separate code path from the editor's and the two can disagree
 * about an edge case - which is the one thing this component exists to rule out.
 * The cost is an editor instance; the benefit is that what the reader sees is
 * produced by the same machinery the author used.
 */
export function AppRichTextContent({ className, "data-cy": dataCy, document, emptyText }: AppRichTextContentProps) {
	/*
	 * Parsed once per document, not per render. `safeParse` rather than `parse`,
	 * because the whole point is that a bad document is a state to render rather
	 * than an exception to throw.
	 */
	const parsed = useMemo(() => (document ? RichTextDocumentSchema.safeParse(document) : null), [document]);
	const content = parsed?.success ? (parsed.data as RichTextDocument) : null;

	const editor = useEditor(
		{
			content,
			editable: false,
			// Tiptap builds against the DOM. Rendering it during SSR produces a
			// hydration mismatch, so the server sends nothing and the client fills
			// it in - see the same flag in AppRichTextEditor.
			immediatelyRender: false,
			// A reader clicks a link to follow it. The editor turns this off because
			// there a click is how you reach the words to change them.
			extensions: buildRichTextExtensions({ openLinksOnClick: true }),
		},
		[content],
	);

	if (document && parsed && !parsed.success) {
		/*
		 * Said, not swallowed, and not thrown. The reader gets a sentence where the
		 * body should be and the page keeps its title, byline and comments; the
		 * developer gets the schema's own message, which names the offending path.
		 */
		return (
			<p
				className={cn("text-sm text-muted", className)}
				data-cy={dataCy}
				data-invalid-document="true"
			>
				This content cannot be displayed - it was saved in a format this page does not recognise.
			</p>
		);
	}

	if (!document || isEmptyDocument(document)) {
		return emptyText ? (
			<p
				className={cn("text-sm text-muted", className)}
				data-cy={dataCy}
				data-empty="true"
			>
				{emptyText}
			</p>
		) : null;
	}

	return (
		/* `rich-text--reading` is what caps the column at 68ch. It is on the READ
		   side only: while editing, what you align against has to be the box you
		   can see, or right-aligned text stops short of the editor's own edge. */
		<EditorContent
			className={cn("rich-text rich-text--reading", className)}
			data-cy={dataCy}
			editor={editor}
		/>
	);
}
