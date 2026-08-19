import { AppProfileBanner } from "@bernardsapida/web-ui";
import { Skeleton } from "@heroui/react";
import { getRoleLabel } from "@/config/navigation.config";
import { positionLabel } from "@/features/request-form/lib/request-options";
import type { ProfileUser } from "@/features/user-profile/types";

interface ProfileInfoCardProps {
	isLoading: boolean;
	user: ProfileUser | null;
}

/**
 * Who this account is, at the top of the page.
 *
 * `AppProfileBanner` replaces the old hand-built header block, and its
 * `isVerified` is `profileComplete` — the same flag the route gate reads, rather
 * than a green tick this component decided to draw. HeroUI's `Skeleton` covers
 * the load: there is no lab component for a shape this specific to one banner.
 */
export function ProfileInfoCard({ isLoading, user }: ProfileInfoCardProps) {
	if (isLoading || !user) {
		return (
			<div className="flex items-center gap-4">
				<Skeleton className="size-16 shrink-0 rounded-full" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-6 w-48 rounded-lg" />
					<Skeleton className="h-4 w-64 rounded-lg" />
				</div>
			</div>
		);
	}

	/*
	 * Role, designation and email on the banner's own subtitle line.
	 *
	 * The designation used to be a chip rendered UNDER the banner, which read as
	 * a stray label floating beside the strip rather than as a fact about the
	 * person inside it — the tint, the border and the avatar all stopped one line
	 * above it. `AppProfileBanner` has no slot to put a chip in, and giving it one
	 * would be a change to a published component for a single page, so the fact
	 * goes where the other facts about this person already are.
	 */
	const subtitle = [getRoleLabel(user.role), user.position ? positionLabel(user.position) : null, user.email]
		.filter((part): part is string => Boolean(part))
		.join(" · ");

	return (
		<AppProfileBanner
			isVerified={user.profileComplete}
			name={user.name}
			subtitle={subtitle}
			unverifiedNote="No signature on file yet — add one below."
		/>
	);
}
