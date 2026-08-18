import { AppToast, reason } from "@bernardsapida/web-ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, UserCheck } from "lucide-react";
import { useCallback } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { UpdateProfileValues } from "@/features/user-profile/validations/schema/update-profile.schema";
import { useTRPC } from "@/integrations/trpc/react";
import { pendingUrlsIn, withUploadedUrls } from "@/lib/pending-uploads";
import { useUploadingSubmit } from "@/lib/use-uploading-submit";

/**
 * Saving the profile, in the order the four steps have to happen.
 *
 * `useUploadingSubmit` owns that order — flush the parked signature to S3,
 * rewrite the `blob:` URL to the S3 one, save, and only then release the parked
 * copy. Wrapping it here rather than in the page is the point: a caller cannot
 * get the sequence wrong, because there is no sequence exposed to get wrong.
 *
 * `saveProfile` resolves with the values as they were actually SAVED, S3 URL
 * included. The page needs that: the object URL it was previewing is revoked on
 * release, so a page that kept showing its own copy would show a broken image
 * the moment the save succeeded.
 */
export function useUserProfileMutations() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { refetchSession } = useAuth();

	const updateMyProfile = useMutation(trpc.profile.updateMyProfile.mutationOptions());

	const { isSubmitting, pendingLabel, submit } = useUploadingSubmit<UpdateProfileValues>({
		// `undefined` (untouched) and `null` (cleared) both mean there is nothing
		// to rewrite, and both have to survive this function unchanged — turning
		// one into the other would either clear a signature nobody touched or save
		// one the user just removed.
		apply: (values, uploaded) => {
			if (!values.signatureUrl) return values;

			const [rewritten] = withUploadedUrls([{ url: values.signatureUrl }], uploaded);

			return { ...values, signatureUrl: rewritten.url ?? values.signatureUrl };
		},
		collect: (values) => (values.signatureUrl ? pendingUrlsIn([{ url: values.signatureUrl }]) : []),
	});

	const saveProfile = useCallback(
		async (values: UpdateProfileValues): Promise<UpdateProfileValues> => {
			let saved = values;

			try {
				await submit(values, async (resolved) => {
					await updateMyProfile.mutateAsync({
						name: resolved.name,
						position: resolved.position,
						signatureUrl: resolved.signatureUrl,
					});

					saved = resolved;
				});
			} catch (error) {
				AppToast.error("Failed to update profile. Please try again.", {
					description: reason(error, "Nothing was saved — your changes are still on this page."),
					icon: CircleAlert,
				});

				throw error;
			}

			await queryClient.invalidateQueries({ queryKey: trpc.profile.getMyProfile.queryKey() });
			// The route gate reads `profileComplete` off the SESSION, and the server
			// has just refreshed the cookie. Without this the client keeps the old
			// session object in memory and the gate acts on it.
			await refetchSession();

			AppToast.success("Profile saved.", {
				description: "Your details and signature are up to date.",
				icon: UserCheck,
			});

			return saved;
		},
		[queryClient, refetchSession, submit, trpc, updateMyProfile],
	);

	return {
		/** True from the first uploaded byte to the server's answer. */
		isSaving: isSubmitting,
		/** "Uploading images... 40%" / "Saving..." — the button's label while busy. */
		pendingLabel,
		saveProfile,
	};
}
