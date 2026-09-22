import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Find within the document.
 *
 * ## Why this is written here rather than installed
 *
 * There is no official Tiptap search extension, and the only community one is a
 * single-maintainer package sitting at 0.1.1. That is not a dependency to put in
 * a template every other project inherits, and what it does is a decoration
 * plugin - which is this file.
 *
 * ## Decorations, never edits
 *
 * The matches are DECORATIONS. Nothing here writes to the document, and that is
 * the load-bearing property: a search that edits makes an untouched post dirty,
 * puts "unsaved changes" in front of someone who only looked for a word, and
 * fills undo with search results. It also means the highlights vanish the moment
 * the search is cleared, with no cleanup pass to forget.
 *
 * ## No replace
 *
 * Replacing mutates, needs its own undo story and a scope rule, and is the half
 * of find-and-replace that can lose work. It is a separate decision.
 */

export const richTextSearchKey = new PluginKey<SearchState>("richTextSearch");

export interface SearchOptions {
	/** `Doc` and `doc` are different words. Off by default, as everywhere else. */
	matchCase: boolean;
	/** `doc` must not match inside `document`. */
	wholeWords: boolean;
}

interface SearchState {
	/** Byte ranges of every match, in document order. */
	matches: { from: number; to: number }[];
	/** Which match is current, as an index into `matches`. */
	activeIndex: number;
	decorations: DecorationSet;
	options: SearchOptions;
	term: string;
}

const EMPTY: SearchState = {
	activeIndex: 0,
	decorations: DecorationSet.empty,
	matches: [],
	options: { matchCase: false, wholeWords: false },
	term: "",
};

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		richTextSearch: {
			replaceAllMatches: (replacement: string) => ReturnType;
			replaceMatch: (replacement: string) => ReturnType;
			setSearchTerm: (term: string, options?: SearchOptions) => ReturnType;
			stepSearch: (direction: 1 | -1) => ReturnType;
		};
	}
}

/**
 * Escaped, because the term comes from a text field.
 *
 * Someone searching for `a.b` means those three characters, and a search box
 * that quietly treats it as a pattern finds `axb` and looks broken. Regular
 * expressions are a feature to offer deliberately, not a side effect of not
 * escaping.
 */
function escapeRegExp(term: string): string {
	return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMatches(doc: import("@tiptap/pm/model").Node, term: string, options: SearchOptions) {
	const matches: { from: number; to: number }[] = [];
	if (term.trim() === "") return matches;

	/*
	 * `\b` for whole words, which is what makes "doc" stop matching inside
	 * "document". It is a word BOUNDARY rather than a space check, so a match at
	 * the start of a paragraph or against punctuation still counts - "doc." and
	 * "(doc)" are the word, and a space-based test would miss both.
	 */
	const source = options.wholeWords ? `\\b${escapeRegExp(term)}\\b` : escapeRegExp(term);
	const pattern = new RegExp(source, options.matchCase ? "g" : "gi");

	/*
	 * Per TEXT NODE, so a match cannot straddle a block boundary - "end" and
	 * "Beginning" in two paragraphs are not an "endBeginning" to be found. It
	 * also keeps every position a real document position rather than an offset
	 * into a flattened string that would need mapping back.
	 */
	doc.descendants((node, pos) => {
		if (!node.isText || !node.text) return;
		for (const found of node.text.matchAll(pattern)) {
			if (found.index === undefined) continue;
			matches.push({ from: pos + found.index, to: pos + found.index + found[0].length });
		}
	});

	return matches;
}

/**
 * Two classes, not one: the CURRENT match has to be findable by eye among the
 * others, or "3 of 40" is not an answer to anything.
 *
 * Takes the doc it decorates, because a DecorationSet is bound to the document
 * its positions were measured in - building one against a different doc is how
 * highlights end up a few characters off.
 */
function decorate(
	doc: import("@tiptap/pm/model").Node,
	matches: { from: number; to: number }[],
	activeIndex: number,
): DecorationSet {
	if (matches.length === 0) return DecorationSet.empty;

	return DecorationSet.create(
		doc,
		matches.map((match, index) =>
			Decoration.inline(match.from, match.to, {
				class: index === activeIndex ? "rich-text-match rich-text-match--active" : "rich-text-match",
			}),
		),
	);
}

export const RichTextSearch = Extension.create({
	name: "richTextSearch",

	addCommands() {
		return {
			setSearchTerm:
				(term: string, options: SearchOptions = { matchCase: false, wholeWords: false }) =>
				({ state, dispatch }) => {
					const matches = findMatches(state.doc, term, options);
					dispatch?.(state.tr.setMeta(richTextSearchKey, { activeIndex: 0, matches, options, term }));
					return true;
				},

			stepSearch:
				(direction: 1 | -1) =>
				({ state, dispatch }) => {
					const current = richTextSearchKey.getState(state) ?? EMPTY;
					if (current.matches.length === 0) return false;

					// Wraps in both directions. A find that stops at the last match
					// makes the user close and reopen it to reach the first one.
					const next = (current.activeIndex + direction + current.matches.length) % current.matches.length;
					dispatch?.(
						state.tr.setMeta(richTextSearchKey, {
							activeIndex: next,
							matches: current.matches,
							options: current.options,
							term: current.term,
						}),
					);
					return true;
				},

			/**
			 * Replaces the CURRENT match only.
			 *
			 * One transaction, so one undo step: pressing Replace four times and
			 * then Ctrl+Z four times puts the post back exactly, which is the
			 * contract a writer assumes. The matches are recomputed by the plugin's
			 * `apply` on the resulting docChanged, so the count and the highlights
			 * follow without a second pass here.
			 */
			replaceMatch:
				(replacement: string) =>
				({ state, dispatch }) => {
					const current = richTextSearchKey.getState(state) ?? EMPTY;
					const match = current.matches[current.activeIndex];
					if (!match) return false;

					dispatch?.(state.tr.insertText(replacement, match.from, match.to));
					return true;
				},

			/**
			 * Replaces every match in ONE transaction, so Replace all is one undo
			 * step rather than forty.
			 */
			replaceAllMatches:
				(replacement: string) =>
				({ state, dispatch }) => {
					const current = richTextSearchKey.getState(state) ?? EMPTY;
					if (current.matches.length === 0) return false;

					const tr = state.tr;
					/*
					 * BACK TO FRONT. Replacing left to right shifts every later
					 * position by the length difference, so the second replacement
					 * lands a few characters off and the last one can be past the end
					 * of the document. Working backwards leaves the positions ahead of
					 * the cursor untouched.
					 */
					for (let index = current.matches.length - 1; index >= 0; index -= 1) {
						const match = current.matches[index];
						if (match) tr.insertText(replacement, match.from, match.to);
					}
					dispatch?.(tr);
					return true;
				},
		};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin<SearchState>({
				key: richTextSearchKey,

				state: {
					init: () => EMPTY,

					apply(tr, value) {
						const meta = tr.getMeta(richTextSearchKey) as Omit<SearchState, "decorations"> | undefined;

						if (meta) {
							return { ...meta, decorations: decorate(tr.doc, meta.matches, meta.activeIndex) };
						}

						if (!tr.docChanged) return value;

						/*
						 * The document changed under an open search, so the matches are
						 * recomputed rather than mapped. Mapping keeps stale ranges alive
						 * through an edit that deleted the text they pointed at, and the
						 * result is a highlight over a word that no longer says what was
						 * searched for.
						 */
						const matches = findMatches(tr.doc, value.term, value.options);
						// Clamped: an edit that removed matches must not leave the index
						// pointing past the end of the list.
						const activeIndex = Math.min(value.activeIndex, Math.max(0, matches.length - 1));
						return {
							activeIndex,
							decorations: decorate(tr.doc, matches, activeIndex),
							matches,
							options: value.options,
							term: value.term,
						};
					},
				},

				props: {
					decorations(state) {
						return richTextSearchKey.getState(state)?.decorations ?? DecorationSet.empty;
					},
				},
			}),
		];
	},
});

/** What the find bar reads to draw "n of m". */
export function readSearchState(state: unknown): { activeIndex: number; total: number } {
	const found = richTextSearchKey.getState(state as never) ?? EMPTY;
	return { activeIndex: found.activeIndex, total: found.matches.length };
}

/** The current match's range, so the view can scroll it into sight. */
export function activeMatchRange(state: unknown): { from: number; to: number } | null {
	const found = richTextSearchKey.getState(state as never) ?? EMPTY;
	return found.matches[found.activeIndex] ?? null;
}
