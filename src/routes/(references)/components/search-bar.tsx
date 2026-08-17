import type { SearchResultItem } from "@bernardsapida/web-ui";
import { AppGlassCard, AppPageHeader, AppSearchBar, AppToast } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Building2, Package, Truck, User } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Search bar lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * The thing to poke at is the panel, not the field. Focus the bar without typing
 * anything - it must never be a blank box. Type "que" and the matched run is
 * marked inside each row. Type "zzz" and you get a named dead end with a way out
 * of it. Then do all three again with the keyboard only: arrows walk the chips
 * and the rows the same way, Enter runs the highlighted one, the first Escape
 * clears the text and the second closes the panel - and the caret never leaves
 * the field for any of it.
 *
 * The first bar persists its recents, so reload the page and they are still
 * there. That is the whole reason recents are worth having.
 */
export const Route = createFileRoute("/(references)/components/search-bar")({
	head: () => ({
		meta: [{ title: seo.title("Search bar lab") }, { content: "noindex", name: "robots" }],
	}),
	component: SearchBarLabPage,
});

function SearchBarLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A field, and a panel under it that is never blank."
				title="Search bar lab"
			/>
			<LiveSection />
			<SlowSection />
			<FirstRunSection />
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
		/*
		 * `relative focus-within:z-50` is what keeps the results panel IN FRONT of
		 * the next card, and it is not optional decoration.
		 *
		 * AppGlassCard paints `backdrop-filter`, and per spec that creates a stacking
		 * context. The panel's own `z-40` therefore only sorts it within THIS card -
		 * it cannot lift it over a sibling card, and sibling stacking contexts at
		 * `z-index: auto` paint in DOM order, so every later section was drawn on
		 * top of the open panel.
		 *
		 * Lifting on `focus-within` rather than with a fixed z-index per section is
		 * what avoids hand-numbering the whole page: the panel is only open while
		 * the field inside has focus, so exactly the card that needs to win is the
		 * one that rises, and it drops back the moment focus leaves.
		 */
		<AppGlassCard className="relative focus-within:z-50">
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
				</div>
				{children}
				{/* Reserves the room the panel needs so it does not simply overhang the
				    next card. The stacking above is what makes it legible when it does;
				    this is what stops it needing to. Both are the lab holding the door
				    open, not rules of the component. */}
				<div className="h-72" />
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

/* -------------------------------------------------------------------------- */

const CATALOGUE: SearchResultItem[] = [
	{
		badge: { label: "Open", tone: "success" },
		category: "Warehouses",
		icon: Building2,
		imageSrc: "/images/logo.png",
		key: "f1",
		label: "Quezon City North Depot",
		meta: ["Barangay Bagong Silangan, Quezon City", "24/7"],
		trailing: "2.4 km",
	},
	{
		badge: { label: "Open", tone: "success" },
		category: "Warehouses",
		icon: Building2,
		key: "f2",
		label: "Manila Bayside Warehouse",
		meta: ["Taft Avenue, Manila", "Cold storage"],
		trailing: "6.1 km",
	},
	{
		badge: { label: "Closes 6pm", tone: "warning" },
		category: "Warehouses",
		// A 404 on purpose: the tile has to fall back to the glyph without the
		// row changing height.
		imageSrc: "/does-not-exist.png",
		icon: Building2,
		key: "f3",
		label: "Makati Central Hub",
		meta: ["Amorsolo Street, Makati", "Cross-dock"],
		trailing: "8.7 km",
	},
	{
		badge: { label: "Mobile only", tone: "default" },
		category: "Warehouses",
		icon: Truck,
		key: "f4",
		label: "Rizal Regional Depot",
		meta: ["Pasig", "Courier only"],
		trailing: "11 km",
	},
	{
		badge: { label: "Active", tone: "success" },
		category: "Customers",
		icon: User,
		key: "d1",
		label: "Maria Dela Cruz",
		meta: ["Express", "Last ordered 4 months ago"],
	},
	{
		badge: { label: "Active", tone: "success" },
		category: "Customers",
		icon: User,
		key: "d2",
		label: "Noah Reyes",
		meta: ["Standard", "Quezon City"],
	},
	{
		badge: { label: "On hold", tone: "danger" },
		category: "Customers",
		icon: User,
		key: "d3",
		label: "Daniel Quezon",
		meta: ["Economy", "Until 12 March"],
	},
	{
		badge: { label: "Urgent", tone: "danger" },
		category: "Orders",
		icon: Package,
		key: "r1",
		label: "ORD-2481 · Quezon City",
		meta: ["Raised 40 minutes ago", "BGC Fulfilment Centre"],
		trailing: "2 items",
	},
	{
		badge: { label: "Scheduled", tone: "accent" },
		category: "Orders",
		icon: Package,
		key: "r2",
		label: "ORD-2490 · Manila",
		meta: ["For 14 March", "Freight"],
		trailing: "1 item",
	},
	{
		badge: { label: "Allocating", tone: "warning" },
		category: "Orders",
		icon: Package,
		key: "r3",
		label: "ORD-2503 · Makati",
		meta: ["Raised yesterday", "Express"],
		trailing: "4 items",
	},
];

/**
 * Stands in for the network call a real bar makes. The delay is the point: a
 * search that resolves instantly never shows the states that break in
 * production.
 */
function useMockSearch(query: string, delayMs: number) {
	const [results, setResults] = useState<SearchResultItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!query) {
			setResults([]);
			setIsLoading(false);
			return;
		}
		setIsLoading(true);
		const timer = setTimeout(() => {
			const needle = query.toLowerCase();
			setResults(
				CATALOGUE.filter(
					(item) =>
						item.label.toLowerCase().includes(needle) || item.meta?.some((fact) => fact.toLowerCase().includes(needle)),
				),
			);
			setIsLoading(false);
		}, delayMs);

		return () => clearTimeout(timer);
	}, [query, delayMs]);

	return { isLoading, results };
}

/**
 * The glyph for a recent chip. A recent is stored as its text, so the record it
 * came from has to be found again by that text - exactly, because "Manila
 * Bayside Warehouse" is a record somebody picked while "manila" is a query
 * somebody typed, and only the first one has an icon to show.
 */
function catalogueIcon(query: string): LucideIcon | undefined {
	const needle = query.trim().toLowerCase();
	return CATALOGUE.find((item) => item.label.toLowerCase() === needle)?.icon;
}

function announceSelection(result: SearchResultItem) {
	AppToast.info(result.label, {
		description: `${result.category} · the lab does not navigate anywhere.`,
		icon: Package,
	});
}

function announceSubmit(query: string) {
	AppToast.info(`Searching for “${query}”`, {
		description: "Saved to recent searches. Reload the page - it is still there.",
		icon: Package,
	});
}

/* -------------------------------------------------------------------------- */

/** The default: a real dataset, persisted recents, every state reachable. */
function LiveSection() {
	const [query, setQuery] = useState("");
	const { isLoading, results } = useMockSearch(query, 220);

	return (
		<LabSection
			description="Type 'que' or 'hub'. Results are grouped by kind and each row is a record, not a sentence: a thumbnail (with the glyph and then initials behind it when an image 404s), the name with the matched run marked, the facts that tell two of them apart, and at most one number and one status on the right. Focus it and do nothing and you get recents instead - never a blank panel. Pick a row and its chip carries that record's own glyph; type 'que' and submit it and that chip keeps the clock, because it is a query rather than a record. The recents persist across a reload, and each chip removes with its own x or with Delete while it is highlighted."
			title="The bar"
		>
			<AppSearchBar
				data-cy="search-live"
				isLoading={isLoading}
				label="Search warehouses, customers and orders"
				onQueryChange={setQuery}
				onSelectResult={announceSelection}
				onSubmit={announceSubmit}
				placeholder="Search by warehouse, customer or order"
				recentIcon={catalogueIcon}
				results={results}
				storageKey="app.lab.search-bar.recents"
			/>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** Where the loading design is actually visible. */
function SlowSection() {
	const [query, setQuery] = useState("");
	const { isLoading, results } = useMockSearch(query, 1400);

	return (
		<LabSection
			description="The same bar on a slow connection. The spinner sits in the field and the panel holds three rows at the height the real ones will be - it never flashes 'No results' at a user whose request is still in the air, which is the commonest way a search bar lies."
			title="Slow network"
		>
			<AppSearchBar
				data-cy="search-slow"
				isLoading={isLoading}
				label="Search on a slow connection"
				onQueryChange={setQuery}
				onSelectResult={announceSelection}
				onSubmit={announceSubmit}
				placeholder="Search by warehouse, customer or order"
				recentIcon={catalogueIcon}
				results={results}
				storageKey="app.lab.search-bar.slow-recents"
			/>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** No storage key, so the recents start empty on every mount. */
function FirstRunSection() {
	return (
		<LabSection
			description="Somebody's first search. There is nothing to recall yet, so the panel says what recents are for rather than showing an empty box - and it says it in the same place the chips will appear. This bar has no results wired at all: it only submits, which is the shape of a bar that navigates to a results page."
			title="First run"
		>
			<AppSearchBar
				data-cy="search-first-run"
				label="Search everything"
				onSubmit={announceSubmit}
				placeholder="Search by name, city or reference"
			/>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const LONG_RESULTS: SearchResultItem[] = Array.from({ length: 14 }, (_, index) => ({
	badge: { label: "Open", tone: "success" as const },
	category: index % 2 === 0 ? "Warehouses" : "Orders",
	icon: Building2,
	key: `long-${index}`,
	label: `Quezon City North Depot — Satellite Pickup Point ${index + 1}`,
	meta: ["Barangay Bagong Silangan, Quezon City, Metro Manila", "24/7", "Courier only"],
	trailing: "12.4 km",
}));

/** The content that breaks a panel. */
function ContentSection() {
	return (
		<LabSection
			description="Fourteen records whose names and first fact are both too long for the panel. The name truncates on one line and so does the first fact - but the SHORT facts after it hold their width, because losing '24/7' off the end costs more than losing the tail of a street address. The distance and the status stay pinned to the right. Arrow down past the last visible row and the panel scrolls to follow the highlight; past six results a 'See all' row appears under them."
			title="Long content"
		>
			<AppSearchBar
				data-cy="search-long"
				label="Search long records"
				onSelectResult={announceSelection}
				onSubmit={announceSubmit}
				placeholder="Type anything to see the overflow"
				results={LONG_RESULTS}
			/>
		</LabSection>
	);
}
