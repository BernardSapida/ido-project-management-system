import { describe, expect, it } from "vitest";
import type { FilterDef } from "../AppFilterBar";
import { keepValidFilters } from "./use-stored-table-filters";

const DEFS = [
	{
		allLabel: "All cities",
		icon: (() => null) as unknown as FilterDef["icon"],
		key: "city",
		label: "City",
		options: [
			{ label: "Makati", value: "Makati" },
			{ label: "Pasig", value: "Pasig" },
		],
	},
	{
		allLabel: "All statuses",
		icon: (() => null) as unknown as FilterDef["icon"],
		key: "status",
		label: "Status",
		options: [{ label: "Active", value: "active" }],
	},
] satisfies FilterDef[];

/**
 * The guard that makes storing filters safe rather than merely convenient.
 *
 * Anything restored has to be something a dropdown can currently display and
 * "Clear all" can currently clear. A stored value that no longer exists as an
 * option narrows every future visit to zero rows, counts as active, and has no
 * control able to reach it - a filter the user can neither see nor undo, on a
 * table that looks empty for no stated reason.
 */
describe("keepValidFilters", () => {
	it("keeps a value the table still offers", () => {
		expect(keepValidFilters({ city: "Makati" }, DEFS)).toEqual({ city: "Makati" });
	});

	it("drops a value that is no longer one of the options", () => {
		// Cebu was a city last release and is not one now.
		expect(keepValidFilters({ city: "Cebu" }, DEFS)).toEqual({});
	});

	it("drops a key the table no longer has a filter for", () => {
		expect(keepValidFilters({ service: "Express", city: "Pasig" }, DEFS)).toEqual({ city: "Pasig" });
	});

	it("drops nulls and empty strings rather than counting them as active", () => {
		expect(keepValidFilters({ city: null, status: "" }, DEFS)).toEqual({});
	});

	it("survives junk under the key without throwing", () => {
		expect(keepValidFilters({ city: 42 as unknown as string }, DEFS)).toEqual({});
	});

	it("returns nothing when there is nothing stored", () => {
		expect(keepValidFilters({}, DEFS)).toEqual({});
	});
});
