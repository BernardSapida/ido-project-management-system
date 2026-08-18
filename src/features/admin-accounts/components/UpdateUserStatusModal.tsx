import { AppDialog, AppRadioGroup } from "@bernardsapida/web-ui";
import { ShieldCheck, ShieldX } from "lucide-react";
import { useEffect } from "react";
import { useAdminAccountsMutations } from "@/features/admin-accounts/hooks/use-admin-accounts-mutations";
import { STATUS_OPTIONS, type StatusValue } from "@/features/admin-accounts/lib/account-options";
import {
	type UpdateUserStatusFormData,
	UpdateUserStatusFormSchema,
} from "@/features/admin-accounts/validations/schema/update-user-status.schema";
import { useAppForm } from "@/hooks/use-app-form";

interface UpdateUserStatusModalProps {
	currentStatus: string;
	isOpen: boolean;
	onClose: () => void;
	userId: string;
	userName: string;
}

/**
 * Turn an account on or off.
 *
 * ## A radio group, not a select
 *
 * Three options, each with a consequence to read. A select hides two of the three
 * behind a press and shows their names without their meanings, which is the wrong
 * trade for a choice that decides whether somebody can work today.
 * `STATUS_OPTIONS` carries the sentence per option and `AppRadioGroup` renders it
 * under the label.
 *
 * ## The tone follows the DIRECTION, not the control
 *
 * Suspending or deactivating takes access away, so the dialog goes danger and its
 * verb says so. Reactivating gives it back and is not destructive - it is the
 * same control, and painting it red would ask an admin to confirm doing somebody
 * a favour. Confirmation belongs on the destructive direction only.
 */
export function UpdateUserStatusModal({
	currentStatus,
	isOpen,
	onClose,
	userId,
	userName,
}: UpdateUserStatusModalProps) {
	const { updateUserStatus } = useAdminAccountsMutations();

	const { control, handleSubmit, reset, watch } = useAppForm<UpdateUserStatusFormData>(UpdateUserStatusFormSchema, {
		defaultValues: { status: (currentStatus as StatusValue) ?? "active" },
	});

	useEffect(() => {
		if (isOpen) reset({ status: currentStatus as StatusValue });
	}, [currentStatus, isOpen, reset]);

	const selected = watch("status");
	const isRemovingAccess = selected !== "active";

	const handleConfirm = async () => {
		let submitted = false;

		await handleSubmit(async (values) => {
			submitted = true;

			// Nothing to say about a status that did not move. The write is
			// idempotent, but the toast is not - "Account suspended." over an account
			// that was already suspended reads as an act somebody just took.
			if (values.status === currentStatus) return;

			await updateUserStatus(userId, values.status);
		})();

		if (!submitted) throw new Error("Pick a status");
	};

	return (
		<AppDialog
			cancelLabel="Cancel"
			confirmLabel={isRemovingAccess ? "Remove access" : "Activate account"}
			data-cy="update-user-status-dialog"
			description={`${userName} keeps whatever session they already hold — the change takes effect on their very next action, not when their cookie expires.`}
			icon={isRemovingAccess ? ShieldX : ShieldCheck}
			isOpen={isOpen}
			onClose={onClose}
			onConfirm={handleConfirm}
			pendingLabel="Saving..."
			title="Change this account's status?"
			tone={isRemovingAccess ? "danger" : "default"}
		>
			<AppRadioGroup
				control={control}
				isRequired
				items={STATUS_OPTIONS}
				label="Status"
				name="status"
			/>
		</AppDialog>
	);
}
