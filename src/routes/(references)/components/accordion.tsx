import { AppAccordion, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Accordion lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * The accordion's failure mode is content, not chrome: a panel whose body is
 * one line looks broken, and a trigger long enough to wrap pushes the chevron
 * off its baseline. Both are on this page, along with the controlled mode -
 * which is the one that actually gets used, because "expand the section the
 * error is in" is the reason most screens reach for an accordion at all.
 */
export const Route = createFileRoute("/(references)/components/accordion")({
	head: () => ({
		meta: [{ title: seo.title("Accordion lab") }, { content: "noindex", name: "robots" }],
	}),
	component: AccordionLabPage,
});

function AccordionLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Single, multiple and controlled - plus the content that breaks it."
				title="Accordion lab"
			/>
			<SingleSection />
			<MultipleSection />
			<ControlledSection />
			<ContentSection />
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

function Body({ children }: { children: ReactNode }) {
	return <p className="text-sm leading-relaxed text-muted">{children}</p>;
}

/* -------------------------------------------------------------------------- */

const FAQ_ITEMS = [
	{
		content: (
			<Body>
				Every 90 days on a freight account. We work the date out from your last recorded dispatch, so the countdown on
				your dashboard is the authority, not this page.
			</Body>
		),
		key: "frequency",
		subtitle: "Express, standard and freight differ",
		title: "How often can I book freight?",
	},
	{
		content: (
			<Body>
				Bring any government ID. If you have verified your identity in the app the warehouse can look you up by your
				account number instead, which is faster at the desk.
			</Body>
		),
		key: "id",
		subtitle: "What to bring on the day",
		title: "What do I need to check in?",
	},
	{
		content: (
			<Body>
				Yes. Cancel from the booking card on your dashboard. Do it as early as you can - the warehouse is holding a dock
				slot and a capacity target against your booking.
			</Body>
		),
		key: "cancel",
		subtitle: "And what happens to the warehouse's slot",
		title: "Can I cancel a booking?",
	},
];

/** One panel at a time - the default, and the right one for an FAQ. */
function SingleSection() {
	return (
		<LabSection
			description="One open at a time. This is the default because it is what an accordion is for: a list too long to read at once, where opening the next thing should put the last thing away."
			title="Single"
		>
			<AppAccordion
				data-cy="single"
				defaultExpandedKeys={["frequency"]}
				items={FAQ_ITEMS}
			/>
		</LabSection>
	);
}

/** Several open at once - for comparing, not for reading. */
function MultipleSection() {
	return (
		<LabSection
			description="Several open at once. Only worth it when the user needs to compare two panels side by side; otherwise it just lets them build a wall of text and lose the headings."
			title="Multiple"
		>
			<AppAccordion
				data-cy="multiple"
				defaultExpandedKeys={["frequency", "cancel"]}
				items={FAQ_ITEMS}
				selectionMode="multiple"
			/>
		</LabSection>
	);
}

/** Driven from outside - how a form opens the section holding an error. */
function ControlledSection() {
	const [expanded, setExpanded] = useState<string[]>([]);

	return (
		<LabSection
			description="Driven from outside. This is the mode that matters in a real form: when validation fails in a collapsed section, the page has to open that section rather than leaving the user hunting for a red field they cannot see."
			title="Controlled"
		>
			<div className="space-y-3">
				<div className="flex flex-wrap items-center gap-2">
					{FAQ_ITEMS.map((item) => (
						<button
							className="rounded-full border border-border px-3 py-1 text-xs font-medium transition hover:bg-white/60"
							data-cy={`open-${item.key}`}
							key={item.key}
							onClick={() => setExpanded([item.key])}
							type="button"
						>
							Open “{item.title}”
						</button>
					))}
					<button
						className="rounded-full border border-border px-3 py-1 text-xs font-medium transition hover:bg-white/60"
						data-cy="collapse-all"
						onClick={() => setExpanded([])}
						type="button"
					>
						Collapse all
					</button>
				</div>
				<AppAccordion
					data-cy="controlled"
					expandedKeys={expanded}
					items={FAQ_ITEMS}
					onExpandedChange={setExpanded}
				/>
				<p
					className="text-xs text-muted"
					data-cy="expanded-keys"
				>
					expandedKeys = [{expanded.join(", ") || "—"}]
				</p>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const AWKWARD_ITEMS = [
	{
		content: <Body>Yes.</Body>,
		key: "short",
		title: "A panel with a one-word answer",
	},
	{
		content: (
			<div className="space-y-3 text-sm leading-relaxed text-muted">
				<p>
					Screening asks about contents, destination, restricted goods and packaging. Any one of them can hold a
					shipment temporarily without meaning it can never ship - a hold is a date, not a verdict.
				</p>
				<ul className="list-inside list-disc space-y-1">
					<li>Destination outside the service area: 12 months</li>
					<li>Undeclared lithium batteries: 6 months</li>
					<li>Most customs holds: until the paperwork clears plus 7 days</li>
				</ul>
				<p>The duty manager at the warehouse makes the final call, and their answer overrides anything shown here.</p>
			</div>
		),
		key: "long",
		subtitle: "Lists, several paragraphs, and a caveat",
		title: "A panel long enough to need scrolling on a phone",
	},
	{
		content: (
			<Body>
				The chevron has to stay on the first line of the trigger rather than drifting to the vertical centre of a
				wrapped one.
			</Body>
		),
		key: "wrap",
		subtitle: "The subtitle wraps too, which is the second half of the same problem",
		title: "A trigger with a title long enough that it wraps onto a second line on a narrow screen",
	},
];

/** The content that has broken it before. */
function ContentSection() {
	return (
		<LabSection
			description="Three awkward panels: a one-word body, a body long enough to scroll, and a trigger that wraps. Check the chevron stays put and the panel does not jump as it opens."
			title="Awkward content"
		>
			<AppAccordion
				data-cy="awkward"
				items={AWKWARD_ITEMS}
			/>
		</LabSection>
	);
}
