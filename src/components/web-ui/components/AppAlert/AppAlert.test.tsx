import { ShieldAlert, WifiOff } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppAlert } from "./AppAlert";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. So
 * `onClose` actually removing the node is not reachable here; that half lives
 * in `apps/web/cypress/e2e/components/AppBanner.cy.ts`, which drives the lab.
 *
 * What IS pinned is everything a banner decides before anyone touches it, and
 * every one of them is invisible in a screenshot:
 *
 * - The live region. A banner appears after the page has settled, so it has to
 *   announce itself: `alert`/`assertive` for danger, which interrupts, and the
 *   polite `status` for the rest. HeroUI's Alert renders a bare div, so if this
 *   wrapper stops setting the role nothing looks any different and a screen
 *   reader is simply never told.
 * - `data-status`, which is the severity as data rather than as a class. Specs
 *   that assert on `alert--danger` are asserting on styling.
 * - The close button exists only when there is an `onClose`, and carries a name
 *   when it does - an unnamed X is announced as "button".
 * - The `data-cy` derivation. Every selector in the Cypress suite is built from
 *   the parent hook (`-action`, `-secondary`, `-close`), so dropping one turns
 *   that whole file red for a reason that has nothing to do with banners.
 *
 * NOT covered, and first in line when a DOM arrives: that pressing the close
 * button calls `onClose`, and that the two actions wrap rather than squeeze.
 */

const BASE = {
	description: "The warehouse rejected the shipment reference.",
	icon: ShieldAlert,
	title: "Shipment rejected",
} as const;

describe("AppAlert markup", () => {
	it("renders the glyph, the title and the description", () => {
		const html = renderToStaticMarkup(<AppAlert {...BASE} />);

		expect(html).toContain("Shipment rejected");
		expect(html).toContain("The warehouse rejected the shipment reference.");
		expect(html).toContain("<svg");
	});

	describe("announcement", () => {
		it("interrupts for danger", () => {
			const html = renderToStaticMarkup(<AppAlert {...BASE} status="danger" />);

			expect(html).toContain('role="alert"');
			expect(html).toContain('aria-live="assertive"');
		});

		it("waits its turn for every other status", () => {
			for (const status of ["default", "accent", "success", "warning"] as const) {
				const html = renderToStaticMarkup(<AppAlert {...BASE} status={status} />);

				expect(html).toContain('role="status"');
				expect(html).toContain('aria-live="polite"');
			}
		});
	});

	it("carries the severity as data, not only as a wash", () => {
		for (const status of ["default", "accent", "success", "warning", "danger"] as const) {
			const html = renderToStaticMarkup(<AppAlert {...BASE} status={status} />);

			expect(html).toContain(`data-status="${status}"`);
		}
	});

	it("defaults to the plain notice rather than to a severity", () => {
		expect(renderToStaticMarkup(<AppAlert {...BASE} />)).toContain('data-status="default"');
	});

	describe("dismissal", () => {
		it("gives no close button to a banner that was not handed an onClose", () => {
			const html = renderToStaticMarkup(<AppAlert {...BASE} />);

			expect(html).not.toContain("<button");
		});

		it("names the close button, and lets the caller say what it dismisses", () => {
			const html = renderToStaticMarkup(
				<AppAlert
					{...BASE}
					dismissLabel="Dismiss offline notice"
					icon={WifiOff}
					onClose={() => undefined}
					status="warning"
					title="Connection lost"
				/>,
			);

			expect(html).toContain('aria-label="Dismiss offline notice"');
		});

		it("still names it when the caller says nothing", () => {
			const html = renderToStaticMarkup(<AppAlert {...BASE} onClose={() => undefined} />);

			expect(html).toContain('aria-label="Dismiss"');
		});
	});

	describe("actions", () => {
		it("is still a banner with nothing to do about it", () => {
			expect(renderToStaticMarkup(<AppAlert {...BASE} />)).not.toContain("<button");
		});

		it("takes a primary on its own", () => {
			const html = renderToStaticMarkup(
				<AppAlert {...BASE} action={{ label: "Retry", onPress: () => undefined }} />,
			);

			expect(html).toContain("Retry");
			expect(html).toContain("banner-action");
		});

		it("puts the primary before the way out", () => {
			const html = renderToStaticMarkup(
				<AppAlert
					{...BASE}
					action={{ label: "Retry", onPress: () => undefined }}
					secondaryAction={{ label: "View shipment", onPress: () => undefined }}
				/>,
			);

			expect(html.indexOf("Retry")).toBeLessThan(html.indexOf("View shipment"));
		});

		it("keeps the status fill for the primary alone - the way out is a ghost", () => {
			/*
			 * `banner-action` is the class the stylesheet paints the status fill
			 * on. Two of them would put two solid buttons on one banner, which is
			 * the layout that stops saying which one it is asking for.
			 */
			const html = renderToStaticMarkup(
				<AppAlert
					{...BASE}
					action={{ label: "Retry", onPress: () => undefined }}
					secondaryAction={{ label: "View shipment", onPress: () => undefined }}
				/>,
			);

			expect(html.match(/banner-action/g)).toHaveLength(1);
		});
	});

	describe("test hooks", () => {
		it("derives every child hook from the banner's own", () => {
			const html = renderToStaticMarkup(
				<AppAlert
					{...BASE}
					action={{ label: "Retry", onPress: () => undefined }}
					data-cy="actions-danger"
					onClose={() => undefined}
					secondaryAction={{ label: "View shipment", onPress: () => undefined }}
				/>,
			);

			expect(html).toContain('data-cy="actions-danger"');
			expect(html).toContain('data-cy="actions-danger-action"');
			expect(html).toContain('data-cy="actions-danger-secondary"');
			expect(html).toContain('data-cy="actions-danger-close"');
		});

		it("emits no empty hooks when the banner was given none", () => {
			const html = renderToStaticMarkup(
				<AppAlert {...BASE} action={{ label: "Retry", onPress: () => undefined }} onClose={() => undefined} />,
			);

			expect(html).not.toContain("data-cy");
		});
	});
});
