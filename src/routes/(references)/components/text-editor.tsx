import type { UploadHandler } from "@bernardsapida/web-ui";
import { AppAlert, AppButton, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import type { RichTextDocument } from "@bernardsapida/web-ui/rich-text";
import {
	AppRichTextContent,
	AppRichTextEditor,
	EMPTY_RICH_TEXT_DOCUMENT,
	isEmptyDocument,
	RichTextDocumentSchema,
} from "@bernardsapida/web-ui/rich-text";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Eraser, FileText, NotebookPen } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { seo } from "@/config/seo.config";

/**
 * Text editor lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The JSON mirror is the point of this page rather than decoration. Everything
 * else about a rich text editor can be judged by looking at it; the one thing
 * that cannot is what it will put in a database, and that is the thing that is
 * expensive to get wrong - a document format is a decision every row already
 * written is bound by. So the saved shape sits directly under the editor and
 * updates as you type.
 *
 * Four things to check by hand, none of which has a visual tell:
 *
 * 1. Type `## ` at the start of a line, then a word. It becomes a heading
 *    without the toolbar being touched. Same for `- `, `> ` and `**bold**`.
 * 2. Press `/` on an empty line. Arrow keys move, Enter inserts, Escape leaves
 *    the slash where you typed it. Then type `and/or` - the menu must NOT open.
 * 3. Tab from the label. Focus lands on the toolbar ONCE; the arrow keys move
 *    along it and one more Tab reaches the text. Seventeen tab stops would be
 *    the defect this avoids.
 * 4. Hard-reload the page. Tiptap cannot render during SSR, so a mistake here
 *    shows up as an editor that looks perfect and refuses every keystroke.
 */
export const Route = createFileRoute("/(references)/components/text-editor")({
	head: () => ({
		meta: [{ title: seo.title("Text editor lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Text editor" },
	component: TextEditorLabPage,
});

/** The document the lab opens on - the one from the spec, so the JSON below is
 *  recognisable rather than lorem. */
const GUIDE_DOCUMENT: RichTextDocument = {
	content: [
		{
			attrs: { level: 2 },
			content: [{ text: "Controlled JSON value", type: "text" }],
			type: "heading",
		},
		{
			content: [
				{ text: "This editor keeps its ", type: "text" },
				{ marks: [{ type: "bold" }], text: "document", type: "text" },
				{
					text: " in form state. The buttons above replace the ",
					type: "text",
				},
				{ marks: [{ type: "code" }], text: "value", type: "text" },
				{
					text: ", and the JSON below updates after every edit.",
					type: "text",
				},
			],
			type: "paragraph",
		},
		{
			content: [
				{
					content: [
						{
							content: [
								{
									text: "Edit this paragraph and watch the JSON mirror change.",
									type: "text",
								},
							],
							type: "paragraph",
						},
					],
					type: "listItem",
				},
				{
					content: [
						{
							content: [
								{ text: "The footer reads ", type: "text" },
								{
									marks: [{ type: "bold" }],
									text: "reading time",
									type: "text",
								},
								{ text: " and ", type: "text" },
								{ marks: [{ type: "italic" }], text: "word", type: "text" },
								{ text: " counts from Tiptap storage.", type: "text" },
							],
							type: "paragraph",
						},
					],
					type: "listItem",
				},
			],
			type: "bulletList",
		},
		{
			content: [
				{
					content: [
						{
							text: "Controlled mode should feel editable, not fragile: external updates only replace content when the incoming JSON ",
							type: "text",
						},
						{
							/* A link in the opening fixture on purpose. The hover panel is
							   the only way to follow a link while EDITING - the editor sets
							   openOnClick false, because in a document a click is how you
							   reach the words to change them - so a lab with no link in it
							   cannot show the one behaviour that needs explaining. */
							marks: [{ attrs: { href: "https://tiptap.dev/docs" }, type: "link" }],
							text: "differs",
							type: "text",
						},
						{ text: ".", type: "text" },
					],
					type: "paragraph",
				},
			],
			type: "blockquote",
		},
		{ type: "paragraph" },
	],
	type: "doc",
};

const NOTES_DOCUMENT: RichTextDocument = {
	content: [
		{
			attrs: { level: 3 },
			content: [{ text: "Release notes", type: "text" }],
			type: "heading",
		},
		{
			content: [
				{ text: "Shipped the editor. Try ", type: "text" },
				{ marks: [{ type: "code" }], text: "/", type: "text" },
				{ text: " on an empty line.", type: "text" },
			],
			type: "paragraph",
		},
	],
	type: "doc",
};

/**
 * The lab's stand-in for an upload endpoint.
 *
 * It does not upload anything - there is no api in this slice - but it has the
 * exact shape a real one does, so the editor is exercised through the same code
 * path a project with storage would use. A real app passes
 * `xhrUpload("/api/uploads")` here and changes nothing else.
 *
 * It resolves with a PUBLIC URL rather than an object URL. A `blob:` address
 * would display beautifully and then fail the document schema, which allows
 * only http and https - so the demo would be showing a flow that cannot be
 * saved, which is the opposite of what this lab is for.
 */
const demoUpload: UploadHandler = async (file) => {
	// A pause, so the pending state is visible. An upload that resolves instantly
	// demonstrates nothing about what a slow one looks like.
	await new Promise((resolve) => setTimeout(resolve, 900));
	// Deterministic from the file name, so two different pictures do not come
	// back as the same one and make the demo look broken.
	const seed = Math.abs([...file.name].reduce((total, char) => total + char.charCodeAt(0), 0)) % 1000;
	return { url: `https://picsum.photos/seed/${seed}/1200/675` };
};

interface LabForm {
	post: RichTextDocument;
	shortPost: RichTextDocument;
}

function TextEditorLabPage() {
	return (
		<div className="mx-auto space-y-6">
			<AppPageHeader
				subtitle="A Tiptap editor bound to react-hook-form, and the document it puts in a database."
				title="Text editor lab"
			/>
			<AssemblySection />
			<ReachSection />
			<ReadModeSection />
			<StatesSection />
			<ValidationSection />
		</div>
	);
}

/**
 * The assembly, and the JSON it produces.
 *
 * A lab-local `useForm` rather than `useAppForm`: nothing here is submitted, and
 * inventing a schema for a specimen would print validation errors over a page
 * that is about something else. That is the one sanctioned use of bare useForm
 * and it is written up in apps/web/CLAUDE.md.
 */
function AssemblySection() {
	const { control, setValue, watch } = useForm<LabForm>({
		defaultValues: {
			post: GUIDE_DOCUMENT,
			shortPost: EMPTY_RICH_TEXT_DOCUMENT,
		},
	});
	const [copied, setCopied] = useState(false);

	const document = watch("post");

	return (
		<LabSection
			description="The editor as a compose screen would use it: a toolbar, the writing surface, and a footer that leads with reading time. The panel underneath is the document that would be stored - it is the only place the saved shape is visible before it reaches a database, which is why it is here rather than in a comment."
			title="The editor, and what it stores"
			usedIn={["a blog post body", "any long-form field a reader will see"]}
		>
			<Row>
				<AppButton
					data-cy="load-guide"
					icon={FileText}
					onPress={() => setValue("post", GUIDE_DOCUMENT)}
					variant="secondary"
				>
					Load guide
				</AppButton>
				<AppButton
					data-cy="load-notes"
					icon={NotebookPen}
					onPress={() => setValue("post", NOTES_DOCUMENT)}
					variant="secondary"
				>
					Load notes
				</AppButton>
				<AppButton
					data-cy="clear-document"
					icon={Eraser}
					onPress={() => setValue("post", EMPTY_RICH_TEXT_DOCUMENT)}
					variant="tertiary"
				>
					Clear
				</AppButton>
				<AppButton
					data-cy="copy-json"
					icon={copied ? Check : Copy}
					onPress={async () => {
						await navigator.clipboard.writeText(JSON.stringify(document, null, 2));
						setCopied(true);
						window.setTimeout(() => setCopied(false), 2000);
					}}
					variant="tertiary"
				>
					{copied ? "Copied" : "Copy JSON"}
				</AppButton>
			</Row>

			<AppRichTextEditor
				control={control}
				data-cy="editor-assembly"
				description="Press / on an empty line for blocks, type markdown, or drop an image straight onto the text."
				label="Post body"
				name="post"
				uploadImage={demoUpload}
			/>

			<JsonMirror document={document} />
		</LabSection>
	);
}

/** The three routes to a control, only one of which advertises itself. */
function ReachSection() {
	return (
		<LabSection
			description="A toolbar grows a button per feature; the other two paths do not. This section exists because neither of them is discoverable by looking at the editor - they have to be demonstrated, and then they are the only ones anybody uses."
			title="Three ways to reach every control"
			usedIn={["the reason the toolbar is designed to be outgrown"]}
		>
			<ul className="space-y-2 text-sm">
				<li>
					<strong className="font-medium">Markdown as you type.</strong> <code className="text-xs">## </code>,{" "}
					<code className="text-xs">- </code>, <code className="text-xs">1. </code>,{" "}
					<code className="text-xs">&gt; </code>, <code className="text-xs">```</code>,{" "}
					<code className="text-xs">**bold**</code>. Never inside a code block - Tiptap refuses input rules in a node
					whose spec is code, which is what stops a sample being corrupted into something that will not run.
				</li>
				<li>
					<strong className="font-medium">Keyboard shortcuts</strong>, which every toolbar tooltip names. Hover any
					control to learn its key, then stop using the control.
				</li>
				<li>
					<strong className="font-medium">The slash menu.</strong> Only at the start of an empty block, so{" "}
					<code className="text-xs">and/or</code> and a URL do not summon it. Escape leaves the slash where you typed it
					- closing a menu must not delete a character the user meant.
				</li>
			</ul>
		</LabSection>
	);
}

/** The read side: the same document, rendered by the same extensions. */
function ReadModeSection() {
	return (
		<LabSection
			description="The saved document rendered for a reader. It takes the document object, never an HTML string, and never touches dangerouslySetInnerHTML - it renders with the same extension set that produced the document, so the only markup that can reach the page is markup those extensions know how to make. That property is the whole reason nothing is stored as HTML."
			title="Read mode"
			usedIn={["the published post", "a preview pane"]}
		>
			<div className="rounded-xl border border-border bg-surface p-4">
				<AppRichTextContent
					data-cy="read-mode"
					document={GUIDE_DOCUMENT}
				/>
			</div>
		</LabSection>
	);
}

/** Disabled, read-only, and the character cap. */
function StatesSection() {
	const { control } = useForm<LabForm>({
		defaultValues: { post: GUIDE_DOCUMENT, shortPost: NOTES_DOCUMENT },
	});

	return (
		<LabSection
			description="The states a real screen reaches. The footer always states all three figures - reading time, words, characters, in that order, with characters last because they are the storage fact rather than the writing one. A cap changes the reading to '403 / 180 characters' and adds the over-limit state, which is stated in words as well as in colour because a red number alone is silent to a colour-blind reader."
			title="Disabled, read-only, and at the limit"
			usedIn={["a post locked while publishing", "an archived post", "a summary field with a column limit"]}
		>
			<AppRichTextEditor
				control={control}
				data-cy="editor-capped"
				label="Excerpt (capped at 180 characters)"
				maxCharacters={180}
				name="shortPost"
			/>

			<div className="grid gap-4 lg:grid-cols-2">
				<AppRichTextEditor
					control={control}
					data-cy="editor-disabled"
					isDisabled
					label="Disabled"
					name="post"
				/>
				<AppRichTextEditor
					control={control}
					data-cy="editor-readonly"
					isReadOnly
					label="Read-only"
					name="post"
				/>
			</div>
		</LabSection>
	);
}

/** What the schema refuses, and why the answer is a schema rather than a scrub. */
function ValidationSection() {
	const [result, setResult] = useState<string | null>(null);

	const attempt = (label: string, candidate: unknown) => {
		const parsed = RichTextDocumentSchema.safeParse(candidate);
		setResult(parsed.success ? `${label}: accepted` : `${label}: rejected - ${parsed.error.issues[0]?.message}`);
	};

	return (
		<LabSection
			description="Every node and mark the editor can produce is named in RichTextDocumentSchema, and nothing else parses. That is what makes a paste out of Word safe: its font tags and inline styles have nowhere to land, so they are dropped on the way in rather than sanitised on the way out."
			title="What the document schema refuses"
			usedIn={["the check an api would run before writing the row"]}
		>
			<Row>
				<AppButton
					data-cy="try-script-link"
					onPress={() =>
						attempt("javascript: link", {
							content: [
								{
									content: [
										{
											marks: [
												{
													attrs: { href: "javascript:alert(1)" },
													type: "link",
												},
											],
											text: "click me",
											type: "text",
										},
									],
									type: "paragraph",
								},
							],
							type: "doc",
						})
					}
					variant="secondary"
				>
					A javascript: link
				</AppButton>
				<AppButton
					data-cy="try-unknown-node"
					onPress={() =>
						attempt("unknown node", {
							content: [{ type: "iframe" }],
							type: "doc",
						})
					}
					variant="secondary"
				>
					An unknown node
				</AppButton>
				<AppButton
					data-cy="try-valid"
					onPress={() => attempt("the editor's own document", GUIDE_DOCUMENT)}
					variant="secondary"
				>
					The document above
				</AppButton>
			</Row>

			{result ? (
				<AppAlert
					data-cy="schema-result"
					description={result}
					icon={FileText}
					status={result.includes("accepted") ? "success" : "danger"}
					title="Schema check"
				/>
			) : null}

			<p className="text-sm text-muted">
				An empty editor is <code className="text-xs">{"{ type: 'doc', content: [{ type: 'paragraph' }] }"}</code>, which
				is a truthy object - so a required check written as <code className="text-xs">if (!value)</code> passes on it.
				Use <code className="text-xs">isEmptyDocument</code>, which reports{" "}
				<strong className="font-medium">{String(isEmptyDocument(EMPTY_RICH_TEXT_DOCUMENT))}</strong> for that document
				and <strong className="font-medium">{String(isEmptyDocument(GUIDE_DOCUMENT))}</strong> for the one above.
			</p>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function JsonMirror({ document }: { document: RichTextDocument }) {
	return (
		<div className="rounded-xl border border-border bg-muted-surface">
			<p className="border-b border-border px-3 py-2 text-xs font-medium text-muted">
				What would be stored - updates on every edit
			</p>
			{/* Its own scrollport. A document of any length must not make the page
			    scroll horizontally, and the mirror has to stay beside the editor it
			    mirrors rather than pushing it off screen. */}
			<pre
				className="max-h-80 overflow-auto p-3 text-xs leading-relaxed"
				data-cy="json-mirror"
			>
				{JSON.stringify(document, null, 2)}
			</pre>
		</div>
	);
}

function Row({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
	/** Where this shape is used on a real screen. A specimen with no stated
	 *  purpose is a screenshot. */
	usedIn?: string[];
}

function LabSection({ children, description, title, usedIn }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
					{usedIn ? (
						<ul className="mt-2 flex flex-wrap gap-1.5">
							{usedIn.map((use) => (
								<li
									className="rounded-full bg-muted-surface px-2.5 py-0.5 text-xs text-muted"
									key={use}
								>
									{use}
								</li>
							))}
						</ul>
					) : null}
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
