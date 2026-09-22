import { Wifi } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppCheckboxGroup } from "./AppCheckboxGroup";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * browser-only checks are the lab's job and its Cypress specs: that ticking a
 * tile toggles it, that emptying a ticked required group reports on the change,
 * that blur reports an untouched required group, and that the `auto` grid
 * reflows at the `sm` breakpoint.
 *
 * What IS pinned is the structure a caller and a spec depend on and cannot see
 * move:
 *
 * - **The hidden `<input type="checkbox">` per option**, each carrying its
 *   value, and the field holding a `string[]`. Cypress selects the group by
 *   `data-cy` and options by `input[type="checkbox"]`.
 * - **The tick is a corner badge, not a box on the face.** `checkbox-control`
 *   renders, but positioned `absolute` in the corner and `opacity-0` until
 *   `group-data-selected` flips it on - so an unselected tile shows nothing but
 *   its border. `pe-8` on the content keeps the label clear of it.
 * - **`orientation` picks the grid columns**, same three shapes as the radio
 *   group.
 * - **`**:data-[slot=checkbox]:mt-0` on the group** cancels the `mt-4` HeroUI
 *   puts between items; the grid `gap` owns tile spacing instead.
 * - `data-cy`, the accessible name, and the invalid / required / disabled data
 *   attributes a spec asserts on.
 */

const AMENITIES = [
	{ description: "Fibre broadband.", icon: Wifi, label: "Wi-Fi", value: "wifi" },
	{ label: "Parking", value: "parking" },
	{ label: "Pool", value: "pool" },
];

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);
const noop = () => undefined;

describe("AppCheckboxGroup", () => {
	describe("shape and accessible name", () => {
		it("is a labelled group and passes data-cy to the root", () => {
			const html = markup(
				<AppCheckboxGroup data-cy="amenities" items={AMENITIES} label="Amenities" onChange={noop} value={[]} />,
			);

			expect(html).toContain('data-slot="checkbox-group"');
			expect(html).toContain('role="group"');
			expect(html).toContain('data-cy="amenities"');
			expect(html).toContain("Amenities");
			expect(html).toMatch(/data-slot="checkbox-group"[^>]*aria-labelledby=/);
		});
	});

	describe("the hidden inputs are the control, and the value is a list", () => {
		it("renders one checkbox input per option, each carrying its own value", () => {
			const html = markup(<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} value={[]} />);

			expect(html.match(/type="checkbox"/g)).toHaveLength(AMENITIES.length);
			expect(html).toContain('value="wifi"');
			expect(html).toContain('value="parking"');
			expect(html).toContain('value="pool"');
		});

		it("checks every input whose value is in the array", () => {
			const html = markup(
				<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} value={["wifi", "pool"]} />,
			);

			expect(html.match(/checked=""/g)).toHaveLength(2);
			expect(html).toMatch(/checked=""[^>]*value="wifi"/);
			expect(html).toMatch(/checked=""[^>]*value="pool"/);
		});
	});

	describe("the tick is a corner badge", () => {
		it("renders the control absolutely in the corner, hidden until the tile is selected", () => {
			const html = markup(<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} value={[]} />);

			expect(html).toContain('data-slot="checkbox-control"');
			expect(html).toContain("checkbox__control absolute end-2 top-2");
			expect(html).toContain("opacity-0 transition-opacity group-data-selected:opacity-100");
		});

		it("reserves room for the badge with pe-8 on the content so a long label never runs under it", () => {
			const html = markup(<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} value={[]} />);

			expect(html).toMatch(/data-slot="checkbox-content"[^>]*class="[^"]*\bpe-8\b/);
		});

		it("marks the selected tile with data-selected so the border and badge can key off it", () => {
			const html = markup(
				<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} value={["wifi"]} />,
			);

			expect(html).toMatch(/data-slot="checkbox"[^>]*data-selected="true"/);
			expect(html).toContain("data-selected:border-accent");
		});
	});

	describe("icon and description are per item", () => {
		it("renders a decorative icon before the label when the item has one", () => {
			const html = markup(<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} value={[]} />);

			expect(html).toMatch(/<svg[^>]*lucide-wifi[^>]*aria-hidden="true"/);
		});

		it("renders a description line only for the item that has one", () => {
			const html = markup(<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} value={[]} />);

			expect(html).toMatch(/data-slot="description"[^>]*>Fibre broadband\./);
			expect(html.match(/data-slot="description"/g)).toHaveLength(1);
		});
	});

	describe("orientation picks the grid columns", () => {
		it("auto (the default): one column plus a sm: auto-fit track", () => {
			const html = markup(<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} value={[]} />);

			expect(html).toContain("grid-cols-1");
			expect(html).toContain("sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]");
		});

		it("horizontal: the auto-fit track at every width, never a single column", () => {
			const html = markup(
				<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} orientation="horizontal" value={[]} />,
			);

			expect(html).toContain("grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]");
			expect(html).not.toContain("sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]");
			expect(html).not.toMatch(/<div class="grid[^"]*\bgrid-cols-1\b/);
		});

		it("vertical: one column, and no auto-fit track", () => {
			const html = markup(
				<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} orientation="vertical" value={[]} />,
			);

			expect(html).toMatch(/<div class="grid[^"]*\bgrid-cols-1\b/);
			expect(html).not.toContain("auto-fit");
		});
	});

	describe("group class contract", () => {
		it("cancels HeroUI's inter-item margin and spaces the label from the grid", () => {
			const html = markup(<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} value={[]} />);

			expect(html).toMatch(/data-slot="checkbox-group"[^>]*class="[^"]*\*\*:data-\[slot=checkbox\]:mt-0/);
			expect(html).toMatch(/data-slot="checkbox-group"[^>]*class="[^"]*\bgap-2\b/);
		});
	});

	describe("state, from a standalone errorMessage", () => {
		it("goes invalid and renders the message in the field error", () => {
			const html = markup(
				<AppCheckboxGroup
					data-cy="amenities"
					errorMessage="Pick at least one"
					isRequired
					items={AMENITIES}
					label="Amenities"
					onChange={noop}
					value={[]}
				/>,
			);

			expect(html).toMatch(/data-slot="checkbox-group"[^>]*data-invalid="true"/);
			expect(html).toContain('aria-invalid="true"');
			// RAC's CheckboxGroup carries required as `data-required` on the group and
			// `required` on each input, not `aria-required` on the group.
			expect(html).toMatch(/data-slot="checkbox-group"[^>]*data-required="true"/);
			expect(html).toContain('required=""');
			expect(html).toMatch(/data-slot="field-error"[^>]*>Pick at least one/);
		});

		it("stays valid with no errorMessage", () => {
			const html = markup(<AppCheckboxGroup items={AMENITIES} label="Amenities" onChange={noop} value={[]} />);

			expect(html).not.toContain('data-invalid="true"');
		});

		it("disables every option when the group is disabled", () => {
			const html = markup(
				<AppCheckboxGroup isDisabled items={AMENITIES} label="Amenities" onChange={noop} value={[]} />,
			);

			expect(html).toMatch(/data-slot="checkbox-group"[^>]*data-disabled="true"/);
			const disabledBoxes = (html.match(/<input[^>]*>/g) ?? []).filter(
				(tag) => tag.includes('type="checkbox"') && tag.includes("disabled="),
			);
			expect(disabledBoxes).toHaveLength(AMENITIES.length);
		});
	});
});
