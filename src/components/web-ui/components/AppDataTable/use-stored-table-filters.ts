import { useEffect, useRef, useState } from "react";
import type { FilterDef } from "../AppFilterBar";

export interface StoredTableFilters {
	filters: Record<string, string | null>;
	search: string;
}

const EMPTY: StoredTableFilters = { filters: {}, search: "" };

/**
 * Keeps a table's filters and search term in localStorage, so leaving the page
 * and coming back does not mean setting them all again.
 *
 * ── The failure this has to defend against ──
 *
 * A restored filter is a query the user did not just make. Come back tomorrow
 * to three rows of fifty-three with nothing saying why, and the honest reading
 * is "the data is gone" - which is the worst state a table can be in and the
 * exact one the always-visible active count exists to prevent. Two things keep
 * that from happening here:
 *
 *   1. The filter panel is open whenever there is anything restored, so the
 *      count and "Clear all" are on screen rather than folded away.
 *   2. Restored values are VALIDATED against what the table currently offers.
 *      A stored `city=Cebu` for a city that has since been removed from the
 *      options would otherwise narrow every future visit to zero rows, be
 *      counted as active, and have no control able to clear it - a filter the
 *      user can neither see nor reach.
 *
 * Deliberately NOT stored: the page number and the sort. A page is a position
 * in a row set that has changed since; restoring page 4 of a list that is now
 * two pages long lands on an empty table. Both reset, and that is the correct
 * answer to "what should I be looking at now".
 */
export function useStoredTableFilters(storageKey: string | undefined, defs: FilterDef[]) {
	const [state, setState] = useState<StoredTableFilters>(EMPTY);
	/**
	 * Whether anything came back from a previous visit. The filter bar reads it
	 * to stay open, because a restored filter the user cannot see is the whole
	 * risk of storing one.
	 */
	const [hasRestored, setHasRestored] = useState(false);
	/**
	 * The key the persist effect below has already run for. It is what makes the
	 * FIRST run for a key a no-op - see the effect for why that run is the one
	 * that used to destroy the stored value.
	 */
	const persistedKey = useRef<string | undefined>(undefined);

	/*
	 * Read after mount, never in a lazy initialiser. This component renders on
	 * the server too, and a table hydrating with three restored filters over
	 * server markup that had none is a mismatch React resolves by throwing the
	 * markup away.
	 */
	useEffect(() => {
		if (!storageKey) return;

		const stored = read(storageKey);
		if (stored) {
			const filters = keepValidFilters(stored.filters, defs);
			const restored = { filters, search: stored.search };
			setState(restored);
			setHasRestored(Object.keys(filters).length > 0 || restored.search.trim() !== "");
		}
		// Once, on mount. `defs` is rebuilt on every render by most callers, and
		// re-running this would stamp the stored value back over a filter the user
		// has since cleared.
	}, [storageKey]);

	/*
	 * ── Why the first run is skipped ──
	 *
	 * This effect runs on the MOUNT commit as well, and on that commit `state` is
	 * still EMPTY: the restore above is queued, not committed - an effect's
	 * setState lands on the next render, and both effects belong to this one. A
	 * write here therefore stores `{filters:{},search:""}` over whatever the last
	 * visit left, before the restored value has had a chance to exist.
	 *
	 * That used to look survivable, because the next commit writes the restored
	 * value straight back. It is not: the table MOUNTS TWICE during hydration
	 * (measured - unmount 6ms after mount), and the second mount's read runs
	 * against storage the first mount had already blanked. The stored search came
	 * back empty from every reload, while the write path looked perfectly
	 * symmetrical - which is exactly why this was mistaken for a restore bug.
	 *
	 * Skipping the first run costs nothing: nothing can have changed a filter
	 * before the mount effects have run, so that state is never worth storing.
	 * Tracking the key rather than a boolean means a table that is handed a
	 * different `storageKey` gets the same protection instead of stamping the old
	 * table's state onto the new key.
	 */
	useEffect(() => {
		if (!storageKey) return;
		if (persistedKey.current !== storageKey) {
			persistedKey.current = storageKey;
			return;
		}
		write(storageKey, state);
	}, [state, storageKey]);

	return { hasRestored, setState, state };
}

/**
 * Drops any filter the table no longer offers - a renamed key, a removed
 * option, a value that is no longer in the list. Anything kept is something a
 * dropdown can currently display and "Clear all" can currently clear.
 */
export function keepValidFilters(
	stored: Record<string, string | null>,
	defs: FilterDef[],
): Record<string, string | null> {
	const valid: Record<string, string | null> = {};

	for (const def of defs) {
		const value = stored[def.key];
		if (!value) continue;
		if (def.options.some((option) => option.value === value)) valid[def.key] = value;
	}

	return valid;
}

function read(storageKey: string): StoredTableFilters | null {
	try {
		const raw = window.localStorage.getItem(`${storageKey}:filters`);
		if (!raw) return null;

		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return null;

		const filters = Reflect.get(parsed, "filters");
		const search = Reflect.get(parsed, "search");
		return {
			filters: typeof filters === "object" && filters !== null ? (filters as Record<string, string | null>) : {},
			search: typeof search === "string" ? search : "",
		};
	} catch {
		// Private browsing, a full quota, or someone else's JSON under our key.
		// A table that cannot restore its filters still works; one that throws
		// while trying does not.
		return null;
	}
}

function write(storageKey: string, state: StoredTableFilters) {
	try {
		window.localStorage.setItem(`${storageKey}:filters`, JSON.stringify(state));
	} catch {
		// Same reasoning as `read`. Losing the preference is not worth a crash.
	}
}
