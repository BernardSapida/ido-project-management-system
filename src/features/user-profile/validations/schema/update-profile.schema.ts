import { z } from "zod";
import { storedImageUrl } from "@/lib/pending-uploads";

/**
 * What the profile page holds, and what the server will accept.
 *
 * ## Two shapes, and the split between them is the whole point
 *
 * `createProfileDetailsSchema` is the DETAILS FORM's shape — name and position,
 * the two fields the left-hand card owns. The signature is deliberately not in
 * it: it is not a text field, it has its own card and its own Save, and between
 * dropping a file and pressing that Save the value is a `blob:` URL naming bytes
 * that have not moved yet. Validating that as a stored URL would reject the one
 * thing the card exists to collect.
 *
 * `updateProfileInputSchema` is the SERVER's shape, and it is where
 * `storedImageUrl` belongs. By the time a value reaches the router the flush has
 * either run or failed; a `blob:` arriving here means it never ran, and storing
 * it would leave an account whose signature is permanently blank and whose
 * failure is invisible until somebody prints a request form. See the note on
 * `storedImageUrl` in `lib/pending-uploads.ts`.
 *
 * Every field on the server schema except `name` is optional, and the router
 * reads absent as "leave it as it was". That is what lets the two cards save
 * independently: the details card sends no `signatureUrl` and cannot disturb a
 * signature, and the signature card sends no `position` and cannot disturb a
 * designation the user is still editing next to it.
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
const baseDetailsSchema = z.object({
	name: nameField,
	position: z.string().nullish(),
});

export type ProfileDetailsValues = z.infer<typeof baseDetailsSchema>;

/** The details form's schema for `role`. Pass the signed-in user's role. */
export function createProfileDetailsSchema(role?: string): z.ZodType<ProfileDetailsValues, ProfileDetailsValues> {
	if (role !== "USER") return baseDetailsSchema;

	return baseDetailsSchema.extend({
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
 * profile with no signature is exactly what that flag reports. `position` reads
 * the same way.
 */
export const updateProfileInputSchema = z.object({
	name: nameField,
	position: z.string().nullish(),
	signatureUrl: storedImageUrl.nullish(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
