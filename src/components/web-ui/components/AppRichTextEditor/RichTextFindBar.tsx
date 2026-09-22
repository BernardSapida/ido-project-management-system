import { Input, Label, TextField } from "@heroui/react";
import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import { CaseSensitive, ChevronDown, ChevronUp, WholeWord, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppButton } from "../AppButton";
import { AppToggleButton } from "../AppToggleButton";
import { AppTooltip } from "../AppTooltip";
import { activeMatchRange, readSearchState, type SearchOptions } from "./rich-text-search";

interface RichTextFindBarProps {
	editor: Editor;
	onClose: () => void;
}

/**
 * Find and replace within the post.
 *
 * ## A row under the toolbar, not a floating panel
 *
 * It belongs to the editor it searches, and a panel laid over the text hides
 * the matches it is counting - which is the one thing the user opened it to
 * look at.
 *
 * ## Finding never edits; replacing always does
 *
 * The two halves are deliberately different. Every match is a ProseMirror
 * decoration, so searching a post cannot make it dirty or fill undo with search
 * results. Replace writes to the document - and each replace is ONE
 * transaction, so Replace all is one undo step rather than forty.
 */
export function RichTextFindBar({ editor, onClose }: RichTextFindBarProps) {
	const [term, setTerm] = useState("");
	const [replacement, setReplacement] = useState("");
	const [options, setOptions] = useState<SearchOptions>({ matchCase: false, wholeWords: false });
	const { activeIndex, total } = readSearchState(editor.state);

	// Focus lands here on open: the bar exists to be typed in, and landing
	// anywhere else costs a click before it does anything.
	useEffect(() => {
		document.querySelector<HTMLInputElement>('[data-cy="find-input"]')?.focus();
	}, []);

	// Clearing on the way out is not tidiness - the decorations would otherwise
	// stay painted over a document nobody is searching any more.
	useEffect(() => {
		return () => {
			editor.commands.setSearchTerm("");
		};
	}, [editor]);

	/** Re-runs the search. Any change to the term OR the options has to go
	 *  through here, or the count and the highlights answer a stale question. */
	const search = (nextTerm: string, nextOptions: SearchOptions) => {
		setTerm(nextTerm);
		setOptions(nextOptions);
		editor.commands.setSearchTerm(nextTerm, nextOptions);
	};

	const step = (direction: 1 | -1) => {
		editor.commands.stepSearch(direction);
		const range = activeMatchRange(editor.state);
		// Scrolled into sight, because "4 of 30" is not useful if the fourth is
		// three screens down.
		if (range) editor.commands.setTextSelection(range);
		editor.commands.scrollIntoView();
	};

	const hasMatches = total > 0;

	return (
		<div
			className="flex flex-col gap-2 border-b border-border bg-muted-surface px-2 py-2"
			data-cy="rich-text-find-bar"
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					event.preventDefault();
					onClose();
					// Focus goes back to the words, not to the top of the page.
					editor.commands.focus();
				}
				if (event.key === "Enter") {
					event.preventDefault();
					step(event.shiftKey ? -1 : 1);
				}
			}}
		>
			<div className="flex flex-wrap items-center gap-2">
				<TextField
					aria-label="Find in this post"
					className="min-w-0 flex-1"
					onChange={(next) => search(next, options)}
					value={term}
				>
					<Label className="sr-only">Find in this post</Label>
					<Input
						autoComplete="off"
						data-cy="find-input"
						placeholder="Find"
						spellCheck={false}
					/>
				</TextField>

				{/*
				 * The two options sit WITH the find field, not with replace: they
				 * change what counts as a match, so they belong to the question rather
				 * than to the answer.
				 */}
				<FindOption
					description="Doc and doc are different words"
					icon={CaseSensitive}
					isSelected={options.matchCase}
					label="Match case"
					name="match-case"
					onChange={(next) => search(term, { ...options, matchCase: next })}
				/>
				<FindOption
					description="doc stops matching inside document"
					icon={WholeWord}
					isSelected={options.wholeWords}
					label="Whole words"
					name="whole-words"
					onChange={(next) => search(term, { ...options, wholeWords: next })}
				/>

				{/*
				 * "n of m", and "No matches" in words when there are none. A bare 0/0
				 * is a state the reader has to decode, and the difference between
				 * "nothing typed yet" and "nothing found" is worth saying out loud.
				 */}
				<span
					className="shrink-0 text-xs text-muted tabular-nums"
					data-cy="find-count"
				>
					{term.trim() === "" ? "" : hasMatches ? `${activeIndex + 1} of ${total}` : "No matches"}
				</span>

				<AppButton
					aria-label="Previous match"
					data-cy="find-previous"
					icon={ChevronUp}
					isDisabled={!hasMatches}
					isIconOnly
					onPress={() => step(-1)}
					size="sm"
					variant="ghost"
				/>
				<AppButton
					aria-label="Next match"
					data-cy="find-next"
					icon={ChevronDown}
					isDisabled={!hasMatches}
					isIconOnly
					onPress={() => step(1)}
					size="sm"
					variant="ghost"
				/>
				<AppButton
					aria-label="Close find"
					data-cy="find-close"
					icon={X}
					isIconOnly
					onPress={() => {
						onClose();
						editor.commands.focus();
					}}
					size="sm"
					variant="ghost"
				/>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<TextField
					aria-label="Replace with"
					className="min-w-0 flex-1"
					onChange={setReplacement}
					value={replacement}
				>
					<Label className="sr-only">Replace with</Label>
					<Input
						autoComplete="off"
						data-cy="replace-input"
						placeholder="Replace with"
						spellCheck={false}
					/>
				</TextField>

				{/*
				 * Both DISABLED until there is something to replace. A Replace all that
				 * is pressable with no matches teaches the user that pressing it does
				 * nothing, which is the wrong lesson for the one button here that can
				 * change forty places at once.
				 */}
				<AppButton
					data-cy="replace-one"
					isDisabled={!hasMatches}
					onPress={() => {
						editor.commands.replaceMatch(replacement);
					}}
					size="sm"
					variant="secondary"
				>
					Replace
				</AppButton>
				<AppButton
					data-cy="replace-all"
					isDisabled={!hasMatches}
					onPress={() => {
						editor.commands.replaceAllMatches(replacement);
					}}
					size="sm"
					variant="secondary"
				>
					{/* The count is in the LABEL, because "Replace all" says nothing
					    about how much is about to change. One undo step, so this is
					    recoverable - but it should still say what it is about to do. */}
					Replace all{hasMatches ? ` (${total})` : ""}
				</AppButton>
			</div>
		</div>
	);
}

/** An option that changes what counts as a match. Icon-only, so tooltipped. */
function FindOption({
	description,
	icon: OptionIcon,
	isSelected,
	label,
	name,
	onChange,
}: {
	description: string;
	icon: LucideIcon;
	isSelected: boolean;
	label: string;
	name: string;
	onChange: (isSelected: boolean) => void;
}) {
	return (
		<AppTooltip
			description={description}
			icon={OptionIcon}
			placement="bottom"
			title={label}
		>
			<AppToggleButton
				aria-label={label}
				data-cy={`find-${name}`}
				isIconOnly
				isSelected={isSelected}
				onChange={onChange}
				size="sm"
				variant="ghost"
			>
				<OptionIcon
					aria-hidden="true"
					className="size-4"
				/>
			</AppToggleButton>
		</AppTooltip>
	);
}
