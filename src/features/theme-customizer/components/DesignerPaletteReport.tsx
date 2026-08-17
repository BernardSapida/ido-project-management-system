/**
 * What a designer's five colours actually do, measured.
 *
 * The report the solved presets get answers "did the generator hold its
 * guarantee". This one answers a different question - "what will these colours
 * cost you" - so it is shaped differently: the remedy comes BEFORE the ratio,
 * because a number without an instruction is a number nobody acts on, and the
 * reader here has already decided the colours are not changing.
 *
 * A suggestion is offered and never applied. That is the whole premise: a brand
 * colour changes when a person decides it does, and a panel that quietly fixed
 * one would be the single thing on this page that cannot be trusted.
 */

import { AppAlert, AppButton, AppChip } from "@bernardsapida/web-ui";
import { Check, Info, TriangleAlert, X } from "lucide-react";
import type { DesignerAdvisory, DesignerRole, MeasuredCheck } from "@/config/theme/designer-palette";
import { isDesignerRole } from "@/config/theme/designer-palette";
import { cn } from "@/utils/cn";

interface DesignerPaletteReportProps {
	/** Notes that are consequences rather than failures - see designerAdvisories. */
	advisories: DesignerAdvisory[];
	"data-cy"?: string;
	onUseSuggestion: (role: DesignerRole, hex: string) => void;
	rows: MeasuredCheck[];
}

export function DesignerPaletteReport({
	advisories,
	"data-cy": dataCy,
	onUseSuggestion,
	rows,
}: DesignerPaletteReportProps) {
	if (rows.length === 0) {
		return (
			<p
				className="text-muted text-xs"
				data-cy="designer-report-empty"
			>
				Fill in background, foreground and brand to see what this palette does. Nothing can be inferred from an empty
				form, and a partial report would be worse than none.
			</p>
		);
	}

	const failures = rows.filter((row) => !row.passes);

	/*
	 * FAILURES ONLY, and silence when there are none.
	 *
	 * It used to list every row, pass and fail, headed by "4 of 4 pairings pass".
	 * That is a paragraph and four green cards to say nothing is wrong, sitting
	 * permanently between the fields somebody is editing and the button that
	 * commits them - and a reader who sees four green cards every time stops
	 * reading the list, which is precisely when the fifth card turns red.
	 *
	 * A palette that passes says so by not interrupting. Advisories still show,
	 * because they are consequences worth knowing rather than faults, and they are
	 * few.
	 */
	if (failures.length === 0 && advisories.length === 0) return null;

	return (
		<div
			className="space-y-3"
			data-cy={dataCy}
		>
			{failures.length > 0 ? (
				<p className="font-semibold text-danger text-sm">
					{failures.length} of {rows.length} pairings fall below their bar
				</p>
			) : null}

			{/* Above the rows, because these are not failures and burying them under
			    ten ratios would read as if they were. */}
			{advisories.map((advisory) => (
				<AppAlert
					data-cy={`designer-advisory-${advisory.id}`}
					description={advisory.body}
					icon={Info}
					key={advisory.id}
					status="accent"
					title={advisory.title}
				/>
			))}

			<ul className="space-y-2">
				{failures.map((row) => (
					<li
						className={cn(
							"rounded-xl border p-3",
							row.passes ? "border-border" : "border-[color-mix(in_oklab,var(--danger)_35%,transparent)]",
						)}
						data-cy={`designer-row-${row.id}`}
						key={row.id}
					>
						<div className="flex flex-wrap items-center gap-2">
							{/* A label and a mark, never colour alone. */}
							<span
								className={cn(
									"flex items-center gap-1 font-medium text-xs",
									row.passes ? "text-muted-foreground" : "text-danger",
								)}
							>
								{row.passes ? (
									<Check
										aria-hidden="true"
										className="size-3.5"
									/>
								) : (
									<X
										aria-hidden="true"
										className="size-3.5"
									/>
								)}
								{row.passes ? "Pass" : "Fail"}
							</span>

							<span className="text-sm">{row.label}</span>

							{row.isDerived ? (
								<AppChip
									emphasis="soft"
									icon={TriangleAlert}
									label="uses a derived value"
									size="sm"
									tone="default"
								/>
							) : null}

							<span className="ms-auto flex items-center gap-2 font-mono text-[10px] text-muted">
								<span
									aria-hidden="true"
									className="size-3.5 rounded border border-border"
									style={{ background: row.foreground }}
								/>
								{row.foreground}
								<span className="text-muted-foreground">{row.kind === "edge" ? "vs" : "on"}</span>
								<span
									aria-hidden="true"
									className="size-3.5 rounded border border-border"
									style={{ background: row.background }}
								/>
								{row.background}
							</span>

							<span className="font-mono text-xs tabular-nums">
								{row.ratio.toFixed(2)}:1
								<span className="text-muted"> / {row.bar}</span>
							</span>
						</div>

						{/* Which of the supplied colours can sit on this fill, named and
						    measured. This is the answer the old report faked by testing
						    white and calling the result a failure. */}
						{row.inks.length > 0 ? (
							<ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
								{row.inks.map((ink) => (
									<li
										className={cn(
											"flex items-center gap-1.5 font-mono text-[10px]",
											ink.passes ? "text-muted-foreground" : "text-muted line-through",
										)}
										key={ink.role}
									>
										<span
											aria-hidden="true"
											className="size-3 rounded-sm border border-border"
											style={{ background: ink.hex }}
										/>
										<span className="font-sans">{ink.role}</span>
										{ink.ratio.toFixed(2)}
									</li>
								))}
							</ul>
						) : null}

						{/* The instruction first. Somebody reading a failing row wants to
						    know what to do, not to be told the arithmetic twice. */}
						{row.passes ? null : (
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<p className="min-w-0 flex-1 text-muted text-xs">{row.remedy}</p>
								{row.suggestion && row.role && isDesignerRole(row.role) ? (
									<AppButton
										data-cy={`designer-suggestion-${row.id}`}
										onPress={() => onUseSuggestion(row.role as DesignerRole, row.suggestion!)}
										size="sm"
										variant="tertiary"
									>
										<span
											aria-hidden="true"
											className="size-3.5 rounded border border-border"
											style={{ background: row.suggestion }}
										/>
										Use {row.suggestion}
									</AppButton>
								) : null}
							</div>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
