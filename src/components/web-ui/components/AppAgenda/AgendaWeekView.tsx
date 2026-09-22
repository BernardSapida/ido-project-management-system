import { cn } from "../../lib/cn";
import { AgendaTimeGrid } from "./AgendaTimeGrid";
import { addDays, isSameDay, startOfDay, weekDays, type WeekStart } from "./agenda-layout";
import type { AgendaOccurrence } from "./agenda.types";

interface AgendaWeekViewProps {
	focusedDate: Date;
	weekStartsOn: WeekStart;
	occurrences: AgendaOccurrence[];
	selectedEntryId?: string | null;
	selectedOccurrenceStart?: number | null;
	onSelectOccurrence: (occurrence: AgendaOccurrence) => void;
	/** Clicking a weekday header drops to a single day. */
	onOpenDay: (date: Date) => void;
	/**
	 * The line under each weekday, given that day's occurrence count. The default
	 * is "N event(s)"; a domain passes its own noun here, and it is also the hook
	 * for a state the data cannot express - `(n) => (n === 0 ? "Closed" : …)`.
	 */
	dayCountLabel?: (count: number) => string;
}

const DOW = new Intl.DateTimeFormat(undefined, { weekday: "short" });

const defaultDayCountLabel = (count: number): string =>
	`${count} event${count === 1 ? "" : "s"}`;

/**
 * Seven day columns over {@link AgendaTimeGrid}. Each header carries the date,
 * the weekday, and a count of that day's occurrences (see {@link dayCountLabel});
 * today's date sits in a filled brand tile. Clicking a header drops to Day view.
 */
export function AgendaWeekView({
	focusedDate,
	weekStartsOn,
	occurrences,
	selectedEntryId,
	selectedOccurrenceStart,
	onSelectOccurrence,
	onOpenDay,
	dayCountLabel = defaultDayCountLabel,
}: AgendaWeekViewProps) {
	const days = weekDays(focusedDate, weekStartsOn);
	const today = new Date();

	const countForDay = (day: Date): number => {
		const start = startOfDay(day).getTime();
		const end = addDays(startOfDay(day), 1).getTime();
		return occurrences.filter((o) => o.startsAt.getTime() < end && o.endsAt.getTime() > start).length;
	};

	return (
		<div className="flex flex-col">
			{/* Same reserved scrollbar gutter as the grid below, so the 7 columns
			    line up whether or not the body is scrolling. */}
			<div
				className="flex overflow-hidden rounded-t-lg border border-default-200 bg-default-50"
				style={{ scrollbarGutter: "stable" }}
			>
				<div className="w-14 shrink-0" />
				<div className="grid flex-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
					{days.map((day) => {
						const isToday = isSameDay(day, today);
						return (
							<button
								className="flex flex-col items-center gap-1 border-default-200 border-l py-1.5 hover:bg-default-100"
								key={day.toISOString()}
								onClick={() => onOpenDay(day)}
								type="button"
							>
								<span className="flex items-center gap-1.5">
									<span
										className={cn(
											"flex size-6 items-center justify-center rounded-md font-semibold text-sm tabular-nums",
											isToday && "bg-primary text-primary-foreground",
										)}
									>
										{day.getDate()}
									</span>
									<span
										className={cn(
											"font-medium text-muted-foreground text-xs uppercase",
											isToday && "text-primary",
										)}
									>
										{DOW.format(day)}
									</span>
								</span>
								<span className="text-[0.7rem] text-muted-foreground">
									{dayCountLabel(countForDay(day))}
								</span>
							</button>
						);
					})}
				</div>
			</div>
			<AgendaTimeGrid
				days={days}
				flushTop
				occurrences={occurrences}
				onSelectOccurrence={onSelectOccurrence}
				selectedEntryId={selectedEntryId}
				selectedOccurrenceStart={selectedOccurrenceStart}
			/>
		</div>
	);
}
