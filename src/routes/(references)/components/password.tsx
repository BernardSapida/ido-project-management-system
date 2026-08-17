import { AppButton, AppGlassCard, AppPageHeader, AppPasswordField } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Password";

/**
 * Password lab.
 *
 * `AppPasswordField` is a composition over `AppInputGroup`, not a fourth text
 * input - a password adds exactly two things to a text field, a `type` that
 * flips and a button to flip it, and both belong in the suffix slot that
 * already exists.
 *
 * Things to check by hand:
 *
 * 1. **Tab to the reveal button.** It is in the tab order, and its name says
 *    what pressing it will DO ("Show password"), not what the field currently
 *    is. State descriptions leave a screen reader user to infer the action.
 * 2. **Let a password manager fill the sign-in specimen.** `autoComplete` is
 *    required on this component precisely so this works - the hint browsers
 *    guess from surrounding markup is frequently `new-password` on a sign-in
 *    form, which is what makes a manager offer to overwrite a saved entry.
 * 3. **Submit the sign-up form empty**, then type four characters. The rule is
 *    stated up front in the description rather than only on failure.
 */
export const Route = createFileRoute("/(references)/components/password")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: PasswordLab,
});

function PasswordLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A masked field with a reveal toggle, and the autocomplete hint that decides whether a password manager helps or hinders."
				title={TITLE}
			/>
			<BindingSection />
			<AutoCompleteSection />
			<StateSection />
		</div>
	);
}

/* ── 1. Both binding modes ────────────────────────────────────────────────── */

const schema = z.object({
	password: z.string().min(8, "At least 8 characters"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="Same rule, stated the same way, reached two different ways."
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
		defaultValues: { password: "" },
	});

	return (
		<div className="flex flex-col gap-3">
			<h3 className="font-medium text-sm text-text-primary">react-hook-form</h3>
			<Form
				className="flex flex-col gap-3"
				onSubmit={handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<AppPasswordField
					autoComplete="new-password"
					control={control}
					data-cy="bound-password"
					description="At least 8 characters."
					isRequired
					label="New password"
					name="password"
					placeholder="••••••••"
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
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | undefined>();

	function validate(next: string): string | undefined {
		const result = schema.shape.password.safeParse(next);
		return result.success ? undefined : result.error.issues[0]?.message;
	}

	return (
		<div className="flex flex-col gap-3">
			<h3 className="font-medium text-sm text-text-primary">Local state</h3>
			<AppPasswordField
				autoComplete="new-password"
				data-cy="standalone-password"
				description="At least 8 characters."
				errorMessage={error}
				isRequired
				label="New password"
				onBlur={() => setError(validate(password))}
				onChange={(next) => {
					setPassword(next);
					if (error) setError(validate(next));
				}}
				placeholder="••••••••"
				value={password}
			/>
		</div>
	);
}

/* ── 2. The autocomplete hint ─────────────────────────────────────────────── */

function AutoCompleteSection() {
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");

	return (
		<LabSection
			description="`autoComplete` is required rather than optional. It is the only thing telling a password manager whether to offer a saved entry or to generate and save a new one, and guessing it wrong is the difference between a helpful autofill and one that offers to overwrite the user's real password."
			title="current-password vs new-password"
		>
			<div className="flex flex-col gap-4">
				<AppPasswordField
					autoComplete="current-password"
					data-cy="ac-current"
					description="Sign-in. The manager offers what it already has."
					label="Password"
					onChange={setCurrent}
					placeholder="••••••••"
					value={current}
				/>
				<AppPasswordField
					autoComplete="new-password"
					data-cy="ac-new"
					description="Sign-up and change-password. The manager offers to generate one, and saves it."
					label="New password"
					onChange={setNext}
					placeholder="••••••••"
					value={next}
				/>
			</div>
		</LabSection>
	);
}

/* ── 3. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="The lock in the prefix is optional - three identical padlocks down a column of only passwords is decoration, not information, so a change-password card turns it off."
			title="States, and the icon"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppPasswordField
					autoComplete="current-password"
					data-cy="state-invalid"
					errorMessage="Incorrect password"
					label="Invalid"
					onChange={() => undefined}
					value="hunter2"
				/>
				<AppPasswordField
					autoComplete="current-password"
					data-cy="state-disabled"
					isDisabled
					label="Disabled"
					onChange={() => undefined}
					value="hunter2"
				/>
				<AppPasswordField
					autoComplete="new-password"
					data-cy="state-no-icon"
					label="No icon"
					onChange={() => undefined}
					showIcon={false}
					value=""
				/>
				<AppPasswordField
					autoComplete="new-password"
					data-cy="state-required"
					isRequired
					label="Required"
					onChange={() => undefined}
					value=""
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
