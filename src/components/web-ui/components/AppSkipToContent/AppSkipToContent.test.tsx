import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppSkipToContent, MAIN_CONTENT_ID } from "./AppSkipToContent";

/**
 * The link nobody looks at, which is exactly why it needs a test.
 *
 * It is invisible until focused, so every failure here is silent to everyone
 * who does not navigate by keyboard: the target id drifts, the link keeps
 * rendering, and the only symptom is that pressing it does nothing. A
 * screenshot cannot catch that and neither can a manual pass unless the person
 * doing it happens to be tabbing.
 */
describe("AppSkipToContent", () => {
	it("points at the id it exports for the shell to use", () => {
		/*
		 * The load-bearing assertion. The component and `<main>` agree only
		 * because both read `MAIN_CONTENT_ID`; hard-coding the href here instead
		 * would pass while the two drifted apart, which is the exact bug.
		 */
		const html = renderToStaticMarkup(<AppSkipToContent />);
		expect(html).toContain(`href="#${MAIN_CONTENT_ID}"`);
	});

	it("is hidden until it takes focus, and visible once it has", () => {
		const html = renderToStaticMarkup(<AppSkipToContent />);
		// Present in the accessibility tree and the tab order, absent from the page.
		expect(html).toContain("sr-only");
		// And it must come BACK on focus, or it is a tab stop with nothing to see.
		expect(html).toContain("focus:not-sr-only");
	});

	it("is a real anchor, so Enter activates it with no script", () => {
		expect(renderToStaticMarkup(<AppSkipToContent />)).toContain("<a ");
	});

	it("passes a test hook through when given one", () => {
		expect(renderToStaticMarkup(<AppSkipToContent data-cy="skip" />)).toContain('data-cy="skip"');
	});
});
