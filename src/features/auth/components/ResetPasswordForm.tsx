import { AppInputGroup } from "@bernardsapida/web-ui";
import { Button, Card } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/errors/error-messages";
import { authClient } from "@/features/auth/utils/auth-client";

const resetPasswordSchema = z
	.object({
		confirmPassword: z.string().min(1, "Please confirm your password"),
		password: z.string().min(1, "Password is required").min(8, "At least 8 characters"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
	onSuccess: () => void;
	token: string | undefined;
}

export function ResetPasswordForm({ onSuccess, token }: ResetPasswordFormProps) {
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { control, handleSubmit } = useForm<ResetPasswordInput>({
		defaultValues: { confirmPassword: "", password: "" },
		mode: "onBlur",
		resolver: zodResolver(resetPasswordSchema),
		reValidateMode: "onChange",
	});

	const onSubmit = async (data: ResetPasswordInput) => {
		if (!token) {
			setError("Invalid or missing reset token. Please request a new reset link.");
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const { error: resetError } = await authClient.resetPassword({
				newPassword: data.password,
				token,
			});
			if (resetError) {
				setError(resetError.message ?? ERROR_MESSAGES.GENERIC);
			} else {
				setDone(true);
			}
		} catch {
			setError(ERROR_MESSAGES.GENERIC);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full max-w-xl mb-24 rise-in text-center flex flex-col items-center">
			{done ? (
				<Card className="p-8 lg:p-12 shadow-2xl rounded-3xl w-full border-none text-center">
					<Card.Content className="flex flex-col items-center gap-6 p-0">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-app-brand/10">
							<CheckCircle2 className="h-8 w-8 text-app-brand" />
						</div>
						<div className="flex flex-col items-center">
							<h1 className="text-4xl font-serif font-bold text-text-primary/90 mb-3 text-center">Password updated</h1>
							<p className="text-text-secondary/70 font-medium text-center w-full">
								Your password has been reset. You can now sign in.
							</p>
						</div>
						<Button
							fullWidth
							onPress={onSuccess}
							size="lg"
							variant="primary"
						>
							Sign in
						</Button>
					</Card.Content>
				</Card>
			) : (
				<Card className="p-8 lg:p-12 shadow-2xl rounded-3xl w-full border-none text-left">
					<Card.Content className="flex flex-col gap-8 p-0 w-full">
						{!token && (
							<div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-bold border border-amber-100 italic">
								Missing reset token. Please use the link from your email.
							</div>
						)}
						{error && (
							<div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 italic">
								{error}
							</div>
						)}
						<form
							className="flex flex-col gap-6 w-full"
							onSubmit={handleSubmit(onSubmit)}
						>
							<AppInputGroup
								control={control}
								label="New password"
								name="password"
								placeholder="••••••••"
								startContent={<Lock className="h-5 w-5 text-text-secondary/40" />}
								type="password"
							/>
							<AppInputGroup
								control={control}
								label="Confirm new password"
								name="confirmPassword"
								placeholder="••••••••"
								startContent={<Lock className="h-5 w-5 text-text-secondary/40" />}
								type="password"
							/>
							<div className="mt-2">
								<Button
									fullWidth
									isDisabled={!token}
									isPending={isLoading}
									size="lg"
									type="submit"
									variant="primary"
								>
									{isLoading ? "Updating..." : "Update password"}
								</Button>
							</div>
						</form>
					</Card.Content>
				</Card>
			)}
		</div>
	);
}
