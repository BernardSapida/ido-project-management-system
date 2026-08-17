import { AppInputGroup, AppModal, AppToast } from "@bernardsapida/web-ui";
import { Button, Card } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { authClient } from "@/features/auth/utils/auth-client";
import { useAppForm } from "@/hooks/use-app-form";
import { useTRPC } from "@/integrations/trpc/react";

const DeleteAccountSchema = z.object({
	password: z.string().min(1, "Password is required to confirm deletion"),
});

type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;

export function DeleteAccountCard() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const navigate = useNavigate();
	const trpc = useTRPC();

	const {
		control,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = useAppForm<DeleteAccountInput>(DeleteAccountSchema, {
		defaultValues: { password: "" },
	});

	const deleteAccount = useMutation(
		trpc.user.deleteAccount.mutationOptions({
			onSuccess: async () => {
				await authClient.signOut();
				navigate({ to: "/" });
			},
			onError: (error) => {
				const message =
					error.message === "INVALID_PASSWORD"
						? "Incorrect password. Please try again."
						: "Failed to delete account. Please try again.";
				AppToast.error("Couldn't delete your account", {
					description: message,
					icon: TriangleAlert,
				});
			},
		}),
	);

	const onSubmit = (data: DeleteAccountInput) => {
		deleteAccount.mutate({ password: data.password });
	};

	const handleClose = () => {
		if (deleteAccount.isPending) return;
		setIsModalOpen(false);
		reset();
	};

	return (
		<>
			<Card className="p-8 lg:p-10 border border-red-200 dark:border-red-900/40 shadow-none rise-in [animation-delay:400ms]">
				<Card.Content className="p-0 space-y-6 text-left">
					<div className="flex items-center gap-4 text-red-500">
						<AlertTriangle size={24} />
						<h2 className="text-2xl font-serif font-bold">Danger Zone</h2>
					</div>

					<p className="text-sm text-text-secondary leading-relaxed">
						Permanently delete your account and all associated data. This action cannot be undone and there is no way to
						recover your account after deletion.
					</p>

					<div className="pt-2">
						<Button
							className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
							onPress={() => setIsModalOpen(true)}
							variant="secondary"
						>
							Delete My Account
						</Button>
					</div>
				</Card.Content>
			</Card>

			<AppModal
				isOpen={isModalOpen}
				onClose={handleClose}
				size="sm"
				title="Delete your account"
			>
				<form
					className="space-y-6"
					onSubmit={handleSubmit(onSubmit)}
				>
					<div className="space-y-4">
						<p className="text-sm text-text-secondary leading-relaxed">
							This will permanently erase your account, all your data, and active sessions.
							<strong className="text-text-primary"> This cannot be undone.</strong>
						</p>
						<p className="text-sm text-text-secondary">Enter your password to confirm.</p>
					</div>

					<AppInputGroup
						control={control}
						label="Password"
						name="password"
						placeholder="Enter your password"
						type="password"
					/>

					<div className="flex gap-3 justify-end pt-2">
						<Button
							isDisabled={deleteAccount.isPending}
							onPress={handleClose}
							variant="tertiary"
						>
							Cancel
						</Button>
						<Button
							className="bg-red-500 text-white hover:bg-red-600 focus:bg-red-600"
							isPending={deleteAccount.isPending || isSubmitting}
							type="submit"
							variant="primary"
						>
							Delete Account
						</Button>
					</div>
				</form>
			</AppModal>
		</>
	);
}
