import { LayoutDashboard, Settings, ShoppingCart } from "lucide-react";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { NavItem } from "../../lib/nav";
import { AppSidebar } from "./AppSidebar";

/*
 * `AppLogo` and `AppNavList` render TanStack `Link`s, and `AppSidebarUserCard`
 * calls `useNavigate` - all of which read router context and throw without a
 * `RouterProvider`, which this package's `node` test env cannot mount. They are
 * stubbed to a plain anchor and a no-op. Every rule pinned below is about which
 * skin, width and landmark the column renders, not about routing.
 */
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...rest }: { children?: unknown; to?: string } & Record<string, unknown>) => (
		// biome-ignore lint/a11y/useAnchorContent: children are always passed by the callers
		<a href={typeof to === "string" ? to : ""} {...(rest as Record<string, unknown>)}>
			{children as never}
		</a>
	),
	useNavigate: () => () => undefined,
}));

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. So the
 * behaviours that need a viewport are exercised in the lab and not here: the `/`
 * shortcut and its stand-down inside a field, the rail's tooltips, searching the
 * destinations while the account row holds still, the width transition.
 *
 * What IS pinned is every decision the column makes before anything is on
 * screen, each invisible in a screenshot:
 *
 * - Two SKINS on `data-variant`: `floating` is a glass island, `flush` is an
 *   opaque `bg-card` column with a hairline on its right edge only. Nothing
 *   inside the column changes between them.
 * - Two WIDTHS on `data-collapsed`, and the section grouping survives the rail
 *   even though the words drop.
 * - One `<nav>` landmark, named `Main` in the app; the lab overrides the name
 *   because it puts more than one specimen on a page.
 * - `hasSearch={false}` removes the field entirely - furniture on a menu short
 *   enough to read in a glance.
 * - The column draws no trigger of its own here: there is no frame above it and
 *   no `onToggleCollapsed`, so the one control lives elsewhere.
 */

function nav(href: string, title: string, icon: NavItem["icon"]): NavItem {
	return { description: `${title} area`, href, icon, roles: ["admin"], title };
}

const BASE: ComponentProps<typeof AppSidebar> = {
	activeHref: "/dashboard",
	navigation: [nav("/dashboard", "Dashboard", LayoutDashboard), nav("/orders", "Orders", ShoppingCart)],
	onLogout: () => undefined,
	roleLabel: "Admin",
	secondaryNavigation: [nav("/settings", "Settings", Settings)],
	user: { email: "maria@example.com", name: "Maria" },
};

describe("AppSidebar markup", () => {
	it("renders the destinations inside one named nav landmark", () => {
		const html = renderToStaticMarkup(<AppSidebar {...BASE} />);

		expect(html).toContain("Dashboard");
		expect(html).toContain("Orders");
		expect(html.match(/<nav/g)).toHaveLength(1);
		expect(html).toContain('aria-label="Main"');
	});

	it("takes a navLabel override for a page that shows more than one", () => {
		const html = renderToStaticMarkup(<AppSidebar {...BASE} navLabel="Sidebar specimen" />);

		expect(html).toContain('aria-label="Sidebar specimen"');
		expect(html).not.toContain('aria-label="Main"');
	});

	describe("skin", () => {
		it("is a floating glass island by default", () => {
			const html = renderToStaticMarkup(<AppSidebar {...BASE} />);

			expect(html).toContain('data-variant="floating"');
			expect(html).toContain("glass-strong");
			expect(html).toContain("rounded-3xl");
		});

		it("is an opaque, right-hairlined column when flush", () => {
			const html = renderToStaticMarkup(<AppSidebar {...BASE} variant="flush" />);

			expect(html).toContain('data-variant="flush"');
			expect(html).toContain("border-r");
			expect(html).toContain("bg-card");
			expect(html).not.toContain("glass-strong");
		});
	});

	describe("width", () => {
		it("is expanded by default", () => {
			const html = renderToStaticMarkup(<AppSidebar {...BASE} />);

			expect(html).toContain('data-collapsed="false"');
			expect(html).toContain("w-65");
		});

		it("is a rail when collapsed", () => {
			const html = renderToStaticMarkup(<AppSidebar {...BASE} isCollapsed />);

			expect(html).toContain('data-collapsed="true"');
			expect(html).toContain("w-18");
		});
	});

	it("drops the search field entirely when hasSearch is off", () => {
		const withSearch = renderToStaticMarkup(<AppSidebar {...BASE} data-cy="sb" />);
		expect(withSearch).toContain('data-cy="sb-search"');

		const withoutSearch = renderToStaticMarkup(<AppSidebar {...BASE} data-cy="sb" hasSearch={false} />);
		expect(withoutSearch).not.toContain('data-cy="sb-search"');
	});

	it("draws no collapse trigger of its own with no frame and no handler", () => {
		const html = renderToStaticMarkup(<AppSidebar {...BASE} data-cy="sb" />);

		expect(html).not.toContain('data-cy="sb-toggle"');
	});

	it("derives every inner test hook from the group hook", () => {
		const html = renderToStaticMarkup(<AppSidebar {...BASE} data-cy="sb" />);

		expect(html).toContain('data-cy="sb"');
		expect(html).toContain('data-cy="sb-logo"');
		expect(html).toContain('data-cy="sb-nav"');
		expect(html).toContain('data-cy="sb-user"');
	});
});
