import { AppButton, AppGlassCard, AppPageHeader, AppTagGroup } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Tag group lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * The filter strip at the top is the point of the page. A row of tags is only
 * meaningful against the thing it filters, and the two states worth looking at -
 * nothing selected, and a selection that matches nothing - cannot be shown by a
 * row of tags on its own.
 *
 * Then tab into any group. React Aria makes the LIST one tab stop and the
 * arrow keys move between tags inside it - so a group of fifteen filters costs
 * a keyboard user one stop, not fifteen. That is the behaviour to preserve if
 * this ever gets rewritten.
 */
export const Route = createFileRoute("/(references)/components/tag-group")({
	head: () => ({
		meta: [{ title: seo.title("Tag group lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Tag group" },
	component: TagGroupLabPage,
});

const TOPICS = [
	{ key: "billing", label: "Billing" },
	{ key: "shipping", label: "Shipping" },
	{ key: "returns", label: "Returns" },
	{ key: "account", label: "Account" },
	{ key: "api", label: "API" },
];

interface Article {
	title: string;
	topic: string;
}

const ARTICLES: Article[] = [
	{ title: "Why was I charged twice?", topic: "billing" },
	{ title: "Updating your card", topic: "billing" },
	{ title: "Tracking a shipment", topic: "shipping" },
	{ title: "Delivery windows by region", topic: "shipping" },
	{ title: "Starting a return", topic: "returns" },
	{ title: "Closing your account", topic: "account" },
];

function TagGroupLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A row of tags - as labels, as a multi-select, or as removable chips."
				title="Tag group lab"
			/>
			<FilterStripSection />
			<RemovableSection />
			<ReadOnlySection />
			<SingleSection />
			<SizeSection />
			<EmptySection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* The assembly                                                               */
/* -------------------------------------------------------------------------- */

/** Where a tag group actually lives: over the thing it filters. */
function FilterStripSection() {
	const [selected, setSelected] = useState<Set<string>>(new Set(["billing"]));

	const results = useMemo(
		() => (selected.size === 0 ? ARTICLES : ARTICLES.filter((article) => selected.has(article.topic))),
		[selected],
	);

	return (
		<LabSection
			description="Tags over the list they filter, which is the only arrangement that shows what they are for. Two states here that a row of tags on its own cannot reach: nothing selected, which must mean everything rather than nothing, and a combination that matches no articles - where the empty result belongs to the LIST and not to the tags, so the filters stay on screen and stay changeable. A filter that clears itself when it finds nothing has taken away the one control that could fix the problem."
			title="Over a result list"
			usedIn={["Help centres", "Catalogues", "Anywhere with facets over a list"]}
		>
			<AppTagGroup
				data-cy="filters"
				items={TOPICS}
				label="Filter by topic"
				onSelectionChange={setSelected}
				selectedKeys={selected}
				selectionMode="multiple"
			/>

			<div className="flex flex-wrap items-center gap-3">
				<p
					className="text-sm text-muted"
					data-cy="filters-summary"
				>
					{selected.size === 0
						? `No filter - all ${ARTICLES.length} articles`
						: `${results.length} of ${ARTICLES.length} articles`}
				</p>
				<AppButton
					data-cy="filters-clear"
					isDisabled={selected.size === 0}
					onPress={() => setSelected(new Set())}
					size="sm"
					variant="secondary"
				>
					Clear filters
				</AppButton>
			</div>

			{results.length === 0 ? (
				<div
					className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border p-4"
					data-cy="filters-empty"
				>
					<div className="flex items-center gap-2 text-sm font-medium">
						<Search
							aria-hidden="true"
							className="size-4 text-muted"
						/>
						No articles match these topics
					</div>
					<p className="text-sm text-muted">
						The filters are still up there and still changeable. Removing one is the fix, and it is one click away.
					</p>
				</div>
			) : (
				<ul
					className="divide-y divide-border overflow-hidden rounded-2xl border border-border"
					data-cy="filters-results"
				>
					{results.map((article) => (
						<li
							className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
							key={article.title}
						>
							<span>{article.title}</span>
							<span className="text-xs text-muted uppercase">{article.topic}</span>
						</li>
					))}
				</ul>
			)}
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */
/* Reference                                                                  */
/* -------------------------------------------------------------------------- */

function RemovableSection() {
	const [items, setItems] = useState(TOPICS);

	return (
		<LabSection
			description="`onRemove` is what puts the × on each tag - the affordance and the handler cannot drift apart, so there is no way to ship a remove button that removes nothing. It fires one key at a time even though React Aria hands over a set, because every call site removes from a list by id. Remove them all and the group says so rather than leaving its label over nothing."
			title="Removable"
			usedIn={["Applied-filter chips", "Recipients on a compose form", "Selected items anywhere"]}
		>
			<AppTagGroup
				data-cy="removable"
				emptyText="No filters applied"
				items={items}
				label="Applied filters"
				onRemove={(key) => setItems((current) => current.filter((item) => item.key !== key))}
			/>
			<AppButton
				data-cy="removable-restore"
				isDisabled={items.length === TOPICS.length}
				onPress={() => setItems(TOPICS)}
				size="sm"
				variant="secondary"
			>
				Restore
			</AppButton>
		</LabSection>
	);
}

function ReadOnlySection() {
	return (
		<LabSection
			description="The default. `selectionMode` is 'none', so these are labels and nothing else - click one and nothing happens, which is the correct amount of nothing. Anything that looks pressable and is not is worse than plain text."
			title="Labels"
			usedIn={["Tags on a card", "Categories on a detail page"]}
		>
			<AppTagGroup
				data-cy="labels"
				items={TOPICS}
				label="Topics"
			/>
		</LabSection>
	);
}

function SingleSection() {
	const [selected, setSelected] = useState<Set<string>>(new Set(["billing"]));

	return (
		<LabSection
			description="One at a time. Note what the arrow keys do here versus what Tab does: Tab leaves the group entirely, arrows move inside it. That is the whole reason to use a tag group instead of a row of individual buttons."
			title="Single selection"
			usedIn={["A required category on a form", "One-of-many switches"]}
		>
			<AppTagGroup
				data-cy="single"
				items={TOPICS}
				label="Primary topic"
				onSelectionChange={setSelected}
				selectedKeys={selected}
				selectionMode="single"
			/>
			<p className="text-sm text-muted">
				Selected:{" "}
				<span
					className="font-medium"
					data-cy="single-state"
				>
					{selected.size === 0 ? "none" : [...selected].join(", ")}
				</span>
			</p>
		</LabSection>
	);
}

function SizeSection() {
	const sizes = ["sm", "md", "lg"] as const;

	return (
		<LabSection
			description="Three sizes. `sm` is for tags riding inside a table row, where they annotate something rather than being the subject; `lg` is for a group that is the point of the panel it sits in."
			title="Size"
			usedIn={["sm: inside table rows", "md: default", "lg: when the tags are the subject"]}
		>
			<div className="flex flex-col gap-4">
				{sizes.map((size) => (
					<AppTagGroup
						data-cy={`size-${size}`}
						items={TOPICS.slice(0, 3)}
						key={size}
						label={size}
						size={size}
					/>
				))}
			</div>
		</LabSection>
	);
}

/** The gap this lab used to report, now closed. */
function EmptySection() {
	return (
		<LabSection
			description="An empty group used to render its label over nothing at all - a heading with no content under it, which reads as a section that failed to load rather than one that is genuinely empty. It now says what empty means, and the caller can word it: `emptyText` defaults to 'None'. The label can also be hidden where the surrounding copy already names the group, and it stays the group's accessible name when it is."
			title="Empty"
			usedIn={["Filter chips before anything is chosen", "An optional list on a fresh record"]}
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-2xl border border-dashed border-border p-4">
					<AppTagGroup
						data-cy="empty-default"
						items={[]}
						label="Applied filters"
					/>
				</div>
				<div className="rounded-2xl border border-dashed border-border p-4">
					<p className="mb-2 text-sm font-medium">Applied filters</p>
					<AppTagGroup
						data-cy="empty-worded"
						emptyText="Nothing applied yet - pick a topic above."
						isLabelHidden
						items={[]}
						label="Applied filters"
					/>
				</div>
			</div>
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
