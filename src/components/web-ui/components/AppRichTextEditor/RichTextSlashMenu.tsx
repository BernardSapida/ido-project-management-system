import { Kbd } from "@heroui/react";
import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import { Code2, Heading1, Heading2, Heading3, List, ListOrdered, Minus, Quote, Type } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";

interface SlashCommand {
	category: "Blocks" | "Text";
	icon: LucideIcon;
	keywords: string[];
	label: string;
	run: (editor: Editor) => void;
}

/**
 * ONLY blocks the document schema already allows.
 *
 * The slash menu is a faster route to the existing set, never a way in for new
 * node types - a row added here that the schema does not name produces a
 * document that fails validation at save time, which is the worst place to find
 * out.
 */
const SLASH_COMMANDS: SlashCommand[] = [
	{
		category: "Text",
		icon: Type,
		keywords: ["paragraph", "body", "text"],
		label: "Text",
		run: (editor) => editor.chain().focus().setParagraph().run(),
	},
	{
		category: "Text",
		icon: Heading1,
		keywords: ["h1", "title", "heading"],
		label: "Heading 1",
		run: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
	},
	{
		category: "Text",
		icon: Heading2,
		keywords: ["h2", "section", "heading"],
		label: "Heading 2",
		run: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
	},
	{
		category: "Text",
		icon: Heading3,
		keywords: ["h3", "subsection", "heading"],
		label: "Heading 3",
		run: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
	},
	{
		category: "Blocks",
		icon: List,
		keywords: ["bullet", "unordered", "ul", "list"],
		label: "Bullet list",
		run: (editor) => editor.chain().focus().toggleBulletList().run(),
	},
	{
		category: "Blocks",
		icon: ListOrdered,
		keywords: ["numbered", "ordered", "ol", "list"],
		label: "Numbered list",
		run: (editor) => editor.chain().focus().toggleOrderedList().run(),
	},
	{
		category: "Blocks",
		icon: Quote,
		keywords: ["blockquote", "citation", "quote"],
		label: "Quote",
		run: (editor) => editor.chain().focus().toggleBlockquote().run(),
	},
	{
		category: "Blocks",
		icon: Code2,
		keywords: ["code", "snippet", "pre"],
		label: "Code block",
		run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
	},
	{
		category: "Blocks",
		icon: Minus,
		keywords: ["divider", "rule", "hr", "separator"],
		label: "Divider",
		run: (editor) => editor.chain().focus().setHorizontalRule().run(),
	},
];

interface SlashState {
	/** The caret's BOTTOM edge - where the panel hangs from when it opens down. */
	caretBottom: number;
	/** The caret's TOP edge - where the panel's bottom sits when it flips up. */
	caretTop: number;
	/** Where the typed `/query` starts, so choosing a command can delete it. */
	from: number;
	left: number;
	query: string;
}

/** Roughly the tallest the panel gets: nine rows, the footer, its own padding.
 *  Used to decide whether it fits below the caret, so it is an upper bound
 *  rather than a measurement - being wrong towards "flip" is harmless. */
const PANEL_MAX_HEIGHT = 360;

/**
 * Watches for a slash at the start of an empty block.
 *
 * ## Why not Tiptap's Suggestion utility
 *
 * Suggestion renders through a detached React root and expects a third-party
 * positioner. This needs neither: the trigger is one regex over the text before
 * the caret, and the position is `coordsAtPos`, which is Tiptap's own. Keeping
 * it in React means the panel is ordinary JSX that the app's own tokens style,
 * rather than a second rendering path with its own theme.
 *
 * ## The trigger is deliberately narrow
 *
 * Start of the block, and nothing but the slash and a word before the caret.
 * `and/or`, a URL and a date all contain a slash and none of them is a request
 * for a block menu - a trigger that fires on any slash makes the editor feel
 * possessed.
 */
export function useSlashMenu(editor: Editor | null) {
	const [state, setState] = useState<SlashState | null>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	/** The query the highlight was last reset for. A ref, because reading it must
	 *  not itself be a reason to re-run. */
	const lastQueryRef = useRef<string | null>(null);
	/**
	 * The trigger position the user dismissed with Escape.
	 *
	 * Without this, Escape does not work at all: closing clears the state, the
	 * very next transaction re-reads the same `/hea` still sitting in the text,
	 * and the menu reopens. It looked like a flicker and it was the menu
	 * correctly reopening for a trigger that had never gone away. Cleared as soon
	 * as the trigger stops matching, so deleting the slash and typing a new one
	 * opens the menu again.
	 */
	const dismissedFromRef = useRef<number | null>(null);

	const items = useMemo(() => {
		if (!state) return [];
		const needle = state.query.toLowerCase();
		if (needle === "") return SLASH_COMMANDS;
		return SLASH_COMMANDS.filter(
			(command) =>
				command.label.toLowerCase().includes(needle) || command.keywords.some((keyword) => keyword.startsWith(needle)),
		);
	}, [state]);

	const close = useCallback(() => setState(null), []);

	const select = useCallback(
		(command: SlashCommand) => {
			if (!editor || !state) return;
			/*
			 * The typed `/query` is deleted BEFORE the command runs. Leaving it
			 * would put "/quote" inside the blockquote it just created, and the
			 * author would have to notice and delete it every single time.
			 */
			editor
				.chain()
				.focus()
				.deleteRange({ from: state.from, to: state.from + state.query.length + 1 })
				.run();
			command.run(editor);
			close();
		},
		[close, editor, state],
	);

	// Re-read on every transaction: typing filters, and moving the caret out of
	// the block must close the menu rather than leave it floating over nothing.
	useEffect(() => {
		if (!editor) return;

		const read = () => {
			const { selection } = editor.state;
			if (!selection.empty || !editor.isEditable) return setState(null);

			const { $from } = selection;
			if ($from.parent.type.name !== "paragraph") return setState(null);

			const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
			const match = /^\/([a-z0-9]*)$/i.exec(textBefore);
			if (!match) {
				// The trigger is gone, so a dismissal of it has nothing left to apply
				// to - the next slash typed here should open the menu normally.
				dismissedFromRef.current = null;
				return setState(null);
			}

			const from = $from.pos - textBefore.length;
			// Dismissed with Escape and the trigger is still sitting in the text.
			// Staying shut is the whole point of having pressed Escape.
			if (dismissedFromRef.current === from) return setState(null);

			const coords = editor.view.coordsAtPos(from);
			const query = match[1] ?? "";

			/*
			 * BAIL WHEN NOTHING MOVED. This runs on every transaction, and a fresh
			 * object each time is a new state value each time, so React re-renders
			 * on every keystroke of every kind - including transactions the menu had
			 * no part in. That is wasted work on its own and it was the multiplier
			 * that turned a redundant setContent into "maximum update depth
			 * exceeded".
			 */
			setState((current) =>
				current &&
				current.from === from &&
				current.query === query &&
				current.left === coords.left &&
				current.caretBottom === coords.bottom
					? current
					: {
							caretBottom: coords.bottom,
							caretTop: coords.top,
							from,
							left: coords.left,
							query,
						},
			);
			// Only when the query itself changed. Resetting on every transaction
			// would drag the highlight back to the first row under the user's arrow
			// keys.
			setActiveIndex((current) => (query === lastQueryRef.current ? current : 0));
			lastQueryRef.current = query;
		};

		editor.on("transaction", read);
		return () => {
			editor.off("transaction", read);
		};
	}, [editor]);

	/*
	 * Keys are taken in the CAPTURE phase on the editor's own DOM node, which is
	 * what puts this ahead of ProseMirror's handler on the same element. While the
	 * menu is open Enter and the arrows belong to it; the moment it closes they go
	 * straight back to the document, or Enter stops making paragraphs.
	 */
	useEffect(() => {
		if (!editor || !state) return;
		const dom = editor.view.dom;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				// The literal slash STAYS. Closing a menu must not delete what the
				// user typed - they may have meant the character. The trigger is
				// recorded as dismissed so the next transaction does not reopen the
				// menu over the text that is still there.
				event.preventDefault();
				event.stopPropagation();
				dismissedFromRef.current = state.from;
				close();
				return;
			}
			if (items.length === 0) return;

			if (event.key === "ArrowDown" || event.key === "ArrowUp") {
				event.preventDefault();
				event.stopPropagation();
				setActiveIndex((current) => {
					const next = event.key === "ArrowDown" ? current + 1 : current - 1;
					return (next + items.length) % items.length;
				});
				return;
			}
			if (event.key === "Enter" || event.key === "Tab") {
				const command = items[activeIndex];
				if (!command) return;
				event.preventDefault();
				event.stopPropagation();
				select(command);
			}
		};

		dom.addEventListener("keydown", onKeyDown, true);
		return () => dom.removeEventListener("keydown", onKeyDown, true);
	}, [activeIndex, close, editor, items, select, state]);

	return { activeIndex, close, isOpen: state !== null, items, select, state };
}

interface RichTextSlashMenuProps {
	activeIndex: number;
	items: SlashCommand[];
	onSelect: (command: SlashCommand) => void;
	state: SlashState | null;
}

/**
 * The panel.
 *
 * ## Portalled to `body`
 *
 * `position: fixed` is not enough on its own, and believing it is cost a
 * debugging pass. A fixed element is still laid out inside its ancestors'
 * stacking context, and the parent CAPS the child - the labs layout wraps its
 * content in a `relative z-10` box, so a `z-30` panel inside it still painted
 * underneath the cards further down the page. Any ancestor with a transform, an
 * opacity below 1 or a filter does the same thing, which in this app is most
 * cards. A portal takes it out of that hierarchy entirely.
 *
 * ## `role="listbox"` rather than HeroUI's ListBox
 *
 * A deliberate trade rather than an oversight: `ListBox` manages its own focus,
 * and focus here must stay in the document so the author keeps typing to filter.
 * A focus-owning listbox would take the caret out of the text on the first arrow
 * key. The ROW treatment - icon tile, label, category - is AppSearchBar's, so
 * the two read as the same kind of list.
 */
/**
 * A callback ref rather than an effect: it fires when the active row MOUNTS or
 * changes identity, which is exactly the moment the highlight moved, and it
 * needs no dependency list that could go stale.
 *
 * `nearest` so a row already on screen does not get yanked to the middle - the
 * panel should only move when it has to.
 */
function scrollActiveIntoView(node: HTMLButtonElement | null) {
	node?.scrollIntoView({ block: "nearest" });
}

export function RichTextSlashMenu({ activeIndex, items, onSelect, state }: RichTextSlashMenuProps) {
	// `document` is absent on the server, and the menu cannot be open there
	// anyway - it needs a caret.
	if (!state || typeof document === "undefined") return null;

	/*
	 * FLIP UP WHEN THERE IS NO ROOM BELOW, the way a tooltip does.
	 *
	 * Anchored to the caret's bottom edge normally; to its top edge when the
	 * panel would run off the bottom of the window. Without this, typing `/` on
	 * the last visible line opens a menu whose rows are below the fold - the user
	 * has to scroll the page to read a menu that is following their caret, and
	 * scrolling moves the caret.
	 */
	const flipUp = window.innerHeight - state.caretBottom < PANEL_MAX_HEIGHT;
	const position = flipUp
		? { bottom: window.innerHeight - state.caretTop + 6, left: state.left }
		: { left: state.left, top: state.caretBottom + 6 };

	return createPortal(
		<div
			/* w-80, not w-64. At 64 the label and its category were competing for the
			   same line and "Numbered list" truncated - a menu whose rows cannot show
			   their own names is a menu you have to guess at. 80 fits the longest
			   label and its category with room left, and is still narrow enough to
			   read as a popup rather than as a panel. */
			className="glass-strong fixed z-50 w-80 overflow-hidden rounded-2xl border border-border shadow-soft"
			data-cy="rich-text-slash-menu"
			data-placement={flipUp ? "top" : "bottom"}
			style={position}
		>
			{items.length === 0 ? (
				/* Said, not silent. A panel that simply vanishes on a bad query reads
				   as the feature being broken rather than as no results. */
				<p
					className="px-3 py-4 text-sm text-muted"
					data-cy="slash-empty"
				>
					No blocks match “{state.query}”.
				</p>
			) : (
				/* A div rather than a ul: `role="listbox"` on a list element is an
				   interactive role on a non-interactive element, which the linter
				   rejects and screen readers do read inconsistently. The generic box
				   is the element ARIA's own listbox pattern assumes. */
				<div
					aria-label="Insert a block"
					/* space-y-0.5 so the rows do not touch. Two adjacent filled rows
					   with no gap read as one block of colour, which is what made the
					   hovered row look like it was bleeding into the active one. */
					className="max-h-72 space-y-0.5 overflow-y-auto p-1.5"
					role="listbox"
				>
					{items.map((command, index) => (
						<button
							aria-selected={index === activeIndex}
							className={cn(
								"flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition",
								/*
								 * TWO STATES THAT MUST NOT BE CONFUSED, and neither may bleed
								 * onto its neighbours.
								 *
								 * The active row is a CURSOR - what Enter inserts. The hovered
								 * row is where the pointer happens to be. They started as the
								 * same faint `bg-muted-surface`, which said neither.
								 *
								 * `ring-inset`, not `ring-2`. A plain ring is drawn OUTSIDE the
								 * element's box, so at zero row spacing it laps over the rows
								 * above and below - which is exactly the overlap that showed
								 * up between the active row and the one under the pointer.
								 * Inset keeps every pixel of the state inside the row it
								 * describes.
								 *
								 * The hover fill is mixed from --foreground rather than being
								 * `bg-muted-surface`, which on this glass panel is almost the
								 * panel's own colour. 7% is visible on both themes without
								 * competing with the accent tint that marks the cursor.
								 */
								index === activeIndex
									? "bg-[color-mix(in_oklab,var(--accent)_16%,var(--surface))] ring-1 ring-accent/60 ring-inset"
									: "hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]",
							)}
							data-cy={`slash-${command.label.toLowerCase().replace(/\s+/g, "-")}`}
							key={command.label}
							onClick={() => onSelect(command)}
							/* Nine commands in a panel that shows about five. Without this the
							   highlight walks off the bottom under the arrow keys and the menu
							   looks frozen on the last visible row. */
							ref={index === activeIndex ? scrollActiveIntoView : undefined}
							role="option"
							type="button"
						>
							<span
								className={cn(
									"flex size-7 shrink-0 items-center justify-center rounded-lg border",
									index === activeIndex ? "border-accent/40 text-accent" : "border-border",
								)}
							>
								<command.icon
									aria-hidden="true"
									className="size-3.5"
								/>
							</span>
							<span className="min-w-0 flex-1 truncate text-sm font-medium">{command.label}</span>
							<span className="shrink-0 text-xs text-muted">{command.category}</span>
						</button>
					))}
				</div>
			)}

			<div className="flex items-center gap-2 border-t border-border px-3 py-2 text-xs text-muted">
				<Kbd>↑↓</Kbd>
				<span>navigate</span>
				<Kbd>↵</Kbd>
				<span>insert</span>
				<Kbd>esc</Kbd>
				<span>dismiss</span>
			</div>
		</div>,
		document.body,
	);
}
