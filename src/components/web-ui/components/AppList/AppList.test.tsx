import { Building2 } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ListItem } from "./AppList";
import { AppList } from "./AppList";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * keyboard reorder route, the pointer drag and the press wash are the lab's to
 * watch; what is pinned here is the structure a spec depends on and the two row
 * shapes staying separate.
 *
 * - The three surfaces each carry `data-state` - loading / empty / ready - so a
 *   spec never has to tell them apart by skeleton markup or empty-state copy.
 * - A pressable row is a `<button data-row-press>` on the primary line, so its
 *   accessible name is the primary line plus `nameDetail` and nothing else; an
 *   inert row has no such button and the actions are the targets.
 * - `data-pressable` on the row is the union branch as data.
 * - Selection renders its own checkbox as a SIBLING of the row button, and the
 *   selected row reports `data-selected`.
 * - Reorder adds a handle and the sr-only instructions; it is never optional
 *   once `reorder` is passed.
 */

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

const ITEMS: ListItem[] = [
	{
		key: "qc-north",
		leading: { icon: Building2, kind: "icon" },
		meta: "12 bays",
		nameDetail: "Quezon City",
		primary: "Quezon City North Depot",
		secondary: "Seminary Road, Barangay Bahay Toro",
	},
	{
		key: "makati-hub",
		leading: { icon: Building2, kind: "icon" },
		meta: "4 bays",
		primary: "Makati Central Hub",
	},
];

const EDIT_ACTION = {
	description: "Opens the warehouse in a drawer.",
	icon: Building2,
	label: "Edit",
	onPress: () => undefined,
};

describe("AppList", () => {
	describe("the three surfaces", () => {
		it("loading is data-state=loading with an aria-busy skeleton list", () => {
			const html = markup(<AppList isLoading items={[]} label="Warehouses" />);
			expect(html).toContain('data-state="loading"');
			expect(html).toContain('aria-busy="true"');
			expect(html).toContain('aria-label="Warehouses, loading"');
		});

		it("empty is data-state=empty with a derived data-cy and the default reason", () => {
			const html = markup(<AppList data-cy="list" items={[]} label="Warehouses" />);
			expect(html).toContain('data-state="empty"');
			expect(html).toContain('data-cy="list-empty"');
			expect(html).toContain('data-reason="no-data"');
		});

		it("empty echoes the search term for a no-results list", () => {
			const html = markup(
				<AppList
					data-cy="list"
					empty={{ query: "bgc depot", reason: "no-results" }}
					items={[]}
					label="Warehouses"
				/>,
			);
			expect(html).toContain('data-reason="no-results"');
			expect(html).toContain("bgc depot");
		});

		it("loaded is data-state=ready with the list named", () => {
			const html = markup(<AppList items={ITEMS} label="Warehouses" />);
			expect(html).toContain('data-state="ready"');
			expect(html).toContain('aria-label="Warehouses"');
			expect(html).toContain('data-row-key="qc-north"');
			expect(html).toContain('data-row-key="makati-hub"');
			expect(html).toContain("12 bays");
		});
	});

	describe("the row is inert without onSelectItem", () => {
		it("has no press button and names each action with its row", () => {
			const html = markup(<AppList actions={[EDIT_ACTION]} items={ITEMS} label="Warehouses" />);
			expect(html).toContain('data-pressable="false"');
			expect(html).not.toContain("data-row-press");
			expect(html).toContain('aria-label="Edit Quezon City North Depot"');
			expect(html).toContain('aria-label="Edit Makati Central Hub"');
		});
	});

	describe("the row is the target with onSelectItem", () => {
		const html = markup(
			<AppList
				items={ITEMS}
				label="Warehouses"
				onSelectItem={() => undefined}
				rowMenu={() => [
					{ items: [{ icon: Building2, key: "edit", label: "Edit warehouse", onAction: () => undefined }], key: "m" },
				]}
			/>,
		);

		it("puts a data-row-press button on the primary line", () => {
			expect(html).toContain('data-pressable="true"');
			expect(html).toContain("data-row-press");
		});

		it("folds nameDetail into the name and nowhere else", () => {
			expect(html).toContain("Quezon City North Depot");
			expect(html).toContain(", Quezon City");
		});

		it("names the row menu for its own row", () => {
			expect(html).toContain('aria-label="More actions for Quezon City North Depot"');
		});
	});

	describe("selection is not navigation", () => {
		it("renders a sibling checkbox per row and marks the selected one", () => {
			const html = markup(
				<AppList
					items={ITEMS}
					label="Warehouses"
					onSelectItem={() => undefined}
					selection={{ onChange: () => undefined, selectedKeys: ["makati-hub"] }}
				/>,
			);
			expect(html).toContain('aria-label="Select Quezon City North Depot"');
			expect(html).toContain('data-row-key="makati-hub"');
			expect(html).toMatch(/data-row-key="makati-hub"[^>]*data-selected="true"|data-selected="true"[^>]*data-row-key="makati-hub"/);
		});
	});

	describe("reorder is drag AND keyboard", () => {
		it("adds a draggable handle and the sr-only instructions", () => {
			const html = markup(
				<AppList items={ITEMS} label="Allocation priorities" reorder={{ onReorder: () => undefined }} />,
			);
			expect(html).toContain('data-state="ready"');
			expect(html).toContain("data-reorder-handle");
			expect(html).toContain("draggable");
			expect(html).toContain("Press Enter or Space to pick this row up");
			expect(html).toMatch(/aria-label="Reorder Quezon City North Depot, position 1 of 2"/);
		});
	});
});
