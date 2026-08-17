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
 * Things to check by hand:
 *
 * 1. **Drag the resize handle.** It grows vertically only. Horizontal resize
 *    would let a user pull the field out of the form's column.
 * 2. **Type past 160 in the counter specimen.** The count turns danger AND the
 *    message says how far over - a red number alone is silent to a colour-blind
 *    reader, which is the same rule the rich text editor's footer follows.
 * 3. **Compare the read-only and disabled specimens.** You can select and copy
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
				subtitle="Multi-line text, in the same shell as the single-line field. Where it grows, where it scrolls, where the counter goes."
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
			description="A minimum length is the common rule here, and it is the one worth stating in the description rather than only on failure - nobody can guess it from an empty box."
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
	const [short, setShort] = useState("");
	const [tall, setTall] = useState(LOREM);

	return (
		<LabSection
			description="`rows` is the one sizing concern a caller reliably needs and the one that is not expressible through className. Pick it from the answer you expect: two rows for a note, six for a description. Past the height it scrolls internally rather than pushing the submit button off the screen."
			title="rows, and what happens past them"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppTextArea
					data-cy="rows-2"
					label="Note (rows=2)"
					onChange={setShort}
					placeholder="A sentence."
					rows={2}
					value={short}
				/>
				<AppTextArea
					data-cy="rows-6"
					description="Already past its height - it scrolls, it does not grow."
					label="Description (rows=6)"
					onChange={setTall}
					rows={6}
					value={tall}
				/>
			</div>
		</LabSection>
	);
}

const LOREM =
	"The shell is the same InputGroup the single-line field uses, so the border, the focus ring and the invalid state all match a text input sitting beside it in the same form. Past the row count it scrolls internally rather than growing without bound, which is what keeps a long answer from pushing the submit button below the fold. Drag the handle to make it taller; it will not go wider.";

/* ── 3. The counter ───────────────────────────────────────────────────────── */

function CounterSection() {
	const [value, setValue] = useState("");
	const over = value.length - MAX_BIO;

	return (
		<LabSection
			description="A cap belongs under the field, next to the thing it constrains, and it has to be readable before it is breached - a counter that only appears at the limit is a rule nobody was told about."
			title="Character counter"
		>
			<AppTextArea
				data-cy="counter"
				description={`${value.length} / ${MAX_BIO} characters`}
				errorMessage={over > 0 ? `${over} character${over === 1 ? "" : "s"} over the limit` : undefined}
				label="Tagline"
				onChange={setValue}
				placeholder="One line about you"
				rows={3}
				value={value}
			/>
			{/* The count is repeated as an error, not only as a colour. Turning the
			    description red would say "wrong" to a sighted reader and nothing at
			    all to anyone else. */}
		</LabSection>
	);
}

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
					onChange={() => undefined}
					rows={3}
					value="Too short"
				/>
				<AppTextArea
					data-cy="state-readonly"
					description="Selectable and copyable - the value is yours to read, not to change."
					isReadOnly
					label="Read-only"
					onChange={() => undefined}
					rows={3}
					value="Generated summary, regenerated on every save."
				/>
				<AppTextArea
					data-cy="state-disabled"
					description="Not available at all. Its text cannot be reached by keyboard."
					isDisabled
					label="Disabled"
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
