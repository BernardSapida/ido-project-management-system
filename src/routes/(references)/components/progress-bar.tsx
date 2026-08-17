import { AppButton, AppGlassCard, AppPageHeader, AppProgressBar } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, FileText, RefreshCw, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Progress bar lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The upload queue at the top is the point of the page. A bar on its own is a
 * rectangle - what makes it a component worth having is the row it sits in: a
 * filename, the bar, the percentage, and a way out. The four states that row
 * reaches are the four this component has to survive.
 *
 * The one to check by hand is the indeterminate row. It must not sit at 0%:
 * a bar pinned to the left claims it knows the work has not started, which is
 * the opposite of what indeterminate means. `value` is dropped entirely rather
 * than passed as 0, and the section below shows both so the difference is
 * visible rather than described.
 */
export const Route = createFileRoute("/(references)/components/progress-bar")({
	head: () => ({
		meta: [{ title: seo.title("Progress bar lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Progress bar" },
	component: ProgressBarLabPage,
});

function ProgressBarLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Determinate progress along a line."
				title="Progress bar lab"
			/>
			<UploadQueueSection />
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

const TICK_MS = 240;
const STEP = 4;

type UploadState = "queued" | "uploading" | "done" | "failed";

/** Where a progress bar actually lives. Everything below this is reference. */
function UploadQueueSection() {
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

	const liveState: UploadState = value >= 100 ? "done" : isRunning ? "uploading" : "queued";

	return (
		<LabSection
			description="Four rows in the four states an upload reaches. Watch the fill rather than the number on the live one: the bar animates between values instead of teleporting, which is what makes a stalled upload look stalled rather than finished-and-wrong. Note what happens to the bar in the last two rows - a finished upload and a failed one both stop needing a bar, and leaving one behind at 100% or at 40% is how a queue ends up unreadable at a glance."
			title="In an upload queue"
			usedIn={["File uploads", "Imports and exports", "Any queue of long jobs"]}
		>
			<ul
				className="divide-y divide-border overflow-hidden rounded-2xl border border-border"
				data-cy="queue"
			>
				<UploadRow
					data-cy="row-live"
					name="quarterly-orders.csv"
					state={liveState}
					value={value}
				/>
				<UploadRow
					data-cy="row-uploading"
					name="warehouse-photos.zip"
					state="uploading"
					value={62}
				/>
				<UploadRow
					data-cy="row-done"
					name="signed-contract.pdf"
					state="done"
					value={100}
				/>
				<UploadRow
					data-cy="row-failed"
					name="supplier-list.xlsx"
					state="failed"
					value={41}
				/>
			</ul>

			<Row>
				<AppButton
					data-cy="queue-start"
					isDisabled={isRunning || value >= 100}
					onPress={() => setIsRunning(true)}
					size="sm"
				>
					{value === 0 ? "Start" : "Resume"}
				</AppButton>
				<AppButton
					data-cy="queue-pause"
					isDisabled={!isRunning}
					onPress={() => setIsRunning(false)}
					size="sm"
					variant="secondary"
				>
					Pause
				</AppButton>
				<AppButton
					data-cy="queue-reset"
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

interface UploadRowProps {
	"data-cy": string;
	name: string;
	state: UploadState;
	value: number;
}

/**
 * The row, not the bar. Two of the four states do not draw a bar at all, which
 * is the decision this section exists to make visible.
 *
 * Three things about the layout, because all three were wrong here first:
 *
 * 1. The percentage sits on the NAME's line, not on one of its own. Left to
 *    `showValueLabel` it lands in the component's own grid, whose other cell is
 *    the hidden label - so it floated on an otherwise empty line above the bar,
 *    attached to nothing and pushing the bar a line further from the file it
 *    belongs to. A file and its percentage are one fact; they read as one line.
 * 2. Every row is the same height. The second line is a fixed slot whether it
 *    holds a bar or a status, so a queue does not shuffle its rows every time
 *    one upload finishes and its bar is replaced by "Uploaded" - which is what
 *    made a list you were watching move under the pointer.
 * 3. The done row keeps the action column's width as empty space. Without it,
 *    its text runs 36px further right than every other row and the column of
 *    filenames stops looking like a column.
 */
function UploadRow({ "data-cy": dataCy, name, state, value }: UploadRowProps) {
	const hasBar = state === "uploading" || state === "queued";

	return (
		<li
			className="flex items-center gap-3 px-4 py-3"
			data-cy={dataCy}
			data-state={state}
		>
			<FileText
				aria-hidden="true"
				className="size-4 shrink-0 text-muted"
			/>
			<div className="min-w-0 flex-1">
				<div className="flex items-baseline gap-3">
					<p className="min-w-0 flex-1 truncate text-sm">{name}</p>
					{hasBar ? (
						// Fixed width and tabular figures: 9% → 10% → 100% must not
						// shove the filename left as the upload runs.
						<span
							className="w-10 shrink-0 text-right text-xs text-muted tabular-nums"
							data-cy={`${dataCy}-value`}
						>
							{value}%
						</span>
					) : null}
				</div>
				<div className="mt-1.5 flex min-h-4 items-center">
					{hasBar ? (
						<AppProgressBar
							data-cy={`${dataCy}-bar`}
							isLabelHidden
							label={`${state === "queued" ? "Queued" : "Uploading"} ${name}`}
							size="sm"
							value={value}
						/>
					) : (
						<p className="flex items-center gap-1.5 text-xs text-muted">
							{state === "done" ? (
								<>
									<CheckCircle2
										aria-hidden="true"
										className="size-3.5 shrink-0 text-success"
									/>
									Uploaded
								</>
							) : (
								<>
									<AlertTriangle
										aria-hidden="true"
										className="size-3.5 shrink-0 text-danger"
									/>
									Stopped at {value}% - the connection dropped
								</>
							)}
						</p>
					)}
				</div>
			</div>
			{state === "failed" ? (
				<AppButton
					aria-label={`Retry ${name}`}
					data-cy={`${dataCy}-retry`}
					icon={RefreshCw}
					isIconOnly
					size="sm"
					variant="secondary"
				/>
			) : state === "done" ? (
				<span
					aria-hidden="true"
					className="w-9 shrink-0 md:w-8"
				/>
			) : (
				<AppButton
					aria-label={`Cancel ${name}`}
					data-cy={`${dataCy}-cancel`}
					icon={X}
					isIconOnly
					size="sm"
					variant="ghost"
				/>
			)}
		</li>
	);
}

/* -------------------------------------------------------------------------- */
/* Reference                                                                  */
/* -------------------------------------------------------------------------- */

/** The rule the component enforces, shown as the pair it is a rule about. */
function IndeterminateSection() {
	return (
		<LabSection
			description="Both of these are 'we don't know how long'. The first is a lie told with a number - a bar sitting at 0% asserts the work has not started. The second drops `value` entirely, so there is no number to be wrong."
			title="Indeterminate is not zero"
			usedIn={["A job with no measurable steps", "Waiting on someone else's server"]}
		>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<AppProgressBar
						data-cy="indeterminate-wrong"
						label="Pinned at 0"
						value={0}
					/>
					<span className="text-xs text-danger">wrong - claims a known state</span>
				</div>
				<div className="flex flex-col gap-2">
					<AppProgressBar
						data-cy="indeterminate-right"
						isIndeterminate
						label="Preparing your export"
					/>
					<span className="text-xs text-success">right - `isIndeterminate`, no value at all</span>
				</div>
			</div>
			<p className="text-sm text-muted">
				`showValueLabel` is ignored while indeterminate - there is no honest number to print, so the component does not
				print one.
			</p>
		</LabSection>
	);
}

function ValueSection() {
	const values = [0, 12, 47, 88, 100];

	return (
		<LabSection
			description="Five points along the scale. 0 and 100 are the two that need looking at: an empty track still has to read as a track, and a full one has to read as done rather than as a bar that has run out of room."
			title="Values"
			usedIn={["Checking the ends of the scale, which is where bars break"]}
		>
			<div className="flex flex-col gap-4">
				{values.map((value) => (
					<AppProgressBar
						data-cy={`value-${value}`}
						key={value}
						label={`${value}%`}
						showValueLabel
						value={value}
					/>
				))}
			</div>
		</LabSection>
	);
}

function ColourSection() {
	const colors = ["accent", "success", "warning", "danger", "default"] as const;

	return (
		<LabSection
			description="Colour is a status, not a decoration: accent for work in flight, success for a completed run, danger for a quota already breached. A bar that changes colour halfway through should be reporting a change in what is true, not marking a threshold for its own sake. Each tone paints a gradient rather than a flat fill: `accent` wears the hero gradient the nav pill and the stepper wear, and the other four wear their `--rail-*`, so a danger bar and a danger toast are recognisably the same danger."
			title="Colour"
			usedIn={["accent: in flight", "success: finished", "danger: a breached quota"]}
		>
			<div className="flex flex-col gap-4">
				{colors.map((color) => (
					<AppProgressBar
						color={color}
						data-cy={`colour-${color}`}
						key={color}
						label={color}
						showValueLabel
						value={64}
					/>
				))}
			</div>
		</LabSection>
	);
}

function SizeSection() {
	const sizes = ["sm", "md", "lg"] as const;

	return (
		<LabSection
			description="Three heights. `sm` is for a bar riding under a row in a list - which is exactly what the upload queue above uses; `lg` is for the one thing a page is currently about."
			title="Size"
			usedIn={["sm: under a row in a list", "lg: the subject of the page"]}
		>
			<div className="flex flex-col gap-4">
				{sizes.map((size) => (
					<AppProgressBar
						data-cy={`size-${size}`}
						key={size}
						label={size}
						showValueLabel
						size={size}
						value={40}
					/>
				))}
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function Row({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap items-center gap-3">{children}</div>;
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
