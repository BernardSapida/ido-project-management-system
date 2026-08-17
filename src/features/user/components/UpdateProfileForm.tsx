import { AppInputGroup } from "@bernardsapida/web-ui";
import { Button, Card, Input, Label, TextField } from "@heroui/react";
import { Check, Mail, User } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUserProfileMutations } from "@/features/user/hooks/use-user-profile-mutations";
import { type UpdateProfileInput, UpdateProfileSchema } from "@/features/user/validations/schema/update-profile.schema";
import { useAppForm } from "@/hooks/use-app-form";

export function UpdateProfileForm() {
	const { user } = useAuth();
	const { updateProfile } = useUserProfileMutations();

	const {
		control,
		formState: { isDirty },
		handleSubmit,
	} = useAppForm<UpdateProfileInput>(UpdateProfileSchema, {
		defaultValues: { firstname: "", lastname: "" },
		// The edit-form pattern: RHF resets when `values` changes, so the record
		// lands in the fields as soon as the session resolves. `defaultValues` is
		// still required — `values` is undefined until then, and the fields have to
		// be controlled before the first render.
		values: user && { firstname: user.firstname || "", lastname: user.lastname || "" },
	});

	const onSubmit = (data: UpdateProfileInput) => {
		updateProfile.mutate(data);
	};

	return (
		<Card className="p-8 lg:p-10 border-none shadow-none rise-in [animation-delay:200ms]">
			<Card.Content className="p-0 space-y-8 text-left">
				<div className="flex items-center gap-4 text-app-brand">
					<User size={24} />
					<h2 className="text-2xl font-serif font-bold">Personal Profile</h2>
				</div>

				<form
					className="space-y-8"
					onSubmit={handleSubmit(onSubmit)}
				>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
						<AppInputGroup
							control={control}
							label="First Name"
							name="firstname"
							placeholder="Jane"
						/>
						<AppInputGroup
							control={control}
							label="Last Name"
							name="lastname"
							placeholder="Doe"
						/>
					</div>

					<div className="flex flex-col gap-2 opacity-70">
						<Label className="font-bold text-text-primary/80 ml-1 text-sm leading-none">Registered Email</Label>
						<div className="relative">
							<div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary/40">
								<Mail size={18} />
							</div>
							<TextField
								className="w-full"
								isDisabled
								isReadOnly
								value={user?.email ?? ""}
							>
								<Input className="pl-12" />
							</TextField>
						</div>
						<p className="text-[10px] text-text-secondary/50 ml-1">
							Email addresses are immutable and used for authentication.
						</p>
					</div>

					<div className="pt-8 flex justify-end">
						<Button
							isDisabled={!isDirty}
							isPending={updateProfile.isPending}
							size="lg"
							type="submit"
							variant="primary"
						>
							{updateProfile.isSuccess ? (
								<>
									<Check size={20} />
									Saved Changes
								</>
							) : (
								"Update Profile"
							)}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card>
	);
}
