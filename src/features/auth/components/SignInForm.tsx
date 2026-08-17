import { AppInputGroup } from "@bernardsapida/web-ui";
import { Button, Card, Checkbox, Label } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Layout, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/errors/error-messages";
import { authClient } from "@/features/auth/utils/auth-client";
import { useAppForm } from "@/hooks/use-app-form";

const signInSchema = z.object({
	email: z.string().min(1, "Email is required").email("Enter a valid email"),
	password: z.string().min(1, "Password is required").min(8, "At least 8 characters"),
});

type SignInInput = z.infer<typeof signInSchema>;

interface SignInFormProps {
	onSuccess: () => void;
}

export function SignInForm({ onSuccess }: SignInFormProps) {
	const [authError, setAuthError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { control, handleSubmit } = useAppForm<SignInInput>(signInSchema, {
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = async (data: SignInInput) => {
		setIsLoading(true);
		setAuthError(null);
		try {
			const { error: signInError } = await authClient.signIn.email({
				email: data.email,
				password: data.password,
			});
			if (signInError) {
				setAuthError(signInError.message ?? "Invalid credentials");
			} else {
				onSuccess();
			}
		} catch {
			setAuthError(ERROR_MESSAGES.GENERIC);
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
				<h1 className="text-4xl font-serif font-bold text-text-primary/90 mb-3 text-center">Welcome back</h1>
				<p className="text-text-secondary/70 font-medium text-center w-full">
					Log in to your account and continue building.
				</p>
			</div>

			<Card className="p-8 lg:p-12 shadow-2xl glass-card rounded-3xl w-full border-none text-left">
				<Card.Content className="flex flex-col gap-8 p-0 w-full">
					{authError && (
						<div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 italic">
							{authError}
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

						<div className="flex flex-col gap-2">
							<AppInputGroup
								control={control}
								label="Password"
								name="password"
								placeholder="••••••••"
								startContent={<Lock className="h-5 w-5 text-text-secondary/40" />}
								type="password"
							/>
							<div className="flex justify-end px-1">
								<Link
									className="text-[11px] font-black text-app-brand/60 hover:text-app-brand transition-colors uppercase tracking-widest"
									to="/forgot-password"
								>
									Forgot password?
								</Link>
							</div>
						</div>

						<div>
							<Checkbox name="remember">
								<Checkbox.Content>
									<Checkbox.Control className="border border-gray-700">
										<Checkbox.Indicator />
									</Checkbox.Control>
									<Label className="text-sm font-bold text-text-secondary/60">Remember device</Label>
								</Checkbox.Content>
							</Checkbox>
						</div>

						<div className="mt-2">
							<Button
								fullWidth
								isPending={isLoading}
								size="lg"
								type="submit"
								variant="primary"
							>
								{isLoading ? "Signing in..." : "Sign in to project"}
							</Button>
						</div>
					</form>
				</Card.Content>
			</Card>

			<div className="mt-12 text-center flex flex-col items-center gap-6">
				<p className="text-text-secondary font-medium">
					Don't have an account?{" "}
					<Link
						className="text-app-brand font-bold hover:underline"
						to="/sign-up"
					>
						Create an account
					</Link>
				</p>
				<Link
					className="text-sm font-bold text-text-secondary/70 flex items-center gap-2 group"
					to="/"
				>
					<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to home
				</Link>
			</div>
		</div>
	);
}
