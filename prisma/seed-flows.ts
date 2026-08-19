import type { Prisma, PrismaClient } from "./generated/client";

/**
 * Demo data shaped by `IRMS-old/flows/`, one fixture per documented path.
 *
 * ## The rule this file is built on
 *
 * A flow's **happy path is an action you take**, so its fixture is parked at the
 * stage where that flow's actor is about to act - a request sitting in the queue
 * with the button live. A flow's **alternate path is an outcome you open**, so
 * its fixture is already in the end state the doc describes. Driving a fresh
 * request through five desks every time you want to look at "Rejected by IDO" is
 * the thing this replaces.
 *
 * ## One row often serves two flows
 *
 * The alternates are the same event seen from both sides: flow 01's "Returned by
 * IDO" IS flow 02's "Return to Requestor", and flow 01's "D - rejected later" is
 * whatever flows 03-06 rejected. So `flow-01-a-returned` is 02's A as well, and
 * 01's D is covered by the four late rejections rather than a fifth row. A
 * private row per flow would put four indistinguishable rejections in the
 * requestor's list and teach nothing extra.
 *
 * ## Every fixture is built out of the stages the router actually writes
 *
 * `STAGE_WRITERS` below mirrors the mutations in `request.router.ts` column for
 * column, including the audit entry each one leaves. That is deliberate, and it
 * is the maintenance burden of this file: a seeded row that sets `masterStatus`
 * without the stage column beside it is a request no guard will accept and no
 * stepper can draw, and it fails as "the button is missing" three screens later.
 * When a stage's write changes, change it here too.
 *
 * ## Re-seeding replaces them
 *
 * Every id starts `flow-`, and the seeder deletes that set before recreating it.
 * Nothing else is touched, so a draft written by hand survives a re-seed and the
 * demo still resets.
 */

export interface FlowActor {
	id: string;
	name: string;
	signatureUrl: string;
}

export interface FlowActors {
	budgetOfficer: FlowActor;
	chairperson: FlowActor;
	director: FlowActor;
	idoOfficer: FlowActor;
	requestor: FlowActor;
}

type Stage =
	| "budgetApproved"
	| "budgetRejected"
	| "csmSubmitted"
	| "deferred"
	| "directorApproved"
	| "directorRejected"
	| "finalApproved"
	| "finalRejected"
	| "idoFinalApproved"
	| "idoFinalRejected"
	| "recommended"
	| "rejectedByIdo"
	| "returned"
	| "submitted";

interface StageResult {
	/** The audit entry it leaves. `null` only where the real mutation leaves none. */
	audit: { action: string; actorId: string; note: string | null; toStatus: string } | null;
	/** Columns this stage writes, exactly as the matching mutation writes them. */
	data: Partial<Prisma.RequestUncheckedCreateInput>;
}

interface StageContext {
	actors: FlowActors;
	at: Date;
	documentNumber: string | null;
	finalTitle: string | null;
	note: string | null;
	reference: string | null;
}

/**
 * One writer per stage, mirroring `request.router.ts`.
 *
 * `toStatus` is the MASTER status throughout, which is the correction
 * `applyIdoOutcome` documents: IRMS-old wrote `DRAFT` on a return, and the
 * timeline then read "Submitted -> Draft" for a request whose status was
 * Returned by IDO.
 */
const STAGE_WRITERS: Record<Stage, (ctx: StageContext) => StageResult> = {
	submitted: ({ actors, documentNumber }) => ({
		audit: { action: "SUBMITTED", actorId: actors.requestor.id, note: null, toStatus: "SUBMITTED" },
		data: { documentNumber, idoEvaluationStatus: null, masterStatus: "SUBMITTED" },
	}),

	returned: ({ actors, note }) => ({
		audit: { action: "RETURNED_TO_REQUESTOR", actorId: actors.idoOfficer.id, note, toStatus: "RETURNED" },
		data: { idoEvaluationStatus: "RETURNED_TO_REQUESTOR", masterStatus: "RETURNED" },
	}),

	rejectedByIdo: ({ actors, note }) => ({
		audit: { action: "REJECTED_BY_IDO", actorId: actors.idoOfficer.id, note, toStatus: "REJECTED_BY_IDO" },
		data: { idoEvaluationStatus: "REJECTED_BY_IDO", masterStatus: "REJECTED_BY_IDO" },
	}),

	deferred: ({ actors, note }) => ({
		audit: {
			action: "DEFERRED_TO_NEXT_YEAR_PPMP",
			actorId: actors.idoOfficer.id,
			note,
			toStatus: "FOR_NEXT_YEAR_PPMP",
		},
		data: { idoEvaluationStatus: "FOR_NEXT_YEAR_PPMP", masterStatus: "FOR_NEXT_YEAR_PPMP" },
	}),

	/*
	 * `UNDER_BUDGET_OFFICER_REVIEW`, not `UNDER_DIRECTOR_REVIEW`: the seed creates a
	 * Budget Officer account, and `recommend` routes on whether one exists. Seeding
	 * the other branch would put flow 03 in a queue nothing ever reaches.
	 */
	recommended: ({ actors, at, finalTitle, note, reference }) => ({
		audit: { action: "RECOMMENDED_BY_IDO", actorId: actors.idoOfficer.id, note, toStatus: "UNDER_DIRECTOR_REVIEW" },
		data: {
			approverNote: note,
			directorReviewStatus: "UNDER_BUDGET_OFFICER_REVIEW",
			finalTitle,
			idoEvaluationStatus: "RECOMMENDED_BY_IDO",
			masterStatus: "UNDER_DIRECTOR_REVIEW",
			processor: actors.idoOfficer.name,
			reference,
			requestStartAt: at,
		},
	}),

	/* `masterStatus` deliberately unchanged - an approval here is internal, and the
	 * requestor keeps seeing "Director Review" throughout. */
	budgetApproved: ({ actors, at }) => ({
		audit: {
			action: "APPROVED_BY_BUDGET_OFFICER",
			actorId: actors.budgetOfficer.id,
			note: null,
			toStatus: "UNDER_DIRECTOR_REVIEW",
		},
		data: {
			budgetOfficerSignatureUrl: actors.budgetOfficer.signatureUrl,
			budgetOfficerSignedAt: at,
			directorReviewStatus: "UNDER_DIRECTOR_REVIEW",
		},
	}),

	budgetRejected: ({ actors, note }) => ({
		audit: {
			action: "REJECTED_BY_BUDGET_OFFICER",
			actorId: actors.budgetOfficer.id,
			note,
			toStatus: "BUDGET_OFFICER_REJECTED",
		},
		data: { directorReviewStatus: "BUDGET_OFFICER_REJECTED", masterStatus: "BUDGET_OFFICER_REJECTED" },
	}),

	directorApproved: ({ actors, at }) => ({
		audit: {
			action: "APPROVED_BY_DIRECTOR",
			actorId: actors.director.id,
			note: null,
			toStatus: "UNDER_IDO_FINAL_REVIEW",
		},
		data: {
			directorReviewStatus: "DIRECTOR_APPROVED",
			directorSignatureUrl: actors.director.signatureUrl,
			directorSignedAt: at,
			idoFinalStatus: "UNDER_IDO_FINAL_REVIEW",
			masterStatus: "UNDER_IDO_FINAL_REVIEW",
		},
	}),

	directorRejected: ({ actors, note }) => ({
		audit: { action: "REJECTED_BY_DIRECTOR", actorId: actors.director.id, note, toStatus: "DIRECTOR_REJECTED" },
		data: { directorReviewStatus: "DIRECTOR_REJECTED", masterStatus: "DIRECTOR_REJECTED" },
	}),

	idoFinalApproved: ({ actors, at }) => ({
		audit: {
			action: "IDO_FINAL_APPROVED",
			actorId: actors.chairperson.id,
			note: null,
			toStatus: "UNDER_FINAL_DIRECTOR_REVIEW",
		},
		data: {
			finalDirectorStatus: "UNDER_FINAL_DIRECTOR_APPROVAL",
			idoFinalSignatureUrl: actors.chairperson.signatureUrl,
			idoFinalSignedAt: at,
			idoFinalStatus: "IDO_FINAL_APPROVED",
			masterStatus: "UNDER_FINAL_DIRECTOR_REVIEW",
		},
	}),

	idoFinalRejected: ({ actors, note }) => ({
		audit: { action: "IDO_FINAL_REJECTED", actorId: actors.chairperson.id, note, toStatus: "IDO_FINAL_REJECTED" },
		data: { idoFinalStatus: "IDO_FINAL_REJECTED", masterStatus: "IDO_FINAL_REJECTED" },
	}),

	/* The `Csm` row this stage also creates is written by `writeFixture`, because it
	 * lands in another table. `finalDirectorStatus: "APPROVED"` is the PDF's gate. */
	finalApproved: ({ actors, at }) => ({
		audit: { action: "FINAL_DIRECTOR_APPROVED", actorId: actors.director.id, note: null, toStatus: "APPROVED" },
		data: {
			completionStatus: "CSM_PENDING",
			finalDirectorSignatureUrl: actors.director.signatureUrl,
			finalDirectorSignedAt: at,
			finalDirectorStatus: "APPROVED",
			masterStatus: "APPROVED",
			requestEndAt: at,
		},
	}),

	finalRejected: ({ actors, note }) => ({
		audit: { action: "FINAL_DIRECTOR_REJECTED", actorId: actors.director.id, note, toStatus: "FINAL_REJECTED" },
		data: { finalDirectorStatus: "FINAL_REJECTED", masterStatus: "FINAL_REJECTED" },
	}),

	/* No audit entry, because `csm.submit` writes none. A seeded timeline richer
	 * than the real one would have you demo a history the app cannot produce. */
	csmSubmitted: () => ({
		audit: null,
		data: { completionStatus: "COMPLETED", masterStatus: "COMPLETED" },
	}),
};

interface Fixture {
	csmComment?: string;
	/** The rating the requestor left, for the one fixture past its CSM. */
	csmRating?: number;
	details: string;
	finalTitle?: string;
	/** Which flow doc and which path. The seeder prints these as a walkthrough. */
	flow: string;
	/** `flow-…`, and it shows in the URL during a demo - keep it readable. */
	id: string;
	justification: string;
	/** Per-stage note, where that stage's mutation takes one. */
	notes?: Partial<Record<Stage, string>>;
	priority: string;
	reference?: string;
	/** The stages this request has already been through, in order. */
	through: Stage[];
	title: string;
	typeOfRequest: string;
	workScope: string;
}

const RECOMMEND_NOTE = "Verified against the campus development plan. Endorsed for budget review.";

/**
 * The fixtures, in flow order.
 *
 * Read the `flow` field as the index: every documented path appears exactly once,
 * and a happy path is the one whose `through` stops one stage short of the action
 * its doc asks you to take.
 */
const FIXTURES: Fixture[] = [
	{
		details:
			"The corridor between rooms 201 and 214 has visible peeling on both walls and has not been repainted since 2021.",
		flow: "01 happy path (steps 5-6) - open it and press Submit",
		id: "flow-01-draft",
		justification: "OPERATIONAL_NEED",
		priority: "LOW",
		through: [],
		title: "Repainting of the College of Engineering corridor",
		typeOfRequest: "MINOR_REPAIR",
		workScope: "Surface preparation, priming and two coats of semi-gloss latex on approximately 180 square metres.",
	},
	{
		details: "Evening intramurals are being played under four working fixtures out of twelve.",
		flow: "01 A / 02 A - Returned by IDO. Open it, read the note, fix it and submit again",
		id: "flow-01-a-returned",
		justification: "OPERATIONAL_NEED",
		notes: {
			returned:
				"Please attach the electrical load computation and a quotation from at least two suppliers, then submit again.",
		},
		priority: "MEDIUM",
		through: ["submitted", "returned"],
		title: "Installation of additional lighting at the covered court",
		typeOfRequest: "ADDITION",
		workScope: "Supply and installation of eight LED high-bay fixtures with new circuiting.",
	},
	{
		details: "Request for six laptop units to replace the desktops in the publication office.",
		flow: "01 B / 02 B - Rejected by IDO. Terminal; the requestor files a new one",
		id: "flow-01-b-rejected-ido",
		justification: "NEW_FUNCTIONALITY",
		notes: {
			rejectedByIdo:
				"Equipment procurement is not an infrastructure request and does not go through IDO. Please file this with the Supply Office instead.",
		},
		priority: "MEDIUM",
		through: ["submitted", "rejectedByIdo"],
		title: "Purchase of laptops for the student publication office",
		typeOfRequest: "OTHER",
		workScope: "Procurement of six units with a three-year warranty.",
	},
	{
		details: "Students crossing from the main gate to the Science Building have no cover for roughly 70 metres.",
		flow: "01 C / 02 C - For Next Year PPMP. Valid, but unbudgeted this year",
		id: "flow-01-c-next-year-ppmp",
		justification: "OPERATIONAL_NEED",
		notes: {
			deferred:
				"Valid and supported, but there is no allocation left for new construction this year. Carried to next year's PPMP.",
		},
		priority: "HIGH",
		through: ["submitted", "deferred"],
		title: "Construction of a covered walkway to the Science Building",
		typeOfRequest: "NEW_CONSTRUCTION",
		workScope: "Steel-framed covered walkway with polycarbonate roofing, 70 linear metres.",
	},
	{
		details: "Three of the six cubicles are out of service and the exhaust has failed on the ground floor.",
		flow: "02 happy path - in the IDO Review Queue. Recommend it (or try Return / Reject / Defer)",
		id: "flow-02-submitted",
		justification: "COMPLIANCE",
		priority: "HIGH",
		through: ["submitted"],
		title: "Rehabilitation of the Old Library comfort rooms",
		typeOfRequest: "REHABILITATION",
		workScope: "Replacement of fixtures and piping, retiling, and a new exhaust system for both floors.",
	},
	{
		details: "About 40 metres of the north perimeter fence is down after the last typhoon.",
		flow: "02 happy path (spare) - a second one, so an alternate can be demonstrated live",
		id: "flow-02-submitted-spare",
		justification: "COMPLIANCE",
		priority: "MEDIUM",
		through: ["submitted"],
		title: "Repair of the perimeter fence along the north boundary",
		typeOfRequest: "MINOR_REPAIR",
		workScope: "Re-setting of posts and replacement of damaged cyclone wire along 40 linear metres.",
	},
	{
		details: "The office has no private counselling room, so sessions are held in the shared reception area.",
		finalTitle: "Renovation of the Guidance Office (Phase 1)",
		flow: "03 happy path - in the Budget Review Queue. Approve it",
		id: "flow-03-budget-review",
		justification: "OPERATIONAL_NEED",
		notes: { recommended: RECOMMEND_NOTE },
		priority: "MEDIUM",
		reference: "CDP-2026-014",
		through: ["submitted", "recommended"],
		title: "Renovation of the Guidance Office",
		typeOfRequest: "RENOVATION",
		workScope: "Partitioning for two counselling rooms, new ceiling and electrical rough-in.",
	},
	{
		details: "Request for two split-type units for the faculty lounge on the second floor.",
		finalTitle: "Air-conditioning for the Faculty Lounge",
		flow: "03 A / 01 D - Budget Rejected. Terminal",
		id: "flow-03-a-budget-rejected",
		justification: "OPERATIONAL_NEED",
		notes: {
			budgetRejected: "No allocation under the current PPMP for comfort-related installations. Refile next cycle.",
			recommended: RECOMMEND_NOTE,
		},
		priority: "LOW",
		reference: "CDP-2026-021",
		through: ["submitted", "recommended", "budgetRejected"],
		title: "Air-conditioning for the Faculty Lounge",
		typeOfRequest: "ADDITION",
		workScope: "Supply and installation of two 2.5HP split-type units including electrical provisions.",
	},
	{
		details: "The laboratory floods during heavy rain because the outfall line has collapsed at two points.",
		finalTitle: "Rehabilitation of the Engineering Laboratory drainage",
		flow: "04 happy path - Budget has signed; in the Director Review Queue. Approve it",
		id: "flow-04-director-review",
		justification: "COMPLIANCE",
		notes: { recommended: RECOMMEND_NOTE },
		priority: "HIGH",
		reference: "CDP-2026-008",
		through: ["submitted", "recommended", "budgetApproved"],
		title: "Rehabilitation of the Engineering Laboratory drainage",
		typeOfRequest: "REHABILITATION",
		workScope: "Excavation and replacement of 60 metres of drainage line, with two new catch basins.",
	},
	{
		details: "Request to convert the ground-floor storage room into a student study lounge.",
		finalTitle: "Conversion of the storage room into a study lounge",
		flow: "04 A / 01 D - Director Rejected. Terminal",
		id: "flow-04-a-director-rejected",
		justification: "NEW_FUNCTIONALITY",
		notes: {
			directorRejected: "The room is committed to records storage until the new archive building is turned over.",
			recommended: RECOMMEND_NOTE,
		},
		priority: "LOW",
		reference: "CDP-2026-030",
		through: ["submitted", "recommended", "budgetApproved", "directorRejected"],
		title: "Conversion of the storage room into a study lounge",
		typeOfRequest: "RENOVATION",
		workScope: "Clearing, repainting, new flooring and furniture layout for a 40 square metre room.",
	},
	{
		details: "The roofing has three active leaks over the cookery laboratory and the trusses show corrosion.",
		finalTitle: "Roof replacement at the Home Economics Building",
		flow: "05 happy path - in the Final Review Queue. Sign in as the Chairperson and Approve & Sign",
		id: "flow-05-ido-final-review",
		justification: "COMPLIANCE",
		notes: { recommended: RECOMMEND_NOTE },
		priority: "HIGH",
		reference: "CDP-2026-003",
		through: ["submitted", "recommended", "budgetApproved", "directorApproved"],
		title: "Roof replacement at the Home Economics Building",
		typeOfRequest: "REHABILITATION",
		workScope: "Removal and replacement of 320 square metres of roofing, including truss treatment.",
	},
	{
		details: "Request to extend the motorpool parking by roughly 300 square metres.",
		finalTitle: "Expansion of the motorpool parking area",
		flow: "05 A / 01 D - IDO Final Rejected. Terminal",
		id: "flow-05-a-ido-final-rejected",
		justification: "OPERATIONAL_NEED",
		notes: {
			idoFinalRejected: "The proposed area overlaps the right of way reserved in the approved campus master plan.",
			recommended: RECOMMEND_NOTE,
		},
		priority: "LOW",
		reference: "CDP-2026-036",
		through: ["submitted", "recommended", "budgetApproved", "directorApproved", "idoFinalRejected"],
		title: "Expansion of the motorpool parking area",
		typeOfRequest: "ADDITION",
		workScope: "Site grading, base course and concrete paving of 300 square metres.",
	},
	{
		details: "Pressure at the upper campus drops to nothing by mid-morning on the existing 1.5 inch line.",
		finalTitle: "Upgrading of the campus water distribution line",
		flow: "06 happy path - in the Final Director Approval Queue. Approve & Sign to create the CSM",
		id: "flow-06-final-approval",
		justification: "OPERATIONAL_NEED",
		notes: { recommended: RECOMMEND_NOTE },
		priority: "HIGH",
		reference: "CDP-2026-001",
		through: ["submitted", "recommended", "budgetApproved", "directorApproved", "idoFinalApproved"],
		title: "Upgrading of the campus water distribution line",
		typeOfRequest: "REHABILITATION",
		workScope: "Replacement of 400 metres of distribution line with 3 inch PPR, including two new valves.",
	},
	{
		details: "Request for a decorative welcome arch at the main gate in time for the founding anniversary.",
		finalTitle: "Installation of a decorative arch at the main gate",
		flow: "06 A / 01 D - Director Final Rejected. Terminal, and the last word on the request",
		id: "flow-06-a-final-rejected",
		justification: "OTHER",
		notes: {
			finalRejected: "Deferred indefinitely. Funds are being redirected to the drainage works approved this quarter.",
			recommended: RECOMMEND_NOTE,
		},
		priority: "LOW",
		reference: "CDP-2026-042",
		through: ["submitted", "recommended", "budgetApproved", "directorApproved", "idoFinalApproved", "finalRejected"],
		title: "Installation of a decorative arch at the main gate",
		typeOfRequest: "NEW_CONSTRUCTION",
		workScope: "Fabrication and installation of a steel arch with signage and lighting.",
	},
	{
		details: "The second-floor panel trips daily and the wiring predates the 2009 extension.",
		finalTitle: "Rewiring of the Administration Building second floor",
		flow: "07 happy path - Approved with CSM Pending. Sign in as the requestor and submit the CSM",
		id: "flow-07-csm-pending",
		justification: "COMPLIANCE",
		notes: { recommended: RECOMMEND_NOTE },
		priority: "HIGH",
		reference: "CDP-2026-002",
		through: ["submitted", "recommended", "budgetApproved", "directorApproved", "idoFinalApproved", "finalApproved"],
		title: "Rewiring of the Administration Building second floor",
		typeOfRequest: "REHABILITATION",
		workScope: "Replacement of branch circuits, a new panel board and re-certification of the second floor.",
	},
	{
		csmComment: "Work was finished ahead of schedule and the section was reopened before the intramurals.",
		csmRating: 5,
		details: "Two sections of the wooden bleachers have given way and have been cordoned off since March.",
		finalTitle: "Repair of the Gymnasium bleachers",
		flow: "07 finished - Completed, with all four signatures. Open the PDF",
		id: "flow-07-completed",
		justification: "COMPLIANCE",
		notes: { recommended: RECOMMEND_NOTE },
		priority: "MEDIUM",
		reference: "CDP-2026-006",
		through: [
			"submitted",
			"recommended",
			"budgetApproved",
			"directorApproved",
			"idoFinalApproved",
			"finalApproved",
			"csmSubmitted",
		],
		title: "Repair of the Gymnasium bleachers",
		typeOfRequest: "MINOR_REPAIR",
		workScope: "Replacement of the framing and planking on two bleacher sections, with anti-slip finishing.",
	},
];

/** Where the demo's timeline starts. Each stage lands a day after the one before,
 *  so the audit feed reads as a process rather than a single instant. */
const FIRST_FILED_AT = new Date(Date.UTC(new Date().getFullYear(), 0, 12, 1, 0, 0));
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface SeededFlows {
	/** How many requests were written. */
	count: number;
	/** The highest sequence issued, which `document_sequences` has to agree with. */
	highestSequence: number;
	/** One line per fixture, for the seeder to print as a walkthrough. */
	walkthrough: string[];
}

/**
 * Delete the previous `flow-` set and write it again.
 *
 * The delete order matters: `AuditLog` and `Csm` hold required references to
 * `Request` and neither cascades, so deleting the request first fails on the
 * constraint. `RequestComment` does cascade, and goes with the request.
 */
export async function seedFlows(prisma: PrismaClient, actors: FlowActors): Promise<SeededFlows> {
	const previous = await prisma.request.findMany({
		select: { id: true },
		where: { id: { startsWith: "flow-" } },
	});
	const previousIds = previous.map((row) => row.id);

	if (previousIds.length > 0) {
		await prisma.auditLog.deleteMany({ where: { requestId: { in: previousIds } } });
		await prisma.csm.deleteMany({ where: { requestId: { in: previousIds } } });
		await prisma.request.deleteMany({ where: { id: { in: previousIds } } });
	}

	const year = FIRST_FILED_AT.getUTCFullYear();
	let sequence = 0;
	let filedAt = FIRST_FILED_AT;
	const walkthrough: string[] = [];

	for (const fixture of FIXTURES) {
		// A number is issued at SUBMIT, so a fixture that never left DRAFT has none -
		// which is exactly what `request.submit` would leave.
		const hasNumber = fixture.through.includes("submitted");
		const documentNumber = hasNumber ? `${year}-${String(++sequence).padStart(4, "0")}` : null;

		await writeFixture(prisma, fixture, actors, documentNumber, filedAt);

		walkthrough.push(`${(documentNumber ?? "(draft)").padEnd(11)}${fixture.flow}`);
		filedAt = new Date(filedAt.getTime() + ONE_DAY_MS);
	}

	return { count: FIXTURES.length, highestSequence: sequence, walkthrough };
}

async function writeFixture(
	prisma: PrismaClient,
	fixture: Fixture,
	actors: FlowActors,
	documentNumber: string | null,
	filedAt: Date,
): Promise<void> {
	const data: Prisma.RequestUncheckedCreateInput = {
		attachments: [],
		createdAt: filedAt,
		details: fixture.details,
		id: fixture.id,
		justification: fixture.justification,
		// Where every request starts. The stages below move it from here.
		masterStatus: "DRAFT",
		position: "FACULTY_REPRESENTATIVE",
		priority: fixture.priority,
		requestedBy: actors.requestor.name,
		responsibleOrg: "IDO",
		targetOrg: "IDO",
		title: fixture.title,
		typeOfRequest: fixture.typeOfRequest,
		userId: actors.requestor.id,
		workScope: fixture.workScope,
	};

	// `fromStatus` is null on the first entry, matching `request.create` - there is
	// no previous status to name. Every later entry reads it off the row as it
	// stands, the way each mutation reads it from `existing`.
	const audits: Prisma.AuditLogUncheckedCreateInput[] = [
		{
			action: "CREATED",
			actorId: actors.requestor.id,
			createdAt: filedAt,
			requestId: fixture.id,
			toStatus: "DRAFT",
			updatedAt: filedAt,
		},
	];

	let at = filedAt;
	let csmCreatedAt: Date | null = null;

	for (const stage of fixture.through) {
		at = new Date(at.getTime() + ONE_DAY_MS);

		const fromStatus = data.masterStatus ?? null;
		const { audit, data: patch } = STAGE_WRITERS[stage]({
			actors,
			at,
			documentNumber,
			finalTitle: fixture.finalTitle ?? null,
			note: fixture.notes?.[stage] ?? null,
			reference: fixture.reference ?? null,
		});

		Object.assign(data, patch);

		if (audit) {
			audits.push({ ...audit, createdAt: at, fromStatus, requestId: fixture.id, updatedAt: at });
		}

		if (stage === "finalApproved") {
			csmCreatedAt = at;
		}
	}

	data.updatedAt = at;

	await prisma.request.create({ data });
	await prisma.auditLog.createMany({ data: audits });

	if (csmCreatedAt) {
		const submitted = fixture.through.includes("csmSubmitted");

		await prisma.csm.create({
			data: {
				comment: submitted ? (fixture.csmComment ?? null) : null,
				createdAt: csmCreatedAt,
				rating: submitted ? (fixture.csmRating ?? null) : null,
				requestId: fixture.id,
				// Null until the requestor answers - it is the flag `csm.submit` reads,
				// never the presence of a rating.
				submittedAt: submitted ? at : null,
				updatedAt: at,
			},
		});
	}
}
