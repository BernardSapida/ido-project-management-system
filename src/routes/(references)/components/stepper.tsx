import { AppButton, AppGlassCard, AppPageHeader, AppStepper, type StepperStep } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, ClipboardCheck, IdCard, PackageCheck } from "lucide-react";
import { type ReactNode, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Stepper lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * The stepper is the one component with two entirely different renderings, so
 * the thing to check on this page is that they agree: drag the window across
 * the `sm` breakpoint and the step the bar names must be the step the circles
 * highlight. Everything else here is a count or a label length that has broken
 * the row before - two steps, six steps, and a label too long for its column.
 */
export const Route = createFileRoute("/(references)/components/stepper")({
	head: () => ({
		meta: [{ title: seo.title("Stepper lab") }, { content: "noindex", name: "robots" }],
	}),
	component: StepperLabPage,
});

function StepperLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Circles on desktop, a progress bar on mobile - the same state either way."
				title="Stepper lab"
			/>
			<InteractiveSection />
			<IconModeSection />
			<StatesSection />
			<CountsSection />
			<ContentSection />
			<InFormSection />
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

/* -------------------------------------------------------------------------- */

const DISPATCH_STEPS: StepperStep[] = [
	{ description: "Who you are", key: "identity", label: "Identity" },
	{
		description: "Contents and packaging",
		key: "screening",
		label: "Screening",
	},
	{ description: "Pick a window", key: "schedule", label: "Schedule" },
	{ description: "Check and submit", key: "review", label: "Review" },
];

/** Drive it by hand. This is the one to resize the window on. */
function InteractiveSection() {
	const [step, setStep] = useState(1);
	const isLast = step === DISPATCH_STEPS.length - 1;

	return (
		<LabSection
			description="Back and Next move the same state the circles read from. Completed circles are clickable here because onStepChange is passed; upcoming ones never are, since a step the user hasn't reached hasn't been validated."
			title="Interactive"
		>
			<AppStepper
				currentStep={step}
				data-cy="interactive"
				onStepChange={setStep}
				steps={DISPATCH_STEPS}
			/>
			<div className="flex flex-wrap items-center gap-2 pt-2">
				<AppButton
					data-cy="interactive-back"
					isDisabled={step === 0}
					onPress={() => setStep((value) => value - 1)}
					size="sm"
					variant="secondary"
				>
					Back
				</AppButton>
				<AppButton
					data-cy="interactive-next"
					isDisabled={isLast}
					onPress={() => setStep((value) => value + 1)}
					size="sm"
					variant="primary"
				>
					Next
				</AppButton>
				<p className="text-sm text-muted">
					currentStep = {step} ({DISPATCH_STEPS[step]?.label})
				</p>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const ICON_STEPS: StepperStep[] = [
	{
		description: "Who you are",
		icon: IdCard,
		key: "identity",
		label: "Identity",
	},
	{
		description: "Contents and packaging",
		icon: PackageCheck,
		key: "screening",
		label: "Screening",
	},
	{
		description: "Pick a window",
		icon: CalendarClock,
		key: "schedule",
		label: "Schedule",
	},
	{
		description: "Check and submit",
		icon: ClipboardCheck,
		key: "review",
		label: "Review",
	},
];

/** The second marker mode: a glyph per step instead of a number. */
function IconModeSection() {
	const [step, setStep] = useState(2);

	return (
		<LabSection
			description="Give every step an icon and the circle carries that instead of the digit - it keeps its shape the whole way through and only the colour moves, which suits a flow whose steps are recognisable things rather than an ordered count. Numbers swap to a tick when done; icons do not, because the icon is the point. Either way, done fills with the brand gradient and turns white. Don't mix the two modes in one row."
			title="Icons instead of numbers"
		>
			<AppStepper
				currentStep={step}
				data-cy="icons"
				onStepChange={setStep}
				steps={ICON_STEPS}
			/>
			<div className="flex flex-wrap items-center gap-2 pt-2">
				<AppButton
					data-cy="icons-back"
					isDisabled={step === 0}
					onPress={() => setStep((value) => value - 1)}
					size="sm"
					variant="secondary"
				>
					Back
				</AppButton>
				<AppButton
					data-cy="icons-next"
					isDisabled={step === ICON_STEPS.length - 1}
					onPress={() => setStep((value) => value + 1)}
					size="sm"
					variant="primary"
				>
					Next
				</AppButton>
			</div>
		</LabSection>
	);
}

/** Every position, frozen, so all three marker states are on screen at once. */
function StatesSection() {
	return (
		<LabSection
			description="First, middle and last. A completed step changes shape as well as colour - the digit becomes a tick - because the palette is a single hue and filled-vs-outlined is too fine a distinction to be the only signal."
			title="Positions"
		>
			<div className="space-y-6">
				{DISPATCH_STEPS.map((step, index) => (
					<div
						className="space-y-1.5"
						key={step.key}
					>
						<p className="text-xs font-medium text-muted">currentStep = {index}</p>
						<AppStepper
							currentStep={index}
							data-cy={`position-${index}`}
							steps={DISPATCH_STEPS}
						/>
					</div>
				))}

				{/*
				 * Out of range, which is not a hypothetical: a step count that comes
				 * from data and an index that comes from a URL will disagree
				 * eventually. It clamps to the last step rather than rendering a row
				 * with nothing current in it.
				 */}
				<div className="space-y-1.5">
					<p className="text-xs font-medium text-muted">currentStep = 9, out of range</p>
					<AppStepper
						currentStep={9}
						data-cy="out-of-range"
						steps={DISPATCH_STEPS}
					/>
				</div>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const TWO_STEPS: StepperStep[] = [
	{ key: "scan", label: "Face scan" },
	{ key: "id", label: "National ID" },
];

const SIX_STEPS: StepperStep[] = [
	{ key: "account", label: "Account" },
	{ key: "identity", label: "Identity" },
	{ key: "health", label: "Health" },
	{ key: "eligibility", label: "Eligibility" },
	{ key: "schedule", label: "Schedule" },
	{ key: "review", label: "Review" },
];

/** Where the row runs out of horizontal space. */
function CountsSection() {
	return (
		<LabSection
			description="Two steps and six. Six is the practical ceiling on a laptop - past that the labels truncate and the count means more than the names, which is the mobile rendering's argument."
			title="Step counts"
		>
			<div className="space-y-6">
				<div className="space-y-1.5">
					<p className="text-xs font-medium text-muted">2 steps</p>
					<AppStepper
						currentStep={1}
						data-cy="count-2"
						steps={TWO_STEPS}
					/>
				</div>
				<div className="space-y-1.5">
					<p className="text-xs font-medium text-muted">6 steps</p>
					<AppStepper
						currentStep={3}
						data-cy="count-6"
						steps={SIX_STEPS}
					/>
				</div>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const TERSE_STEPS: StepperStep[] = [
	{ key: "details", label: "Details" },
	{ key: "consent", label: "Consent" },
	{ key: "done", label: "Done" },
];

const VERBOSE_STEPS: StepperStep[] = [
	{
		description: "Name, contact and service level",
		key: "about",
		label: "About you",
	},
	{
		description: "Contents, destination and restricted goods",
		key: "eligibility",
		label: "Eligibility questionnaire",
	},
	{ description: "Confirm and submit", key: "confirm", label: "Confirm" },
];

/** Labels with and without descriptions, plus one deliberately too long. */
function ContentSection() {
	return (
		<LabSection
			description="Descriptions are optional and only show from sm up; on mobile only the current step's description appears, because the others are not what the user is doing. The long label truncates rather than wrapping the row into two heights."
			title="Labels and descriptions"
		>
			<div className="space-y-6">
				<div className="space-y-1.5">
					<p className="text-xs font-medium text-muted">Labels only</p>
					<AppStepper
						currentStep={1}
						data-cy="terse"
						steps={TERSE_STEPS}
					/>
				</div>
				<div className="space-y-1.5">
					<p className="text-xs font-medium text-muted">With descriptions, one label overlong</p>
					<AppStepper
						currentStep={1}
						data-cy="verbose"
						steps={VERBOSE_STEPS}
					/>
				</div>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** The shape a real form uses it in: stepper at the top of the card, inside the panel padding. */
function InFormSection() {
	const [step, setStep] = useState(0);

	return (
		<LabSection
			description="How it sits in a form: pinned above the fields, separated by a rule, with the step count carrying the sense of how much is left. The panel below is a stand-in for the step's fields."
			title="In a form"
		>
			<AppGlassCard
				className="border border-border/60"
				strength="glass"
			>
				<AppGlassCard.Content className="space-y-5 p-4 sm:p-5">
					<AppStepper
						currentStep={step}
						data-cy="in-form"
						onStepChange={setStep}
						steps={DISPATCH_STEPS}
					/>
					<div className="h-px bg-border" />
					<div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
						Fields for “{DISPATCH_STEPS[step]?.label}” go here.
					</div>
					<div className="flex justify-between gap-2">
						<AppButton
							isDisabled={step === 0}
							onPress={() => setStep((value) => value - 1)}
							size="sm"
							variant="secondary"
						>
							Back
						</AppButton>
						<AppButton
							isDisabled={step === DISPATCH_STEPS.length - 1}
							onPress={() => setStep((value) => value + 1)}
							size="sm"
							variant="primary"
						>
							Next
						</AppButton>
					</div>
				</AppGlassCard.Content>
			</AppGlassCard>
		</LabSection>
	);
}
