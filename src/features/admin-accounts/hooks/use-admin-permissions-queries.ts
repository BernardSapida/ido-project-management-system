import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * What one person currently holds.
 *
 * `enabled` rather than a conditional hook: the modal is mounted per row and the
 * query must not fire until there is a person to ask about. It also means closing
 * and re-opening the modal on the same row is answered from cache while the
 * refetch runs, so the seven switches are never blank for a beat.
 */
export function useAdminPermissionsQueries(userId: string | null) {
	const trpc = useTRPC();

	const permissions = useQuery({
		...trpc.adminPermissions.getUserPermissions.queryOptions({ userId: userId ?? "" }),
		enabled: Boolean(userId),
		// The grants may have been reset by a role change in another tab, and this
		// dialog is where somebody decides whether to revoke something.
		refetchOnMount: "always",
	});

	return { permissions };
}
