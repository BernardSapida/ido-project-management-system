import { AppButton } from "@bernardsapida/web-ui";
import { Card, Typography } from "@heroui/react";
import { useState } from "react";
import { SignatureUploader } from "@/features/user-profile/components/SignatureUploader";
import { useUserProfileMutations } from "@/features/user-profile/hooks/use-user-profile-mutations";
import type { ProfileUser } from "@/features/user-profile/types";

interface SignatureCardProps {
	/** Fired after a successful save, with the URL as stored — `null` if removed. */
	onSaved?: (savedUrl: string | null) => void;
	/** The saved record. `null` until the query resolves. */
	user: ProfileUser | null;
}

/**
 * The signature, and the button that saves it.
 *
 * This card owns its own draft and its own save. The page used to hold both, and
 * the single "Save changes" in this footer committed the name and position from
 * the other column too — so the same press meant two different things depending
 * on which card you had been typing in, and the details card had no button of
 * its own to explain itself.
 */
export function SignatureCard({ onSaved, user }: SignatureCardProps) {
	const { isSavingSignature, saveSignature, signaturePendingLabel } = useUserProfileMutations();

	/**
	 * The signature picked or removed in this session. `null` means untouched —
	 * `{ url: null }` is the different thing, a removal waiting to be saved.
	 *
	 * The two arrive through two different props, and that is the whole reason
	 * `onRemove` exists. The uploader reports an empty file list whenever it is
	 * remounted — which this card does on purpose, keyed on the saved URL, every
	 * time the record loads. Read as a removal, that turned "no rows in the drop
	 * zone" into `{ url: null }` on every refresh: a saved signature read back as
	 * "No signature on file", and the card sat dirty with `signatureUrl: null`
	 * ready to delete it for real on the next Save.
	 */
	const [pick, setPick] = useState<{ url: string | null } | null>(null);

	/** Bumped by Discard, and used to remount the uploader so its own file rows
	 *  go with the card's draft. */
	const [resetNonce, setResetNonce] = useState(0);

	const currentSignature = pick ? pick.url : (user?.signatureUrl ?? null);

	/*
	 * A requestor's position prints on the request form beside their signature,
	 * and the router refuses to write ANY profile for a requestor without one. So
	 * on a first visit the two cards do have an order, and this says so rather
	 * than letting the save come back with an error about a field in the other
	 * column.
	 */
	const needsPositionFirst = user?.role === "USER" && !user.position;

	/*
	 * Three different things worth saying, and only one of them is true at a
	 * time: the order setup imposes, the risk of leaving a pick unsaved, and —
	 * when there is nothing pending — that this card does not save the fields in
	 * the other column, which is the question the shared button used to raise.
	 */
	const footnote = needsPositionFirst
		? "Save your position first — it is printed beside this signature."
		: pick
			? "Unsaved changes will be lost if you navigate away."
			: "Saved on its own — your name and position have their own Save.";

	const handleDiscard = () => {
		setPick(null);
		setResetNonce((nonce) => nonce + 1);
	};

	const handleSave = async () => {
		if (!(pick && user)) return;

		try {
			onSaved?.(await saveSignature({ signatureUrl: pick.url }, user.name));
			// The saved S3 URL is already in the refetched record — the object URL
			// this was previewing has been revoked, so dropping the local pick is
			// what keeps a live image on screen.
			setPick(null);
		} catch {
			// Already reported by `saveSignature`, which has the server's own
			// message. The pick is kept so the user can simply press Save again.
		}
	};

	return (
		<Card>
			<Card.Header>
				<Typography.Heading level={2}>Signature</Typography.Heading>
			</Card.Header>
			<Card.Content>
				<SignatureUploader
					currentSignatureUrl={currentSignature}
					isDisabled={isSavingSignature}
					key={`${user?.signatureUrl ?? "none"}:${resetNonce}`}
					onChange={(url) => setPick(url === null ? null : { url })}
					onRemove={() => setPick({ url: null })}
				/>
			</Card.Content>
			<Card.Footer className="flex flex-wrap items-center justify-end gap-3">
				<Typography
					className="mr-auto"
					color="muted"
					type="body-xs"
				>
					{footnote}
				</Typography>
				<AppButton
					isDisabled={!pick || isSavingSignature}
					onPress={handleDiscard}
					variant="tertiary"
				>
					Discard
				</AppButton>
				<AppButton
					isDisabled={!pick || isSavingSignature || needsPositionFirst}
					isPending={isSavingSignature}
					onPress={handleSave}
					variant="primary"
				>
					{signaturePendingLabel ?? "Save signature"}
				</AppButton>
			</Card.Footer>
		</Card>
	);
}
