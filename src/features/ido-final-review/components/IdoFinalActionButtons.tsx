import { AppAlert, AppButton, AppCard, AppDialog, AppTextArea, formatAbsolute, toDate } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { ClipboardCheck, FileSignature, Lock, PenLine, XCircle } from "lucide-react";
import { useState } from "react";
import { type Control, useWatch } from "react-hook-form";
import { useIdoFinalReviewMutations } from "@/features/ido-final-review/hooks/use-ido-final-review-mutations";
import {
	type IdoFinalApproveFormValues,
	type IdoFinalRejectFormValues,
	idoFinalRejectFormSchema,
} from "@/features/ido-final-review/validations/schema/ido-final-approver.schema";
import { StampedSignature } from "@/features/request-detail/components/StampedSignature";
import { useAppForm } from "@/hooks/use-app-form";
import { isIdoFinalActionableStatus } from "@/lib/status-maps/request-status";

interface IdoFinalActionButtonsProps {
	/** The `REVIEW_REQUEST` grant. False disables both controls and says why.
	 *  It is NOT what closes this stage to an IDO officer - they hold it too. */
	canReview: boolean;
	/**
	 * The page's form, read here rather than a resolved `finalTitle: string`
	 * prop.
	 *
	 * The spec asks for the string. Subscribing to it HERE instead keeps the
	 * per-keystroke re-render inside this card: the page's other children are
	 * `RequestForm` and the comment thread, and lifting the subscription up would
	 * re-render both on every character typed into the override.
	 */
	control: Control<IdoFinalApproveFormValues>;
	/** What the request carries today. The title that gets signed when the
	 *  override is left empty. */
	currentFinalTitle: string | null;
	/** Whether the chairperson's own profile carries a signature. A courtesy:
	 *  without one `idoFinalApprove` refuses server-side regardless. */
	hasSignature: boolean;
	/** The signature actually stamped, copied onto the request at approval time.
	 *  Beyond the spec's prop list, and the read-only state is unreadable without
	 *  it - the spec's own UX rule asks for the image and the date. */
	idoFinalSignatureUrl: string | null;
	/** The `idoFinalSignedAt` stamp, or `null`. Also beyond the list: the
	 *  read-only copy has to NAME the day. */
	idoFinalSignedAt: Date | string | null;
	/** This desk's own stage column. `masterStatus` cannot answer the question -
	 *  it says where the request is, not what this desk decided. */
	idoFinalStatus: string | null;
	/**
	 * Approve, through the page's `handleSubmit`.
	 *
	 * The page owns it because the override is a validated field: `.max(255)` has
	 * to stop the submit and report under the input, and only the form that owns
	 * the resolver can do that. It REJECTS on a failed parse, which is what keeps
	 * the dialog open over an invalid title.
	 */
	onApprove: () => Promise<void>;
	requestId: string;
}

/**
 * What the page says when this stage is over, in the chairperson's own terms.
 *
 * A sentence naming the reason, never an empty card and never two dead buttons.
 * A chairperson reaches this page from a row their own queue put in front of
 * them - `STAFF_QUEUE_SCOPE` deliberately keeps `IDO_FINAL_APPROVED` and
 * `IDO_FINAL_REJECTED` in scope - so "nothing here" would read as a broken page.
 *
 * The three endings are different events: their own signed approval, their own
 * rejection, and a request that has not reached this stage at all - which on
 * this page usually means the Campus Director has not approved it yet, since
 * `idoFinalStatus` is written by THEIR approval and by nothing else.
 */
function stageEnding(idoFinalStatus: string | null, signedAt: Date | string | null) {
	const signedOn = signedAt ? formatAbsolute(toDate(signedAt)) : null;

	if (idoFinalStatus === "IDO_FINAL_REJECTED") {
		return {
			description:
				"The request stopped here and the requestor can see that it did, along with the reason you gave. Nothing in the app re-opens it.",
			icon: XCircle,
			title: "You rejected this request",
		};
	}

	if (signedOn) {
		return {
			description: `You approved and signed it on ${signedOn}. It is with the Campus Director for the last approval now.`,
			icon: ClipboardCheck,
			title: "Already signed by you",
		};
	}

	return {
		description:
			"It is not at the IDO final review stage. This stage opens when the Campus Director approves, so a request still sitting with them will not be actionable here yet.",
		icon: Lock,
		title: "There is nothing to decide here",
	};
}

/**
 * Approve & Sign, and Reject.
 *
 * ## "Approve & Sign", not "Approve"
 *
 * The label names the irreversible half. This is the moment a signature is
 * attached to a document that gets printed, and nothing in this app can unstamp
 * one - a button reading "Approve" would describe the routine part of an act
 * whose consequence is the other part.
 *
 * ## The dialog states the title that will be signed
 *
 * The override is a field the chairperson may have typed in and scrolled away
 * from. The one thing this confirmation must not do is commit a rename they have
 * forgotten about, so the resolved title - the override if there is one, the
 * current title if not - is printed in the dialog, and it says which of the two
 * it is.
 *
 * ## Why both dialogs are an `AppDialog` and not an `AppModal`
 *
 * The spec's component list names both. The package's contract decides between
 * them: `AppModal` is for something to READ and its only button is Close,
 * `AppDialog` is for something the user DOES "plus the one or two small inputs a
 * decision needs". The same call specs 010 to 012 made.
 */
export function IdoFinalActionButtons({
	canReview,
	control,
	currentFinalTitle,
	hasSignature,
	idoFinalSignatureUrl,
	idoFinalSignedAt,
	idoFinalStatus,
	onApprove,
	requestId,
}: IdoFinalActionButtonsProps) {
	const navigate = useNavigate();
	const [isApproveOpen, setIsApproveOpen] = useState(false);
	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const { idoFinalReject, isAnyPending } = useIdoFinalReviewMutations(requestId);

	const override = useWatch({ control, name: "finalTitle" })?.trim();
	const titleToSign = override || currentFinalTitle || "";
	const isRenaming = Boolean(override) && override !== currentFinalTitle;

	const isActionable = isIdoFinalActionableStatus(idoFinalStatus);

	if (!isActionable) {
		const { description, icon: Icon, title } = stageEnding(idoFinalStatus, idoFinalSignedAt);

		return (
			<AppCard
				data-cy="ido-final-stage-closed"
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
					{idoFinalSignatureUrl ? (
						<>
							<StampedSignature
								data-cy="ido-final-stamped-signature"
								label="The signature stamped on this request"
								url={idoFinalSignatureUrl}
							/>

							{/* Said here because a chairperson who signs and then opens the PDF
							    sees no signature, and the obvious reading is that the stamp
							    failed. It did not: the form prints the IDO block only once the
							    Campus Director's final approval lands (spec 016). */}
							<Typography
								color="muted"
								data-cy="ido-final-pdf-note"
								type="body-xs"
							>
								It will not appear on the printed form until the Campus Director gives the final approval. Until then
								the PDF shows the IDO block unsigned — that is the form waiting, not your signature failing.
							</Typography>
						</>
					) : null}
				</div>
			</AppCard>
		);
	}

	return (
		<>
			<AppCard
				data-cy="ido-final-actions"
				description="Confirm the title, then sign. Both outcomes are final for this stage."
				headingLevel={2}
				title="Your decision"
			>
				<div className="flex flex-col gap-4">
					{/* Before the button rather than after the failure. The chairperson is
					    told what is missing and where to fix it while they are still
					    looking at the disabled control, not after pressing it. */}
					{hasSignature ? null : (
						<AppAlert
							action={{ label: "Go to my profile", onPress: () => void navigate({ to: "/profile" }) }}
							data-cy="ido-final-no-signature"
							description="Your signature is printed in the IDO block of the form, so the app cannot let you approve without one. Rejecting does not need a signature."
							icon={PenLine}
							status="warning"
							title="No signature on your profile"
						/>
					)}

					<div className="flex flex-col gap-2">
						<AppButton
							data-cy="ido-final-approve"
							fullWidth
							icon={FileSignature}
							isDisabled={!canReview || !hasSignature || isAnyPending}
							onPress={() => setIsApproveOpen(true)}
							variant="primary"
						>
							Approve &amp; Sign
						</AppButton>

						<AppButton
							data-cy="ido-final-reject"
							fullWidth
							icon={XCircle}
							isDisabled={!canReview || isAnyPending}
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
						{canReview
							? "Signing cannot be undone. Rejecting stops the request for good."
							: "You no longer have permission to review requests. An administrator can restore it."}
					</Typography>
				</div>
			</AppCard>

			<AppDialog
				cancelLabel="Cancel"
				confirmLabel="Approve & Sign"
				data-cy="ido-final-approve-dialog"
				description="Your signature is stamped onto this request and it goes to the Campus Director for the last approval. Nothing in the app can undo it."
				icon={FileSignature}
				isOpen={isApproveOpen}
				onClose={() => setIsApproveOpen(false)}
				onConfirm={onApprove}
				pendingLabel="Signing..."
				title="Sign off on this request?"
				tone="default"
			>
				<div className="flex flex-col gap-2">
					<Typography
						color="muted"
						type="body-xs"
					>
						The title you are signing off
					</Typography>

					{/* The value, not a description of it. A chairperson who typed an
					    override twenty minutes ago and scrolled past it reads the string
					    here or nowhere. */}
					<Typography
						data-cy="ido-final-approve-dialog-title"
						type="body-sm"
						weight="semibold"
					>
						{titleToSign || "—"}
					</Typography>

					<Typography
						color="muted"
						type="body-xs"
					>
						{isRenaming
							? "This replaces the current final title everywhere, including on the printed form."
							: "The current title is unchanged — you left the override empty."}
					</Typography>
				</div>
			</AppDialog>

			<RejectDialog
				isOpen={isRejectOpen}
				onClose={() => setIsRejectOpen(false)}
				onConfirm={idoFinalReject}
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
 * `idoFinalReject` re-parses the same rule.
 *
 * ## Why a rejected confirm must reject
 *
 * `AppDialog` keeps itself open on a rejected promise with what was typed intact
 * and closes only when it resolves. So a failed validation and a failed mutation
 * both have to throw, or the dialog would close over a decision nobody took -
 * taking the note with it.
 */
function RejectDialog({ isOpen, onClose, onConfirm }: RejectDialogProps) {
	const { control, handleSubmit, reset } = useAppForm<IdoFinalRejectFormValues>(idoFinalRejectFormSchema, {
		defaultValues: { note: "" },
	});

	const handleClose = () => {
		// Cleared on the way out so re-opening is a fresh decision. A reason
		// abandoned twenty minutes ago is not the sentence the chairperson means to
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
			data-cy="ido-final-reject-dialog"
			description="This is final. The request stops at the IDO final review, the requestor is shown that it stopped, and nothing in the app re-opens it."
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
				data-cy="ido-final-reject-note"
				isRequired
				label="Reason"
				name="note"
				placeholder="Explain the decision — the requestor will read this"
				rows={4}
			/>
		</AppDialog>
	);
}
