import { AppChip, AppGlassCard, AppGradientIconTile, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Construction } from "lucide-react";
import { seo } from "@/config/seo.config";
import type { LabEntry } from "@/features/labs/labs.registry";
import { ALL_LABS, LAB_GROUPS } from "@/features/labs/labs.registry";
import { countComplete, getLabStatusMeta } from "@/features/labs/labs.status";

/**
 * Landing page for /components, so the bare URL is not a dead end.
 *
 * Grouped the same way the drawer nav is, off the same registry - this page
 * used to keep its own flat array of every lab, which meant a new lab had to be
 * added in two files and the two had drifted. See `features/labs/labs.registry.ts`.
 */
export const Route = createFileRoute("/(references)/components/")({
	head: () => ({
		meta: [{ title: seo.title("Components") }, { content: "noindex", name: "robots" }],
	}),
	component: ComponentsIndexPage,
});

function ComponentsIndexPage() {
	/*
	 * Complete, not built. "Built" was `!isStub`, which the code could answer on
	 * its own and which said only that the page has sections on it. Whether a lab
	 * is DONE is a judgement, and it is kept by hand in `labs.status.json`.
	 */
	const complete = countComplete(ALL_LABS.map((lab) => lab.to));

	return (
		<div className="space-y-8">
			<AppPageHeader
				subtitle={`One page per component, showing every state it can be in. ${complete} of ${ALL_LABS.length} complete. Developer references - not linked from the app.`}
				title="Components"
			/>

			{LAB_GROUPS.map((group) => (
				<section
					className="space-y-4"
					key={group.heading}
				>
					<h2 className="text-lg font-semibold text-text-primary">{group.heading}</h2>
					<LabGrid labs={group.labs} />
				</section>
			))}
		</div>
	);
}

function LabGrid({ labs }: { labs: LabEntry[] }) {
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{labs.map((lab) => {
				const status = getLabStatusMeta(lab.to);

				return (
					<Link
						className="group rounded-3xl focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:outline-none"
						key={lab.to}
						to={lab.to}
					>
						<AppGlassCard className="h-full transition group-hover:shadow-soft">
							<AppGlassCard.Content className="flex h-full items-start gap-4 p-5">
								<AppGradientIconTile icon={lab.icon} />
								<div className="min-w-0 flex-1">
									<p className="flex flex-wrap items-center gap-1.5 font-semibold">
										{lab.label}
										<ArrowRight
											aria-hidden="true"
											className="size-4 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-60"
										/>
										{/* The full chip here, a dot in the nav. This card is where
										    someone decides whether to open the page, so it is worth
										    the words; the nav row is 20rem wide and already full.
										    A stub says "Not built yet" rather than "On progress":
										    both are true, and only one of them is worth crossing the
										    page for. */}
										{lab.isStub ? (
											<AppChip
												icon={Construction}
												label="Not built yet"
												size="sm"
												tone="warning"
											/>
										) : (
											<AppChip
												icon={status.icon}
												label={status.label}
												size="sm"
												tone={status.tone}
											/>
										)}
									</p>
									<p className="mt-1 text-sm text-muted">{lab.blurb}</p>
								</div>
							</AppGlassCard.Content>
						</AppGlassCard>
					</Link>
				);
			})}
		</div>
	);
}
