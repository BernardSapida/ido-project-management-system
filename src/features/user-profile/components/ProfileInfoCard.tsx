import { AppChip, AppProfileBanner } from "@bernardsapida/web-ui";
import { Skeleton } from "@heroui/react";
import { BriefcaseBusiness } from "lucide-react";
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

	return (
		<div className="flex flex-col gap-3">
			<AppProfileBanner
				isVerified={user.profileComplete}
				name={user.name}
				subtitle={`${getRoleLabel(user.role)} · ${user.email}`}
				unverifiedNote="No signature on file yet — add one below."
			/>

			{user.position ? (
				<AppChip
					icon={BriefcaseBusiness}
					label={positionLabel(user.position)}
					size="sm"
					tone="accent"
				/>
			) : null}
		</div>
	);
}
