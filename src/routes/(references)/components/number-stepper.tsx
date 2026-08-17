import { AppButton, AppGlassCard, AppNumberField, AppPageHeader } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Number stepper";

/**
 * Number stepper lab.
 *
 * There is no `AppNumberStepper`, deliberately, and this page is where that is
 * argued. The stepper is `AppNumberField` at `variant="compact"`: the clamping,
 * the locale formatting, the keyboard handling and the NaN-to-null rule are all
 * identical, and only the density differs. A second component would be a second
 * place for those four things to drift.
 *
 * What the variant actually changes: the label goes to `sr-only`, the input
 * narrows to a centred 3rem, and the field stops filling its column. That is
 * all of it.
 *
 * Things to check by hand:
 *
 * 1. **Tab to a compact stepper and press the up arrow.** It works, and the
 *    screen reader announces the label - the label is hidden, not absent. A
 *    genuinely unlabelled spinner is unreachable by voice control and
 *    unnameable, and "the row explains it" is only true if you can see the row.
 * 2. **Type 99 into the quantity field and leave it.** It clamps to 10 and the
 *    limit was stated before you hit it - a bound the user was never told about
 *    reads as the field rewriting what they typed.
 */
export const Route = createFileRoute("/(references)/components/number-stepper")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: NumberStepperLab,
});

function NumberStepperLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="AppNumberField at variant=compact. Plus and minus around a quantity, for where typing the number is the rare path."
				title={TITLE}
			/>
			<VariantSection />
			<InRowSection />
			<BindingSection />
			<StateSection />
		</div>
	);
}

/* ── 1. The variant ───────────────────────────────────────────────────────── */

function VariantSection() {
	const [field, setField] = useState<number | null>(2);
	const [compact, setCompact] = useState<number | null>(2);

	return (
		<LabSection
			description="The same component twice. Reach for compact when the number sits inside another row and the label is carried by that row; reach for the field when it is a question on a form."
			title="field vs compact"
		>
			<div className="flex flex-wrap items-end gap-8">
				<div className="flex flex-col gap-2">
					<p className="font-medium text-sm text-text-primary">variant="field"</p>
					<AppNumberField
						data-cy="variant-field"
						description="1 to 10."
						label="Quantity"
						maxValue={10}
						minValue={1}
						onChange={setField}
						value={field}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<p className="font-medium text-sm text-text-primary">variant="compact"</p>
					<AppNumberField
						data-cy="variant-compact"
						label="Quantity"
						maxValue={10}
						minValue={1}
						onChange={setCompact}
						value={compact}
						variant="compact"
					/>
				</div>
			</div>
		</LabSection>
	);
}

/* ── 2. Where it belongs ──────────────────────────────────────────────────── */

interface CartLine {
	id: string;
	name: string;
	price: number;
}

const LINES: CartLine[] = [
	{ id: "kb", name: "Mechanical keyboard", price: 129 },
	{ id: "mo", name: "Vertical mouse", price: 79 },
	{ id: "hu", name: "USB-C hub", price: 45 },
];

function InRowSection() {
	const [quantities, setQuantities] = useState<Record<string, number | null>>({
		hu: 3,
		kb: 1,
		mo: 2,
	});

	const total = LINES.reduce((sum, line) => sum + line.price * (quantities[line.id] ?? 0), 0);

	return (
		<LabSection
			description="The case the compact variant exists for. Each row already says what the number counts, so a visible 'Quantity' label three times over would be noise - but the label still exists, hidden, because a screen reader reaching the third spinner has no row to look at."
			title="In a row"
		>
			<div className="flex flex-col divide-y divide-border">
				{LINES.map((line) => (
					<div
						className="flex items-center justify-between gap-4 py-3"
						key={line.id}
					>
						<div className="min-w-0">
							<p className="truncate font-medium text-sm text-text-primary">{line.name}</p>
							<p className="text-sm text-text-secondary">${line.price}</p>
						</div>
						<AppNumberField
							data-cy={`qty-${line.id}`}
							label={`Quantity of ${line.name}`}
							maxValue={10}
							minValue={0}
							onChange={(next) => setQuantities((prev) => ({ ...prev, [line.id]: next }))}
							value={quantities[line.id] ?? null}
							variant="compact"
						/>
					</div>
				))}
			</div>
			<p className="text-right font-semibold text-text-primary">Total: ${total}</p>
		</LabSection>
	);
}

/* ── 3. Both binding modes ────────────────────────────────────────────────── */

const schema = z.object({
	seats: z
		.number({ error: "Pick a number of seats" })
		.nullable()
		.refine((v) => v !== null && v >= 1, "At least one seat"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="Clearing the field stores null rather than NaN - which is what lets a schema say 'pick a number' instead of the form silently holding something no database column will take."
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
		defaultValues: { seats: null },
	});

	return (
		<div className="flex flex-col gap-3">
			<h3 className="font-medium text-sm text-text-primary">react-hook-form</h3>
			<Form
				className="flex flex-col gap-3 *:self-start"
				onSubmit={handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<AppNumberField
					control={control}
					data-cy="bound-seats"
					isRequired
					label="Seats"
					maxValue={50}
					minValue={0}
					name="seats"
					variant="compact"
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
	const [seats, setSeats] = useState<number | null>(null);
	const [error, setError] = useState<string | undefined>();

	function validate(next: number | null): string | undefined {
		if (next === null) return "Pick a number of seats";
		return next >= 1 ? undefined : "At least one seat";
	}

	return (
		<div className="flex flex-col gap-3">
			<h3 className="font-medium text-sm text-text-primary">Local state</h3>
			<AppNumberField
				data-cy="standalone-seats"
				errorMessage={error}
				isRequired
				label="Seats"
				maxValue={50}
				minValue={0}
				onBlur={() => setError(validate(seats))}
				onChange={(next) => {
					setSeats(next);
					if (error) setError(validate(next));
				}}
				value={seats}
				variant="compact"
			/>
		</div>
	);
}

/* ── 4. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="At a bound, the button that cannot move is disabled rather than silently inert - a control that looks pressable and does nothing is worse than one that says it is finished."
			title="States"
		>
			<div className="flex flex-wrap items-start gap-8">
				<AppNumberField
					data-cy="state-at-max"
					description="At the maximum."
					label="At max"
					maxValue={10}
					minValue={0}
					onChange={() => undefined}
					value={10}
				/>
				<AppNumberField
					data-cy="state-invalid"
					errorMessage="Only 3 left in stock"
					label="Invalid"
					maxValue={99}
					minValue={0}
					onChange={() => undefined}
					value={8}
				/>
				<AppNumberField
					data-cy="state-disabled"
					isDisabled
					label="Disabled"
					onChange={() => undefined}
					value={1}
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
