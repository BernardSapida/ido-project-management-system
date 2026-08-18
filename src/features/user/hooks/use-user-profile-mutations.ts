import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authClient } from "@/features/auth/utils/auth-client";
import type { UpdateProfileInput } from "@/features/user/validations/schema/update-profile.schema";
import { useTRPC } from "@/integrations/trpc/react";

export function useUserProfileMutations() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { refetchSession } = useAuth();

	const updateProfile = useMutation({
		mutationFn: async (data: UpdateProfileInput) => {
			const result = await authClient.updateUser({
				firstname: data.firstname,
				lastname: data.lastname,
				name: `${data.firstname} ${data.lastname}`.trim(),
			});
			if (result.error) throw new Error(result.error.message ?? "Failed to update profile.");
			return result.data;
		},
		onSuccess: () => {
			toast.success("Profile updated successfully", {
				description: "Your personal information has been synchronized across the platform.",
			});

			queryClient.invalidateQueries({ queryKey: trpc.adminAccounts.listAllUsers.queryKey() });
			refetchSession();
		},
		onError: (error) => {
			toast.danger("Profile update failed", {
				description: error instanceof Error ? error.message : "An unexpected synchronization error occurred.",
			});
		},
	});

	return { updateProfile };
}
