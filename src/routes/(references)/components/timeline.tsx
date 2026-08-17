import type { TimelineEntry } from "@bernardsapida/web-ui";
import { AppButton, AppGlassCard, AppPageHeader, AppTimeline } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Timeline lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * The feed at the top is the one to poke at. Post an event with the top of the
 * list on screen and it flows straight in; scroll the list's top away first and
 * the same press is held back behind a "1 new entry" pill instead - which is
 * the whole rule, and the only way to see it is to try both.
 */
export const Route = createFileRoute("/(references)/components/timeline")({
	head: () => ({
		meta: [{ title: seo.title("Timeline lab") }, { content: "noindex", name: "robots" }],
	}),
	component: TimelineLabPage,
});

function TimelineLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="One vertical rail, one direction, and every entry answering who, what and when."
				title="Timeline lab"
			/>
			<FeedSection />
			<ProcessSection />
			<TypesSection />
			<ContentSection />
			<StatesSection />
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

/** A feed in its own panel, at the width one really gets. */
function Frame({ children }: { children: ReactNode }) {
	return <div className="max-w-xl rounded-3xl border border-border bg-surface p-4 sm:p-5">{children}</div>;
}

/* -------------------------------------------------------------------------- */

/**
 * A fixed instant for the first render and the real one after mount.
 *
 * The fixtures below are offsets from "now", and "now" differs between the
 * server's render and the browser's - which would put a different `datetime` in
 * the markup on each side. Anchoring the first render to a literal keeps the
 * two identical; the timeline itself defers its relative stamps for exactly the
 * same reason, so nothing visible changes twice.
 */
const FIXED_BASE = Date.parse("2026-08-03T09:00:00Z");

function useLabClock(): number {
	const [now, setNow] = useState<number | null>(null);

	useEffect(() => {
		setNow(Date.now());
	}, []);

	return now ?? FIXED_BASE;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/* -------------------------------------------------------------------------- */

interface Seed {
	actor: string;
	detail?: string;
	offset: number;
	summary?: string;
	title: string;
	type: TimelineEntry["type"];
}

const FEED_SEEDS: Seed[] = [
	{
		actor: "Mara Villanueva",
		offset: 8 * MINUTE,
		title: "assigned a warehouse to order #ORD-25841",
		type: "updated",
	},
	{
		actor: "System",
		offset: 40 * MINUTE,
		summary: "Nobody within 25km answered inside the two-hour window.",
		title: "expired request ORD-25702 automatically",
		type: "system",
	},
	{
		actor: "Josefa Ramos",
		detail:
			"The courier arrived at 14:05 but the last weight check was two days old, so screening was repeated in full before pickup. Nothing else on the checklist changed.",
		offset: 3 * HOUR,
		summary: "Screening repeated before pickup.",
		title: "commented on request ORD-25841",
		type: "commented",
	},
	{
		actor: "Mara Villanueva",
		offset: 5 * HOUR,
		title: "posted request ORD-25841",
		type: "created",
	},
	{
		actor: "Ben Cortez",
		offset: DAY + 2 * HOUR,
		summary: "The customer withdrew it before any warehouse was assigned.",
		title: "deleted request ORD-25698",
		type: "deleted",
	},
	{
		actor: "Ben Cortez",
		offset: DAY + 4 * HOUR,
		title: "updated the Express stock level to 4 pallets",
		type: "updated",
	},
];

const OLDER_SEEDS: Seed[] = [
	{
		actor: "System",
		offset: 6 * DAY,
		title: "closed the weekly reconciliation",
		type: "system",
	},
	{
		actor: "Josefa Ramos",
		offset: 9 * DAY,
		title: "verified the warehouse's permit renewal",
		type: "updated",
	},
	{
		actor: "Mara Villanueva",
		offset: 40 * DAY,
		title: "created the warehouse profile",
		type: "created",
	},
];

function toEntries(seeds: Seed[], base: number, keyPrefix: string): TimelineEntry[] {
	return seeds.map((seed, index) => ({
		actor: seed.actor,
		detail: seed.detail,
		key: `${keyPrefix}-${index}`,
		summary: seed.summary,
		timestamp: new Date(base - seed.offset),
		title: seed.title,
		type: seed.type,
	}));
}

/* -------------------------------------------------------------------------- */

/** Newest-first, with live arrivals and a page of older history. */
function FeedSection() {
	const base = useLabClock();
	const [posted, setPosted] = useState<TimelineEntry[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const older = hasMore ? [] : toEntries(OLDER_SEEDS, base, "older");
	const entries = [...posted, ...toEntries(FEED_SEEDS, base, "feed"), ...older];

	const post = () => {
		setPosted((current) => [
			{
				actor: "You",
				key: `posted-${current.length}`,
				timestamp: new Date(),
				title: `left a note on request ORD-25841 (${current.length + 1})`,
				type: "commented",
			},
			...current,
		]);
	};

	const loadMore = () => {
		setIsLoadingMore(true);
		setTimeout(() => {
			setHasMore(false);
			setIsLoadingMore(false);
		}, 700);
	};

	return (
		<LabSection
			description="An activity feed: newest first, grouped by day under sticky headers, relative stamps in the text and the instant in the markup. Post an event with the top of the feed on screen and it flows in. Scroll the top away first and the same press is held behind a pill instead - a prepend that shoves the entry you are reading down the page is the one thing a live feed must not do. Load more appends underneath, where nothing has to be restored afterwards."
			title="Activity feed"
		>
			<div className="space-y-4">
				<Frame>
					<AppTimeline
						data-cy="feed"
						entries={entries}
						isLoadingMore={isLoadingMore}
						label="Request activity"
						onLoadMore={hasMore ? loadMore : undefined}
					/>
				</Frame>
				<div className="flex flex-wrap items-center gap-2">
					<AppButton
						data-cy="feed-post"
						onPress={post}
						size="sm"
						variant="primary"
					>
						Post an event
					</AppButton>
					<AppButton
						data-cy="feed-reset"
						isDisabled={posted.length === 0}
						onPress={() => setPosted([])}
						size="sm"
						variant="secondary"
					>
						Reset
					</AppButton>
					<p className="text-sm text-muted">{posted.length} posted this session</p>
				</div>
			</div>
		</LabSection>
	);
}

const PROCESS_SEEDS: Seed[] = [
	{
		actor: "Mara Villanueva",
		offset: 5 * HOUR,
		title: "opened the shipment manifest",
		type: "created",
	},
	{
		actor: "Ben Cortez",
		offset: 3 * HOUR,
		summary: "12 items, Express and Standard.",
		title: "packed the pallet",
		type: "updated",
	},
	{
		actor: "System",
		offset: 90 * MINUTE,
		title: "notified the receiving warehouse",
		type: "system",
	},
	{
		actor: "Josefa Ramos",
		offset: 20 * MINUTE,
		title: "signed for the delivery",
		type: "updated",
	},
];

/** The other direction, and the only other one there is. */
function ProcessSection() {
	const base = useLabClock();

	return (
		<LabSection
			description="Oldest-first, for a process being followed through rather than a feed being watched. The direction is the caller's to state and the component never re-sorts - it can only disagree with what was passed. Nothing is ever held back here either: new entries land at the bottom, which is not where the reader is."
			title="Oldest-first"
		>
			<Frame>
				<AppTimeline
					data-cy="process"
					entries={toEntries(PROCESS_SEEDS, base, "process")}
					label="Shipment history"
					order="oldest-first"
				/>
			</Frame>
		</LabSection>
	);
}

const TYPE_SEEDS: Seed[] = [
	{
		actor: "Mara Villanueva",
		offset: 4 * MINUTE,
		title: "created request ORD-25999",
		type: "created",
	},
	{
		actor: "Ben Cortez",
		offset: 20 * MINUTE,
		title: "updated the pickup window",
		type: "updated",
	},
	{
		actor: "Josefa Ramos",
		offset: 45 * MINUTE,
		title: "commented on the screening notes",
		type: "commented",
	},
	{
		actor: "System",
		offset: 2 * HOUR,
		title: "archived the expired match",
		type: "system",
	},
	{
		actor: "Ben Cortez",
		offset: 3 * HOUR,
		title: "deleted the duplicate customer record",
		type: "deleted",
	},
];

/** Five types, five glyphs, five tones. */
function TypesSection() {
	const base = useLabClock();

	return (
		<LabSection
			description="Every event type on one rail. The glyph is what makes it skimmable and the colour only sorts what the glyph already said - in greyscale this list still reads. Each dot carries its type as screen-reader text too, because a colour and an icon are both silent. Amber is the system row on purpose: it is the only entry nobody chose."
			title="Every type"
		>
			<Frame>
				<AppTimeline
					data-cy="types"
					entries={toEntries(TYPE_SEEDS, base, "types")}
					label="Every event type"
				/>
			</Frame>
		</LabSection>
	);
}

const LONG_SEEDS: Seed[] = [
	{
		actor: "Maria Consuelo Villanueva-Santos",
		detail:
			"Reason: the customer revised the required quantity from 4 pallets to 6 after the second stock count, which pushed the allocation outside the original warehouse's capacity window. The two warehouses already confirmed were kept; the remaining two slots were reopened to the 25km radius, and the SMS batch went out at 14:12. No warehouse was contacted twice.",
		offset: 12 * MINUTE,
		summary: "Two slots reopened to the 25km radius.",
		title: "reopened order #ORD-25841 for Quezon City North Depot's night desk after the quantity was revised upward",
		type: "updated",
	},
	{
		actor: "System",
		detail: "expired_at=2026-08-03T04:00:00Z · radius_km=25 · notified=41 · responded=0 · reason=window_elapsed",
		offset: 55 * MINUTE,
		summary: "41 warehouses notified, none responded.",
		title: "expired request ORD-25702 automatically",
		type: "system",
	},
	{
		actor: "Ben Cortez",
		offset: 2 * HOUR,
		title: "acknowledged it",
		type: "commented",
	},
];

/** The content that breaks the row. */
function ContentSection() {
	const base = useLabClock();

	return (
		<LabSection
			description="A name and a sentence long enough to wrap, next to a stamp that must not be squeezed. The sentence wraps rather than truncating - it IS the entry, and ellipsising the object it names throws away the half worth reading; the stamp is shrink-0 and drops to its own line on a phone. The bodies are collapsed on arrival with their summary line still visible, because a timeline is scanned first and read second."
			title="Long content"
		>
			<Frame>
				<AppTimeline
					data-cy="long"
					entries={toEntries(LONG_SEEDS, base, "long")}
					label="Long entries"
				/>
			</Frame>
		</LabSection>
	);
}

/** The two states that are not a list of events. */
function StatesSection() {
	return (
		<LabSection
			description="Loading is the rail and four dots at the real row height, so nothing jumps when the entries land - not a spinner in an empty panel. Empty says why: 'No activity yet' for a feed nothing has happened in, and the table's own filtered and no-results reasons when a filter or a search is what emptied it."
			title="Loading and empty"
		>
			<div className="grid gap-4 lg:grid-cols-2">
				<Frame>
					<AppTimeline
						data-cy="state-loading"
						entries={[]}
						isLoading
						label="Request activity"
					/>
				</Frame>
				<Frame>
					<AppTimeline
						data-cy="state-empty"
						entries={[]}
						label="Request activity"
					/>
				</Frame>
				<Frame>
					<AppTimeline
						data-cy="state-filtered"
						empty={{
							action: { label: "Clear filters", onPress: () => {} },
							reason: "filtered",
						}}
						entries={[]}
						label="Request activity"
					/>
				</Frame>
				<Frame>
					<AppTimeline
						data-cy="state-no-results"
						empty={{ query: "cortez", reason: "no-results" }}
						entries={[]}
						label="Request activity"
					/>
				</Frame>
			</div>
		</LabSection>
	);
}
