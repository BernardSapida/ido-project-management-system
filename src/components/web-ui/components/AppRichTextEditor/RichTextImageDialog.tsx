import { Input, InputGroup, Label, TextField } from "@heroui/react";
import { ImagePlus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppButton } from "../AppButton";
import { AppDialog } from "../AppDialog";
import type { UploadHandler } from "../AppFileUpload";
import { ALLOWED_IMAGE_PROTOCOLS } from "./rich-text-document";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, rejectImage, uploadImageFile } from "./rich-text-upload";

interface RichTextImageDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (image: { alt: string; src: string }) => void;
	/** Omit it and the picker never appears - images are then by address only. */
	upload?: UploadHandler;
}

/**
 * Where an image is added.
 *
 * ## Two fields, and both are required
 *
 * The address, and the alt text. Alt is `isRequired` and therefore gates the
 * confirm button with no wiring of its own - `AppDialog` disables it until
 * every required field in its body is answered.
 *
 * That is a deliberate friction. An image with no alt is invisible to a screen
 * reader and to anyone whose connection dropped it, which on a blog post means
 * a paragraph of the argument is silently missing. Making it optional means it
 * is skipped, every time, by everyone. The escape hatch is the decorative
 * checkbox below, which is an explicit statement rather than an omission.
 *
 * ## By URL, not by upload
 *
 * There is nowhere to upload TO - storage and an endpoint are api work this
 * slice does not include. Pasting a base64 image is refused for a separate
 * reason: it would put a megabyte inside the document's JSON column.
 */
export function RichTextImageDialog({ isOpen, onClose, onConfirm, upload }: RichTextImageDialogProps) {
	const [src, setSrc] = useState("");
	const [alt, setAlt] = useState("");
	const [isDecorative, setIsDecorative] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			setSrc("");
			setAlt("");
			setIsDecorative(false);
			setError(null);
			setIsUploading(false);
		}
	}, [isOpen]);

	/**
	 * Sends one file and puts the address it comes back with into the field.
	 *
	 * It fills the SAME field the user could have typed into rather than
	 * bypassing it, so there is one answer to "where is this image" whichever way
	 * it got there - and the alt text is still required either way.
	 */
	const handleFile = async (file: File | undefined) => {
		if (!file || !upload) return;

		const rejection = rejectImage(file);
		if (rejection) {
			setError(rejection.reason);
			return;
		}

		setIsUploading(true);
		setError(null);
		try {
			const url = await uploadImageFile(file, upload, new AbortController().signal);
			setSrc(url);
		} catch (uploadError) {
			setError(uploadError instanceof Error ? uploadError.message : "The upload failed.");
		} finally {
			setIsUploading(false);
		}
	};

	const handleConfirm = () => {
		const address = src.trim();
		if (!isAllowedSrc(address)) {
			setError(`Use an ${ALLOWED_IMAGE_PROTOCOLS.join(" or ")} address.`);
			throw new Error("Invalid image address");
		}
		// Decorative means alt is deliberately EMPTY, which is a real answer and
		// the one thing a screen reader treats as "skip this".
		onConfirm({ alt: isDecorative ? "" : alt.trim(), src: address });
	};

	return (
		<AppDialog
			cancelLabel="Cancel"
			confirmLabel="Add image"
			data-cy="rich-text-image-dialog"
			description="Images are added by address. What the picture shows is stored with it, so a reader who cannot see it still gets the point."
			icon={ImagePlus}
			isOpen={isOpen}
			onClose={onClose}
			onConfirm={handleConfirm}
			title="Add an image"
			tone="accent"
		>
			{/*
			 * THE PICKER ONLY EXISTS WHEN THERE IS SOMEWHERE TO PUT THE FILE. A drop
			 * zone with no handler behind it is a button that fails when pressed,
			 * which is worse than a dialog that only takes an address.
			 */}
			{upload ? (
				<div
					className="rounded-xl border border-border border-dashed p-4 text-center"
					data-cy="image-dropzone"
					onDragOver={(event) => event.preventDefault()}
					onDrop={(event) => {
						event.preventDefault();
						void handleFile(event.dataTransfer.files[0]);
					}}
				>
					<input
						accept={ACCEPTED_IMAGE_TYPES.join(",")}
						className="hidden"
						data-cy="image-file"
						onChange={(event) => void handleFile(event.target.files?.[0])}
						ref={fileInputRef}
						type="file"
					/>
					<AppButton
						icon={Upload}
						isPending={isUploading}
						onPress={() => fileInputRef.current?.click()}
						size="sm"
						variant="secondary"
					>
						{isUploading ? "Uploading…" : "Choose an image"}
					</AppButton>
					<p className="mt-2 text-xs text-muted">
						or drop one here - up to {Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB
					</p>
				</div>
			) : null}

			<TextField
				className="w-full"
				isInvalid={error !== null}
				isRequired
				onChange={(next) => {
					setSrc(next);
					setError(null);
				}}
				value={src}
			>
				<Label>{upload ? "Image address (filled by the upload)" : "Image address"}</Label>
				<InputGroup>
					<InputGroup.Input
						autoComplete="off"
						data-cy="image-src"
						placeholder="https://example.com/photo.jpg"
						spellCheck={false}
					/>
					{src ? (
						<InputGroup.Suffix>
							<AppButton
								aria-label="Clear the address"
								data-cy="image-src-clear"
								icon={X}
								isIconOnly
								onPress={() => {
									setSrc("");
									setError(null);
								}}
								size="sm"
								variant="ghost"
							/>
						</InputGroup.Suffix>
					) : null}
				</InputGroup>
			</TextField>

			{/* Required unless the image is declared decorative, which is what the
			    `isRequired` below is keyed off - the gate follows the statement. */}
			<TextField
				className="w-full"
				isDisabled={isDecorative}
				isRequired={!isDecorative}
				onChange={setAlt}
				value={alt}
			>
				<Label>What the image shows</Label>
				<Input
					autoComplete="off"
					data-cy="image-alt"
					placeholder="A queue of people outside a warehouse at dawn"
				/>
			</TextField>

			<label
				className="flex cursor-pointer items-center gap-2 text-sm text-muted"
				htmlFor="image-decorative"
			>
				<input
					checked={isDecorative}
					className="size-4"
					data-cy="image-decorative"
					id="image-decorative"
					onChange={(event) => setIsDecorative(event.target.checked)}
					type="checkbox"
				/>
				This image is decorative and adds nothing to the text
			</label>

			{error ? (
				<p
					className="text-sm text-danger"
					data-slot="field-error"
				>
					{error}
				</p>
			) : null}
		</AppDialog>
	);
}

function isAllowedSrc(src: string): boolean {
	try {
		const protocol = new URL(src).protocol.replace(":", "");
		return (ALLOWED_IMAGE_PROTOCOLS as readonly string[]).includes(protocol);
	} catch {
		return false;
	}
}
