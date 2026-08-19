import { AppToast, reason } from "@bernardsapida/web-ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, PenLine, UserCheck } from "lucide-react";
import { useCallback } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { ProfileDetailsValues } from "@/features/user-profile/validations/schema/update-profile.schema";
import { useTRPC } from "@/integrations/trpc/react";
import { pendingUrlsIn, withUploadedUrls } from "@/lib/pending-uploads";
import { useUploadingSubmit } from "@/lib/use-uploading-submit";

/** What the signature card saves: one URL, or `null` for "remove it". */
interface SignatureDraft {
	signatureUrl: string | null;
}

/**
 * Saving the profile — as TWO saves, because the page asks two questions.
 *
 * `saveDetails` writes name and position. `saveSignature` writes the signature.
 * Neither sends the other's fields, and the router reads an absent field as
 * "leave it as it was", so pressing Save on one card can never quietly commit
 * what somebody was still typing in the other. That separation is the reason
 * each card carries its own button.
 *
 * `saveSignature` is the one with an order to keep, and `useUploadingSubmit`
 * owns it — flush the parked signature to S3, rewrite the `blob:` URL to the S3
 * one, save, and only then release the parked copy. Wrapping it here rather than
 * in the card is the point: a caller cannot get the sequence wrong, because
 * there is no sequence exposed to get wrong.
 *
 * It resolves with the URL as actually SAVED. The card needs that: the object
 * URL it was previewing is revoked on release, so a card that kept showing its
 * own copy would show a broken image the moment the save succeeded.
 */
export function useUserProfileMutations() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { refetchSession } = useAuth();

	// Two mutation instances over the same procedure, so each card has its own
	// `isPending`. One shared instance would put both buttons in the spinner for
	// a save only one of them started.
	const updateDetails = useMutation(trpc.profile.updateMyProfile.mutationOptions());
	const updateSignature = useMutation(trpc.profile.updateMyProfile.mutationOptions());

	const { isSubmitting, pendingLabel, submit } = useUploadingSubmit<SignatureDraft>({
		// `null` (cleared) has to survive this function unchanged — rewriting it
		// would save a signature the user just removed.
		apply: (values, uploaded) => {
			if (!values.signatureUrl) return values;

			const [rewritten] = withUploadedUrls([{ url: values.signatureUrl }], uploaded);

			return { signatureUrl: rewritten.url ?? values.signatureUrl };
		},
		collect: (values) => (values.signatureUrl ? pendingUrlsIn([{ url: values.signatureUrl }]) : []),
	});

	/**
	 * What both saves owe the rest of the app once the write lands.
	 *
	 * The route gate reads `profileComplete` off the SESSION, and the server has
	 * just refreshed the cookie. Without the refetch the client keeps the old
	 * session object in memory and the gate acts on it.
	 */
	const settle = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: trpc.profile.getMyProfile.queryKey() });
		await refetchSession();
	}, [queryClient, refetchSession, trpc]);

	const saveDetails = useCallback(
		async (values: ProfileDetailsValues): Promise<void> => {
			try {
				// No `signatureUrl` key at all — see the note above.
				await updateDetails.mutateAsync({ name: values.name, position: values.position });
			} catch (error) {
				AppToast.error("Failed to save your details. Please try again.", {
					description: reason(error, "Nothing was saved — your changes are still on this page."),
					icon: CircleAlert,
				});

				throw error;
			}

			await settle();

			AppToast.success("Details saved.", {
				description: "Your name and position are up to date.",
				icon: UserCheck,
			});
		},
		[settle, updateDetails],
	);

	const saveSignature = useCallback(
		async (draft: SignatureDraft, name: string): Promise<string | null> => {
			let saved = draft.signatureUrl;

			try {
				await submit(draft, async (resolved) => {
					// `name` because the router requires it; `position` is left out so
					// this write cannot touch it.
					await updateSignature.mutateAsync({ name, signatureUrl: resolved.signatureUrl });

					saved = resolved.signatureUrl;
				});
			} catch (error) {
				AppToast.error("Failed to save your signature. Please try again.", {
					description: reason(error, "Nothing was saved — your signature is still on this page."),
					icon: CircleAlert,
				});

				throw error;
			}

			await settle();

			AppToast.success(saved ? "Signature saved." : "Signature removed.", {
				description: saved
					? "It is stamped onto the request forms you sign from now on."
					: "Add a new one before you sign another request form.",
				icon: PenLine,
			});

			return saved;
		},
		[settle, submit, updateSignature],
	);

	return {
		/** True from the first uploaded byte to the server's answer. */
		isSavingSignature: isSubmitting,
		isSavingDetails: updateDetails.isPending,
		saveDetails,
		saveSignature,
		/** "Uploading images... 40%" / "Saving..." — the signature button's label. */
		signaturePendingLabel: pendingLabel,
	};
}
