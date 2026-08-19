import { AppStepper } from "@bernardsapida/web-ui";
import { ClipboardCheck, FileText, Gavel, Search, Send, ShieldCheck } from "lucide-react";

interface WorkflowStepperProps {
	idoEvaluationStatus?: string | null;
	masterStatus: string;
}

/**
 * The seven desks a request passes, and which one is holding it.
 *
 * `AppStepper` replaces the hand-rolled timeline this came from - its
 * framer-motion connectors, its pulsing box-shadow and its own connector maths -
 * and brings the thing that version never had: a bar reading "Step 2 of 7" below
 * `sm`, because seven labelled circles on a 390px screen are seven truncated
 * words and no sense of progress.
 *
 * **It carries no status chip and no "Progress" caption.** Every page that
 * renders this also renders `AppPageHeader` with the status chip in it, so a
 * second chip a few pixels below said "Draft" twice on one screen - and the
 * caption named the one thing on the page that needs no naming. What the stepper
 * says that the chip cannot is WHERE in the sequence the request stopped, which
 * is the marker, not a label beside it.
 */
const WORKFLOW_STEPS = [
	{ icon: FileText, key: "DRAFT", label: "Draft" },
	{ icon: Send, key: "SUBMITTED", label: "Submitted" },
	{ icon: Search, key: "UNDER_IDO_REVIEW", label: "IDO Evaluation" },
	{ icon: Gavel, key: "UNDER_DIRECTOR_REVIEW", label: "Director Review" },
	{ icon: ClipboardCheck, key: "UNDER_IDO_FINAL_REVIEW", label: "IDO Final" },
	{ icon: ShieldCheck, key: "UNDER_FINAL_DIRECTOR_REVIEW", label: "Final Director" },
	{ icon: ClipboardCheck, key: "COMPLETED", label: "Completed" },
] as const;

/**
 * Where each status stops the marker.
 *
 * **Every master status has an entry, including the five rejections**, and that
 * is not tidiness: a status missing from here renders `currentStep: -1`, which is
 * a stepper with no marker at all on the one screen where the reader most needs
 * to know where their request died. A rejection pins the marker at the stage
 * that said no, so the row reads as a journey that stopped rather than one that
 * never started.
 */
const STEP_INDEX_BY_STATUS: Record<string, number> = {
	APPROVED: 6,
	BUDGET_OFFICER_REJECTED: 3,
	COMPLETED: 6,
	DIRECTOR_REJECTED: 3,
	DRAFT: 0,
	FINAL_REJECTED: 5,
	FOR_NEXT_YEAR_PPMP: 2,
	IDO_FINAL_REJECTED: 4,
	REJECTED_BY_IDO: 2,
	RETURNED: 2,
	SUBMITTED: 1,
	UNDER_DIRECTOR_REVIEW: 3,
	UNDER_FINAL_DIRECTOR_REVIEW: 5,
	UNDER_IDO_FINAL_REVIEW: 4,
	UNDER_IDO_REVIEW: 2,
};

const REJECTED_STATUSES = new Set([
	"BUDGET_OFFICER_REJECTED",
	"DIRECTOR_REJECTED",
	"FINAL_REJECTED",
	"IDO_FINAL_REJECTED",
	"REJECTED_BY_IDO",
]);

export function WorkflowStepper({ idoEvaluationStatus, masterStatus }: WorkflowStepperProps) {
	const isReturned = masterStatus === "RETURNED" || idoEvaluationStatus === "RETURNED_TO_REQUESTOR";
	const isRejected = REJECTED_STATUSES.has(masterStatus);

	// A returned request sits at the IDO stage in the sequence, wherever its
	// master status happens to read, because that is the desk that sent it back.
	const currentStep = isReturned ? 2 : (STEP_INDEX_BY_STATUS[masterStatus] ?? 0);

	const steps = WORKFLOW_STEPS.map((step, index) => {
		if (index !== currentStep || (!isReturned && !isRejected)) return { ...step };

		// The stage's own name is replaced rather than annotated. "IDO Evaluation"
		// under a marker that has stopped there says the request is being read; it
		// is not, and the label is the only thing at that size anybody reads.
		return { ...step, label: isReturned ? "Returned" : "Rejected" };
	});

	return (
		<AppStepper
			currentStep={currentStep}
			data-cy="request-workflow"
			steps={steps}
		/>
	);
}
