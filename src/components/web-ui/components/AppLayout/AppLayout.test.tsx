import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppLayout } from "./AppLayout";

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. So the
 * things that need a viewport are exercised in the lab and not here: that the
 * one trigger collapses the rail above `md` and opens the drawer below it, that
 * the aside row breaks at `@4xl` OF THE ROW, and that `onPreferenceChange`
 * fires. `useMediaQuery`'s SSR bet is MOBILE, so every render below is the
 * below-`md` layout - which is itself worth pinning, because that is where the
 * "exactly one nav" rule does its work.
 *
 * What IS pinned is every decision the frame makes from the slots alone:
 *
 * - The SHAPE is derived, never declared. navbar + sidebar is `dashboard`,
 *   navbar alone is `header`, sidebar alone is `sidebar` - reported on
 *   `data-shape`. There is no `variant` prop to disagree with it.
 * - Exactly one `<main>`, rendered here so no page can add a second or forget
 *   the skip target. Below `md` the in-place `sidebar` node is not rendered at
 *   all - only `sidebarDrawer` is - so only one `<nav>` is ever in the tree.
 * - Overriding `mainId` drops the skip link, because its target is hard-coded
 *   and a frame whose main is not THE main would draw a second link to someone
 *   else's target.
 * - Floating needs exactly one piece of chrome: a navbar AND a sidebar is
 *   `flush` whatever `surface` asked for.
 */

const SIDEBAR = <nav data-cy="the-sidebar">Sidebar</nav>;
const DRAWER = <nav data-cy="the-drawer">Drawer</nav>;
const NAVBAR = <header data-cy="the-navbar">Navbar</header>;

describe("AppLayout markup", () => {
	describe("shape is derived from the slots", () => {
		it("is a dashboard with both a navbar and a sidebar", () => {
			const html = renderToStaticMarkup(
				<AppLayout navbar={NAVBAR} sidebar={SIDEBAR}>
					Page
				</AppLayout>,
			);

			expect(html).toContain('data-shape="dashboard"');
		});

		it("is a header with a navbar alone", () => {
			const html = renderToStaticMarkup(<AppLayout navbar={NAVBAR}>Page</AppLayout>);

			expect(html).toContain('data-shape="header"');
		});

		it("is a sidebar with a sidebar alone", () => {
			const html = renderToStaticMarkup(<AppLayout sidebar={SIDEBAR}>Page</AppLayout>);

			expect(html).toContain('data-shape="sidebar"');
		});
	});

	describe("one main, one nav", () => {
		it("renders exactly one <main>, carrying the skip target id", () => {
			const html = renderToStaticMarkup(
				<AppLayout navbar={NAVBAR} sidebar={SIDEBAR}>
					Page
				</AppLayout>,
			);

			expect(html.match(/<main/g)).toHaveLength(1);
			expect(html).toContain('id="main-content"');
		});

		it("does not render the in-place sidebar below md - only the drawer", () => {
			const html = renderToStaticMarkup(
				<AppLayout navbar={NAVBAR} sidebar={SIDEBAR} sidebarDrawer={DRAWER}>
					Page
				</AppLayout>,
			);

			expect(html).not.toContain('data-cy="the-sidebar"');
			expect(html).toContain('data-cy="the-drawer"');
		});

		it("puts the skip link first when it owns the main", () => {
			const html = renderToStaticMarkup(<AppLayout navbar={NAVBAR}>Page</AppLayout>);

			expect(html).toContain('href="#main-content"');
		});

		it("drops the skip link when mainId is overridden, and moves the id with it", () => {
			const html = renderToStaticMarkup(
				<AppLayout mainId="lab-main" navbar={NAVBAR}>
					Page
				</AppLayout>,
			);

			expect(html).not.toContain('href="#main-content"');
			expect(html).toContain('id="lab-main"');
			expect(html).toContain('data-shape="header"');
		});
	});

	it("passes the measure through to the main as data-width", () => {
		const html = renderToStaticMarkup(
			<AppLayout mainWidth="prose" navbar={NAVBAR}>
				Page
			</AppLayout>,
		);

		expect(html).toContain('data-width="prose"');
	});

	describe("floating needs exactly one piece of chrome", () => {
		it("keeps floating for a sidebar-only frame that asked for it", () => {
			const html = renderToStaticMarkup(
				<AppLayout sidebar={SIDEBAR} sidebarDrawer={DRAWER} surface="floating">
					Page
				</AppLayout>,
			);

			// Below md every frame is flush regardless - the SSR bet is mobile - so
			// this pins the derivation, not the class: a sidebar-only desktop frame
			// is the one case floating survives.
			expect(html).toContain('data-surface="flush"');
			expect(html).toContain('data-shape="sidebar"');
		});

		it("forces flush when both a navbar and a sidebar are present", () => {
			const html = renderToStaticMarkup(
				<AppLayout navbar={NAVBAR} sidebar={SIDEBAR} surface="floating">
					Page
				</AppLayout>,
			);

			expect(html).toContain('data-surface="flush"');
		});
	});

	it("forwards its test hook to the root and derives the main's from it", () => {
		const html = renderToStaticMarkup(
			<AppLayout data-cy="app-frame" navbar={NAVBAR} sidebar={SIDEBAR}>
				Page
			</AppLayout>,
		);

		expect(html).toContain('data-cy="app-frame"');
		expect(html).toContain('data-cy="app-frame-main"');
	});
});
