import { AppAutocomplete, AppButton, AppPageHeader, AppSelect } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { LabSection, SpecimenLabel, ValueReadOut } from "@/features/labs/components/LabSection";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Select";

/**
 * Select lab.
 *
 * The section that matters is the last one. Reaching for a Select over an
 * Autocomplete is the most common form-UX mistake in this codebase's history -
 * a 60-country Select makes the user scroll a viewport-height list to find
 * "Philippines" - so the two are shown side by side over the same data rather
 * than described.
 *
 * Things to check by hand:
 *
 * 1. **Open the country Select and type "p".** React Aria jumps to the first
 *    match and no further; typing "ph" does not narrow. That is type-ahead, not
 *    search, and it is the whole reason a long list needs the other component.
 * 2. **Pick a value, then tab away.** The error clears on selection rather than
 *    on blur - choosing from a popover IS finishing, so the field marks itself
 *    touched the moment it closes.
 */
export const Route = createFileRoute("/(references)/components/select")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: SelectLab,
});

const PLANS = [
	{ label: "Monthly", value: "monthly" },
	{ label: "Yearly", value: "yearly" },
];

const ROLES = [
	{ label: "Admin", value: "admin" },
	{ label: "Editor", value: "editor" },
	{ label: "Viewer", value: "viewer" },
];

const COUNTRIES = [
	{ label: "Australia", value: "au" },
	{ label: "Brazil", value: "br" },
	{ label: "Canada", value: "ca" },
	{ label: "Denmark", value: "dk" },
	{ label: "France", value: "fr" },
	{ label: "Germany", value: "de" },
	{ label: "India", value: "in" },
	{ label: "Japan", value: "jp" },
	{ label: "Kenya", value: "ke" },
	{ label: "Mexico", value: "mx" },
	{ label: "Philippines", value: "ph" },
	{ label: "Singapore", value: "sg" },
	{ label: "United Kingdom", value: "gb" },
	{ label: "United States", value: "us" },
];

function SelectLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="One choice from a short, closed list. No typing, and the whole list visible at once."
				title={TITLE}
			/>
			<BindingSection />
			<StateSection />
			<WrongToolSection />
		</div>
	);
}

/* ── 1. Both binding modes ────────────────────────────────────────────────── */

const schema = z.object({
	role: z
		.string()
		.nullable()
		.refine((v) => v !== null, "Pick a role"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="A Select stores the item's value, never its label - so the readout below is what would reach the database."
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
		defaultValues: { role: null },
	});

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="control + name. The resolver owns the rule."
				title="react-hook-form"
			/>
			<Form
				className="flex flex-col gap-3"
				onSubmit={handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<AppSelect
					control={control}
					data-cy="bound-role"
					isRequired
					items={ROLES}
					label="Role"
					name="role"
					placeholder="Select a role"
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
	const [role, setRole] = useState<string | null>(null);
	const [error, setError] = useState<string | undefined>();

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="value + onChange + errorMessage. You own the rule."
				title="Local state"
			/>
			<AppSelect
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
				placeholder="Select a role"
				value={role}
			/>
			<ValueReadOut
				label="Stored"
				value={role}
			/>
		</div>
	);
}

/* ── 2. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="Loading disables the trigger rather than swapping it for a spinner - a control that vanishes and returns moves the layout under the cursor. Disabled and loading look the same on purpose; they mean the same thing to someone trying to press it."
			title="States"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppSelect
					data-cy="state-default"
					description="Two options, so the list is the fastest possible read."
					items={PLANS}
					label="Billing period"
					onChange={() => undefined}
					placeholder="Select a plan"
					value="monthly"
				/>
				<AppSelect
					data-cy="state-invalid"
					errorMessage="Pick a role"
					isRequired
					items={ROLES}
					label="Invalid"
					onChange={() => undefined}
					placeholder="Select a role"
					value={null}
				/>
				<AppSelect
					data-cy="state-loading"
					isLoading
					items={ROLES}
					label="Loading"
					onChange={() => undefined}
					placeholder="Fetching roles…"
					value={null}
				/>
				<AppSelect
					data-cy="state-disabled"
					isDisabled
					items={ROLES}
					label="Disabled"
					onChange={() => undefined}
					value="viewer"
				/>
			</div>
		</LabSection>
	);
}

/* ── 3. When it is the wrong control ──────────────────────────────────────── */

function WrongToolSection() {
	const [a, setA] = useState<string | null>(null);
	const [b, setB] = useState<string | null>(null);

	return (
		<LabSection
			description="Fourteen countries in both. Open each and try to reach the Philippines. The rule in apps/web/CLAUDE.md is ~10 options: below it the list is a glance, above it the user is hunting and typing is faster. This is a real list of 195, so it is not close."
			title="Past ~10 options this is the wrong control"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="Type-ahead only - 'p' jumps, 'ph' does not narrow."
						title="AppSelect (wrong here)"
					/>
					<AppSelect
						data-cy="wrong-select"
						items={COUNTRIES}
						label="Country"
						onChange={setA}
						placeholder="Select a country"
						value={a}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="A search field inside the popover, and an empty state when nothing matches."
						title="AppAutocomplete (right here)"
					/>
					<AppAutocomplete
						data-cy="wrong-autocomplete"
						items={COUNTRIES}
						label="Country"
						onChange={setB}
						placeholder="Select a country"
						value={b}
					/>
				</div>
			</div>
		</LabSection>
	);
}
