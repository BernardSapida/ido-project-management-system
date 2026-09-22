import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "../../lib/cn";
import { AgendaDayView } from "./AgendaDayView";
import { AgendaMonthView } from "./AgendaMonthView";
import { AgendaSidePanel, type AgendaSidePanelMode } from "./AgendaSidePanel";
import { AgendaToolbar } from "./AgendaToolbar";
import { AgendaWeekView } from "./AgendaWeekView";
import {
	addDays,
	isSameMonth,
	startOfDay,
	startOfWeek,
	type WeekStart,
	weekDays,
} from "./agenda-layout";
import type {
	AgendaEntryDraft,
	AgendaOccurrence,
	AgendaView,
	RecurrenceScope,
} from "./agenda.types";

interface AppAgendaProps {
	/** Already-expanded occurrences - expansion is the server's job. */
	entries: AgendaOccurrence[];
	view: AgendaView;
	onViewChange: (view: AgendaView) => void;
	focusedDate: Date;
	onFocusedDateChange: (date: Date) => void;
	selectedEntryId?: string | null;
	onSelectEntry: (occurrence: AgendaOccurrence | null) => void;
	onCreateEntry: () => void;
	/**
	 * Fired when an edit of an occurrence is confirmed with a scope, BEFORE the
	 * form opens - a hook for a consumer that wants to prefetch or drive its own
	 * editor. The actual save always comes through `onSubmitEntry`.
	 */
	onEditEntry?: (id: string, scope: RecurrenceScope, occurrenceStart: string) => void;
	onDeleteEntry: (id: string, scope: RecurrenceScope, occurrenceStart: string) => void;
	onSubmitEntry: (draft: AgendaEntryDraft) => void | Promise<void>;
	weekStartsOn?: WeekStart;
	timeZone?: string;
	isLoading?: boolean;
	searchSlot?: ReactNode;
	/**
	 * The line under each Week-view weekday header, given that day's occurrence
	 * count. Defaults to "N event(s)". Pass your own noun, or a data-independent
	 * state like `(n) => (n === 0 ? "Closed" : ...)`.
	 */
	weekdayCountLabel?: (count: number) => string;
	className?: string;
	"data-cy"?: string;
}

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const WEEK_LABEL = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const DAY_LABEL = new Intl.DateTimeFormat(undefined, {
	weekday: "long",
	month: "long",
	day: "numeric",
});

/**
 * The controlled Agenda shell. Ships from `@bernardsapida/web-ui/agenda` so the
 * optional `rrule` peer stays optional. It is PURE - it fetches nothing, holds
 * no server data, and calls back for every change. Editing or deleting a
 * recurring occurrence raises the scope dialog first, then calls back with the
 * chosen scope and the occurrence start.
 */
export function AppAgenda({
	entries,
	view,
	onViewChange,
	focusedDate,
	onFocusedDateChange,
	selectedEntryId,
	onSelectEntry,
	onCreateEntry,
	onEditEntry,
	onDeleteEntry,
	onSubmitEntry,
	weekStartsOn = 1,
	timeZone,
	isLoading = false,
	searchSlot,
	weekdayCountLabel,
	className,
	"data-cy": dataCy,
}: AppAgendaProps) {
	const [panelMode, setPanelMode] = useState<AgendaSidePanelMode>("closed");
	const [scopePrompt, setScopePrompt] = useState<null | "edit" | "delete">(null);
	const [pendingScope, setPendingScope] = useState<RecurrenceScope | null>(null);
	/**
	 * Which occurrence was clicked, not just which entry. A recurring series
	 * shares ONE `entryId`, so `selectedEntryId` alone rings every occurrence and
	 * `.find` on it returns the wrong one for "this occurrence" edits.
	 */
	const [selectedOccurrenceStart, setSelectedOccurrenceStart] = useState<number | null>(null);

	const selected =
		entries.find(
			(e) =>
				e.entryId === selectedEntryId &&
				(selectedOccurrenceStart == null || e.occurrenceStart.getTime() === selectedOccurrenceStart),
		) ?? null;

	const shift = (direction: 1 | -1): void => {
		if (view === "day") onFocusedDateChange(addDays(focusedDate, direction));
		else if (view === "week") onFocusedDateChange(addDays(focusedDate, direction * 7));
		else {
			onFocusedDateChange(
				new Date(focusedDate.getFullYear(), focusedDate.getMonth() + direction, 1),
			);
		}
	};

	const selectOccurrence = (occurrence: AgendaOccurrence): void => {
		onSelectEntry(occurrence);
		setSelectedOccurrenceStart(occurrence.occurrenceStart.getTime());
		setPanelMode("read");
	};

	const closePanel = (): void => {
		setPanelMode("closed");
		setPendingScope(null);
		setScopePrompt(null);
		setSelectedOccurrenceStart(null);
		onSelectEntry(null);
	};

	const beginEdit = (): void => {
		if (!selected) return;
		if (selected.isRecurring) {
			setScopePrompt("edit");
			setPanelMode("scope");
			return;
		}
		onEditEntry?.(selected.entryId, "all", selected.occurrenceStart.toISOString());
		setPanelMode("edit");
	};

	const beginDelete = (): void => {
		if (!selected) return;
		if (selected.isRecurring) {
			setScopePrompt("delete");
			setPanelMode("scope");
			return;
		}
		onDeleteEntry(selected.entryId, "all", selected.occurrenceStart.toISOString());
		closePanel();
	};

	const resolveScope = (scope: RecurrenceScope): void => {
		if (!selected) return;
		if (scopePrompt === "delete") {
			onDeleteEntry(selected.entryId, scope, selected.occurrenceStart.toISOString());
			closePanel();
			return;
		}
		onEditEntry?.(selected.entryId, scope, selected.occurrenceStart.toISOString());
		setPendingScope(scope);
		setScopePrompt(null);
		setPanelMode("edit");
	};

	const submitEntry = async (draft: AgendaEntryDraft): Promise<void> => {
		await onSubmitEntry({ ...draft, scope: draft.scope ?? pendingScope ?? undefined });
		closePanel();
	};

	return (
		<div className={cn("flex flex-col gap-3", className)} data-cy={dataCy}>
			<AgendaToolbar
				isOnCurrentPeriod={containsToday(view, focusedDate, weekStartsOn)}
				onAdd={() => {
					onCreateEntry();
					setPanelMode("create");
				}}
				onNext={() => shift(1)}
				onPrev={() => shift(-1)}
				onToday={() => onFocusedDateChange(startOfDay(new Date()))}
				onViewChange={onViewChange}
				rangeLabel={rangeLabel(view, focusedDate, weekStartsOn)}
				searchSlot={searchSlot}
				view={view}
			/>

			<div className={cn(isLoading && "pointer-events-none opacity-60")}>
				{view === "month" && (
					<AgendaMonthView
						focusedDate={focusedDate}
						occurrences={entries}
						onOpenDay={(date) => {
							onFocusedDateChange(date);
							onViewChange("day");
						}}
						onSelectOccurrence={selectOccurrence}
						selectedEntryId={selectedEntryId}
						selectedOccurrenceStart={selectedOccurrenceStart}
						weekStartsOn={weekStartsOn}
					/>
				)}
				{view === "week" && (
					<AgendaWeekView
						dayCountLabel={weekdayCountLabel}
						focusedDate={focusedDate}
						occurrences={entries}
						onOpenDay={(date) => {
							onFocusedDateChange(date);
							onViewChange("day");
						}}
						onSelectOccurrence={selectOccurrence}
						selectedEntryId={selectedEntryId}
						selectedOccurrenceStart={selectedOccurrenceStart}
						weekStartsOn={weekStartsOn}
					/>
				)}
				{view === "day" && (
					<AgendaDayView
						focusedDate={focusedDate}
						occurrences={entries}
						onSelectOccurrence={selectOccurrence}
						selectedEntryId={selectedEntryId}
						selectedOccurrenceStart={selectedOccurrenceStart}
					/>
				)}
			</div>

			<AgendaSidePanel
				mode={panelMode}
				occurrence={selected}
				onCancelScope={() => setPanelMode("read")}
				onClose={closePanel}
				onDelete={beginDelete}
				onEdit={beginEdit}
				onResolveScope={resolveScope}
				onSubmit={submitEntry}
				pendingScope={pendingScope}
				scopeAction={scopePrompt ?? "edit"}
				timeZone={timeZone}
			/>
		</div>
	);
}

function rangeLabel(view: AgendaView, date: Date, weekStartsOn: WeekStart): string {
	if (view === "month") return MONTH_LABEL.format(date);
	if (view === "day") return DAY_LABEL.format(date);
	const days = weekDays(date, weekStartsOn);
	return `${WEEK_LABEL.format(days[0])} - ${WEEK_LABEL.format(days[6])}, ${days[6].getFullYear()}`;
}

function containsToday(view: AgendaView, date: Date, weekStartsOn: WeekStart): boolean {
	const today = startOfDay(new Date());
	if (view === "month") return isSameMonth(date, today);
	if (view === "day") return startOfDay(date).getTime() === today.getTime();
	return startOfWeek(date, weekStartsOn).getTime() === startOfWeek(today, weekStartsOn).getTime();
}
