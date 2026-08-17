import { AppAlert, AppButton, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Eye, Save } from "lucide-react";
import { useMemo } from "react";
import { seo } from "@/config/seo.config";
import {
	designerAdvisories,
	designerDarkFill,
	designerDarkMatrix,
	designerMatrix,
	measureDesignerPalette,
} from "@/config/theme/designer-palette";
import { BrandRampStrip } from "@/features/theme-customizer/components/BrandRampStrip";
import { DesignerContrastMatrix } from "@/features/theme-customizer/components/DesignerContrastMatrix";
import { DesignerPaletteForm } from "@/features/theme-customizer/components/DesignerPaletteForm";
import { DesignerPaletteReport } from "@/features/theme-customizer/components/DesignerPaletteReport";
import { SurfaceBreakdown } from "@/features/theme-customizer/components/SurfaceBreakdown";
import { ThemeControlBar } from "@/features/theme-customizer/components/ThemeControlBar";
import { CARD_GAP, CARD_PADDING, ThemePreviewBoard } from "@/features/theme-customizer/components/ThemePreviewBoard";
import { useApplyTheme } from "@/features/theme-customizer/hooks/use-apply-theme";
import { useThemePreview } from "@/features/theme-customizer/hooks/use-theme-preview";
import { useThemeDraftStore } from "@/features/theme-customizer/store/theme-draft.store";
import { type ConfigOutput, configOutput, isOnPreset } from "@/features/theme-customizer/theme-draft";
import { cn } from "@/utils/cn";

/**
 * Theme customizer. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * This page is what the tokens COULD be, and you open it once, at the start of a
 * project. What the tokens ARE, as committed, is the swatch grid on the
 * theme-toggle lab - the page you open when something looks wrong, and the URL
 * AppDesignReference.cy.ts pins, which makes it the token layer's regression
 * harness.
 *
 * They must not be merged, and the reason is mechanical rather than editorial:
 * this page PREVIEWS by mutating the document root, so a swatch read here
 * reports whatever draft is in localStorage. A harness that measures a draft
 * passes on a palette nobody shipped.
 *
 * ## The layout is the argument
 *
 * Controls are pinned to the BOTTOM of the viewport rather than held in a rail.
 * The thing being judged is the board - a page of real components - and a rail
 * eats a third of the width it needs while putting the controls beside the thing
 * they change rather than under it. Pinned, they cost about 80px, never scroll
 * away mid-comparison, and sit where nobody is trying to look.
 *
 * The report sits BESIDE the board in a sticky column, so a number and the
 * pixels it describes are on screen together on a desktop viewport. A contrast
 * figure the reader has to go looking for - behind a tab, below a fold - is a
 * figure they will not read, and shipping a palette that fails without ever
 * being told is the exact failure this page exists to prevent.
 *
 * Nothing here is persisted anywhere but this page's own localStorage key. The
 * committed default lives in src/config/theme.config.ts and is only ever changed
 * by a human pasting the copied line into it.
 */
export const Route = createFileRoute("/(references)/components/theme-customizer")({
	head: () => ({
		meta: [{ title: seo.title("Theme customizer") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Theme customizer" },
	component: ThemeCustomizerLabPage,
});

function ThemeCustomizerLabPage() {
	const draft = useThemeDraftStore((state) => state.draft);
	const reset = useThemeDraftStore((state) => state.reset);
	const selectPreset = useThemeDraftStore((state) => state.selectPreset);
	const setDraft = useThemeDraftStore((state) => state.setDraft);

	const theme = useThemePreview(draft);
	// Measured from the entered hexes rather than from the painted document: these
	// are the designer's own values and their pairings, which exist whether or not
	// the palette has been applied yet.
	const designerGrid = useMemo(() => designerMatrix(draft.designer), [draft.designer]);
	const designerRows = useMemo(() => measureDesignerPalette(draft.designer), [draft.designer]);
	// Built through the generator rather than measured off the document: dark is
	// not painted while you are reading light, so there are no pixels to read. The
	// generator IS what ships, so it is the honest source for the half you cannot see.
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
		/* The bar is fixed to the bottom of the viewport, so it no longer takes
		   space in flow. This is the space, and it comes from the bar's own
		   measured height rather than a guess - see the ResizeObserver in
		   ThemeControlBar. Without it the copy command sits under the bar with no
		   scroll left to reach it. */
		<div className="mx-auto max-w-[110rem] space-y-6 pb-[var(--theme-bar-height,0px)]">
			<AppPageHeader
				subtitle="Choose a palette, a face and two radius scales. Every pairing the choice affects is measured beside the components it lands on."
				title="Theme customizer"
			/>

			{/* Full width, directly under the subtitle: it is the summary of what the
			    controls below did, and it belongs where a summary goes rather than in
			    a column beside one of the two things it summarises. */}
			<SurfaceBreakdown signal={`${JSON.stringify(draft)}|${theme}`} />

			{/* The source, then whatever that source needs. Above the board because
			    it decides what the board is showing - a reader who scrolls past this
			    is reading a preview without knowing which of two contracts it is
			    under. */}
			<AppGlassCard className={cn("flex flex-col", CARD_GAP, CARD_PADDING)}>
				<div>
					<h2 className="font-semibold text-xl">The four colours</h2>
					{/* One line. Which fields are required and what a blank one does are
					    both already on the fields - an asterisk and a placeholder - and a
					    caption restating the control beside it is read once and then
					    becomes furniture that pushes the controls down the page. */}
					<p className="mt-1 text-muted text-sm">Pick a theme below to fill these, or paste what a designer sent.</p>
				</div>

				<PreviewScopeNotice />

				<DesignerPaletteForm
					brandTheme={draft.brandTheme}
					data-cy="designer-form"
					isOnPreset={isOnPreset(draft)}
					onBrandThemeChange={(brandTheme) => setDraft({ ...draft, brandTheme })}
					onChange={(designer) => setDraft({ ...draft, designer })}
					onSaveAsChange={(saveAs) => setDraft({ ...draft, saveAs })}
					saveAs={draft.saveAs}
					value={draft.designer}
				/>

				{/* The matrix first: it is the form a designer already reads, and it
				    makes no editorial choice about which pairs matter. The rows below
				    interpret it - what to DO about the two or three cases that usually
				    bite - which is a different question. */}
				{designerGrid ? (
					<DesignerContrastMatrix
						caption="Each row is a TEXT colour, each column the background behind it. Contrast is symmetric, so the grid mirrors - it is drawn in full anyway, because looking up 'my brand on my background' should not mean working out which half of a triangle that lives in. These are the four hexes above, which are LIGHT-theme inputs: dark is derived from them, and has its own grid below."
						data-cy="designer-matrix"
						matrix={designerGrid}
						title="Contrast matrix - light"
					/>
				) : null}

				{/*
				 * The dark grid is not a nicety, it is the half a designer cannot see.
				 *
				 * The four fields are light-theme inputs. Dark is derived: the ground and
				 * the ink invert, `--brand-primary` inverts with them, and the brand FILL
				 * does NOT - it is theme-stable on purpose so the most brand-looking thing
				 * on the page does not change between modes. One grid cannot show that
				 * asymmetry, and the failure the light grid does contain - brand against
				 * foreground - reads as "do not put brand text on your body colour" when
				 * what it means here is "this fill is about to sit on the dark page".
				 *
				 * Which is exactly how a brand shipped whose CTA measured 2.40:1 against
				 * the dark page with a perfectly legible label on it.
				 */}
				{designerDarkGrid ? (
					<DesignerContrastMatrix
						caption="The same four ROLES as they will actually be painted in dark - derived, not typed. Brand here is the brand as TEXT, because every row of a matrix is read as a text colour. The brand FILL is a different token with different obligations, and it is measured on its own line below rather than against a bar that was never its."
						data-cy="designer-matrix-dark"
						matrix={designerDarkGrid}
						title="Contrast matrix - dark"
					/>
				) : null}

				{/* The fill's two bars, stated as what they are. A matrix cannot hold
				    this row: it would read as text and be judged at 7:1, when the shape
				    of a control answers to SC 1.4.11's 3:1. */}
				{designerDarkFillCheck ? (
					<p
						className="text-muted text-xs"
						data-cy="dark-fill-check"
					>
						Dark brand fill <code className="font-mono">{designerDarkFillCheck.hex}</code> - its label reads{" "}
						<strong>{designerDarkFillCheck.onInk.toFixed(2)}:1</strong> on it (7:1 bar, text), and the fill itself reads{" "}
						<strong>{designerDarkFillCheck.onGround.toFixed(2)}:1</strong> against the panel behind it (3:1 bar, because
						a fill is a graphic rather than type).
					</p>
				) : null}

				<DesignerPaletteReport
					advisories={designerAdvisories(draft.designer)}
					data-cy="designer-report"
					onUseSuggestion={(role, hex) => setDraft({ ...draft, designer: { ...draft.designer, [role]: hex } })}
					rows={designerRows}
				/>

				{/* Committing belongs with the values it commits. It used to sit in a
				    column beside the board, two scrolls from the fields somebody had
				    just filled in, which put the decision and the action on different
				    screens. */}
				<SaveThemePanel output={configOutput(draft)} />
			</AppGlassCard>

			{/* Below the four colours and above the board, because it is neither: it
			    is what one of those four BECOMES, and the board does not show it -
			    nothing in the component set paints a ramp step, by design. A designer
			    who is going to use these tints should meet them between deciding the
			    brand and judging the components. */}
			<BrandRampStrip signal={`${JSON.stringify(draft)}|${theme}`} />

			{/* Full width. The board used to share the row with a 26rem contrast
			    report, which cost it a third of the space it needs for three columns
			    of real components - and the report it was sharing with measured the
			    same palette the panel above already reports on, in more rows and
			    fewer words. */}
			<ThemePreviewBoard />

			<ThemeControlBar
				draft={draft}
				onChange={setDraft}
				onReset={reset}
				onSelectPreset={selectPreset}
			/>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * WHAT THIS PAGE IS DOING TO THE DOCUMENT, said out loud.
 *
 * Everything under it previews by mutating <html> live, and `useThemePreview`
 * puts it all back when you navigate away. That is the right default - a preview
 * that quietly became the project default is a change nobody reviewed - but
 * nothing on screen used to say so, and the page looked exactly the same whether
 * a palette had been committed or not.
 *
 * That silence is what made a real bug expensive: the apply endpoint was writing
 * nothing at all, and the preview made it look like it had worked. Two rounds of
 * "I set a theme and the pages did not use it" went into finding that, and a
 * reader who had been told the preview was temporary would have suspected the
 * button on the first try.
 *
 * At the TOP, next to the fields, because that is where somebody forms the
 * belief that they have changed the theme. Restating it beside the Save button
 * five sections down would be telling them after they were wrong.
 *
 * ## Two things it is careful NOT to do
 *
 * It does not render conditionally on "the draft differs from the committed
 * theme". A reader who has changed nothing yet is exactly the reader who does
 * not know the page previews at all, so this describes what the page ALWAYS
 * does rather than a transient condition.
 *
 * It does not claim the theme is unsaved, because this page never reads
 * theme.config.ts and so cannot know. Every clause here is about the PAGE -
 * it previews, it reverts on exit - which is true in every state.
 *
 * `AppAlert` rather than a paragraph: its icon carries the status alongside the
 * tint, which is what keeps this readable to a colour-blind reader, and the
 * padding and tone are the wrapper's to own rather than a call site's.
 */
function PreviewScopeNotice() {
	return (
		<AppAlert
			data-cy="preview-scope-notice"
			description={
				<>
					Nothing here touches the project until you press <strong>Save this palette</strong> at the foot of this card.
					Leave the page and it reverts to the committed theme.
				</>
			}
			icon={Eye}
			status="default"
			title="You are previewing"
		/>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * Save, and show what saving runs.
 *
 * This used to be a copy button and three steps of instructions, on the rule
 * that "nothing here writes it for you - a preview that quietly became the
 * project default is a change that ships unnoticed". The instinct was right and
 * it was aimed at the wrong risk. What the clipboard actually produced was:
 * press a button, switch to a terminal, paste, watch it fail on something this
 * page could have checked, fix it by hand, run it again, reload. Every step is a
 * place to stop halfway, and stopping halfway is what leaves a preset written
 * with no CSS generated for it.
 *
 * The safety is unchanged and was never the clipboard's: the endpoint exists in
 * the DEV SERVER ONLY (see vite-plugin-apply-theme.ts, `apply: "serve"`), it
 * runs the same script with the same flags, and it writes tracked source that
 * `git diff` reviews exactly as before.
 *
 * The command is still printed, and not as a fallback. It is what a reader needs
 * to put this in a script, run it in CI, or check what the button is about to do
 * before pressing it - so it stays visible rather than moving behind a
 * disclosure.
 */
function SaveThemePanel({ output }: { output: ConfigOutput }) {
	const { apply, detail, state } = useApplyTheme();

	return (
		<div className="space-y-2 border-border border-t pt-3">
			<p className="font-medium text-sm">{output.title}</p>

			{/*
			 * What the press will actually DO, before it is pressed.
			 *
			 * The button alone could not say this: "Save this palette" reads the same
			 * whether it is about to write a file or has already written one, and the
			 * page looks identical either way because the preview is painting the draft
			 * regardless. Naming the two files it touches makes the action checkable -
			 * a reader who presses this and sees no change in another tab now knows
			 * which files to look at, instead of doubting the button.
			 */}
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

			{/*
			 * The one state the page could not previously distinguish: written, as
			 * opposed to merely previewed. What it has to beat is the silence that made
			 * a broken apply look exactly like a working one.
			 *
			 * It is NOT the durable signal, and must not be treated as one - the plugin
			 * pushes a full reload over the HMR socket a beat later, so this may be on
			 * screen only briefly. The toast `useApplyTheme` already fires is what
			 * survives that, and removing it would leave this as the only confirmation
			 * of a write the reader may never see.
			 */}
			{state === "applied" ? (
				<AppAlert
					data-cy="save-theme-applied"
					description="presets.ts and theme.config.ts are updated. Every open tab is reloading onto them."
					icon={Check}
					status="success"
					title="Written to disk"
				/>
			) : null}

			{/* ON FAILURE ONLY. The outcome is a toast now, and on success this
			    panel is about to be wiped by a full page reload anyway - so a green
			    block of generator output would flash and vanish. What survives being
			    worth showing is the failure table: the toast carries the verdict and
			    this carries which pairing produced it. */}
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
