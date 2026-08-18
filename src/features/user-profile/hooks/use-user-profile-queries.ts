import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * The profile row, read fresh rather than off the session.
 *
 * The session carries the same fields, but it is a cookie: it is as old as the
 * last sign-in or refresh, and this page is the one place where a value the user
 * changed a second ago has to be what they see. The session still drives the
 * ROUTE gate — that one has to work before any query has resolved.
 */
export function useUserProfileQueries() {
	const trpc = useTRPC();

	const profile = useQuery(trpc.profile.getMyProfile.queryOptions());

	return { profile };
}
