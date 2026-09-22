import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppTextArea } from "./AppTextArea";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. So the
 * things that need a real browser are covered by the lab and its Cypress specs,
 * NOT here: that the field actually grows a line at a time and then scrolls at
 * `maxRows`, that a pasted paragraph lands whole rather than truncated, and that
 * the reading updates as the caret moves.
 *
 * What IS pinned is every decision the component makes before anyone types:
 *
 * - The reading is always in the markup. It is not gated on a prop, so a
 *   textarea cannot ship without its `words · count / max chars` line - the
 *   regression that would put the count back to "appears once you are over".
 * - `maxLength` never reaches the DOM. The cap is a soft one: a paste overflows,
 *   the field goes invalid, submit blocks. A hard `maxlength` attribute would
 *   truncate the paste in silence, so its absence is load-bearing.
 * - Over the cap the field is invalid on its own (`aria-invalid`) and the error
 *   counts the overage, singular and plural. This stacks on the binding's error.
 * - `resize-none`: there is no drag handle, because the field sizes itself.
 * - `data-cy` reaches the root, and `${dataCy}-count` reaches the reading, so a
 *   spec can read the running count without a brittle text match.
 */

const base = {
	label: "Bio",
	maxLength: 160,
	onChange: () => undefined,
} as const;

describe("AppTextArea markup", () => {
	it("renders the label and the word + character reading from the first render", () => {
		const html = renderToStaticMarkup(<AppTextArea {...base} value="hello world" />);

		expect(html).toContain("Bio");
		expect(html).toContain("2 words · 11 / 160 chars");
	});

	it("says '1 word' and '0 words', not '1 words' / '0 word'", () => {
		expect(renderToStaticMarkup(<AppTextArea {...base} value="hi" />)).toContain(
			"1 word · 2 / 160 chars",
		);
		expect(renderToStaticMarkup(<AppTextArea {...base} value="" />)).toContain(
			"0 words · 0 / 160 chars",
		);
	});

	it("never puts a maxlength attribute on the textarea - the cap is soft", () => {
		const html = renderToStaticMarkup(<AppTextArea {...base} value="well under the cap" />);

		expect(html.toLowerCase()).not.toContain("maxlength");
	});

	it("has no resize handle", () => {
		const html = renderToStaticMarkup(<AppTextArea {...base} value="x" />);

		expect(html).toContain("resize-none");
	});

	describe("over the cap", () => {
		const maxLength = 10;

		it("counts the overage, and does so in the singular at exactly one over", () => {
			const oneOver = renderToStaticMarkup(
				<AppTextArea {...base} maxLength={maxLength} value="abcdefghijk" />,
			);
			expect(oneOver).toContain("1 character over the limit");

			const manyOver = renderToStaticMarkup(
				<AppTextArea {...base} maxLength={maxLength} value="abcdefghijklmno" />,
			);
			expect(manyOver).toContain("5 characters over the limit");
		});

		it("marks the field invalid on its own", () => {
			const over = renderToStaticMarkup(
				<AppTextArea {...base} maxLength={maxLength} value="abcdefghijklmno" />,
			);
			expect(over).toContain('aria-invalid="true"');

			const under = renderToStaticMarkup(
				<AppTextArea {...base} maxLength={maxLength} value="abc" />,
			);
			expect(under).not.toContain('aria-invalid="true"');
		});

		it("announces the crossing once, and stays quiet under the cap", () => {
			const over = renderToStaticMarkup(
				<AppTextArea {...base} maxLength={maxLength} value="abcdefghijklmno" />,
			);
			expect(over).toContain("Over the character limit");

			const under = renderToStaticMarkup(
				<AppTextArea {...base} maxLength={maxLength} value="abc" />,
			);
			expect(under).not.toContain("Over the character limit");
		});

		it("turns the reading danger from the moment the count reaches the cap", () => {
			const atLimit = renderToStaticMarkup(
				<AppTextArea {...base} maxLength={3} value="abc" />,
			);
			expect(atLimit).toContain("text-danger");
		});
	});

	it("shows a description when given one", () => {
		const html = renderToStaticMarkup(
			<AppTextArea {...base} description="Keep it to a sentence." value="x" />,
		);

		expect(html).toContain("Keep it to a sentence.");
	});

	it("defaults to six rows and takes an explicit count", () => {
		expect(renderToStaticMarkup(<AppTextArea {...base} value="x" />)).toContain('rows="6"');
		expect(renderToStaticMarkup(<AppTextArea {...base} rows={2} value="x" />)).toContain(
			'rows="2"',
		);
	});

	it("forwards its test hook to the root and to the reading", () => {
		const html = renderToStaticMarkup(<AppTextArea {...base} data-cy="bio" value="x" />);

		expect(html).toContain('data-cy="bio"');
		expect(html).toContain('data-cy="bio-count"');
	});
});
