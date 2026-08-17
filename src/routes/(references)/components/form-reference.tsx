/**
 * Form Reference - canonical RHF + HeroUI v3 reference for agents.
 *
 * THIS PAGE IS NOT A COMPONENT. There is no `<AppForm>` to import; it is a
 * route, and what you reuse from it is `useAppForm` plus the App* field
 * wrappers below. `useAppForm` is where the shared behaviour lives - on-blur
 * validation, re-validate on change, and the `values` prop for an edit form -
 * so a new form starts by calling it, not by copying this file's JSX.
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
 *   AppDatePicker       value            onChange (CalendarDate)
 *   AppDateRangeField   value            onChange ({ start, end })  - commits on Apply
 *   AppTimeField        value            onChange (Time)
 *   AppFileUpload       value            (internal - emits UploadedFile[])
 *   AppReadOnlyField    -                -  (no control: nothing to register)
 */

import {
	AppAutocomplete,
	AppButton,
	AppCheckbox,
	AppCheckboxGroup,
	AppComboBox,
	AppDatePicker,
	AppDateRangeField,
	AppFileUpload,
	AppGlassCard,
	AppInputGroup,
	AppModal,
	AppNumberField,
	AppPageHeader,
	AppRadioGroup,
	AppReadOnlyField,
	AppSelect,
	AppSwitch,
	AppTextArea,
	AppTimeField,
	type UploadHandler,
} from "@bernardsapida/web-ui";
import { Fieldset, Form } from "@heroui/react";
import { CalendarDate, Time } from "@internationalized/date";
import { createFileRoute } from "@tanstack/react-router";
import { Braces, Globe, Mail, User } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { z } from "zod";
import { useAppForm } from "@/hooks/use-app-form";

export const Route = createFileRoute("/(references)/components/form-reference")({
	head: () => ({
		meta: [{ title: "Form Reference" }, { name: "robots", content: "noindex" }],
	}),
	component: FormReferencePage,
	staticData: { breadcrumb: "Form Reference" },
});

// ─── Schema ───────────────────────────────────────────────────────────────────

/** Exactly what AppFileUpload puts in the field once an upload resolves. */
const uploadedFileSchema = z.object({
	id: z.string(),
	name: z.string(),
	size: z.number(),
	type: z.string(),
	url: z.string().optional(),
});

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
	// Required on purpose, though a real newsletter opt-in would not be: a switch
	// with no rule attached has no invalid state, so nothing on this page would
	// demonstrate - or let a test reach - an AppSwitch showing an error.
	newsletter: z.boolean().refine((v) => v === true, "Turn the newsletter on to continue"),
	agreeToTerms: z.boolean().refine((v) => v === true, "You must agree to continue"),

	// Files - AppFileUpload always emits an array, single-file mode included, so
	// the shape here is the same either way. `.min(1)` is what makes it required.
	avatar: z.array(uploadedFileSchema).min(1, "Attach a profile photo"),
	// `.max(5)` is unreachable while maxFiles={5} rejects the sixth file at the
	// dropzone, so `.min(1)` is what gives this field a demonstrable error.
	attachments: z.array(uploadedFileSchema).min(1, "Attach at least one file").max(5, "Five files at most"),
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
	{
		value: "admin",
		label: "Admin",
		description: "Full access to all resources",
	},
	{
		value: "editor",
		label: "Editor",
		description: "Can create and edit content",
	},
	{ value: "viewer", label: "Viewer", description: "Read-only access" },
];

const notificationOptions = [
	{ value: "email", label: "Email" },
	{ value: "push", label: "Push" },
	{ value: "sms", label: "SMS" },
];

// ─── Demo uploader ────────────────────────────────────────────────────────────

const FAILS_AT_FRACTION = 0.9;
const TICK_MS = 120;
const TICKS_PER_FILE = 25;
const MIN_CHUNK_BYTES = 24 * 1024;

/**
 * Stands in for a real endpoint on a page that has none. `xhrUpload("/api/files")`
 * from the same module is the production one - `fetch` cannot report upload
 * progress, which is the whole reason that helper exists.
 *
 * The failure is deliberate and deterministic: a filename containing "fail" dies
 * at 90%, which is where real uploads die and where Retry has to prove it kept
 * the file. A random failure rate would make this page flaky to demo and to test.
 */
const simulatedUpload: UploadHandler = (file, { onProgress, signal }) =>
	new Promise((resolve, reject) => {
		const chunk = Math.max(file.size / TICKS_PER_FILE, MIN_CHUNK_BYTES);
		const failAt = /fail/i.test(file.name) ? FAILS_AT_FRACTION : Number.POSITIVE_INFINITY;
		let loaded = 0;

		const timer = setInterval(() => {
			loaded = Math.min(file.size, loaded + chunk);
			if (loaded / file.size >= failAt) {
				clearInterval(timer);
				reject(new Error("Connection lost"));
				return;
			}
			onProgress(loaded);
			if (loaded >= file.size) {
				clearInterval(timer);
				// A real handler returns the server's URL; a blob URL is the local stand-in.
				resolve({ url: URL.createObjectURL(file) });
			}
		}, TICK_MS);

		// Settle on abort rather than leaving the promise hanging - AppFileUpload
		// ignores a rejection whose signal already aborted, and a never-settled
		// promise would leak the row's AbortController.
		signal.addEventListener("abort", () => {
			clearInterval(timer);
			reject(new Error("Upload cancelled"));
		});
	});

// ─── Page ─────────────────────────────────────────────────────────────────────

function FormReferencePage() {
	const [formError, setFormError] = useState<string | null>(null);
	const [submitResult, setSubmitResult] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		reset,
		formState: { isSubmitting, errors },
		/*
		 * useAppForm, not useForm. It IS useForm with `mode: "onBlur"` and
		 * `reValidateMode: "onChange"` already applied - the timing every form in
		 * the app is supposed to share - and it returns RHF's own shape, so
		 * everything below this line is ordinary react-hook-form.
		 *
		 * For an EDIT form, add `values: record` beside `defaultValues` and RHF
		 * fills the fields when the record arrives. See use-app-form.ts.
		 */
	} = useAppForm<FormValues>(schema, {
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
			avatar: [],
			attachments: [],
		},
	});

	const onSubmit = handleSubmit(
		(values) => {
			setFormError(null);
			setSubmitResult(JSON.stringify(values, null, 2));
		},
		() => {
			// RHF calls this when validation fails - errors are shown per field
			setFormError(null);
			setSubmitResult(null);
		},
	);

	const errorCount = Object.keys(errors).length;

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Canonical RHF + HeroUI v3 patterns. Submit empty to trigger all errors."
				title="Form reference"
			/>

			{/* ─── Form ─────────────────────────────────────────────────────── */}
			<AppGlassCard>
				<AppGlassCard.Content className="p-4 sm:p-5">
					<Form
						className="flex flex-col gap-6"
						onSubmit={onSubmit}
						validationBehavior="aria"
					>
						{/* ── 1. Text & Input ─────────────────────────────────────── */}
						<Fieldset>
							<Fieldset.Legend>Text &amp; Input</Fieldset.Legend>
							<Fieldset.Group className="flex flex-col gap-4">
								{/* AppInputGroup - plain text, email, password, url */}
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

								{/* AppInputGroup - icon prefix (Mail) */}
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

								{/* AppInputGroup - icon prefix (Globe) */}
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

								{/* AppTextArea - multiline text */}
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
								{/* AppNumberField - stepper with min/max */}
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
								{/* AppSelect - dropdown, stores the selected item's value (string) */}
								<AppSelect
									control={control}
									data-cy="country"
									isRequired
									items={countryOptions}
									label="Country"
									name="country"
									placeholder="Select a country"
								/>

								{/* AppComboBox - combo of text input + listbox, stores selectedKey */}
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

								{/* AppAutocomplete - searchable with embedded search field */}
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
								{/* A date with no likely answers: presets={[]} drops the rail. */}
								<AppDatePicker
									control={control}
									data-cy="birthDate"
									isRequired
									label="Birth date"
									name="birthDate"
									presets={[]}
								/>

								{/* AppDatePicker - date segments + calendar popup */}
								<AppDatePicker
									control={control}
									data-cy="appointment"
									isRequired
									label="Appointment"
									name="appointment"
								/>

								{/* AppDateRangeField - RHF binding for AppDateRangeFilter: presets
								    rail, one to three month grids, and a typed range beside the
								    trigger. Nothing is written until Apply. */}
								<AppDateRangeField
									control={control}
									data-cy="eventRange"
									isRequired
									label="Event range"
									name="eventRange"
								/>

								{/* AppTimeField - time segments (HH:MM AM/PM) */}
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
								{/* AppRadioGroup - single selection, vertical */}
								<AppRadioGroup
									control={control}
									data-cy="role"
									isRequired
									items={roleOptions}
									label="Role"
									name="role"
								/>

								{/* AppCheckboxGroup - multi-select, stores string[] */}
								<AppCheckboxGroup
									control={control}
									data-cy="notifications"
									isRequired
									items={notificationOptions}
									label="Notifications"
									name="notifications"
								/>

								{/* AppSwitch - boolean toggle */}
								<AppSwitch
									control={control}
									data-cy="newsletter"
									description="Receive our weekly product updates."
									isRequired
									label="Newsletter"
									name="newsletter"
								/>

								{/* AppCheckbox - single boolean, requires true on submit */}
								<AppCheckbox
									control={control}
									data-cy="agreeToTerms"
									isRequired
									label="I agree to the terms of service"
									name="agreeToTerms"
								/>
							</Fieldset.Group>
						</Fieldset>

						{/* ── 6. Files ──────────────────────────────────────────────── */}
						<Fieldset>
							<Fieldset.Legend>Files</Fieldset.Legend>
							<Fieldset.Group className="flex flex-col gap-4">
								{/* AppFileUpload - single file. A second pick replaces the first. */}
								<AppFileUpload
									accept="image/*"
									control={control}
									data-cy="avatar"
									description="Click the thumbnail once it lands to open it full screen."
									isRequired
									label="Profile photo"
									maxSizeBytes={5 * 1024 * 1024}
									name="avatar"
									upload={simulatedUpload}
								/>

								{/* AppFileUpload - multiple. Every file gets its own bar, its own
								    Retry and its own Remove; one failure never blocks the rest. */}
								<AppFileUpload
									accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip"
									control={control}
									data-cy="attachments"
									description="Put 'fail' in a filename to watch the retry path."
									isRequired
									label="Attachments"
									maxFiles={5}
									maxSizeBytes={25 * 1024 * 1024}
									multiple
									name="attachments"
									upload={simulatedUpload}
								/>
							</Fieldset.Group>
						</Fieldset>

						{/* ── 7. Read-only ─────────────────────────────────────────── */}
						<Fieldset>
							<Fieldset.Legend>Read-only</Fieldset.Legend>
							<Fieldset.Group className="flex flex-col gap-4">
								{/* AppReadOnlyField - a value the form SHOWS but does not
								    collect. It takes no `control` and no `name`, so there is
								    nothing to register and nothing to validate; submit the
								    form and neither of these appears in the JSON.

								    It is a real disabled TextField rather than a styled div
								    precisely so it can sit in this grid: the label, the box
								    height and the baseline all match the editable field
								    beside it at every breakpoint, which is the whole reason
								    not to hand-roll a <dt>/<dd> pair here. */}
								<div className="grid grid-cols-2 gap-4">
									<AppReadOnlyField
										label="Account ID"
										value="usr_8f21c0a9e4"
									/>
									<AppReadOnlyField
										description="Set when the account was created. Contact support to change it."
										label="Sign-in email"
										value="jane@example.com"
									/>
								</div>
							</Fieldset.Group>
						</Fieldset>

						{/* ── ErrorMessage - form-level error (e.g. server rejection) ── */}
						{formError && (
							<div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
								<p className="text-sm text-danger">{formError}</p>
							</div>
						)}

						{/* ── Validation summary - shows error count after failed submit ──
						    Deliberately NOT HeroUI's <FieldError>. That component is
						    react-aria-components' FieldError and reads its state from a Field
						    context; this summary belongs to the whole form, so there is no
						    such context and it rendered nothing at all - the count was
						    invisible on every failed submit. */}
						{errorCount > 0 && (
							<p
								className="text-sm text-danger"
								role="alert"
							>
								{errorCount} {errorCount === 1 ? "field needs" : "fields need"} attention above.
							</p>
						)}

						{/* HeroUI's own gap is 8px, which puts a button that discards every
						    answer on the form one thumb-width from the one that submits them.
						    Reset is not a sibling of Submit; it needs enough air that the two
						    read as separate decisions, which 8px - and 16px - do not. */}
						<Fieldset.Actions className="flex gap-2">
							<AppButton
								isDisabled={isSubmitting}
								isPending={isSubmitting}
								type="submit"
							>
								<User className="size-4" />
								Submit
							</AppButton>
							<AppButton
								onPress={() => {
									reset();
									setFormError(null);
									setSubmitResult(null);
								}}
								type="button"
								variant="secondary"
							>
								Reset
							</AppButton>
						</Fieldset.Actions>
					</Form>
				</AppGlassCard.Content>
			</AppGlassCard>

			{/* ── Success output ──────────────────────────────────────────────
			    A modal rather than a panel below the form: the form is taller than
			    the viewport, so a card appended underneath lands off-screen and a
			    successful submit looks like nothing happened. AppModal is the right
			    one of the four overlays - this is something to READ, and the only
			    button it needs is Close. */}
			<AppModal
				description="Exactly what react-hook-form handed the submit handler, after Zod parsed it."
				icon={Braces}
				isOpen={submitResult !== null}
				onClose={() => setSubmitResult(null)}
				size="lg"
				title="Submitted values"
			>
				{submitResult && <JsonBlock json={submitResult} />}
			</AppModal>
		</div>
	);
}

// ─── JSON viewer ──────────────────────────────────────────────────────────────

/**
 * One pass over pretty-printed JSON, splitting it into coloured tokens.
 *
 * Alternation order matters: the key branch has to come before the plain-string
 * branch or `"firstName"` matches as a value and the colon never gets its key
 * colour.
 */
const JSON_TOKEN =
	/("(?:\\.|[^"\\])*")(\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

/**
 * Colours come from the theme block and nowhere else, so both themes are
 * covered. There is no purple in this palette and inventing one would be a
 * hard-coded colour, so the literals are separated by WEIGHT against the body
 * ink rather than by a sixth hue.
 */
const TOKEN_CLASS = {
	key: "text-accent",
	literal: "font-semibold text-text-primary",
	number: "text-warning-soft-foreground",
	string: "text-success-soft-foreground",
} as const;

function JsonBlock({ json }: { json: string }) {
	const nodes: ReactNode[] = [];
	let cursor = 0;

	for (const match of json.matchAll(JSON_TOKEN)) {
		const [full, keyName, colon, stringValue, literal, num] = match;
		const at = match.index;

		// Punctuation, whitespace and braces between tokens - left as plain text
		// so the block inherits the body colour and nothing has to enumerate them.
		if (at > cursor) nodes.push(json.slice(cursor, at));

		if (keyName) {
			nodes.push(
				<span
					className={TOKEN_CLASS.key}
					key={at}
				>
					{keyName}
				</span>,
			);
			nodes.push(colon);
		} else {
			const value = stringValue ?? literal ?? num;
			const kind = stringValue ? "string" : literal ? "literal" : "number";
			nodes.push(
				<span
					className={TOKEN_CLASS[kind]}
					key={at}
				>
					{value}
				</span>,
			);
		}

		cursor = at + full.length;
	}

	nodes.push(json.slice(cursor));

	return (
		// The modal body already scrolls vertically; this only has to own the
		// horizontal overflow, or a long URL widens the dialog instead of scrolling.
		<pre
			className="overflow-x-auto rounded-lg border border-border bg-muted-surface/40 p-4 text-xs leading-relaxed text-text-primary"
			data-cy="submitted-json"
		>
			<code>{nodes}</code>
		</pre>
	);
}
