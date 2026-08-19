import { AppFileUpload, AppList, type UploadedFile } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { Paperclip } from "lucide-react";
import type { FormAttachment } from "@/features/request-form/validations/schema/request.schema";
import { UPLOAD_ATTACHMENT_ACCEPT_ATTRIBUTE, UPLOAD_MAX_BYTES, UPLOAD_MAX_FILES } from "@/lib/upload-constraints";
import { fileSrc } from "@/lib/upload-urls";
import { useDeferredUpload } from "@/lib/use-deferred-upload";

interface AttachmentUploaderProps {
	isDisabled?: boolean;
	/** Read-only mode: the files become a download list and the drop zone goes. */
	isReadOnly?: boolean;
	onChange: (attachments: FormAttachment[]) => void;
	value: FormAttachment[];
}

/** A size a person can read. `AppList`'s `meta` is one short fact, not a sentence. */
function formatBytes(bytes: number): string {
	if (bytes <= 0) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1_000_000) return `${Math.round(bytes / 1024)} KB`;

	return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/**
 * The supporting files, picked now and sent at save.
 *
 * `useDeferredUpload("request-attachments")` is what makes that true: dropping a
 * file parks it in the browser under an object URL, and the bytes move in the
 * flush when Save Draft or Submit is pressed. A quotation somebody dropped and
 * thought better of therefore never reaches the bucket at all - which is the
 * whole reason this is not the uploader it replaces, which sent on drop and left
 * an orphan for every abandoned form.
 *
 * `AppFileUpload` brings the four things the old hand-rolled dropzone listed as
 * open tasks and never built: drag-and-drop, per-file byte progress, per-file
 * retry, and remove with an undo. None of them are written here.
 */
export function AttachmentUploader({ isDisabled, isReadOnly, onChange, value }: AttachmentUploaderProps) {
	const upload = useDeferredUpload("request-attachments");

	/*
	 * The drop zone is shown PROXIED urls and the form stores S3 ones.
	 *
	 * The bucket is private, so a saved attachment's stored address renders as a
	 * broken thumbnail in the file row; `/api/files/*` is what a browser can
	 * actually open. But that path must never be what gets SAVED - the row is
	 * read by `collectRequestImageUrls`, and a key the sweep cannot match is an
	 * attachment it deletes as unreferenced. So the display url goes out through
	 * `fileSrc` and the stored one comes back by id on the way in.
	 */
	const storedUrlById = new Map(value.map((attachment) => [attachment.id, attachment.url]));
	const rowsForDisplay = value.map((attachment) => ({ ...attachment, url: fileSrc(attachment.url) }));

	const handleChange = (rows: UploadedFile[]) => {
		// `url` is optional on the component's row and required on ours. It only
		// emits rows whose upload SUCCEEDED and our handler always resolves with the
		// parked URL, so this drops nothing in practice - it is the type telling the
		// truth that a row with no URL is not something to store.
		//
		// A row the map has never seen is a `blob:` pick made in this session, and
		// its own url is already the right one to keep.
		onChange(
			rows.flatMap((row) => {
				const url = storedUrlById.get(row.id) ?? row.url;

				return url ? [{ ...row, url }] : [];
			}),
		);
	};

	if (isReadOnly) {
		return (
			/* The heading is drawn here rather than by a card around the list.
			   `AppList`'s `label` names it for a screen reader only, so read-only
			   attachments used to arrive as an unlabelled row of files in the rail -
			   and the card that was wrapping it put a second border and a second
			   padding around a surface that already had both. */
			<div className="flex flex-col gap-2">
				{/* AppCard's own title size and weight, so this section and the
				    Processor card beside it in the rail read as peers. */}
				<h3 className="text-base leading-6 font-semibold">Attachments</h3>

				{/* One line, not `AppList`'s illustrated empty state. That state is
				    built for a page's main column, where a 200px panel with a glyph in
				    it is the right way to say "nothing here"; in a 340px rail beside a
				    document it is the tallest thing on the screen, and what it has to
				    report is that there is nothing to report. */}
				{value.length === 0 ? (
					<Typography
						color="muted"
						data-cy="request-attachments-empty"
						type="body-sm"
					>
						No files were attached to this request.
					</Typography>
				) : (
					<AppList
						data-cy="request-attachments-list"
						items={value.map((attachment) => ({
							key: attachment.id,
							leading: { icon: Paperclip, kind: "icon" as const },
							meta: formatBytes(attachment.size),
							primary: attachment.name,
						}))}
						label="Attachments"
						// A new tab rather than a router navigation: half of these are PDFs
						// the browser will render itself, and replacing the page with one
						// would lose the request behind it. Through `fileSrc`, because the
						// bucket is private - the stored address answers 403.
						onSelectItem={(item) => {
							const attachment = value.find((row) => row.id === item.key);

							if (attachment) window.open(fileSrc(attachment.url), "_blank", "noopener,noreferrer");
						}}
					/>
				)}
			</div>
		);
	}

	return (
		<AppFileUpload
			accept={UPLOAD_ATTACHMENT_ACCEPT_ATTRIBUTE}
			data-cy="request-attachments"
			description="Quotations, plans or photos. They are sent when you save."
			isDisabled={isDisabled}
			label="Attachments"
			maxFiles={UPLOAD_MAX_FILES}
			maxSizeBytes={UPLOAD_MAX_BYTES}
			multiple
			onChange={handleChange}
			upload={upload}
			value={rowsForDisplay}
		/>
	);
}
