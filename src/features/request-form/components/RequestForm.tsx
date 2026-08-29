import {
	AppButton,
	AppCard,
	AppDialog,
	AppInputGroup,
	AppReadOnlyField,
	AppSelect,
	AppTextArea,
} from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { useBlocker, useRouter } from "@tanstack/react-router";
import { FileText, Pencil, Save, Send, Star, TriangleAlert, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { DefaultValues } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { AttachmentUploader } from "@/features/request-form/components/AttachmentUploader";
import { RequestDocumentField } from "@/features/request-form/components/RequestDocumentField";
import { WorkflowStepper } from "@/features/request-form/components/WorkflowStepper";
import { useUserRequestMutations } from "@/features/request-form/hooks/use-user-request-mutations";
import {
	JUSTIFICATION_OPTIONS,
	justificationLabel,
	PRIORITY_OPTIONS,
	positionLabel,
	priorityLabel,
	TYPE_OF_REQUEST_OPTIONS,
	typeOfRequestLabel,
} from "@/features/request-form/lib/request-options";
import { type RequestFormValues, requestFormSchema } from "@/features/request-form/validations/schema/request.schema";
import { useAppForm } from "@/hooks/use-app-form";
import { isEditableStatus } from "@/lib/status-maps/request-status";

interface RequestFormProps {
	/**
	 * Whether the read-only side rail may offer Submit at all.
	 *
	 * Defaults to true, so the create page and the edit page are unaffected. The
	 * detail page passes `false` for a STAFF reader: five roles can open a request
	 * and only its owner may send it, and `requestId` plus an editable status -
	 * which is all the rail knew before - is true for a reviewer looking at
	 * somebody else's draft. `request.submit` refuses them either way; a button
	 * that exists only to answer FORBIDDEN is not a gate, it is a lie.
	 */
	canSubmit?: boolean;
	defaultValues?: Partial<RequestFormValues>;
	/**
	 * The issued `YYYY-NNNN`, shown beside the Title in the read-only card.
	 *
	 * Here rather than in each page's `AppPageHeader`, where it used to sit as a
	 * muted string beside the status chip: six pages each placed it themselves and
	 * the requestor's page put it beside a DIFFERENT title from the staff pages'.
	 * It is a field of the document, so it is read where the document's other
	 * fields are read.
	 *
	 * `null` on a draft - nothing is issued until submit - and the field is then
	 * absent rather than showing a placeholder, which is why Title takes the full
	 * width in that case.
	 */
	documentNumber?: string | null;
	/** Read-only regardless of status — the detail page (spec 006) viewing a draft. */
	forceReadOnly?: boolean;
	hideAttachments?: boolean;
	idoEvaluationStatus?: string | null;
	masterStatus?: string;
	mode: "create" | "edit";
	/** Leave without saving. Absent on the create page, where "back" is the sidebar. */
	onCancel?: () => void;
	onEdit?: () => void;
	/**
	 * Open the satisfaction feedback recorded against this request.
	 *
	 * Absent until there IS feedback, which the detail page decides from
	 * `completionStatus` - the request is COMPLETED only because somebody answered
	 * the form. Offered to every role that can read the request rather than to the
	 * owner alone: a reviewer who approved something has as much reason to see how
	 * it landed as the person who asked for it, and `csm.getForRequest` grants
	 * exactly that set.
	 */
	onViewFeedback?: () => void;
	/**
	 * A chance for the page to take a SAVE failure and show it in its own words.
	 *
	 * Returning `true` means "I have shown this" and the hook's toast is skipped -
	 * see `SaveArgs.onError`. The edit page (spec 007) uses it for the one failure
	 * a toast handles badly: the status changed while the page was open, which is
	 * a banner naming the new status with a Reload beside it, not a line that
	 * fades out telling the user to try again.
	 */
	onSaveError?: (error: unknown) => boolean;
	onViewPdf?: () => void;
	processor?: string | null;
	requestId?: string;
}

/**
 * What both profile-owned fields say under them.
 *
 * One constant because it is one fact told twice, and the day the profile page
 * moves the two lines have to move together.
 */
const PROFILE_FIELD_HINT = "Taken from your profile. Change it on the Profile page.";

/**
 * The empty form, before anything has been typed or loaded into it.
 *
 * A module constant rather than an object literal in the hook call, because
 * there are now two places that need it: `defaultValues`, which is what an
 * untouched create page shows, and `values`, which is what an existing request
 * is merged INTO. A saved request carries no `targetOrg`/`responsibleOrg` - the
 * server writes both from a constant and the detail select never reads them
 * back - so binding a request without this underneath would reset those two
 * fields to undefined and fail the schema on save, on a field the user cannot
 * see, let alone fix.
 */
const EMPTY_VALUES = {
	title: "",
	// The three selects with no sensible default start UNSET rather than at
	// their first option: a pre-picked "New Construction" is a value the user
	// never chose that arrives on the printed form as though they had.
	// `AppSelect` normalises undefined to its own empty value, so the field is
	// controlled from the first render.
	typeOfRequest: undefined,
	priority: "MEDIUM",
	requestedBy: "",
	position: undefined,
	targetOrg: "IDO",
	responsibleOrg: "IDO",
	details: "",
	justification: undefined,
	workScope: "",
	attachments: [],
} satisfies DefaultValues<RequestFormValues>;

/**
 * The request itself — the one component every request page renders.
 *
 * Three modes out of two props: create (no `requestId`), edit (one, and an
 * editable status), and read-only (`forceReadOnly`, or a status past RETURNED).
 * They are one component rather than three because the field set, the option
 * lists and the order the values print in are the same in all three, and the day
 * a field is added it has to appear in all three or the PDF gains a blank cell.
 *
 * ## Read-only is a document, not a form with the inputs turned off
 *
 * A disabled input still looks like something you failed to be allowed to type
 * in: it has a border, a focus ring that never arrives, and a value greyed to
 * the contrast of a placeholder — and, being one line tall, it truncated the two
 * paragraphs every desk downstream reads. A request under review is not a form
 * somebody is locked out of, it is a document, so `RequestDocumentField` renders
 * it as one: a muted label over wrapping text, no box at all.
 *
 * ## Submitting is two mutations, and the gap between them is designed for
 *
 * From the create page, Submit creates the draft and then submits it. If the
 * second half fails the first has already committed, so `savedIdRef` catches the
 * id on the way past: a retry updates that draft rather than filing a second
 * one, and a failure takes the user to the draft that now exists rather than
 * leaving them on a form whose contents are already saved.
 */
export function RequestForm({
	canSubmit = true,
	defaultValues,
	documentNumber,
	forceReadOnly,
	hideAttachments,
	idoEvaluationStatus,
	masterStatus,
	mode,
	onCancel,
	onEdit,
	onSaveError,
	onViewFeedback,
	onViewPdf,
	processor,
	requestId,
}: RequestFormProps) {
	const router = useRouter();
	const { isSaving, pendingLabel, saveRequestDraft, submitRequest } = useUserRequestMutations();

	// `mode` and not just `masterStatus`: a create page has no status at all, and
	// reading read-only-ness off an absent one would make the answer depend on a
	// prop the create page never passes.
	const isReadOnly = Boolean(forceReadOnly) || (mode === "edit" && !isEditableStatus(masterStatus));
	const effectiveStatus = masterStatus ?? "DRAFT";

	/** The id of the row this form has saved, create page included. */
	const savedIdRef = useRef<string | undefined>(requestId);

	/**
	 * Which button is being waited on.
	 *
	 * Both buttons disable together - two presses on a create page are two
	 * requests - but only one of them may show the spinner and the upload
	 * percentage, and it has to be the one the user pressed. A pending state on
	 * the other button says the app is doing something the user did not ask for.
	 */
	const [pendingAction, setPendingAction] = useState<"draft" | "submit" | null>(null);

	/**
	 * An existing request, BOUND rather than seeded.
	 *
	 * `values` is RHF's own option for editing a record: the form follows it, so a
	 * request that resolves after the first render lands in the fields with no
	 * `useEffect(() => reset(...))` to write - and that effect is the bug this
	 * avoids, because it fires on every new object identity and would wipe what
	 * the user was typing on any refetch at all. RHF instead compares the incoming
	 * values DEEPLY against the last set it applied, so a refetch that comes back
	 * the same is a no-op. A refetch that comes back DIFFERENT does still replace
	 * the form, which is why the edit page turns off refetch-on-focus (see
	 * `useRequestById`) - the two decisions are one decision.
	 *
	 * The cast is the one place this file lies to itself, and only about a request
	 * that predates an enum value: `defaultValues` is a `Partial`, so nothing
	 * proves the three enum fields are set. If one genuinely is not, the select
	 * renders empty and the schema stops the save, which is the same thing that
	 * happens to a create page nobody has filled in.
	 */
	const boundValues =
		mode === "edit" && defaultValues ? ({ ...EMPTY_VALUES, ...defaultValues } as RequestFormValues) : undefined;

	const {
		control,
		formState: { isDirty },
		handleSubmit,
		setValue,
	} = useAppForm<RequestFormValues>(requestFormSchema, {
		defaultValues: { ...EMPTY_VALUES, ...defaultValues },
		values: boundValues,
	});

	/*
	 * Two subscriptions rather than one. `useWatch({ control })` hands back a
	 * DeepPartial, which is right for the read-only display - every field there is
	 * rendered through a `?? "—"` - and wrong for the attachment list, whose rows
	 * go to the uploader and then to the server fully formed. Naming the field
	 * keeps that one properly typed.
	 */
	const values = useWatch({ control });
	const attachments = useWatch({ control, name: "attachments" }) ?? [];

	/**
	 * Whether leaving right now would lose something, read at the moment somebody
	 * tries to leave rather than at the moment this component last rendered.
	 *
	 * Two refs and not two pieces of state, because the reader is a router blocker
	 * registered outside React's render: `leavingRef` is set in the same tick as
	 * the navigation that follows a successful save, and a `setState` there would
	 * not have flushed in time - the user would be asked to discard the changes
	 * they had just saved. `isDirty` is mirrored for the same reason, so the
	 * blocker never answers from a stale closure.
	 */
	const isGuarded = !isReadOnly && isDirty;
	const guardRef = useRef(isGuarded);
	guardRef.current = isGuarded;

	/** Set immediately before a navigation this component is itself performing. */
	const leavingRef = useRef(false);

	const hasUnsavedChanges = useCallback(() => guardRef.current && !leavingRef.current, []);

	/*
	 * A request takes ten minutes to write and a back button takes none. The
	 * blocker covers router navigations - the sidebar, Cancel, the browser's back
	 * - and `enableBeforeUnload` covers the tab being closed or reloaded, where
	 * the browser draws its own dialog and this one never appears.
	 */
	const blocker = useBlocker({
		enableBeforeUnload: hasUnsavedChanges,
		shouldBlockFn: hasUnsavedChanges,
		withResolver: true,
	});

	const goToRequest = (id: string) => {
		// Saved. What is on screen is what is in the database, so the guard above
		// has nothing left to protect and must not stand in front of the navigation
		// that proves the save worked.
		leavingRef.current = true;

		void router.navigate({ params: { requestId: id }, to: "/requests/$requestId" });
	};

	const handleSaveDraft = handleSubmit(async (submitted) => {
		setPendingAction("draft");

		try {
			const id = await saveRequestDraft({
				onError: onSaveError,
				onSaved: (saved) => {
					savedIdRef.current = saved;
				},
				requestId: savedIdRef.current,
				values: submitted,
			});

			// The VIEW page, not back to this form. Pressing Edit again is then a
			// deliberate act rather than the state the user is silently left in —
			// which is where the old app kept losing track of whether a change had
			// been saved.
			goToRequest(id);
		} catch {
			// Already reported by the hook, which has the server's own message.
			// Swallowed here so react-hook-form's handler does not turn a handled
			// failure into an unhandled rejection.
		} finally {
			setPendingAction(null);
		}
	});

	const handleSubmitRequest = handleSubmit(async (submitted) => {
		setPendingAction("submit");

		/*
		 * Whether the SAVE half landed in THIS attempt, which is not the same
		 * question as whether `savedIdRef` holds an id. On the edit page it holds
		 * one from the first render, so reading it in the catch below would take a
		 * requestor whose save was just REFUSED - the status changed under them -
		 * away from the form and lose everything they had typed, on their way to a
		 * page that would tell them nothing about why.
		 */
		let didSave = false;

		try {
			goToRequest(
				await submitRequest({
					onError: onSaveError,
					onSaved: (saved) => {
						savedIdRef.current = saved;
						didSave = true;
					},
					requestId: savedIdRef.current,
					values: submitted,
				}),
			);
		} catch {
			// The save half may still have succeeded. If it did, the draft exists and
			// the user belongs on it — staying on a form whose contents are already in
			// the database is how a request gets filed twice.
			if (didSave && savedIdRef.current) goToRequest(savedIdRef.current);
		} finally {
			setPendingAction(null);
		}
	});

	const canSubmitDirectly = canSubmit && Boolean(requestId) && isEditableStatus(masterStatus);

	/*
	 * Whether the read-only rail has an action in it AT ALL.
	 *
	 * All three are conditional, and every combination of them is reachable: a
	 * reviewer reading a completed request may submit nothing, edit nothing and
	 * still see the PDF, and a reviewer on a draft that is not theirs gets none of
	 * the three. Rendering the group unconditionally put an empty bordered box in
	 * the rail on exactly those screens.
	 */
	const hasReadOnlyActions = canSubmitDirectly || Boolean(onEdit) || Boolean(onViewFeedback) || Boolean(onViewPdf);

	/*
	 * The processor, only once there is something to report.
	 *
	 * On a draft there is nothing: IDO names one when it recommends the request,
	 * so before it is even sent the card can only say "Not yet assigned" - a
	 * titled box whose entire content is that nothing has happened yet, sitting
	 * above the button that would make something happen. Past DRAFT the absence
	 * IS information, because by then somebody could have been assigned.
	 */
	const showProcessor = Boolean(processor) || effectiveStatus !== "DRAFT";

	return (
		<div className="flex flex-col gap-6">
			<WorkflowStepper
				idoEvaluationStatus={idoEvaluationStatus}
				masterStatus={effectiveStatus}
			/>

			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
				{/*
				 * `AppCard`, not `Card` + `Card.Content className="p-6"`. HeroUI's
				 * `.card` already carries `p-4` and its content slot carries none, so
				 * the padding written here NESTED: 16 + 24 = a 40px inset on the widest
				 * thing on the page, against 16px on the card beside it. AppCard owns
				 * the number, and it is the same number on every card in the app.
				 */}
				<AppCard
					data-cy="request-information"
					headingLevel={2}
					title="Request information"
				>
					{isReadOnly ? (
						/* A document, not a locked form. See `RequestDocumentField` for
						   why these are text rather than disabled inputs - in one word,
						   Details, which is a paragraph and was being shown one line of. */
						<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
							{/* Title gives up half its row to the document number, and takes
							    the full width back when there is none. A Title that always
							    spanned both columns would leave the number stranded on a row
							    of its own next to empty space. */}
							<RequestDocumentField
								className={documentNumber ? undefined : "sm:col-span-2"}
								label="Title"
								value={values.title ?? ""}
							/>
							{documentNumber ? (
								<RequestDocumentField
									data-cy="request-document-number"
									label="Document No."
									value={documentNumber}
								/>
							) : null}
							<RequestDocumentField
								label="Type of Request"
								value={typeOfRequestLabel(values.typeOfRequest)}
							/>
							<RequestDocumentField
								label="Priority"
								value={priorityLabel(values.priority)}
							/>
							<RequestDocumentField
								label="Requested By"
								value={values.requestedBy ?? ""}
							/>
							<RequestDocumentField
								label="Position"
								value={positionLabel(values.position)}
							/>
							<RequestDocumentField
								className="sm:col-span-2"
								label="Details"
								value={values.details ?? ""}
							/>
							<RequestDocumentField
								className="sm:col-span-2"
								label="Justification"
								value={justificationLabel(values.justification)}
							/>
							<RequestDocumentField
								className="sm:col-span-2"
								label="Work Scope"
								value={values.workScope ?? ""}
							/>
						</div>
					) : (
						/* Enter saves a DRAFT, never submits. A native submit on a form
						   this long is a keystroke away from filing a request to IDO
						   from the middle of the Title field; saving is the reversible
						   half of the same intention. */
						<form
							className="grid grid-cols-1 gap-6 sm:grid-cols-2"
							onSubmit={handleSaveDraft}
						>
							<AppInputGroup
								className="sm:col-span-2"
								control={control}
								data-cy="request-title"
								isRequired
								label="Title"
								name="title"
								placeholder="Enter request title"
							/>
							<AppSelect
								control={control}
								data-cy="request-type"
								isRequired
								items={TYPE_OF_REQUEST_OPTIONS}
								label="Type of Request"
								name="typeOfRequest"
								placeholder="Select type"
							/>
							<AppSelect
								control={control}
								data-cy="request-priority"
								isRequired
								items={PRIORITY_OPTIONS}
								label="Priority"
								name="priority"
								placeholder="Select priority"
							/>
							{/* Read-only in the editable form too, because neither is this
							    form's to decide: both come off the profile, and the server
							    writes `requestedBy` from the session on every save - so a
							    typed name was only ever a value that would be silently
							    replaced. They are still SHOWN, and shown here rather than in
							    the rail, because they are printed on the form as the
							    requestor and the representative row they sign; somebody who
							    cannot see them finds out on the paper copy.

							    `AppReadOnlyField` and not a disabled input: a disabled field
							    reads as one the user failed to be allowed to fill in, and
							    there is nothing to be allowed here. It is a real TextField,
							    so it still lines up with the inputs beside it. */}
							<AppReadOnlyField
								description={PROFILE_FIELD_HINT}
								label="Requested By"
								value={values.requestedBy || "—"}
							/>
							<AppReadOnlyField
								description={
									values.position
										? PROFILE_FIELD_HINT
										: "Not set. Add your position on the Profile page — a request cannot be filed without it."
								}
								label="Position"
								value={positionLabel(values.position)}
							/>
							<AppTextArea
								// TODO(web-ui@1.0.0): maxLength is now required - set a real budget for this field.
								className="sm:col-span-2"
								control={control}
								data-cy="request-details"
								description="Describe what is being requested and the problem it solves."
								isRequired
								label="Details"
								maxLength={2000}
								name="details"
								placeholder="Describe the request in detail"
								rows={5}
							/>
							<AppSelect
								className="sm:col-span-2"
								control={control}
								isRequired
								items={JUSTIFICATION_OPTIONS}
								label="Justification"
								name="justification"
								placeholder="Select justification"
							/>
							<AppTextArea
								// TODO(web-ui@1.0.0): maxLength is now required - set a real budget for this field.
								className="sm:col-span-2"
								control={control}
								description="Describe the physical or technical scope of the work involved."
								isRequired
								label="Work Scope"
								maxLength={2000}
								name="workScope"
								placeholder="Describe the scope of work"
								rows={4}
							/>
						</form>
					)}
				</AppCard>

				{/*
				 * The rail, and the actions are at the TOP of it.
				 *
				 * They used to be third, under a processor card and an uploader, which
				 * on the create page put Submit below the fold behind the tallest thing
				 * on the screen. What the reader came here to DO goes first; 24px
				 * between the groups and 8px inside each is what keeps them reading as
				 * separate groups now that two of the three have no border to say so.
				 */}
				<div className="flex flex-col gap-6">
					{isReadOnly ? (
						hasReadOnlyActions ? (
							<div className="flex flex-col gap-2">
								{canSubmitDirectly ? (
									<AppButton
										fullWidth
										icon={Send}
										isDisabled={isSaving}
										isPending={pendingAction === "submit"}
										onPress={() => handleSubmitRequest()}
										variant="primary"
									>
										{pendingAction === "submit" ? (pendingLabel ?? "Submitting...") : "Submit Request"}
									</AppButton>
								) : null}

								{onEdit ? (
									<AppButton
										fullWidth
										icon={Pencil}
										onPress={onEdit}
										variant="secondary"
									>
										Edit Request
									</AppButton>
								) : null}

								{/* Above the PDF and below Edit, which is where its consequence
								    puts it: the signed form is the document, the feedback is what
								    happened after it, and neither is the thing a requestor with an
								    editable draft came here to press. */}
								{onViewFeedback ? (
									<AppButton
										data-cy="view-feedback"
										fullWidth
										icon={Star}
										onPress={onViewFeedback}
										variant="secondary"
									>
										View Feedback
									</AppButton>
								) : null}

								{onViewPdf ? (
									<AppButton
										fullWidth
										icon={FileText}
										onPress={onViewPdf}
										variant="tertiary"
									>
										View PDF
									</AppButton>
								) : null}
							</div>
						) : null
					) : (
						<div className="flex flex-col gap-3">
							<div className="flex flex-col gap-2">
								{/* Both disabled while EITHER runs - two presses on a create page
								    are two requests, and the second one is a duplicate nobody
								    asked for - but only the pressed one spins, and only it
								    carries the upload percentage. */}
								<AppButton
									data-cy="submit-request"
									fullWidth
									icon={Send}
									isDisabled={isSaving}
									isPending={pendingAction === "submit"}
									onPress={() => handleSubmitRequest()}
									variant="primary"
								>
									{pendingAction === "submit" ? (pendingLabel ?? "Submitting...") : "Submit Request"}
								</AppButton>

								<AppButton
									data-cy="save-draft"
									fullWidth
									icon={Save}
									isDisabled={isSaving}
									isPending={pendingAction === "draft"}
									onPress={() => handleSaveDraft()}
									variant="secondary"
								>
									{pendingAction === "draft" ? (pendingLabel ?? "Saving...") : "Save Draft"}
								</AppButton>

								{/* Last, and the quietest of the three. It is the only one of
								    them that throws work away, and the unsaved-changes guard is
								    what stands between it and a form somebody has typed in. */}
								{onCancel ? (
									<AppButton
										data-cy="cancel-edit"
										fullWidth
										icon={X}
										isDisabled={isSaving}
										onPress={onCancel}
										variant="tertiary"
									>
										Cancel
									</AppButton>
								) : null}
							</div>

							<Typography
								color="muted"
								type="body-xs"
							>
								Submitting sends this request to IDO for review. Saving as a draft keeps it on your desk so you can
								finish it later. Both check every required field first.
							</Typography>
						</div>
					)}

					{/* No card around it. Read-only it is an `AppList`, which owns a
					    surface of its own - a card there was two borders and two paddings
					    around one list - and in edit mode the drop zone draws its own
					    outline. Both carry their own "Attachments" heading. */}
					{hideAttachments ? null : (
						<AttachmentUploader
							isDisabled={isSaving}
							isReadOnly={isReadOnly}
							onChange={(next) => setValue("attachments", next, { shouldDirty: true })}
							value={attachments}
						/>
					)}

					{showProcessor ? (
						<AppCard
							description="Assigned by IDO when the request is recommended."
							title="Processor"
						>
							{processor ? (
								<Typography type="body">{processor}</Typography>
							) : (
								<Typography
									className="italic"
									color="muted"
									type="body-sm"
								>
									Not yet assigned
								</Typography>
							)}
						</AppCard>
					) : null}
				</div>
			</div>

			{/* A dialog rather than the browser's own confirm, which can only offer
			    OK and Cancel over a sentence it writes itself. Both answers here are
			    labelled with what they DO: `blocker.reset` puts the user back in the
			    form, `proceed` lets the navigation they asked for through. */}
			<AppDialog
				cancelLabel="Keep editing"
				confirmLabel="Discard changes"
				data-cy="unsaved-changes-dialog"
				description="This request has changes that have not been saved. Leaving now throws them away — Save Draft keeps them without sending anything to IDO."
				icon={TriangleAlert}
				isOpen={blocker.status === "blocked"}
				onClose={() => blocker.reset?.()}
				onConfirm={() => blocker.proceed?.()}
				title="Leave without saving?"
				tone="danger"
			/>
		</div>
	);
}
