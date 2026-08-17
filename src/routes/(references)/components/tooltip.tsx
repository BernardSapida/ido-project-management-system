import { AppButton, AppGlassCard, AppPageHeader, AppRichTooltip, AppToast, AppTooltip } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Info, Package, PackageCheck, ShieldCheck, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { seo } from "@/config/seo.config";

/**
 * Tooltip lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * Two components on one page because the choice between them is the thing
 * people get wrong. AppTooltip is a titled hint - icon, title, one sentence.
 * AppRichTooltip is a card, and it silently becomes a Popover whenever it has
 * an action or the pointer is coarse - both cases where a real tooltip would be
 * unusable.
 *
 * Tab through this page with the mouse untouched. Every trigger here is a real
 * button, so every card is reachable; that is the check that matters most.
 */
export const Route = createFileRoute("/(references)/components/tooltip")({
	head: () => ({
		meta: [{ title: seo.title("Tooltip lab") }, { content: "noindex", name: "robots" }],
	}),
	component: TooltipLabPage,
});

function TooltipLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A titled hint, and the enriched card that replaces it when there is more to say."
				title="Tooltip lab"
			/>
			<PlainSection />
			<RichSection />
			<ActionSection />
			<PlacementSection />
			<OverflowSection />
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
	return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/* -------------------------------------------------------------------------- */

/** The one-line label. Still the right answer most of the time. */
function PlainSection() {
	return (
		<LabSection
			description="AppTooltip: an inline icon, a title, and one sentence. Reach for this first - the title is what makes it scannable, and a gradient card for something that fits in a sentence is a pop-up nobody asked for. The icon defaults to Info; pass one that matches the subject where there is a better fit."
			title="Plain"
		>
			<Row>
				<AppTooltip
					data-cy="plain-text"
					description="Same-day covers any address inside the metro, which is why it sells out first."
					title="Same-day service"
				>
					<AppButton
						data-cy="trigger-plain-text"
						size="sm"
						variant="secondary"
					>
						What is same-day?
					</AppButton>
				</AppTooltip>
				<AppTooltip
					data-cy="plain-icon"
					description="Checked against the national ID registry when the account was created."
					icon={ShieldCheck}
					title="Verified customer"
				>
					<AppButton
						aria-label="About verification"
						data-cy="trigger-plain-icon"
						icon={ShieldCheck}
						isIconOnly
						size="sm"
						variant="ghost"
					/>
				</AppTooltip>
			</Row>
		</LabSection>
	);
}

/** The card, with no action - still a real tooltip on a mouse. */
function RichSection() {
	return (
		<LabSection
			description="AppRichTooltip: gradient tile, title, description, and an optional tick list. Icon, title and description are all required by the type. With no action it stays a hover/focus tooltip on a pointer device - and becomes a tappable Popover on touch, because hover does not exist there and a hover-only disclosure is invisible to every phone user."
			title="Rich"
		>
			<Row>
				<AppRichTooltip
					data-cy="rich-plain"
					description="You can book another dispatch 90 days after your last freight booking. We work the date out from your record, so it moves with you."
					icon={CalendarClock}
					title="Booking window"
				>
					<AppButton
						data-cy="trigger-rich-plain"
						size="sm"
						variant="secondary"
					>
						Booking window
					</AppButton>
				</AppRichTooltip>
				<AppRichTooltip
					data-cy="rich-points"
					description="Screening is a short customs form plus a weight check at the warehouse."
					icon={PackageCheck}
					points={["Takes about 10 minutes", "Answers are confidential", "A hold is a date, not a verdict"]}
					title="What screening involves"
				>
					<AppButton
						data-cy="trigger-rich-points"
						size="sm"
						variant="secondary"
					>
						With a tick list
					</AppButton>
				</AppRichTooltip>
				<AppRichTooltip
					data-cy="rich-icon"
					description="Same-day is the widest service: any metro address can take it, which is why it sells out first."
					icon={Package}
					title="Why same-day matters"
				>
					<AppButton
						aria-label="Why same-day matters"
						data-cy="trigger-rich-icon"
						icon={Info}
						isIconOnly
						size="sm"
						variant="ghost"
					/>
				</AppRichTooltip>
			</Row>
		</LabSection>
	);
}

/** With an action - which forces the Popover branch. */
function ActionSection() {
	return (
		<LabSection
			description="Give it an action and it is no longer a tooltip: react-aria closes a tooltip the moment the pointer leaves the trigger, so a button inside one cannot be clicked and is not in the tab order. These render as a Popover instead - same card, real focus management, Escape closes it. Tab to one and press Enter to see."
			title="With an action"
		>
			<Row>
				<AppRichTooltip
					action={{
						label: "Upgrade now",
						onPress: () =>
							AppToast.success("Premium enabled", {
								description: "Faster matching is on for this account.",
								icon: Zap,
							}),
					}}
					data-cy="action-premium"
					description="Unlock priority matching and a wider search radius on every request you post."
					icon={Zap}
					points={["Priority matching", "50km search radius", "Unlimited active requests"]}
					title="Premium access"
				>
					<AppButton
						data-cy="trigger-action-premium"
						size="sm"
						variant="primary"
					>
						Premium tooltip
					</AppButton>
				</AppRichTooltip>
				<AppRichTooltip
					action={{
						label: "Verify identity",
						onPress: () =>
							AppToast.info("Verification started", {
								description: "You'll need your national ID to hand.",
								icon: ShieldCheck,
							}),
					}}
					data-cy="action-verify"
					description="Verified customers are allocated first and can check in with an account number instead of an ID card."
					icon={ShieldCheck}
					title="Get verified"
				>
					<AppButton
						data-cy="trigger-action-verify"
						size="sm"
						variant="secondary"
					>
						Get verified
					</AppButton>
				</AppRichTooltip>
			</Row>
		</LabSection>
	);
}

/** The four sides. */
function PlacementSection() {
	return (
		<LabSection
			description="Top, bottom, left and right. Placement is a preference, not a promise - the card flips itself when there is no room, which is why nothing here should be positioned by hand."
			title="Placement"
		>
			<Row>
				{(["top", "bottom", "left", "right"] as const).map((placement) => (
					<AppRichTooltip
						data-cy={`placed-${placement}`}
						description="Placement is a starting preference; the card flips when it would go off-screen."
						icon={Info}
						key={placement}
						placement={placement}
						title={`Placed ${placement}`}
					>
						<AppButton
							data-cy={`trigger-placed-${placement}`}
							size="sm"
							variant="secondary"
						>
							{placement}
						</AppButton>
					</AppRichTooltip>
				))}
			</Row>
		</LabSection>
	);
}

/** Content long enough to prove the max width holds. */
function OverflowSection() {
	return (
		<LabSection
			description="The card is capped at max-w-xs and wraps. Without a cap a tooltip stretches to its longest line and becomes a banner nobody can read across - and on a wide monitor it can end up wider than the content it is describing."
			title="Long content"
		>
			<Row>
				<AppRichTooltip
					data-cy="long-card"
					description="Customs paperwork, restricted goods, an address outside the service area, and any shipment over the weight limit in the last six months all require a manager to sign off in person before dispatch can proceed - the app can only tell you that a review is needed, never that you are cleared."
					icon={PackageCheck}
					points={[
						"Travel to a malaria-risk area defers for 12 months",
						"A tattoo or piercing defers for 6 months",
						"Most antibiotic courses defer until 7 days after the last dose",
					]}
					title="Everything the screening questionnaire can flag, and what each one means for your eligibility"
				>
					<AppButton
						data-cy="trigger-long-card"
						size="sm"
						variant="secondary"
					>
						Long card
					</AppButton>
				</AppRichTooltip>
				<AppTooltip
					data-cy="long-plain"
					description="A plain tooltip with a sentence long enough that it has to wrap onto several lines rather than run off the edge of the viewport - and it wraps between words, not through them."
					icon={Package}
					title="A plain tooltip that wraps"
				>
					<AppButton
						data-cy="trigger-long-plain"
						size="sm"
						variant="secondary"
					>
						Long label
					</AppButton>
				</AppTooltip>
			</Row>
		</LabSection>
	);
}
