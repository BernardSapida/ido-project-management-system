import { z } from "zod";
import { storedImageUrl } from "@/lib/pending-uploads";

/**
 * What the profile form holds, and what the server will accept.
 *
 * ## Two schemas, and the difference between them is the whole point
 *
 * `createUpdateProfileSchema` is the FORM's shape. Its `signatureUrl` is a plain
 * string, because between dropping a file and pressing Save the field
 * legitimately holds a `blob:` URL — the file is parked in the browser and the
 * bytes have not moved yet. A form schema that rejected `blob:` would refuse to
 * submit the one thing this page exists to collect.
 *
 * `updateProfileInputSchema` is the SERVER's shape, and it is where
 * `storedImageUrl` belongs. By the time a value reaches the router the flush has
 * either run or failed; a `blob:` arriving here means it never ran, and storing
 * it would leave an account whose signature is permanently blank and whose
 * failure is invisible until somebody prints a request form. See the note on
 * `storedImageUrl` in `lib/pending-uploads.ts`.
 *
 * ## Why `position` is a role argument rather than a fixed rule
 *
 * A requestor's position prints on the form as their designation, so it is
 * required. Staff have no row on that form — a budget officer signs as the
 * budget officer — so for them it is optional and may stay empty forever. The
 * old app got this wrong by requiring it of everyone, which left staff unable to
 * save a signature they had just uploaded.
 */

const nameField = z.string().min(1, "Full name is required").max(255, "Name is too long");

/*
 * `nullish`, not `optional`. `AppSelect` reports an empty selection as `null`
 * (its `emptyValue`), so a schema that only allowed `string | undefined` would
 * fail a staff member who has never touched the field with "expected string,
 * received null" — a message about types, shown to somebody who did nothing
 * wrong.
 */
const baseProfileSchema = z.object({
	name: nameField,
	position: z.string().nullish(),
	signatureUrl: z.string().nullish(),
});

export type UpdateProfileValues = z.infer<typeof baseProfileSchema>;

/** The form's schema for `role`. Pass the signed-in user's role. */
export function createUpdateProfileSchema(role?: string): z.ZodType<UpdateProfileValues, UpdateProfileValues> {
	if (role !== "USER") return baseProfileSchema;

	return baseProfileSchema.extend({
		position: z
			.string()
			.nullish()
			.refine((value) => Boolean(value && value.length > 0), { message: "Position is required" }),
	});
}

/**
 * What `profile.updateMyProfile` accepts.
 *
 * `signatureUrl` distinguishes three cases and the router relies on all three:
 * absent means "leave it alone", a URL means "this is the new one", and `null`
 * means "remove it" — which flips `profileComplete` back to false, because a
 * profile with no signature is exactly what that flag reports.
 */
export const updateProfileInputSchema = z.object({
	name: nameField,
	position: z.string().nullish(),
	signatureUrl: storedImageUrl.nullish(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
