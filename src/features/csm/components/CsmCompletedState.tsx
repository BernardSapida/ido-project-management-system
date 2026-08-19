import { AppButton, AppCard, AppChip, AppRatingSummary, formatAbsolute, toDate } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { CircleCheckBig, FileSignature, Undo2 } from "lucide-react";

interface CsmCompletedStateProps {
	/** What they wrote, or `null`. The comment was always optional. */
	comment: string | null;
	/**
	 * Whose feedback this is, from `getForRequest`.
	 *
	 * It changes only the words, never what is shown: a reviewer reading a record
	 * thanked for feedback they did not give would be reading a page about
	 * somebody else in the second person. Nothing here is a gate - a staff reader
	 * gets this component because `assertCanReadRequest` let them read the request
	 * it hangs off, not because of this flag.
	 */
	isOwner: boolean;
	/** Back to the request. The page owns the destination. */
	onBackToRequest: () => void;
	/** Opens the signed form. Also the page's, so one place knows where it lives. */
	onViewPdf: () => void;
	/** What they gave. `null` on a CSM acknowledged before this spec shipped -
	 *  those rows have a `submittedAt` and no rating, and that is not an error. */
	rating: number | null;
	submittedAt: Date | string;
}

/**
 * What the page shows once the feedback exists - instead of the form, never
 * beside it.
 *
 * ## It thanks them and shows what they gave
 *
 * "Already submitted" would be true and useless. A requestor coming back here is
 * checking one of two things: that their answer landed, and what it was. So the
 * date, the rating and their own words, in that order - and then the two things
 * still worth doing with a completed request.
 *
 * ## `AppRatingSummary`, not a disabled `AppStarRating`
 *
 * The package splits the input from the figure deliberately, and this is the
 * figure: nothing here is focusable and there is nothing to press. A disabled
 * input in its place would still be a control the keyboard stops on and a screen
 * reader announces as a radio group - a form that cannot be filled in rather
 * than a record of one that was.
 *
 * `count={1}` because that is what it is: one person's answer, not an average.
 * The count is what keeps the number honest, so it stays visible.
 */
export function CsmCompletedState({
	comment,
	isOwner,
	onBackToRequest,
	onViewPdf,
	rating,
	submittedAt,
}: CsmCompletedStateProps) {
	const submittedOn = formatAbsolute(toDate(submittedAt));

	return (
		<AppCard
			data-cy="csm-completed"
			description={
				isOwner
					? `You submitted your feedback on ${submittedOn}. This request is complete.`
					: `The requestor submitted this on ${submittedOn}. The request is complete.`
			}
			headingLevel={2}
			icon={CircleCheckBig}
			title={isOwner ? "Thank you for your feedback" : "Satisfaction feedback"}
		>
			<div className="flex flex-col gap-6">
				<AppChip
					data-cy="csm-completed-status"
					icon={CircleCheckBig}
					label="Completed"
					tone="success"
				/>

				{/*
				 * A row created by spec 014 and answered under the old acknowledgement
				 * contract has no rating, and that is a valid record rather than a
				 * missing one - so it says so, instead of drawing zero stars, which is
				 * the one thing a summary must never do with "unrated".
				 */}
				{rating === null ? (
					<Typography
						color="muted"
						data-cy="csm-completed-no-rating"
						type="body-sm"
					>
						This feedback was submitted before the rating was part of the form.
					</Typography>
				) : (
					<AppRatingSummary
						count={1}
						data-cy="csm-completed-rating"
						noun="response"
						showRing={false}
						value={rating}
					/>
				)}

				{comment ? (
					<div className="flex flex-col gap-1">
						<Typography
							color="muted"
							type="body-xs"
						>
							{isOwner ? "What you said" : "What they said"}
						</Typography>

						{/* `whitespace-pre-line` so the paragraphs they typed survive. The
						    column is free text and this is the only place it is read back. */}
						<Typography
							className="whitespace-pre-line"
							data-cy="csm-completed-comment"
							type="body-sm"
						>
							{comment}
						</Typography>
					</div>
				) : null}

				{/* Two ways onward, because a page with nothing to do on it is where a
				    completed request usually strands somebody. The signed form is the
				    thing they came for; the request is where everything else is. Both
				    are right for a reviewer too - the PDF is readable by all five roles
				    that can open the request (spec 016), which is the same five that can
				    reach this page. */}
				<div className="flex flex-col gap-2 sm:flex-row">
					<AppButton
						data-cy="csm-completed-pdf"
						icon={FileSignature}
						onPress={onViewPdf}
						variant="secondary"
					>
						Open the signed form
					</AppButton>

					<AppButton
						data-cy="csm-completed-back"
						icon={Undo2}
						onPress={onBackToRequest}
						variant="tertiary"
					>
						Back to the request
					</AppButton>
				</div>
			</div>
		</AppCard>
	);
}
