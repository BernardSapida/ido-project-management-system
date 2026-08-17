import type { BreadcrumbItem } from "@bernardsapida/web-ui";
import { AppButton, AppHeader, AppMobileDrawer, AppPageHeader, AppToast } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, LogOut, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { getNavigation, getRoleLabel, getSecondaryNavigation } from "@/config/navigation.config";
import { seo } from "@/config/seo.config";
import { LabSection } from "@/features/labs/components/LabSection";
import { cn } from "@/utils/cn";

const TITLE = "Dashboard header";

/**
 * Dashboard header lab.
 *
 * This is the SIGNED-IN bar, and the first thing to be clear about is that it is
 * not the other one. `AppSiteHeader` - on the navigation lab - is the marketing
 * bar a signed-out visitor meets: brand, mega menus, Log in, Get started. It
 * answers "what is this product?". This bar answers "where am I in it?", which
 * is why its middle is a breadcrumb trail rather than a destination list.
 *
 * Things to check by hand:
 *
 * 1. **Set Depth to one level.** The bar still says where you are.
 *    `AppBreadcrumbs` renders null under three levels by default - correct above
 *    a page's `<h1>`, wrong in a bar that has no heading beside it, where it
 *    leaves an empty strip with two icons floating in it. The header passes
 *    `minLevels={1}`; at one level there is no parent, so the narrow rendering
 *    states the page rather than offering a back link to nothing.
 * 2. **Compare the two frames.** The trigger is on BOTH, in the same corner. It
 *    toggles the sidebar rather than opening it, and "how wide is the sidebar"
 *    is a real question at 1920px. What changes with the width is only what the
 *    toggle does - rail in place, or a drawer - and that is App Layout's call.
 *    The wordmark, by contrast, is drawn from `lg` up off a CONTAINER query: the
 *    component reads the width it was GIVEN, which is the only reason a phone
 *    bar can be shown on a desktop at all.
 * 3. **Open the drawer in the phone frame.** It arrives from the LEFT holding
 *    the destinations, because it is the sidebar off-canvas. The account drawer
 *    on the navigation lab arrives from the right holding account items only -
 *    same component, and `navigation` is the switch.
 * 4. **Switch the surface.** Floating is an island inside a padded frame; flush
 *    is an edge, full-width with a hairline under it. Same pair of names as the
 *    sidebar and the site header.
 *
 * There is deliberately no page title in the bar. Every screen opens with its
 * name in 30px type, and a second copy 40px above it is the same word twice -
 * see the note in the component.
 */
export const Route = createFileRoute("/(references)/components/app-header")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: AppHeaderLab,
});

const DEMO_USER = {
	email: "maria.delacruz@example.com",
	name: "Maria Dela Cruz",
};

/**
 * Trails at three depths. Three is the interesting one because it is the first
 * that renders at all; one and two exist to prove the bar survives the trail
 * being absent, which is the state most screens in most apps are in.
 */
const TRAILS: Record<number, BreadcrumbItem[]> = {
	1: [{ key: "dashboard", label: "Dashboard" }],
	2: [
		{ href: "/dashboard", key: "dashboard", label: "Dashboard" },
		{ key: "reports", label: "Reports" },
	],
	4: [
		{ href: "/dashboard", key: "dashboard", label: "Dashboard" },
		{ href: "/reports", key: "reports", label: "Reports" },
		{ href: "/reports/q3", key: "q3", label: "Q3 revenue by region" },
		{ key: "detail", label: "Metro Manila" },
	],
	/*
	 * Five is the first depth that COLLAPSES: `maxVisible` is 4, so the middle
	 * folds into the overflow menu and the trail keeps the root and the last two.
	 * A bar is the tightest place that ever happens, which is why it is worth a
	 * step of its own here rather than only on the breadcrumbs lab.
	 */
	5: [
		{ href: "/dashboard", key: "dashboard", label: "Dashboard" },
		{ href: "/reports", key: "reports", label: "Reports" },
		{ href: "/reports/q3", key: "q3", label: "Q3 revenue by region" },
		{ href: "/reports/q3/ncr", key: "ncr", label: "National Capital Region" },
		{ key: "detail", label: "Metro Manila" },
	],
};

const DEPTHS = [1, 2, 4, 5];

function AppHeaderLab() {
	const [depth, setDepth] = useState(4);
	const [surface, setSurface] = useState<"flush" | "floating">("floating");
	const [hasActions, setHasActions] = useState(true);
	// Full with labels on first load, which is what the app persists per user:
	// the rail is opt-in, because a new user cannot want what they have not seen.
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

	const isFloating = surface === "floating";
	const breadcrumbs = TRAILS[depth];

	const actions = hasActions ? (
		<>
			<AppButton
				aria-label="Search"
				icon={Search}
				isIconOnly
				onPress={() =>
					AppToast.info("Search", {
						description: "The lab does not actually search.",
						icon: Search,
					})
				}
				size="sm"
				variant="ghost"
			/>
			<AppButton
				aria-label="Notifications"
				icon={Bell}
				isIconOnly
				onPress={() =>
					AppToast.info("Notifications", {
						description: "Nothing new in the lab.",
						icon: Bell,
					})
				}
				size="sm"
				variant="ghost"
			/>
		</>
	) : undefined;

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The SIGNED-IN bar, for a dashboard: where you are, and what you can do from here. Not the site header - that one is signed-out, has its own lab, and answers a different question."
				title="Dashboard header lab"
			/>

			<LabSection
				description="Three controls, both frames below read all of them. Depth is the one worth playing with: this bar shows the trail at every depth, and at five the middle folds into the overflow menu - which is the tightest place that collapse ever has to work."
				title="The controls"
			>
				<Control label="Trail depth">
					{DEPTHS.map((value) => (
						<AppButton
							data-cy={`depth-${value}`}
							key={value}
							onPress={() => setDepth(value)}
							size="sm"
							variant={depth === value ? "primary" : "secondary"}
						>
							{value === 1 ? "1 level" : `${value} levels`}
						</AppButton>
					))}
				</Control>
				<p className="text-sm text-muted">
					The bar renders the trail at every depth, including one level - it passes{" "}
					<code className="font-mono">minLevels={"{1}"}</code> against the component&apos;s own default of three. That
					default is right where the trail was designed to live, above a page&apos;s{" "}
					<code className="font-mono">h1</code>, where &quot;Home &gt; Page&quot; repeats the heading under it. A bar
					has no heading beside it, so suppressing the trail leaves an empty strip with two icons floating at the end -
					a component that looks like it failed to render rather than one that declined to. Check depth 1 on both
					frames: the desktop bar says the page, the phone bar says it too, because there is no parent to offer a back
					link to. At five levels the middle collapses into the overflow menu -{" "}
					<code className="font-mono">maxVisible</code> is 4, so five is the first depth that does not fit - and what
					survives is the root and the last two. The swallowed levels stay reachable through the ellipsis, which is a
					real menu rather than a glyph claiming there is more.
				</p>

				<Control label="Surface">
					<AppButton
						data-cy="header-floating"
						onPress={() => setSurface("floating")}
						size="sm"
						variant={isFloating ? "primary" : "secondary"}
					>
						Floating
					</AppButton>
					<AppButton
						data-cy="header-flush"
						onPress={() => setSurface("flush")}
						size="sm"
						variant={isFloating ? "secondary" : "primary"}
					>
						Flush
					</AppButton>
				</Control>

				<Control label="Actions">
					<AppButton
						data-cy="actions-on"
						onPress={() => setHasActions(true)}
						size="sm"
						variant={hasActions ? "primary" : "secondary"}
					>
						Search and alerts
					</AppButton>
					<AppButton
						data-cy="actions-off"
						onPress={() => setHasActions(false)}
						size="sm"
						variant={hasActions ? "secondary" : "primary"}
					>
						None
					</AppButton>
				</Control>
			</LabSection>

			<LabSection
				description="The trigger is on the bar here too, and that is the point. It is not 'open the nav' - a control with nothing to do beside a sidebar that is already standing there - it is 'how wide is the sidebar', which is a real question at 1920px because plenty of people would rather have the rail and the extra content width all day. Press it and watch the accessible name flip between Show and Hide; what it actually moves is App Layout's business, and this frame has no sidebar for it to move. The logo is off because in the Dashboard layout the sidebar carries the brand."
				title="Desktop: the trigger stays"
			>
				<DeviceFrame
					height={320}
					label="Desktop"
				>
					<AppHeader
						actions={actions}
						breadcrumbs={breadcrumbs}
						data-cy="header-desktop"
						hasLogo={false}
						isSidebarExpanded={isSidebarExpanded}
						onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
						variant={surface}
					/>
					<FramePage isFloating={isFloating} />
				</DeviceFrame>
				<p className="text-sm text-muted">
					<code className="font-mono">aria-expanded</code> is{" "}
					<code className="font-mono">{String(isSidebarExpanded)}</code>, and the button is named{" "}
					<code className="font-mono">{isSidebarExpanded ? "Hide sidebar" : "Show sidebar"}</code>. Not{" "}
					<code className="font-mono">aria-haspopup=&quot;dialog&quot;</code>: it is only a dialog on a phone, and
					claiming one here promises an overlay that never arrives.
				</p>
			</LabSection>

			<PhoneSection
				actions={actions}
				breadcrumbs={breadcrumbs}
				isFloating={isFloating}
				surface={surface}
			/>

			<RulesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * The phone frame, and the drawer its hamburger opens.
 *
 * The 390px goes on the FRAME rather than on a div inside it: the floating
 * header is `fixed`, so its containing block is the nearest transformed ancestor
 * - the frame - and a `w-full` bar inside a narrower wrapper would still resolve
 * to the frame's width. Same trade the navigation lab's site-header frames make.
 */
function PhoneSection({
	actions,
	breadcrumbs,
	isFloating,
	surface,
}: {
	actions: ReactNode;
	breadcrumbs: BreadcrumbItem[];
	isFloating: boolean;
	surface: "flush" | "floating";
}) {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	return (
		<LabSection
			description="Same button, same corner, different effect - which is the whole design. On a phone the sidebar is not on screen at all, so the trigger slides the whole column in as a drawer: destinations under their section headings, because it is the sidebar rather than a second menu, with the account block and identity row pinned below them where the way out of the screen is not something you have to reach for. Note what the bar spends its width on: hasLogo is true here, but the wordmark is drawn only from lg up. Material's order for a top app bar is navigation icon, title, actions - no logo at all, because a signed-in user knows which app they are in. The trail does not have that luxury, so on 390px the brand is what gives way, and the drawer carries it at its head anyway."
			title="Mobile: the same trigger, as a drawer"
		>
			<DeviceFrame
				className="mx-auto w-[390px] max-w-full"
				height={420}
				label="390 × 420"
			>
				<AppHeader
					actions={actions}
					breadcrumbs={breadcrumbs}
					data-cy="header-mobile"
					isSidebarExpanded={false}
					onToggleSidebar={() => setIsDrawerOpen(true)}
					variant={surface}
				/>
				<FramePage isFloating={isFloating} />
			</DeviceFrame>

			<AppMobileDrawer
				activeHref="/dashboard"
				data-cy="header-drawer"
				isOpen={isDrawerOpen}
				navigation={getNavigation("USER")}
				onLogout={() =>
					AppToast.info("Sign out", {
						description: "The lab does not actually sign you out.",
						icon: LogOut,
					})
				}
				onNavigate={(_item, event) => event.preventDefault()}
				onOpenChange={setIsDrawerOpen}
				roleLabel={getRoleLabel("USER")}
				secondaryNavigation={getSecondaryNavigation("USER")}
				user={DEMO_USER}
			/>

			<p className="text-sm text-muted">
				The drawer opens over the whole window rather than inside the frame, because a modal belongs to the viewport.
				Its links do not navigate here.
			</p>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const RULES: { body: string; title: string }[] = [
	{
		body: "AppSiteHeader is the marketing bar - brand, mega menus, Log in, Get started - and it answers 'what is this product?'. This one answers 'where am I in it?'. Neither should grow the other's props; they share a surface vocabulary and nothing else.",
		title: "Two headers, on purpose",
	},
	{
		body: "Every screen opens with its name in 30px type, so a second copy in the bar is the same word twice and the one people read is the big one. The trail's last crumb is the page name anyway, and it is doing a different job: ancestry, not identity.",
		title: "No page title in the bar",
	},
	{
		body: "The split is about what the button OPENS, not about dashboards. A trigger for the primary navigation is the leading element of a top app bar in Material, is where Android users reach for it, and is where shadcn puts its SidebarTrigger - and it mirrors the side its drawer arrives from. A trigger for account or overflow belongs top-right, which is why AppSiteHeader keeps its own there.",
		title: "The hamburger is on the left",
	},
	{
		body: "Material's element order is navigation icon, title, actions - no logo, because a signed-in user knows which app they are in. The trail is the only thing saying WHERE in it they are, so on a narrow bar the wordmark is what gets spent and the trail stays. It is drawn from lg up, and only hidden at all when a hamburger has taken its place; the drawer carries the logo at its head either way.",
		title: "The brand gives way before the trail",
	},
	{
		body: "Given, never derived here. The trail comes from the route through useRouteBreadcrumbs; a bar that worked out its own would eventually disagree with the one the page renders, and there would be no way to tell which was right.",
		title: "Breadcrumbs are a prop",
	},
	{
		body: "AppBreadcrumbs hides itself under three levels, which is right above a page's h1 and wrong in a bar with no heading beside it - there it leaves an empty strip. The header passes minLevels={1}. Same component, opposite correct answer, which is why it is a prop and not a constant.",
		title: "The bar relaxes the three-level rule",
	},
	{
		body: "The trail switches between its full <ol> and a single back affordance on a CONTAINER query, not a viewport one. It was a viewport query, and inside this bar that meant a 390px frame on a desktop rendered the full trail into a space that could not hold it - every crumb is whitespace-nowrap in a min-w-0 flex item, so they collapsed to zero width and painted on top of each other.",
		title: "Its breakpoint is a container query too",
	},
	{
		body: "floating | flush, the same pair the sidebar and the site header use. Floating is fixed and out of the flow, so the page under it owns its top padding; flush is sticky and in the flow and needs none. App Layout passes one value to the header and the sidebar together.",
		title: "One surface vocabulary",
	},
	{
		body: "The trigger has no breakpoint - it is a fixture of the bar at every width, because it toggles rather than opens and 'how wide is the sidebar' is a real question on a desktop. Only its effect follows the width: rail in place from tablet up, a drawer on a phone. What IS a container query is the wordmark at @5xl (64rem = lg), so the bar rearranges off the width it was given and a 390px lab frame shows the real phone bar.",
		title: "One trigger, no breakpoint",
	},
];

function RulesSection() {
	return (
		<LabSection
			description="The decisions behind the two frames above, in the order they get argued about."
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

/** A fake screen, so the bar has something to sit over. */
function FramePage({ isFloating }: { isFloating: boolean }) {
	return (
		// Floating is out of the flow, so the page under it owns the padding that
		// keeps its first element clear. Flush is in the flow and needs none - which
		// is the whole difference between the two, made visible.
		<div className={cn("space-y-3 p-4", isFloating && "pt-24")}>
			<div className="h-28 rounded-2xl gradient-brand" />
			<div className="h-20 rounded-2xl bg-muted-surface" />
			<div className="h-20 rounded-2xl bg-muted-surface" />
		</div>
	);
}

/**
 * A labelled box standing in for a viewport, so a fixed bar has something to pin
 * to.
 *
 * It is the width it CLAIMS, and the page scrolls sideways to it on anything
 * narrower. A `w-full` box under a label reading "1280 × 320" squeezes a desktop
 * bar into a phone when this lab is read on one, and the specimen then
 * demonstrates the opposite of what it is here to show.
 *
 * The frame owns its scroller, and that scroller is `scrollbar-none`, both
 * because of the line above. The bar is FIXED to the frame, so it is as wide as
 * the frame; the page under it is inside the scroller, so it is as wide as the
 * frame MINUS the scrollbar - and the bar ends up centred on a box 15px wider
 * than the one its content is centred on, overhanging on the right. A real
 * viewport is fine because a classic scrollbar sits outside the box a fixed
 * element measures against; a nested scroller puts it inside. Taking the bar out
 * is what puts the two back on one width.
 *
 * Making the frame itself the scroller does not work: the fixed header then
 * scrolls away with the page. The site-header lab carries the same note.
 */
function DeviceFrame({
	children,
	className,
	height,
	label,
}: {
	children: ReactNode;
	className?: string;
	height: number;
	label: string;
}) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
			<div
				className={cn(
					// transform-gpu: a transformed ancestor is the containing block for
					// fixed descendants, so the floating bar pins to THIS box rather than
					// sitting over the page's own toolbar.
					"relative transform-gpu overflow-hidden rounded-3xl border border-border bg-background shadow-soft",
					className,
				)}
				style={{ height }}
			>
				{/* The scroller belongs to the frame, not to the caller - see above. */}
				<div className="scrollbar-none h-full overflow-y-auto">{children}</div>
			</div>
		</div>
	);
}
