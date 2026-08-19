import {
	CheckCircle2,
	ClipboardCheck,
	FileText,
	Gavel,
	type LucideIcon,
	Search,
	Send,
	ShieldCheck,
	Undo2,
	XCircle,
} from "lucide-react";
import type { RequestPdfData, SignaturesBase64 } from "../types/request-pdf.types";
import { demoSignature } from "./demo-signature";

/**
 * The printed form at every stage of a request's life, as data.
 *
 * ## What this page is for
 *
 * The PDF is the artefact the whole workflow exists to produce, and until now
 * the only way to see what it looks like mid-flow was to drive a real request
 * through five desks and open it after each one. These scenarios are the same
 * thing without the driving: pick a path, step through it, watch the form fill.
 *
 * ## Every stage is a PATCH, applied cumulatively
 *
 * A stage holds only what its desk writes, and `requestAtStage` folds stages 0..n
 * together - which mirrors how the real row accumulates and keeps each entry
 * readable as "what this desk changed". A stage whose `patch` is nearly empty is
 * telling you something true: see `note`.
 *
 * ## Nothing here talks to the server
 *
 * The data is synthetic and the signatures are drawn on a canvas. That is the
 * point of a reference page - it must render for anybody who opens it, on a
 * database with no approved requests in it, and it must never show a real
 * requestor's form to whoever happens to be signed in.
 */

const REQUESTOR = "Juan Dela Cruz";
const IDO_CHAIRPERSON = "Carlos Santos";
const CAMPUS_DIRECTOR = "Divina Ramos";

const TITLE = "Roof replacement at the Home Economics Building";
const FINAL_TITLE = "Roof replacement at the Home Economics Building (Phase 1)";

const RECOMMEND_NOTE = "Verified against the campus development plan. Endorsed for budget review.";

/** Fixed rather than `new Date()`, so two people looking at this page a week
 *  apart are looking at the same document. */
const FILED_AT = "2026-01-28T01:00:00.000Z";
const IDO_SIGNED_AT = "2026-02-01T01:00:00.000Z";
const DIRECTOR_SIGNED_AT = "2026-02-02T01:00:00.000Z";

/** A draft nobody has filed: the request's own answers, and nothing any desk
 *  has written. Every scenario starts here. */
const BASE: RequestPdfData = {
	approverNote: null,
	details:
		"The roofing has three active leaks over the cookery laboratory and the trusses show corrosion along the eastern span. The room has been out of use since the second week of January.",
	documentNumber: null,
	finalDirectorName: null,
	finalDirectorSignatureUrl: null,
	finalDirectorSignedAt: null,
	finalDirectorStatus: null,
	finalTitle: null,
	id: "pdf-walkthrough",
	idoEvaluationStatus: null,
	idoFinalApproverName: null,
	idoFinalSignatureUrl: null,
	idoFinalSignedAt: null,
	idoFinalStatus: null,
	masterStatus: "DRAFT",
	nameOfBuildingArea: TITLE,
	position: "FACULTY_REPRESENTATIVE",
	reference: null,
	requestedBy: REQUESTOR,
	requestorSignatureUrl: null,
	requestSubmittedAt: null,
	title: TITLE,
	typeOfRequest: "REHABILITATION",
};

export interface DemoStage {
	icon: LucideIcon;
	key: string;
	label: string;
	/** What this desk changes ON THE PRINTED FORM - which is sometimes nothing,
	 *  and saying so is half the value of the page. */
	note: string;
	patch: Partial<RequestPdfData>;
}

export interface DemoScenario {
	description: string;
	key: string;
	label: string;
	stages: DemoStage[];
}

/*
 * A step names the desk CURRENTLY HOLDING the request, not the desk that just
 * acted - which is the same thing the app's own workflow stepper means, and it
 * is the rule that decides which stage each change belongs to.
 *
 * So a desk's output appears at the step AFTER it: "IDO Final" is the
 * chairperson reading the request and not yet signing, and their signature shows
 * up at "Final Director", because approving is precisely what moved the request
 * to that desk. Getting this off by one makes the walkthrough claim a signature
 * exists while the person who gives it is still deciding.
 */

const DRAFT: DemoStage = {
	icon: FileText,
	key: "draft",
	label: "Draft",
	note: "Nothing has been filed. There is no document number, the requestor's DATE and TIME are empty, and every signature box on the sheet is blank.",
	patch: {},
};

const SUBMITTED: DemoStage = {
	icon: Send,
	key: "submitted",
	label: "Submitted",
	note: "Submitting issues the document number and stamps the requestor's own block - their name, signature, date and time, on the representative row their position selects.",
	patch: {
		documentNumber: "2026-0003",
		masterStatus: "SUBMITTED",
		requestSubmittedAt: FILED_AT,
	},
};

const IDO_EVALUATION: DemoStage = {
	icon: Search,
	key: "ido-evaluation",
	label: "IDO Evaluation",
	note: "The IDO officer is reading it and has not decided yet, so nothing on the sheet changes. Neither Yes nor No is ticked - an untouched pair of boxes is what an open decision looks like on this form.",
	patch: { masterStatus: "UNDER_IDO_REVIEW" },
};

const DIRECTOR_REVIEW: DemoStage = {
	icon: Gavel,
	key: "director-review",
	label: "Director Review",
	note: "IDO recommended it - which is what moved it to this desk - so their half of the sheet fills now: the Yes box, the reason, and the final title and reference the rest of the form is laid out around. The budget check and the Campus Director's FIRST approval happen here and have no cell on TUPC-F-OCD-IDO-01 at all.",
	patch: {
		approverNote: RECOMMEND_NOTE,
		finalTitle: FINAL_TITLE,
		idoEvaluationStatus: "RECOMMENDED_BY_IDO",
		masterStatus: "UNDER_DIRECTOR_REVIEW",
		nameOfBuildingArea: FINAL_TITLE,
		reference: "CDP-2026-003",
	},
};

const IDO_FINAL: DemoStage = {
	icon: ClipboardCheck,
	key: "ido-final",
	label: "IDO Final",
	note: "The IDO Chairperson is holding it now and has not signed yet, so the IDO block is still empty. Nothing on the sheet changes at this step.",
	patch: {
		idoFinalStatus: "UNDER_IDO_FINAL_REVIEW",
		masterStatus: "UNDER_IDO_FINAL_REVIEW",
	},
};

const FINAL_DIRECTOR: DemoStage = {
	icon: ShieldCheck,
	key: "final-director",
	label: "Final Director",
	note: "The chairperson signed - that is what sent it here - so the IDO block fills: name, signature, date and time. The Campus Director is now the one reading it, so their block below is still blank and neither Approved nor Disapproved is ticked.",
	patch: {
		finalDirectorStatus: "UNDER_FINAL_DIRECTOR_APPROVAL",
		idoFinalApproverName: IDO_CHAIRPERSON,
		idoFinalSignedAt: IDO_SIGNED_AT,
		idoFinalStatus: "IDO_FINAL_APPROVED",
		masterStatus: "UNDER_FINAL_DIRECTOR_REVIEW",
	},
};

const COMPLETED: DemoStage = {
	icon: CheckCircle2,
	key: "completed",
	label: "Completed",
	note: "The Campus Director approved and the last block fills: the Approved box, their name, their signature, and the date and time. The requestor's satisfaction form has been answered too, which is what moves the record to Completed - the CSM itself is not part of this document.",
	patch: {
		finalDirectorName: CAMPUS_DIRECTOR,
		finalDirectorSignedAt: DIRECTOR_SIGNED_AT,
		finalDirectorStatus: "APPROVED",
		masterStatus: "COMPLETED",
	},
};

export const PDF_DEMO_SCENARIOS: DemoScenario[] = [
	{
		description: "Filed, recommended, approved by every desk, and closed by the requestor's CSM.",
		key: "happy-path",
		label: "Happy path — Draft to Completed",
		stages: [DRAFT, SUBMITTED, IDO_EVALUATION, DIRECTOR_REVIEW, IDO_FINAL, FINAL_DIRECTOR, COMPLETED],
	},
	{
		description: "IDO sends it back to be fixed. The requestor can edit and submit again under the same number.",
		key: "returned",
		label: "Returned by IDO",
		stages: [
			DRAFT,
			SUBMITTED,
			IDO_EVALUATION,
			{
				icon: Undo2,
				key: "returned",
				label: "Returned",
				note: "The No box is ticked, ACTION shows Resubmit Request, and the reason becomes the instruction. The document number stays - a resubmit keeps it, so the paper copy already filed under it is still the same request.",
				patch: {
					approverNote:
						"Please attach the electrical load computation and a quotation from at least two suppliers, then submit again.",
					idoEvaluationStatus: "RETURNED_TO_REQUESTOR",
					masterStatus: "RETURNED",
				},
			},
		],
	},
	{
		description: "IDO refuses it at the first review. Terminal - the requestor files a new one.",
		key: "rejected-by-ido",
		label: "Rejected by IDO",
		stages: [
			DRAFT,
			SUBMITTED,
			IDO_EVALUATION,
			{
				icon: XCircle,
				key: "rejected",
				label: "Rejected",
				note: "No is ticked and ACTION shows Disapproved - which is what tells this apart from a return on paper, where both otherwise print the same No box and the same reason. The IDO signature block stays empty: a refusal is not a signed instrument.",
				patch: {
					approverNote:
						"Equipment procurement is not an infrastructure request and does not go through IDO. Please file this with the Supply Office instead.",
					idoEvaluationStatus: "REJECTED_BY_IDO",
					masterStatus: "REJECTED_BY_IDO",
				},
			},
		],
	},
	{
		description: "The IDO Chairperson refuses it at their own final review, one desk before the Campus Director.",
		key: "ido-final-rejected",
		label: "Refused at IDO final review",
		stages: [
			DRAFT,
			SUBMITTED,
			IDO_EVALUATION,
			DIRECTOR_REVIEW,
			IDO_FINAL,
			{
				icon: XCircle,
				key: "ido-final-rejected",
				label: "IDO Final Rejected",
				note: "The chairperson refuses, so the IDO half of the sheet shows Disapproved - and their signature block stays EMPTY. That is the pair worth reading together: the ACTION boxes record what a desk decided, the signature block records what they signed, and a refusal is not a signed instrument. The request never reaches the Campus Director, so the block below is untouched.",
				patch: {
					idoFinalStatus: "IDO_FINAL_REJECTED",
					masterStatus: "IDO_FINAL_REJECTED",
				},
			},
		],
	},
	{
		description: "Every desk says yes until the last one. Shows what a refused form prints.",
		key: "final-rejected",
		label: "Refused at final approval",
		stages: [
			DRAFT,
			SUBMITTED,
			IDO_EVALUATION,
			DIRECTOR_REVIEW,
			IDO_FINAL,
			FINAL_DIRECTOR,
			{
				icon: XCircle,
				key: "final-rejected",
				label: "Final Rejected",
				note: "Disapproved is ticked and the Campus Director's block stays blank - a refusal is not a signed instrument, so there is nothing to stamp. The IDO Chairperson's block above KEEPS its signature: they did approve, and a refusal at this desk does not retract the desk before it.",
				patch: {
					finalDirectorStatus: "FINAL_REJECTED",
					masterStatus: "FINAL_REJECTED",
				},
			},
		],
	},
];

/** Stages 0..index folded together, which is the row as it would stand after
 *  that desk had acted. */
export function requestAtStage(scenario: DemoScenario, index: number): RequestPdfData {
	// `Object.assign` into one object rather than a spread inside `reduce`, which
	// allocates a fresh copy of the whole record per stage.
	const request: RequestPdfData = { ...BASE };

	for (const stage of scenario.stages.slice(0, index + 1)) {
		Object.assign(request, stage.patch);
	}

	return request;
}

/**
 * The three images, released on the same rules the server uses.
 *
 * The requestor's arrives when they file - it is on the form from the moment
 * they submit. The other two each wait for their OWN desk, which is what
 * `getSignaturesAsBase64` enforces for real requests: `idoFinalStatus` for the
 * chairperson, `finalDirectorStatus` for the Campus Director. Reproducing the
 * split here is what lets the walkthrough show the sheet filling one desk at a
 * time instead of all at once at the end.
 */
export function signaturesAtStage(request: RequestPdfData): SignaturesBase64 {
	return {
		finalDirectorSignatureBase64: request.finalDirectorStatus === "APPROVED" ? demoSignature(CAMPUS_DIRECTOR) : null,
		idoFinalSignatureBase64: request.idoFinalStatus === "IDO_FINAL_APPROVED" ? demoSignature(IDO_CHAIRPERSON) : null,
		requestorSignatureBase64: request.requestSubmittedAt ? demoSignature(REQUESTOR) : null,
	};
}
