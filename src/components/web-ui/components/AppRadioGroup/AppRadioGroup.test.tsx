import { House } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppRadioGroup } from "./AppRadioGroup";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. The
 * things that need a browser are the lab's job and its Cypress specs: that a
 * click anywhere on a tile selects it, that the arrows move between tiles as one
 * tab stop, that blur reports an untouched required group, and that the `auto`
 * grid actually reflows at the `sm` breakpoint.
 *
 * What IS pinned is the structure a caller and a spec depend on and cannot see
 * move:
 *
 * - **The hidden `<input type="radio">` per option.** Cypress selects the group
 *   by `data-cy` and the option by `input[type="radio"]`; the tile has no dot,
 *   so that input is the only handle on the control.
 * - **No control glyph.** `radio__control` / `radio__indicator` must not render
 *   - the accent border is the entire selected signal, and a dot creeping back
 *   in is a silent regression.
 * - **`orientation` picks the grid columns.** `auto` is a single column plus a
 *   `sm:` auto-fit track; `horizontal` is the auto-fit track at every width;
 *   `vertical` is one column, full stop.
 * - **`**:data-[slot=radio]:mt-0` on the group.** It cancels the `mt-4` HeroUI
 *   puts between vertical items; without it every grid row gains a stray top
 *   margin.
 * - `data-cy`, the accessible name, and the invalid / required / disabled data
 *   attributes a spec asserts on.
 */

const ROLES = [
	{ description: "All access.", icon: House, label: "Admin", value: "admin" },
	{ label: "Editor", value: "editor" },
	{ label: "Viewer", value: "viewer" },
];

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);
const noop = () => undefined;

describe("AppRadioGroup", () => {
	describe("shape and accessible name", () => {
		it("is a radiogroup, hangs the label on it, and passes data-cy to the root", () => {
			const html = markup(
				<AppRadioGroup data-cy="role" items={ROLES} label="Role" onChange={noop} value="" />,
			);

			expect(html).toContain('role="radiogroup"');
			expect(html).toContain('data-slot="radio-group"');
			expect(html).toContain('data-cy="role"');
			expect(html).toContain("Role");
			expect(html).toMatch(/data-slot="radio-group"[^>]*aria-labelledby=/);
		});
	});

	describe("the hidden input is the control", () => {
		it("renders one radio input per option, each carrying its own value", () => {
			const html = markup(<AppRadioGroup items={ROLES} label="Role" onChange={noop} value="" />);

			expect(html.match(/type="radio"/g)).toHaveLength(ROLES.length);
			expect(html).toContain('value="admin"');
			expect(html).toContain('value="editor"');
			expect(html).toContain('value="viewer"');
		});

		it("checks the input whose value is the current one", () => {
			const html = markup(<AppRadioGroup items={ROLES} label="Role" onChange={noop} value="editor" />);

			expect(html).toMatch(/type="radio"[^>]*name="[^"]*"[^>]*checked=""[^>]*value="editor"/);
			expect(html.match(/checked=""/g)).toHaveLength(1);
		});

		it("keeps one tab stop for the whole group", () => {
			const html = markup(<AppRadioGroup items={ROLES} label="Role" onChange={noop} value="viewer" />);

			expect(html.match(/tabindex="0"/g)).toHaveLength(1);
			expect(html.match(/tabindex="-1"/g)).toHaveLength(ROLES.length - 1);
		});
	});

	describe("no control glyph", () => {
		it("renders neither a radio control nor an indicator - the border is the signal", () => {
			const html = markup(<AppRadioGroup items={ROLES} label="Role" onChange={noop} value="admin" />);

			expect(html).not.toContain('data-slot="radio-control"');
			expect(html).not.toContain("radio__control");
			expect(html).not.toContain("radio__indicator");
		});

		it("marks the selected tile with data-selected so the accent border can key off it", () => {
			const html = markup(<AppRadioGroup items={ROLES} label="Role" onChange={noop} value="admin" />);

			expect(html).toMatch(/data-slot="radio"[^>]*data-selected="true"/);
			expect(html).toContain("data-selected:border-accent");
		});
	});

	describe("icon and description are per item", () => {
		it("renders a decorative icon before the label when the item has one", () => {
			const html = markup(<AppRadioGroup items={ROLES} label="Role" onChange={noop} value="" />);

			expect(html).toMatch(/<svg[^>]*lucide-house[^>]*aria-hidden="true"/);
			expect(html).toContain("group-data-selected:text-accent");
		});

		it("renders a description line only for the item that has one", () => {
			const html = markup(<AppRadioGroup items={ROLES} label="Role" onChange={noop} value="" />);

			expect(html).toMatch(/data-slot="description"[^>]*>All access\./);
			expect(html.match(/data-slot="description"/g)).toHaveLength(1);
		});
	});

	describe("orientation picks the grid columns", () => {
		it("auto (the default): one column plus a sm: auto-fit track", () => {
			const html = markup(<AppRadioGroup items={ROLES} label="Role" onChange={noop} value="" />);

			expect(html).toContain("grid-cols-1");
			expect(html).toContain("sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]");
		});

		it("horizontal: the auto-fit track at every width, never a single column", () => {
			const html = markup(
				<AppRadioGroup items={ROLES} label="Role" onChange={noop} orientation="horizontal" value="" />,
			);

			expect(html).toContain("grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]");
			expect(html).not.toContain("sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]");
			expect(html).not.toMatch(/<div class="grid[^"]*\bgrid-cols-1\b/);
		});

		it("vertical: one column, and no auto-fit track", () => {
			const html = markup(
				<AppRadioGroup items={ROLES} label="Role" onChange={noop} orientation="vertical" value="" />,
			);

			expect(html).toMatch(/<div class="grid[^"]*\bgrid-cols-1\b/);
			expect(html).not.toContain("auto-fit");
		});
	});

	describe("group class contract", () => {
		it("cancels HeroUI's inter-item margin and spaces the label from the grid", () => {
			const html = markup(<AppRadioGroup items={ROLES} label="Role" onChange={noop} value="" />);

			expect(html).toMatch(/data-slot="radio-group"[^>]*class="[^"]*\*\*:data-\[slot=radio\]:mt-0/);
			expect(html).toMatch(/data-slot="radio-group"[^>]*class="[^"]*\bgap-2\b/);
		});
	});

	describe("state, from a standalone errorMessage", () => {
		it("goes invalid and renders the message in the field error", () => {
			const html = markup(
				<AppRadioGroup data-cy="role" errorMessage="Pick a role" isRequired items={ROLES} label="Role" onChange={noop} value="" />,
			);

			expect(html).toMatch(/data-slot="radio-group"[^>]*data-invalid="true"/);
			expect(html).toContain('aria-invalid="true"');
			expect(html).toContain('aria-required="true"');
			expect(html).toMatch(/data-slot="field-error"[^>]*>Pick a role/);
		});

		it("stays valid with no errorMessage", () => {
			const html = markup(<AppRadioGroup items={ROLES} label="Role" onChange={noop} value="" />);

			expect(html).not.toContain('data-invalid="true"');
		});

		it("disables every option when the group is disabled", () => {
			const html = markup(
				<AppRadioGroup isDisabled items={ROLES} label="Role" onChange={noop} value="" />,
			);

			expect(html).toMatch(/data-slot="radio-group"[^>]*data-disabled="true"/);
			const disabledRadios = (html.match(/<input[^>]*>/g) ?? []).filter(
				(tag) => tag.includes('type="radio"') && tag.includes("disabled="),
			);
			expect(disabledRadios).toHaveLength(ROLES.length);
		});
	});
});
