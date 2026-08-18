import { AppAlert, AppButton, AppCard, AppDialog, AppTextArea, formatAbsolute, toDate } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCheck, Lock, PenLine, Wallet, XCircle } from "lucide-react";
import { useState } from "react";
import { useDirectorReviewMutations } from "@/features/director-review/hooks/use-director-review-mutations";
import {
	type DirectorRejectFormValues,
	directorRejectFormSchema,
} from "@/features/director-review/validations/schema/director-approver.schema";
import { useAppForm } from "@/hooks/use-app-form";
import { isDirectorApprovableStatus, isDirectorRejectableStatus } from "@/lib/status-maps/request-status";

interface DirectorActionButtonsProps {
	/** The `APPROVE_DIRECTOR` grant. False disables both controls and says why. */
	canApprove: boolean;
	/** The sub-stage column. `masterStatus` cannot answer this question - it reads
	 *  `UNDER_DIRECTOR_REVIEW` for both approver desks. */
	directorReviewStatus: string | null;
	/** The signature actually stamped, copied onto the request at approval time.
	 *  Not in the spec's prop list, and here for the reason the budget card gives:
	 *  the read-only copy has to show what WAS signed, not what is on the profile
	 *  today. */
	directorSignatureUrl: string | null;
	/** The `directorSignedAt` stamp, or `null`. Also beyond the spec's list - the
	 *  read-only copy has to NAME the day. */
	directorSignedAt: Date | string | null;
	/** Whether the director's own profile carries a signature. A courtesy: without
	 *  one `approveByDirector` refuses server-side regardless. */
	hasSignature: boolean;
	/** Whether the budget officer is still holding this request. Decides both
	 *  whether Reject is offered at all and what the approval dialog says. */
	isBudgetPending: boolean;
	requestId: string;
}

/**
 * What the page says when this stage is over, in the director's own terms.
 *
 * A sentence naming the reason, never an empty card and never two dead buttons.
 * A director reaches this page from a row their own queue put in front of them -
 * `STAFF_QUEUE_SCOPE` deliberately keeps `DIRECTOR_APPROVED` and
 * `DIRECTOR_REJECTED` in scope - so "nothing here" would read as a broken page.
 * IRMS-old printed "No actions available for the current request status" at
 * exactly this moment.
 *
 * The four endings are genuinely different events: the director's own approval,
 * their own rejection, a budget officer who stopped it before it ever reached
 * them, and a request that is not at this stage at all.
 */
function stageEnding(directorReviewStatus: string | null, signedAt: Date | string | null) {
	const signedOn = signedAt ? formatAbsolute(toDate(signedAt)) : null;

	if (directorReviewStatus === "DIRECTOR_REJECTED") {
		return {
			description:
				"The request stopped here and the requestor can see that it did, along with the reason you gave. Nothing in the app re-opens it.",
			icon: XCircle,
			title: "You rejected this request",
		};
	}

	if (signedOn) {
		return {
			description: `You approved it on ${signedOn}, and your signature is stamped on the record. It is with the IDO Chairperson for the final review now. Your next decision on this request is the final approval, and your dashboard will route you there when it reaches you.`,
			icon: ClipboardCheck,
			title: "Already approved by you",
		};
	}

	if (directorReviewStatus === "BUDGET_OFFICER_REJECTED") {
		return {
			description:
				"The budget officer rejected it before it reached you, which is terminal. There was never a decision here for you to take.",
			icon: Wallet,
			title: "The budget officer stopped this request",
		};
	}

	return {
		description:
			"It is not at the director review stage. Either it has not reached the approvers yet, or the desks after you have already finished with it.",
		icon: Lock,
		title: "There is nothing to decide here",
	};
}

/**
 * Approve and Reject, and the asymmetry between them.
 *
 * ## Reject is HIDDEN while the budget stage is open, not disabled
 *
 * `rejectByDirector` accepts exactly `UNDER_DIRECTOR_REVIEW`, while
 * `approveByDirector` also accepts `UNDER_BUDGET_OFFICER_REVIEW`. So while the
 * budget officer holds the request there is an Approve the server will honour
 * and a Reject it will refuse - and a disabled control invites a search for the
 * missing precondition. Here there is nothing the director can do to enable it:
 * they would have to wait for another desk, and if that desk approves, Reject
 * still never appears, because the stage has moved on to them. So it is not
 * rendered at all, and the alert above says why in words rather than leaving a
 * grey button to be interpreted.
 *
 * Both predicates are the same two the server guard reads
 * (`isDirectorApprovableStatus` / `isDirectorRejectableStatus`), so the buttons
 * and the gate cannot disagree about which action is available.
 *
 * ## Approve is the page's one primary, and it is behind a dialog
 *
 * It is the only outcome that moves the request forwards, so it is the only
 * `variant="primary"` on the page. It still asks first: it stamps a signature
 * onto a document that gets printed, and nothing in this app can unstamp one.
 *
 * ## Why both dialogs are an `AppDialog` and not an `AppModal`
 *
 * The spec's component list names both surfaces. The package's contract decides
 * between them: `AppModal` is for something to READ and its only button is
 * Close, `AppDialog` is for something the user DOES "plus the one or two small
 * inputs a decision needs". A rejection reason typed and then confirmed is
 * exactly the second, and a modal here would have nothing to fire the action
 * with. The same call `IdoActionButtons` and `BudgetActionButtons` made.
 */
export function DirectorActionButtons({
	canApprove,
	directorReviewStatus,
	directorSignatureUrl,
	directorSignedAt,
	hasSignature,
	isBudgetPending,
	requestId,
}: DirectorActionButtonsProps) {
	const navigate = useNavigate();
	const [isApproveOpen, setIsApproveOpen] = useState(false);
	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const { approveByDirector, isAnyPending, rejectByDirector } = useDirectorReviewMutations(requestId);

	const canAct = isDirectorApprovableStatus(directorReviewStatus);
	const canReject = isDirectorRejectableStatus(directorReviewStatus);

	if (!canAct) {
		const { description, icon: Icon, title } = stageEnding(directorReviewStatus, directorSignedAt);

		return (
			<AppCard
				data-cy="director-stage-closed"
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
					    the profile. Showing the director's current profile image here would
					    quietly claim that whatever is on their profile today is what this
					    approval carries, which is the one thing the copy-on-approve rule
					    exists to prevent. */}
					{directorSignatureUrl ? (
						<div className="flex flex-col gap-2">
							<Typography
								color="muted"
								type="body-xs"
							>
								The signature stamped on this request
							</Typography>

							{/* A white plate regardless of theme: a signature is black ink on
							    paper and disappears entirely on a dark surface. */}
							<div className="flex min-h-24 items-center justify-center rounded-xl border border-default-200 bg-white p-4">
								<img
									alt="The signature stamped on this request"
									className="max-h-20 object-contain"
									src={directorSignatureUrl}
								/>
							</div>
						</div>
					) : null}
				</div>
			</AppCard>
		);
	}

	return (
		<>
			<AppCard
				data-cy="director-actions"
				description="Approving stamps your signature and sends it to the IDO Chairperson. Both outcomes are final for this stage."
				headingLevel={2}
				title="Your decision"
			>
				<div className="flex flex-col gap-4">
					{/* Why there is no Reject button, said before it is looked for. The
					    request is at a stage the director may approve past but not kill, so
					    this banner is the whole explanation for a card with one control on
					    it. */}
					{isBudgetPending ? (
						<AppAlert
							data-cy="director-budget-pending"
							description="You can approve now — that ends the budget stage without their approval, and they will no longer be able to act. You cannot reject a request that has not reached your stage yet; if you want it stopped, say so in the discussion below."
							icon={Wallet}
							status="warning"
							title="The budget officer has not signed yet"
						/>
					) : null}

					{/* Before the button rather than after the failure. The director is
					    told what is missing and where to fix it while they are still
					    looking at the disabled control, not after pressing it. */}
					{hasSignature ? null : (
						<AppAlert
							action={{ label: "Go to my profile", onPress: () => void navigate({ to: "/profile" }) }}
							data-cy="director-no-signature"
							description="Approving stamps your signature onto the printed form, so the app cannot let you approve without one. Rejecting does not need a signature."
							icon={PenLine}
							status="warning"
							title="No signature on your profile"
						/>
					)}

					<div className="flex flex-col gap-2">
						<AppButton
							data-cy="director-approve"
							fullWidth
							icon={CheckCircle2}
							isDisabled={!canApprove || !hasSignature || isAnyPending}
							onPress={() => setIsApproveOpen(true)}
							variant="primary"
						>
							Approve
						</AppButton>

						{canReject ? (
							<AppButton
								data-cy="director-reject"
								fullWidth
								icon={XCircle}
								isDisabled={!canApprove || isAnyPending}
								onPress={() => setIsRejectOpen(true)}
								variant="danger"
							>
								Reject
							</AppButton>
						) : null}
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
							: "You no longer have permission to act on director approvals. An administrator can restore it."}
					</Typography>
				</div>
			</AppCard>

			<AppDialog
				cancelLabel="Cancel"
				confirmLabel="Approve request"
				data-cy="director-approve-dialog"
				description="Your signature is stamped onto this request and it goes to the IDO Chairperson for the final review. Nothing in the app can undo it."
				icon={CheckCircle2}
				isOpen={isApproveOpen}
				onClose={() => setIsApproveOpen(false)}
				onConfirm={approveByDirector}
				pendingLabel="Approving..."
				title="Approve this request?"
				tone="default"
			>
				{/* The budget state, stated in the dialog as well as on the page. This is
				    the last screen before an irreversible signature, and whether the
				    budget officer has signed is the one fact that changes what this
				    approval MEANS - so it is said here rather than left behind on a card
				    the director has already scrolled past. */}
				<Typography
					color="muted"
					data-cy="director-approve-dialog-budget"
					type="body-sm"
				>
					{isBudgetPending
						? "The budget officer has not signed this request. Approving now ends the budget stage without their approval."
						: "The budget stage is already settled, so this is the last approval before the IDO final review."}
				</Typography>
			</AppDialog>

			<RejectDialog
				isOpen={isRejectOpen}
				onClose={() => setIsRejectOpen(false)}
				onConfirm={rejectByDirector}
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
 * `rejectByDirector` re-parses the same rule.
 *
 * ## Why a rejected confirm must reject
 *
 * `AppDialog` keeps itself open on a rejected promise with what was typed intact
 * and closes only when it resolves. So a failed validation and a failed mutation
 * both have to throw, or the dialog would close over a decision nobody took -
 * taking the note with it.
 */
function RejectDialog({ isOpen, onClose, onConfirm }: RejectDialogProps) {
	const { control, handleSubmit, reset } = useAppForm<DirectorRejectFormValues>(directorRejectFormSchema, {
		defaultValues: { note: "" },
	});

	const handleClose = () => {
		// Cleared on the way out so re-opening is a fresh decision. A reason
		// abandoned twenty minutes ago is not the sentence the director means to
		// send now.
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
			data-cy="director-reject-dialog"
			description="This is final. The request stops at the director stage, the requestor is shown that it stopped, and nothing in the app re-opens it."
			icon={XCircle}
			isOpen={isOpen}
			onClose={handleClose}
			onConfirm={handleConfirm}
			pendingLabel="Rejecting..."
			title="Reject this request?"
			tone="danger"
		>
			<AppTextArea
				control={control}
				data-cy="director-reject-note"
				isRequired
				label="Reason"
				name="note"
				placeholder="Explain the decision — the requestor will read this"
				rows={4}
			/>
		</AppDialog>
	);
}
