import { createFileRoute, Outlet } from "@tanstack/react-router";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { USER_ROLES } from "@/utils/config";

/**
 * The /admin layout: a role gate and an `<Outlet />`, and nothing else.
 *
 * The gate is HERE rather than on the page for the usual reason - a gate written
 * per route is the gate missing from the next route somebody adds under this
 * folder. It also only ORGANISES: every procedure the page calls is an
 * `adminProcedure`, so a DIRECTOR who reaches these screens by any other means
 * gets FORBIDDEN from the server rather than a working account manager.
 *
 * The frame itself - sidebar, header, breadcrumbs, `<main>` - belongs to
 * `_authenticated.tsx` and is not rebuilt here.
 */
export const Route = createFileRoute("/_authenticated/admin")({
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({
			data: { allowedRoles: [USER_ROLES.ADMIN] },
		});
	},
	component: AdminLayout,
});

function AdminLayout() {
	return <Outlet />;
}
