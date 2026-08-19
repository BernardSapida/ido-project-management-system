import { AppButton, AppInputGroup, AppToast } from "@bernardsapida/web-ui";
import { Check, CheckCircle2, KeyRound, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { authClient } from "@/features/auth/utils/auth-client";
import { useAppForm } from "@/hooks/use-app-form";

const ChangePasswordSchema = z
	.object({
		confirmPassword: z.string().min(1, "Please confirm your new password"),
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z.string().min(8, "New password must be at least 8 characters"),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export function ChangePasswordCard() {
	const [isSuccess, setIsSuccess] = useState(false);

	const {
		control,
		handleSubmit,
		reset,
		formState: { isDirty, isSubmitting },
	} = useAppForm<ChangePasswordInput>(ChangePasswordSchema, {
		defaultValues: { confirmPassword: "", currentPassword: "", newPassword: "" },
	});

	const onSubmit = async (data: ChangePasswordInput) => {
		const result = await authClient.changePassword({
			currentPassword: data.currentPassword,
			newPassword: data.newPassword,
			revokeOtherSessions: false,
		});

		if (result.error) {
			AppToast.error("Couldn't change your password", {
				description: result.error.message ?? "The current password may be wrong. Nothing was changed.",
				icon: TriangleAlert,
			});
			return;
		}

		setIsSuccess(true);
		AppToast.success("Password changed", {
			description: "Use the new one the next time you sign in.",
			icon: CheckCircle2,
		});
		reset();
		setTimeout(() => setIsSuccess(false), 3000);
	};

	return (
		<div className="border-none shadow-none rise-in [animation-delay:300ms]">
			<div className="p-0 space-y-8 text-left">
				<div className="flex items-center gap-4 text-app-brand">
					<KeyRound size={24} />
					<h2 className="text-2xl font-serif font-bold">Change Password</h2>
				</div>

				<form
					className="space-y-6"
					onSubmit={handleSubmit(onSubmit)}
				>
					<AppInputGroup
						control={control}
						label="Current Password"
						name="currentPassword"
						placeholder="Enter current password"
						type="password"
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<AppInputGroup
							control={control}
							label="New Password"
							name="newPassword"
							placeholder="Min. 8 characters"
							type="password"
						/>
						<AppInputGroup
							control={control}
							label="Confirm New Password"
							name="confirmPassword"
							placeholder="Repeat new password"
							type="password"
						/>
					</div>

					{/* Same component and same size as the Save on the two cards above
					    it — this used to be a raw HeroUI Button at size="lg", which
					    made the third button on the page visibly the biggest one. */}
					<div className="flex flex-wrap items-center justify-end gap-3 pt-2">
						<AppButton
							icon={isSuccess ? Check : undefined}
							isDisabled={(!isDirty && !isSuccess) || isSubmitting}
							isPending={isSubmitting}
							type="submit"
							variant="primary"
						>
							{isSuccess ? "Password Updated" : "Change Password"}
						</AppButton>
					</div>
				</form>
			</div>
		</div>
	);
}
