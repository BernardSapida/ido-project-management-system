import { createFileRoute, redirect } from "@tanstack/react-router";
import { getDefaultRoute } from "@/config/navigation.config";
import { assertAuthenticatedFn } from "@/features/auth/functions/auth.functions";
import type { User } from "@/types/auth.types";

/**
 * `/dashboard` is a SIGNPOST, not a page. It renders nothing.
 *
 * Sign-in, the verify-email callback and `redirectAuthenticatedUserFn` all send
 * people here, and each of the six roles has a different first screen -
 * requestors want their own list, the four staff desks want the queue, an
 * administrator wants accounts. Rather than teaching each of those three call
 * sites to read a role, they all arrive at one URL and this bounces them off
 * `getDefaultRoute`, which is the single place that mapping lives.
 *
 * It used to render placeholder text, which is how every staff member signing in
 * landed on "Hello" and had to find their own queue in the sidebar.
 *
 * The redirect is in `beforeLoad` rather than in a component effect so it
 * happens before anything paints - a flash of an empty dashboard on the way to
 * the real one is the exact thing a signpost should not do.
 */
export const Route = createFileRoute("/_authenticated/dashboard")({
	beforeLoad: async () => {
		const session = await assertAuthenticatedFn();
		const user = session.user as unknown as User;

		throw redirect({ to: getDefaultRoute(user.role) });
	},
});
