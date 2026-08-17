import {
	AppButton,
	AppMobileDrawer,
	AppPageHeader,
	AppSidebar,
	AppToast,
	type LogoMark,
	type NavItem as UiNavItem,
} from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	Bell,
	Footprints,
	GitCommitHorizontal,
	List as ListIcon,
	LogOut,
	Megaphone,
	MessageSquare,
	PanelRight,
	SquareStack,
	Table as TableIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { NavItem } from "@/config/navigation.config";
import { getNavigation, getRoleLabel, getSecondaryNavigation } from "@/config/navigation.config";
import { seo } from "@/config/seo.config";
import { LabSection } from "@/features/labs/components/LabSection";
import { cn } from "@/utils/cn";
import type { UserRole } from "@/utils/config";

const TITLE = "App sidebar";

/**
 * App sidebar lab - the standing navigation column of a dashboard.
 *
 * Everything here is the REAL component driven by the real
 * `navigation.config.ts`, with two things changed: the specimens are pinned
 * inside fake device frames instead of the viewport, and their links call
 * `preventDefault` so a specimen cannot navigate this page away. Active state is
 * driven by the pathname buttons, which is exactly how the shell drives it - by
 * pathname, never by the screen setting its own row.
 *
 * The things worth checking:
 *
 * 1. **Pick a deep path.** The section stays lit. A nav that goes dark on a
 *    detail screen tells the user they have left the app.
 * 2. **Switch to the rail, then hover an icon and Tab onto one.** The tooltip
 *    answers to both, because a rail of nine glyphs is a quiz otherwise.
 * 3. **Switch the surface.** Nothing inside the column moves. The skin is a
 *    decision about the page around the nav, not about the nav.
 * 4. **Type in the search field, or press `/`.** The destinations filter and the
 *    identity row at the foot refuses to move - it is the way to the account
 *    menu, and the account menu is the way out. Hiding that because a query did
 *    not match is how a filter becomes a trap.
 * 5. **Press the identity row.** Account destinations and Sign out are in a menu
 *    behind it, not standing in the column. Sign out is the one irreversible
 *    thing a nav can do, and it should cost a deliberate open rather than sit in
 *    the column's tab order beside a link.
 * 6. **Switch Identity to the long one.** The column must not get wider.
 *
 * The page deliberately breaks one rule it documents: the app ships ONE nav in
 * the DOM at a time and this page has two. Their landmarks are renamed
 * (`navLabel`) so a screen reader gets "Sidebar specimen" rather than a second
 * thing called "Main".
 */
export const Route = createFileRoute("/(references)/components/app-sidebar")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: AppSidebarLab,
});

const DEMO_USER = {
	email: "maria.delacruz@example.com",
	name: "Maria Dela Cruz",
};

/**
 * The overflow case for the user card. A 260px column has to survive a name and
 * an address that do not fit: both truncate to one line, and neither is allowed
 * to widen the column and take the page beside it with it.
 */
const LONG_USER = {
	email: "maria.concepcion.delacruz-santos@a-very-long-department.example.gov.ph",
	name: "Maria Concepción Dela Cruz-Santos Villanueva",
};

const ROLES: { label: string; value: UserRole }[] = [
	{ label: "User", value: "USER" },
	{ label: "Admin", value: "ADMIN" },
];

const PATHS: Record<UserRole, { href: string; label: string }[]> = {
	ADMIN: [
		{ href: "/admin", label: "/admin" },
		{ href: "/admin/reports", label: "/admin/reports" },
		{ href: "/admin/sample/42", label: "…/sample/42" },
	],
	USER: [
		{ href: "/dashboard", label: "/dashboard" },
		{ href: "/reports", label: "/reports" },
		{ href: "/sample/42", label: "…/sample/42" },
	],
};

/**
 * A menu the template does not ship, because the template ships few enough
 * destinations per role that the two rules this page cares about most - section
 * headings, and a section expanding its children in place - have nothing to
 * happen to.
 *
 * The hrefs are REAL routes. TanStack renders `href=""` for a `to` it does not
 * recognise, which is a link that looks right and goes nowhere.
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
		// The nested one. A section holding the current page opens itself and stays
		// open until the reader disagrees with it.
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

const CROWDED_PATHS: { href: string; label: string }[] = [
	{ href: "/components/list", label: "/list" },
	{ href: "/components/table/orders/42", label: "…/table/orders/42" },
	{ href: "/components/dialog", label: "/dialog (child)" },
];

function AppSidebarLab() {
	const [role, setRole] = useState<UserRole>("USER");
	const [isCrowded, setIsCrowded] = useState(true);
	const [hasLongIdentity, setHasLongIdentity] = useState(false);
	const [activeHref, setActiveHref] = useState("/components/list");
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [surface, setSurface] = useState<"flush" | "floating">("floating");
	const [hasWordmark, setHasWordmark] = useState(true);
	const [logoMark, setLogoMark] = useState<LogoMark>("square");
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const navigation = isCrowded ? CROWDED_NAV : getNavigation(role);
	const secondaryNavigation = getSecondaryNavigation(role);
	const roleLabel = getRoleLabel(role);
	const paths = isCrowded ? CROWDED_PATHS : PATHS[role];
	const user = hasLongIdentity ? LONG_USER : DEMO_USER;
	const isFloating = surface === "floating";

	const onRoleChange = (next: UserRole) => {
		setRole(next);
		if (!isCrowded) setActiveHref(PATHS[next][0].href);
	};

	// Switching menus has to move the pathname with it, or every specimen opens on
	// a path none of its items can match and the whole column reads as dark.
	const onCrowdedChange = (next: boolean) => {
		setIsCrowded(next);
		setActiveHref(next ? CROWDED_PATHS[0].href : PATHS[role][0].href);
	};

	// Every specimen link goes through this: stop the navigation, move the
	// pathname the specimens read. The component never mutates it itself - it is
	// told where the user is.
	const onNavigate: (item: UiNavItem, event: { preventDefault: () => void }) => void = (item, event) => {
		event.preventDefault();
		setActiveHref(item.href);
	};

	const onLogout = () =>
		AppToast.info("Sign out", {
			description: "The lab does not actually sign you out.",
			icon: LogOut,
		});

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The standing navigation column of a dashboard: always on screen, never behind a hamburger, and the same list at two widths and two skins."
				title="App sidebar lab"
			/>

			<LabSection
				description="Every specimen below reads these. Change one and watch them agree - that is the point of one config array rendered several ways rather than several hand-written lists."
				title="The controls"
			>
				<Control label="Role">
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
				</Control>

				<Control label="Destinations">
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
				</Control>
				<p className="text-sm text-muted">
					Grouping is what lets a nav be GRASPED rather than read, and it earns its row from about six destinations up.
					The template ships fewer than that per role, so Crowded is a demo menu pointing at real component routes - it
					is the only way to see the section headings, and the only way to see a section expand its children in place.
				</p>

				<Control label="Identity">
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
				</Control>

				<Control label="Pathname">
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
				</Control>
				<p className="text-sm text-muted">
					The deep path is the one to check. Active state is derived by PREFIX, so a user inside a record still has the
					section lit; only the section roots are matched exactly, or a dashboard would stay lit on every page under it.
					The child path lights its PARENT too.
				</p>
			</LabSection>

			<LabSection
				description="Two widths, two skins and two brand treatments, on axes that do not touch. Expanded is 260px with labels and is the first-load state on every screen wide enough for them - collapsed-by-default hides the map, and a new user cannot want what they have not seen. The rail is ~72px: same items, same order, same icons, so muscle memory survives the change; only the labels move into tooltips, and the section headings become the gaps between the groups. Floating is the glass island in a padded row; flush is opaque, square, hairlined on its right edge only and running the full height against the viewport. Mark only drops the app name and the role label from the header - the signed-in user knows which app they are in, and three pieces of stacked identity above a short menu outweighs the destinations under it. Switch any of them and watch nothing else in the column move."
				title="Width and surface"
			>
				<Control label="Width">
					<AppButton
						data-cy="sidebar-expanded"
						onPress={() => setIsCollapsed(false)}
						size="sm"
						variant={isCollapsed ? "secondary" : "primary"}
					>
						Expanded
					</AppButton>
					<AppButton
						data-cy="sidebar-rail"
						onPress={() => setIsCollapsed(true)}
						size="sm"
						variant={isCollapsed ? "primary" : "secondary"}
					>
						Rail
					</AppButton>
				</Control>

				<Control label="Brand">
					<AppButton
						data-cy="sidebar-wordmark"
						onPress={() => {
							setHasWordmark(true);
							setLogoMark("square");
						}}
						size="sm"
						variant={hasWordmark && logoMark === "square" ? "primary" : "secondary"}
					>
						Mark and name
					</AppButton>
					<AppButton
						data-cy="sidebar-mark-only"
						onPress={() => {
							setHasWordmark(false);
							setLogoMark("square");
						}}
						size="sm"
						variant={!hasWordmark && logoMark === "square" ? "primary" : "secondary"}
					>
						Mark only
					</AppButton>
					<AppButton
						data-cy="sidebar-lockup"
						onPress={() => setLogoMark("lockup")}
						size="sm"
						variant={logoMark === "lockup" ? "primary" : "secondary"}
					>
						Lockup
					</AppButton>
				</Control>
				<p className="text-sm text-muted">
					Lockup is the one that is not a preference. A wide brand image fitted to a square box is painted at its own
					height - a 256&times;76 mark in a 40&times;40 slot renders at 40&times;12 and is unreadable. If the logo is
					wider than it is tall, it is a <code className="font-mono">lockup</code>, and it carries its own name so the
					text wordmark switches itself off beside one.
				</p>

				<Control label="Surface">
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
				</Control>

				<DeviceFrame
					height={640}
					label="Desktop and tablet — below md the column is not drawn"
				>
					<div className={cn("flex h-full", isFloating && "gap-4 p-4")}>
						<AppSidebar
							activeHref={activeHref}
							/*
							 * Not drawn below `md`, which is the real layout's behaviour
							 * rather than a lab convenience: on a phone the column is off
							 * screen and the dashboard header's trigger slides it in as a
							 * drawer. Squeezing a 260px column and a content area into 350px
							 * demonstrated the opposite of what this lab is for.
							 */
							className="hidden h-full shrink-0 md:flex"
							data-cy="sidebar"
							hasWordmark={hasWordmark}
							isCollapsed={isCollapsed}
							logoMark={logoMark}
							navigation={navigation}
							navLabel="Sidebar specimen"
							onAccountSelect={(item) => setActiveHref(item.href)}
							onLogout={onLogout}
							onNavigate={onNavigate}
							onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
							roleLabel={roleLabel}
							secondaryNavigation={secondaryNavigation}
							user={user}
							variant={surface}
						/>
						{/* Flush gave the row's padding up to the column's edge, so the
						    content carries its own or it starts against the hairline. */}
						<div className={cn("flex min-w-0 flex-1", !isFloating && "p-4")}>
							<FramePage activeHref={activeHref} />
						</div>
					</div>
				</DeviceFrame>

				<p className="text-sm text-muted">
					The toggle in the column&apos;s header is here because this specimen lets you drive it. In the App Layout
					family the sidebar never draws its own trigger - there is exactly one, in the dashboard header, in the same
					corner at every width. The one exception is the sidebar-only shape, which has no header at all - there the
					frame hands the column the toggle through context, and <code className="font-mono">onToggleCollapsed</code> is
					what a lab uses to drive a specimen with no frame above it.
				</p>
			</LabSection>

			<LabSection
				description="On a phone the column is not on screen at all: the dashboard header's trigger slides it in from the LEFT, because it IS the sidebar and a nav arriving from the opposite side to the column it replaces is a different object, not the same one returning. Destinations sit under the same section headings, with the account block and the identity row pinned below them rather than scrolling away - the way out of a screen is not something you should have to reach for."
				title="Phone: the same column, off-canvas"
			>
				<AppButton
					data-cy="open-drawer"
					onPress={() => setIsDrawerOpen(true)}
					size="sm"
					variant="primary"
				>
					Open the drawer
				</AppButton>

				<AppMobileDrawer
					activeHref={activeHref}
					data-cy="sidebar-drawer"
					/* Driven by the same control as the column above it, because a brand
             that has dropped its name from the corner has not dropped it only
             above `md`. */
					hasWordmark={hasWordmark}
					isOpen={isDrawerOpen}
					logoMark={logoMark}
					navigation={navigation}
					onAccountSelect={(item) => setActiveHref(item.href)}
					onLogout={onLogout}
					onNavigate={onNavigate}
					onOpenChange={setIsDrawerOpen}
					roleLabel={roleLabel}
					secondaryNavigation={secondaryNavigation}
					user={user}
				/>

				<p className="text-sm text-muted">
					It opens over the whole window rather than inside a frame, because a modal belongs to the viewport. Same
					component as the account drawer - <code className="font-mono">navigation</code> is the switch, and it decides
					the side too.
				</p>
			</LabSection>

			<RulesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

const RULES: { body: string; title: string }[] = [
	{
		body: "One destination list, rendered several ways. Add a route to navigation.config.ts and the column, the rail and the drawer all get it; there is no second list to forget.",
		title: "One config array",
	},
	{
		body: "Never behind a hamburger on a desktop. Hidden nav takes roughly 40% fewer clicks, and a hamburger on desktop costs about 56% engagement against a visible nav. The pixels are there, so they get spent on a standing list of what the app does.",
		title: "Always on screen",
	},
	{
		body: "Derived from the pathname by prefix, never set by the screen. Three levels inside a section still lights that section. It is a 10% tint of the accent rather than a gradient - the gradient won its contrast by being the loudest thing in the column, which stops working once the column has nine rows and three headings to read past. And it is never colour alone: the label goes semibold and aria-current says it outright.",
		title: "Active state",
	},
	{
		body: "Sections group the destinations under headings, worth it from about six destinations up and furniture below that. On the rail the headings drop but their GAPS stay: inner gap smaller than outer gap is the whole of what makes a group a group.",
		title: "Grouping",
	},
	{
		body: "Filters the destinations only, live, from the field or the / key. The identity row never moves: it is the way to the account menu, and the account menu is the way out. Hiding that because a query did not match is how a filter becomes a trap. No matches is a named state with the typed text in it and a way back, never a blank column.",
		title: "Search",
	},
	{
		body: "floating | flush, the same pair the dashboard header and the site header use, and a decision about the PAGE rather than the nav. Neither variant positions itself: the caller owns fixed vs sticky vs static through className, or the component could not be shown inside a frame like the one above.",
		title: "Two skins, one vocabulary",
	},
	{
		body: "Account destinations and Sign out are in a menu behind the identity row, not a standing block above it. That block spent permanent column height on things reached a few times a month, became a second run of unlabelled glyphs on the rail, and - the part that matters - kept the one irreversible control in the nav's tab order, a slip away from the profile link above it. Inside a menu it costs a deliberate open, which is the right price.",
		title: "The account menu, not an account block",
	},
	{
		body: "A rail item's label lives in a tooltip that answers to hover AND focus, rendered so the trigger IS the link rather than a button wrapped around one - otherwise a rail of nine glyphs is a quiz, and a keyboard user gets two tab stops per item.",
		title: "The rail's labels",
	},
	{
		body: "44px targets including the rail's, aria-current on the active item, one <nav> landmark per block with its own label, and a name on every icon-only control. The column is a dozen tab stops on every screen, which is what the skip link exists for.",
		title: "Accessibility",
	},
];

function RulesSection() {
	return (
		<LabSection
			description="The decisions behind the specimens above, in the order they get argued about."
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

function Control({ children, label }: { children: ReactNode; label: string }) {
	return (
		<div className="space-y-2">
			<p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
			<div className="flex flex-wrap gap-2">{children}</div>
		</div>
	);
}

/** A fake screen, so the column has something to sit beside. */
function FramePage({ activeHref }: { activeHref: string }) {
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
				Rendering <code className="font-mono">{activeHref}</code>. Specimen links do not navigate.
			</p>
		</div>
	);
}

/**
 * A labelled box standing in for a viewport.
 *
 * It is as wide as the page gives it, and it never scrolls sideways - a lab you
 * have to drag horizontally to read is worse than one that adapts. What adapts
 * INSIDE it is the specimen: below `md` the sidebar is not drawn at all, which
 * is the real layout's behaviour rather than a lab trick.
 */
function DeviceFrame({ children, height, label }: { children: ReactNode; height: number; label: string }) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
			<div
				className="relative overflow-hidden rounded-3xl border border-border bg-background shadow-soft"
				style={{ height }}
			>
				{children}
			</div>
		</div>
	);
}
