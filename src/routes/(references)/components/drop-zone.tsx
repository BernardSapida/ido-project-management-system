import type { UploadedFile, UploadHandler } from "@bernardsapida/web-ui";
import { AppButton, AppFileUpload, AppPageHeader } from "@bernardsapida/web-ui";
import { Form } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { LabSection, SpecimenLabel, ValueReadOut } from "@/features/labs/components/LabSection";
import { useAppForm } from "@/hooks/use-app-form";

const TITLE = "Drop zone";

/**
 * Drop zone lab.
 *
 * The failure path is the point of this page. Everything about an upload
 * control is easy to judge while it works; what is expensive to get wrong is
 * what happens at 90% on a flaky connection, and the answer has to be that the
 * file is still there and Retry sends the same one.
 *
 * The uploader below is simulated and its failure is deterministic: put "fail"
 * anywhere in a filename and it dies at 90%. A random failure rate would make
 * this page flaky to demo and impossible to test.
 *
 * Things to check by hand:
 *
 * 1. **Drop a file named `report-fail.pdf` alongside a normal one.** One row
 *    fails, the other finishes. A single failure never blocks the rest, which
 *    is the whole reason each file gets its own bar, its own Retry and its own
 *    Remove.
 * 2. **Press Retry on the failed row.** It resends without asking you to find
 *    the file again.
 * 3. **Cancel a file mid-flight.** The row goes, and so does the request - the
 *    handler is given an AbortSignal and is expected to honour it.
 * 4. **Watch the stored value below the multi specimen.** A file that is
 *    uploading or has failed is VISIBLE but is not yet a value of the field,
 *    which is what keeps a half-finished upload out of a submit.
 */
export const Route = createFileRoute("/(references)/components/drop-zone")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: DropZoneLab,
});

/* ── The simulated uploader ───────────────────────────────────────────────── */

const FAILS_AT_FRACTION = 0.9;
const TICK_MS = 120;
const TICKS_PER_FILE = 25;
const MIN_CHUNK_BYTES = 24 * 1024;

/**
 * Stands in for a real endpoint on a page that has none. `xhrUpload("/api/files")`
 * is the production one - `fetch` cannot report upload progress, which is the
 * whole reason that helper exists.
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
				resolve({ url: URL.createObjectURL(file) });
			}
		}, TICK_MS);

		// Settle on abort rather than leaving the promise hanging - a never-settled
		// promise would leak the row's AbortController.
		signal.addEventListener("abort", () => {
			clearInterval(timer);
			reject(new Error("Upload cancelled"));
		});
	});

function DropZoneLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Drag and drop with a click fallback, per-file progress, and a retry that keeps the file."
				title={TITLE}
			/>
			<BindingSection />
			<MultipleSection />
			<StateSection />
		</div>
	);
}

/* ── 1. Both binding modes ────────────────────────────────────────────────── */

const uploadedFileSchema = z.object({
	id: z.string(),
	name: z.string(),
	size: z.number(),
	type: z.string(),
	url: z.string().optional(),
});

const schema = z.object({
	avatar: z.array(uploadedFileSchema).min(1, "Attach a profile photo"),
});

type Values = z.input<typeof schema>;

function BindingSection() {
	return (
		<LabSection
			description="Single-file mode still emits an ARRAY - the shape is the same either way, so a schema does not change when a field grows a second slot. `.min(1)` is what makes it required."
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
		defaultValues: { avatar: [] },
	});

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="control + name."
				title="react-hook-form"
			/>
			<Form
				className="flex flex-col items-start gap-3"
				onSubmit={handleSubmit(() => undefined)}
				validationBehavior="aria"
			>
				<AppFileUpload
					accept="image/*"
					control={control}
					data-cy="bound-avatar"
					description="One image. A second pick replaces the first."
					isRequired
					label="Profile photo"
					maxSizeBytes={5 * 1024 * 1024}
					name="avatar"
					upload={simulatedUpload}
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
	const [files, setFiles] = useState<UploadedFile[]>([]);
	const [error, setError] = useState<string | undefined>();

	return (
		<div className="flex flex-col gap-3">
			<SpecimenLabel
				summary="value + onChange + errorMessage."
				title="Local state"
			/>
			<AppFileUpload
				accept="image/*"
				data-cy="standalone-avatar"
				description="One image. A second pick replaces the first."
				errorMessage={error}
				isRequired
				label="Profile photo"
				maxSizeBytes={5 * 1024 * 1024}
				onChange={(next) => {
					setFiles(next);
					setError(next.length ? undefined : "Attach a profile photo");
				}}
				upload={simulatedUpload}
				value={files}
			/>
			<ValueReadOut
				label="Stored"
				value={files.map((file) => file.name)}
			/>
		</div>
	);
}

/* ── 2. Multiple ──────────────────────────────────────────────────────────── */

function MultipleSection() {
	const [files, setFiles] = useState<UploadedFile[]>([]);

	return (
		<LabSection
			description="Every file gets its own bar, its own Retry and its own Remove, so one failure never blocks the rest. Put 'fail' in a filename to watch the retry path - the failure is deterministic on purpose, because a random one would make this page impossible to demo twice."
			title="Multiple files, and the failure path"
		>
			<AppFileUpload
				accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
				data-cy="multiple"
				description="Up to five files, 25 MB each. Try one named 'report-fail.pdf'."
				label="Attachments"
				maxFiles={5}
				maxSizeBytes={25 * 1024 * 1024}
				multiple
				onChange={setFiles}
				upload={simulatedUpload}
				value={files}
			/>
			<ValueReadOut
				label="Committed to the field"
				value={files.map((file) => file.name)}
			/>
			<p className="text-sm text-text-secondary">
				A file that is uploading or has failed appears above but is not in that list. Being on screen and being an
				answer are different things, and only the second one may reach a submit.
			</p>
		</LabSection>
	);
}

/* ── 3. States ────────────────────────────────────────────────────────────── */

function StateSection() {
	return (
		<LabSection
			description="The two limits are enforced at the dropzone rather than at the schema, so an oversized file is refused with a reason at the moment it lands instead of surfacing as a form error after the user has moved on."
			title="States"
		>
			<div className="flex flex-col gap-6">
				<AppFileUpload
					data-cy="state-invalid"
					errorMessage="Attach at least one file"
					isRequired
					label="Invalid"
					onChange={() => undefined}
					upload={simulatedUpload}
					value={[]}
				/>
				<AppFileUpload
					data-cy="state-disabled"
					description="Uploads are closed while the report is generating."
					isDisabled
					label="Disabled"
					onChange={() => undefined}
					upload={simulatedUpload}
					value={[]}
				/>
				<AppFileUpload
					accept=".csv"
					data-cy="state-accept"
					description="CSV only, 1 MB. Try a PNG and read what it says."
					label="Narrow accept"
					maxSizeBytes={1024 * 1024}
					onChange={() => undefined}
					upload={simulatedUpload}
					value={[]}
				/>
			</div>
		</LabSection>
	);
}
