import * as rrule from "rrule";

/**
 * A recurrence rule as one short human phrase - "Repeats weekly", "Every 2
 * weeks on Mon, Wed, until 1 Dec 2026" - for the side panel's read view and the
 * entry form's live preview.
 *
 * `rrule` is an OPTIONAL peer dependency: AppAgenda ships from its own entry
 * point (`@bernardsapida/web-ui/agenda`) so a project that never renders the
 * scheduler never installs it. This module is only ever reached through that
 * entry.
 *
 * NAMESPACE import, not `import { RRule }`: `rrule` is a CommonJS module, and
 * Vite's SSR module runner rejects a named import it cannot statically verify
 * against `module.exports`. `import * as` takes the whole exports object, which
 * always works, and `rrule.RRule` is still fully typed.
 */
const { RRule, Weekday } = rrule;
const FREQ_WORD: Record<number, string> = {
	[RRule.YEARLY]: "year",
	[RRule.MONTHLY]: "month",
	[RRule.WEEKLY]: "week",
	[RRule.DAILY]: "day",
	[RRule.HOURLY]: "hour",
	[RRule.MINUTELY]: "minute",
	[RRule.SECONDLY]: "second",
};

const ADVERB: Record<number, string> = {
	[RRule.YEARLY]: "annually",
	[RRule.MONTHLY]: "monthly",
	[RRule.WEEKLY]: "weekly",
	[RRule.DAILY]: "daily",
};

const CUSTOM = "Repeats on a custom schedule";

/** MO-indexed, matching `rrule`'s `Weekday.weekday`. */
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ORDINAL_WORD = ["first", "second", "third", "fourth", "fifth"];

function toArray<T>(value: T | T[] | null | undefined): T[] {
	if (value === null || value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

function weekdayNumber(value: unknown): number | null {
	if (value instanceof Weekday) return value.weekday;
	if (typeof value === "number") return value;
	if (Array.isArray(value) && typeof value[0] === "number") return value[0];
	return null;
}

function weekdayOrdinal(value: unknown): number | null {
	if (value instanceof Weekday) return value.n ?? null;
	if (Array.isArray(value) && value.length === 2) return Number(value[1]);
	return null;
}

function ordinalWord(n: number): string {
	if (n === -1) return "last";
	return ORDINAL_WORD[n - 1] ?? `${n}th`;
}

const MONTH_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

function formatUntil(date: Date): string {
	// UNTIL is a UTC instant; read it back in UTC so the day never slips a
	// timezone either way. Formatted by hand rather than through `Intl` so the
	// phrase is the same in every locale and every test runner.
	return `${date.getUTCDate()} ${MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function summariseRecurrence(rule: string | null | undefined): string | null {
	if (!rule) return null;
	let options: ReturnType<typeof RRule.parseString>;
	try {
		options = RRule.parseString(rule);
	} catch {
		return CUSTOM;
	}
	const freq = options.freq;
	if (freq === undefined) return CUSTOM;

	const interval = options.interval ?? 1;
	let base: string | null;
	if (interval === 1) {
		const adverb = ADVERB[freq];
		base = adverb ? `Repeats ${adverb}` : null;
	} else {
		const word = FREQ_WORD[freq];
		base = word ? `Every ${interval} ${word}s` : null;
	}
	if (!base) return CUSTOM;

	const byweekday = toArray(options.byweekday);
	const bymonthday = toArray(options.bymonthday);
	const bysetpos = toArray(options.bysetpos);
	const clampsToMonthEnd = bysetpos.length === 1 && Number(bysetpos[0]) === -1;

	let detail = "";
	if (freq === RRule.WEEKLY && byweekday.length > 0) {
		const names = byweekday
			.map(weekdayNumber)
			.filter((n): n is number => n !== null && n >= 0 && n <= 6)
			.map((n) => DAY_SHORT[n]);
		if (names.length > 0) detail = ` on ${names.join(", ")}`;
	} else if (freq === RRule.MONTHLY && byweekday.length === 1 && !clampsToMonthEnd) {
		const n = weekdayOrdinal(byweekday[0]);
		const day = weekdayNumber(byweekday[0]);
		if (n !== null && day !== null && day >= 0 && day <= 6) {
			detail = ` on the ${ordinalWord(n)} ${DAY_LONG[day]}`;
		}
	} else if (freq === RRule.MONTHLY && clampsToMonthEnd && bymonthday.length > 1) {
		const highest = Math.max(...bymonthday.map(Number));
		detail = ` on day ${highest} or the month's last day`;
	} else if (freq === RRule.MONTHLY && bymonthday.length === 1) {
		detail = Number(bymonthday[0]) === -1 ? " on the last day" : ` on day ${bymonthday[0]}`;
	}

	// A BYSETPOS we did not just phrase means the rest of this summary would be a
	// half-truth - the side panel is better off saying nothing specific.
	if (bysetpos.length > 0 && !detail) return CUSTOM;

	let tail = "";
	if (options.count !== undefined && options.count !== null) {
		tail = `, ${options.count} ${options.count === 1 ? "time" : "times"}`;
	} else if (options.until) {
		tail = `, until ${formatUntil(options.until)}`;
	}

	return `${base}${detail}${tail}`;
}

/** The presets the entry form offers, mapped to an RRULE string (no DTSTART). */
export type RecurrencePreset = "none" | "daily" | "weekly" | "monthly" | "custom";

export function presetToRule(preset: RecurrencePreset, custom?: string): string | undefined {
	switch (preset) {
		case "daily":
			return "FREQ=DAILY";
		case "weekly":
			return "FREQ=WEEKLY";
		case "monthly":
			return "FREQ=MONTHLY";
		case "custom":
			return custom?.trim() || undefined;
		default:
			return undefined;
	}
}

/** Best-effort inverse, for opening the form on an existing entry. */
export function ruleToPreset(rule: string | null | undefined): RecurrencePreset {
	if (!rule) return "none";
	const normalised = rule.replace(/\s/g, "").toUpperCase();
	if (normalised === "FREQ=DAILY") return "daily";
	if (normalised === "FREQ=WEEKLY") return "weekly";
	if (normalised === "FREQ=MONTHLY") return "monthly";
	return "custom";
}
