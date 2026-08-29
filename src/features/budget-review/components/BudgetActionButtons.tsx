import { AppAlert, AppButton, AppCard, AppDialog, AppTextArea, formatAbsolute, toDate } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Gavel, Lock, PenLine, XCircle } from "lucide-react";
import { useState } from "react";
import { useBudgetReviewMutations } from "@/features/budget-review/hooks/use-budget-review-mutations";
import {
	type BudgetRejectFormValues,
	budgetRejectFormSchema,
} from "@/features/budget-review/validations/schema/budget-approver.schema";
import { StampedSignature } from "@/features/request-detail/components/StampedSignature";
import { useAppForm } from "@/hooks/use-app-form";
import { isBudgetActionableStatus } from "@/lib/status-maps/request-status";

interface BudgetActionButtonsProps {
	/** The `budgetOfficerSignedAt` stamp, or `null`. Not in the spec's prop list
	 *  and here because the read-only copy has to NAME the day - "already approved
	 *  by you on 3 March" rather than "already approved". */
	budgetOfficerSignedAt: Date | string | null;
	/** The signature that was actually stamped, copied onto the request at approval
	 *  time. NOT the officer's current profile image - see the page. */
	budgetOfficerSignatureUrl: string | null;
	/** The `APPROVE_BUDGET` grant. False disables both controls and says why. */
	canApprove: boolean;
	/** The sub-stage column. `masterStatus` cannot answer this question - it reads
	 *  `UNDER_DIRECTOR_REVIEW` for both approver desks. */
	directorReviewStatus: string | null;
	/** Whether the officer's own profile carries a signature. A courtesy: without
	 *  one `approveBudget` refuses server-side regardless. */
	hasSignature: boolean;
	requestId: string;
}

/**
 * What the page says when the budget stage is over, in the officer's own terms.
 *
 * A sentence naming the reason, never an empty card and never two dead buttons.
 * An officer reaches this page from a row their own queue put in front of them -
 * `STAFF_QUEUE_SCOPE` deliberately keeps their signed work in scope - so "nothing
 * here" would read as a broken page. IRMS-old threw at exactly this moment.
 *
 * The four endings are genuinely different events and each gets its own words:
 * the officer's own approval, their own rejection, a Campus Director who
 * approved past this stage, and a request that never had a budget stage because
 * no budget officer existed when IDO recommended it.
 */
function stageEnding(directorReviewStatus: string | null, signedAt: Date | string | null) {
	const signedOn = signedAt ? formatAbsolute(toDate(signedAt)) : null;

	if (directorReviewStatus === "BUDGET_OFFICER_REJECTED") {
		return {
			description:
				"The request stopped here and the requestor can see that it did, along with the reason you gave. Nothing in the app re-opens it.",
			icon: XCircle,
			title: "You rejected this request",
		};
	}

	if (signedOn) {
		return {
			description: `You approved the budget on ${signedOn}, and your signature is stamped on the record. It is with the Campus Director now.`,
			icon: CheckCircle2,
			title: "Already approved by you",
		};
	}

	/*
	 * A director may approve while this stage is still open - that race is
	 * intended, not a bug, and it ends the budget stage without an approval. There
	 * is no stamp to show, so the copy says who acted rather than what was signed.
	 */
	if (directorReviewStatus === "UNDER_DIRECTOR_REVIEW") {
		return {
			description:
				"The Campus Director has already approved it, which ends the budget stage. Your approval is no longer required and there is nothing left to decide here.",
			icon: Gavel,
			title: "The request has moved past the budget stage",
		};
	}

	return {
		description:
			"It is not at the budget review stage. Either it never was - the routing is decided when IDO recommends, and an account created afterwards does not pull old requests back - or the approvers have already finished with it.",
		icon: Lock,
		title: "There is nothing to decide here",
	};
}

/**
 * Approve and Reject, and the four ways this stage can already be over.
 *
 * ## Approve is the page's one primary, and it is behind a dialog
 *
 * It is the only outcome that moves the request forwards, so it is the only
 * `variant="primary"` on the page. It still asks first: it stamps a signature
 * onto a document that gets printed, and nothing in this app can unstamp one. A
 * bare button for an irreversible signed action is the thing muscle memory
 * reaches for blind.
 *
 * ## Reject is below Approve, never beside it
 *
 * `danger`, because this rejection is genuinely terminal and it is the one
 * destructive outcome the budget desk has - red is a budget spent on destruction
 * only. Stacked rather than in a row so the two never share a horizontal edge,
 * which is where a mis-aimed press lands.
 *
 * ## Why both dialogs are an `AppDialog` and not an `AppModal`
 *
 * The spec's component list names both surfaces. The package's contract is what
 * decides between them: `AppModal` is for something to READ and its only button
 * is Close, `AppDialog` is for something the user DOES "plus the one or two small
 * inputs a decision needs". A rejection reason typed and then confirmed is
 * exactly the second, and a modal here would have nothing to fire the action
 * with. This is the same call `IdoActionButtons` made in spec 010.
 */
export function BudgetActionButtons({
	budgetOfficerSignatureUrl,
	budgetOfficerSignedAt,
	canApprove,
	directorReviewStatus,
	hasSignature,
	requestId,
}: BudgetActionButtonsProps) {
	const navigate = useNavigate();
	const [isApproveOpen, setIsApproveOpen] = useState(false);
	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const { approveBudget, isAnyPending, rejectBudget } = useBudgetReviewMutations(requestId);

	const isActionable = isBudgetActionableStatus(directorReviewStatus);

	if (!isActionable) {
		const { description, icon: Icon, title } = stageEnding(directorReviewStatus, budgetOfficerSignedAt);

		return (
			<AppCard
				data-cy="budget-stage-closed"
				headingLevel={2}
				icon={Icon}
				title={title}
			>
				<div className="flex flex-col gap-4">
					<Typography
						color="muted"
						type="body-sm"
					>
						{description}
					</Typography>

					{/* The signature as it was STAMPED, from the request rather than from
					    the profile. Showing the officer's current profile image here would
					    quietly claim that whatever is on their profile today is what this
					    approval carries, which is the one thing the copy-on-approve rule
					    exists to prevent. */}
					{budgetOfficerSignatureUrl ? (
						<StampedSignature
							data-cy="budget-stamped-signature"
							label="The signature stamped on this request"
							url={budgetOfficerSignatureUrl}
						/>
					) : null}
				</div>
			</AppCard>
		);
	}

	return (
		<>
			<AppCard
				data-cy="budget-actions"
				description="Confirm the request has a PPMP allocation, then approve it. Both outcomes are final for this stage."
				headingLevel={2}
				title="Your decision"
			>
				<div className="flex flex-col gap-4">
					{/* Before the button rather than after the failure. The officer is told
					    what is missing and where to fix it while they are still looking at
					    the disabled control, not after pressing it. */}
					{hasSignature ? null : (
						<AppAlert
							action={{ label: "Go to my profile", onPress: () => void navigate({ to: "/profile" }) }}
							data-cy="budget-no-signature"
							description="Approving stamps your signature onto the printed form, so the app cannot let you approve without one. Rejecting does not need a signature and is still available."
							icon={PenLine}
							status="warning"
							title="No signature on your profile"
						/>
					)}

					<div className="flex flex-col gap-2">
						<AppButton
							data-cy="budget-approve"
							fullWidth
							icon={CheckCircle2}
							isDisabled={!canApprove || !hasSignature || isAnyPending}
							onPress={() => setIsApproveOpen(true)}
							variant="primary"
						>
							Approve
						</AppButton>

						<AppButton
							data-cy="budget-reject"
							fullWidth
							icon={XCircle}
							isDisabled={!canApprove || isAnyPending}
							onPress={() => setIsRejectOpen(true)}
							variant="danger-soft"
						>
							Reject
						</AppButton>
					</div>

					{/* A revoked grant leaves the card READABLE and says why rather than
					    removing it. A control that silently vanished reads as a bug in the
					    page; this reads as a thing to go and ask about. */}
					<Typography
						color="muted"
						type="body-xs"
					>
						{canApprove
							? "Approving stamps your signature and cannot be undone. Rejecting stops the request for good."
							: "You no longer have permission to act on budget approvals. An administrator can restore it."}
					</Typography>
				</div>
			</AppCard>

			<AppDialog
				cancelLabel="Cancel"
				confirmLabel="Approve budget"
				data-cy="budget-approve-dialog"
				description="Your signature is stamped onto this request and it goes to the Campus Director. Nothing in the app can undo it, and the requestor's status does not change - they see Director Review either way."
				icon={CheckCircle2}
				isOpen={isApproveOpen}
				onClose={() => setIsApproveOpen(false)}
				onConfirm={approveBudget}
				pendingLabel="Approving..."
				title="Approve the budget for this request?"
				tone="default"
			>
				<Typography
					color="muted"
					type="body-sm"
				>
					Confirm only if this request has a PPMP allocation. The system records the decision, not the figures.
				</Typography>
			</AppDialog>

			<RejectDialog
				isOpen={isRejectOpen}
				onClose={() => setIsRejectOpen(false)}
				onConfirm={rejectBudget}
			/>
		</>
	);
}

interface RejectDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (note: string) => Promise<void>;
}

/**
 * The rejection, and the reason it requires.
 *
 * ## Two gates on the same empty note, on purpose
 *
 * `isRequired` is read by the dialog's own required-field gate, which holds
 * confirm disabled until the field has something in it - so the ordinary path is
 * a button that will not fire rather than a message to read. The Zod parse on
 * confirm is what reports "Note is required" under the field, and it catches the
 * whitespace-only note the DOM gate cannot see. Neither is the real guard:
 * `rejectBudget` re-parses the same rule.
 *
 * ## Why a rejected confirm must reject
 *
 * `AppDialog` keeps itself open on a rejected promise with what was typed intact
 * and closes only when it resolves. So a failed validation and a failed mutation
 * both have to throw, or the dialog would close over a decision nobody took -
 * taking the note with it.
 */
function RejectDialog({ isOpen, onClose, onConfirm }: RejectDialogProps) {
	const { control, handleSubmit, reset } = useAppForm<BudgetRejectFormValues>(budgetRejectFormSchema, {
		defaultValues: { note: "" },
	});

	const handleClose = () => {
		// Cleared on the way out so re-opening is a fresh decision. A reason
		// abandoned twenty minutes ago is not the sentence the officer means to send
		// now.
		reset({ note: "" });
		onClose();
	};

	const handleConfirm = async () => {
		let submitted = false;

		await handleSubmit(async (values) => {
			submitted = true;

			await onConfirm(values.note);
		})();

		// `handleSubmit` resolves whether or not the schema passed - the field's own
		// error is the report - so the rejection this dialog needs is raised here, or
		// an invalid note would close it having done nothing.
		if (!submitted) throw new Error("Note is required");
	};

	return (
		<AppDialog
			cancelLabel="Cancel"
			confirmLabel="Reject request"
			data-cy="budget-reject-dialog"
			description="This is final. The request stops at the budget stage, the requestor is shown that it stopped, and nothing in the app re-opens it."
			icon={XCircle}
			isOpen={isOpen}
			onClose={handleClose}
			onConfirm={handleConfirm}
			pendingLabel="Rejecting..."
			title="Reject this request?"
			tone="danger"
		>
			<AppTextArea
				// TODO(web-ui@1.0.0): maxLength is now required - set a real budget for this field.
				control={control}
				data-cy="budget-reject-note"
				isRequired
				label="Reason"
				maxLength={2000}
				name="note"
				placeholder="Explain the budget decision - the requestor will read this"
				rows={4}
			/>
		</AppDialog>
	);
}
