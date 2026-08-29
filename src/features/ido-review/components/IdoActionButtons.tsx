import { AppButton, AppDialog, AppTextArea } from "@bernardsapida/web-ui";
import { Card, Typography } from "@heroui/react";
import { CalendarClock, type LucideIcon, Undo2, XCircle } from "lucide-react";
import { useState } from "react";
import { useIdoReviewMutations } from "@/features/ido-review/hooks/use-ido-review-mutations";
import {
	type IdoNoteFormValues,
	idoOptionalNoteFormSchema,
	idoRequiredNoteFormSchema,
} from "@/features/ido-review/validations/schema/ido-approver.schema";
import { useAppForm } from "@/hooks/use-app-form";
import { masterStatusMap } from "@/lib/status-maps/request-status";

interface IdoActionButtonsProps {
	canReview: boolean;
	/** The request's `masterStatus`. Named as the spec names it; it is what decides
	 *  whether this card holds controls or a sentence. */
	currentStatus: string;
	isActionable: boolean;
	requestId: string;
}

type IdoStopAction = "defer" | "reject" | "return";

/**
 * The three outcomes that stop a request, and the note each one needs.
 *
 * ## Why these are not beside Recommend
 *
 * The four outcomes are one decision, so hiding three of them at the foot of the
 * page under the comment thread would be wrong — a reviewer choosing between them
 * has to see all four. But muscle memory aims at primary positions blind, and two
 * of these cannot be undone by anybody in the app. So they sit in their own card
 * to the side of the recommendation, in their own visual weight: none of them is
 * `primary`, and the page's one primary button is Recommend.
 *
 * ## Return is not red, and Reject is
 *
 * Red is a budget spent on destruction only. A return refuses nothing — the
 * request goes back to the requestor's desk to be edited and resubmitted under the
 * same document number, which is why the audit rail draws it in accent rather than
 * red. Reject is the terminal no and gets the only `danger` on the page. Defer is
 * terminal too and deliberately quiet: the request was valid, and the budget
 * calendar rather than a reviewer's judgement is what stopped it. Painting it red
 * would tell the requestor their request was refused.
 *
 * ## Each one asks for its note in a dialog, never a bare confirm
 *
 * The dialog's copy is what distinguishes Reject from Defer, which look alike and
 * mean opposite things. The note is required on the first two because the
 * requestor reads it as the whole explanation; on a deferral there may genuinely
 * be nothing to say beyond the year.
 */
const STOP_ACTIONS: Record<
	IdoStopAction,
	{
		buttonLabel: string;
		confirmLabel: string;
		description: string;
		icon: LucideIcon;
		isNoteRequired: boolean;
		notePlaceholder: string;
		pendingLabel: string;
		title: string;
		tone: "accent" | "danger" | "default";
		variant: "danger" | "secondary" | "tertiary";
	}
> = {
	defer: {
		buttonLabel: "Defer to Next Year PPMP",
		confirmLabel: "Defer to next year",
		description:
			"The request is valid — there is simply no budget allocated for it this year, so it is set aside for next year's PPMP. This is not a rejection, and nothing here can re-open it.",
		icon: CalendarClock,
		isNoteRequired: false,
		notePlaceholder: "Add a note if there is anything to explain",
		pendingLabel: "Deferring...",
		title: "Defer this request to next year's PPMP?",
		tone: "accent",
		variant: "tertiary",
	},
	reject: {
		buttonLabel: "Reject",
		confirmLabel: "Reject request",
		description:
			"This is final. The request is closed at the IDO stage, no form is issued, and the requestor has to file a new one — nothing here can re-open it.",
		icon: XCircle,
		isNoteRequired: true,
		notePlaceholder: "Explain why — the requestor will read this",
		pendingLabel: "Rejecting...",
		title: "Reject this request?",
		tone: "danger",
		variant: "danger",
	},
	return: {
		buttonLabel: "Return to Requestor",
		confirmLabel: "Return to requestor",
		description:
			"It goes back to the requestor's desk to be edited and resubmitted under the same document number. Your note is what they will read as the reason.",
		icon: Undo2,
		isNoteRequired: true,
		notePlaceholder: "Explain what has to change — the requestor will read this",
		pendingLabel: "Returning...",
		title: "Return this request to the requestor?",
		tone: "default",
		variant: "secondary",
	},
};

/** Return, Defer, Reject — least severe first, and the terminal no last, furthest
 *  from where the eye lands. */
const STOP_ACTION_ORDER: IdoStopAction[] = ["return", "defer", "reject"];

export function IdoActionButtons({ canReview, currentStatus, isActionable, requestId }: IdoActionButtonsProps) {
	const [openAction, setOpenAction] = useState<IdoStopAction | null>(null);
	const { deferToNextYearPpmp, isAnyPending, rejectByIdo, returnToRequestor } = useIdoReviewMutations(requestId);

	const runners: Record<IdoStopAction, (note: string) => Promise<void>> = {
		defer: (note) => deferToNextYearPpmp(note),
		reject: (note) => rejectByIdo(note),
		return: (note) => returnToRequestor(note),
	};

	/*
	 * A sentence naming the stage — not an empty card, and not three dead buttons.
	 * A reviewer reaches this from a row their own queue put in front of them
	 * (their handled history stays in scope on purpose), so "nothing here" would
	 * read as a broken page. IRMS-old threw "Request is not available for IDO
	 * review" at exactly this moment.
	 */
	if (!isActionable) {
		const label = masterStatusMap[currentStatus]?.label ?? currentStatus;

		return (
			<Card>
				<Card.Content className="flex flex-col gap-3 p-6">
					<Typography.Heading level={2}>Actions</Typography.Heading>

					<Typography
						color="muted"
						data-cy="ido-not-actionable"
						type="body-sm"
					>
						This request has moved past the IDO review stage — it is now {label}. There is nothing left to decide here.
					</Typography>
				</Card.Content>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<Card.Content className="flex flex-col gap-4 p-6">
					<div className="flex flex-col gap-1">
						<Typography.Heading level={2}>Other outcomes</Typography.Heading>

						<Typography
							color="muted"
							type="body-sm"
						>
							Each of these stops the request here. Only a return can be answered by the requestor.
						</Typography>
					</div>

					<div className="flex flex-col gap-2">
						{STOP_ACTION_ORDER.map((action) => {
							const { buttonLabel, icon, variant } = STOP_ACTIONS[action];

							return (
								<AppButton
									data-cy={`ido-${action}`}
									fullWidth
									icon={icon}
									isDisabled={!canReview || isAnyPending}
									key={action}
									onPress={() => setOpenAction(action)}
									variant={variant}
								>
									{buttonLabel}
								</AppButton>
							);
						})}
					</div>

					{canReview ? null : (
						<Typography
							color="muted"
							type="body-xs"
						>
							You no longer have permission to review requests. An administrator can restore it.
						</Typography>
					)}
				</Card.Content>
			</Card>

			{STOP_ACTION_ORDER.map((action) => (
				<NoteDialog
					action={action}
					isOpen={openAction === action}
					key={action}
					onClose={() => setOpenAction(null)}
					onConfirm={runners[action]}
				/>
			))}
		</>
	);
}

interface NoteDialogProps {
	action: IdoStopAction;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (note: string) => Promise<void>;
}

/**
 * One decision, with the note it needs, in an `AppDialog`.
 *
 * ## Why a dialog and not a modal
 *
 * `AppModal` is the surface for something to READ and its only button is Close;
 * `AppDialog` is the one for something the user DOES, "plus the one or two small
 * inputs a decision needs". A note typed and then confirmed is that second thing.
 * The spec's component list names both surfaces; the package's contract is what
 * decides which, and a modal here would have nothing to fire the action with.
 *
 * ## Two gates on the same empty note, on purpose
 *
 * `isRequired` is read by the dialog's own required-field gate, which holds the
 * confirm button disabled until the field has something in it — so the ordinary
 * path is a button that will not fire rather than a message to read. The Zod parse
 * on confirm is the one that reports "Note is required" under the field, and it
 * catches anything the DOM gate cannot see. Neither is the real guard: the
 * procedure re-parses the same rule.
 *
 * ## Why a rejected confirm must reject
 *
 * `AppDialog` keeps itself open on a rejected promise with what was typed intact,
 * and closes only when it resolves. So a failed validation and a failed mutation
 * both have to throw, or the dialog would close over a decision nobody took.
 */
function NoteDialog({ action, isOpen, onClose, onConfirm }: NoteDialogProps) {
	const { confirmLabel, description, icon, isNoteRequired, notePlaceholder, pendingLabel, title, tone } =
		STOP_ACTIONS[action];

	const { control, handleSubmit, reset } = useAppForm<IdoNoteFormValues>(
		// Both schemas produce `{ note: string }` — the only difference between them
		// is which rule runs, so the required one's type covers the pair.
		(isNoteRequired ? idoRequiredNoteFormSchema : idoOptionalNoteFormSchema) as typeof idoRequiredNoteFormSchema,
		{ defaultValues: { note: "" } },
	);

	const handleClose = () => {
		// Cleared on the way out so re-opening is a fresh decision. A note abandoned
		// twenty minutes ago is not the sentence the reviewer means to send now.
		reset({ note: "" });
		onClose();
	};

	const handleConfirm = async () => {
		let submitted = false;

		await handleSubmit(async (values) => {
			submitted = true;

			await onConfirm(values.note);
		})();

		// `handleSubmit` resolves whether or not the schema passed — the field's own
		// error is the report — so the rejection this dialog needs is raised here, or
		// an invalid note would close it having done nothing.
		if (!submitted) throw new Error("Note is required");
	};

	return (
		<AppDialog
			cancelLabel="Cancel"
			confirmLabel={confirmLabel}
			data-cy={`ido-${action}-dialog`}
			description={description}
			icon={icon}
			isOpen={isOpen}
			onClose={handleClose}
			onConfirm={handleConfirm}
			pendingLabel={pendingLabel}
			title={title}
			tone={tone}
		>
			<AppTextArea
				// TODO(web-ui@1.0.0): maxLength is now required - set a real budget for this field.
				control={control}
				data-cy={`ido-${action}-note`}
				isRequired={isNoteRequired}
				label="Note"
				maxLength={2000}
				name="note"
				placeholder={notePlaceholder}
				rows={4}
			/>
		</AppDialog>
	);
}
