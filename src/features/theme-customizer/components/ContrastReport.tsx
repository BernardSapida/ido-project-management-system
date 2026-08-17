import { AppChip, AppTable, type ColumnDef } from "@bernardsapida/web-ui";
import { AlertTriangle, Check, Minus, X } from "lucide-react";
import { useState } from "react";
import type { MeasuredPairing } from "@/config/theme/pairings";

interface ContrastReportProps {
	rows: MeasuredPairing[];
}

interface ReportRow extends MeasuredPairing {
	id: string;
}

/**
 * One row per pairing the palette affects: both resolved hex values, the ratio
 * to two decimal places, and separate AA and AAA verdicts.
 *
 * Two things here are deliberate and easy to "tidy" into being wrong.
 *
 * 1. NON-TEXT ROWS DO NOT GET AN AAA VERDICT. SC 1.4.6 covers text; there is no
 *    enhanced criterion for a shape, so an icon tile has a 3:1 bar and nothing
 *    above it. Printing "AAA fail" against a gradient tile would be reporting a
 *    failure against a criterion that does not exist - and the cost is not
 *    pedantry, it is that a reader who sees a red mark they are supposed to
 *    ignore learns to ignore the column.
 *
 * 2. EVERY VERDICT IS A WORD PLUS A MARK, never a colour. A pass/fail table is
 *    the single most tempting place to let green and red carry the meaning, and
 *    the one page in this app where that would be most embarrassing.
 */
export function ContrastReport({ rows }: ContrastReportProps) {
	/*
	 * THREE columns, not five, and the two that went are the reason.
	 *
	 * A five-column table in the report's share of the page was a horizontal
	 * scrollbar with a ratio hidden somewhere off to the right - which is the one
	 * failure mode this page cannot have, because the whole design is "the number
	 * is beside the pixels". Both hexes now sit under the pairing they belong to,
	 * and the two verdicts share one cell.
	 *
	 * They are still SEPARATE verdicts: two chips, each labelled with its own
	 * criterion and its own word. Merging them into a single "passes" would be
	 * the actual loss, because AA and AAA are different questions and a row can
	 * clear one and fail the other.
	 */
	const columns: ColumnDef<ReportRow>[] = [
		{
			key: "label",
			label: "Pairing",
			render: (row) => (
				<div className="min-w-48 max-w-72 whitespace-normal break-normal">
					<div className="font-medium">{row.label}</div>
					{row.note ? <div className="mt-0.5 text-muted-foreground text-xs">{row.note}</div> : null}
					{row.accepted ? (
						<div className="mt-1 rounded border border-warning bg-warning-soft px-1.5 py-1 text-[11px] text-warning-soft-foreground">
							{row.accepted}
						</div>
					) : null}
					<div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
						<Sample hex={row.foregroundHex} />
						<span
							aria-hidden="true"
							className="text-muted-foreground"
						>
							on
						</span>
						<Sample hex={row.backgroundHex} />
					</div>
				</div>
			),
		},
		{
			allowsSorting: true,
			key: "ratio",
			label: "Ratio",
			render: (row) => (
				<span
					className="font-mono tabular-nums"
					data-cy={`ratio-${row.id}`}
				>
					{row.ratio.toFixed(2)}:1
				</span>
			),
			sortValue: (row) => row.ratio,
		},
		{
			key: "verdict",
			label: "AA / AAA",
			render: (row) => (
				<div className="flex flex-col items-start gap-1">
					{row.kind === "text" ? (
						<>
							<Verdict
								bar="AA"
								passes={row.aa}
							/>
							<Verdict
								bar="AAA"
								passes={row.aaa}
							/>
						</>
					) : (
						<NonText
							isAccepted={Boolean(row.accepted)}
							passes={row.passes}
						/>
					)}
				</div>
			),
		},
	];

	return (
		<AppTable
			columnMinWidthClassName="min-w-0"
			columns={columns}
			data-cy="contrast-report"
			emptyContent="Measuring - the report reads the painted document, so it lands a frame after the preview."
			label="Contrast of every pairing this palette affects"
			rows={rows}
		/>
	);
}

/**
 * A hex, and pressing it copies it.
 *
 * The whole reason a hex is printed here is that somebody is going to want it
 * somewhere else - a design file, a ticket, a mobile stylesheet. Making them
 * select six characters out of a table row by hand is the small friction that
 * ends with the value being retyped from memory and getting a digit wrong.
 *
 * A real <button>, not a div with a click handler: it is keyboard-reachable,
 * announces itself as "copy #08623e", and the confirmation is a tick that
 * replaces the swatch for a moment rather than a toast - a table of fourteen
 * rows firing toasts is a table nobody can use.
 */
function Sample({ hex }: { hex: string }) {
	const [copied, setCopied] = useState(false);

	return (
		<button
			aria-label={`Copy ${hex}`}
			className="inline-flex cursor-pointer items-center gap-1 rounded px-0.5 outline-none transition-colors hover:bg-muted-surface focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
			onClick={async () => {
				await navigator.clipboard.writeText(hex);
				setCopied(true);
				window.setTimeout(() => setCopied(false), 1200);
			}}
			type="button"
		>
			{copied ? (
				<Check
					aria-hidden="true"
					className="size-3.5 shrink-0 text-success"
				/>
			) : (
				<span
					aria-hidden="true"
					className="size-3.5 shrink-0 rounded border border-border"
					style={{ backgroundColor: hex }}
				/>
			)}
			{hex}
		</button>
	);
}

/** One criterion, named on the chip so the two are never confused for each other. */
function Verdict({ bar, passes }: { bar: "AA" | "AAA"; passes: boolean }) {
	return (
		<AppChip
			emphasis="soft"
			icon={passes ? Check : X}
			label={`${bar} ${passes ? "pass" : "fail"}`}
			size="sm"
			tone={passes ? "success" : "danger"}
		/>
	);
}

/**
 * A non-text row gets ONE chip, against the only bar that exists for it.
 *
 * SC 1.4.6 covers text; there is no enhanced criterion for a shape. Showing an
 * "AAA fail" beside a gradient tile would be reporting against a criterion that
 * does not exist - and the cost is not pedantry, it is that a reader who sees a
 * red mark they are supposed to ignore learns to ignore the column.
 */
function NonText({ isAccepted, passes }: { isAccepted?: boolean; passes: boolean }) {
	// A row below its bar ON PURPOSE is marked "accepted", not "fail". Both are
	// honest; the difference is whether somebody has to act. Showing a decision
	// as a defect is how a report full of red marks stops being read - and it
	// would be the only red on this page, which is worse.
	if (!passes && isAccepted) {
		return (
			<AppChip
				emphasis="soft"
				icon={AlertTriangle}
				label="Accepted"
				size="sm"
				tone="warning"
			/>
		);
	}

	return (
		<AppChip
			emphasis="soft"
			icon={passes ? Check : Minus}
			label={passes ? "3:1 pass" : "3:1 fail"}
			size="sm"
			tone={passes ? "success" : "danger"}
		/>
	);
}
