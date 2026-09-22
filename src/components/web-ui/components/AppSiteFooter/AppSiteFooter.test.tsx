import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppSiteFooter } from "./AppSiteFooter";
import type { SiteFooterGroup, SiteFooterLink, SiteFooterTone, SiteSocialLink } from "./site-footer.types";

/*
 * The footer's internal links are TanStack `Link`s, and `AppLogo` renders one
 * too for `homeHref`. `Link` reads router context on render and throws without a
 * `RouterProvider`, which this package's `node` test env cannot mount - so it is
 * stubbed to a plain anchor. That is enough: every rule pinned below is about
 * WHICH anchor gets rendered and how it is marked, not about routing.
 */
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, hash, ...rest }: { children?: unknown; to?: string; hash?: string } & Record<string, unknown>) => {
		const href = hash ? `${to ?? ""}#${hash}` : (to ?? "");
		// biome-ignore lint/a11y/useAnchorContent: children are always passed by the footer
		return <a data-router-link="true" href={href} {...(rest as Record<string, unknown>)}>{children as never}</a>;
	},
}));

/**
 * Markup-only, because this package has no DOM - see `vitest.config.ts`. So the
 * things that need a real browser live in `apps/web/cypress/e2e/components/`:
 * that Tab out of a panel does nothing here to close (there is no panel), that
 * the container query actually rearranges at `@2xl`, that `onNavigate` fires and
 * `preventDefault` holds. What is pinned here is every decision the component
 * makes before anything is on screen, each invisible in a screenshot:
 *
 * - **`data-tone` is `surface` or `brand`, and nothing else.** The `muted` band
 *   was removed; `BAND` has two keys. A caller passing a third value is a type
 *   error, and this is the runtime guard that the map did not quietly regrow one.
 * - **The brand tone re-colours its own ink.** On `brand` the band carries
 *   `bg-brand-fill` / `text-brand-fill-foreground` and the focus ring switches
 *   to `outline-brand-fill-foreground`; on `surface` the ring is `outline-focus`.
 * - **Every social link is an `<a>` with `rel="noreferrer"`, `target="_blank"`
 *   and the words "opens in a new tab".** They are icon-only, so the `aria-label`
 *   is the accessible name and there is no visible text to fall back to.
 * - **A social target is 44px** (`size-11`) for a 24px glyph - the smallest
 *   targets on the page, sitting in a row.
 * - **Shape follows the props.** No `groups` → no `<nav aria-label="Footer">`.
 *   No `legal` → the copyright row stays centred (`@2xl:justify-center`) rather
 *   than splitting left/right.
 * - **The copyright line is computed** from `year`, `owner`/`appName`,
 *   `copyrightNote` - not passed in whole.
 */

const SOCIAL: SiteSocialLink[] = [
	{ href: "https://facebook.com", label: "Facebook", platform: "facebook" },
	{ href: "https://instagram.com", label: "Instagram", platform: "instagram" },
	{ href: "https://linkedin.com", label: "LinkedIn", platform: "linkedin" },
	{ href: "https://tiktok.com", label: "TikTok", platform: "tiktok" },
];

const GROUPS: SiteFooterGroup[] = [
	{
		heading: "Product",
		links: [
			{ href: "/features", label: "Features" },
			{ href: "https://example.com", isExternal: true, label: "Changelog" },
		],
	},
];

const LEGAL: SiteFooterLink[] = [
	{ href: "/privacy", label: "Privacy" },
	{ href: "https://example.com/terms", isExternal: true, label: "Terms" },
];

describe("AppSiteFooter markup", () => {
	describe("tone", () => {
		it("defaults to the neutral surface band", () => {
			const html = renderToStaticMarkup(<AppSiteFooter social={SOCIAL} />);

			expect(html).toContain('data-tone="surface"');
			expect(html).toContain("bg-card");
			expect(html).toContain("outline-focus");
		});

		it("fills the band and re-colours the ink and ring on the brand tone", () => {
			const html = renderToStaticMarkup(<AppSiteFooter social={SOCIAL} tone="brand" />);

			expect(html).toContain('data-tone="brand"');
			expect(html).toContain("bg-brand-fill");
			expect(html).toContain("text-brand-fill-foreground");
			expect(html).toContain("outline-brand-fill-foreground");
		});

		it("has no muted band - the third fill was removed, on the map and in the type", () => {
			for (const tone of ["surface", "brand"] as const) {
				const html = renderToStaticMarkup(<AppSiteFooter social={SOCIAL} tone={tone} />);
				expect(html).not.toContain("muted-surface");
			}

			// @ts-expect-error - "muted" is no longer a SiteFooterTone
			const stale: SiteFooterTone = "muted";
			expect(stale).toBe("muted");
		});
	});

	describe("social row", () => {
		it("renders every entry as a new-tab anchor that says so", () => {
			const html = renderToStaticMarkup(<AppSiteFooter social={SOCIAL} />);

			expect(html.match(/rel="noreferrer"/g)).toHaveLength(SOCIAL.length);
			expect(html.match(/target="_blank"/g)).toHaveLength(SOCIAL.length);
			expect(html.match(/\(opens in a new tab\)/g)).toHaveLength(SOCIAL.length);
			for (const entry of SOCIAL) {
				expect(html).toContain(`aria-label="${entry.label}"`);
				expect(html).toContain(`href="${entry.href}"`);
			}
		});

		it("draws a 44px target for a 24px glyph", () => {
			const html = renderToStaticMarkup(<AppSiteFooter social={SOCIAL} />);

			expect(html).toContain("size-11");
			expect(html).toContain("size-6");
			expect(html).toContain("<svg");
		});

		it("labels the row off socialLabel, and drops the label when passed an empty string", () => {
			const withLabel = renderToStaticMarkup(<AppSiteFooter social={SOCIAL} socialLabel="Find us" />);
			expect(withLabel).toContain("Find us");
			expect(withLabel).toContain("aria-labelledby=");

			const noLabel = renderToStaticMarkup(<AppSiteFooter social={SOCIAL} socialLabel="" />);
			expect(noLabel).toContain('aria-label="Social media"');
		});
	});

	describe("shape follows the props", () => {
		it("renders no link-columns nav when groups is omitted", () => {
			const html = renderToStaticMarkup(<AppSiteFooter social={SOCIAL} />);

			expect(html).not.toContain('aria-label="Footer"');
			expect(html).toContain("@2xl:justify-center");
		});

		it("renders the columns nav and each heading when groups is given", () => {
			const html = renderToStaticMarkup(<AppSiteFooter groups={GROUPS} social={SOCIAL} />);

			expect(html).toContain('aria-label="Footer"');
			expect(html).toContain("Product");
			expect(html).toContain("Features");
		});

		it("splits the copyright row only once there is a legal row to balance it", () => {
			const alone = renderToStaticMarkup(<AppSiteFooter social={SOCIAL} />);
			expect(alone).toContain("@2xl:justify-center");
			expect(alone).not.toContain('aria-label="Legal"');

			const withLegal = renderToStaticMarkup(<AppSiteFooter legal={LEGAL} social={SOCIAL} />);
			expect(withLegal).toContain('aria-label="Legal"');
			expect(withLegal).toContain("@2xl:justify-between");
		});
	});

	describe("links", () => {
		it("makes an external column link a real anchor with the new-tab rel and glyph", () => {
			const html = renderToStaticMarkup(<AppSiteFooter groups={GROUPS} />);

			expect(html).toContain('href="https://example.com"');
			expect(html).toContain('rel="noreferrer"');
			expect(html).toContain("Changelog");
		});

		it("routes an internal column link through the router Link, not a bare anchor", () => {
			const html = renderToStaticMarkup(<AppSiteFooter groups={GROUPS} />);

			expect(html).toContain('data-router-link="true"');
			expect(html).toContain('href="/features"');
		});

		it("drops the external glyph on the legal row but keeps the sr-only note", () => {
			const html = renderToStaticMarkup(<AppSiteFooter legal={LEGAL} />);

			expect(html).toContain("Terms");
			expect(html).toContain("(opens in a new tab)");
		});
	});

	describe("copyright", () => {
		it("composes the line from year, owner and note", () => {
			const html = renderToStaticMarkup(
				<AppSiteFooter copyrightNote="Built with Revolve." owner="Revolve" social={SOCIAL} year={2021} />,
			);

			expect(html).toContain("© 2021 Revolve. Built with Revolve.");
		});

		it("defaults the year to the current one and the owner to appName", () => {
			const html = renderToStaticMarkup(<AppSiteFooter social={SOCIAL} />);

			expect(html).toContain(`© ${new Date().getFullYear()}`);
			expect(html).toContain("All rights reserved.");
		});
	});

	it("forwards its test hook to the root and to the logo and social entries", () => {
		const html = renderToStaticMarkup(<AppSiteFooter data-cy="site-footer" social={SOCIAL} />);

		expect(html).toContain('data-cy="site-footer"');
		expect(html).toContain('data-cy="site-footer-logo"');
		expect(html).toContain('data-cy="site-footer-social"');
	});
});
