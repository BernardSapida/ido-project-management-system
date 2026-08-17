import { AppButton, AppGlassCard, AppPageHeader, AppToast } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	BellRing,
	CalendarClock,
	CheckCircle2,
	Package,
	PackageCheck,
	PackageMinus,
	Radar,
	ShieldAlert,
	Truck,
	UserCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { seo } from "@/config/seo.config";

/**
 * Toast lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * Every row is a case that has broken the toast body at least once: an action
 * pill on a coloured rail, content long enough to wrap, a stack deeper than the
 * visible limit, and the loading toasts that come in without a description.
 * Fire them side by side after any change to AppToaster or the `.toast`
 * overrides in styles.css.
 */
export const Route = createFileRoute("/(references)/components/toaster")({
	head: () => ({
		meta: [{ title: seo.title("Toast lab") }, { content: "noindex", name: "robots" }],
	}),
	component: ToastLabPage,
});

function ToastLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Every toast surface the app can produce, on one page."
				title="Toast lab"
			/>
			<VariantSection />
			<LayoutSection />
			<TimingSection />
			<StackingSection />
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
			<AppGlassCard.Content className="space-y-4 p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
				</div>
				<div className="flex flex-wrap gap-2">{children}</div>
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

interface LabButtonProps {
	children: ReactNode;
	onPress: () => void;
}

function LabButton({ children, onPress }: LabButtonProps) {
	return (
		<AppButton
			onPress={onPress}
			size="sm"
			variant="secondary"
		>
			{children}
		</AppButton>
	);
}

/* -------------------------------------------------------------------------- */

/** The four severities plus the neutral default. */
function VariantSection() {
	return (
		<LabSection
			description="The conventional five: green success, blue info, amber warning, red error, slate for a plain toast with no severity."
			title="Variants"
		>
			<LabButton
				onPress={() =>
					AppToast.success("Request posted", {
						description: "Nearby warehouses have been notified.",
						icon: Radar,
					})
				}
			>
				Success
			</LabButton>
			<LabButton
				onPress={() =>
					AppToast.info("Your next delivery window opens on 12 June.", {
						description: "We'll remind you the day before it does.",
						icon: CalendarClock,
					})
				}
			>
				Info
			</LabButton>
			<LabButton
				onPress={() =>
					AppToast.warning("Two items expire in 48 hours.", {
						description: "Move them to a warehouse that can ship them today.",
						icon: PackageMinus,
					})
				}
			>
				Warning
			</LabButton>
			<LabButton
				onPress={() =>
					AppToast.error("Couldn't post your request.", {
						description: "The warehouse rejected the shipment reference.",
						icon: ShieldAlert,
					})
				}
			>
				Error
			</LabButton>
			<LabButton
				onPress={() =>
					AppToast.neutral("Draft saved", {
						description: "A plain toast with no severity takes the slate rail.",
						icon: BellRing,
					})
				}
			>
				Default
			</LabButton>
		</LabSection>
	);
}

/** Body permutations. Each one lands on a different branch in AppToaster. */
function LayoutSection() {
	return (
		<LabSection
			description="An action pill on a coloured rail, a domain icon rather than a status glyph, and content long enough to wrap onto three lines."
			title="Layouts"
		>
			<LabButton
				onPress={() =>
					AppToast.info("New update available", {
						// No `clear()` to fake a dismissal any more: pressing an action
						// closes the toast it is in, so a handler only has to do its own
						// work and say what came of it.
						action: {
							label: "Learn more",
							onPress: () =>
								AppToast.neutral("Release notes opened", {
									description: "Version 3.2 is documented in a new tab.",
									icon: BellRing,
								}),
						},
						description: "Version 3.2 includes performance improvements.",
						icon: BellRing,
					})
				}
			>
				Action pill
			</LabButton>
			<LabButton
				onPress={() =>
					AppToast.error("Shipment rejected", {
						action: {
							label: "Retry",
							onPress: () =>
								AppToast.success("Shipment accepted", {
									description: "The receiving warehouse has it in stock now.",
									icon: Truck,
								}),
						},
						description: "The receiving warehouse could not verify the reference.",
						icon: Truck,
					})
				}
			>
				Action on error
			</LabButton>
			<LabButton
				onPress={() =>
					AppToast.success("Express slot reserved", {
						description: "Held for Request #4821 until 18:00.",
						icon: Package,
					})
				}
			>
				Domain icon
			</LabButton>
			<LabButton
				onPress={() =>
					AppToast.warning("Screening flagged three answers that need a manager to review them in person", {
						action: {
							label: "Open",
							onPress: () =>
								AppToast.neutral("Screening opened", {
									description: "The three flagged answers are ready for sign-off.",
									icon: PackageCheck,
								}),
						},
						description:
							"Customs paperwork, a restricted-goods flag and an address outside the service area all require sign-off before this order can proceed to dispatch.",
						icon: PackageCheck,
					})
				}
			>
				Long content
			</LabButton>
		</LabSection>
	);
}

/** Auto-dismiss, hold, the progress bar, and the loading states. */
function TimingSection() {
	return (
		<LabSection
			description="Success and info drain in 4s, warnings in 7s - watch the bar under the panel recede. Errors hold until dismissed and draw no bar. Hovering a toast pauses both the timer and the bar."
			title="Timing and loading"
		>
			<LabButton
				onPress={() =>
					AppToast.success("Gone in 4 seconds.", {
						description: "The bar under this panel is the timer, not a decoration.",
						icon: CheckCircle2,
					})
				}
			>
				4s success
			</LabButton>
			<LabButton
				onPress={() =>
					AppToast.warning("Gone in 7 seconds.", {
						description: "A warning is worth acting on, so it holds nearly twice as long.",
						icon: PackageMinus,
					})
				}
			>
				7s warning
			</LabButton>
			<LabButton
				onPress={() =>
					AppToast.error("Stays until dismissed.", {
						description: "Close it with the X - this is why the X is always visible.",
						icon: ShieldAlert,
					})
				}
			>
				Persistent error
			</LabButton>
			<LabButton
				onPress={() =>
					AppToast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
						error: {
							description: "The questionnaire could not be submitted - try again.",
							icon: ShieldAlert,
							title: "Screening failed",
						},
						loading: {
							description: "Checking answers against the hold rules.",
							icon: PackageCheck,
							title: "Checking stock",
						},
						success: {
							description: "No holds raised - send them through to dispatch.",
							icon: CheckCircle2,
							title: "Stock confirmed for dispatch",
						},
					})
				}
			>
				Promise
			</LabButton>
			<LabButton
				onPress={() => {
					const key = AppToast.loading("Uploading order records", {
						description: "412 rows queued. This holds until the upload closes it.",
						icon: Truck,
					});

					setTimeout(() => {
						AppToast.close(key);
						AppToast.success("Order records uploaded", {
							description: "412 rows imported, none rejected.",
							icon: UserCheck,
						});
					}, 2000);
				}}
			>
				Manual loading
			</LabButton>
		</LabSection>
	);
}

/** Three visible at once; the rest queue behind. */
function StackingSection() {
	return (
		<LabSection
			description="maxVisibleToasts is 3. Firing five should show three and hold two - the ones behind collapse to the height of the frontmost and hide their close button."
			title="Stacking"
		>
			<LabButton
				onPress={() => {
					AppToast.success("First", {
						description: "Frontmost.",
						icon: CheckCircle2,
					});
					AppToast.info("Second", { description: "One back.", icon: BellRing });
					AppToast.warning("Third", {
						description: "Two back.",
						icon: PackageMinus,
					});
					AppToast.error("Fourth", {
						description: "Queued.",
						icon: ShieldAlert,
					});
					AppToast.success("Fifth", { description: "Queued.", icon: Package });
				}}
			>
				Fire five
			</LabButton>
			<LabButton onPress={() => AppToast.pauseAll()}>Pause all</LabButton>
			<LabButton onPress={() => AppToast.resumeAll()}>Resume all</LabButton>
			<LabButton onPress={() => AppToast.clear()}>Clear all</LabButton>
		</LabSection>
	);
}
