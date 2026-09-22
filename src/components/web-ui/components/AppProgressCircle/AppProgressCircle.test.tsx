import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppProgressCircle } from "./AppProgressCircle";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * direction and origin of the sweep are the lab's to watch; what is pinned here
 * is the structure.
 *
 * - Same indeterminate rule as the bar: `value` is dropped, not pinned at 0, so
 *   React Aria emits no `aria-valuenow`.
 * - The arc is painted by a per-instance SVG paint server - a `<linearGradient>`
 *   with three tokened `<stop>`s - handed to HeroUI through
 *   `--progress-circle-stroke`. The id is stripped to word characters because it
 *   goes into a `url(#…)` reference parsed as CSS.
 * - `label` is always the accessible name; `isLabelHidden` only moves the
 *   caption to `sr-only`.
 */

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

describe("AppProgressCircle", () => {
	describe("the label is the accessible name", () => {
		it("puts the label on the progresscircle and draws it as the caption", () => {
			const html = markup(<AppProgressCircle label="Storage used" value={68} />);
			expect(html).toContain('aria-label="Storage used"');
			expect(html).toContain("Storage used");
		});

		it("keeps the caption in the markup as sr-only when hidden", () => {
			const html = markup(<AppProgressCircle isLabelHidden label="Storage used" value={68} />);
			expect(html).toContain("Storage used");
			expect(html).toMatch(/class="[^"]*\bsr-only\b/);
		});
	});

	describe("indeterminate is not zero", () => {
		it("a determinate ring carries aria-valuenow", () => {
			const html = markup(<AppProgressCircle label="Storage used" value={68} />);
			expect(html).toContain('aria-valuenow="68"');
		});

		it("an indeterminate ring carries no aria-valuenow", () => {
			const html = markup(<AppProgressCircle isIndeterminate label="Working" />);
			expect(html).not.toContain("aria-valuenow");
		});
	});

	describe("the gradient paint server", () => {
		it("declares a linearGradient with three tokened stops", () => {
			const html = markup(<AppProgressCircle label="Storage used" value={68} />);
			expect(html).toContain("<linearGradient");
			expect(html).toContain("progress-circle__stop-from");
			expect(html).toContain("progress-circle__stop-via");
			expect(html).toContain("progress-circle__stop-to");
		});

		it("hands the arc a url(#…) reference whose id is word characters only", () => {
			const html = markup(<AppProgressCircle label="Storage used" value={68} />);
			const match = html.match(/--progress-circle-stroke:url\(#(progress-circle-[^)]+)\)/);
			expect(match).not.toBeNull();
			expect(match?.[1]).toMatch(/^progress-circle-[a-zA-Z0-9]+$/);
			expect(html).toContain(`id="${match?.[1]}"`);
		});
	});

	describe("the test hook", () => {
		it("passes data-cy through to the wrapper", () => {
			const html = markup(<AppProgressCircle data-cy="quota" label="Storage used" value={68} />);
			expect(html).toContain('data-cy="quota"');
		});
	});
});
