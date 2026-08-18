import { AppToast, reason } from "@bernardsapida/web-ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, ShieldCheck, UserCheck, UserPlus } from "lucide-react";
import { useCallback } from "react";
import type { AssignableRoleValue, StatusValue } from "@/features/admin-accounts/lib/account-options";
import type { CreateStaffAccountFormData } from "@/features/admin-accounts/validations/schema/create-staff-account.schema";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * The three writes that change an account, and the cache they all move.
 *
 * ## Why every action re-throws
 *
 * Two of the three are fired from an `AppDialog`'s `onConfirm`, whose contract is
 * that a rejected promise leaves the dialog open with what was chosen still in
 * it. Swallowing the error would close the dialog over a change that never
 * committed - and on this screen that means an admin believing they suspended
 * somebody who is still working. The toast is the explanation; the throw is what
 * keeps the dialog on screen.
 *
 * ## Why a role change invalidates two keys
 *
 * It resets permissions as a side effect, so the permissions modal for that
 * person is stale the moment the role lands. Invalidating `getUserPermissions`
 * by PREFIX rather than by `{ userId }` is deliberate: the modal may not be
 * mounted, and the next admin to open it must not be shown the previous role's
 * seven switches.
 */
export function useAdminAccountsMutations() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const createMutation = useMutation(trpc.adminAccounts.createStaffAccount.mutationOptions());
	const roleMutation = useMutation(trpc.adminAccounts.updateUserRole.mutationOptions());
	const statusMutation = useMutation(trpc.adminAccounts.updateUserStatus.mutationOptions());

	const invalidateAccounts = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: trpc.adminAccounts.listAllUsers.queryKey() });
	}, [queryClient, trpc]);

	/**
	 * Create, and report a taken email to the CALLER rather than only to a toast.
	 *
	 * The form puts a CONFLICT under the email field, where the fix is. So this
	 * one deliberately does not toast that case - two reports of one problem, one
	 * of them somewhere the user has already scrolled past, is worse than either.
	 */
	const createStaffAccount = useCallback(
		async (values: CreateStaffAccountFormData) => {
			await createMutation.mutateAsync(values);

			await invalidateAccounts();

			AppToast.success("Staff account created.", {
				description: "Hand over the password yourself — there is no invitation email.",
				icon: UserPlus,
			});
		},
		[createMutation, invalidateAccounts],
	);

	const updateUserRole = useCallback(
		async (userId: string, role: AssignableRoleValue) => {
			try {
				await roleMutation.mutateAsync({ role, userId });
			} catch (error) {
				AppToast.error("Failed to update the role. Please try again.", {
					description: reason(error, "Nothing was changed — their role and permissions are as they were."),
					icon: CircleAlert,
				});

				throw error;
			}

			await Promise.all([
				invalidateAccounts(),
				queryClient.invalidateQueries({ queryKey: trpc.adminPermissions.getUserPermissions.queryKey() }),
			]);

			AppToast.success("Role updated. Permissions were reset to the new role's defaults.", {
				description: "Anything you had granted or revoked by hand is gone.",
				icon: ShieldCheck,
			});
		},
		[invalidateAccounts, queryClient, roleMutation, trpc],
	);

	const updateUserStatus = useCallback(
		async (userId: string, status: StatusValue) => {
			try {
				await statusMutation.mutateAsync({ status, userId });
			} catch (error) {
				AppToast.error("Failed to update the status. Please try again.", {
					description: reason(error, "Nothing was changed — the account is as it was."),
					icon: CircleAlert,
				});

				throw error;
			}

			await invalidateAccounts();

			// `warning` for the two that take access away, `success` only for the one
			// that gives it back. A green tick over a suspension reads as approval of
			// the person rather than confirmation of the act.
			if (status === "active") {
				AppToast.success("Account activated.", {
					description: "They can sign in and act on everything their role allows.",
					icon: UserCheck,
				});
			} else {
				AppToast.warning(status === "suspended" ? "Account suspended." : "Account deactivated.", {
					description: "They keep any session they hold, and every action they attempt will now fail.",
					icon: ShieldCheck,
				});
			}
		},
		[invalidateAccounts, statusMutation],
	);

	return {
		createStaffAccount,
		isCreating: createMutation.isPending,
		updateUserRole,
		updateUserStatus,
	};
}
