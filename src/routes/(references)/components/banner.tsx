import { AppAlert, AppButton, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	CalendarClock,
	Package,
	PackageCheck,
	PackageMinus,
	Radar,
	ShieldAlert,
	Truck,
	WifiOff,
	Wrench,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Banner lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * A banner is the persistent surface: it states a condition that is still true
 * while the user reads it, so unlike a toast it does not time out. Everything
 * that has broken one is on this page - a description with no title, a title
 * long enough to wrap on a phone, an action that has to move under the text
 * below sm, and a dismissal that has to actually remove the node.
 *
 * The width strip at the bottom is the reason this page exists rather than a
 * screenshot: it renders the same banner at phone, tablet and desktop widths
 * side by side, so a padding or wrap regression is visible without resizing.
 */
export const Route = createFileRoute("/(references)/components/banner")({
	head: () => ({
		meta: [{ title: seo.title("Banner lab") }, { content: "noindex", name: "robots" }],
	}),
	component: BannerLabPage,
});

function BannerLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Every in-page banner the app can produce, on one page."
				title="Banner lab"
			/>
			<StatusSection />
			<AnatomySection />
			<ActionSection />
			<DismissSection />
			<ResponsiveSection />
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
				<div className="space-y-3">{children}</div>
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

/* -------------------------------------------------------------------------- */

/** The four severities plus the neutral default. */
function StatusSection() {
	return (
		<LabSection
			description="A gradient tile carrying the status, over a 4%-9% wash of the same hue: green success, blue info, amber warning, red danger, slate for a plain notice. Same five gradients as the toast - both read the --rail-* tokens - but the banner keeps them on the tile and the button, because this surface stays on screen while you work. Colour never carries the meaning alone; each one keeps its glyph and says in words what happened."
			title="Statuses"
		>
			<AppAlert
				data-cy="status-success"
				description="Nearby warehouses have been notified and the order is now visible on the map."
				icon={Radar}
				status="success"
				title="Request posted"
			/>
			<AppAlert
				data-cy="status-accent"
				description="We'll remind you the day before it does."
				icon={CalendarClock}
				status="accent"
				title="Your next delivery window opens on 12 June"
			/>
			<AppAlert
				data-cy="status-warning"
				description="Move them to a warehouse that can ship them today."
				icon={PackageMinus}
				status="warning"
				title="Two items expire in 48 hours"
			/>
			<AppAlert
				data-cy="status-danger"
				description="The warehouse rejected the shipment reference, so nothing was dispatched."
				icon={ShieldAlert}
				status="danger"
				title="Couldn't post your request"
			/>
			<AppAlert
				data-cy="status-default"
				description="Allocation pauses between 02:00 and 04:00. Orders posted in that window are queued, not lost."
				icon={Wrench}
				status="default"
				title="Scheduled maintenance on Sunday"
			/>
		</LabSection>
	);
}

/** Title and description lengths. All three parts are required by the type. */
function AnatomySection() {
	return (
		<LabSection
			description="Icon, title and description are all required - the props are not optional, so a banner cannot ship without them. The title names what happened, the description says what to do about it, and the glyph carries the severity for a reader who cannot see the wash. Write the title as a sentence that would still make sense on its own."
			title="Anatomy"
		>
			<AppAlert
				data-cy="anatomy-short"
				description="Held for Request #4821 until 18:00."
				icon={Package}
				status="success"
				title="Express slot reserved"
			/>
			<AppAlert
				data-cy="anatomy-danger"
				description="Cancel the one you're holding before you book another, or the warehouse will be left short."
				icon={ShieldAlert}
				status="danger"
				title="You can only hold one dispatch slot at a time"
			/>
			<AppAlert
				data-cy="anatomy-long"
				description="Customs paperwork, a restricted-goods flag and an address outside the service area all require sign-off before this order can proceed to dispatch."
				icon={PackageCheck}
				status="warning"
				title="Screening flagged three answers that need a manager to review them in person"
			/>
		</LabSection>
	);
}

/** Up to two actions, under the text. */
function ActionSection() {
	return (
		<LabSection
			description="Two at most, under the description, because the description is the reason for the button. The primary wears the banner's own status as a solid fill - a danger banner's action is a destructive one, and it should not look inviting - while the secondary is a ghost, so there is never a question which one the banner is asking for. They wrap as a pair, so a long label costs a line rather than the layout."
			title="Actions"
		>
			<AppAlert
				action={{ label: "Refresh", onPress: () => window.location.reload() }}
				data-cy="actions-both"
				description="Reload to pick up the latest matching rules."
				icon={Truck}
				secondaryAction={{ label: "Not now", onPress: () => undefined }}
				status="accent"
				title="A new version is available"
			/>
			<AppAlert
				action={{ label: "Retry", onPress: () => undefined }}
				data-cy="actions-danger"
				description="The receiving warehouse could not verify the reference."
				icon={ShieldAlert}
				secondaryAction={{ label: "View shipment", onPress: () => undefined }}
				status="danger"
				title="Shipment rejected"
			/>
			<AppAlert
				action={{ label: "Book a window", onPress: () => undefined }}
				data-cy="actions-primary"
				description="You can book another dispatch slot from 12 June."
				icon={CalendarClock}
				status="success"
				title="Primary only"
			/>
			<AppAlert
				data-cy="actions-none"
				description="A banner with nothing to do about it is just a statement, and that is a legitimate banner."
				icon={PackageMinus}
				status="warning"
				title="No actions at all"
			/>
		</LabSection>
	);
}

/** Dismissal has to remove the node, not just hide it. */
function DismissSection() {
	const [isVisible, setIsVisible] = useState(true);

	return (
		<LabSection
			description="Only give a banner an X when the condition is genuinely optional to read. A blocking condition has no close button, because dismissing it would hide something still true."
			title="Dismissible"
		>
			{isVisible ? (
				<AppAlert
					data-cy="dismissible"
					description="You are seeing cached matches. They will refresh once the connection is back."
					dismissLabel="Dismiss offline notice"
					icon={WifiOff}
					onClose={() => setIsVisible(false)}
					status="warning"
					title="You're offline"
				/>
			) : (
				<p className="text-sm text-muted">Dismissed.</p>
			)}
			<AppButton
				isDisabled={isVisible}
				onPress={() => setIsVisible(true)}
				size="sm"
				variant="secondary"
			>
				Restore
			</AppButton>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const WIDTHS = [
	{ className: "max-w-[320px]", label: "320px - small phone" },
	{ className: "max-w-[480px]", label: "480px - large phone" },
	{ className: "max-w-[768px]", label: "768px - tablet" },
	{ className: "max-w-full", label: "Full - desktop" },
] as const;

/** The same banner at four widths, so a wrap regression shows up on one screen. */
function ResponsiveSection() {
	return (
		<LabSection
			description="One banner, four container widths. The tile holds its size, the text wraps beside it, the two buttons wrap onto separate lines when they have to, and the close button never collides with the title."
			title="Responsive"
		>
			{WIDTHS.map((width) => (
				<div
					className="space-y-1.5"
					key={width.label}
				>
					<p className="text-xs font-medium text-muted">{width.label}</p>
					<div className={width.className}>
						<AppAlert
							action={{ label: "View items", onPress: () => undefined }}
							data-cy={`responsive-${width.label.split(" ")[0]}`}
							description="Two Express items at Quezon City North expire in 48 hours."
							icon={PackageMinus}
							onClose={() => undefined}
							secondaryAction={{
								label: "Remind me later",
								onPress: () => undefined,
							}}
							status="warning"
							title="Stock expiring soon"
						/>
					</div>
				</div>
			))}
		</LabSection>
	);
}
