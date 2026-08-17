/**
 * The brand ramp, for the brand currently in the draft.
 *
 * The Design tokens lab shows this too, and the two are not redundant for the
 * same reason nothing else on this page is: that one shows the COMMITTED theme
 * and is the token layer's regression harness, this one shows what the hex in
 * the field above would become. A designer pasting a brand wants to see its
 * tints before deciding, not after committing.
 *
 * Every colour is read off the painted document through `usePaintedTokens`, so
 * it cannot drift from what the page is showing - and it picks up the free hue
 * slider, which no preset record could.
 *
 * ## Why the two claims are printed rather than assumed
 *
 * The ramp is the one part of the palette with no blanket contrast guarantee,
 * and it is also the part a designer is most likely to reach for. Left as
 * eleven pretty swatches it reads as eleven approved colours. The two lines
 * under it are what stop that: the steps do not invert between themes, and only
 * the three pairings below were measured.
 *
 * Those three are measured LIVE here rather than printed from the test suite's
 * worst case. The suite guarantees the floor across every shipped palette; this
 * card answers a narrower and more useful question - what does it measure on
 * MINE - and a designer whose brand clears 8:1 should see 8:1 rather than the
 * worst hue's 5.17.
 */

import { AppGlassCard } from "@bernardsapida/web-ui";
import { contrastOfRgb, type Rgb, reportRatio } from "@/config/theme/oklch";
import { AA_TEXT, NON_TEXT } from "@/config/theme/palette.build";
import { usePaintedTokens } from "../hooks/use-painted-tokens";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const STEP_TOKENS = STEPS.map((step) => `--brand-${step}`);

/**
 * `--gradient-brand-via` is the brand fill, and 500 is supposed to BE it. Read
 * alongside the steps so the anchored-or-fell-back line below is a comparison of
 * two painted colours rather than a claim this component makes on its own.
 */
const ANCHOR_TOKEN = "--gradient-brand-via";

const TOKENS = [...STEP_TOKENS, ANCHOR_TOKEN];

/**
 * The three combinations the suite measures, named the way somebody choosing a
 * colour would ask for them.
 *
 * `bar` is which WCAG floor the pairing answers to, and it differs by what the
 * colour is doing rather than by how it looks: 600-on-100 is listed for borders,
 * chart series and icons, so it answers to SC 1.4.11's 3:1 and would be a fail
 * at the text bar. Printing one bar for all three is how a non-text pairing ends
 * up carrying a label.
 */
const PAIRINGS = [
	{
		background: 50,
		bar: AA_TEXT,
		foreground: 900,
		use: "Body text on a brand tint",
	},
	{
		background: 900,
		bar: AA_TEXT,
		foreground: null,
		use: "White text on the deep end",
	},
	{
		background: 100,
		bar: NON_TEXT,
		foreground: 600,
		use: "Borders, icons, chart series - never text",
	},
] as const;

const WHITE: Rgb = { b: 255, g: 255, r: 255 };

/** Lossless: every hex here came from `rgbToHex`, so it is already 8-bit. */
function hexToRgb(hex: string): Rgb | null {
	const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
	if (!match) return null;

	const value = Number.parseInt(match[1], 16);
	return { b: value & 255, g: (value >> 8) & 255, r: (value >> 16) & 255 };
}

export function BrandRampStrip({ signal }: { signal: unknown }) {
	const painted = usePaintedTokens(TOKENS, signal);

	const at = (step: number) => painted[`--brand-${step}`];
	// Painted rather than authored, so a value the engine gamut-mapped is compared
	// as the pixel it became. Two tokens that agree in the stylesheet and disagree
	// on screen would otherwise report as anchored.
	const isAnchored = at(500) !== undefined && at(500) === painted[ANCHOR_TOKEN];

	const ratioFor = (foreground: number | null, background: number) => {
		const ink = foreground === null ? WHITE : hexToRgb(at(foreground) ?? "");
		const ground = hexToRgb(at(background) ?? "");
		if (!ink || !ground) return null;

		return reportRatio(contrastOfRgb(ink, ground));
	};

	return (
		<AppGlassCard
			className="p-5"
			data-cy="brand-ramp"
		>
			<h2 className="font-semibold text-sm">Brand ramp</h2>
			<p className="mt-1 text-muted text-xs">
				Your brand at Tailwind's eleven lightnesses, as <code className="font-mono">bg-app-brand-100</code>,{" "}
				<code className="font-mono">text-app-brand-700</code>, <code className="font-mono">border-app-brand-200</code>.
				Read off the page as painted.
			</p>

			{/* One continuous strip, like the 60-30-10 bar above - eleven separate
			    swatches would say "eleven colours" when the thing being judged is
			    whether they read as ONE colour getting lighter. A gap anywhere in the
			    run is the failure this makes visible at a glance. */}
			<div
				aria-hidden="true"
				className="mt-3 flex h-12 overflow-hidden rounded-xl border border-border"
			>
				{STEPS.map((step) => (
					<span
						className="h-full flex-1"
						key={step}
						style={{ background: at(step) }}
					/>
				))}
			</div>

			<ul className="mt-2 grid grid-cols-6 gap-1 sm:grid-cols-11">
				{STEPS.map((step) => (
					<li
						className="flex flex-col items-center"
						data-cy={`ramp-${step}`}
						key={step}
					>
						<span className="font-mono font-semibold text-[10px] tabular-nums">{step}</span>
						<span className="font-mono text-[9px] text-muted uppercase">{at(step) ?? "…"}</span>
					</li>
				))}
			</ul>

			<p
				className="mt-3 text-muted text-xs"
				data-cy="ramp-anchor"
			>
				{isAnchored ? (
					<>
						<strong className="font-semibold text-foreground">500 is your brand exactly</strong> - the same pixel as{" "}
						<code className="font-mono">bg-app-brand</code>, so the scale is a scale OF the colour you typed.
					</>
				) : (
					<>
						<strong className="font-semibold text-foreground">500 is not your brand.</strong> It sits too near an end of
						the scale to anchor on without collapsing the other half into one colour, so the ramp uses the canonical
						lightnesses at your hue instead. The brand itself is still <code className="font-mono">bg-app-brand</code>.
					</>
				)}
			</p>

			<p className="mt-2 text-muted text-xs">
				<strong className="font-semibold text-foreground">These do not invert between themes.</strong> A number means a
				lightness - 50 is the palest step in dark mode too - so a dark design reaches for{" "}
				<code className="font-mono">dark:bg-app-brand-950</code> itself.
			</p>

			<div className="mt-3 border-border border-t pt-3">
				<p className="text-muted text-xs">
					<strong className="font-semibold text-foreground">No step carries a contrast guarantee on its own.</strong>{" "}
					Every other colour on this page is solved against a named ground; these are raw paint for UI drawn against a
					specific tint. Three pairings are measured, on your brand:
				</p>

				<ul className="mt-2 grid gap-2 sm:grid-cols-3">
					{PAIRINGS.map((pairing) => {
						const ratio = ratioFor(pairing.foreground, pairing.background);
						const label = `${pairing.foreground ?? "white"} on ${pairing.background}`;

						return (
							<li
								className="flex items-center gap-2.5"
								data-cy={`ramp-pairing-${label.replace(/\s/g, "-")}`}
								key={label}
							>
								{/* The pairing itself, not a description of it - the ink drawn on
								    the ground so the number beside it can be checked by eye. */}
								<span
									aria-hidden="true"
									className="grid size-9 shrink-0 place-items-center rounded-lg border border-border font-semibold text-[10px]"
									style={{
										background: at(pairing.background),
										color: pairing.foreground === null ? "#ffffff" : at(pairing.foreground),
									}}
								>
									Aa
								</span>
								<span className="flex min-w-0 flex-col">
									<span className="flex items-baseline gap-2">
										<span className="font-mono font-semibold text-xs tabular-nums">{label}</span>
										<span
											className={
												ratio !== null && ratio >= pairing.bar
													? "font-mono font-semibold text-[10px] text-success tabular-nums"
													: "font-mono font-semibold text-[10px] text-danger tabular-nums"
											}
										>
											{ratio === null ? "…" : `${ratio.toFixed(2)}:1`}
										</span>
									</span>
									{/* The bar travels with the row. A non-text pairing judged at
									    4.5 looks like a failure, and a text pairing judged at 3
									    looks like a pass. */}
									<span className="truncate text-[11px] text-muted">
										{pairing.use} · {pairing.bar}:1 bar
									</span>
								</span>
							</li>
						);
					})}
				</ul>
			</div>
		</AppGlassCard>
	);
}
