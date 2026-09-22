import { Columns3, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppButton } from "../AppButton";
import { AppDropdown } from "../AppDropdown";
import type { ColumnDef } from "../AppTable";

/**
 * Which columns a picker is allowed to hide.
 *
 * Two are never on the list, and neither is a preference:
 *
 * - **The first column** is the row's identity. Hide it and the table becomes a
 *   grid of values with nothing to attach them to - "Quezon City / Express / Active"
 *   is not a record, it is trivia.
 * - **The actions column** is how the row is operated. A user who hides it has
 *   not simplified the table, they have disabled it, and the way back is a menu
 *   they can no longer see the effect of.
 *
 * `isHideable: false` opts a third column out - a status column on a queue that
 * exists to triage status, say. There is no flag that opts the two above back
 * in, because there is no table where either is the right thing to lose.
 */
export function isColumnHideable<T>(column: ColumnDef<T>, index: number): boolean {
	if (index === 0) return false;
	if (column.key === "actions") return false;
	return column.isHideable ?? true;
}

function readStoredHidden(storageKey: string): string[] | null {
	try {
		const raw = window.localStorage.getItem(storageKey);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return null;
		return parsed.filter((item): item is string => typeof item === "string");
	} catch {
		return null;
	}
}

function persistHidden(storageKey: string | undefined, next: Set<string>) {
	if (!storageKey) return;
	try {
		window.localStorage.setItem(storageKey, JSON.stringify([...next]));
	} catch {
		// Private mode, or a full quota. A layout preference is a convenience;
		// losing it must not take the table down with it.
	}
}

/**
 * Column visibility for one table.
 *
 * Returns the columns to actually render, plus everything `AppColumnPicker`
 * needs to describe the choice. The table itself learns nothing about any of
 * this - it is handed a shorter array.
 *
 * **`storageKey` is not optional in practice.** A picker that forgets on reload
 * is worse than no picker: the user spends thirty seconds shaping the table,
 * loses it at the next navigation, and does not spend the thirty seconds again.
 * It is typed optional only so the lab can demonstrate the control without
 * writing to a real user's storage.
 */
export function useTableColumns<T>(columns: ColumnDef<T>[], storageKey?: string) {
	const [hidden, setHidden] = useState<Set<string>>(new Set());

	const hideable = useMemo(() => columns.filter((column, i) => isColumnHideable(column, i)), [columns]);

	// Read after mount, never in a lazy initialiser. This renders on the server
	// too, and a five-column table hydrating over a server-rendered seven-column
	// one is a mismatch React resolves by throwing the markup away.
	useEffect(() => {
		if (!storageKey) return;
		const stored = readStoredHidden(storageKey);
		if (!stored) return;
		// Filtered against what the table currently declares: a stored key from a
		// column that has since been renamed or removed would otherwise sit in the
		// set forever, counted as hidden and impossible to restore.
		const keys = new Set(hideable.map((column) => column.key));
		setHidden(new Set(stored.filter((key) => keys.has(key))));
	}, [hideable, storageKey]);

	const apply = useCallback(
		(next: Set<string>) => {
			setHidden(next);
			persistHidden(storageKey, next);
		},
		[storageKey],
	);

	const setVisible = useCallback(
		(visibleKeys: string[]) => {
			const visible = new Set(visibleKeys);
			apply(new Set(hideable.filter((column) => !visible.has(column.key)).map((column) => column.key)));
		},
		[apply, hideable],
	);

	const reset = useCallback(() => apply(new Set()), [apply]);

	return {
		/** Every column the picker may list, in table order. */
		hideable,
		hidden,
		/** Whether anything is hidden - drives the reset item and the trigger count. */
		isModified: hidden.size > 0,
		reset,
		setVisible,
		/** What to hand `AppTable`. Original order, minus whatever is hidden. */
		visibleColumns: useMemo(() => columns.filter((column) => !hidden.has(column.key)), [columns, hidden]),
	};
}

interface AppColumnPickerProps<T> {
	className?: string;
	"data-cy"?: string;
	/** The return value of `useTableColumns`, spread or passed whole. */
	state: ReturnType<typeof useTableColumns<T>>;
}

/**
 * The control that hides and restores columns.
 *
 * Who this is for: someone on the same wide table every day whose job needs a
 * different six of its twelve columns than the person beside them. That is the
 * only case it earns its place. On a table already cut to what everyone decides
 * with, it is a control that hides nothing anyone wanted hidden - and the
 * default it opens over is the table you actually shipped.
 *
 * Built on `AppDropdown`'s multiple-choice section, which keeps the menu open
 * between presses. That is the whole interaction: nobody hides one column, they
 * shape the table, and a menu that shut after each toggle would make a
 * six-column change six trips.
 *
 * The trigger carries the count rather than a bare glyph. A reduced table and a
 * broken one look identical from across a desk, and "Columns 5/9" is the only
 * thing on screen that says which one this is.
 */
export function AppColumnPicker<T>({ className, "data-cy": dataCy, state }: AppColumnPickerProps<T>) {
	const { hidden, hideable, isModified, reset, setVisible } = state;
	const visibleCount = hideable.length - hidden.size;

	return (
		<AppDropdown
			className={className}
			data-cy={dataCy}
			// Names the menu, not the state.
			label="Columns"
			sections={[
				{
					items: hideable.map((column) => ({ key: column.key, label: column.label || column.key })),
					key: "columns",
					onSelectionChange: setVisible,
					selectedKeys: hideable.filter((column) => !hidden.has(column.key)).map((column) => column.key),
					selectionMode: "multiple",
				},
				/*
				 * Always reachable, and disabled rather than absent when there is
				 * nothing to undo - a reset that appears only once you are lost is one
				 * you have never seen and will not look for. This is the same rule as
				 * the filter bar's "Clear all", for the same reason: a table shaped
				 * down to three columns a fortnight ago reads as a table that lost
				 * six, and the way back has to be visible from inside the mistake.
				 */
				{
					items: [
						{
							icon: RotateCcw,
							isDisabled: !isModified,
							key: "reset",
							label: "Show all columns",
							onAction: reset,
						},
					],
					key: "reset",
				},
			]}
			trigger={
				<AppButton
					icon={Columns3}
					size="sm"
					variant="tertiary"
				>
					Columns
					{/* Only once it differs from the default. A permanent "9/9" is a
					    number that never means anything, and it trains the eye to skip
					    the one position where the count matters. */}
					{isModified ? (
						<span className="tabular-nums text-muted">
							{visibleCount}/{hideable.length}
						</span>
					) : null}
				</AppButton>
			}
		/>
	);
}
