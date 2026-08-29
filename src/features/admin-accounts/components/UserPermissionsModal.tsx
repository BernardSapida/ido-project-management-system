import { AppButton, AppChip, AppModal, AppSwitch } from "@bernardsapida/web-ui";
import { Skeleton, Typography } from "@heroui/react";
import { RotateCcw, ShieldCheck, UserCog } from "lucide-react";
import { AppQueryError } from "@/components/project";
import { useAdminPermissionsMutations } from "@/features/admin-accounts/hooks/use-admin-permissions-mutations";
import { useAdminPermissionsQueries } from "@/features/admin-accounts/hooks/use-admin-permissions-queries";
import { roleLabel } from "@/features/admin-accounts/lib/account-options";
import { ACTION_LABELS, ALL_ACTIONS } from "@/lib/permission-actions";

interface UserPermissionsModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** The row's role, so the header can say what "reset to defaults" would mean. */
	userRole: string;
	/** `null` while no row is open - the query stays disabled until there is one. */
	userId: string | null;
	userName: string;
}

/**
 * The seven capabilities, one switch each.
 *
 * ## Why this one really is an `AppModal`
 *
 * The other three surfaces on this page act on a press and needed something to
 * act WITH, so they are a drawer and two dialogs. This one does not: every toggle
 * has already saved by the time the eye leaves it, so there is nothing left for a
 * footer button to do and Close is honestly the only thing this surface can
 * offer - which is exactly `AppModal`'s contract.
 *
 * ## No Save button, deliberately
 *
 * A permissions form with unsaved state is how a revocation gets lost: the admin
 * flips a switch, closes the dialog, and the person still holds the capability.
 * The write goes on the press; see `use-admin-permissions-mutations` for the
 * optimistic update and the visible rollback that make that safe.
 *
 * ## Why the switches are hand-laid rather than an `AppList`
 *
 * `AppList` has four typed slots per row - leading, primary, secondary, trailing
 * - and the trailing one takes a chip, a meta string, an action or a chevron. It
 * cannot hold a switch, and the package's own note says anything that does not
 * fit those four slots is a different component rather than a fifth slot. So the
 * rows are laid out here, using the same hairline separators.
 *
 * ## Role is shown, and it is not a filter
 *
 * The chip says what this person IS, because "reset to role defaults" is
 * meaningless without it - and because a director holding `APPROVE_BUDGET` is a
 * legitimate hand-grant an admin should be able to see they made.
 */
export function UserPermissionsModal({ isOpen, onClose, userId, userName, userRole }: UserPermissionsModalProps) {
	const { permissions } = useAdminPermissionsQueries(isOpen ? userId : null);
	const { isResetting, pendingActions, resetToRoleDefaults, setPermission } = useAdminPermissionsMutations(userId);

	const grantedActions = permissions.data?.grantedActions ?? [];

	return (
		<AppModal
			data-cy="user-permissions-modal"
			description={`What ${userName} may do. Each switch saves the moment you move it.`}
			icon={ShieldCheck}
			isOpen={isOpen}
			onClose={onClose}
			size="lg"
			title="Permissions"
		>
			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<AppChip
						icon={UserCog}
						label={roleLabel(userRole)}
						size="sm"
						tone="accent"
					/>

					{/* At the foot in the spec's words, and here it is at the head of the
					    list instead: this is a viewer with no footer of its own to sit in,
					    and a control that wipes seven switches must not be the thing a
					    thumb finds at the end of a scroll. */}
					<AppButton
						data-cy="reset-permissions"
						icon={RotateCcw}
						isDisabled={isResetting || permissions.isPending}
						isPending={isResetting}
						onPress={async () => {
							// Caught here: react-aria does not await the handler, so a
							// rejection left to propagate becomes an unhandled rejection.
							// The hook has already reported it.
							await resetToRoleDefaults().catch(() => {});
						}}
						size="sm"
						variant="tertiary"
					>
						Reset to role defaults
					</AppButton>
				</div>

				{permissions.isError ? (
					<AppQueryError
						error={permissions.error}
						onRetry={() => void permissions.refetch()}
					/>
				) : (
					<ul className="flex flex-col divide-y divide-default-200">
						{ALL_ACTIONS.map((action) => {
							const isPending = pendingActions.includes(action);

							return (
								<li
									className="py-4 first:pt-0 last:pb-0"
									key={action}
								>
									{permissions.isPending ? (
										<Skeleton className="h-10 w-full rounded-lg" />
									) : (
										<AppSwitch
											data-cy={`permission-${action}`}
											description={ACTION_LABELS[action].description}
											// Only this switch. A page-wide lock would stop an admin
											// making the second of two changes they came here to make.
											isDisabled={isPending || isResetting}
											label={ACTION_LABELS[action].label}
											onChange={(next) => {
												void setPermission(action, next).catch(() => {});
											}}
											value={grantedActions.includes(action)}
										/>
									)}
								</li>
							);
						})}
					</ul>
				)}

				<Typography
					color="muted"
					type="body-xs"
				>
					Revoking a capability does not empty this person's queue. The requests stay in front of them and the action
					fails when they try it.
				</Typography>
			</div>
		</AppModal>
	);
}
