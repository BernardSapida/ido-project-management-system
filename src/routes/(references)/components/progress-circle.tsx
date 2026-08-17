import { AppButton, AppGlassCard, AppPageHeader, AppProgressBar, AppProgressCircle } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Database, HardDrive, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Progress circle lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The dashboard tiles at the top are the point of the page: ONE ring per card,
 * which is the only arrangement this component is actually the right choice
 * for. The "Ring or bar" section further down is the argument for why - four
 * rings in a row is the shape to avoid, and it is easier to see than to read.
 */
export const Route = createFileRoute("/(references)/components/progress-circle")({
	head: () => ({
		meta: [{ title: seo.title("Progress circle lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Progress circle" },
	component: ProgressCircleLabPage,
});

function ProgressCircleLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The same measurement as the bar, wound into a ring."
				title="Progress circle lab"
			/>
			<TilesSection />
			<ComparisonSection />
			<LiveSection />
			<IndeterminateSection />
			<ValueSection />
			<ColourSection />
			<SizeSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* The assembly                                                               */
/* -------------------------------------------------------------------------- */

const TILES = [
	{
		caption: "18.2 GB of 20 GB",
		color: "danger",
		icon: HardDrive,
		key: "storage",
		label: "Storage used",
		value: 91,
	},
	{
		caption: "37 of 50 seats",
		color: "accent",
		icon: Users,
		key: "seats",
		label: "Seats in use",
		value: 74,
	},
	{
		caption: "680k of 1M calls",
		color: "accent",
		icon: Database,
		key: "api",
		label: "API quota",
		value: 68,
	},
] as const;

/** Where a ring actually belongs: one per card, in a grid of cards. */
function TilesSection() {
	return (
		<LabSection
			description="One ring per tile, which is the whole case for this component over the bar. The ring carries the shape and the caption underneath carries the number, because at these diameters an arc is a state rather than a quantity - nobody reads 74% off an arc, they read 'about three quarters' and then look for the figure. Colour is doing work here too: the storage tile is at 91% and is the only one wearing danger."
			title="On a dashboard"
			usedIn={["Usage and quota tiles", "Account overview cards", "Compact stat grids"]}
		>
			<div
				className="grid gap-4 sm:grid-cols-3"
				data-cy="tiles"
			>
				{TILES.map((tile) => (
					<div
						className="flex flex-col items-center gap-3 rounded-2xl border border-border p-4"
						data-cy={`tile-${tile.key}`}
						key={tile.key}
					>
						<div className="flex items-center gap-2 self-start text-sm font-medium">
							<tile.icon
								aria-hidden="true"
								className="size-4 text-muted"
							/>
							{tile.label}
						</div>
						<AppProgressCircle
							color={tile.color}
							data-cy={`tile-${tile.key}-ring`}
							isLabelHidden
							label={`${tile.label}, ${tile.value}%`}
							size="lg"
							value={tile.value}
						/>
						<p className="text-xs text-muted">{tile.caption}</p>
					</div>
				))}
			</div>
			<p className="text-sm text-muted">
				The label is hidden on these rather than dropped: the heading above each ring already names it on screen, and a
				screen reader still gets &quot;Storage used, 91%&quot; from the ring itself.
			</p>
		</LabSection>
	);
}

/** The reason both components exist, as a thing to look at rather than read. */
function ComparisonSection() {
	const quotas = [
		{ label: "Storage", value: 91 },
		{ label: "Seats", value: 74 },
		{ label: "API calls", value: 68 },
		{ label: "Webhooks", value: 62 },
	];

	return (
		<LabSection
			description="Four quotas twice. Rank them by eye in the top row, then in the bottom one. Lines share a baseline and a scale, so the comparison is free; four arcs make you read four numbers and do it yourself. Reach for the ring when it is ONE tile in a grid - as it is in the section above - not when it is a column of them."
			title="Ring or bar"
			usedIn={["Read this before choosing between the two"]}
		>
			<div className="flex flex-col gap-6">
				<div>
					<p className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">Rings</p>
					<Row>
						{quotas.map((quota) => (
							<AppProgressCircle
								data-cy={`compare-ring-${quota.label.toLowerCase().replace(/\s+/g, "-")}`}
								key={quota.label}
								label={`${quota.label} ${quota.value}%`}
								value={quota.value}
							/>
						))}
					</Row>
				</div>
				<div>
					<p className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">Bars</p>
					<div className="flex max-w-md flex-col gap-3">
						{quotas.map((quota) => (
							<AppProgressBar
								data-cy={`compare-bar-${quota.label.toLowerCase().replace(/\s+/g, "-")}`}
								key={quota.label}
								label={quota.label}
								showValueLabel
								value={quota.value}
							/>
						))}
					</div>
				</div>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */
/* Reference                                                                  */
/* -------------------------------------------------------------------------- */

const TICK_MS = 240;
const STEP = 4;

function LiveSection() {
	const [value, setValue] = useState(0);
	const [isRunning, setIsRunning] = useState(false);

	useEffect(() => {
		if (!isRunning) return;

		const timer = setInterval(() => {
			setValue((current) => {
				if (current >= 100) {
					setIsRunning(false);
					return 100;
				}
				return Math.min(100, current + STEP);
			});
		}, TICK_MS);

		return () => clearInterval(timer);
	}, [isRunning]);

	return (
		<LabSection
			description="Run it and watch where the arc starts and which way it goes. A ring that fills anticlockwise, or starts anywhere but the top, is the kind of thing nobody notices until it sits next to a second ring that does the opposite."
			title="Live"
			usedIn={["Checking the direction and origin of the fill"]}
		>
			<Row>
				<AppProgressCircle
					data-cy="live-ring"
					label={`${value}%`}
					size="lg"
					value={value}
				/>
				<AppButton
					data-cy="live-start"
					isDisabled={isRunning || value >= 100}
					onPress={() => setIsRunning(true)}
					size="sm"
				>
					{value === 0 ? "Start" : "Resume"}
				</AppButton>
				<AppButton
					data-cy="live-pause"
					isDisabled={!isRunning}
					onPress={() => setIsRunning(false)}
					size="sm"
					variant="secondary"
				>
					Pause
				</AppButton>
				<AppButton
					data-cy="live-reset"
					onPress={() => {
						setIsRunning(false);
						setValue(0);
					}}
					size="sm"
					variant="secondary"
				>
					Reset
				</AppButton>
			</Row>
		</LabSection>
	);
}

function IndeterminateSection() {
	return (
		<LabSection
			description="Same rule as the bar: `value` is dropped rather than pinned at 0, so an unknown duration never claims to be a known one. Side by side, the difference is motion - the second one is going somewhere, the first is stopped at the start line."
			title="Indeterminate is not zero"
			usedIn={["A job with no measurable steps"]}
		>
			<Row>
				<div className="flex flex-col items-center gap-2">
					<AppProgressCircle
						data-cy="indeterminate-wrong"
						isLabelHidden
						label="Stopped at the start line"
						size="lg"
						value={0}
					/>
					<span className="text-xs text-danger">value=0 - claims a known state</span>
				</div>
				<div className="flex flex-col items-center gap-2">
					<AppProgressCircle
						data-cy="indeterminate-right"
						isIndeterminate
						isLabelHidden
						label="Working"
						size="lg"
					/>
					<span className="text-xs text-success">isIndeterminate</span>
				</div>
			</Row>
		</LabSection>
	);
}

function ValueSection() {
	const values = [0, 25, 50, 75, 100];

	return (
		<LabSection
			description="Five points around the ring. The one to look at is 0: an empty ring and an indeterminate ring are one frame apart visually, which is exactly why the component refuses to render the first as the second."
			title="Values"
			usedIn={["Checking the ends of the scale"]}
		>
			<Row>
				{values.map((value) => (
					<AppProgressCircle
						data-cy={`value-${value}`}
						key={value}
						label={`${value}%`}
						size="lg"
						value={value}
					/>
				))}
			</Row>
			<p className="text-sm text-muted">
				The ring prints no number of its own - the caption under each of these is the `label`. If the number matters
				more than the shape, that is a signal for the bar, which has room for both.
			</p>
		</LabSection>
	);
}

function ColourSection() {
	const colors = ["accent", "success", "warning", "danger", "default"] as const;

	return (
		<LabSection
			description="The status palette, unchanged from the bar's - a quota at 91% is the same danger whichever shape reports it. Each arc is the gradient, not a flat fill: accent takes the identity ramp, the other four their --rail-*, wound so the light still falls from the top-left the way it does on every other brand surface. Put a ring beside a bar of the same colour and they are the same colour."
			title="Colour"
			usedIn={["danger: a breached quota", "accent: work in flight"]}
		>
			<Row>
				{colors.map((color) => (
					<AppProgressCircle
						color={color}
						data-cy={`colour-${color}`}
						key={color}
						label={color}
						size="lg"
						value={72}
					/>
				))}
			</Row>
		</LabSection>
	);
}

function SizeSection() {
	const sizes = ["sm", "md", "lg"] as const;

	return (
		<LabSection
			description="Three diameters. `sm` is small enough that the arc is the only thing readable on it - at that size the ring is a state, not a quantity, and the number has to live in the caption."
			title="Size"
			usedIn={["sm: inline beside a label", "lg: the tile's subject"]}
		>
			<Row>
				{sizes.map((size) => (
					<AppProgressCircle
						data-cy={`size-${size}`}
						key={size}
						label={size}
						size={size}
						value={68}
					/>
				))}
			</Row>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function Row({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap items-center gap-6">{children}</div>;
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
