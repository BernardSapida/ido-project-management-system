/**
 * Pure date and layout maths for the Agenda views. No React, no HeroUI - kept
 * separate so the overlap-collision algorithm is unit-testable on its own.
 *
 * HEROUI GAP: none of this has a HeroUI or repo equivalent. The month grid is
 * CSS grid; the week/day grid positions blocks by real minutes; the column
 * assignment for overlapping events is computed here.
 */

const DAY_MS = 86_400_000;
export const MINUTES_IN_DAY = 1440;

export type WeekStart = 0 | 1;

export function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

export function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * DAY_MS);
}

export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function isSameMonth(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function startOfWeek(date: Date, weekStartsOn: WeekStart): Date {
	const d = startOfDay(date);
	const diff = (d.getDay() - weekStartsOn + 7) % 7;
	return addDays(d, -diff);
}

/** The seven dates of the week containing `date`. */
export function weekDays(date: Date, weekStartsOn: WeekStart): Date[] {
	const start = startOfWeek(date, weekStartsOn);
	return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Six rows of seven dates covering the month `date` falls in. */
export function monthMatrix(date: Date, weekStartsOn: WeekStart): Date[][] {
	const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
	const gridStart = startOfWeek(firstOfMonth, weekStartsOn);
	const rows: Date[][] = [];
	for (let row = 0; row < 6; row += 1) {
		rows.push(Array.from({ length: 7 }, (_, col) => addDays(gridStart, row * 7 + col)));
	}
	return rows;
}

/** Weekday header labels, rotated to the configured week start. */
export function weekdayLabels(weekStartsOn: WeekStart): string[] {
	const base = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	return Array.from({ length: 7 }, (_, i) => base[(i + weekStartsOn) % 7] as string);
}

export function minutesSinceMidnight(date: Date): number {
	return date.getHours() * 60 + date.getMinutes();
}

export interface PositionedInput {
	id: string;
	start: number;
	end: number;
}

export interface PositionedBlock {
	id: string;
	/** 0-based column this block sits in within its overlap cluster. */
	colIndex: number;
	/** Total columns in the cluster - block width is 1 / colCount. */
	colCount: number;
	/** Percentage offsets within the day column. */
	topPct: number;
	heightPct: number;
}

/**
 * Assign overlapping blocks to side-by-side columns. Blocks that do not overlap
 * any other in a run share the full width; a run of mutually overlapping blocks
 * is split into as many columns as its widest point needs.
 */
export function layoutDay(
	items: PositionedInput[],
	dayStartMs: number,
	dayEndMs: number,
): PositionedBlock[] {
	const span = Math.max(1, dayEndMs - dayStartMs);
	const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
	const result: PositionedBlock[] = [];

	let cluster: PositionedInput[] = [];
	let clusterEnd = Number.NEGATIVE_INFINITY;

	const flush = (): void => {
		if (cluster.length === 0) return;
		const columnEnds: number[] = [];
		const placed = cluster.map((item) => {
			let col = columnEnds.findIndex((end) => end <= item.start);
			if (col === -1) {
				col = columnEnds.length;
				columnEnds.push(item.end);
			} else {
				columnEnds[col] = item.end;
			}
			return { item, col };
		});
		const colCount = columnEnds.length;
		for (const { item, col } of placed) {
			const top = ((clamp(item.start, dayStartMs, dayEndMs) - dayStartMs) / span) * 100;
			const bottom = ((clamp(item.end, dayStartMs, dayEndMs) - dayStartMs) / span) * 100;
			result.push({
				id: item.id,
				colIndex: col,
				colCount,
				topPct: top,
				heightPct: Math.max(1.5, bottom - top),
			});
		}
		cluster = [];
	};

	for (const item of sorted) {
		if (cluster.length > 0 && item.start >= clusterEnd) flush();
		cluster.push(item);
		clusterEnd = Math.max(clusterEnd, item.end);
	}
	flush();

	return result;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
