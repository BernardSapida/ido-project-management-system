import { AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { Card, Separator, Typography } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getDefaultRoute } from "@/config/navigation.config";
import { seo } from "@/config/seo.config";
import { ChangePasswordCard } from "@/features/user/components/ChangePasswordCard";
import { AboutAccount } from "@/features/user-profile/components/AboutAccount";
import { ProfileForm } from "@/features/user-profile/components/ProfileForm";
import { ProfileInfoCard } from "@/features/user-profile/components/ProfileInfoCard";
import { SignatureCard } from "@/features/user-profile/components/SignatureCard";
import { useUserProfileQueries } from "@/features/user-profile/hooks/use-user-profile-queries";
import type { ProfileDetailsValues } from "@/features/user-profile/validations/schema/update-profile.schema";

export const Route = createFileRoute("/_authenticated/profile")({
	/*
	 * No `beforeLoad` of its own. `_authenticated` already asserts the session and
	 * is where the profileComplete gate lives — and this is the one route that
	 * gate must EXEMPT, so a second copy here would only be a place for the two to
	 * disagree.
	 */
	head: () => ({
		meta: [{ title: seo.title("Profile") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Profile",
	},
	component: ProfilePage,
});

const SETUP_HEADER = {
	subtitle: "Save your details, then add your signature. Your signature is stamped onto the printed request form.",
	title: "Complete your profile",
};

const NORMAL_HEADER = {
	subtitle: "Your account, position and signature.",
	title: "Profile",
};

/**
 * The profile page: three sections, three buttons.
 *
 * Each card saves only what it holds — details, signature, password. The page
 * owns none of that; it owns the layout, the setup wording, and the one thing
 * that spans the cards, which is the redirect out of setup once a signature
 * exists.
 */
function ProfilePage() {
	const navigate = useNavigate();
	const { profile } = useUserProfileQueries();

	/**
	 * Whether this visit STARTED incomplete, captured once.
	 *
	 * Read live it would flip to false the moment the save lands — taking the
	 * redirect that is supposed to follow the save with it — and the header would
	 * change wording underneath somebody mid-form.
	 */
	const [startedIncomplete, setStartedIncomplete] = useState<boolean | null>(null);
	const record = profile.data ?? null;

	useEffect(() => {
		if (record && startedIncomplete === null) setStartedIncomplete(!record.profileComplete);
	}, [record, startedIncomplete]);

	const isSetup = startedIncomplete === true;

	const values: ProfileDetailsValues | undefined = record
		? { name: record.name, position: record.position }
		: undefined;

	// Only the signature can end setup: `profileComplete` IS "has a signature",
	// so saving the details alone leaves the user exactly where they were.
	const handleSignatureSaved = (savedUrl: string | null) => {
		if (isSetup && record && savedUrl) {
			navigate({ to: getDefaultRoute(record.role) });
		}
	};

	if (profile.isError) {
		return (
			<AppQueryError
				error={profile.error}
				onRetry={() => void profile.refetch()}
			/>
		);
	}

	const header = isSetup ? SETUP_HEADER : NORMAL_HEADER;

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				subtitle={header.subtitle}
				title={header.title}
			/>

			{isSetup ? null : (
				<ProfileInfoCard
					isLoading={profile.isPending}
					user={record}
				/>
			)}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<Card className="h-max lg:col-span-2">
					<Card.Header>
						<Typography.Heading level={2}>Personal information</Typography.Heading>
					</Card.Header>

					<Card.Content className="space-y-8">
						<ProfileForm
							email={record?.email}
							role={record?.role}
							values={values}
						/>

						{/* One thing at a time: during setup the only question on this page
						    is the signature, and a password field beside it is a second
						    task nobody asked for yet. */}
						{isSetup ? null : (
							<>
								<Separator />
								<ChangePasswordCard />
							</>
						)}
					</Card.Content>
				</Card>

				<div className="flex flex-col gap-6">
					<SignatureCard
						onSaved={handleSignatureSaved}
						user={record}
					/>

					<AboutAccount user={record} />
				</div>
			</div>
		</div>
	);
}
