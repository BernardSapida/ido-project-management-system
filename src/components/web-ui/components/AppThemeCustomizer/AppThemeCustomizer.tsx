/**
 * `<AppThemeCustomizer/>` - the interactive palette + theme editor, as a
 * component a project mounts on its own dev-only route.
 *
 * It previews by mutating `<html>` live and reverts on unmount. Nothing here
 * writes to disk on its own: `onApply` is the project's write path (a POST to
 * its `/__apply-theme` dev middleware), and the panel names the two files a
 * press touches - `presets.ts` and `theme.config.ts`.
 *
 * Everything project-specific is a prop. `presets` is the project's merged list
 * (`[...BUILTIN_PRESETS, ...projectPresets]`), `current` is its committed
 * `THEME`, `generatedPalettes` is the record `scripts/generate-palettes.ts`
 * writes. The package holds no brand data.
 */

import { Check, Eye, Save } from "lucide-react";
import { useMemo } from "react";
import {
	designerAdvisories,
	designerDarkFill,
	designerDarkMatrix,
	designerMatrix,
	measureDesignerPalette,
	type PalettePreset,
	type ThemeConfig,
} from "../../theme-engine";
import { AppAlert } from "../AppAlert";
import { AppButton } from "../AppButton";
import { AppGlassCard } from "../AppGlassCard";
import { cn } from "../../lib/cn";
import { BrandRampStrip } from "./components/BrandRampStrip";
import { DesignerContrastMatrix } from "./components/DesignerContrastMatrix";
import { DesignerPaletteForm } from "./components/DesignerPaletteForm";
import { DesignerPaletteReport } from "./components/DesignerPaletteReport";
import { SurfaceBreakdown } from "./components/SurfaceBreakdown";
import { ThemeControlBar, type GeneratedPalettes } from "./components/ThemeControlBar";
import { CARD_GAP, CARD_PADDING, ThemePreviewBoard } from "./components/ThemePreviewBoard";
import { type ApplyResult, useApplyTheme } from "./hooks/use-apply-theme";
import { useThemePreview } from "./hooks/use-theme-preview";
import { createThemeDraftStore } from "./store/theme-draft.store";
import { type ConfigOutput, createThemeDraftKit } from "./theme-draft";

export interface AppThemeCustomizerProps {
	/** The project's merged preset list - `[...BUILTIN_PRESETS, ...projectPresets]`. */
	presets: readonly PalettePreset[];
	/** The project's committed `THEME` from `src/config/theme.config.ts`. */
	current: ThemeConfig;
	/** The record `scripts/generate-palettes.ts` writes - swatch tokens per preset. */
	generatedPalettes: GeneratedPalettes;
	/**
	 * The project's write path. Given the flags a commit produces, persist them
	 * and resolve to the generator's verdict. Typically a POST to the dev-only
	 * `/__apply-theme` middleware.
	 */
	onApply: (flags: Record<string, string>) => Promise<ApplyResult>;
	/** Printed in the "what this runs" disclosure. Defaults to the flat-repo form. */
	generateCommand?: string;
	className?: string;
	"data-cy"?: string;
}

export function AppThemeCustomizer({
	presets,
	current,
	generatedPalettes,
	onApply,
	generateCommand,
	className,
	"data-cy": dataCy,
}: AppThemeCustomizerProps) {
	const kit = useMemo(
		() => createThemeDraftKit({ current, presets, generateCommand }),
		[current, presets, generateCommand],
	);
	const useStore = useMemo(() => createThemeDraftStore(kit), [kit]);

	const draft = useStore((state) => state.draft);
	const reset = useStore((state) => state.reset);
	const selectPreset = useStore((state) => state.selectPreset);
	const setDraft = useStore((state) => state.setDraft);

	const theme = useThemePreview(draft, kit.draftOverrides);

	const designerGrid = useMemo(() => designerMatrix(draft.designer), [draft.designer]);
	const designerRows = useMemo(() => measureDesignerPalette(draft.designer), [draft.designer]);
	const designerDarkFillCheck = useMemo(
		() =>
			designerDarkFill(draft.designer, {
				baseTint: draft.baseTint,
				brandTheme: draft.brandTheme,
				surface: draft.surface,
			}),
		[draft.designer, draft.baseTint, draft.brandTheme, draft.surface],
	);
	const designerDarkGrid = useMemo(
		() =>
			designerDarkMatrix(draft.designer, {
				baseTint: draft.baseTint,
				brandTheme: draft.brandTheme,
				surface: draft.surface,
			}),
		[draft.designer, draft.baseTint, draft.brandTheme, draft.surface],
	);

	return (
		<div
			className={cn("mx-auto max-w-[110rem] space-y-6 pb-[var(--theme-bar-height,0px)]", className)}
			data-cy={dataCy}
		>
			<SurfaceBreakdown signal={`${JSON.stringify(draft)}|${theme}`} />

			<AppGlassCard className={cn("flex flex-col", CARD_GAP, CARD_PADDING)}>
				<div>
					<h2 className="font-semibold text-xl">The four colours</h2>
					<p className="mt-1 text-muted text-sm">Pick a theme below to fill these, or paste what a designer sent.</p>
				</div>

				<AppAlert
					data-cy="preview-scope-notice"
					description={
						<>
							Nothing here touches the project until you press <strong>Save this palette</strong> at the foot of this
							card. Leave the page and it reverts to the committed theme.
						</>
					}
					icon={Eye}
					status="default"
					title="You are previewing"
				/>

				<DesignerPaletteForm
					brandTheme={draft.brandTheme}
					data-cy="designer-form"
					isKnownPalette={kit.isKnownPalette}
					isOnPreset={kit.isOnPreset(draft)}
					onBrandThemeChange={(brandTheme) => setDraft({ ...draft, brandTheme })}
					onChange={(designer) => setDraft({ ...draft, designer })}
					onSaveAsChange={(saveAs) => setDraft({ ...draft, saveAs })}
					saveAs={draft.saveAs}
					value={draft.designer}
				/>

				{designerGrid ? (
					<DesignerContrastMatrix
						caption="Each row is a TEXT colour, each column the background behind it. These are the four hexes above, which are LIGHT-theme inputs: dark is derived from them, and has its own grid below."
						data-cy="designer-matrix"
						matrix={designerGrid}
						title="Contrast matrix - light"
					/>
				) : null}

				{designerDarkGrid ? (
					<DesignerContrastMatrix
						caption="The same four ROLES as they will actually be painted in dark - derived, not typed. Brand here is the brand as TEXT; the brand FILL is measured on its own line below."
						data-cy="designer-matrix-dark"
						matrix={designerDarkGrid}
						title="Contrast matrix - dark"
					/>
				) : null}

				{designerDarkFillCheck ? (
					<p className="text-muted text-xs" data-cy="dark-fill-check">
						Dark brand fill <code className="font-mono">{designerDarkFillCheck.hex}</code> - its label reads{" "}
						<strong>{designerDarkFillCheck.onInk.toFixed(2)}:1</strong> on it (7:1 bar, text), and the fill itself
						reads <strong>{designerDarkFillCheck.onGround.toFixed(2)}:1</strong> against the panel behind it (3:1 bar,
						because a fill is a graphic rather than type).
					</p>
				) : null}

				<DesignerPaletteReport
					advisories={designerAdvisories(draft.designer)}
					data-cy="designer-report"
					onUseSuggestion={(role, hex) => setDraft({ ...draft, designer: { ...draft.designer, [role]: hex } })}
					rows={designerRows}
				/>

				<SaveThemePanel output={kit.configOutput(draft)} onApply={onApply} />
			</AppGlassCard>

			<BrandRampStrip signal={`${JSON.stringify(draft)}|${theme}`} />

			<ThemePreviewBoard />

			<ThemeControlBar
				draft={draft}
				generatedPalettes={generatedPalettes}
				kit={kit}
				onApply={onApply}
				onChange={setDraft}
				onReset={reset}
				onSelectPreset={selectPreset}
				presets={presets}
			/>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

/** Save, and show what saving runs. The one control here that changes the project. */
function SaveThemePanel({
	output,
	onApply,
}: {
	output: ConfigOutput;
	onApply: (flags: Record<string, string>) => Promise<ApplyResult>;
}) {
	const { apply, detail, state } = useApplyTheme(onApply);

	return (
		<div className="space-y-2 border-border border-t pt-3">
			<p className="font-medium text-sm">{output.title}</p>

			<p className="text-muted text-xs">
				Writes <code className="font-mono">presets.ts</code> and <code className="font-mono">theme.config.ts</code>,
				then reloads every open tab. This is the only control on the page that changes the project.
			</p>

			<AppButton
				data-cy="save-theme"
				fullWidth
				icon={state === "applied" ? Check : Save}
				isDisabled={!output.flags}
				isPending={state === "running"}
				onPress={async () => {
					await apply(output.flags);
				}}
			>
				{state === "applied" ? "Saved - this is now the committed theme" : "Save this palette"}
			</AppButton>

			{state === "applied" ? (
				<AppAlert
					data-cy="save-theme-applied"
					description="presets.ts and theme.config.ts are updated. Every open tab is reloading onto them."
					icon={Check}
					status="success"
					title="Written to disk"
				/>
			) : null}

			{state === "error" && detail ? (
				<pre
					className="max-h-40 overflow-auto rounded-lg border border-danger p-3 font-mono text-[11px] text-danger"
					data-cy="save-theme-output"
				>
					<code>{detail}</code>
				</pre>
			) : null}

			<details className="text-muted-foreground text-xs">
				<summary className="cursor-pointer">What this runs</summary>
				<pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-surface-secondary p-3 font-mono text-[11px]">
					<code data-cy="config-line">{output.text}</code>
				</pre>
			</details>
		</div>
	);
}
