/**
 * The draft a developer is playing with, and the one rule that governs how it
 * is applied.
 *
 * A draft is either ON a preset or OFF it, and the difference is not cosmetic:
 *
 *   ON  - hue and tint still match the named preset. The page simply sets
 *         `data-palette`, and every colour comes from the generated stylesheet.
 *         What you see and what the report measures is the SHIPPED css.
 *   OFF - a hex was edited or the tint was dragged. There is no stylesheet for
 *         that combination, so the palette is generated in the browser and
 *         written as inline custom properties. Same generator, same clamps, same
 *         solver - but nobody has measured it before now, and the page says so.
 *
 * Everything that reads the committed config or the preset list is closed over
 * by `createThemeDraftKit` - the project passes its `THEME`, its merged preset
 * array, and the command its dev server runs to regenerate. The package cannot
 * import a project's `theme.config.ts` and stay a package.
 */

import {
	buildPresetIndex,
	type CardStyle,
	type ColorScheme,
	DESIGNER_ORDER,
	type DesignerPalette,
	type FontName,
	inlineDeclarations,
	oklchToHex,
	type PalettePreset,
	paletteToDesigner,
	type RadiusName,
	REQUIRED_ROLES,
	resolveDesignerPalette,
	type SurfaceStrategy,
	type ThemeConfig,
	type ThemeName,
} from "../../theme-engine";
import { buildPalette } from "../../theme-engine";

/** A palette name. The package is generic over whatever names a project's presets carry. */
type PaletteName = string;

export interface ThemeDraft {
	accentHue: number;
	baseTint: number;
	/** Which theme the brand hex in `designer.brand` is the REAL brand for. */
	brandTheme: ThemeName;
	/** The five hex values, as typed - the single source of colour for the whole draft. */
	designer: DesignerPalette;
	/** What an edited palette gets saved as - a theme name in the picker. */
	saveAs: string;
	font: FontName;
	formRadius: RadiusName;
	palette: PaletteName;
	/** What a card is made of. Glass is translucent; solid paints --surface. */
	card: CardStyle;
	/** Whether the project ships one scheme or lets the reader choose. Drafted, not previewed. */
	colorScheme: ColorScheme;
	/** Light mode's page/card ladder. Dark mode already ladders and ignores it. */
	surface: SurfaceStrategy;
	uiRadius: RadiusName;
}

export interface ConfigOutput {
	/** What has to happen before the line below can be pasted, if anything. */
	steps: string[];
	/** `preset` - paste and go. `custom` - the hue has to be registered first. */
	kind: "custom" | "preset";
	/** Everything to copy, in order, as one block. */
	text: string;
	title: string;
	/** The same command as `text`, as flags the dev endpoint can run directly. Null when incomplete. */
	flags: Record<string, string> | null;
}

/**
 * Two sets of five hexes, compared the way they are typed. Case-insensitive
 * because these arrive from a text field.
 */
function sameDesigner(a: DesignerPalette, b: DesignerPalette): boolean {
	return DESIGNER_ORDER.every((role) => (a[role] ?? "").toLowerCase() === (b[role] ?? "").toLowerCase());
}

export interface ThemeDraftKitOptions {
	/** The project's committed `THEME` from its `src/config/theme.config.ts`. */
	current: ThemeConfig;
	/** The merged preset list - `[...BUILTIN_PRESETS, ...projectPresets]`. */
	presets: readonly PalettePreset[];
	/**
	 * The command a project's dev server runs to regenerate palettes, printed in
	 * the copy panel. Defaults to the flat-repo form. Only documentation - Save
	 * posts `flags` to the write endpoint, which runs the generator itself.
	 */
	generateCommand?: string;
}

export interface ThemeDraftKit {
	committedDraft: () => ThemeDraft;
	isDirty: (draft: ThemeDraft) => boolean;
	isKnownPalette: (name: string) => boolean;
	isOnPreset: (draft: ThemeDraft) => boolean;
	fiveOf: (name: PaletteName) => DesignerPalette;
	applyPreset: (draft: ThemeDraft, name: PaletteName) => ThemeDraft;
	draftOverrides: (draft: ThemeDraft, theme: "dark" | "light") => Record<string, string>;
	configOutput: (draft: ThemeDraft) => ConfigOutput;
}

/**
 * Build the draft helpers for one project's committed config and preset list.
 * Called once by `<AppThemeCustomizer/>` (and by the store it creates).
 */
export function createThemeDraftKit({
	current,
	presets,
	generateCommand = "npx tsx scripts/generate-palettes.ts",
}: ThemeDraftKitOptions): ThemeDraftKit {
	const { byName: PRESET_BY_NAME } = buildPresetIndex(presets as readonly PalettePreset[]);
	const fallbackPreset = PRESET_BY_NAME[current.palette] ?? presets[0];

	/** A preset by name, with the missing case survived rather than thrown. */
	function presetOf(name: PaletteName): PalettePreset {
		return PRESET_BY_NAME[name] ?? fallbackPreset;
	}

	function fiveOf(name: PaletteName): DesignerPalette {
		const preset = presetOf(name);
		if (preset.supplied) return preset.supplied;
		const built = buildPalette({ accentHue: preset.accentHue, baseTint: preset.baseTint });
		return paletteToDesigner(built.light as never, built.stable as never);
	}

	function committedDraft(): ThemeDraft {
		const preset = presetOf(current.palette);
		return {
			accentHue: preset.accentHue,
			baseTint: preset.baseTint,
			brandTheme: preset.brandTheme ?? "light",
			card: current.card ?? "glass",
			colorScheme: current.colorScheme ?? "user",
			designer: fiveOf(current.palette),
			saveAs: current.palette,
			font: current.font,
			formRadius: current.formRadius,
			palette: current.palette,
			surface: current.surface ?? "flat",
			uiRadius: current.uiRadius,
		};
	}

	function isKnownPalette(name: string): boolean {
		return name in PRESET_BY_NAME;
	}

	/** Whether the draft still IS its named preset (compared on values + tint, not a flag). */
	function isOnPreset(draft: ThemeDraft): boolean {
		const onFive = sameDesigner(draft.designer, fiveOf(draft.palette));
		return onFive && draft.baseTint === presetOf(draft.palette).baseTint;
	}

	/** Whether pressing Apply would change a tracked file at all. */
	function isDirty(draft: ThemeDraft): boolean {
		const committed = committedDraft();
		return (
			draft.baseTint !== committed.baseTint ||
			draft.card !== committed.card ||
			draft.colorScheme !== committed.colorScheme ||
			draft.font !== committed.font ||
			draft.formRadius !== committed.formRadius ||
			draft.palette !== committed.palette ||
			draft.surface !== committed.surface ||
			draft.uiRadius !== committed.uiRadius ||
			!sameDesigner(draft.designer, committed.designer)
		);
	}

	/** Pick a theme: its five colours fill the form, and the draft is on it. */
	function applyPreset(draft: ThemeDraft, name: PaletteName): ThemeDraft {
		const preset = presetOf(name);
		return {
			...draft,
			accentHue: preset.accentHue,
			baseTint: preset.baseTint,
			brandTheme: preset.brandTheme ?? "light",
			designer: fiveOf(name),
			palette: name,
			saveAs: name,
		};
	}

	/** The custom properties a free hue needs, for the theme currently painted. */
	function draftOverrides(draft: ThemeDraft, theme: "dark" | "light"): Record<string, string> {
		if (isOnPreset(draft)) return {};
		const resolved = resolveDesignerPalette(draft.designer);
		if (!resolved) return {};
		return inlineDeclarations(
			buildPalette({
				accentHue: Math.round(resolved.values.brand.h),
				baseTint: draft.baseTint,
				brandTheme: draft.brandTheme,
				supplied: { ...resolved.values, surface: draft.designer.surface ? resolved.values.surface : undefined },
				surface: draft.surface,
			}),
			theme,
		);
	}

	/** What to copy, and it CHANGES when the sliders move. */
	function configOutput(draft: ThemeDraft): ConfigOutput {
		const sharedFlags: Record<string, string> = {
			"--card": draft.card,
			"--color-scheme": draft.colorScheme,
			"--font": draft.font,
			"--form-radius": draft.formRadius,
			"--surface": draft.surface,
			"--ui-radius": draft.uiRadius,
		};
		const flagsFor = (own: Record<string, string>) => ({ ...own, ...sharedFlags });
		const lineFor = (flags: Record<string, string>) =>
			[generateCommand, ...Object.entries(flags).map(([flag, value]) => `${flag} ${value}`)].join(" ");

		if (!isOnPreset(draft)) {
			const resolved = resolveDesignerPalette(draft.designer);
			if (!resolved) {
				return {
					kind: "custom",
					steps: [
						`Fill in ${REQUIRED_ROLES.join(", ")} before this can be committed - they are the three nothing can be inferred from.`,
					],
					flags: null,
					text: "",
					title: "Not yet - the palette is incomplete",
				};
			}

			const colors = DESIGNER_ORDER.map((role) =>
				role === "surface" && !draft.designer.surface ? "" : oklchToHex(resolved.values[role]),
			).join(",");
			const name = draft.saveAs.trim() || "my-theme";

			const flags = flagsFor({
				"--apply": `${name}:${Math.round(resolved.values.brand.h)}:${draft.baseTint}`,
				"--brand-theme": draft.brandTheme,
				"--colors": colors,
			});

			return {
				flags,
				kind: "custom",
				steps: [
					`Writes these values into presets.ts under the name "${name}", points theme.config.ts at them, then solves the remaining tokens and measures the lot.`,
					resolved.derived.filter((role) => role !== "surface").length > 0
						? `The command carries the ${resolved.derived.filter((role) => role !== "surface").join(" and ")} we derived, so what ships is what you saw here rather than something recomputed later.`
						: "Every value is one you supplied. Nothing in the command was invented.",
					"It will report any pairing that fails and write the palette anyway - a designer's colour is not a build step's to change.",
				],
				text: lineFor(flags),
				title: `Save this palette as "${name}"`,
			};
		}

		const flags = flagsFor({ "--use": draft.palette });
		return {
			flags,
			kind: "preset",
			steps: [
				"Writes theme.config.ts, then regenerates and re-measures every palette - so a stale stylesheet cannot survive the change.",
				"Nothing in presets.ts moves: this palette already exists and is already measured.",
			],
			text: lineFor(flags),
			title: "Take this theme to the committed default",
		};
	}

	return {
		committedDraft,
		isDirty,
		isKnownPalette,
		isOnPreset,
		fiveOf,
		applyPreset,
		draftOverrides,
		configOutput,
	};
}
