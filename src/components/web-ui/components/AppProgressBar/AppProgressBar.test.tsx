import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppProgressBar } from "./AppProgressBar";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * animated fill and the tailwind-variants slot bug the `data-*` attributes work
 * around are the lab's to watch; what is pinned here is the structure a caller
 * and a spec depend on.
 *
 * - `label` is always the accessible name, drawn or not - never defaulted to
 *   "Progress", which names the category rather than the thing.
 * - Indeterminate DROPS the value rather than passing 0: React Aria emits no
 *   `aria-valuenow` for it, and a determinate bar always carries one.
 * - Size and colour are restated as `data-size` / `data-color` because
 *   `styles.css` draws the height and the gradient off those, not off HeroUI's
 *   own memoised slot classes.
 * - The header row collapses to `gap-0` when there is nothing above the track.
 */

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

describe("AppProgressBar", () => {
	describe("the label is the accessible name", () => {
		it("puts the label on the progressbar as aria-label", () => {
			const html = markup(<AppProgressBar label="Uploading contract.pdf" value={40} />);
			expect(html).toContain('aria-label="Uploading contract.pdf"');
			expect(html).toContain("Uploading contract.pdf");
		});

		it("keeps the label in the markup as sr-only when hidden", () => {
			const html = markup(<AppProgressBar isLabelHidden label="Uploading contract.pdf" value={40} />);
			expect(html).toContain("Uploading contract.pdf");
			expect(html).toMatch(/class="[^"]*\bsr-only\b/);
		});
	});

	describe("indeterminate is not zero", () => {
		it("a determinate bar carries aria-valuenow", () => {
			const html = markup(<AppProgressBar label="Importing rows" value={67} />);
			expect(html).toContain('aria-valuenow="67"');
		});

		it("an indeterminate bar carries no aria-valuenow at all", () => {
			const html = markup(<AppProgressBar isIndeterminate label="Preparing your export" />);
			expect(html).not.toContain("aria-valuenow");
		});
	});

	describe("size and colour restated as data attributes", () => {
		it("defaults to data-size=md and data-color=accent", () => {
			const html = markup(<AppProgressBar label="Working" value={10} />);
			expect(html).toContain('data-size="md"');
			expect(html).toContain('data-color="accent"');
		});

		it("carries the caller's size and colour", () => {
			const html = markup(<AppProgressBar color="danger" label="Quota" size="sm" value={90} />);
			expect(html).toContain('data-size="sm"');
			expect(html).toContain('data-color="danger"');
		});
	});

	describe("the header row", () => {
		it("collapses to gap-0 when the label is hidden and there is no value label", () => {
			const html = markup(<AppProgressBar isLabelHidden label="Uploading" value={40} />);
			expect(html).toMatch(/class="[^"]*\bgap-0\b/);
		});

		it("keeps its gap when the label is drawn", () => {
			const html = markup(<AppProgressBar label="Uploading" value={40} />);
			expect(html).not.toMatch(/class="[^"]*\bgap-0\b/);
		});
	});

	describe("the test hook", () => {
		it("passes data-cy through to the progressbar", () => {
			const html = markup(<AppProgressBar data-cy="upload" label="Uploading" value={40} />);
			expect(html).toContain('data-cy="upload"');
		});
	});
});
