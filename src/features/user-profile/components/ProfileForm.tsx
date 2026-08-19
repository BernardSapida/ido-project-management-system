import { AppButton, AppInputGroup, AppReadOnlyField, AppSelect } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { useMemo } from "react";
import { POSITION_OPTIONS } from "@/features/request-form/lib/request-options";
import { useUserProfileMutations } from "@/features/user-profile/hooks/use-user-profile-mutations";
import {
	createProfileDetailsSchema,
	type ProfileDetailsValues,
} from "@/features/user-profile/validations/schema/update-profile.schema";
import { useAppForm } from "@/hooks/use-app-form";

interface ProfileFormProps {
	/** Immutable — it is the auth identity, so it is shown, not edited. */
	email?: string;
	/** Decides whether `position` is required. See the schema. */
	role?: string;
	/** The saved record. `undefined` until the query resolves. */
	values?: ProfileDetailsValues;
}

/**
 * Name and position, with the button that saves them.
 *
 * The button lives HERE rather than on the page, because this form is the only
 * thing it saves. It used to sit in the signature card's footer driving both —
 * one "Save changes" under the signature that also committed the name field in
 * the other column, and nothing at all under the fields it was really for. The
 * signature has its own card and its own Save now; these two fields have this
 * one, and neither can commit the other's work.
 */
export function ProfileForm({ email, role, values }: ProfileFormProps) {
	const { isSavingDetails, saveDetails } = useUserProfileMutations();

	// Rebuilt only when the role does. The schema is a different object for a
	// USER than for staff, and swapping it on every render would re-run the
	// resolver against a new instance each keystroke.
	const schema = useMemo(() => createProfileDetailsSchema(role), [role]);

	const {
		control,
		formState: { isDirty },
		handleSubmit,
		reset,
	} = useAppForm<ProfileDetailsValues>(schema, {
		defaultValues: { name: "", position: null },
		values,
	});

	const onSubmit = async (submitted: ProfileDetailsValues) => {
		try {
			await saveDetails(submitted);
		} catch {
			// Already reported by `saveDetails`, which has the server's own message.
			// Swallowed HERE so react-hook-form's submit handler does not turn a
			// handled failure into an unhandled rejection.
		}
	};

	return (
		<form
			className="space-y-6"
			onSubmit={handleSubmit(onSubmit)}
		>
			<AppInputGroup
				control={control}
				isRequired
				label="Full name"
				name="name"
				placeholder="Juan Dela Cruz"
			/>

			{email ? (
				<AppReadOnlyField
					description="Used to sign in. It cannot be changed here."
					label="Email"
					value={email}
				/>
			) : null}

			<AppSelect
				control={control}
				description={
					role === "USER"
						? "Printed on the request form as your designation."
						: "Optional for staff — you sign as your role, not as a representative."
				}
				isRequired={role === "USER"}
				items={POSITION_OPTIONS}
				label="Position"
				name="position"
				placeholder="Select position"
			/>

			<div className="flex flex-wrap items-center justify-end gap-3 pt-2">
				{isDirty ? (
					<Typography
						className="mr-auto"
						color="muted"
						type="body-xs"
					>
						Unsaved changes will be lost if you navigate away.
					</Typography>
				) : null}
				<AppButton
					isDisabled={!isDirty || isSavingDetails}
					// `reset()` with no argument returns to the last `values` — which is
					// the record as saved, not the empty defaults.
					onPress={() => reset()}
					// Explicit: this button sits inside the form, and a default of
					// "submit" would make Discard save.
					type="button"
					variant="tertiary"
				>
					Discard
				</AppButton>
				<AppButton
					isDisabled={!isDirty || isSavingDetails}
					isPending={isSavingDetails}
					type="submit"
					variant="primary"
				>
					{isSavingDetails ? "Saving..." : "Save details"}
				</AppButton>
			</div>
		</form>
	);
}
