import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppTabs } from "./AppTabs";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. That is
 * a real limit here: the one feature this component adds over HeroUI's Tabs is
 * the `onSelectionChange` re-selection guard in `lastKeyRef`, and firing a click
 * to prove it is not reachable from `renderToStaticMarkup`. The lab's own
 * "click the active tab three times" check is where that lives, and a jsdom test
 * driving `onSelectionChange` is the first thing to write when a DOM lands here.
 *
 * What IS pinned is the structure a caller depends on and cannot see move:
 *
 * - `label` becomes the tablist's accessible name. Two tab sets on one page
 *   both announced as "Tabs" is the failure the required prop exists to stop.
 * - The `data-cy` on each tab and panel is DERIVED - `${dataCy}-tab-${key}` /
 *   `${dataCy}-panel-${key}` - so a spec selects by key, not by the visible
 *   label that copy edits keep rewriting.
 * - The active pill is a brand fill, not HeroUI's white `bg-segment`, and the
 *   selected label takes the ink that fill is contrast-paired with. Neither has
 *   a tell in the markup of an unselected tab, so both are pinned by class.
 * - Tab labels are `whitespace-nowrap`; without it a narrow column wraps
 *   "Integrations" onto two lines instead of letting the list scroll.
 */

const ITEMS = [
	{ key: "profile", label: "Profile", content: <p>Name and timezone.</p> },
	{ key: "security", label: "Security", content: <p>Password.</p> },
	{ key: "billing", label: "Billing", content: <p>Plan.</p> },
];

function markup(node: Parameters<typeof renderToStaticMarkup>[0]) {
	return renderToStaticMarkup(node);
}

describe("AppTabs", () => {
	describe("accessible name", () => {
		it("hangs `label` on the tablist so two sets on a page stay distinct", () => {
			const html = markup(<AppTabs items={ITEMS} label="Account sections" />);

			expect(html).toContain('role="tablist"');
			expect(html).toContain('aria-label="Account sections"');
		});
	});

	describe("data-cy is derived, never the label", () => {
		it("keys every tab and the visible panel off the group hook and the item key", () => {
			const html = markup(
				<AppTabs data-cy="settings" items={ITEMS} label="Account sections" />,
			);

			expect(html).toContain('data-cy="settings"');
			expect(html).toContain('data-cy="settings-tab-profile"');
			expect(html).toContain('data-cy="settings-tab-billing"');
			// React Aria mounts the selected panel only; the first item is it.
			expect(html).toContain('data-cy="settings-panel-profile"');
		});

		it("adds no data-cy attributes when the group has no hook", () => {
			const html = markup(<AppTabs items={ITEMS} label="Account sections" />);

			expect(html).not.toContain("data-cy");
		});
	});

	describe("selection", () => {
		it("selects the first item when the caller pins none", () => {
			const html = markup(
				<AppTabs data-cy="s" items={ITEMS} label="Account sections" />,
			);

			expect(html).toMatch(/data-cy="s-tab-profile"[^>]*aria-selected="true"/);
			expect(html).toMatch(/data-cy="s-tab-security"[^>]*aria-selected="false"/);
			expect(html).toContain('data-cy="s-panel-profile"');
		});

		it("honours an explicit defaultSelectedKey", () => {
			const html = markup(
				<AppTabs
					data-cy="s"
					defaultSelectedKey="security"
					items={ITEMS}
					label="Account sections"
				/>,
			);

			expect(html).toContain('data-cy="s-panel-security"');
			expect(html).not.toContain('data-cy="s-panel-profile"');
		});
	});

	describe("disabledKeys", () => {
		it("marks the named tab disabled to the reader, and leaves the rest alone", () => {
			const html = markup(
				<AppTabs
					data-cy="s"
					disabledKeys={["billing"]}
					items={ITEMS}
					label="Account sections"
				/>,
			);

			expect(html).toMatch(/data-cy="s-tab-billing"[^>]*(aria-disabled="true"|data-disabled="true")/);
			expect(html).not.toMatch(/data-cy="s-tab-profile"[^>]*aria-disabled="true"/);
		});
	});

	describe("active pill is the brand fill", () => {
		it("puts the brand utility on the indicator, not HeroUI's white segment", () => {
			const html = markup(
				<AppTabs data-cy="s" items={ITEMS} label="Account sections" />,
			);

			expect(html).toContain("gradient-brand");
		});

		it("gives the selected label the ink that fill is paired with", () => {
			const html = markup(
				<AppTabs data-cy="s" items={ITEMS} label="Account sections" />,
			);

			expect(html).toContain("data-[selected=true]:text-(--gradient-brand-foreground)");
		});

		it("keeps every tab label on one line", () => {
			const html = markup(
				<AppTabs data-cy="s" items={ITEMS} label="Account sections" />,
			);

			expect(html).toContain("whitespace-nowrap");
		});
	});

	describe("panel", () => {
		it("pads the panel away from the list", () => {
			const html = markup(
				<AppTabs data-cy="s" items={ITEMS} label="Account sections" />,
			);

			expect(html).toMatch(/data-cy="s-panel-profile"[^>]*class="[^"]*pt-4/);
		});
	});
});
