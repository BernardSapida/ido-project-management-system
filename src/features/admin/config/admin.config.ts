/**
 * Maps user account statuses to semantic HeroUI and Tailwind color tokens.
 */
export const ADMIN_STATUS_MAPPINGS = {
	active: {
		dot: "bg-green-500",
		chip: "bg-green-100 text-green-700",
		label: "Active",
	},
	suspended: {
		dot: "bg-red-500",
		chip: "bg-red-100 text-red-700",
		label: "Suspended",
	},
	pending: {
		dot: "bg-amber-500",
		chip: "bg-amber-100 text-amber-700",
		label: "Pending Verification",
	},
} as const;

export type UserStatus = keyof typeof ADMIN_STATUS_MAPPINGS;

export const ADMIN_DASHBOARD_CONFIG = {
	itemsPerPage: 20,
	defaultSort: { column: "createdAt", direction: "desc" },
} as const;
