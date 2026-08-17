/**
 * The four hex fields a theme arrives as.
 *
 * Ground up - the page, the cards on it, the brand those carry, the type - which
 * is the order a 60-30-10 reading puts them in and the order somebody opening
 * this page is thinking in. Three are required and the card is not; what this
 * must never do is imply a blank card is a MISSING one, because the Surface
 * control fills it and the panel above says with what.
 *
 * Two columns, never three. Four fields across three columns is a row of three
 * and a row of one, and the hole reads as a field that failed to render. Two
 * columns also pairs them the way they relate: the two grounds on the first row,
 * the two things that sit on them on the second.
 *
 * No form library here, deliberately: this is five loose values living in a
 * zustand draft that a slider elsewhere on the page also writes to, and wiring
 * RHF through it would mean two owners for one piece of state. `AppInputGroup`
 * would now serve - its standalone mode takes `value`/`onChange` - but these
 * fields carry the customizer's own compact label and footnote scale, which is
 * what `AppTextInput` and `AppHexField` exist to hold.
 */

import { AppButton, AppHexField, AppTextInput, AppTooltip } from "@bernardsapida/web-ui";
import { ClipboardPaste, Eraser } from "lucide-react";
import {
	DESIGNER_ORDER,
	DESIGNER_ROLES,
	type DesignerPalette,
	resolveDesignerPalette,
	swatchesFor,
} from "@/config/theme/designer-palette";
import { oklchToHex } from "@/config/theme/oklch";
import type { ThemeName } from "@/config/theme/palette.build";
import { isKnownPalette } from "../theme-draft";

interface DesignerPaletteFormProps {
	/** Which theme the brand hex above is the real brand for. */
	brandTheme: ThemeName;
	"data-cy"?: string;
	/** True while the four still match a named theme - the name field hides then. */
	isOnPreset: boolean;
	onBrandThemeChange: (next: ThemeName) => void;
	onChange: (next: DesignerPalette) => void;
	onSaveAsChange: (next: string) => void;
	saveAs: string;
	value: DesignerPalette;
}

export function DesignerPaletteForm({
	brandTheme,
	"data-cy": dataCy,
	isOnPreset,
	onBrandThemeChange,
	onChange,
	onSaveAsChange,
	saveAs,
	value,
}: DesignerPaletteFormProps) {
	const resolved = resolveDesignerPalette(value);
	const derived = new Set(resolved?.derived ?? []);

	/*
	 * Every value from one paste. A designer sends a comma or newline separated
	 * list far more often than they send four separate messages, and typing them
	 * one at a time is where transcription errors come from.
	 */
	const pasteAll = async () => {
		const text = await navigator.clipboard.readText();
		const found = text.match(/#?[0-9a-fA-F]{6}\b/g) ?? [];
		if (found.length === 0) return;

		const next: DesignerPalette = { ...value };
		found.slice(0, DESIGNER_ORDER.length).forEach((hex, index) => {
			next[DESIGNER_ORDER[index]] = hex.startsWith("#") ? hex : `#${hex}`;
		});
		onChange(next);
	};

	return (
		<div
			className="space-y-3"
			data-cy={dataCy}
		>
			{/* The paragraph that used to sit here explained which fields are required
			    and what a blank one does. Both are on the fields: a required marker,
			    and a placeholder reading "derived". It was three lines of prose to say
			    what two glyphs already say, on a panel whose actual content is below
			    it. */}
			<div className="flex items-center justify-end gap-2">
				<div className="flex shrink-0 items-center gap-2">
					<AppButton
						aria-label="Read hex values from the clipboard and fill every field"
						data-cy="paste-designer-palette"
						icon={ClipboardPaste}
						onPress={pasteAll}
						size="sm"
						variant="tertiary"
					>
						Paste all
					</AppButton>
					{/* Ghost and last: emptying fields somebody just typed is the one
					    destructive thing on this panel. */}
					<AppButton
						aria-label="Empty every field"
						data-cy="clear-designer-palette"
						icon={Eraser}
						isDisabled={Object.keys(value).length === 0}
						isIconOnly
						onPress={() => onChange({})}
						size="sm"
						variant="ghost"
					/>
				</div>
			</div>

			{/*
			 * WHICH theme the brand hex belongs to, and it sits under the fields
			 * rather than beside the Brand one because it qualifies the whole palette.
			 *
			 * The form used to take a brand and not ask this, which made it a question
			 * the generator had to answer by assuming - and the assumption was
			 * invisible. No single lightness clears the non-text bar against both a
			 * white page and a dark card, so one theme gets the hex and the other gets
			 * a solved sibling. Which one is the designer's call, not the solver's:
			 * whichever mode the product ships in is the mode the brand deck was drawn
			 * for.
			 */}
			<div
				className="rounded-xl border border-border p-3"
				data-cy="brand-theme"
			>
				<p className="font-medium text-sm">Which mode is this brand for?</p>
				<p className="mt-1 text-muted text-xs">
					The mode you pick paints <code className="font-mono">{value.brand ?? "your brand"}</code> exactly. The other
					gets the nearest lightness at the same hue that stays legible on its own grounds - so your brand is the colour
					you chose where it counts, and a readable sibling where one hex cannot reach.
				</p>
				<div className="mt-2 flex flex-wrap gap-2">
					{(["light", "dark"] as const).map((option) => (
						<AppButton
							data-cy={`brand-theme-${option}`}
							key={option}
							onPress={() => onBrandThemeChange(option)}
							size="sm"
							variant={brandTheme === option ? "primary" : "secondary"}
						>
							{option === "light" ? "Light mode" : "Dark mode"}
						</AppButton>
					))}
				</div>
			</div>

			{/* Only once the palette has actually left its theme. Asking for a name
			    before anything has been edited is asking a question with no answer
			    yet, and it would sit there looking like a required field. */}
			{isOnPreset ? null : (
				<div className="rounded-xl border border-border p-3">
					<AppTextInput
						className="max-w-sm"
						data-cy="save-as"
						/* Says which of the two things Save is about to do. An existing name
						   updates that theme in place; a new one adds a theme beside it. The
						   field is prefilled with the theme you picked, so the default action
						   is "modify the thing I am looking at" - and changing the name is
						   how you turn an edit into a copy. */
						footnote={
							isKnownPalette(saveAs.trim())
								? `Saving updates the "${saveAs.trim()}" theme in place.`
								: "Lower-case letters and dashes. Saving adds this as a new theme in presets.ts."
						}
						label="Save this palette as"
						onChange={onSaveAsChange}
						placeholder="my-theme"
						value={saveAs}
					/>
				</div>
			)}

			{/* Four across, two on a phone. One row is the whole palette at a glance,
			    which is what a four-colour theme should look like - and two columns
			    below `sm` keeps the pairing meaningful rather than collapsing to a
			    single stack of four. */}
			<div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-6 lg:grid-cols-4">
				{DESIGNER_ROLES.map((role) => {
					// A derived value reaches the SWATCH but never the input: putting it
					// in the field would make our colour look like one they typed.
					const isDerived = derived.has(role.key);

					return (
						<AppHexField
							data-cy={`designer-${role.key}`}
							fallback={isDerived && resolved ? oklchToHex(resolved.values[role.key]) : null}
							/* The two blanks are derived from different things, and saying
							   "from your brand" for both was simply wrong about the card - that
							   one comes from the page and the Surface control, and a reader
							   who went looking for the brand hex in it would not find it. */
							footnote={
								isDerived
									? `${role.key === "surface" ? "From the Surface control" : "Derived from your brand"} - ${oklchToHex(resolved!.values[role.key])}`
									: undefined
							}
							isRequired={role.required}
							key={role.key}
							/*
							 * The NAME only. What the role paints was printed beside it and is
							 * now the tooltip's title, which is where it already was - the
							 * inline copy was a second rendering of the same string.
							 *
							 * It cost more than the duplication: "Buttons and brand surfaces"
							 * wrapped to a second line, so one of the four labels was twice the
							 * height of the others and the row of fields no longer lined up.
							 * A caption that reflows the control it labels is worse than a
							 * caption a reader has to hover for, and `cursor-help` is what
							 * tells them it is there.
							 */
							label={
								<AppTooltip
									description={role.hint}
									title={role.paints}
								>
									<AppTooltip.Trigger aria-label={`What ${role.label.toLowerCase()} paints`}>
										<span className="cursor-help">{role.label}</span>
									</AppTooltip.Trigger>
								</AppTooltip>
							}
							onChange={(next) => onChange({ ...value, [role.key]: next })}
							placeholder={role.required ? "#000000" : "filled for you"}
							swatches={swatchesFor(role.key, value)}
							value={value[role.key] ?? ""}
						/>
					);
				})}
			</div>
		</div>
	);
}
