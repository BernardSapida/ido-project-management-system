import { AppInputGroup } from "@bernardsapida/web-ui";
import { Button, Card } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Layout, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/errors/error-messages";
import { authClient } from "@/features/auth/utils/auth-client";

const forgotPasswordSchema = z.object({
	email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const { control, handleSubmit } = useForm<ForgotPasswordInput>({
		defaultValues: { email: "" },
		mode: "onBlur",
		resolver: zodResolver(forgotPasswordSchema),
		reValidateMode: "onChange",
	});

	const onSubmit = async (data: ForgotPasswordInput) => {
		setIsLoading(true);
		setError(null);
		try {
			const { error: requestError } = await authClient.requestPasswordReset({
				email: data.email,
				redirectTo: `${window.location.origin}/reset-password`,
			});
			if (requestError) {
				setError(requestError.message ?? ERROR_MESSAGES.GENERIC);
			} else {
				setSent(true);
			}
		} catch {
			setError(ERROR_MESSAGES.GENERIC);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full max-w-xl mb-24 rise-in text-center flex flex-col items-center">
			<div className="flex flex-col items-center mb-12">
				<Link
					className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-app-brand text-white shadow-xl shadow-app-brand/20 group hover:-translate-y-1 transition-transform"
					to="/"
				>
					<Layout className="h-7 w-7" />
				</Link>
				<h1 className="text-4xl font-serif font-bold text-text-primary/90 mb-3 text-center">
					{sent ? "Check your inbox" : "Reset your password"}
				</h1>
				<p className="text-text-secondary/70 font-medium text-center w-full">
					{sent
						? "We've sent a password reset link to your email. It may take a minute to arrive."
						: "Enter your email and we'll send you a link to reset your password."}
				</p>
			</div>

			{sent ? (
				<Card className="p-8 lg:p-12 shadow-2xl rounded-3xl w-full border-none text-center">
					<Card.Content className="flex flex-col items-center gap-6 p-0">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-app-brand/10">
							<Mail className="h-8 w-8 text-app-brand" />
						</div>
						<p className="text-text-secondary font-medium text-sm max-w-xs">
							Didn't receive the email? Check your spam folder or{" "}
							<button
								className="text-app-brand font-bold hover:underline"
								onClick={() => setSent(false)}
								type="button"
							>
								try again
							</button>
							.
						</p>
					</Card.Content>
				</Card>
			) : (
				<Card className="p-8 lg:p-12 shadow-2xl rounded-3xl w-full border-none text-left">
					<Card.Content className="flex flex-col gap-8 p-0 w-full">
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
								label="Email address"
								name="email"
								placeholder="yours@example.com"
								startContent={<Mail className="h-5 w-5 text-text-secondary/40" />}
								type="email"
							/>
							<div className="mt-2">
								<Button
									fullWidth
									isPending={isLoading}
									size="lg"
									type="submit"
									variant="primary"
								>
									{isLoading ? "Sending..." : "Send reset link"}
								</Button>
							</div>
						</form>
					</Card.Content>
				</Card>
			)}

			<div className="mt-12 text-center flex flex-col items-center gap-6">
				<Link
					className="text-sm font-bold text-text-secondary/70 flex items-center gap-2 group"
					to="/sign-in"
				>
					<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to sign in
				</Link>
			</div>
		</div>
	);
}
