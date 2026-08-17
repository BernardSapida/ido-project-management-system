import type { TrackingItem } from "@bernardsapida/web-ui";
import { AppButton, AppChip, AppGlassCard, AppPageHeader, AppToast, AppTracking } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Boxes, Package, PackageCheck, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Tracking lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * The interactive card at the top is the one to poke at: advance it a step and
 * the marker, the rail, the chip and the footer line all have to move together,
 * and all of it is a transition rather than a repaint.
 *
 * Below it are the ends of the range - nothing started, everything finished -
 * and the content that breaks the row: a label long enough to wrap next to a
 * chip that must not shrink.
 */
export const Route = createFileRoute("/(references)/components/tracking")({
	head: () => ({
		meta: [{ title: seo.title("Tracking lab") }, { content: "noindex", name: "robots" }],
	}),
	component: TrackingLabPage,
});

function TrackingLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A report on something happening elsewhere - not a form the user walks through."
				title="Tracking lab"
			/>
			<LiveSection />
			<HorizontalSection />
			<EdgeSection />
			<NoFooterSection />
			<ContentSection />
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

/** A card in its own panel, at the width one really gets. */
function CardFrame({ children }: { children: ReactNode }) {
	return <div className="max-w-md rounded-3xl border border-border bg-surface p-4 sm:p-5">{children}</div>;
}

/** The other slot: a band across a detail page, at the full content width. */
function WideCardFrame({ children }: { children: ReactNode }) {
	return <div className="rounded-3xl border border-border bg-surface p-4 sm:p-5">{children}</div>;
}

/* -------------------------------------------------------------------------- */

const STEPS = [
	{ key: "posted", label: "Request posted", sublabel: "23 Jul - 10:30 AM" },
	{
		key: "matched",
		label: "Warehouse assigned",
		sublabel: "23 Jul - 02:15 PM",
	},
	{
		key: "collected",
		label: "Picked up",
		sublabel: "The courier is at the warehouse",
	},
	{ key: "delivered", label: "Delivered", sublabel: "Expected tomorrow" },
] as const;

/** Build the item list from a cursor, so every state is reachable by pressing. */
function itemsAt(cursor: number): TrackingItem[] {
	return STEPS.map((step, index) => ({
		key: step.key,
		label: step.label,
		status: index < cursor ? "done" : index === cursor ? "live" : "pending",
		sublabel: step.sublabel,
	}));
}

/** Drive it by hand. Watch the marker, rail, chip and footer line agree. */
function LiveSection() {
	const [cursor, setCursor] = useState(2);
	const isComplete = cursor >= STEPS.length;

	return (
		<LabSection
			description="Advance it and watch the change rather than the result: the ring recolours, the gradient floods the marker, the tick cross-fades in over the pulsing core, and the rail wipes downward - the direction the events happened in. Nothing here unmounts, because a remounted node cannot transition. The footer names the running step in words; there is no percentage bar, since that would be this same list with the step names stripped off. Footer actions are typed rather than a free node, so the card owns their width and variant: full-width, primary above ghost, under a rule."
			title="Interactive"
		>
			<div className="space-y-4">
				<CardFrame>
					<AppTracking
						data-cy="live"
						description="ORD-25841"
						footer={{
							action: {
								label: "Contact warehouse",
								onPress: () =>
									AppToast.info("Warehouse contacted", {
										description: "Someone at the desk will call you back.",
										icon: PackageCheck,
									}),
							},
							detail: "4:30 PM",
							label: "Expected delivery",
							secondaryAction: {
								label: "Cancel request",
								onPress: () =>
									AppToast.warning("Cancel this request?", {
										description: "The lab does not cancel anything.",
										icon: Boxes,
									}),
							},
							value: isComplete ? "Delivered" : "Tomorrow",
						}}
						headerAction={
							<AppChip
								emphasis="soft"
								icon={Truck}
								label="ETA 15 Jul"
								size="sm"
								tone="accent"
							/>
						}
						icon={Boxes}
						items={itemsAt(cursor)}
						title="Request tracking"
					/>
				</CardFrame>
				<div className="flex flex-wrap items-center gap-2">
					<AppButton
						data-cy="live-back"
						isDisabled={cursor === 0}
						onPress={() => setCursor((value) => value - 1)}
						size="sm"
						variant="secondary"
					>
						Back a step
					</AppButton>
					<AppButton
						data-cy="live-advance"
						isDisabled={isComplete}
						onPress={() => setCursor((value) => value + 1)}
						size="sm"
						variant="primary"
					>
						Advance
					</AppButton>
					<p className="text-sm text-muted">{isComplete ? "All steps done" : `Live step: ${STEPS[cursor]?.label}`}</p>
				</div>
			</div>
		</LabSection>
	);
}

/**
 * The wide slot, and the proof that it is the container asking. Both cards below
 * are given the same props; only the width they are handed differs.
 */
function HorizontalSection() {
	const [cursor, setCursor] = useState(2);
	const isComplete = cursor >= STEPS.length;

	// A function, not one element rendered twice: the two frames are two
	// instances of the same card, and two instances may never share a data-cy.
	const card = (dataCy: string) => (
		<AppTracking
			data-cy={dataCy}
			description="ORD-25841"
			footer={{
				action: {
					label: "Contact warehouse",
					onPress: () =>
						AppToast.info("Warehouse contacted", {
							description: "Someone at the desk will call you back.",
							icon: PackageCheck,
						}),
				},
				detail: "4:30 PM",
				label: "Expected delivery",
				secondaryAction: {
					label: "Cancel request",
					onPress: () =>
						AppToast.warning("Cancel this request?", {
							description: "The lab does not cancel anything.",
							icon: Boxes,
						}),
				},
				value: isComplete ? "Delivered" : "Tomorrow",
			}}
			headerAction={
				<AppChip
					emphasis="soft"
					icon={Truck}
					label="ETA 15 Jul"
					size="sm"
					tone="accent"
				/>
			}
			icon={Boxes}
			items={itemsAt(cursor)}
			orientation="horizontal"
			title="Request tracking"
		/>
	);

	return (
		<LabSection
			description="Not a web-versus-mobile switch - a wide-versus-narrow one, and desktop has both. Use it for the status band at the top of a detail page, where the card owns the content width and the real content sits under it; standing the timeline up there spends 300px of height on a mostly empty column and pushes the page's subject below the fold. Advance it and the rail wipes rightward instead of down, the chip narrows to the live step alone (four pills under four markers is the marker row said twice, and the one that matters stops standing out), and the footer's buttons shrink to their labels and move to the end of the row. The second card is the same component with the same props in a max-w-md frame: it renders vertically, because the query asks the card how wide it is rather than asking the window - a two-up grid on a 1440px desktop is a narrow container, and the viewport cannot tell you that. Narrow the browser and the first one crosses back at 42rem of card, not of screen."
			title="Horizontal"
		>
			<div className="space-y-4">
				<WideCardFrame>{card("wide-band")}</WideCardFrame>
				<div className="flex flex-wrap items-center gap-2">
					<AppButton
						data-cy="wide-back"
						isDisabled={cursor === 0}
						onPress={() => setCursor((value) => value - 1)}
						size="sm"
						variant="secondary"
					>
						Back a step
					</AppButton>
					<AppButton
						data-cy="wide-advance"
						isDisabled={isComplete}
						onPress={() => setCursor((value) => value + 1)}
						size="sm"
						variant="primary"
					>
						Advance
					</AppButton>
					<p className="text-sm text-muted">{isComplete ? "All steps done" : `Live step: ${STEPS[cursor]?.label}`}</p>
				</div>
				<CardFrame>{card("wide-narrow")}</CardFrame>
			</div>
		</LabSection>
	);
}

/** Both ends of the range, where a card can end up reporting the wrong state. */
function EdgeSection() {
	return (
		<LabSection
			description="Nothing started and everything finished. The first still has a live step, at index 0 - something is happening even though no step is done. The second has no live step at all, which is the case to check the footer on: with nothing running it falls back to the footer's own value and drops the pulsing dot, because a dot still pulsing on a delivered card claims work that has stopped."
			title="Both ends"
		>
			<div className="grid gap-4 lg:grid-cols-2">
				<CardFrame>
					<AppTracking
						data-cy="edge-start"
						description="ORD-25902"
						footer={{
							detail: "—",
							label: "Expected delivery",
							value: "Not scheduled",
						}}
						icon={Package}
						items={itemsAt(0)}
						title="Just posted"
					/>
				</CardFrame>
				<CardFrame>
					<AppTracking
						data-cy="edge-complete"
						description="ORD-25710"
						footer={{ detail: "11:05 AM", label: "Delivered", value: "Today" }}
						headerAction={
							<AppChip
								emphasis="soft"
								icon={Truck}
								label="Complete"
								size="sm"
								tone="success"
							/>
						}
						icon={Boxes}
						items={STEPS.map((step) => ({
							key: step.key,
							label: step.label,
							status: "done" as const,
							sublabel: step.sublabel,
						}))}
						title="Fully delivered"
					/>
				</CardFrame>
			</div>
		</LabSection>
	);
}

/** Timeline only. */
function NoFooterSection() {
	return (
		<LabSection
			description="The footer is optional. Drop it when the card is already inside a page that says the same thing - two 'expected tomorrow' lines on one screen is one too many. The timeline still has to stand on its own, so the last item keeps its sublabel."
			title="Without a footer"
		>
			<CardFrame>
				<AppTracking
					data-cy="no-footer"
					description="ORD-25841"
					icon={PackageCheck}
					items={itemsAt(1)}
					title="Screening progress"
				/>
			</CardFrame>
		</LabSection>
	);
}

const LONG_ITEMS: TrackingItem[] = [
	{
		key: "posted",
		label: "Order posted to every warehouse within 25km",
		status: "done",
		sublabel: "23 Jul - 10:30 AM, by Quezon City North Depot's night desk",
	},
	{
		key: "review",
		label: "Awaiting manager review",
		status: "live",
		sublabel: "Three screening answers need signing off in person before collection can proceed",
	},
	{
		key: "collect",
		label: "Collection",
		status: "pending",
		sublabel: "Not yet scheduled",
	},
];

/** Long labels next to a chip that must not shrink. */
function ContentSection() {
	return (
		<LabSection
			description="A label and sublabel long enough to wrap, beside a chip that has to hold its size. The chip is shrink-0 and the text column is min-w-0, which is the pair that stops the chip being squeezed into an ellipsis."
			title="Long content"
		>
			<CardFrame>
				<AppTracking
					data-cy="long"
					description="#ORD-25999 - Quezon City North Depot, night desk"
					footer={{
						detail: "Tomorrow",
						label: "Earliest pickup",
						value: "Pending manager sign-off",
					}}
					icon={PackageCheck}
					items={LONG_ITEMS}
					title="A request title long enough to need truncating"
				/>
			</CardFrame>
		</LabSection>
	);
}
