/**
 * The palette read as 60-30-10, with the actual hexes under it.
 *
 * ## The percentages are illustrative and the component says so
 *
 * Tokens declare WHICH colours exist. They cannot control how much of each
 * appears on a screen - that is decided by the layout, and two pages sharing
 * this palette can land anywhere from 90-8-2 to 50-35-15. A panel that printed
 * "30%" as though it were a measured figure would be the one untrustworthy thing
 * on a page whose whole point is that its numbers are measured. So the bars are
 * labelled as the CONVENTION they come from, and the hexes beside them - which
 * are read off the painted document - are the part that is true.
 *
 * ## Which token is which, because both are easy to get backwards
 *
 * The 60 is the PAGE and the 30 is the CARDS, not the other way round. The page
 * is the dominant surface - it is behind everything, it shows between and around
 * every card, and it is what the eye reads as "the colour of this app". Cards
 * are the secondary surface sitting on it. This panel had them inverted at first
 * and a designer caught it immediately, which is the useful thing to record: the
 * assignment is a convention people know, so getting it wrong is not a private
 * detail, it is a wrong answer on a page whose whole job is being right.
 *
 * The 10 is the BRAND, and `--gradient-brand-via` is where the brand lands. It
 * used to be labelled "the accent", which was true of an older mapping and is
 * now simply wrong: the accent drives the status rail, a deliberately small
 * surface that no 60-30-10 reading would call the 10.
 *
 * Of the five roles a palette carries, three appear here. `secondary` and
 * `accent` do not, and that is the convention rather than an omission - 60-30-10
 * describes three proportions, and a supporting fill and a status highlight are
 * both subdivisions of the 10 rather than bands of their own.
 *
 * ## Why the 30 is a tinted neutral and not a saturated colour
 *
 * The usual mistake reading 60-30-10 into a product UI is to make one of the two
 * surfaces a second brand colour at full strength. Neither is: they are the
 * structural ground, and in every product worth copying the tinted one is the
 * accent hue at a couple of percent chroma. A dashboard that is 30% saturated
 * blue is not branded, it is loud. The accent at full strength is the 10.
 *
 * On `flat` the first two rows resolve to the same colour, and the panel says
 * that outright rather than drawing two identical swatches and hoping nobody
 * looks. That is not a bug in the palette - it is what `flat` means, and it is
 * the reason the Surface control exists.
 *
 */

import { AppGlassCard } from "@bernardsapida/web-ui";
import { usePaintedTokens } from "../hooks/use-painted-tokens";

interface Role {
	/** The token whose painted value this row reports. */
	token: string;
	label: string;
	/** What actually wears it, in the words someone would use pointing at a screen. */
	wears: string;
	share: number;
}

const ROLES: readonly Role[] = [
	{ label: "60", share: 60, token: "--background", wears: "The page behind everything" },
	{ label: "30", share: 30, token: "--surface", wears: "Cards, panels, the raised surfaces" },
	{ label: "10", share: 10, token: "--gradient-brand-via", wears: "The brand - buttons, switches, chips" },
];

const TOKENS = ROLES.map((role) => role.token);

export function SurfaceBreakdown({ signal }: { signal: unknown }) {
	const painted = usePaintedTokens(TOKENS, signal);
	const isFlat = painted["--background"] !== undefined && painted["--background"] === painted["--surface"];

	return (
		<AppGlassCard
			className="p-5"
			data-cy="surface-breakdown"
		>
			<h2 className="font-semibold text-sm">Read as 60-30-10</h2>
			{/* One clause, not a paragraph. The caveat that matters is that the
			    percentages are a convention rather than a measurement - everything
			    else that used to be here was explaining the token layer to somebody
			    who is looking at a bar chart. */}
			<p className="mt-1 text-muted text-xs">
				A convention, not a measurement. The hexes are read off the page as painted.
			</p>

			{/* One bar across the full width, split at the shares it names - the only
			    place the numbers are allowed to be a picture rather than a claim.
			    Reading it as one continuous strip is the whole point: three separate
			    swatches would say these are three colours, and what 60-30-10 is about
			    is the PROPORTION between them. */}
			<div
				aria-hidden="true"
				className="mt-3 flex h-10 overflow-hidden rounded-xl border border-border"
			>
				{ROLES.map((role) => (
					<span
						className="h-full"
						key={role.token}
						style={{ background: painted[role.token], width: `${role.share}%` }}
					/>
				))}
			</div>

			<ul className="mt-3 grid gap-3 sm:grid-cols-3">
				{ROLES.map((role) => (
					<li
						className="flex items-center gap-2.5"
						data-cy={`breakdown-${role.share}`}
						key={role.token}
					>
						<span
							aria-hidden="true"
							className="size-8 shrink-0 rounded-lg border border-border"
							style={{ background: painted[role.token] ?? "transparent" }}
						/>
						<span className="flex min-w-0 flex-col">
							<span className="flex items-baseline gap-2">
								<span className="font-mono font-semibold text-xs tabular-nums">{role.label}</span>
								<span className="font-mono text-[10px] text-muted uppercase">{painted[role.token] ?? "…"}</span>
							</span>
							<span className="truncate text-muted text-xs">{role.wears}</span>
						</span>
					</li>
				))}
			</ul>

			{isFlat ? (
				<output className="mt-3 block text-muted text-xs">
					<strong className="font-semibold text-foreground">The 60 and the 30 are the same colour</strong> - cards are
					told apart by their border alone. Set Surface to <span className="font-medium text-foreground">Raised</span>{" "}
					to step them off the page.
				</output>
			) : null}
		</AppGlassCard>
	);
}
