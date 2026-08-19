import { AppAlert, AppButton, AppInputGroup, AppLogo, AppPasswordField, AppSelect } from "@bernardsapida/web-ui";
import { Card, Typography } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CircleAlert, Layout, Mail } from "lucide-react";
import { useState } from "react";
import { useUserAuthSignupMutations } from "@/features/auth-signup/hooks/use-user-auth-signup-mutations";
import { type SignUpFormData, SignUpSchema } from "@/features/auth-signup/validations/schema/sign-up.schema";
import { POSITION_OPTIONS } from "@/features/request-form/lib/request-options";
import { useAppForm } from "@/hooks/use-app-form";

export function SignUpForm() {
	const { signUp } = useUserAuthSignupMutations();
	const [formError, setFormError] = useState<string | null>(null);

	const { control, handleSubmit, setError, setFocus } = useAppForm<SignUpFormData>(SignUpSchema, {
		defaultValues: {
			confirmPassword: "",
			email: "",
			firstname: "",
			lastname: "",
			password: "",
			position: undefined,
		},
	});

	const onSubmit = (data: SignUpFormData) => {
		setFormError(null);

		signUp.mutate(data, {
			onError: (error) => {
				// A taken email is a fact about ONE field, so it belongs under that
				// field. The hook's toast still fires, but a toast the user has
				// scrolled past is not an error message - and this one has to be
				// readable while they edit the address it is about.
				if (error.data?.code === "CONFLICT") {
					setError("email", { type: "server", message: "An account with this email already exists." });
					setFocus("email");
					return;
				}

				setFormError(error.message);
			},
		});
	};

	return (
		<div className="w-full max-w-xl mb-24 rise-in text-center flex flex-col items-center">
			<div className="flex flex-col items-center mb-12">
				<AppLogo
					className="mb-8 hover:-translate-y-1 transition-transform"
					href="/"
					size="lg"
					wordmark={false}
				/>
				<Typography.Heading
					className="mb-3"
					level={1}
				>
					Create your account
				</Typography.Heading>
				<Typography
					color="muted"
					type="body"
				>
					File and track building design requests.
				</Typography>
			</div>

			<Card className="p-8 lg:p-12 shadow-2xl rounded-3xl w-full border-none text-left">
				<Card.Content className="flex flex-col gap-8 p-0">
					{formError && (
						<AppAlert
							description={formError}
							icon={CircleAlert}
							onClose={() => setFormError(null)}
							status="danger"
							title="We could not create your account"
						/>
					)}

					<form
						className="flex flex-col gap-6"
						onSubmit={handleSubmit(onSubmit)}
					>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<AppInputGroup
								autoComplete="given-name"
								control={control}
								isRequired
								label="First name"
								name="firstname"
								placeholder="Juan"
							/>
							<AppInputGroup
								autoComplete="family-name"
								control={control}
								isRequired
								label="Last name"
								name="lastname"
								placeholder="Dela Cruz"
							/>
						</div>

						<AppInputGroup
							autoComplete="email"
							control={control}
							isRequired
							label="Email"
							name="email"
							placeholder="you@tup.edu.ph"
							startContent={<Mail className="h-5 w-5 text-text-secondary/40" />}
							type="email"
						/>

						<AppSelect
							control={control}
							description="Printed on your request form, and it decides which representative line your signature signs."
							isRequired
							items={POSITION_OPTIONS}
							label="Position"
							name="position"
							placeholder="Select position"
						/>

						<AppPasswordField
							autoComplete="new-password"
							control={control}
							isRequired
							label="Password"
							name="password"
							placeholder="At least 8 characters"
						/>

						<AppPasswordField
							autoComplete="new-password"
							control={control}
							isRequired
							label="Confirm password"
							name="confirmPassword"
							placeholder="Re-enter your password"
						/>

						<div className="mt-2">
							<AppButton
								fullWidth
								isDisabled={signUp.isPending}
								isPending={signUp.isPending}
								size="lg"
								type="submit"
								variant="primary"
							>
								{signUp.isPending ? "Creating account..." : "Create account"}
							</AppButton>
						</div>
					</form>
				</Card.Content>
			</Card>

			<div className="mt-12 text-center flex flex-col items-center gap-6">
				<Typography
					color="muted"
					type="body"
				>
					Already have an account?{" "}
					<Link
						className="text-app-brand font-bold hover:underline"
						to="/sign-in"
					>
						Sign in
					</Link>
				</Typography>
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
