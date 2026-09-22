import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import { ExternalLink, Link2Off, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppButton } from "../AppButton";
import { AppTooltip } from "../AppTooltip";

interface LinkPreviewState {
	href: string;
	left: number;
	/**
	 * A document position INSIDE the hovered link.
	 *
	 * This is what makes Edit work from a hover. Hovering moves the pointer and
	 * not the caret, so by the time Edit is pressed the selection is still
	 * wherever the author left it - `getAttributes("link")` reads from the
	 * selection and comes back empty, and the dialog opened with a blank field
	 * over a link that already had an address. Carrying the position lets the
	 * caret be put inside the right link first.
	 */
	pos: number;
	top: number;
}

/** Long enough to cross the gap between the link and the panel, short enough
 *  that the panel does not linger over text the user has moved on from. */
const HIDE_DELAY_MS = 180;

/**
 * Watches for a link under the pointer, or under the caret.
 *
 * ## Both, not just hover
 *
 * Hover is what was asked for and it is not sufficient on its own: a link
 * reachable only by pointing is a link a keyboard user cannot open, and the
 * editor sets `openOnClick: false` so clicking it in the document does nothing
 * either. The caret trigger is what makes the panel reachable by moving through
 * the text, which is how someone editing a post gets to it anyway.
 *
 * ## Why the delay
 *
 * The panel appears BELOW the link, so the pointer has to cross a gap of dead
 * space to reach it. Hiding on `mouseout` immediately makes that crossing
 * impossible and the panel unusable - it vanishes exactly when it is aimed at.
 */
export function useLinkPreview(editor: Editor | null) {
	const [state, setState] = useState<LinkPreviewState | null>(null);
	const hideTimerRef = useRef<number | null>(null);

	const cancelHide = () => {
		if (hideTimerRef.current !== null) {
			window.clearTimeout(hideTimerRef.current);
			hideTimerRef.current = null;
		}
	};

	const scheduleHide = () => {
		cancelHide();
		hideTimerRef.current = window.setTimeout(() => setState(null), HIDE_DELAY_MS);
	};

	useEffect(() => {
		if (!editor) return;
		const dom = editor.view.dom;

		const showFor = (anchor: HTMLAnchorElement) => {
			cancelHide();
			const rect = anchor.getBoundingClientRect();
			/*
			 * `+ 1` steps INSIDE the link rather than landing on the boundary before
			 * it, where the mark does not apply and `extendMarkRange` would find
			 * nothing to extend.
			 */
			const pos = editor.view.posAtDOM(anchor, 0) + 1;
			setState({ href: anchor.getAttribute("href") ?? "", left: rect.left, pos, top: rect.bottom });
		};

		const onOver = (event: MouseEvent) => {
			const anchor = (event.target as HTMLElement | null)?.closest?.("a");
			if (anchor instanceof HTMLAnchorElement && dom.contains(anchor)) showFor(anchor);
		};

		const onOut = (event: MouseEvent) => {
			const anchor = (event.target as HTMLElement | null)?.closest?.("a");
			if (anchor) scheduleHide();
		};

		/*
		 * The caret path. `isActive("link")` is true when the cursor sits inside
		 * one, and the anchor is found from the DOM node at that position - the
		 * mark itself carries no rectangle.
		 */
		const onSelection = () => {
			if (!editor.isActive("link")) {
				if (hideTimerRef.current === null) scheduleHide();
				return;
			}
			const node = editor.view.domAtPos(editor.state.selection.from).node;
			const element = node instanceof HTMLElement ? node : node.parentElement;
			const anchor = element?.closest("a");
			if (anchor instanceof HTMLAnchorElement) showFor(anchor);
		};

		dom.addEventListener("mouseover", onOver);
		dom.addEventListener("mouseout", onOut);
		editor.on("selectionUpdate", onSelection);

		return () => {
			cancelHide();
			dom.removeEventListener("mouseover", onOver);
			dom.removeEventListener("mouseout", onOut);
			editor.off("selectionUpdate", onSelection);
		};
	}, [editor]);

	return { cancelHide, close: () => setState(null), scheduleHide, state };
}

interface RichTextLinkPreviewProps {
	onEdit: () => void;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
	onRemove: () => void;
	state: LinkPreviewState | null;
}

/**
 * The panel over a link: where it points, and the three things you can do
 * about it.
 *
 * ## The address is a control too
 *
 * It is a real anchor, so the thing you want to click is the thing you are
 * already looking at - and there is an explicit Open button beside it for
 * anyone who reads the row as a label rather than a link. Both open in a new
 * tab, because the alternative is navigating away from a half-written post.
 *
 * ## Portalled, for the same reason the slash menu is
 *
 * `position: fixed` is still capped by an ancestor's stacking context, and this
 * one is nested inside a card inside a `relative z-10` layout.
 *
 * HEROUI GAP, same family as the bubble menu: this anchors to an arbitrary
 * `<a>` inside a document, and `AppRichTooltip` anchors to an element it wraps.
 * The panel's contents are ours; only the positioning is hand-rolled.
 */
export function RichTextLinkPreview({ onEdit, onMouseEnter, onMouseLeave, onRemove, state }: RichTextLinkPreviewProps) {
	if (!state || typeof document === "undefined") return null;

	return createPortal(
		<div
			className="glass-strong fixed z-50 flex max-w-sm items-center gap-1 rounded-2xl border border-border p-1.5 shadow-soft"
			data-cy="rich-text-link-preview"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			style={{ left: state.left, top: state.top + 6 }}
		>
			<a
				className="min-w-0 flex-1 truncate rounded-xl px-2.5 py-1.5 text-sm text-accent underline underline-offset-2 hover:bg-muted-surface"
				data-cy="link-preview-href"
				href={state.href}
				rel="noopener noreferrer nofollow"
				target="_blank"
			>
				{state.href}
			</a>

			{/*
			 * Three real actions, each named by a tooltip.
			 *
			 * The glyph that used to sit here was decoration - an ExternalLink with
			 * no press behind it, which reads exactly like a disabled button and was
			 * reported as one. An icon that looks pressable must be pressable; if it
			 * is not, it should not look like a control.
			 */}
			<PreviewAction
				description="Opens in a new tab, so a half-written post is not left behind"
				icon={ExternalLink}
				label="Open link"
				name="open"
				onPress={() => {
					window.open(state.href, "_blank", "noopener,noreferrer");
				}}
			/>
			<PreviewAction
				description="Change where this text points"
				icon={Pencil}
				label="Edit link"
				name="edit"
				onPress={onEdit}
			/>
			<PreviewAction
				description="Keeps the words, drops the link"
				icon={Link2Off}
				label="Remove link"
				name="remove"
				onPress={onRemove}
			/>
		</div>,
		document.body,
	);
}

/**
 * One action in the panel.
 *
 * Icon-only, so the tooltip is not a nicety - it is the only place the action's
 * name is written for a sighted user, and `aria-label` is the only place it is
 * written for anyone else. AppButton makes the label a type error to omit on the
 * icon-only branch, which is what stops the two drifting apart.
 *
 * The tooltip carries the action's OWN glyph rather than AppTooltip's default
 * Info icon: on a row of three icons, a card headed by a question mark makes the
 * reader match the tooltip back to the button they are pointing at.
 */
function PreviewAction({
	description,
	icon,
	label,
	name,
	onPress,
}: {
	description: string;
	icon: LucideIcon;
	label: string;
	name: string;
	onPress: () => void;
}) {
	return (
		<AppTooltip
			description={description}
			icon={icon}
			placement="bottom"
			title={label}
		>
			<AppButton
				aria-label={label}
				data-cy={`link-preview-${name}`}
				icon={icon}
				isIconOnly
				onPress={onPress}
				size="sm"
				variant="ghost"
			/>
		</AppTooltip>
	);
}
