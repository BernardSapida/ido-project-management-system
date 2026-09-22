import { CalendarDate } from "@internationalized/date";
import * as rrule from "rrule";

/**
 * The visual recurrence builder's state, and the two pure functions that move
 * it to and from an RFC 5545 RRULE string.
 *
 * `rrule` is the same OPTIONAL peer dependency `recurrence-summary.ts` documents:
 * this module is only ever reached through `@bernardsapida/web-ui/agenda`, so a
 * project that never renders the scheduler never installs it. NAMESPACE import
 * for the same CommonJS-under-Vite-SSR reason spelled out there.
 *
 * The string this produces is BARE - `FREQ=WEEKLY;BYDAY=MO,WE`, no `RRULE:`
 * prefix and no `DTSTART` line - because that is the shape the rest of AppAgenda
 * already stores and `ruleToPreset` already matches against.
 */
const { RRule, Weekday } = rrule;

export type RecurrenceUnit = "day" | "week" | "month" | "year";
export type RecurrenceEndMode = "never" | "on" | "after";
export type MonthlyMode = "day-of-month" | "last-day" | "weekday-of-month";

export interface RecurrenceBuilderState {
	unit: RecurrenceUnit;
	/** `>= 1`. "Every Nth day / week / month / year". */
	interval: number;
	/**
	 * `0` = Monday … `6` = Sunday, matching `rrule`'s `Weekday.weekday`. Only
	 * meaningful when `unit === "week"`; an empty list means "the day the entry
	 * starts on", which is what a bare `FREQ=WEEKLY` already does.
	 */
	weekdays: number[];
	/** Only meaningful when `unit === "month"`. */
	monthlyMode: MonthlyMode;
	/**
	 * The day of the month to land on when `monthlyMode === "day-of-month"`.
	 * `1`-`31`. A value above 28 does not exist in every month; see
	 * {@link RecurrenceBuilderState.monthDayClamp}.
	 */
	monthDay: number;
	/**
	 * Only consulted when `monthlyMode === "day-of-month"` and `monthDay >= 29`.
	 *
	 * - `false` (RFC 5545 default) - a month with no such day is skipped
	 *   (`BYMONTHDAY=30` never fires in February).
	 * - `true` - those months fall back to their last day, via the
	 *   `BYMONTHDAY=28,…,N;BYSETPOS=-1` idiom.
	 */
	monthDayClamp: boolean;
	endMode: RecurrenceEndMode;
	/** The chosen end day when `endMode === "on"`. */
	endDate: CalendarDate | null;
	/** The occurrence cap when `endMode === "after"`; `>= 1`. */
	endCount: number;
}

/** MO-indexed weekday codes, in the order RRULE lists them. */
const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;

const FREQ_BY_UNIT: Record<RecurrenceUnit, number> = {
	day: RRule.DAILY,
	week: RRule.WEEKLY,
	month: RRule.MONTHLY,
	year: RRule.YEARLY,
};

const UNIT_BY_FREQ: Record<number, RecurrenceUnit> = {
	[RRule.DAILY]: "day",
	[RRule.WEEKLY]: "week",
	[RRule.MONTHLY]: "month",
	[RRule.YEARLY]: "year",
};

/** `0` = Monday … `6` = Sunday, from a JS `Date` (whose week starts on Sunday). */
export function mondayIndexOf(date: Date): number {
	return (date.getDay() + 6) % 7;
}

function daysInMonth(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Which occurrence of its weekday a date is within its month - `1` to `5`. */
export function weekdayOrdinalOfMonth(date: Date): number {
	return Math.ceil(date.getDate() / 7);
}

/** True when no later date in the month shares its weekday. */
export function isLastWeekdayOfMonth(date: Date): boolean {
	return date.getDate() + 7 > daysInMonth(date);
}

/**
 * The ordinal RRULE should carry for "the Nth <weekday>" of a month: `-1` once
 * the date is the last of its weekday (so "last Friday" keeps meaning last in a
 * 28-day February), otherwise `1`-`5`.
 */
export function monthlyWeekdayOrdinal(date: Date): number {
	return isLastWeekdayOfMonth(date) ? -1 : weekdayOrdinalOfMonth(date);
}

export function defaultRecurrenceState(reference: Date): RecurrenceBuilderState {
	return {
		unit: "week",
		interval: 1,
		weekdays: [mondayIndexOf(reference)],
		monthlyMode: "day-of-month",
		monthDay: reference.getDate(),
		monthDayClamp: false,
		endMode: "never",
		endDate: null,
		endCount: 10,
	};
}

function two(n: number): string {
	return String(n).padStart(2, "0");
}

/** `[28, …, day]` - the `BYMONTHDAY` list that `BYSETPOS=-1` clamps to month-end. */
function clampRange(day: number): number[] {
	const out: number[] = [];
	for (let d = 28; d <= day; d++) out.push(d);
	return out;
}

const CLAMP_DAYS = new Set([29, 30, 31]);

/**
 * Serialise builder state to a bare RRULE string.
 *
 * `reference` is the entry's start date - the monthly modes are stated relative
 * to it ("day 15", "the third Monday"), and the builder has no date field of its
 * own for that.
 */
export function buildRecurrenceRule(state: RecurrenceBuilderState, reference: Date): string {
	const parts = [`FREQ=${RRule.FREQUENCIES[FREQ_BY_UNIT[state.unit]]}`];

	if (state.interval > 1) {
		parts.push(`INTERVAL=${Math.floor(state.interval)}`);
	}

	if (state.unit === "week" && state.weekdays.length > 0) {
		const ordered = [...new Set(state.weekdays)]
			.filter((d) => d >= 0 && d <= 6)
			.sort((a, b) => a - b)
			.map((d) => WEEKDAY_CODES[d]);
		if (ordered.length > 0) parts.push(`BYDAY=${ordered.join(",")}`);
	}

	if (state.unit === "month") {
		if (state.monthlyMode === "weekday-of-month") {
			const code = WEEKDAY_CODES[mondayIndexOf(reference)];
			parts.push(`BYDAY=${monthlyWeekdayOrdinal(reference)}${code}`);
		} else if (state.monthlyMode === "last-day") {
			parts.push("BYMONTHDAY=-1");
		} else {
			const raw = Number.isFinite(state.monthDay) ? Math.trunc(state.monthDay) : reference.getDate();
			const day = Math.min(Math.max(raw, 1), 31);
			if (state.monthDayClamp && CLAMP_DAYS.has(day)) {
				parts.push(`BYMONTHDAY=${clampRange(day).join(",")}`);
				parts.push("BYSETPOS=-1");
			} else {
				parts.push(`BYMONTHDAY=${day}`);
			}
		}
	}

	if (state.endMode === "after" && state.endCount >= 1) {
		parts.push(`COUNT=${Math.floor(state.endCount)}`);
	} else if (state.endMode === "on" && state.endDate) {
		const { year, month, day } = state.endDate;
		// End of the chosen day, in UTC, so the day itself is included.
		parts.push(`UNTIL=${year}${two(month)}${two(day)}T235959Z`);
	}

	return parts.join(";");
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
	if (value === null || value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

/** A plain weekday number, or `null` when the token carried an ordinal (`3MO`). */
function plainWeekdayNumber(value: unknown): number | null {
	if (value instanceof Weekday) return value.n === undefined ? value.weekday : null;
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const index = (WEEKDAY_CODES as readonly string[]).indexOf(value.toUpperCase());
		return index === -1 ? null : index;
	}
	return null;
}

function ordinalOfWeekday(value: unknown): number | null {
	if (value instanceof Weekday) return value.n ?? null;
	if (Array.isArray(value) && value.length === 2) return Number(value[1]);
	return null;
}

/**
 * Best-effort inverse of {@link buildRecurrenceRule}.
 *
 * Returns `null` when the rule is empty, unparseable, or uses anything the
 * visual builder cannot show (a set position, an hour rule, several
 * `BYMONTHDAY`s, …) - the field falls back to its raw-text editor for those.
 */
export function parseRecurrenceRule(rule: string): RecurrenceBuilderState | null {
	if (!rule || !rule.trim()) return null;

	let options: ReturnType<typeof RRule.parseString>;
	try {
		options = RRule.parseString(rule);
	} catch {
		return null;
	}

	if (options.freq === undefined) return null;
	const unit = UNIT_BY_FREQ[options.freq];
	if (!unit) return null;

	// Parts the builder has no control for. `bysetpos` is the exception: the
	// month branch below accepts the one shape it emits (the clamp idiom).
	if (
		toArray(options.bymonth).length > 0 ||
		toArray(options.byyearday).length > 0 ||
		toArray(options.byweekno).length > 0 ||
		toArray(options.byhour).length > 0 ||
		toArray(options.byminute).length > 0 ||
		toArray(options.bysecond).length > 0 ||
		options.byeaster !== undefined
	) {
		return null;
	}

	const byweekday = toArray(options.byweekday);
	const bymonthday = toArray(options.bymonthday);
	const bysetpos = toArray(options.bysetpos);

	let weekdays: number[] = [];
	let monthlyMode: MonthlyMode = "day-of-month";
	let monthDay = 1;
	let monthDayClamp = false;

	if (unit === "week") {
		if (bymonthday.length > 0 || bysetpos.length > 0) return null;
		weekdays = byweekday.map(plainWeekdayNumber).filter((n): n is number => n !== null);
		if (weekdays.length !== byweekday.length) return null;
	} else if (unit === "month") {
		if (byweekday.length > 0 && bymonthday.length > 0) return null;
		if (byweekday.length > 0) {
			if (bysetpos.length > 0) return null;
			if (byweekday.length !== 1 || ordinalOfWeekday(byweekday[0]) === null) return null;
			monthlyMode = "weekday-of-month";
		} else if (bysetpos.length > 0) {
			// The clamp idiom: BYMONTHDAY=28,…,N ; BYSETPOS=-1.
			if (bysetpos.length !== 1 || Number(bysetpos[0]) !== -1) return null;
			const days = bymonthday.map(Number).sort((a, b) => a - b);
			const last = days[days.length - 1];
			if (!CLAMP_DAYS.has(last)) return null;
			const expected = clampRange(last);
			if (days.length !== expected.length || days.some((d, i) => d !== expected[i])) return null;
			monthlyMode = "day-of-month";
			monthDay = last;
			monthDayClamp = true;
		} else if (bymonthday.length > 0) {
			if (bymonthday.length !== 1) return null;
			const raw = Number(bymonthday[0]);
			if (!Number.isInteger(raw)) return null;
			if (raw === -1) {
				monthlyMode = "last-day";
			} else if (raw >= 1 && raw <= 31) {
				monthlyMode = "day-of-month";
				monthDay = raw;
			} else {
				// -2 … -31, or 0: real RRULE, but nothing the builder can show.
				return null;
			}
		}
	} else if (byweekday.length > 0 || bymonthday.length > 0 || bysetpos.length > 0) {
		return null;
	}

	let endMode: RecurrenceEndMode = "never";
	let endDate: CalendarDate | null = null;
	let endCount = 10;
	if (options.count !== undefined && options.count !== null) {
		endMode = "after";
		endCount = options.count;
	} else if (options.until) {
		endMode = "on";
		const u = options.until;
		endDate = new CalendarDate(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate());
	}

	return {
		unit,
		interval: options.interval && options.interval > 0 ? options.interval : 1,
		weekdays,
		monthlyMode,
		monthDay,
		monthDayClamp,
		endMode,
		endDate,
		endCount,
	};
}
