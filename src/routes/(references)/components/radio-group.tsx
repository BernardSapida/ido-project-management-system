import { AppButton, AppPageHeader, AppRadioGroup, AppSelect } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { LabSection, SpecimenLabel, ValueReadOut } from "@/features/labs/components/LabSection";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Radio button group";

/**
 * Radio group lab.
 *
 * Every option is a CARD, and the whole card is the hit target - the padding
 * lives on `Radio.Content`, which is the button, so there is no dead border
 * area to miss with a thumb. Everything the card says it says in accent, and
 * the four accent mixes climb 3 → 4 → 8% so hover never out-shouts the resting
 * selected state.
 *
 * Things to check by hand:
 *
 * 1. **Click the card's padding, not the dot.** It selects. If it ever stops
 *    doing so, the padding has moved off `Radio.Content`.
 * 2. **Tab into the group, then use the arrows.** One tab stop for the whole
 *    group, arrows between options - that is the native radio contract and the
 *    reason a row of buttons is not a substitute.
 * 3. **Tab through without picking, then leave.** It reports, same as the
 *    checkbox group: not answering is an answer.
 * 4. **Compare against the Select at the bottom.** Radios show every option and
 *    their descriptions at once; a Select hides all of it behind a click. Past
 *    about five options, or when the options need no explaining, the Select
 *    wins.
 */
export const Route = createFileRoute("/(references)/components/radio-group")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: RadioGroupLab,
});

const ROLES = [
	{
		description: "Full access to every resource, including billing.",
		label: "Admin",
		value: "admin",
	},
	{
		description: "Can create and edit content, but not manage people.",
		label: "Editor",
		value: "editor",
	},
	{
		description: "Read-only access to everything they are invited to.",
		label: "Viewer",
		value: "viewer",
	},
];

const PLANS = [
	{ label: "Monthly", value: "monthly" },
	{ label: "Yearly", value: "yearly" },
];

function RadioGroupLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="One choice from a visible few, as cards. Every option and its reasoning on screen at once."
				title={TITLE}
			/>
			<BindingSection />
			<OrientationSection />
			<StateSection />
			<VersusSelectSection />
		</div>
	);
}

/* ── 1. Both binding modes ────────────────────────────────────────────────── */

const schema = z.object({
	role: z.string().min(1, "Pick a role"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="Descriptions are the reason to spend the vertical space on cards. If the options do not need explaining, this is the wrong control and the answer is a Select."
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
		defaultValues: { role: "" },
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
				<AppRadioGroup
					control={control}
					data-cy="bound-role"
					isRequired
					items={ROLES}
					label="Role"
					name="role"
				/>
				<AppButton
					size="sm"
					type="submit"
					variant="secondary"
				>
					Submit empty
				</AppButton>
			</Form>
		</div>
	);
}

function StandaloneSpecimen() {
	const [role, setRole] = useState("");
	const [error, setError] = useState<string | undefined>();

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="value + onChange + errorMessage."
				title="Local state"
			/>
			<AppRadioGroup
				data-cy="standalone-role"
				errorMessage={error}
				isRequired
				items={ROLES}
				label="Role"
				onBlur={() => setError(role ? undefined : "Pick a role")}
				onChange={(next) => {
					setRole(next);
					setError(next ? undefined : "Pick a role");
				}}
				value={role}
			/>
			<ValueReadOut
				label="Stored"
				value={role}
			/>
		</div>
	);
}

/* ── 2. Orientation ───────────────────────────────────────────────────────── */

function OrientationSection() {
	const [plan, setPlan] = useState("monthly");

	return (
		<LabSection
			description="Horizontal cards share the row and wrap at a readable minimum rather than squeezing to the label width - two or three short options only. Anything with a description goes vertical, because a description in a 12rem column is one word per line."
			title="Vertical and horizontal"
		>
			<div className="flex flex-col gap-6">
				<AppRadioGroup
					data-cy="orientation-horizontal"
					description="Two short options with nothing to explain."
					items={PLANS}
					label="Billing period"
					onChange={setPlan}
					orientation="horizontal"
					value={plan}
				/>
			</div>
		</LabSection>
	);
}

/* ── 3. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="Selected is carried by three things at once - a 2px accent border, a 4% wash and an accent title - because a border alone is a 1px difference and a wash alone is invisible on a projector."
			title="States"
		>
			<div className="flex flex-col gap-6">
				<AppRadioGroup
					data-cy="state-invalid"
					errorMessage="Pick a role"
					isRequired
					items={ROLES}
					label="Invalid"
					onChange={() => undefined}
					value=""
				/>
				<AppRadioGroup
					data-cy="state-disabled"
					isDisabled
					items={PLANS}
					label="Disabled"
					onChange={() => undefined}
					orientation="horizontal"
					value="yearly"
				/>
			</div>
		</LabSection>
	);
}

/* ── 4. Against Select ────────────────────────────────────────────────────── */

function VersusSelectSection() {
	const [a, setA] = useState("editor");
	const [b, setB] = useState<string | null>("editor");

	return (
		<LabSection
			description="Same three options. The radios cost vertical space and spend it on the descriptions; the Select costs a click and hides them. Choose by whether the user needs the reasoning to decide - and remember a Select can hold 200 options, while a radio group past about five is a wall."
			title="Against Select"
		>
			<div className="grid gap-6 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="Everything visible, including why."
						title="AppRadioGroup"
					/>
					<AppRadioGroup
						data-cy="versus-radio"
						items={ROLES}
						label="Role"
						onChange={setA}
						value={a}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="One line, and the reasoning goes somewhere else."
						title="AppSelect"
					/>
					<AppSelect
						data-cy="versus-select"
						items={ROLES.map(({ label, value }) => ({ label, value }))}
						label="Role"
						onChange={setB}
						placeholder="Select a role"
						value={b}
					/>
				</div>
			</div>
		</LabSection>
	);
}
