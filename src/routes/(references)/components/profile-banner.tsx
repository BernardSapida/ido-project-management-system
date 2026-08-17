import { AppGlassCard, AppPageHeader, AppProfileBanner, AppToast } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { seo } from "@/config/seo.config";

/**
 * Profile banner lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The pair at the top is the whole component. Read them side by side: the
 * unverified one has to be as loud as the verified one, because the failure
 * this design exists to prevent is a reader assuming that no badge means the
 * badge has not loaded yet.
 */
export const Route = createFileRoute("/(references)/components/profile-banner")({
	head: () => ({
		meta: [{ title: seo.title("Profile banner lab") }, { content: "noindex", name: "robots" }],
	}),
	component: ProfileBannerLabPage,
});

function ProfileBannerLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Who this person is, and whether anyone has checked."
				title="Profile banner lab"
			/>
			<VariantsSection />
			<UnverifiedSection />
			<ContentSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
}

function LabSection({ children, description, title }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

/** A banner in its own panel, at the width one really gets. */
function BannerFrame({ children }: { children: ReactNode }) {
	return <div className="rounded-3xl border border-border bg-surface p-4 sm:p-5">{children}</div>;
}

/* -------------------------------------------------------------------------- */

/** The two states, together, which is the only honest way to compare them. */
function VariantsSection() {
	return (
		<LabSection
			description="Verified is a green tick. Not verified is an amber chip that says so, plus a tinted surface - never the silent absence of the green one, because a missing badge reads as a badge that has not loaded. Both say it in words, a glyph and a colour, in that order of importance."
			title="Both variants"
		>
			<div className="grid gap-4 lg:grid-cols-2">
				<BannerFrame>
					<AppProfileBanner
						data-cy="verified"
						isVerified
						name="Dr. Maya Chen"
						subtitle="Logistics Coordinator · Northwind Freight"
					/>
				</BannerFrame>
				<BannerFrame>
					<AppProfileBanner
						action={{
							label: "Verify now",
							onPress: () =>
								AppToast.info("Verification started", {
									description: "The lab does not actually verify anything.",
									icon: ShieldCheck,
								}),
						}}
						data-cy="unverified-full"
						isVerified={false}
						name="Dr. Alex Rivera"
						subtitle="Dispatch Lead · Northside Depot"
						unverifiedNote="A permit photo is still outstanding."
					/>
				</BannerFrame>
			</div>
		</LabSection>
	);
}

/** Unverified is three things, and each one is optional except the chip. */
function UnverifiedSection() {
	return (
		<LabSection
			description="The note and the action are optional, the chip is not. Bare is what you get when there is nothing useful to say and nothing the reader can do about it - on someone else's profile, say. Give it a note when the reason is knowable, and an action only when this reader is the one who can clear it."
			title="Unverified, with less to say"
		>
			<div className="space-y-3">
				<BannerFrame>
					<AppProfileBanner
						data-cy="unverified-plain"
						isVerified={false}
						name="Dr. Alex Rivera"
						subtitle="Dispatch Lead · Northside Depot"
					/>
				</BannerFrame>
				<BannerFrame>
					<AppProfileBanner
						data-cy="unverified-note"
						isVerified={false}
						name="Dr. Alex Rivera"
						subtitle="Dispatch Lead · Northside Depot"
						unverifiedNote="Submitted 2 days ago. Nothing needed from you."
					/>
				</BannerFrame>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** The content that breaks the strip. */
function ContentSection() {
	return (
		<LabSection
			description="A name long enough to truncate beside a chip that must not shrink, a subtitle that runs past the edge, and a broken photo so the initials have to take over. At a phone's width the chip drops under the name rather than being cut to 'Not ver…' - the one word in it that must survive."
			title="Long content"
		>
			<div className="max-w-sm space-y-3">
				<BannerFrame>
					<AppProfileBanner
						avatarSrc="/assets/does-not-exist.png"
						data-cy="long-verified"
						isVerified
						name="Dr. Maria Concepcion Dela Cruz-Villanueva"
						subtitle="Regional Logistics Coordinator · Quezon City North Depot"
					/>
				</BannerFrame>
				<BannerFrame>
					<AppProfileBanner
						action={{
							label: "Verify",
							onPress: () =>
								AppToast.info("Verification started", {
									description: "The lab does not actually verify anything.",
									icon: ShieldCheck,
								}),
						}}
						data-cy="long-unverified"
						isVerified={false}
						name="Dr. Maria Concepcion Dela Cruz-Villanueva"
						subtitle="Regional Logistics Coordinator · Quezon City North Depot"
						unverifiedNote="A permit photo and one warehouse reference are still outstanding."
					/>
				</BannerFrame>
			</div>
		</LabSection>
	);
}
