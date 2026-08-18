import { AppButton, AppInputGroup, AppReadOnlyField, AppTextArea } from "@bernardsapida/web-ui";
import { Card, Typography } from "@heroui/react";
import { CheckCircle2 } from "lucide-react";
import { useIdoReviewMutations } from "@/features/ido-review/hooks/use-ido-review-mutations";
import {
	type IdoApproverFormValues,
	idoApproverFormSchema,
} from "@/features/ido-review/validations/schema/ido-approver.schema";
import { useAppForm } from "@/hooks/use-app-form";

interface IdoApproverPanelProps {
	/** Pre-filled with the requestor's title, so the common case - the title was
	 *  already fine - is one press rather than one retype. */
	defaultValues: { finalTitle: string; note: string; reference: string };
	/** The `REVIEW_REQUEST` grant. False disables Recommend and says why. */
	canReview: boolean;
	/** The request is still at this stage. False renders the panel as a record of
	 *  what was decided rather than as a form. */
	isActionable: boolean;
	requestId: string;
}

/**
 * The recommendation, and the three values it writes.
 *
 * ## It renders read-only rather than disappearing
 *
 * A request past this stage still shows the panel, through `AppReadOnlyField` -
 * the same treatment `RequestForm` gives a submitted request. A panel that
 * vanished once the decision was taken would leave the reviewer who opened the
 * page from their own queue looking at a screen with no sign of what was decided
 * or by whom, which is exactly the "Request is not available for IDO review" dead
 * end IRMS-old logged.
 *
 * ## Recommend is the page's one primary
 *
 * It is the only outcome that moves the request forwards, so it is the only
 * `variant="primary"` on the page; the three that stop it live in their own card
 * beside this one, in `danger-soft` and `tertiary`. That separation is the whole
 * layout decision - see `IdoActionButtons`.
 *
 * ## The seed is a default, not a binding
 *
 * `defaultValues` only, never RHF's `values`. The request refetches on window
 * focus, and a bound form would reset the final title a reviewer was halfway
 * through rewriting the moment a colleague posted a comment on it.
 */
export function IdoApproverPanel({ canReview, defaultValues, isActionable, requestId }: IdoApproverPanelProps) {
	const { isAnyPending, isRecommending, recommend } = useIdoReviewMutations(requestId);

	const { control, handleSubmit } = useAppForm<IdoApproverFormValues>(idoApproverFormSchema, { defaultValues });

	const onRecommend = handleSubmit(async (values) => {
		try {
			await recommend(values);
		} catch {
			// Reported by the hook, which has the server's own message. Swallowed here
			// so react-hook-form's handler does not turn a handled failure into an
			// unhandled rejection.
		}
	});

	if (!isActionable) {
		return (
			<Card>
				<Card.Content className="flex flex-col gap-6 p-6">
					<div className="flex flex-col gap-1">
						<Typography.Heading level={2}>IDO recommendation</Typography.Heading>
						<Typography
							color="muted"
							type="body-sm"
						>
							What was decided at this stage.
						</Typography>
					</div>

					<div className="grid grid-cols-1 gap-6">
						<AppReadOnlyField
							label="Title (Final)"
							value={defaultValues.finalTitle || "—"}
						/>
						<AppReadOnlyField
							label="Reference"
							value={defaultValues.reference || "—"}
						/>
						<AppReadOnlyField
							label="Note"
							value={defaultValues.note || "—"}
						/>
					</div>
				</Card.Content>
			</Card>
		);
	}

	return (
		<Card>
			<Card.Content className="flex flex-col gap-6 p-6">
				<div className="flex flex-col gap-1">
					<Typography.Heading level={2}>Recommend this request</Typography.Heading>
					<Typography
						color="muted"
						type="body-sm"
					>
						Set the title this request will carry from here on, then send it to the next approver.
					</Typography>
				</div>

				{/* A real form so Enter in the Final Title field recommends rather than
				    doing nothing. There is no reversible half of this action to prefer
				    over it - unlike the request form, where Enter saves a draft. */}
				<form
					className="flex flex-col gap-6"
					onSubmit={onRecommend}
				>
					<AppInputGroup
						control={control}
						data-cy="ido-final-title"
						description="Replaces the requestor's title everywhere it is shown and on the printed form. Their original stays on the record."
						isRequired
						label="Title (Final)"
						name="finalTitle"
						placeholder="Enter the final title"
					/>

					<AppInputGroup
						control={control}
						data-cy="ido-reference"
						description="A reference number or document, if this request has one."
						label="Reference"
						name="reference"
						placeholder="Reference number or document"
					/>

					<AppTextArea
						control={control}
						data-cy="ido-note"
						description="Printed as the reason on the IDO block of the form. The requestor can read it."
						label="Note"
						name="note"
						placeholder="Add a note if there is anything to flag"
						rows={4}
					/>

					<div className="flex flex-col gap-2">
						<AppButton
							data-cy="ido-recommend"
							fullWidth
							icon={CheckCircle2}
							isDisabled={!canReview || isAnyPending}
							isPending={isRecommending}
							type="submit"
							variant="primary"
						>
							Recommend
						</AppButton>

						{/* A revoked grant leaves the panel READABLE and says why, rather
						    than removing it. A control that silently vanished reads as a bug
						    in the page; this reads as a thing to go and ask about. */}
						<Typography
							color="muted"
							type="body-xs"
						>
							{canReview
								? "Recommending is final for this stage. There is no undo."
								: "You no longer have permission to review requests. An administrator can restore it."}
						</Typography>
					</div>
				</form>
			</Card.Content>
		</Card>
	);
}
