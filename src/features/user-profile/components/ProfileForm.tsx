import { AppInputGroup, AppReadOnlyField, AppSelect } from "@bernardsapida/web-ui";
import { type Ref, useEffect, useImperativeHandle, useMemo } from "react";
import { useWatch } from "react-hook-form";
import { POSITION_OPTIONS } from "@/features/request-form/lib/request-options";
import { useUserProfileMutations } from "@/features/user-profile/hooks/use-user-profile-mutations";
import {
	createUpdateProfileSchema,
	type UpdateProfileValues,
} from "@/features/user-profile/validations/schema/update-profile.schema";
import { useAppForm } from "@/hooks/use-app-form";

/** What the page's action bar drives. The form owns `reset` and `handleSubmit`;
 *  the bar owns the buttons, and this is the seam between them. */
export interface ProfileFormHandle {
	discard: () => void;
	submit: () => void;
}

/** What the action bar needs to render itself, reported up on every change. */
export interface ProfileFormState {
	isDirty: boolean;
	isPending: boolean;
	/**
	 * "Uploading images... 40%" / "Saving...", or `undefined` when idle.
	 *
	 * The drop zone's own bar finished at pick time — the file was parked, not
	 * sent — so this is the only honest progress on the page, and it belongs on
	 * the button the user is waiting at.
	 */
	pendingLabel?: string;
}

interface ProfileFormProps {
	/** Immutable — it is the auth identity, so it is shown, not edited. */
	email?: string;
	onStateChange: (state: ProfileFormState) => void;
	/** The values as SAVED, so the page can adopt the S3 URL of a new signature. */
	onSuccess: (saved: UpdateProfileValues) => void;
	/**
	 * The signature the user has picked or removed in this session, if any.
	 *
	 * `undefined` means untouched, and is why this is separate from `values`:
	 * `values` is the record as the server has it, and react-hook-form RESETS the
	 * form when it changes — which would mark the form clean immediately after an
	 * upload and leave Save disabled with an unsaved signature on screen. That was
	 * a real bug in the old app. This one writes the field with `shouldDirty`
	 * instead.
	 */
	pendingSignatureUrl?: string | null;
	ref?: Ref<ProfileFormHandle>;
	/** Decides whether `position` is required. See the schema. */
	role?: string;
	/** The saved record. `undefined` until the query resolves. */
	values?: UpdateProfileValues;
}

export function ProfileForm({
	email,
	onStateChange,
	onSuccess,
	pendingSignatureUrl,
	ref,
	role,
	values,
}: ProfileFormProps) {
	const { isSaving, pendingLabel, saveProfile } = useUserProfileMutations();

	// Rebuilt only when the role does. The schema is a different object for a
	// USER than for staff, and swapping it on every render would re-run the
	// resolver against a new instance each keystroke.
	const schema = useMemo(() => createUpdateProfileSchema(role), [role]);

	const {
		control,
		formState: { isDirty },
		handleSubmit,
		reset,
		setValue,
	} = useAppForm<UpdateProfileValues>(schema, {
		defaultValues: { name: "", position: null, signatureUrl: null },
		values,
	});

	const signatureUrl = useWatch({ control, name: "signatureUrl" });

	useEffect(() => {
		if (pendingSignatureUrl === undefined || pendingSignatureUrl === signatureUrl) return;

		setValue("signatureUrl", pendingSignatureUrl, { shouldDirty: true });
	}, [pendingSignatureUrl, setValue, signatureUrl]);

	useEffect(() => {
		onStateChange({ isDirty, isPending: isSaving, pendingLabel });
	}, [isDirty, isSaving, onStateChange, pendingLabel]);

	const onSubmit = async (submitted: UpdateProfileValues) => {
		try {
			onSuccess(await saveProfile(submitted));
		} catch {
			// Already reported by `saveProfile`, which has the server's own message.
			// Swallowed HERE so react-hook-form's submit handler does not turn a
			// handled failure into an unhandled rejection.
		}
	};

	/*
	 * No dependency array, deliberately. `onSubmit` closes over `onSuccess`, and
	 * `onSuccess` closes over the page's record — which is null on the first
	 * render and arrives with the query. A memoised handle would pin the version
	 * that saw null, and the post-setup redirect would silently never fire.
	 * Rebuilding it every render costs one object and cannot go stale.
	 */
	useImperativeHandle(ref, () => ({
		// `reset()` with no argument returns to the last `values` — which is the
		// record as saved, not the empty defaults.
		discard: () => reset(),
		submit: () => void handleSubmit(onSubmit)(),
	}));

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
		</form>
	);
}
