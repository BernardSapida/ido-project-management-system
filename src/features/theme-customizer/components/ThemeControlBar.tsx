import { AppButton, AppTooltip } from "@bernardsapida/web-ui";
import { Popover, Slider } from "@heroui/react";
import {
	Check,
	ChevronDown,
	ChevronsUpDown,
	ChevronUp,
	Contrast,
	Download,
	Info,
	Layers,
	Palette,
	RotateCcw,
	Square,
	SunMoon,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { oklchToHex } from "@/config/theme/oklch";
import {
	CARD_NAMES,
	CARD_OPTIONS,
	COLOR_SCHEME_OPTIONS,
	FONT_NAMES,
	FONT_OPTIONS,
	FORM_RADIUS_NAMES,
	type RADIUS_NAMES,
	RADIUS_OPTIONS,
	SURFACE_NAMES,
	SURFACE_OPTIONS,
	UI_RADIUS_NAMES,
} from "@/config/theme/options";
import { buildPalette, TINT_MAX } from "@/config/theme/palette.build";
import { GENERATED_PALETTES } from "@/config/theme/palettes.generated";
import { PALETTE_PRESETS, type PaletteName } from "@/config/theme/presets";
import { cn } from "@/utils/cn";
import { useApplyTheme } from "../hooks/use-apply-theme";
import { useResolvedTheme } from "../hooks/use-resolved-theme";
import { configOutput, isDirty, isOnPreset, type ThemeDraft } from "../theme-draft";

interface ThemeControlBarProps {
	draft: ThemeDraft;
	onChange: (next: ThemeDraft) => void;
	onReset: () => void;
	onSelectPreset: (name: PaletteName) => void;
}

/**
 * The whole theme, in a bar pinned to the bottom of the viewport.
 *
 * A left rail was the obvious layout and the wrong one. The thing being judged
 * is the BOARD - a page of real components - and a rail eats a third of the
 * width it needs while putting the controls beside the thing they change rather
 * than under it. Pinned to the bottom, the controls cost 88px, never scroll away
 * mid-comparison, and sit in the one place a reader is not trying to look at.
 *
 * Every control is a popover rather than a native select, because a font and a
 * palette are things that have to be SHOWN - a list of names tells you nothing
 * about a typeface or a hue. The radius popovers follow the same shape, laid
 * out exactly as HeroUI's own playground lays them out: abbreviation over word,
 * three across, the UI scale stopping at Large and the form scale running on to
 * Extra Large. Somebody arriving from their docs should not have to re-learn
 * this bar, and the two ceilings differ for a real reason - see
 * UI_RADIUS_NAMES in config/theme/options.ts.
 *
 * `Popover` and `Slider` are imported from HeroUI directly. Both are on the
 * short list of primitives with no App* wrapper - see the mapping in
 * apps/web/CLAUDE.md - and neither earns one from a single developer reference
 * screen. The first wrapper written for one call site is the one with the wrong
 * props by the second.
 */
export function ThemeControlBar({ draft, onChange, onReset, onSelectPreset }: ThemeControlBarProps) {
	const theme = useResolvedTheme();
	const offPreset = !isOnPreset(draft);
	const { apply: applyTheme, state: applyState } = useApplyTheme();
	const [isOpen, setIsOpen] = useState(true);
	/*
	 * The same command the Save panel beside the report runs, built from the same
	 * function. Two buttons, one construction - see the note in `configOutput`
	 * about what happened the last time this page built a command twice.
	 */
	const output = configOutput(draft);
	const dirty = isDirty(draft);

	/*
	 * The two page colours the Surface control draws, solved for the draft's own
	 * hue and tint rather than read off the document.
	 *
	 * Reading the document would paint both tiles the same, because only one of
	 * the two strategies is applied at a time - the tile for the OTHER one would
	 * show the colour of the one you already have. Light values in both, on
	 * purpose: this control does nothing in dark mode and a tile that changed
	 * with the theme would imply otherwise.
	 */

	/*
	 * The bar publishes its own height so the page can leave room for it.
	 *
	 * Measured rather than hard-coded because the height is not one number: the
	 * grid is four columns, then two, then one, so the bar is two rows on a
	 * desktop and eight on a phone. A constant would be wrong at two of the three.
	 *
	 * On the document root rather than passed down: the value is consumed by the
	 * page's padding, which is two components away, and threading a ref up through
	 * a route just to subtract a number is worse than one custom property that is
	 * removed on unmount.
	 *
	 * `isOpen` is in the deps rather than left to the observer: collapsed on a
	 * desktop the bar is `display: none`, and a ResizeObserver on a hidden box is
	 * not something to bet the page padding AND the handle's position on. Re-running
	 * the effect publishes the real 0 immediately.
	 */
	const barRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const bar = barRef.current;
		if (!bar) return;

		const root = document.documentElement;
		const publish = () => root.style.setProperty("--theme-bar-height", `${bar.offsetHeight}px`);
		publish();

		const observer = new ResizeObserver(publish);
		observer.observe(bar);

		return () => {
			observer.disconnect();
			root.style.removeProperty("--theme-bar-height");
		};
	}, [isOpen]);

	const surfaceSwatches = useMemo(() => {
		/*
		 * The two CARD colours the Surface control draws - it is the card that moves
		 * now, not the page.
		 *
		 * Solved per strategy rather than read off the document, because reading the
		 * document would paint both tiles the same: only one strategy is applied at a
		 * time, so the tile for the OTHER one would show the colour you already have.
		 * Light values in both, on purpose - this control does nothing in dark mode
		 * and a tile that changed with the theme would imply otherwise.
		 */
		const card = (surface: (typeof SURFACE_NAMES)[number]) =>
			oklchToHex(buildPalette({ accentHue: draft.accentHue, baseTint: draft.baseTint, surface }).light["--surface"]!);

		return {
			flat: card("flat"),
			page: oklchToHex(buildPalette({ accentHue: draft.accentHue, baseTint: draft.baseTint }).light["--background"]!),
			raised: card("raised"),
		};
	}, [draft.accentHue, draft.baseTint]);

	/*
	 * The swatches are read off the PAINTED document, not out of the preset
	 * record, and that is a bug fix rather than a refinement. The record is only
	 * right while the draft is still on its preset: drag the hue and the page
	 * repaints from a palette generated in the browser while the record stays
	 * where it was, so the accent dot showed indigo beside a teal card. A control
	 * that misreports the one thing it exists to show is worse than no control.
	 */

	return (
		/*
		 * FIXED, not sticky, and edge to edge.
		 *
		 * Sticky put it inside the references layout's `p-4 lg:p-6`, so it sat a
		 * padding-width off the bottom and off both sides - a bar that reads as
		 * floating rather than as the floor of the page. Sticky cannot escape that:
		 * it is still in flow, so its box is its parent's box.
		 *
		 * Fixed costs the space it used to occupy, which is why it measures itself
		 * below. Without that the last thing on the page - the copy command, of all
		 * things - ends up under the bar with no scroll left to reach it.
		 *
		 * `max-h` and the scroll are for the narrow case: at one column this is
		 * eight rows tall, and a fixed element taller than the viewport is a page
		 * you cannot read past.
		 */
		<div
			className="fixed inset-x-0 bottom-0 z-30 max-h-[60vh] overflow-y-auto border-border border-t bg-surface/85 px-4 py-3 backdrop-blur-xl"
			data-cy="theme-control-bar"
			ref={barRef}
		>
			{/* COLLAPSE, and a summary of what is hidden.
			    Seven controls stacked took roughly 60% of a phone viewport, which on
			    a page whose entire purpose is looking at the board below meant the
			    controls were covering the thing they control. Collapsed, the bar is
			    one row and the summary carries the two values somebody actually
			    needs to see while scrolling - which theme, and which surface.

			    On DESKTOP too, not just narrow. Two rows of controls plus this one is
			    still a strip of chrome across the bottom of a board somebody is trying
			    to compare against itself, and the reason to get it out of the way -
			    "look at the thing, not the knobs" - does not stop applying at 1024px.

			    Open by default in both renders. A media query picking the initial
			    state would be the obvious touch and would differ between server and
			    client, and a hydration mismatch on the theme bar is a worse bug than
			    a tall bar. */}
			<div className="mx-auto flex max-w-[110rem] items-center justify-between gap-3">
				<p className="min-w-0 truncate text-muted text-xs">
					<span className="font-medium text-foreground capitalize">{draft.palette}</span> ·{" "}
					{SURFACE_OPTIONS[draft.surface].label} · {CARD_OPTIONS[draft.card].label}
				</p>
				<div className="flex shrink-0 items-center gap-2">
					{/* APPLY, beside the collapse and only once there is something to
					    apply.
					    It used to live inside the palette popover, which put the one
					    committing action behind a click on the one control it was not
					    only about: every knob in this bar - surface, card, tint, face,
					    both radii, colour scheme - travels in the same command, and a
					    developer who had only changed the radius had no reason to open a
					    palette picker to find the button that writes it.

					    Hidden rather than disabled when the draft matches what is
					    committed. A permanently-there Apply that does nothing on arrival
					    is a button people learn to ignore; appearing the moment the first
					    control moves is what makes it the answer to "and now how do I
					    keep this". It is also the only control here whose absence says
					    something true - nothing to save.

					    It survives the bar being collapsed, which is the point of putting
					    it on this row rather than in the grid: the summary line says what
					    you have, and this commits it, without expanding anything. */}
					{dirty ? (
						<AppButton
							data-cy="apply-theme"
							icon={applyState === "applied" ? Check : Download}
							/*
							 * Disabled only when there is no command to run - an edited
							 * palette missing one of the three roles nothing can be inferred
							 * from. `configOutput` returns null flags for exactly that case
							 * and a title explaining it, which is what the Save panel beside
							 * the report shows.
							 */
							isDisabled={!output.flags}
							isPending={applyState === "running"}
							onPress={async () => {
								await applyTheme(output.flags);
							}}
							size="sm"
						>
							{applyState === "applied" ? "Applied" : "Apply"}
						</AppButton>
					) : null}
					<AppButton
						aria-expanded={isOpen}
						data-cy="toggle-controls"
						icon={isOpen ? ChevronDown : ChevronUp}
						onPress={() => setIsOpen((open) => !open)}
						size="sm"
						variant="tertiary"
					>
						{isOpen ? "Hide" : "Controls"}
					</AppButton>
				</div>
			</div>

			{/* A GRID, not a flex-wrap. Controls of unequal natural width wrapped
			    into ragged rows that re-flowed every time a value changed length -
			    "Medium" to "Extra large" moved three neighbours. Fixed columns give
			    the same rows, always in the same places, so the bar stops being
			    something the eye has to re-find.

			    FOUR columns, and the control count has to stay in step with it. The
			    row that goes wrong is the one holding two controls and a hole, which
			    is the exact raggedness the grid exists to prevent. Six controls fill
			    4 + 2; a seventh leaves 4 + 3 and needs solving rather than left to
			    wrap.

			    The order is the order of the decisions: what the product IS, which
			    preset that lands on, then the two sliders that refine it - and the
			    second row is everything that is not the hue. */}
			{/* TWO columns from the smallest viewport, not one. Seven controls in a
			    single column is a scroll; in two it is four rows, and every control
			    here is a label over a short value so half a phone width is enough.

			    `hidden` rather than unmounted: the popovers keep their state, the
			    ResizeObserver keeps reporting a real height, and the page padding
			    below shrinks with the bar instead of leaving a gap where it was. */}
			{/* `lg:grid` used to sit here and had to go: it out-specifies the `hidden`
			    below, so the grid stayed on screen at desktop widths no matter what
			    the toggle said. One `grid`, one `hidden`, both unconditional by
			    breakpoint - the column count is the only thing `lg` decides now. */}
			<div
				className={cn(
					"mx-auto max-w-[110rem] grid-cols-2 items-end gap-x-6 gap-y-3 pt-3 lg:grid-cols-4",
					isOpen ? "grid" : "hidden",
				)}
			>
				{/* ---- palette ------------------------------------------------ */}
				{/* The palette and the way back out, in one cell. Reset belongs beside
				    the control most likely to have got you lost. */}
				<Field label="Theme">
					<div className="flex items-center gap-2">
						<ControlPopover
							data-cy="palette-control"
							glyph={<Palette className="size-3.5" />}
							subtitle="Eight hues, each solved and measured on its own. Moving a slider leaves the set - and says so."
							title="Palette"
							value={offPreset ? "Custom" : capitalise(draft.palette)}
						>
							<div
								className="grid w-64 grid-cols-4 gap-3"
								data-cy="palette-preset-grid"
							>
								{PALETTE_PRESETS.map((preset) => {
									const tokens = GENERATED_PALETTES[preset.name][theme].tokens;
									const isSelected = !offPreset && preset.name === draft.palette;

									return (
										<button
											aria-pressed={isSelected}
											className="group flex flex-col items-center gap-1.5 rounded-lg p-1 outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
											data-cy={`palette-${preset.name}`}
											key={preset.name}
											onClick={() => onSelectPreset(preset.name)}
											title={preset.description}
											type="button"
										>
											<span
												className={cn(
													"grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-overlay transition",
													isSelected ? "ring-2 ring-focus" : "group-hover:ring-2 group-hover:ring-border",
												)}
												style={{
													backgroundImage: `linear-gradient(135deg, ${tokens["--gradient-brand-from"].hex} 0%, ${tokens["--gradient-brand-to"].hex} 100%)`,
												}}
											>
												{/* A tick as well as the ring: the ring alone is a colour
											    difference and nothing more. */}
												{isSelected ? (
													<Check
														aria-hidden="true"
														className="size-4"
														style={{ color: tokens["--gradient-brand-foreground"].hex }}
													/>
												) : null}
											</span>
											<span className="text-[11px] capitalize">{preset.name}</span>
										</button>
									);
								})}
							</div>

							{/* The trigger already reads "Custom" the moment a slider moves,
						    which is the always-visible half of the signal. The sentence
						    that explains what Custom COSTS lives beside the report, not in
						    here - a warning behind a click is a warning nobody reads. */}

							{/* No Apply in here any more. Picking a swatch is a preview and
						    stays one, but committing was never about the palette alone -
						    it writes the surface, the card, the tint, the face, both radii
						    and the colour scheme in the same command. It now sits on the
						    bar's own row, beside the collapse, where it is reachable from
						    whichever control somebody happened to move. */}
						</ControlPopover>
						<AppButton
							aria-label="Reset every control to the committed project default"
							data-cy="reset-draft"
							icon={RotateCcw}
							isIconOnly
							onPress={onReset}
							variant="tertiary"
						/>
					</div>
				</Field>
				{/* ---- surface ------------------------------------------------ */}
				{/* Next to the palette on purpose: it is the only other control that
				    changes what colour a large area of the page is. */}
				<Field label="Surface">
					<ControlPopover
						data-cy="surface-control"
						glyph={<Layers className="size-3.5" />}
						subtitle="Light mode only. Dark mode already ladders #060606 under #181818."
						title="Surface"
						value={SURFACE_OPTIONS[draft.surface].label}
					>
						<div
							className="grid w-64 gap-2"
							data-cy="surface-grid"
						>
							{SURFACE_NAMES.map((name) => {
								const option = SURFACE_OPTIONS[name];
								const isSelected = draft.surface === name;

								return (
									<button
										aria-pressed={isSelected}
										className={cn(
											"flex items-center gap-3 rounded-xl border p-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
											isSelected ? "border-focus" : "border-border hover:bg-muted-surface",
										)}
										data-cy={`surface-${name}`}
										key={name}
										/*
										 * It FILLS the hex field rather than setting a mode beside it.
										 *
										 * The two used to be independent: picking Raised set a strategy
										 * and left the Surface hex blank, so the form said one thing and
										 * the control said another and there was no way to see which had
										 * won. Writing the resolved colour into the field makes the field
										 * the single visible truth - the strategy is a shortcut for
										 * choosing a value, not a second source of one.
										 *
										 * `surface` still travels on the draft so the copied command can
										 * record which shortcut was used, but nothing paints from it once
										 * the hex is set: a supplied card outranks the strategy.
										 */
										onClick={() =>
											onChange({
												...draft,
												designer: { ...draft.designer, surface: surfaceSwatches[name] },
												surface: name,
											})
										}
										type="button"
									>
										{/* The choice, drawn rather than described: a page rectangle
										    with a card on it. Painted from THIS option's own solve,
										    not from the live document - reading var(--background)
										    here would draw whichever option is already applied and
										    make both tiles identical. */}
										<span
											aria-hidden="true"
											className="grid size-9 shrink-0 place-items-center rounded-lg border border-border"
											style={{ background: surfaceSwatches.page }}
										>
											<span
												className="size-5 rounded-sm border border-border"
												style={{ background: surfaceSwatches[name] }}
											/>
										</span>
										<span className="min-w-0">
											<span className="block text-sm font-medium">{option.label}</span>
											<span className="block text-xs text-muted">{option.description}</span>
										</span>
									</button>
								);
							})}
						</div>
					</ControlPopover>
				</Field>

				{/* ---- card style ---------------------------------------------- */}
				{/* Beside Surface because the two answer adjacent questions - where a
				    card sits, and what it is made of - and because one of them gates
				    the other: a card colour cannot mean anything until the card is
				    opaque. */}
				<Field label="Card">
					<ControlPopover
						data-cy="card-control"
						glyph={<Square className="size-3.5" />}
						subtitle="Glass is translucent over whatever is behind it. Solid paints the surface token exactly."
						title="Card"
						value={CARD_OPTIONS[draft.card].label}
					>
						<div
							className="grid w-64 gap-2"
							data-cy="card-grid"
						>
							{CARD_NAMES.map((name) => {
								const option = CARD_OPTIONS[name];
								const isSelected = draft.card === name;

								return (
									<button
										aria-pressed={isSelected}
										className={cn(
											"flex items-center gap-3 rounded-xl border p-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
											isSelected ? "border-focus" : "border-border hover:bg-muted-surface",
										)}
										data-cy={`card-${name}`}
										key={name}
										onClick={() => onChange({ ...draft, card: name })}
										type="button"
									>
										{/* Drawn rather than described, like the surface tiles: a card
										    over a brand-coloured band, so the difference between the two
										    is the thing the control is about - whether the band shows
										    through - rather than two swatches of the same grey. */}
										<span
											aria-hidden="true"
											className="grid size-9 shrink-0 place-items-center rounded-lg"
											style={{ background: "var(--rail-accent)" }}
										>
											<span
												className="size-5 rounded-sm border border-border"
												style={{
													background:
														name === "solid"
															? "var(--surface)"
															: "color-mix(in oklab, var(--glass-tint) 75%, transparent)",
												}}
											/>
										</span>
										<span className="min-w-0">
											<span className="block font-medium text-sm">{option.label}</span>
											<span className="block text-muted text-xs">{option.description}</span>
										</span>
									</button>
								);
							})}
						</div>
					</ControlPopover>
				</Field>

				{/* ---- base tint ---------------------------------------------- */}
				{/* The third of the three that move a large area, and the only control
				    in the bar that is not a popover: a tint is a continuous quantity
				    and the whole value of it is dragging one end to the other while
				    watching the board. A popover holding a slider would hide the board
				    behind the panel you need to be looking past.

				    It reads as neutral-vs-tinted rather than as a colour, which is why
				    it sits here and not with the five hexes in the form above - none of
				    those carry it, and moving this leaves all five where they are. */}
				<Field
					hint="How much of the accent hue is mixed into the GREYS - the page, the cards, the borders. Not a brand colour: the five hexes do not move. Cards take 1.25x this, so the warm hues turn brown here well before the cool ones stop reading as grey."
					label="Base tint"
					value={draft.baseTint.toFixed(3)}
				>
					{/* Matched to the popover triggers beside it rather than left to its
					    natural height. The grid is items-end, so a short cell would hang
					    its track off the bottom of the row while every neighbour sat
					    centred - the raggedness the fixed columns exist to prevent. */}
					<div className="flex h-8.5 items-center">
						<Slider
							aria-label="Base tint"
							className="w-full"
							data-cy="base-tint-control"
							maxValue={TINT_MAX}
							minValue={0}
							onChange={(value) =>
								/*
								 * Rounded on the way in, not on the way out. A 0.001 step over
								 * floats lands on 0.008000000000000002, and that value is
								 * compared against the preset's 0.008 by isOnPreset and written
								 * verbatim into the --apply line the copy panel emits. Both
								 * would be wrong in a way nobody would think to look for.
								 *
								 * Cast because React Aria types this `number | number[]` for the
								 * range case. A single `value` can only ever hand back the number.
								 */
								onChange({ ...draft, baseTint: Number((value as number).toFixed(3)) })
							}
							step={0.001}
							value={draft.baseTint}
						>
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
					</div>
				</Field>

				{/* ---- font --------------------------------------------------- */}
				<Field label="Font family">
					<ControlPopover
						data-cy="font-control"
						glyph={<span className="font-semibold text-xs">Aa</span>}
						subtitle="Only faces this template ships or the OS already has - anything else previews as a silent fallback."
						title="Font family"
						value={FONT_OPTIONS[draft.font].label}
					>
						<div className="grid w-64 grid-cols-3 gap-2">
							{FONT_NAMES.map((name) => (
								<OptionTile
									isSelected={draft.font === name}
									key={name}
									label={FONT_OPTIONS[name].label}
									onPress={() => onChange({ ...draft, font: name })}
								>
									<span
										className="text-2xl leading-none"
										style={{ fontFamily: FONT_OPTIONS[name].stack }}
									>
										Ag
									</span>
								</OptionTile>
							))}
						</div>
					</ControlPopover>
				</Field>

				{/* ---- radii -------------------------------------------------- */}
				<Field label="Radius">
					<ControlPopover
						data-cy="ui-radius-control"
						glyph={<span className="font-semibold text-xs">{RADIUS_OPTIONS[draft.uiRadius].abbr}</span>}
						subtitle="Affects the overall UI, like menus and modals."
						title="Radius"
						value={RADIUS_OPTIONS[draft.uiRadius].label}
					>
						<RadiusGrid
							names={UI_RADIUS_NAMES}
							onPress={(name) => onChange({ ...draft, uiRadius: name })}
							value={draft.uiRadius}
						/>
					</ControlPopover>
				</Field>

				<Field label="Radius form">
					<ControlPopover
						data-cy="form-radius-control"
						glyph={<span className="font-semibold text-xs">{RADIUS_OPTIONS[draft.formRadius].abbr}</span>}
						subtitle="Affects form elements, like inputs and selects. Independent of the one beside it."
						title="Radius form"
						value={RADIUS_OPTIONS[draft.formRadius].label}
					>
						<RadiusGrid
							names={FORM_RADIUS_NAMES}
							onPress={(name) => onChange({ ...draft, formRadius: name })}
							value={draft.formRadius}
						/>
					</ControlPopover>
				</Field>

				{/* ---- colour scheme ------------------------------------------- */}
				{/* The only control here that does not change what you are looking at.
				    Everything else in this bar previews live; this one is a statement
				    about what the project SHIPS, and it deliberately takes effect only
				    when the line is committed - the board and the contrast report below
				    are how you decide whether there is a dark design worth keeping, so
				    drafting "Light only" must not be the thing that stops you seeing
				    dark. The hint says so, because a control that appears to do nothing
				    is one somebody clicks twice and then distrusts. */}
				<Field
					hint="Applies to the built app, not to this preview. Keep previewing both schemes here - that is how you decide whether a dark design is worth shipping."
					label="Colour scheme"
				>
					<ControlPopover
						data-cy="color-scheme-control"
						glyph={<Contrast className="size-3.5" />}
						subtitle="Whether the reader chooses, or the project already has. Locking one ignores their device and drops the toggle."
						title="Colour scheme"
						value={COLOR_SCHEME_OPTIONS[draft.colorScheme].label}
					>
						<div
							className="grid w-72 gap-2"
							data-cy="color-scheme-grid"
						>
							{/* `user` first, then the two locks. The default leads because it is
							    what almost every project wants, and because the two beside it
							    are the ones that need a reason. */}
							{(["user", "light-only", "dark-only"] as const).map((name) => {
								const option = COLOR_SCHEME_OPTIONS[name];
								const isSelected = draft.colorScheme === name;

								return (
									<button
										aria-pressed={isSelected}
										className={cn(
											"flex items-center gap-3 rounded-xl border p-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
											isSelected ? "border-focus" : "border-border hover:bg-muted-surface",
										)}
										data-cy={`color-scheme-${name}`}
										key={name}
										onClick={() => onChange({ ...draft, colorScheme: name })}
										type="button"
									>
										{/* Drawn, like the card and surface tiles: the two halves of the
										    square are the two schemes, and the locked ones show only the
										    half they ship. */}
										<span
											aria-hidden="true"
											className="grid size-9 shrink-0 place-items-center rounded-lg border border-border"
											style={{
												background:
													name === "light-only"
														? "oklch(0.98 0 0)"
														: name === "dark-only"
															? "oklch(0.18 0 0)"
															: "linear-gradient(105deg, oklch(0.98 0 0) 50%, oklch(0.18 0 0) 50%)",
											}}
										>
											{name === "user" ? <SunMoon className="size-4 text-muted" /> : null}
										</span>
										<span className="min-w-0">
											<span className="block font-medium text-sm">{option.label}</span>
											<span className="block text-muted text-xs">{option.description}</span>
										</span>
									</button>
								);
							})}
						</div>
					</ControlPopover>
				</Field>
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

function capitalise(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * A labelled cell in the bar, with an optional "why".
 *
 * The hint is a tooltip on a small glyph rather than a line of copy, because
 * the bar has two rows and no budget for a paragraph - but an explanation has
 * to be reachable from the control it explains, not buried in a doc comment
 * that nobody previewing a theme will ever open.
 */
function Field({
	children,
	className,
	hint,
	label,
	value,
}: {
	children: ReactNode;
	className?: string;
	hint?: string;
	label: string;
	/** The current value, shown opposite the label the way a slider's output is. */
	value?: string;
}) {
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<span className="flex items-center gap-1 font-medium text-muted-foreground text-xs">
				{label}
				{hint ? (
					<AppTooltip
						description={hint}
						title={label}
					>
						<button
							aria-label={`Why the ${label.toLowerCase()} control behaves this way`}
							className="cursor-help rounded-full outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
							type="button"
						>
							<Info
								aria-hidden="true"
								className="size-3.5"
							/>
						</button>
					</AppTooltip>
				) : null}
				{value ? <span className="ms-auto font-mono tabular-nums">{value}</span> : null}
			</span>
			{children}
		</div>
	);
}

/**
 * A trigger that shows the current value, and a panel that shows the options as
 * the thing they are rather than as their names.
 *
 * The subtitle is not decoration. Two of these controls are radii and they look
 * interchangeable in a bar; the sentence is what tells you which one moves your
 * inputs, at the moment you are about to move it.
 */
function ControlPopover({
	children,
	"data-cy": dataCy,
	glyph,
	subtitle,
	title,
	value,
}: {
	children: ReactNode;
	"data-cy"?: string;
	glyph: ReactNode;
	subtitle: string;
	title: string;
	value: string;
}) {
	return (
		<Popover>
			<Popover.Trigger
				className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-field px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-default focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
				data-cy={dataCy}
			>
				<span
					aria-hidden="true"
					className="grid size-5 shrink-0 place-items-center text-muted-foreground"
				>
					{glyph}
				</span>
				<span className="flex-1 text-left">{value}</span>
				{/* The up/down chevron HeroUI's triggers carry. It is the only thing
				    saying "this opens something" - without it a bordered box with a
				    value in it reads as a read-only field, which is what the bar looked
				    like before. */}
				<ChevronsUpDown
					aria-hidden="true"
					className="size-3.5 shrink-0 text-muted-foreground"
				/>
			</Popover.Trigger>
			<Popover.Content className="p-3">
				<Popover.Dialog aria-label={title}>
					<div className="mb-2">
						<div className="font-semibold text-sm">{title}</div>
						<p className="mt-0.5 max-w-64 text-[11px] text-muted-foreground">{subtitle}</p>
					</div>
					{children}
				</Popover.Dialog>
			</Popover.Content>
		</Popover>
	);
}

/**
 * The six radius steps, as HeroUI's own playground draws them: the abbreviation
 * large, the word small underneath, three across and two down.
 *
 * This replaced a preview of the actual corner, which sounded like the more
 * honest option and was not. At tile size the difference between 0.5rem and
 * 0.75rem is a single pixel, so six tiles came out looking like the same
 * rounded square six times - a picture that shows nothing is worse than a
 * letter, because the reader believes the picture.
 */
function RadiusGrid({
	names,
	onPress,
	value,
}: {
	names: readonly (typeof RADIUS_NAMES)[number][];
	onPress: (name: (typeof RADIUS_NAMES)[number]) => void;
	value: string;
}) {
	return (
		<div className="grid w-64 grid-cols-3 gap-2">
			{names.map((name) => (
				<OptionTile
					isSelected={value === name}
					key={name}
					label={RADIUS_OPTIONS[name].label}
					onPress={() => onPress(name)}
				>
					<span className="font-semibold text-base leading-none">{RADIUS_OPTIONS[name].abbr}</span>
				</OptionTile>
			))}
		</div>
	);
}

function OptionTile({
	children,
	isSelected,
	label,
	onPress,
}: {
	children: ReactNode;
	isSelected: boolean;
	label: string;
	onPress: () => void;
}) {
	return (
		<button
			aria-pressed={isSelected}
			className={cn(
				"flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 outline-none transition-colors",
				"focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
				// The selected tile is marked with a FOREGROUND border rather than an
				// accent one. This popover is where the accent is being chosen, so an
				// accent-coloured selection marker changes colour as you browse - and
				// on the palettes whose accent is closest to the border colour it
				// stops reading as a selection at all.
				isSelected ? "border-foreground border-2" : "border-border hover:bg-default",
			)}
			onClick={onPress}
			type="button"
		>
			{children}
			<span className="text-[11px] text-muted-foreground">{label}</span>
		</button>
	);
}
