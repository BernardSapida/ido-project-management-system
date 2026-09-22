import { Separator } from "@heroui/react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { LucideIcon } from "lucide-react";
import { Bold, Italic, Link2, Strikethrough, Underline } from "lucide-react";
import { AppButton } from "../AppButton";
import { AppToggleButton } from "../AppToggleButton";
import { AppTooltip } from "../AppTooltip";
import { MOD, SHIFT } from "./keyboard";

interface RichTextBubbleMenuProps {
	editor: Editor;
	onRequestLink: () => void;
}

/**
 * The menu that appears over a selection.
 *
 * ## The one thing here that is not HeroUI
 *
 * Positioning. There is no floating selection menu in HeroUI v3 and none in this
 * repo, and `AppRichTooltip` is not a substitute: it is hover-triggered and
 * anchored to an ELEMENT, while this has to anchor to a document RANGE that
 * moves as the selection changes. So the shell comes from Tiptap's own
 * `BubbleMenu` and everything inside it is ours - the same `AppToggleButton` the
 * toolbar uses, so a control cannot look or behave differently depending on
 * which surface it was reached from.
 *
 * ## Why it carries less than the toolbar
 *
 * Five controls, all of them marks. A bubble menu repeating Heading 1 and Bullet
 * list is a second toolbar competing with the first, and it appears at the moment
 * the user is least able to scan it - mid-selection, over their own text. Block
 * controls stay in the toolbar and in the slash menu, both of which are read
 * deliberately rather than glanced at.
 */
export function RichTextBubbleMenu({ editor, onRequestLink }: RichTextBubbleMenuProps) {
	const state = useEditorState({
		editor,
		selector: ({ editor: instance }) => ({
			isBold: instance.isActive("bold"),
			isItalic: instance.isActive("italic"),
			isLink: instance.isActive("link"),
			isStrike: instance.isActive("strike"),
			isUnderline: instance.isActive("underline"),
		}),
	});

	return (
		<BubbleMenu
			/*
			 * APPENDED TO THE BODY, not to the editor's parent - which is what
			 * `appendTo` defaults to, and which is wrong here twice over.
			 *
			 * The editor sits inside a box with `overflow-hidden` (it has a border
			 * and a radius, and the toolbar and footer have to be clipped to it), so
			 * a menu positioned above the selection is cut off at the box's edge -
			 * and the selection nearest the top is exactly where the menu wants to
			 * be. The same parent is also inside the wrapper that Preview sets to
			 * `hidden`, so the menu would be mounted in a `display: none` subtree
			 * whenever preview had been opened.
			 *
			 * The body has neither problem. It is the same fix the slash menu and the
			 * link preview needed, for the same reason: a floating layer cannot live
			 * inside the box it floats over.
			 */
			appendTo={() => document.body}
			editor={editor}
			options={{ placement: "top", offset: 8 }}
			/*
			 * Not shown inside a code block. Bold inside code is not a thing the
			 * document can express, so offering it produces a menu whose buttons do
			 * nothing - which reads as broken rather than as inapplicable.
			 */
			shouldShow={({ editor: instance, from, to }) =>
				from !== to && !instance.isActive("codeBlock") && instance.isEditable
			}
		>
			{/*
			 * glass-strong + shadow-soft is the app's own popover treatment, so this
			 * reads as the same kind of layer as a dropdown rather than as a widget
			 * the editor brought with it.
			 */}
			<div
				className="glass-strong flex items-center gap-1 rounded-2xl border border-border p-1 shadow-soft"
				data-cy="rich-text-bubble-menu"
			>
				<BubbleToggle
					icon={Bold}
					isSelected={state.isBold}
					label="Bold"
					onChange={() => editor.chain().focus().toggleBold().run()}
					shortcut={`${MOD} B`}
				/>
				<BubbleToggle
					icon={Italic}
					isSelected={state.isItalic}
					label="Italic"
					onChange={() => editor.chain().focus().toggleItalic().run()}
					shortcut={`${MOD} I`}
				/>
				<BubbleToggle
					icon={Underline}
					isSelected={state.isUnderline}
					label="Underline"
					onChange={() => editor.chain().focus().toggleUnderline().run()}
					shortcut={`${MOD} U`}
				/>
				<BubbleToggle
					icon={Strikethrough}
					isSelected={state.isStrike}
					label="Strikethrough"
					onChange={() => editor.chain().focus().toggleStrike().run()}
					shortcut={`${MOD} ${SHIFT} S`}
				/>

				<Separator
					className="mx-0.5 h-5 self-center"
					orientation="vertical"
				/>

				<AppTooltip
					description="Point this text somewhere"
					icon={Link2}
					placement="top"
					title={state.isLink ? "Edit link" : "Add link"}
				>
					<AppButton
						aria-label={state.isLink ? "Edit link" : "Add link"}
						className={state.isLink ? "text-accent" : undefined}
						data-cy="bubble-link"
						icon={Link2}
						isIconOnly
						onPress={onRequestLink}
						size="sm"
						variant="ghost"
					/>
				</AppTooltip>
			</div>
		</BubbleMenu>
	);
}

/**
 * Same rule as the toolbar: an icon-only control gets a tooltip carrying its
 * name and its shortcut, and the tooltip wears the control's own glyph rather
 * than AppTooltip's default Info. The bubble menu had none, which meant the very
 * same Bold button explained itself in one surface and not in the other.
 *
 * Placed `top` because this panel already sits above the selection - a tooltip
 * below it would cover the words the user is formatting.
 */
function BubbleToggle({
	icon: Icon,
	isSelected,
	label,
	onChange,
	shortcut,
}: {
	icon: LucideIcon;
	isSelected: boolean;
	label: string;
	onChange: () => void;
	shortcut: string;
}) {
	return (
		<AppTooltip
			description={shortcut}
			icon={Icon}
			placement="top"
			title={label}
		>
			<AppToggleButton
				aria-label={label}
				data-cy={`bubble-${label.toLowerCase()}`}
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
		</AppTooltip>
	);
}
