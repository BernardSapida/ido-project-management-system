import { cn } from "../../lib/cn";
import { AgendaEventChip } from "./AgendaEventChip";
import {
	addDays,
	isSameDay,
	isSameMonth,
	monthMatrix,
	startOfDay,
	type WeekStart,
	weekdayLabels,
} from "./agenda-layout";
import type { AgendaOccurrence } from "./agenda.types";

interface AgendaMonthViewProps {
	focusedDate: Date;
	weekStartsOn: WeekStart;
	occurrences: AgendaOccurrence[];
	selectedEntryId?: string | null;
	/**
	 * The `occurrenceStart` (epoch ms) of the selected occurrence. A recurring
	 * series shares ONE `entryId` across every occurrence, so `selectedEntryId`
	 * alone would ring them all - this pins the ring to the one that was clicked.
	 * Omit it to fall back to entry-level matching.
	 */
	selectedOccurrenceStart?: number | null;
	onSelectOccurrence: (occurrence: AgendaOccurrence) => void;
	/** "+N more", or the date number, switches to Day view for that date. */
	onOpenDay: (date: Date) => void;
}

/** The cell holds this many chips, then a "+N more" link - never a taller cell. */
const MAX_CHIPS = 3;

/**
 * HEROUI GAP: a fixed 6x7 CSS grid. Days from adjacent months are muted. The
 * cell height is FIXED - a row that grew to fit its busiest day would break
 * alignment across the whole month - so overflow is always a link to Day view.
 * Clicking empty space does nothing: creation is the Add button.
 */
export function AgendaMonthView({
	focusedDate,
	weekStartsOn,
	occurrences,
	selectedEntryId,
	selectedOccurrenceStart,
	onSelectOccurrence,
	onOpenDay,
}: AgendaMonthViewProps) {
	const rows = monthMatrix(focusedDate, weekStartsOn);
	const today = new Date();

	const isSelected = (o: AgendaOccurrence): boolean =>
		o.entryId === selectedEntryId &&
		(selectedOccurrenceStart == null || o.occurrenceStart.getTime() === selectedOccurrenceStart);

	const forDay = (day: Date): AgendaOccurrence[] => {
		const start = startOfDay(day).getTime();
		const end = addDays(startOfDay(day), 1).getTime();
		return occurrences
			.filter((o) => o.startsAt.getTime() < end && o.endsAt.getTime() > start)
			.sort((a, b) => Number(b.isAllDay) - Number(a.isAllDay) || a.startsAt.getTime() - b.startsAt.getTime());
	};

	return (
		<div className="flex flex-col">
			{/* Header band and grid are ONE bordered box - header rounds the top,
			    grid rounds the bottom and drops its top border. */}
			<div className="grid grid-cols-7 overflow-hidden rounded-t-lg border border-default-200 bg-default-50 text-center text-muted-foreground text-xs">
				{weekdayLabels(weekStartsOn).map((label) => (
					<div
						className="border-default-200 border-l py-1.5 font-medium first:border-l-0"
						key={label}
					>
						{label}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7 overflow-hidden rounded-b-lg border border-default-200 border-t-0">
				{rows.flat().map((day) => {
					const dayOccurrences = forDay(day);
					const overflow = dayOccurrences.length - MAX_CHIPS;
					const inMonth = isSameMonth(day, focusedDate);
					return (
						<div
							className={cn(
								"flex h-28 flex-col gap-0.5 border-default-100 border-t border-l p-1 [&:nth-child(7n+1)]:border-l-0 [&:nth-child(-n+7)]:border-t-0",
								!inMonth && "bg-default-50/50",
								isSameDay(day, today) && "bg-primary/5",
							)}
							key={day.toISOString()}
						>
							<button
								className={cn(
									"cursor-pointer self-start rounded-full px-1.5 font-semibold text-xs tabular-nums hover:bg-default-100",
									!inMonth && "text-muted-foreground",
									isSameDay(day, today) && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
								)}
								onClick={() => onOpenDay(day)}
								type="button"
							>
								{day.getDate()}
							</button>
							<div className="flex flex-col gap-0.5 overflow-hidden">
								{dayOccurrences.slice(0, MAX_CHIPS).map((o) => (
									<AgendaEventChip
										isSelected={isSelected(o)}
										key={`${o.entryId}:${o.occurrenceStart.getTime()}`}
										occurrence={o}
										onPress={() => onSelectOccurrence(o)}
										variant="month"
									/>
								))}
								{overflow > 0 && (
									<button
										className="cursor-pointer px-1.5 text-left text-[0.7rem] text-muted-foreground hover:text-foreground"
										onClick={() => onOpenDay(day)}
										type="button"
									>
										+{overflow} more
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
