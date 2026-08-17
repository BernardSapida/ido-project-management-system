// Deep imports, not `@/components/custom`. Vite does not tree-shake in dev, so
// touching that 62-export barrel makes the browser fetch all 130 files behind it
// - and this is the layout for every /components/* page, so it did that on all
// of them.
import { AppBackdrop, AppHeader, AppLayout } from "@bernardsapida/web-ui";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LabNavDrawer } from "@/features/labs/components/LabNavDrawer";
import { LabSidebar } from "@/features/labs/components/LabSidebar";
import { useRouteBreadcrumbs } from "@/hooks/useRouteBreadcrumbs";

/**
 * Shell for /components/*.
 *
 * `AppLayout` in its SIDEBAR shape - a standing column, no bar above it - with
 * the labs' own nav in the slot. The frame is the same one the signed-in app
 * uses; the NAV deliberately is not. These pages are developer references with
 * no session, and hanging them off the real app's destinations would put them
 * one misclick from a signed-in user. Same reason every child is noindex.
 *
 * ## Why a column and not the drawer this used to be
 *
 * The nav was behind a button at every width, on the reasoning that a nav used
 * once per visit survives being hidden. That was the wrong model of the visit.
 * Nobody comes here for one lab: they come to compare, and every hop cost a
 * press to re-open a list they had just been reading - two clicks per lab,
 * forever, on the one surface in the app whose entire job is browsing. Hidden
 * navigation is the more expensive default anyway; this is not the place to pay
 * for it.
 *
 * The width the drawer was protecting is now the collapse toggle's job, and the
 * labs never needed it as badly as the old note claimed: every lab page caps its
 * own content at `max-w-5xl` or narrower, which is well inside what a 16rem
 * column leaves on any screen that gets one. Below `md` there is no column at
 * all - `AppLayout` swaps in `LabNavDrawer`, and `compactNavbar` is what carries
 * its trigger, because that shape has no bar of its own.
 *
 * The list itself lives in `features/labs/labs.registry.ts`, grouped the way the
 * component checklist groups it, and `LabNavPanel` renders it for both the
 * column and the drawer.
 */
export const Route = createFileRoute("/(references)/components")({
	head: () => ({
		meta: [{ content: "noindex", name: "robots" }],
	}),
	// The first crumb on the compact bar, and the reason the labs' own crumbs
	// read as a trail rather than as one orphaned page name.
	staticData: { breadcrumb: "All labs" },
	component: ComponentsLayout,
});

function ComponentsLayout() {
	const breadcrumbs = useRouteBreadcrumbs();

	/*
	 * The backdrop is a SIBLING of the frame rather than something inside it, and
	 * the frame is raised over it. No `overflow-hidden` on this box: any overflow
	 * other than `visible` on an ancestor makes THAT box the scrollport the sticky
	 * column sticks to, which reads as "sticky is broken". AppBackdrop clips its
	 * own blobs.
	 */
	return (
		<div className="relative min-h-screen">
			<AppBackdrop variant="app" />
			<AppLayout
				className="relative z-10"
				/*
				 * Below `md` only, and the reason the shape needs one: the column is off
				 * screen there, so without a bar the labs would be unreachable from a
				 * lab. The trail, not just the hamburger - a bar holding one button says
				 * where you are NOT. No logo: this is not the app, and its mark links
				 * into a signed-in surface these pages deliberately sit outside of.
				 */
				compactNavbar={
					<AppHeader
						breadcrumbs={breadcrumbs}
						data-cy="lab-compact-navbar"
						hasLogo={false}
						variant="flush"
					/>
				}
				data-cy="lab-shell"
				/*
				 * No cap here. Every lab already sets its own measure - almost all of
				 * them `max-w-5xl` - and a second cap on top would silently narrow the
				 * few that deliberately go wide.
				 */
				mainWidth="full"
				/*
				 * The column stops ABOVE the theme bar, not under it.
				 *
				 * `--theme-bar-height` is published on the document root by
				 * ThemeControlBar, which is fixed to the bottom of the viewport - so a
				 * full-height sticky column runs its last few rows underneath it. The
				 * nav scrolls inside this box, which is what made it a real bug rather
				 * than a cosmetic one: the rows at the end of the list could be scrolled
				 * to and still not be readable or clickable.
				 *
				 * The fallback is what keeps this a one-line change instead of a prop
				 * threaded through the layout. Only the theme customizer sets the
				 * property and it removes it on unmount, so every other lab subtracts
				 * 0px and the column is exactly what it was.
				 */
				sidebar={<LabSidebar className="sticky top-6 h-[calc(100dvh-3rem-var(--theme-bar-height,0px))] shrink-0" />}
				sidebarDrawer={<LabNavDrawer />}
				surface="floating"
			>
				<Outlet />
			</AppLayout>
		</div>
	);
}
