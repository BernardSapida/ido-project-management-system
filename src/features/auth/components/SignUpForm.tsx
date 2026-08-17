import { AppInputGroup } from "@bernardsapida/web-ui";
import { Button, Card, Checkbox, Label } from "@heroui/react";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Layout, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/errors/error-messages";
import { authClient } from "@/features/auth/utils/auth-client";
import { useAppForm } from "@/hooks/use-app-form";

const signUpSchema = z.object({
	email: z.string().min(1, "Email is required").email("Enter a valid email"),
	firstname: z.string().min(1, "First name is required").min(2, "At least 2 characters"),
	lastname: z.string().min(1, "Last name is required").min(2, "At least 2 characters"),
	password: z.string().min(1, "Password is required").min(8, "At least 8 characters"),
});

type SignUpInput = z.infer<typeof signUpSchema>;

type SignUpPayload = {
	email: string;
	firstname: string;
	lastname: string;
	name: string;
	password: string;
	role: string;
};

export function SignUpForm() {
	const router = useRouter();
	const [authError, setAuthError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { control, handleSubmit } = useAppForm<SignUpInput>(signUpSchema, {
		defaultValues: { email: "", firstname: "", lastname: "", password: "" },
	});

	const onSubmit = async (data: SignUpInput) => {
		setIsLoading(true);
		setAuthError(null);
		try {
			const payload: SignUpPayload = {
				email: data.email,
				firstname: data.firstname,
				lastname: data.lastname,
				name: `${data.firstname} ${data.lastname}`,
				password: data.password,
				role: "USER",
			};
			const { error: signUpError } = await authClient.signUp.email(
				payload as Parameters<typeof authClient.signUp.email>[0],
			);
			if (signUpError) {
				setAuthError(signUpError.message ?? "Registration failed");
			} else {
				await router.navigate({ to: "/sign-in" });
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
				<h1 className="text-4xl font-serif font-bold text-text-primary/90 mb-3 text-center">Create account</h1>
				<p className="text-text-secondary/70 font-medium text-center">Join 5,000+ builders and start your journey.</p>
			</div>

			<Card className="p-8 lg:p-12 shadow-2xl rounded-3xl w-full border-none text-left">
				<Card.Content className="flex flex-col gap-8 p-0">
					{authError && (
						<div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 italic">
							{authError}
						</div>
					)}
					<form
						className="flex flex-col gap-6"
						onSubmit={handleSubmit(onSubmit)}
					>
						<div className="grid grid-cols-2 gap-4">
							<AppInputGroup
								control={control}
								label="First name"
								name="firstname"
								placeholder="Jane"
							/>
							<AppInputGroup
								control={control}
								label="Last name"
								name="lastname"
								placeholder="Doe"
							/>
						</div>

						<AppInputGroup
							control={control}
							label="Email address"
							name="email"
							placeholder="yours@example.com"
							startContent={<Mail className="h-5 w-5 text-text-secondary/40" />}
							type="email"
						/>

						<AppInputGroup
							control={control}
							label="Password"
							name="password"
							placeholder="••••••••"
							startContent={<Lock className="h-5 w-5 text-text-secondary/40" />}
							type="password"
						/>

						<div className="flex items-start gap-3 px-1 mt-2">
							<Checkbox name="terms">
								<Checkbox.Content>
									<Checkbox.Control>
										<Checkbox.Indicator />
									</Checkbox.Control>
									<Label className="text-sm font-bold text-text-secondary/60 leading-relaxed">
										I agree to the{" "}
										<Link
											className="text-app-brand font-black hover:underline"
											to="/"
										>
											Terms
										</Link>{" "}
										and{" "}
										<Link
											className="text-app-brand font-black hover:underline"
											to="/"
										>
											Privacy
										</Link>
										.
									</Label>
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
								{isLoading ? "Creating account..." : "Join project"}
							</Button>
						</div>
					</form>
				</Card.Content>
			</Card>

			<div className="mt-12 text-center flex flex-col items-center gap-6">
				<p className="text-text-secondary font-medium">
					Already have an account?{" "}
					<Link
						className="text-app-brand font-bold hover:underline"
						to="/sign-in"
					>
						Sign in
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
