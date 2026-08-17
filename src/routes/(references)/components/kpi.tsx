import type { KpiPoint } from "@bernardsapida/web-ui";
import { AppGlassCard, AppKpi, AppKpiSkeleton, AppPageHeader, AppToast } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	CircleDollarSign,
	Copy,
	Download,
	Gauge,
	HardDrive,
	MousePointerClick,
	Pin,
	ShoppingCart,
	Timer,
	Trash2,
	TrendingUp,
	Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { seo } from "@/config/seo.config";

/**
 * KPI lab. Developer reference under /components, which owns the backdrop and
 * the nav; every page there is noindex.
 *
 * The dashboard at the top is the point of the page. A KPI tile on its own is a
 * number in a box - what makes it a component worth having is the ROW: eight of
 * them at three different widths, half with a trend and half without, and every
 * value landing on the same line so the grid can be read down rather than tile
 * by tile.
 *
 * Two things to check by hand, because neither shows up in a screenshot:
 *
 * 1. **The reflow.** Drag the window narrow and watch the wide tile in "One
 *    tile, two widths". The chart moves from beside the value to under it, and
 *    it does that off the TILE's width rather than the window's - so the same
 *    component is inline in a two-up grid and stacked in a four-up one on the
 *    same screen.
 * 2. **The direction rule.** In "Up is not always good" the bounce-rate tile
 *    falls and is GREEN. Colour comes from direction AND `isUpGood` together,
 *    and no caller can override it - which is the point, because a green line
 *    under a falling number is read before the number is.
 */
export const Route = createFileRoute("/(references)/components/kpi")({
	head: () => ({
		meta: [{ title: seo.title("KPI lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "KPI" },
	component: KpiLabPage,
});

function KpiLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="One number a dashboard leads with, and the three things that can sit under it."
				title="KPI lab"
			/>
			<DashboardSection />
			<LoadingSection />
			<LineSection />
			<ProgressSection />
			<ValueSection />
			<ActionsSection />
			<DirectionSection />
			<EdgesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

const REVENUE: KpiPoint[] = [
	{ label: "Wk 1", value: 17_420 },
	{ label: "Wk 2", value: 17_980 },
	{ label: "Wk 3", value: 17_310 },
	{ label: "Wk 4", value: 18_640 },
	{ label: "Wk 5", value: 18_220 },
	{ label: "Wk 6", value: 19_050 },
	{ label: "Wk 7", value: 18_770 },
	{ label: "Wk 8", value: 19_910 },
	{ label: "Wk 9", value: 20_480 },
	{ label: "Wk 10", value: 20_160 },
	{ label: "Wk 11", value: 20_940 },
	{ label: "Wk 12", value: 21_300 },
];

const SHARE_PRICE: KpiPoint[] = [
	{ label: "Mon", value: 51.4 },
	{ label: "Tue", value: 51.9 },
	{ label: "Wed", value: 51.2 },
	{ label: "Thu", value: 50.6 },
	{ label: "Fri", value: 50.9 },
	{ label: "Sat", value: 50.1 },
	{ label: "Sun", value: 49.7 },
	{ label: "Mon", value: 49.9 },
	{ label: "Tue", value: 49.33 },
];

const SESSIONS: KpiPoint[] = [
	{ label: "Jan", value: 41_200 },
	{ label: "Feb", value: 43_900 },
	{ label: "Mar", value: 42_100 },
	{ label: "Apr", value: 47_600 },
	{ label: "May", value: 51_300 },
	{ label: "Jun", value: 55_800 },
];

const money = (plotted: number) => `$${plotted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const price = (plotted: number) => `$${plotted.toFixed(2)}`;

function pinned(title: string) {
	AppToast.success("Pinned to the top", {
		description: `${title} now leads the dashboard.`,
		icon: Pin,
	});
}

/**
 * Removing a tile acts immediately and reports with an Undo, which is the rule
 * for every destructive action in this app that has something to undo TO.
 */
function removed(title: string) {
	AppToast.success("Tile removed", {
		action: {
			label: "Undo",
			onPress: () =>
				AppToast.success("Tile restored", {
					description: `${title} is back on the dashboard.`,
					icon: Pin,
				}),
		},
		description: `${title} is off the dashboard.`,
		icon: Trash2,
	});
}

/* -------------------------------------------------------------------------- */
/* The assembly                                                               */
/* -------------------------------------------------------------------------- */

/** Where a KPI actually lives. Everything below this is reference. */
function DashboardSection() {
	return (
		<LabSection
			description="Eight tiles at three widths, which is the state this component has to survive - not one tile on its own. Read it DOWN: every value sits on the same line whether or not the tile above it has a chip, a chart or a footer, because a dashboard whose numbers stagger is one you have to read tile by tile. The wide tile carries its trend beside the value; the same component in the four-up row underneath puts it below, off its own width."
			title="On a dashboard"
			usedIn={["The signed-in home", "A reporting page's header row", "An admin overview"]}
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppKpi
					chart={{ formatValue: money, kind: "line", points: REVENUE }}
					data-cy="dash-revenue"
					delta={{
						direction: "up",
						label: "+11.5%",
						period: "vs previous 30 days",
					}}
					icon={CircleDollarSign}
					title="Monthly revenue"
					value="$21,300"
				/>
				<AppKpi
					chart={{ formatValue: price, kind: "line", points: SHARE_PRICE }}
					data-cy="dash-price"
					delta={{
						direction: "down",
						label: "-1.9%",
						period: "vs yesterday's close",
					}}
					icon={TrendingUp}
					title="Baer Limited (BAL)"
					value="$49.33"
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<AppKpi
					data-cy="dash-conversion"
					delta={{ direction: "up", label: "+1.7%", period: "vs last week" }}
					icon={ShoppingCart}
					title="Conversion rate"
					value="3.8%"
				/>
				<AppKpi
					data-cy="dash-bounce"
					delta={{
						direction: "down",
						isUpGood: false,
						label: "-5.9%",
						period: "vs last week",
					}}
					icon={MousePointerClick}
					title="Bounce rate"
					value="42.3%"
				/>
				<AppKpi
					data-cy="dash-load"
					delta={{
						direction: "up",
						isUpGood: false,
						label: "+38ms",
						period: "vs last week",
					}}
					icon={Timer}
					title="Load time"
					value="856ms"
				/>
				<AppKpi
					chart={{
						caption: "3,420 of 5,000 seats",
						kind: "progress",
						label: "Seats used",
						max: 5000,
						value: 3420,
					}}
					data-cy="dash-seats"
					icon={Users}
					title="Seats used"
					value="3,420"
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<AppKpi
					data-cy="dash-subscribers"
					delta={{ direction: "up", label: "+122", period: "vs last 7 days" }}
					footer={{
						label: "View all subscribers",
						to: "/components/users-list",
					}}
					icon={Users}
					title="Total subscribers"
					value="71,897"
				/>
				<AppKpi
					chart={{
						formatValue: (plotted) => `${(plotted / 1000).toFixed(1)}K`,
						kind: "line",
						points: SESSIONS,
					}}
					data-cy="dash-sessions"
					delta={{
						direction: "up",
						label: "+20.1%",
						period: "vs last quarter",
					}}
					footer={{ label: "View report", to: "/components/table" }}
					icon={Activity}
					title="Sessions"
					value="55,800"
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */
/* Reference                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The state every KPI is in first. Kept second on the page, not last, because
 * it is the one a consumer renders before anything else.
 */
function LoadingSection() {
	return (
		<LabSection
			description="A KPI always arrives from a query, so this is not an edge case - it is the first thing the screen draws. Compare each skeleton with the real tile under it: same inset, same tile size, same three bands, same height. `chart` has to be passed rather than inferred, because at this point there is nothing to infer from; get it wrong and you have moved the jump rather than removed it, since a tile that loads a sparkline into a box sized for a plain value grows 92px the moment it resolves."
			title="Loading"
			usedIn={["Every dashboard, before the numbers land"]}
		>
			<div
				aria-busy="true"
				className="grid gap-4 sm:grid-cols-3"
			>
				<AppKpiSkeleton
					chart="line"
					hasFooter
				/>
				<AppKpiSkeleton chart="progress" />
				<AppKpiSkeleton hasDelta={false} />
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<AppKpi
					chart={{ formatValue: money, kind: "line", points: REVENUE }}
					data-cy="loaded-line"
					delta={{
						direction: "up",
						label: "+11.5%",
						period: "vs previous 30 days",
					}}
					footer={{ label: "View report", to: "/components/table" }}
					icon={CircleDollarSign}
					title="Monthly revenue"
					value="$21,300"
				/>
				<AppKpi
					chart={{
						caption: "3,420 of 5,000 seats",
						kind: "progress",
						label: "Seats used",
						max: 5000,
						value: 3420,
					}}
					data-cy="loaded-progress"
					delta={{ direction: "up", label: "+140", period: "vs last month" }}
					icon={Users}
					title="Seats used"
					value="3,420"
				/>
				<AppKpi
					data-cy="loaded-value"
					icon={Activity}
					title="Open incidents"
					value="0"
				/>
			</div>
			<p className="text-sm text-muted">
				The skeletons are `aria-hidden` and the grid carries `aria-busy`. Six of them announcing "loading" individually
				is six announcements of one fact.
			</p>
		</LabSection>
	);
}

function LineSection() {
	return (
		<LabSection
			description="Hover the chart, or tab to it and press the arrow keys. The crosshair snaps to the NEAREST reading rather than the one under the pointer, because the readings are a few pixels apart and nobody aims at a 2px line. The readout leads with the value - you already know which series you are pointing at. Everything the readout shows is also written out for a screen reader in an sr-only list, so a value is never gated behind a pointer."
			title="Line chart, and the readout"
			usedIn={["Revenue over twelve weeks", "A price over a trading day", "Anything with a history"]}
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppKpi
					chart={{ formatValue: money, kind: "line", points: REVENUE }}
					data-cy="line-wide"
					delta={{
						direction: "up",
						label: "+11.5%",
						period: "vs previous 30 days",
					}}
					icon={CircleDollarSign}
					title="Monthly revenue"
					value="$21,300"
				/>
				<div className="max-w-64">
					<AppKpi
						chart={{ formatValue: money, kind: "line", points: REVENUE }}
						data-cy="line-narrow"
						delta={{
							direction: "up",
							label: "+11.5%",
							period: "vs previous 30 days",
						}}
						icon={CircleDollarSign}
						title="Monthly revenue"
						value="$21,300"
					/>
				</div>
			</div>
			<p className="text-sm text-muted">
				Same tile, two widths, no `variant` prop between them. The narrow one is capped at 16rem so the reflow is
				visible without resizing the window - the tile is its own container, so it responds to the column it was given
				rather than to the viewport. A viewport breakpoint gets the four-up row above wrong on a desktop.
			</p>
			<p className="text-sm text-muted">
				The vertical scale is the series' own min and max, NOT zero. That is the opposite of the rule for bars, and
				deliberately: a bar's length is its value, so truncating its baseline turns a 2% move into a cliff - but
				zero-basing a revenue line that never approaches zero flattens the whole quarter into a strip and reports that
				nothing happened. The value above the chart carries the magnitude; the line carries the direction.
			</p>
		</LabSection>
	);
}

function ProgressSection() {
	return (
		<LabSection
			description="A ceiling rather than a history: how much of a quota, a plan or a disk is gone. The tone here is SEVERITY and it is the one colour a caller picks, because where a quota becomes worrying is a product decision - 80% of a seat allowance is fine, 80% of a disk is not. The bar's own label is hidden, since the tile's title is two lines above it, but it stays as the accessible name."
			title="Progress"
			usedIn={["Seats on a plan", "Storage used", "Progress toward a quarterly target"]}
		>
			<div className="grid gap-4 sm:grid-cols-3">
				<AppKpi
					chart={{
						caption: "3,420 of 5,000 seats",
						kind: "progress",
						label: "Seats used",
						max: 5000,
						value: 3420,
					}}
					data-cy="progress-accent"
					icon={Users}
					title="Seats used"
					value="3,420"
				/>
				<AppKpi
					chart={{
						caption: "412 GB of 500 GB",
						kind: "progress",
						label: "Storage used",
						max: 500,
						tone: "warning",
						value: 412,
					}}
					data-cy="progress-warning"
					icon={HardDrive}
					title="Storage used"
					value="412 GB"
				/>
				<AppKpi
					chart={{
						caption: "97,400 of 100,000 calls",
						kind: "progress",
						label: "API calls this month",
						max: 100_000,
						tone: "danger",
						value: 97_400,
					}}
					data-cy="progress-danger"
					delta={{
						direction: "up",
						isUpGood: false,
						label: "+14%",
						period: "vs last month",
					}}
					icon={Gauge}
					title="API calls"
					value="97,400"
				/>
			</div>
		</LabSection>
	);
}

function ValueSection() {
	return (
		<LabSection
			description="No chart at all, which is the right answer for a number with no history worth drawing and no ceiling to fill. The footer is the way out - exactly one, and a real link where it navigates, so it can be middle-clicked and opened in a tab. Two actions in a tile means the tile has become a page."
			title="Value, chip and footer"
			usedIn={["A count with a detail screen behind it", "A figure whose history lives elsewhere"]}
		>
			<div className="grid gap-4 sm:grid-cols-3">
				<AppKpi
					data-cy="value-plain"
					icon={Users}
					title="Total subscribers"
					value="71,897"
				/>
				<AppKpi
					data-cy="value-chip"
					delta={{ direction: "up", label: "+122", period: "vs last 7 days" }}
					icon={Users}
					title="Total subscribers"
					value="71,897"
				/>
				<AppKpi
					data-cy="value-footer"
					delta={{ direction: "up", label: "+122", period: "vs last 7 days" }}
					footer={{ label: "View all", to: "/components/users-list" }}
					icon={Users}
					title="Total subscribers"
					value="71,897"
				/>
			</div>
			<p className="text-sm text-muted">
				`value` is a STRING, and so is the chip's label. Currency, locale and how many digits are honest are facts the
				caller has and the tile does not - and that includes compacting: `$4.2M` rather than `$4,231,904`, which is nine
				characters that will not fit in a quarter of a dashboard.
			</p>
		</LabSection>
	);
}

function ActionsSection() {
	return (
		<LabSection
			description="The overflow menu takes AppDropdown's own sections rather than a menu shape invented here, which is what keeps the destructive item hoisted to the end behind a separator, the disabled one in the menu with its reason, and the whole thing rendered as a bottom sheet on a touch device. Open it on a phone to see the sheet."
			title="Actions"
			usedIn={["Pin to the top of the dashboard", "Export the series", "Remove the tile"]}
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppKpi
					actions={[
						{
							items: [
								{
									icon: Pin,
									key: "pin",
									label: "Pin to top",
									onAction: () => pinned("Monthly revenue"),
								},
								{
									icon: Download,
									key: "export",
									label: "Export as CSV",
									onAction: () =>
										AppToast.success("Export started", {
											description: "The twelve-week series is on its way to your downloads.",
											icon: Download,
										}),
								},
								{
									disabledReason: "Only the workspace owner can duplicate a tile",
									icon: Copy,
									isDisabled: true,
									key: "duplicate",
									label: "Duplicate",
									onAction: () => undefined,
								},
								{
									icon: Trash2,
									isDestructive: true,
									key: "remove",
									label: "Remove tile",
									onAction: () => removed("Monthly revenue"),
								},
							],
							key: "tile",
						},
					]}
					chart={{ formatValue: money, kind: "line", points: REVENUE }}
					data-cy="actions-line"
					delta={{
						direction: "up",
						label: "+11.5%",
						period: "vs previous 30 days",
					}}
					icon={CircleDollarSign}
					title="Monthly revenue"
					value="$21,300"
				/>
				<AppKpi
					actions={[
						{
							items: [
								{
									icon: Pin,
									key: "pin",
									label: "Pin to top",
									onAction: () => pinned("Conversion rate"),
								},
								{
									icon: Trash2,
									isDestructive: true,
									key: "remove",
									label: "Remove tile",
									onAction: () => removed("Conversion rate"),
								},
							],
							key: "tile",
						},
					]}
					data-cy="actions-value"
					delta={{ direction: "up", label: "+1.7%", period: "vs last week" }}
					icon={ShoppingCart}
					title="Conversion rate"
					value="3.8%"
				/>
			</div>
			<p className="text-sm text-muted">
				The trigger names its tile - `More actions for Monthly revenue`. Nine tiles with an unnamed "More" button are
				nine controls with one name between them, which is a list a screen-reader user cannot navigate.
			</p>
		</LabSection>
	);
}

function DirectionSection() {
	return (
		<LabSection
			description="Four tiles, two of them falling, and the two falling ones are opposite colours. The chip's tone comes from `direction` AND `isUpGood` together and a caller cannot pass a colour, because 'which colour is a falling number' is exactly the decision that gets made differently on two tiles of the same dashboard. `isUpGood` defaults to true, which is right for revenue and wrong for bounce rate, churn and latency."
			title="Up is not always good"
			usedIn={["Revenue, signups, uptime: up is good", "Bounce rate, churn, latency: up is bad"]}
		>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<AppKpi
					data-cy="direction-revenue-up"
					delta={{ direction: "up", label: "+11.5%", period: "vs last month" }}
					icon={CircleDollarSign}
					title="Revenue, rising"
					value="$21,300"
				/>
				<AppKpi
					data-cy="direction-revenue-down"
					delta={{ direction: "down", label: "-4.2%", period: "vs last month" }}
					icon={CircleDollarSign}
					title="Revenue, falling"
					value="$18,020"
				/>
				<AppKpi
					data-cy="direction-bounce-up"
					delta={{
						direction: "up",
						isUpGood: false,
						label: "+6.1%",
						period: "vs last month",
					}}
					icon={MousePointerClick}
					title="Bounce rate, rising"
					value="48.4%"
				/>
				<AppKpi
					data-cy="direction-bounce-down"
					delta={{
						direction: "down",
						isUpGood: false,
						label: "-5.9%",
						period: "vs last month",
					}}
					icon={MousePointerClick}
					title="Bounce rate, falling"
					value="42.3%"
				/>
			</div>
			<p className="text-sm text-muted">
				The chip carries a GLYPH as well as a colour - an arrow up, an arrow down, a dash - because roughly 8% of men
				would be reading a red-versus-green dashboard with no way to tell the two apart. The same pairing drives the
				line's colour in the trend variant: there is no prop for it, so a falling series can never be drawn in green.
			</p>
			<p className="text-sm text-muted">
				`period` is required on a delta, and that is the whole reason it is a shape rather than a string. "+11.5%"
				against nothing is a number whose denominator the reader has to guess.
			</p>
		</LabSection>
	);
}

function EdgesSection() {
	return (
		<LabSection
			description="The four that broke it first. A flat series sits on the CENTRE line rather than on the floor - divided by a zero span it would land at the bottom, and a line pinned to the bottom of its box reads as a collapse to zero, which is a different fact. A one-point series drops the chart entirely: one reading is not a trend, and a horizontal line through it asserts a stability nobody measured."
			title="Edges"
			usedIn={["A metric that has not moved", "A brand new metric with one reading"]}
		>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<AppKpi
					chart={{
						kind: "line",
						points: [
							{ label: "Mon", value: 40 },
							{ label: "Tue", value: 40 },
							{ label: "Wed", value: 40 },
						],
					}}
					data-cy="edge-flat"
					delta={{ direction: "flat", label: "0.0%", period: "vs last week" }}
					icon={Activity}
					title="Flat series"
					value="40"
				/>
				<AppKpi
					chart={{ kind: "line", points: [{ label: "Today", value: 40 }] }}
					data-cy="edge-single"
					icon={Activity}
					title="One reading only"
					value="40"
				/>
				<AppKpi
					chart={{
						caption: "Nothing used yet",
						kind: "progress",
						label: "Seats used",
						max: 5000,
						value: 0,
					}}
					data-cy="edge-zero"
					icon={Users}
					title="Empty quota"
					value="0"
				/>
				<AppKpi
					chart={{
						caption: "5,000 of 5,000 seats",
						kind: "progress",
						label: "Seats used",
						max: 5000,
						value: 6200,
					}}
					data-cy="edge-over"
					delta={{
						direction: "up",
						isUpGood: false,
						label: "+1,200",
						period: "over the plan limit",
					}}
					icon={Users}
					title="Over the ceiling"
					value="6,200"
				/>
			</div>
			<p className="text-sm text-muted">
				The last one is at 124% of its plan and the bar clamps to 100 - a bar cannot run past its own track, so the
				overflow is reported by the chip and the caption instead. A bar that keeps filling past the end is a bar that
				has stopped meaning anything.
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
