import {
	AppButton,
	AppErrorState,
	AppGlassCard,
	AppPageHeader,
	ErrorCopyGuardProvider,
	type ErrorKind,
} from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Error state lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * This is the surface shown when a page or a component could not produce what
 * the user came for. Every kind is on this page at once, which is the only way
 * to check the thing that actually matters about them - that no two of them
 * read the same, because a user who cannot tell a 404 from a 403 from a dropped
 * wifi cannot fix any of the three.
 */
export const Route = createFileRoute("/(references)/components/error-state")({
	head: () => ({
		meta: [{ title: seo.title("Error state lab") }, { content: "noindex", name: "robots" }],
	}),
	component: ErrorStateLabPage,
});

function ErrorStateLabPage() {
	const [mode, setMode] = useState<BuildMode>("development");

	/*
	 * The provider wraps the whole page rather than only the section that
	 * demonstrates the difference. The guard runs on every state on this page, so
	 * a toggle reaching one of them would be claiming more than it does - and the
	 * point of having it is that you can go back up to Kinds in Production mode
	 * and confirm that nothing there changes.
	 */
	return (
		<ErrorCopyGuardProvider value={mode === "development"}>
			<div className="space-y-6">
				<AppPageHeader
					subtitle="Every failure a page or a component can put in front of a user, on one page."
					title="Error state lab"
				/>
				<BuildModeBar
					mode={mode}
					onChange={setMode}
				/>
				<KindsSection />
				<SpecificitySection />
				<ReferenceSection />
				<PageVariantSection />
				<VagueCopySection mode={mode} />
				<ResponsiveSection />
			</div>
		</ErrorCopyGuardProvider>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * The two builds, and what each one does to this page.
 *
 * There is exactly one difference between them and it is worth being blunt
 * about: the dev-only copy guard. Everything else - the eleven kinds, both
 * variants, the reference block, the offline correction - is identical in a
 * production build, because an error state that behaved differently where it
 * matters would be untestable.
 */
const MODES = [
	{
		label: "Development",
		note: "The copy guard runs. Any state whose copy names nothing gets a strip underneath saying so - see Vague copy is rejected, at the bottom.",
		value: "development",
	},
	{
		label: "Production",
		note: "The copy guard is gone. Vague copy renders exactly as written with nothing marking it, which is what the user would have been handed.",
		value: "production",
	},
] as const;

type BuildMode = (typeof MODES)[number]["value"];

/**
 * The build-mode switch.
 *
 * `import.meta.env.DEV` is fixed when the app is built, so overriding it through
 * context is the only way to see both halves of the component from one running
 * dev server. It simulates that one flag and nothing else: nothing here is
 * minified, no env var moves, and the api is still the local one.
 */
function BuildModeBar({ mode, onChange }: { mode: BuildMode; onChange: (mode: BuildMode) => void }) {
	const active = MODES.find((option) => option.value === mode) ?? MODES[0];

	return (
		/*
		 * Sticky, because the section this governs is a screen and a half below the
		 * buttons - a toggle you have to scroll back up to reach is a toggle nobody
		 * flips a second time, and comparing the two builds is the whole point.
		 */
		<div className="sticky top-4 z-20 lg:top-6">
			<div className="glass-strong flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border-0 p-2 sm:pr-4">
				<fieldset className="flex shrink-0 gap-1">
					<legend className="sr-only">Build mode</legend>
					{MODES.map((option) => (
						<AppButton
							aria-pressed={mode === option.value}
							key={option.value}
							onPress={() => onChange(option.value)}
							size="sm"
							variant={mode === option.value ? "primary" : "secondary"}
						>
							{option.label}
						</AppButton>
					))}
				</fieldset>
				{/* Announced: what the switch changes is below the fold, so a reader
				    who cannot see it needs to be told what just happened. */}
				<p
					aria-live="polite"
					className="min-w-0 flex-1 text-xs text-muted"
				>
					{active.note}
				</p>
			</div>
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

/**
 * Ordered by who can fix it - the user, then time, then an administrator, then
 * us - rather than alphabetically or by status code, because that is the only
 * ordering that says anything about them.
 */
const KINDS: ErrorKind[] = [
	"not-found",
	"unauthenticated",
	"forbidden",
	"offline",
	"network",
	"timeout",
	"rate-limited",
	"conflict",
	"maintenance",
	"server",
	"unknown",
];

function KindsSection() {
	return (
		<LabSection
			description="Eleven kinds, three tones: accent for a wrong turn, warning for something that will pass, danger for something broken. Read them top to bottom and check that no two say the same thing - each one names what happened, who it happened to, and what to press. The tone is confirmation, never the message: the glyph and the words carry it, so all eleven survive greyscale."
			title="Kinds"
		>
			{KINDS.map((kind) => (
				<div
					className="space-y-1.5"
					key={kind}
				>
					<p className="font-mono text-xs text-muted">{kind}</p>
					<AppErrorState
						data-cy={`kind-${kind}`}
						kind={kind}
					/>
				</div>
			))}
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function SpecificitySection() {
	return (
		<LabSection
			description="The preset copy is the floor, not the ceiling. A caller that knows which record, which permission or which endpoint failed passes `detail` and `next` and gets an error the user can act on rather than forward. There is no `message` prop on purpose - one string collapses what happened, why, and what to do into a sentence that answers none of them."
			title="Specificity"
		>
			<div className="space-y-1.5">
				<p className="font-mono text-xs text-muted">preset copy</p>
				<AppErrorState
					data-cy="specificity-preset"
					kind="forbidden"
				/>
			</div>
			<div className="space-y-1.5">
				<p className="font-mono text-xs text-muted">caller knows more</p>
				<AppErrorState
					data-cy="specificity-detailed"
					detail="Confirming dispatches needs the Warehouse Manager role. You're signed in as a Warehouse Clerk at Quezon City North, which can see the queue but not sign it off."
					kind="forbidden"
					next="Ask a manager on shift to confirm it, or ask your account administrator to add the role to your account."
					reference={{
						code: "WAREHOUSE_ROLE_REQUIRED",
						requestId: "req_01HX9TBQ4M7C",
					}}
				/>
			</div>
			<div className="space-y-1.5">
				<p className="font-mono text-xs text-muted">a record, not a route</p>
				<AppErrorState
					detail="Order #4821 is no longer in the system. Orders are removed once they are fulfilled and the warehouse closes them out."
					kind="not-found"
					next="Open the requests list to find the one you meant, or check the reference number on the shipment note."
					reference={{ code: "ORDER_NOT_FOUND" }}
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function ReferenceSection() {
	return (
		<LabSection
			description="The reference block always renders and no prop turns it off. A code names the failure, the request id ties it to one line in the api's logs, the timestamp and page say where the user was, and Copy details puts the lot on the clipboard as plain text. This is what a user hands over when they cannot fix it themselves - without it, a support ticket is a screenshot and a guess."
			title="Reference"
		>
			<div className="space-y-1.5">
				<p className="font-mono text-xs text-muted">code only - the api gave no request id</p>
				<AppErrorState
					data-cy="reference-code-only"
					kind="server"
				/>
			</div>
			<div className="space-y-1.5">
				<p className="font-mono text-xs text-muted">code + request id</p>
				<AppErrorState
					data-cy="reference-with-request-id"
					detail="The allocation service failed while scoring warehouses for Order #4821. The order itself was saved and no notifications went out."
					kind="server"
					reference={{
						code: "MATCH_SCORING_FAILED",
						requestId: "req_01HX9TBQ4M7C",
					}}
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function PageVariantSection() {
	const [kind, setKind] = useState<ErrorKind>("not-found");

	return (
		<LabSection
			description="Two DESIGNS, not two sizes. The panel above is a tinted strip annotating the region it replaced - horizontal, small, quiet, because the rest of the page still works. The page below has the whole viewport and nothing left to annotate, so it leads with the status number, every 0 drawn as the brand mark, over centred copy and a larger pair of buttons. Scaling one into the other would give a very large notification floating in space."
			title="Page variant"
		>
			<div className="flex flex-wrap gap-2">
				{KINDS.map((option) => (
					<AppButton
						key={option}
						onPress={() => setKind(option)}
						size="sm"
						variant={kind === option ? "primary" : "secondary"}
					>
						{option}
					</AppButton>
				))}
			</div>
			{/*
			 * Boxed rather than full-bleed so the lab page keeps its own nav; the
			 * real thing fills the viewport. `key` remounts on every switch, which
			 * is what replays the drop's fall - the animation runs on enter only,
			 * and without the remount only the first kind you pick would show it.
			 */}
			<div className="overflow-hidden rounded-3xl border border-separator-tertiary/50 bg-surface">
				<AppErrorState
					className="min-h-136"
					data-cy="page-variant"
					key={kind}
					kind={kind}
					secondaryAction={{ label: "Go to home", onPress: () => undefined }}
					variant="page"
				/>
			</div>
			<p className="text-xs text-muted">
				404, 401, 403, 408, 409, 429, 500 and 503 have a number to show. Offline, network and unknown do not - the
				request never reached a server that could answer with one - so they get the drop on its own with their glyph
				inside it. That is why the drop is the constant and the digits are the variable.
			</p>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function VagueCopySection({ mode }: { mode: BuildMode }) {
	return (
		<LabSection
			description="The rule this component exists for, enforced at render time in development only. Copy that says nothing - 'Something went wrong', 'An error occurred', anything too short to name a thing - is reported in a strip under the state instead of being drawn. It reports rather than throws because this component is also a route's error boundary, and throwing inside the boundary that is rendering it is the one failure an error state must never cause."
			title="Vague copy is rejected"
		>
			<AppErrorState
				data-cy="vague-copy"
				detail="Something went wrong."
				kind="server"
				next="Please try again later."
				reference={{ code: "DEMO_VAGUE_COPY" }}
				title="Error"
			/>
			<p className="text-xs text-muted">
				{mode === "development"
					? "This is the guard firing, and it is the only thing on this page the toggle moves. Switch it to Production and the strip goes without a word - the three vague sentences above stay exactly as they are, because compiling the guard out was never going to fix them."
					: "No strip, and the same three vague sentences are still on screen - 'Error', 'Something went wrong.', 'Please try again later.' - reading like copy somebody chose. This is what a user gets, and it is why the guard is a dev-time backstop on top of code review rather than a replacement for it."}
			</p>
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

function ResponsiveSection() {
	return (
		<LabSection
			description="The panel stacks under 640px - tile above the text rather than beside it - and the reference row wraps a field at a time with Copy details following it down. Nothing truncates: a code the user cannot read in full is a code they cannot report."
			title="Responsive"
		>
			{WIDTHS.map((width) => (
				<div
					className="space-y-1.5"
					key={width.label}
				>
					<p className="text-xs font-medium text-muted">{width.label}</p>
					<div className={width.className}>
						<AppErrorState
							detail="The stock summary for Quezon City General could not be loaded. Your inventory is unchanged - this is a read that failed."
							kind="network"
							reference={{
								code: "STOCK_SUMMARY_UNREACHABLE",
								requestId: "req_01HX9TBQ4M7C",
							}}
						/>
					</div>
				</div>
			))}
		</LabSection>
	);
}
