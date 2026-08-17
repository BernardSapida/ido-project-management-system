/**
 * Generate the eight presets: the stylesheet the app paints from, and the
 * machine-readable record of what was measured.
 *
 *   pnpm --filter @app/web generate:palettes
 *
 * Two outputs, on purpose:
 *
 *   src/styles/palettes.css              what the browser reads
 *   src/config/theme/palettes.generated.ts  what spec 002 reads
 *
 * The second one exists because mobile cannot consume oklch and a person
 * copying eight hex values out of a stylesheet by eye is exactly how the web
 * and mobile palettes drifted apart last time. Every value in it is emitted
 * with both its authored oklch and the sRGB hex it rasterises to, alongside the
 * contrast ratio that was measured between them.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { oklchToHex, oklchToRgb, parseOklch, type Rgb } from "../src/config/theme/oklch";
import {
	DESIGNER_ORDER,
	type DesignerRole,
	LEGACY_DESIGNER_ORDER,
	resolveDesignerPalette,
} from "../src/config/theme/designer-palette";
import type { SurfaceStrategy } from "../src/config/theme/palette.build";
import { buildPalette, TINT_MAX } from "../src/config/theme/palette.build";
import { inlineDeclarations, paletteSheet, stableDeclarations, themeDeclarations } from "../src/config/theme/palette.emit";
import { measurePairings } from "../src/config/theme/pairings";
import {
	CARD_NAMES,
	COLOR_SCHEME_NAMES,
	FONT_OPTIONS,
	RADIUS_NAMES,
	SURFACE_NAMES,
	UI_RADIUS_NAMES,
} from "../src/config/theme/options";
import { PALETTE_PRESETS, type PalettePreset } from "../src/config/theme/presets";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");

/* -- applying a theme, without editing anything by hand -------------------- */

/**
 * `--apply <name>:<hue>[:<tint>]` takes a theme from the customizer all the way
 * to committed, in one command: it writes the preset, writes theme.config.ts,
 * then solves, measures and regenerates.
 *
 * The customizer's copy action hands over this exact line, and that is the
 * whole point. The flow it replaces was: add a name to one array, add an object
 * to a second array in the same file, run the generator, then paste a config
 * line into a third file. Four steps, three of them hand-editing, and the
 * failure when somebody stopped after two was SILENT - a palette that
 * typechecked, existed, and was never painted, because no CSS had been written
 * for it.
 *
 * It UPSERTS rather than refusing on a duplicate. Iterating on a hue is the
 * normal case - drag, look, drag again - and a tool that makes you delete the
 * last attempt before trying the next one is a tool you stop using. Every
 * change is printed as `before -> after` so what it did is on screen, and git
 * has the diff either way.
 *
 * It edits source, which is worth being deliberate about: it touches exactly
 * two lines in two files, validates every value BEFORE writing anything, and
 * names in its output what it changed.
 */
interface ApplyOptions {
	font?: string;
	formRadius?: string;
	surface?: string;
	card?: string;
	colorScheme?: string;
	uiRadius?: string;
}

function flagValue(flag: string): string | undefined {
	const index = process.argv.indexOf(flag);
	return index === -1 ? undefined : process.argv[index + 1];
}

/**
 * `--colors background,surface,brand,foreground,secondary,accent` - a designer
 * palette, in DESIGNER_ORDER, with an empty slot for anything to be derived.
 *
 * The order is not decoration, and this docstring has been wrong before: it once
 * said `bg,fg,brand,secondary,accent` while the parser read something else
 * entirely, which is the exact mistake a single shared constant exists to
 * prevent. It is written out above rather than described so the two cannot drift
 * again - and the values come from DESIGNER_ORDER in the message below, so a
 * future reorder updates the error even if somebody forgets this line.
 *
 * Parsed here so a malformed value stops the run rather than being written into
 * presets.ts and failing later at build time, where the error would name a
 * generated file instead of the thing somebody typed.
 */
function parseColors(spec: string | undefined): PalettePreset["supplied"] | undefined {
	if (!spec) return undefined;

	const parts = spec.split(",").map((part) => part.trim());

	/*
	 * ARITY picks the order, and that is what makes the reorder safe.
	 *
	 * DESIGNER_ORDER used to run brand-first with five roles; it now runs
	 * ground-first with six. Positions therefore mean different things, and a
	 * command saved before the change would land a brand in the background field
	 * and generate a different palette in silence.
	 *
	 * Five values can only be an old command - the card did not exist then - and
	 * six can only be a new one, because the customizer always emits six slots now.
	 * So each is read in its own order and nothing has to be migrated. This is the
	 * whole reason LEGACY_DESIGNER_ORDER is frozen rather than maintained.
	 */
	const order =
		parts.length === LEGACY_DESIGNER_ORDER.length
			? (LEGACY_DESIGNER_ORDER as readonly DesignerRole[])
			: DESIGNER_ORDER;

	if (parts.length !== order.length) {
		throw new Error(
			`--colors takes ${DESIGNER_ORDER.length} values in the order ${DESIGNER_ORDER.join(",")} (or ${LEGACY_DESIGNER_ORDER.length} in the pre-surface order) - got ${parts.length}.`,
		);
	}

	/*
	 * An EMPTY slot is a role left blank, not a malformed command.
	 *
	 * It is how the six-value form expresses "derive this one" - which the old
	 * five-value form could not say at all, so every command it produced pinned
	 * all five. Dropping the key entirely rather than passing "" matters: the
	 * resolver decides what to derive by absence, and an empty string is a value
	 * that fails to parse.
	 */
	const supplied = Object.fromEntries(
		order.map((role, index) => [role, parts[index]]).filter(([, hex]) => hex !== ""),
	) as NonNullable<PalettePreset["supplied"]>;

	if (!resolveDesignerPalette(supplied)) {
		throw new Error(`--colors is missing a required value or contains something that is not a hex: ${parts.join(" ")}`);
	}

	return supplied;
}

/**
 * The span of one preset entry in presets.ts, however it happens to be formatted.
 *
 * This replaced a single-line regex, and the regex was not merely limited - it
 * failed on the exact palettes most likely to be re-applied. A preset carrying a
 * `supplied` block is written across several lines the moment anybody runs
 * Biome over the file, so `--apply revolve:...` refused with "exists but is not
 * on a single line, edit it by hand" - telling somebody to hand-edit a generated
 * file, which is the whole thing this command exists to avoid.
 *
 * Found by NAME and then matched by BRACE DEPTH: from the entry's opening `{` -
 * a tab-indented brace at the start of a line, which is the array-item shape in
 * both formattings - forward until the depth returns to zero, plus the trailing
 * comma. Depth counting is safe here because the only strings in an entry are
 * hex values and a description, and neither can contain a brace; a description
 * that did would need a real parser, and would be a reason to reach for one.
 */
function entrySpanFor(source: string, name: string): [start: number, end: number] | null {
	const at = source.indexOf(`name: "${name}"`);
	if (at === -1) return null;

	const open = source.lastIndexOf("\n\t{", at);
	if (open === -1) return null;

	let depth = 0;
	for (let index = open + 1; index < source.length; index++) {
		const char = source[index];
		if (char === "{") depth++;
		else if (char === "}") {
			depth--;
			if (depth === 0) {
				const comma = source[index + 1] === "," ? index + 2 : index + 1;
				return [open + 1, comma];
			}
		}
	}

	return null;
}

function upsertPreset(
	spec: string,
	supplied?: PalettePreset["supplied"],
	brandTheme?: PalettePreset["brandTheme"],
): { baseTint: number; accentHue: number; name: string } {
	const [name, hue, tint = "0.02"] = spec.split(":");

	if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
		throw new Error(`"${name}" is not a usable palette name - lower-case, starting with a letter.`);
	}

	const accentHue = Number(hue);
	const baseTint = Number(tint);
	if (!Number.isFinite(accentHue) || accentHue < 0 || accentHue > 359) {
		throw new Error(`hue must be 0-359, got "${hue}".`);
	}
	if (!Number.isFinite(baseTint) || baseTint < 0 || baseTint > TINT_MAX) {
		throw new Error(`tint must be 0-${TINT_MAX}, got "${tint}".`);
	}

	const presetsPath = resolve(webRoot, "src/config/theme/presets.ts");
	const source = readFileSync(presetsPath, "utf8");
	const existing = PALETTE_PRESETS.find((preset) => preset.name === name);

	/*
	 * Only the keys that were actually supplied, not a fixed five.
	 *
	 * Half of them are optional now and their ABSENCE is meaningful: a missing
	 * card is what lets the Surface control act, and a missing accent is what
	 * keeps it derived rather than pinned. The fixed-five version wrote
	 * `accent: "undefined"` into a tracked source file the moment a role went
	 * optional - a preset that parses, typechecks, and paints something nobody
	 * chose.
	 *
	 * Sorted so re-applying an unchanged palette produces no diff.
	 */
	const suppliedKey = supplied
		? `, supplied: { ${(Object.keys(supplied) as (keyof typeof supplied)[])
				.filter((role) => supplied[role])
				.sort()
				.map((role) => `${role}: "${supplied[role]}"`)
				.join(", ")} }`
		: "";
	const description = supplied
		? "Supplied by a designer - measured, not solved."
		: existing?.description || "Added from the theme customizer.";
	/*
	 * Written only when it is `dark`, because `light` is the default and an entry
	 * carrying `brandTheme: "light"` says nothing the absence did not. Emitting it
	 * anyway would churn the diff of every existing preset the first time somebody
	 * re-applied one.
	 *
	 * Meaningless without `supplied` - a solved palette has no hex to anchor - so
	 * it rides in the same branch.
	 */
	const brandThemeKey = supplied && brandTheme === "dark" ? `, brandTheme: "dark"` : "";
	const entry = `	{ accentHue: ${accentHue}, baseTint: ${baseTint}${brandThemeKey}, description: "${description}", name: "${name}"${suppliedKey} },`;

	if (existing) {
		const span = entrySpanFor(source, name);
		if (!span) {
			throw new Error(
				`"${name}" is in PALETTE_PRESETS but its entry could not be located in presets.ts - has the file's shape changed?`,
			);
		}
		/*
		 * Rewritten as ONE line whatever it was before. The formatter will spread it
		 * again if it is long enough, and `entrySpanFor` finds it either way.
		 *
		 * `entry` keeps its own leading tab and the span starts AT that tab, so the
		 * two must not both supply it and must not both drop it. Trimming here wrote
		 * the entry hard against column 0, which lints and reads as a preset that
		 * has fallen out of the array.
		 */
		writeFileSync(presetsPath, source.slice(0, span[0]) + entry + source.slice(span[1]), "utf8");
		console.log(
			`updated "${name}": hue ${existing.accentHue} -> ${accentHue}, tint ${existing.baseTint} -> ${baseTint}`,
		);
	} else {
		const marker = "] as const satisfies readonly PalettePreset[];";
		if (!source.includes(marker)) {
			throw new Error("could not find the end of PALETTE_PRESETS in presets.ts - has its shape changed?");
		}
		writeFileSync(presetsPath, source.replace(marker, `${entry}
${marker}`), "utf8");
		console.log(`added "${name}": hue ${accentHue}, tint ${baseTint}`);
	}

	return { accentHue, baseTint, name };
}

function writeThemeConfig(palette: string, options: ApplyOptions): void {
	const configPath = resolve(webRoot, "src/config/theme.config.ts");
	const source = readFileSync(configPath, "utf8");
	const current = /export const THEME: ThemeConfig = \{([^}]*)\};/.exec(source);
	if (!current) {
		throw new Error("could not find the THEME line in theme.config.ts - has its shape changed?");
	}

	const read = (key: string, fallback: string) => new RegExp(`${key}: "([^"]*)"`).exec(current[1])?.[1] ?? fallback;
	const font = options.font ?? read("font", "inter");
	const uiRadius = options.uiRadius ?? read("uiRadius", "lg");
	const formRadius = options.formRadius ?? read("formRadius", "sm");
	// Defaults to what is already committed, like every other key here, so
	// rerunning --apply without the flag cannot silently drop a surface somebody
	// chose. `flat` then means "written out as flat" rather than "absent"; the
	// line below omits it again on the way out.
	const surface = options.surface ?? read("surface", "flat");
	// Same defaulting rule as `surface`, for the same failure: a developer who
	// chose Solid, ran the command, then reran it later without the flag would
	// otherwise have the choice silently reverted by their own second run.
	const card = options.card ?? read("card", "glass");
	// Same defaulting rule again: `user` means "written out as user" rather than
	// "absent", and the line below omits it on the way out.
	const colorScheme = options.colorScheme ?? read("colorScheme", "user");

	if (!(font in FONT_OPTIONS)) {
		throw new Error(`"${font}" is not a font this template ships - one of ${Object.keys(FONT_OPTIONS).join(", ")}.`);
	}
	for (const [label, value, allowed] of [
		["ui-radius", uiRadius, UI_RADIUS_NAMES as readonly string[]],
		["form-radius", formRadius, RADIUS_NAMES as readonly string[]],
		["surface", surface, SURFACE_NAMES as readonly string[]],
		["card", card, CARD_NAMES as readonly string[]],
		["color-scheme", colorScheme, COLOR_SCHEME_NAMES as readonly string[]],
	] as const) {
		if (!allowed.includes(value)) {
			throw new Error(`"${value}" is not a ${label} step - one of ${allowed.join(", ")}.`);
		}
	}

	// `flat` is the default and is left off the line entirely - a config that
	// states every default is one nobody reads for the key that is not one.
	const surfaceKey = surface === "flat" ? "" : `, surface: "${surface}"`;
	const cardKey = card === "glass" ? "" : `, card: "${card}"`;
	const colorSchemeKey = colorScheme === "user" ? "" : `, colorScheme: "${colorScheme}"`;
	const next = `export const THEME: ThemeConfig = { palette: "${palette}", font: "${font}", uiRadius: "${uiRadius}", formRadius: "${formRadius}"${surfaceKey}${cardKey}${colorSchemeKey} };`;
	writeFileSync(configPath, source.replace(current[0], next), "utf8");
	console.log(`wrote theme.config.ts: palette "${palette}", font "${font}", radius "${uiRadius}"/"${formRadius}", surface "${surface}", card "${card}", colour scheme "${colorScheme}"
`);
}

/*
 * WHICH theme the supplied brand is the real brand for. Defaults to light.
 *
 * Validated rather than trusted: this ends up written into a tracked source file,
 * and "ligth" landing in presets.ts would typecheck as a string the generator
 * silently ignored.
 */
const brandThemeFlag = ((): "dark" | "light" | undefined => {
	const raw = flagValue("--brand-theme");
	if (raw === undefined) return undefined;
	if (raw !== "dark" && raw !== "light") {
		throw new Error(`--brand-theme must be "light" or "dark", got "${raw}".`);
	}
	return raw;
})();

const applySpec = flagValue("--apply");
if (process.argv.includes("--apply") && !applySpec) {
	console.error(
		`usage: --apply <name>:<hue>[:<tint>] [--colors ${DESIGNER_ORDER.join(",")}] [--font inter] [--ui-radius lg] [--form-radius sm] [--surface flat|raised] [--card glass|solid] [--color-scheme user|light-only|dark-only]`,
	);
	process.exit(1);
}

/**
 * `--use <name>`: commit an EXISTING preset, without touching presets.ts.
 *
 * The sibling of `--apply`, and separate from it for one reason: `--apply`
 * upserts, so pointing it at a shipped palette would rewrite that palette's line
 * in a tracked source file to say exactly what it already said. Choosing "Sky"
 * from a dropdown should not produce a diff in presets.ts.
 *
 * It exists so the customizer can hand over a COMMAND in both cases rather than
 * a command for a free hue and a line to go and edit by hand for a preset. The
 * two paths were never equally easy, and the harder one was the one almost
 * everybody takes.
 */
const useSpec = flagValue("--use");
if (process.argv.includes("--use") && !useSpec) {
	console.error("usage: --use <name> [--font inter] [--ui-radius lg] [--form-radius sm] [--surface flat|raised] [--card glass|solid] [--color-scheme user|light-only|dark-only]");
	process.exit(1);
}
if (applySpec && useSpec) {
	console.error("--apply and --use do the same job from opposite ends. Pass one.");
	process.exit(1);
}

if (useSpec) {
	const known = PALETTE_PRESETS.find((preset) => preset.name === useSpec);
	if (!known) {
		console.error(
			`"${useSpec}" is not a preset. Known: ${PALETTE_PRESETS.map((preset) => preset.name).join(", ")}. To add one, use --apply <name>:<hue>.`,
		);
		process.exit(1);
	}

	try {
		writeThemeConfig(known.name, {
			font: flagValue("--font"),
			formRadius: flagValue("--form-radius"),
			card: flagValue("--card"),
			colorScheme: flagValue("--color-scheme"),
			surface: flagValue("--surface"),
			uiRadius: flagValue("--ui-radius"),
		});
	} catch (error) {
		console.error((error as Error).message);
		process.exit(1);
	}
}

if (applySpec) {
	try {
		const preset = upsertPreset(applySpec, parseColors(flagValue("--colors")), brandThemeFlag);
		writeThemeConfig(preset.name, {
			font: flagValue("--font"),
			formRadius: flagValue("--form-radius"),
			card: flagValue("--card"),
			colorScheme: flagValue("--color-scheme"),
			surface: flagValue("--surface"),
			uiRadius: flagValue("--ui-radius"),
		});
	} catch (error) {
		console.error((error as Error).message);
		process.exit(1);
	}
}

// Re-read after a possible --apply: this module imported the presets before the
// file was rewritten, so the new hue would otherwise be missing from the very
// run that just wrote it.
// Widened to the interface on the way in: PALETTE_PRESETS is `as const`, so an
// entry without `supplied` has a literal type that does not know the key exists.
const { PALETTE_PRESETS: LOADED } = applySpec
	? ((await import(`../src/config/theme/presets.ts?t=${Date.now()}`)) as { PALETTE_PRESETS: typeof PALETTE_PRESETS })
	: { PALETTE_PRESETS };
const PRESETS: readonly PalettePreset[] = LOADED;

/**
 * Every palette also gets its non-default surface strategies.
 *
 * `flat` is deliberately absent: it IS the base block, so an unset
 * `data-surface` resolves to exactly what shipped before this existed, and a
 * project that never opts in sees no change at all.
 */
const SURFACE_VARIANTS = ["raised"] as const satisfies readonly SurfaceStrategy[];

/**
 * A preset's build request, with a designer's five resolved if it carries any.
 *
 * Resolving here rather than in `buildPalette` keeps the solver taking colours
 * rather than hex strings - it has no business parsing text - and it is where a
 * malformed stored palette surfaces as a thrown error rather than as a silently
 * solved one that ignores what the designer wrote.
 */
function requestFor(preset: PalettePreset, surface?: SurfaceStrategy) {
	// `supplied` is peeled off rather than spread: on the preset it is five hex
	// STRINGS, and on the request it is five parsed colours. Same name, different
	// type, and spreading one into the other is how a string reaches the solver.
	const { supplied, ...request } = preset;
	if (!supplied) return { ...request, surface };

	const resolved = resolveDesignerPalette(supplied);
	if (!resolved) {
		throw new Error(`"${preset.name}" carries a supplied palette that is not five valid hex values.`);
	}

	/*
	 * The card is forwarded only when the preset actually names one.
	 *
	 * `resolveDesignerPalette` always returns a value for it - the page, so the
	 * report has something to measure - and passing that through would pin every
	 * preset's card to its page and leave SURFACE_VARIANTS generating a raised
	 * block identical to the flat one.
	 */
	return {
		...request,
		supplied: { ...resolved.values, surface: supplied.surface ? resolved.values.surface : undefined },
		surface,
	};
}

const built = PRESETS.map((preset) => ({
	description: preset.description,
	name: preset.name,
	palette: buildPalette(requestFor(preset)),
	preset,
	variants: SURFACE_VARIANTS.map((strategy) => ({
		palette: buildPalette(requestFor(preset, strategy)),
		strategy,
	})),
}));

/* -- the stylesheet -------------------------------------------------------- */

const sheetPath = resolve(webRoot, "src/styles/palettes.css");
mkdirSync(dirname(sheetPath), { recursive: true });
writeFileSync(sheetPath, `${paletteSheet(built)}\n`, "utf8");

/* -- the record ------------------------------------------------------------ */

/** Resolve a token out of the declarations this palette actually emits. */
function resolverFor(declarations: Record<string, string>): (token: string) => Rgb | null {
	return (token) => {
		const value = declarations[token];
		if (value === undefined) return null;

		const color = parseOklch(value);
		return color === null ? null : oklchToRgb(color);
	};
}

function tokenTable(declarations: Record<string, string>): Record<string, { hex: string; oklch: string }> {
	const table: Record<string, { hex: string; oklch: string }> = {};

	for (const [token, value] of Object.entries(declarations)) {
		const color = parseOklch(value);
		// Composed gradient images are not colours and have no hex. They are left
		// out rather than emitted as a null, because a consumer reading this file
		// wants a colour table, and the two stop tokens are already in it.
		if (!color) continue;
		table[token] = { hex: oklchToHex(color), oklch: value };
	}

	return table;
}

const record = Object.fromEntries(
	built.map(({ description, name, palette, preset }) => {
		const stable = stableDeclarations(palette);
		const light = { ...themeDeclarations(palette.light), ...stable };
		const dark = { ...themeDeclarations(palette.dark), ...stable };

		const measure = (declarations: Record<string, string>) =>
			measurePairings(resolverFor(declarations)).map((row) => ({
				background: row.background,
				backgroundHex: row.backgroundHex,
				bar: row.bar,
				foreground: row.foreground,
				foregroundHex: row.foregroundHex,
				id: row.id,
				kind: row.kind,
				passes: row.passes,
				ratio: row.ratio,
			}));

		return [
			name,
			{
				accentHue: preset.accentHue,
				baseTint: preset.baseTint,
				dark: { measured: measure(dark), tokens: tokenTable(dark) },
				description,
				light: { measured: measure(light), tokens: tokenTable(light) },
			},
		];
	}),
);

const header = `/* ---------------------------------------------------------------------------
 * GENERATED FILE - do not edit.
 *
 *   pnpm --filter @app/web generate:palettes
 *
 * The measured palette record. Spec 002 consumes THIS, verbatim, to give mobile
 * the same eight palettes without anyone retyping a colour: every token carries
 * both its authored oklch and the sRGB hex it rasterises to, and every pairing
 * carries the ratio it was measured at and the bar it was judged against.
 *
 * "Measured" here means measured from the quantised 8-bit colour, after the
 * chroma was clamped into the sRGB gamut - so these are the ratios of the pixels
 * a reader sees, not of the numbers an author typed.
 * ------------------------------------------------------------------------- */

import type { PaletteName } from "./presets";

export interface GeneratedToken {
	hex: string;
	oklch: string;
}

export interface GeneratedMeasurement {
	background: string;
	backgroundHex: string;
	/** 7 for text (SC 1.4.6), 3 for non-text (SC 1.4.11). */
	bar: number;
	foreground: string;
	foregroundHex: string;
	id: string;
	kind: "non-text" | "text";
	passes: boolean;
	ratio: number;
}

export interface GeneratedPaletteTheme {
	measured: GeneratedMeasurement[];
	tokens: Record<string, GeneratedToken>;
}

export interface GeneratedPalette {
	accentHue: number;
	baseTint: number;
	dark: GeneratedPaletteTheme;
	description: string;
	light: GeneratedPaletteTheme;
}

export const GENERATED_PALETTES: Readonly<Record<PaletteName, GeneratedPalette>> = `;

const recordPath = resolve(webRoot, "src/config/theme/palettes.generated.ts");
writeFileSync(recordPath, `${header}${JSON.stringify(record, null, "\t")} as const;\n`, "utf8");

/* -- what happened --------------------------------------------------------- */

let failures = 0;

for (const { name, palette, preset } of built) {
	// A designer palette is REPORTED, never refused. Its values arrived from
	// outside and ship verbatim by design, so a pairing below its bar here is
	// information for the developer rather than a fault in the generator - the
	// whole feature is that a build step does not get to edit somebody's brand.
	// A SOLVED preset failing is the opposite: that is the generator not holding
	// its own guarantee, and it still stops the run.
	const isDesigner = Boolean(preset.supplied);

	for (const theme of ["light", "dark"] as const) {
		const rows = measurePairings(resolverFor(inlineDeclarations(palette, theme)));
		const worstText = rows.filter((row) => row.kind === "text").reduce((low, row) => Math.min(low, row.ratio), 99);
		const worstNonText = rows
			.filter((row) => row.kind === "non-text")
			.reduce((low, row) => Math.min(low, row.ratio), 99);
		// A row carrying `accepted` is below its bar by decision, with the reason
		// recorded on the pairing. It is printed so it stays visible, but it does
		// not stop the generator - otherwise a signed-off trade would block every
		// future palette, and the only way out would be deleting the row that
		// documents it.
		const failed = rows.filter((row) => !row.passes && !row.accepted);
		const accepted = rows.filter((row) => !row.passes && row.accepted);
		if (!isDesigner) failures += failed.length;

		const verdict =
			failed.length > 0
				? `${isDesigner ? "below-bar" : "FAIL"}(${failed.map((row) => row.id).join(",")})`
				: accepted.length > 0
					? `ok, ${accepted.length} accepted`
					: "ok ";
		console.log(
			`${name.padEnd(8)} ${theme.padEnd(5)} ${verdict} text worst ${worstText.toFixed(2)}:1  non-text worst ${worstNonText.toFixed(2)}:1  rows ${rows.length}`,
		);
	}
}

console.log(`\nwrote ${sheetPath}`);
console.log(`wrote ${recordPath}`);

const hasDesigner = built.some(({ preset }) => preset.supplied);
if (hasDesigner) {
	console.log(
		"\nRows marked below-bar belong to a designer palette. They ship as supplied - open /components/theme-customizer to see what each one costs and what to use instead.",
	);
}

if (failures > 0) {
	console.error(`\n${failures} pairing(s) below their bar - the generator is not allowed to ship this.`);
	process.exit(1);
}
