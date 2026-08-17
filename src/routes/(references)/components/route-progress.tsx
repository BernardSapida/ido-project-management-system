import { AppButton, AppGlassCard, AppPageHeader, AppProgressBar } from "@bernardsapida/web-ui";
import { Skeleton } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import NProgress from "nprogress";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Route progress lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * It is the hardest component here to give a lab at all: it renders `null`. Everything it
 * does is a side effect on a bar NProgress owns and appends to `<body>`.
 *
 * It is already mounted, once, in `__root.tsx` - so the bar at the very top of
 * this window is the real one, and the buttons below drive the same NProgress
 * singleton the component drives. That is the honest way to demo it: there is
 * exactly one instance and no second copy to mount here.
 *
 * The check: press Start, then Done. The bar must complete and disappear rather
 * than being yanked off screen mid-travel - a progress bar that vanishes at 40%
 * reads as a failed navigation.
 */
export const Route = createFileRoute("/(references)/components/route-progress")({
	head: () => ({
		meta: [{ title: seo.title("Route progress lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Route progress" },
	component: RouteProgressLabPage,
});

function RouteProgressLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The thin bar at the top of the window during a route change. Renders null."
				title="Route progress lab"
			/>
			<DriveSection />
			<ConfigSection />
			<WhyNotSection />
			<MountSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

function DriveSection() {
	const [isRunning, setIsRunning] = useState(false);

	/*
	 * Whatever this section started has to be stopped when the section leaves,
	 * or navigating away mid-demo strands the real bar at 40% across every other
	 * page in the app - the component itself has no way to know a lab did that.
	 */
	useEffect(() => {
		return () => {
			NProgress.done();
		};
	}, []);

	return (
		<LabSection
			description="These drive the same NProgress singleton the component drives, so the bar you get is the real one, at the real place - the very top of the window, above everything. Watch the top edge, not this card. The pair worth checking is Start followed immediately by Done: a navigation that resolves before the bar has anything to say must not leave a flash behind."
			title="Drive it"
			usedIn={["Every route change in the app", "Mounted once in __root.tsx"]}
		>
			<div className="flex flex-wrap items-center gap-3">
				<AppButton
					data-cy="drive-start"
					isDisabled={isRunning}
					onPress={() => {
						setIsRunning(true);
						NProgress.start();
					}}
					size="sm"
				>
					Start
				</AppButton>
				<AppButton
					data-cy="drive-done"
					isDisabled={!isRunning}
					onPress={() => {
						setIsRunning(false);
						NProgress.done();
					}}
					size="sm"
					variant="secondary"
				>
					Done
				</AppButton>
				<AppButton
					isDisabled={!isRunning}
					// A block, not a bare expression: NProgress.inc() returns the
					// NProgress singleton, and AppButton reads a returned value as a
					// promise it should own a pending state for.
					onPress={() => {
						NProgress.inc();
					}}
					size="sm"
					variant="secondary"
				>
					Nudge forward
				</AppButton>
			</div>
			<p className="text-sm text-muted">
				State:{" "}
				<span
					className="font-medium"
					data-cy="drive-state"
				>
					{isRunning ? "running" : "idle"}
				</span>
			</p>
			<p className="text-sm text-muted">
				It trickles on its own while running. That is the point of it: nobody knows how long a route load takes, so the
				bar promises movement rather than a fraction - the number it shows is invented, and it never reaches 100 until
				`done()`.
			</p>
		</LabSection>
	);
}

function ConfigSection() {
	return (
		<LabSection
			description="Three settings, configured once at module scope. Each is a decision worth keeping."
			title="Configuration"
			usedIn={["The three decisions worth keeping if this is ever swapped out"]}
		>
			<ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
				<li>
					<code className="text-foreground">showSpinner: false</code> - the corner spinner is a second loading indicator
					for the same event. Two indicators for one wait is not twice the reassurance.
				</li>
				<li>
					<code className="text-foreground">trickleSpeed: 200</code> - how often it invents more progress. Faster reads
					as frantic on a fast connection, where most navigations resolve before the bar has anything to say.
				</li>
				<li>
					<code className="text-foreground">minimum: 0.08</code> - it starts at 8%, not 0. A bar that appears with no
					width is a flicker at the top of the screen, which is worse than no bar.
				</li>
			</ul>
		</LabSection>
	);
}

function WhyNotSection() {
	return (
		<LabSection
			description="Three loading indicators, three different waits. This one is specifically for a navigation - a wait whose duration is unknown, that happens above the content because the content is what is being replaced."
			title="Not a skeleton, not a bar"
			usedIn={["Read this before adding a second loading indicator"]}
		>
			<div className="grid gap-4 md:grid-cols-3">
				<Specimen caption="Route progress - a navigation. Top of the window, no number, no layout cost.">
					<AppButton
						data-cy="simulate-route-change"
						onPress={() => {
							NProgress.start();
							setTimeout(() => NProgress.done(), 1200);
						}}
						size="sm"
						variant="secondary"
					>
						Simulate a route change
					</AppButton>
				</Specimen>
				{/*
				 * A Skeleton, not a spinner. There is no AppSpinner to reach for -
				 * it was deleted rather than promoted, on the grounds that it had no
				 * call sites and a skeleton is the better answer for the case it
				 * covered: it says what SHAPE is coming, which a spinner cannot.
				 */}
				<Specimen caption="A skeleton - a region waiting on one request, in the place the answer will appear, already the shape of the answer.">
					<div className="flex w-full flex-col gap-2">
						<Skeleton className="h-4 w-3/4 rounded" />
						<Skeleton className="h-4 w-full rounded" />
						<Skeleton className="h-4 w-1/2 rounded" />
					</div>
				</Specimen>
				<Specimen caption="AppProgressBar - a job with a real fraction. Never use route progress for one of these; its number is fiction.">
					<AppProgressBar
						label="Uploading"
						showValueLabel
						value={62}
					/>
				</Specimen>
			</div>
		</LabSection>
	);
}

function MountSection() {
	return (
		<LabSection
			description="It returns null and takes no props. There is nothing to configure at a call site, which is why it is mounted exactly once, in __root.tsx, and never again."
			title="Mount it once"
			usedIn={["__root.tsx - and nowhere else"]}
		>
			<pre className="overflow-x-auto rounded-lg border border-border bg-muted-surface/40 p-4 text-xs leading-relaxed">
				<code>{`// routes/__root.tsx
<AppRouteProgress />`}</code>
			</pre>
			<p className="text-sm text-muted">
				A second instance would not render a second bar - NProgress is a module-level singleton - but it would give two
				effects the right to call `done()` on one navigation, and the first one to finish would clear the bar for both.
			</p>
			<p className="text-sm text-muted">
				The open question on it: `isLoading` is true for every route change including instant ones, so on a fast
				connection the bar flashes on navigations that never actually waited. A short delay before `start()` would fix
				that, and would cost the bar its honesty on slow ones.
			</p>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function Specimen({ caption, children }: { caption: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
			<div className="flex flex-1 items-center">{children}</div>
			<p className="text-xs text-muted">{caption}</p>
		</div>
	);
}

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
