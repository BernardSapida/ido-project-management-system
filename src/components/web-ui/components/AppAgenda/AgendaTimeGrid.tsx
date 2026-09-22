import { useEffect, useMemo, useRef } from "react";
import { cn } from "../../lib/cn";
import { AgendaEventChip } from "./AgendaEventChip";
import {
	addDays,
	isSameDay,
	layoutDay,
	minutesSinceMidnight,
	startOfDay,
} from "./agenda-layout";
import type { AgendaOccurrence } from "./agenda.types";

interface AgendaTimeGridProps {
	/** One to seven dates, left to right. */
	days: Date[];
	occurrences: AgendaOccurrence[];
	selectedEntryId?: string | null;
	/**
	 * `occurrenceStart` (epoch ms) of the selected occurrence - pins the ring to
	 * one occurrence of a recurring series instead of every occurrence sharing
	 * its `entryId`. Omit for entry-level matching.
	 */
	selectedOccurrenceStart?: number | null;
	onSelectOccurrence: (occurrence: AgendaOccurrence) => void;
	/** Draw a line at the current time when a visible day is today. */
	nowIndicator?: boolean;
	/**
	 * Drop the top border and top rounding so the grid butts directly against a
	 * header sitting on top of it (Day and Week). Standalone, it keeps all four.
	 */
	flushTop?: boolean;
}

const HOUR_PX = 48;
const DAY_MS = 86_400_000;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GRID_HEIGHT_PX = HOUR_PX * 24;
/**
 * Floor for a positioned block's rendered height. A 15- or 30-minute event is
 * only ~12-24px tall by the clock, too short for its own title and time; giving
 * it this minimum lets the chip stay legible. Back-to-back short events then
 * overlap by a few px, which is the accepted trade every calendar makes.
 */
const MIN_CHIP_PX = 34;
/** Hours of context kept above "now" / the earliest event when auto-scrolling. */
const SCROLL_LEAD_PX = HOUR_PX;
const NOW_LABEL = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/**
 * HEROUI GAP: HeroUI v3 has no time-grid and neither does this repo. Hour rows
 * down the side, one column per day, every timed occurrence positioned by its
 * REAL minute offset - a 09:23 start sits a little below the 9 line, which is
 * correct. Overlapping occurrences are split into side-by-side columns by
 * {@link layoutDay}. All-day occurrences sit in a strip above the grid.
 *
 * The full 00:00-24:00 ruler is rendered, but on mount and whenever the visible
 * date(s) change the grid scrolls to the earliest occurrence - or, when today
 * is in view, to the current time - so the useful part is on screen without a
 * scroll. It does NOT fight the user afterwards: the scroll only re-runs when
 * the day set changes.
 */
export function AgendaTimeGrid({
	days,
	occurrences,
	selectedEntryId,
	selectedOccurrenceStart,
	onSelectOccurrence,
	nowIndicator = true,
	flushTop = false,
}: AgendaTimeGridProps) {
	const now = new Date();
	const scrollRef = useRef<HTMLDivElement>(null);

	const isSelected = (o: AgendaOccurrence): boolean =>
		o.entryId === selectedEntryId &&
		(selectedOccurrenceStart == null || o.occurrenceStart.getTime() === selectedOccurrenceStart);

	const perDay = useMemo(
		() =>
			days.map((day) => {
				const dayStart = startOfDay(day).getTime();
				const dayEnd = dayStart + DAY_MS;
				const timed = occurrences.filter(
					(o) =>
						!o.isAllDay &&
						o.startsAt.getTime() < dayEnd &&
						o.endsAt.getTime() > dayStart,
				);
				const positioned = layoutDay(
					timed.map((o) => ({
						id: `${o.entryId}:${o.occurrenceStart.getTime()}`,
						start: Math.max(o.startsAt.getTime(), dayStart) - dayStart,
						end: Math.min(o.endsAt.getTime(), dayEnd) - dayStart,
					})),
					0,
					DAY_MS,
				);
				const byId = new Map(positioned.map((p) => [p.id, p]));
				return { day, timed, byId };
			}),
		[days, occurrences],
	);

	const allDay = occurrences.filter(
		(o) =>
			o.isAllDay &&
			days.some((d) => o.startsAt.getTime() < addDays(startOfDay(d), 1).getTime() && o.endsAt.getTime() > startOfDay(d).getTime()),
	);

	const daysKey = days.map((d) => startOfDay(d).getTime()).join();

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-scroll only when
	// the visible day set or the occurrence count changes - reading `now` and the
	// earliest event fresh at that moment - never on a render from user scrolling.
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const current = new Date();
		const todayVisible = days.some((d) => isSameDay(d, current));

		let earliestMinutes = Number.POSITIVE_INFINITY;
		for (const day of days) {
			const dayStart = startOfDay(day).getTime();
			const dayEnd = dayStart + DAY_MS;
			for (const o of occurrences) {
				if (o.isAllDay) continue;
				if (o.startsAt.getTime() < dayEnd && o.endsAt.getTime() > dayStart) {
					earliestMinutes = Math.min(
						earliestMinutes,
						Math.max(0, (o.startsAt.getTime() - dayStart) / 60_000),
					);
				}
			}
		}

		const targetMinutes = todayVisible
			? minutesSinceMidnight(current)
			: Number.isFinite(earliestMinutes)
				? earliestMinutes
				: 0;
		el.scrollTop = Math.max(0, (targetMinutes / 60) * HOUR_PX - SCROLL_LEAD_PX);
	}, [daysKey, occurrences.length]);

	return (
		<div
			className={cn(
				"flex flex-col overflow-hidden border border-default-200",
				flushTop ? "rounded-b-lg border-t-0" : "rounded-lg",
			)}
		>
			{allDay.length > 0 && (
				<div className="flex border-default-200 border-b">
					<div className="w-14 shrink-0 py-1 pr-1 text-right text-[0.7rem] text-muted-foreground">
						All day
					</div>
					<div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
						{days.map((day) => (
							<div className="flex flex-col gap-0.5 border-default-100 border-l p-1" key={day.toISOString()}>
								{allDay
									.filter(
										(o) =>
											o.startsAt.getTime() < addDays(startOfDay(day), 1).getTime() &&
											o.endsAt.getTime() > startOfDay(day).getTime(),
									)
									.map((o) => (
										<AgendaEventChip
											isSelected={isSelected(o)}
											key={`${o.entryId}:${o.occurrenceStart.getTime()}`}
											occurrence={o}
											onPress={() => onSelectOccurrence(o)}
											variant="month"
										/>
									))}
							</div>
						))}
					</div>
				</div>
			)}

			{/* `scrollbarGutter: stable` reserves the scrollbar's width even when it
			    is not shown, so the column widths here match the header above, which
			    reserves the same gutter. */}
			<div
				className="relative flex max-h-[32rem] overflow-y-auto"
				ref={scrollRef}
				style={{ scrollbarGutter: "stable" }}
			>
				{/* No `border-r` here - the day columns each own their left border, so
				    the gutter/grid divider is one hairline in the same token as every
				    other column and hour line, in Day and Week alike. */}
				<div className="w-14 shrink-0">
					{HOURS.map((hour) => (
						<div
							className="relative text-right text-[0.7rem] text-muted-foreground"
							key={hour}
							style={{ height: HOUR_PX }}
						>
							<span className="-top-1.5 absolute right-1">{hour === 0 ? "" : formatHour(hour)}</span>
						</div>
					))}
				</div>

				<div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
					{perDay.map(({ day, timed, byId }) => (
						<div
							className="relative border-default-100 border-l"
							key={day.toISOString()}
							style={{ height: HOUR_PX * 24 }}
						>
							{HOURS.map((hour) => (
								<div
									className="border-default-100 border-b"
									key={hour}
									style={{ height: HOUR_PX }}
								/>
							))}

							{timed.map((o) => {
								const pos = byId.get(`${o.entryId}:${o.occurrenceStart.getTime()}`);
								if (!pos) return null;
								const widthPct = 100 / pos.colCount;
								const heightPx = Math.max((pos.heightPct / 100) * GRID_HEIGHT_PX, MIN_CHIP_PX);
								const topPx = Math.min(
									(pos.topPct / 100) * GRID_HEIGHT_PX,
									GRID_HEIGHT_PX - heightPx,
								);
								return (
									<div
										className="absolute z-10 px-0.5"
										key={`${o.entryId}:${o.occurrenceStart.getTime()}`}
										style={{
											top: topPx,
											height: heightPx,
											left: `${pos.colIndex * widthPct}%`,
											width: `${widthPct}%`,
										}}
									>
										<AgendaEventChip
											className="h-full"
											isSelected={isSelected(o)}
											occurrence={o}
											onPress={() => onSelectOccurrence(o)}
											variant="time"
										/>
									</div>
								);
							})}
						</div>
					))}
				</div>

				{/* The now line spans the whole grid once (not per column), brand
				    colour, with the current time as a chip at its start sitting in
				    the hour gutter. */}
				{nowIndicator && days.some((d) => isSameDay(d, now)) && (
					<div
						className="pointer-events-none absolute inset-x-0 z-30 -translate-y-1/2"
						style={{ top: (minutesSinceMidnight(now) / 1440) * HOUR_PX * 24 }}
					>
						<div className="ml-14 border-primary border-t" />
						<span className="-translate-y-1/2 absolute top-1/2 left-0 rounded bg-primary px-1 py-0.5 font-semibold text-[0.625rem] text-primary-foreground leading-none tabular-nums shadow-sm">
							{NOW_LABEL.format(now)}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

function formatHour(hour: number): string {
	const period = hour < 12 ? "AM" : "PM";
	const base = hour % 12 === 0 ? 12 : hour % 12;
	return `${base} ${period}`;
}

export { HOUR_PX };
