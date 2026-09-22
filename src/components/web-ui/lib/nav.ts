import type { LucideIcon } from "lucide-react";

/**
 * A destination in the app's navigation.
 *
 * Generic over the ROLE type, and that is the whole reason this shape can live in
 * a published package: the app's roles come from `@app/shared-schemas`, which is
 * a private workspace package no external consumer could install. A project
 * aliases it once - `type NavItem = UiNavItem<UserRole>` - and keeps full type
 * safety on its own role names, while the package stays dependency-free.
 *
 * The ITEMS are always the project's own. Only the shape and the pure helpers
 * below travel.
 */
export interface NavItem<TRole extends string = string> {
	href: string;
	title: string;
	description: string;
	icon: LucideIcon;
	roles: TRole[];
	/** Match `href` exactly for active state. Default: prefix match. */
	exact?: boolean;
	/** Submenu items - they inherit the parent's roles if not given their own. */
	children?: NavItem<TRole>[];
	/**
	 * The sidebar heading this item sits under - "Dashboard", "Reports". Items
	 * sharing one render under a single label, in the order the sections first
	 * appear; items with none render first, unlabelled.
	 *
	 * Grouping is what lets a nav be GRASPED rather than read, so it earns its
	 * row from about six destinations up. Under that, leave it unset: a heading
	 * over one item is a label for nothing, and the collapsed rail still spends
	 * a gap on it.
	 *
	 * Keep a section's items CONTIGUOUS in the array. Interleaving them still
	 * groups correctly, but the rendered order then differs from the order
	 * written, which is the sort of surprise nobody looks for.
	 */
	section?: string;
	/**
	 * Shown under the label in the mobile "More" sheet and the drawer, where
	 * there is room for it. Defaults to `description`; set this when the
	 * description is written for a tooltip and reads oddly as a subtitle.
	 */
	subtitle?: string;
}

/** A labelled run of nav items. `label` absent = the leading, unlabelled block. */
export interface NavGroup<TRole extends string = string> {
	items: NavItem<TRole>[];
	label?: string;
}

/**
 * Is this the item the user is on?
 *
 * Derived from the pathname by prefix, never set by the screen being rendered. A
 * user three levels inside a section still has that section lit; a nav that goes
 * dark on a detail page tells them they have left the app.
 *
 * `exact` exists for the section roots - /admin lights up on /admin/profile
 * otherwise, and then two items are lit at once. The prefix test appends the
 * slash on purpose: without it /profile would light up on /profile-settings.
 */
export const isNavItemActive = <TRole extends string>(item: NavItem<TRole>, pathname: string): boolean => {
	const selfActive = item.exact
		? pathname === item.href
		: pathname === item.href || pathname.startsWith(`${item.href}/`);

	return selfActive || (item.children?.some((child) => isNavItemActive(child, pathname)) ?? false);
};

/**
 * Split a menu into its labelled sections.
 *
 * Grouping upgrades a flat column of links into something the eye can grasp
 * instead of read. One pass, first-appearance order - a section does not get
 * promoted because its name sorts earlier.
 *
 * A menu with no sections comes back as ONE unlabelled group, which is what makes
 * this safe to call on every nav: the sidebar renders the label only when there
 * is one, so an ungrouped config looks exactly as it did before.
 */
export const groupNavItems = <TRole extends string>(items: NavItem<TRole>[]): NavGroup<TRole>[] => {
	const groups: NavGroup<TRole>[] = [];

	for (const item of items) {
		const existing = groups.find((group) => group.label === item.section);
		if (existing) {
			existing.items.push(item);
			continue;
		}
		groups.push({ items: [item], label: item.section });
	}

	return groups;
};

const matchesQuery = <TRole extends string>(item: NavItem<TRole>, needle: string): boolean =>
	`${item.title} ${item.description} ${item.section ?? ""}`.toLowerCase().includes(needle);

/**
 * Filter a menu by a typed query.
 *
 * Backs the sidebar's search field. Matches the title, the description and the
 * section, because a user typing "billing" is as likely to be reaching for the
 * section as for one item inside it.
 *
 * A parent survives if it matches OR if one of its children does - and when only
 * a child matched, the parent comes back carrying just the matching children, so
 * the result is the answer rather than the answer plus its siblings.
 */
export const filterNavItems = <TRole extends string>(items: NavItem<TRole>[], query: string): NavItem<TRole>[] => {
	const needle = query.trim().toLowerCase();
	if (!needle) return items;

	return items.flatMap((item) => {
		if (matchesQuery(item, needle)) return [item];

		const children = item.children?.filter((child) => matchesQuery(child, needle)) ?? [];
		return children.length > 0 ? [{ ...item, children }] : [];
	});
};

/**
 * A phone bar has to be parsed in under a second with every tap one finger away,
 * and five is where that stops being true. Past five the last slot becomes "More"
 * and opens a sheet holding the rest - never a sixth tab, and never a bar that
 * scrolls sideways, because a destination you have to scroll to find is not a
 * top-level destination.
 */
export const TAB_BAR_MAX_SLOTS = 5;

export interface TabBarSplit<TRole extends string = string> {
	/** Rendered as tabs, in order. Never longer than TAB_BAR_MAX_SLOTS. */
	tabs: NavItem<TRole>[];
	/** Everything else, shown in the More sheet. Empty when everything fits. */
	overflow: NavItem<TRole>[];
}

export const splitForTabBar = <TRole extends string>(items: NavItem<TRole>[]): TabBarSplit<TRole> => {
	if (items.length <= TAB_BAR_MAX_SLOTS) {
		return { tabs: items, overflow: [] };
	}

	// One slot is spent on More itself, so only four destinations remain.
	return {
		tabs: items.slice(0, TAB_BAR_MAX_SLOTS - 1),
		overflow: items.slice(TAB_BAR_MAX_SLOTS - 1),
	};
};
