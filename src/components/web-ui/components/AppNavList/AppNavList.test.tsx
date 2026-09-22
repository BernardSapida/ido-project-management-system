import { LayoutDashboard, ShoppingCart } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { NavItem } from "../../lib/nav";
import { AppNavList } from "./AppNavList";

/*
 * `AppNavList` renders TanStack `Link`s, which read router context and throw
 * without a `RouterProvider` this package's `node` test env cannot mount. Stubbed
 * to a plain anchor - every rule below is about the label markup, not routing.
 */
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...rest }: { children?: unknown; to?: string } & Record<string, unknown>) => (
		// biome-ignore lint/a11y/useAnchorContent: children are always passed by the callers
		<a href={typeof to === "string" ? to : ""} {...(rest as Record<string, unknown>)}>
			{children as never}
		</a>
	),
}));

function nav(href: string, title: string, icon: NavItem["icon"], children?: NavItem[]): NavItem {
	return { children, description: `${title} area`, href, icon, roles: ["admin"], title };
}

const ITEMS: NavItem[] = [
	nav("/dashboard", "Dashboard", LayoutDashboard),
	nav("/records", "Records", ShoppingCart, [nav("/records/table", "Table", ShoppingCart)]),
];

describe("AppNavList search highlighting", () => {
	it("wraps the matched run of a label in a <mark> when searchQuery is set", () => {
		const html = renderToStaticMarkup(
			<AppNavList activeHref="/dashboard" items={[ITEMS[1], ...ITEMS[1].children!]} searchQuery="tab" />,
		);

		// The parent that only survived on a child match keeps a plain label...
		expect(html).toContain("<span class=\"truncate\">Records</span>");
		// ...while the run that actually matched is marked, keeping its own casing.
		expect(html).toContain("<mark");
		expect(html).toContain('class="bg-transparent font-semibold text-accent">Tab</mark>');
	});

	it("leaves every label as plain text when searchQuery is unset", () => {
		const html = renderToStaticMarkup(<AppNavList activeHref="/dashboard" items={ITEMS} />);

		expect(html).not.toContain("<mark");
		expect(html).toContain("Dashboard");
	});

	it("does not mark the rail's sr-only labels", () => {
		const html = renderToStaticMarkup(
			<AppNavList activeHref="/dashboard" isCollapsed items={ITEMS} searchQuery="dash" />,
		);

		expect(html).not.toContain("<mark");
	});
});
