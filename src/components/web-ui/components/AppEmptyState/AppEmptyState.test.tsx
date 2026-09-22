import { FolderPlus } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppEmptyState, type EmptyReason } from "./AppEmptyState";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. What
 * needs a real browser is covered by the lab's spec in
 * `apps/web/cypress/e2e/components/` (that the panel renders inside a table
 * spanning every column, that pressing the action fires `onPress`).
 *
 * What IS pinned here is every decision the component makes before anything is
 * on screen, each invisible in a screenshot:
 *
 * - `data-reason`, the hook a spec keys off. The three reasons must never
 *   collapse into each other - a filtered-out user told "nothing has been added"
 *   goes away - and the copy that distinguishes them is meant to be rewritten,
 *   so the stable assertion is the attribute, not the sentence.
 * - Each reason's preset glyph and copy, so a caller cannot get `filtered`'s
 *   words under `no-data`'s icon.
 * - `no-results` echoes the query back, or the user cannot see what was searched.
 * - `data-variant`, and the heading level that follows it: an `h2` in a panel
 *   that sits under a page's `h1`, an `h1` on the page variant that is the whole
 *   screen. A wrong level here is a hole in the document outline.
 * - It is never a blank panel: an icon, a title and a sentence are always in the
 *   markup. With no `reason` the type forces the caller to supply all three.
 * - No `action` means no `<button>` - the one case where a dead end is allowed,
 *   because the state resolves itself.
 */

const ALL_REASONS: EmptyReason[] = ["no-data", "no-results", "filtered"];

const PRESET_TITLE: Record<EmptyReason, string> = {
	filtered: "Nothing matches these filters",
	"no-data": "Nothing here yet",
	"no-results": "No matches",
};

describe("AppEmptyState markup", () => {
	it("always renders an icon, a title and a sentence - never a blank panel", () => {
		for (const reason of ALL_REASONS) {
			const html = renderToStaticMarkup(<AppEmptyState reason={reason} />);

			expect(html).toContain("<svg");
			expect(html).toContain(PRESET_TITLE[reason]);
			// The preset sentence - a non-empty paragraph under the title.
			expect(html).toMatch(/<p[^>]*>[^<]+<\/p>/);
		}
	});

	it("carries the reason as data, so the three never collapse into each other", () => {
		for (const reason of ALL_REASONS) {
			const html = renderToStaticMarkup(<AppEmptyState reason={reason} />);

			expect(html).toContain(`data-reason="${reason}"`);
		}
	});

	it("gives each reason its own glyph and its own copy", () => {
		const filtered = renderToStaticMarkup(<AppEmptyState reason="filtered" />);
		const noData = renderToStaticMarkup(<AppEmptyState reason="no-data" />);

		expect(filtered).toContain("Nothing matches these filters");
		expect(filtered).not.toContain("Nothing has been added yet");
		expect(noData).toContain("Nothing has been added yet");
		expect(noData).not.toContain("Nothing matches these filters");
	});

	it("echoes the query back in the no-results copy", () => {
		const html = renderToStaticMarkup(<AppEmptyState query="quezon medial" reason="no-results" />);

		expect(html).toContain("quezon medial");
	});

	describe("variant", () => {
		it("defaults to the panel, with the title as an h2", () => {
			const html = renderToStaticMarkup(<AppEmptyState reason="no-data" />);

			expect(html).toContain('data-variant="panel"');
			expect(html).toContain("<h2");
		});

		it("leads the page variant with an h1", () => {
			const html = renderToStaticMarkup(<AppEmptyState reason="no-data" variant="page" />);

			expect(html).toContain('data-variant="page"');
			expect(html).toContain("<h1");
			expect(html).not.toContain("<h2");
		});

		it("takes an explicit heading level over the variant default", () => {
			const html = renderToStaticMarkup(<AppEmptyState headingLevel={3} reason="no-data" />);

			expect(html).toContain("<h3");
		});
	});

	describe("custom (no reason)", () => {
		it("renders the caller's icon, title and description and carries no data-reason", () => {
			const html = renderToStaticMarkup(
				<AppEmptyState
					description="Projects group the work for one client."
					icon={FolderPlus}
					title="Start your first project"
				/>,
			);

			expect(html).toContain("Start your first project");
			expect(html).toContain("Projects group the work for one client.");
			expect(html).toContain("<svg");
			expect(html).not.toContain("data-reason");
		});
	});

	describe("actions", () => {
		it("renders no button when there is no action - the one allowed dead end", () => {
			const html = renderToStaticMarkup(<AppEmptyState reason="no-data" />);

			expect(html).not.toContain("<button");
		});

		it("renders the primary action as a button", () => {
			const html = renderToStaticMarkup(
				<AppEmptyState action={{ label: "Add an order", onPress: () => undefined }} reason="no-data" />,
			);

			expect(html).toContain("<button");
			expect(html).toContain("Add an order");
		});

		it("renders both actions when a secondary is given", () => {
			const html = renderToStaticMarkup(
				<AppEmptyState
					action={{ label: "Add an order", onPress: () => undefined }}
					reason="no-data"
					secondaryAction={{ label: "Import from CSV", onPress: () => undefined }}
				/>,
			);

			expect(html).toContain("Add an order");
			expect(html).toContain("Import from CSV");
			expect(html.match(/<button/g) ?? []).toHaveLength(2);
		});
	});

	it("renders the children slot between the description and the actions", () => {
		const html = renderToStaticMarkup(
			<AppEmptyState reason="no-data">
				<span>what the feature enables</span>
			</AppEmptyState>,
		);

		expect(html).toContain("what the feature enables");
	});

	it("overrides the preset sentence when a description is given", () => {
		const html = renderToStaticMarkup(
			<AppEmptyState description="Orders you place show up here once payment clears." reason="no-data" />,
		);

		expect(html).toContain("Orders you place show up here once payment clears.");
		expect(html).not.toContain("Nothing has been added yet");
	});

	it("forwards its test hook to the root", () => {
		const html = renderToStaticMarkup(<AppEmptyState data-cy="team-empty" reason="no-data" />);

		expect(html).toContain('data-cy="team-empty"');
	});
});
