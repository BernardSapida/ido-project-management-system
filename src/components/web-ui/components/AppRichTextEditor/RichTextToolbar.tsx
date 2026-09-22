import { Separator, Toolbar } from "@heroui/react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	ChevronDown,
	Code,
	Code2,
	Eraser,
	Eye,
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Highlighter,
	ImagePlus,
	Italic,
	Link2,
	List,
	ListOrdered,
	Minus,
	Quote,
	Redo2,
	Search,
	Strikethrough,
	Subscript,
	Superscript,
	Type,
	Underline,
	Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppButton } from "../AppButton";
import { AppDropdown } from "../AppDropdown";
import { AppToggleButton } from "../AppToggleButton";
import { AppTooltip } from "../AppTooltip";
import { ALT, MOD, SHIFT } from "./keyboard";

interface RichTextToolbarProps {
	editor: Editor;
	isDisabled: boolean;
	isFindOpen: boolean;
	isPreview: boolean;
	/** Opens the image dialog. The address and the alt text are asked for there. */
	onRequestImage: () => void;
	/** Opens the link dialog. The URL is asked for there, not here. */
	onRequestLink: () => void;
	onToggleFind: () => void;
	onTogglePreview: () => void;
}

/**
 * The always-visible control strip.
 *
 * ## Two dropdowns, so the strip did not grow by nine buttons
 *
 * Headings, lists and alignment are DROPDOWNS rather than one toggle each. That
 * is what absorbed highlight, four alignments, superscript, subscript and H4
 * without the toolbar wrapping into three lines in a narrow column: a dropdown
 * grows a row per option, a toolbar grows a button.
 *
 * Each trigger wears the GLYPH of what is currently selected, so all three read
 * the same way and none of them is a word-width button among square ones. The
 * name in words lives in the tooltip and in `aria-label` - "Block type,
 * currently Heading 2" - which is where an icon-only control has to say it
 * anyway.
 *
 * They are `selectionMode: "single"` choice sections, which is the honest shape:
 * a block has exactly one type, and the menu shows which.
 *
 * ## It is ONE tab stop
 *
 * HeroUI's `Toolbar` is React Aria's, so arrow keys move between controls and
 * Tab moves past the whole strip. At this many controls that is the difference
 * between one Tab to reach the text and twenty.
 *
 * ## Every tooltip teaches its shortcut
 *
 * The toolbar's real job is to be outgrown. A writer who learns ⌘B from the
 * tooltip stops reaching for the button, which is the outcome to design for.
 *
 * ## Pressed state is read back from the editor
 *
 * `editor.isActive(...)` is the truth. A toolbar holding its own copy drifts
 * from the caret within about three keystrokes.
 */
export function RichTextToolbar({
	editor,
	isDisabled,
	isFindOpen,
	isPreview,
	onRequestImage,
	onRequestLink,
	onToggleFind,
	onTogglePreview,
}: RichTextToolbarProps) {
	/*
	 * One subscription for the whole strip. Every control reads the same
	 * transaction, so they cannot disagree with each other mid-update.
	 */
	const state = useEditorState({
		editor,
		selector: ({ editor: instance }) => ({
			/*
			 * Read from the NODE'S ATTRIBUTES, not from `isActive({ textAlign })`.
			 * `isActive` with a bare attribute object matches any node or mark at the
			 * selection carrying that attribute, which is not the same question as
			 * "how is the block the caret is in aligned" - and it answered wrong often
			 * enough that the toolbar showed Align left over a right-aligned
			 * paragraph.
			 */
			align: readAlignment(instance),
			canRedo: instance.can().redo(),
			canUndo: instance.can().undo(),
			headingLevel: ([1, 2, 3, 4] as const).find((level) => instance.isActive("heading", { level })),
			isBlockquote: instance.isActive("blockquote"),
			isBold: instance.isActive("bold"),
			isBulletList: instance.isActive("bulletList"),
			isCode: instance.isActive("code"),
			isCodeBlock: instance.isActive("codeBlock"),
			isHighlight: instance.isActive("highlight"),
			isItalic: instance.isActive("italic"),
			isLink: instance.isActive("link"),
			isOrderedList: instance.isActive("orderedList"),
			isStrike: instance.isActive("strike"),
			isSubscript: instance.isActive("subscript"),
			isSuperscript: instance.isActive("superscript"),
			isUnderline: instance.isActive("underline"),
		}),
	});

	const blockKey = state.headingLevel ? `h${state.headingLevel}` : "paragraph";
	const listKey = state.isBulletList ? "bullet" : state.isOrderedList ? "ordered" : "none";

	return (
		<Toolbar
			aria-label="Text formatting"
			/*
			 * `rich-text-toolbar` is a real class in styles.css, NOT a utility. HeroUI's
			 * `.toolbar` sets `w-fit` and `grid-flow-col` from the components layer,
			 * which this project declares AFTER utilities - so `w-full flex-wrap`
			 * written here would lose the cascade and silently do nothing.
			 */
			className="rich-text-toolbar border-b border-border px-2 py-1.5"
			data-cy="rich-text-toolbar"
		>
			<ToolbarAction
				icon={Undo2}
				isDisabled={isDisabled || !state.canUndo}
				label="Undo"
				onPress={() => editor.chain().focus().undo().run()}
				shortcut={`${MOD} Z`}
			/>
			<ToolbarAction
				icon={Redo2}
				isDisabled={isDisabled || !state.canRedo}
				label="Redo"
				onPress={() => editor.chain().focus().redo().run()}
				shortcut={`${MOD} ${SHIFT} Z`}
			/>

			<ToolbarDivider />

			{/* BLOCK TYPE. The trigger says what the caret is in, so the current state
			    is read rather than inferred from which of five buttons looks pressed. */}
			<AppDropdown
				data-cy="block-type-dropdown"
				label="Block type"
				sections={[
					{
						items: [
							{ icon: Type, key: "paragraph", label: "Text" },
							{ icon: Heading1, key: "h1", label: "Heading 1" },
							{ icon: Heading2, key: "h2", label: "Heading 2" },
							{ icon: Heading3, key: "h3", label: "Heading 3" },
							{ icon: Heading4, key: "h4", label: "Heading 4" },
						],
						key: "blocks",
						indicator: "emphasis",
						onSelectionChange: ([key]) => {
							if (key === "paragraph") {
								editor.chain().focus().setParagraph().run();
								return;
							}
							const level = Number(key?.replace("h", "")) as 1 | 2 | 3 | 4;
							editor.chain().focus().setHeading({ level }).run();
						},
						selectedKeys: [blockKey],
						selectionMode: "single",
					},
				]}
				trigger={
					<ToolbarHint
						icon={BLOCK_ICONS[blockKey] ?? Type}
						isDisabled={isDisabled}
						label="Block type"
						shortcut={`Currently ${BLOCK_LABELS[blockKey]}`}
					>
						<AppButton
							/*
							 * The GLYPH, not the word. All three dropdowns now read the same
							 * way - current state as an icon, then a chevron - and a strip
							 * where one trigger is a 128px word and the others are square
							 * buttons reads as a control of a different kind.
							 *
							 * Icon-only means the name has to be said somewhere else, so it
							 * moves to `aria-label` and to the tooltip - both of which carry
							 * the current selection rather than only the menu's name.
							 */
							aria-label={`Block type: ${BLOCK_LABELS[blockKey]}`}
							data-cy="block-type-trigger"
							isDisabled={isDisabled}
							size="sm"
							variant="ghost"
						>
							<BlockGlyph blockKey={blockKey} />
							<ChevronDown
								aria-hidden="true"
								className="size-3.5 shrink-0"
							/>
						</AppButton>
					</ToolbarHint>
				}
			/>

			{/* LISTS, on the same argument. "No list" is a real choice: it is how a
			    list becomes paragraphs again. */}
			<AppDropdown
				data-cy="list-dropdown"
				label="List style"
				sections={[
					{
						items: [
							{ icon: Type, key: "none", label: "No list" },
							{ icon: List, key: "bullet", label: "Bullet list" },
							{ icon: ListOrdered, key: "ordered", label: "Numbered list" },
						],
						key: "lists",
						indicator: "emphasis",
						onSelectionChange: ([key]) => {
							const chain = editor.chain().focus();
							if (key === "bullet") chain.toggleBulletList().run();
							else if (key === "ordered") chain.toggleOrderedList().run();
							else chain.liftListItem("listItem").run();
						},
						selectedKeys: [listKey],
						selectionMode: "single",
					},
				]}
				trigger={
					/* A chevron, like the block-type trigger. Two dropdowns side by
					   side where only one advertises itself as a dropdown reads as one
					   menu and one button - the affordance has to be the same because
					   the behaviour is. */
					<ToolbarHint
						icon={listKey === "ordered" ? ListOrdered : List}
						isDisabled={isDisabled}
						label="List style"
						shortcut={`Currently ${LIST_LABELS[listKey]}`}
					>
						<AppButton
							aria-label={`List style: ${LIST_LABELS[listKey]}`}
							data-cy="list-trigger"
							isDisabled={isDisabled}
							size="sm"
							variant="ghost"
						>
							<ListGlyph listKey={listKey} />
							<ChevronDown
								aria-hidden="true"
								className="size-3.5 shrink-0"
							/>
						</AppButton>
					</ToolbarHint>
				}
			/>

			<ToolbarDivider />

			<ToolbarToggle
				icon={Bold}
				isDisabled={isDisabled}
				isSelected={state.isBold}
				label="Bold"
				onChange={() => editor.chain().focus().toggleBold().run()}
				shortcut={`${MOD} B`}
			/>
			<ToolbarToggle
				icon={Italic}
				isDisabled={isDisabled}
				isSelected={state.isItalic}
				label="Italic"
				onChange={() => editor.chain().focus().toggleItalic().run()}
				shortcut={`${MOD} I`}
			/>
			<ToolbarToggle
				icon={Underline}
				isDisabled={isDisabled}
				isSelected={state.isUnderline}
				label="Underline"
				onChange={() => editor.chain().focus().toggleUnderline().run()}
				shortcut={`${MOD} U`}
			/>
			<ToolbarToggle
				icon={Strikethrough}
				isDisabled={isDisabled}
				isSelected={state.isStrike}
				label="Strikethrough"
				onChange={() => editor.chain().focus().toggleStrike().run()}
				shortcut={`${MOD} ${SHIFT} S`}
			/>
			<ToolbarToggle
				icon={Highlighter}
				isDisabled={isDisabled}
				isSelected={state.isHighlight}
				label="Highlight"
				onChange={() => editor.chain().focus().toggleHighlight().run()}
				shortcut={`${MOD} ${SHIFT} H`}
			/>
			{/*
			 * Superscript and subscript UNSET each other. A character cannot be both
			 * raised and lowered, and a document carrying both marks is one no
			 * renderer can honour - so the command that applies one clears the other
			 * rather than leaving the pair to fight.
			 */}
			<ToolbarToggle
				icon={Superscript}
				isDisabled={isDisabled}
				isSelected={state.isSuperscript}
				label="Superscript"
				onChange={() => editor.chain().focus().unsetSubscript().toggleSuperscript().run()}
				shortcut={`${MOD} .`}
			/>
			<ToolbarToggle
				icon={Subscript}
				isDisabled={isDisabled}
				isSelected={state.isSubscript}
				label="Subscript"
				onChange={() => editor.chain().focus().unsetSuperscript().toggleSubscript().run()}
				shortcut={`${MOD} ,`}
			/>
			<ToolbarToggle
				icon={Code}
				isDisabled={isDisabled}
				isSelected={state.isCode}
				label="Inline code"
				onChange={() => editor.chain().focus().toggleCode().run()}
				shortcut={`${MOD} E`}
			/>

			<ToolbarDivider />

			{/*
			 * ALIGNMENT, as a dropdown rather than four toggles - the same argument
			 * that made headings and lists dropdowns. A block has exactly one
			 * alignment, so four toggles where only ever one is pressed is a radio
			 * group wearing the wrong clothes, and it cost four slots on a strip that
			 * had already run out of them.
			 *
			 * Left is the DEFAULT, so choosing it CLEARS the attribute rather than
			 * writing `textAlign: "left"` onto every ordinary paragraph - an
			 * attribute meaning "nothing" makes "did the author align this?"
			 * unanswerable.
			 */}
			<AppDropdown
				data-cy="align-dropdown"
				label="Alignment"
				sections={[
					{
						items: [
							{ icon: AlignLeft, key: "left", label: "Align left" },
							{ icon: AlignCenter, key: "center", label: "Align centre" },
							{ icon: AlignRight, key: "right", label: "Align right" },
							{ icon: AlignJustify, key: "justify", label: "Justify" },
						],
						key: "alignment",
						indicator: "emphasis",
						onSelectionChange: ([key]) => {
							const chain = editor.chain().focus();
							if (key === "left" || key === undefined) chain.unsetTextAlign().run();
							else chain.setTextAlign(key).run();
						},
						selectedKeys: [state.align ?? "left"],
						selectionMode: "single",
					},
				]}
				trigger={
					<ToolbarHint
						icon={ALIGN_ICONS[state.align ?? "left"] ?? AlignLeft}
						isDisabled={isDisabled}
						label="Alignment"
						shortcut={`Currently ${ALIGN_LABELS[state.align ?? "left"]}`}
					>
						<AppButton
							aria-label={`Alignment: ${ALIGN_LABELS[state.align ?? "left"]}`}
							data-cy="align-trigger"
							isDisabled={isDisabled}
							size="sm"
							variant="ghost"
						>
							<AlignGlyph align={state.align} />
							<ChevronDown
								aria-hidden="true"
								className="size-3.5 shrink-0"
							/>
						</AppButton>
					</ToolbarHint>
				}
			/>

			<ToolbarDivider />

			<ToolbarToggle
				icon={Quote}
				isDisabled={isDisabled}
				isSelected={state.isBlockquote}
				label="Quote"
				onChange={() => editor.chain().focus().toggleBlockquote().run()}
				shortcut={`${MOD} ${SHIFT} B`}
			/>
			<ToolbarToggle
				icon={Code2}
				isDisabled={isDisabled}
				isSelected={state.isCodeBlock}
				label="Code block"
				onChange={() => editor.chain().focus().toggleCodeBlock().run()}
				shortcut={`${MOD} ${ALT} C`}
			/>
			<ToolbarAction
				icon={Minus}
				isDisabled={isDisabled}
				label="Divider"
				onPress={() => editor.chain().focus().setHorizontalRule().run()}
			/>
			{/*
			 * A button rather than a toggle: it opens a dialog to ask for a URL, and a
			 * control that reads as pressed while a dialog is still deciding whether
			 * the link happens is lying about the document.
			 */}
			<ToolbarAction
				icon={Link2}
				isDisabled={isDisabled}
				isEmphasised={state.isLink}
				label={state.isLink ? "Edit link" : "Add link"}
				onPress={onRequestLink}
				shortcut={`${MOD} K`}
			/>
			<ToolbarAction
				icon={ImagePlus}
				isDisabled={isDisabled}
				label="Add image"
				onPress={onRequestImage}
			/>
			<ToolbarAction
				icon={Eraser}
				isDisabled={isDisabled}
				label="Clear formatting"
				onPress={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
			/>

			<ToolbarDivider />

			{/* A TOGGLE, because the find bar either is or is not open and the control
			    should say which. */}
			<ToolbarToggle
				icon={Search}
				isDisabled={isDisabled}
				isSelected={isFindOpen}
				label="Find in this post"
				onChange={onToggleFind}
				shortcut={`${MOD} F`}
			/>
			{/* PREVIEW. A toggle, because the editor either is or is not showing the
			    post as a reader will see it, and the control should say which. */}
			<ToolbarToggle
				icon={Eye}
				isDisabled={false}
				isSelected={isPreview}
				label="Preview"
				onChange={onTogglePreview}
				shortcut={`${MOD} ${SHIFT} P`}
			/>
		</Toolbar>
	);
}

/* -------------------------------------------------------------------------- */

const BLOCK_LABELS: Record<string, string> = {
	h1: "Heading 1",
	h2: "Heading 2",
	h3: "Heading 3",
	h4: "Heading 4",
	paragraph: "Text",
};

const BLOCK_ICONS: Record<string, LucideIcon> = {
	h1: Heading1,
	h2: Heading2,
	h3: Heading3,
	h4: Heading4,
	paragraph: Type,
};

/** The trigger's glyph says which block the caret is in without opening it. */
function BlockGlyph({ blockKey }: { blockKey: string }) {
	const Icon = BLOCK_ICONS[blockKey] ?? Type;
	return (
		<Icon
			aria-hidden="true"
			className="size-4 shrink-0"
		/>
	);
}

const ALIGN_LABELS: Record<string, string> = {
	center: "Centre",
	justify: "Justified",
	left: "Left",
	right: "Right",
};

const ALIGN_ICONS: Record<string, LucideIcon> = {
	center: AlignCenter,
	justify: AlignJustify,
	left: AlignLeft,
	right: AlignRight,
};

/** The trigger's glyph says how the current block is aligned without opening it. */
function AlignGlyph({ align }: { align: string | undefined }) {
	const Icon = ALIGN_ICONS[align ?? "left"] ?? AlignLeft;
	return (
		<Icon
			aria-hidden="true"
			className="size-4 shrink-0"
		/>
	);
}

/**
 * The alignment of the block the caret is in.
 *
 * Heading and paragraph are the only two nodes TextAlign is configured for, so
 * they are the only two worth asking. Anything that is not one of the three
 * stored alignments - including the absent attribute, and including a stray
 * `"left"` written by an older document - reads as undefined, which the toolbar
 * shows as Left.
 */
function readAlignment(instance: Editor): "center" | "justify" | "right" | undefined {
	const value = instance.getAttributes("paragraph").textAlign ?? instance.getAttributes("heading").textAlign;
	return value === "center" || value === "right" || value === "justify" ? value : undefined;
}

const LIST_LABELS: Record<string, string> = {
	bullet: "Bullet list",
	none: "None",
	ordered: "Numbered list",
};

/** The trigger's glyph says which list style is active without opening it. */
function ListGlyph({ listKey }: { listKey: string }) {
	const Icon = listKey === "ordered" ? ListOrdered : List;
	return (
		<Icon
			aria-hidden="true"
			className="size-4 shrink-0"
		/>
	);
}

/** Vertical, because the Toolbar's SeparatorContext already flips it. */
function ToolbarDivider() {
	return (
		<Separator
			className="mx-1 h-5 self-center"
			orientation="vertical"
		/>
	);
}

interface ToolbarControlProps {
	icon: LucideIcon;
	isDisabled: boolean;
	label: string;
	/** Written the way this machine's keyboard is labelled, or omitted where there is none. */
	shortcut?: string;
}

/**
 * The tooltip carries the control's OWN glyph rather than AppTooltip's default
 * Info icon: on a strip of twenty icons, a card headed by a question mark makes
 * the reader match the tooltip back to the button they are pointing at.
 */
function ToolbarHint({ children, icon, label, shortcut }: ToolbarControlProps & { children: ReactNode }) {
	return (
		<AppTooltip
			description={shortcut ?? "No shortcut"}
			icon={icon}
			placement="bottom"
			title={label}
		>
			{children}
		</AppTooltip>
	);
}

function ToolbarToggle({
	icon: Icon,
	isDisabled,
	isSelected,
	label,
	onChange,
	shortcut,
}: ToolbarControlProps & { isSelected: boolean; onChange: () => void }) {
	return (
		<ToolbarHint
			icon={Icon}
			isDisabled={isDisabled}
			label={label}
			shortcut={shortcut}
		>
			<AppToggleButton
				aria-label={label}
				data-cy={`toolbar-${slug(label)}`}
				isDisabled={isDisabled}
				isIconOnly
				isSelected={isSelected}
				onChange={onChange}
				size="sm"
				variant="ghost"
			>
				<Icon
					aria-hidden="true"
					className="size-4"
				/>
			</AppToggleButton>
		</ToolbarHint>
	);
}

function ToolbarAction({
	icon: Icon,
	isDisabled,
	isEmphasised,
	label,
	onPress,
	shortcut,
}: ToolbarControlProps & { isEmphasised?: boolean; onPress: () => void }) {
	return (
		<ToolbarHint
			icon={Icon}
			isDisabled={isDisabled}
			label={label}
			shortcut={shortcut}
		>
			<AppButton
				aria-label={label}
				className={isEmphasised ? "text-accent" : undefined}
				data-cy={`toolbar-${slug(label)}`}
				icon={Icon}
				isDisabled={isDisabled}
				isIconOnly
				onPress={onPress}
				size="sm"
				variant="ghost"
			/>
		</ToolbarHint>
	);
}

/** "Heading 1" becomes `toolbar-heading-1`, so a hook survives a copy edit. */
function slug(label: string): string {
	return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
