import { Trash2 } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppButton } from "./AppButton";

/**
 * What this file can and cannot check.
 *
 * There is no DOM here - see `vitest.config.ts` for why one cannot currently be
 * installed - so these are assertions about the MARKUP the component produces,
 * not about what it does when pressed. That covers the decisions that are
 * structural: which element it renders, what a screen reader is handed, and
 * which of them survive a caller trying to override them.
 *
 * The BEHAVIOUR of `hold` is covered separately, in
 * `apps/web/src/components/hold-to-confirm.test.tsx`, which has jsdom. That is
 * the only place a press can actually be driven, and holding is the one feature
 * here whose markup says almost nothing about whether it works.
 *
 * NOT covered anywhere, and worth writing the moment a DOM lands in this
 * package:
 *
 * - The async `onPress` guard: a second press during the promise must not run
 *   the handler twice, and the pending flag must clear on rejection.
 * - The `to` branch, which needs a RouterProvider to render at all.
 */
describe("AppButton markup", () => {
	it("renders a real button by default", () => {
		const html = renderToStaticMarkup(<AppButton>Send</AppButton>);
		expect(html).toContain("<button");
		expect(html).toContain("Send");
	});

	it("names an icon-only button, and hides the glyph from the reader", () => {
		/*
		 * The pair is the point. Without the label the control reaches a screen
		 * reader unnamed; without the aria-hidden a labelled one is announced
		 * twice, once for the name and once for the decorative glyph beside it.
		 */
		const html = renderToStaticMarkup(
			<AppButton
				aria-label="Delete this request"
				icon={Trash2}
				isIconOnly
			/>,
		);
		expect(html).toContain('aria-label="Delete this request"');
		expect(html).toContain('aria-hidden="true"');
	});

	it("publishes the pending flag as a boolean, not as a vanishing attribute", () => {
		/*
		 * HeroUI's own `data-pending` is PRESENT while pending and REMOVED
		 * otherwise, and an attribute that disappears rather than turning false is
		 * one a spec cannot wait on. `data-async-pending` is always there.
		 */
		expect(renderToStaticMarkup(<AppButton isPending>Send</AppButton>)).toContain('data-async-pending="true"');
		expect(renderToStaticMarkup(<AppButton>Send</AppButton>)).toContain('data-async-pending="false"');
	});

	it("disables itself while pending, so a slow request cannot be fired twice", () => {
		expect(renderToStaticMarkup(<AppButton isPending>Send</AppButton>)).toContain("disabled");
	});

	describe("hold to confirm", () => {
		it("carries the fill layer and starts idle", () => {
			const html = renderToStaticMarkup(
				<AppButton hold={{ action: "delete" }}>Delete</AppButton>,
			);
			expect(html).toContain("button--hold");
			expect(html).toContain('data-hold-phase="idle"');
		});

		it("adds neither when there is no hold", () => {
			/*
			 * The class is not free - it opens a stacking context and a paint
			 * boundary, and it clips overflow - so every button that did not ask for
			 * a hold must be left alone.
			 */
			const html = renderToStaticMarkup(<AppButton>Delete</AppButton>);
			expect(html).not.toContain("button--hold");
			expect(html).not.toContain("data-hold-phase");
		});

		it("refuses to be a submit button, even when the caller asks for one", () => {
			/*
			 * This is the one override that is not a preference. Suppressing our own
			 * onPress does not suppress the native click react-aria still lets
			 * through, so a hold button typed `submit` would post the form on the
			 * first TAP - the exact press this component exists to refuse to act on.
			 */
			const html = renderToStaticMarkup(
				<AppButton
					hold={{ action: "delete" }}
					type="submit"
				>
					Delete
				</AppButton>,
			);
			expect(html).toContain('type="button"');
			expect(html).not.toContain('type="submit"');
		});

		it("leaves type alone on an ordinary button", () => {
			const html = renderToStaticMarkup(<AppButton type="submit">Save</AppButton>);
			expect(html).toContain('type="submit"');
		});
	});
});
