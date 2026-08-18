import { AppCard, AppChip, AppReadOnlyField } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { idoEvaluationStatusMap } from "@/lib/status-maps/request-status";

interface IdoDecisionSummaryProps {
	/** The IDO's note. Printed on the IDO block of the form, and the nearest thing
	 *  to a reason this stage is given. */
	approverNote: string | null;
	/**
	 * The IDO's own verdict.
	 *
	 * Not in the spec's prop list, and here anyway: a chip that says "Recommended
	 * by IDO" without being told the status would be a sentence this component
	 * asserted rather than read. Reaching the budget desk does imply a
	 * recommendation, but a component that prints a status it was never given is
	 * one that keeps printing it after the workflow changes.
	 */
	idoEvaluationStatus: string | null;
	/** The name stamped on the request by whoever reviewed it. */
	processor: string | null;
	reference: string | null;
	/** Replaces the requestor's title from the IDO stage onwards. */
	finalTitle: string | null;
}

/**
 * What IDO decided, and why.
 *
 * ## Why it is on the page at all
 *
 * The budget officer's job starts FROM this decision - they are confirming that
 * a request somebody else has already judged worth doing has a PPMP line. Buried
 * in the activity feed it is four scrolls down, mixed in with a creation and a
 * submission; the officer would be deciding without the input to the decision in
 * front of them.
 *
 * ## Why it is read-only prose rather than a form
 *
 * Nothing here is the budget desk's to change. `AppReadOnlyField` is the same
 * treatment `RequestForm` gives a submitted request and `IdoApproverPanel` gives
 * a decided one, so the whole page reads as one document at one level of
 * editability.
 *
 * ## Where it sits
 *
 * Above `BudgetActionButtons`, per the spec's UX rule: the input to a decision
 * goes above the controls that take it.
 */
export function IdoDecisionSummary({
	approverNote,
	finalTitle,
	idoEvaluationStatus,
	processor,
	reference,
}: IdoDecisionSummaryProps) {
	const verdict = idoEvaluationStatus ? idoEvaluationStatusMap[idoEvaluationStatus] : undefined;

	return (
		<AppCard
			data-cy="ido-decision-summary"
			description="What the IDO decided before this request reached your desk. None of it is yours to change."
			headingLevel={2}
			title="IDO decision"
		>
			<div className="flex flex-col gap-6">
				{verdict ? (
					<AppChip
						data-cy="ido-decision-verdict"
						icon={verdict.icon}
						label={verdict.label}
						tone={verdict.tone}
					/>
				) : null}

				{/* Two columns from `sm` up and one below it. The four values are short
				    labelled facts rather than prose, so a single column on a wide screen
				    would be a column of air with a scroll the reader does not need. */}
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<AppReadOnlyField
						description="Carried from here on, including onto the printed form."
						label="Title (Final)"
						value={finalTitle || "—"}
					/>

					<AppReadOnlyField
						label="Reference"
						value={reference || "—"}
					/>

					<AppReadOnlyField
						label="Reviewed by"
						value={processor || "—"}
					/>
				</div>

				{/* The note gets the full width and its own block: it is the only
				    free text here, and squeezing a paragraph into half a row beside a
				    one-line reference is what makes a reason look like a field label. */}
				<div className="flex flex-col gap-2">
					<AppReadOnlyField
						label="IDO note"
						value={approverNote || "—"}
					/>

					{approverNote ? null : (
						<Typography
							color="muted"
							type="body-xs"
						>
							The IDO left no note. That is not a flag — a note is optional at that stage.
						</Typography>
					)}
				</div>
			</div>
		</AppCard>
	);
}
