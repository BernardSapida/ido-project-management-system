import { CalendarDate } from "@internationalized/date";
import { describe, expect, it } from "vitest";
import {
	buildRecurrenceRule,
	defaultRecurrenceState,
	parseRecurrenceRule,
	type RecurrenceBuilderState,
} from "./recurrence-rule";
import { summariseRecurrence } from "./recurrence-summary";

/** Monday, 5 Jan 2026 - the first Monday of its month. */
const MON_JAN_5 = new Date(2026, 0, 5);
/** Monday, 26 Jan 2026 - the last Monday of its month. */
const MON_JAN_26 = new Date(2026, 0, 26);

function state(overrides: Partial<RecurrenceBuilderState> = {}): RecurrenceBuilderState {
	return { ...defaultRecurrenceState(MON_JAN_5), ...overrides };
}

describe("buildRecurrenceRule", () => {
	it("omits INTERVAL when it is 1", () => {
		expect(buildRecurrenceRule(state({ unit: "day", weekdays: [] }), MON_JAN_5)).toBe("FREQ=DAILY");
	});

	it("writes INTERVAL when above 1", () => {
		expect(buildRecurrenceRule(state({ unit: "week", interval: 2, weekdays: [] }), MON_JAN_5)).toBe(
			"FREQ=WEEKLY;INTERVAL=2",
		);
	});

	it("writes weekday codes sorted and de-duplicated", () => {
		expect(
			buildRecurrenceRule(state({ unit: "week", weekdays: [2, 0, 2] }), MON_JAN_5),
		).toBe("FREQ=WEEKLY;BYDAY=MO,WE");
	});

	it("phrases monthly day-of-month against the reference date", () => {
		expect(
			buildRecurrenceRule(state({ unit: "month", monthlyMode: "day-of-month" }), MON_JAN_5),
		).toBe("FREQ=MONTHLY;BYMONTHDAY=5");
	});

	it("phrases monthly nth-weekday against the reference date", () => {
		expect(
			buildRecurrenceRule(state({ unit: "month", monthlyMode: "weekday-of-month" }), MON_JAN_5),
		).toBe("FREQ=MONTHLY;BYDAY=1MO");
	});

	it("uses -1 for the last weekday of the month", () => {
		expect(
			buildRecurrenceRule(state({ unit: "month", monthlyMode: "weekday-of-month" }), MON_JAN_26),
		).toBe("FREQ=MONTHLY;BYDAY=-1MO");
	});

	it("writes an explicit BYMONTHDAY for a chosen day", () => {
		expect(
			buildRecurrenceRule(state({ unit: "month", monthlyMode: "day-of-month", monthDay: 31 }), MON_JAN_5),
		).toBe("FREQ=MONTHLY;BYMONTHDAY=31");
	});

	it("writes BYMONTHDAY=-1 for the last day of the month", () => {
		expect(
			buildRecurrenceRule(state({ unit: "month", monthlyMode: "last-day" }), MON_JAN_5),
		).toBe("FREQ=MONTHLY;BYMONTHDAY=-1");
	});

	it("clamps a 29+ day to month-end with the BYSETPOS idiom", () => {
		expect(
			buildRecurrenceRule(
				state({ unit: "month", monthlyMode: "day-of-month", monthDay: 30, monthDayClamp: true }),
				MON_JAN_5,
			),
		).toBe("FREQ=MONTHLY;BYMONTHDAY=28,29,30;BYSETPOS=-1");
		expect(
			buildRecurrenceRule(
				state({ unit: "month", monthlyMode: "day-of-month", monthDay: 31, monthDayClamp: true }),
				MON_JAN_5,
			),
		).toBe("FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1");
	});

	it("ignores the clamp flag for a day that exists in every month", () => {
		expect(
			buildRecurrenceRule(
				state({ unit: "month", monthlyMode: "day-of-month", monthDay: 15, monthDayClamp: true }),
				MON_JAN_5,
			),
		).toBe("FREQ=MONTHLY;BYMONTHDAY=15");
	});

	it("writes COUNT for an occurrence cap", () => {
		expect(
			buildRecurrenceRule(state({ unit: "day", weekdays: [], endMode: "after", endCount: 10 }), MON_JAN_5),
		).toBe("FREQ=DAILY;COUNT=10");
	});

	it("writes an inclusive UTC UNTIL for an end date", () => {
		expect(
			buildRecurrenceRule(
				state({ unit: "day", weekdays: [], endMode: "on", endDate: new CalendarDate(2026, 12, 1) }),
				MON_JAN_5,
			),
		).toBe("FREQ=DAILY;UNTIL=20261201T235959Z");
	});
});

describe("parseRecurrenceRule", () => {
	it("round-trips a weekly rule with weekdays and a count", () => {
		const rule = "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=8";
		const parsed = parseRecurrenceRule(rule);
		expect(parsed).toMatchObject({
			unit: "week",
			interval: 2,
			weekdays: [0, 2],
			endMode: "after",
			endCount: 8,
		});
		expect(buildRecurrenceRule(parsed as RecurrenceBuilderState, MON_JAN_5)).toBe(rule);
	});

	it("maps an UNTIL back to a CalendarDate", () => {
		const parsed = parseRecurrenceRule("FREQ=DAILY;UNTIL=20261201T235959Z");
		expect(parsed?.endMode).toBe("on");
		expect(parsed?.endDate).toEqual(new CalendarDate(2026, 12, 1));
	});

	it("recognises a monthly nth-weekday rule", () => {
		expect(parseRecurrenceRule("FREQ=MONTHLY;BYDAY=1MO")).toMatchObject({
			unit: "month",
			monthlyMode: "weekday-of-month",
		});
	});

	it("reads an explicit day-of-month", () => {
		expect(parseRecurrenceRule("FREQ=MONTHLY;BYMONTHDAY=15")).toMatchObject({
			unit: "month",
			monthlyMode: "day-of-month",
			monthDay: 15,
		});
	});

	it("reads BYMONTHDAY=-1 as the last-day mode", () => {
		expect(parseRecurrenceRule("FREQ=MONTHLY;BYMONTHDAY=-1")).toMatchObject({
			unit: "month",
			monthlyMode: "last-day",
		});
	});

	it("returns null for a negative BYMONTHDAY other than -1", () => {
		expect(parseRecurrenceRule("FREQ=MONTHLY;BYMONTHDAY=-2")).toBeNull();
	});

	it("round-trips the month-end clamp idiom", () => {
		const rule = "FREQ=MONTHLY;BYMONTHDAY=28,29,30;BYSETPOS=-1;COUNT=6";
		const parsed = parseRecurrenceRule(rule);
		expect(parsed).toMatchObject({
			unit: "month",
			monthlyMode: "day-of-month",
			monthDay: 30,
			monthDayClamp: true,
		});
		expect(buildRecurrenceRule(parsed as RecurrenceBuilderState, MON_JAN_5)).toBe(rule);
	});

	it("returns null for a BYSETPOS shape it does not emit", () => {
		// last weekday of the month
		expect(parseRecurrenceRule("FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1")).toBeNull();
		// a BYMONTHDAY list that is not the 28-anchored clamp range
		expect(parseRecurrenceRule("FREQ=MONTHLY;BYMONTHDAY=29,30;BYSETPOS=-1")).toBeNull();
		// BYSETPOS on a frequency the builder has no clamp path for
		expect(parseRecurrenceRule("FREQ=WEEKLY;BYDAY=MO,TU;BYSETPOS=1")).toBeNull();
	});

	it("returns null for an empty string", () => {
		expect(parseRecurrenceRule("")).toBeNull();
		expect(parseRecurrenceRule("   ")).toBeNull();
	});

	it("returns null for a sub-daily frequency the builder cannot show", () => {
		expect(parseRecurrenceRule("FREQ=HOURLY;INTERVAL=6")).toBeNull();
	});

	it("returns null for unparseable junk", () => {
		expect(parseRecurrenceRule("not a rule")).toBeNull();
	});
});

describe("summariseRecurrence", () => {
	it("keeps the bare preset phrasing", () => {
		expect(summariseRecurrence("FREQ=WEEKLY")).toBe("Repeats weekly");
		expect(summariseRecurrence("FREQ=DAILY;INTERVAL=3")).toBe("Every 3 days");
	});

	it("names the weekdays of a weekly rule", () => {
		expect(summariseRecurrence("FREQ=WEEKLY;BYDAY=MO,WE")).toBe("Repeats weekly on Mon, Wed");
	});

	it("names the nth weekday of a monthly rule", () => {
		expect(summariseRecurrence("FREQ=MONTHLY;BYDAY=3MO")).toBe("Repeats monthly on the third Monday");
		expect(summariseRecurrence("FREQ=MONTHLY;BYDAY=-1FR")).toBe("Repeats monthly on the last Friday");
	});

	it("names the day-of-month of a monthly rule", () => {
		expect(summariseRecurrence("FREQ=MONTHLY;BYMONTHDAY=15")).toBe("Repeats monthly on day 15");
		expect(summariseRecurrence("FREQ=MONTHLY;BYMONTHDAY=-1")).toBe("Repeats monthly on the last day");
	});

	it("names the month-end clamp idiom", () => {
		expect(summariseRecurrence("FREQ=MONTHLY;BYMONTHDAY=28,29,30;BYSETPOS=-1")).toBe(
			"Repeats monthly on day 30 or the month's last day",
		);
	});

	it("falls back for an unrecognised BYSETPOS", () => {
		expect(summariseRecurrence("FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1")).toBe(
			"Repeats on a custom schedule",
		);
	});

	it("appends a count or an until clause", () => {
		expect(summariseRecurrence("FREQ=WEEKLY;COUNT=1")).toBe("Repeats weekly, 1 time");
		expect(summariseRecurrence("FREQ=WEEKLY;COUNT=10")).toBe("Repeats weekly, 10 times");
		expect(summariseRecurrence("FREQ=DAILY;UNTIL=20261201T235959Z")).toBe("Repeats daily, until 1 Dec 2026");
	});

	it("falls back for a rule it cannot phrase", () => {
		expect(summariseRecurrence("FREQ=HOURLY")).toBe("Repeats on a custom schedule");
		expect(summariseRecurrence(null)).toBeNull();
	});
});
