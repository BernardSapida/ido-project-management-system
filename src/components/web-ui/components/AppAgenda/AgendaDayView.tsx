import { AgendaTimeGrid } from "./AgendaTimeGrid";
import type { AgendaOccurrence } from "./agenda.types";

interface AgendaDayViewProps {
	focusedDate: Date;
	occurrences: AgendaOccurrence[];
	selectedEntryId?: string | null;
	selectedOccurrenceStart?: number | null;
	onSelectOccurrence: (occurrence: AgendaOccurrence) => void;
}

const HEADING = new Intl.DateTimeFormat(undefined, {
	weekday: "long",
	month: "long",
	day: "numeric",
});

/**
 * {@link AgendaTimeGrid} with a single day. A thin wrapper so a project can
 * render one day without the week header, and so the overflow link from Month
 * has somewhere to land.
 */
export function AgendaDayView({
	focusedDate,
	occurrences,
	selectedEntryId,
	selectedOccurrenceStart,
	onSelectOccurrence,
}: AgendaDayViewProps) {
	return (
		<div className="flex flex-col">
			{/* A header band like Month and Week - bordered, tinted, centred - and
			    joined flush to the grid below. `scrollbarGutter` matches the grid so
			    the centred date lands over the column, not the scrollbar. */}
			<div
				className="overflow-hidden rounded-t-lg border border-default-200 bg-default-50 py-1.5 text-center font-medium text-sm"
				style={{ scrollbarGutter: "stable" }}
			>
				{HEADING.format(focusedDate)}
			</div>
			<AgendaTimeGrid
				days={[focusedDate]}
				flushTop
				occurrences={occurrences}
				onSelectOccurrence={onSelectOccurrence}
				selectedEntryId={selectedEntryId}
				selectedOccurrenceStart={selectedOccurrenceStart}
			/>
		</div>
	);
}
