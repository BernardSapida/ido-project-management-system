import { AppButton, AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { Card, Separator, Typography } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getDefaultRoute } from "@/config/navigation.config";
import { seo } from "@/config/seo.config";
import { ChangePasswordCard } from "@/features/user/components/ChangePasswordCard";
import { AboutAccount } from "@/features/user-profile/components/AboutAccount";
import {
	ProfileForm,
	type ProfileFormHandle,
	type ProfileFormState,
} from "@/features/user-profile/components/ProfileForm";
import { ProfileInfoCard } from "@/features/user-profile/components/ProfileInfoCard";
import { SignatureUploader } from "@/features/user-profile/components/SignatureUploader";
import { useUserProfileQueries } from "@/features/user-profile/hooks/use-user-profile-queries";
import type { UpdateProfileValues } from "@/features/user-profile/validations/schema/update-profile.schema";

export const Route = createFileRoute("/_authenticated/profile")({
	/*
	 * No `beforeLoad` of its own. `_authenticated` already asserts the session and
	 * is where the profileComplete gate lives — and this is the one route that
	 * gate must EXEMPT, so a second copy here would only be a place for the two to
	 * disagree.
	 */
	head: () => ({
		meta: [{ title: seo.title("Profile") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Profile",
	},
	component: ProfilePage,
});

const SETUP_HEADER = {
	subtitle: "Add your details and signature to get started. Your signature is stamped onto the printed request form.",
	title: "Complete your profile",
};

const NORMAL_HEADER = {
	subtitle: "Your account, position and signature.",
	title: "Profile",
};

function ProfilePage() {
	const navigate = useNavigate();
	const { profile } = useUserProfileQueries();

	const formRef = useRef<ProfileFormHandle>(null);
	const [formState, setFormState] = useState<ProfileFormState>({ isDirty: false, isPending: false });

	/**
	 * The signature picked or removed in this session. `null` means untouched —
	 * `{ url: null }` is the different thing, a removal waiting to be saved.
	 *
	 * The two arrive through two different props, and that is the whole reason
	 * `onRemove` exists. The uploader reports an empty file list whenever it is
	 * remounted — which this page does on purpose, keyed on the saved URL, every
	 * time the record loads. Read as a removal, that turned "no rows in the drop
	 * zone" into `{ url: null }` on every refresh: a saved signature read back as
	 * "No signature on file", and the form sat dirty with `signatureUrl: null`
	 * ready to delete it for real on the next Save.
	 */
	const [pick, setPick] = useState<{ url: string | null } | null>(null);

	/** Bumped by Discard, and used to remount the uploader so its own file rows
	 *  go with the form's values. */
	const [resetNonce, setResetNonce] = useState(0);

	/**
	 * Whether this visit STARTED incomplete, captured once.
	 *
	 * Read live it would flip to false the moment the save lands — taking the
	 * redirect that is supposed to follow the save with it — and the header would
	 * change wording underneath somebody mid-form.
	 */
	const [startedIncomplete, setStartedIncomplete] = useState<boolean | null>(null);
	const record = profile.data ?? null;

	useEffect(() => {
		if (record && startedIncomplete === null) setStartedIncomplete(!record.profileComplete);
	}, [record, startedIncomplete]);

	const isSetup = startedIncomplete === true;
	const currentSignature = pick ? pick.url : (record?.signatureUrl ?? null);

	const values: UpdateProfileValues | undefined = record
		? { name: record.name, position: record.position, signatureUrl: record.signatureUrl }
		: undefined;

	const handleSuccess = (saved: UpdateProfileValues) => {
		// The saved S3 URL is already in the refetched record — the object URL this
		// was previewing has been revoked, so dropping the local pick is what keeps
		// a live image on screen.
		setPick(null);

		if (isSetup && record && saved.signatureUrl) {
			navigate({ to: getDefaultRoute(record.role) });
		}
	};

	const handleDiscard = () => {
		formRef.current?.discard();
		setPick(null);
		setResetNonce((nonce) => nonce + 1);
	};

	if (profile.isError) {
		return (
			<AppQueryError
				error={profile.error}
				onRetry={() => void profile.refetch()}
			/>
		);
	}

	const header = isSetup ? SETUP_HEADER : NORMAL_HEADER;

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				subtitle={header.subtitle}
				title={header.title}
			/>

			{isSetup ? null : (
				<ProfileInfoCard
					isLoading={profile.isPending}
					user={record}
				/>
			)}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<Card className="h-max lg:col-span-2">
					<Card.Header>
						<Typography.Heading level={2}>Personal information</Typography.Heading>
					</Card.Header>

					<Card.Content className="space-y-8">
						<ProfileForm
							email={record?.email}
							onStateChange={setFormState}
							onSuccess={handleSuccess}
							pendingSignatureUrl={pick ? pick.url : undefined}
							ref={formRef}
							role={record?.role}
							values={values}
						/>

						{/* One thing at a time: during setup the only question on this page
						    is the signature, and a password field beside it is a second
						    task nobody asked for yet. */}
						{isSetup ? null : (
							<>
								<Separator />
								<ChangePasswordCard />
							</>
						)}
					</Card.Content>

					<Card.Footer className="flex flex-wrap items-center justify-end gap-3">
						<Typography
							className="mr-auto"
							color="muted"
							type="body-xs"
						>
							Unsaved changes will be lost if you navigate away.
						</Typography>
						<AppButton
							isDisabled={!formState.isDirty || formState.isPending}
							onPress={handleDiscard}
							variant="tertiary"
						>
							Discard
						</AppButton>
						<AppButton
							isDisabled={!formState.isDirty || formState.isPending}
							isPending={formState.isPending}
							onPress={() => formRef.current?.submit()}
							variant="primary"
						>
							{formState.pendingLabel ?? "Save changes"}
						</AppButton>
					</Card.Footer>
				</Card>

				<div className="flex flex-col gap-6">
					<Card>
						<Card.Header>
							<Typography.Heading level={2}>Signature</Typography.Heading>
						</Card.Header>
						<Card.Content>
							<SignatureUploader
								currentSignatureUrl={currentSignature}
								isDisabled={formState.isPending}
								key={`${record?.signatureUrl ?? "none"}:${resetNonce}`}
								onChange={(url) => setPick(url === null ? null : { url })}
								onRemove={() => setPick({ url: null })}
							/>
						</Card.Content>
					</Card>

					<AboutAccount user={record} />
				</div>
			</div>
		</div>
	);
}
