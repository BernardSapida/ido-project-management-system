import type { BreadcrumbItem, SiteNavItem } from "@bernardsapida/web-ui";
import {
	AppAside,
	AppButton,
	AppHeader,
	AppLayout,
	AppMobileDrawer,
	AppPageHeader,
	AppSidebar,
	AppSiteHeader,
	AppToast,
} from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Home, LogOut, Palette, Search, SquareStack, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { getNavigation, getRoleLabel, getSecondaryNavigation } from "@/config/navigation.config";
import { seo } from "@/config/seo.config";
import { LabSection } from "@/features/labs/components/LabSection";
import { cn } from "@/utils/cn";

const TITLE = "App layout";

/**
 * App layout lab - the assembly.
 *
 * This is the one page in the group whose component is mostly other components.
 * Every hard decision belongs to a part and is documented on that part's lab -
 * the sidebar owns the rail and the search, the dashboard header owns the trail
 * and the trigger, main owns the landmark and the measure, the aside owns what
 * may go in a supporting pane. What is left here is the three things only the
 * frame can know, and they are the three the specimens below are for.
 *
 * The specimen is REAL - a live `AppLayout` with fake data inside a bordered
 * box. It is not the app's own frame: this page is under `/components`, which
 * has its own shell, so what you are looking at is a second frame rendered
 * inside the first. That means two `<main>` landmarks and, at desktop widths,
 * two navs on one page - rules the lab breaks to show the component, the way
 * the navigation lab renders more than one nav.
 *
 * Things to check by hand:
 *
 * 1. **Press the trigger.** Above `md` it toggles rail ↔ labels in place; below
 *    `md` the same button slides the whole column in as a drawer. One control,
 *    one corner, one meaning.
 * 2. **Narrow the window past `md`.** The sidebar leaves the DOM rather than
 *    hiding, so only one `<nav>` is ever in the tree.
 * 3. **Narrow past `@4xl` OF THE CONTENT ROW with the aside on.** The pane
 *    stacks under the CONTENT rather than under the sidebar - that is what the
 *    nested row is for. A container query, not the window: beside a 260px column
 *    the window can be 1600px while the row is 475px.
 * 4. **Switch shape.** Header is the SITE header - a different component
 *    answering a different question - and has no sidebar. Sidebar has no bar, so
 *    the column draws its own toggle, and below `md` it gets `compactNavbar`
 *    because a phone with neither a column nor a bar cannot reach anything.
 */
export const Route = createFileRoute("/(references)/components/app-layout")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: AppLayoutLab,
});

const DEMO_USER = {
	email: "maria.delacruz@example.com",
	name: "Maria Dela Cruz",
};

const BREADCRUMBS: BreadcrumbItem[] = [
	{ href: "/dashboard", key: "dashboard", label: "Dashboard" },
	{ href: "/reports", key: "reports", label: "Reports" },
	{ key: "detail", label: "Q3 revenue" },
];

function AppLayoutLab() {
	const [variant, setVariant] = useState<"dashboard" | "header" | "sidebar">("dashboard");
	const [surface, setSurface] = useState<"flush" | "floating">("floating");
	const [hasAside, setHasAside] = useState(true);
	// Controlled, so pressing the trigger in a reference page does not rewrite the
	// reader's own persisted sidebar preference.
	const [isCollapsed, setIsCollapsed] = useState(false);

	const isFloating = surface === "floating";
	const isDashboard = variant === "dashboard";
	const hasSidebarSlot = variant !== "header";

	/* Shared by both branches, so the two differ only where the type forces them to. */
	const navProps = {
		activeHref: "/reports",
		navigation: getNavigation("USER"),
		onAccountSelect: () => undefined,
		onLogout: () =>
			AppToast.info("Sign out", {
				description: "The lab does not sign you out.",
				icon: LogOut,
			}),
		onNavigate: (_item: unknown, event: { preventDefault: () => void }) => event.preventDefault(),
		roleLabel: getRoleLabel("USER"),
		secondaryNavigation: getSecondaryNavigation("USER"),
		user: DEMO_USER,
	};

	const siteNav: SiteNavItem[] = [
		{ href: "/", icon: Home, label: "Home" },
		{
			groups: [
				{
					label: "Build",
					links: [
						{
							description: "Every App* component.",
							href: "/components",
							icon: SquareStack,
							label: "Components",
						},
						{
							description: "Tokens and surfaces.",
							href: "/components/theme-toggle",
							icon: Palette,
							label: "Tokens",
						},
					],
				},
			],
			label: "Product",
		},
		{ href: "/components/kpi", icon: Tag, label: "Pricing" },
	];

	const common = {
		aside: hasAside ? (
			<AppAside
				/* Same reason as the column: capped to the frame rather than to the
				   viewport, which inside a 32rem box is not a cap at all. */
				className="@4xl:top-4 @4xl:max-h-[calc(32rem-2rem)]"
				title="Activity"
				variant="flush"
			>
				<ol className="space-y-2 text-sm text-muted">
					<li>Report generated, 2 hours ago.</li>
					<li>Figures refreshed, 5 hours ago.</li>
					<li>Shared with the team, yesterday.</li>
				</ol>
			</AppAside>
		) : undefined,
		className: "min-h-full",
		/*
		 * Only the sidebar shape needs one: the other two already have a bar at
		 * every width. Below `md` the column is off screen, and without this its
		 * destinations would be unreachable.
		 */
		compactNavbar:
			variant === "sidebar" ? (
				/*
				 * The trail, not just the trigger. This bar exists because the column
				 * is off screen, and a bar holding one hamburger and nothing else is a
				 * strip of chrome that says where you are NOT.
				 *
				 * The brand is no help here: it hides itself on a narrow bar, by the
				 * same rule that gives the trail the width - a signed-in user knows
				 * which app they are in, and the trail is the only thing saying where
				 * in it. So the trail is what fills the bar, exactly as it does in the
				 * dashboard shape.
				 */
				<AppHeader
					breadcrumbs={BREADCRUMBS}
					data-cy="layout-compact-navbar"
					variant="flush"
				/>
			) : undefined,
		"data-cy": "layout",
		defaultSidebarOpen: !isCollapsed,
		/*
		 * The specimen is a whole frame mounted inside a page that already has one -
		 * the labs shell is an AppLayout too now - so its main takes an id of its
		 * own. Two elements sharing `id="main-content"` is invalid HTML and a skip
		 * link that lands on whichever the browser found first; overriding the id
		 * also drops the specimen's skip link, which would have pointed at the real
		 * one's target. Same escape hatch, for the same reason, as AppMain's `id`.
		 */
		mainId: "layout-specimen-main",
		mainLabel: "Frame specimen",
		navbar:
			variant === "sidebar" ? undefined : isDashboard ? (
				<AppHeader
					actions={
						<>
							<AppButton
								aria-label="Search"
								icon={Search}
								isIconOnly
								onPress={() =>
									AppToast.info("Search", {
										description: "The lab does not search.",
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
										description: "Nothing new.",
										icon: Bell,
									})
								}
								size="sm"
								variant="ghost"
							/>
						</>
					}
					breadcrumbs={BREADCRUMBS}
					data-cy="layout-header"
					hasLogo={!isDashboard}
					variant="flush"
				/>
			) : (
				/*
				 * The `header` variant is the SITE header - the signed-out marketing bar,
				 * not the dashboard one. Different component, different job: it answers
				 * "what is this product?" where AppHeader answers "where am I in it?".
				 */
				<AppSiteHeader
					actions={[
						{ label: "Log in", to: "/sign-in", variant: "ghost" },
						{ label: "Get started", to: "/sign-up", variant: "primary" },
					]}
					activeHref="/"
					data-cy="layout-site-header"
					items={siteNav}
					onNavigate={(_link, event) => event.preventDefault()}
					variant={surface}
				/>
			),
		onPreferenceChange: ({ isSidebarOpen }: { isSidebarOpen: boolean }) => setIsCollapsed(!isSidebarOpen),
	};

	/*
	 * Deliberately taller than the frame. The sticky sidebar and the sticky aside
	 * are the two things in here that only exist while something scrolls, and a
	 * specimen that fits on screen demonstrates neither of them.
	 */
	const page = (
		<div className="space-y-3">
			<div className="h-8 w-2/3 rounded-xl bg-muted-surface" />
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="h-24 rounded-2xl bg-muted-surface" />
				<div className="h-24 rounded-2xl bg-muted-surface" />
			</div>
			<p className="text-sm text-muted">
				This is the page. The frame gave it a canvas of the right width and has no opinion about the grid on it. Scroll:
				the column on the left and the pane on the right both stay put, and the content moves between them.
			</p>
			{Array.from({ length: 10 }, (_, index) => (
				<div
					className="h-28 rounded-2xl bg-muted-surface"
					key={`block-${index}`}
				/>
			))}
			<p className="text-sm text-muted">
				The end of the page. Both the sidebar and the pane should still be beside you.
			</p>
		</div>
	);

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Header, optional sidebar, main, optional aside - and the three decisions that belong to the frame rather than to any part of it."
				title="App layout lab"
			/>

			<LabSection
				description="The specimen below reads all of these. It is a live AppLayout, not a diagram."
				title="The controls"
			>
				<Control label="Variant">
					<AppButton
						data-cy="variant-dashboard"
						onPress={() => setVariant("dashboard")}
						size="sm"
						variant={isDashboard ? "primary" : "secondary"}
					>
						Dashboard
					</AppButton>
					<AppButton
						data-cy="variant-header"
						onPress={() => setVariant("header")}
						size="sm"
						variant={variant === "header" ? "primary" : "secondary"}
					>
						Header (site)
					</AppButton>
					<AppButton
						data-cy="variant-sidebar"
						onPress={() => setVariant("sidebar")}
						size="sm"
						variant={variant === "sidebar" ? "primary" : "secondary"}
					>
						Sidebar
					</AppButton>
				</Control>
				<p className="text-sm text-muted">
					Three frames. <strong>Dashboard</strong> is the signed-in app: dashboard header plus sidebar.{" "}
					<strong>Header</strong> is the SITE header - the signed-out marketing bar, a different component answering a
					different question - with no sidebar at all. <strong>Sidebar</strong> is the column alone, and it draws its
					own toggle at the top because there is no bar to hold one.
				</p>

				<Control label="Surface">
					<AppButton
						data-cy="surface-floating"
						isDisabled={isDashboard}
						onPress={() => setSurface("floating")}
						size="sm"
						variant={isFloating ? "primary" : "secondary"}
					>
						Floating
					</AppButton>
					<AppButton
						data-cy="surface-flush"
						isDisabled={isDashboard}
						onPress={() => setSurface("flush")}
						size="sm"
						variant={isFloating ? "secondary" : "primary"}
					>
						Flush
					</AppButton>
				</Control>
				<p className="text-sm text-muted">
					Floating needs exactly ONE piece of chrome, so Dashboard is flush and the type will not let you ask otherwise
					- the buttons are disabled there. Two islands, each with its own shadow and gutter, read as two unrelated
					objects with the content stranded in the gap. Below <code className="font-mono">md</code> the frame is flush
					whatever this says: a floating panel needs a page showing around it, and a phone has none to spare.
				</p>

				<Control label="Aside">
					<AppButton
						data-cy="aside-on"
						onPress={() => setHasAside(true)}
						size="sm"
						variant={hasAside ? "primary" : "secondary"}
					>
						Shown
					</AppButton>
					<AppButton
						data-cy="aside-off"
						onPress={() => setHasAside(false)}
						size="sm"
						variant={hasAside ? "secondary" : "primary"}
					>
						Absent
					</AppButton>
				</Control>
			</LabSection>

			<LabSection
				description="A live frame. Press the trigger in its header: above md it toggles the rail in place, below md the same button slides the column in as a drawer - one control, one corner, one meaning, and only the effect follows the width. Narrow the window past md and the sidebar leaves the DOM rather than hiding, so exactly one nav is ever in the tree. Narrow past @4xl of the content row with the aside on and the pane stacks under the CONTENT rather than under the sidebar."
				title="The frame"
			>
				{/*
				 * `transform-gpu` is load-bearing, not decoration. The floating header
				 * is `position: fixed`, and a fixed element's containing block is the
				 * nearest TRANSFORMED ancestor - without one it pins to the viewport
				 * and floats over this page's own text instead of over the specimen.
				 * The header and site-header labs make the same call for the same
				 * reason; this frame is the third and was missing it.
				 */}
				{/*
				 * TWO boxes, and they cannot be one.
				 *
				 * The transformed box may not be the scroll container. A fixed child of a
				 * transformed ancestor is already positioned like an absolute one, and if
				 * that ancestor also scrolls, the child scrolls WITH it - so the floating
				 * header slid off the top of the frame, which is the one thing a fixed
				 * header must not do. The scroller therefore goes inside: the header
				 * measures itself against the outer box, which never moves, and the
				 * sticky parts scope themselves to the inner one, which does.
				 *
				 * The inner box is `overflow-y-auto` rather than `overflow-hidden`: both
				 * make a scroll container and a sticky child scopes to the nearest one,
				 * but only one of them actually scrolls. Clipping pinned the column to a
				 * box that never moved, which looks exactly like "sticky is broken".
				 *
				 * `scrollbar-none` on it, because the fixed header is as wide as the
				 * OUTER box and the page under it is as wide as the inner one - a 15px
				 * scrollbar between them centres the bar off the content and overhangs it
				 * on the right. The header and site-header labs carry the same pair.
				 *
				 * A fixed height rather than the viewport's, because the parts inside are
				 * sized to their container: in the app the column is `h-dvh` and fills
				 * the screen, which inside a 32rem specimen box simply hangs out of it.
				 */}
				<div className="transform-gpu h-[32rem] overflow-hidden rounded-3xl border border-border">
					<div className="scrollbar-none h-full overflow-y-auto">
						<AppLayout
							{...common}
							sidebar={
								hasSidebarSlot ? (
									<AppSidebar
										{...navProps}
										/*
										 * Sized to the FRAME, not to the viewport. The app passes
										 * `h-dvh` here and should - there the frame is the screen - but
										 * inside a 32rem specimen box a viewport-tall column simply hangs
										 * out the bottom of it.
										 *
										 * `self-start` matters: without it the flex row stretches the item
										 * and the explicit height is ignored, so there is nothing shorter
										 * than the scroll area for `sticky` to move against.
										 *
										 * NOT `h-full` either. `height: 100%` needs a definite parent
										 * height, and it resolved to the column's own content - the
										 * sidebar ending at the user card with the frame carrying on
										 * beneath it, which is what "cropped" looked like.
										 */
										className={cn(
											"shrink-0 self-start",
											isFloating && !isDashboard ? "sticky top-6 h-[calc(32rem-3rem)]" : "sticky top-0 h-[32rem]",
										)}
										data-cy="layout-sidebar"
										navLabel="Frame specimen"
										variant={isDashboard ? "flush" : surface}
									/>
								) : undefined
							}
							sidebarDrawer={
								hasSidebarSlot ? (
									/*
									 * No `isOpen` and no `onOpenChange`: inside the frame the drawer
									 * takes both from context, because the trigger that opens it is
									 * in a different slot and this caller sits outside the provider.
									 * Passing `isOpen={false}` here is what made the hamburger do
									 * nothing.
									 */
									<AppMobileDrawer
										{...navProps}
										data-cy="layout-drawer"
									/>
								) : undefined
							}
							surface={surface}
						>
							{page}
						</AppLayout>
					</div>
				</div>
				<p className="text-sm text-muted">
					The frame worked the shape out from the slots it was given - there is no{" "}
					<code className="font-mono">variant</code> prop. Both slots is the dashboard shape, a navbar alone is the
					header shape, a sidebar alone is the sidebar shape, and <code className="font-mono">data-shape</code> reports
					what it settled on.
				</p>
			</LabSection>

			<RulesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

const RULES: { body: string; title: string }[] = [
	{
		body: "Dashboard (header + sidebar) and Header (header only). Both have a header, because that is where the sidebar trigger lives; a headerless variant had nowhere to put it except the rail, which meant two buttons doing one job in two places.",
		title: "Two variants",
	},
	{
		body: "Top-left, at every width, and it TOGGLES rather than opens - 'how wide is the sidebar' is a real question at 1920px. Above md it toggles rail and labels in place; below md the same button slides the column in as a drawer. Only the effect follows the width.",
		title: "One trigger",
	},
	{
		body: "Below md the sidebar is ABSENT, not hidden with a class. Two <nav> landmarks with one invisible is a screen reader reading out a nav nobody can see. useMediaQuery is useSyncExternalStore rather than an effect, because the answer is needed during the first render.",
		title: "Exactly one nav",
	},
	{
		body: "AppMain is rendered once, here, so no page can add a second <main> or forget the skip target. AppSkipToContent is the first focusable thing on the page, above the header.",
		title: "Exactly one main",
	},
	{
		body: "floating | flush goes to the header, the sidebar and the aside together. Below md the frame is flush whatever the caller asked for: a floating panel needs a page showing around it, and a phone has none to spare.",
		title: "One surface for the frame",
	},
	{
		body: "Expanded on first load, always, and the choice persists in ui.store. Collapsed-by-default hides the map, and a new user cannot want what they have not seen. There is no width override on top of it - a trigger that silently does nothing on a tablet is worse than a narrow column the user chose and can undo.",
		title: "The sidebar starts expanded",
	},
	{
		body: "Main and the aside share a row of their own inside the outer one, so a stacked aside lands under the CONTENT rather than under a full-height sidebar. No overflow-hidden anywhere on those rows, or the sticky sidebar and sticky aside scope themselves to the box instead of the viewport.",
		title: "Why the row is nested",
	},
	{
		body: "The measure comes from the ROUTE, through staticData.mainWidth, exactly the way useRouteBreadcrumbs reads staticData.breadcrumb. A dashboard, a settings page and an article want different answers on the same frame, and no page should wrap itself in a container to get one.",
		title: "The measure is the route's",
	},
];

function RulesSection() {
	return (
		<LabSection
			description="What the frame decides, as opposed to what its parts decide. Each part's own rules are on its own lab."
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

function Control({ children, label }: { children: ReactNode; label: string }) {
	return (
		<div className="space-y-2">
			<p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
			<div className="flex flex-wrap gap-2">{children}</div>
		</div>
	);
}
