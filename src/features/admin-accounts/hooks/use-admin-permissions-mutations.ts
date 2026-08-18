import { AppToast, reason } from "@bernardsapida/web-ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, RotateCcw } from "lucide-react";
import { useCallback, useState } from "react";
import { useTRPC } from "@/integrations/trpc/react";
import { ACTION_LABELS, type PermissionAction } from "@/lib/permission-actions";

interface PermissionsSnapshot {
	grantedActions: PermissionAction[];
	permissions: { action: PermissionAction; grantedAt: Date; id: string }[];
}

/**
 * The permission switches, and the two rules that make them trustworthy.
 *
 * ## Every toggle saves, and the switch moves before the server answers
 *
 * There is no Save button on this dialog, because a permissions form with
 * unsaved state is how a revocation gets lost - the admin flips a switch, closes
 * the dialog, and the person still holds the capability. So the write goes on the
 * press, and the cache is updated optimistically so the switch moves under the
 * finger rather than a third of a second later.
 *
 * ## And it visibly springs back when the write fails
 *
 * That is the whole reason for the snapshot and the rollback. A switch that
 * silently stays where it was put is the version of this screen where an admin
 * believes they revoked something they did not - which on a permission dialog is
 * the single most expensive lie the UI can tell. The toast names the capability,
 * because by the time it is read the switch has already moved back and there
 * would otherwise be nothing saying which one.
 *
 * `pendingActions` is a SET rather than the mutation's own `isPending`: one
 * `useMutation` tracks only its latest call, and an admin flipping three switches
 * in a row would see the spinner jump to whichever fired last.
 */
export function useAdminPermissionsMutations(userId: string | null) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [pendingActions, setPendingActions] = useState<PermissionAction[]>([]);

	const setMutation = useMutation(trpc.adminPermissions.setPermission.mutationOptions());
	const resetMutation = useMutation(trpc.adminPermissions.resetToRoleDefaults.mutationOptions());

	const permissionsKey = trpc.adminPermissions.getUserPermissions.queryKey({ userId: userId ?? "" });

	const setPermission = useCallback(
		async (action: PermissionAction, granted: boolean) => {
			if (!userId) return;

			// In flight, so nothing else can arrive mid-write and be rolled back to a
			// snapshot that already includes it.
			await queryClient.cancelQueries({ queryKey: permissionsKey });

			const previous = queryClient.getQueryData<PermissionsSnapshot>(permissionsKey);

			queryClient.setQueryData<PermissionsSnapshot>(permissionsKey, (current) =>
				current
					? {
							...current,
							grantedActions: granted
								? [...new Set([...current.grantedActions, action])]
								: current.grantedActions.filter((held) => held !== action),
						}
					: current,
			);

			setPendingActions((current) => [...current, action]);

			try {
				await setMutation.mutateAsync({ action, granted, userId });
			} catch (error) {
				// Back to exactly what was on screen before the press. The switch moving
				// on its own IS the report; the toast only says which and why.
				if (previous) queryClient.setQueryData(permissionsKey, previous);

				AppToast.error(
					granted
						? `Could not grant ${ACTION_LABELS[action].label}.`
						: `Could not revoke ${ACTION_LABELS[action].label}.`,
					{
						description: reason(error, "The switch has been put back — nothing was changed."),
						icon: CircleAlert,
					},
				);

				throw error;
			} finally {
				setPendingActions((current) => current.filter((held) => held !== action));
			}

			// The server is the last word even on a success: it holds the grant dates,
			// and another admin may have moved something else on the same person.
			await queryClient.invalidateQueries({ queryKey: permissionsKey });
		},
		[permissionsKey, queryClient, setMutation, userId],
	);

	const resetToRoleDefaults = useCallback(async () => {
		if (!userId) return;

		try {
			await resetMutation.mutateAsync({ userId });
		} catch (error) {
			AppToast.error("Could not reset the permissions. Please try again.", {
				description: reason(error, "Nothing was changed — they hold what they held."),
				icon: CircleAlert,
			});

			throw error;
		}

		await queryClient.invalidateQueries({ queryKey: permissionsKey });

		AppToast.success("Permissions reset to the role's defaults.", {
			description: "Anything granted or revoked by hand is gone.",
			icon: RotateCcw,
		});
	}, [permissionsKey, queryClient, resetMutation, userId]);

	return {
		isResetting: resetMutation.isPending,
		/** Which switches are mid-write. Each one disables only itself. */
		pendingActions,
		resetToRoleDefaults,
		setPermission,
	};
}
