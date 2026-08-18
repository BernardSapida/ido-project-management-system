import { AppAlert, AppDrawer, AppInputGroup, AppPasswordField, AppSelect } from "@bernardsapida/web-ui";
import { Info } from "lucide-react";
import { useEffect } from "react";
import type { DefaultValues } from "react-hook-form";
import { useAdminAccountsMutations } from "@/features/admin-accounts/hooks/use-admin-accounts-mutations";
import { STAFF_ROLE_OPTIONS } from "@/features/admin-accounts/lib/account-options";
import {
	type CreateStaffAccountFormData,
	CreateStaffAccountSchema,
} from "@/features/admin-accounts/validations/schema/create-staff-account.schema";
import { POSITION_OPTIONS } from "@/features/request-form/lib/request-options";
import { useAppForm } from "@/hooks/use-app-form";

interface CreateStaffAccountModalProps {
	isOpen: boolean;
	onClose: () => void;
}

/**
 * `role` starts UNSET, not on the first of the four.
 *
 * A pre-selected role is one an admin can create by never touching the field,
 * and the four are not interchangeable - an IDO officer and a budget officer
 * answer different halves of the workflow. The schema refuses an empty one, so
 * the choice has to be made rather than accepted.
 */
const EMPTY_FORM: DefaultValues<CreateStaffAccountFormData> = {
	confirmPassword: "",
	email: "",
	firstname: "",
	lastname: "",
	password: "",
	position: undefined,
	role: undefined,
};

/**
 * The only place a staff account is made.
 *
 * ## Why a drawer and not a modal
 *
 * The spec's component list names `AppModal`, and the package's contract is what
 * decides: `AppModal` is the surface for something to READ and its only button is
 * Close, so there would be nothing here to fire the create with. Of the two that
 * do act, `AppDialog` is "a decision plus the one or two small inputs a decision
 * needs" and explicitly does NOT guard what was typed, on the grounds that a
 * password or a reason is cheap to retype. Seven fields including two passwords
 * is not cheap, so this is the `AppDrawer` case - which brings the discard guard
 * (`isDirty`) and leaves the account list visible behind it.
 *
 * ## Why the alert is there and not in a tooltip
 *
 * Three consequences of pressing Create are invisible from the form: the account
 * is live immediately, nobody is emailed, and the new person cannot approve
 * anything until they have uploaded a signature. Every one of them is something
 * the admin has to DO something about - hand over the password, tell them to
 * finish their profile - so they belong above the button, not behind a hover.
 */
export function CreateStaffAccountModal({ isOpen, onClose }: CreateStaffAccountModalProps) {
	const { createStaffAccount, isCreating } = useAdminAccountsMutations();

	const { control, formState, handleSubmit, reset, setError, setFocus } = useAppForm<CreateStaffAccountFormData>(
		CreateStaffAccountSchema,
		{ defaultValues: EMPTY_FORM },
	);

	// Cleared on the way IN rather than on the way out, so a create that failed
	// leaves everything on screen to correct, and the next one opens empty.
	useEffect(() => {
		if (isOpen) reset(EMPTY_FORM);
	}, [isOpen, reset]);

	const onSubmit = handleSubmit(async (values) => {
		try {
			await createStaffAccount(values);
		} catch (error) {
			// A taken email is a fact about ONE field, so it belongs under that field
			// rather than in a toast the admin has to remember while they edit it.
			const code = (error as { data?: { code?: string } })?.data?.code;

			if (code === "CONFLICT") {
				setError("email", { message: "An account with this email already exists.", type: "server" });
				setFocus("email");
				return;
			}

			setError("root", {
				message: error instanceof Error ? error.message : "The account could not be created.",
				type: "server",
			});

			return;
		}

		onClose();
	});

	return (
		<AppDrawer
			cancelLabel="Cancel"
			data-cy="create-staff-account"
			description="They can sign in as soon as you press Create."
			isDirty={formState.isDirty}
			isOpen={isOpen}
			onClose={onClose}
			primaryAction={{
				isDisabled: isCreating,
				isPending: isCreating,
				label: "Create account",
				onPress: () => void onSubmit(),
			}}
			size="md"
			title="New staff account"
		>
			<form
				className="flex flex-col gap-6"
				onSubmit={onSubmit}
			>
				{formState.errors.root ? (
					<AppAlert
						description={formState.errors.root.message ?? "The account could not be created."}
						icon={Info}
						status="danger"
						title="We could not create this account"
					/>
				) : null}

				<AppAlert
					description="The account is created active and already verified — there is no invitation email, so hand the password over yourself. They will be sent to their profile to add a signature, and cannot approve anything until they have."
					icon={Info}
					status="accent"
					title="What happens when you press Create"
				/>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<AppInputGroup
						autoComplete="given-name"
						control={control}
						isRequired
						label="First name"
						name="firstname"
						placeholder="Ida"
					/>
					<AppInputGroup
						autoComplete="family-name"
						control={control}
						isRequired
						label="Last name"
						name="lastname"
						placeholder="Reyes"
					/>
				</div>

				<AppInputGroup
					autoComplete="email"
					control={control}
					isRequired
					label="Email"
					name="email"
					placeholder="name@tup.edu.ph"
					type="email"
				/>

				<AppSelect
					control={control}
					description="It decides which queue they see and which permissions they start with."
					isRequired
					items={STAFF_ROLE_OPTIONS}
					label="Role"
					name="role"
					placeholder="Select a role"
				/>

				<AppSelect
					control={control}
					description="Only used if this person also files requests. Staff normally do not."
					items={POSITION_OPTIONS}
					label="Position"
					name="position"
					placeholder="Optional"
				/>

				<AppPasswordField
					autoComplete="new-password"
					control={control}
					isRequired
					label="Temporary password"
					name="password"
					placeholder="At least 8 characters"
				/>

				<AppPasswordField
					autoComplete="new-password"
					control={control}
					isRequired
					label="Confirm password"
					name="confirmPassword"
					placeholder="Re-enter the password"
				/>
			</form>
		</AppDrawer>
	);
}
