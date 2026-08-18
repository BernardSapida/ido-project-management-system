import { AppList, type ChipTone, type ListItem } from "@bernardsapida/web-ui";
import { Card, Typography } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleMinus, CircleSlash } from "lucide-react";
import { getRoleLabel } from "@/config/navigation.config";
import type { ProfileUser } from "@/features/user-profile/types";
import { formatDate } from "@/utils/format";

interface AboutAccountProps {
	user: ProfileUser | null;
}

/** Status as a chip, because "suspended" is the one value on this card that
 *  changes what the account can do. The other two rows are facts. */
const STATUS_CHIPS: Record<string, { icon: LucideIcon; label: string; tone: ChipTone }> = {
	active: { icon: CircleCheck, label: "Active", tone: "success" },
	inactive: { icon: CircleMinus, label: "Inactive", tone: "warning" },
	suspended: { icon: CircleSlash, label: "Suspended", tone: "danger" },
};

/**
 * Role, status and member-since. Read-only, and deliberately so: every value
 * here is an admin's to change (spec 017), not the account holder's.
 */
export function AboutAccount({ user }: AboutAccountProps) {
	const status = STATUS_CHIPS[user?.status ?? "active"] ?? STATUS_CHIPS.active;

	const items: ListItem[] = [
		{ key: "role", meta: user ? getRoleLabel(user.role) : "—", primary: "Role" },
		{ chip: status, key: "status", primary: "Account status" },
		{ key: "joined", meta: user ? formatDate(user.createdAt, "MMMM DD, YYYY") : "—", primary: "Member since" },
	];

	return (
		<Card>
			<Card.Header>
				<Typography.Heading level={2}>About this account</Typography.Heading>
			</Card.Header>
			<Card.Content>
				<AppList
					isLoading={!user}
					items={items}
					label="About this account"
				/>
			</Card.Content>
		</Card>
	);
}
