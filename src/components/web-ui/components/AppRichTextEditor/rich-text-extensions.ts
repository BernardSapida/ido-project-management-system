import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { ALLOWED_LINK_PROTOCOLS, HEADING_LEVELS } from "./rich-text-document";
import { RichTextSearch } from "./rich-text-search";

/**
 * ONE extension set, built once and used by both sides.
 *
 * The editor and `AppRichTextContent` must agree exactly, because the renderer
 * is the second half of the promise the schema makes: a document can only hold
 * what this set produces, and can only be rendered by the same set - so a node
 * that somehow reached the database from anywhere else has nothing to render it
 * into. Two lists that drift is how markup nobody vetted ends up on a page.
 */
interface RichTextExtensionOptions {
	/**
	 * Whether clicking a link follows it.
	 *
	 * `false` while EDITING, because clicking a link is how you put the caret
	 * inside it to change the words - navigating away instead would lose a
	 * half-written post, and the hover panel is the way to open one. `true` when
	 * READING, where following the link is the only thing a reader wants from it.
	 */
	openLinksOnClick?: boolean;
	placeholder?: string;
}

export function buildRichTextExtensions({ openLinksOnClick = false, placeholder }: RichTextExtensionOptions = {}) {
	return [
		StarterKit.configure({
			/*
			 * StarterKit ships the markdown input rules with these - `## ` for a
			 * heading, `- ` for a bullet, `> ` for a quote, ``` for a code block -
			 * and they are most of why this editor is usable without the toolbar.
			 * They are on by default; the note is here so nobody "tidies up" by
			 * configuring them off.
			 */
			heading: { levels: [...HEADING_LEVELS] },
			link: {
				/*
				 * The editor half of the URL rule the schema enforces. Both are
				 * needed: this stops a bad link being typed, the schema stops one
				 * arriving from anywhere else.
				 */
				protocols: [...ALLOWED_LINK_PROTOCOLS],
				// A pasted link should wrap the selection rather than replace it.
				linkOnPaste: true,
				openOnClick: openLinksOnClick,
				HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
			},
		}),

		/*
		 * Straight quotes to curly, `--` to an em dash, `...` to an ellipsis. The
		 * difference between a textarea and something that publishes prose.
		 *
		 * It does NOT fire inside code - Tiptap's input-rule plugin refuses to run
		 * in a node whose spec is `code: true`, which covers both `codeBlock` and
		 * inline code. That is what stops a code sample being silently corrupted
		 * into something that will not run when the reader copies it.
		 */
		Typography,

		/*
		 * `multicolor: false` is the whole configuration. With it on, the mark
		 * carries a `data-color` and the document starts storing presentation -
		 * see the note beside the highlight mark in rich-text-document.ts.
		 */
		Highlight.configure({ multicolor: false }),

		Superscript,
		Subscript,

		/*
		 * Alignment is an ATTRIBUTE on the block, not a wrapper, so it applies to
		 * the nodes that can carry it and nothing else. Lists are excluded on
		 * purpose: aligning a list moves the bullets away from the text and
		 * produces something no reader wants and no style guide asks for.
		 */
		TextAlign.configure({ types: ["heading", "paragraph"] }),

		/*
		 * `allowBase64: false` is the load-bearing option. A pasted screenshot
		 * arrives as a data URL of a megabyte or more, and inlining that would put
		 * the whole image inside the JSON column - the document's size cap would
		 * then reject a four-paragraph post and blame its length.
		 *
		 * Images are therefore by URL. Uploading them needs a place to put them,
		 * which is an api this slice does not have.
		 */
		Image.configure({ allowBase64: false, inline: false }),

		RichTextSearch,

		CharacterCount,

		Placeholder.configure({
			placeholder: placeholder ?? "Write something, or press / for blocks",
			// The empty node this shows on is the caret's own, not every empty
			// paragraph in the document - otherwise a post with spacing between
			// sections is a wall of repeated placeholder text.
			showOnlyCurrent: true,
		}),
	];
}
