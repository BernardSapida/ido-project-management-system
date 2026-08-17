import type { SiteHeaderAction, SiteNavItem, SiteNavLink } from "@bernardsapida/web-ui";
import {
	AppButton,
	AppGlassCard,
	AppMobileBar,
	AppMobileDrawer,
	AppPageHeader,
	AppSidebar,
	AppSiteHeader,
	AppTabBar,
	AppToast,
	type NavItem as UiNavItem,
} from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	Bell,
	Building2,
	Footprints,
	GitCommitHorizontal,
	Github,
	List as ListIcon,
	LogOut,
	Megaphone,
	MessageSquare,
	Palette,
	PanelRight,
	SquareStack,
	Table as TableIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { NavItem } from "@/config/navigation.config";
import {
	getNavigation,
	getRoleLabel,
	getSecondaryNavigation,
	isNavItemActive,
	splitForTabBar,
} from "@/config/navigation.config";
import { seo } from "@/config/seo.config";
import { cn } from "@/utils/cn";
import type { UserRole } from "@/utils/config";

/**
 * Navigation lab. Developer reference under /components, which owns the
 * backdrop and its own nav; every page there is noindex.
 *
 * Everything on this page is the REAL nav, rendered from the real
 * navigation.config.ts, with two things changed: the specimens are pinned
 * inside fake device frames instead of the viewport, and their links call
 * preventDefault so a specimen cannot navigate this page away. Active state is
 * driven by the pathname buttons above each frame, which is exactly how the
 * shell drives it - by pathname, never by the screen setting its own tab.
 *
 * The three things worth checking here:
 *
 * 1. Pick a deep path. The section stays lit. A nav that goes dark on a detail
 *    screen tells the user they have left the app.
 * 2. Switch role. The sidebar and the tab bar change together, because they are
 *    two renderings of one array - there is no second list to forget.
 * 3. Count the tabs. Never more than five, and the fifth is More the moment a
 *    role has more than five destinations. The template ships one destination
 *    per role, so switch Destinations to Crowded to see it - and to see a
 *    section expand its children in place, which one destination also cannot
 *    show.
 * 4. Switch Identity to the long one. The sidebar must not get wider.
 *
 * The page deliberately breaks one rule it documents: the app ships ONE nav in
 * the DOM at a time, and this page has three at once. Their landmarks are
 * renamed (navLabel) so a screen reader gets "Sidebar specimen" rather than a
 * third thing called "Main".
 */
export const Route = createFileRoute("/(references)/components/navigation")({
	head: () => ({
		meta: [{ title: seo.title("Navigation lab") }, { content: "noindex", name: "robots" }],
	}),
	component: NavigationLabPage,
});

const DEMO_USER = {
	email: "maria.delacruz@example.com",
	name: "Maria Dela Cruz",
};

/**
 * The overflow case for the user card. A 260px sidebar has to survive a name
 * and an address that do not fit: both truncate to one line, and neither is
 * allowed to widen the column and take the shell grid with it.
 */
const LONG_USER = {
	email: "maria.concepcion.delacruz-santos@a-very-long-department.example.gov.ph",
	name: "Maria Concepción Dela Cruz-Santos Villanueva",
};

/**
 * Every role the template ships. A project that adds one adds it here too -
 * this lab is the only place the per-role menus can be compared side by side
 * without signing in as each of them in turn.
 */
const ROLES: { label: string; value: UserRole }[] = [
	{ label: "User", value: "USER" },
	{ label: "Admin", value: "ADMIN" },
];

/**
 * Paths worth landing on, including ones several levels deep - the point of the
 * lab is that a detail page keeps its section lit, so the deep paths are the
 * interesting rows. They do not all have to be real routes; `isNavItemActive`
 * is a pure function of the pathname.
 */
const PATHS: Record<UserRole, { href: string; label: string }[]> = {
	ADMIN: [
		{ href: "/admin", label: "/admin" },
		{ href: "/admin/profile", label: "/admin/profile" },
		{ href: "/admin/users/42", label: "…/users/42" },
		{ href: "/admin/users/42/sessions", label: "…/42/sessions" },
	],
	USER: [
		{ href: "/dashboard", label: "/dashboard" },
		{ href: "/profile", label: "/profile" },
		{ href: "/profile/security", label: "/profile/security" },
		{ href: "/dashboard/reports/7", label: "…/reports/7" },
	],
};

/**
 * A menu the template does not ship, because the template ships one
 * destination per role - and one destination cannot show the two rules this
 * page spends most of its words on: the five-slot ceiling with More in the
 * fifth, and a section that expands its children in place.
 *
 * The hrefs are REAL routes on purpose. TanStack renders `href=""` for a `to`
 * it does not recognise, which is a link that looks right and goes nowhere -
 * exactly the silent failure this lab exists to make visible, so the demo menu
 * must not be the thing that introduces it.
 */
const CROWDED_NAV: NavItem[] = [
	{
		description: "Rows of things, and what an empty one says",
		href: "/components/list",
		icon: ListIcon,
		roles: ["ADMIN", "USER"],
		section: "Records",
		title: "List",
	},
	{
		description: "Sorting, paging and column choice",
		href: "/components/table",
		icon: TableIcon,
		roles: ["ADMIN", "USER"],
		section: "Records",
		title: "Table",
	},
	{
		// The nested one. A section holding the current page opens itself, and
		// stays open until the reader disagrees with it.
		children: [
			{
				description: "A decision that blocks the page",
				href: "/components/dialog",
				icon: MessageSquare,
				roles: ["ADMIN", "USER"],
				title: "Dialog",
			},
			{
				description: "A form in a box over the page",
				href: "/components/modal",
				icon: SquareStack,
				roles: ["ADMIN", "USER"],
				title: "Modal",
			},
		],
		description: "Transient messages and where they stack",
		href: "/components/toaster",
		icon: Bell,
		roles: ["ADMIN", "USER"],
		section: "Overlays",
		title: "Toaster",
	},
	{
		description: "A panel off the edge of the screen",
		href: "/components/drawer",
		icon: PanelRight,
		roles: ["ADMIN", "USER"],
		section: "Overlays",
		title: "Drawer",
	},
	// Everything from here is past the fourth slot, so it lives behind More.
	{
		description: "Page-level messages that stay put",
		href: "/components/banner",
		icon: Megaphone,
		roles: ["ADMIN", "USER"],
		section: "Flow",
		title: "Banner",
	},
	{
		description: "A sequence with a state per step",
		href: "/components/stepper",
		icon: Footprints,
		roles: ["ADMIN", "USER"],
		section: "Flow",
		title: "Stepper",
	},
	{
		description: "What happened, in the order it happened",
		href: "/components/timeline",
		icon: GitCommitHorizontal,
		roles: ["ADMIN", "USER"],
		section: "Flow",
		title: "Timeline",
	},
];

/**
 * Pathnames worth landing on with the crowded menu: a section root, a record
 * three levels inside one, a destination that lives behind More, and a CHILD -
 * whose parent has to light up with it.
 */
const CROWDED_PATHS: { href: string; label: string }[] = [
	{ href: "/components/list", label: "/list" },
	{ href: "/components/table/orders/42", label: "…/table/orders/42" },
	{ href: "/components/timeline", label: "/timeline (More)" },
	{ href: "/components/dialog", label: "/dialog (child)" },
];

function NavigationLabPage() {
	const [role, setRole] = useState<UserRole>("USER");
	const [isCrowded, setIsCrowded] = useState(false);
	const [hasLongIdentity, setHasLongIdentity] = useState(false);
	const [activeHref, setActiveHref] = useState("/dashboard");

	// The crowded menu replaces the DESTINATIONS only. Account and settings are
	// a different question, and the role still answers it.
	const navigation = isCrowded ? CROWDED_NAV : getNavigation(role);
	const secondaryNavigation = getSecondaryNavigation(role);
	const roleLabel = getRoleLabel(role);
	const paths = isCrowded ? CROWDED_PATHS : PATHS[role];
	const user = hasLongIdentity ? LONG_USER : DEMO_USER;

	const onRoleChange = (next: UserRole) => {
		setRole(next);
		if (!isCrowded) setActiveHref(PATHS[next][0].href);
	};

	// Switching menus has to move the pathname with it, or every specimen opens
	// on a path none of its items can match and the whole page reads as dark.
	const onCrowdedChange = (next: boolean) => {
		setIsCrowded(next);
		setActiveHref(next ? CROWDED_PATHS[0].href : PATHS[role][0].href);
	};

	// Every specimen link goes through this: stop the navigation, move the
	// pathname the specimens read. The nav components never mutate it themselves
	// - they are told where the user is.
	const onNavigate: (item: UiNavItem, event: { preventDefault: () => void }) => void = (item, event) => {
		event.preventDefault();
		setActiveHref(item.href);
	};

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Bottom tabs on a phone, a persistent sidebar on a desktop, and a rail in between - all one destination list. Plus the site header, which is the one nav here that is not."
				title="Navigation lab"
			/>

			<AppGlassCard>
				<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
					<div>
						<h2 className="text-lg font-semibold">The controls</h2>
						<p className="mt-1 text-sm text-muted">
							Both specimens below read this role and this pathname. Change either and watch them agree - that is the
							point of one config array rendered twice rather than two hand-written lists.
						</p>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-semibold tracking-wide text-muted uppercase">Role</p>
						<div className="flex flex-wrap gap-2">
							{ROLES.map((option) => (
								<AppButton
									data-cy={`role-${option.value}`}
									key={option.value}
									onPress={() => onRoleChange(option.value)}
									size="sm"
									variant={role === option.value ? "primary" : "secondary"}
								>
									{option.label}
								</AppButton>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-semibold tracking-wide text-muted uppercase">Destinations</p>
						<div className="flex flex-wrap gap-2">
							<AppButton
								data-cy="destinations-real"
								onPress={() => onCrowdedChange(false)}
								size="sm"
								variant={isCrowded ? "secondary" : "primary"}
							>
								Real ({getNavigation(role).length})
							</AppButton>
							<AppButton
								data-cy="destinations-crowded"
								onPress={() => onCrowdedChange(true)}
								size="sm"
								variant={isCrowded ? "primary" : "secondary"}
							>
								Crowded ({CROWDED_NAV.length})
							</AppButton>
						</div>
						<p className="text-sm text-muted">
							The template ships one destination per role, which is a menu with nothing to say about the two rules
							below: the fifth tab becoming More, and a section expanding its children in place. Crowded is a demo menu
							pointing at real component routes so both are visible.
						</p>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-semibold tracking-wide text-muted uppercase">Identity</p>
						<div className="flex flex-wrap gap-2">
							<AppButton
								data-cy="identity-short"
								onPress={() => setHasLongIdentity(false)}
								size="sm"
								variant={hasLongIdentity ? "secondary" : "primary"}
							>
								Ordinary
							</AppButton>
							<AppButton
								data-cy="identity-long"
								onPress={() => setHasLongIdentity(true)}
								size="sm"
								variant={hasLongIdentity ? "primary" : "secondary"}
							>
								Long name and address
							</AppButton>
						</div>
						<p className="text-sm text-muted">
							Both truncate to one line. Neither is allowed to widen the sidebar - a column that grows with an email
							address takes the page beside it with it.
						</p>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-semibold tracking-wide text-muted uppercase">Pathname</p>
						<div className="flex flex-wrap gap-2">
							{paths.map((path) => (
								<AppButton
									data-cy={`path-${path.href}`}
									key={path.href}
									onPress={() => setActiveHref(path.href)}
									size="sm"
									variant={activeHref === path.href ? "primary" : "secondary"}
								>
									{path.label}
								</AppButton>
							))}
						</div>
						<p className="text-sm text-muted">
							The two three-level paths are the ones to check. Active state is derived by PREFIX, so a user inside a
							record still has the section lit; only the section roots are matched exactly, or a dashboard would stay
							lit on every page under it.
						</p>
					</div>
				</AppGlassCard.Content>
			</AppGlassCard>

			<DesktopSection
				activeHref={activeHref}
				navigation={navigation}
				onAccountSelect={(item) => setActiveHref(item.href)}
				onNavigate={onNavigate}
				roleLabel={roleLabel}
				secondaryNavigation={secondaryNavigation}
				user={user}
			/>

			<MobileSection
				activeHref={activeHref}
				navigation={navigation}
				onAccountSelect={(item) => setActiveHref(item.href)}
				onNavigate={onNavigate}
				roleLabel={roleLabel}
				secondaryNavigation={secondaryNavigation}
				user={user}
			/>

			<SiteHeaderSection />

			<SplitSection navigation={navigation} />

			<RulesSection />
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

interface SpecimenProps {
	activeHref: string;
	navigation: NavItem[];
	/** Account rows are menu ACTIONS, not links - no anchor, so no event. */
	onAccountSelect: (item: UiNavItem) => void;
	onNavigate: (item: UiNavItem, event: { preventDefault: () => void }) => void;
	roleLabel: string;
	secondaryNavigation: NavItem[];
	user: { email: string; name: string };
}

/* -------------------------------------------------------------------------- */

/**
 * Desktop and tablet: the same component at two widths. The toggle here is the
 * user's own click; below `lg` the shell forces the rail and withdraws the
 * button, which is why this specimen has one and a real tablet does not.
 */
function DesktopSection({
	activeHref,
	navigation,
	onAccountSelect,
	onNavigate,
	roleLabel,
	secondaryNavigation,
	user,
}: SpecimenProps) {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [surface, setSurface] = useState<"flush" | "floating">("floating");
	const isFloating = surface === "floating";

	return (
		<LabSection
			description="One sidebar, two widths and two skins. Expanded is the first-load state on every screen wide enough for labels - collapsed-by-default hides the map, and a new user cannot want what they have not seen. Collapse it and the items, their order and their icons stay put; only the labels move into tooltips, and the section headings become the gaps between the groups. Hover a rail icon, then Tab onto one: the tooltip has to answer to both, because a rail of nine glyphs is a quiz otherwise. Switch to Crowded to see the headings - and type in the search field, or press / from anywhere on this page, to see the destinations filter and the account block below them refuse to move."
			title="Desktop and tablet: the sidebar"
		>
			<div className="flex flex-wrap gap-2">
				<AppButton
					data-cy="sidebar-expanded"
					onPress={() => setIsCollapsed(false)}
					size="sm"
					variant={isCollapsed ? "secondary" : "primary"}
				>
					Expanded (desktop)
				</AppButton>
				<AppButton
					data-cy="sidebar-rail"
					onPress={() => setIsCollapsed(true)}
					size="sm"
					variant={isCollapsed ? "primary" : "secondary"}
				>
					Rail (tablet)
				</AppButton>
			</div>

			<div className="space-y-2">
				<p className="text-xs font-semibold tracking-wide text-muted uppercase">Surface</p>
				<div className="flex flex-wrap gap-2">
					<AppButton
						data-cy="sidebar-floating"
						onPress={() => setSurface("floating")}
						size="sm"
						variant={isFloating ? "primary" : "secondary"}
					>
						Floating
					</AppButton>
					<AppButton
						data-cy="sidebar-flush"
						onPress={() => setSurface("flush")}
						size="sm"
						variant={isFloating ? "secondary" : "primary"}
					>
						Flush
					</AppButton>
				</div>
				<p className="text-sm text-muted">
					The same column either way - switch it and watch nothing inside move. Floating is the glass island in a padded
					row, so the page shows behind and around it; flush is opaque, square, hairlined on its right edge only, and
					runs the full height against the viewport. Floating needs something worth showing through and spends a gutter
					on all four sides to get it; flush hands those pixels back, which is the trade a dense app wants. The PADDING
					is the frame&apos;s, not the sidebar&apos;s - that is why the row loses it here rather than the component
					losing it.
				</p>
			</div>

			<DeviceFrame label="1280 × 720">
				<div className={cn("flex h-full", isFloating && "gap-4 p-4")}>
					<AppSidebar
						activeHref={activeHref}
						className="h-full shrink-0"
						data-cy="sidebar"
						isCollapsed={isCollapsed}
						navigation={navigation}
						navLabel="Sidebar specimen"
						onAccountSelect={onAccountSelect}
						onLogout={() =>
							AppToast.info("Sign out", {
								description: "The lab does not actually sign you out.",
								icon: LogOut,
							})
						}
						onNavigate={onNavigate}
						onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
						roleLabel={roleLabel}
						secondaryNavigation={secondaryNavigation}
						user={user}
						variant={surface}
					/>
					{/* Flush gave the row's padding up to the sidebar's edge, so the
					    content has to carry its own or it starts against the hairline. */}
					<div className={cn("flex min-w-0 flex-1", !isFloating && "p-4")}>
						<FramePage
							activeHref={activeHref}
							onNavigate={onNavigate}
						/>
					</div>
				</div>
			</DeviceFrame>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** Mobile: tabs at the bottom, the drawer for everything that is not a place. */
function MobileSection({ activeHref, navigation, onNavigate, roleLabel, secondaryNavigation, user }: SpecimenProps) {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const { overflow } = splitForTabBar(navigation);

	return (
		<LabSection
			description="Bottom, because the top of a phone is the part the thumb cannot reach. Labels under every icon at every width. The bar never hides on scroll - it is the only way out of the screen. Tap More for the destinations that did not fit, and the hamburger for the things that are not destinations at all: account, alerts, settings, sign out. Both open full-screen here rather than inside the frame, because a modal belongs to the viewport. The top bar's title is deliberately blank while a screen's own heading is on show - it fades in only once that heading has scrolled away, which this frame cannot do because it scrolls its own box rather than the window."
			title="Mobile: the tab bar"
		>
			<DeviceFrame label="390 × 720">
				<div className="mx-auto flex h-full w-[390px] max-w-full flex-col overflow-hidden border-x border-border bg-background">
					<AppMobileBar
						back={parentOf(activeHref, navigation)}
						data-cy="mobilebar"
						onOpenMenu={() => setIsDrawerOpen(true)}
						title={navigation.find((item) => isNavItemActive(item, activeHref))?.title}
					/>
					<div className="flex-1 overflow-y-auto p-4 pb-20">
						<FramePage
							activeHref={activeHref}
							onNavigate={onNavigate}
						/>
					</div>
					<AppTabBar
						activeHref={activeHref}
						className="shrink-0"
						data-cy="tabbar"
						navigation={navigation}
						navLabel="Tab bar specimen"
						onNavigate={onNavigate}
					/>
				</div>
			</DeviceFrame>

			<p className="text-sm text-muted">
				{overflow.length > 0
					? `This role has ${navigation.length} destinations, so four are tabs and ${overflow.length} sit behind More - which lights up when the page you are on is one of them.`
					: `This role has ${navigation.length} destinations, so every one of them is a tab and there is no More slot.`}
			</p>

			<AppMobileDrawer
				activeHref={activeHref}
				data-cy="mobile-drawer"
				isOpen={isDrawerOpen}
				onLogout={() =>
					AppToast.info("Sign out", {
						description: "The lab does not actually sign you out.",
						icon: LogOut,
					})
				}
				onNavigate={onNavigate}
				onOpenChange={setIsDrawerOpen}
				roleLabel={roleLabel}
				secondaryNavigation={secondaryNavigation}
				user={user}
			/>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** The split itself, in words, because it is the rule people argue with. */
function SplitSection({ navigation }: { navigation: NavItem[] }) {
	const { overflow, tabs } = splitForTabBar(navigation);

	return (
		<LabSection
			description="Five slots is the ceiling, and the fifth is spent on More as soon as a sixth destination exists. Not a sixth tab, and not a bar that scrolls sideways - a destination you have to scroll to find is not a top-level destination. Order in navigation.config.ts is what decides; there is no per-item flag to disagree with it."
			title="What fits, and what does not"
		>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="rounded-2xl border border-border p-3">
					<p className="text-xs font-semibold tracking-wide text-muted uppercase">Tabs ({tabs.length})</p>
					<ul
						className="mt-2 space-y-1 text-sm"
						data-cy="split-tabs"
					>
						{tabs.map((item) => (
							<li
								data-nav-item={item.href}
								key={item.href}
							>
								{item.title}
							</li>
						))}
					</ul>
				</div>
				<div className="rounded-2xl border border-border p-3">
					<p className="text-xs font-semibold tracking-wide text-muted uppercase">Behind More ({overflow.length})</p>
					<ul
						className="mt-2 space-y-1 text-sm"
						data-cy="split-overflow"
					>
						{overflow.length > 0 ? (
							overflow.map((item) => (
								<li
									data-nav-item={item.href}
									key={item.href}
								>
									{item.title}
								</li>
							))
						) : (
							<li className="text-muted">Nothing - it all fits.</li>
						)}
					</ul>
				</div>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const RULES: { body: string; title: string }[] = [
	{
		body: "The sidebar and the tab bar are two views of navigationItems. Add a route there and both surfaces get it; there is no second list to forget.",
		title: "One destination list",
	},
	{
		body: "Never behind a hamburger. Hidden nav takes roughly 40% fewer clicks, and a hamburger on desktop costs about 56% engagement against a visible nav. The pixels are there.",
		title: "Desktop nav is always on screen",
	},
	{
		body: "Settings, account, alerts and sign out - the things people already know they want and go looking for, which is the only kind of thing that survives being hidden. It is mobile-only; the desktop shows them at the foot of the sidebar.",
		title: "The drawer holds secondary things only",
	},
	{
		body: "Derived from the pathname by prefix, never set by the screen. Three levels inside Requests still lights Requests. It is a 10% tint of the accent rather than the hero gradient - the gradient won its contrast by being the loudest thing in the column, which stops working the moment the column has nine rows and three headings to read past. And it is never colour alone: the glyph takes a wash of fill, the label goes semibold, and aria-current says it outright.",
		title: "Active state",
	},
	{
		body: "Sections group the destinations under headings, which is what lets a nav be grasped rather than read - worth it from about six destinations up, furniture below that. Set NavItem.section and keep a section's items together in the array. On the rail the headings drop but their gaps stay: inner gap smaller than outer gap is the whole of what makes a group a group.",
		title: "Grouping",
	},
	{
		body: "floating | flush, on both the sidebar and the site header, and it is a decision about the PAGE rather than about the nav - an object on the page, or an edge of it. Floating is glass, rounded, inside a padded row; flush is opaque, square, hairlined on the edge it meets. Nothing inside the nav changes across the two, and neither variant positions itself: the caller still owns fixed vs sticky vs static through className, or the component could not be shown inside a frame like the ones above.",
		title: "Two surfaces, one pair of names",
	},
	{
		body: "Filters the destinations only, live, from the field or the / key. Account, sign-out and the identity row never move - hiding the way out of a screen because a query did not match is how a filter becomes a trap. No matches is a named state with the typed text in it and a way back, never a blank column.",
		title: "Search",
	},
	{
		body: "The bar sits above env(safe-area-inset-bottom) and the scroll container carries matching bottom padding, or the last row of every list ends up under it. A sticky page CTA stacks above the bar, never over it.",
		title: "Safe area",
	},
	{
		body: "Switching tabs cross-fades. Tabs are peers - a horizontal slide claims one is 'after' the other, and that is the transition a drill-down owns.",
		title: "Motion",
	},
	{
		body: "One <nav> in the DOM at a time, aria-current='page' on the active item, ≥44px targets including the rail's, and a skip-to-content link as the first focusable element - a sidebar with a dozen items is a dozen tab stops on every screen otherwise.",
		title: "Accessibility",
	},
];

function RulesSection() {
	return (
		<LabSection
			description="The decisions behind the two specimens above, in the order they get argued about."
			title="The rules"
		>
			<dl className="grid gap-3 sm:grid-cols-2">
				{RULES.map((rule) => (
					<div
						className="rounded-2xl border border-border p-3"
						key={rule.title}
					>
						<dt className="text-sm font-semibold">{rule.title}</dt>
						<dd className="mt-1 text-sm text-muted">{rule.body}</dd>
					</div>
				))}
			</dl>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * The one nav on this page that is NOT the signed-in destination list.
 *
 * A marketing header answers a different question - what this product is, and
 * how to start - so it has its own array rather than a role's. Three shapes on
 * purpose: a plain link, a menu with one column, a menu with three, and an
 * external link at the end.
 */
const SITE_NAV: SiteNavItem[] = [
	{
		groups: [
			{
				label: "Build",
				links: [
					{
						description: "Every App* component, one page each.",
						href: "/components",
						icon: SquareStack,
						label: "Components",
					},
					{
						description: "Tokens, gradients and surfaces on one page.",
						href: "/components/theme-toggle",
						icon: Palette,
						label: "Design tokens",
					},
					{
						description: "Canonical react-hook-form wiring.",
						href: "/components/form-reference",
						icon: TableIcon,
						label: "Forms",
					},
				],
			},
			{
				label: "Patterns",
				links: [
					{
						description: "Five nav patterns, one list.",
						href: "/components/navigation",
						icon: Footprints,
						label: "Navigation",
					},
					{
						description: "Filters, pagination, row actions.",
						href: "/components/table",
						icon: TableIcon,
						label: "Tables",
					},
					{
						description: "Toasts, banners, dialogs.",
						href: "/components/toaster",
						icon: Megaphone,
						label: "Feedback",
					},
				],
			},
			{
				label: "Ship",
				links: [
					{
						description: "The signed-in app frame.",
						href: "/components/shell",
						icon: SquareStack,
						label: "App shell",
					},
					{
						description: "The reading view of a post.",
						href: "/components/blog-post",
						icon: ListIcon,
						label: "Blog post",
					},
					{
						description: "A deck of pictures in a square.",
						href: "/components/carousel",
						icon: SquareStack,
						label: "Carousel",
					},
				],
			},
		],
		label: "Product",
	},
	{
		groups: [
			{
				links: [
					{
						description: "What this template is for.",
						href: "/",
						icon: MessageSquare,
						label: "Overview",
					},
					{
						description: "Pick a palette and measure it.",
						href: "/components/theme-customizer",
						icon: Palette,
						label: "Theming",
					},
				],
			},
		],
		label: "Docs",
	},
	{ href: "/components/profile-banner", icon: Building2, label: "About" },
	{ href: "https://github.com", icon: Github, isExternal: true, label: "GitHub" },
];

const SITE_ACTIONS: SiteHeaderAction[] = [
	{ label: "Log in", to: "/sign-in", variant: "ghost" },
	{ label: "Get started", to: "/sign-up", variant: "primary" },
];

/**
 * The public header, which is the one nav a signed-OUT visitor ever sees.
 *
 * Both specimens are the real component at two widths. The frames carry
 * `transform-gpu` so a `fixed` header pins to the FRAME rather than to the
 * window - a transformed ancestor is a containing block for fixed descendants,
 * and without it the floating variant would sit over this page's own toolbar.
 * The sheet still opens over the whole window, because a modal belongs to the
 * viewport; the drawer specimens above make the same trade.
 */
function SiteHeaderSection() {
	const [variant, setVariant] = useState<"flush" | "floating">("floating");
	const [activeHref, setActiveHref] = useState("/components");

	/* Same rule as the specimens above: stop the navigation, move the pathname the header reads. */
	const onNavigate = (link: SiteNavLink, event: { preventDefault: () => void }) => {
		event.preventDefault();
		if (!link.isExternal) setActiveHref(link.href);
	};

	return (
		<LabSection
			description="Brand, destinations, actions - the header a signed-out visitor meets. Hover Product to see a menu hold three columns of links, then Tab to it and press Enter or Down: hover is the shortcut, never the mechanism. The phone frame is the same component; it rearranges off the width it is GIVEN rather than the window's, so a 390px frame on a desktop shows the real phone bar. Open the sheet there and the destinations AND the actions are both in it."
			title="Signed out: the site header"
		>
			<div className="space-y-2">
				<p className="text-xs font-semibold tracking-wide text-muted uppercase">Variant</p>
				<div className="flex flex-wrap gap-2">
					<AppButton
						data-cy="site-header-floating"
						onPress={() => setVariant("floating")}
						size="sm"
						variant={variant === "floating" ? "primary" : "secondary"}
					>
						Floating
					</AppButton>
					<AppButton
						data-cy="site-header-flush"
						onPress={() => setVariant("flush")}
						size="sm"
						variant={variant === "flush" ? "primary" : "secondary"}
					>
						Flush
					</AppButton>
				</div>
				<p className="text-sm text-muted">
					Floating is FIXED and out of the flow, so the page under it owns the padding that keeps its first element
					clear - scroll the frame and the hero passes underneath. Flush is STICKY and in the flow, so it needs none,
					and it takes its border on scroll rather than at rest: a line under a bar sitting on a hero cuts the page in
					two before there is anything to separate. Same pair of names as the sidebar above, and the same distinction:
					an object ON the page, or an edge OF it.
				</p>
			</div>

			<DeviceFrame
				className="transform-gpu"
				label="1280 × 520"
			>
				{/*
				 * `scrollbar-none` is a consequence of `transform-gpu`. The bar is FIXED
				 * to the frame, so it is as wide as the frame; this scroller's content is
				 * as wide as the frame MINUS the scrollbar, so the bar was centred on a
				 * box 15px wider than the page under it and overhung it on the right. A
				 * real viewport keeps its scrollbar outside the box a fixed element
				 * measures against; a nested scroller puts it inside. Moving the frame's
				 * `overflow` here instead would un-pin the bar - it scrolls away.
				 */}
				<div className="scrollbar-none h-full overflow-y-auto">
					<AppSiteHeader
						actions={SITE_ACTIONS}
						activeHref={activeHref}
						data-cy="site-header-desktop"
						items={SITE_NAV}
						onNavigate={onNavigate}
						variant={variant}
					/>
					<div className={cn("space-y-3 p-4", variant === "floating" && "pt-24")}>
						<div className="h-40 rounded-2xl gradient-brand" />
						<div className="h-24 rounded-2xl bg-muted-surface" />
						<div className="h-24 rounded-2xl bg-muted-surface" />
						<p className="text-xs text-muted">
							Rendering <code className="font-mono">{activeHref}</code>. Specimen links do not navigate.
						</p>
					</div>
				</div>
			</DeviceFrame>

			{/*
			 * The 390px goes on the FRAME, not on a div inside it. The floating header
			 * is `fixed`, so its containing block is the nearest transformed ancestor -
			 * this frame - and `w-full` inside a narrower wrapper would still resolve
			 * to the frame's width, rendering the desktop bar in a phone.
			 */}
			<DeviceFrame
				className="mx-auto w-[390px] max-w-full transform-gpu"
				label="390 × 520"
			>
				{/* `scrollbar-none` for the same reason as the frame above. */}
				<div className="scrollbar-none h-full overflow-y-auto">
					<AppSiteHeader
						actions={SITE_ACTIONS}
						activeHref={activeHref}
						data-cy="site-header-mobile"
						items={SITE_NAV}
						onNavigate={onNavigate}
						variant={variant}
					/>
					<div className={cn("space-y-3 p-4", variant === "floating" && "pt-24")}>
						<div className="h-32 rounded-2xl gradient-brand" />
						<div className="h-24 rounded-2xl bg-muted-surface" />
					</div>
				</div>
			</DeviceFrame>

			<p className="text-sm text-muted">
				One action leaves the bar at a time rather than all at once, and the LAST one is the primary - a header with no
				way to sign up has no job. Both are repeated at the foot of the sheet: a duplicated control costs nothing, and a
				missing one costs the click.
			</p>
		</LabSection>
	);
}

/**
 * The parent LEVEL of a path, which is the section it belongs to - not the page
 * visited before it. Back has to be predictable from where the user IS.
 */
function parentOf(activeHref: string, navigation: NavItem[]): { href: string; label: string } | undefined {
	const section = navigation.find((item) => isNavItemActive(item, activeHref));
	if (!section || section.href === activeHref) return undefined;
	return { href: section.href, label: section.title };
}

/** A fake screen, so the frames have something for the nav to sit beside. */
function FramePage({
	activeHref,
	onNavigate,
}: {
	activeHref: string;
	onNavigate: (item: UiNavItem, event: { preventDefault: () => void }) => void;
}) {
	return (
		<div className="min-w-0 flex-1 space-y-3">
			{/* Keyed on the pathname, so the fade is the one the shell runs when a
			    user changes destination. */}
			<div
				className="nav-fade space-y-3"
				key={activeHref}
			>
				<div className="h-8 w-2/3 rounded-xl bg-muted-surface" />
				<div className="h-24 rounded-2xl bg-muted-surface" />
				<div className="h-24 rounded-2xl bg-muted-surface" />
			</div>
			<p className="text-xs text-muted">
				Rendering <code className="font-mono">{activeHref}</code>. Specimen links do not navigate -{" "}
				<button
					className="cursor-pointer underline"
					onClick={(event) => onNavigate({ href: "/dashboard" } as NavItem, event)}
					type="button"
				>
					reset
				</button>
				.
			</p>
		</div>
	);
}

/** A labelled box standing in for a viewport, so a fixed nav has something to pin to. */
function DeviceFrame({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
			<div
				className={cn(
					"relative h-[520px] overflow-hidden rounded-3xl border border-border bg-background shadow-soft",
					className,
				)}
			>
				{children}
			</div>
		</div>
	);
}
