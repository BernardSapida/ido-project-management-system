import { describe, expect, it } from "vitest";
import { PASSWORD_HINTS, scorePassword } from "./password-strength";

/**
 * The scorer is a stand-in for a real entropy estimator (zxcvbn), which this
 * repo cannot install yet. What is pinned here is the shape of that stand-in, so
 * a later rewrite has to keep the promises the meter makes:
 *
 * - length is the spine - a short password cannot be strong however varied
 * - the obvious cheap passwords (one character class, `1234`, `aaaa`) are weak
 *   no matter how long
 * - a long single-class string is a passphrase, not a cheap password, so length
 *   still carries it
 * - suggestions name a concrete next step, and go quiet once the password is
 *   strong
 */

describe("scorePassword", () => {
	it("treats anything under 8 characters as too short", () => {
		expect(scorePassword("")).toMatchObject({ score: 0, label: "Too short" });
		expect(scorePassword("aB3$xy")).toMatchObject({ score: 0, label: "Too short" });
	});

	it("caps a single character class at weak while it is short", () => {
		expect(scorePassword("password")).toMatchObject({ score: 1, label: "Weak" });
		expect(scorePassword("aaaaaaaa")).toMatchObject({ score: 1, label: "Weak" });
	});

	it("caps a keyboard walk or a long repeat at weak however long it is", () => {
		expect(scorePassword("abcd1234efghij").score).toBe(1);
		expect(scorePassword("aaaaaaaaaaaaaaaaaa").score).toBe(1);
	});

	it("lets a long single-class passphrase score strong", () => {
		expect(scorePassword("correcthorsebatterystaple")).toMatchObject({ score: 4, label: "Strong" });
	});

	it("rewards length, and nudges up for character variety", () => {
		// 8 chars, four classes: one band up from the raw length score.
		expect(scorePassword("Xk9$mQ2p")).toMatchObject({ score: 2, label: "Fair" });
		// 12 chars, four classes: top band.
		expect(scorePassword("Xk9$mQ2pLw7!")).toMatchObject({ score: 4, label: "Strong" });
	});

	it("clamps to the 0-4 range", () => {
		for (const value of ["", "x", "password", "Xk9$mQ2pLw7!Za#4", "correcthorsebatterystaple"]) {
			const { score } = scorePassword(value);
			expect(score).toBeGreaterThanOrEqual(0);
			expect(score).toBeLessThanOrEqual(4);
		}
	});

	it("names a concrete next step, and stops once strong", () => {
		expect(scorePassword("abcdef").suggestions).toContain("Use 12 or more characters");
		expect(scorePassword("password").suggestions).toContain("Mix upper and lower case");
		expect(scorePassword("password").suggestions).toContain("Add a symbol (!?@#)");
		expect(scorePassword("Xk9$mQ2pLw7!").suggestions).toEqual([]);
	});
});

describe("PASSWORD_HINTS", () => {
	it("is the three soft rules the checklist shows", () => {
		expect(PASSWORD_HINTS.map((hint) => hint.id)).toEqual(["case", "symbol", "length"]);
	});

	it("ticks case only when both cases are present", () => {
		const rule = PASSWORD_HINTS.find((hint) => hint.id === "case");
		expect(rule?.met("lowercase")).toBe(false);
		expect(rule?.met("UPPERCASE")).toBe(false);
		expect(rule?.met("MixedCase")).toBe(true);
	});

	it("ticks symbol on any non-alphanumeric, and length at 12", () => {
		const symbol = PASSWORD_HINTS.find((hint) => hint.id === "symbol");
		expect(symbol?.met("abc123")).toBe(false);
		expect(symbol?.met("abc-123")).toBe(true);

		const length = PASSWORD_HINTS.find((hint) => hint.id === "length");
		expect(length?.met("01234567890")).toBe(false);
		expect(length?.met("012345678901")).toBe(true);
	});
});
