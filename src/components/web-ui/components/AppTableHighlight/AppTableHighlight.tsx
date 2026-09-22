import { markMatches } from "../../internal";
import { createContext, useContext } from "react";

/**
 * The live search term, published by `AppTable` so any cell can mark its own
 * matches without every column's `render` having to be handed the query.
 *
 * Empty string means "not searching", which is the resting state and the reason
 * this is a plain string rather than `string | null` - there is nothing to
 * distinguish "no search" from "search cleared".
 */
const TableHighlightContext = createContext<string>("");

export const AppTableHighlightProvider = TableHighlightContext.Provider;

/**
 * Marks the parts of `text` matching the table's current search.
 *
 * `AppTable` applies this to every plain-text cell on its own. Reach for the
 * component directly inside a column's `render`, which is the only place the
 * table cannot do it for you:
 *
 * ```tsx
 * render: (row) => (
 *   <span className="font-medium">
 *     <AppTableHighlight>{row.name}</AppTableHighlight>
 *   </span>
 * )
 * ```
 *
 * The treatment itself lives in `markMatches`, shared with the search panel -
 * the two are the only places a user types something and expects to see where
 * it landed, and they have to agree about what a match looks like.
 */
export function AppTableHighlight({ children }: { children: string }) {
	const query = useContext(TableHighlightContext);
	return <>{markMatches(children, query)}</>;
}
