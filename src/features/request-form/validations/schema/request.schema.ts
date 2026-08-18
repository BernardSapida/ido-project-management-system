import { z } from "zod";
import {
	JUSTIFICATION_VALUES,
	POSITION_VALUES,
	PRIORITY_VALUES,
	TYPE_OF_REQUEST_VALUES,
} from "@/features/request-form/lib/request-options";
import { storedImageUrl } from "@/lib/pending-uploads";

/**
 * What the request form holds, and what the server will accept.
 *
 * ## Two attachment shapes, and the difference between them is the whole point
 *
 * `formAttachmentSchema` is the DROP ZONE's row - `AppFileUpload`'s own
 * `UploadedFile`, id and size and all - and its `url` is a plain string, because
 * between dropping a file and pressing Save that field legitimately holds a
 * `blob:` URL. The bytes have not moved yet. A form schema that rejected `blob:`
 * would refuse to submit the one thing the field exists to collect.
 *
 * `attachmentSchema` is what is STORED, and it is where `storedImageUrl`
 * belongs. By the time a value reaches the router the flush has either run or
 * failed; a `blob:` arriving here means it never ran, and storing it would leave
 * a request whose attachment is permanently dead and whose failure is invisible
 * until a reviewer clicks it. See the note on `storedImageUrl` in
 * `lib/pending-uploads.ts`.
 *
 * It is also narrower on purpose: `{ name, url }` and nothing else. `id`, `size`
 * and `type` are the browser's bookkeeping for a list of rows, they are not
 * facts about the request, and the printed form has room for a filename.
 *
 * ## Why the three option fields are enums rather than strings
 *
 * `typeOfRequest` prints as a ticked checkbox on the PDF (spec 016), which can
 * only tick a box it knows about - so a seventh value would print as a form with
 * nothing ticked at all. `priority` and `justification` are the same closed
 * lists rendered by a select. Gating them here means a crafted payload cannot
 * put free text into a column the printed form has a fixed row for.
 */

export const attachmentSchema = z.object({
	name: z.string().min(1),
	url: storedImageUrl,
});

export type Attachment = z.infer<typeof attachmentSchema>;

/**
 * One row of `AppFileUpload`'s value, as the form carries it.
 *
 * Structurally a `UploadedFile`, so the field binds to the drop zone without a
 * translation layer in between. `url` is required here where the component
 * declares it optional: the component only ever emits rows whose upload
 * SUCCEEDED, and our deferred handler always resolves with the object URL it
 * parked - a row with no URL is not something to store, it is a row still on
 * screen with a Retry button under it.
 */
export const formAttachmentSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	size: z.number().int().nonnegative(),
	type: z.string(),
	url: z.string().min(1),
});

export type FormAttachment = z.infer<typeof formAttachmentSchema>;

export const requestFormSchema = z.object({
	title: z.string().min(1, "Title is required").max(255),
	typeOfRequest: z.enum(TYPE_OF_REQUEST_VALUES, { message: "Type of request is required" }),
	priority: z.enum(PRIORITY_VALUES, { message: "Priority is required" }),
	requestedBy: z.string().min(1, "Requested by is required").max(255),
	position: z.enum(POSITION_VALUES, { message: "Position is required" }),
	/*
	 * Constants, not choices. Both are printed on the paper form and neither has
	 * ever had a second possible value, so they are carried here to keep the
	 * form's shape the same shape as the record - and stripped before the payload
	 * is sent, because the server writes them itself. See `createRequestSchema`.
	 */
	targetOrg: z.literal("IDO"),
	responsibleOrg: z.literal("IDO"),
	details: z.string().min(1, "Details are required"),
	justification: z.enum(JUSTIFICATION_VALUES, { message: "Justification is required" }),
	workScope: z.string().min(1, "Work scope is required"),
	attachments: z.array(formAttachmentSchema),
});

export type RequestFormValues = z.infer<typeof requestFormSchema>;

/**
 * What `request.create` accepts.
 *
 * The two org fields are omitted rather than accepted-and-ignored: a field the
 * server overwrites but still parses is one somebody eventually reads back out
 * of the input by mistake. `attachments` is REPLACED with the stored shape,
 * which is what puts `storedImageUrl` on the server side of the boundary.
 *
 * `requestedBy` and `position` survive the omit and are then overwritten from
 * the session anyway - see the router. They are here because the form shows them
 * and the input mirrors the form; they are advisory, and the server treats them
 * as such.
 */
export const createRequestSchema = requestFormSchema
	.omit({ targetOrg: true, responsibleOrg: true })
	.extend({ attachments: z.array(attachmentSchema) });

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const saveDraftRequestSchema = createRequestSchema.extend({ id: z.string().min(1) });

export type SaveDraftRequestInput = z.infer<typeof saveDraftRequestSchema>;

export const submitRequestSchema = z.object({ id: z.string().min(1) });

export type SubmitRequestInput = z.infer<typeof submitRequestSchema>;

/**
 * The form's values as the API wants them: org fields dropped, attachments
 * flattened to what is stored.
 *
 * One function rather than a spread at each call site, because there are three
 * of them (create, save draft, and the save half of submit) and the failure of
 * getting it wrong is silent - an extra key is accepted by Zod's default strip
 * and then never written.
 */
export function toRequestInput(values: RequestFormValues): CreateRequestInput {
	const { targetOrg: _targetOrg, responsibleOrg: _responsibleOrg, attachments, ...rest } = values;

	return { ...rest, attachments: attachments.map(({ name, url }) => ({ name, url })) };
}

/**
 * The other direction: the `attachments` Json column as the form carries it.
 *
 * `size` comes back `0` and `type` empty, and neither is a placeholder waiting
 * to be filled in - they are the browser's bookkeeping for a list of rows being
 * dropped, and the stored shape deliberately keeps `{ name, url }` alone (see
 * the note on `attachmentSchema` above). `AttachmentUploader`'s read-only list
 * prints no size for `0`, so nothing on screen claims a file is empty.
 *
 * A row that does not parse is DROPPED rather than thrown on. The column is
 * `Json`, so nothing in the database enforces its shape, and a single malformed
 * row must not take the whole request's page down with it.
 */
export function toFormAttachments(stored: unknown): FormAttachment[] {
	if (!Array.isArray(stored)) return [];

	return stored.flatMap((row, index) => {
		const parsed = attachmentSchema.safeParse(row);

		if (!parsed.success) return [];

		// The URL is the identity - it is what the read-only list opens - and the
		// index disambiguates the same file attached twice, which `AppList` needs
		// for its keys.
		return [{ id: `${index}-${parsed.data.url}`, name: parsed.data.name, size: 0, type: "", url: parsed.data.url }];
	});
}
