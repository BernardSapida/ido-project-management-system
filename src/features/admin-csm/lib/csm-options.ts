import type { ChipTone, FilterOption } from "@bernardsapida/web-ui";
import { CircleCheckBig, CircleDashed, type LucideIcon } from "lucide-react";
import { CSM_MAX_RATING } from "@/features/csm/validations/schema/submit-csm.schema";

/**
 * The rating filter, built FROM the scale rather than typed out beside it.
 *
 * `CSM_MAX_RATING` is the one number the stars, the schema and this list all
 * count to. A hand-written five-item array here is the copy that would still say
 * five the day the scale becomes a ten.
 */
export const RATING_FILTER_OPTIONS: FilterOption[] = Array.from({ length: CSM_MAX_RATING }, (_, index) => {
	const star = CSM_MAX_RATING - index;

	return { label: `${star} star${star === 1 ? "" : "s"}`, value: String(star) };
});

/**
 * Answered, or still out.
 *
 * The values match what `adminCsm.list` reads; anything else it ignores, so a
 * hand-edited query string renders an unfiltered table rather than an error.
 */
export const STATUS_FILTER_OPTIONS: FilterOption[] = [
	{ label: "Answered", value: "submitted" },
	{ label: "Awaiting response", value: "awaiting" },
];

/**
 * The chip for a row's state.
 *
 * Two states and no third: `submittedAt` is the flag, never the rating. A record
 * answered before the rating existed is still Answered, and drawing it as
 * anything else would report a real response as a missing one.
 */
export function statusChip(submittedAt: Date | null): { icon: LucideIcon; label: string; tone: ChipTone } {
	return submittedAt
		? { icon: CircleCheckBig, label: "Answered", tone: "success" }
		: { icon: CircleDashed, label: "Awaiting", tone: "default" };
}

/**
 * The colour of a score, and where the line between good and bad sits.
 *
 * Four and five are the office doing its job; three is the middle of a five
 * point scale and reads as neither; one and two are the rows somebody has to
 * look at. Tone follows the MEANING of the number rather than the brand, which
 * is why a low score is `danger` and a high one is not `accent`.
 */
export function ratingTone(rating: number): ChipTone {
	if (rating >= 4) return "success";
	if (rating === 3) return "warning";

	return "danger";
}
