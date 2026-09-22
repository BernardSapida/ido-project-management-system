import { formatBytes } from "../../internal";
import { Label } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
	ArrowDownToLine,
	Check,
	CircleCheck,
	CloudUpload,
	FileArchive,
	FileAudio,
	FileCode,
	File as FileGlyph,
	FileImage,
	FileSpreadsheet,
	FileText,
	FileVideo,
	Maximize2,
	Presentation,
	RotateCcw,
	Trash2,
	TriangleAlert,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { AppButton } from "../AppButton";
import { AppModal } from "../AppModal";
import { AppProgressBar } from "../AppProgressBar";
import { AppToast, reason } from "../AppToaster";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

/**
 * A file field that tells the truth while it works.
 *
 * The five things it refuses to do, because each one is a support ticket:
 *   - Show a spinner. Percent, transfer rate and time remaining let a user decide
 *     to wait or walk away; a spinner only says "still alive".
 *   - Make a failed upload start over. The `File` stays in memory, so Retry is one
 *     press and never reopens the file picker.
 *   - Let one file take the others down. Every file has its own request, its own
 *     progress bar and its own Retry - ten files, ten lanes.
 *   - Confirm a removal. Remove fires immediately and the toast carries Undo,
 *     which costs nothing when the press was deliberate.
 *   - Echo a filename as proof. Images get a thumbnail and a full-screen view,
 *     everything else a Drive-style type glyph, plus size and type on every row.
 *
 * The field value is always `UploadedFile[]`, single-file mode included - one
 * shape for the resolver, and `multiple={false}` simply caps the list at one and
 * replaces on the next pick. Make it required with `z.array(...).min(1)`.
 *
 * `upload` is the caller's. It is the only part that talks to a server, which is
 * what keeps this component testable and the demo page honest - see `xhrUpload`
 * for the real one.
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UploadedFile {
	id: string;
	name: string;
	size: number;
	type: string;
	/** Where the file ended up. Whatever the upload handler resolved with. */
	url?: string;
}

export interface UploadContext {
	/** Call on every chunk with the running byte total, not a percentage. */
	onProgress: (loadedBytes: number) => void;
	/** Aborts when the user removes the row mid-flight. */
	signal: AbortSignal;
}

export interface UploadResult {
	/** Where the file now lives. Omit it and the row simply has no preview source. */
	url?: string;
}

/** Resolve with `{}` when the server returns nothing worth keeping. */
export type UploadHandler = (file: File, context: UploadContext) => Promise<UploadResult>;

/**
 * The production uploader.
 *
 * `fetch` still cannot report upload progress in any browser, so an honest
 * percentage means `XMLHttpRequest`. Reaching for `fetch` here is what turns a
 * progress bar back into a spinner.
 */
export function xhrUpload(endpoint: string, fieldName = "file"): UploadHandler {
	return (file, { onProgress, signal }) =>
		new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();
			const body = new FormData();
			body.append(fieldName, file);

			request.upload.addEventListener("progress", (event) => {
				if (event.lengthComputable) {
					onProgress(event.loaded);
				}
			});
			request.addEventListener("load", () => {
				if (request.status >= 200 && request.status < 300) {
					try {
						const payload: unknown = JSON.parse(request.responseText);
						resolve(payload && typeof payload === "object" ? (payload as UploadResult) : {});
					} catch {
						// A 2xx with a non-JSON body is still a success; there is just no URL.
						resolve({});
					}
					return;
				}
				reject(new Error(`Upload rejected by the server (${request.status})`));
			});
			request.addEventListener("error", () => reject(new Error("Connection lost")));
			request.addEventListener("timeout", () => reject(new Error("The upload timed out")));
			signal.addEventListener("abort", () => request.abort());

			request.open("POST", endpoint);
			request.send(body);
		});
}

// ─── File kinds ───────────────────────────────────────────────────────────────

interface FileKind {
	Icon: LucideIcon;
	label: string;
	/**
	 * Drive-style hues. A glyph has no filename to read, so colour IS the type,
	 * which is why these are conventional rather than the brand - the same
	 * argument the status rails make.
	 *
	 * A class from styles.css, not a Tailwind literal. They used to be raw palette
	 * pairs at the 50 and 600 steps, and a 50-step background is a near-white
	 * wash: on a dark card every file chip lit up as a white block. The library
	 * carries no dark-variant classes anywhere, so the house answer is a flat
	 * opaque pair with a `.dark` override, which is what the chip tones already
	 * do. (Naming the old classes here would be enough to make Tailwind emit them
	 * again - it scans comments too.)
	 */
	tint: string;
}

const KIND_PDF: FileKind = { Icon: FileText, label: "PDF", tint: "file-kind-pdf" };
const KIND_DOC: FileKind = { Icon: FileText, label: "Document", tint: "file-kind-doc" };
const KIND_SHEET: FileKind = { Icon: FileSpreadsheet, label: "Spreadsheet", tint: "file-kind-sheet" };
const KIND_SLIDES: FileKind = { Icon: Presentation, label: "Presentation", tint: "file-kind-slides" };
const KIND_IMAGE: FileKind = { Icon: FileImage, label: "Image", tint: "file-kind-image" };
const KIND_VIDEO: FileKind = { Icon: FileVideo, label: "Video", tint: "file-kind-video" };
const KIND_AUDIO: FileKind = { Icon: FileAudio, label: "Audio", tint: "file-kind-audio" };
const KIND_ARCHIVE: FileKind = { Icon: FileArchive, label: "Archive", tint: "file-kind-archive" };
const KIND_CODE: FileKind = { Icon: FileCode, label: "Code", tint: "file-kind-generic" };
const KIND_TEXT: FileKind = { Icon: FileText, label: "Text", tint: "file-kind-generic" };
const KIND_GENERIC: FileKind = { Icon: FileGlyph, label: "File", tint: "file-kind-generic" };

const KINDS_BY_EXTENSION: Record<string, FileKind> = {
	"7z": KIND_ARCHIVE,
	avif: KIND_IMAGE,
	bmp: KIND_IMAGE,
	css: KIND_CODE,
	csv: KIND_SHEET,
	doc: KIND_DOC,
	docx: KIND_DOC,
	gif: KIND_IMAGE,
	gz: KIND_ARCHIVE,
	heic: KIND_IMAGE,
	html: KIND_CODE,
	jpeg: KIND_IMAGE,
	jpg: KIND_IMAGE,
	json: KIND_CODE,
	md: KIND_TEXT,
	mp3: KIND_AUDIO,
	mp4: KIND_VIDEO,
	pdf: KIND_PDF,
	png: KIND_IMAGE,
	ppt: KIND_SLIDES,
	pptx: KIND_SLIDES,
	rar: KIND_ARCHIVE,
	rtf: KIND_DOC,
	svg: KIND_IMAGE,
	tar: KIND_ARCHIVE,
	ts: KIND_CODE,
	tsx: KIND_CODE,
	txt: KIND_TEXT,
	wav: KIND_AUDIO,
	webm: KIND_VIDEO,
	webp: KIND_IMAGE,
	xls: KIND_SHEET,
	xlsx: KIND_SHEET,
	zip: KIND_ARCHIVE,
};

function extensionOf(name: string) {
	const dot = name.lastIndexOf(".");
	return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/**
 * Extension first, MIME second. The extension is what the user sees in their file
 * browser, and a server that hands back `application/octet-stream` for a .docx
 * should not turn a Word icon into a blank page.
 */
function fileKindOf(name: string, type: string): FileKind {
	const byExtension = KINDS_BY_EXTENSION[extensionOf(name)];
	if (byExtension) {
		return byExtension;
	}
	if (type.startsWith("image/")) {
		return KIND_IMAGE;
	}
	if (type.startsWith("video/")) {
		return KIND_VIDEO;
	}
	if (type.startsWith("audio/")) {
		return KIND_AUDIO;
	}
	if (type.startsWith("text/")) {
		return KIND_TEXT;
	}
	return KIND_GENERIC;
}

/** `2.4 MB · PNG` beats `2.4 MB · image/png` on a row that is already narrow. */
function typeLabelOf(item: UploadItem) {
	const extension = extensionOf(item.name);
	return extension ? extension.toUpperCase() : fileKindOf(item.name, item.type).label;
}

// ─── Internal state ───────────────────────────────────────────────────────────

type UploadStatus = "uploading" | "done" | "error";

interface UploadItem {
	error?: string;
	/** Kept so Retry never sends the user back to the file picker. */
	file: File | null;
	id: string;
	/** Rejected before it was ever sent - too large, wrong type, over the count. */
	isRejected: boolean;
	loaded: number;
	name: string;
	previewUrl?: string;
	size: number;
	startedAt: number;
	status: UploadStatus;
	type: string;
	url?: string;
}

function toItem(value: UploadedFile): UploadItem {
	return {
		file: null,
		id: value.id,
		isRejected: false,
		loaded: value.size,
		name: value.name,
		size: value.size,
		startedAt: 0,
		status: "done",
		type: value.type,
		url: value.url,
	};
}

function toValue(item: UploadItem): UploadedFile {
	return { id: item.id, name: item.name, size: item.size, type: item.type, url: item.url };
}

function previewSrcOf(item: UploadItem) {
	if (item.previewUrl) {
		return item.previewUrl;
	}
	return item.type.startsWith("image/") ? item.url : undefined;
}

function percentOf(item: UploadItem) {
	return item.size > 0 ? Math.min(100, Math.round((item.loaded / item.size) * 100)) : 0;
}

/** `4s`, `1m 20s`, and a hedge for the first tick when the rate is still noise. */
function formatDuration(seconds: number) {
	if (!Number.isFinite(seconds) || seconds <= 1) {
		return "a moment";
	}
	if (seconds < 60) {
		return `${Math.ceil(seconds)}s`;
	}
	return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
}

/**
 * Time remaining and transfer rate, derived from what has actually arrived. Until
 * half a second of evidence exists the estimate would swing wildly, so it says
 * "Starting…" instead of inventing a number.
 */
function transferDetailOf(item: UploadItem) {
	const elapsedSeconds = (Date.now() - item.startedAt) / 1000;
	if (elapsedSeconds < 0.5 || item.loaded <= 0) {
		return "Starting…";
	}
	const bytesPerSecond = item.loaded / elapsedSeconds;
	const remaining = (item.size - item.loaded) / bytesPerSecond;
	return `${formatDuration(remaining)} left · ${formatBytes(bytesPerSecond)}/s`;
}

// ─── Accept matching ──────────────────────────────────────────────────────────

function matchesAccept(file: File, accept?: string) {
	const patterns = (accept ?? "")
		.split(",")
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean);
	if (patterns.length === 0) {
		return true;
	}
	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();
	return patterns.some((pattern) => {
		if (pattern.startsWith(".")) {
			return name.endsWith(pattern);
		}
		if (pattern.endsWith("/*")) {
			return type.startsWith(pattern.slice(0, -1));
		}
		return type === pattern;
	});
}

/**
 * `image/*,.pdf` reads as `Images, PDF` - the rule stated the way it is enforced.
 *
 * `limit` exists for the hint under the drop zone, where an eleven-entry accept
 * list is a wall of shouting nobody reads. The rejection message passes no limit:
 * that is the one moment the full list is worth the space.
 */
function describeAccept(accept: string, limit = Number.POSITIVE_INFINITY) {
	const named = accept
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => {
			if (entry.endsWith("/*")) {
				const family = entry.slice(0, -2);
				return `${family.charAt(0).toUpperCase()}${family.slice(1)}s`;
			}
			return (entry.startsWith(".") ? entry.slice(1) : (entry.split("/").pop() ?? entry)).toUpperCase();
		});

	if (named.length <= limit) {
		return named.join(", ");
	}
	return `${named.slice(0, limit).join(", ")} and ${named.length - limit} more`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AppFileUploadBaseProps {
	accept?: string;
	className?: string;
	"data-cy"?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	label: string;
	/** Ignored unless `multiple` - single-file mode is always a cap of one. */
	maxFiles?: number;
	maxSizeBytes?: number;
	/** Default `false`: one file, and the next pick replaces it. */
	multiple?: boolean;
	/** Sends one file and reports its byte progress. See `xhrUpload`. */
	upload: UploadHandler;
}

type AppFileUploadProps<T extends FieldValues> = AppFileUploadBaseProps & FieldBindingProps<UploadedFile[], T>;

export function AppFileUpload<T extends FieldValues>({
	accept,
	className,
	"data-cy": dataCy,
	description,
	isDisabled,
	isRequired,
	label,
	maxFiles,
	maxSizeBytes,
	multiple = false,
	upload,
	...binding
}: AppFileUploadProps<T>) {
	return (
		<FieldBinding
			binding={binding}
			emptyValue={NO_FILES}
		>
			{(field) => (
				<FileUploadField
					accept={accept}
					className={className}
					data-cy={dataCy}
					description={description}
					field={field}
					isDisabled={isDisabled}
					isRequired={isRequired}
					label={label}
					maxFiles={maxFiles}
					maxSizeBytes={maxSizeBytes}
					multiple={multiple}
					upload={upload}
				/>
			)}
		</FieldBinding>
	);
}

/** Hoisted so the empty case is one identity, not a new array every render. */
const NO_FILES: UploadedFile[] = [];

function FileUploadField({
	accept,
	className,
	"data-cy": dataCy,
	description,
	field,
	isDisabled,
	isRequired,
	label,
	maxFiles,
	maxSizeBytes,
	multiple = false,
	upload,
}: AppFileUploadBaseProps & { field: BoundField<UploadedFile[]> }) {
	const invalid = field.isInvalid;
	const error = field.errorMessage ? { message: field.errorMessage } : undefined;

	const [items, setItems] = useState<UploadItem[]>(() =>
		(Array.isArray(field.value) ? (field.value as UploadedFile[]) : []).map(toItem),
	);
	const [isDragging, setIsDragging] = useState(false);
	const [previewing, setPreviewing] = useState<UploadItem | null>(null);

	const labelId = useId();
	const promptId = useId();
	const describedById = useId();

	const inputRef = useRef<HTMLInputElement>(null);
	const dropZoneRef = useRef<HTMLButtonElement>(null);
	const controllersRef = useRef(new Map<string, AbortController>());
	const itemsRef = useRef(items);
	const uploadRef = useRef(upload);
	const onChangeRef = useRef(field.onChange);
	const onBlurRef = useRef(field.onBlur);
	const objectUrlsRef = useRef<string[]>([]);
	/** The last value we pushed into the form, so a value we did not push stands out. */
	const lastEmittedRef = useRef<UploadedFile[]>(Array.isArray(field.value) ? (field.value as UploadedFile[]) : []);
	/** dragenter/dragleave fire for every child, so the state is a depth, not a flag. */
	const dragDepthRef = useRef(0);
	const hasMountedRef = useRef(false);

	useEffect(() => {
		itemsRef.current = items;
		uploadRef.current = upload;
		onChangeRef.current = field.onChange;
		onBlurRef.current = field.onBlur;
	});

	// Only the finished uploads reach the resolver. A row that is still in flight
	// or has failed is visible to the user but is not yet a value of this field.
	useEffect(() => {
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			return;
		}
		const emitted = items.filter((item) => item.status === "done").map(toValue);
		lastEmittedRef.current = emitted;
		onChangeRef.current(emitted);

		/*
		 * Mark the field touched only once the rows have SETTLED, and only when
		 * there are rows at all. Both halves of that condition are load-bearing:
		 *
		 *   items.length === 0   `reset()` empties the list and re-runs this
		 *                        effect, so marking touched here would put
		 *                        "Attach a profile photo" under a field the user
		 *                        has not been near since the form was cleared.
		 *   still uploading      the error would sit above a file that is
		 *                        visibly at 60%, saying nothing is attached.
		 *
		 * What is left is the moment worth reporting: everything has finished, so
		 * either a file landed (and the error clears) or all of them failed (and
		 * it correctly stays). A settled upload is a final answer - there is no
		 * half-typed state to protect - which is why it does not wait for a real
		 * blur, the same reasoning as the toggles.
		 */
		const hasSettled = items.length > 0 && !items.some((item) => item.status === "uploading");
		if (hasSettled) {
			onBlurRef.current();
		}
	}, [items]);

	// The form can also write to this field - `reset()` is the everyday case, and
	// leaving the rows on screen after one would show files that are no longer
	// attached to anything. Anything that is not the value we just emitted wins.
	useEffect(() => {
		const value = Array.isArray(field.value) ? (field.value as UploadedFile[]) : [];
		const emitted = lastEmittedRef.current;
		if (emitted.length === value.length && emitted.every((file, index) => file.id === value[index]?.id)) {
			return;
		}
		lastEmittedRef.current = value;
		const keptIds = new Set(value.map((file) => file.id));
		for (const [id, controller] of controllersRef.current) {
			if (!keptIds.has(id)) {
				controller.abort();
				controllersRef.current.delete(id);
			}
		}
		setItems(value.map(toItem));
	}, [field.value]);

	useEffect(() => {
		const controllers = controllersRef.current;
		const objectUrls = objectUrlsRef.current;
		return () => {
			for (const controller of controllers.values()) {
				controller.abort();
			}
			// Object URLs outlive removal on purpose: Undo has to be able to put the
			// thumbnail back. Unmount is the one point where nothing can need them.
			for (const url of objectUrls) {
				URL.revokeObjectURL(url);
			}
		};
	}, []);

	// A file dropped anywhere but a zone makes the browser navigate to it, taking
	// every unsaved field in the form along - and this field sits at the bottom of
	// a long scroll, so a miss by twenty pixels is the likely case, not the freak
	// one. Nothing else on the page wants a file drop, so the window swallows the
	// ones that miss and shows a "no" cursor while they are in the air.
	useEffect(() => {
		const isOverAZone = (event: DragEvent) =>
			event.target instanceof Element && event.target.closest("[data-drop-zone]") !== null;

		const onDragOver = (event: DragEvent) => {
			if (isOverAZone(event)) {
				return;
			}
			event.preventDefault();
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "none";
			}
		};
		const onDrop = (event: DragEvent) => {
			if (!isOverAZone(event)) {
				event.preventDefault();
			}
		};

		window.addEventListener("dragover", onDragOver);
		window.addEventListener("drop", onDrop);
		return () => {
			window.removeEventListener("dragover", onDragOver);
			window.removeEventListener("drop", onDrop);
		};
	}, []);

	const fileCap = multiple ? (maxFiles ?? Number.POSITIVE_INFINITY) : 1;

	function runUpload(id: string, file: File) {
		const controller = new AbortController();
		controllersRef.current.set(id, controller);

		setItems((previous) =>
			previous.map((item) =>
				item.id === id ? { ...item, error: undefined, loaded: 0, startedAt: Date.now(), status: "uploading" } : item,
			),
		);

		uploadRef
			.current(file, {
				onProgress: (loadedBytes) =>
					setItems((previous) =>
						previous.map((item) => (item.id === id ? { ...item, loaded: Math.min(loadedBytes, item.size) } : item)),
					),
				signal: controller.signal,
			})
			.then((result) => {
				setItems((previous) =>
					previous.map((item) =>
						item.id === id ? { ...item, loaded: item.size, status: "done", url: result?.url } : item,
					),
				);
			})
			.catch((cause: unknown) => {
				// An abort means the row was removed - there is nothing left to mark failed.
				if (controller.signal.aborted) {
					return;
				}
				setItems((previous) =>
					previous.map((item) =>
						item.id === id ? { ...item, error: reason(cause, "Upload failed"), status: "error" } : item,
					),
				);
			})
			.finally(() => {
				controllersRef.current.delete(id);
			});
	}

	function rejectionFor(file: File, remainingSlots: number) {
		if (remainingSlots <= 0) {
			return multiple
				? `Over the limit of ${fileCap} file${fileCap === 1 ? "" : "s"}`
				: "Only one file can be attached here";
		}
		if (!matchesAccept(file, accept)) {
			return `${describeAccept(accept ?? "")} only`;
		}
		if (maxSizeBytes && file.size > maxSizeBytes) {
			return `Too large - ${formatBytes(file.size)} against a ${formatBytes(maxSizeBytes)} limit`;
		}
		return null;
	}

	function buildItem(file: File, rejection: string | null): UploadItem {
		const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
		if (previewUrl) {
			objectUrlsRef.current.push(previewUrl);
		}
		return {
			error: rejection ?? undefined,
			file,
			id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
			isRejected: rejection !== null,
			loaded: 0,
			name: file.name,
			previewUrl,
			size: file.size,
			startedAt: Date.now(),
			status: rejection ? "error" : "uploading",
			type: file.type,
		};
	}

	function addFiles(picked: File[]) {
		if (isDisabled || picked.length === 0) {
			return;
		}

		// Single-file mode replaces: the row on screen is the answer to the field, and
		// two rows under a "one file" label is a lie about what will be submitted.
		const kept = multiple ? itemsRef.current : [];
		if (!multiple) {
			for (const item of itemsRef.current) {
				controllersRef.current.get(item.id)?.abort();
				controllersRef.current.delete(item.id);
			}
		}

		let remainingSlots = fileCap - kept.filter((item) => !item.isRejected).length;
		const added = picked.map((file) => {
			const rejection = rejectionFor(file, remainingSlots);
			if (!rejection) {
				remainingSlots -= 1;
			}
			return buildItem(file, rejection);
		});

		setItems([...kept, ...added]);
		for (const item of added) {
			if (!item.isRejected && item.file) {
				runUpload(item.id, item.file);
			}
		}
	}

	function restore(item: UploadItem) {
		setItems((previous) => (previous.some((row) => row.id === item.id) ? previous : [...previous, item]));
		// A finished upload is still on the server; only an interrupted one is resent.
		let isResent = false;
		if (item.status !== "done" && item.file && !item.isRejected) {
			runUpload(item.id, item.file);
			isResent = true;
		}

		// Undo dismisses the toast it was pressed in - that is AppToast's doing, not
		// this call site's - which leaves the reversal unacknowledged unless this
		// says so. The row reappearing at the bottom of a long list is not an answer
		// on a screen that has scrolled, and a re-sent file is a second thing that
		// happened and that the row alone does not explain.
		AppToast.success(`Restored ${item.name}`, {
			description: isResent ? "It is attached again and uploading." : "It is attached to this form again.",
			icon: RotateCcw,
		});
	}

	function removeItem(id: string) {
		const removed = itemsRef.current.find((item) => item.id === id);
		if (!removed) {
			return;
		}
		controllersRef.current.get(id)?.abort();
		controllersRef.current.delete(id);
		setItems((previous) => previous.filter((item) => item.id !== id));

		// The button that was just pressed is about to unmount. Without this, focus
		// lands on <body> and a keyboard user restarts from the top of the form on
		// the one interaction they are most likely to repeat.
		requestAnimationFrame(() => dropZoneRef.current?.focus());

		AppToast.warning(`Removed ${removed.name}`, {
			action: removed.isRejected ? undefined : { label: "Undo", onPress: () => restore(removed) },
			description: removed.isRejected
				? "It was never attached - it failed the file rules."
				: "It is no longer attached to this form.",
			icon: Trash2,
		});
	}

	function retryItem(id: string) {
		const item = itemsRef.current.find((row) => row.id === id);
		if (item?.file) {
			runUpload(item.id, item.file);
		}
	}

	const doneCount = items.filter((item) => item.status === "done").length;
	const failedItems = items.filter((item) => item.status === "error" && !item.isRejected && item.file);
	const uploadingCount = items.filter((item) => item.status === "uploading").length;
	// A row that was never sent holds no slot - five rejected files must not lock
	// the field, which is exactly the trap a plain `items.length` cap falls into.
	const attachedCount = items.filter((item) => !item.isRejected).length;
	const isAllUploaded = attachedCount > 0 && doneCount === attachedCount;

	// A full multi-file field is closed rather than silently rejecting the next
	// pick: a click that can only produce an error message is a dead end.
	// Single-file mode never closes - clicking it replaces, which is the point.
	const isZoneClosed = Boolean(isDisabled) || (multiple && attachedCount >= fileCap);

	const promptCopy = isDragging
		? "Release to upload"
		: isZoneClosed
			? isDisabled
				? "Uploads are unavailable"
				: `${attachedCount} of ${fileCap} files - remove one to add another`
			: multiple
				? attachedCount > 0
					? "Drop more files here, or click to browse"
					: "Drop files here, or click to browse"
				: attachedCount > 0
					? "Drop a new file here to replace it"
					: "Drop a file here, or click to browse";

	const hint = useMemo(() => {
		const parts: string[] = [];
		if (accept) {
			parts.push(describeAccept(accept, 4));
		}
		if (maxSizeBytes) {
			parts.push(`up to ${formatBytes(maxSizeBytes)} each`);
		}
		if (multiple && maxFiles) {
			parts.push(`${maxFiles} files max`);
		}
		return parts.join(" · ");
	}, [accept, maxFiles, maxSizeBytes, multiple]);

	const liveSummary =
		items.length === 0
			? "No files attached"
			: `${doneCount} of ${attachedCount} uploaded, ${uploadingCount} in progress, ${
					attachedCount - doneCount - uploadingCount
				} failed, ${items.length - attachedCount} rejected`;

	return (
		<div
			className={cn("flex w-full flex-col gap-2", className)}
			data-cy={dataCy}
		>
			{/* A `span`, not a `label`: the real control is the drop zone below, and the
			    file input it drives is hidden. `aria-labelledby` does the binding. */}
			<Label
				elementType="span"
				id={labelId}
				isDisabled={isDisabled}
				isInvalid={invalid}
				isRequired={isRequired}
			>
				{label}
				{/* `isRequired` only draws a CSS asterisk, and `aria-required` is invalid
				    on a button role - so the word goes into the accessible name, which is
				    built from this label. */}
				{isRequired && <span className="sr-only"> (required)</span>}
			</Label>

			{/* Three drag signals, and none of them is colour alone - the accent and
			    its danger red are the same hue, so a red fill on its own would read as
			    "this field is wrong". The border goes from dashed to solid, the glyph
			    changes and fills, and the copy changes. */}
			<button
				aria-describedby={describedById}
				aria-labelledby={`${labelId} ${promptId}`}
				className={cn(
					// `rounded-lg` rather than the scale's 2xl: --radius is 1rem, so
					// the larger steps turn a panel this size into a pill.
					"group flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 px-6 py-7 text-center",
					// 100ms, not 150: the pointer is already sitting on the control, and
					// anything slower reads as lag rather than as response.
					"transition-[color,background-color,border-color,box-shadow] duration-100",
					"outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
					isDragging
						? "border-solid border-accent bg-accent-soft/25 shadow-[0_0_0_4px_color-mix(in_oklch,var(--color-accent)_18%,transparent)]"
						: "border-dashed border-border bg-surface hover:border-accent hover:bg-accent-soft/15",
					invalid && !isDragging && "border-danger bg-danger-soft/25",
					isZoneClosed && "cursor-not-allowed border-dashed border-border bg-muted-surface/40 hover:border-border",
				)}
				data-cy={dataCy ? `${dataCy}-dropzone` : undefined}
				data-drop-zone=""
				disabled={isZoneClosed}
				/* The drop zone is this field's only focusable element, so it is
				   the only thing that can mark the field touched. Without it a
				   required upload stays silent under `mode: "onBlur"` until the
				   form is submitted. */
				onBlur={field.onBlur}
				onClick={() => inputRef.current?.click()}
				onDragEnter={(event) => {
					event.preventDefault();
					if (isZoneClosed) {
						return;
					}
					dragDepthRef.current += 1;
					setIsDragging(true);
				}}
				onDragLeave={(event) => {
					event.preventDefault();
					dragDepthRef.current -= 1;
					if (dragDepthRef.current <= 0) {
						dragDepthRef.current = 0;
						setIsDragging(false);
					}
				}}
				onDragOver={(event) => {
					// Without this the browser opens the file instead of handing it over.
					event.preventDefault();
					event.dataTransfer.dropEffect = "copy";
				}}
				onDrop={(event) => {
					event.preventDefault();
					dragDepthRef.current = 0;
					setIsDragging(false);
					addFiles(Array.from(event.dataTransfer.files));
				}}
				ref={dropZoneRef}
				type="button"
			>
				{/* The idle disc is a pale tint, and the zone's hover fill is the same
				    family - so on hover the disc flips to the surface colour instead,
				    or it vanishes into the background it is supposed to sit on. */}
				<span
					className={cn(
						"flex size-11 items-center justify-center rounded-full transition-all duration-100",
						isDragging
							? "scale-110 bg-accent text-accent-foreground"
							: "bg-muted-surface text-muted group-hover:bg-surface group-hover:text-accent group-hover:shadow-sm",
						isZoneClosed && "bg-muted-surface text-muted group-hover:bg-muted-surface group-hover:text-muted",
					)}
				>
					{/* The cloud invites; the arrow-to-line says "let go, it lands here". */}
					{isDragging ? <ArrowDownToLine className="size-5" /> : <CloudUpload className="size-5" />}
				</span>
				<span
					className="text-sm font-medium text-text-primary"
					id={promptId}
				>
					{promptCopy}
				</span>
				{hint && !isZoneClosed && <span className="text-xs text-muted">{hint}</span>}
			</button>

			<input
				accept={accept}
				className="hidden"
				disabled={isDisabled}
				multiple={multiple}
				onChange={(event) => {
					addFiles(Array.from(event.target.files ?? []));
					// Clearing it means removing a file and picking the same one again
					// still fires a change event.
					event.target.value = "";
				}}
				ref={inputRef}
				tabIndex={-1}
				type="file"
			/>

			<div
				className="empty:hidden"
				id={describedById}
			>
				{description && <p className="text-xs text-muted">{description}</p>}
				{/* Not a HeroUI <FieldError> - there is no Field context here - but it
				    carries the same data-slot so anything looking for "this field's
				    error message" finds it in the same place as every other field. */}
				{invalid && error?.message && (
					<p
						className="text-xs text-danger"
						data-slot="field-error"
					>
						{error.message}
					</p>
				)}
			</div>

			{/* Progress is a number on a bar; a screen reader gets the same story here.
			    `output` carries role="status" natively. */}
			<output
				aria-live="polite"
				className="sr-only"
			>
				{liveSummary}
			</output>

			{items.length > 0 && (
				<>
					{multiple && (
						// The hint and the description above are both small grey lines, so a
						// third one 4px below them read as more of the same paragraph rather
						// than as the heading of the list underneath. It gets the space, the
						// weight on its numbers, and a colour of its own once it is finished.
						<div className="mt-3 flex items-center justify-between gap-3">
							{/* The denominator counts files that were actually sent. Including
							    rejected rows made the counter read as "still pending" when
							    nothing was in flight, and it could never reach n of n. */}
							<p
								className={cn(
									"flex items-center gap-1.5 text-xs",
									isAllUploaded ? "text-success-soft-foreground" : "text-muted",
								)}
							>
								{isAllUploaded && <CircleCheck className="size-3.5 shrink-0" />}
								<span>
									<span className={cn("font-semibold tabular-nums", !isAllUploaded && "text-text-primary")}>
										{doneCount} of {attachedCount}
									</span>{" "}
									uploaded
									{items.length > attachedCount && ` · ${items.length - attachedCount} rejected`}
								</span>
							</p>
							{failedItems.length > 1 && (
								<AppButton
									icon={RotateCcw}
									onPress={() => {
										for (const item of failedItems) {
											retryItem(item.id);
										}
									}}
									size="sm"
									variant="ghost"
								>
									Retry all {failedItems.length}
								</AppButton>
							)}
						</div>
					)}

					<ul className="flex flex-col gap-2">
						{items.map((item) => (
							<FileRow
								isDisabled={isDisabled}
								item={item}
								key={item.id}
								onPreview={() => setPreviewing(item)}
								onRemove={() => removeItem(item.id)}
								onRetry={() => retryItem(item.id)}
							/>
						))}
					</ul>
				</>
			)}

			<AppModal
				hideFooter
				isOpen={previewing !== null}
				onClose={() => setPreviewing(null)}
				size="full"
				title={previewing?.name ?? ""}
			>
				{previewing && (
					<div className="flex flex-col items-center gap-3">
						{/*
						 * A fixed box the image is CONTAINED in, rather than a max-*
						 * cap on the image itself: a cap only ever shrinks, so a
						 * screenshot smaller than the frame sat at its natural size
						 * in the middle of a full-screen modal. object-contain keeps
						 * the aspect ratio, so the box scales it up as well as down
						 * and never crops.
						 */}
						<img
							alt={previewing.name}
							className="h-[70dvh] w-full rounded-lg object-contain"
							src={previewSrcOf(previewing)}
						/>
						<p className="text-xs text-muted">
							{formatBytes(previewing.size)} · {typeLabelOf(previewing)}
						</p>
					</div>
				)}
			</AppModal>
		</div>
	);
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface FileRowProps {
	/** A disabled field must not still let its files be deleted. */
	isDisabled?: boolean;
	item: UploadItem;
	onPreview: () => void;
	onRemove: () => void;
	onRetry: () => void;
}

function FileRow({ isDisabled, item, onPreview, onRemove, onRetry }: FileRowProps) {
	const kind = fileKindOf(item.name, item.type);
	const KindIcon = kind.Icon;
	const previewSrc = previewSrcOf(item);
	const percent = percentOf(item);
	const isFailed = item.status === "error";
	const canRetry = isFailed && !item.isRejected && item.file !== null;

	return (
		<li
			className={cn(
				"rounded-lg border p-3",
				isFailed ? "border-danger/40 bg-danger-soft/30" : "border-border bg-surface",
			)}
			data-status={item.isRejected ? "rejected" : item.status}
		>
			<div className="flex items-start gap-3">
				{/* The tile is the row's status light. A word at the end of the title
				    line meant the "it worked" mark sat in a different column on every
				    row - present on some, replaced by a percentage on others - and the
				    eye had nothing to run down. Here it is always the same 20px in the
				    same corner, so a list of ten is read in one pass.

				    Failure deliberately gets no badge: the row already carries a red
				    border, a red fill, a red message and a Retry button, and a fifth
				    red mark would only make the first four quieter. */}
				<div className="relative shrink-0">
					{previewSrc ? (
						// The thumbnail has to look pressable or nobody presses it - the
						// magnifier only appears on hover, the ring on keyboard focus.
						<button
							aria-label={`View ${item.name} full screen`}
							className="group relative block size-16 cursor-pointer overflow-hidden rounded-md border border-border outline-none focus-visible:ring-2 focus-visible:ring-accent"
							onClick={onPreview}
							type="button"
						>
							<img
								alt=""
								className="size-full object-cover"
								src={previewSrc}
							/>
							<span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
								<Maximize2 className="size-4 text-white" />
							</span>
						</button>
					) : (
						<span className={cn("flex size-16 items-center justify-center rounded-md", kind.tint)}>
							<KindIcon className="size-7" />
						</span>
					)}

					{item.status === "done" && (
						// The ring is the row surface, not white - it is what lets the disc
						// overhang the tile's corner and still read as one object.
						<span className="absolute -right-1.5 -bottom-1.5 flex size-5 items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-surface">
							<Check
								className="size-3"
								strokeWidth={3}
							/>
							{/* The tick is the whole message on screen; it still has to be a
							    word to anything that cannot see it. */}
							<span className="sr-only">Uploaded</span>
						</span>
					)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-baseline justify-between gap-3">
						<p
							className="truncate text-sm font-medium text-text-primary"
							title={item.name}
						>
							{item.name}
						</p>
						{item.status === "uploading" && (
							<span className="shrink-0 text-sm font-semibold tabular-nums text-accent">{percent}%</span>
						)}
					</div>

					{/* Size and type on every row - a filename alone is not proof we got
					    the right file. */}
					<p className="mt-0.5 truncate text-xs text-muted">
						{formatBytes(item.size)} · {typeLabelOf(item)}
						{item.status === "uploading" && ` · ${transferDetailOf(item)}`}
					</p>

					{item.status === "uploading" && (
						<AppProgressBar
							className="mt-2"
							color="accent"
							isLabelHidden
							label={`Uploading ${item.name}`}
							size="sm"
							value={percent}
						/>
					)}

					{/* The failure first, then the consolation. Reversed, the row reassured
					    the user before telling them what it was reassuring them about. */}
					{isFailed && (
						<p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
							<TriangleAlert className="size-3.5 shrink-0" />
							{item.error}
						</p>
					)}

					{/* A failed upload keeps its bar. Seeing it stopped at 90% is what makes
					    "the file is still loaded" believable, and Retry cheap to press. The
					    note stays muted so three red things are not competing in one box. */}
					{isFailed && !item.isRejected && percent > 0 && (
						<>
							<AppProgressBar
								className="mt-2"
								color="danger"
								isLabelHidden
								label={`${item.name} paused at ${percent} percent`}
								size="sm"
								value={percent}
							/>
							<p className="mt-1 text-xs text-muted">
								Paused at {percent}% - the file is still loaded, so Retry resumes
							</p>
						</>
					)}
				</div>

				<div className="flex shrink-0 items-center gap-1">
					{canRetry && (
						<AppButton
							icon={RotateCcw}
							isDisabled={isDisabled}
							onPress={onRetry}
							size="sm"
							variant="secondary"
						>
							Retry
						</AppButton>
					)}
					{/* Ghost button, red glyph: ten filled danger pills would spend the
					    whole red budget on a list nobody came here to delete from. */}
					<AppButton
						aria-label={`Remove ${item.name}`}
						className="text-danger"
						icon={Trash2}
						isDisabled={isDisabled}
						isIconOnly
						onPress={onRemove}
						size="sm"
						variant="ghost"
					/>
				</div>
			</div>
		</li>
	);
}
