import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppAside } from "./AppAside";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * stacking, the sticky behaviour and the `dvh` cap all need a real viewport and
 * are exercised by hand in the lab; what is pinned here is every decision the
 * component makes before anything is on screen, each one invisible in a
 * screenshot:
 *
 * - It is ALWAYS a `glass-strong` floating card. There is no `flush` variant and
 *   no `variant` prop - `AppSidebar` and `AppHeader` are edges of the frame, a
 *   supporting pane is an object beside the content, and a hairline meeting an
 *   edge would make it read as another one. This is the regression guard against
 *   a flush path creeping back.
 * - The landmark is always named. With a `title` the `<aside>` points
 *   `aria-labelledby` at the rendered `<h2>`; without one it falls back to a
 *   literal `aria-label`, never to an anonymous region.
 * - `className` is merged, not swapped - a caller passing a max-height cap must
 *   not delete the card's own surface.
 * - The test hook reaches the root `<aside>`.
 */

describe("AppAside markup", () => {
	it("renders an <aside> as a floating glass card, whatever the caller passes", () => {
		const html = renderToStaticMarkup(<AppAside>Body</AppAside>);

		expect(html).toContain("<aside");
		expect(html).toContain("glass-strong");
		expect(html).toContain("rounded-3xl");
		expect(html).toContain("Body");
	});

	it("has no flush path - no variant prop, no data-variant, no border-t hairline", () => {
		const html = renderToStaticMarkup(<AppAside title="Filters">Body</AppAside>);

		expect(html).not.toContain("data-variant");
		expect(html).not.toContain("border-t");
	});

	it("names its landmark off the heading when given a title", () => {
		const html = renderToStaticMarkup(<AppAside title="Activity">Body</AppAside>);

		expect(html).toContain("<h2");
		expect(html).toContain("Activity");
		expect(html).toContain("aria-labelledby=");
		expect(html).not.toContain('aria-label="Supporting information"');
	});

	it("falls back to a literal label when there is no title, and renders no heading", () => {
		const html = renderToStaticMarkup(<AppAside>Body</AppAside>);

		expect(html).toContain('aria-label="Supporting information"');
		expect(html).not.toContain("aria-labelledby");
		expect(html).not.toContain("<h2");
	});

	it("merges className rather than replacing the card's own classes", () => {
		const html = renderToStaticMarkup(
			<AppAside className="@4xl:max-h-[calc(32rem-2rem)]">Body</AppAside>,
		);

		expect(html).toContain("@4xl:max-h-[calc(32rem-2rem)]");
		expect(html).toContain("glass-strong");
	});

	it("forwards its test hook to the root", () => {
		const html = renderToStaticMarkup(<AppAside data-cy="filters-pane">Body</AppAside>);

		expect(html).toContain('data-cy="filters-pane"');
	});
});
