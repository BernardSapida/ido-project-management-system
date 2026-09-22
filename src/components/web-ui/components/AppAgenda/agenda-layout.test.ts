import { describe, expect, it } from "vitest";
import { layoutDay, monthMatrix, weekDays, weekdayLabels } from "./agenda-layout";

const h = (hour: number) => hour * 3_600_000;

describe("layoutDay", () => {
	it("gives a lone block the full width", () => {
		const [block] = layoutDay([{ id: "a", start: h(9), end: h(10) }], 0, h(24));
		expect(block).toMatchObject({ colIndex: 0, colCount: 1 });
	});

	it("splits two overlapping blocks into two columns", () => {
		const blocks = layoutDay(
			[
				{ id: "a", start: h(9), end: h(11) },
				{ id: "b", start: h(10), end: h(12) },
			],
			0,
			h(24),
		);
		expect(blocks.map((b) => b.colCount)).toEqual([2, 2]);
		expect(new Set(blocks.map((b) => b.colIndex))).toEqual(new Set([0, 1]));
	});

	it("reuses a column once the earlier block has ended", () => {
		const blocks = layoutDay(
			[
				{ id: "a", start: h(9), end: h(10) },
				{ id: "b", start: h(9), end: h(12) },
				{ id: "c", start: h(10), end: h(11) },
			],
			0,
			h(24),
		);
		// a and c do not overlap, so c takes a's column - cluster width stays 2.
		expect(blocks.every((b) => b.colCount === 2)).toBe(true);
	});

	it("positions a block by its real minutes", () => {
		const [block] = layoutDay(
			[{ id: "a", start: h(6), end: h(6) + 30 * 60_000 }],
			0,
			h(24),
		);
		expect(block.topPct).toBeCloseTo(25, 5);
		expect(block.heightPct).toBeCloseTo((0.5 / 24) * 100, 5);
	});
});

describe("month + week helpers", () => {
	it("monthMatrix is always 6 rows of 7", () => {
		const rows = monthMatrix(new Date("2026-01-15T00:00:00Z"), 1);
		expect(rows).toHaveLength(6);
		expect(rows.every((r) => r.length === 7)).toBe(true);
	});

	it("weekDays starts on the configured day", () => {
		const mondayStart = weekDays(new Date("2026-01-15T12:00:00"), 1);
		expect(mondayStart[0].getDay()).toBe(1);
		const sundayStart = weekDays(new Date("2026-01-15T12:00:00"), 0);
		expect(sundayStart[0].getDay()).toBe(0);
	});

	it("weekdayLabels rotates to the week start", () => {
		expect(weekdayLabels(1)[0]).toBe("Mon");
		expect(weekdayLabels(0)[0]).toBe("Sun");
	});
});
