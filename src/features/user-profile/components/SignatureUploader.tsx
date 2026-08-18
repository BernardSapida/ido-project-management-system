import { AppAlert, AppButton, AppFileUpload, type UploadedFile } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { PenLine, Trash2 } from "lucide-react";
import { useState } from "react";
import { UPLOAD_ACCEPT_ATTRIBUTE, UPLOAD_MAX_BYTES } from "@/lib/upload-constraints";
import { useDeferredUpload } from "@/lib/use-deferred-upload";

interface SignatureUploaderProps {
	/** What is on file — the saved S3 URL, or the `blob:` of an unsaved pick. */
	currentSignatureUrl: string | null;
	isDisabled?: boolean;
	/** A URL to store, or `null` to remove the signature on the next save. */
	onChange: (url: string | null) => void;
}

/**
 * Pick a signature. Nothing is sent until the profile is saved.
 *
 * `useDeferredUpload("signatures")` is what makes that true: the file is parked
 * in the browser under an object URL and the bytes move in the flush, when Save
 * is pressed. A signature somebody dropped and thought better of therefore never
 * reaches the bucket at all.
 *
 * The current signature is shown ABOVE the drop zone rather than inside it, so
 * replacing one is a deliberate act — the person can see what they are about to
 * overwrite. Removing is a separate press for the same reason.
 */
export function SignatureUploader({ currentSignatureUrl, isDisabled, onChange }: SignatureUploaderProps) {
	const upload = useDeferredUpload("signatures");

	// The drop zone's own rows. Local because the FORM stores one URL, not a file
	// list — this component is the only place the two shapes have to meet.
	const [files, setFiles] = useState<UploadedFile[]>([]);

	const handleChange = (rows: UploadedFile[]) => {
		setFiles(rows);
		onChange(rows.at(-1)?.url ?? null);
	};

	const handleRemove = () => {
		setFiles([]);
		onChange(null);
	};

	const hasPick = files.length > 0;

	return (
		<div className="flex flex-col gap-4">
			{currentSignatureUrl === null && !hasPick ? (
				<AppAlert
					description="Your signature is stamped onto the printed request form and onto every approval you make, so the app cannot let you past this page without one."
					icon={PenLine}
					status="warning"
					title="No signature on file"
				/>
			) : null}

			{currentSignatureUrl !== null && !hasPick ? (
				<div className="flex flex-col gap-3">
					{/* A white plate regardless of theme: a signature is black ink on
					    paper, and on a dark surface it disappears entirely. */}
					<div className="flex min-h-28 items-center justify-center rounded-xl border border-default-200 bg-white p-4">
						<img
							alt="Your saved signature"
							className="max-h-24 object-contain"
							src={currentSignatureUrl}
						/>
					</div>
					<AppButton
						icon={Trash2}
						isDisabled={isDisabled}
						onPress={handleRemove}
						size="sm"
						variant="tertiary"
					>
						Remove signature
					</AppButton>
				</div>
			) : null}

			<AppFileUpload
				accept={UPLOAD_ACCEPT_ATTRIBUTE}
				description="PNG or JPG, on a clear white background. It is sent when you save."
				isDisabled={isDisabled}
				label={currentSignatureUrl === null ? "Signature" : "Replace signature"}
				maxSizeBytes={UPLOAD_MAX_BYTES}
				onChange={handleChange}
				upload={upload}
				value={files}
			/>

			<Typography
				color="muted"
				type="body-xs"
			>
				Sign on white paper and photograph it straight on. Anything the camera catches around the ink is printed with
				it.
			</Typography>
		</div>
	);
}
