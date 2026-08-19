import {
	filterNavItems,
	groupNavItems,
	isNavItemActive,
	splitForTabBar,
	TAB_BAR_MAX_SLOTS,
	type NavGroup as UiNavGroup,
	type NavItem as UiNavItem,
} from "@bernardsapida/web-ui";
import { FileText, LayoutDashboard, Star, UserCircle, Users } from "lucide-react";
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
		href: "/requests",
		title: "My Requests",
		description: "View and track your requests",
		icon: FileText,
		roles: ["USER"],
		exact: true,
	},
	{
		href: "/staff/dashboard",
		title: "Dashboard",
		description: "Review and process requests",
		icon: LayoutDashboard,
		roles: ["IDO_OFFICER", "IDO_CHAIRPERSON", "BUDGET_OFFICER", "DIRECTOR"],
	},
	{
		href: "/admin",
		title: "Accounts",
		description: "Manage user accounts",
		icon: Users,
		roles: ["ADMIN"],
		// `exact`, now that /admin has a second page under it. Without it the
		// prefix test lights Accounts up on /admin/csm as well, and two items are
		// active at once - which tells the reader neither of them is where they are.
		exact: true,
	},
	{
		href: "/admin/csm",
		title: "Satisfaction",
		description: "What requestors said about how their requests were handled",
		icon: Star,
		roles: ["ADMIN"],
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
	ADMIN: "/admin",
	USER: "/requests",
	IDO_OFFICER: "/staff/dashboard",
	IDO_CHAIRPERSON: "/staff/dashboard",
	BUDGET_OFFICER: "/staff/dashboard",
	DIRECTOR: "/staff/dashboard",
};

export const getDefaultRoute = (role: UserRole): string => DEFAULT_ROUTES[role];

// --- Secondary navigation ---
// Account and configuration: reached deliberately, not many times a day. It sits
// at the foot of the sidebar, above the user card.

export const secondaryNavigationItems: NavItem[] = [
	{
		href: "/profile",
		title: "Profile",
		description: "Your account and preferences",
		icon: UserCircle,
		roles: ["USER", "ADMIN", "IDO_OFFICER", "IDO_CHAIRPERSON", "BUDGET_OFFICER", "DIRECTOR"],
	},
];

export const getSecondaryNavigation = (role: UserRole): NavItem[] =>
	secondaryNavigationItems.filter((item) => item.roles.includes(role));

// --- Helper: the label under the wordmark in the sidebar ---

// What the person IS, not what the enum says. "Campus Director" is a job;
// "DIRECTOR" is a database value, and nobody reads their own title in caps.
const ROLE_LABELS: Record<UserRole, string> = {
	ADMIN: "Administrator",
	USER: "Requestor",
	IDO_OFFICER: "IDO Officer",
	IDO_CHAIRPERSON: "IDO Chairperson",
	BUDGET_OFFICER: "Budget Officer",
	DIRECTOR: "Campus Director",
};

export const getRoleLabel = (role: UserRole): string => ROLE_LABELS[role];
