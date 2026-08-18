import { AppCard, AppInputGroup, AppReadOnlyField } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import type { Control } from "react-hook-form";
import type { IdoFinalApproveFormValues } from "@/features/ido-final-review/validations/schema/ido-final-approver.schema";

interface IdoFinalApproverFormProps {
	/**
	 * The form the PAGE owns. The spec asks for `value` + `onChange`; this is the
	 * same lift with the project's binding, per `CLAUDE.md` - every field is
	 * `control` + `name`, and the reason it matters here is `.max(255)`, which has
	 * to be reported under the field rather than discovered by the server. The
	 * page still holds the value, which is the requirement the spec's edge case
	 * actually names: the action button has to be able to read it.
	 */
	control: Control<IdoFinalApproveFormValues>;
	/** What the request carries today - set by IDO at the first review, and what
	 *  an empty override keeps. */
	currentFinalTitle: string | null;
	/** The stage is over. The override disappears and only the signed title
	 *  remains, because there is nothing left to change. */
	isReadOnly: boolean;
}

/**
 * The title this request will be signed off under.
 *
 * ## Why the current title and the override sit together
 *
 * They are one decision - "is this still right?" - and split across two screens
 * it becomes two. The chairperson reads the current value, and the field
 * directly beneath it is the only thing they may change at this stage. The
 * helper text says what an empty field does, because "leave it empty to keep the
 * current title" is not a convention anybody can infer from an empty box.
 *
 * ## Why it is seeded EMPTY rather than with the current title
 *
 * `IdoApproverPanel` at the first review does the opposite: it pre-fills, because
 * there the field is required and the common case is accepting the requestor's
 * wording with one press. Here the field is an OVERRIDE and the common case is
 * changing nothing - so a pre-filled box would have the chairperson delete a
 * value to mean "leave it alone", which is exactly the gesture that blanks a
 * title. Empty means untouched, at both ends of the wire.
 *
 * ## Why the form is not bound to the query
 *
 * `defaultValues` only, never RHF's `values`. The request refetches on window
 * focus, and a bound form would wipe a title the chairperson was halfway through
 * rewriting the moment a colleague posted a comment on it.
 */
export function IdoFinalApproverForm({ control, currentFinalTitle, isReadOnly }: IdoFinalApproverFormProps) {
	return (
		<AppCard
			data-cy="ido-final-approver-form"
			description={
				isReadOnly
					? "The title this request was signed off under."
					: "The only thing this stage may change. Everything else is fixed once a request leaves the requestor."
			}
			headingLevel={2}
			title="Final title"
		>
			<div className="flex flex-col gap-6">
				<AppReadOnlyField
					data-cy="ido-final-current-title"
					description="Set by IDO at the first review. It is what the printed form carries."
					label={isReadOnly ? "Title (Final)" : "Current title"}
					value={currentFinalTitle || "—"}
				/>

				{isReadOnly ? null : (
					<>
						<AppInputGroup
							control={control}
							data-cy="ido-final-title-override"
							description="Leave this empty to keep the current title. Anything typed here replaces it everywhere, including on the printed form."
							label="Override the final title"
							name="finalTitle"
							placeholder="Leave empty to keep the current title"
						/>

						{/* The requestor's own title is never touched by any of this, and a
						    chairperson about to rename something for the second time deserves
						    to know which of the two strings they are looking at. */}
						<Typography
							color="muted"
							type="body-xs"
						>
							The requestor's original title stays on the record either way — this is a second field, not a correction
							of theirs.
						</Typography>
					</>
				)}
			</div>
		</AppCard>
	);
}
