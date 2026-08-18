import { AppAlert, AppDialog, AppSelect } from "@bernardsapida/web-ui";
import { TriangleAlert, UserCog } from "lucide-react";
import { useEffect } from "react";
import { useAdminAccountsMutations } from "@/features/admin-accounts/hooks/use-admin-accounts-mutations";
import {
	ASSIGNABLE_ROLE_OPTIONS,
	type AssignableRoleValue,
	roleLabel,
} from "@/features/admin-accounts/lib/account-options";
import {
	type UpdateUserRoleFormData,
	UpdateUserRoleFormSchema,
} from "@/features/admin-accounts/validations/schema/update-user-role.schema";
import { useAppForm } from "@/hooks/use-app-form";

interface UpdateUserRoleModalProps {
	currentRole: string;
	isOpen: boolean;
	onClose: () => void;
	userId: string;
	userName: string;
}

/**
 * Move somebody to another role.
 *
 * ## Why a dialog and not a modal
 *
 * One field and a consequence to read - the shape `AppDialog` exists for, and the
 * one surface of the three that has a button to fire the change with. See
 * `IdoActionButtons`'s note; the spec names both surfaces and the package's
 * contract decides which.
 *
 * ## The alert is the point of the screen
 *
 * Changing a role RESETS every permission to the new role's defaults, and that is
 * the most surprising thing this whole page does: an admin who had granted a
 * budget officer an extra capability by hand loses it here without ever opening
 * the permissions dialog. Stating it under the field, in the place the decision
 * is taken, is the only version of that warning anybody reads.
 *
 * ADMIN is not in the list. Promoting somebody to administrator would be a way
 * around the self-guard - make a second admin, have them demote you back - so the
 * schema, the dropdown and the server all stop at five roles.
 */
export function UpdateUserRoleModal({ currentRole, isOpen, onClose, userId, userName }: UpdateUserRoleModalProps) {
	const { updateUserRole } = useAdminAccountsMutations();

	const { control, handleSubmit, reset, watch } = useAppForm<UpdateUserRoleFormData>(UpdateUserRoleFormSchema, {
		defaultValues: { role: (currentRole as AssignableRoleValue) ?? "USER" },
	});

	// Seeded from the row every time it opens, so the select starts on what the
	// person IS. Opening it on somebody else's previous role would make the first
	// thing an admin reads a lie about the account in front of them.
	useEffect(() => {
		if (isOpen) reset({ role: currentRole as AssignableRoleValue });
	}, [currentRole, isOpen, reset]);

	const selectedRole = watch("role");
	const isUnchanged = selectedRole === currentRole;

	const handleConfirm = async () => {
		let submitted = false;

		await handleSubmit(async (values) => {
			submitted = true;

			// Confirming the role they already hold is a no-op, and it MUST be: the
			// write resets their permissions, so letting it through would wipe every
			// hand-set grant for an admin who opened the dialog and changed their
			// mind. Wanting the reset without the role change is the permissions
			// dialog's own button.
			if (values.role === currentRole) return;

			await updateUserRole(userId, values.role);
		})();

		// `handleSubmit` resolves whether or not the schema passed - the field's own
		// error is the report - so the rejection the dialog needs is raised here, or
		// an invalid choice would close it having done nothing.
		if (!submitted) throw new Error("Pick a role");
	};

	return (
		<AppDialog
			cancelLabel="Cancel"
			confirmLabel="Change role"
			data-cy="update-user-role-dialog"
			description={`${userName} is currently ${roleLabel(currentRole)}. Their queue, their sidebar and their permissions all follow the role.`}
			icon={UserCog}
			isOpen={isOpen}
			onClose={onClose}
			onConfirm={handleConfirm}
			pendingLabel="Changing role..."
			title="Change this person's role?"
			tone="accent"
		>
			<div className="flex flex-col gap-4">
				<AppSelect
					control={control}
					isRequired
					items={ASSIGNABLE_ROLE_OPTIONS}
					label="Role"
					name="role"
					placeholder="Select a role"
				/>

				{/* Only once the choice is a real change. On the unchanged default the
				    warning would be about something that is not going to happen, and a
				    warning that cries wolf on open is one nobody reads on the third row. */}
				{isUnchanged ? null : (
					<AppAlert
						description="Every permission is reset to the new role's defaults. Anything you granted or revoked by hand for this person is lost, including capabilities they still need."
						icon={TriangleAlert}
						status="warning"
						title="This resets their permissions"
					/>
				)}
			</div>
		</AppDialog>
	);
}
