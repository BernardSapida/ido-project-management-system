import type { ReactNode } from "react";

/**
 * Wraps every run of `text` matching `query` in a `<mark>`.
 *
 * ONE implementation for the whole app. The search panel and the table are the
 * two places a user types something and expects to see where it landed, and two
 * copies of this would eventually disagree about the treatment - which is worse
 * than either being wrong, because the same word would look like two different
 * kinds of match on two screens.
 *
 * `<mark>` rather than a span: it is what the element is for and it survives
 * being read out. Its default yellow is dropped - weight and the accent carry
 * it, which holds up over a table row's hover and over the search panel's
 * highlighted row alike.
 *
 * Matching is LITERAL, never a regular expression. Real data is full of strings
 * that are also patterns - `C++`, `WH-4200*`, `(Annex)`: compiled as a pattern,
 * `C++` means "one or more +" after a C and matches the wrong thing, `(` throws
 * outright, and a phone number typed with `.` matches every character. `indexOf`
 * has none of those failure modes and is what a user means by "search" anyway.
 *
 * Returns the string untouched when there is nothing to mark, so a table that
 * is not being searched renders exactly the nodes it rendered before - no
 * wrapper spans, no keys, no change to the DOM at all.
 */
export function markMatches(text: string, query: string): ReactNode {
	const needle = query.trim();
	// An empty needle would make `indexOf` return 0 forever. It is also the
	// overwhelmingly common case, and the cheapest possible answer is right.
	if (!needle || !text) return text;

	const haystack = text.toLowerCase();
	const lowered = needle.toLowerCase();
	if (!haystack.includes(lowered)) return text;

	const parts: ReactNode[] = [];
	let cursor = 0;
	let at = haystack.indexOf(lowered);

	while (at !== -1) {
		if (at > cursor) parts.push(text.slice(cursor, at));
		parts.push(
			/*
			 * The matched slice comes from `text`, not from the query, so the row
			 * keeps its own capitalisation - typing "makati" must not repaint the
			 * cell as lower-case.
			 */
			<mark
				className="bg-transparent font-semibold text-accent"
				key={`${at}-${cursor}`}
			>
				{text.slice(at, at + needle.length)}
			</mark>,
		);
		cursor = at + needle.length;
		at = haystack.indexOf(lowered, cursor);
	}

	if (cursor < text.length) parts.push(text.slice(cursor));
	return parts;
}
