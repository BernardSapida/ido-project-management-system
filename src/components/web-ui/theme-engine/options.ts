/**
 * The non-colour half of the theme: what the picker may offer for font and
 * radius, and nothing beyond it.
 *
 * Both lists are deliberately closed.
 *
 * FONTS may only name a face the template self-hosts or a stack the operating
 * system already has. Offering anything else gives a preview that silently
 * falls back to Inter, so the developer chooses one thing and ships another -
 * and finds out on the first machine that is not theirs.
 *
 * RADII are a scale, not a number field. `--radius` is the UI radius and
 * `--field-radius` the form one, and they move independently: a card can be
 * generous while an input stays square. What they must not do is drift onto
 * arbitrary values, because the six-step Tailwind scale is derived from
 * `--radius` by offset (`calc(var(--radius) - 4px)` … `+ 12px`), and a base
 * below 0.5rem collapses the small end of it to nothing.
 */

export const FONT_OPTIONS = {
	inter: {
		description: "Self-hosted, variable weight 200-700. The template default.",
		label: "Inter",
		stack: '"Inter", ui-sans-serif, system-ui, sans-serif',
	},
	system: {
		description: "No download at all. Renders as whatever the reader's OS uses for UI.",
		label: "System sans",
		stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
	},
	serif: {
		description: "System serif stack. Editorial, and heavier at small sizes than it looks here.",
		label: "System serif",
		stack: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
	},
	mono: {
		description: "System monospace. Wide at body sizes - a deliberate look, not a default.",
		label: "System mono",
		stack: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
	},
} as const;

/**
 * Six steps, keyed and abbreviated the way HeroUI's own theme playground keys
 * and abbreviates them, so the two are read the same way by the same person.
 *
 * `abbr` is the primary thing on the tile and the word is the caption under it,
 * which is their arrangement and the better one: at tile size a letter is
 * legible where a word wraps, and the six letters form a scale you can scan in
 * one pass. It replaced a preview of the actual corner, which sounded more
 * honest and was not - at 24px the gap between 0.5rem and 0.75rem is one pixel,
 * so six tiles all looked like the same rounded square.
 *
 * `none` is a true 0, not a token 0.25rem. See the `--radius-*` scale in
 * styles.css: the six Tailwind steps are offsets from this value, so a base of
 * 0 would drive the small end negative - they are clamped at 0 there rather
 * than fudged to a small positive here, because "None" has to mean none.
 */
export const RADIUS_OPTIONS = {
	none: { abbr: "-", label: "None", value: "0rem" },
	xs: { abbr: "XS", label: "Extra Small", value: "0.25rem" },
	sm: { abbr: "S", label: "Small", value: "0.5rem" },
	md: { abbr: "M", label: "Medium", value: "0.75rem" },
	lg: { abbr: "L", label: "Large", value: "1rem" },
	xl: { abbr: "XL", label: "Extra Large", value: "1.5rem" },
} as const;

export const FONT_NAMES = Object.keys(FONT_OPTIONS) as (keyof typeof FONT_OPTIONS)[];
export const RADIUS_NAMES = Object.keys(RADIUS_OPTIONS) as (keyof typeof RADIUS_OPTIONS)[];

/**
 * The UI radius stops at Large; the form radius goes to Extra Large.
 *
 * The same split HeroUI's playground makes, and it is not arbitrary. --radius
 * is the base the six-step Tailwind scale is derived from, and the top of that
 * scale is `calc(var(--radius) + 12px)` - at an XL base of 1.5rem, `rounded-3xl`
 * lands at 36px and a small card stops reading as a card. A FIELD has no such
 * derived scale hanging off it: `--field-radius` is used directly, an input is
 * 36px tall, and XL simply clamps it to a stadium, which is a legitimate look.
 *
 * So the ceiling differs because the consequence differs, and offering a step
 * that visibly breaks the layout is not offering a choice.
 */
export const UI_RADIUS_NAMES = [
	"none",
	"xs",
	"sm",
	"md",
	"lg",
] as const satisfies readonly (keyof typeof RADIUS_OPTIONS)[];
export const FORM_RADIUS_NAMES = RADIUS_NAMES;

/**
 * The two light-mode surface ladders the picker offers.
 *
 * A third that tints the CARDS instead of the page is deliberately absent: this
 * template's cards are glass, and `--glass-tint`, `--glass-opaque` and the card
 * shadows are all tuned against a white card. Moving the page moves one token
 * and leaves that recipe alone; moving the card would mean re-solving it.
 */
export const SURFACE_OPTIONS = {
	flat: {
		description: "Page and card the same white. Separated by the border and the shadow.",
		label: "Flat",
	},
	raised: {
		description: "Page steps down and picks up the accent hue. Cards stay white on top.",
		label: "Raised",
	},
} as const;

export const SURFACE_NAMES = Object.keys(SURFACE_OPTIONS) as (keyof typeof SURFACE_OPTIONS)[];

/**
 * What a card is MADE of, which is a different question from where it sits.
 *
 * `glass` is what every project has shipped: a translucent tint over whatever is
 * behind it, blurred. It exists because the landing and auth pages put cards
 * over animated blobs, and it is genuinely better there.
 *
 * `solid` paints `--surface` and nothing else. The reason to want it is not
 * taste - it is that a translucent card has no colour of its own. What lands on
 * screen is 75% of a tint composited over the page, so "the card is #F7F7F7" is
 * not a statement the glass recipe can honour, and any control that lets
 * somebody choose a card colour is lying to them until the card is opaque.
 *
 * Which is why this exists as its own axis rather than as a third surface
 * strategy: it is the switch that makes a card colour mean what it says.
 */
export const CARD_OPTIONS = {
	glass: {
		description: "Translucent and blurred over whatever is behind it. What the landing and auth pages are built on.",
		label: "Glass",
	},
	solid: {
		description: "Opaque. The card is exactly its surface colour, with no page showing through.",
		label: "Solid",
	},
} as const;

export const CARD_NAMES = Object.keys(CARD_OPTIONS) as (keyof typeof CARD_OPTIONS)[];

/**
 * Whether the reader chooses light or dark, or the project already has.
 *
 * `user` is the default and is what every project shipped before this existed:
 * the OS preference is the starting point and the reader can override it.
 *
 * The other two exist for a specific failure, not for taste. A project designed
 * only in light still renders dark for every visitor whose laptop is set to
 * dark - screens nobody has ever looked at, shipped to the half of your audience
 * who never chose anything. Declaring the scheme is how a project says "this is
 * the only one we designed", and it is a stronger statement than simply not
 * putting a toggle on screen: the OS preference and any previously stored choice
 * both stop applying.
 */
export const COLOR_SCHEME_OPTIONS = {
	"dark-only": {
		description: "Always dark, whatever the reader's device is set to. No toggle, and the OS preference is ignored.",
		label: "Dark only",
	},
	"light-only": {
		description: "Always light, whatever the reader's device is set to. For a project with no dark design.",
		label: "Light only",
	},
	user: {
		description: "The reader chooses, starting from their OS preference. What every project ships by default.",
		label: "User's choice",
	},
} as const;

export const COLOR_SCHEME_NAMES = Object.keys(COLOR_SCHEME_OPTIONS) as (keyof typeof COLOR_SCHEME_OPTIONS)[];
