import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppProfileBanner } from "./AppProfileBanner";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. Pressing
 * the action and watching `onPress` fire is the lab's job; what is pinned here is
 * the structure a caller and a spec depend on and cannot see move.
 *
 * - `data-verified` carries the claim as data. It is otherwise only readable as a
 *   chip's words plus a surface, and a spec asserting on colour is asserting on
 *   styling.
 * - The two states share ONE surface (`border-border bg-surface`). The amber wash
 *   the unverified state used to carry is gone - it read as an error the reader
 *   had caused - so a class test is what stops it coming back.
 * - The verified tick is a chip, never the bare absence of one: a missing badge
 *   reads as a badge that failed to load.
 * - The clear-it action renders only when unverified AND an `action` was passed,
 *   and it is `ms-auto` so a wrapped row drops it to the right, not under the
 *   avatar.
 */

const markup = (node: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(node);

describe("AppProfileBanner", () => {
	describe("the claim as data", () => {
		it("sets data-verified=true and shows the Verified chip when verified", () => {
			const html = markup(
				<AppProfileBanner
					isVerified
					name="Dr. Maya Chen"
					subtitle="Logistics Coordinator · Northwind Freight"
				/>,
			);
			expect(html).toContain('data-verified="true"');
			expect(html).toContain("Verified");
			expect(html).not.toContain("Not verified");
		});

		it("sets data-verified=false and shows the Not verified chip when not", () => {
			const html = markup(
				<AppProfileBanner
					isVerified={false}
					name="Dr. Alex Rivera"
					subtitle="Dispatch Lead · Northside Depot"
				/>,
			);
			expect(html).toContain('data-verified="false"');
			expect(html).toContain("Not verified");
		});
	});

	describe("one surface for both states", () => {
		it("uses border-border bg-surface when verified", () => {
			const html = markup(<AppProfileBanner isVerified name="A" subtitle="b" />);
			expect(html).toContain("border-border");
			expect(html).toContain("bg-surface");
		});

		it("uses the SAME surface when not verified - no amber wash", () => {
			const html = markup(<AppProfileBanner isVerified={false} name="A" subtitle="b" />);
			expect(html).toContain("border-border");
			expect(html).toContain("bg-surface");
			expect(html).not.toContain("bg-warning/5");
			expect(html).not.toContain("border-warning");
		});

		it("pads the strip at 16px on every side", () => {
			const html = markup(<AppProfileBanner isVerified name="A" subtitle="b" />);
			expect(html).toMatch(/class="[^"]*\bp-4\b/);
		});
	});

	describe("the action", () => {
		const action = { label: "Verify now", onPress: () => undefined };

		it("renders only when unverified, with a derived data-cy and ms-auto", () => {
			const html = markup(
				<AppProfileBanner
					action={action}
					data-cy="banner"
					isVerified={false}
					name="A"
					subtitle="b"
				/>,
			);
			expect(html).toContain("Verify now");
			expect(html).toContain('data-cy="banner-action"');
			expect(html).toMatch(/class="[^"]*\bms-auto\b/);
		});

		it("is dropped once verified, even if an action is passed", () => {
			const html = markup(<AppProfileBanner action={action} isVerified name="A" subtitle="b" />);
			expect(html).not.toContain("Verify now");
		});
	});

	describe("the unverified note", () => {
		it("shows only when unverified and provided", () => {
			expect(
				markup(
					<AppProfileBanner
						isVerified={false}
						name="A"
						subtitle="b"
						unverifiedNote="A permit photo is still outstanding."
					/>,
				),
			).toContain("A permit photo is still outstanding.");

			expect(
				markup(
					<AppProfileBanner isVerified name="A" subtitle="b" unverifiedNote="ignored once verified" />,
				),
			).not.toContain("ignored once verified");
		});
	});

	describe("the avatar hook", () => {
		it("keeps data-profile-avatar for the spec that addresses the avatar", () => {
			const html = markup(<AppProfileBanner isVerified name="Maya Chen" subtitle="b" />);
			expect(html).toContain("data-profile-avatar");
		});
	});
});
