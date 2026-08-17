import type { UploadedFile } from "@bernardsapida/web-ui";
import { AppButton, AppFileUpload, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { seo } from "@/config/seo.config";
import { LabSection, SpecimenLabel, ValueReadOut } from "@/features/labs/components/LabSection";
import { pendingUrlsIn, withUploadedUrls } from "@/lib/pending-uploads";
import { UPLOAD_ACCEPT_ATTRIBUTE, UPLOAD_MAX_BYTES } from "@/lib/upload-constraints";
import { useDeferredUpload } from "@/lib/use-deferred-upload";
import { useUploadingSubmit } from "@/lib/use-uploading-submit";

const TITLE = "S3 upload";

/**
 * The S3 integration, end to end and against a REAL bucket.
 *
 * ## How this differs from the Drop zone lab
 *
 * `Drop zone` demonstrates the COMPONENT, against a simulated uploader whose
 * failure is deterministic - put "fail" in a filename and it dies at 90%, which
 * is the only way to demo Retry on demand. Pointing that page at a working
 * bucket would delete its whole purpose.
 *
 * This page demonstrates the WIRING, and it is the smallest thing that proves
 * the bucket, the credentials, the policy and the CORS rule are all correct.
 * Open it first after filling in the four AWS variables - before building a real
 * form and then wondering which of five layers is wrong.
 *
 * ## The shape being demonstrated: uploads are DEFERRED
 *
 * Dropping a file here does not touch the network. The file is parked in
 * `pending-uploads` under an object URL, and that URL travels through the form
 * exactly where a real S3 URL would sit. **The bytes move when you press Save.**
 *
 * The reason is the abandoned form. Uploading on drop means every picture
 * somebody dropped and then thought better of - or dropped before closing the
 * tab - is already in the bucket with nothing pointing at it, and only a sweep
 * to collect it. This way nothing reaches S3 until a save is on its way.
 *
 * The cost is visible below: the drop zone's own progress bar completes
 * instantly, because the "upload" is a `URL.createObjectURL` call. The honest
 * bar moved to the Save button, which is where the waiting now happens.
 *
 * ## Setup
 *
 * Needs `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID` and
 * `AWS_SECRET_ACCESS_KEY` in `.env` or `.env.local`, plus a public-read bucket
 * policy and a CORS rule allowing PUT from this origin. Full runbook:
 * `../infrastructure/docs/aws/s3-setup.md`.
 *
 * You must also be signed in as an ADMIN - `upload.presign` is an
 * `adminProcedure`, so an anonymous visitor gets UNAUTHORIZED rather than an
 * upload URL.
 *
 * ## Things to check by hand
 *
 * 1. **Drop an image and watch the stored value.** The URL is `blob:…` - the
 *    file is in the browser, not the bucket. Nothing has been sent.
 * 2. **Press Save.** The button label counts a percentage across all files, and
 *    the stored value flips to `https://<bucket>.s3.…`.
 * 3. **Open that URL in a new tab.** It must DISPLAY, not download. A 403 means
 *    the bucket policy is missing or Block Public Access is still on; a download
 *    means `ContentType` was not set.
 * 4. **Read the key.** `uploads/YYYY/MM/<uuid>.<ext>` - date partitioned and
 *    randomly named, so two people uploading `photo.jpg` get two objects rather
 *    than one overwriting the other.
 * 5. **Drop four files, then Save.** They go three at a time, not all at once -
 *    a phone on hotel wifi sending eight 10 MB files times all of them out.
 * 6. **Try a `.txt` file.** Refused by `accept` at pick time, and refused again
 *    by the zod enum behind `presign` if you force it.
 *
 * ## When it fails
 *
 * The messages are written to be diagnostic rather than tidy:
 *
 * - *"Image uploads are not configured. Missing in .env: …"* - the four
 *   variables, named individually.
 * - *"Could not reach S3. Check the bucket's CORS rules for this origin."* - a
 *   network-level failure with no status and no body, which is exactly what a
 *   missing CORS rule looks like from the browser.
 * - *"S3 rejected the upload (403)…"* - reached S3 and was refused. Usually a
 *   `Content-Type` that does not match what was signed, or clock skew.
 */
export const Route = createFileRoute("/(references)/components/s3-upload")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: S3UploadLab,
});

function S3UploadLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The real bucket, end to end. Files are parked on drop and sent on Save."
				title={TITLE}
			/>
			<DeferredFlushSection />
		</div>
	);
}

/* ── Pick, then flush on save ─────────────────────────────────────────────── */

interface LabValues {
	files: UploadedFile[];
}

function DeferredFlushSection() {
	const [files, setFiles] = useState<UploadedFile[]>([]);
	const [saved, setSaved] = useState<UploadedFile[] | undefined>();
	const [error, setError] = useState<string | undefined>();

	// Parks the file. No network. The folder is fixed per drop zone because it
	// becomes the key prefix - see UPLOAD_FOLDERS.
	const upload = useDeferredUpload("uploads");

	/*
	 * The four-step submit, in the order that matters: flush → rewrite → save →
	 * release. `collect` says which URLs are still files in the browser; `apply`
	 * puts the S3 URLs back in their place.
	 *
	 * A real page passes a mutation as `save`. This one just keeps the result so
	 * the readout can show what a record WOULD have stored.
	 */
	const { isSubmitting, pendingLabel, submit } = useUploadingSubmit<LabValues>({
		apply: (values, uploaded) => ({ files: withUploadedUrls(values.files, uploaded) }),
		collect: (values) => pendingUrlsIn(values.files),
	});

	const onSave = async () => {
		setError(undefined);

		try {
			await submit({ files }, async (resolved) => {
				setFiles(resolved.files);
				setSaved(resolved.files);
			});
		} catch (caught) {
			// A flush that fails deletes whatever it already sent before rethrowing,
			// so there is nothing half-uploaded to clean up here.
			setError(caught instanceof Error ? caught.message : "Something went wrong");
		}
	};

	return (
		<LabSection
			description="Drop a file and the value is a blob: URL - nothing has been sent. Press Save and it becomes an S3 URL."
			title="Deferred upload, flushed on save"
		>
			<SpecimenLabel
				summary="value + onChange, with a deferred handler."
				title="Images"
			/>
			<AppFileUpload
				accept={UPLOAD_ACCEPT_ATTRIBUTE}
				description="Up to four. Parked in the browser until you press Save."
				isDisabled={isSubmitting}
				label="Images"
				maxFiles={4}
				maxSizeBytes={UPLOAD_MAX_BYTES}
				multiple
				onChange={setFiles}
				upload={upload}
				value={files}
			/>

			<div className="flex items-center gap-3">
				<AppButton
					isDisabled={files.length === 0 || isSubmitting}
					onPress={onSave}
					variant="primary"
				>
					{/* The percentage lives on the button because that is where the wait
					    now is - the drop zone's own bar finished at pick time. */}
					{pendingLabel ?? "Save"}
				</AppButton>
				{error ? <p className="text-danger text-sm">{error}</p> : null}
			</div>

			<ValueReadOut
				label="Field value"
				value={files.map((file) => file.url)}
			/>
			<ValueReadOut
				label="Saved (what a record would store)"
				value={saved?.map((file) => file.url)}
			/>
		</LabSection>
	);
}
