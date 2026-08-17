import { AppAutocomplete, AppButton, AppComboBox, AppPageHeader } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { LabSection, SpecimenLabel, ValueReadOut } from "@/features/labs/components/LabSection";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Autocomplete";

/**
 * Autocomplete lab.
 *
 * The default for a long or fetched list. Closed it reads as a Select - a
 * button showing the value - and the search field lives inside the popover,
 * which is what lets it stay one line wide no matter how many options are
 * behind it.
 *
 * Things to check by hand:
 *
 * 1. **Open it and type.** The search field is already focused, so the first
 *    keystroke lands in it rather than triggering type-ahead on the list.
 * 2. **Type something that matches nothing.** The empty state says so. A
 *    popover that simply goes blank reads as a failure to load.
 * 3. **Type "MANILA" in caps.** It still matches - the filter is
 *    `sensitivity: "base"`, so case and accents are ignored, which is what a
 *    user searching a list of place names expects.
 * 4. **Press the clear button, then tab away.** The required error returns:
 *    clearing is an answer too.
 */
export const Route = createFileRoute("/(references)/components/autocomplete")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: AutocompleteLab,
});

const CITIES = [
	{ label: "Bacolod", value: "bcd" },
	{ label: "Baguio", value: "bag" },
	{ label: "BGC", value: "bgc" },
	{ label: "Cagayan de Oro", value: "cdo" },
	{ label: "Cebu", value: "ceb" },
	{ label: "Davao", value: "dvo" },
	{ label: "Iloilo", value: "ilo" },
	{ label: "Makati", value: "mkt" },
	{ label: "Manila", value: "mnl" },
	{ label: "Pasig", value: "psg" },
	{ label: "Quezon City", value: "qc" },
	{ label: "Taguig", value: "tgg" },
	{ label: "Zamboanga", value: "zam" },
];

function AutocompleteLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="One choice from a long or fetched list. The search lives in the popover, so the field stays one line."
				title={TITLE}
			/>
			<BindingSection />
			<VersusSection />
			<StateSection />
		</div>
	);
}

/* ── 1. Both binding modes ────────────────────────────────────────────────── */

const schema = z.object({
	city: z
		.string()
		.nullable()
		.refine((v) => v !== null, "Select a city"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="The stored value is the item's key, not the text that was typed to find it - so a search for 'quezon' stores 'qc'."
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
		defaultValues: { city: null },
	});

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="control + name."
				title="react-hook-form"
			/>
			<Form
				className="flex flex-col gap-3"
				onSubmit={handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<AppAutocomplete
					control={control}
					data-cy="bound-city"
					description="Full-text search inside the popover."
					isRequired
					items={CITIES}
					label="City"
					name="city"
					placeholder="Select a city"
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
	const [city, setCity] = useState<string | null>(null);
	const [error, setError] = useState<string | undefined>();

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="value + onChange + errorMessage."
				title="Local state"
			/>
			<AppAutocomplete
				data-cy="standalone-city"
				errorMessage={error}
				isRequired
				items={CITIES}
				label="City"
				onBlur={() => setError(city ? undefined : "Select a city")}
				onChange={(next) => {
					setCity(next);
					setError(next ? undefined : "Select a city");
				}}
				placeholder="Select a city"
				value={city}
			/>
			<ValueReadOut
				label="Stored"
				value={city}
			/>
		</div>
	);
}

/* ── 2. Against ComboBox ──────────────────────────────────────────────────── */

function VersusSection() {
	const [a, setA] = useState<string | null>(null);
	const [b, setB] = useState<string | null>(null);

	return (
		<LabSection
			description="Both narrow a list by typing. Only the ComboBox can KEEP what was typed, because only its trigger is a text input - type 'Legazpi' into each and press Enter. Pick by whether the list is closed, not by which one looks better."
			title="Against ComboBox"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="Closed list. Unlisted text has nowhere to live."
						title="Autocomplete"
					/>
					<AppAutocomplete
						data-cy="versus-autocomplete"
						items={CITIES}
						label="City"
						onChange={setA}
						placeholder="Select a city"
						value={a}
					/>
					<ValueReadOut
						label="Holds"
						value={a}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="allowsCustomValue. Enter keeps what you typed."
						title="ComboBox"
					/>
					<AppComboBox
						allowsCustomValue
						data-cy="versus-combobox"
						items={CITIES}
						label="City"
						onChange={setB}
						placeholder="Pick or type a city"
						value={b}
					/>
					<ValueReadOut
						label="Holds"
						value={b}
					/>
				</div>
			</div>
		</LabSection>
	);
}

/* ── 3. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="Filtered-to-nothing is a state, not an accident, and it gets its own copy. A blank popover is indistinguishable from one that failed to load."
			title="States"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppAutocomplete
					data-cy="state-selected"
					items={CITIES}
					label="Selected"
					onChange={() => undefined}
					value="mnl"
				/>
				<AppAutocomplete
					data-cy="state-invalid"
					errorMessage="Select a city"
					isRequired
					items={CITIES}
					label="Invalid"
					onChange={() => undefined}
					placeholder="Select a city"
					value={null}
				/>
				<AppAutocomplete
					data-cy="state-disabled"
					isDisabled
					items={CITIES}
					label="Disabled"
					onChange={() => undefined}
					value="ceb"
				/>
				<AppAutocomplete
					data-cy="state-empty"
					description="Open this one and type 'zzz' to see the empty state."
					items={CITIES}
					label="No matches"
					onChange={() => undefined}
					placeholder="Select a city"
					value={null}
				/>
			</div>
		</LabSection>
	);
}
