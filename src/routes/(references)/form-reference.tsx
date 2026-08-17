/**
 * Form Reference — canonical RHF + HeroUI v3 reference for agents.
 *
 * Every App* form wrapper is demonstrated here with:
 *   - A Zod schema that fails on empty submit (shows error visualization)
 *   - Correct useController wiring per component type
 *   - Description, FieldError, Fieldset, and Form usage
 *   - InputGroup with icon prefix
 *
 * Component → value prop → change handler reference:
 *   AppInputGroup        value            onChange
 *   AppTextArea         value            onChange
 *   AppInputGroup       value            onChange
 *   AppNumberField      value            onChange (Number.isNaN guard)
 *   AppSelect           value            onChange
 *   AppComboBox         selectedKey      onSelectionChange
 *   AppAutocomplete     value            onChange
 *   AppCheckbox         isSelected       onValueChange (bool)
 *   AppCheckboxGroup    value            onChange (string[])
 *   AppRadioGroup       value            onChange
 *   AppSwitch           isSelected       onValueChange (bool)
 *   AppDatePicker        value            onChange (CalendarDate)
 *   AppDatePicker       value            onChange (CalendarDate)
 *   AppDateRangePicker  value            onChange ({ start, end })
 *   AppTimeField        value            onChange (Time)
 */

import {
	AppAutocomplete,
	AppCheckbox,
	AppCheckboxGroup,
	AppComboBox,
	AppDatePicker,
	AppDateRangePicker,
	AppInputGroup,
	AppNumberField,
	AppRadioGroup,
	AppSelect,
	AppSwitch,
	AppTextArea,
	AppTimeField,
} from "@bernardsapida/web-ui";
import { Button, FieldError, Fieldset, Form } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDate, Time } from "@internationalized/date";
import { createFileRoute } from "@tanstack/react-router";
import { Globe, Mail, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const Route = createFileRoute("/(references)/form-reference")({
	head: () => ({
		meta: [{ title: "Form Reference" }, { name: "robots", content: "noindex" }],
	}),
	component: FormReferencePage,
	staticData: { breadcrumb: "Form Reference" },
});

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
	// Text
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().min(1, "Email is required").email("Enter a valid email"),
	website: z.string().min(1, "Website is required").url({ message: "Enter a valid URL" }),
	bio: z.string().min(10, "Bio must be at least 10 characters"),

	// Number
	age: z.number({ error: "Age is required" }).min(18, "Must be 18 or older").max(120, "Must be 120 or younger"),

	// Selection
	country: z
		.string()
		.nullable()
		.refine((v) => v !== null && v !== "", "Select a country"),
	framework: z
		.string()
		.nullable()
		.refine((v) => v !== null, "Select a framework"),
	city: z
		.string()
		.nullable()
		.refine((v) => v !== null, "Select a city"),

	// Dates & Times
	birthDate: z
		.custom<CalendarDate>((v) => v instanceof CalendarDate, "Select a date")
		.nullable()
		.refine((v) => v !== null, "Select a birth date"),
	appointment: z
		.custom<CalendarDate>((v) => v instanceof CalendarDate, "Select a date")
		.nullable()
		.refine((v) => v !== null, "Select an appointment date"),
	eventRange: z
		.object({
			start: z.custom<CalendarDate>((v) => v instanceof CalendarDate, "Select a start date"),
			end: z.custom<CalendarDate>((v) => v instanceof CalendarDate, "Select an end date"),
		})
		.nullable()
		.refine((v) => v !== null, "Select a date range"),
	meetingTime: z
		.custom<Time>((v) => v instanceof Time, "Select a time")
		.nullable()
		.refine((v) => v !== null, "Select a meeting time"),

	// Toggles
	role: z.string().min(1, "Select a role"),
	notifications: z.array(z.string()).min(1, "Select at least one"),
	newsletter: z.boolean(),
	agreeToTerms: z.boolean().refine((v) => v === true, "You must agree to continue"),
});

type FormValues = z.input<typeof schema>;

// ─── Static options ───────────────────────────────────────────────────────────

const countryOptions = [
	{ value: "ph", label: "Philippines" },
	{ value: "us", label: "United States" },
	{ value: "sg", label: "Singapore" },
	{ value: "jp", label: "Japan" },
	{ value: "au", label: "Australia" },
	{ value: "gb", label: "United Kingdom" },
];

const frameworkOptions = [
	{ value: "react", label: "React" },
	{ value: "vue", label: "Vue" },
	{ value: "svelte", label: "Svelte" },
	{ value: "solid", label: "SolidJS" },
	{ value: "angular", label: "Angular" },
];

const cityOptions = [
	{ value: "manila", label: "Manila" },
	{ value: "cebu", label: "Cebu" },
	{ value: "davao", label: "Davao" },
	{ value: "bgc", label: "BGC" },
	{ value: "makati", label: "Makati" },
];

const roleOptions = [
	{ value: "admin", label: "Admin", description: "Full access to all resources" },
	{ value: "editor", label: "Editor", description: "Can create and edit content" },
	{ value: "viewer", label: "Viewer", description: "Read-only access" },
];

const notificationOptions = [
	{ value: "email", label: "Email" },
	{ value: "push", label: "Push" },
	{ value: "sms", label: "SMS" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function FormReferencePage() {
	const [formError, setFormError] = useState<string | null>(null);
	const [submitResult, setSubmitResult] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		reset,
		formState: { isSubmitting, errors },
	} = useForm<FormValues>({
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			website: "",
			bio: "",
			age: 0,
			country: null,
			framework: null,
			city: null,
			birthDate: null,
			appointment: null,
			eventRange: null,
			meetingTime: null,
			role: "",
			notifications: [],
			newsletter: false,
			agreeToTerms: false,
		},
		mode: "onBlur",
		reValidateMode: "onChange",
		resolver: zodResolver(schema),
	});

	const onSubmit = handleSubmit(
		(values) => {
			setFormError(null);
			setSubmitResult(JSON.stringify(values, null, 2));
		},
		() => {
			// RHF calls this when validation fails — errors are shown per field
			setFormError(null);
			setSubmitResult(null);
		},
	);

	const errorCount = Object.keys(errors).length;

	return (
		<div className="mx-auto max-w-2xl px-4 py-10">
			<div className="mb-8 flex flex-col gap-1">
				<h1 className="text-2xl font-bold text-text-primary">Form Reference</h1>
				<p className="text-sm text-text-secondary">
					Canonical RHF + HeroUI v3 patterns. Submit empty to trigger all errors.
				</p>
			</div>

			{/* ─── Form ─────────────────────────────────────────────────────── */}
			<Form
				className="flex flex-col gap-6"
				onSubmit={onSubmit}
				validationBehavior="aria"
			>
				{/* ── 1. Text & Input ─────────────────────────────────────── */}
				<Fieldset>
					<Fieldset.Legend>Text &amp; Input</Fieldset.Legend>
					<Fieldset.Group className="flex flex-col gap-4">
						{/* AppInputGroup — plain text, email, password, url */}
						<div className="grid grid-cols-2 gap-4">
							<AppInputGroup
								control={control}
								data-cy="firstName"
								isRequired
								label="First name"
								name="firstName"
								placeholder="Jane"
							/>
							<AppInputGroup
								control={control}
								data-cy="lastName"
								isRequired
								label="Last name"
								name="lastName"
								placeholder="Doe"
							/>
						</div>

						{/* AppInputGroup — icon prefix (Mail) */}
						<AppInputGroup
							control={control}
							data-cy="email"
							description="Used for your account login."
							isRequired
							label="Email"
							name="email"
							placeholder="jane@example.com"
							startContent={<Mail className="size-4 text-text-secondary" />}
							type="email"
						/>

						{/* AppInputGroup — icon prefix (Globe) */}
						<AppInputGroup
							control={control}
							data-cy="website"
							isRequired
							label="Website"
							name="website"
							placeholder="https://example.com"
							startContent={<Globe className="size-4 text-text-secondary" />}
							type="url"
						/>

						{/* AppTextArea — multiline text */}
						<AppTextArea
							control={control}
							data-cy="bio"
							description="Minimum 10 characters."
							isRequired
							label="Bio"
							name="bio"
							placeholder="Tell us a bit about yourself..."
						/>
					</Fieldset.Group>
				</Fieldset>

				{/* ── 2. Number ────────────────────────────────────────────── */}
				<Fieldset>
					<Fieldset.Legend>Number</Fieldset.Legend>
					<Fieldset.Group className="flex flex-col gap-4">
						{/* AppNumberField — stepper with min/max */}
						<AppNumberField
							control={control}
							data-cy="age"
							isRequired
							label="Age"
							maxValue={120}
							minValue={0}
							name="age"
							step={1}
						/>
					</Fieldset.Group>
				</Fieldset>

				{/* ── 3. Selection ─────────────────────────────────────────── */}
				<Fieldset>
					<Fieldset.Legend>Selection</Fieldset.Legend>
					<Fieldset.Group className="flex flex-col gap-4">
						{/* AppSelect — dropdown, stores the selected item's value (string) */}
						<AppSelect
							control={control}
							data-cy="country"
							isRequired
							items={countryOptions}
							label="Country"
							name="country"
							placeholder="Select a country"
						/>

						{/* AppComboBox — combo of text input + listbox, stores selectedKey */}
						<AppComboBox
							control={control}
							data-cy="framework"
							description="Type to filter, then pick from the list."
							isRequired
							items={frameworkOptions}
							label="Framework"
							name="framework"
							placeholder="Search frameworks..."
						/>

						{/* AppAutocomplete — searchable with embedded search field */}
						<AppAutocomplete
							control={control}
							data-cy="city"
							description="Full-text search inside the popover."
							isRequired
							items={cityOptions}
							label="City"
							name="city"
							placeholder="Select a city"
						/>
					</Fieldset.Group>
				</Fieldset>

				{/* ── 4. Dates & Times ─────────────────────────────────────── */}
				<Fieldset>
					<Fieldset.Legend>Dates &amp; Times</Fieldset.Legend>
					<Fieldset.Group className="flex flex-col gap-4">
						{/* AppDatePicker — date segments plus a calendar popup */}
						<AppDatePicker
							control={control}
							data-cy="birthDate"
							isRequired
							label="Birth date"
							name="birthDate"
						/>

						{/* AppDatePicker — date segments + calendar popup */}
						<AppDatePicker
							control={control}
							data-cy="appointment"
							isRequired
							label="Appointment"
							name="appointment"
						/>

						{/* AppDateRangePicker — start/end date with calendar */}
						<AppDateRangePicker
							control={control}
							data-cy="eventRange"
							isRequired
							label="Event range"
							name="eventRange"
						/>

						{/* AppTimeField — time segments (HH:MM AM/PM) */}
						<AppTimeField
							control={control}
							data-cy="meetingTime"
							description="Enter the meeting start time."
							isRequired
							label="Meeting time"
							name="meetingTime"
						/>
					</Fieldset.Group>
				</Fieldset>

				{/* ── 5. Toggles & Groups ───────────────────────────────────── */}
				<Fieldset>
					<Fieldset.Legend>Toggles &amp; Groups</Fieldset.Legend>
					<Fieldset.Group className="flex flex-col gap-4">
						{/* AppRadioGroup — single selection, vertical */}
						<AppRadioGroup
							control={control}
							data-cy="role"
							isRequired
							items={roleOptions}
							label="Role"
							name="role"
						/>

						{/* AppCheckboxGroup — multi-select, stores string[] */}
						<AppCheckboxGroup
							control={control}
							data-cy="notifications"
							isRequired
							items={notificationOptions}
							label="Notifications"
							name="notifications"
						/>

						{/* AppSwitch — boolean toggle */}
						<AppSwitch
							control={control}
							data-cy="newsletter"
							description="Receive our weekly product updates."
							isRequired
							label="Newsletter"
							name="newsletter"
						/>

						{/* AppCheckbox — single boolean, requires true on submit */}
						<AppCheckbox
							control={control}
							data-cy="agreeToTerms"
							isRequired
							label="I agree to the terms of service"
							name="agreeToTerms"
						/>
					</Fieldset.Group>
				</Fieldset>

				{/* ── ErrorMessage — form-level error (e.g. server rejection) ── */}
				{formError && (
					<div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
						<p className="text-sm text-danger">{formError}</p>
					</div>
				)}

				{/* ── Validation summary — shows error count after failed submit ── */}
				{errorCount > 0 && (
					<FieldError className="text-sm">
						{errorCount} {errorCount === 1 ? "field needs" : "fields need"} attention above.
					</FieldError>
				)}

				<Fieldset.Actions>
					<Button
						isDisabled={isSubmitting}
						isPending={isSubmitting}
						type="submit"
					>
						<User className="size-4" />
						Submit
					</Button>
					<Button
						onPress={() => {
							reset();
							setFormError(null);
							setSubmitResult(null);
						}}
						type="button"
						variant="secondary"
					>
						Reset
					</Button>
				</Fieldset.Actions>
			</Form>

			{/* ── Success output ──────────────────────────────────────────── */}
			{submitResult && (
				<div className="mt-8 rounded-lg border border-border bg-surface p-4">
					<p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">Submitted values</p>
					<pre className="overflow-x-auto text-xs text-text-primary">{submitResult}</pre>
				</div>
			)}
		</div>
	);
}
