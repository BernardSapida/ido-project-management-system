import { AppButton, AppInputGroup, AppPageHeader, AppTextArea } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { LabSection, SpecimenLabel } from "@/features/labs/components/LabSection";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Textarea";

const MAX_BIO = 160;

/**
 * Textarea lab.
 *
 * The same `InputGroup` shell as `AppInputGroup` - deliberately, so a form
 * mixing a text field and a textarea has one border, one focus ring and one
 * invalid state rather than two that nearly match.
 *
 * The word + character reading and the auto-grow are part of the field, not
 * props a caller can forget: `maxLength` is required, and every specimen below
 * shows the reading pinned inside the field, bottom-right, from the first render.
 *
 * Things to check by hand:
 *
 * 1. **Type into the auto-grow specimen.** It starts at `rows` and grows a line
 *    at a time as you type. Past `maxRows` it stops growing and scrolls - a long
 *    answer never pushes the submit button below the fold. There is no resize
 *    handle to drag; the field sizes itself.
 * 2. **Type past 160 in the counter specimen.** The reading turns danger at the
 *    limit, and the message says how far over - a red number alone is silent to
 *    a colour-blind reader. Paste a paragraph: it is accepted whole, not
 *    truncated, so the reading can show the overage.
 * 3. **Submit the over-limit specimen.** It is invalid past the cap on its own,
 *    on top of whatever the form schema says.
 * 4. **Compare the read-only and disabled specimens.** You can select and copy
 *    out of one and not the other. That is the whole difference and it is why
 *    they are not interchangeable.
 */
export const Route = createFileRoute("/(references)/components/textarea")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: TextAreaLab,
});

function TextAreaLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Multi-line text, in the same shell as the single-line field. Where it grows, where it scrolls, and the counter that is always on."
				title={TITLE}
			/>
			<BindingSection />
			<RowsSection />
			<CounterSection />
			<StateSection />
		</div>
	);
}

/* ── 1. Both binding modes ────────────────────────────────────────────────── */

const schema = z.object({
	bio: z.string().min(10, "Tell us at least 10 characters"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="A minimum length is the common rule here, and it is the one worth stating in the description rather than only on failure - nobody can guess it from an empty box. The maximum is stated for you, by the reading in the corner of the field."
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
		defaultValues: { bio: "" },
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
				<AppTextArea
					control={control}
					data-cy="bound-bio"
					description="Minimum 10 characters."
					isRequired
					label="Bio"
					maxLength={MAX_BIO}
					name="bio"
					placeholder="Tell us a bit about yourself…"
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
	const [bio, setBio] = useState("");
	const [error, setError] = useState<string | undefined>();

	function validate(next: string): string | undefined {
		const result = schema.shape.bio.safeParse(next);
		return result.success ? undefined : result.error.issues[0]?.message;
	}

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="value + onChange + errorMessage."
				title="Local state"
			/>
			<AppTextArea
				data-cy="standalone-bio"
				description="Minimum 10 characters."
				errorMessage={error}
				isRequired
				label="Bio"
				maxLength={MAX_BIO}
				onBlur={() => setError(validate(bio))}
				onChange={(next) => {
					setBio(next);
					if (error) setError(validate(next));
				}}
				placeholder="Tell us a bit about yourself…"
				value={bio}
			/>
		</div>
	);
}

/* ── 2. Height ────────────────────────────────────────────────────────────── */

function RowsSection() {
	const [note, setNote] = useState("");
	const [tall, setTall] = useState(LOREM);

	return (
		<LabSection
			description="`rows` is the resting height and `maxRows` the ceiling - both are sizing concerns a caller needs and neither is expressible through className. The field grows a line at a time as the user types; at `maxRows` it stops and scrolls internally rather than pushing the submit button off the screen. There is no resize handle."
			title="rows, maxRows, and auto-grow"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppTextArea
					data-cy="rows-grow"
					description="Starts at 2 rows, grows to 8 as you type."
					label="Note (rows=2, maxRows=8)"
					maxLength={600}
					maxRows={8}
					onChange={setNote}
					placeholder="Start typing and watch it grow…"
					rows={2}
					value={note}
				/>
				<AppTextArea
					data-cy="rows-scroll"
					description="Seeded past its ceiling - it grew to 6 rows and now scrolls."
					label="Description (rows=3, maxRows=6)"
					maxLength={1200}
					maxRows={6}
					onChange={setTall}
					rows={3}
					value={tall}
				/>
			</div>
		</LabSection>
	);
}

const LOREM =
	"The shell is the same InputGroup the single-line field uses, so the border, the focus ring and the invalid state all match a text input sitting beside it in the same form. The field grows a line at a time as you type; past its row ceiling it scrolls internally rather than growing without bound, which is what keeps a long answer from pushing the submit button below the fold. There is no handle to drag - it sizes itself to the content.";

/* ── 3. The counter ───────────────────────────────────────────────────────── */

function CounterSection() {
	const [value, setValue] = useState(SEEDED_NEAR_LIMIT);

	return (
		<LabSection
			description="Every textarea carries a `words · count / max` reading pinned in its bottom-right corner. It is muted until the character count reaches the cap, then turns danger - number, word and colour, so the state survives a colour-blind reader. The field is invalid past the cap on its own, and a paste that overflows is kept whole so the overage is visible rather than silently trimmed."
			title="Word and character count, and the over-limit state"
		>
			<AppTextArea
				data-cy="counter"
				description="Tagline for your profile."
				label="Tagline"
				maxLength={MAX_BIO}
				onChange={setValue}
				placeholder="One line about you"
				rows={3}
				value={value}
			/>
		</LabSection>
	);
}

const SEEDED_NEAR_LIMIT =
	"Product designer and sometime photographer. I write about design systems, accessibility, and the small details that make software feel calm.";

/* ── 4. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="Read-only and disabled are not interchangeable: you can select and copy out of a read-only field, which is what makes it right for a value the user needs but cannot change. Disabled is for a control that is not available at all - and its content is unreachable to a keyboard, so never put anything there the user might need to read."
			title="States"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppTextArea
					data-cy="state-invalid"
					errorMessage="Tell us at least 10 characters"
					isRequired
					label="Invalid"
					maxLength={MAX_BIO}
					onChange={() => undefined}
					rows={3}
					value="Too short"
				/>
				<AppTextArea
					data-cy="state-readonly"
					description="Selectable and copyable - the value is yours to read, not to change."
					isReadOnly
					label="Read-only"
					maxLength={MAX_BIO}
					onChange={() => undefined}
					rows={3}
					value="Generated summary, regenerated on every save."
				/>
				<AppTextArea
					data-cy="state-disabled"
					description="Not available at all. Its text cannot be reached by keyboard."
					isDisabled
					label="Disabled"
					maxLength={MAX_BIO}
					onChange={() => undefined}
					rows={3}
					value="Locked while publishing."
				/>
				<AppInputGroup
					data-cy="state-sibling"
					description="For contrast: the single-line field, same shell."
					label="Single line, same shell"
					onChange={() => undefined}
					placeholder="Compare the border and the ring"
					value=""
				/>
			</div>
		</LabSection>
	);
}
