/* ---------------------------------------------------------------------------
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

export const GENERATED_PALETTES: Readonly<Record<PaletteName, GeneratedPalette>> = {
	"netflix": {
		"accentHue": 28,
		"baseTint": 0.006,
		"dark": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#fd6759",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#fd6759",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#fd6759",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#fd9487",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 8.77
				},
				{
					"background": "--background",
					"backgroundHex": "#070505",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#fd978a",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.65
				},
				{
					"background": "--background",
					"backgroundHex": "#070505",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#ed7b14",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#47211c",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#fda391",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#4d2621",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#faaeab",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.25
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#311e1c",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#f1eeed",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 13.64
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#fdc9c2",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#441a01",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.26
				},
				{
					"background": "--background",
					"backgroundHex": "#070505",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#fd6759",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.02
				},
				{
					"background": "--surface",
					"backgroundHex": "#1b1616",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#f1eeed",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 15.51
				},
				{
					"background": "--background",
					"backgroundHex": "#070505",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#4d2621",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.56
				},
				{
					"background": "--background",
					"backgroundHex": "#070505",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#fd9487",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.45
				},
				{
					"background": "--surface",
					"backgroundHex": "#1b1616",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#fd9487",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.32
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#bd0e12",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 6.32
				}
			],
			"tokens": {
				"--background": {
					"hex": "#070505",
					"oklch": "oklch(0.1186 0.006 28)"
				},
				"--border": {
					"hex": "#373130",
					"oklch": "oklch(0.32 0.009 28)"
				},
				"--brand-accent": {
					"hex": "#8d3537",
					"oklch": "oklch(0.455 0.12 22)"
				},
				"--brand-edge": {
					"hex": "#fd8151",
					"oklch": "oklch(0.735 0.1637 41)"
				},
				"--brand-muted": {
					"hex": "#311e1c",
					"oklch": "oklch(0.26 0.03 28)"
				},
				"--brand-pale": {
					"hex": "#5b2b2c",
					"oklch": "oklch(0.355 0.07 20)"
				},
				"--brand-primary": {
					"hex": "#fd9487",
					"oklch": "oklch(0.774 0.129 27.99)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#4d2621",
					"oklch": "oklch(0.32 0.06 28)"
				},
				"--brand-secondary-foreground": {
					"hex": "#faaeab",
					"oklch": "oklch(0.822 0.09 22)"
				},
				"--chip-accent-soft": {
					"hex": "#47211c",
					"oklch": "oklch(0.3 0.06 28)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#fda391",
					"oklch": "oklch(0.802 0.1106 32)"
				},
				"--default": {
					"hex": "#373130",
					"oklch": "oklch(0.32 0.009 28)"
				},
				"--field-background": {
					"hex": "#120e0e",
					"oklch": "oklch(0.17 0.0066 28)"
				},
				"--field-border": {
					"hex": "#474140",
					"oklch": "oklch(0.38 0.009 28)"
				},
				"--foreground": {
					"hex": "#f1eeed",
					"oklch": "oklch(0.95 0.0036 28)"
				},
				"--glass-opaque": {
					"hex": "#211b1b",
					"oklch": "oklch(0.23 0.0084 28)"
				},
				"--glass-opaque-strong": {
					"hex": "#26201f",
					"oklch": "oklch(0.25 0.009 28)"
				},
				"--glass-tint": {
					"hex": "#282222",
					"oklch": "oklch(0.26 0.009 28)"
				},
				"--gradient-brand-foreground": {
					"hex": "#010101",
					"oklch": "oklch(0.0736 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#fd6759",
					"oklch": "oklch(0.6994 0.1859 27.99)"
				},
				"--gradient-brand-hover": {
					"hex": "#fd8c7e",
					"oklch": "oklch(0.7594 0.1394 27.99)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#fd978a",
					"oklch": "oklch(0.78 0.1248 28)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#ed7b14",
					"oklch": "oklch(0.7 0.1703 54)"
				},
				"--gradient-brand-to": {
					"hex": "#fd6759",
					"oklch": "oklch(0.6994 0.1859 27.99)"
				},
				"--gradient-brand-via": {
					"hex": "#fd6759",
					"oklch": "oklch(0.6994 0.1859 27.99)"
				},
				"--muted": {
					"hex": "#aaa3a1",
					"oklch": "oklch(0.72 0.009 28)"
				},
				"--overlay": {
					"hex": "#211b1b",
					"oklch": "oklch(0.23 0.0084 28)"
				},
				"--overlay-foreground": {
					"hex": "#f1eeed",
					"oklch": "oklch(0.95 0.0036 28)"
				},
				"--separator": {
					"hex": "#2d2726",
					"oklch": "oklch(0.28 0.009 28)"
				},
				"--surface": {
					"hex": "#1b1616",
					"oklch": "oklch(0.2068 0.0075 28)"
				},
				"--surface-foreground": {
					"hex": "#f1eeed",
					"oklch": "oklch(0.95 0.0036 28)"
				},
				"--surface-secondary": {
					"hex": "#282322",
					"oklch": "oklch(0.26 0.0084 28)"
				},
				"--surface-tertiary": {
					"hex": "#3c3635",
					"oklch": "oklch(0.34 0.009 28)"
				},
				"--brand-100": {
					"hex": "#fedfda",
					"oklch": "oklch(0.9273 0.0359 27.99)"
				},
				"--brand-200": {
					"hex": "#fec5bc",
					"oklch": "oklch(0.8714 0.0667 27.99)"
				},
				"--brand-300": {
					"hex": "#fd9c90",
					"oklch": "oklch(0.7896 0.1182 27.99)"
				},
				"--brand-400": {
					"hex": "#f75b4f",
					"oklch": "oklch(0.6755 0.1926 27.99)"
				},
				"--brand-50": {
					"hex": "#fff2f0",
					"oklch": "oklch(0.971 0.0138 27.99)"
				},
				"--brand-500": {
					"hex": "#e50914",
					"oklch": "oklch(0.5814 0.2349 27.99)"
				},
				"--brand-600": {
					"hex": "#c10f13",
					"oklch": "oklch(0.5138 0.2038 27.99)"
				},
				"--brand-700": {
					"hex": "#a80b0f",
					"oklch": "oklch(0.4629 0.1837 27.99)"
				},
				"--brand-800": {
					"hex": "#8c080a",
					"oklch": "oklch(0.4067 0.1614 27.99)"
				},
				"--brand-900": {
					"hex": "#7a0608",
					"oklch": "oklch(0.3672 0.1458 27.99)"
				},
				"--brand-950": {
					"hex": "#540203",
					"oklch": "oklch(0.282 0.1122 27.99)"
				},
				"--brand-surface": {
					"hex": "#fdc9c2",
					"oklch": "oklch(0.88 0.06 28)"
				},
				"--brand-surface-foreground": {
					"hex": "#441a01",
					"oklch": "oklch(0.278 0.0739 48)"
				},
				"--rail-accent-from": {
					"hex": "#fc4239",
					"oklch": "oklch(0.6564 0.2231 27.99)"
				},
				"--rail-accent-tint": {
					"hex": "#e31418",
					"oklch": "oklch(0.5814 0.2306 27.99)"
				},
				"--rail-accent-to": {
					"hex": "#bd0e12",
					"oklch": "oklch(0.5064 0.2009 27.99)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		},
		"description": "Supplied by a designer - measured, not solved.",
		"light": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#e50914",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-start",
					"kind": "text",
					"passes": false,
					"ratio": 4.79
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#e50914",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-mid",
					"kind": "text",
					"passes": false,
					"ratio": 4.79
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#e50914",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-end",
					"kind": "text",
					"passes": false,
					"ratio": 4.79
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#e50914",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#ffffff",
					"id": "brand-solid",
					"kind": "text",
					"passes": false,
					"ratio": 4.79
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#b00d10",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#673203",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 10.32
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#fde9e6",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#981c05",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.18
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#fde5e1",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#8c2809",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#feeeeb",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#111111",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 16.76
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#fdc9c2",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#441a01",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.26
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#e50914",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 4.79
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#111111",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 18.88
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#fde5e1",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.2
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#e50914",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 4.79
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#e50914",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 4.79
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#bd0e12",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 6.32
				}
			],
			"tokens": {
				"--background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--border": {
					"hex": "#e1dddc",
					"oklch": "oklch(0.9 0.0045 28)"
				},
				"--brand-accent": {
					"hex": "#febab7",
					"oklch": "oklch(0.85 0.0792 22)"
				},
				"--brand-edge": {
					"hex": "#fc542f",
					"oklch": "oklch(0.672 0.21 34)"
				},
				"--brand-muted": {
					"hex": "#feeeeb",
					"oklch": "oklch(0.96 0.018 28)"
				},
				"--brand-pale": {
					"hex": "#fedbda",
					"oklch": "oklch(0.92 0.0396 20)"
				},
				"--brand-primary": {
					"hex": "#e50914",
					"oklch": "oklch(0.5814 0.2349 27.99)"
				},
				"--brand-primary-foreground": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--brand-secondary": {
					"hex": "#fde5e1",
					"oklch": "oklch(0.94 0.0272 27.99)"
				},
				"--brand-secondary-foreground": {
					"hex": "#8c2809",
					"oklch": "oklch(0.43 0.14 35.99)"
				},
				"--chip-accent-soft": {
					"hex": "#fde9e6",
					"oklch": "oklch(0.95 0.0225 28)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#981c05",
					"oklch": "oklch(0.44 0.162 32)"
				},
				"--default": {
					"hex": "#edeaea",
					"oklch": "oklch(0.94 0.0024 28)"
				},
				"--field-background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0 / 60%)"
				},
				"--foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--glass-opaque": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-tint": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#e50914",
					"oklch": "oklch(0.5814 0.2349 27.99)"
				},
				"--gradient-brand-hover": {
					"hex": "#c51013",
					"oklch": "oklch(0.5214 0.2068 27.99)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#b00d10",
					"oklch": "oklch(0.48 0.19 28)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#673203",
					"oklch": "oklch(0.38 0.0926 54)"
				},
				"--gradient-brand-to": {
					"hex": "#e50914",
					"oklch": "oklch(0.5814 0.2349 27.99)"
				},
				"--gradient-brand-via": {
					"hex": "#e50914",
					"oklch": "oklch(0.5814 0.2349 27.99)"
				},
				"--muted": {
					"hex": "#686160",
					"oklch": "oklch(0.5 0.009 28)"
				},
				"--overlay": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--separator": {
					"hex": "#e7e3e3",
					"oklch": "oklch(0.92 0.0045 28)"
				},
				"--surface": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--surface-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--surface-secondary": {
					"hex": "#f2efef",
					"oklch": "oklch(0.955 0.0024 28)"
				},
				"--surface-tertiary": {
					"hex": "#edeaea",
					"oklch": "oklch(0.94 0.0024 28)"
				},
				"--brand-100": {
					"hex": "#fedfda",
					"oklch": "oklch(0.9273 0.0359 27.99)"
				},
				"--brand-200": {
					"hex": "#fec5bc",
					"oklch": "oklch(0.8714 0.0667 27.99)"
				},
				"--brand-300": {
					"hex": "#fd9c90",
					"oklch": "oklch(0.7896 0.1182 27.99)"
				},
				"--brand-400": {
					"hex": "#f75b4f",
					"oklch": "oklch(0.6755 0.1926 27.99)"
				},
				"--brand-50": {
					"hex": "#fff2f0",
					"oklch": "oklch(0.971 0.0138 27.99)"
				},
				"--brand-500": {
					"hex": "#e50914",
					"oklch": "oklch(0.5814 0.2349 27.99)"
				},
				"--brand-600": {
					"hex": "#c10f13",
					"oklch": "oklch(0.5138 0.2038 27.99)"
				},
				"--brand-700": {
					"hex": "#a80b0f",
					"oklch": "oklch(0.4629 0.1837 27.99)"
				},
				"--brand-800": {
					"hex": "#8c080a",
					"oklch": "oklch(0.4067 0.1614 27.99)"
				},
				"--brand-900": {
					"hex": "#7a0608",
					"oklch": "oklch(0.3672 0.1458 27.99)"
				},
				"--brand-950": {
					"hex": "#540203",
					"oklch": "oklch(0.282 0.1122 27.99)"
				},
				"--brand-surface": {
					"hex": "#fdc9c2",
					"oklch": "oklch(0.88 0.06 28)"
				},
				"--brand-surface-foreground": {
					"hex": "#441a01",
					"oklch": "oklch(0.278 0.0739 48)"
				},
				"--rail-accent-from": {
					"hex": "#fc4239",
					"oklch": "oklch(0.6564 0.2231 27.99)"
				},
				"--rail-accent-tint": {
					"hex": "#e31418",
					"oklch": "oklch(0.5814 0.2306 27.99)"
				},
				"--rail-accent-to": {
					"hex": "#bd0e12",
					"oklch": "oklch(0.5064 0.2009 27.99)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		}
	},
	"uber": {
		"accentHue": 262,
		"baseTint": 0,
		"dark": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#5e96fc",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#5e96fc",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#5e96fc",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#88b2fd",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 8.84
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#91b8fd",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 10.16
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#9b8bfc",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.27
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#1d2d4c",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#9fbcfd",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#223251",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#9dc6fd",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.26
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#1c2433",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#eeeeee",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 13.41
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#c3d8fe",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#242154",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.25
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#5e96fc",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.03
				},
				{
					"background": "--surface",
					"backgroundHex": "#171717",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#eeeeee",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 15.45
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#223251",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.59
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#88b2fd",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.54
				},
				{
					"background": "--surface",
					"backgroundHex": "#171717",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#88b2fd",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.39
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#023797",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 10.25
				}
			],
			"tokens": {
				"--background": {
					"hex": "#050505",
					"oklch": "oklch(0.1186 0 0)"
				},
				"--border": {
					"hex": "#333333",
					"oklch": "oklch(0.32 0 0)"
				},
				"--brand-accent": {
					"hex": "#235698",
					"oklch": "oklch(0.455 0.12 256)"
				},
				"--brand-edge": {
					"hex": "#91a1fd",
					"oklch": "oklch(0.735 0.1332 275)"
				},
				"--brand-muted": {
					"hex": "#1c2433",
					"oklch": "oklch(0.26 0.03 262)"
				},
				"--brand-pale": {
					"hex": "#203d60",
					"oklch": "oklch(0.355 0.07 254)"
				},
				"--brand-primary": {
					"hex": "#88b2fd",
					"oklch": "oklch(0.762 0.1179 261.53)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#223251",
					"oklch": "oklch(0.32 0.06 262)"
				},
				"--brand-secondary-foreground": {
					"hex": "#9dc6fd",
					"oklch": "oklch(0.816 0.09 256)"
				},
				"--chip-accent-soft": {
					"hex": "#1d2d4c",
					"oklch": "oklch(0.3 0.06 262)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#9fbcfd",
					"oklch": "oklch(0.798 0.0982 266)"
				},
				"--default": {
					"hex": "#333333",
					"oklch": "oklch(0.32 0 0)"
				},
				"--field-background": {
					"hex": "#0f0f0f",
					"oklch": "oklch(0.17 0 0)"
				},
				"--field-border": {
					"hex": "#424242",
					"oklch": "oklch(0.38 0 0)"
				},
				"--foreground": {
					"hex": "#eeeeee",
					"oklch": "oklch(0.95 0 0)"
				},
				"--glass-opaque": {
					"hex": "#1d1d1d",
					"oklch": "oklch(0.23 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#222222",
					"oklch": "oklch(0.25 0 0)"
				},
				"--glass-tint": {
					"hex": "#242424",
					"oklch": "oklch(0.26 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#010101",
					"oklch": "oklch(0.0736 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#5e96fc",
					"oklch": "oklch(0.6822 0.1624 261.53)"
				},
				"--gradient-brand-hover": {
					"hex": "#7dabfd",
					"oklch": "oklch(0.7422 0.1287 261.53)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#91b8fd",
					"oklch": "oklch(0.78 0.1081 262)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#9b8bfc",
					"oklch": "oklch(0.7 0.1621 288)"
				},
				"--gradient-brand-to": {
					"hex": "#5e96fc",
					"oklch": "oklch(0.6822 0.1624 261.53)"
				},
				"--gradient-brand-via": {
					"hex": "#5e96fc",
					"oklch": "oklch(0.6822 0.1624 261.53)"
				},
				"--muted": {
					"hex": "#a4a4a4",
					"oklch": "oklch(0.72 0 0)"
				},
				"--overlay": {
					"hex": "#1d1d1d",
					"oklch": "oklch(0.23 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#eeeeee",
					"oklch": "oklch(0.95 0 0)"
				},
				"--separator": {
					"hex": "#292929",
					"oklch": "oklch(0.28 0 0)"
				},
				"--surface": {
					"hex": "#171717",
					"oklch": "oklch(0.2068 0 0)"
				},
				"--surface-foreground": {
					"hex": "#eeeeee",
					"oklch": "oklch(0.95 0 0)"
				},
				"--surface-secondary": {
					"hex": "#242424",
					"oklch": "oklch(0.26 0 0)"
				},
				"--surface-tertiary": {
					"hex": "#383838",
					"oklch": "oklch(0.34 0 0)"
				},
				"--brand-100": {
					"hex": "#d5e3fc",
					"oklch": "oklch(0.9129 0.0373 261.53)"
				},
				"--brand-200": {
					"hex": "#b1cbf9",
					"oklch": "oklch(0.8383 0.0706 261.53)"
				},
				"--brand-300": {
					"hex": "#7fa7ef",
					"oklch": "oklch(0.7295 0.1138 261.53)"
				},
				"--brand-400": {
					"hex": "#4075d7",
					"oklch": "oklch(0.5774 0.1608 261.53)"
				},
				"--brand-50": {
					"hex": "#f1f6ff",
					"oklch": "oklch(0.971 0.0132 261.53)"
				},
				"--brand-500": {
					"hex": "#0549c0",
					"oklch": "oklch(0.4522 0.1962 261.53)"
				},
				"--brand-600": {
					"hex": "#0340ab",
					"oklch": "oklch(0.4138 0.18 261.53)"
				},
				"--brand-700": {
					"hex": "#03399b",
					"oklch": "oklch(0.3848 0.1675 261.53)"
				},
				"--brand-800": {
					"hex": "#023289",
					"oklch": "oklch(0.3529 0.1538 261.53)"
				},
				"--brand-900": {
					"hex": "#022d7e",
					"oklch": "oklch(0.3304 0.1441 261.53)"
				},
				"--brand-950": {
					"hex": "#032362",
					"oklch": "oklch(0.282 0.1177 261.53)"
				},
				"--brand-surface": {
					"hex": "#c3d8fe",
					"oklch": "oklch(0.88 0.0567 262)"
				},
				"--brand-surface-foreground": {
					"hex": "#242154",
					"oklch": "oklch(0.284 0.09 282)"
				},
				"--rail-accent-from": {
					"hex": "#2161da",
					"oklch": "oklch(0.5272 0.1962 261.53)"
				},
				"--rail-accent-tint": {
					"hex": "#0549c0",
					"oklch": "oklch(0.4522 0.1962 261.53)"
				},
				"--rail-accent-to": {
					"hex": "#023797",
					"oklch": "oklch(0.3772 0.1643 261.53)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		},
		"description": "Supplied by a designer - measured, not solved.",
		"light": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#0549c0",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.71
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#0549c0",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.71
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#0549c0",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.71
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#0549c0",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#ffffff",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 7.71
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#134ec1",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.27
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#42159a",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 11.63
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#e7effd",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#2445ac",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#e2ecfd",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#31459a",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#ebf2fe",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#111111",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 16.78
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#c3d8fe",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#242154",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.25
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#0549c0",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.71
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#111111",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 18.88
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#e2ecfd",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.18
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#0549c0",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.71
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#0549c0",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.71
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#023797",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 10.25
				}
			],
			"tokens": {
				"--background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--border": {
					"hex": "#dedede",
					"oklch": "oklch(0.9 0 0)"
				},
				"--brand-accent": {
					"hex": "#afd0fe",
					"oklch": "oklch(0.85 0.0729 256)"
				},
				"--brand-edge": {
					"hex": "#6388fc",
					"oklch": "oklch(0.656 0.1768 268)"
				},
				"--brand-muted": {
					"hex": "#ebf2fe",
					"oklch": "oklch(0.96 0.018 262)"
				},
				"--brand-pale": {
					"hex": "#d4e7fe",
					"oklch": "oklch(0.92 0.0381 254)"
				},
				"--brand-primary": {
					"hex": "#0549c0",
					"oklch": "oklch(0.4522 0.1962 261.53)"
				},
				"--brand-primary-foreground": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--brand-secondary": {
					"hex": "#e2ecfd",
					"oklch": "oklch(0.94 0.0257 261.53)"
				},
				"--brand-secondary-foreground": {
					"hex": "#31459a",
					"oklch": "oklch(0.426 0.14 269.53)"
				},
				"--chip-accent-soft": {
					"hex": "#e7effd",
					"oklch": "oklch(0.95 0.0213 262)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#2445ac",
					"oklch": "oklch(0.434 0.17 266)"
				},
				"--default": {
					"hex": "#ebebeb",
					"oklch": "oklch(0.94 0 0)"
				},
				"--field-background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0 / 60%)"
				},
				"--foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--glass-opaque": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-tint": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#0549c0",
					"oklch": "oklch(0.4522 0.1962 261.53)"
				},
				"--gradient-brand-hover": {
					"hex": "#033b9f",
					"oklch": "oklch(0.3922 0.1707 261.53)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#134ec1",
					"oklch": "oklch(0.466 0.19 262)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#42159a",
					"oklch": "oklch(0.366 0.19 288)"
				},
				"--gradient-brand-to": {
					"hex": "#0549c0",
					"oklch": "oklch(0.4522 0.1962 261.53)"
				},
				"--gradient-brand-via": {
					"hex": "#0549c0",
					"oklch": "oklch(0.4522 0.1962 261.53)"
				},
				"--muted": {
					"hex": "#636363",
					"oklch": "oklch(0.5 0 0)"
				},
				"--overlay": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--separator": {
					"hex": "#e4e4e4",
					"oklch": "oklch(0.92 0 0)"
				},
				"--surface": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--surface-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--surface-secondary": {
					"hex": "#f0f0f0",
					"oklch": "oklch(0.955 0 0)"
				},
				"--surface-tertiary": {
					"hex": "#ebebeb",
					"oklch": "oklch(0.94 0 0)"
				},
				"--brand-100": {
					"hex": "#d5e3fc",
					"oklch": "oklch(0.9129 0.0373 261.53)"
				},
				"--brand-200": {
					"hex": "#b1cbf9",
					"oklch": "oklch(0.8383 0.0706 261.53)"
				},
				"--brand-300": {
					"hex": "#7fa7ef",
					"oklch": "oklch(0.7295 0.1138 261.53)"
				},
				"--brand-400": {
					"hex": "#4075d7",
					"oklch": "oklch(0.5774 0.1608 261.53)"
				},
				"--brand-50": {
					"hex": "#f1f6ff",
					"oklch": "oklch(0.971 0.0132 261.53)"
				},
				"--brand-500": {
					"hex": "#0549c0",
					"oklch": "oklch(0.4522 0.1962 261.53)"
				},
				"--brand-600": {
					"hex": "#0340ab",
					"oklch": "oklch(0.4138 0.18 261.53)"
				},
				"--brand-700": {
					"hex": "#03399b",
					"oklch": "oklch(0.3848 0.1675 261.53)"
				},
				"--brand-800": {
					"hex": "#023289",
					"oklch": "oklch(0.3529 0.1538 261.53)"
				},
				"--brand-900": {
					"hex": "#022d7e",
					"oklch": "oklch(0.3304 0.1441 261.53)"
				},
				"--brand-950": {
					"hex": "#032362",
					"oklch": "oklch(0.282 0.1177 261.53)"
				},
				"--brand-surface": {
					"hex": "#c3d8fe",
					"oklch": "oklch(0.88 0.0567 262)"
				},
				"--brand-surface-foreground": {
					"hex": "#242154",
					"oklch": "oklch(0.284 0.09 282)"
				},
				"--rail-accent-from": {
					"hex": "#2161da",
					"oklch": "oklch(0.5272 0.1962 261.53)"
				},
				"--rail-accent-tint": {
					"hex": "#0549c0",
					"oklch": "oklch(0.4522 0.1962 261.53)"
				},
				"--rail-accent-to": {
					"hex": "#023797",
					"oklch": "oklch(0.3772 0.1643 261.53)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		}
	},
	"spotify": {
		"accentHue": 152,
		"baseTint": 0.012,
		"dark": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#1db954",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#111111",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.3
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#1db954",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#111111",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.3
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#1db954",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#111111",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.3
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#21cc5d",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 8.86
				},
				{
					"background": "--background",
					"backgroundHex": "#030704",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#23d06f",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.96
				},
				{
					"background": "--background",
					"backgroundHex": "#030704",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#17ae96",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.26
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#12361e",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#6cd396",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.24
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#183b23",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#9dd3a0",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.25
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#19281d",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#ebf0ec",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 13.36
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#bbe4c4",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#023126",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.2
				},
				{
					"background": "--background",
					"backgroundHex": "#030704",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#1db954",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.83
				},
				{
					"background": "--surface",
					"backgroundHex": "#131a14",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#ebf0ec",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 15.35
				},
				{
					"background": "--background",
					"backgroundHex": "#030704",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#183b23",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.62
				},
				{
					"background": "--background",
					"backgroundHex": "#030704",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#21cc5d",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.51
				},
				{
					"background": "--surface",
					"backgroundHex": "#131a14",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#21cc5d",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.31
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#10913f",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.97
				}
			],
			"tokens": {
				"--background": {
					"hex": "#030704",
					"oklch": "oklch(0.1186 0.012 152)"
				},
				"--border": {
					"hex": "#2c362e",
					"oklch": "oklch(0.32 0.018 152)"
				},
				"--brand-accent": {
					"hex": "#126022",
					"oklch": "oklch(0.429 0.12 146)"
				},
				"--brand-edge": {
					"hex": "#1abd8a",
					"oklch": "oklch(0.709 0.1446 165)"
				},
				"--brand-muted": {
					"hex": "#19281d",
					"oklch": "oklch(0.26 0.03 152)"
				},
				"--brand-pale": {
					"hex": "#1f411f",
					"oklch": "oklch(0.34 0.07 144)"
				},
				"--brand-primary": {
					"hex": "#21cc5d",
					"oklch": "oklch(0.74 0.2009 148.92)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#183b23",
					"oklch": "oklch(0.32 0.06 152)"
				},
				"--brand-secondary-foreground": {
					"hex": "#9dd3a0",
					"oklch": "oklch(0.816 0.09 146)"
				},
				"--chip-accent-soft": {
					"hex": "#12361e",
					"oklch": "oklch(0.3 0.06 152)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#6cd396",
					"oklch": "oklch(0.788 0.13 156)"
				},
				"--default": {
					"hex": "#2c362e",
					"oklch": "oklch(0.32 0.018 152)"
				},
				"--field-background": {
					"hex": "#0b110d",
					"oklch": "oklch(0.17 0.0132 152)"
				},
				"--field-border": {
					"hex": "#3c453e",
					"oklch": "oklch(0.38 0.018 152)"
				},
				"--foreground": {
					"hex": "#ebf0ec",
					"oklch": "oklch(0.95 0.0072 152)"
				},
				"--glass-opaque": {
					"hex": "#171f19",
					"oklch": "oklch(0.23 0.0168 152)"
				},
				"--glass-opaque-strong": {
					"hex": "#1b241d",
					"oklch": "oklch(0.25 0.018 152)"
				},
				"--glass-tint": {
					"hex": "#1e2720",
					"oklch": "oklch(0.26 0.018 152)"
				},
				"--gradient-brand-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#1db954",
					"oklch": "oklch(0.6888 0.187 148.92)"
				},
				"--gradient-brand-hover": {
					"hex": "#3dcd67",
					"oklch": "oklch(0.7488 0.187 148.92)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#23d06f",
					"oklch": "oklch(0.754 0.19 152)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#17ae96",
					"oklch": "oklch(0.674 0.1204 178)"
				},
				"--gradient-brand-to": {
					"hex": "#1db954",
					"oklch": "oklch(0.6888 0.187 148.92)"
				},
				"--gradient-brand-via": {
					"hex": "#1db954",
					"oklch": "oklch(0.6888 0.187 148.92)"
				},
				"--muted": {
					"hex": "#9da89f",
					"oklch": "oklch(0.72 0.018 152)"
				},
				"--overlay": {
					"hex": "#171f19",
					"oklch": "oklch(0.23 0.0168 152)"
				},
				"--overlay-foreground": {
					"hex": "#ebf0ec",
					"oklch": "oklch(0.95 0.0072 152)"
				},
				"--separator": {
					"hex": "#222c25",
					"oklch": "oklch(0.28 0.018 152)"
				},
				"--surface": {
					"hex": "#131a14",
					"oklch": "oklch(0.2068 0.015 152)"
				},
				"--surface-foreground": {
					"hex": "#ebf0ec",
					"oklch": "oklch(0.95 0.0072 152)"
				},
				"--surface-secondary": {
					"hex": "#1e2620",
					"oklch": "oklch(0.26 0.0168 152)"
				},
				"--surface-tertiary": {
					"hex": "#313b33",
					"oklch": "oklch(0.34 0.018 152)"
				},
				"--brand-100": {
					"hex": "#dbf2de",
					"oklch": "oklch(0.9394 0.0355 148.92)"
				},
				"--brand-200": {
					"hex": "#c0ebc6",
					"oklch": "oklch(0.8988 0.0673 148.92)"
				},
				"--brand-300": {
					"hex": "#98dea4",
					"oklch": "oklch(0.8396 0.1084 148.92)"
				},
				"--brand-400": {
					"hex": "#60ca78",
					"oklch": "oklch(0.7569 0.1533 148.92)"
				},
				"--brand-50": {
					"hex": "#edf9ef",
					"oklch": "oklch(0.971 0.0187 148.92)"
				},
				"--brand-500": {
					"hex": "#1db954",
					"oklch": "oklch(0.6888 0.187 148.92)"
				},
				"--brand-600": {
					"hex": "#129943",
					"oklch": "oklch(0.597 0.1638 148.92)"
				},
				"--brand-700": {
					"hex": "#0d8138",
					"oklch": "oklch(0.5278 0.1448 148.92)"
				},
				"--brand-800": {
					"hex": "#08672b",
					"oklch": "oklch(0.4514 0.1239 148.92)"
				},
				"--brand-900": {
					"hex": "#055623",
					"oklch": "oklch(0.3977 0.1093 148.92)"
				},
				"--brand-950": {
					"hex": "#023312",
					"oklch": "oklch(0.282 0.0777 148.92)"
				},
				"--brand-surface": {
					"hex": "#bbe4c4",
					"oklch": "oklch(0.88 0.06 152)"
				},
				"--brand-surface-foreground": {
					"hex": "#023126",
					"oklch": "oklch(0.28 0.0529 172)"
				},
				"--rail-accent-from": {
					"hex": "#3dc363",
					"oklch": "oklch(0.7238 0.178 148.92)"
				},
				"--rail-accent-tint": {
					"hex": "#15ab4c",
					"oklch": "oklch(0.6488 0.178 148.92)"
				},
				"--rail-accent-to": {
					"hex": "#10913f",
					"oklch": "oklch(0.5738 0.1575 148.92)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		},
		"description": "The green everybody knows - and 2.58:1 against white, so its buttons have no edge of their own. Shipped that way by Spotify too.",
		"light": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#1db954",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#111111",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.3
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#1db954",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#111111",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.3
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#1db954",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#111111",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.3
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#1db954",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 7.3
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#086432",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.29
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#034338",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 11.26
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#def6e3",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#065b34",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#dcf2df",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#065834",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.25
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#e9f6ec",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#111111",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 16.95
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#bbe4c4",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#023126",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.2
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#1db954",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 2.58
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#111111",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 18.88
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#dcf2df",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.17
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#1db954",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 2.58
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#1db954",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": false,
					"ratio": 2.58
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#10913f",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.97
				}
			],
			"tokens": {
				"--background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--border": {
					"hex": "#dae0db",
					"oklch": "oklch(0.9 0.009 152)"
				},
				"--brand-accent": {
					"hex": "#a8deab",
					"oklch": "oklch(0.85 0.09 146)"
				},
				"--brand-edge": {
					"hex": "#14a267",
					"oklch": "oklch(0.63 0.143 158)"
				},
				"--brand-muted": {
					"hex": "#e9f6ec",
					"oklch": "oklch(0.96 0.018 152)"
				},
				"--brand-pale": {
					"hex": "#d1eed0",
					"oklch": "oklch(0.92 0.05 144)"
				},
				"--brand-primary": {
					"hex": "#1db954",
					"oklch": "oklch(0.6888 0.187 148.92)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#dcf2df",
					"oklch": "oklch(0.94 0.035 148.92)"
				},
				"--brand-secondary-foreground": {
					"hex": "#065834",
					"oklch": "oklch(0.406 0.0941 156.92)"
				},
				"--chip-accent-soft": {
					"hex": "#def6e3",
					"oklch": "oklch(0.95 0.035 152)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#065b34",
					"oklch": "oklch(0.416 0.098 156)"
				},
				"--default": {
					"hex": "#e9ece9",
					"oklch": "oklch(0.94 0.0048 152)"
				},
				"--field-background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0 / 60%)"
				},
				"--foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--glass-opaque": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-tint": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#1db954",
					"oklch": "oklch(0.6888 0.187 148.92)"
				},
				"--gradient-brand-hover": {
					"hex": "#3dcd67",
					"oklch": "oklch(0.7488 0.187 148.92)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#086432",
					"oklch": "oklch(0.442 0.1129 152)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#034338",
					"oklch": "oklch(0.342 0.0612 178)"
				},
				"--gradient-brand-to": {
					"hex": "#1db954",
					"oklch": "oklch(0.6888 0.187 148.92)"
				},
				"--gradient-brand-via": {
					"hex": "#1db954",
					"oklch": "oklch(0.6888 0.187 148.92)"
				},
				"--muted": {
					"hex": "#5c665e",
					"oklch": "oklch(0.5 0.018 152)"
				},
				"--overlay": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--separator": {
					"hex": "#e0e6e2",
					"oklch": "oklch(0.92 0.009 152)"
				},
				"--surface": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--surface-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--surface-secondary": {
					"hex": "#eef1ee",
					"oklch": "oklch(0.955 0.0048 152)"
				},
				"--surface-tertiary": {
					"hex": "#e9ece9",
					"oklch": "oklch(0.94 0.0048 152)"
				},
				"--brand-100": {
					"hex": "#dbf2de",
					"oklch": "oklch(0.9394 0.0355 148.92)"
				},
				"--brand-200": {
					"hex": "#c0ebc6",
					"oklch": "oklch(0.8988 0.0673 148.92)"
				},
				"--brand-300": {
					"hex": "#98dea4",
					"oklch": "oklch(0.8396 0.1084 148.92)"
				},
				"--brand-400": {
					"hex": "#60ca78",
					"oklch": "oklch(0.7569 0.1533 148.92)"
				},
				"--brand-50": {
					"hex": "#edf9ef",
					"oklch": "oklch(0.971 0.0187 148.92)"
				},
				"--brand-500": {
					"hex": "#1db954",
					"oklch": "oklch(0.6888 0.187 148.92)"
				},
				"--brand-600": {
					"hex": "#129943",
					"oklch": "oklch(0.597 0.1638 148.92)"
				},
				"--brand-700": {
					"hex": "#0d8138",
					"oklch": "oklch(0.5278 0.1448 148.92)"
				},
				"--brand-800": {
					"hex": "#08672b",
					"oklch": "oklch(0.4514 0.1239 148.92)"
				},
				"--brand-900": {
					"hex": "#055623",
					"oklch": "oklch(0.3977 0.1093 148.92)"
				},
				"--brand-950": {
					"hex": "#023312",
					"oklch": "oklch(0.282 0.0777 148.92)"
				},
				"--brand-surface": {
					"hex": "#bbe4c4",
					"oklch": "oklch(0.88 0.06 152)"
				},
				"--brand-surface-foreground": {
					"hex": "#023126",
					"oklch": "oklch(0.28 0.0529 172)"
				},
				"--rail-accent-from": {
					"hex": "#3dc363",
					"oklch": "oklch(0.7238 0.178 148.92)"
				},
				"--rail-accent-tint": {
					"hex": "#15ab4c",
					"oklch": "oklch(0.6488 0.178 148.92)"
				},
				"--rail-accent-to": {
					"hex": "#10913f",
					"oklch": "oklch(0.5738 0.1575 148.92)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		}
	},
	"discord": {
		"accentHue": 272,
		"baseTint": 0.012,
		"dark": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#7d90fc",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#7d90fc",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#7d90fc",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#9badfd",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 8.8
				},
				{
					"background": "--background",
					"backgroundHex": "#04050a",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#a0b4fd",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 10.12
				},
				{
					"background": "--background",
					"backgroundHex": "#04050a",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#ae83fc",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#232b4c",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#abb8fd",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#283051",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#a8c2fd",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#1f2333",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#edeef3",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 13.46
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#cad6fe",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#2c1e52",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.29
				},
				{
					"background": "--background",
					"backgroundHex": "#04050a",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#7d90fc",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.04
				},
				{
					"background": "--surface",
					"backgroundHex": "#15171f",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#edeef3",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 15.43
				},
				{
					"background": "--background",
					"backgroundHex": "#04050a",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#283051",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.58
				},
				{
					"background": "--background",
					"backgroundHex": "#04050a",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#9badfd",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.49
				},
				{
					"background": "--surface",
					"backgroundHex": "#15171f",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#9badfd",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.33
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#454cd8",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 6.24
				}
			],
			"tokens": {
				"--background": {
					"hex": "#04050a",
					"oklch": "oklch(0.1186 0.012 272)"
				},
				"--border": {
					"hex": "#2f323c",
					"oklch": "oklch(0.32 0.018 272)"
				},
				"--brand-accent": {
					"hex": "#375399",
					"oklch": "oklch(0.457 0.12 266)"
				},
				"--brand-edge": {
					"hex": "#a19cfd",
					"oklch": "oklch(0.737 0.1375 285)"
				},
				"--brand-muted": {
					"hex": "#1f2333",
					"oklch": "oklch(0.26 0.03 272)"
				},
				"--brand-pale": {
					"hex": "#293b61",
					"oklch": "oklch(0.357 0.07 264)"
				},
				"--brand-primary": {
					"hex": "#9badfd",
					"oklch": "oklch(0.764 0.117 273.85)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#283051",
					"oklch": "oklch(0.32 0.06 272)"
				},
				"--brand-secondary-foreground": {
					"hex": "#a8c2fd",
					"oklch": "oklch(0.816 0.0888 266)"
				},
				"--chip-accent-soft": {
					"hex": "#232b4c",
					"oklch": "oklch(0.3 0.06 272)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#abb8fd",
					"oklch": "oklch(0.798 0.0993 276)"
				},
				"--default": {
					"hex": "#2f323c",
					"oklch": "oklch(0.32 0.018 272)"
				},
				"--field-background": {
					"hex": "#0d0f15",
					"oklch": "oklch(0.17 0.0132 272)"
				},
				"--field-border": {
					"hex": "#3f424c",
					"oklch": "oklch(0.38 0.018 272)"
				},
				"--foreground": {
					"hex": "#edeef3",
					"oklch": "oklch(0.95 0.0072 272)"
				},
				"--glass-opaque": {
					"hex": "#1a1d25",
					"oklch": "oklch(0.23 0.0168 272)"
				},
				"--glass-opaque-strong": {
					"hex": "#1e212a",
					"oklch": "oklch(0.25 0.018 272)"
				},
				"--glass-tint": {
					"hex": "#21242d",
					"oklch": "oklch(0.26 0.018 272)"
				},
				"--gradient-brand-foreground": {
					"hex": "#010101",
					"oklch": "oklch(0.0736 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#7d90fc",
					"oklch": "oklch(0.6874 0.1597 273.85)"
				},
				"--gradient-brand-hover": {
					"hex": "#94a7fd",
					"oklch": "oklch(0.7474 0.126 273.85)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#a0b4fd",
					"oklch": "oklch(0.782 0.1069 272)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#ae83fc",
					"oklch": "oklch(0.702 0.1752 298)"
				},
				"--gradient-brand-to": {
					"hex": "#7d90fc",
					"oklch": "oklch(0.6874 0.1597 273.85)"
				},
				"--gradient-brand-via": {
					"hex": "#7d90fc",
					"oklch": "oklch(0.6874 0.1597 273.85)"
				},
				"--muted": {
					"hex": "#a0a4b0",
					"oklch": "oklch(0.72 0.018 272)"
				},
				"--overlay": {
					"hex": "#1a1d25",
					"oklch": "oklch(0.23 0.0168 272)"
				},
				"--overlay-foreground": {
					"hex": "#edeef3",
					"oklch": "oklch(0.95 0.0072 272)"
				},
				"--separator": {
					"hex": "#262832",
					"oklch": "oklch(0.28 0.018 272)"
				},
				"--surface": {
					"hex": "#15171f",
					"oklch": "oklch(0.2068 0.015 272)"
				},
				"--surface-foreground": {
					"hex": "#edeef3",
					"oklch": "oklch(0.95 0.0072 272)"
				},
				"--surface-secondary": {
					"hex": "#21242c",
					"oklch": "oklch(0.26 0.0168 272)"
				},
				"--surface-tertiary": {
					"hex": "#343842",
					"oklch": "oklch(0.34 0.018 272)"
				},
				"--brand-100": {
					"hex": "#dfe6fe",
					"oklch": "oklch(0.9269 0.034 273.85)"
				},
				"--brand-200": {
					"hex": "#c7d2fe",
					"oklch": "oklch(0.8703 0.0616 273.85)"
				},
				"--brand-300": {
					"hex": "#a5b5fd",
					"oklch": "oklch(0.7878 0.1042 273.85)"
				},
				"--brand-400": {
					"hex": "#778afc",
					"oklch": "oklch(0.6724 0.1684 273.85)"
				},
				"--brand-50": {
					"hex": "#f2f5ff",
					"oklch": "oklch(0.971 0.0132 273.85)"
				},
				"--brand-500": {
					"hex": "#5865f2",
					"oklch": "oklch(0.5774 0.2091 273.85)"
				},
				"--brand-600": {
					"hex": "#474edd",
					"oklch": "oklch(0.5107 0.2133 273.85)"
				},
				"--brand-700": {
					"hex": "#3c3fc7",
					"oklch": "oklch(0.4605 0.2049 273.85)"
				},
				"--brand-800": {
					"hex": "#3134a7",
					"oklch": "oklch(0.405 0.1798 273.85)"
				},
				"--brand-900": {
					"hex": "#2a2d90",
					"oklch": "oklch(0.366 0.1589 273.85)"
				},
				"--brand-950": {
					"hex": "#1a1c65",
					"oklch": "oklch(0.282 0.1255 273.85)"
				},
				"--brand-surface": {
					"hex": "#cad6fe",
					"oklch": "oklch(0.88 0.0566 272)"
				},
				"--brand-surface-foreground": {
					"hex": "#2c1e52",
					"oklch": "oklch(0.284 0.09 292)"
				},
				"--rail-accent-from": {
					"hex": "#7082fc",
					"oklch": "oklch(0.6524 0.1801 273.85)"
				},
				"--rail-accent-tint": {
					"hex": "#5865f2",
					"oklch": "oklch(0.5774 0.2091 273.85)"
				},
				"--rail-accent-to": {
					"hex": "#454cd8",
					"oklch": "oklch(0.5024 0.2091 273.85)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		},
		"description": "Blurple. Friendly, and deep enough to carry white copy.",
		"light": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#5865f2",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-start",
					"kind": "text",
					"passes": false,
					"ratio": 4.6
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#5865f2",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-mid",
					"kind": "text",
					"passes": false,
					"ratio": 4.6
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#5865f2",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-end",
					"kind": "text",
					"passes": false,
					"ratio": 4.6
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#5865f2",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#ffffff",
					"id": "brand-solid",
					"kind": "text",
					"passes": false,
					"ratio": 4.6
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#3b48c3",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#500c94",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 11.53
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#e9eefd",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#3d3fac",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#e5eafd",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#453f98",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.24
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#edf1fe",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#111111",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 16.73
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#cad6fe",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#2c1e52",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.29
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#5865f2",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 4.6
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#111111",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 18.88
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#e5eafd",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.19
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#5865f2",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 4.6
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#5865f2",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 4.6
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#454cd8",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 6.24
				}
			],
			"tokens": {
				"--background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--border": {
					"hex": "#dcdee4",
					"oklch": "oklch(0.9 0.009 272)"
				},
				"--brand-accent": {
					"hex": "#b8cdfe",
					"oklch": "oklch(0.85 0.0714 266)"
				},
				"--brand-edge": {
					"hex": "#7b82fc",
					"oklch": "oklch(0.66 0.1776 278)"
				},
				"--brand-muted": {
					"hex": "#edf1fe",
					"oklch": "oklch(0.96 0.018 272)"
				},
				"--brand-pale": {
					"hex": "#d8e5fe",
					"oklch": "oklch(0.92 0.0371 264)"
				},
				"--brand-primary": {
					"hex": "#5865f2",
					"oklch": "oklch(0.5774 0.2091 273.85)"
				},
				"--brand-primary-foreground": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--brand-secondary": {
					"hex": "#e5eafd",
					"oklch": "oklch(0.94 0.0257 273.85)"
				},
				"--brand-secondary-foreground": {
					"hex": "#453f98",
					"oklch": "oklch(0.426 0.14 281.85)"
				},
				"--chip-accent-soft": {
					"hex": "#e9eefd",
					"oklch": "oklch(0.95 0.0213 272)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#3d3fac",
					"oklch": "oklch(0.436 0.17 276)"
				},
				"--default": {
					"hex": "#eaebee",
					"oklch": "oklch(0.94 0.0048 272)"
				},
				"--field-background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0 / 60%)"
				},
				"--foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--glass-opaque": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-tint": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#5865f2",
					"oklch": "oklch(0.5774 0.2091 273.85)"
				},
				"--gradient-brand-hover": {
					"hex": "#4951dd",
					"oklch": "oklch(0.5174 0.2091 273.85)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#3b48c3",
					"oklch": "oklch(0.47 0.19 272)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#500c94",
					"oklch": "oklch(0.37 0.19 298)"
				},
				"--gradient-brand-to": {
					"hex": "#5865f2",
					"oklch": "oklch(0.5774 0.2091 273.85)"
				},
				"--gradient-brand-via": {
					"hex": "#5865f2",
					"oklch": "oklch(0.5774 0.2091 273.85)"
				},
				"--muted": {
					"hex": "#5f636e",
					"oklch": "oklch(0.5 0.018 272)"
				},
				"--overlay": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--separator": {
					"hex": "#e2e4eb",
					"oklch": "oklch(0.92 0.009 272)"
				},
				"--surface": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--surface-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--surface-secondary": {
					"hex": "#eff0f3",
					"oklch": "oklch(0.955 0.0048 272)"
				},
				"--surface-tertiary": {
					"hex": "#eaebee",
					"oklch": "oklch(0.94 0.0048 272)"
				},
				"--brand-100": {
					"hex": "#dfe6fe",
					"oklch": "oklch(0.9269 0.034 273.85)"
				},
				"--brand-200": {
					"hex": "#c7d2fe",
					"oklch": "oklch(0.8703 0.0616 273.85)"
				},
				"--brand-300": {
					"hex": "#a5b5fd",
					"oklch": "oklch(0.7878 0.1042 273.85)"
				},
				"--brand-400": {
					"hex": "#778afc",
					"oklch": "oklch(0.6724 0.1684 273.85)"
				},
				"--brand-50": {
					"hex": "#f2f5ff",
					"oklch": "oklch(0.971 0.0132 273.85)"
				},
				"--brand-500": {
					"hex": "#5865f2",
					"oklch": "oklch(0.5774 0.2091 273.85)"
				},
				"--brand-600": {
					"hex": "#474edd",
					"oklch": "oklch(0.5107 0.2133 273.85)"
				},
				"--brand-700": {
					"hex": "#3c3fc7",
					"oklch": "oklch(0.4605 0.2049 273.85)"
				},
				"--brand-800": {
					"hex": "#3134a7",
					"oklch": "oklch(0.405 0.1798 273.85)"
				},
				"--brand-900": {
					"hex": "#2a2d90",
					"oklch": "oklch(0.366 0.1589 273.85)"
				},
				"--brand-950": {
					"hex": "#1a1c65",
					"oklch": "oklch(0.282 0.1255 273.85)"
				},
				"--brand-surface": {
					"hex": "#cad6fe",
					"oklch": "oklch(0.88 0.0566 272)"
				},
				"--brand-surface-foreground": {
					"hex": "#2c1e52",
					"oklch": "oklch(0.284 0.09 292)"
				},
				"--rail-accent-from": {
					"hex": "#7082fc",
					"oklch": "oklch(0.6524 0.1801 273.85)"
				},
				"--rail-accent-tint": {
					"hex": "#5865f2",
					"oklch": "oklch(0.5774 0.2091 273.85)"
				},
				"--rail-accent-to": {
					"hex": "#454cd8",
					"oklch": "oklch(0.5024 0.2091 273.85)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		}
	},
	"airbnb": {
		"accentHue": 22,
		"baseTint": 0.001,
		"dark": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#fd6567",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#000000",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#fd6567",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#000000",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#fd6567",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#000000",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#fd9491",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 8.83
				},
				{
					"background": "--background",
					"backgroundHex": "#060505",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#fd9895",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.79
				},
				{
					"background": "--background",
					"backgroundHex": "#060505",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#f87314",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#472020",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#fda299",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#4d2525",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#f9adb0",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#311e1d",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#efeeee",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 13.59
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#fdc9c6",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#491701",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.2
				},
				{
					"background": "--background",
					"backgroundHex": "#060505",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#fd6567",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.01
				},
				{
					"background": "--surface",
					"backgroundHex": "#181717",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#efeeee",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 15.44
				},
				{
					"background": "--background",
					"backgroundHex": "#060505",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#4d2525",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.55
				},
				{
					"background": "--background",
					"backgroundHex": "#060505",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#fd9491",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.52
				},
				{
					"background": "--surface",
					"backgroundHex": "#181717",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#fd9491",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.36
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#e1434b",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 4
				}
			],
			"tokens": {
				"--background": {
					"hex": "#060505",
					"oklch": "oklch(0.1186 0.001 22)"
				},
				"--border": {
					"hex": "#343232",
					"oklch": "oklch(0.32 0.0015 22)"
				},
				"--brand-accent": {
					"hex": "#8e3540",
					"oklch": "oklch(0.457 0.12 16)"
				},
				"--brand-edge": {
					"hex": "#fd8162",
					"oklch": "oklch(0.737 0.1583 35)"
				},
				"--brand-muted": {
					"hex": "#311e1d",
					"oklch": "oklch(0.26 0.03 22)"
				},
				"--brand-pale": {
					"hex": "#5b2c31",
					"oklch": "oklch(0.357 0.07 14)"
				},
				"--brand-primary": {
					"hex": "#fd9491",
					"oklch": "oklch(0.776 0.1274 22.38)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#4d2525",
					"oklch": "oklch(0.32 0.06 22)"
				},
				"--brand-secondary-foreground": {
					"hex": "#f9adb0",
					"oklch": "oklch(0.82 0.09 16)"
				},
				"--chip-accent-soft": {
					"hex": "#472020",
					"oklch": "oklch(0.3 0.06 22)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#fda299",
					"oklch": "oklch(0.802 0.1096 26)"
				},
				"--default": {
					"hex": "#343232",
					"oklch": "oklch(0.32 0.0015 22)"
				},
				"--field-background": {
					"hex": "#100f0f",
					"oklch": "oklch(0.17 0.0011 22)"
				},
				"--field-border": {
					"hex": "#434242",
					"oklch": "oklch(0.38 0.0015 22)"
				},
				"--foreground": {
					"hex": "#efeeee",
					"oklch": "oklch(0.95 0.0006 22)"
				},
				"--glass-opaque": {
					"hex": "#1e1d1d",
					"oklch": "oklch(0.23 0.0014 22)"
				},
				"--glass-opaque-strong": {
					"hex": "#222121",
					"oklch": "oklch(0.25 0.0015 22)"
				},
				"--glass-tint": {
					"hex": "#252424",
					"oklch": "oklch(0.26 0.0015 22)"
				},
				"--gradient-brand-foreground": {
					"hex": "#000000",
					"oklch": "oklch(0.0496 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#fd6567",
					"oklch": "oklch(0.6992 0.186 22.38)"
				},
				"--gradient-brand-hover": {
					"hex": "#fd8b88",
					"oklch": "oklch(0.7592 0.1394 22.38)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#fd9895",
					"oklch": "oklch(0.784 0.1218 22)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#f87314",
					"oklch": "oklch(0.704 0.186 48)"
				},
				"--gradient-brand-to": {
					"hex": "#fd6567",
					"oklch": "oklch(0.6992 0.186 22.38)"
				},
				"--gradient-brand-via": {
					"hex": "#fd6567",
					"oklch": "oklch(0.6992 0.186 22.38)"
				},
				"--muted": {
					"hex": "#a5a4a4",
					"oklch": "oklch(0.72 0.0015 22)"
				},
				"--overlay": {
					"hex": "#1e1d1d",
					"oklch": "oklch(0.23 0.0014 22)"
				},
				"--overlay-foreground": {
					"hex": "#efeeee",
					"oklch": "oklch(0.95 0.0006 22)"
				},
				"--separator": {
					"hex": "#2a2928",
					"oklch": "oklch(0.28 0.0015 22)"
				},
				"--surface": {
					"hex": "#181717",
					"oklch": "oklch(0.2068 0.0013 22)"
				},
				"--surface-foreground": {
					"hex": "#efeeee",
					"oklch": "oklch(0.95 0.0006 22)"
				},
				"--surface-secondary": {
					"hex": "#252424",
					"oklch": "oklch(0.26 0.0014 22)"
				},
				"--surface-tertiary": {
					"hex": "#393837",
					"oklch": "oklch(0.34 0.0015 22)"
				},
				"--brand-100": {
					"hex": "#fee4e2",
					"oklch": "oklch(0.9394 0.0295 22.38)"
				},
				"--brand-200": {
					"hex": "#fed1ce",
					"oklch": "oklch(0.8989 0.0509 22.38)"
				},
				"--brand-300": {
					"hex": "#feb5b1",
					"oklch": "oklch(0.8398 0.0854 22.38)"
				},
				"--brand-400": {
					"hex": "#fd8987",
					"oklch": "oklch(0.7572 0.1408 22.38)"
				},
				"--brand-50": {
					"hex": "#fff2f1",
					"oklch": "oklch(0.971 0.0137 22.38)"
				},
				"--brand-500": {
					"hex": "#ff5a5f",
					"oklch": "oklch(0.6892 0.2004 22.38)"
				},
				"--brand-600": {
					"hex": "#df3643",
					"oklch": "oklch(0.5973 0.2044 22.38)"
				},
				"--brand-700": {
					"hex": "#c31e31",
					"oklch": "oklch(0.528 0.1964 22.38)"
				},
				"--brand-800": {
					"hex": "#a01125",
					"oklch": "oklch(0.4516 0.1723 22.38)"
				},
				"--brand-900": {
					"hex": "#860c1d",
					"oklch": "oklch(0.3978 0.1523 22.38)"
				},
				"--brand-950": {
					"hex": "#53020d",
					"oklch": "oklch(0.282 0.1107 22.38)"
				},
				"--brand-surface": {
					"hex": "#fdc9c6",
					"oklch": "oklch(0.88 0.06 22)"
				},
				"--brand-surface-foreground": {
					"hex": "#491701",
					"oklch": "oklch(0.282 0.0831 42)"
				},
				"--rail-accent-from": {
					"hex": "#fd8d8a",
					"oklch": "oklch(0.7642 0.1357 22.38)"
				},
				"--rail-accent-tint": {
					"hex": "#fc5d61",
					"oklch": "oklch(0.6892 0.1944 22.38)"
				},
				"--rail-accent-to": {
					"hex": "#e1434b",
					"oklch": "oklch(0.6142 0.1944 22.38)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		},
		"description": "Supplied by a designer - measured, not solved.",
		"light": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#ff5a5f",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#000000",
					"id": "gradient-start",
					"kind": "text",
					"passes": false,
					"ratio": 6.87
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#ff5a5f",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#000000",
					"id": "gradient-mid",
					"kind": "text",
					"passes": false,
					"ratio": 6.87
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#ff5a5f",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#000000",
					"id": "gradient-end",
					"kind": "text",
					"passes": false,
					"ratio": 6.87
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#ff5a5f",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": false,
					"ratio": 6.18
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#af0c28",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#6b2e03",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 10.41
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#fde9e8",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#9b0f18",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.27
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#fde5e3",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#8d261a",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#feedec",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#111111",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 16.67
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#fdc9c6",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#491701",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.2
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#ff5a5f",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.05
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#111111",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 18.88
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#fde5e3",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.2
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#ff5a5f",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.05
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#ff5a5f",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.05
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#e1434b",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 4
				}
			],
			"tokens": {
				"--background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--border": {
					"hex": "#dedede",
					"oklch": "oklch(0.9 0.0008 22)"
				},
				"--brand-accent": {
					"hex": "#feb9bc",
					"oklch": "oklch(0.85 0.0798 16)"
				},
				"--brand-edge": {
					"hex": "#fc5146",
					"oklch": "oklch(0.672 0.2092 28)"
				},
				"--brand-muted": {
					"hex": "#feedec",
					"oklch": "oklch(0.96 0.018 22)"
				},
				"--brand-pale": {
					"hex": "#fedadc",
					"oklch": "oklch(0.92 0.04 14)"
				},
				"--brand-primary": {
					"hex": "#ff5a5f",
					"oklch": "oklch(0.6892 0.2004 22.38)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#fde5e3",
					"oklch": "oklch(0.94 0.0271 22.38)"
				},
				"--brand-secondary-foreground": {
					"hex": "#8d261a",
					"oklch": "oklch(0.43 0.14 30.38)"
				},
				"--chip-accent-soft": {
					"hex": "#fde9e8",
					"oklch": "oklch(0.95 0.0224 22)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#9b0f18",
					"oklch": "oklch(0.44 0.17 26)"
				},
				"--default": {
					"hex": "#ebebeb",
					"oklch": "oklch(0.94 0.0004 22)"
				},
				"--field-background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0 / 60%)"
				},
				"--foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--glass-opaque": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-tint": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#000000",
					"oklch": "oklch(0.05 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#ff5a5f",
					"oklch": "oklch(0.6892 0.2004 22.38)"
				},
				"--gradient-brand-hover": {
					"hex": "#fd8582",
					"oklch": "oklch(0.7492 0.1467 22.38)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#af0c28",
					"oklch": "oklch(0.48 0.1877 22)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#6b2e03",
					"oklch": "oklch(0.38 0.1007 48)"
				},
				"--gradient-brand-to": {
					"hex": "#ff5a5f",
					"oklch": "oklch(0.6892 0.2004 22.38)"
				},
				"--gradient-brand-via": {
					"hex": "#ff5a5f",
					"oklch": "oklch(0.6892 0.2004 22.38)"
				},
				"--muted": {
					"hex": "#646363",
					"oklch": "oklch(0.5 0.0015 22)"
				},
				"--overlay": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--separator": {
					"hex": "#e5e4e4",
					"oklch": "oklch(0.92 0.0008 22)"
				},
				"--surface": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--surface-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--surface-secondary": {
					"hex": "#f0f0f0",
					"oklch": "oklch(0.955 0.0004 22)"
				},
				"--surface-tertiary": {
					"hex": "#ebebeb",
					"oklch": "oklch(0.94 0.0004 22)"
				},
				"--brand-100": {
					"hex": "#fee4e2",
					"oklch": "oklch(0.9394 0.0295 22.38)"
				},
				"--brand-200": {
					"hex": "#fed1ce",
					"oklch": "oklch(0.8989 0.0509 22.38)"
				},
				"--brand-300": {
					"hex": "#feb5b1",
					"oklch": "oklch(0.8398 0.0854 22.38)"
				},
				"--brand-400": {
					"hex": "#fd8987",
					"oklch": "oklch(0.7572 0.1408 22.38)"
				},
				"--brand-50": {
					"hex": "#fff2f1",
					"oklch": "oklch(0.971 0.0137 22.38)"
				},
				"--brand-500": {
					"hex": "#ff5a5f",
					"oklch": "oklch(0.6892 0.2004 22.38)"
				},
				"--brand-600": {
					"hex": "#df3643",
					"oklch": "oklch(0.5973 0.2044 22.38)"
				},
				"--brand-700": {
					"hex": "#c31e31",
					"oklch": "oklch(0.528 0.1964 22.38)"
				},
				"--brand-800": {
					"hex": "#a01125",
					"oklch": "oklch(0.4516 0.1723 22.38)"
				},
				"--brand-900": {
					"hex": "#860c1d",
					"oklch": "oklch(0.3978 0.1523 22.38)"
				},
				"--brand-950": {
					"hex": "#53020d",
					"oklch": "oklch(0.282 0.1107 22.38)"
				},
				"--brand-surface": {
					"hex": "#fdc9c6",
					"oklch": "oklch(0.88 0.06 22)"
				},
				"--brand-surface-foreground": {
					"hex": "#491701",
					"oklch": "oklch(0.282 0.0831 42)"
				},
				"--rail-accent-from": {
					"hex": "#fd8d8a",
					"oklch": "oklch(0.7642 0.1357 22.38)"
				},
				"--rail-accent-tint": {
					"hex": "#fc5d61",
					"oklch": "oklch(0.6892 0.1944 22.38)"
				},
				"--rail-accent-to": {
					"hex": "#e1434b",
					"oklch": "oklch(0.6142 0.1944 22.38)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		}
	},
	"coinbase": {
		"accentHue": 264,
		"baseTint": 0.012,
		"dark": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#92b5fd",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#020511",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.92
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#94a0fd",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#020511",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 8.43
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#9f89fc",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#020511",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#94a0fd",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#020511",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 8.43
				},
				{
					"background": "--background",
					"backgroundHex": "#04060a",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#94b7fd",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 10.09
				},
				{
					"background": "--background",
					"backgroundHex": "#04060a",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#9f89fc",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#1e2d4c",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#a2bbfd",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#233251",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#9fc5fd",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#1d2433",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#eceef3",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 13.37
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#c5d8fe",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#272154",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.21
				},
				{
					"background": "--background",
					"backgroundHex": "#04060a",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#94a0fd",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.4
				},
				{
					"background": "--surface",
					"backgroundHex": "#14181f",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#eceef3",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 15.32
				},
				{
					"background": "--background",
					"backgroundHex": "#04060a",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#233251",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.58
				},
				{
					"background": "--background",
					"backgroundHex": "#04060a",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#94a0fd",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.4
				},
				{
					"background": "--surface",
					"backgroundHex": "#14181f",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#94a0fd",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.37
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#4989fc",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.26
				}
			],
			"tokens": {
				"--background": {
					"hex": "#04060a",
					"oklch": "oklch(0.1186 0.012 264)"
				},
				"--border": {
					"hex": "#2e333c",
					"oklch": "oklch(0.32 0.018 264)"
				},
				"--brand-accent": {
					"hex": "#285598",
					"oklch": "oklch(0.455 0.12 258)"
				},
				"--brand-edge": {
					"hex": "#94a0fd",
					"oklch": "oklch(0.735 0.1339 277)"
				},
				"--brand-muted": {
					"hex": "#1d2433",
					"oklch": "oklch(0.26 0.03 264)"
				},
				"--brand-pale": {
					"hex": "#223c60",
					"oklch": "oklch(0.355 0.07 256)"
				},
				"--brand-primary": {
					"hex": "#94a0fd",
					"oklch": "oklch(0.735 0.1339 277)"
				},
				"--brand-primary-foreground": {
					"hex": "#020511",
					"oklch": "oklch(0.1186 0.03 264)"
				},
				"--brand-secondary": {
					"hex": "#233251",
					"oklch": "oklch(0.32 0.06 264)"
				},
				"--brand-secondary-foreground": {
					"hex": "#9fc5fd",
					"oklch": "oklch(0.816 0.09 258)"
				},
				"--chip-accent-soft": {
					"hex": "#1e2d4c",
					"oklch": "oklch(0.3 0.06 264)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#a2bbfd",
					"oklch": "oklch(0.798 0.0982 268)"
				},
				"--default": {
					"hex": "#2e333c",
					"oklch": "oklch(0.32 0.018 264)"
				},
				"--field-background": {
					"hex": "#0c0f15",
					"oklch": "oklch(0.17 0.0132 264)"
				},
				"--field-border": {
					"hex": "#3d424c",
					"oklch": "oklch(0.38 0.018 264)"
				},
				"--foreground": {
					"hex": "#eceef3",
					"oklch": "oklch(0.95 0.0072 264)"
				},
				"--glass-opaque": {
					"hex": "#191d25",
					"oklch": "oklch(0.23 0.0168 264)"
				},
				"--glass-opaque-strong": {
					"hex": "#1d222a",
					"oklch": "oklch(0.25 0.018 264)"
				},
				"--glass-tint": {
					"hex": "#20242d",
					"oklch": "oklch(0.26 0.018 264)"
				},
				"--gradient-brand-foreground": {
					"hex": "#020511",
					"oklch": "oklch(0.1186 0.03 264)"
				},
				"--gradient-brand-from": {
					"hex": "#92b5fd",
					"oklch": "oklch(0.775 0.1105 264)"
				},
				"--gradient-brand-hover": {
					"hex": "#abb6fd",
					"oklch": "oklch(0.795 0.1011 277)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#94b7fd",
					"oklch": "oklch(0.78 0.1078 264)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#9f89fc",
					"oklch": "oklch(0.7 0.1644 290)"
				},
				"--gradient-brand-to": {
					"hex": "#9f89fc",
					"oklch": "oklch(0.7 0.1644 290)"
				},
				"--gradient-brand-via": {
					"hex": "#94a0fd",
					"oklch": "oklch(0.735 0.1339 277)"
				},
				"--muted": {
					"hex": "#9fa5b0",
					"oklch": "oklch(0.72 0.018 264)"
				},
				"--overlay": {
					"hex": "#191d25",
					"oklch": "oklch(0.23 0.0168 264)"
				},
				"--overlay-foreground": {
					"hex": "#eceef3",
					"oklch": "oklch(0.95 0.0072 264)"
				},
				"--separator": {
					"hex": "#242932",
					"oklch": "oklch(0.28 0.018 264)"
				},
				"--surface": {
					"hex": "#14181f",
					"oklch": "oklch(0.2068 0.015 264)"
				},
				"--surface-foreground": {
					"hex": "#eceef3",
					"oklch": "oklch(0.95 0.0072 264)"
				},
				"--surface-secondary": {
					"hex": "#20242c",
					"oklch": "oklch(0.26 0.0168 264)"
				},
				"--surface-tertiary": {
					"hex": "#333842",
					"oklch": "oklch(0.34 0.018 264)"
				},
				"--brand-100": {
					"hex": "#e8ecfe",
					"oklch": "oklch(0.9446 0.0254 277)"
				},
				"--brand-200": {
					"hex": "#dae0fe",
					"oklch": "oklch(0.9106 0.0421 277)"
				},
				"--brand-300": {
					"hex": "#c6cefe",
					"oklch": "oklch(0.8611 0.0667 277)"
				},
				"--brand-400": {
					"hex": "#aab5fd",
					"oklch": "oklch(0.792 0.1028 277)"
				},
				"--brand-50": {
					"hex": "#f3f5ff",
					"oklch": "oklch(0.971 0.0133 277)"
				},
				"--brand-500": {
					"hex": "#94a0fd",
					"oklch": "oklch(0.735 0.1339 277)"
				},
				"--brand-600": {
					"hex": "#7680db",
					"oklch": "oklch(0.6327 0.1366 277)"
				},
				"--brand-700": {
					"hex": "#6169bf",
					"oklch": "oklch(0.5557 0.1313 277)"
				},
				"--brand-800": {
					"hex": "#4c529a",
					"oklch": "oklch(0.4706 0.1152 277)"
				},
				"--brand-900": {
					"hex": "#3e4381",
					"oklch": "oklch(0.4109 0.1018 277)"
				},
				"--brand-950": {
					"hex": "#202350",
					"oklch": "oklch(0.282 0.0804 277)"
				},
				"--brand-surface": {
					"hex": "#c5d8fe",
					"oklch": "oklch(0.88 0.0566 264)"
				},
				"--brand-surface-foreground": {
					"hex": "#272154",
					"oklch": "oklch(0.286 0.09 284)"
				},
				"--rail-accent-from": {
					"hex": "#464fcb",
					"oklch": "oklch(0.496 0.19 274)"
				},
				"--rail-accent-tint": {
					"hex": "#486be6",
					"oklch": "oklch(0.571 0.19 268)"
				},
				"--rail-accent-to": {
					"hex": "#4989fc",
					"oklch": "oklch(0.646 0.1836 261)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		},
		"description": "Saturated finance blue. The cleanest of the seven on every row.",
		"light": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#92b5fd",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#020511",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.92
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#94a0fd",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#020511",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 8.43
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#9f89fc",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#020511",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#3b2cbb",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#fafcff",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 9.02
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#1f4dc2",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.24
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#451499",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 11.58
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#e7effd",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#2a44ac",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#e3ebfd",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#354499",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#ecf2fe",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#171d28",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 15.04
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#c5d8fe",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#272154",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.21
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#94a0fd",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 2.41
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#171d28",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 16.89
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#e3ebfd",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.19
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#3b2cbb",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.27
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#3b2cbb",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.27
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#4989fc",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.26
				}
			],
			"tokens": {
				"--background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--border": {
					"hex": "#dbdee4",
					"oklch": "oklch(0.9 0.009 264)"
				},
				"--brand-accent": {
					"hex": "#b1d0fe",
					"oklch": "oklch(0.85 0.0724 258)"
				},
				"--brand-edge": {
					"hex": "#6886fc",
					"oklch": "oklch(0.656 0.177 270)"
				},
				"--brand-muted": {
					"hex": "#ecf2fe",
					"oklch": "oklch(0.96 0.018 264)"
				},
				"--brand-pale": {
					"hex": "#d5e6fe",
					"oklch": "oklch(0.92 0.0378 256)"
				},
				"--brand-primary": {
					"hex": "#3b2cbb",
					"oklch": "oklch(0.419 0.21 277)"
				},
				"--brand-primary-foreground": {
					"hex": "#fafcff",
					"oklch": "oklch(0.99 0.0045 264)"
				},
				"--brand-secondary": {
					"hex": "#e3ebfd",
					"oklch": "oklch(0.94 0.0256 264)"
				},
				"--brand-secondary-foreground": {
					"hex": "#354499",
					"oklch": "oklch(0.424 0.14 272)"
				},
				"--chip-accent-soft": {
					"hex": "#e7effd",
					"oklch": "oklch(0.95 0.0213 264)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#2a44ac",
					"oklch": "oklch(0.434 0.17 268)"
				},
				"--default": {
					"hex": "#e9ebee",
					"oklch": "oklch(0.94 0.0048 264)"
				},
				"--field-background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0 / 60%)"
				},
				"--foreground": {
					"hex": "#171d28",
					"oklch": "oklch(0.23 0.024 264)"
				},
				"--glass-opaque": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-tint": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#020511",
					"oklch": "oklch(0.1186 0.03 264)"
				},
				"--gradient-brand-from": {
					"hex": "#92b5fd",
					"oklch": "oklch(0.775 0.1105 264)"
				},
				"--gradient-brand-hover": {
					"hex": "#abb6fd",
					"oklch": "oklch(0.795 0.1011 277)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#1f4dc2",
					"oklch": "oklch(0.468 0.19 264)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#451499",
					"oklch": "oklch(0.368 0.19 290)"
				},
				"--gradient-brand-to": {
					"hex": "#9f89fc",
					"oklch": "oklch(0.7 0.1644 290)"
				},
				"--gradient-brand-via": {
					"hex": "#94a0fd",
					"oklch": "oklch(0.735 0.1339 277)"
				},
				"--muted": {
					"hex": "#5e636e",
					"oklch": "oklch(0.5 0.018 264)"
				},
				"--overlay": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#171d28",
					"oklch": "oklch(0.23 0.024 264)"
				},
				"--separator": {
					"hex": "#e1e5eb",
					"oklch": "oklch(0.92 0.009 264)"
				},
				"--surface": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--surface-foreground": {
					"hex": "#171d28",
					"oklch": "oklch(0.23 0.024 264)"
				},
				"--surface-secondary": {
					"hex": "#eef0f3",
					"oklch": "oklch(0.955 0.0048 264)"
				},
				"--surface-tertiary": {
					"hex": "#e9ebee",
					"oklch": "oklch(0.94 0.0048 264)"
				},
				"--brand-100": {
					"hex": "#e8ecfe",
					"oklch": "oklch(0.9446 0.0254 277)"
				},
				"--brand-200": {
					"hex": "#dae0fe",
					"oklch": "oklch(0.9106 0.0421 277)"
				},
				"--brand-300": {
					"hex": "#c6cefe",
					"oklch": "oklch(0.8611 0.0667 277)"
				},
				"--brand-400": {
					"hex": "#aab5fd",
					"oklch": "oklch(0.792 0.1028 277)"
				},
				"--brand-50": {
					"hex": "#f3f5ff",
					"oklch": "oklch(0.971 0.0133 277)"
				},
				"--brand-500": {
					"hex": "#94a0fd",
					"oklch": "oklch(0.735 0.1339 277)"
				},
				"--brand-600": {
					"hex": "#7680db",
					"oklch": "oklch(0.6327 0.1366 277)"
				},
				"--brand-700": {
					"hex": "#6169bf",
					"oklch": "oklch(0.5557 0.1313 277)"
				},
				"--brand-800": {
					"hex": "#4c529a",
					"oklch": "oklch(0.4706 0.1152 277)"
				},
				"--brand-900": {
					"hex": "#3e4381",
					"oklch": "oklch(0.4109 0.1018 277)"
				},
				"--brand-950": {
					"hex": "#202350",
					"oklch": "oklch(0.282 0.0804 277)"
				},
				"--brand-surface": {
					"hex": "#c5d8fe",
					"oklch": "oklch(0.88 0.0566 264)"
				},
				"--brand-surface-foreground": {
					"hex": "#272154",
					"oklch": "oklch(0.286 0.09 284)"
				},
				"--rail-accent-from": {
					"hex": "#464fcb",
					"oklch": "oklch(0.496 0.19 274)"
				},
				"--rail-accent-tint": {
					"hex": "#486be6",
					"oklch": "oklch(0.571 0.19 268)"
				},
				"--rail-accent-to": {
					"hex": "#4989fc",
					"oklch": "oklch(0.646 0.1836 261)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		}
	},
	"rabbit": {
		"accentHue": 36,
		"baseTint": 0.008,
		"dark": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#fd674f",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.18
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#fd674f",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.18
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#fd674f",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.18
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#fd9480",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 8.74
				},
				{
					"background": "--background",
					"backgroundHex": "#080504",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#fd987c",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.63
				},
				{
					"background": "--background",
					"backgroundHex": "#080504",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#e18414",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.26
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#472218",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#fda586",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#4d271d",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#faafa2",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#311f1a",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#f2edec",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 13.49
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#fccabd",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#3f1d01",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.32
				},
				{
					"background": "--background",
					"backgroundHex": "#080504",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#fd674f",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 6.99
				},
				{
					"background": "--surface",
					"backgroundHex": "#1c1614",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#f2edec",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 15.41
				},
				{
					"background": "--background",
					"backgroundHex": "#080504",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#4d271d",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.57
				},
				{
					"background": "--background",
					"backgroundHex": "#080504",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#fd9480",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.4
				},
				{
					"background": "--surface",
					"backgroundHex": "#1c1614",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#fd9480",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.28
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#da341a",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 4.56
				}
			],
			"tokens": {
				"--background": {
					"hex": "#080504",
					"oklch": "oklch(0.1186 0.008 36)"
				},
				"--border": {
					"hex": "#39312f",
					"oklch": "oklch(0.32 0.012 36)"
				},
				"--brand-accent": {
					"hex": "#8d362b",
					"oklch": "oklch(0.453 0.12 30)"
				},
				"--brand-edge": {
					"hex": "#fd8133",
					"oklch": "oklch(0.733 0.1736 49)"
				},
				"--brand-muted": {
					"hex": "#311f1a",
					"oklch": "oklch(0.26 0.03 36)"
				},
				"--brand-pale": {
					"hex": "#5a2c26",
					"oklch": "oklch(0.353 0.07 28)"
				},
				"--brand-primary": {
					"hex": "#fd9480",
					"oklch": "oklch(0.772 0.1312 31.68)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#4d271d",
					"oklch": "oklch(0.32 0.06 36)"
				},
				"--brand-secondary-foreground": {
					"hex": "#faafa2",
					"oklch": "oklch(0.822 0.09 30)"
				},
				"--chip-accent-soft": {
					"hex": "#472218",
					"oklch": "oklch(0.3 0.06 36)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#fda586",
					"oklch": "oklch(0.802 0.1139 40)"
				},
				"--default": {
					"hex": "#39312f",
					"oklch": "oklch(0.32 0.012 36)"
				},
				"--field-background": {
					"hex": "#130e0d",
					"oklch": "oklch(0.17 0.0088 36)"
				},
				"--field-border": {
					"hex": "#48403e",
					"oklch": "oklch(0.38 0.012 36)"
				},
				"--foreground": {
					"hex": "#f2edec",
					"oklch": "oklch(0.95 0.0048 36)"
				},
				"--glass-opaque": {
					"hex": "#221b19",
					"oklch": "oklch(0.23 0.0112 36)"
				},
				"--glass-opaque-strong": {
					"hex": "#27201e",
					"oklch": "oklch(0.25 0.012 36)"
				},
				"--glass-tint": {
					"hex": "#292220",
					"oklch": "oklch(0.26 0.012 36)"
				},
				"--gradient-brand-foreground": {
					"hex": "#010101",
					"oklch": "oklch(0.0736 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#fd674f",
					"oklch": "oklch(0.699 0.1871 31.68)"
				},
				"--gradient-brand-hover": {
					"hex": "#fd8d78",
					"oklch": "oklch(0.759 0.1405 31.68)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#fd987c",
					"oklch": "oklch(0.778 0.1286 36)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#e18414",
					"oklch": "oklch(0.698 0.1559 62)"
				},
				"--gradient-brand-to": {
					"hex": "#fd674f",
					"oklch": "oklch(0.699 0.1871 31.68)"
				},
				"--gradient-brand-via": {
					"hex": "#fd674f",
					"oklch": "oklch(0.699 0.1871 31.68)"
				},
				"--muted": {
					"hex": "#aca29f",
					"oklch": "oklch(0.72 0.012 36)"
				},
				"--overlay": {
					"hex": "#221b19",
					"oklch": "oklch(0.23 0.0112 36)"
				},
				"--overlay-foreground": {
					"hex": "#f2edec",
					"oklch": "oklch(0.95 0.0048 36)"
				},
				"--separator": {
					"hex": "#2e2725",
					"oklch": "oklch(0.28 0.012 36)"
				},
				"--surface": {
					"hex": "#1c1614",
					"oklch": "oklch(0.2068 0.01 36)"
				},
				"--surface-foreground": {
					"hex": "#f2edec",
					"oklch": "oklch(0.95 0.0048 36)"
				},
				"--surface-secondary": {
					"hex": "#292220",
					"oklch": "oklch(0.26 0.0112 36)"
				},
				"--surface-tertiary": {
					"hex": "#3e3634",
					"oklch": "oklch(0.34 0.012 36)"
				},
				"--brand-100": {
					"hex": "#fee3dd",
					"oklch": "oklch(0.9358 0.0317 31.68)"
				},
				"--brand-200": {
					"hex": "#fecec4",
					"oklch": "oklch(0.8907 0.0561 31.68)"
				},
				"--brand-300": {
					"hex": "#fdaf9f",
					"oklch": "oklch(0.8248 0.0956 31.68)"
				},
				"--brand-400": {
					"hex": "#fd7d67",
					"oklch": "oklch(0.7328 0.1601 31.68)"
				},
				"--brand-50": {
					"hex": "#fff2f0",
					"oklch": "oklch(0.971 0.0139 31.68)"
				},
				"--brand-500": {
					"hex": "#f55036",
					"oklch": "oklch(0.657 0.2056 31.68)"
				},
				"--brand-600": {
					"hex": "#d82c10",
					"oklch": "oklch(0.5724 0.2097 31.68)"
				},
				"--brand-700": {
					"hex": "#b92208",
					"oklch": "oklch(0.5086 0.1888 31.68)"
				},
				"--brand-800": {
					"hex": "#971a05",
					"oklch": "oklch(0.4382 0.1628 31.68)"
				},
				"--brand-900": {
					"hex": "#801404",
					"oklch": "oklch(0.3887 0.1445 31.68)"
				},
				"--brand-950": {
					"hex": "#510901",
					"oklch": "oklch(0.282 0.1053 31.68)"
				},
				"--brand-surface": {
					"hex": "#fccabd",
					"oklch": "oklch(0.88 0.06 36)"
				},
				"--brand-surface-foreground": {
					"hex": "#3f1d01",
					"oklch": "oklch(0.274 0.0655 56)"
				},
				"--rail-accent-from": {
					"hex": "#fd7d66",
					"oklch": "oklch(0.732 0.1607 31.68)"
				},
				"--rail-accent-tint": {
					"hex": "#f55036",
					"oklch": "oklch(0.657 0.2056 31.68)"
				},
				"--rail-accent-to": {
					"hex": "#da341a",
					"oklch": "oklch(0.582 0.2056 31.68)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		},
		"description": "Orange, and the one whose accent most needs keeping clear of --warning.",
		"light": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#f55036",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#000000",
					"id": "gradient-start",
					"kind": "text",
					"passes": false,
					"ratio": 6.08
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#f55036",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#000000",
					"id": "gradient-mid",
					"kind": "text",
					"passes": false,
					"ratio": 6.08
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#f55036",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#000000",
					"id": "gradient-end",
					"kind": "text",
					"passes": false,
					"ratio": 6.08
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#f55036",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": false,
					"ratio": 5.46
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#a12d07",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.25
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#5f3503",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 10.51
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#fdeae4",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#8b2f05",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#fde5e0",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#872d05",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.25
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#feeeea",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#111111",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 16.75
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#fccabd",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#3f1d01",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.32
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#f55036",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.45
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#111111",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 18.88
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#fde5e0",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.2
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#f55036",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.45
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#f55036",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.45
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#da341a",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 4.56
				}
			],
			"tokens": {
				"--background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--border": {
					"hex": "#e2dddb",
					"oklch": "oklch(0.9 0.006 36)"
				},
				"--brand-accent": {
					"hex": "#febbaf",
					"oklch": "oklch(0.85 0.0797 30)"
				},
				"--brand-edge": {
					"hex": "#f25f12",
					"oklch": "oklch(0.668 0.1956 42)"
				},
				"--brand-muted": {
					"hex": "#feeeea",
					"oklch": "oklch(0.96 0.018 36)"
				},
				"--brand-pale": {
					"hex": "#fedbd6",
					"oklch": "oklch(0.92 0.0397 28)"
				},
				"--brand-primary": {
					"hex": "#f55036",
					"oklch": "oklch(0.657 0.2056 31.68)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#fde5e0",
					"oklch": "oklch(0.94 0.0274 31.68)"
				},
				"--brand-secondary-foreground": {
					"hex": "#872d05",
					"oklch": "oklch(0.428 0.1314 39.68)"
				},
				"--chip-accent-soft": {
					"hex": "#fdeae4",
					"oklch": "oklch(0.95 0.023 36)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#8b2f05",
					"oklch": "oklch(0.438 0.1336 40)"
				},
				"--default": {
					"hex": "#edeaea",
					"oklch": "oklch(0.94 0.0032 36)"
				},
				"--field-background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0 / 60%)"
				},
				"--foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--glass-opaque": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-tint": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#000000",
					"oklch": "oklch(0.05 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#f55036",
					"oklch": "oklch(0.657 0.2056 31.68)"
				},
				"--gradient-brand-hover": {
					"hex": "#fd745c",
					"oklch": "oklch(0.717 0.1725 31.68)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#a12d07",
					"oklch": "oklch(0.474 0.1577 36)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#5f3503",
					"oklch": "oklch(0.374 0.0837 62)"
				},
				"--gradient-brand-to": {
					"hex": "#f55036",
					"oklch": "oklch(0.657 0.2056 31.68)"
				},
				"--gradient-brand-via": {
					"hex": "#f55036",
					"oklch": "oklch(0.657 0.2056 31.68)"
				},
				"--muted": {
					"hex": "#6a615f",
					"oklch": "oklch(0.5 0.012 36)"
				},
				"--overlay": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--separator": {
					"hex": "#e8e3e2",
					"oklch": "oklch(0.92 0.006 36)"
				},
				"--surface": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--surface-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--surface-secondary": {
					"hex": "#f2efef",
					"oklch": "oklch(0.955 0.0032 36)"
				},
				"--surface-tertiary": {
					"hex": "#edeaea",
					"oklch": "oklch(0.94 0.0032 36)"
				},
				"--brand-100": {
					"hex": "#fee3dd",
					"oklch": "oklch(0.9358 0.0317 31.68)"
				},
				"--brand-200": {
					"hex": "#fecec4",
					"oklch": "oklch(0.8907 0.0561 31.68)"
				},
				"--brand-300": {
					"hex": "#fdaf9f",
					"oklch": "oklch(0.8248 0.0956 31.68)"
				},
				"--brand-400": {
					"hex": "#fd7d67",
					"oklch": "oklch(0.7328 0.1601 31.68)"
				},
				"--brand-50": {
					"hex": "#fff2f0",
					"oklch": "oklch(0.971 0.0139 31.68)"
				},
				"--brand-500": {
					"hex": "#f55036",
					"oklch": "oklch(0.657 0.2056 31.68)"
				},
				"--brand-600": {
					"hex": "#d82c10",
					"oklch": "oklch(0.5724 0.2097 31.68)"
				},
				"--brand-700": {
					"hex": "#b92208",
					"oklch": "oklch(0.5086 0.1888 31.68)"
				},
				"--brand-800": {
					"hex": "#971a05",
					"oklch": "oklch(0.4382 0.1628 31.68)"
				},
				"--brand-900": {
					"hex": "#801404",
					"oklch": "oklch(0.3887 0.1445 31.68)"
				},
				"--brand-950": {
					"hex": "#510901",
					"oklch": "oklch(0.282 0.1053 31.68)"
				},
				"--brand-surface": {
					"hex": "#fccabd",
					"oklch": "oklch(0.88 0.06 36)"
				},
				"--brand-surface-foreground": {
					"hex": "#3f1d01",
					"oklch": "oklch(0.274 0.0655 56)"
				},
				"--rail-accent-from": {
					"hex": "#fd7d66",
					"oklch": "oklch(0.732 0.1607 31.68)"
				},
				"--rail-accent-tint": {
					"hex": "#f55036",
					"oklch": "oklch(0.657 0.2056 31.68)"
				},
				"--rail-accent-to": {
					"hex": "#da341a",
					"oklch": "oklch(0.582 0.2056 31.68)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		}
	},
	"custom": {
		"accentHue": 128,
		"baseTint": 0.02,
		"dark": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#89c118",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#030700",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.38
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#42bd2b",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#030700",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 8.26
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#16b164",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#030700",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.25
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#42bd2b",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#030700",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 8.26
				},
				{
					"background": "--background",
					"backgroundHex": "#040702",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#8ac218",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.46
				},
				{
					"background": "--background",
					"backgroundHex": "#040702",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#16b164",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.24
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#253310",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#9bcc72",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#2a3815",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#b9cd8b",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.26
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#202717",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#ecf0e8",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 13.34
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#cce0b6",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#02310f",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.28
				},
				{
					"background": "--background",
					"backgroundHex": "#040702",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#42bd2b",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.24
				},
				{
					"background": "--surface",
					"backgroundHex": "#141a0d",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#ecf0e8",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 15.37
				},
				{
					"background": "--background",
					"backgroundHex": "#040702",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#2a3815",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.61
				},
				{
					"background": "--background",
					"backgroundHex": "#040702",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#42bd2b",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.24
				},
				{
					"background": "--surface",
					"backgroundHex": "#141a0d",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#42bd2b",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#749810",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.27
				}
			],
			"tokens": {
				"--background": {
					"hex": "#040702",
					"oklch": "oklch(0.1186 0.02 128)"
				},
				"--border": {
					"hex": "#2e3625",
					"oklch": "oklch(0.32 0.03 128)"
				},
				"--brand-accent": {
					"hex": "#455605",
					"oklch": "oklch(0.423 0.0997 122)"
				},
				"--brand-edge": {
					"hex": "#42bd2b",
					"oklch": "oklch(0.703 0.21 141)"
				},
				"--brand-muted": {
					"hex": "#202717",
					"oklch": "oklch(0.26 0.03 128)"
				},
				"--brand-pale": {
					"hex": "#333d0d",
					"oklch": "oklch(0.34 0.07 120)"
				},
				"--brand-primary": {
					"hex": "#42bd2b",
					"oklch": "oklch(0.703 0.21 141)"
				},
				"--brand-primary-foreground": {
					"hex": "#030700",
					"oklch": "oklch(0.1186 0.03 128)"
				},
				"--brand-secondary": {
					"hex": "#2a3815",
					"oklch": "oklch(0.32 0.06 128)"
				},
				"--brand-secondary-foreground": {
					"hex": "#b9cd8b",
					"oklch": "oklch(0.816 0.09 122)"
				},
				"--chip-accent-soft": {
					"hex": "#253310",
					"oklch": "oklch(0.3 0.06 128)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#9bcc72",
					"oklch": "oklch(0.79 0.13 132)"
				},
				"--default": {
					"hex": "#2e3625",
					"oklch": "oklch(0.32 0.03 128)"
				},
				"--field-background": {
					"hex": "#0d1107",
					"oklch": "oklch(0.17 0.022 128)"
				},
				"--field-border": {
					"hex": "#3e4634",
					"oklch": "oklch(0.38 0.03 128)"
				},
				"--foreground": {
					"hex": "#ecf0e8",
					"oklch": "oklch(0.95 0.012 128)"
				},
				"--glass-opaque": {
					"hex": "#191f11",
					"oklch": "oklch(0.23 0.028 128)"
				},
				"--glass-opaque-strong": {
					"hex": "#1d2415",
					"oklch": "oklch(0.25 0.03 128)"
				},
				"--glass-tint": {
					"hex": "#202717",
					"oklch": "oklch(0.26 0.03 128)"
				},
				"--gradient-brand-foreground": {
					"hex": "#030700",
					"oklch": "oklch(0.1186 0.03 128)"
				},
				"--gradient-brand-from": {
					"hex": "#89c118",
					"oklch": "oklch(0.743 0.1885 128)"
				},
				"--gradient-brand-hover": {
					"hex": "#57d143",
					"oklch": "oklch(0.763 0.21 141)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#8ac218",
					"oklch": "oklch(0.748 0.1898 128)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#16b164",
					"oklch": "oklch(0.668 0.1635 154)"
				},
				"--gradient-brand-to": {
					"hex": "#16b164",
					"oklch": "oklch(0.668 0.1635 154)"
				},
				"--gradient-brand-via": {
					"hex": "#42bd2b",
					"oklch": "oklch(0.703 0.21 141)"
				},
				"--muted": {
					"hex": "#9fa895",
					"oklch": "oklch(0.72 0.03 128)"
				},
				"--overlay": {
					"hex": "#191f11",
					"oklch": "oklch(0.23 0.028 128)"
				},
				"--overlay-foreground": {
					"hex": "#ecf0e8",
					"oklch": "oklch(0.95 0.012 128)"
				},
				"--separator": {
					"hex": "#252c1c",
					"oklch": "oklch(0.28 0.03 128)"
				},
				"--surface": {
					"hex": "#141a0d",
					"oklch": "oklch(0.2068 0.025 128)"
				},
				"--surface-foreground": {
					"hex": "#ecf0e8",
					"oklch": "oklch(0.95 0.012 128)"
				},
				"--surface-secondary": {
					"hex": "#202718",
					"oklch": "oklch(0.26 0.028 128)"
				},
				"--surface-tertiary": {
					"hex": "#333b2a",
					"oklch": "oklch(0.34 0.03 128)"
				},
				"--brand-100": {
					"hex": "#def3da",
					"oklch": "oklch(0.941 0.0399 141)"
				},
				"--brand-200": {
					"hex": "#c4ecbd",
					"oklch": "oklch(0.9025 0.0756 141)"
				},
				"--brand-300": {
					"hex": "#a0e195",
					"oklch": "oklch(0.8462 0.1218 141)"
				},
				"--brand-400": {
					"hex": "#6fce60",
					"oklch": "oklch(0.7677 0.1722 141)"
				},
				"--brand-50": {
					"hex": "#eef9ec",
					"oklch": "oklch(0.971 0.021 141)"
				},
				"--brand-500": {
					"hex": "#42bd2b",
					"oklch": "oklch(0.703 0.21 141)"
				},
				"--brand-600": {
					"hex": "#2a9d0f",
					"oklch": "oklch(0.6079 0.1941 141)"
				},
				"--brand-700": {
					"hex": "#21840b",
					"oklch": "oklch(0.5363 0.1713 141)"
				},
				"--brand-800": {
					"hex": "#196a07",
					"oklch": "oklch(0.4573 0.1461 141)"
				},
				"--brand-900": {
					"hex": "#135804",
					"oklch": "oklch(0.4018 0.1285 141)"
				},
				"--brand-950": {
					"hex": "#073301",
					"oklch": "oklch(0.282 0.0905 141)"
				},
				"--brand-surface": {
					"hex": "#cce0b6",
					"oklch": "oklch(0.88 0.06 128)"
				},
				"--brand-surface-foreground": {
					"hex": "#02310f",
					"oklch": "oklch(0.274 0.0773 148)"
				},
				"--rail-accent-from": {
					"hex": "#2d6f08",
					"oklch": "oklch(0.48 0.144 138)"
				},
				"--rail-accent-tint": {
					"hex": "#50840c",
					"oklch": "oklch(0.555 0.1496 132)"
				},
				"--rail-accent-to": {
					"hex": "#749810",
					"oklch": "oklch(0.63 0.1537 125)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		},
		"description": "Added from the theme customizer.",
		"light": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#89c118",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#030700",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.38
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#42bd2b",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#030700",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 8.26
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#16b164",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#030700",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.25
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#125604",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#fbfcf9",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 8.64
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#426006",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.22
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#044725",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 10.86
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#e8f3db",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#335705",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.29
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#e4f0d7",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#295705",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#eef4e8",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#17200b",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 15.01
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#cce0b6",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#02310f",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.28
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#42bd2b",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 2.45
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#17200b",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 16.82
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#e4f0d7",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.18
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#125604",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.9
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#125604",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.9
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#749810",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 3.27
				}
			],
			"tokens": {
				"--background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--border": {
					"hex": "#dbe0d6",
					"oklch": "oklch(0.9 0.015 128)"
				},
				"--brand-accent": {
					"hex": "#c4d895",
					"oklch": "oklch(0.85 0.09 122)"
				},
				"--brand-edge": {
					"hex": "#599f11",
					"oklch": "oklch(0.632 0.176 134)"
				},
				"--brand-muted": {
					"hex": "#eef4e8",
					"oklch": "oklch(0.96 0.018 128)"
				},
				"--brand-pale": {
					"hex": "#e0eac5",
					"oklch": "oklch(0.92 0.05 120)"
				},
				"--brand-primary": {
					"hex": "#125604",
					"oklch": "oklch(0.397 0.127 141)"
				},
				"--brand-primary-foreground": {
					"hex": "#fbfcf9",
					"oklch": "oklch(0.99 0.005 128)"
				},
				"--brand-secondary": {
					"hex": "#e4f0d7",
					"oklch": "oklch(0.94 0.035 128)"
				},
				"--brand-secondary-foreground": {
					"hex": "#295705",
					"oklch": "oklch(0.408 0.1179 136)"
				},
				"--chip-accent-soft": {
					"hex": "#e8f3db",
					"oklch": "oklch(0.95 0.035 128)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#335705",
					"oklch": "oklch(0.414 0.1117 132)"
				},
				"--default": {
					"hex": "#e9ece7",
					"oklch": "oklch(0.94 0.008 128)"
				},
				"--field-background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0 / 60%)"
				},
				"--foreground": {
					"hex": "#17200b",
					"oklch": "oklch(0.23 0.04 128)"
				},
				"--glass-opaque": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-tint": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#030700",
					"oklch": "oklch(0.1186 0.03 128)"
				},
				"--gradient-brand-from": {
					"hex": "#89c118",
					"oklch": "oklch(0.743 0.1885 128)"
				},
				"--gradient-brand-hover": {
					"hex": "#57d143",
					"oklch": "oklch(0.763 0.21 141)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#426006",
					"oklch": "oklch(0.45 0.1143 128)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#044725",
					"oklch": "oklch(0.35 0.0858 154)"
				},
				"--gradient-brand-to": {
					"hex": "#16b164",
					"oklch": "oklch(0.668 0.1635 154)"
				},
				"--gradient-brand-via": {
					"hex": "#42bd2b",
					"oklch": "oklch(0.703 0.21 141)"
				},
				"--muted": {
					"hex": "#5e6755",
					"oklch": "oklch(0.5 0.03 128)"
				},
				"--overlay": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#17200b",
					"oklch": "oklch(0.23 0.04 128)"
				},
				"--separator": {
					"hex": "#e2e7dc",
					"oklch": "oklch(0.92 0.015 128)"
				},
				"--surface": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--surface-foreground": {
					"hex": "#17200b",
					"oklch": "oklch(0.23 0.04 128)"
				},
				"--surface-secondary": {
					"hex": "#eef1ec",
					"oklch": "oklch(0.955 0.008 128)"
				},
				"--surface-tertiary": {
					"hex": "#e9ece7",
					"oklch": "oklch(0.94 0.008 128)"
				},
				"--brand-100": {
					"hex": "#def3da",
					"oklch": "oklch(0.941 0.0399 141)"
				},
				"--brand-200": {
					"hex": "#c4ecbd",
					"oklch": "oklch(0.9025 0.0756 141)"
				},
				"--brand-300": {
					"hex": "#a0e195",
					"oklch": "oklch(0.8462 0.1218 141)"
				},
				"--brand-400": {
					"hex": "#6fce60",
					"oklch": "oklch(0.7677 0.1722 141)"
				},
				"--brand-50": {
					"hex": "#eef9ec",
					"oklch": "oklch(0.971 0.021 141)"
				},
				"--brand-500": {
					"hex": "#42bd2b",
					"oklch": "oklch(0.703 0.21 141)"
				},
				"--brand-600": {
					"hex": "#2a9d0f",
					"oklch": "oklch(0.6079 0.1941 141)"
				},
				"--brand-700": {
					"hex": "#21840b",
					"oklch": "oklch(0.5363 0.1713 141)"
				},
				"--brand-800": {
					"hex": "#196a07",
					"oklch": "oklch(0.4573 0.1461 141)"
				},
				"--brand-900": {
					"hex": "#135804",
					"oklch": "oklch(0.4018 0.1285 141)"
				},
				"--brand-950": {
					"hex": "#073301",
					"oklch": "oklch(0.282 0.0905 141)"
				},
				"--brand-surface": {
					"hex": "#cce0b6",
					"oklch": "oklch(0.88 0.06 128)"
				},
				"--brand-surface-foreground": {
					"hex": "#02310f",
					"oklch": "oklch(0.274 0.0773 148)"
				},
				"--rail-accent-from": {
					"hex": "#2d6f08",
					"oklch": "oklch(0.48 0.144 138)"
				},
				"--rail-accent-tint": {
					"hex": "#50840c",
					"oklch": "oklch(0.555 0.1496 132)"
				},
				"--rail-accent-to": {
					"hex": "#749810",
					"oklch": "oklch(0.63 0.1537 125)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		}
	},
	"revolve": {
		"accentHue": 161,
		"baseTint": 0,
		"dark": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#3aab79",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#3aab79",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#3aab79",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.23
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#46cb90",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 9.17
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#1dce8d",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.96
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#17ada2",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.31
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#093724",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#5ad5a6",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.26
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#0f3c29",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#93d4a9",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#16291f",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#eeeeee",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 13.2
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#b5e4cb",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#02302a",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.23
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#3aab79",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.06
				},
				{
					"background": "--surface",
					"backgroundHex": "#171717",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#eeeeee",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 15.45
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#0f3c29",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.64
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#46cb90",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.9
				},
				{
					"background": "--surface",
					"backgroundHex": "#171717",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#46cb90",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.71
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#012113",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 16.66
				}
			],
			"tokens": {
				"--background": {
					"hex": "#050505",
					"oklch": "oklch(0.1186 0 0)"
				},
				"--border": {
					"hex": "#333333",
					"oklch": "oklch(0.32 0 0)"
				},
				"--brand-accent": {
					"hex": "#075f35",
					"oklch": "oklch(0.429 0.103 155)"
				},
				"--brand-edge": {
					"hex": "#19bb9b",
					"oklch": "oklch(0.709 0.1309 174)"
				},
				"--brand-muted": {
					"hex": "#16291f",
					"oklch": "oklch(0.26 0.03 161)"
				},
				"--brand-pale": {
					"hex": "#154226",
					"oklch": "oklch(0.34 0.07 153)"
				},
				"--brand-primary": {
					"hex": "#46cb90",
					"oklch": "oklch(0.754 0.1435 160.64)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#0f3c29",
					"oklch": "oklch(0.32 0.06 161)"
				},
				"--brand-secondary-foreground": {
					"hex": "#93d4a9",
					"oklch": "oklch(0.814 0.09 155)"
				},
				"--chip-accent-soft": {
					"hex": "#093724",
					"oklch": "oklch(0.3 0.06 161)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#5ad5a6",
					"oklch": "oklch(0.79 0.13 165)"
				},
				"--default": {
					"hex": "#333333",
					"oklch": "oklch(0.32 0 0)"
				},
				"--field-background": {
					"hex": "#0f0f0f",
					"oklch": "oklch(0.17 0 0)"
				},
				"--field-border": {
					"hex": "#424242",
					"oklch": "oklch(0.38 0 0)"
				},
				"--foreground": {
					"hex": "#eeeeee",
					"oklch": "oklch(0.95 0 0)"
				},
				"--glass-opaque": {
					"hex": "#1d1d1d",
					"oklch": "oklch(0.23 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#222222",
					"oklch": "oklch(0.25 0 0)"
				},
				"--glass-tint": {
					"hex": "#242424",
					"oklch": "oklch(0.26 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#010101",
					"oklch": "oklch(0.0736 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#3aab79",
					"oklch": "oklch(0.6649 0.1265 160.64)"
				},
				"--gradient-brand-hover": {
					"hex": "#50be8b",
					"oklch": "oklch(0.7249 0.1265 160.64)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#1dce8d",
					"oklch": "oklch(0.754 0.1629 161)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#17ada2",
					"oklch": "oklch(0.674 0.1142 187)"
				},
				"--gradient-brand-to": {
					"hex": "#3aab79",
					"oklch": "oklch(0.6649 0.1265 160.64)"
				},
				"--gradient-brand-via": {
					"hex": "#3aab79",
					"oklch": "oklch(0.6649 0.1265 160.64)"
				},
				"--muted": {
					"hex": "#a4a4a4",
					"oklch": "oklch(0.72 0 0)"
				},
				"--overlay": {
					"hex": "#1d1d1d",
					"oklch": "oklch(0.23 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#eeeeee",
					"oklch": "oklch(0.95 0 0)"
				},
				"--separator": {
					"hex": "#292929",
					"oklch": "oklch(0.28 0 0)"
				},
				"--surface": {
					"hex": "#171717",
					"oklch": "oklch(0.2068 0 0)"
				},
				"--surface-foreground": {
					"hex": "#eeeeee",
					"oklch": "oklch(0.95 0 0)"
				},
				"--surface-secondary": {
					"hex": "#242424",
					"oklch": "oklch(0.26 0 0)"
				},
				"--surface-tertiary": {
					"hex": "#383838",
					"oklch": "oklch(0.34 0 0)"
				},
				"--brand-100": {
					"hex": "#e3ebe6",
					"oklch": "oklch(0.932 0.0107 160.64)"
				},
				"--brand-200": {
					"hex": "#cddcd4",
					"oklch": "oklch(0.882 0.0202 160.64)"
				},
				"--brand-300": {
					"hex": "#afc7ba",
					"oklch": "oklch(0.809 0.0325 160.64)"
				},
				"--brand-400": {
					"hex": "#88aa97",
					"oklch": "oklch(0.707 0.046 160.64)"
				},
				"--brand-50": {
					"hex": "#f2f7f4",
					"oklch": "oklch(0.971 0.0056 160.64)"
				},
				"--brand-500": {
					"hex": "#69927c",
					"oklch": "oklch(0.623 0.0561 160.64)"
				},
				"--brand-600": {
					"hex": "#527b65",
					"oklch": "oklch(0.546 0.0572 160.64)"
				},
				"--brand-700": {
					"hex": "#436a55",
					"oklch": "oklch(0.488 0.055 160.64)"
				},
				"--brand-800": {
					"hex": "#365745",
					"oklch": "oklch(0.424 0.0483 160.64)"
				},
				"--brand-900": {
					"hex": "#2d493b",
					"oklch": "oklch(0.379 0.0426 160.64)"
				},
				"--brand-950": {
					"hex": "#1a2f24",
					"oklch": "oklch(0.282 0.0337 160.64)"
				},
				"--brand-surface": {
					"hex": "#b5e4cb",
					"oklch": "oklch(0.88 0.06 161)"
				},
				"--brand-surface-foreground": {
					"hex": "#02302a",
					"oklch": "oklch(0.278 0.0488 181)"
				},
				"--rail-accent-from": {
					"hex": "#224936",
					"oklch": "oklch(0.3699 0.0561 160.64)"
				},
				"--rail-accent-tint": {
					"hex": "#0c3523",
					"oklch": "oklch(0.2949 0.0561 160.64)"
				},
				"--rail-accent-to": {
					"hex": "#012113",
					"oklch": "oklch(0.2199 0.0482 160.64)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		},
		"description": "Supplied by a designer - measured, not solved.",
		"light": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#0c3523",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 13.55
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#0c3523",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 13.55
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#0c3523",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 13.55
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#0c3523",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#ffffff",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 13.55
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#086442",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#03433f",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 11.17
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#dbf6e7",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#065a40",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#d8f3e3",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#065742",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.28
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#e8f6ee",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#111111",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 16.94
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#b5e4cb",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#02302a",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.23
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#0c3523",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 13.55
				},
				{
					"background": "--surface",
					"backgroundHex": "#fbf7f7",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#111111",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 17.75
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#d8f3e3",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.17
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#0c3523",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 13.55
				},
				{
					"background": "--surface",
					"backgroundHex": "#fbf7f7",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#0c3523",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 12.74
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#012113",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 16.66
				}
			],
			"tokens": {
				"--background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--border": {
					"hex": "#dedede",
					"oklch": "oklch(0.9 0 0)"
				},
				"--brand-accent": {
					"hex": "#9ee0b4",
					"oklch": "oklch(0.85 0.09 155)"
				},
				"--brand-edge": {
					"hex": "#14a179",
					"oklch": "oklch(0.632 0.1257 167)"
				},
				"--brand-muted": {
					"hex": "#e8f6ee",
					"oklch": "oklch(0.96 0.018 161)"
				},
				"--brand-pale": {
					"hex": "#ccefd5",
					"oklch": "oklch(0.92 0.05 153)"
				},
				"--brand-primary": {
					"hex": "#0c3523",
					"oklch": "oklch(0.2949 0.0561 160.64)"
				},
				"--brand-primary-foreground": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--brand-secondary": {
					"hex": "#d8f3e3",
					"oklch": "oklch(0.94 0.035 160.64)"
				},
				"--brand-secondary-foreground": {
					"hex": "#065742",
					"oklch": "oklch(0.408 0.0797 168.64)"
				},
				"--chip-accent-soft": {
					"hex": "#dbf6e7",
					"oklch": "oklch(0.95 0.035 161)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#065a40",
					"oklch": "oklch(0.416 0.085 165)"
				},
				"--default": {
					"hex": "#ebebeb",
					"oklch": "oklch(0.94 0 0)"
				},
				"--field-background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0 / 60%)"
				},
				"--foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--glass-opaque": {
					"hex": "#fbf7f7",
					"oklch": "oklch(0.9792 0.0043 17.23)"
				},
				"--glass-opaque-strong": {
					"hex": "#fbf7f7",
					"oklch": "oklch(0.9792 0.0043 17.23)"
				},
				"--glass-tint": {
					"hex": "#fbf7f7",
					"oklch": "oklch(0.9792 0.0043 17.23)"
				},
				"--gradient-brand-foreground": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#0c3523",
					"oklch": "oklch(0.2949 0.0561 160.64)"
				},
				"--gradient-brand-hover": {
					"hex": "#012516",
					"oklch": "oklch(0.2349 0.0514 160.64)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#086442",
					"oklch": "oklch(0.446 0.0964 161)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#03433f",
					"oklch": "oklch(0.346 0.0588 187)"
				},
				"--gradient-brand-to": {
					"hex": "#0c3523",
					"oklch": "oklch(0.2949 0.0561 160.64)"
				},
				"--gradient-brand-via": {
					"hex": "#0c3523",
					"oklch": "oklch(0.2949 0.0561 160.64)"
				},
				"--muted": {
					"hex": "#636363",
					"oklch": "oklch(0.5 0 0)"
				},
				"--overlay": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--separator": {
					"hex": "#e4e4e4",
					"oklch": "oklch(0.92 0 0)"
				},
				"--surface": {
					"hex": "#fbf7f7",
					"oklch": "oklch(0.9792 0.0043 17.23)"
				},
				"--surface-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--surface-secondary": {
					"hex": "#f0f0f0",
					"oklch": "oklch(0.955 0 0)"
				},
				"--surface-tertiary": {
					"hex": "#ebebeb",
					"oklch": "oklch(0.94 0 0)"
				},
				"--brand-100": {
					"hex": "#e3ebe6",
					"oklch": "oklch(0.932 0.0107 160.64)"
				},
				"--brand-200": {
					"hex": "#cddcd4",
					"oklch": "oklch(0.882 0.0202 160.64)"
				},
				"--brand-300": {
					"hex": "#afc7ba",
					"oklch": "oklch(0.809 0.0325 160.64)"
				},
				"--brand-400": {
					"hex": "#88aa97",
					"oklch": "oklch(0.707 0.046 160.64)"
				},
				"--brand-50": {
					"hex": "#f2f7f4",
					"oklch": "oklch(0.971 0.0056 160.64)"
				},
				"--brand-500": {
					"hex": "#69927c",
					"oklch": "oklch(0.623 0.0561 160.64)"
				},
				"--brand-600": {
					"hex": "#527b65",
					"oklch": "oklch(0.546 0.0572 160.64)"
				},
				"--brand-700": {
					"hex": "#436a55",
					"oklch": "oklch(0.488 0.055 160.64)"
				},
				"--brand-800": {
					"hex": "#365745",
					"oklch": "oklch(0.424 0.0483 160.64)"
				},
				"--brand-900": {
					"hex": "#2d493b",
					"oklch": "oklch(0.379 0.0426 160.64)"
				},
				"--brand-950": {
					"hex": "#1a2f24",
					"oklch": "oklch(0.282 0.0337 160.64)"
				},
				"--brand-surface": {
					"hex": "#b5e4cb",
					"oklch": "oklch(0.88 0.06 161)"
				},
				"--brand-surface-foreground": {
					"hex": "#02302a",
					"oklch": "oklch(0.278 0.0488 181)"
				},
				"--rail-accent-from": {
					"hex": "#224936",
					"oklch": "oklch(0.3699 0.0561 160.64)"
				},
				"--rail-accent-tint": {
					"hex": "#0c3523",
					"oklch": "oklch(0.2949 0.0561 160.64)"
				},
				"--rail-accent-to": {
					"hex": "#012113",
					"oklch": "oklch(0.2199 0.0482 160.64)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		}
	},
	"irms": {
		"accentHue": 28,
		"baseTint": 0,
		"dark": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#fd6758",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#fd6758",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#fd6758",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#010101",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#fd9486",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#111111",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 8.77
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#fd988b",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 9.74
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#ee7c14",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.3
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#47211c",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#fda391",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.2
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#4d2621",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#faaeab",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.25
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#311e1c",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#eeeeee",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 13.57
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#fdc9c2",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#441a01",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.26
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#fd6758",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.04
				},
				{
					"background": "--surface",
					"backgroundHex": "#171717",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#eeeeee",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 15.45
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#4d2621",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.56
				},
				{
					"background": "--background",
					"backgroundHex": "#050505",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#fd9486",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.46
				},
				{
					"background": "--surface",
					"backgroundHex": "#171717",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#fd9486",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 8.32
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#8e0809",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.35
				}
			],
			"tokens": {
				"--background": {
					"hex": "#050505",
					"oklch": "oklch(0.1186 0 0)"
				},
				"--border": {
					"hex": "#333333",
					"oklch": "oklch(0.32 0 0)"
				},
				"--brand-accent": {
					"hex": "#8d3537",
					"oklch": "oklch(0.455 0.12 22)"
				},
				"--brand-edge": {
					"hex": "#fd8151",
					"oklch": "oklch(0.735 0.1637 41)"
				},
				"--brand-muted": {
					"hex": "#311e1c",
					"oklch": "oklch(0.26 0.03 28)"
				},
				"--brand-pale": {
					"hex": "#5b2b2c",
					"oklch": "oklch(0.355 0.07 20)"
				},
				"--brand-primary": {
					"hex": "#fd9486",
					"oklch": "oklch(0.774 0.129 28.38)"
				},
				"--brand-primary-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--brand-secondary": {
					"hex": "#4d2621",
					"oklch": "oklch(0.32 0.06 28)"
				},
				"--brand-secondary-foreground": {
					"hex": "#faaeab",
					"oklch": "oklch(0.822 0.09 22)"
				},
				"--chip-accent-soft": {
					"hex": "#47211c",
					"oklch": "oklch(0.3 0.06 28)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#fda391",
					"oklch": "oklch(0.802 0.1106 32)"
				},
				"--default": {
					"hex": "#333333",
					"oklch": "oklch(0.32 0 0)"
				},
				"--field-background": {
					"hex": "#0f0f0f",
					"oklch": "oklch(0.17 0 0)"
				},
				"--field-border": {
					"hex": "#424242",
					"oklch": "oklch(0.38 0 0)"
				},
				"--foreground": {
					"hex": "#eeeeee",
					"oklch": "oklch(0.95 0 0)"
				},
				"--glass-opaque": {
					"hex": "#1d1d1d",
					"oklch": "oklch(0.23 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#222222",
					"oklch": "oklch(0.25 0 0)"
				},
				"--glass-tint": {
					"hex": "#242424",
					"oklch": "oklch(0.26 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#010101",
					"oklch": "oklch(0.0736 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#fd6758",
					"oklch": "oklch(0.7 0.1854 28.38)"
				},
				"--gradient-brand-hover": {
					"hex": "#fd8c7e",
					"oklch": "oklch(0.76 0.139 28.38)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#fd988b",
					"oklch": "oklch(0.782 0.1234 28)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#ee7c14",
					"oklch": "oklch(0.702 0.1707 54)"
				},
				"--gradient-brand-to": {
					"hex": "#fd6758",
					"oklch": "oklch(0.7 0.1854 28.38)"
				},
				"--gradient-brand-via": {
					"hex": "#fd6758",
					"oklch": "oklch(0.7 0.1854 28.38)"
				},
				"--muted": {
					"hex": "#a4a4a4",
					"oklch": "oklch(0.72 0 0)"
				},
				"--overlay": {
					"hex": "#1d1d1d",
					"oklch": "oklch(0.23 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#eeeeee",
					"oklch": "oklch(0.95 0 0)"
				},
				"--separator": {
					"hex": "#292929",
					"oklch": "oklch(0.28 0 0)"
				},
				"--surface": {
					"hex": "#171717",
					"oklch": "oklch(0.2068 0 0)"
				},
				"--surface-foreground": {
					"hex": "#eeeeee",
					"oklch": "oklch(0.95 0 0)"
				},
				"--surface-secondary": {
					"hex": "#242424",
					"oklch": "oklch(0.26 0 0)"
				},
				"--surface-tertiary": {
					"hex": "#383838",
					"oklch": "oklch(0.34 0 0)"
				},
				"--brand-100": {
					"hex": "#fbdbd6",
					"oklch": "oklch(0.9164 0.0365 28.38)"
				},
				"--brand-200": {
					"hex": "#f7bcb3",
					"oklch": "oklch(0.8465 0.0692 28.38)"
				},
				"--brand-300": {
					"hex": "#ea9084",
					"oklch": "oklch(0.7443 0.1114 28.38)"
				},
				"--brand-400": {
					"hex": "#ce5447",
					"oklch": "oklch(0.6016 0.1576 28.38)"
				},
				"--brand-50": {
					"hex": "#fff2f0",
					"oklch": "oklch(0.971 0.0138 28.38)"
				},
				"--brand-500": {
					"hex": "#b20d0e",
					"oklch": "oklch(0.484 0.1922 28.38)"
				},
				"--brand-600": {
					"hex": "#9c0a0b",
					"oklch": "oklch(0.4384 0.1742 28.38)"
				},
				"--brand-700": {
					"hex": "#8b0708",
					"oklch": "oklch(0.404 0.1606 28.38)"
				},
				"--brand-800": {
					"hex": "#7a0506",
					"oklch": "oklch(0.3661 0.1456 28.38)"
				},
				"--brand-900": {
					"hex": "#6d0405",
					"oklch": "oklch(0.3395 0.135 28.38)"
				},
				"--brand-950": {
					"hex": "#540203",
					"oklch": "oklch(0.282 0.1124 28.38)"
				},
				"--brand-surface": {
					"hex": "#fdc9c2",
					"oklch": "oklch(0.88 0.06 28)"
				},
				"--brand-surface-foreground": {
					"hex": "#441a01",
					"oklch": "oklch(0.278 0.0739 48)"
				},
				"--rail-accent-from": {
					"hex": "#cd322a",
					"oklch": "oklch(0.559 0.1922 28.38)"
				},
				"--rail-accent-tint": {
					"hex": "#b20d0e",
					"oklch": "oklch(0.484 0.1922 28.38)"
				},
				"--rail-accent-to": {
					"hex": "#8e0809",
					"oklch": "oklch(0.409 0.1626 28.38)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		},
		"description": "Supplied by a designer - measured, not solved.",
		"light": {
			"measured": [
				{
					"background": "--gradient-brand-from",
					"backgroundHex": "#b20d0e",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.1
				},
				{
					"background": "--gradient-brand-via",
					"backgroundHex": "#b20d0e",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-mid",
					"kind": "text",
					"passes": true,
					"ratio": 7.1
				},
				{
					"background": "--gradient-brand-to",
					"backgroundHex": "#b20d0e",
					"bar": 7,
					"foreground": "--gradient-brand-foreground",
					"foregroundHex": "#ffffff",
					"id": "gradient-end",
					"kind": "text",
					"passes": true,
					"ratio": 7.1
				},
				{
					"background": "--brand-primary",
					"backgroundHex": "#b20d0e",
					"bar": 7,
					"foreground": "--brand-primary-foreground",
					"foregroundHex": "#ffffff",
					"id": "brand-solid",
					"kind": "text",
					"passes": true,
					"ratio": 7.1
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-from",
					"foregroundHex": "#b00d10",
					"id": "wordmark-start",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--gradient-brand-ink-to",
					"foregroundHex": "#673203",
					"id": "wordmark-end",
					"kind": "text",
					"passes": true,
					"ratio": 10.32
				},
				{
					"background": "--chip-accent-soft",
					"backgroundHex": "#fde9e6",
					"bar": 7,
					"foreground": "--chip-accent-soft-foreground",
					"foregroundHex": "#981c05",
					"id": "chip-soft",
					"kind": "text",
					"passes": true,
					"ratio": 7.18
				},
				{
					"background": "--brand-secondary",
					"backgroundHex": "#fde5e1",
					"bar": 7,
					"foreground": "--brand-secondary-foreground",
					"foregroundHex": "#8c2807",
					"id": "brand-secondary",
					"kind": "text",
					"passes": true,
					"ratio": 7.21
				},
				{
					"background": "--brand-muted",
					"backgroundHex": "#feeeeb",
					"bar": 7,
					"foreground": "--foreground",
					"foregroundHex": "#111111",
					"id": "brand-muted",
					"kind": "text",
					"passes": true,
					"ratio": 16.76
				},
				{
					"background": "--brand-surface",
					"backgroundHex": "#fdc9c2",
					"bar": 7,
					"foreground": "--brand-surface-foreground",
					"foregroundHex": "#441a01",
					"id": "brand-surface",
					"kind": "text",
					"passes": true,
					"ratio": 10.26
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--gradient-brand-via",
					"foregroundHex": "#b20d0e",
					"id": "brand-fill-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.1
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 7,
					"foreground": "--surface-foreground",
					"foregroundHex": "#111111",
					"id": "copy-on-card",
					"kind": "text",
					"passes": true,
					"ratio": 18.88
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-secondary",
					"foregroundHex": "#fde5e1",
					"id": "secondary-fill-on-page",
					"kind": "non-text",
					"passes": false,
					"ratio": 1.2
				},
				{
					"background": "--background",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#b20d0e",
					"id": "control-on-page",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.1
				},
				{
					"background": "--surface",
					"backgroundHex": "#ffffff",
					"bar": 3,
					"foreground": "--brand-primary",
					"foregroundHex": "#b20d0e",
					"id": "control-on-card",
					"kind": "non-text",
					"passes": true,
					"ratio": 7.1
				},
				{
					"background": "--rail-accent-to",
					"backgroundHex": "#8e0809",
					"bar": 3,
					"foreground": "--rail-foreground",
					"foregroundHex": "#fcfcfc",
					"id": "rail-glyph",
					"kind": "non-text",
					"passes": true,
					"ratio": 9.35
				}
			],
			"tokens": {
				"--background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--border": {
					"hex": "#dedede",
					"oklch": "oklch(0.9 0 0)"
				},
				"--brand-accent": {
					"hex": "#febab7",
					"oklch": "oklch(0.85 0.0792 22)"
				},
				"--brand-edge": {
					"hex": "#fc542f",
					"oklch": "oklch(0.672 0.21 34)"
				},
				"--brand-muted": {
					"hex": "#feeeeb",
					"oklch": "oklch(0.96 0.018 28)"
				},
				"--brand-pale": {
					"hex": "#fedbda",
					"oklch": "oklch(0.92 0.0396 20)"
				},
				"--brand-primary": {
					"hex": "#b20d0e",
					"oklch": "oklch(0.484 0.1922 28.38)"
				},
				"--brand-primary-foreground": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--brand-secondary": {
					"hex": "#fde5e1",
					"oklch": "oklch(0.94 0.0272 28.38)"
				},
				"--brand-secondary-foreground": {
					"hex": "#8c2807",
					"oklch": "oklch(0.43 0.14 36.38)"
				},
				"--chip-accent-soft": {
					"hex": "#fde9e6",
					"oklch": "oklch(0.95 0.0225 28)"
				},
				"--chip-accent-soft-foreground": {
					"hex": "#981c05",
					"oklch": "oklch(0.44 0.162 32)"
				},
				"--default": {
					"hex": "#ebebeb",
					"oklch": "oklch(0.94 0 0)"
				},
				"--field-background": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0 / 60%)"
				},
				"--foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--glass-opaque": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-opaque-strong": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--glass-tint": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-foreground": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--gradient-brand-from": {
					"hex": "#b20d0e",
					"oklch": "oklch(0.484 0.1922 28.38)"
				},
				"--gradient-brand-hover": {
					"hex": "#95090a",
					"oklch": "oklch(0.424 0.1685 28.38)"
				},
				"--gradient-brand-ink-from": {
					"hex": "#b00d10",
					"oklch": "oklch(0.48 0.19 28)"
				},
				"--gradient-brand-ink-to": {
					"hex": "#673203",
					"oklch": "oklch(0.38 0.0926 54)"
				},
				"--gradient-brand-to": {
					"hex": "#b20d0e",
					"oklch": "oklch(0.484 0.1922 28.38)"
				},
				"--gradient-brand-via": {
					"hex": "#b20d0e",
					"oklch": "oklch(0.484 0.1922 28.38)"
				},
				"--muted": {
					"hex": "#636363",
					"oklch": "oklch(0.5 0 0)"
				},
				"--overlay": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--overlay-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--separator": {
					"hex": "#e4e4e4",
					"oklch": "oklch(0.92 0 0)"
				},
				"--surface": {
					"hex": "#ffffff",
					"oklch": "oklch(1 0 0)"
				},
				"--surface-foreground": {
					"hex": "#111111",
					"oklch": "oklch(0.1776 0 0)"
				},
				"--surface-secondary": {
					"hex": "#f0f0f0",
					"oklch": "oklch(0.955 0 0)"
				},
				"--surface-tertiary": {
					"hex": "#ebebeb",
					"oklch": "oklch(0.94 0 0)"
				},
				"--brand-100": {
					"hex": "#fbdbd6",
					"oklch": "oklch(0.9164 0.0365 28.38)"
				},
				"--brand-200": {
					"hex": "#f7bcb3",
					"oklch": "oklch(0.8465 0.0692 28.38)"
				},
				"--brand-300": {
					"hex": "#ea9084",
					"oklch": "oklch(0.7443 0.1114 28.38)"
				},
				"--brand-400": {
					"hex": "#ce5447",
					"oklch": "oklch(0.6016 0.1576 28.38)"
				},
				"--brand-50": {
					"hex": "#fff2f0",
					"oklch": "oklch(0.971 0.0138 28.38)"
				},
				"--brand-500": {
					"hex": "#b20d0e",
					"oklch": "oklch(0.484 0.1922 28.38)"
				},
				"--brand-600": {
					"hex": "#9c0a0b",
					"oklch": "oklch(0.4384 0.1742 28.38)"
				},
				"--brand-700": {
					"hex": "#8b0708",
					"oklch": "oklch(0.404 0.1606 28.38)"
				},
				"--brand-800": {
					"hex": "#7a0506",
					"oklch": "oklch(0.3661 0.1456 28.38)"
				},
				"--brand-900": {
					"hex": "#6d0405",
					"oklch": "oklch(0.3395 0.135 28.38)"
				},
				"--brand-950": {
					"hex": "#540203",
					"oklch": "oklch(0.282 0.1124 28.38)"
				},
				"--brand-surface": {
					"hex": "#fdc9c2",
					"oklch": "oklch(0.88 0.06 28)"
				},
				"--brand-surface-foreground": {
					"hex": "#441a01",
					"oklch": "oklch(0.278 0.0739 48)"
				},
				"--rail-accent-from": {
					"hex": "#cd322a",
					"oklch": "oklch(0.559 0.1922 28.38)"
				},
				"--rail-accent-tint": {
					"hex": "#b20d0e",
					"oklch": "oklch(0.484 0.1922 28.38)"
				},
				"--rail-accent-to": {
					"hex": "#8e0809",
					"oklch": "oklch(0.409 0.1626 28.38)"
				},
				"--rail-foreground": {
					"hex": "#fcfcfc",
					"oklch": "oklch(0.99 0 0)"
				}
			}
		}
	}
} as const;
