import { AppButton, AppCard, AppStarRating, AppTextArea } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { Send } from "lucide-react";
import { type Control, useController } from "react-hook-form";
import { useUserCsmMutations } from "@/features/csm/hooks/use-user-csm-mutations";
import {
	CSM_COMMENT_MAX_LENGTH,
	type CsmFormValues,
	csmFormSchema,
} from "@/features/csm/validations/schema/submit-csm.schema";
import { useAppForm } from "@/hooks/use-app-form";

interface CsmFormProps {
	/** The `SUBMIT_CSM` grant, from `getForRequest`. False disables the button and says
	 *  why rather than removing it - `submitCsm` refuses regardless. */
	canSubmit: boolean;
	/** Where to go once the request is complete. The page owns the destination. */
	onSuccess: () => void;
	requestId: string;
}

/**
 * The satisfaction form: one required rating, one optional comment, one button.
 *
 * ## The copy says what the button DOES before it is pressed
 *
 * Submitting is what marks the request complete, and it can only be done once.
 * That sentence is on the card and again under the button rather than in a
 * confirmation dialog - there is nothing destructive here to confirm, and a
 * dialog between a requestor and the last thing they were asked for would be
 * friction charged to everybody for a consequence that is entirely good.
 *
 * ## Why there is no dirty-guard and no draft
 *
 * Two answers, one of them optional, and the whole thing takes a minute. A page
 * that saved a half-filled satisfaction form would be keeping state nobody would
 * ever come back for.
 */
export function CsmForm({ canSubmit, onSuccess, requestId }: CsmFormProps) {
	const { isSubmitting, submitCsm } = useUserCsmMutations(requestId);

	const { control, handleSubmit } = useAppForm<CsmFormValues>(csmFormSchema, {
		// `0` is the control's unrated value, and it is what the schema's `min(1)`
		// refuses. A `null` default would be a second way to spell "no answer" that
		// the stars cannot render.
		defaultValues: { comment: "", rating: 0 },
	});

	const onSubmit = async (values: CsmFormValues) => {
		try {
			await submitCsm(values);
		} catch {
			// Reported by the hook's toast, and deliberately swallowed HERE: the
			// throw's job was to stop `onSuccess` firing over a submit that never
			// committed. Left to propagate it would become an unhandled rejection
			// out of RHF's own submit handler.
			return;
		}

		onSuccess();
	};

	return (
		<AppCard
			description="Your answer is recorded against this request and completes it. It can only be submitted once."
			headingLevel={2}
			title="How did we do?"
		>
			<form
				className="flex flex-col gap-8"
				onSubmit={handleSubmit(onSubmit)}
			>
				<RatingField control={control} />

				<AppTextArea
					// TODO(web-ui@1.0.0): maxLength is now required - set a real budget for this field.
					control={control}
					data-cy="csm-comment"
					description={`Optional. Up to ${CSM_COMMENT_MAX_LENGTH} characters.`}
					label="Anything you would like to add?"
					maxLength={2000}
					name="comment"
					placeholder="What went well, and what could have gone better?"
					rows={4}
				/>

				<div className="flex flex-col gap-2">
					<AppButton
						data-cy="csm-submit"
						fullWidth
						icon={Send}
						isDisabled={!canSubmit || isSubmitting}
						isPending={isSubmitting}
						size="lg"
						type="submit"
						variant="primary"
					>
						{isSubmitting ? "Submitting..." : "Submit Feedback"}
					</AppButton>

					{/* A revoked grant leaves the form readable and says why. A control
					    that silently vanished reads as a broken page; this reads as a
					    thing to go and ask somebody about. */}
					<Typography
						color="muted"
						type="body-xs"
					>
						{canSubmit
							? "Submitting marks this request complete. The signed form stays available afterwards."
							: "You no longer have permission to submit feedback. An administrator can restore it."}
					</Typography>
				</div>
			</form>
		</AppCard>
	);
}

/**
 * The rating, bound to react-hook-form.
 *
 * `AppStarRating` is a `value`/`onChange` control rather than one of the
 * package's two-mode bound fields, so the binding has to be made here - and it
 * has to be a binding rather than a `useState`, or the required-rating rule
 * would never see a value and the form would submit an unanswered satisfaction
 * form as a valid one. `useController` is what makes the stars a real field:
 * `formState.errors.rating` exists because of it.
 *
 * The message under it is written by hand for the same reason, and it is a plain
 * paragraph rather than HeroUI's `ErrorMessage` or `FieldError`: both read their
 * state from a react-aria Field context, and there is no field here to give them
 * one - the form-reference lab records that exact trap, where the component
 * rendered nothing at all and the error was invisible on every failed submit.
 * `role="alert"` is what announces it, since the stars cannot point at it.
 * This is the one hand-rolled error on the page; every bound field still renders
 * its own, and adding a second would be the drift that rule exists to stop.
 *
 * `size="lg"` is the spec's UX rule about a phone made concrete: this is the
 * first thing on the page and the one thing that has to be pressable with a
 * thumb.
 */
function RatingField({ control }: { control: Control<CsmFormValues> }) {
	const {
		field,
		fieldState: { error },
	} = useController({ control, name: "rating" });

	return (
		<div className="flex flex-col gap-2">
			<AppStarRating
				data-cy="csm-rating"
				description="One star is poor, five is excellent."
				label="How satisfied are you with how this request was handled?"
				onChange={field.onChange}
				size="lg"
				value={field.value}
			/>

			{error ? (
				<p
					className="text-danger text-sm"
					data-cy="csm-rating-error"
					role="alert"
				>
					{error.message}
				</p>
			) : null}
		</div>
	);
}
