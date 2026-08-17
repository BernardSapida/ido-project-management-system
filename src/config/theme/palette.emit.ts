/**
 * Turning a built palette into declarations.
 *
 * Shared by the generator script (which writes them into a stylesheet) and the
 * customizer page (which writes them onto `document.documentElement` as an
 * inline style so a free hue can be previewed). One emitter, so a preview
 * cannot show something the generated stylesheet would not.
 */

import { formatOklch, type Oklch } from "./oklch";
import type { BuiltPalette, PaletteThemeColors, SurfaceStrategy, ThemeName } from "./palette.build";

/**
 * The composed gradient images.
 *
 * They are recomposed in EVERY block that redeclares a stop rather than
 * inherited, and that is not redundancy. A `var()` inside a custom property is
 * substituted where the property is DECLARED, not where it is used - so a
 * `--gradient-brand` declared once at `:root` carries the light stops down into
 * every dark descendant, no matter what the dark block does to the endpoints.
 * The image and its endpoints have to move together, on one element.
 */
function composedGradients(): Record<string, string> {
	return {
		"--gradient-brand":
			"linear-gradient(135deg, var(--gradient-brand-from) 0%, var(--gradient-brand-via) 50%, var(--gradient-brand-to) 100%)",
		"--gradient-brand-ink":
			"linear-gradient(135deg, var(--gradient-brand-ink-from) 0%, var(--gradient-brand-ink-to) 100%)",
	};
}

/** Alphabetical, so a regenerated file diffs as a value change and never as a reorder. */
function sorted(colors: Record<string, Oklch>): [string, Oklch][] {
	return Object.entries(colors).sort(([a], [b]) => a.localeCompare(b));
}

/** Every declaration one theme of one palette contributes, as `name: value`. */
export function themeDeclarations(colors: PaletteThemeColors): Record<string, string> {
	const declarations: Record<string, string> = {};

	for (const [token, color] of sorted(colors)) {
		declarations[token] = formatOklch(color);
	}

	return { ...declarations, ...composedGradients() };
}

export function stableDeclarations(palette: BuiltPalette): Record<string, string> {
	const declarations: Record<string, string> = {};

	for (const [token, color] of sorted(palette.stable)) {
		declarations[token] = formatOklch(color);
	}

	declarations["--rail-accent"] = "linear-gradient(135deg, var(--rail-accent-from) 0%, var(--rail-accent-to) 100%)";
	// The glyph every status tile carries, in its own token rather than as the
	// literal `oklch(0.99 0 0)` it was repeated as in five places. A pairing that
	// is not addressable by name is a pairing the report cannot measure.
	declarations["--rail-foreground"] = "oklch(0.99 0 0)";

	return declarations;
}

/**
 * One palette's two blocks.
 *
 * `:root[data-palette=…]` rather than `[data-palette=…]`, because a bare
 * attribute selector ties with `:root` on specificity and would then be decided
 * by source order - which puts a generated file's correctness at the mercy of
 * where somebody happens to put the `@import`.
 */
export function paletteCss(name: string, palette: BuiltPalette, description: string): string {
	const block = (selector: string, declarations: Record<string, string>) => {
		// Two spaces, matching styles.css. The generated sheet sits beside a
		// hand-written one and reads as part of it.
		const lines = Object.entries(declarations).map(([token, value]) => `  ${token}: ${value};`);
		return `${selector} {\n${lines.join("\n")}\n}`;
	};

	return [
		`/* ${name} - accent hue ${palette.accentHue}, base tint ${palette.baseTint}`,
		` * ${description} */`,
		block(`:root[data-palette="${name}"]`, {
			"--base-hue": String(palette.accentHue),
			"--base-tint": String(palette.baseTint),
			...themeDeclarations(palette.light),
			...stableDeclarations(palette),
		}),
		"",
		block(`.dark[data-palette="${name}"]`, themeDeclarations(palette.dark)),
	].join("\n");
}

/**
 * The delta a non-default surface strategy needs, and nothing else.
 *
 * Emitted as a diff rather than a second full block because only four tokens
 * actually move: the page, and the three brand inks that are solved against the
 * page and therefore had to darken to keep their 7:1. Writing the other twenty
 * again would mean two places to keep in step, and the copy would look
 * authoritative while being whatever the generator emitted last.
 *
 * `flat` never emits - it IS the base block, so an unset `data-surface`
 * resolves to exactly what shipped before this existed.
 */
export function paletteSurfaceCss(
	name: string,
	strategy: SurfaceStrategy,
	base: BuiltPalette,
	variant: BuiltPalette,
): string {
	const declarations: Record<string, string> = {};

	for (const [token, color] of sorted(variant.light)) {
		const before = (base.light as Record<string, Oklch | undefined>)[token];
		const after = formatOklch(color);
		if (!before || formatOklch(before) !== after) declarations[token] = after;
	}

	if (Object.keys(declarations).length === 0) return "";

	const lines = Object.entries(declarations).map(([token, value]) => `  ${token}: ${value};`);

	/*
	 * `:not(.dark)` is load-bearing, not defensive.
	 *
	 * `.dark[data-palette=X]` is (0,2,0). `:root` plus two attributes is (0,3,0),
	 * and both match <html> - so without the guard this block OUTRANKS the dark
	 * theme and repaints a dark page white the moment somebody opts into a
	 * surface strategy. The guard makes it not match at all in dark, which is
	 * also the honest statement: this is a light-mode ladder, and dark has had
	 * one all along.
	 */
	return `:root:not(.dark)[data-palette="${name}"][data-surface="${strategy}"] {\n${lines.join("\n")}\n}`;
}

/** The whole generated stylesheet. */
export function paletteSheet(
	palettes: {
		description: string;
		name: string;
		palette: BuiltPalette;
		/** Non-default surface strategies, each emitted as a delta off `palette`. */
		variants?: { palette: BuiltPalette; strategy: SurfaceStrategy }[];
	}[],
): string {
	const header = `/* ---------------------------------------------------------------------------
 * GENERATED FILE - do not edit.
 *
 *   pnpm --filter @app/web generate:palettes
 *
 * Every value here is the output of a contrast search at its own hue, clamped
 * to what sRGB can paint at that lightness. Hand-editing one number does not
 * "adjust a colour" - it silently removes that colour from the guarantee the
 * whole slice rests on, and nothing will tell you until someone measures.
 *
 * To change a palette, change its hue in src/config/theme/presets.ts and
 * regenerate. To check the result, run:
 *
 *   pnpm --filter @app/web test
 *
 * which re-measures every pairing out of THIS file rather than out of the
 * generator, so a stale stylesheet cannot pass.
 * ------------------------------------------------------------------------- */
`;

	const blocks = palettes.flatMap(({ description, name, palette, variants }) => [
		paletteCss(name, palette, description),
		// Surface deltas trail their own palette rather than being grouped at the
		// end of the file, so everything one `data-palette` can resolve to reads
		// in one place.
		...(variants ?? []).map(({ palette: variant, strategy }) => paletteSurfaceCss(name, strategy, palette, variant)),
	]);

	return [header, ...blocks.filter(Boolean)].join("\n\n");
}

/** The inline style the customizer writes for a hue that is not a preset. */
export function inlineDeclarations(palette: BuiltPalette, theme: ThemeName): Record<string, string> {
	return {
		"--base-hue": String(palette.accentHue),
		"--base-tint": String(palette.baseTint),
		...themeDeclarations(theme === "dark" ? palette.dark : palette.light),
		...stableDeclarations(palette),
	};
}
