import { AppButton, AppGlassCard, AppInputGroup, AppPageHeader } from "@bernardsapida/web-ui";
import { Form, Spinner } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Globe, Mail, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Input group";

/**
 * Input group lab - THE single-line text input, and the reference every other
 * Forms lab copies its shape from.
 *
 * The first section is the point of the page. Every field wrapper in this app
 * can be driven two ways, and which one you need is not a styling choice - it
 * is a question of who owns the value. Get it wrong and you either wire a form
 * library through a zustand draft or hand-roll validation timing next to a
 * resolver that already does it. Both specimens below are live: submit the form
 * empty, and type a bad address into the standalone field beside it.
 *
 * Things to check by hand:
 *
 * 1. **Blur, do not type.** Neither field complains while you are still in it.
 *    Once one HAS an error, the message clears on the keystroke that fixes it
 *    rather than waiting for another blur. That pairing is `mode: "onBlur"` +
 *    `reValidateMode: "onChange"` in the bound field, and is reproduced by hand
 *    in the standalone one - see `validateOnBlur` below.
 * 2. **Autofill the email field.** The highlight covers the whole rounded shell
 *    including the icon, not a square yellow rectangle inside it. That is the
 *    thing `.input` could not do and the reason there is no longer a separate
 *    plain-input component.
 * 3. **The no-affix field is the same height** as the ones with icons, 38px at
 *    `sm+`. A form mixing them has one baseline.
 */
export const Route = createFileRoute("/(references)/components/input-group")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: InputGroupLab,
});

function InputGroupLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The standard text input. Prefix and suffix are optional, so this is also the plain one."
				title={TITLE}
			/>

			<BindingSection />
			<AffixSection />
			<StateSection />
		</div>
	);
}

/* ── 1. The two ways to drive it ──────────────────────────────────────────── */

const boundSchema = z.object({
	email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

type BoundValues = z.input<typeof boundSchema>;

function BindingSection() {
	return (
		<LabSection
			description="Same component, same markup, same validation timing. The only difference is who holds the value - and that is decided by the screen, not by the field."
			title="Bound to a form, or standing alone"
		>
			<div className="grid gap-6 sm:grid-cols-2">
				<BoundSpecimen />
				<StandaloneSpecimen />
			</div>
		</LabSection>
	);
}

/**
 * The default. Reach for this whenever the value is one answer among several
 * being collected and submitted together.
 */
function BoundSpecimen() {
	const { control, handleSubmit } = useAppForm<BoundValues>(boundSchema, {
		defaultValues: { email: "" },
	});

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="control + name. The resolver owns the rule, useAppForm owns the timing, and there is no error state to hold."
				title="react-hook-form"
			/>
			<Form
				className="flex flex-col gap-3"
				onSubmit={handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<AppInputGroup
					control={control}
					data-cy="bound-email"
					isRequired
					label="Email"
					name="email"
					placeholder="jane@example.com"
					startContent={<Mail className="size-4 text-text-secondary" />}
					type="email"
				/>
				<AppButton
					size="sm"
					type="submit"
					variant="secondary"
				>
					Submit empty
				</AppButton>
			</Form>
			<CodeBlock>{BOUND_SNIPPET}</CodeBlock>
		</div>
	);
}

const BOUND_SNIPPET = `const { control } = useAppForm(schema, {
  defaultValues: { email: "" },
});

<AppInputGroup
  control={control}
  name="email"
  label="Email"
  isRequired
/>`;

/**
 * For a value that already has an owner - a zustand draft, a wizard step, a
 * filter bar two other controls also write to. Wiring RHF through one of those
 * would give the value two owners.
 *
 * The timing is reproduced by hand rather than skipped, because it is the part
 * that is easy to get wrong: quiet until blur, then live on every keystroke.
 */
function StandaloneSpecimen() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | undefined>();

	function validate(next: string): string | undefined {
		const result = boundSchema.shape.email.safeParse(next);
		return result.success ? undefined : result.error.issues[0]?.message;
	}

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="value + onChange + errorMessage. You own the rule and the timing; a falsy message is what makes the field valid."
				title="Local state"
			/>
			<AppInputGroup
				data-cy="standalone-email"
				errorMessage={error}
				isRequired
				label="Email"
				// Blur decides, and after that every keystroke re-decides. Validating
				// on change from the start would flag `b@` while it is being typed.
				onBlur={() => setError(validate(email))}
				onChange={(next) => {
					setEmail(next);
					if (error) setError(validate(next));
				}}
				placeholder="jane@example.com"
				startContent={<Mail className="size-4 text-text-secondary" />}
				type="email"
				value={email}
			/>
			<CodeBlock>{STANDALONE_SNIPPET}</CodeBlock>
		</div>
	);
}

const STANDALONE_SNIPPET = `const [email, setEmail] = useState("");
const [error, setError] = useState<string>();

<AppInputGroup
  value={email}
  onChange={(next) => {
    setEmail(next);
    if (error) setError(validate(next));
  }}
  onBlur={() => setError(validate(email))}
  errorMessage={error}
  label="Email"
  isRequired
/>`;

/* ── 2. Affixes ───────────────────────────────────────────────────────────── */

function AffixSection() {
	const [value, setValue] = useState("heroui.com");
	const [isCopied, setIsCopied] = useState(false);

	return (
		<LabSection
			description="Both slots are optional and independent. Nothing else changes - the height, the focus ring and the invalid state are the same whether there are zero affixes or two."
			title="Prefix and suffix"
		>
			<div className="flex flex-col gap-4">
				<AppInputGroup
					data-cy="affix-none"
					description="The plain text input. This is what used to be a second component."
					label="No affix"
					onChange={() => undefined}
					placeholder="Jane Doe"
					value=""
				/>

				<AppInputGroup
					data-cy="affix-icon-prefix"
					label="Icon prefix"
					onChange={() => undefined}
					placeholder="Search the docs"
					startContent={<Search className="size-4 text-text-secondary" />}
					value=""
				/>

				<AppInputGroup
					data-cy="affix-text-both"
					description="Text affixes carry the units so the value does not have to."
					label="Text prefix and suffix"
					onChange={() => undefined}
					placeholder="0"
					startContent="$"
					value=""
				/>

				{/* An interactive suffix. The affix slot takes any node, so a small
				    button lives here rather than beside the field - which is what
				    keeps it inside the focus ring and on the same baseline. */}
				<AppInputGroup
					data-cy="affix-button-suffix"
					endContent={
						<AppButton
							aria-label={isCopied ? "Copied" : "Copy URL"}
							onPress={() => {
								setIsCopied(true);
								window.setTimeout(() => setIsCopied(false), 1500);
							}}
							size="sm"
							variant="ghost"
						>
							{isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
						</AppButton>
					}
					label="Button suffix"
					onChange={setValue}
					startContent={<Globe className="size-4 text-text-secondary" />}
					value={value}
				/>

				<AppInputGroup
					data-cy="affix-spinner-suffix"
					description="A suffix is also where in-flight work goes - checking a username, resolving a domain."
					endContent={<Spinner className="size-4" />}
					label="Spinner suffix"
					onChange={() => undefined}
					value="jane"
				/>
			</div>
		</LabSection>
	);
}

/* ── 3. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="Required is announced as well as drawn. Read-only still lets you select and copy the value; disabled does not, and is for a field that is not yours to change."
			title="States"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppInputGroup
					data-cy="state-required"
					isRequired
					label="Required"
					onChange={() => undefined}
					placeholder="Jane"
					value=""
				/>
				<AppInputGroup
					data-cy="state-invalid"
					errorMessage="Enter a valid email"
					label="Invalid"
					onChange={() => undefined}
					startContent={<Mail className="size-4 text-text-secondary" />}
					value="not-an-email"
				/>
				<AppInputGroup
					data-cy="state-readonly"
					isReadOnly
					label="Read-only"
					onChange={() => undefined}
					value="usr_8f21c0a9e4"
				/>
				<AppInputGroup
					data-cy="state-disabled"
					isDisabled
					label="Disabled"
					onChange={() => undefined}
					value="jane@example.com"
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function SpecimenLabel({ summary, title }: { summary: string; title: string }) {
	return (
		<div>
			<h3 className="font-medium text-text-primary text-sm">{title}</h3>
			<p className="mt-0.5 text-text-secondary text-xs">{summary}</p>
		</div>
	);
}

function CodeBlock({ children }: { children: string }) {
	return (
		<pre className="overflow-x-auto rounded-lg border border-border bg-muted-surface/40 p-3 text-text-primary text-xs leading-relaxed">
			<code>{children}</code>
		</pre>
	);
}

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
}

function LabSection({ children, description, title }: LabSectionProps) {
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
