import { AppButton, AppCard, AppInputGroup, AppReadOnlyField, AppSelect, AppTextArea } from "@bernardsapida/web-ui";
import { Card, Typography } from "@heroui/react";
import { useRouter } from "@tanstack/react-router";
import { FileText, Pencil, Save, Send } from "lucide-react";
import { useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { AttachmentUploader } from "@/features/request-form/components/AttachmentUploader";
import { WorkflowStepper } from "@/features/request-form/components/WorkflowStepper";
import { useUserRequestMutations } from "@/features/request-form/hooks/use-user-request-mutations";
import {
	JUSTIFICATION_OPTIONS,
	justificationLabel,
	POSITION_OPTIONS,
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
	/** Read-only regardless of status — the detail page (spec 006) viewing a draft. */
	forceReadOnly?: boolean;
	hideAttachments?: boolean;
	idoEvaluationStatus?: string | null;
	masterStatus?: string;
	mode: "create" | "edit";
	onEdit?: () => void;
	onViewPdf?: () => void;
	processor?: string | null;
	requestId?: string;
}

/**
 * The request itself — the one component every request page renders.
 *
 * Three modes out of two props: create (no `requestId`), edit (one, and an
 * editable status), and read-only (`forceReadOnly`, or a status past RETURNED).
 * They are one component rather than three because the field set, the option
 * lists and the order the values print in are the same in all three, and the day
 * a field is added it has to appear in all three or the PDF gains a blank cell.
 *
 * ## Read-only is `AppReadOnlyField`, not a disabled input
 *
 * A disabled input still looks like something you failed to be allowed to type
 * in: it has a border, a focus ring that never arrives, and a value greyed to
 * the contrast of a placeholder. A request under review is not a form somebody
 * is locked out of, it is a document — so it renders as one.
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
	forceReadOnly,
	hideAttachments,
	idoEvaluationStatus,
	masterStatus,
	mode,
	onEdit,
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

	const { control, handleSubmit, setValue } = useAppForm<RequestFormValues>(requestFormSchema, {
		defaultValues: {
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
			...defaultValues,
		},
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

	const goToRequest = (id: string) => {
		void router.navigate({ params: { requestId: id }, to: "/requests/$requestId" });
	};

	const handleSaveDraft = handleSubmit(async (submitted) => {
		setPendingAction("draft");

		try {
			const id = await saveRequestDraft({
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

		try {
			goToRequest(
				await submitRequest({
					onSaved: (saved) => {
						savedIdRef.current = saved;
					},
					requestId: savedIdRef.current,
					values: submitted,
				}),
			);
		} catch {
			// The save half may still have succeeded. If it did, the draft exists and
			// the user belongs on it — staying on a form whose contents are already in
			// the database is how a request gets filed twice.
			if (savedIdRef.current) goToRequest(savedIdRef.current);
		} finally {
			setPendingAction(null);
		}
	});

	const canSubmitDirectly = canSubmit && Boolean(requestId) && isEditableStatus(masterStatus);

	return (
		<div className="flex flex-col gap-6">
			<WorkflowStepper
				idoEvaluationStatus={idoEvaluationStatus}
				masterStatus={effectiveStatus}
			/>

			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
				<Card>
					<Card.Content className="flex flex-col gap-6 p-6">
						<Typography.Heading level={2}>Request information</Typography.Heading>

						{isReadOnly ? (
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
								<AppReadOnlyField
									className="sm:col-span-2"
									label="Title"
									value={values.title ?? "—"}
								/>
								<AppReadOnlyField
									label="Type of Request"
									value={typeOfRequestLabel(values.typeOfRequest)}
								/>
								<AppReadOnlyField
									label="Priority"
									value={priorityLabel(values.priority)}
								/>
								<AppReadOnlyField
									label="Requested By"
									value={values.requestedBy ?? "—"}
								/>
								<AppReadOnlyField
									label="Position"
									value={positionLabel(values.position)}
								/>
								<AppReadOnlyField
									className="sm:col-span-2"
									label="Details"
									value={values.details ?? "—"}
								/>
								<AppReadOnlyField
									className="sm:col-span-2"
									label="Justification"
									value={justificationLabel(values.justification)}
								/>
								<AppReadOnlyField
									className="sm:col-span-2"
									label="Work Scope"
									value={values.workScope ?? "—"}
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
								<AppInputGroup
									control={control}
									description="Taken from your account. It is printed on the form as the requestor."
									isRequired
									label="Requested By"
									name="requestedBy"
									placeholder="Full name of the requestor"
								/>
								<AppSelect
									control={control}
									description="Decides which representative row you sign on."
									isRequired
									items={POSITION_OPTIONS}
									label="Position"
									name="position"
									placeholder="Select position"
								/>
								<AppTextArea
									className="sm:col-span-2"
									control={control}
									data-cy="request-details"
									description="Describe what is being requested and the problem it solves."
									isRequired
									label="Details"
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
									className="sm:col-span-2"
									control={control}
									description="Describe the physical or technical scope of the work involved."
									isRequired
									label="Work Scope"
									name="workScope"
									placeholder="Describe the scope of work"
									rows={4}
								/>
							</form>
						)}
					</Card.Content>
				</Card>

				<div className="flex flex-col gap-4">
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

					{hideAttachments ? null : (
						<Card>
							<Card.Content className="p-6">
								<AttachmentUploader
									isDisabled={isSaving}
									isReadOnly={isReadOnly}
									onChange={(next) => setValue("attachments", next, { shouldDirty: true })}
									value={attachments}
								/>
							</Card.Content>
						</Card>
					)}

					<Card>
						<Card.Content className="flex flex-col gap-4 p-6">
							{isReadOnly ? (
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
							) : (
								<>
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
									</div>

									<Typography
										color="muted"
										type="body-xs"
									>
										Submitting sends this request to IDO for review. Saving as a draft keeps it on your desk so you can
										finish it later. Both check every required field first.
									</Typography>
								</>
							)}
						</Card.Content>
					</Card>
				</div>
			</div>
		</div>
	);
}
