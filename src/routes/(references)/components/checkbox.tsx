import { AppButton, AppCheckbox, AppPageHeader, AppSwitch } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { LabSection, SpecimenLabel } from "@/features/labs/components/LabSection";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Checkbox";

/**
 * Checkbox lab.
 *
 * Two things this page is for. First, the consent case - the most common
 * checkbox in any app has links inside its label, which is why `label` is a
 * `ReactNode` and not a string. A string type is what pushes that single case
 * back onto a raw HeroUI Checkbox, and then the app has one unwired consent box
 * sitting outside the form.
 *
 * Second, the switch confusion, at the bottom. A checkbox states an intention
 * that a Save button later commits; a switch has already done the thing.
 * Picking the wrong one changes what the user believes pressing it did.
 *
 * Things to check by hand:
 *
 * 1. **Tick and untick the terms box without leaving it.** The error appears
 *    and clears on the change itself. A box is either ticked or it is not -
 *    there is no "still typing" state to wait out, so `onChange` also marks it
 *    touched.
 * 2. **Click the label text**, not the box. It toggles - the whole row is the
 *    hit target, which matters most on a phone.
 */
export const Route = createFileRoute("/(references)/components/checkbox")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: CheckboxLab,
});

function CheckboxLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A single boolean. For several under one legend, that is Checkbox group."
				title={TITLE}
			/>
			<BindingSection />
			<ConsentSection />
			<StateSection />
			<NotASwitchSection />
		</div>
	);
}

/* ── 1. Both binding modes ────────────────────────────────────────────────── */

const schema = z.object({
	agree: z.boolean().refine((v) => v === true, "You must agree to continue"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="A required checkbox is not 'present', it is 'true' - which is why the rule is a refine rather than a min. An unticked box submits false, not undefined, so nothing else would catch it."
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
		defaultValues: { agree: false },
	});

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="control + name."
				title="react-hook-form"
			/>
			<Form
				className="flex flex-col items-start gap-3"
				onSubmit={handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<AppCheckbox
					control={control}
					data-cy="bound-agree"
					isRequired
					label="I agree to the terms of service"
					name="agree"
				/>
				<AppButton
					size="sm"
					type="submit"
					variant="secondary"
				>
					Submit unticked
				</AppButton>
			</Form>
		</div>
	);
}

function StandaloneSpecimen() {
	const [agree, setAgree] = useState(false);
	const [error, setError] = useState<string | undefined>();

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="value + onChange + errorMessage."
				title="Local state"
			/>
			<AppCheckbox
				data-cy="standalone-agree"
				errorMessage={error}
				isRequired
				label="I agree to the terms of service"
				onChange={(next) => {
					setAgree(next);
					setError(next ? undefined : "You must agree to continue");
				}}
				value={agree}
			/>
			<AppButton
				onPress={() => setError(agree ? undefined : "You must agree to continue")}
				size="sm"
				variant="secondary"
			>
				Check it
			</AppButton>
		</div>
	);
}

/* ── 2. Consent ───────────────────────────────────────────────────────────── */

function ConsentSection() {
	const [accepted, setAccepted] = useState(false);

	return (
		<LabSection
			description="`label` is a ReactNode for exactly this. The links have to be inside the label so the whole phrase is one labelled control - putting them beside it gives a screen reader a box labelled 'I agree to the' and two orphan links."
			title="The consent box"
		>
			<AppCheckbox
				data-cy="consent"
				label={
					<span>
						I agree to the{" "}
						<Link
							className="text-accent underline"
							to="/components/list"
						>
							Terms of Service
						</Link>{" "}
						and the{" "}
						<Link
							className="text-accent underline"
							to="/components/switch"
						>
							Privacy Policy
						</Link>
					</span>
				}
				onChange={setAccepted}
				value={accepted}
			/>
			<p className="text-sm text-text-secondary">
				Keep it to a phrase. Anything needing a paragraph is a description beside the field, not the thing the box is
				labelled with.
			</p>
		</LabSection>
	);
}

/* ── 3. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="Disabled is the only state a checkbox has beyond ticked and invalid - it has no read-only of its own, because a checkbox you cannot change and cannot focus is a disabled one."
			title="States"
		>
			<div className="flex flex-col gap-4">
				<AppCheckbox
					data-cy="state-checked"
					label="Checked"
					onChange={() => undefined}
					value
				/>
				<AppCheckbox
					data-cy="state-unchecked"
					label="Unchecked"
					onChange={() => undefined}
					value={false}
				/>
				<AppCheckbox
					data-cy="state-invalid"
					errorMessage="You must agree to continue"
					isRequired
					label="Invalid"
					onChange={() => undefined}
					value={false}
				/>
				<AppCheckbox
					data-cy="state-disabled"
					isDisabled
					label="Disabled"
					onChange={() => undefined}
					value
				/>
			</div>
		</LabSection>
	);
}

/* ── 4. Not a switch ──────────────────────────────────────────────────────── */

function NotASwitchSection() {
	const [box, setBox] = useState(false);
	const [toggle, setToggle] = useState(false);

	return (
		<LabSection
			description="Both hold a boolean and they are not interchangeable. The checkbox states an intention that a Save button later commits. The switch has ALREADY done it - no Save, no confirmation. If the screen has a Save button, the answer is almost always the checkbox."
			title="Not a switch"
		>
			<div className="grid gap-6 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="Committed later, by a button."
						title="Checkbox"
					/>
					<AppCheckbox
						data-cy="versus-checkbox"
						label="Email me a receipt"
						onChange={setBox}
						value={box}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="Applied the moment it moves."
						title="Switch"
					/>
					<AppSwitch
						data-cy="versus-switch"
						description="Takes effect immediately."
						label="Weekly digest"
						onChange={setToggle}
						value={toggle}
					/>
				</div>
			</div>
		</LabSection>
	);
}
