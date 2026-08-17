import { AppGlassCard, AppNotFound, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { seo } from "@/config/seo.config";

/**
 * Not found lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * This one is already wired into the router twice (`router.tsx` and
 * `__root.tsx`), so the specimen below is the real component rather than a
 * mock-up of it - which also means the buttons in it really navigate. That is
 * the check: press "Go back" and you should land here again, not on a blank
 * history entry.
 *
 * It is rendered inside a bordered, scrolling box because it is a PAGE - it
 * carries `min-h-screen` and its own backdrop, and dropping it straight into a
 * lab column would push every section below it a full viewport down.
 */
export const Route = createFileRoute("/(references)/components/not-found")({
	head: () => ({
		meta: [{ title: seo.title("Not found lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Not found" },
	component: NotFoundLabPage,
});

function NotFoundLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The router's 404, for an address that matches no route."
				title="Not found lab"
			/>
			<SpecimenSection />
			<ActionsSection />
			<LiveSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

function SpecimenSection() {
	return (
		<LabSection
			description="The component as the router renders it, boxed so it does not take the whole page here. It is AppErrorState in a full-height shell rather than a hand-written screen, which is what makes a 404 say the same three things a failed query says: what happened, what to do, and a reference for someone who thinks the link should have worked."
			title="Specimen"
			usedIn={["Every unmatched address", "router.tsx and __root.tsx, both wired to this"]}
		>
			{/*
			 * A clipped, scrolling frame: the component is min-h-screen and paints its
			 * own AppBackdrop, so it needs a box of its own or it would drag the rest
			 * of this page a viewport downward.
			 */}
			<div
				className="h-128 overflow-y-auto rounded-2xl border border-border"
				data-cy="specimen-frame"
			>
				<AppNotFound />
			</div>
		</LabSection>
	);
}

function ActionsSection() {
	return (
		<LabSection
			description="Two ways out, and the order is deliberate. 'Go back' is the built-in primary because the overwhelming majority of 404s are a stale link followed from somewhere the user still wants to be. Home is the secondary, for the ones that arrived cold from a bookmark or a chat message."
			title="Why back is primary"
			usedIn={["The rules a 404 has to keep, whatever the project"]}
		>
			<ul
				className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted"
				data-cy="rules"
			>
				<li>
					<span className="font-medium text-foreground">Never a dead end.</span> AppErrorState has no &quot;no
					recovery&quot; mode - a 404 with nothing to press is the one screen this app may not ship.
				</li>
				<li>
					<span className="font-medium text-foreground">No search box.</span> A site search on a 404 is a guess that the
					user wanted a different page here rather than this page; it is worth adding only once there is a search worth
					offering.
				</li>
				<li>
					<span className="font-medium text-foreground">The app name is in the secondary label</span>, so the button
					says where it goes rather than assuming the user knows what &quot;home&quot; means on this site.
				</li>
			</ul>
		</LabSection>
	);
}

function LiveSection() {
	return (
		<LabSection
			description="The real thing, from the real router. Follow this and you get the component full-page, mounted by the notFoundComponent rather than by a lab - which is the only way to check that the route tree actually reaches it."
			title="See it for real"
			usedIn={["Proving the route tree actually reaches the notFoundComponent"]}
		>
			{/*
			 * A plain anchor, not <Link>. The router's types only accept paths that
			 * exist, which is exactly the guarantee that makes a typed link useless
			 * for demonstrating what happens when one does not.
			 */}
			<a
				className="text-sm font-medium text-primary underline-offset-4 hover:underline"
				data-cy="dead-link"
				href="/components/this-route-does-not-exist"
			>
				/components/this-route-does-not-exist
			</a>
			<p className="text-sm text-muted">
				Use the browser Back button to return - the 404 replaces this page rather than opening over it.
			</p>
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
