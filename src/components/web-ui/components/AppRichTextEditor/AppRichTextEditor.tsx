import { Description, Label } from "@heroui/react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { Clock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";
import type { UploadHandler } from "../AppFileUpload";
import { cn } from "../../lib/cn";
import { AppRichTextContent } from "./AppRichTextContent";
import { RichTextBubbleMenu } from "./RichTextBubbleMenu";
import { RichTextFindBar } from "./RichTextFindBar";
import { RichTextImageDialog } from "./RichTextImageDialog";
import { RichTextLinkDialog } from "./RichTextLinkDialog";
import { RichTextLinkPreview, useLinkPreview } from "./RichTextLinkPreview";
import { RichTextSlashMenu, useSlashMenu } from "./RichTextSlashMenu";
import { RichTextToolbar } from "./RichTextToolbar";
import type { RichTextDocument } from "./rich-text-document";
import { EMPTY_RICH_TEXT_DOCUMENT, isEmptyDocument, readingTimeMinutes } from "./rich-text-document";
import { buildRichTextExtensions } from "./rich-text-extensions";
import { rejectImage, uploadImageFile } from "./rich-text-upload";

interface AppRichTextEditorProps<T extends FieldValues> {
	className?: string;
	control: Control<T>;
	"data-cy"?: string;
	/** Shown under the editor. For guidance, not for errors. */
	description?: string;
	isDisabled?: boolean;
	isReadOnly?: boolean;
	isRequired?: boolean;
	label: string;
	/**
	 * A cap on characters, for the column this ends up in.
	 *
	 * The footer states the character count either way - omitting this changes
	 * the reading from `403 / 180 characters` to plain `403 characters`, and
	 * takes away the over-limit state, not the number. A count that only appears
	 * once it matters appears at the worst moment: the author has already written
	 * past the limit before anything tells them there was one.
	 */
	maxCharacters?: number;
	name: Path<T>;
	placeholder?: string;
	/**
	 * Where an uploaded image goes.
	 *
	 * The same `UploadHandler` shape `AppFileUpload` takes, so an app that has an
	 * endpoint passes `xhrUpload("/api/uploads")` and is done - one upload
	 * contract, not two.
	 *
	 * OMIT IT and images are added by address only: the picker never appears, and
	 * dropping a file on the editor does nothing. That is the honest state for a
	 * project with no storage yet, and it is better than a drop zone that fails
	 * when used.
	 */
	uploadImage?: UploadHandler;
}

/**
 * The rich text field.
 *
 * ## Its value is a document, not a string
 *
 * `field.value` is a Tiptap document object, validated by
 * `RichTextDocumentSchema` before it is ever stored. Nothing here produces or
 * accepts HTML, which is what makes a paste out of Word safe: the schema names
 * every node and mark that may exist, and anything else has nowhere to land.
 *
 * ## Three ways to reach every control
 *
 * The toolbar is the least important of them, and is designed to be outgrown:
 *
 * 1. **Markdown input rules** - `## `, `- `, `1. `, `> `, ```` ``` ````, `**bold**`.
 *    Anyone who has written markdown anywhere else is productive immediately.
 * 2. **Keyboard shortcuts**, which each tooltip teaches.
 * 3. **The slash menu** for blocks, which is the one that scales - a toolbar
 *    grows a button per feature, a slash menu grows a searchable row.
 *
 * ## Required means "says something"
 *
 * Tiptap represents an empty editor as a doc holding one empty paragraph, which
 * is a truthy object. A required check written as `if (!value)` passes on it and
 * lets a blank post through, so the check is `isEmptyDocument`, and whitespace
 * counts as empty.
 *
 * ## Following the field contract
 *
 * Generic over `T extends FieldValues`, `useController` rather than `register`,
 * and `field.onBlur` wired. It fires `onBlur` after an EDIT as well as on the
 * real blur, for the same reason `AppCheckbox` and `AppSwitch` do: with
 * `mode: "onBlur"`, a field the user never tabs out of never validates, and an
 * author who fixes an empty editor should not have to click elsewhere to clear
 * the error.
 */
export function AppRichTextEditor<T extends FieldValues>({
	className,
	control,
	"data-cy": dataCy,
	description,
	isDisabled = false,
	isReadOnly = false,
	isRequired = false,
	label,
	maxCharacters,
	name,
	placeholder,
	uploadImage,
}: AppRichTextEditorProps<T>) {
	const {
		field,
		fieldState: { error, invalid },
	} = useController({ name, control });

	const [linkDialog, setLinkDialog] = useState<{ initialUrl: string } | null>(null);
	const [isFindOpen, setIsFindOpen] = useState(false);
	const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
	/*
	 * PREVIEW is view state, not document state - it changes nothing that gets
	 * stored, so it lives here rather than in the form. Leaving preview must
	 * return the exact document that went in, which is why it renders the same
	 * `value` rather than a copy taken when the toggle was pressed.
	 */
	const [isPreview, setIsPreview] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const value: RichTextDocument = field.value ?? EMPTY_RICH_TEXT_DOCUMENT;
	const valueJson = JSON.stringify(value);

	/**
	 * The last document this editor and the form agreed on, as JSON.
	 *
	 * It is what tells an EXTERNAL change apart from the echo of the editor's
	 * own edit coming back through form state, and it has to be a recorded fact
	 * rather than a comparison - see the effect below for why comparing the two
	 * documents cannot work.
	 */
	const agreedJsonRef = useRef<string | null>(null);

	const editor = useEditor({
		content: value,
		editable: !isDisabled && !isReadOnly,
		/*
		 * Tiptap builds against the DOM, so rendering it on the server produces a
		 * hydration mismatch - and the symptom is not a warning anybody notices, it
		 * is an editor that looks perfectly fine and will not accept a keystroke.
		 */
		immediatelyRender: false,
		extensions: buildRichTextExtensions({ placeholder }),
		/*
		 * DROP AND PASTE, but only when there is somewhere to put the bytes.
		 *
		 * Returning `false` hands the event back to ProseMirror, which is what
		 * keeps ordinary text drops and pastes working; returning `true` claims it.
		 * Without an `uploadImage` handler this never claims anything, so dropping
		 * an image behaves exactly as it did before - which is better than
		 * swallowing the drop and doing nothing visible with it.
		 */
		editorProps: {
			handleDrop: (_view, event) => {
				const file = (event as DragEvent).dataTransfer?.files?.[0];
				if (!file || !file.type.startsWith("image/") || !uploadImage) return false;
				event.preventDefault();
				void insertUploadedImage(file);
				return true;
			},
			handlePaste: (_view, event) => {
				const file = event.clipboardData?.files?.[0];
				if (!file || !file.type.startsWith("image/") || !uploadImage) return false;
				event.preventDefault();
				void insertUploadedImage(file);
				return true;
			},
		},
		onBlur: () => field.onBlur(),
		onUpdate: ({ editor: instance }) => {
			const json = instance.getJSON() as RichTextDocument;
			// Recorded BEFORE it is handed over, so the value coming back from the
			// form is recognised as this edit rather than as somebody else's.
			agreedJsonRef.current = JSON.stringify(json);
			field.onChange(json);
			/*
			 * Touched on edit, not only on blur. Without this a required editor the
			 * author fills in keeps its error until focus happens to leave, which
			 * reads as the fix not having worked.
			 */
			field.onBlur();
		},
	});

	/*
	 * The counts come from the editor's own storage, never from the length of the
	 * serialised JSON - that would count `{"type":"paragraph"}` as characters and
	 * tell an author their 200-word post is 4,000 characters long.
	 */
	const counts = useEditorState({
		editor,
		selector: ({ editor: instance }) => ({
			characters: instance?.storage.characterCount.characters() ?? 0,
			words: instance?.storage.characterCount.words() ?? 0,
		}),
		// Null until the editor exists, which on the SSR pass and the first client
		// frame it does not. Zero is the honest reading for an editor with no
		// document yet, and it keeps the hook above every early return.
	}) ?? { characters: 0, words: 0 };

	const slash = useSlashMenu(editor);
	const linkPreview = useLinkPreview(editor);

	/*
	 * EXTERNAL UPDATES ONLY, AND ONLY ONCE.
	 *
	 * Replacing content on every incoming value fights the person typing - the
	 * caret jumps to the start mid-word - so this has to fire on a genuine
	 * external change and on nothing else.
	 *
	 * IT CANNOT BE A COMPARISON BETWEEN THE TWO DOCUMENTS, which is what this
	 * was and why it looped. ProseMirror normalises what it is given: it fills in
	 * every attribute default the schema declares, so a hand-written
	 * `{ type: "heading", attrs: { level: 2 } }` comes back out of `getJSON()`
	 * carrying attributes the source never had. The two are the same document and
	 * never the same JSON, so the comparison said "different" forever - every
	 * pass set the content again, and once the slash menu started re-rendering on
	 * each transaction that became an infinite loop rather than merely wasted
	 * work.
	 *
	 * So the test is provenance, not equality: anything that does not match the
	 * document this editor last emitted came from outside, and only that is
	 * written back.
	 *
	 * In an effect, not in render. Setting editor content during render is a side
	 * effect in a phase React is allowed to run twice.
	 */
	useEffect(() => {
		if (!editor || editor.isDestroyed) return;
		if (valueJson === agreedJsonRef.current) return;
		agreedJsonRef.current = valueJson;
		editor.commands.setContent(JSON.parse(valueJson) as RichTextDocument, { emitUpdate: false });
	}, [editor, valueJson]);

	/**
	 * Uploads a dropped or pasted image and inserts it.
	 *
	 * ALT TEXT IS EMPTY HERE, and that is the one place this flow is weaker than
	 * the dialog: a drop cannot ask a question. The image is inserted with an
	 * empty alt and a notice saying so, rather than being silently published
	 * unlabelled - the author can then open it and say what it shows.
	 */
	async function insertUploadedImage(file: File) {
		if (!uploadImage || !editor) return;

		const rejection = rejectImage(file);
		if (rejection) {
			setUploadError(rejection.reason);
			return;
		}

		setUploadError(null);
		try {
			const src = await uploadImageFile(file, uploadImage, new AbortController().signal);
			editor.chain().focus().setImage({ alt: "", src }).run();
			setUploadError("Image added with no description - open it to say what it shows.");
		} catch (error_) {
			setUploadError(error_ instanceof Error ? error_.message : "The upload failed.");
		}
	}

	const openLinkDialog = useCallback(() => {
		if (!editor) return;
		setLinkDialog({ initialUrl: (editor.getAttributes("link").href as string) ?? "" });
	}, [editor]);

	if (!editor) {
		/*
		 * The server pass and the first client frame.
		 *
		 * It keeps the LABEL, not just a box of the right height. A skeleton that
		 * drops the label is a skeleton that does not match the layout it stands in
		 * for, so the field's name appears out of nowhere a frame later and the rest
		 * of the form shifts down - which reads as the page loading badly rather
		 * than as an editor arriving.
		 */
		return (
			<div className={cn("flex w-full flex-col gap-1.5", className)}>
				<span className="flex items-center gap-1.5 font-medium text-sm">
					{label}
					{isRequired ? (
						<span
							aria-hidden="true"
							className="text-danger"
						>
							*
						</span>
					) : null}
				</span>
				<div className="h-64 rounded-xl border border-border bg-surface" />
			</div>
		);
	}

	const isOverLimit = maxCharacters !== undefined && counts.characters > maxCharacters;

	return (
		<div className={cn("flex w-full flex-col gap-1.5", className)}>
			<Label
				className="flex items-center gap-1.5 font-medium text-sm"
				id={`${name}-label`}
			>
				{label}
				{isRequired ? (
					<>
						<span
							aria-hidden="true"
							className="text-danger"
						>
							*
						</span>
						<span className="sr-only">(required)</span>
					</>
				) : null}
			</Label>

			<div
				className={cn(
					"overflow-hidden rounded-xl border bg-surface transition",
					invalid ? "border-danger" : "border-border",
					isDisabled && "opacity-60",
				)}
				data-cy={dataCy}
				data-empty={isEmptyDocument(value)}
			>
				{!isReadOnly && (
					<RichTextToolbar
						editor={editor}
						isDisabled={isDisabled}
						isFindOpen={isFindOpen}
						isPreview={isPreview}
						onRequestImage={() => setIsImageDialogOpen(true)}
						onRequestLink={openLinkDialog}
						onToggleFind={() => setIsFindOpen((open) => !open)}
						onTogglePreview={() => setIsPreview((preview) => !preview)}
					/>
				)}

				{/* Under the toolbar, above the text. It belongs to the editor it
				    searches, and a panel laid over the words would hide the matches it
				    is counting. */}
				{!isReadOnly && isFindOpen && !isPreview && (
					<RichTextFindBar
						editor={editor}
						onClose={() => setIsFindOpen(false)}
					/>
				)}

				{/*
				 * PREVIEW swaps the editing surface for the read-side renderer - the
				 * same component the published post will use, fed the same document.
				 * That is the point: a preview drawn by different code is a preview
				 * that can disagree with the thing it is previewing.
				 *
				 * The editor stays MOUNTED underneath, hidden rather than unmounted,
				 * so leaving preview does not lose the undo history or the caret.
				 */}
				<div className={isPreview ? "hidden" : undefined}>
					<EditorContent
						aria-labelledby={`${name}-label`}
						className="rich-text min-h-48 px-4 py-3"
						editor={editor}
					/>
				</div>

				{isPreview ? (
					<div
						className="min-h-48 px-4 py-3"
						data-cy="rich-text-preview"
					>
						<AppRichTextContent document={value} />
					</div>
				) : null}

				{/*
				 * One line, and the order is the order a writer cares about: how long
				 * this takes to read, then how much they have written, then how much
				 * of the column they have used. Characters last because they are the
				 * storage fact rather than the writing one - but always present, so
				 * the number never appears out of nowhere at the moment it turns into
				 * a problem.
				 */}
				<div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted">
					{/* The glyph names the figure the way a unit would. Everything after
					    it is a count of something, and "1 min" alone reads as an elapsed
					    time rather than as a reading estimate. */}
					<Clock
						aria-hidden="true"
						className="size-3.5 shrink-0"
					/>
					<span data-cy="rich-text-reading-time">{readingTimeMinutes(counts.words)} min read</span>

					<Dot />
					<span data-cy="rich-text-word-count">
						{counts.words} {counts.words === 1 ? "word" : "words"}
					</span>

					<Dot />
					<span
						className={cn(isOverLimit && "font-medium text-danger")}
						data-cy="rich-text-character-count"
					>
						{maxCharacters === undefined
							? `${counts.characters} ${counts.characters === 1 ? "character" : "characters"}`
							: `${counts.characters} / ${maxCharacters} characters`}
						{/* The state is in WORDS as well as in colour - a red number
						    alone is silent to a colour-blind reader. */}
						{isOverLimit ? " - over the limit" : ""}
					</span>
				</div>
			</div>

			{/* Not while previewing. The selection menu is an editing affordance, and
			    the surface underneath it is not the editor at that point. */}
			{!isReadOnly && !isPreview && (
				<RichTextBubbleMenu
					editor={editor}
					onRequestLink={openLinkDialog}
				/>
			)}

			{!isReadOnly && slash.isOpen && (
				<RichTextSlashMenu
					activeIndex={slash.activeIndex}
					items={slash.items}
					onSelect={slash.select}
					state={slash.state}
				/>
			)}

			{/* Shown while READ-ONLY too. The editor sets `openOnClick: false`, so
			    without this there is no way to follow a link at all - and a
			    read-only post is precisely where following one is the point. */}
			<RichTextLinkPreview
				onEdit={() => {
					const { href, pos } = linkPreview.state ?? {};
					linkPreview.close();
					/*
					 * Put the caret in the link being edited BEFORE opening the dialog.
					 * Without this the edit lands wherever the caret happened to be -
					 * hovering never moved it - so a confirmed change either did nothing
					 * or linked a different word entirely.
					 */
					if (pos !== undefined) {
						editor.chain().focus().setTextSelection(pos).extendMarkRange("link").run();
					}
					// The href comes from the link that was hovered, not from a
					// selection lookup that may not have caught up yet.
					setLinkDialog({ initialUrl: href ?? "" });
				}}
				onMouseEnter={linkPreview.cancelHide}
				onMouseLeave={linkPreview.scheduleHide}
				onRemove={() => {
					const pos = linkPreview.state?.pos;
					if (pos !== undefined) {
						editor.chain().focus().setTextSelection(pos).extendMarkRange("link").unsetLink().run();
					}
					linkPreview.close();
				}}
				state={linkPreview.state}
			/>

			{description ? <Description className="text-muted text-xs">{description}</Description> : null}

			{/* Rendered directly, not through HeroUI's FieldError: this is not inside
			    a HeroUI field context, and a FieldError outside one renders nothing at
			    all - no warning, no fallback. The data-slot keeps the hook a spec can
			    select on. */}
			{error?.message ? (
				<p
					className="text-sm text-danger"
					data-slot="field-error"
				>
					{error.message}
				</p>
			) : null}

			{uploadError ? (
				<p
					className="text-sm text-muted"
					data-cy="rich-text-upload-notice"
				>
					{uploadError}
				</p>
			) : null}

			<RichTextImageDialog
				isOpen={isImageDialogOpen}
				onClose={() => setIsImageDialogOpen(false)}
				onConfirm={({ alt, src }) => {
					editor.chain().focus().setImage({ alt, src }).run();
					setIsImageDialogOpen(false);
				}}
				upload={uploadImage}
			/>

			{linkDialog ? (
				<RichTextLinkDialog
					initialUrl={linkDialog.initialUrl}
					isOpen
					onClose={() => setLinkDialog(null)}
					onConfirm={(url) => {
						editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
						setLinkDialog(null);
					}}
				/>
			) : null}
		</div>
	);
}

/**
 * The separator between footer figures.
 *
 * `aria-hidden`, because a screen reader announcing "one min read middle dot
 * sixty two words middle dot four hundred and three characters" is reading
 * punctuation aloud. The gap between the spans is what separates them for a
 * sighted reader; for anyone else the three counts are already three elements.
 */
function Dot() {
	return <span aria-hidden="true">·</span>;
}
