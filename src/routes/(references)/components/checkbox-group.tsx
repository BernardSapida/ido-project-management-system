import { AppButton, AppCheckboxGroup, AppPageHeader } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { LabSection, SpecimenLabel, ValueReadOut } from "@/features/labs/components/LabSection";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Checkbox group";

/**
 * Checkbox group lab.
 *
 * The load-bearing idea is that this is ONE field holding a `string[]`, not N
 * boolean fields that happen to sit together. That is why the options are raw
 * HeroUI checkboxes rather than `AppCheckbox` - each `AppCheckbox` registers
 * itself as its own form field, and a group of them would put four names in the
 * schema where the answer is one list.
 *
 * It is also why there is one error under the whole group. The rule is about
 * the answer ("pick at least one"), not about any single tick, so repeating it
 * under every box would be four copies of one sentence.
 *
 * Things to check by hand:
 *
 * 1. **Tick then untick the last box.** The required error comes back - going
 *    back to empty is an answer, and the group re-checks on change.
 * 2. **Tab through the group without touching anything, then leave.** It
 *    reports. Without blur wired, an untouched required group stays silent
 *    until submit while every text field beside it has already spoken.
 */
export const Route = createFileRoute("/(references)/components/checkbox-group")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: CheckboxGroupLab,
});

const CHANNELS = [
	{ label: "Email", value: "email" },
	{ label: "Push", value: "push" },
	{ label: "SMS", value: "sms" },
];

const TOPICS = [
	{ label: "Product updates", value: "product" },
	{ label: "Security alerts", value: "security" },
	{ label: "Billing", value: "billing" },
	{ label: "Community", value: "community" },
];

function CheckboxGroupLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Several booleans under one legend, holding one string[]. One error for the group, not one per tick."
				title={TITLE}
			/>
			<BindingSection />
			<OrientationSection />
			<StateSection />
		</div>
	);
}

/* ── 1. Both binding modes ────────────────────────────────────────────────── */

const schema = z.object({
	channels: z.array(z.string()).min(1, "Pick at least one channel"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="The stored value is the list of ticked values, in the order the options are declared - never a map of booleans. That shape is what a schema can put a `.min(1)` on."
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
		defaultValues: { channels: [] },
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
				<AppCheckboxGroup
					control={control}
					data-cy="bound-channels"
					description="How should we reach you?"
					isRequired
					items={CHANNELS}
					label="Notifications"
					name="channels"
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
	const [channels, setChannels] = useState<string[]>([]);
	const [error, setError] = useState<string | undefined>();

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="value + onChange + errorMessage."
				title="Local state"
			/>
			<AppCheckboxGroup
				data-cy="standalone-channels"
				description="How should we reach you?"
				errorMessage={error}
				isRequired
				items={CHANNELS}
				label="Notifications"
				onBlur={() => setError(channels.length ? undefined : "Pick at least one channel")}
				onChange={(next) => {
					setChannels(next);
					setError(next.length ? undefined : "Pick at least one channel");
				}}
				value={channels}
			/>
			<ValueReadOut
				label="Stored"
				value={channels}
			/>
		</div>
	);
}

/* ── 2. Orientation ───────────────────────────────────────────────────────── */

function OrientationSection() {
	const [a, setA] = useState<string[]>(["product"]);
	const [b, setB] = useState<string[]>(["email"]);

	return (
		<LabSection
			description="Vertical by default, because a column is scannable at any option count and a row stops being so around four. Horizontal is a class here rather than a prop - HeroUI's CheckboxGroup has no `orientation`, unlike its RadioGroup - and the legend and the error stay full width either way."
			title="Vertical and horizontal"
		>
			<div className="flex flex-col gap-6">
				<AppCheckboxGroup
					data-cy="orientation-vertical"
					items={TOPICS}
					label="Subscribe to (vertical)"
					onChange={setA}
					value={a}
				/>
				<AppCheckboxGroup
					data-cy="orientation-horizontal"
					items={CHANNELS}
					label="Channels (horizontal)"
					onChange={setB}
					orientation="horizontal"
					value={b}
				/>
			</div>
		</LabSection>
	);
}

/* ── 3. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="Disabling the group disables every box in it - there is no per-option disable, because a group with two live options and two dead ones is really two groups and should be written as such."
			title="States"
		>
			<div className="grid gap-6 sm:grid-cols-2">
				<AppCheckboxGroup
					data-cy="state-invalid"
					errorMessage="Pick at least one channel"
					isRequired
					items={CHANNELS}
					label="Invalid"
					onChange={() => undefined}
					value={[]}
				/>
				<AppCheckboxGroup
					data-cy="state-disabled"
					isDisabled
					items={CHANNELS}
					label="Disabled"
					onChange={() => undefined}
					value={["email", "push"]}
				/>
			</div>
		</LabSection>
	);
}
