/**
 * The designer-palette reader.
 *
 * The palette suite next door proves the SOLVER cannot emit a failing value.
 * This one proves the opposite guarantee: that a palette which does fail is
 * reported rather than quietly repaired. Those are different promises, and a
 * regression in either direction is invisible without a test - a "helpful" clamp
 * added to `resolveDesignerPalette` would turn every row green and nothing else
 * in the repo would notice.
 *
 * The fixture is a real palette from a real brand deck, kept because its
 * failures are the ordinary ones: white on a mid-tone brand fill, and a brand
 * colour used as body text.
 */

import { describe, expect, it } from "vitest";
import {
	DESIGNER_ORDER,
	DESIGNER_ROLES,
	type DesignerPalette,
	designerAdvisories,
	designerMatrix,
	inkFor,
	LEGACY_DESIGNER_ORDER,
	measureDesignerPalette,
	paletteToDesigner,
	REQUIRED_ROLES,
	resolveDesignerPalette,
	swatchesFor,
} from "./designer-palette";
import type { Oklch } from "./oklch";
import { contrastOfRgb, hexToOklch, isInGamut, oklchToHex, oklchToRgb } from "./oklch";
import { buildPalette } from "./palette.build";
import { PALETTE_PRESETS } from "./presets";

/** background, foreground, brand, secondary, accent - as the designer sent them. */
const REVOLVE: DesignerPalette = {
	accent: "#5ABCDF",
	background: "#EEF0E5",
	brand: "#0C3523",
	foreground: "#0C3523",
	secondary: "#78BF7B",
};

const THREE: DesignerPalette = { background: "#EEF0E5", brand: "#0C3523", foreground: "#0C3523" };

const byId = (palette: DesignerPalette) => new Map(measureDesignerPalette(palette).map((row) => [row.id, row]));

describe("hexToOklch", () => {
	it("round-trips every channel exactly", () => {
		for (const hex of ["#0c3523", "#78bf7b", "#5abcdf", "#eef0e5", "#ffffff", "#000000"]) {
			expect(oklchToHex(hexToOklch(hex)!)).toBe(hex);
		}
	});

	it("accepts the short form and rejects anything that is not a hex", () => {
		expect(oklchToHex(hexToOklch("#fff")!)).toBe("#ffffff");
		expect(oklchToHex(hexToOklch("0c3523")!)).toBe("#0c3523");

		for (const bad of ["", "#12", "#12345", "not-a-colour", "#gggggg"]) {
			expect(hexToOklch(bad), `${bad} is not a colour`).toBeNull();
		}
	});
});

describe("a designer palette", () => {
	it("ships every supplied value verbatim", () => {
		// The whole contract in one assertion. If a clamp, a gamut fix or a helpful
		// darkening is ever added upstream of the measurement, this fails.
		const resolved = resolveDesignerPalette(REVOLVE)!;

		for (const [role, hex] of Object.entries(REVOLVE)) {
			expect(oklchToHex(resolved.values[role as keyof typeof resolved.values]), `${role} is untouched`).toBe(
				hex.toLowerCase(),
			);
		}
		// Everything REVOLVE names is verbatim; the card it does not name is the
		// one role that stays derived, and derived-to-the-page rather than to a
		// value of ours - see the comment on `surface` in resolveDesignerPalette.
		expect(resolved.derived).toEqual(["surface"]);
	});

	it("names every value it derived, so ours is never mistaken for theirs", () => {
		const resolved = resolveDesignerPalette(THREE)!;

		expect([...resolved.derived].sort()).toEqual(["accent", "secondary", "surface"]);
		// ...and the three that were given are still exactly what was given.
		expect(oklchToHex(resolved.values.background)).toBe("#eef0e5");
		expect(oklchToHex(resolved.values.foreground)).toBe("#0c3523");
		expect(oklchToHex(resolved.values.brand)).toBe("#0c3523");
	});

	it("reports only what the form can change", () => {
		const rows = byId(THREE);

		/*
		 * `secondary` and `accent` are still solved and still measured by the suite
		 * next door - they are not REPORTED here, because neither has a field any
		 * more and a row the reader cannot act on is a number that teaches them to
		 * skim. One of them shipped as a red Fail with no control on the page that
		 * would have fixed it.
		 */
		expect(rows.get("ink-on-secondary")).toBeUndefined();
		expect(rows.get("accent-on-page")).toBeUndefined();

		// What remains is a row per field, and every one of them has a control.
		expect([...rows.keys()].sort()).toEqual(["body-copy", "brand-on-page", "copy-on-card", "ink-on-brand"]);
	});

	it("marks rows built on a derived value", () => {
		// The card is the one role a three-value palette leaves us to work out, so
		// it is the row that has to say so.
		expect(byId(THREE).get("copy-on-card")?.isDerived).toBe(true);
		expect(byId(THREE).get("body-copy")?.isDerived).toBe(false);
	});

	it("never invents a colour that is not in the palette", () => {
		// The bug this replaces: the report hard-coded "a white label on the
		// accent" and reported 2.16:1 as the palette's failure. Nothing in a
		// five-colour palette says white is a text colour - the designer already
		// said what goes on things by supplying a foreground.
		const supplied = new Set(Object.values(REVOLVE).map((hex) => hex.toLowerCase()));

		for (const row of measureDesignerPalette(REVOLVE)) {
			expect(supplied.has(row.foreground), `${row.id} foreground ${row.foreground} is in the palette`).toBe(true);
			expect(supplied.has(row.background), `${row.id} background ${row.background} is in the palette`).toBe(true);
			for (const ink of row.inks) {
				expect(supplied.has(ink.hex), `${row.id} option ${ink.hex} is in the palette`).toBe(true);
			}
		}
	});

	it("answers which of the supplied colours can sit on each fill", () => {
		const rows = byId(REVOLVE);

		// Not "does white work" - "what works", named. Asked of the brand, which is
		// the fill that still has a field behind it.
		const onBrand = rows.get("ink-on-brand")!;
		expect(onBrand.passes).toBe(true);
		expect(onBrand.inks.filter((ink) => ink.passes).map((ink) => ink.role)).toContain("background");
		// ...and it reports the ones that do not, so the choice is visible.
		expect(onBrand.inks.some((ink) => !ink.passes)).toBe(true);
	});

	it("fails a fill only when NOTHING in the palette is legible on it", () => {
		// A mid-tone fill with a palette of mid-tones: no ink works, and that is a
		// genuine problem worth stopping for.
		const stuck = byId({
			accent: "#8a8a8a",
			background: "#909090",
			brand: "#7c7c7c",
			foreground: "#858585",
			secondary: "#888888",
		});

		expect(stuck.get("ink-on-brand")?.passes).toBe(false);
		expect(stuck.get("ink-on-brand")?.remedy).toContain("Nothing in your palette");
	});

	it("does not pair two colours that would never be text and background together", () => {
		// The lightness relationship decides which pairings are real. Every row is
		// either body copy, an ink question about a fill, or an edge question -
		// there is no row pairing two arbitrary colours from the five.
		const kinds = new Set(measureDesignerPalette(REVOLVE).map((row) => row.kind));

		expect([...kinds].sort()).toEqual(["body-copy", "edge", "ink"]);
	});

	it("survives an empty palette and a half-typed hex", () => {
		expect(measureDesignerPalette({})).toEqual([]);
		expect(resolveDesignerPalette({})).toBeNull();
		// Stops short of the three-digit short form, which is a real hex.
		expect(measureDesignerPalette({ background: "#EEF0", brand: "#0C", foreground: "#f" })).toEqual([]);
	});

	it("honours the short form rather than treating it as unfinished", () => {
		const resolved = resolveDesignerPalette({ background: "#EEF", brand: "#035", foreground: "#035" })!;

		expect(oklchToHex(resolved.values.background)).toBe("#eeeeff");
	});

	it("needs all three required roles before it reports anything", () => {
		for (const role of REQUIRED_ROLES) {
			const partial: DesignerPalette = { ...REVOLVE };
			delete partial[role];

			expect(measureDesignerPalette(partial), `missing ${role} reports nothing`).toEqual([]);
		}
	});

	it("asks for three required roles and one optional one", () => {
		// Pins the shape the form is built against: three nothing can be inferred
		// from, plus the card.
		expect(DESIGNER_ROLES.filter((role) => role.required)).toHaveLength(3);
		expect(DESIGNER_ROLES.filter((role) => !role.required)).toHaveLength(1);
	});

	it("still resolves the two roles it no longer asks for", () => {
		/*
		 * `secondary` and `accent` left the FORM, not the palette. Dropping them
		 * from the resolver too would discard a preset's supplied values the next
		 * time it was regenerated - revolve carries #78bf7b and #5abcdf, and both
		 * predate the form having fields for them.
		 */
		const supplied = resolveDesignerPalette(REVOLVE)!;
		expect(oklchToHex(supplied.values.secondary)).toBe("#78bf7b");
		expect(oklchToHex(supplied.values.accent)).toBe("#5abcdf");
		expect(supplied.derived).not.toContain("secondary");

		// ...and derived when nothing supplied them, which is now the normal case.
		const three = resolveDesignerPalette(THREE)!;
		expect([...three.derived].sort()).toEqual(["accent", "secondary", "surface"]);
	});

	it("reads the ground first", () => {
		// The form's reading order, pinned because it is a decision rather than an
		// accident: the page, the cards on it, the brand those carry, then the type.
		expect(DESIGNER_ORDER).toEqual(["background", "surface", "brand", "foreground"]);
	});

	it("keeps the legacy --colors order frozen, and a different LENGTH", () => {
		/*
		 * Both halves matter and the second is the load-bearing one.
		 *
		 * A `--colors` string is positional, so reordering DESIGNER_ORDER changed what
		 * every position means. Commands saved before that - in changesets, in
		 * somebody's notes - would land a brand in the background field and generate a
		 * different palette in silence.
		 *
		 * `parseColors` tells them apart by COUNT, which only works while the two
		 * orders have different lengths. Add a seventh role and this still holds; make
		 * the legacy order six long and every old command starts being read as a new
		 * one, silently, which is why this asserts the inequality rather than the
		 * numbers.
		 */
		expect(LEGACY_DESIGNER_ORDER).toEqual(["brand", "secondary", "accent", "background", "foreground"]);
		expect(LEGACY_DESIGNER_ORDER.length).not.toBe(DESIGNER_ORDER.length);
	});
});

describe("a supplied palette through the solver", () => {
	const resolved = resolveDesignerPalette(REVOLVE)!;
	const built = buildPalette({
		accentHue: Math.round(resolved.values.accent.h),
		baseTint: 0.012,
		supplied: resolved.values,
	});

	it("writes every supplied value into the token it owns, unchanged", () => {
		// The end-to-end version of the verbatim contract: not just that the report
		// echoes the hex, but that the palette the app paints from carries it.
		expect(oklchToHex(built.light["--background"]!)).toBe("#eef0e5");
		expect(oklchToHex(built.light["--foreground"]!)).toBe("#0c3523");
		expect(oklchToHex(built.light["--brand-primary"])).toBe("#0c3523");
		expect(oklchToHex(built.light["--brand-secondary"])).toBe("#78bf7b");
		// BRAND drives the dominant fill, not the accent - the gradient paints most
		// of what a reader calls the brand, so the role named brand has to land here.
		//
		// `light`, not `stable`: the fill is anchored per theme now. The default
		// anchor is light, so light is the theme that carries the hex verbatim and
		// dark carries the sibling solved against its own grounds.
		expect(oklchToHex(built.light["--gradient-brand-via"])).toBe("#0c3523");
		// ...and the accent lands on the status rail, which is deliberately small.
		expect(oklchToHex(built.stable["--rail-accent-tint"])).toBe("#5abcdf");
	});

	it("solves an ink for each supplied fill, and it clears AA", () => {
		const pairs: [Oklch, Oklch][] = [
			[built.light["--brand-primary-foreground"], built.light["--brand-primary"]],
			[built.light["--brand-secondary-foreground"], built.light["--brand-secondary"]],
		];

		for (const [ink, fill] of pairs) {
			expect(contrastOfRgb(oklchToRgb(ink), oklchToRgb(fill))).toBeGreaterThanOrEqual(4.5);
		}
	});

	it("solves the gradient ink against every stop, not just the one supplied", () => {
		// The stop that binds is not the one the designer gave - it is whichever end
		// of the ramp is closest to the ink. Measured on the ANCHOR theme; dark has
		// its own fill and its own separately-solved ink.
		const ink = built.light["--gradient-brand-foreground"];

		for (const stop of ["--gradient-brand-from", "--gradient-brand-via", "--gradient-brand-to"] as const) {
			expect(contrastOfRgb(oklchToRgb(ink), oklchToRgb(built.light[stop])), stop).toBeGreaterThanOrEqual(4.5);
		}
	});

	it("keeps each supplied value as the middle of the ramp built around it", () => {
		// A ramp built around their value, not one that replaced it - for both the
		// brand's gradient and the accent's rail.
		expect(oklchToHex(built.light["--gradient-brand-via"])).toBe("#0c3523");
		expect(oklchToHex(built.stable["--rail-accent-tint"])).toBe("#5abcdf");
	});

	it("never lets the accent take the brand's fills", () => {
		// The regression this pins: an earlier version mapped accent to the
		// gradient, which made every button the accent colour and left the brand
		// visible in one row of the report. A designer noticed immediately.
		expect(oklchToHex(built.light["--gradient-brand-via"])).not.toBe("#5abcdf");
		expect(oklchToHex(built.light["--brand-primary"])).not.toBe("#5abcdf");
	});

	it("leaves the derived neutrals legible on the supplied background", () => {
		// Borders and muted text are solved for the hue, not re-derived from the
		// override - so this is the check that the two still agree.
		expect(
			contrastOfRgb(oklchToRgb(built.light["--muted"]!), oklchToRgb(built.light["--background"]!)),
		).toBeGreaterThanOrEqual(4.5);
	});

	it("does not push a light-mode background into the dark theme", () => {
		// A brand deck is drawn against a white page. Supplying one must not repaint
		// the dark theme's near-black page with it.
		expect(oklchToHex(built.dark["--background"]!)).not.toBe("#eef0e5");
	});
});

describe("the ink a supplied fill needs", () => {
	it("keeps the designer's own foreground when it already clears", () => {
		const brand = hexToOklch("#0C3523")!;
		const accent = hexToOklch("#5ABCDF")!;

		// Their dark green on their blue is 6.25:1 - no reason to invent anything.
		expect(oklchToHex(inkFor(accent, brand))).toBe("#0c3523");
	});

	it("finds an ink that clears even when neither the foreground nor white does", () => {
		// A mid-tone fill under a foreground too light to sit on it: the fallback
		// has to produce something legible rather than giving up.
		const fill = hexToOklch("#78BF7B")!;
		const tooLight = hexToOklch("#DDDDDC")!;

		const ink = inkFor(fill, tooLight);
		expect(contrastOfRgb(oklchToRgb(ink), oklchToRgb(fill))).toBeGreaterThanOrEqual(4.5);
	});
});

describe("advisories - consequences rather than failures", () => {
	const base = { accent: "#5ABCDF", background: "#FFFFFF", brand: "#0C3523", secondary: "#78BF7B" };

	it("says so when the brand and the foreground are the same colour", () => {
		// Legitimate and common - but it means brand-coloured text is
		// indistinguishable from body text, which no contrast checker would say.
		const notes = designerAdvisories({ ...base, foreground: "#0C3523" });

		expect(notes.map((note) => note.id)).toContain("brand-is-foreground");
	});

	it("stays quiet when they are merely both dark", () => {
		// The reason this is a perceptual distance and not a ratio: a near-black
		// foreground sits at 1.39:1 against a dark green brand, so a contrast bar
		// would flag every dark-brand palette ever drawn.
		expect(designerAdvisories({ ...base, foreground: "#111111" })).toEqual([]);
	});

	it("says so when the secondary is too close to the brand to be a second surface", () => {
		const notes = designerAdvisories({ ...base, foreground: "#111111", secondary: "#0D3624" });

		expect(notes.map((note) => note.id)).toContain("secondary-too-close");
	});

	it("returns nothing at all for an incomplete palette", () => {
		expect(designerAdvisories({ brand: "#0C3523" })).toEqual([]);
	});
});

describe("the contrast matrix", () => {
	const matrix = designerMatrix(REVOLVE)!;

	it("is square, in the field order, and blank down the diagonal", () => {
		expect(matrix.roles.map((role) => role.role)).toEqual(DESIGNER_ORDER);
		expect(matrix.cells).toHaveLength(DESIGNER_ORDER.length);

		matrix.cells.forEach((row, index) => {
			expect(row).toHaveLength(DESIGNER_ORDER.length);
			// A colour against itself is 1:1 and means nothing, so it is absent
			// rather than reported as a failure.
			expect(row[index].ratio, "the diagonal is blank").toBeNull();
		});
	});

	it("mirrors, because contrast is symmetric", () => {
		// Drawn in full anyway - looking up "brand on background" should not mean
		// working out which half of a triangle that lives in.
		for (let row = 0; row < matrix.cells.length; row++) {
			for (let column = 0; column < matrix.cells.length; column++) {
				expect(matrix.cells[row][column].ratio).toBe(matrix.cells[column][row].ratio);
			}
		}
	});

	it("bands on the four thresholds every contrast tool reports", () => {
		for (const row of matrix.cells) {
			for (const cell of row) {
				if (cell.ratio === null) continue;

				const expected = cell.ratio >= 7 ? "AAA" : cell.ratio >= 4.5 ? "AA" : cell.ratio >= 3 ? "AA18" : "fail";
				expect(cell.band, `${cell.ratio}:1`).toBe(expected);
			}
		}
	});

	it("returns nothing for an incomplete palette", () => {
		expect(designerMatrix({ brand: "#0C3523" })).toBeNull();
	});
});

describe("reading a solved palette back out as five", () => {
	it("round-trips: a preset's five, fed back in, land unchanged", () => {
		// `paletteToDesigner` and `applySupplied` are the two directions of one
		// decision. If the mapping moves in one and not the other, a preset picked
		// from the list would silently repaint on being touched.
		for (const preset of PALETTE_PRESETS.filter((entry) => !("supplied" in entry))) {
			const built = buildPalette({ accentHue: preset.accentHue, baseTint: preset.baseTint });
			const five = paletteToDesigner(built.light as never, built.stable as never);
			const back = buildPalette({
				accentHue: preset.accentHue,
				baseTint: preset.baseTint,
				supplied: resolveDesignerPalette(five)!.values,
			});

			// The ANCHOR theme carries the hex verbatim; the default anchor is light.
			expect(oklchToHex(back.light["--gradient-brand-via"]), `${preset.name} brand`).toBe(five.brand);
			expect(oklchToHex(back.light["--brand-secondary"]), `${preset.name} secondary`).toBe(five.secondary);
			expect(oklchToHex(back.stable["--rail-accent-tint"]), `${preset.name} accent`).toBe(five.accent);
			expect(oklchToHex(back.light["--background"]!), `${preset.name} background`).toBe(five.background);
			expect(oklchToHex(back.light["--foreground"]!), `${preset.name} foreground`).toBe(five.foreground);
		}
	});

	it("returns the five colour roles and deliberately NOT the card", () => {
		const built = buildPalette({ accentHue: 245, baseTint: 0.02 });
		const five = paletteToDesigner(built.light as never, built.stable as never);

		expect(Object.keys(five).sort()).toEqual(["accent", "background", "brand", "foreground", "secondary"]);
		/*
		 * The card is left blank on purpose. This is what fills the form when a
		 * preset is picked, and a card hex there would pin the card to whatever the
		 * solver happened to produce - which would make the Surface control inert on
		 * that preset, the exact failure the page-moving `raised` used to have.
		 * Blank means "the strategy decides", which is what a preset wants.
		 */
		expect(five).not.toHaveProperty("surface");
	});
});

describe("swatches offered beside a field", () => {
	const P: DesignerPalette = { background: "#FFFFFF", brand: "#0052FF", foreground: "#111111" };

	it("always leads with what the reader already has", () => {
		// The value they typed stays put and stays first. A list that reordered
		// itself around a "better" option would be arguing.
		for (const role of DESIGNER_ORDER) {
			const swatches = swatchesFor(role, P);
			expect(swatches[0].why, `${role} leads with the current value`).toBe("");
		}
	});

	it("holds the hue - a different hue is a different brand, not a suggestion", () => {
		const brandHue = hexToOklch(P.brand!)!.h;

		for (const swatch of swatchesFor("brand", P)) {
			expect(Math.abs(hexToOklch(swatch.hex)!.h - brandHue)).toBeLessThan(1);
		}
	});

	it("says what each option would buy, measured", () => {
		for (const swatch of swatchesFor("brand", P).slice(1)) {
			expect(swatch.why, swatch.hex).toMatch(/against the page/);
		}
	});

	it("offers nothing at all for an incomplete palette", () => {
		expect(swatchesFor("brand", { brand: "#0052FF" })).toEqual([]);
	});

	it("never offers a value the browser would remap", () => {
		for (const role of DESIGNER_ORDER) {
			for (const swatch of swatchesFor(role, P)) {
				expect(isInGamut(hexToOklch(swatch.hex)!), `${role} ${swatch.hex}`).toBe(true);
			}
		}
	});
});

/**
 * The secondary is a LOW-EMPHASIS fill with brand-coloured ink, and both halves
 * of that sentence need pinning.
 *
 * The derivation shipped the opposite treatment for a while - a mid-tone at the
 * brand's own lightness, needing white ink - which is a solid coloured button,
 * i.e. a second primary. It measured fine, so nothing failed: a mid-tone fill
 * clears its text bar comfortably and clears the 3:1 edge the pale one gives up.
 * A suite that only checks contrast can therefore never catch a regression back
 * to it, which is why these assert the SHAPE rather than a ratio.
 */
describe("the secondary fill", () => {
	const lightGround: DesignerPalette = { background: "#FFFFFF", brand: "#276EF1", foreground: "#111111" };
	const darkGround: DesignerPalette = { background: "#111111", brand: "#276EF1", foreground: "#FFFFFF" };

	it("derives a pale fill that sits nearer the page than the brand does", () => {
		const { derived, values } = resolveDesignerPalette(lightGround)!;

		expect(derived).toContain("secondary");
		// Pale, not mid-tone. The old derivation held the brand's lightness, which
		// for this brand is 0.573 - so this assertion is the one that fails if the
		// treatment is reverted.
		expect(values.secondary.l).toBeGreaterThan(0.9);
		// And low-emphasis relative to the brand, stated as the relationship rather
		// than as a constant: whatever the anchor becomes, the secondary has to be
		// closer to the page than the thing it is supposed to be quieter than.
		const toPage = (color: Oklch) => Math.abs(color.l - values.background.l);
		expect(toPage(values.secondary)).toBeLessThan(toPage(values.brand));
	});

	it("uses the dark anchor when the page is dark", () => {
		// Not the light anchor with a sign flip. A dark page needs roughly double
		// the distance a light one does, which is why there are two constants.
		const { values } = resolveDesignerPalette(darkGround)!;

		expect(values.secondary.l).toBeGreaterThan(values.background.l);
		expect(values.secondary.l).toBeLessThan(0.5);
	});

	it("puts brand-coloured ink on it rather than the page's own foreground", () => {
		const resolved = resolveDesignerPalette(lightGround)!;
		const built = buildPalette({
			accentHue: Math.round(resolved.values.brand.h),
			baseTint: 0.012,
			supplied: resolved.values,
		});

		const fill = built.light["--brand-secondary"];
		const ink = built.light["--brand-secondary-foreground"];

		// The thing that makes it read as a control and not as a disabled slab.
		// #111111 clears 4.5:1 on a 0.94 fill easily, so an ink chosen purely by
		// contrast would stop there - this fails if the preference is dropped.
		expect(ink.c).toBeGreaterThan(0.05);
		expect(Math.abs(ink.h - resolved.values.brand.h)).toBeLessThan(20);
		// Still legible, and to the enhanced bar the rest of the brand surfaces use.
		expect(contrastOfRgb(oklchToRgb(ink), oklchToRgb(fill))).toBeGreaterThanOrEqual(7);
	});

	it("leaves a supplied secondary exactly as the designer sent it", () => {
		// The treatment changes what we DERIVE. A hex somebody typed is still theirs.
		const { derived, values } = resolveDesignerPalette(REVOLVE)!;

		expect(derived).not.toContain("secondary");
		expect(oklchToHex(values.secondary)).toBe("#78bf7b");
	});
});

/**
 * The surface strategy, and the bug that made it move the card instead.
 *
 * `raised` used to step the PAGE down and leave cards white. It measured fine
 * and it was inert where it mattered: `applySupplied` writes a designer's
 * `--background` verbatim and runs last, so on any palette with a supplied page
 * - every preset, and every draft in the customizer - pressing Raised changed
 * nothing at all.
 *
 * The last test here is the one that failure would have caught, and none of the
 * others would: a page that no longer moves cannot be un-moved by a supplied
 * value.
 */
describe("the surface strategy", () => {
	const FIVE: DesignerPalette = { background: "#FFFFFF", brand: "#276EF1", foreground: "#111111" };
	const request = { accentHue: 261, baseTint: 0.012 };

	it("moves the card and leaves the page alone", () => {
		const flat = buildPalette({ ...request, surface: "flat" });
		const raised = buildPalette({ ...request, surface: "raised" });

		expect(oklchToHex(raised.light["--background"]!)).toBe(oklchToHex(flat.light["--background"]!));
		expect(oklchToHex(raised.light["--surface"]!)).not.toBe(oklchToHex(flat.light["--surface"]!));
		// Darker than the page, which is the direction --surface-secondary and
		// --surface-tertiary already travel and the one Material's containers take.
		expect(raised.light["--surface"]!.l).toBeLessThan(raised.light["--background"]!.l);
	});

	it("keeps flat meaning one colour for both", () => {
		const flat = buildPalette({ ...request, surface: "flat" });

		expect(oklchToHex(flat.light["--surface"]!)).toBe(oklchToHex(flat.light["--background"]!));
	});

	it("solves the glass tint below the card it has to composite to", () => {
		// A glass card is 75% tint over the page, so landing ON 0.98 from a white
		// page needs a tint DARKER than 0.98. Looks wrong written down, right on
		// screen - and the opaque fallbacks take the card's own value instead,
		// because nothing composites in that branch.
		const raised = buildPalette({ ...request, surface: "raised" });

		expect(raised.light["--glass-tint"]!.l).toBeLessThan(raised.light["--surface"]!.l);
		expect(raised.light["--glass-opaque-strong"]!.l).toBeCloseTo(raised.light["--surface"]!.l, 5);
	});

	it("still moves the card when the page is a supplied hex", () => {
		// THE REGRESSION. Supplied values are written last and win, which is why
		// the page-moving version was inert here. Nothing supplies a card unless
		// it means to, so the strategy survives contact with a brand deck.
		const resolved = resolveDesignerPalette(FIVE)!;
		const supplied = { ...resolved.values, surface: undefined };
		const flat = buildPalette({ ...request, supplied, surface: "flat" });
		const raised = buildPalette({ ...request, supplied, surface: "raised" });

		expect(oklchToHex(flat.light["--background"]!)).toBe("#ffffff");
		expect(oklchToHex(raised.light["--background"]!)).toBe("#ffffff");
		expect(oklchToHex(raised.light["--surface"]!)).not.toBe(oklchToHex(flat.light["--surface"]!));
	});

	it("lets a typed card outrank the strategy", () => {
		// The other direction, and the rule every supplied value follows: a hex
		// somebody typed is not a build step's to move.
		const resolved = resolveDesignerPalette({ ...FIVE, surface: "#EEEEEE" })!;
		const built = buildPalette({ ...request, supplied: resolved.values, surface: "raised" });

		expect(oklchToHex(built.light["--surface"]!)).toBe("#eeeeee");
	});
});
