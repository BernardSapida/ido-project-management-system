import { Card, Separator } from "@heroui/react";
import { Palette, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { AppButton } from "../AppButton";
import type { ChipEmphasis, ChipTone } from "../AppChip";
import { AppChip } from "../AppChip";
import { AppGlassCard } from "../AppGlassCard";
import { AppGradientIconTile } from "../AppGradientIconTile";

/**
 * Swatches name their token, not a value.
 *
 * They used to carry a literal beside each one ("#006fee") and those literals
 * went stale the moment the palette moved - which on a page whose whole job is
 * "a token regression is visible here" is the worst possible thing to print.
 * The live resolved value is read off the document instead, so what is on
 * screen is what the browser is painting.
 */
/* Two brand steps, not four. `--brand-deep` and `--brand-bright` were removed:
   the brand is one colour, plus the pale ground it is tinted against. See the
   note in the package's tokens.css. */
const COLORS = [
	{ token: "--brand-primary", var: "bg-primary" },
	{ token: "--brand-pale", var: "bg-brand-pale" },
	{ token: "--background", var: "bg-background" },
	{ token: "--foreground", var: "bg-foreground" },
	{ token: "--border", var: "bg-border" },
	{ token: "--danger", var: "bg-destructive" },
];

/**
 * The brand ramp. Tailwind's eleven steps, on this palette's hue.
 *
 * Every class is written out in full and never composed as `bg-app-brand-${n}`.
 * Tailwind scans source for COMPLETE class names, so a class built from a
 * variable generates no CSS at all and the swatch would render transparent -
 * which on this page would read as a missing token rather than as the build
 * error it actually is.
 *
 * The steps are the one thing here that does NOT move between light and dark.
 * That is deliberate and it is stated on the section, because this page's whole
 * claim is that a swatch which stops moving with the theme is a bug.
 */
const BRAND_RAMP = [
	{ fill: "bg-app-brand-50", step: "50", token: "--brand-50" },
	{ fill: "bg-app-brand-100", step: "100", token: "--brand-100" },
	{ fill: "bg-app-brand-200", step: "200", token: "--brand-200" },
	{ fill: "bg-app-brand-300", step: "300", token: "--brand-300" },
	{ fill: "bg-app-brand-400", step: "400", token: "--brand-400" },
	{ fill: "bg-app-brand-500", step: "500", token: "--brand-500" },
	{ fill: "bg-app-brand-600", step: "600", token: "--brand-600" },
	{ fill: "bg-app-brand-700", step: "700", token: "--brand-700" },
	{ fill: "bg-app-brand-800", step: "800", token: "--brand-800" },
	{ fill: "bg-app-brand-900", step: "900", token: "--brand-900" },
	{ fill: "bg-app-brand-950", step: "950", token: "--brand-950" },
];

/**
 * The three combinations somebody actually measured, and the floor each one
 * held at across every shipped palette.
 *
 * The ramp carries no blanket contrast guarantee - tokens.css says so - so this
 * strip is the shortlist that makes "at your own risk" actionable. The numbers
 * come from palette.contrast.test.ts, which re-measures them out of the shipped
 * stylesheet on every run; if one erodes, that suite fails rather than this
 * paragraph quietly becoming untrue.
 */
const RAMP_PAIRINGS = [
	{
		className: "bg-app-brand-50 text-app-brand-900",
		floor: "5.17:1 worst case",
		label: "900 on 50",
		rule: "Body text: 800 and darker, on 200 and paler. 700 is NOT on this list - it measures 4.43:1 on 50 at its worst hue.",
	},
	{
		className: "bg-app-brand-900 text-white",
		floor: "6.76:1 worst case",
		label: "white on 900",
		rule: "White ink on the deep end - 800, 900, 950. The pairing a brand-coloured banner or callout wants.",
	},
	{
		className: "bg-app-brand-100 text-app-brand-600",
		floor: "3.02:1 worst case",
		label: "600 on 100",
		rule: "Non-text only - a border, a chart series, an icon. 600 on 50 or 100 clears 3:1 and nothing below that does.",
	},
];

/**
 * TWO brand gradients, where there were five, and the note is the point of this
 * section rather than decoration on it.
 *
 * The colour grid above is true to the page's usual claim - every token there
 * moves with the theme, and a swatch that stopped moving is a bug. These two do
 * not work that way. They answer to DIFFERENT contrast bars, and which one you
 * reach for is decided by that, not by taste. Printing the bar on the swatch is
 * the only way the distinction survives being read at a glance.
 */
const GRADIENTS = [
	{
		bar: "7:1 against --gradient-brand-foreground",
		className: "gradient-brand",
		note: "The surface. Whatever sits on it - words or a glyph - is the paired foreground, and the utility sets that colour for you. Never add a text class beside it.",
		token: "--gradient-brand",
	},
	{
		bar: "7:1 against --background",
		className: "text-gradient",
		note: "The words themselves, clipped to the glyphs. It answers to the page showing through, not to ink on top of a fill - the opposite obligation, hence a second ramp.",
		token: "--gradient-brand-ink",
	},
];

const RADII = ["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl"];

const TYPE = [
	{
		className: "text-5xl font-bold",
		label: "Display 5xl",
		tag: "h1",
	},
	{
		className: "text-3xl font-bold",
		label: "Display 3xl",
		tag: "h2",
	},
	{
		className: "text-xl font-semibold",
		label: "Heading xl",
		tag: "h3",
	},
	{ className: "text-base", label: "Body base", tag: "p" },
	{
		className: "text-sm text-muted-foreground",
		label: "Body sm muted",
		tag: "p",
	},
];

/* AppChip's tones, not HeroUI's chip colours - this page was demonstrating five
   values the app never renders. AppChip deliberately does not forward `color` or
   `variant`, so none of HeroUI's chip colour rules apply to a single chip in
   this codebase; the flat `.chip-{emphasis}-{tone}` pairs in styles.css are what
   actually ships. Showing the wrong five here is worse than showing none - this
   is the page a token regression is meant to be visible on. */
const CHIP_TONES = ["accent", "default", "success", "warning", "danger"] as const satisfies readonly ChipTone[];
const CHIP_EMPHASES = ["soft", "solid"] as const satisfies readonly ChipEmphasis[];

function Section({ children, title }: { children: React.ReactNode; title: string }) {
	return (
		<AppGlassCard>
			<Card.Content className="p-6">
				<h2 className="mb-4 text-xl font-semibold">{title}</h2>
				{children}
			</Card.Content>
		</AppGlassCard>
	);
}

/**
 * What the document is ACTUALLY resolving this custom property to, right now.
 *
 * Read after mount rather than server-rendered, because the value depends on
 * `data-palette` and `.dark` on <html> and there is no document to ask during
 * SSR. An empty string is the honest answer until there is one - and it is also
 * exactly what a token that no longer exists resolves to, which is the
 * regression this page is for.
 */
function useResolvedToken(token: string): string {
	const [value, setValue] = useState("");

	useEffect(() => {
		const read = () => setValue(getComputedStyle(document.documentElement).getPropertyValue(token).trim());
		read();

		// The theme toggle and the customizer both mutate <html>, and neither
		// re-renders this tree. Without the observer the printed value is whatever
		// it was when the page mounted, which is worse than printing nothing.
		const observer = new MutationObserver(read);
		observer.observe(document.documentElement, {
			attributeFilter: ["class", "data-palette", "data-theme", "style"],
		});

		return () => observer.disconnect();
	}, [token]);

	return value;
}

function ColorSwatch({ token, utility }: { token: string; utility: string }) {
	const resolved = useResolvedToken(token);

	return (
		<div>
			{/* The token's own name, on the swatch. A spec can then ask the
			    document whether that custom property still resolves - which is the
			    regression this page exists to make visible. */}
			<div
				className={`h-16 rounded-2xl border border-border ${utility}`}
				data-token={token}
			/>
			<div className="mt-2 font-mono text-xs font-semibold">{token}</div>
			<div className="font-mono text-[10px] text-muted-foreground">{resolved || "unresolved"}</div>
		</div>
	);
}

/**
 * The design layer on one page, so a token regression is visible here rather
 * than discovered on a feature screen three specs later.
 */
export function AppTokenSwatchGrid() {
	return (
		<div className="space-y-6">
			<Section title="Colour tokens">
				<div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
					{COLORS.map((color) => (
						<ColorSwatch
							key={color.token}
							token={color.token}
							utility={color.var}
						/>
					))}
				</div>
			</Section>

			<Section title="Brand ramp">
				<p className="mb-4 text-sm text-muted-foreground">
					The brand at eleven lightnesses - Tailwind's scale, on this palette's hue, as
					<code className="mx-1 font-mono text-xs">bg-app-brand-500</code>,
					<code className="mx-1 font-mono text-xs">text-app-brand-700</code>,
					<code className="ml-1 font-mono text-xs">border-app-brand-200</code>. 500 is the brand itself; on a
					designer-supplied palette it is the hex that was handed over, so it paints the same pixel as
					<code className="mx-1 font-mono text-xs">bg-app-brand</code>.
				</p>
				<div className="mb-4 grid grid-cols-6 gap-2 sm:grid-cols-11">
					{BRAND_RAMP.map((entry) => (
						<div key={entry.token}>
							<div
								className={`h-14 rounded-xl border border-border ${entry.fill}`}
								data-token={entry.token}
							/>
							<div className="mt-1.5 text-center font-mono text-[10px] font-semibold">{entry.step}</div>
						</div>
					))}
				</div>
				<p className="mb-4 text-sm text-muted-foreground">
					<strong className="font-semibold text-foreground">These do not invert between themes</strong>, and they are the
					only tokens on this page that do not. A number means a lightness - 50 is the palest step in dark mode too,
					exactly as in stock Tailwind - because a ramp that flipped would turn 900-on-50 into dark-on-dark the moment
					somebody toggled the theme. Reach for <code className="font-mono text-xs">dark:bg-app-brand-950</code> yourself.
				</p>
				<Separator className="my-4" />
				<p className="mb-3 text-sm text-muted-foreground">
					<strong className="font-semibold text-foreground">They carry no contrast guarantee on their own.</strong>{" "}
					Every other token here is solved against a named ground; these eleven are raw paint, for UI a designer drew
					against a specific tint. Use a semantic token - <code className="font-mono text-xs">bg-primary</code>,{" "}
					<code className="font-mono text-xs">brand-surface</code>,{" "}
					<code className="font-mono text-xs">gradient-brand</code> - wherever one fits. These three pairings are the
					ones that were measured:
				</p>
				<div className="grid gap-4 md:grid-cols-3">
					{RAMP_PAIRINGS.map((pairing) => (
						<div key={pairing.label}>
							<div className={`grid h-16 place-items-center rounded-2xl text-sm font-semibold ${pairing.className}`}>
								{pairing.label}
							</div>
							<div className="mt-2 font-mono text-[10px] text-muted-foreground">{pairing.floor}</div>
							<p className="mt-1 text-xs text-muted-foreground">{pairing.rule}</p>
						</div>
					))}
				</div>
			</Section>

			<Section title="Brand gradients">
				<p className="mb-4 text-sm text-muted-foreground">
					Two, and everything else on this page is true of both. These are the exception the page has to state out loud:
					they do not merely differ in appearance, they answer to different contrast bars, and the bar is what decides
					which one you reach for. The rule is one line - is the gradient the surface, or is the gradient the words?
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					{/* The surface. The sample text on it IS the demonstration: it is
					    painted by the utility's own `color`, not by a class here. */}
					<div>
						<div
							className="gradient-brand grid h-20 place-items-center rounded-2xl text-sm font-semibold shadow-glow"
							data-gradient={GRADIENTS[0].token}
						>
							Words on it
						</div>
						<div className="mt-2 font-mono text-xs font-semibold">{GRADIENTS[0].token}</div>
						<div className="font-mono text-[10px] text-muted-foreground">{GRADIENTS[0].bar}</div>
						<p className="mt-1 text-xs text-muted-foreground">{GRADIENTS[0].note}</p>
					</div>

					{/* The words. Clipped to the glyphs, over the page it has to be
					    legible against - which is why it sits on bg-background here and
					    not on the card. */}
					<div>
						<div className="grid h-20 place-items-center rounded-2xl border border-border bg-background">
							<span
								className="text-gradient text-2xl font-bold"
								data-gradient={GRADIENTS[1].token}
							>
								The words
							</span>
						</div>
						<div className="mt-2 font-mono text-xs font-semibold">{GRADIENTS[1].token}</div>
						<div className="font-mono text-[10px] text-muted-foreground">{GRADIENTS[1].bar}</div>
						<p className="mt-1 text-xs text-muted-foreground">{GRADIENTS[1].note}</p>
					</div>
				</div>
				<Separator className="my-4" />
				<div className="flex flex-wrap items-center gap-4">
					<div
						className="rounded-2xl bg-surface p-4 shadow-glow text-xs"
						data-shadow="glow"
					>
						shadow-glow
					</div>
					<div
						className="rounded-2xl bg-surface p-4 shadow-soft text-xs"
						data-shadow="soft"
					>
						shadow-soft
					</div>
				</div>
			</Section>

			<Section title="Glass, over a busy background">
				<div className="gradient-brand relative overflow-hidden rounded-3xl p-6">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="glass rounded-2xl p-6 text-sm font-semibold">.glass - 55% tint, blur 20px</div>
						<div className="glass-strong rounded-2xl p-6 text-sm font-semibold">
							.glass-strong - 75% tint, blur 24px
						</div>
					</div>
				</div>
			</Section>

			<Section title="Radius scale">
				<p className="mb-3 text-sm text-muted-foreground">
					The six steps are offsets from --radius, the UI radius, so all of them move together when it does. Form
					controls are NOT on this scale - they read --field-radius, which is why an input can be square inside a
					generously rounded card. Both are set in src/config/theme.config.ts.
				</p>
				<div className="flex flex-wrap gap-4">
					{RADII.map((radius) => (
						<div
							className="flex flex-col items-center gap-2"
							key={radius}
						>
							<div
								className={`h-16 w-16 gradient-brand ${radius}`}
								data-radius={radius}
							/>
							<span className="font-mono text-[10px]">{radius}</span>
						</div>
					))}
				</div>
			</Section>

			<Section title="Gradient icon tiles">
				<p className="mb-3 text-sm text-muted-foreground">
					Three sizes and one tone. There was a second, `warm`, and it is gone: a tile carries a glyph and no words, so
					it answers to the 3:1 non-text bar rather than to 7:1 - but a second ramp still had to be solved,
					gamut-clamped and re-measured on eight palettes in two themes, for a difference nobody could name.
				</p>
				<div className="flex flex-wrap items-end gap-4">
					{(["sm", "md", "lg"] as const).map((size) => (
						<div
							className="flex flex-col items-center gap-2"
							key={size}
						>
							<AppGradientIconTile
								icon={Palette}
								size={size}
							/>
							<span className="font-mono text-[10px]">brand / {size}</span>
						</div>
					))}
				</div>
			</Section>

			<Section title="Type scale">
				<div className="space-y-3">
					{TYPE.map((type) => (
						<div key={type.label}>
							<div
								className={type.className}
								data-type={type.tag}
							>
								{type.label}
							</div>
						</div>
					))}
				</div>
			</Section>

			<Section title="Buttons">
				<div className="flex flex-wrap gap-3">
					<AppButton variant="primary">Primary</AppButton>
					<AppButton variant="secondary">Secondary</AppButton>
					<AppButton variant="tertiary">Tertiary</AppButton>
					<AppButton variant="ghost">Ghost</AppButton>
					<AppButton
						className="gradient-brand rounded-full shadow-glow"
						variant="primary"
					>
						Brand gradient
					</AppButton>
					<AppButton isDisabled>Disabled</AppButton>
				</div>
			</Section>

			<Section title="Chips">
				<p className="mb-3 text-sm text-muted-foreground">
					Both emphases, because they are solved separately: the soft pair is a tint under its own ink, the solid pair
					is the semantic fill under the foreground that ships with it. Solid success and warning are the two that moved
					when the status rails were re-solved.
				</p>
				<div className="space-y-3">
					{CHIP_EMPHASES.map((emphasis) => (
						<div
							className="flex flex-wrap items-center gap-3"
							key={emphasis}
						>
							<span className="w-12 font-mono text-[10px] text-muted-foreground">{emphasis}</span>
							{CHIP_TONES.map((tone) => (
								<AppChip
									emphasis={emphasis}
									icon={Tag}
									key={tone}
									label={tone}
									tone={tone}
								/>
							))}
						</div>
					))}
				</div>
			</Section>
		</div>
	);
}
