import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MAIN_CONTENT_ID } from "../AppSkipToContent";
import { AppMain } from "./AppMain";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * cross-fade on a change of `fadeKey` is the lab's to watch; what is pinned here
 * is the landmark contract.
 *
 * - Exactly one `<main>`, carrying `MAIN_CONTENT_ID` so the skip link lands and
 *   `tabIndex={-1}` so focus can go there. `id` and `label` are overridable for
 *   the lab, which puts two specimens on one page.
 * - `data-width` is the caller's request; the measure cap is on an INNER
 *   element, so the landmark still spans the region. `full` caps at nothing.
 * - `hasBottomBar` is the only thing that adds the safe-area padding and the
 *   `--tab-bar-height` custom property.
 * - `fadeKey` is what adds `nav-fade` to the inner element - absent, there is no
 *   transition class to run.
 */

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

describe("AppMain", () => {
	describe("the landmark", () => {
		it("renders one <main> with the skip-link id and tabindex -1", () => {
			const html = markup(<AppMain>page</AppMain>);
			expect(html.match(/<main/g)).toHaveLength(1);
			expect(html).toContain(`id="${MAIN_CONTENT_ID}"`);
			expect(html).toContain('tabindex="-1"');
			expect(html).toContain("page");
		});

		it("defaults its accessible name and takes an override", () => {
			expect(markup(<AppMain>x</AppMain>)).toContain('aria-label="Application content"');
			const relabelled = markup(
				<AppMain id="main-measure-specimen" label="Measure specimen">
					x
				</AppMain>,
			);
			expect(relabelled).toContain('aria-label="Measure specimen"');
			expect(relabelled).toContain('id="main-measure-specimen"');
		});
	});

	describe("the measure", () => {
		it("reports the caller's width as data-width and defaults to default", () => {
			expect(markup(<AppMain>x</AppMain>)).toContain('data-width="default"');
			expect(markup(<AppMain width="prose">x</AppMain>)).toContain('data-width="prose"');
		});

		it("caps the INNER element, not the landmark", () => {
			const html = markup(<AppMain width="prose">x</AppMain>);
			// the cap class sits after the <main> tag, on the centring div
			const afterMain = html.slice(html.indexOf(">", html.indexOf("<main")) + 1);
			expect(afterMain).toContain("max-w-prose");
		});

		it("caps nothing for width=full", () => {
			const html = markup(<AppMain width="full">x</AppMain>);
			expect(html).toContain('data-width="full"');
			expect(html).not.toContain("max-w-6xl");
			expect(html).not.toContain("max-w-prose");
		});
	});

	describe("room for a bottom bar", () => {
		it("adds the safe-area padding and the --tab-bar-height property only when asked", () => {
			const withBar = markup(
				<AppMain hasBottomBar>x</AppMain>,
			);
			expect(withBar).toContain("--tab-bar-height");
			expect(withBar).toContain("env(safe-area-inset-bottom)");

			const withoutBar = markup(<AppMain>x</AppMain>);
			expect(withoutBar).not.toContain("--tab-bar-height");
		});
	});

	describe("the destination transition", () => {
		it("adds nav-fade to the inner element only when fadeKey is given", () => {
			expect(markup(<AppMain fadeKey="/reports">x</AppMain>)).toContain("nav-fade");
			expect(markup(<AppMain>x</AppMain>)).not.toContain("nav-fade");
		});
	});

	describe("the test hook", () => {
		it("passes data-cy through to the landmark", () => {
			expect(markup(<AppMain data-cy="main">x</AppMain>)).toContain('data-cy="main"');
		});
	});
});
