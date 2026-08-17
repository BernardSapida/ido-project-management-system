import { Button, Card } from "@heroui/react";
import { Mail, RefreshCw } from "lucide-react";
import { useState } from "react";
import { ERROR_MESSAGES } from "@/errors/error-messages";
import { authClient } from "@/features/auth/utils/auth-client";

interface VerifyEmailCardProps {
	userEmail: string;
}

export function VerifyEmailCard({ userEmail }: VerifyEmailCardProps) {
	const [isResending, setIsResending] = useState(false);
	const [resendError, setResendError] = useState<string | null>(null);
	const [resendSent, setResendSent] = useState(false);

	const onResend = async () => {
		setIsResending(true);
		setResendError(null);
		try {
			const { error } = await authClient.sendVerificationEmail({
				callbackURL: "/dashboard",
				email: userEmail,
			});
			if (error) {
				setResendError(error.message ?? ERROR_MESSAGES.GENERIC);
			} else {
				setResendSent(true);
			}
		} catch {
			setResendError(ERROR_MESSAGES.GENERIC);
		} finally {
			setIsResending(false);
		}
	};

	return (
		<Card className="p-8 lg:p-12 shadow-2xl rounded-3xl w-full border-none">
			<Card.Content className="flex flex-col items-center gap-6 p-0">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-app-brand/10">
					<Mail className="h-8 w-8 text-app-brand" />
				</div>

				{resendError && (
					<div className="w-full bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 italic">
						{resendError}
					</div>
				)}

				{resendSent ? (
					<p className="text-sm font-bold text-app-brand">Verification email resent. Check your inbox.</p>
				) : (
					<p className="text-text-secondary font-medium text-sm max-w-xs text-center">
						Didn't receive it? Check your spam folder or resend the email.
					</p>
				)}

				{!resendSent && (
					<Button
						fullWidth
						isPending={isResending}
						onPress={onResend}
						variant="primary"
					>
						<RefreshCw className="h-4 w-4 mr-2" />
						{isResending ? "Sending..." : "Resend verification email"}
					</Button>
				)}
			</Card.Content>
		</Card>
	);
}
