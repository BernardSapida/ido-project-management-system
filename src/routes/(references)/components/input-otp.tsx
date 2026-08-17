import { AppButton, AppGlassCard, AppInputOTP, AppPageHeader } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Input OTP";

/**
 * Input OTP lab.
 *
 * Things to check by hand:
 *
 * 1. **Paste `123456` into the first slot.** All six fill at once. This is the
 *    reason the component exists rather than an `AppInputGroup` with
 *    `maxLength` - a code is something people copy, and a plain field takes the
 *    paste into one box.
 * 2. **Backspace from the last slot.** It walks backwards through the code
 *    rather than stopping at the box it is in.
 * 3. **Fill the last slot on the auto-submit specimen.** It submits. This is
 *    the one control where "done" is unambiguous, so making the user find a
 *    button they have already earned is a step for nothing.
 */
export const Route = createFileRoute("/(references)/components/input-otp")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: InputOTPLab,
});

function InputOTPLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A one-time code across separate slots. Paste fills all of them; backspace walks back."
				title={TITLE}
			/>
			<BindingSection />
			<LengthSection />
			<CompleteSection />
			<StateSection />
		</div>
	);
}

/* ── 1. Both binding modes ────────────────────────────────────────────────── */

const schema = z.object({
	code: z.string().length(6, "Enter all six digits"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="A code is short enough that the rule is always the same - all of it, or none of it. What differs is who holds the digits."
			title="Bound to a form, or standing alone"
		>
			<div className="grid gap-6 sm:grid-cols-2">
				<BoundSpecimen />
				<StandaloneSpecimen />
			</div>
		</LabSection>
	);
}

function BoundSpecimen() {
	const { control, handleSubmit } = useAppForm<Values>(schema, {
		defaultValues: { code: "" },
	});

	return (
		<div className="flex flex-col gap-3">
			<h3 className="font-medium text-sm text-text-primary">react-hook-form</h3>
			<Form
				className="flex flex-col gap-3"
				onSubmit={handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<AppInputOTP
					control={control}
					data-cy="bound-code"
					description="We sent a code to j****@example.com"
					isRequired
					label="Verify account"
					name="code"
				/>
				<AppButton
					size="sm"
					type="submit"
					variant="secondary"
				>
					Submit incomplete
				</AppButton>
			</Form>
		</div>
	);
}

function StandaloneSpecimen() {
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | undefined>();

	return (
		<div className="flex flex-col gap-3">
			<h3 className="font-medium text-sm text-text-primary">Local state</h3>
			<AppInputOTP
				data-cy="standalone-code"
				description="Checked when the last slot lands, not on every digit."
				errorMessage={error}
				isRequired
				label="Verify account"
				onChange={(next) => {
					setCode(next);
					if (error && next.length === 6) setError(undefined);
				}}
				// A code has no meaningful mid-way state to report, so the check hangs
				// off completion rather than off blur. Complaining at three digits
				// would be telling someone they are not finished typing.
				onComplete={(next) => setError(next === "123456" ? undefined : "That code is not right")}
				value={code}
			/>
			<p className="text-sm text-text-secondary">
				Try <code className="rounded bg-muted-surface/60 px-1.5 py-0.5 text-text-primary text-xs">123456</code>
			</p>
		</div>
	);
}

/* ── 2. Lengths ───────────────────────────────────────────────────────────── */

function LengthSection() {
	const [four, setFour] = useState("");
	const [six, setSix] = useState("");

	return (
		<LabSection
			description="Four or six, and the grouping follows: six splits 3+3 so it can be read back off a phone in two glances, four stays whole. The gap is a readability aid, not a data concern, so it is derived rather than configured."
			title="Four digits, six digits"
		>
			<div className="flex flex-col gap-6">
				<AppInputOTP
					data-cy="length-4"
					label="PIN"
					length={4}
					onChange={setFour}
					value={four}
				/>
				<AppInputOTP
					data-cy="length-6"
					label="Verification code"
					length={6}
					onChange={setSix}
					value={six}
				/>
			</div>
		</LabSection>
	);
}

/* ── 3. onComplete ────────────────────────────────────────────────────────── */

function CompleteSection() {
	const [code, setCode] = useState("");
	const [status, setStatus] = useState<"checking" | "done" | "idle">("idle");

	return (
		<LabSection
			description="Filling the last slot is the submit. Nothing else on a verification screen is waiting on the user, so a button would be a step they have already completed."
			title="Auto-submit on the last digit"
		>
			<AppInputOTP
				data-cy="auto-submit"
				label="Confirm sign-in"
				onChange={(next) => {
					setCode(next);
					if (next.length < 6) setStatus("idle");
				}}
				onComplete={() => {
					setStatus("checking");
					window.setTimeout(() => setStatus("done"), 900);
				}}
				value={code}
			/>
			<p
				aria-live="polite"
				className="text-sm text-text-secondary"
			>
				{status === "idle" ? "Waiting for six digits." : null}
				{status === "checking" ? "Checking…" : null}
				{status === "done" ? "Verified." : null}
			</p>
		</LabSection>
	);
}

/* ── 4. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="A wrong code is the common failure, and it is the field's job to say so rather than a toast that has already gone by the time the user looks up."
			title="States"
		>
			<div className="flex flex-col gap-6">
				<AppInputOTP
					data-cy="state-invalid"
					errorMessage="That code has expired. Request a new one."
					label="Invalid"
					onChange={() => undefined}
					value="123456"
				/>
				<AppInputOTP
					data-cy="state-disabled"
					description="Code verification is currently disabled"
					isDisabled
					label="Disabled"
					onChange={() => undefined}
					value=""
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function LabSection({ children, description, title }: { children: ReactNode; description: string; title: string }) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="flex flex-col gap-4 p-5">
				<div>
					<h2 className="font-semibold text-lg text-text-primary">{title}</h2>
					<p className="mt-1 text-sm text-text-secondary">{description}</p>
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
