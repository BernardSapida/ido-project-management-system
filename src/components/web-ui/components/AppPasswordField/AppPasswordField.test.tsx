import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppPasswordField } from "./AppPasswordField";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * things that need a real browser are the lab's job: that the reveal button
 * actually flips the input to text and back, that the meter and the ticks move
 * as you type, and that a screen reader hears the band name only when it
 * changes. `password-strength.test.ts` pins the scoring on its own.
 *
 * What IS pinned here is every decision the field makes before anyone types:
 *
 * - The reveal button is a real, named button, and the input starts masked.
 * - `autoComplete` reaches the input - the whole reason it is a required prop.
 * - The browser's native reveal is a CSS concern (`ui.css`), not markup, so it
 *   is not asserted here.
 * - `strength` is opt-in: no meter and no checklist without it. React Aria
 *   already wires the input's `aria-describedby` to its description and error
 *   slots; `strength` APPENDS the panel's own id to that list.
 * - An empty field with `strength` reads NEUTRAL - no danger colour, no "Weak",
 *   nothing announced. A meter that shouts "weak" before the first keystroke is
 *   the thing this component is not.
 */

const base = {
	autoComplete: "new-password",
	label: "Create password",
	onChange: () => undefined,
} as const;

describe("AppPasswordField markup", () => {
	it("starts masked, with a named reveal button", () => {
		const html = renderToStaticMarkup(<AppPasswordField {...base} value="hunter2" />);

		expect(html).toContain('type="password"');
		expect(html).toContain("Show password");
		expect(html).toContain("<button");
	});

	it("puts the autocomplete hint on the input", () => {
		const html = renderToStaticMarkup(<AppPasswordField {...base} value="" />);

		expect(html.toLowerCase()).toContain('autocomplete="new-password"');
	});

	it("forwards its test hook to the root", () => {
		const html = renderToStaticMarkup(<AppPasswordField {...base} data-cy="pw" value="" />);

		expect(html).toContain('data-cy="pw"');
	});

	describe("without strength", () => {
		it("renders no meter and no checklist, and no wrapping panel", () => {
			const html = renderToStaticMarkup(<AppPasswordField {...base} value="password" />);

			expect(html).not.toContain("better to have");
			expect(html).not.toContain("Password strength");
			expect(html.startsWith('<div class="flex flex-col gap-2">')).toBe(false);
		});

		it("leaves the input's aria-describedby to React Aria's own two slots", () => {
			const html = renderToStaticMarkup(<AppPasswordField {...base} value="password" />);

			const described = html.match(/aria-describedby="([^"]+)"/)?.[1] ?? "";
			expect(described.split(" ")).toHaveLength(2);
		});
	});

	describe("with strength", () => {
		it("appends the strength panel's own id to the input's aria-describedby", () => {
			const html = renderToStaticMarkup(<AppPasswordField {...base} strength value="password" />);

			const described = html.match(/aria-describedby="([^"]+)"/)?.[1] ?? "";
			const panelId = described.split(" ").at(-1);

			expect(described.split(" ")).toHaveLength(3);
			expect(panelId).toBeTruthy();
			expect(html).toContain(`id="${panelId}"`);
			expect(html).toContain("better to have");
		});

		it("reads neutral on an empty field - no danger colour, nothing announced", () => {
			const html = renderToStaticMarkup(<AppPasswordField {...base} strength value="" />);

			expect(html).toContain("Password strength");
			expect(html).not.toContain("Password strength:");
			expect(html).not.toContain("text-danger");
			expect(html).not.toContain("Weak");
		});

		it("colours the meter for a weak password", () => {
			const html = renderToStaticMarkup(<AppPasswordField {...base} strength value="password" />);

			expect(html).toContain("Weak");
			expect(html).toContain("text-danger");
			expect(html).toContain("bg-danger");
		});

		it("colours the meter and ticks the boxes for a strong password", () => {
			const html = renderToStaticMarkup(
				<AppPasswordField {...base} strength value="Xk9$mQ2pLw7!" />,
			);

			expect(html).toContain("Strong");
			expect(html).toContain("text-success");
			expect(html).toContain("bg-success");
			// A met hint gets the filled brand checkbox and the label drops back.
			expect(html).toContain("bg-brand-fill");
			expect(html).toContain("line-through");
		});

		it("announces the band name once there is a value to score", () => {
			const html = renderToStaticMarkup(<AppPasswordField {...base} strength value="password" />);

			expect(html).toContain('aria-live="polite"');
			expect(html).toContain("Password strength: Weak");
		});
	});
});
