import {
	AppAvatar,
	AppButton,
	AppCheckbox,
	AppGlassCard,
	AppGradientIconTile,
	AppInputGroup,
	AppRadioGroup,
	AppSelect,
	AppSwitch,
	AppTabs,
} from "@bernardsapida/web-ui";
import { InputOTP, Kbd, Separator, Slider, Spinner } from "@heroui/react";
import {
	Apple,
	Chrome,
	FilePlus2,
	Info,
	type LucideIcon,
	MessageSquare,
	Pencil,
	Rocket,
	Save,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/utils/cn";

interface ThemePreviewBoardProps {
	className?: string;
}

interface PreviewForm {
	email: string;
	newsletter: boolean;
	notifications: boolean;
	plan: string;
	state: string;
}

/**
 * Every card on this board, and the report card beside it, share these.
 *
 * As a constant rather than as a habit: the panels drifted to p-4/gap-4 while
 * the brand card stayed at p-5/gap-3, and on a board whose entire job is
 * showing whether a theme is consistent, cards with two different insets are
 * the first thing that looks wrong and the last thing anyone suspects.
 */
export const CARD_PADDING = "p-5";
export const CARD_GAP = "gap-3";

const BUTTON_VARIANTS = ["primary", "secondary", "tertiary", "danger", "outline", "ghost"] as const;

const RANGES = ["1D", "7D", "1M", "1Y", "All"] as const;

/** A panel each, so the tabs are tabs rather than an empty shell with a gap. */
const RANGE_CAPTION: Record<(typeof RANGES)[number], string> = {
	"1D": "Last 24 hours.",
	"1M": "Last 30 days.",
	"1Y": "Last 12 months.",
	"7D": "Last 7 days.",
	All: "Everything on record.",
};

/**
 * The board the theme is judged on.
 *
 * It is a deliberate mirror of the layout HeroUI uses for its own theme
 * playground, and that is not imitation for its own sake: a developer who has
 * been looking at theirs can put the two side by side and compare the THEME
 * rather than re-learning where everything moved to. Same three columns, same
 * set of surfaces, same reading order.
 *
 * What is on it was chosen for what each piece is SENSITIVE to, not for
 * coverage:
 *
 *   form radius  the email field, the select and the OTP slots - nothing else
 *                on this board reads --field-radius, and six small boxes make a
 *                radius change obvious in a way one wide field does not
 *   UI radius    every panel, the segmented control, the action rows
 *   the accent   the brand panel, the gradient tiles, the primary buttons, the
 *                active tab and segment, the switch, the slider fill, and the
 *                avatar monograms - which are a decorative gradient carrying
 *                TEXT, the case that used to need a gradient of its own
 *   the ground   body copy, muted copy, borders, the recessed field fills
 *
 * A component that would look identical under every setting costs a scroll and
 * teaches nothing, so there is not one here.
 *
 * Static props only. It fetches nothing and holds no state worth persisting - a
 * preview that can be in a loading or an error state is a preview that can fail
 * to answer the question it exists for.
 */
export function ThemePreviewBoard({ className }: ThemePreviewBoardProps) {
	/*
	 * `useForm`, not `useAppForm`, deliberately. This board is a colour preview:
	 * the fields are here to be LOOKED at under a candidate palette, and nothing
	 * is submitted. useAppForm requires a schema and always wires a resolver, so
	 * it would put validation errors on a surface whose whole job is showing what
	 * the palette does to a normal field. Any form a user submits uses it.
	 */
	const { control } = useForm<PreviewForm>({
		defaultValues: { email: "", newsletter: true, notifications: true, plan: "monthly", state: "" },
	});

	/*
	 * The OTP is controlled, and it has to be. HeroUI forwards every unrecognised
	 * prop to the `input-otp` package, which forwards them again to the real
	 * <input> - where it has ALREADY set `value` from its own state. So a
	 * `defaultValue` here lands on the same element as `value` and React warns
	 * about an input that is controlled and uncontrolled at once. Seeding local
	 * state gives the four filled slots the board wants and leaves the field
	 * typeable.
	 */
	const [previewCode, setPreviewCode] = useState("4320");

	return (
		<div
			/* THREE columns from xl, and `break-normal` alongside them.
			   The shell sets `[overflow-wrap:anywhere]` on <body> - correct for a
			   feature screen full of user-supplied strings that must never widen a
			   layout, and ruinous here: at three columns inside a page that also
			   carries the report, "Indie Hackers" came out as "Indie Hacker / s"
			   and "By John" as one letter per line. This board holds fixed copy we
			   wrote, so it opts back into ordinary word wrapping. */
			className={cn("grid gap-4 break-normal sm:grid-cols-2 xl:grid-cols-3", className)}
			data-cy="theme-preview-board"
		>
			{/* ── column one: the form surfaces ─────────────────────────────── */}
			<div className="space-y-4">
				<Panel>
					<AppInputGroup
						control={control}
						description="We won't share your email"
						isRequired
						label="Your email"
						name="email"
						placeholder="john@email.com"
						type="email"
					/>

					<AppSelect
						control={control}
						isRequired
						items={[
							{ label: "California", value: "ca" },
							{ label: "New York", value: "ny" },
							{ label: "Texas", value: "tx" },
						]}
						label="State"
						name="state"
						placeholder="Select one"
					/>

					{/* Four "on" controls and a spinner, drawn on one row on purpose:
					    this is where a checkbox rounded to a circle stops being
					    distinguishable from a radio, which is what a generous --radius
					    does to a 16px box if nothing pins it. */}
					<div className="flex flex-wrap items-center gap-5">
						<AppCheckbox
							control={control}
							label="Checked"
							name="newsletter"
						/>
						<AppSwitch
							control={control}
							label="On"
							name="notifications"
						/>
						<Spinner size="sm" />
					</div>

					{/* VERTICAL, and no wrapper. Two previous attempts got this wrong in
					    opposite directions and both are worth recording.

					    `orientation="horizontal"` puts the group's own <Label> into the
					    flex row alongside the cards, so "Billing" ended up sitting to the
					    left of the Monthly card instead of above the pair.

					    Gridding the group root to fix that made it worse: the Label, both
					    Radios and the FieldError are all children of that root, so a
					    two-column grid put the label in cell one and pushed Yearly onto a
					    second row on its own.

					    The component's default layout was right all along - label above,
					    one full-width card per row, the whole card a hit target. It is
					    also the layout the rest of the app uses it in, which is the point
					    of a preview board. */}
					<AppRadioGroup
						control={control}
						items={[
							{ label: "Monthly", value: "monthly" },
							{ label: "Yearly", value: "yearly" },
						]}
						label="Billing"
						name="plan"
					/>

					<div className="space-y-1.5">
						<div className="flex items-baseline justify-between text-sm">
							<span className="font-medium">Price</span>
							<span className="font-mono tabular-nums">$250.00</span>
						</div>
						<Slider
							aria-label="Price"
							defaultValue={62}
							maxValue={100}
							minValue={0}
						>
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
					</div>

					{/* TABS, not a row of toggle buttons - which is what it is in HeroUI's
					    board too, and the distinction is not cosmetic. A toggle group says
					    "independent switches that happen to be adjacent"; tabs say "one of
					    these, always exactly one", which is what a range picker is. It
					    also gets arrow-key navigation and a single tab stop for free. Its
					    active tab is a brand surface carrying text, so it is one of the
					    rows in the report. */}
					<AppTabs
						defaultSelectedKey="1D"
						items={RANGES.map((range) => ({
							content: <p className="text-muted-foreground text-sm">{RANGE_CAPTION[range]}</p>,
							key: range,
							label: range,
						}))}
						label="Chart range"
					/>

					<AppTabs
						defaultSelectedKey="chats"
						items={[
							{
								content: <p className="p-3 text-muted-foreground text-sm">The active tab paints the brand gradient.</p>,
								key: "chats",
								label: "Chats",
							},
							{
								content: <p className="p-3 text-muted-foreground text-sm">And takes its ink from the same token.</p>,
								key: "emails",
								label: "Emails",
							},
						]}
						label="Preview inbox views"
					/>
				</Panel>

				{/* The action menu, as a still. Rows rather than buttons: nothing here
				    does anything, and announcing four controls that do nothing is worse
				    for a screen-reader user than announcing a list. */}
				<Panel>
					<div className="font-medium text-muted-foreground text-xs">Actions</div>
					<ul className="-mx-2 space-y-0.5">
						<ActionRow
							icon={FilePlus2}
							label="New file"
							shortcut="⌘N"
							sublabel="Create a new file"
						/>
						<ActionRow
							icon={Pencil}
							label="Edit file"
							shortcut="⌘E"
							sublabel="Make changes"
						/>
					</ul>
					<Separator />
					<div className="font-medium text-muted-foreground text-xs">Danger zone</div>
					<ul className="-mx-2">
						<ActionRow
							icon={Trash2}
							isDanger
							label="Delete file"
							shortcut="⌘⇧D"
							sublabel="Move to trash"
						/>
					</ul>
				</Panel>
			</div>

			{/* ── column two: identity, verification, buttons ───────────────── */}
			<div className="space-y-4">
				<Panel>
					<div className="flex items-center justify-center">
						<div className="-space-x-3 flex shrink-0">
							{["Ada Lovelace", "Grace Hopper", "Alan Turing", "Katherine Johnson", "Edsger Dijkstra"].map((name) => (
								<AppAvatar
									key={name}
									name={name}
									size="md"
								/>
							))}
							{/* The overflow count is an Avatar, not a span dressed as one.
							    Sharing the component is the only version of "same shape, same
							    size" that survives a token change: a hand-rolled `size-10
							    rounded-full` matched the stack at the default theme and
							    nowhere else, back when `.avatar` was `rounded-3xl` and every
							    radius step moved the five while the sixth stayed a circle.
							    Avatars are pinned to a circle now - see the avatar block in
							    styles.css - so the radius control deliberately does NOT move
							    this row, which is the point worth seeing on a preview board.
							    Text drops below the fallback's `text-sm`: "+5" is a count, not
							    a monogram, and at equal size it out-weighed the initials it
							    trails. */}
							<AppAvatar
								name="5 more people"
								overflowLabel="+5"
								size="md"
							/>
						</div>
					</div>

					<div className="space-y-1 text-center">
						<h3 className="font-semibold text-lg">Verify account</h3>
						<p className="text-muted-foreground text-sm">We've sent a code to a****@gmail.com</p>
					</div>

					{/* `justify-center` on the OTP ITSELF, not a wrapper around it.
					    `.input-otp` is `flex w-full`, but the thing that has to be centred
					    is one level down: its children are two `.input-otp__group`s and a
					    separator, and a group sizes to its three slots rather than growing
					    (the `flex-1` on a slot only shares space WITHIN its own group). So
					    the row filled the panel while its contents sat left, leaving the
					    slack on the right - which is what the outer `justify-center`
					    wrapper could not fix, because the element it was centring was
					    already full width. */}
					<InputOTP
						aria-label="Verification code"
						className="justify-center"
						maxLength={6}
						onChange={setPreviewCode}
						value={previewCode}
					>
						<InputOTP.Group>
							{[0, 1, 2].map((index) => (
								<InputOTP.Slot
									index={index}
									key={index}
								/>
							))}
						</InputOTP.Group>
						<InputOTP.Separator />
						<InputOTP.Group>
							{[3, 4, 5].map((index) => (
								<InputOTP.Slot
									index={index}
									key={index}
								/>
							))}
						</InputOTP.Group>
					</InputOTP>

					<p className="text-center text-muted-foreground text-sm">
						Didn't receive a code?{" "}
						<button
							className="cursor-pointer font-semibold text-accent underline-offset-2 hover:underline"
							type="button"
						>
							Resend
						</button>
					</p>
				</Panel>

				{/* Every button variant at once. `primary` is the accent as a flat fill
				    and `danger` is the status red, so this is where a palette that put
				    the two too close together becomes obvious - rose especially, where
				    the accent IS red and the glyph and the verb have to do the work. */}
				<Panel>
					{/* Two across on phone and tablet, three on desktop, and every one
					    full-width in its cell. A grid of buttons each only as wide as its
					    own label is a ragged edge that reads as six unrelated controls
					    rather than one set - and at a third of the page the three-up
					    version had the label wider than the button. */}
					<div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
						{BUTTON_VARIANTS.map((variant) => (
							<AppButton
								fullWidth
								key={variant}
								variant={variant}
							>
								Click me
							</AppButton>
						))}
					</div>
				</Panel>

				<Panel>
					<div className="flex items-center gap-3">
						<AppGradientIconTile
							icon={Rocket}
							size="lg"
						/>
						<div className="min-w-0">
							<div className="font-semibold">Template</div>
							<div className="text-muted-foreground text-sm">@project_template</div>
						</div>
					</div>
					<p className="text-sm">
						Building the future of UI for web and mobile. Every colour on this page was solved against a contrast bar
						rather than picked.
					</p>
					<div className="flex gap-4 text-sm">
						<span>
							<strong className="font-semibold">8</strong> <span className="text-muted-foreground">Palettes</span>
						</span>
						<span>
							<strong className="font-semibold">224</strong>{" "}
							<span className="text-muted-foreground">Pairings measured</span>
						</span>
					</div>
				</Panel>

				<Panel className="flex-row items-center gap-3">
					<Info
						aria-hidden="true"
						className="size-5 shrink-0 text-muted-foreground"
					/>
					<div className="min-w-0 flex-1">
						<div className="font-medium text-sm">2 credits left</div>
						<div className="text-muted-foreground text-xs">Get a paid plan for more</div>
					</div>
					<AppButton
						className="shrink-0"
						size="sm"
						variant="secondary"
					>
						Upgrade
					</AppButton>
				</Panel>

				<Panel>
					<AppSwitch
						control={control}
						description="Receive push notifications from this app"
						label="Allow notifications"
						name="notifications"
					/>
				</Panel>
			</div>

			{/* ── column three: the brand at full strength ──────────────────── */}
			<div className="space-y-4">
				{/* The loudest brand surface on the board: the gradient carrying words,
				    which is the pairing that used to measure 1.98:1. Nothing in here
				    sets a text colour - `gradient-brand` supplies its own ink, and that
				    pairing is the accessible part rather than a convenience. */}
				<div className={cn("brand-surface relative flex flex-col rounded-2xl shadow-glow", CARD_GAP, CARD_PADDING)}>
					<button
						aria-label="Dismiss"
						className="absolute end-3 top-3 cursor-pointer rounded-full p-1 opacity-80 hover:opacity-100"
						type="button"
					>
						<X
							aria-hidden="true"
							className="size-4"
						/>
					</button>
					<h3 className="font-semibold text-lg">Create an account</h3>
					<p className="text-sm">Start your free 7-day trial. No credit card required.</p>
					<p className="text-xs">
						Secondary copy on a brand surface stays at FULL opacity and differentiates on size and weight instead - /70
						and /80 measured 4.53:1 and 5.41:1 here, which is AA but off the AAA bar everything else holds.
					</p>
				</div>

				<Panel>
					<AppButton
						fullWidth
						variant="primary"
					>
						Get Started
					</AppButton>
					<div className="flex items-center gap-3">
						<Separator className="flex-1" />
						<span className="text-muted-foreground text-xs">OR</span>
						<Separator className="flex-1" />
					</div>
					<AppButton
						fullWidth
						icon={Chrome}
						variant="secondary"
					>
						Continue with Google
					</AppButton>
					<AppButton
						fullWidth
						icon={Apple}
						variant="secondary"
					>
						Continue with Apple
					</AppButton>
				</Panel>

				{/* ONE, not a pair. Two of these sat side by side inside a column that
				    is already a third of the board, so every one of their four text
				    rows truncated - "Indie Hack...", "By Ma...". A card whose every
				    label is cut off demonstrates the truncation, not the theme, and the
				    second card was showing nothing the first does not. */}
				<GroupCard
					members="362 members"
					owner="Martha Reyes"
					title="AI Builders"
				/>

				<Panel>
					<div className="flex items-start gap-3">
						<AppGradientIconTile
							icon={Save}
							size="md"
						/>
						<div className="min-w-0 flex-1">
							<div className="font-semibold">Unsaved changes</div>
							<p className="mt-0.5 text-muted-foreground text-sm">Do you want to save or discard changes?</p>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<AppButton variant="tertiary">Discard</AppButton>
						<AppButton variant="primary">Save changes</AppButton>
					</div>
				</Panel>

				<Panel className="flex-row items-start gap-3">
					<MessageSquare
						aria-hidden="true"
						className="mt-0.5 size-5 shrink-0 text-muted-foreground"
					/>
					<p className="min-w-0 flex-1 text-sm">
						<span className="font-medium">Statuses do not follow the accent.</span>{" "}
						<span className="text-muted-foreground">
							Success, warning and danger are deliberately theme-stable and hue-conventional, so they are not in the
							report. Only the accent rail moves with the brand.
						</span>
					</p>
				</Panel>
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * The padding goes on the CARD, not on a Content slot inside it.
 *
 * This is where two attempts at "make every card match" went wrong, and the
 * cause is in HeroUI's stylesheet rather than in ours: `.card` is
 * `flex flex-col gap-3 p-4` and `.card__content` is `flex flex-1 flex-col gap-1`
 * with NO padding of its own. The root carries the inset.
 *
 * So putting `p-5` on `Card.Content` did not replace anything - it nested 20px
 * inside the root's own 16px for a 36px inset, while the brand card next to it
 * is a plain div at a flat 20px. Two cards, two insets, and a `cn()` that
 * looked like it was unifying them.
 *
 * Dropping Content and putting the padding on the root makes a Panel
 * structurally identical to that brand card: one box, one padding, one gap.
 */
function Panel({
	children,
	className,
	"data-cy": dataCy,
}: {
	children: React.ReactNode;
	className?: string;
	"data-cy"?: string;
}) {
	return (
		<AppGlassCard
			className={cn("flex flex-col", CARD_GAP, CARD_PADDING, className)}
			data-cy={dataCy}
			strength="glass"
		>
			{children}
		</AppGlassCard>
	);
}

function ActionRow({
	icon: Icon,
	isDanger,
	label,
	shortcut,
	sublabel,
}: {
	icon: LucideIcon;
	isDanger?: boolean;
	label: string;
	shortcut: string;
	sublabel: string;
}) {
	return (
		<li className={cn("flex items-center gap-3 rounded-lg px-2 py-1.5", isDanger && "text-destructive")}>
			<Icon
				aria-hidden="true"
				className="size-4 shrink-0"
			/>
			<div className="min-w-0 flex-1">
				<div className="font-medium text-sm">{label}</div>
				<div className={cn("text-xs", isDanger ? "text-destructive/80" : "text-muted-foreground")}>{sublabel}</div>
			</div>
			<Kbd className="shrink-0">{shortcut}</Kbd>
		</li>
	);
}

function GroupCard({ members, owner, title }: { members: string; owner: string; title: string }) {
	return (
		<AppGlassCard
			className={cn("flex flex-col", CARD_GAP, CARD_PADDING)}
			strength="glass"
		>
			{/* A plain tinted block rather than a photograph. A real image would be
			    the one thing on this board that does not move with the theme, and it
			    would be the first thing the eye went to. */}
			<div className="h-16 rounded-xl bg-muted-surface" />
			<div className="truncate font-semibold text-sm">{title}</div>
			<div className="truncate text-muted-foreground text-xs">{members}</div>
			<div className="flex items-center gap-1.5">
				<AppAvatar
					name={owner}
					size="sm"
				/>
				<span className="truncate text-muted-foreground text-xs">By {owner.split(" ")[0]}</span>
			</div>
		</AppGlassCard>
	);
}
