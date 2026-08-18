import { AppHeader, AppLayout, AppMobileDrawer, AppSidebar } from "@bernardsapida/web-ui";
import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { getNavigation, getRoleLabel, getSecondaryNavigation, isNavItemActive } from "@/config/navigation.config";
import { assertAuthenticatedFn } from "@/features/auth/functions/auth.functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authClient } from "@/features/auth/utils/auth-client";
import { useRouteBreadcrumbs, useRouteMainWidth } from "@/hooks/useRouteBreadcrumbs";
import { useUIStore } from "@/store/ui.store";
import type { User } from "@/types/auth.types";
import { USER_ROLES } from "@/utils/config";

export const Route = createFileRoute("/_authenticated")({
	/**
	 * Signed in, and finished signing up.
	 *
	 * The second half is the profile gate: a user whose `profileComplete` is
	 * false has no signature on file, and a signature is stamped onto the printed
	 * request form and onto every approval — so there is nothing they can usefully
	 * do until it exists. Sending them to /profile is the whole of it.
	 *
	 * **The exemption is load-bearing.** Without the `/profile` test the redirect
	 * fires on the page it redirects TO, and the user loops forever with no way to
	 * fix the thing the loop is about.
	 *
	 * It lives here rather than in each page for the usual reason: a gate written
	 * per route is a gate missing from the next route somebody adds.
	 */
	beforeLoad: async ({ location }) => {
		const session = await assertAuthenticatedFn();
		const user = session.user as unknown as User;

		if (!user.profileComplete && !location.pathname.startsWith("/profile")) {
			throw redirect({ to: "/profile" });
		}

		return { session };
	},
	component: SignedInLayout,
});

/**
 * The signed-in app frame.
 *
 * It is WIRING, not a component. `AppLayout` is the frame and comes from
 * `@bernardsapida/web-ui`; this reads the session, the role and
 * `navigation.config`, then fills the frame's slots with them. That split is why
 * the frame can be published and this file cannot: this one renders an
 * `<Outlet />` and mounts the application nav.
 *
 * It replaced a hand-rolled layout - a flex row, a sticky `Surface` bar and a
 * `lg:pl-72` guess - which meant this project maintained its own answer to
 * questions the frame already answers: where the skip link goes, that there is
 * exactly one `<main>`, and that only one `<nav>` is ever in the tree.
 *
 * Two widths, one destination list:
 *
 * - **Tablet and up**: the sidebar stands, with labels or as the icon rail.
 * - **Phone**: the same column arrives as a drawer, from the trigger in the
 *   header. `AppLayout` renders exactly one of the two.
 *
 * The collapse is the USER's choice and outlives the session, so it is seeded
 * from `ui.store` and written back through `onPreferenceChange`.
 */
function SignedInLayout() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { isSidebarCollapsed, setSidebarCollapsed } = useUIStore();
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const breadcrumbs = useRouteBreadcrumbs();
	const mainWidth = useRouteMainWidth();

	const currentUser = user || { name: "User", email: "", role: USER_ROLES.USER };
	const navigation = getNavigation(currentUser.role);
	const secondaryNavigation = getSecondaryNavigation(currentUser.role);
	const roleLabel = getRoleLabel(currentUser.role);

	const onLogout = async () => {
		await authClient.signOut();
		navigate({ to: "/" });
	};

	// The SECTION the user is in, not the exact URL: switching destinations
	// cross-fades, moving around inside one does not.
	const activeSection = navigation.find((item) => isNavItemActive(item, pathname))?.href ?? pathname;

	/** Everything both navs need. One object so the two cannot drift apart. */
	const navProps = {
		activeHref: pathname,
		navigation,
		onLogout,
		roleLabel,
		secondaryNavigation,
		user: currentUser,
	};

	return (
		<AppLayout
			data-cy="app-frame"
			defaultSidebarOpen={!isSidebarCollapsed}
			// The measure belongs to the PAGE, not the frame: a dashboard of tiles and
			// a request detail want different answers on the same screen. The route
			// declares it in `staticData.mainWidth`, the same way it declares its
			// breadcrumb, so no page has to wrap itself in a container to get one.
			mainWidth={mainWidth}
			// No logo here: the column beside this bar already carries the brand, and
			// two marks on one screen is the failure that prop exists to prevent.
			navbar={
				<AppHeader
					breadcrumbs={breadcrumbs}
					data-cy="app-header"
					hasLogo={false}
					variant="flush"
				/>
			}
			onPreferenceChange={({ isSidebarOpen }) => setSidebarCollapsed(!isSidebarOpen)}
			sidebar={
				<AppSidebar
					{...navProps}
					// dvh rather than vh: on mobile browsers the collapsing URL bar makes
					// 100vh overshoot the visible area, pushing the user card below the
					// fold.
					className="sticky top-0 h-dvh shrink-0"
					data-cy="app-sidebar"
					variant="flush"
				/>
			}
			// No `isOpen`: the trigger lives in the header, a different slot, so both
			// sides find each other through the frame's context.
			sidebarDrawer={
				<AppMobileDrawer
					{...navProps}
					data-cy="app-mobile-drawer"
				/>
			}
		>
			<div
				className="nav-fade"
				key={activeSection}
			>
				<Outlet />
			</div>
		</AppLayout>
	);
}
