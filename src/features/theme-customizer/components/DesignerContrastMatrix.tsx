/**
 * Every colour against every other, as a grid.
 *
 * The form a designer already knows - UI Colors calls it a contrast matrix,
 * Coolors ships one, every Figma contrast plugin draws the same thing. It earns
 * its place over a list of named pairings because it makes no editorial choice:
 * the reader scans for the band they need and decides which pairs are real
 * themselves. That is the judgement they were always going to make, and they are
 * better placed to make it - they know what they are designing.
 *
 * ## Never colour alone
 *
 * Every cell carries the BAND as text - AAA, AA, AA18, fail - as well as a tint.
 * A grid that encoded pass and fail in green and red alone would be a contrast
 * tool that fails the thing it measures, which is a joke this page cannot
 * afford to make.
 */

import type { ContrastBand, ContrastMatrix } from "@/config/theme/designer-palette";
import { cn } from "@/utils/cn";

interface DesignerContrastMatrixProps {
	/** Replaces the standing blurb. Use it to say WHICH theme this grid is. */
	caption?: string;
	"data-cy"?: string;
	matrix: ContrastMatrix;
	title?: string;
}

/** Tint plus the word. The word is what carries it; the tint is a convenience. */
const BAND_CLASS: Record<ContrastBand, string> = {
	AA: "bg-[color-mix(in_oklab,var(--success)_12%,var(--surface))] text-foreground",
	AA18: "bg-[color-mix(in_oklab,var(--warning)_14%,var(--surface))] text-foreground",
	AAA: "bg-[color-mix(in_oklab,var(--success)_22%,var(--surface))] text-foreground",
	fail: "bg-[color-mix(in_oklab,var(--danger)_10%,var(--surface))] text-muted",
};

const BAND_TITLE: Record<ContrastBand, string> = {
	AA: "4.5:1 or better - normal text",
	AA18: "3:1 or better - large text only, 18pt or 14pt bold",
	AAA: "7:1 or better - normal text, enhanced",
	fail: "under 3:1 - not usable for text at any size",
};

export function DesignerContrastMatrix({
	caption,
	"data-cy": dataCy,
	matrix,
	title = "Contrast matrix",
}: DesignerContrastMatrixProps) {
	return (
		<div
			className="space-y-2"
			data-cy={dataCy}
		>
			<div>
				<h3 className="font-semibold text-sm">{title}</h3>
				<p className="mt-1 text-muted text-xs">
					{caption ??
						`Each row is a TEXT colour, each column the background behind it. Contrast is symmetric, so the grid mirrors - it is drawn in full anyway, because looking up "my brand on my background" should not mean working out which half of a triangle that lives in.`}
				</p>
			</div>

			{/* Its own scroll container: five columns plus a header fit a desktop and
			    not a phone, and the page must never scroll sideways. */}
			<div className="overflow-x-auto">
				<table className="w-full border-separate border-spacing-1 text-xs">
					<thead>
						<tr>
							<th className="w-24 text-left font-medium text-muted-foreground">
								<span className="sr-only">Text colour, down. Background colour, across.</span>
								text \ bg
							</th>
							{matrix.roles.map((role) => (
								<th
									className="p-1 text-center font-medium"
									key={role.role}
									scope="col"
								>
									<span
										aria-hidden="true"
										className="mx-auto mb-1 block size-4 rounded border border-border"
										style={{ background: role.hex }}
									/>
									<span className="capitalize">{role.label}</span>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{matrix.cells.map((row, rowIndex) => (
							<tr key={matrix.roles[rowIndex].role}>
								<th
									className="pe-2 text-left font-medium"
									scope="row"
								>
									<span className="flex items-center gap-1.5">
										<span
											aria-hidden="true"
											className="size-4 shrink-0 rounded border border-border"
											style={{ background: matrix.roles[rowIndex].hex }}
										/>
										<span className="capitalize min-w-max">{matrix.roles[rowIndex].label}</span>
									</span>
								</th>

								{row.map((cell, columnIndex) => (
									<td
										className="p-0"
										key={matrix.roles[columnIndex].role}
									>
										{cell.ratio === null ? (
											// The diagonal. A colour against itself is 1:1 and means
											// nothing, so it is drawn as absent rather than as a failure.
											<span className="grid h-11 place-items-center rounded-md border border-border border-dashed text-muted">
												{/* The dash is decoration; the words are what a screen reader
												    gets. `aria-label` on a bare span is not a supported pairing
												    - the element has no role for it to name. */}
												<span aria-hidden="true">-</span>
												<span className="sr-only">same colour</span>
											</span>
										) : (
											<span
												className={cn(
													"grid h-11 place-items-center rounded-md text-center leading-tight",
													BAND_CLASS[cell.band],
												)}
												title={BAND_TITLE[cell.band]}
											>
												<span className="font-mono tabular-nums">{cell.ratio.toFixed(2)}</span>
												<span className="font-medium text-[10px]">{cell.band}</span>
											</span>
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<p className="text-muted text-[10px]">
				AAA 7:1 · AA 4.5:1 · AA18 3:1, large text only · under 3:1 not usable for text
			</p>
		</div>
	);
}
