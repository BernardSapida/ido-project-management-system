import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppErrorState, type ErrorKind } from "./AppErrorState";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. So the
 * things that need a real browser are covered elsewhere and NOT here: that the
 * page variant actually moves focus to itself on mount, that `useIsOffline`
 * demotes `network`/`timeout` to `offline` when the browser goes offline, and
 * that pressing the recovery button reloads or calls `onRetry`. Those live in
 * `apps/web/cypress/e2e/components/`, which drives the lab.
 *
 * What IS pinned is every decision the component makes before anyone can see or
 * press anything, and each one is invisible in a screenshot:
 *
 * - `data-tone`, the hook the stylesheet keys the recovery button's colour off.
 *   A danger error has to offer a danger-coloured button and a warning error a
 *   warning one, so the way out reads as part of the same message rather than
 *   pulling the eye to a brand pill. Drop the mapping and every error state
 *   silently goes back to a blue button.
 * - `error-state__action` on the primary button. That class is the ONLY thing
 *   `ui.css` paints the tone pair onto - without it the button falls back to
 *   HeroUI's `button--primary` brand fill regardless of `data-tone`.
 * - `data-kind`, the kind as data rather than as copy or a glyph. Eleven kinds
 *   that must never collapse into each other need one stable hook; the copy is
 *   meant to be rewritten.
 * - The live region. A `section` error appears after the page has settled, so it
 *   announces itself with `role="alert"`. A `page` error carries neither that
 *   nor a positive tabindex - its focus move is what announces it, and the two
 *   together read the whole thing out twice.
 * - Every kind carries a way out. There is no `recovery: "none"`, so a `<button>`
 *   is always in the markup - a dead end is the one thing this may never render.
 */

const ALL_KINDS: ErrorKind[] = [
	"conflict",
	"forbidden",
	"maintenance",
	"network",
	"not-found",
	"offline",
	"rate-limited",
	"server",
	"timeout",
	"unauthenticated",
	"unknown",
];

/** The preset table's tone per kind - the pair `ui.css` paints the button from. */
const TONE_BY_KIND: Record<ErrorKind, "accent" | "danger" | "warning"> = {
	conflict: "warning",
	forbidden: "danger",
	maintenance: "accent",
	network: "warning",
	"not-found": "accent",
	offline: "warning",
	"rate-limited": "warning",
	server: "danger",
	timeout: "warning",
	unauthenticated: "accent",
	unknown: "danger",
};

describe("AppErrorState markup", () => {
	it("renders the glyph, the headline and both paragraphs", () => {
		const html = renderToStaticMarkup(<AppErrorState kind="server" />);

		expect(html).toContain("Something went wrong on our side");
		expect(html).toContain("We hit a problem handling this request. Nothing you did caused it.");
		expect(html).toContain("Please try again in a moment.");
		expect(html).toContain("<svg");
	});

	it("carries the kind as data, so eleven of them never collapse into each other", () => {
		for (const kind of ALL_KINDS) {
			const html = renderToStaticMarkup(<AppErrorState kind={kind} />);

			expect(html).toContain(`data-kind="${kind}"`);
		}
	});

	it("maps each kind to the tone the recovery button is coloured from", () => {
		for (const kind of ALL_KINDS) {
			const html = renderToStaticMarkup(<AppErrorState kind={kind} />);

			expect(html).toContain(`data-tone="${TONE_BY_KIND[kind]}"`);
		}
	});

	it("puts `error-state__action` on the primary button, whatever the tone", () => {
		/*
		 * The class - not the tone - is what `ui.css` hangs the `--danger` /
		 * `--warning` pair on. A button that loses it renders `button--primary`
		 * blue on every kind, which is the regression this pins.
		 */
		for (const kind of ALL_KINDS) {
			const html = renderToStaticMarkup(<AppErrorState kind={kind} />);

			expect(html).toContain("error-state__action");
		}
	});

	it("never renders a dead end - every kind offers a way out", () => {
		for (const kind of ALL_KINDS) {
			const html = renderToStaticMarkup(<AppErrorState kind={kind} />);

			expect(html).toContain("<button");
		}
	});

	describe("announcement", () => {
		it("interrupts as an alert when it stands in for one region", () => {
			const html = renderToStaticMarkup(<AppErrorState kind="server" variant="section" />);

			expect(html).toContain('role="alert"');
			expect(html).toContain('data-variant="section"');
		});

		it("carries no role on the page variant - the focus move announces it instead", () => {
			const html = renderToStaticMarkup(<AppErrorState kind="not-found" variant="page" />);

			expect(html).not.toContain('role="alert"');
			expect(html).toContain('tabindex="-1"');
			expect(html).toContain('data-variant="page"');
		});
	});

	describe("caller overrides", () => {
		it("replaces the built-in recovery but keeps the button styled to the tone", () => {
			const html = renderToStaticMarkup(
				<AppErrorState
					action={{ label: "Return to the dashboard", onPress: () => undefined }}
					kind="server"
				/>,
			);

			expect(html).toContain("Return to the dashboard");
			expect(html).not.toContain("Try again");
			expect(html).toContain("error-state__action");
		});

		it("takes a specific headline and next-step over the preset copy", () => {
			const html = renderToStaticMarkup(
				<AppErrorState
					kind="not-found"
					next="Head back to the customer list and open the record from there."
					title="That customer profile no longer exists"
				/>,
			);

			expect(html).toContain("That customer profile no longer exists");
			expect(html).toContain("Head back to the customer list and open the record from there.");
			expect(html).not.toContain("We couldn't find that page");
		});
	});

	it("forwards its test hook to the root", () => {
		const html = renderToStaticMarkup(<AppErrorState data-cy="report-error" kind="server" />);

		expect(html).toContain('data-cy="report-error"');
	});
});
