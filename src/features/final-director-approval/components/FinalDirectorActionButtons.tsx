import { AppAlert, AppButton, AppCard, AppDialog, AppTextArea, formatAbsolute, toDate } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { CircleCheckBig, FileSignature, Lock, PenLine, XCircle } from "lucide-react";
import { useState } from "react";
import { useFinalDirectorApprovalMutations } from "@/features/final-director-approval/hooks/use-final-director-approval-mutations";
import {
	type FinalDirectorRejectFormValues,
	finalDirectorRejectFormSchema,
} from "@/features/final-director-approval/validations/schema/final-director-approver.schema";
import { StampedSignature } from "@/features/request-detail/components/StampedSignature";
import { useAppForm } from "@/hooks/use-app-form";
import { isFinalDirectorActionableStatus } from "@/lib/status-maps/request-status";

interface FinalDirectorActionButtonsProps {
	/** The `APPROVE_DIRECTOR` grant. False disables both controls and says why.
	 *  One grant covers BOTH of the director's stages. */
	canApprove: boolean;
	/** The signature actually stamped by this approval, copied onto the request.
	 *  Beyond the spec's prop list, and the read-only state is unreadable without
	 *  it - the spec's own UX rule asks the finished page to show the signature
	 *  and offer the PDF. */
	finalDirectorSignatureUrl: string | null;
	/** The `finalDirectorSignedAt` stamp, or `null`. Also beyond the list: the
	 *  read-only copy has to NAME the day. */
	finalDirectorSignedAt: Date | string | null;
	/** This stage's own column - the only thing that tells the director's final
	 *  approval from their first one. `masterStatus` cannot: it reads
	 *  `UNDER_FINAL_DIRECTOR_REVIEW` here and `APPROVED` afterwards, and neither
	 *  says which of their two decisions produced it. */
	finalDirectorStatus: string | null;
	/** Whether the director's own profile carries a signature. A courtesy: without
	 *  one `finalDirectorApprove` refuses server-side regardless. */
	hasSignature: boolean;
	/** Opens the finished document. Passed in so the page owns the one place that
	 *  knows where the PDF lives. */
	onViewPdf: () => void;
	requestId: string;
}

/**
 * What the page says when this stage is over, in the director's own terms.
 *
 * A sentence naming the reason, never an empty card and never two dead buttons.
 * A director reaches this page from a row their own queue put in front of them -
 * `STAFF_QUEUE_SCOPE` deliberately keeps `APPROVED` and `FINAL_REJECTED` in
 * scope - so "nothing here" would read as a broken page.
 *
 * The three endings are different events: their own final approval, their own
 * rejection, and a request that has not reached this stage at all - which on
 * this page means the IDO Chairperson has not signed yet, since
 * `finalDirectorStatus` is written by THEIR approval and by nothing else.
 */
function stageEnding(finalDirectorStatus: string | null, signedAt: Date | string | null) {
	const signedOn = signedAt ? formatAbsolute(toDate(signedAt)) : null;

	if (finalDirectorStatus === "FINAL_REJECTED") {
		return {
			description:
				"The request stopped here, after passing every other desk. The requestor can see that it stopped and read the reason you gave, and nothing in the app re-opens it.",
			icon: XCircle,
			title: "You rejected this request",
		};
	}

	if (finalDirectorStatus === "APPROVED") {
		return {
			description: signedOn
				? `You gave the final approval on ${signedOn}. The request is complete, the signed form is released, and the requestor has been asked for their feedback.`
				: "You gave the final approval. The request is complete, the signed form is released, and the requestor has been asked for their feedback.",
			icon: CircleCheckBig,
			title: "This request is approved",
		};
	}

	return {
		description:
			"It is not at the final approval stage. This stage opens when the IDO Chairperson signs off, so a request still sitting with them will not be actionable here yet.",
		icon: Lock,
		title: "There is nothing to decide here",
	};
}

/**
 * Approve & Sign, and Reject.
 *
 * ## "Approve & Sign", not "Approve"
 *
 * The label names the irreversible half, the same call spec 013 made - and here
 * the signature does more than get stamped: it is the gate that releases the
 * other three onto the printed form. A button reading "Approve" would describe
 * the routine part of an act whose consequence is the other part.
 *
 * ## The dialog names all THREE consequences
 *
 * Approved, signed form released, feedback requested. This is the least
 * reversible action in the system - six columns, a row in another table and a
 * document published - and the one thing a confirmation must not do is let a
 * director find out afterwards what else their approval did. It is the spec's
 * own UX rule, and it is why this dialog carries a list rather than a sentence.
 *
 * ## Reject is visually secondary and always asks for a reason
 *
 * `variant="danger"` under the one primary, behind a dialog with a required
 * note. Nothing at this stage is recoverable, and the note is the whole of what
 * a requestor gets after four desks said yes.
 *
 * ## Why both dialogs are an `AppDialog` and not an `AppModal`
 *
 * The spec's component list names both. The package's contract decides between
 * them: `AppModal` is for something to READ and its only button is Close,
 * `AppDialog` is for something the user DOES "plus the one or two small inputs a
 * decision needs". The same call specs 010 to 013 made.
 */
export function FinalDirectorActionButtons({
	canApprove,
	finalDirectorSignatureUrl,
	finalDirectorSignedAt,
	finalDirectorStatus,
	hasSignature,
	onViewPdf,
	requestId,
}: FinalDirectorActionButtonsProps) {
	const navigate = useNavigate();
	const [isApproveOpen, setIsApproveOpen] = useState(false);
	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const { finalDirectorApprove, finalDirectorReject, isAnyPending } = useFinalDirectorApprovalMutations(requestId);

	const isActionable = isFinalDirectorActionableStatus(finalDirectorStatus);

	if (!isActionable) {
		const { description, icon: Icon, title } = stageEnding(finalDirectorStatus, finalDirectorSignedAt);
		const isApproved = finalDirectorStatus === "APPROVED";

		return (
			<AppCard
				data-cy="final-director-stage-closed"
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
					    the profile - the copy-on-approve rule the four approval stages
					    share. */}
					{finalDirectorSignatureUrl ? (
						<StampedSignature
							data-cy="final-director-stamped-signature"
							label="The signature stamped on this request"
							url={finalDirectorSignatureUrl}
						/>
					) : null}

					{/* The PDF offered a second time, here rather than only in the header.
					    This card is what a director reads when they come back to an
					    approved request, and the finished document is the only thing left
					    to do with it - a panel that said "complete" and then offered
					    nothing would be the dead action panel the spec's UX rule names. */}
					{isApproved ? (
						<AppButton
							data-cy="final-director-closed-pdf"
							fullWidth
							icon={FileSignature}
							onPress={onViewPdf}
							variant="secondary"
						>
							Open the signed form
						</AppButton>
					) : null}
				</div>
			</AppCard>
		);
	}

	return (
		<>
			<AppCard
				data-cy="final-director-actions"
				description="This is the last approval. Both outcomes end the request for good."
				headingLevel={2}
				title="Your decision"
			>
				<div className="flex flex-col gap-4">
					{/* Before the button rather than after the failure. The director is
					    told what is missing and where to fix it while they are still
					    looking at the disabled control, not after pressing it. */}
					{hasSignature ? null : (
						<AppAlert
							action={{ label: "Go to my profile", onPress: () => void navigate({ to: "/profile" }) }}
							data-cy="final-director-no-signature"
							description="Your signature is what releases the signed form, so the app cannot let you approve without one. Rejecting does not need a signature."
							icon={PenLine}
							status="warning"
							title="No signature on your profile"
						/>
					)}

					<div className="flex flex-col gap-2">
						<AppButton
							data-cy="final-director-approve"
							fullWidth
							icon={FileSignature}
							isDisabled={!canApprove || !hasSignature || isAnyPending}
							onPress={() => setIsApproveOpen(true)}
							variant="primary"
						>
							Approve &amp; Sign
						</AppButton>

						<AppButton
							data-cy="final-director-reject"
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
							? "Signing cannot be undone. Rejecting stops the request for good."
							: "You no longer have permission to act on director approvals. An administrator can restore it."}
					</Typography>
				</div>
			</AppCard>

			<AppDialog
				cancelLabel="Cancel"
				confirmLabel="Approve & Sign"
				data-cy="final-director-approve-dialog"
				description="This is the last approval in the workflow and nothing in the app can undo it."
				icon={FileSignature}
				isOpen={isApproveOpen}
				onClose={() => setIsApproveOpen(false)}
				onConfirm={finalDirectorApprove}
				pendingLabel="Signing..."
				title="Give the final approval?"
				tone="default"
			>
				{/* The three consequences, as a list rather than a paragraph. They are
				    three separate things that happen to three different people, and a
				    sentence joining them with commas is one a director skims. */}
				<div className="flex flex-col gap-2">
					<Typography
						color="muted"
						type="body-xs"
					>
						Confirming does three things
					</Typography>

					<ul
						className="flex list-disc flex-col gap-1 pl-5"
						data-cy="final-director-approve-dialog-consequences"
					>
						<li>
							<Typography type="body-sm">The request becomes approved and the work can go ahead.</Typography>
						</li>

						<li>
							<Typography type="body-sm">
								Your signature is stamped, and the signed form is released with all four signatures on it.
							</Typography>
						</li>

						<li>
							<Typography type="body-sm">The requestor is asked to fill in the satisfaction form.</Typography>
						</li>
					</ul>
				</div>
			</AppDialog>

			<RejectDialog
				isOpen={isRejectOpen}
				onClose={() => setIsRejectOpen(false)}
				onConfirm={finalDirectorReject}
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
 * `finalDirectorReject` re-parses the same rule.
 *
 * ## Why a rejected confirm must reject
 *
 * `AppDialog` keeps itself open on a rejected promise with what was typed intact
 * and closes only when it resolves. So a failed validation and a failed mutation
 * both have to throw, or the dialog would close over a decision nobody took -
 * taking the note with it.
 */
function RejectDialog({ isOpen, onClose, onConfirm }: RejectDialogProps) {
	const { control, handleSubmit, reset } = useAppForm<FinalDirectorRejectFormValues>(finalDirectorRejectFormSchema, {
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
			data-cy="final-director-reject-dialog"
			description="This is final. The request stops at the last approval after passing every other desk, the requestor is shown that it stopped, and nothing in the app re-opens it."
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
				data-cy="final-director-reject-note"
				isRequired
				label="Reason"
				name="note"
				placeholder="Explain the decision — the requestor will read this"
				rows={4}
			/>
		</AppDialog>
	);
}
