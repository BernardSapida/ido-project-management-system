import { AppButton, AppGlassCard, AppPageHeader, AppToast } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Archive, ArrowRight, Download, Plus, Send, ShieldAlert, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Button lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * The grid at the top is the point of the page: every variant against every
 * size and state at once, which is the only way a contrast or height
 * regression shows up before it ships. HeroUI v3 has no `color` prop - danger
 * is a variant, not a colour - so the "all variants and colours" of the
 * checklist is this one axis.
 */
export const Route = createFileRoute("/(references)/components/button")({
	head: () => ({
		meta: [{ title: seo.title("Button lab") }, { content: "noindex", name: "robots" }],
	}),
	component: ButtonLabPage,
});

function ButtonLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Every variant, size and state on one page."
				title="Button lab"
			/>
			<VariantSection />
			<SizeSection />
			<StateSection />
			<LoadingSection />
			<HoldSection />
			<HoldListSection />
			<IconSection />
			<LinkSection />
			<WidthSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
}

function LabSection({ children, description, title }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

function Row({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

/* -------------------------------------------------------------------------- */

const VARIANTS = ["primary", "secondary", "tertiary", "outline", "ghost", "danger", "danger-soft"] as const;
const SIZES = ["sm", "md", "lg"] as const;

/** All seven, side by side. */
function VariantSection() {
	return (
		<LabSection
			description="Semantic, not decorative: primary is the one action moving the user forward and there is at most one per view, tertiary is for dismissing, danger is for destroying, danger-soft is for a destructive action that is not what the screen is about. Picking one by how it looks is how a screen ends up with three primaries."
			title="Variants"
		>
			<Row>
				{VARIANTS.map((variant) => (
					<AppButton
						key={variant}
						variant={variant}
					>
						{variant}
					</AppButton>
				))}
			</Row>
		</LabSection>
	);
}

/** The height grid. Every variant must agree at every size. */
function SizeSection() {
	return (
		<LabSection
			description="Three sizes against all seven variants. Heights have to match across a row - a secondary that is 2px shorter than the primary beside it is visible the moment they sit together in a footer. The icons scale with the button; a large button wearing a small button's glyph is the thing this replaced."
			title="Sizes"
		>
			<div className="space-y-3">
				{SIZES.map((size) => (
					<div
						className="flex flex-wrap items-center gap-2"
						key={size}
					>
						<span className="w-10 shrink-0 text-xs font-medium text-muted">{size}</span>
						{VARIANTS.map((variant) => (
							<AppButton
								icon={Plus}
								key={variant}
								size={size}
								variant={variant}
							>
								{variant}
							</AppButton>
						))}
					</div>
				))}
			</div>
		</LabSection>
	);
}

/** Disabled, across every variant. */
function StateSection() {
	return (
		<LabSection
			description="Disabled on all seven. A disabled button must still be legible - it is telling the user the action exists and is unavailable, so bleaching it to near-white just makes it look broken. Anything disabled for a reason should say the reason nearby, because the button itself cannot be hovered for a tooltip."
			title="Disabled"
		>
			<Row>
				{VARIANTS.map((variant) => (
					<AppButton
						isDisabled
						key={variant}
						variant={variant}
					>
						{variant}
					</AppButton>
				))}
			</Row>
		</LabSection>
	);
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The lab's own route, which is where every link specimen points.
 *
 * A specimen that actually navigates is a specimen you get to press once: the
 * page it leaves for is not this one, and everything below the fold here goes
 * unreviewed. Pointing them at the current route keeps the anchors real -
 * href, middle-click and Open in new tab all still behave - while a plain press
 * lands back on the same screen.
 */
const SELF = "/components/button";

/** isPending held open, plus the real async round trip. */
function LoadingSection() {
	// A counter, because the guard is the point of the component and it is
	// otherwise invisible: a button that fires its handler twice looks exactly
	// like one that fires it once until you count.
	const [presses, setPresses] = useState(0);

	return (
		<LabSection
			description="The top row is isPending pinned on, so the spinner can be looked at. The bottom row returns a promise from onPress, which is all it takes - the button disables itself for the life of it and clears in a finally, so a rejected promise cannot leave one spinning forever. Press one and watch the width; the spinner takes the icon's place, not the label's, so the row does not reflow."
			title="Loading"
		>
			<div className="space-y-3">
				<Row>
					{VARIANTS.map((variant) => (
						<AppButton
							isPending
							key={variant}
							variant={variant}
						>
							{variant}
						</AppButton>
					))}
				</Row>
				<Row>
					<AppButton
						data-cy="send"
						icon={Send}
						onPress={() => wait(1500)}
					>
						Send request
					</AppButton>
					<AppButton
						data-cy="save"
						onPress={() => wait(1500)}
						variant="secondary"
					>
						Save draft
					</AppButton>
					<AppButton
						data-cy="counted"
						onPress={async () => {
							await wait(900);
							setPresses((count) => count + 1);
						}}
						variant="secondary"
					>
						Slow save
					</AppButton>
					{/*
					 * The failure case catches its own rejection. AppButton clears its
					 * pending flag in a finally, so the button recovers either way - but
					 * an error left to propagate out of onPress becomes an unhandled
					 * rejection, since react-aria does not await the handler. Handling
					 * it at the call site, usually into a toast, is the pattern.
					 */}
					<AppButton
						data-cy="fails"
						onPress={async () => {
							try {
								await wait(1500);
								throw new Error("Deliberate failure");
							} catch {
								AppToast.error("Couldn't send the request", {
									description: "The button recovered - press it again.",
									icon: ShieldAlert,
								});
							}
						}}
						variant="danger"
					>
						Fails after 1.5s
					</AppButton>
				</Row>
				<p
					className="text-sm text-muted"
					data-cy="press-count"
				>
					{presses} presses got through
				</p>
			</div>
		</LabSection>
	);
}

/** The three speeds, the icon-only case, and the failure path. */
function HoldSection() {
	// Same counter trick as Loading: the guard is invisible until you count. A
	// click on any of these must move nothing.
	const [fired, setFired] = useState(0);

	return (
		<LabSection
			description="Press and hold. Releasing early fires nothing and the fill retreats; Escape abandons a hold in progress; dragging off the button cancels it. It works from the keyboard too - Tab to one and hold Enter or Space, because these are react-aria press events rather than pointer ones. A tap too short to be a hold forces the tooltip open instead of doing nothing, which is the only answer this button has on a phone, where a tooltip never opens on its own."
			title="Hold to confirm"
		>
			<div className="space-y-3">
				<Row>
					<AppButton
						data-cy="hold-fast"
						hold={{
							action: "archive",
							confirmedLabel: "Archived!",
							speed: "fast",
						}}
						icon={Archive}
						onPress={() => setFired((count) => count + 1)}
						variant="secondary"
					>
						Archive
					</AppButton>
					<AppButton
						data-cy="hold-default"
						hold={{ action: "delete", confirmedLabel: "Deleted!" }}
						icon={Trash2}
						onPress={() => setFired((count) => count + 1)}
						variant="danger"
					>
						Delete
					</AppButton>
					<AppButton
						data-cy="hold-slow"
						hold={{
							action: "revoke this key",
							confirmedLabel: "Revoked!",
							speed: "slow",
						}}
						icon={ShieldAlert}
						onPress={() => setFired((count) => count + 1)}
						variant="danger"
					>
						Revoke API key
					</AppButton>
				</Row>
				<Row>
					<AppButton
						aria-label="Delete this request"
						data-cy="hold-icon-only"
						hold={{ action: "delete" }}
						icon={Trash2}
						isIconOnly
						onPress={() => setFired((count) => count + 1)}
						variant="danger-soft"
					/>
					{/*
					 * Async, and the reason the confirmed label is its own phase: this one
					 * rejects, so the fill completes, the spinner runs, and the label goes
					 * back to "Delete" rather than claiming "Deleted!". A button that says
					 * it succeeded when it did not is worse than one that says nothing -
					 * the user walks away believing it.
					 */}
					<AppButton
						data-cy="hold-fails"
						hold={{ action: "delete", confirmedLabel: "Deleted!" }}
						icon={Trash2}
						onPress={async () => {
							try {
								await wait(1200);
								throw new Error("The server refused the delete");
							} catch (cause) {
								AppToast.error("Couldn't delete the request", {
									description: cause instanceof Error ? cause.message : "Try again.",
									icon: ShieldAlert,
								});
							}
						}}
						variant="danger"
					>
						Delete (fails)
					</AppButton>
					<AppButton
						hold={{ action: "delete" }}
						icon={Trash2}
						isDisabled
						onPress={() => setFired((count) => count + 1)}
						variant="danger"
					>
						Delete (disabled)
					</AppButton>
				</Row>
				<p
					className="text-sm text-muted"
					data-cy="hold-count"
				>
					{fired} holds completed
				</p>
			</div>
		</LabSection>
	);
}

const HOLD_ROWS = [
	{ id: "REQ-4417", title: "Quarterly export" },
	{ id: "REQ-4418", title: "Payroll reconciliation" },
	{ id: "REQ-4419", title: "Vendor onboarding" },
];

/**
 * The pattern in the place it is actually for: a row action, with undo.
 *
 * A hold and an undo are not alternatives. The hold stops the accident, the
 * undo covers the change of mind, and a row you can restore deserves both.
 * Neither of them is a dialog - see the copy.
 */
function HoldListSection() {
	const [rows, setRows] = useState(HOLD_ROWS);

	function remove(row: (typeof HOLD_ROWS)[number]) {
		setRows((current) => current.filter((item) => item.id !== row.id));
		AppToast.warning(`Deleted ${row.id}`, {
			action: {
				label: "Undo",
				onPress: () => setRows((current) => [...current, row].sort((a, b) => a.id.localeCompare(b.id))),
			},
			description: `"${row.title}" is gone from this list.`,
			icon: Trash2,
		});
	}

	return (
		<LabSection
			description="A hold is the confirmation for an action whose consequence the row already shows - this is REQ-4417, and the user is looking at it. It is NOT a replacement for AppDialog, because a hold has nowhere to put a sentence: the moment the answer depends on something the button cannot display (how many people lose access, that the invoices go too, which of three projects this is), that sentence IS the confirmation and a hold silently drops it. Note the glyph is red and the button is not - a filled red pill on every row spends the whole danger budget on a screen nobody came here to delete from - and that the toast still carries Undo, at warning severity so it outlives a 4s read."
			title="Hold on a row, with undo"
		>
			{rows.length === 0 ? (
				<p className="text-sm text-muted">All three deleted. Undo one from its toast, or reload the page.</p>
			) : (
				<ul className="max-w-md divide-y divide-border rounded-lg border border-border">
					{rows.map((row) => (
						<li
							className="flex items-center justify-between gap-3 px-3 py-2"
							key={row.id}
						>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium">{row.title}</p>
								<p className="text-xs text-muted">{row.id}</p>
							</div>
							<AppButton
								aria-label={`Delete ${row.id}`}
								className="text-danger"
								hold={{ action: `delete ${row.id}`, speed: "fast" }}
								icon={Trash2}
								isIconOnly
								onPress={() => remove(row)}
								size="sm"
								variant="ghost"
							/>
						</li>
					))}
				</ul>
			)}
		</LabSection>
	);
}

/** With a glyph, and icon-only. */
function IconSection() {
	return (
		<LabSection
			description="Pass the lucide component, not an element: the button sizes the glyph against itself and marks it aria-hidden, so the label is not announced twice. An icon-only button has no label to announce at all, so aria-label is required by the type - there is no way to ship one without a name."
			title="With icons"
		>
			<Row>
				<AppButton icon={Plus}>New request</AppButton>
				<AppButton
					icon={Download}
					variant="secondary"
				>
					Export
				</AppButton>
				<AppButton
					icon={ArrowRight}
					iconPosition="end"
					variant="secondary"
				>
					Continue
				</AppButton>
				<AppButton
					aria-label="Add a request"
					icon={Plus}
					isIconOnly
				/>
				<AppButton
					aria-label="Delete this request"
					icon={Trash2}
					isIconOnly
					variant="danger"
				/>
				<AppButton
					aria-label="Export as CSV"
					icon={Download}
					isDisabled
					isIconOnly
					variant="ghost"
				/>
			</Row>
		</LabSection>
	);
}

/** A button that navigates is a link. */
function LinkSection() {
	return (
		<LabSection
			description="Pass `to` and this renders an anchor wearing the button's styles, rather than a button inside a link. Wrapping is the trap: nesting one interactive element in another gives two tab stops for one target, and a screen reader reads the name twice. All three point back at THIS lab on purpose - a specimen that navigates away is one you cannot press twice, and half this page is below it. They are still real links, so the thing worth trying is middle-click or Open in new tab, which no button can do."
			title="Links"
		>
			<Row>
				<AppButton
					icon={ArrowRight}
					iconPosition="end"
					to={SELF}
				>
					Continue
				</AppButton>
				<AppButton
					to={SELF}
					variant="secondary"
				>
					Try middle-clicking this
				</AppButton>
				<AppButton
					aria-label="Continue"
					icon={ArrowRight}
					isIconOnly
					to={SELF}
					variant="ghost"
				/>
			</Row>
		</LabSection>
	);
}

/** fullWidth, which is what a phone footer wants. */
function WidthSection() {
	return (
		<LabSection
			description="fullWidth is the mobile default for a form's submit: a thumb aims at a bar, not at a 96px pill in the corner. Two of them stack rather than sitting side by side, so neither gets too narrow to read."
			title="Full width"
		>
			<div className="max-w-sm space-y-2">
				<AppButton fullWidth>Confirm dispatch</AppButton>
				<AppButton
					fullWidth
					variant="tertiary"
				>
					Not now
				</AppButton>
			</div>
		</LabSection>
	);
}
