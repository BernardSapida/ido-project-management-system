/**
 * The draft a developer is playing with, and the one rule that governs how it
 * is applied.
 *
 * A draft is either ON a preset or OFF it, and the difference is not cosmetic:
 *
 *   ON  - hue and tint still match the named preset. The page simply sets
 *         `data-palette`, and every colour comes from the generated stylesheet.
 *         What you see and what the report measures is the SHIPPED css, so a
 *         pass here is a pass in the app.
 *   OFF - a hex was edited or the tint was dragged. There is no stylesheet for
 *         that combination, so the palette is generated in the browser and
 *         written as inline custom properties. Same generator, same clamps, same
 *         solver - but nobody has measured it before now, and the page says so.
 *
 * Keeping the two paths distinct is the whole reason the report can be trusted.
 * If a preset were previewed through the inline path too, the page would be
 * measuring the generator twice over and never the stylesheet the app loads.
 */

import {
	DESIGNER_ORDER,
	type DesignerPalette,
	paletteToDesigner,
	REQUIRED_ROLES,
	resolveDesignerPalette,
} from "@/config/theme/designer-palette";
import { oklchToHex } from "@/config/theme/oklch";
import type { SurfaceStrategy, ThemeName } from "@/config/theme/palette.build";
import { buildPalette } from "@/config/theme/palette.build";
import { inlineDeclarations } from "@/config/theme/palette.emit";
import { PALETTE_PRESETS, type PaletteName, PRESET_BY_NAME } from "@/config/theme/presets";
import { type CardStyle, type ColorScheme, type FontName, type RadiusName, THEME } from "@/config/theme.config";

export interface ThemeDraft {
	accentHue: number;
	baseTint: number;
	/**
	 * Which theme the brand hex in `designer.brand` is the REAL brand for.
	 *
	 * The four-colour form cannot infer it and must not guess. A brand deck says
	 * "our green is #315443" and does not say which mode that green is the green
	 * of - and it matters, because no single lightness clears the non-text bar
	 * against both a white page and a dark card. The anchored theme paints the hex
	 * exactly; the other paints the nearest lightness at the same hue and chroma
	 * that clears its own grounds.
	 */
	brandTheme: ThemeName;
	/**
	 * The five hex values, as typed - and the single source of colour for the
	 * whole draft.
	 *
	 * There is no separate "preset mode". Picking a named theme fills these with
	 * that theme's five; editing one leaves the theme without leaving anything
	 * else. `isOnPreset` compares them back against the named preset, so the
	 * guarantee follows the values rather than a flag.
	 */
	designer: DesignerPalette;
	/**
	 * What an edited palette gets saved as - a theme name in the picker.
	 *
	 * Lives on the draft rather than in the copy panel so it survives a reload
	 * with the colours it belongs to. Blank falls back to `my-theme`, which is a
	 * name somebody will notice and change rather than one they will ship by
	 * accident.
	 */
	saveAs: string;
	font: FontName;
	formRadius: RadiusName;
	palette: PaletteName;
	/** What a card is made of. Glass is translucent; solid paints --surface. */
	card: CardStyle;
	/**
	 * Whether the project ships one scheme or lets the reader choose.
	 *
	 * Drafted like every other key here, but deliberately NOT previewed: the board
	 * and the contrast report below it are how you decide whether a project has a
	 * dark design worth shipping, so drafting `light-only` must not be what stops
	 * you looking at dark. It takes effect when the line is committed.
	 */
	colorScheme: ColorScheme;
	/** Light mode's page/card ladder. Dark mode already ladders and ignores it. */
	surface: SurfaceStrategy;
	uiRadius: RadiusName;
}

/** The committed project default, as a draft. What "Reset" goes back to. */
export function committedDraft(): ThemeDraft {
	const preset = PRESET_BY_NAME[THEME.palette];

	return {
		accentHue: preset.accentHue,
		baseTint: preset.baseTint,
		brandTheme: preset.brandTheme ?? "light",
		card: THEME.card ?? "glass",
		colorScheme: THEME.colorScheme ?? "user",
		designer: fiveOf(THEME.palette),
		// The committed palette, for the same reason `applyPreset` carries it: a
		// fresh draft is ON that theme, so that is the theme an edit would modify.
		saveAs: THEME.palette,
		font: THEME.font,
		formRadius: THEME.formRadius,
		palette: THEME.palette,
		surface: THEME.surface ?? "flat",
		uiRadius: THEME.uiRadius,
	};
}

/** Whether a name still refers to a preset this build ships. */
export function isKnownPalette(name: string): name is PaletteName {
	return name in PRESET_BY_NAME;
}

/**
 * Whether the draft still IS its named preset, and therefore still carries the
 * guarantee that preset was gated on.
 *
 * Compared on the VALUES rather than on a mode flag. Pick a theme and they are
 * the preset's, so this is true; change one and it is not, which is exactly when
 * the guarantee stops applying. Nobody has to remember to flip anything, and
 * there is no state where the page claims a guarantee for values that have been
 * edited.
 */
export function isOnPreset(draft: ThemeDraft): boolean {
	const onFive = sameDesigner(draft.designer, fiveOf(draft.palette));

	/*
	 * The tint is compared as well as the five, and it has to be: it is the one
	 * input to the palette that no hex on the form carries.
	 *
	 * `baseTint` is not a brand colour, it is how much of the brand's hue is mixed
	 * into the NEUTRALS - so moving it repaints the page and every card while
	 * leaving all five hexes exactly where they were. Compare only the five and a
	 * dragged tint leaves this true, `draftOverrides` returns {} on that branch,
	 * and the control moves a number that paints nothing on any preset - a dead
	 * slider, on every theme, with nothing on screen to say why.
	 *
	 * It also has to be false for the honest reason, not just the repaint: a
	 * palette measured at 0.012 has not been measured at 0.02. The preset's
	 * guarantee belongs to the preset's tint.
	 */
	return onFive && draft.baseTint === presetOf(draft.palette).baseTint;
}

/**
 * Two sets of five hexes, compared the way they are typed.
 *
 * Case-insensitive because these arrive from a text field: `#E50914` and
 * `#e50914` are the same colour, and a draft that reads as edited because
 * somebody held shift is a draft that offers to rewrite a file for nothing.
 */
function sameDesigner(a: DesignerPalette, b: DesignerPalette): boolean {
	return DESIGNER_ORDER.every((role) => (a[role] ?? "").toLowerCase() === (b[role] ?? "").toLowerCase());
}

/**
 * Whether anything in the draft has moved away from what the project has
 * COMMITTED - which is a different question from `isOnPreset`.
 *
 * `isOnPreset` asks whether the colours still carry their preset's measured
 * guarantee. This asks whether pressing Apply would change a tracked file at
 * all, and it therefore has to cover the seven keys that have nothing to do
 * with colour: a draft on netflix with the radius dragged from medium to none
 * is still on its preset and still worth writing.
 *
 * `saveAs` is deliberately not compared. It names the preset an edited palette
 * would be written under, so on its own it changes nothing - and a bar that
 * offered to apply because a name field has a character in it would be offering
 * to write the theme that is already committed.
 */
export function isDirty(draft: ThemeDraft): boolean {
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

/**
 * A preset by name, with the missing case survived rather than thrown.
 *
 * Falls back rather than throwing, because the name can arrive from
 * localStorage and the preset list is a thing people edit. A draft saved
 * against a palette that has since been renamed or removed would otherwise
 * take the whole page down on load - which it did, with "Cannot read
 * properties of undefined (reading 'supplied')", from a draft naming a preset
 * this repo no longer ships.
 *
 * Shared by `fiveOf` and `isOnPreset` so the two cannot disagree about which
 * preset a stale name resolves to - one reading the fallback's colours while
 * the other compared the fallback's tint would be a draft that is on a preset
 * and off it at the same time.
 */
function presetOf(name: PaletteName) {
	return PRESET_BY_NAME[name] ?? PRESET_BY_NAME[THEME.palette] ?? PALETTE_PRESETS[0];
}

/**
 * The five colours a named preset resolves to.
 *
 * Solving it here rather than reading the generated record because a preset
 * carrying a designer's own `supplied` block should hand back THOSE five, not
 * the ones the solver would have produced from its hue.
 */
export function fiveOf(name: PaletteName): DesignerPalette {
	const preset = presetOf(name);
	if (preset.supplied) return preset.supplied;

	const built = buildPalette({ accentHue: preset.accentHue, baseTint: preset.baseTint });
	return paletteToDesigner(built.light as never, built.stable as never);
}

/**
 * Pick a theme: its five colours fill the form, and the draft is on it.
 *
 * There is no mode to enter. A theme IS five colours and a name - some solved to
 * hit bars, some handed over - so choosing one and then editing a single value
 * is just editing. What changes is the GUARANTEE, and that is derived from
 * whether the five still match rather than from a switch somebody has to
 * remember to flip.
 */
export function applyPreset(draft: ThemeDraft, name: PaletteName): ThemeDraft {
	const preset = PRESET_BY_NAME[name];

	return {
		...draft,
		accentHue: preset.accentHue,
		baseTint: preset.baseTint,
		brandTheme: preset.brandTheme ?? "light",
		designer: fiveOf(name),
		palette: name,
		/*
		 * The save name follows the theme you picked.
		 *
		 * The name field only appears once a value has been edited, which is the
		 * moment somebody has stopped browsing and started changing a specific
		 * theme - and it used to appear EMPTY, falling back to "my-theme". So
		 * tweaking uber and pressing save wrote a new preset called my-theme and
		 * left uber untouched, which is the opposite of what the action reads as.
		 * Carrying the name through means the field answers "which theme am I
		 * about to modify" before it is asked.
		 *
		 * It stays editable, and that is the escape hatch: type a new name and it
		 * becomes a copy rather than an edit. What is no longer possible is
		 * intending an edit and silently getting a copy.
		 */
		saveAs: name,
	};
}

/**
 * The custom properties a free hue needs, for the theme currently painted.
 *
 * Empty when the draft is on its preset - there is nothing to override, and
 * writing the same values inline anyway would hide a stylesheet that had gone
 * stale.
 */
export function draftOverrides(draft: ThemeDraft, theme: "dark" | "light"): Record<string, string> {
	/*
	 * On the preset, nothing is written: the page paints from the generated
	 * stylesheet, which is the point - what the report measures is then the CSS
	 * the app would actually ship rather than a second copy of the generator.
	 */
	if (isOnPreset(draft)) return {};

	// Off it, the five are being edited a character at a time and no stylesheet is
	// keeping up. An incomplete palette paints nothing rather than falling back to
	// something else mid-keystroke.
	const resolved = resolveDesignerPalette(draft.designer);
	if (!resolved) return {};

	return inlineDeclarations(
		buildPalette({
			accentHue: Math.round(resolved.values.brand.h),
			baseTint: draft.baseTint,
			brandTheme: draft.brandTheme,
			/*
			 * The card is passed ONLY when somebody typed one.
			 *
			 * `resolveDesignerPalette` always returns a value for it - the page, as a
			 * conservative fallback so the report and the matrix have something to
			 * measure - but handing that to the solver would pin the card to the page
			 * on every draft and leave the Surface control inert. Which is precisely
			 * the bug the old page-moving `raised` had, one token over.
			 */
			supplied: { ...resolved.values, surface: draft.designer.surface ? resolved.values.surface : undefined },
			surface: draft.surface,
		}),
		theme,
	);
}

export interface ConfigOutput {
	/** What has to happen before the line below can be pasted, if anything. */
	steps: string[];
	/** `preset` - paste and go. `custom` - the hue has to be registered first. */
	kind: "custom" | "preset";
	/** Everything to copy, in order, as one block. */
	text: string;
	title: string;
	/**
	 * The same command as `text`, as flags the dev endpoint can run directly.
	 *
	 * Both, from ONE place. The Save button posts this and the panel still shows
	 * `text`, so what the button does and what the terminal would do cannot drift:
	 * they are the same values formatted twice, rather than two constructions of
	 * the same intent. Null when the palette is not yet complete enough to write.
	 */
	flags: Record<string, string> | null;
}

/**
 * What to copy, and it CHANGES when the sliders move.
 *
 * The bug this replaces: the panel emitted the same four-key line no matter
 * what the accent and base were doing, so dragging a hue appeared to have no
 * effect on the output. It was not a formatting oversight - it was the panel
 * quietly pretending a free hue is a thing `theme.config.ts` can express, and
 * it cannot. `palette` names a preset, and a preset is a block of generated CSS
 * that exists in styles/palettes.css or does not exist at all. There is no
 * stylesheet behind hue 217, so pasting `palette: "sky"` after dragging to 217
 * would have shipped sky.
 *
 * So an off-preset draft gets ONE COMMAND instead. It carries the hue, the
 * tint, the face and both radius steps, and `--apply` writes the preset, writes
 * theme.config.ts, then solves and measures - upserting, so dragging the slider
 * again and rerunning it just works.
 *
 * It used to be a four-step checklist: add a name to one array, add an object
 * to a second array in the same file, regenerate, then paste a line into a
 * third file. That is a lot of hand-editing to ask of somebody who has just
 * dragged a slider, and the failure when they stopped after two steps was
 * silent - a palette that typechecked, existed, and was never painted.
 */
export function configOutput(draft: ThemeDraft): ConfigOutput {
	const sharedFlags: Record<string, string> = {
		"--card": draft.card,
		"--color-scheme": draft.colorScheme,
		"--font": draft.font,
		"--form-radius": draft.formRadius,
		"--surface": draft.surface,
		"--ui-radius": draft.uiRadius,
	};
	/*
	 * ONE construction, printed twice.
	 *
	 * The Save button posts `flags` and the panel prints `text`, and the first
	 * version of this built them side by side "so they cannot drift" - and they
	 * drifted immediately. The on-preset branch printed `--use netflix` and posted
	 * `--apply netflix:28:0.008`, which is not a formatting difference: `--apply`
	 * without `--colors` UPSERTS the entry and drops its `supplied` block, so the
	 * button would have deleted a shipped preset's designer hexes while the
	 * command beside it did nothing of the sort.
	 *
	 * `text` is now derived FROM `flags`. Two things built from one object cannot
	 * disagree about what they are; two objects built from one intention can, and
	 * did.
	 */
	const flagsFor = (own: Record<string, string>) => ({ ...own, ...sharedFlags });
	const lineFor = (flags: Record<string, string>) =>
		["npx tsx scripts/generate-palettes.ts", ...Object.entries(flags).map(([flag, value]) => `${flag} ${value}`)].join(
			" ",
		);

	/*
	 * A COMMAND in both cases, and it used to be a command for a free hue and a
	 * line to go and hand-edit for a preset. The two were never equally easy, and
	 * the harder one was the path almost everybody takes: pick a named palette,
	 * pick a radius, then go and find a file and replace a line in it correctly.
	 *
	 * `--use` rather than `--apply` here. `--apply` upserts the preset, so
	 * pointing it at a shipped palette would rewrite that palette's line in a
	 * tracked source file to say exactly what it already said - a diff nobody
	 * asked for, from choosing "Sky" in a dropdown.
	 */
	/*
	 * A designer palette needs `--colors` as well as `--apply`, because the five
	 * hexes are the whole point and no hue-and-tint pair can stand in for them.
	 * The two numbers still travel: they seed the seventy tokens nobody supplied.
	 */
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

		/*
		 * Six slots always, and the CARD is emitted empty unless it was typed.
		 *
		 * The other two derivable roles go out with their derived value on purpose -
		 * "what ships is what you saw here rather than something recomputed later".
		 * The card cannot follow that rule: a value in this slot PINS it, and a
		 * pinned card is a card the Surface control can no longer move, so a command
		 * carrying the derived one would quietly disable a control the developer
		 * still has set to Raised. Empty means "the strategy decides", which is what
		 * they actually chose.
		 *
		 * Emitting six slots rather than five is also what lets `parseColors` tell a
		 * new command from an old one by arity alone.
		 */
		const colors = DESIGNER_ORDER.map((role) =>
			role === "surface" && !draft.designer.surface ? "" : oklchToHex(resolved.values[role]),
		).join(",");
		/*
		 * The name the palette will be SAVED under, and it is the developer's to
		 * choose. Defaulting it to something fixed meant every saved palette
		 * overwrote the last one, which is a bad surprise the second time and an
		 * invisible one the first.
		 */
		const name = draft.saveAs.trim() || "my-theme";

		const flags = flagsFor({
			"--apply": `${name}:${Math.round(resolved.values.brand.h)}:${draft.baseTint}`,
			/*
			 * Which theme the hex above is the real brand for. Without it, Save wrote
			 * a preset that always anchored to light: anchoring to dark previewed
			 * correctly on this page and shipped as its opposite.
			 */
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

	if (isOnPreset(draft)) {
		/*
		 * `--use`, never `--apply`. This is the branch for "I picked a shipped theme
		 * and want it committed", and `--apply` would upsert the preset - rewriting
		 * a tracked line to say what it already said at best, and at worst dropping
		 * the `supplied` block, since there are no `--colors` to carry it. Choosing
		 * netflix from a dropdown must not delete netflix's brand hexes.
		 */
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

	const name = "custom";
	const flags = flagsFor({ "--apply": `${name}:${draft.accentHue}:${draft.baseTint}` });

	return {
		flags,
		kind: "custom",
		steps: [
			"Writes the preset and theme.config.ts, then solves and measures the hue - and refuses to write a palette that fails.",
			`If "${name}" already exists it is updated in place, so you can iterate on a hue without cleaning up first.`,
		],
		text: lineFor(flags),
		title: "Take this theme to the committed default",
	};
}
