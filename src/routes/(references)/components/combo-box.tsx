import { AppAutocomplete, AppButton, AppComboBox, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "ComboBox";

/**
 * ComboBox lab.
 *
 * This page exists to answer one question, because for a long time the codebase
 * could not: what is this for that `AppAutocomplete` is not? The answer is the
 * first section - `allowsCustomValue`. Everything else about the two components
 * is a difference of look, and a difference of look is not a reason to maintain
 * two of something.
 *
 * Things to check by hand:
 *
 * 1. **Type "Northwind" into the client field and press Enter.** It sticks. Do
 *    the same in the Autocomplete beside it and the text vanishes, because its
 *    trigger is a button and there is nowhere for unlisted text to live.
 * 2. **Type into the role field** - the closed one - and press Enter. It does
 *    not stick, and that is the whole reason `allowsCustomValue` is off by
 *    default: a column with three legal values must never take a fourth.
 */
export const Route = createFileRoute("/(references)/components/combo-box")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: ComboBoxLab,
});

const CLIENTS = [
	{ label: "Acme Corp", value: "acme" },
	{ label: "Globex", value: "globex" },
	{ label: "Initech", value: "initech" },
	{ label: "Umbrella", value: "umbrella" },
];

const ROLES = [
	{ label: "Admin", value: "admin" },
	{ label: "Editor", value: "editor" },
	{ label: "Viewer", value: "viewer" },
];

function ComboBoxLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A list you can type into - and, when you say so, type past."
				title={TITLE}
			/>
			<CustomValueSection />
			<BindingSection />
			<StateSection />
		</div>
	);
}

/* ── 1. The only reason this component exists ─────────────────────────────── */

function CustomValueSection() {
	const [client, setClient] = useState<string | null>(null);
	const [role, setRole] = useState<string | null>(null);
	const [city, setCity] = useState<string | null>(null);

	return (
		<LabSection
			description="Three controls over the same four options. The first accepts an answer that is not on the list; the second and third cannot, and the third cannot even in principle."
			title="allowsCustomValue is the whole difference"
		>
			<div className="flex flex-col gap-4">
				<AppComboBox
					allowsCustomValue
					data-cy="combo-open"
					description="Open list. Type a name that is not here and press Enter - it is kept."
					items={CLIENTS}
					label="Client (open list)"
					onChange={setClient}
					placeholder="Pick or type a client"
					value={client}
				/>
				<ReadOut
					label="Client"
					value={client}
				/>

				<AppComboBox
					data-cy="combo-closed"
					description="Closed list - the default. Typing filters; Enter on something unlisted is discarded."
					items={ROLES}
					label="Role (closed list)"
					onChange={setRole}
					placeholder="Pick a role"
					value={role}
				/>
				<ReadOut
					label="Role"
					value={role}
				/>

				<AppAutocomplete
					data-cy="combo-autocomplete"
					description="For contrast: the trigger is a button, so there is nowhere for unlisted text to live. Use this when the list is long and closed."
					items={CLIENTS}
					label="Client (Autocomplete)"
					onChange={setCity}
					placeholder="Pick a client"
					value={city}
				/>
				<ReadOut
					label="Autocomplete"
					value={city}
				/>
			</div>
		</LabSection>
	);
}

function ReadOut({ label, value }: { label: string; value: string | null }) {
	return (
		<p className="-mt-2 text-sm text-text-secondary">
			{label} holds:{" "}
			<code className="rounded bg-muted-surface/60 px-1.5 py-0.5 text-text-primary text-xs">
				{value === null ? "null" : JSON.stringify(value)}
			</code>
		</p>
	);
}

/* ── 2. Both binding modes ────────────────────────────────────────────────── */

const schema = z.object({
	client: z
		.string()
		.nullable()
		.refine((v) => v !== null && v !== "", "Pick or type a client"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="Same component, same timing. Which one you reach for is decided by who owns the value, not by how the field looks."
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
		defaultValues: { client: null },
	});

	return (
		<div className="flex flex-col gap-3">
			<h3 className="font-medium text-sm text-text-primary">react-hook-form</h3>
			<Form
				className="flex flex-col gap-3"
				onSubmit={handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<AppComboBox
					allowsCustomValue
					control={control}
					data-cy="bound-client"
					isRequired
					items={CLIENTS}
					label="Client"
					name="client"
					placeholder="Pick or type"
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
	const [client, setClient] = useState<string | null>(null);
	const [error, setError] = useState<string | undefined>();

	function validate(next: string | null): string | undefined {
		return next ? undefined : "Pick or type a client";
	}

	return (
		<div className="flex flex-col gap-3">
			<h3 className="font-medium text-sm text-text-primary">Local state</h3>
			<AppComboBox
				allowsCustomValue
				data-cy="standalone-client"
				errorMessage={error}
				isRequired
				items={CLIENTS}
				label="Client"
				onBlur={() => setError(validate(client))}
				onChange={(next) => {
					setClient(next);
					if (error) setError(validate(next));
				}}
				placeholder="Pick or type"
				value={client}
			/>
		</div>
	);
}

/* ── 3. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="The three a real screen reaches."
			title="States"
		>
			<div className="flex flex-col gap-4">
				<AppComboBox
					data-cy="state-invalid"
					errorMessage="Pick a role"
					isRequired
					items={ROLES}
					label="Invalid"
					onChange={() => undefined}
					value={null}
				/>
				<AppComboBox
					data-cy="state-disabled"
					isDisabled
					items={ROLES}
					label="Disabled"
					onChange={() => undefined}
					value="admin"
				/>
				<AppComboBox
					allowsCustomValue
					data-cy="state-empty-filter"
					description="Filter to nothing with allowsCustomValue on: the empty list says what Enter will do rather than reading as a dead end."
					items={ROLES}
					label="No matches"
					onChange={() => undefined}
					placeholder="Type something not on the list"
					value={null}
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
