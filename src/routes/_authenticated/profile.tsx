import { Skeleton } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedFn } from "@/features/auth/functions/auth.functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChangePasswordCard } from "@/features/user/components/ChangePasswordCard";
import { DeleteAccountCard } from "@/features/user/components/DeleteAccountCard";
import { UpdateProfileForm } from "@/features/user/components/UpdateProfileForm";
import { UserProfileCard } from "@/features/user/components/UserProfileCard";

export const Route = createFileRoute("/_authenticated/profile")({
	beforeLoad: async () => {
		return await assertAuthenticatedFn();
	},
	head: () => ({
		meta: [{ title: seo.title("Profile") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Profile",
	},
	component: ProfilePage,
});

function ProfilePage() {
	const { isPending: isAuthLoading, user } = useAuth();

	if (isAuthLoading && !user) {
		return (
			<div className="flex flex-col gap-12 max-w-4xl mx-auto py-12">
				<Skeleton className="h-12 w-64 rounded-xl" />
				<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
					<Skeleton className="h-96 w-full rounded-3xl" />
					<div className="md:col-span-2 space-y-6">
						<Skeleton className="h-64 w-full rounded-3xl" />
						<Skeleton className="h-48 w-full rounded-3xl" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-12">
			<div className="rise-in">
				<h1 className="text-4xl lg:text-5xl font-serif font-bold text-text-primary mb-3">Your Account</h1>
				<p className="text-lg text-text-secondary font-medium">
					Manage your personal information and account preferences.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
				<aside className="flex flex-col items-center gap-6 rise-in [animation-delay:100ms]">
					{user && <UserProfileCard user={user} />}
				</aside>

				<div className="md:col-span-2 flex flex-col gap-8">
					<UpdateProfileForm />
					<ChangePasswordCard />
					<DeleteAccountCard />
				</div>
			</div>
		</div>
	);
}
