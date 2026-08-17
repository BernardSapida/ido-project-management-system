import {
	filterNavItems,
	groupNavItems,
	isNavItemActive,
	splitForTabBar,
	TAB_BAR_MAX_SLOTS,
	type NavGroup as UiNavGroup,
	type NavItem as UiNavItem,
} from "@bernardsapida/web-ui";
import { LayoutDashboard, Settings, ShieldCheck, UserCircle, Users } from "lucide-react";
import type { UserRole } from "@/utils/config";

// --- Types ---
// The SHAPE and the pure helpers live in the component package - the nav
// components are published and cannot import this file. The ITEMS below stay
// here: they are this project's own, and the only part a fork rewrites.
//
// Bound to UserRole here so role names stay typechecked; the package leaves the
// role generic so it need not depend on this project's auth types.

export type NavItem = UiNavItem<UserRole>;
export type NavGroup = UiNavGroup<UserRole>;

export { filterNavItems, groupNavItems, isNavItemActive, splitForTabBar, TAB_BAR_MAX_SLOTS };

// --- Navigation items ---
// roles: list every role that can see this item.
// Different roles can share the same href — just include all of them in roles[].
// For submenu items, roles are checked independently per child.

export const navigationItems: NavItem[] = [
	{
		href: "/dashboard",
		title: "Dashboard",
		description: "Overview and summary",
		icon: LayoutDashboard,
		roles: ["ADMIN", "USER"],
		exact: true,
	},
	{
		href: "/dashboard/admin",
		title: "Admin",
		description: "Admin controls and settings",
		icon: ShieldCheck,
		roles: ["ADMIN"],
		children: [
			{
				href: "/dashboard/admin/users",
				title: "Users",
				description: "Manage user accounts",
				icon: Users,
				roles: ["ADMIN"],
			},
			{
				href: "/dashboard/admin/settings",
				title: "Settings",
				description: "App-wide configuration",
				icon: Settings,
				roles: ["ADMIN"],
			},
		],
	},
	{
		href: "/profile",
		title: "Profile",
		description: "Your account and preferences",
		icon: UserCircle,
		roles: ["ADMIN", "USER"],
	},
];

// --- Helper: filter items by role ---
// Pass the current user's role to get their visible menu.
// Recursively filters children too — a child hidden from a role
// will not appear even if the parent is visible.

export const getNavigation = (role: UserRole): NavItem[] => {
	const filterItems = (items: NavItem[]): NavItem[] =>
		items
			.filter((item) => item.roles.includes(role))
			.map((item) => ({
				...item,
				children: item.children ? filterItems(item.children) : undefined,
			}));

	return filterItems(navigationItems);
};

// --- Helper: get default route for a role ---
// Used after login, signup, and as fallback on not-found pages.

const DEFAULT_ROUTES: Record<UserRole, string> = {
	ADMIN: "/dashboard/admin",
	USER: "/dashboard",
};

export const getDefaultRoute = (role: UserRole): string => DEFAULT_ROUTES[role];

// --- Secondary navigation ---
// Account and configuration: reached deliberately, not many times a day. It sits
// at the foot of the sidebar, above the user card.

export const secondaryNavigationItems: NavItem[] = [
	{
		href: "/dashboard/profile",
		title: "Profile",
		description: "Your account and preferences",
		icon: UserCircle,
		roles: ["USER", "ADMIN"],
	},
];

export const getSecondaryNavigation = (role: UserRole): NavItem[] =>
	secondaryNavigationItems.filter((item) => item.roles.includes(role));

// --- Helper: the label under the wordmark in the sidebar ---

const ROLE_LABELS: Record<UserRole, string> = {
	ADMIN: "Admin",
	USER: "User",
};

export const getRoleLabel = (role: UserRole): string => ROLE_LABELS[role];
