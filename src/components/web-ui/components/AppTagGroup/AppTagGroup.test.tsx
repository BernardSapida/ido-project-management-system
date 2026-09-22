import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppTagGroup } from "./AppTagGroup";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. So the
 * behaviours that need a real browser are exercised in the lab and not here:
 * that React Aria makes the whole list ONE tab stop with the arrows moving
 * between tags inside it, that `onSelectionChange` fires with a Set, and that
 * pressing a remove button calls `onRemove` with the one key.
 *
 * What IS pinned is every decision the component makes before anything is on
 * screen, each invisible in a screenshot:
 *
 * - `onRemove` is the whole switch for dismissible: no handler, no remove
 *   buttons, so the affordance and the thing it calls cannot drift apart.
 * - `label` is always rendered - the list is a single tab stop announced as a
 *   group, and an unnamed group is announced as nothing. `isLabelHidden` keeps
 *   it as the accessible name and only takes it off screen.
 * - Empty renders the `emptyText` sentence, never a labelled heading over an
 *   empty list - that reads as a section that failed and strands a tab stop.
 * - Every tag's `data-cy` is derived from the group's, so two tag groups on one
 *   page cannot end up with two of anything sharing a selector.
 */

const ITEMS = [
	{ key: "billing", label: "Billing" },
	{ key: "shipping", label: "Shipping" },
	{ key: "returns", label: "Returns" },
];

describe("AppTagGroup markup", () => {
	it("renders each item's label under the group's own label", () => {
		const html = renderToStaticMarkup(<AppTagGroup items={ITEMS} label="Topics" />);

		expect(html).toContain("Topics");
		expect(html).toContain("Billing");
		expect(html).toContain("Shipping");
		expect(html).toContain("Returns");
	});

	it("draws no remove buttons without an onRemove handler", () => {
		const html = renderToStaticMarkup(<AppTagGroup items={ITEMS} label="Topics" />);

		expect(html).not.toContain('data-slot="tag-remove-button"');
		expect(html).not.toContain('data-allows-removing="true"');
	});

	it("draws a remove button per tag once onRemove is given", () => {
		const html = renderToStaticMarkup(
			<AppTagGroup items={ITEMS} label="Applied filters" onRemove={() => undefined} />,
		);

		expect(html.match(/data-slot="tag-remove-button"/g)).toHaveLength(ITEMS.length);
	});

	it("keeps the label as the accessible name when it is visually hidden", () => {
		const shown = renderToStaticMarkup(<AppTagGroup items={ITEMS} label="Topics" />);
		expect(shown).not.toContain("sr-only");

		const hidden = renderToStaticMarkup(<AppTagGroup isLabelHidden items={ITEMS} label="Topics" />);
		expect(hidden).toContain("Topics");
		expect(hidden).toContain("sr-only");
	});

	describe("empty", () => {
		it("renders a sentence rather than an empty list", () => {
			const html = renderToStaticMarkup(<AppTagGroup items={[]} label="Applied filters" />);

			expect(html).toContain("None");
			expect(html).not.toContain('data-slot="tag-group-list"');
			expect(html).not.toContain('data-slot="tag"');
		});

		it("takes a caller's emptyText", () => {
			const html = renderToStaticMarkup(
				<AppTagGroup emptyText="No filters applied" items={[]} label="Applied filters" />,
			);

			expect(html).toContain("No filters applied");
		});

		it("still names the group", () => {
			const html = renderToStaticMarkup(<AppTagGroup items={[]} label="Applied filters" />);

			expect(html).toContain("Applied filters");
		});
	});

	describe("test hooks", () => {
		it("puts the group hook on the group and derives one per tag", () => {
			const html = renderToStaticMarkup(
				<AppTagGroup data-cy="topics" items={ITEMS} label="Topics" />,
			);

			expect(html).toContain('data-cy="topics"');
			expect(html).toContain('data-cy="topics-tag-billing"');
			expect(html).toContain('data-cy="topics-tag-returns"');
		});

		it("derives the empty hook from the group hook", () => {
			const html = renderToStaticMarkup(
				<AppTagGroup data-cy="topics" items={[]} label="Topics" />,
			);

			expect(html).toContain('data-cy="topics-empty"');
		});
	});
});
