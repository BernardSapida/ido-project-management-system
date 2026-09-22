import { Package } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppTracking, type TrackingItem } from "./AppTracking";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * container query that decides whether a horizontal run actually lies down is the
 * lab's job; what is pinned here is the structure a spec depends on.
 *
 * - `data-orientation` is which run was ASKED for, not which is showing - the
 *   container answers that, and each `<ol>` reports its own via `data-rendering`.
 * - The vertical `<ol>` is always present; the horizontal one is added only when
 *   `orientation="horizontal"`, so `hidden` never leaves an empty run in the
 *   accessibility tree.
 * - Each step carries `data-item-key` and `data-status`; the live step is
 *   `aria-current="step"`.
 * - Status shows in words (Done / Live / Pending), not colour alone.
 */

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

const ITEMS: TrackingItem[] = [
	{ key: "packed", label: "Packed", status: "done", sublabel: "Mon 09:14" },
	{ key: "shipped", label: "Shipped", status: "live", sublabel: "In transit" },
	{ key: "delivered", label: "Delivered", status: "pending", sublabel: "Expected tomorrow" },
];

const base = {
	description: "Order #4821",
	icon: Package,
	items: ITEMS,
	title: "Shipment",
};

describe("AppTracking", () => {
	describe("orientation is the caller's request, not the rendering", () => {
		it("reports data-orientation=vertical by default and renders only the rows run", () => {
			const html = markup(<AppTracking {...base} />);
			expect(html).toContain('data-orientation="vertical"');
			expect(html).toContain('data-rendering="rows"');
			expect(html).not.toContain('data-rendering="columns"');
		});

		it("adds the columns run only when horizontal is asked for", () => {
			const html = markup(<AppTracking {...base} orientation="horizontal" />);
			expect(html).toContain('data-orientation="horizontal"');
			expect(html).toContain('data-rendering="rows"');
			expect(html).toContain('data-rendering="columns"');
		});
	});

	describe("the steps", () => {
		it("carry key and status, and mark the live one aria-current", () => {
			const html = markup(<AppTracking {...base} />);
			expect(html).toContain('data-item-key="packed"');
			expect(html).toContain('data-status="done"');
			expect(html).toContain('data-status="live"');
			expect(html).toContain('aria-current="step"');
		});

		it("name their status in words", () => {
			const html = markup(<AppTracking {...base} />);
			expect(html).toContain("Done");
			expect(html).toContain("Live");
			expect(html).toContain("Pending");
		});
	});

	describe("header and footer", () => {
		it("renders the title and description", () => {
			const html = markup(<AppTracking {...base} />);
			expect(html).toContain("Shipment");
			expect(html).toContain("Order #4821");
		});

		it("renders the footer with a derived data-cy when one is passed", () => {
			const html = markup(
				<AppTracking
					{...base}
					data-cy="track"
					footer={{ label: "Expected delivery", value: "Tomorrow" }}
				/>,
			);
			expect(html).toContain('data-cy="track-footer"');
			expect(html).toContain("Expected delivery");
		});
	});
});
