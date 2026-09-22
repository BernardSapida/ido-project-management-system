import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { AppCard } from "../AppCard";
import { AppChip } from "../AppChip";
import { AppProgressBar } from "../AppProgressBar";
import { cn } from "../../lib/cn";
import { AppKpiSparkline, type SparklineTone } from "./AppKpiSparkline";
import type { AppKpiProps, KpiDelta, KpiDeltaDirection, KpiProgressChart } from "./kpi.types";
import { kpiDeltaTone } from "./kpi.types";

/** The glyph for the movement. Direction is a shape before it is a colour. */
const DELTA_ICON: Record<KpiDeltaDirection, LucideIcon> = {
	down: TrendingDown,
	flat: Minus,
	up: TrendingUp,
};

/**
 * One number a dashboard leads with: what it is, what it is now, and which way
 * it is going.
 *
 * Three shapes, and which one you get is decided by `chart` rather than by a
 * `variant` string - a tile cannot ask for a line and then forget the series.
 *
 * - **no `chart`** - the value on its own, usually with a footer into the
 *   report behind it.
 * - **`{ kind: "line" }`** - the value plus its trend, with a readout on hover.
 * - **`{ kind: "progress" }`** - the value plus how much of a ceiling it fills.
 *
 * The surface is `AppCard` in its `label` role - not a hand-built box. That is
 * where the padding, the radius, the surface and the footer come from, and it is
 * why there is no `p-*` anywhere in this file: a wrapper that has to be handed a
 * padding at each call site gets a different one on each screen.
 *
 * The value outranks its label, which is the inversion `titleRole="label"`
 * exists to prevent: the reader came for the number, so the number is 30px and
 * the title is 14px and grey. Shipped the other way round - a bold
 * `Monthly revenue` over a small `$21,300` - the tile reads as a heading with a
 * caption.
 *
 * The tile is its own CONTAINER, so the layout responds to the column it was
 * given rather than to the window. A line chart sits beside the value in a
 * two-up grid and drops underneath it in a four-up one, and neither needs the
 * caller to say which it is - the same tile in the same grid is wide on a
 * desktop and narrow on a phone, and a viewport breakpoint gets the four-up
 * case wrong on both.
 *
 * `value` is a STRING and the delta's `label` is a string: currency, locale and
 * how many digits are honest are all facts the caller has and this does not.
 * That includes compacting - `$4.2M` rather than `$4,231,904`, which is nine
 * characters that will not fit in a quarter of a dashboard.
 */
export function AppKpi({
	actions,
	chart,
	className,
	"data-cy": dataCy,
	delta,
	footer,
	headingLevel,
	icon,
	title,
	value,
}: AppKpiProps) {
	/*
	 * One reading is not a trend. Drawn anyway it is a horizontal line through a
	 * single point, which asserts a stability that was never measured - so the
	 * chart is dropped and the tile falls back to the plain value.
	 */
	const line = chart?.kind === "line" && chart.points.length >= 2 ? chart : null;

	/*
	 * What was DRAWN, not what was asked for. A one-point series asks for a line
	 * and gets a plain value, and a hook reporting otherwise would leave a spec
	 * asserting on a chart that is not on the page.
	 */
	const variant = line ? "line" : chart?.kind === "progress" ? "progress" : "value";

	return (
		/*
		 * AppCard in its `label` role, which is what a KPI tile is: a title that
		 * names something, and the something under it carrying the rank. Nothing
		 * here sets padding - the card owns it, and a wrapper that has to be handed
		 * a `p-*` at every call site is one that ends up with a different number on
		 * every screen.
		 *
		 * `@container` on the card, so the layout below responds to the column the
		 * tile was given rather than to the window.
		 */
		<AppCard
			actions={actions}
			className={cn("@container", className)}
			data-cy={dataCy}
			footerLink={footer}
			headingLevel={headingLevel}
			icon={icon}
			title={title}
			titleRole="label"
		>
			{/*
			 * Stacked, the chart brings its own separation - the strip it reserves
			 * for the readout is 28px of space above the line whether or not
			 * anything is hovering, and a flex gap on top of it put the trend a
			 * clear 40px from the number it belongs to. Side by side there is no
			 * strip between them, so the gap comes back.
			 */}
			<div
				className={cn("flex flex-1 flex-col gap-3", line && "gap-0 @sm:flex-row @sm:items-end @sm:gap-5")}
				data-variant={variant}
			>
				<div className={cn("min-w-0", line && "@sm:flex-1")}>
					<KpiValue
						delta={delta}
						value={value}
					/>
				</div>

				{line ? (
					<AppKpiSparkline
						/* `mt-auto` for the same reason the progress bar below has it. */
						className="mt-auto @sm:flex-[1.3]"
						data-cy={dataCy ? `${dataCy}-chart` : undefined}
						formatValue={line.formatValue ?? ((plotted) => plotted.toLocaleString())}
						points={line.points}
						title={title}
						tone={sparklineTone(delta)}
					/>
				) : null}

				{chart?.kind === "progress" ? (
					<KpiProgress
						chart={chart}
						data-cy={dataCy ? `${dataCy}-progress` : undefined}
					/>
				) : null}
			</div>
		</AppCard>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * The number and its movement, on two lines: the value, then the chip and the
 * period it is measured against.
 *
 * The chip used to ride the value's line at the far edge, and that was wrong in
 * a way only a real dashboard shows. `justify-between` makes the gap between a
 * number and the chip describing it a function of the COLUMN WIDTH: adjacent in
 * a narrow tile, 200px apart in a wide one, and wrapped to its own line in the
 * middle - so three tiles in a row put the same fact in three places. Proximity
 * is what binds the chip to the number, and it cannot be left to the grid.
 *
 * On its own line the delta is in the same place in every tile at every width,
 * and the period rides beside the chip rather than under it - one line of small
 * grey explaining one chip, instead of two stacked fragments.
 *
 * No `tabular-nums`. Tabular figures give every digit the width of a zero,
 * which reads loose at 30px; they are for COLUMNS of numbers that have to line
 * up vertically, and a dashboard's tiles are not a column.
 */
function KpiValue({ delta, value }: { delta?: KpiDelta; value: string }) {
	return (
		<>
			<p
				className="text-3xl leading-none font-semibold tracking-tight"
				data-cy="kpi-value"
			>
				{value}
			</p>
			{delta ? (
				<div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
					<AppChip
						data-cy="kpi-delta"
						icon={DELTA_ICON[delta.direction]}
						label={delta.label}
						size="sm"
						tone={kpiDeltaTone(delta)}
					/>
					<span className="text-xs text-muted">{delta.period}</span>
				</div>
			) : null}
		</>
	);
}

/**
 * The bar, plus the two facts a bar cannot state: how far along, out of what.
 *
 * `isLabelHidden` because the tile's title is two lines above it - drawn, the
 * bar's own label is the same words twice. It stays as the accessible name,
 * which is the whole reason the prop exists rather than an empty string.
 *
 * `mt-auto` pins it to the FLOOR of the tile rather than letting it follow the
 * value. Without it the bar's height comes from whatever is above it, so a tile
 * carrying a delta sits one line lower than the two beside it and a row of three
 * bars is three bars at three heights - which reads as a rendering fault rather
 * than as a difference in content. It is the same rule that aligns the footers
 * of a row of cards whose descriptions ran to different lengths.
 */
function KpiProgress({ chart, "data-cy": dataCy }: { chart: KpiProgressChart; "data-cy"?: string }) {
	const max = chart.max ?? 100;
	const percent = max <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((chart.value / max) * 100)));

	return (
		<div
			className="mt-auto flex flex-col gap-2"
			data-cy={dataCy}
		>
			<AppProgressBar
				color={chart.tone ?? "accent"}
				isLabelHidden
				label={chart.label}
				size="sm"
				value={percent}
			/>
			<div className="flex items-baseline justify-between gap-3 text-xs text-muted">
				<span className="min-w-0 truncate">{chart.caption ?? chart.label}</span>
				{/* A column of two, and they do line up - so these are tabular. */}
				<span className="shrink-0 tabular-nums">{percent}%</span>
			</div>
		</div>
	);
}

/**
 * The line's colour is the DELTA's, not a choice.
 *
 * Left as a prop it is the one thing on a dashboard that gets set once and then
 * never revisited, and the failure is a falling series drawn in green - which
 * is worse than no colour at all, because it is read before the number is. With
 * no delta to read there is no direction to claim, so the line is accent.
 */
function sparklineTone(delta?: KpiDelta): SparklineTone {
	if (!delta) return "accent";

	const tone = kpiDeltaTone(delta);
	return tone === "default" ? "accent" : tone;
}
