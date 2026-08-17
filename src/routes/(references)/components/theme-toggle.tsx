import {
	AppButton,
	AppChip,
	AppGlassCard,
	AppPageHeader,
	AppThemeToggle,
	AppTokenSwatchGrid,
} from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { seo } from "@/config/seo.config";
import { useUIStore } from "@/store/ui.store";

/**
 * Theme toggle lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * It went a long time without a lab, which was awkward: it is the control that
 * decides whether every OTHER lab on this site is being read in the theme its
 * author checked.
 *
 * Three things to check by hand:
 *
 * 1. Cycle it: light → dark → auto → light. Three presses, one control.
 * 2. Put it on auto, then change your OS appearance without touching the page.
 *    The page has to follow. Then pick light or dark and do it again: nothing
 *    may move. That listener lives in `ui.store.ts`, not in the button.
 * 3. Flip to dark and read the swatch grid at the bottom of this page. Anything
 *    that does not move with it is a hard-coded colour somewhere.
 */
export const Route = createFileRoute("/(references)/components/theme-toggle")({
	head: () => ({
		meta: [{ title: seo.title("Theme toggle lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Theme toggle" },
	component: ThemeToggleLabPage,
});

function ThemeToggleLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Light, dark, or follow the system."
				title="Theme toggle lab"
			/>
			<PlacementSection />
			<FloatingSection />
			<LiveSection />
			<CycleSection />
			<AutoSection />
			<StylingSection />
			<TokenSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* The assembly                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The lab's binding of the toggle to the store.
 *
 * `AppThemeToggle` is props in, markup out, so every specimen below is the real
 * component driven by the real store rather than a sandboxed copy - a theme
 * toggle that does not change the theme is not the thing under test. The app's
 * own binding is `AppFloatingThemeToggle`, in the same folder as the component.
 */
function StoreThemeToggle(props: Omit<ComponentProps<typeof AppThemeToggle>, "mode" | "onModeChange">) {
	const setThemeMode = useUIStore((state) => state.setThemeMode);
	const themeMode = useUIStore((state) => state.themeMode);

	return (
		<AppThemeToggle
			{...props}
			mode={themeMode}
			onModeChange={setThemeMode}
		/>
	);
}

/**
 * The two places this control actually sits. Both are live - they share the
 * store, so pressing either moves the other.
 */
function PlacementSection() {
	const themeMode = useUIStore((state) => state.themeMode);

	return (
		<LabSection
			description="A top bar and a settings row, which are the only two homes this control has. They are the same component and the same state - press one and the other follows - but the surrounding copy does completely different work. In the bar the button is alone and its own label carries everything; in the settings row the heading and the description do the explaining, and the button just answers. A control that has to be self-describing in one place and terse in the other is the reason the accessible name says where the press GOES rather than only where you are."
			title="Where it sits"
			usedIn={["App headers", "Appearance settings", "Marketing page corners"]}
		>
			<div
				className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted-surface/50 p-3"
				data-cy="bar"
			>
				<span className="text-sm font-semibold">Acme Logistics</span>
				<StoreThemeToggle data-cy="bar-toggle" />
			</div>

			<div
				className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-4"
				data-cy="settings-row"
			>
				<div className="min-w-0">
					<p className="text-sm font-medium">Appearance</p>
					<p className="mt-0.5 text-sm text-muted">
						Auto follows your device. Your choice is remembered on this browser.
					</p>
				</div>
				<StoreThemeToggle data-cy="settings-toggle" />
			</div>

			<p className="text-sm text-muted">
				Both read the same store:{" "}
				<span
					className="font-medium"
					data-cy="placement-state"
				>
					{themeMode}
				</span>
			</p>
		</LabSection>
	);
}

/**
 * The third home, and the only one the app mounts for itself.
 *
 * Deliberately does NOT render an `AppFloatingThemeToggle` of its own: it is
 * already on this page, in the corner, mounted by `__root.tsx` - and a second
 * one would land in the same fixed spot carrying the same `data-cy`, which is
 * one hook matching two elements.
 */
function FloatingSection() {
	return (
		<LabSection
			description="Pinned to the top-right corner of every page, in development builds only. It is scaffolding: checking a screen in both themes is something you do constantly while building it and a user does once, so the control that makes it one click from anywhere belongs to whoever has the dev server open. `import.meta.env.DEV` is fixed at build time, so production drops the subtree rather than hiding a button - and it reads the same on the server and in the browser, so it cannot cause a hydration mismatch."
			title="Floating, dev only"
			usedIn={["Every page, in a dev build"]}
		>
			<div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border p-4">
				<div className="rounded-full bg-surface shadow-soft">
					<StoreThemeToggle
						data-cy="icon-only-toggle"
						isIconOnly
					/>
				</div>
				<p className="min-w-0 flex-1 text-sm text-muted">
					The specimen, not the mounted one - look at the top-right corner of this page for that. It is `isIconOnly`,
					because a floating control has no room for a word; the accessible name is unchanged, so a screen reader still
					hears the mode and where the press goes.
				</p>
			</div>
			<p className="text-sm text-muted">
				`z-40` is the whole placement argument: level with the app bar, which it never overlaps, and below HeroUI&apos;s
				overlays, whose `.modal__overlay` is `z-50`. Open any modal in these labs and the corner button has to disappear
				behind it. The surface and shadow are on the wrapper, never on the button - see the styling section below for
				why that matters here more than anywhere.
			</p>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */
/* Reference                                                                  */
/* -------------------------------------------------------------------------- */

function LiveSection() {
	const themeMode = useUIStore((state) => state.themeMode);

	return (
		<LabSection
			description="The real component, wired to the real store - pressing it changes the theme of this page and every other one, and the choice is persisted. There is no sandboxed copy, because a theme toggle that does not change the theme is not the thing under test."
			title="Live"
		>
			<div className="flex flex-wrap items-center gap-4">
				<StoreThemeToggle data-cy="live-toggle" />
				<AppChip
					icon={themeMode === "auto" ? Monitor : themeMode === "dark" ? Moon : Sun}
					label={`store: ${themeMode}`}
					tone="accent"
				/>
			</div>
			<p className="text-sm text-muted">
				The resolved class lands on `&lt;html&gt;` - `__root.tsx` writes it before first paint so there is no flash of
				the wrong theme on a reload. Reload this page in dark mode to check that; a flash means the pre-paint script and
				the store have drifted.
			</p>
		</LabSection>
	);
}

function CycleSection() {
	const { setThemeMode, themeMode } = useUIStore();

	return (
		<LabSection
			description="Three states on one control, in a fixed order: light → dark → auto. The trade-off of a cycle over three separate buttons is that the next state is not visible before you press, which is why the accessible name says where the press GOES rather than only where you are."
			title="The cycle"
		>
			<div className="flex flex-wrap items-center gap-3">
				{(
					[
						{ icon: Sun, label: "Light", mode: "light" },
						{ icon: Moon, label: "Dark", mode: "dark" },
						{ icon: Monitor, label: "Auto", mode: "auto" },
					] as const
				).map((entry) => (
					<AppButton
						icon={entry.icon}
						key={entry.mode}
						onPress={() => setThemeMode(entry.mode)}
						size="sm"
						variant={themeMode === entry.mode ? "primary" : "secondary"}
					>
						{entry.label}
					</AppButton>
				))}
			</div>
			<p className="text-sm text-muted">
				Those three buttons are the alternative design: every state reachable in one press, at the cost of three times
				the width. On a header with room, they are arguably the better control - which is the open question on this
				component.
			</p>
		</LabSection>
	);
}

function AutoSection() {
	const themeMode = useUIStore((state) => state.themeMode);

	return (
		<LabSection
			description="`auto` is the only mode with live work to do. The class is resolved before first paint, but if the OS flips while the page is open nothing would re-resolve it - so a matchMedia listener in `ui.store.ts` re-applies the theme, and does nothing at all unless the mode is `auto`. It sits in the store rather than in the button because it is app-wide work: one listener per app, however many toggles are on screen, and one writer of the class, `data-theme` and `colorScheme` together."
			title="Auto is not a third colour"
		>
			<div className="rounded-2xl border border-border p-4">
				<p className="text-sm">
					Current mode: <span className="font-medium">{themeMode}</span>
					{themeMode === "auto" ? (
						<span className="text-success"> - following the OS</span>
					) : (
						<span className="text-muted"> - OS changes ignored</span>
					)}
				</p>
				<p className="mt-2 text-sm text-muted">
					With auto selected, change your system appearance and watch this page follow without a reload. On light or
					dark, the same change must do nothing at all - an explicit choice that gets overridden by the OS is the bug
					that mode guard prevents.
				</p>
			</div>
		</LabSection>
	);
}

/** The design-system finding this lab produced. */
function StylingSection() {
	return (
		<LabSection
			description="This component used to be a raw HeroUI Button carrying eight hard-coded utilities - its own height, padding, border colour, background alpha, blur and hover transform. In the one component whose job is to prove the tokens work in both themes, that was the wrong thing to be doing."
			title="Now it is just AppButton"
		>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
					<StoreThemeToggle data-cy="styling-toggle" />
					<p className="text-xs text-success">
						`AppButton variant=&quot;outline&quot;` with no className at all. Same height, radius, focus ring and hover
						as every other button in the app, in both themes, forever.
					</p>
				</div>
				<div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
					<AppButton
						icon={Sun}
						size="md"
						variant="outline"
					>
						Light
					</AppButton>
					<p className="text-xs text-muted">
						A plain AppButton for comparison. If these two ever stop matching, something has grown a className again.
					</p>
				</div>
			</div>
		</LabSection>
	);
}

function TokenSection() {
	return (
		<LabSection
			description="The reason this control matters more than it looks. Toggle the theme above and read down this grid: every token has to move, and anything that stays put is a hard-coded colour that will be wrong in one of the two themes."
			title="What it is really testing"
		>
			<AppTokenSwatchGrid />
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
	/** Where this shape is used on a real screen. A specimen with no stated
	 *  purpose is a screenshot. */
	usedIn?: string[];
}

function LabSection({ children, description, title, usedIn }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
					{usedIn ? (
						<ul className="mt-2 flex flex-wrap gap-1.5">
							{usedIn.map((use) => (
								<li
									className="rounded-full bg-muted-surface px-2.5 py-0.5 text-xs text-muted"
									key={use}
								>
									{use}
								</li>
							))}
						</ul>
					) : null}
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
