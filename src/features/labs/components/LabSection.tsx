import { AppGlassCard } from "@bernardsapida/web-ui";
import type { ReactNode } from "react";

/**
 * One titled block on a lab page.
 *
 * Every lab had its own copy of this - same card, same heading, same
 * description paragraph - which is fine for one page and drift for twenty. New
 * labs import this; the older ones still carry their local version and can be
 * migrated when they are next touched.
 *
 * The `description` is required on purpose. A section of specimens with no
 * sentence saying what to look at is a screenshot, and the whole reason these
 * pages exist rather than a Figma file is that they can explain themselves.
 */
export function LabSection({
	children,
	description,
	title,
}: {
	children: ReactNode;
	description: string;
	title: string;
}) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="flex flex-col gap-4 p-5">
				<div>
					<h2 className="font-semibold text-lg text-text-primary">{title}</h2>
					<p className="mt-1 text-sm text-text-secondary">{description}</p>
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

/**
 * The heading over one half of a "bound vs standalone" pair.
 *
 * Both halves look identical on purpose - that IS the point being made - so
 * without a label the section reads as the same field rendered twice by
 * mistake.
 */
export function SpecimenLabel({ summary, title }: { summary?: string; title: string }) {
	return (
		<div>
			<h3 className="font-medium text-sm text-text-primary">{title}</h3>
			{summary ? <p className="mt-0.5 text-text-secondary text-xs">{summary}</p> : null}
		</div>
	);
}

/** What a field currently holds, for a lab where the stored shape is the lesson. */
export function ValueReadOut({ label, value }: { label: string; value: unknown }) {
	return (
		<p className="text-sm text-text-secondary">
			{label}:{" "}
			<code className="rounded bg-muted-surface/60 px-1.5 py-0.5 text-text-primary text-xs">
				{JSON.stringify(value) ?? "undefined"}
			</code>
		</p>
	);
}
