import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import {
	budgetApproveSchema,
	budgetRejectSchema,
} from "@/features/budget-review/validations/schema/budget-approver.schema";
import {
	directorApproveSchema,
	directorRejectSchema,
} from "@/features/director-review/validations/schema/director-approver.schema";
import {
	idoDeferSchema,
	idoRecommendSchema,
	idoRejectSchema,
	idoReturnSchema,
} from "@/features/ido-review/validations/schema/ido-approver.schema";
import {
	createRequestSchema,
	saveDraftRequestSchema,
	submitRequestSchema,
} from "@/features/request-form/validations/schema/request.schema";
import { assertPermission, hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { assertCanReadRequest } from "@/lib/request-access";
import {
	BUDGET_ACTIONABLE_DIRECTOR_STATUS,
	directorReviewStatusMap,
	isDirectorApprovableStatus,
	isDirectorRejectableStatus,
	isEditableStatus,
	isIdoActionableStatus,
	masterStatusMap,
	PENDING_STATUSES,
	REJECTED_STATUSES,
	STATUS_GROUPS,
} from "@/lib/status-maps/request-status";
import type { RequestWhereInput } from "../../../../prisma/generated/models.ts";
import { protectedProcedure, roleProcedure } from "../init";

/**
 * Issue the next document number for the current year, as `YYYY-NNNN`.
 *
 * The upsert and the increment are one statement inside a transaction, never a
 * read-then-write: two people submitting in the same second must come out with
 * two different numbers, and a `findUnique` followed by an `update` gives them
 * the same one. The upsert also covers the year rollover for free - January's
 * first submit creates that year's row with `lastSequence: 1`.
 *
 * Exported as a plain helper as well as a procedure, because `request.submit`
 * calls it inline rather than over the wire.
 */
export async function generateDocumentNumber(): Promise<string> {
	const year = new Date().getFullYear();

	const sequence = await prisma.$transaction(async (tx) =>
		tx.documentSequence.upsert({
			where: { year },
			create: { year, lastSequence: 1 },
			update: { lastSequence: { increment: 1 } },
		}),
	);

	const padded = String(sequence.lastSequence).padStart(4, "0");
	return `${year}-${padded}`;
}

/**
 * What a row in the requestor's list actually needs.
 *
 * Explicit rather than the whole model: a `Request` carries four signature URLs,
 * an attachments blob and six per-stage status columns, none of which a six-column
 * table renders. Sending them anyway puts a reviewer's signature URL into the
 * payload of a page that has no business holding one.
 */
const REQUEST_ROW_SELECT = {
	createdAt: true,
	documentNumber: true,
	id: true,
	masterStatus: true,
	priority: true,
	title: true,
	typeOfRequest: true,
} as const;

/**
 * What one request's own page needs.
 *
 * Explicit for the reason `REQUEST_ROW_SELECT` is, and narrower than the model
 * in one direction that matters: the eight reviewer signature columns are NOT
 * here. They are stamped onto the printed form (spec 016) and belong to whatever
 * renders it; a detail page that never draws a signature has no reason to hold
 * four reviewers' signature URLs in a payload the browser keeps.
 *
 * `userId` IS here, and it is not decoration - the page decides whether to offer
 * Edit, Submit and the CSM banner by comparing it to the session, and a staff
 * reader must get none of them.
 */
const REQUEST_DETAIL_SELECT = {
	approverNote: true,
	attachments: true,
	completionStatus: true,
	createdAt: true,
	details: true,
	documentNumber: true,
	finalTitle: true,
	id: true,
	idoEvaluationStatus: true,
	justification: true,
	masterStatus: true,
	position: true,
	priority: true,
	processor: true,
	// The IDO's own two columns, and they belong to the DETAIL payload rather than
	// to a review-only query: the requestor's page prints the reference beside the
	// document number once one is issued, and the review page (spec 010) has to
	// show a reviewer what an earlier reviewer already decided.
	reference: true,
	requestedBy: true,
	title: true,
	typeOfRequest: true,
	updatedAt: true,
	userId: true,
	workScope: true,
} as const;

const myListInputSchema = z.object({
	masterStatus: z.string().optional(),
	page: z.number().int().min(1).default(1),
	// Capped, not merely defaulted. Without the max a caller asks for 100000 and
	// turns a paginated endpoint into a full table scan it will happily serve.
	pageSize: z.number().int().min(1).max(100).default(10),
	search: z.string().optional(),
	// An enum of one rather than a string: `sortBy` becomes an ORDER BY column
	// name, and the only safe way to accept one from a client is a fixed list.
	sortBy: z.enum(["createdAt"]).optional(),
	sortDir: z.enum(["asc", "desc"]).optional(),
});

/**
 * The row as the two write procedures need to see it before they touch it.
 *
 * Read in one query and checked in one place, because the order of the checks is
 * the security: ownership is asserted before the status is reported, so a caller
 * probing another person's request cannot learn from the error message whether
 * it exists, let alone what stage it has reached.
 */
async function loadOwnEditableRequest(id: string, userId: string, verb: "edited" | "submitted") {
	const existing = await prisma.request.findUnique({
		where: { id },
		select: { documentNumber: true, masterStatus: true, userId: true },
	});

	if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });

	// FORBIDDEN rather than NOT_FOUND, deliberately: the row exists, and the two
	// answers are indistinguishable to an honest caller who mistyped an id.
	if (existing.userId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

	if (!isEditableStatus(existing.masterStatus)) {
		// The status is NAMED, not merely refused. This error is what an edit page
		// left open on a request somebody else has since acted on gets back (spec
		// 007), and it is shown there as a banner - "cannot be edited in its
		// current status" leaves the requestor with no idea what happened, while
		// "(IDO Review)" tells them who has it now. `masterStatusMap` is the same
		// label the chip shows, so the banner and the page agree.
		const label = masterStatusMap[existing.masterStatus]?.label ?? existing.masterStatus;

		throw new TRPCError({
			code: "FORBIDDEN",
			message: `Request cannot be ${verb} in its current status (${label})`,
		});
	}

	return existing;
}

/* -------------------------------------------------------------------------- */
/* The staff queue - spec 009                                                  */

/**
 * The first IDO stage, which BOTH IDO desks answer for.
 *
 * Named once and spread into the two roles below rather than written twice: the
 * chairperson's queue is the officer's queue plus the final-review stage, and
 * two copies of the first half is how a status added to one desk quietly goes
 * missing from the other.
 */
const IDO_FIRST_STAGE_SCOPE: RequestWhereInput[] = [
	{ masterStatus: "SUBMITTED" },
	{
		idoEvaluationStatus: {
			in: ["UNDER_IDO_REVIEW", "RECOMMENDED_BY_IDO", "RETURNED_TO_REQUESTOR", "REJECTED_BY_IDO", "FOR_NEXT_YEAR_PPMP"],
		},
	},
];

/**
 * Every request a desk has a stake in - what it can act on now, PLUS what it has
 * already finished with.
 *
 * ## One OR, never two queries
 *
 * The chairperson and the director each appear at two stages, and a request can
 * legitimately match both clauses at once - a director's request sitting at
 * IDO-final still carries `directorReviewStatus: DIRECTOR_APPROVED`. Unioning
 * two queries would list it twice and count it twice; a single `OR` inside one
 * `where` is what makes the row appear once.
 *
 * ## History stays in scope
 *
 * `budgetOfficerSignedAt: { not: null }` is not decoration. A budget officer's
 * approved request moves on to the director the moment they sign it, and without
 * that clause their own signed work vanishes from their screen the instant they
 * finish it - which is the point at which they most want to look at it again.
 *
 * The destination pages this scope feeds must therefore render READ-ONLY for a
 * request the role has already handled rather than refusing it. That refusal is
 * exactly what IRMS-old logged as "Request is not available for IDO review".
 */
const STAFF_QUEUE_SCOPE = {
	BUDGET_OFFICER: [
		{ directorReviewStatus: { in: ["UNDER_BUDGET_OFFICER_REVIEW", "BUDGET_OFFICER_REJECTED"] } },
		{ budgetOfficerSignedAt: { not: null } },
	],
	DIRECTOR: [
		{ directorReviewStatus: { in: ["UNDER_DIRECTOR_REVIEW", "DIRECTOR_APPROVED", "DIRECTOR_REJECTED"] } },
		{ finalDirectorStatus: { in: ["UNDER_FINAL_DIRECTOR_APPROVAL", "APPROVED", "FINAL_REJECTED"] } },
	],
	IDO_CHAIRPERSON: [
		...IDO_FIRST_STAGE_SCOPE,
		{ idoFinalStatus: { in: ["UNDER_IDO_FINAL_REVIEW", "IDO_FINAL_APPROVED", "IDO_FINAL_REJECTED"] } },
	],
	IDO_OFFICER: IDO_FIRST_STAGE_SCOPE,
} satisfies Record<string, RequestWhereInput[]>;

/**
 * The four desks. The `roleProcedure` on both queue procedures is built from
 * these keys, so the gate and the scope map cannot name different sets of roles.
 */
type StaffRole = keyof typeof STAFF_QUEUE_SCOPE;

const STAFF_QUEUE_ROLES = Object.keys(STAFF_QUEUE_SCOPE) as StaffRole[];

/**
 * The subset of the scope this desk can act on RIGHT NOW - the "Waiting on you"
 * tile, and the `stage=waiting` filter behind it.
 *
 * "Handled" is deliberately defined as the scope MINUS this rather than as a
 * third list. Written out separately the two would eventually stop partitioning
 * the queue, and the visible failure - a request in neither tile, or counted in
 * both - is a staff member's counters disagreeing with their own table.
 */
const STAFF_WAITING_SCOPE = {
	BUDGET_OFFICER: [{ directorReviewStatus: "UNDER_BUDGET_OFFICER_REVIEW" }],
	DIRECTOR: [
		{ directorReviewStatus: "UNDER_DIRECTOR_REVIEW" },
		{ finalDirectorStatus: "UNDER_FINAL_DIRECTOR_APPROVAL" },
	],
	IDO_CHAIRPERSON: [
		{ masterStatus: { in: ["SUBMITTED", "UNDER_IDO_REVIEW"] } },
		{ idoFinalStatus: "UNDER_IDO_FINAL_REVIEW" },
	],
	IDO_OFFICER: [{ masterStatus: { in: ["SUBMITTED", "UNDER_IDO_REVIEW"] } }],
} satisfies Record<StaffRole, RequestWhereInput[]>;

/**
 * Narrows `ctx.user.role` to the four keys above.
 *
 * `roleProcedure` is the GATE and has already thrown for anybody else; this is
 * the type system catching up with it, and the throw at each call site is
 * unreachable by design. Indexing the map with an unnarrowed `Role` instead
 * would need a cast, and a cast is what turns a seventh role added to the enum
 * from a compile error into an `undefined` scope - which is a `where` of
 * `{ OR: undefined }`, i.e. every request in the system.
 */
function isStaffRole(role: string): role is StaffRole {
	return role in STAFF_QUEUE_SCOPE;
}

/**
 * Thrown where `isStaffRole` fails. The same message `roleProcedure` uses,
 * because it is the same refusal arriving one layer later.
 */
function notStaffError() {
	return new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
}

/**
 * What a row in the staff queue needs.
 *
 * The six visible columns, plus `idoFinalStatus` and `finalDirectorStatus` -
 * which are never rendered. They are what `resolveReviewRoute` reads to decide
 * WHERE a row click goes, and dropping them from the payload silently sends
 * every chairperson to the first-stage review page.
 */
const STAFF_ROW_SELECT = {
	createdAt: true,
	documentNumber: true,
	finalDirectorStatus: true,
	id: true,
	idoFinalStatus: true,
	masterStatus: true,
	priority: true,
	title: true,
	typeOfRequest: true,
} as const;

const staffListInputSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(10),
	priority: z.string().optional(),
	search: z.string().optional(),
	/**
	 * Which half of the queue: what is waiting on this desk, or what it has
	 * finished with. Absent is both - the whole role scope.
	 */
	stage: z.enum(["handled", "waiting"]).optional(),
	status: z.string().optional(),
});

type StaffListInput = z.infer<typeof staffListInputSchema>;

/**
 * The role scope, ANDed with whatever the caller asked for.
 *
 * The AND is the security. Every filter is pushed as an ADDITIONAL condition
 * beside the role clause, never in place of it, so a `status=DRAFT` from a budget
 * officer narrows their queue to nothing rather than reaching a draft that never
 * left the requestor's desk. Building `where` as `{ ...roleScope, ...filters }` -
 * the shape this reads as if you skim it - would let a `masterStatus` key in the
 * filters overwrite the one in the scope, and that is the whole leak.
 */
function staffQueueWhere(role: StaffRole, input: Omit<StaffListInput, "page" | "pageSize">): RequestWhereInput {
	const search = input.search?.trim();
	const waiting: RequestWhereInput = { OR: STAFF_WAITING_SCOPE[role] };
	const conditions: RequestWhereInput[] = [{ OR: STAFF_QUEUE_SCOPE[role] }];

	if (input.stage === "waiting") conditions.push(waiting);
	if (input.stage === "handled") conditions.push({ NOT: waiting });
	if (input.status) conditions.push({ masterStatus: input.status });
	if (input.priority) conditions.push({ priority: input.priority });

	if (search) {
		conditions.push({
			OR: [
				{ title: { contains: search, mode: "insensitive" } },
				// Insensitive on a numeric-looking column for the reason `myList` gives:
				// `YYYY-NNNN` is one letter suffix away from needing it.
				{ documentNumber: { contains: search, mode: "insensitive" } },
			],
		});
	}

	return { AND: conditions };
}

/* -------------------------------------------------------------------------- */
/* The IDO first review - spec 010                                             */

/**
 * The two desks that answer for the FIRST IDO stage.
 *
 * Named once and spread into all four `roleProcedure` calls below AND read by
 * `getById` to decide `canReview`, so the gate and the flag the browser draws
 * its buttons from cannot name different sets of roles. The chairperson is here
 * because they may do an ordinary officer's review; the reverse is not true, and
 * the final review (spec 013) is a separate list.
 */
const IDO_REVIEW_ROLES = ["IDO_OFFICER", "IDO_CHAIRPERSON"] as const;

function isIdoReviewRole(role: string): boolean {
	return (IDO_REVIEW_ROLES as readonly string[]).includes(role);
}

/**
 * The reviewer's name as it is stamped onto the request and printed on the form.
 *
 * From `firstname`/`lastname` rather than from `name`, for the reason `create`
 * gives: those two are the fields the printed form is laid out for, and `name` is
 * a display string the user can put anything into. The fallback exists only for
 * an account that predates the profile fields - a blank processor reads as "not
 * yet assigned" on the requestor's side rail, which would be a lie about a
 * request that has been recommended.
 */
function reviewerName(user: { firstname?: string | null; lastname?: string | null; name?: string | null }): string {
	const composed = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();

	return composed || (user.name ?? "IDO");
}

/**
 * The three checks every one of the four IDO actions shares, in the order the
 * spec's guard list names them: grant, existence, stage.
 *
 * ## Why the grant comes first here, and last in `comment.create`
 *
 * The comment router checks access before the grant so a caller who cannot read
 * a request cannot learn from the error that there is a request to read. That
 * concern does not exist on this path: `roleProcedure` has already established
 * the caller is an IDO desk, and both IDO roles are in `REQUEST_READER_ROLES` -
 * they may read every request in the system. So the order carries no information
 * and the cheaper check runs first.
 *
 * ## Why the status is NAMED in the refusal
 *
 * This error is what a review page left open on a request a colleague has since
 * acted on gets back, and "not at the IDO review stage" leaves the officer with
 * no idea what happened. `masterStatusMap` is the same label the chip shows, so
 * the message and the page agree about where the request went.
 *
 * `requestStartAt` is selected because `recommend` needs it and the other three
 * do not care - one query rather than a second read on the one path that does.
 */
async function loadIdoActionableRequest(id: string, userId: string) {
	await assertPermission(userId, "REVIEW_REQUEST");

	const existing = await prisma.request.findUnique({
		where: { id },
		select: { masterStatus: true, requestStartAt: true },
	});

	if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });

	if (!isIdoActionableStatus(existing.masterStatus)) {
		const label = masterStatusMap[existing.masterStatus]?.label ?? existing.masterStatus;

		throw new TRPCError({
			code: "FORBIDDEN",
			message: `This request is not at the IDO review stage (${label})`,
		});
	}

	return existing;
}

/**
 * The three outcomes that are one status pair plus one audit entry.
 *
 * A map rather than three near-identical procedure bodies, because the ONLY
 * thing that differs between returning, rejecting and deferring is which three
 * strings get written - and three copies of the transaction is how one of them
 * ends up writing the audit log outside it. Note that `masterStatus` and
 * `idoEvaluationStatus` are separate keys rather than one: a return sets
 * `RETURNED` on the first and `RETURNED_TO_REQUESTOR` on the second, and the
 * other two happen to agree.
 *
 * `toStatus` is the master status, deliberately. IRMS-old wrote `DRAFT` here on a
 * return, which made the timeline read "Submitted -> Draft" for a request whose
 * status is Returned by IDO - the audit log disagreeing with the row it describes.
 */
const IDO_OUTCOMES = {
	defer: {
		action: "DEFERRED_TO_NEXT_YEAR_PPMP",
		idoEvaluationStatus: "FOR_NEXT_YEAR_PPMP",
		masterStatus: "FOR_NEXT_YEAR_PPMP",
	},
	reject: {
		action: "REJECTED_BY_IDO",
		idoEvaluationStatus: "REJECTED_BY_IDO",
		masterStatus: "REJECTED_BY_IDO",
	},
	return: {
		action: "RETURNED_TO_REQUESTOR",
		idoEvaluationStatus: "RETURNED_TO_REQUESTOR",
		masterStatus: "RETURNED",
	},
} as const;

/**
 * Write one of the three outcomes, and its audit entry, in one transaction.
 *
 * One transaction and not two writes: the audit log is the only history this app
 * has, and a request that changed status with no entry saying who changed it is
 * a record nobody can account for. The reverse - an entry for a status change
 * that never committed - is worse, because the timeline then reports a decision
 * that was never taken.
 */
async function applyIdoOutcome(
	outcome: keyof typeof IDO_OUTCOMES,
	{ actorId, fromStatus, id, note }: { actorId: string; fromStatus: string; id: string; note?: string },
) {
	const { action, idoEvaluationStatus, masterStatus } = IDO_OUTCOMES[outcome];

	return await prisma.$transaction(async (tx) => {
		const request = await tx.request.update({
			where: { id },
			data: { idoEvaluationStatus, masterStatus },
			select: { id: true, idoEvaluationStatus: true },
		});

		await tx.auditLog.create({
			data: { action, actorId, fromStatus, note: note ?? null, requestId: id, toStatus: masterStatus },
		});

		return request;
	});
}

/* -------------------------------------------------------------------------- */
/* The budget officer review - spec 011                                        */

/**
 * The conditional stage's guard, shared by both of its actions.
 *
 * ## Why it reads `directorReviewStatus` and never `masterStatus`
 *
 * `masterStatus` is `UNDER_DIRECTOR_REVIEW` for the budget desk AND for the
 * director's own desk - the requestor is told "the approvers have it" and
 * nothing finer, which is the whole reason `recommend` sets it once and this
 * stage leaves it alone. Guarding on it would therefore make the two stages
 * indistinguishable, and the concrete failure is not theoretical: a budget
 * officer would still be able to stamp a signature onto a request the Campus
 * Director had already approved and moved on.
 *
 * ## Why exactly one status, when the director's guard takes two
 *
 * The two-approver race is intended. `approveByDirector` (spec 012) accepts
 * `UNDER_BUDGET_OFFICER_REVIEW` OR `UNDER_DIRECTOR_REVIEW`, so the director can
 * approve past an open budget stage; this accepts only the first, so once the
 * director has acted the budget desk cannot. The asymmetry IS the rule - see
 * `BUDGET_ACTIONABLE_DIRECTOR_STATUS`.
 *
 * ## The grant, and why it is checked here rather than by the role
 *
 * `roleProcedure("BUDGET_OFFICER")` says what the caller IS. `APPROVE_BUDGET` is
 * a per-user grant an admin can revoke without touching the role, so the role
 * alone is not the answer - see `ROLE_DEFAULT_PERMISSIONS`. Checked first, for
 * the reason `loadIdoActionableRequest` gives: `roleProcedure` has already
 * established this is a budget desk and every budget desk may read every
 * request, so the order leaks nothing and the cheaper check runs first.
 *
 * The refusal NAMES the stage, because this error is what a page left open on a
 * request the director has since approved gets back, and "not at the budget
 * review stage" leaves the officer with no idea where it went.
 */
async function loadBudgetActionableRequest(id: string, userId: string) {
	await assertPermission(userId, "APPROVE_BUDGET");

	const existing = await prisma.request.findUnique({
		where: { id },
		select: { directorReviewStatus: true, masterStatus: true },
	});

	if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });

	if (existing.directorReviewStatus !== BUDGET_ACTIONABLE_DIRECTOR_STATUS) {
		const label = existing.directorReviewStatus
			? (directorReviewStatusMap[existing.directorReviewStatus]?.label ?? existing.directorReviewStatus)
			: (masterStatusMap[existing.masterStatus]?.label ?? existing.masterStatus);

		throw new TRPCError({
			code: "FORBIDDEN",
			message: `This request is not at the budget review stage (${label})`,
		});
	}

	return existing;
}

/* -------------------------------------------------------------------------- */
/* The director's FIRST approval - spec 012                                    */

/**
 * The director's stage guard, and the one place its asymmetry is written down.
 *
 * ## Two stages for approving, one for rejecting
 *
 * `mode` is not a convenience. Approving accepts `UNDER_BUDGET_OFFICER_REVIEW`
 * as well as `UNDER_DIRECTOR_REVIEW`, because the Campus Director may approve
 * past an open budget stage and end it - that is the documented two-scenario
 * routing. Rejecting accepts only `UNDER_DIRECTOR_REVIEW`, so a request cannot
 * be killed at a stage it has not reached: while the budget desk still holds
 * it, the director has not been asked the question yet.
 *
 * The two predicates live in `request-status.ts` beside
 * `BUDGET_ACTIONABLE_DIRECTOR_STATUS`, because the three constants only make
 * sense together - and unifying any two of them breaks the intended race in the
 * direction nothing on screen reports. This function takes a `mode` rather than
 * a status list so a third caller cannot invent a fourth rule.
 *
 * ## Why it reads `directorReviewStatus` and never `masterStatus`
 *
 * `masterStatus` is `UNDER_DIRECTOR_REVIEW` for the budget desk AND for this
 * one, so it cannot tell the two sub-stages apart. Guarding on it would let a
 * director reject a request the budget officer is still holding, which is the
 * exact case the asymmetry above exists to refuse.
 *
 * ## The grant, and the order
 *
 * `roleProcedure("DIRECTOR")` says what the caller IS; `APPROVE_DIRECTOR` is a
 * per-user grant an admin can revoke without touching the role. Checked first
 * for the reason `loadIdoActionableRequest` gives: the role gate has already
 * established this is a director and every director may read every request, so
 * the order leaks nothing and the cheaper check runs first.
 *
 * The refusal NAMES the stage. This error is what a page left open on a request
 * a colleague has since moved gets back, and "not at the director review stage"
 * alone leaves the director with no idea where it went.
 */
async function loadDirectorActionableRequest(id: string, userId: string, mode: "approve" | "reject") {
	await assertPermission(userId, "APPROVE_DIRECTOR");

	const existing = await prisma.request.findUnique({
		where: { id },
		select: { directorReviewStatus: true, masterStatus: true },
	});

	if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });

	const isActionable =
		mode === "approve"
			? isDirectorApprovableStatus(existing.directorReviewStatus)
			: isDirectorRejectableStatus(existing.directorReviewStatus);

	if (!isActionable) {
		const label = existing.directorReviewStatus
			? (directorReviewStatusMap[existing.directorReviewStatus]?.label ?? existing.directorReviewStatus)
			: (masterStatusMap[existing.masterStatus]?.label ?? existing.masterStatus);

		throw new TRPCError({
			code: "FORBIDDEN",
			message: `This request is not at the director review stage (${label})`,
		});
	}

	return existing;
}

export const requestRouter = {
	generateDocumentNumber: protectedProcedure.mutation(async () => {
		const documentNumber = await generateDocumentNumber();
		return { documentNumber };
	}),

	/**
	 * File a new DRAFT.
	 *
	 * ## What the client is not allowed to decide
	 *
	 * `userId`, `requestedBy`, `position`, `targetOrg` and `responsibleOrg` are
	 * all written from the session or from a constant, and the input's copies of
	 * the middle two are ignored. The form shows them so the requestor can see
	 * what will be printed; treating them as data would let a crafted payload file
	 * a request in somebody else's name, over somebody else's signature row.
	 *
	 * ## Why the position check is not the permission check
	 *
	 * They fail for different reasons and the user can only act on one of them. A
	 * missing position is a profile they can go and fix; a missing grant is an
	 * administrator they have to go and ask. Both run before anything is written.
	 */
	create: protectedProcedure.input(createRequestSchema).mutation(async ({ ctx, input }) => {
		const { user } = ctx;

		if (!user.position) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Please set your position in your profile before creating a request",
			});
		}

		await assertPermission(user.id, "CREATE_REQUEST");

		// From `firstname`/`lastname` rather than from `name`, because those two are
		// the fields the printed form is laid out for and `name` is a display string
		// the user can put anything into.
		const requestedBy = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();

		return await prisma.$transaction(async (tx) => {
			const request = await tx.request.create({
				data: {
					...input,
					masterStatus: "DRAFT",
					position: user.position ?? input.position,
					requestedBy: requestedBy || input.requestedBy,
					responsibleOrg: "IDO",
					targetOrg: "IDO",
					userId: user.id,
				},
				select: { id: true, masterStatus: true },
			});

			// In the SAME transaction as the row. The audit log is the only history
			// this app has, and a request that exists with no CREATED entry is a
			// record whose beginning nobody can account for.
			await tx.auditLog.create({
				data: { action: "CREATED", actorId: user.id, requestId: request.id, toStatus: "DRAFT" },
			});

			return request;
		});
	}),

	/**
	 * Update an editable request in place.
	 *
	 * No audit log, and that is a decision rather than an omission: an edit is not
	 * a lifecycle event. Logging every keystroke-level save would bury the six
	 * entries - created, submitted, reviewed, approved - that the history exists to
	 * show.
	 *
	 * `requestedBy` is rewritten from the session for the same reason `create`
	 * does it, and it has to happen here too: a payload that could not name
	 * somebody else at creation could otherwise do it one save later. `position`
	 * is NOT - a requestor may genuinely change which representative row they
	 * sign, and it is gated by the enum rather than by the session.
	 */
	saveDraft: protectedProcedure.input(saveDraftRequestSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;
		const { user } = ctx;

		await loadOwnEditableRequest(id, user.id, "edited");

		const requestedBy = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();

		return await prisma.request.update({
			where: { id },
			data: { ...data, requestedBy: requestedBy || data.requestedBy },
			select: { id: true, masterStatus: true },
		});
	}),

	/**
	 * Send it to IDO.
	 *
	 * The document number is issued only when there is not one already. A RETURNED
	 * request has been printed, filed and referred to by its number - reissuing on
	 * the resubmit would leave two numbers naming one request, and the paper copy
	 * would be the one that is wrong.
	 *
	 * The SUBMITTED audit entry's `createdAt` is what the PDF prints as the date
	 * and time of filing (spec 016), which is why it is written here rather than
	 * derived from the row's `updatedAt` - that moves every time anybody touches
	 * the request afterwards.
	 *
	 * `idoEvaluationStatus` is CLEARED on the way through, and the only status it
	 * can be holding here is `RETURNED_TO_REQUESTOR` - the other three are
	 * terminal and none of them leave the request editable. Leaving it set puts
	 * the request back in IDO's queue still flagged as returned: the officer
	 * opens a fresh submission and reads their own three-week-old verdict on it,
	 * and the stepper draws a stage the request has already left.
	 */
	submit: protectedProcedure.input(submitRequestSchema).mutation(async ({ ctx, input }) => {
		const { id } = input;
		const { user } = ctx;

		const existing = await loadOwnEditableRequest(id, user.id, "submitted");

		await assertPermission(user.id, "SUBMIT_REQUEST");

		const documentNumber = existing.documentNumber ?? (await generateDocumentNumber());

		return await prisma.$transaction(async (tx) => {
			const request = await tx.request.update({
				where: { id },
				data: { documentNumber, idoEvaluationStatus: null, masterStatus: "SUBMITTED" },
				select: { documentNumber: true, id: true, masterStatus: true },
			});

			await tx.auditLog.create({
				data: {
					action: "SUBMITTED",
					actorId: user.id,
					fromStatus: existing.masterStatus,
					requestId: id,
					toStatus: "SUBMITTED",
				},
			});

			return request;
		});
	}),

	/**
	 * One request, with its history, for the page that shows it.
	 *
	 * ## Five roles read this and one does not
	 *
	 * The owner, plus the four desks in `REQUEST_READER_ROLES`. The rule and the
	 * order of its two checks live in `assertCanReadRequest` (spec 008) rather
	 * than here, because the comment thread hangs off this request and has to
	 * inherit the same visibility exactly - see the note there.
	 *
	 * A staff member following a link from their queue gets the same read the
	 * requestor gets, and no action - the page offers Edit, Submit and the CSM
	 * banner to the owner only, and `saveDraft`/`submit` re-check ownership
	 * themselves regardless.
	 *
	 * The audit logs come back OLDEST-FIRST, which the client relies on twice: the
	 * feed renders a process moving forwards, and `latestNegativeLog` walks the
	 * array backwards to find the complaint the requestor has to answer.
	 */
	getById: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
		const { user } = ctx;

		/*
		 * Who is told about the sub-stage, in two flags rather than one.
		 *
		 * `directorReviewStatus` and the budget desk's stamp go to BOTH approver
		 * desks: the budget officer acts on them, and the director has to be told
		 * whether the budget officer has signed before approving past them - that is
		 * the whole subject of spec 012's approval trail. The REQUESTOR is told
		 * neither. `masterStatus` says "Director Review" for both sub-stages, which
		 * is the design, and putting these in `REQUEST_DETAIL_SELECT` would hand the
		 * requestor the distinction the column exists to hide.
		 *
		 * The director's own stamp is narrower still - only their desk draws it.
		 * Everything guarded by these two is REDACTED below rather than left out of
		 * the query, so there is one place that decides who sees what.
		 */
		const isBudgetDesk = user.role === "BUDGET_OFFICER";
		const isDirectorDesk = user.role === "DIRECTOR";
		const isApproverDesk = isBudgetDesk || isDirectorDesk;

		const [request, canReview, canApproveBudget, canApproveDirector] = await Promise.all([
			prisma.request.findUnique({
				where: { id: input.id },
				select: {
					...REQUEST_DETAIL_SELECT,
					/*
					 * The five columns the two approver pages cannot be drawn without,
					 * selected here rather than added to `REQUEST_DETAIL_SELECT` for the
					 * reason the flags above give: that payload also goes to the requestor,
					 * and a reviewer's signature URL has no business in a page that never
					 * draws one.
					 *
					 * The director pair is what makes spec 012's page read-only AFTER the
					 * approval - "you approved this on 3 March" over the signature that was
					 * actually stamped, rather than over whatever is on the profile today.
					 */
					budgetOfficerSignatureUrl: true,
					budgetOfficerSignedAt: true,
					directorReviewStatus: true,
					directorSignatureUrl: true,
					directorSignedAt: true,
					auditLogs: {
						select: {
							action: true,
							actor: { select: { firstname: true, id: true, lastname: true, role: true } },
							createdAt: true,
							fromStatus: true,
							id: true,
							note: true,
							toStatus: true,
						},
						orderBy: { createdAt: "asc" },
					},
				},
			}),
			/*
			 * Both halves of the IDO gate - the role AND the grant - answered for the
			 * browser, for the reason `comment.list` sends `canComment`: the session
			 * carries a role, and `REVIEW_REQUEST` is a per-user grant an admin can
			 * revoke without touching it, so there is no other way for the page to
			 * learn that its four buttons would all answer FORBIDDEN.
			 *
			 * Only looked up for the two IDO desks. A requestor, a director or a
			 * budget officer cannot act at this stage whatever grants they hold, so
			 * paying an indexed read on every detail-page load to be told `false`
			 * would be a round trip that changes nothing.
			 *
			 * It decides nothing. All four procedures re-check the grant themselves.
			 */
			isIdoReviewRole(user.role) ? hasPermission(user.id, "REVIEW_REQUEST") : Promise.resolve(false),
			/*
			 * The same courtesy for the budget desk's `APPROVE_BUDGET` grant, looked
			 * up only for the one role that could ever act on it. It decides nothing -
			 * `loadBudgetActionableRequest` re-checks it on both procedures.
			 */
			isBudgetDesk ? hasPermission(user.id, "APPROVE_BUDGET") : Promise.resolve(false),
			/*
			 * And the same for the director's `APPROVE_DIRECTOR` grant. The DIRECTOR
			 * role appears at two stages of the workflow and holds one grant across
			 * both, so this single flag answers for this page and for spec 014.
			 *
			 * It decides nothing - `loadDirectorActionableRequest` re-checks it on
			 * both procedures.
			 */
			isDirectorDesk ? hasPermission(user.id, "APPROVE_DIRECTOR") : Promise.resolve(false),
		]);

		assertCanReadRequest(request, user);

		const {
			budgetOfficerSignatureUrl,
			budgetOfficerSignedAt,
			directorReviewStatus,
			directorSignatureUrl,
			directorSignedAt,
			...rest
		} = request;

		return {
			...rest,
			/*
			 * `null` for everybody else, not absent: an optional key would make the
			 * inferred type a union the review pages would have to narrow, and a
			 * requestor's page reads none of these five.
			 */
			budgetOfficerSignatureUrl: isApproverDesk ? budgetOfficerSignatureUrl : null,
			budgetOfficerSignedAt: isApproverDesk ? budgetOfficerSignedAt : null,
			canApproveBudget,
			canApproveDirector,
			canReview,
			directorReviewStatus: isApproverDesk ? directorReviewStatus : null,
			directorSignatureUrl: isDirectorDesk ? directorSignatureUrl : null,
			directorSignedAt: isDirectorDesk ? directorSignedAt : null,
		};
	}),

	/**
	 * One page of the caller's OWN requests.
	 *
	 * `where.userId` is `ctx.user.id` and there is no `userId` input, which is the
	 * whole of the authorization here: there is no argument a crafted call could
	 * send that would widen the set. A staff member calling this gets their own
	 * (usually empty) list rather than an error, because the question they asked -
	 * "what have I filed?" - is one they are entitled to ask.
	 *
	 * `masterStatus` accepts either a literal status or one of the two GROUP keys
	 * in `STATUS_GROUPS`. Sharing that map with the counter tiles is what keeps a
	 * tile reading 5 over a table that shows 5.
	 */
	myList: protectedProcedure.input(myListInputSchema).query(async ({ ctx, input }) => {
		const { masterStatus, page, pageSize, sortBy, sortDir } = input;
		const search = input.search?.trim();
		const group = masterStatus ? STATUS_GROUPS[masterStatus] : undefined;

		const where = {
			userId: ctx.user.id,
			...(masterStatus ? { masterStatus: group ? { in: [...group] } : masterStatus } : {}),
			...(search
				? {
						OR: [
							{ title: { contains: search, mode: "insensitive" as const } },
							// Insensitive on a numeric-looking column on purpose: the format is
							// `YYYY-NNNN` today and a letter suffix is the obvious next
							// change, so an equality match here would silently stop finding
							// rows the day one is added.
							{ documentNumber: { contains: search, mode: "insensitive" as const } },
						],
					}
				: {}),
		};

		const [items, total] = await prisma.$transaction([
			prisma.request.findMany({
				orderBy: { [sortBy ?? "createdAt"]: sortDir ?? "desc" },
				select: REQUEST_ROW_SELECT,
				skip: (page - 1) * pageSize,
				take: pageSize,
				where,
			}),
			prisma.request.count({ where }),
		]);

		return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
	}),

	/**
	 * The four counters above the list, in one transaction so they are four
	 * readings of the same instant rather than four of four.
	 *
	 * They do NOT add up to `total`, and that is deliberate: DRAFT, RETURNED,
	 * FOR_NEXT_YEAR_PPMP and COMPLETED are in `total` and in none of the other
	 * three. Making the arithmetic balance would mean either inventing a fifth
	 * tile nobody asked for or filing a draft under "pending", which tells the
	 * user to wait for a reply to something they never sent.
	 */
	mySummary: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.user.id;

		const [total, pending, approved, rejected] = await prisma.$transaction([
			prisma.request.count({ where: { userId } }),
			prisma.request.count({ where: { masterStatus: { in: [...PENDING_STATUSES] }, userId } }),
			// APPROVED only. COMPLETED is a later, different fact - the work is
			// done - and folding it in here makes the tile disagree with the rows a
			// press on it produces.
			prisma.request.count({ where: { masterStatus: "APPROVED", userId } }),
			prisma.request.count({ where: { masterStatus: { in: [...REJECTED_STATUSES] }, userId } }),
		]);

		return { approved, pending, rejected, total };
	}),
	/**
	 * One page of the staff queue, scoped to the caller's desk.
	 *
	 * ## The scope comes from the session, never from the input
	 *
	 * `staffQueueWhere` reads `ctx.user.role` and nothing else to build the role
	 * clause; `status`, `priority`, `search` and `stage` are ANDed onto it. So a
	 * crafted filter can NARROW what a desk sees and has no shape at all that
	 * widens it - the failure this is written against is a status dropdown that
	 * turns into a way to read every request in the system.
	 *
	 * `roleProcedure` over the same four roles is the gate. IRMS-old used a
	 * `protectedProcedure` with an inline `else throw`, which worked and had to be
	 * remembered on every endpoint added afterwards.
	 */
	staffList: roleProcedure(...STAFF_QUEUE_ROLES)
		.input(staffListInputSchema)
		.query(async ({ ctx, input }) => {
			const { page, pageSize } = input;
			const role = ctx.user.role;

			if (!isStaffRole(role)) throw notStaffError();

			const where = staffQueueWhere(role, input);

			const [items, total] = await prisma.$transaction([
				prisma.request.findMany({
					// Newest first, and not sortable. Every other column here is a closed
					// enum with no order worth offering, and the one thing a desk scans a
					// queue for is what arrived while they were away.
					orderBy: { createdAt: "desc" },
					select: STAFF_ROW_SELECT,
					skip: (page - 1) * pageSize,
					take: pageSize,
					where,
				}),
				prisma.request.count({ where }),
			]);

			return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
		}),

	/**
	 * The two counters above the queue, in one transaction so they are two
	 * readings of the same instant rather than two of two.
	 *
	 * UNFILTERED within the role scope, unlike `staffList` - they answer "how big
	 * is my desk", which is the question a filtered count cannot answer. They also
	 * add up to the whole scope by construction: handled is the scope minus
	 * waiting, so `waiting + handled` is the count line the table renders above
	 * itself as "in your queue".
	 */
	staffSummary: roleProcedure(...STAFF_QUEUE_ROLES).query(async ({ ctx }) => {
		const role = ctx.user.role;

		if (!isStaffRole(role)) throw notStaffError();

		const scope: RequestWhereInput = { OR: STAFF_QUEUE_SCOPE[role] };
		const waiting: RequestWhereInput = { OR: STAFF_WAITING_SCOPE[role] };

		const [handledCount, waitingCount] = await prisma.$transaction([
			prisma.request.count({ where: { AND: [scope, { NOT: waiting }] } }),
			prisma.request.count({ where: { AND: [scope, waiting] } }),
		]);

		return { handled: handledCount, waiting: waitingCount };
	}),

	/**
	 * The narrow IDO inbox - `SUBMITTED` and `UNDER_IDO_REVIEW` alone.
	 *
	 * A separate procedure from `staffList` rather than a filter on it, because
	 * "what must I action?" and "everything I have ever touched" are two
	 * questions, and folding the first into a `stage` value on the second ties the
	 * IDO inbox to whatever the queue's scope happens to be next year. Both IDO
	 * desks may call it; the chairperson's own final-review stage is not in it,
	 * which is the point - this is the FIRST desk's tray.
	 */
	listSubmitted: roleProcedure("IDO_OFFICER", "IDO_CHAIRPERSON")
		.input(
			z.object({
				page: z.number().int().min(1).default(1),
				pageSize: z.number().int().min(1).max(100).default(10),
				priority: z.string().optional(),
				search: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			const { page, pageSize, priority } = input;
			const search = input.search?.trim();

			const where: RequestWhereInput = {
				masterStatus: { in: ["SUBMITTED", "UNDER_IDO_REVIEW"] },
				...(priority ? { priority } : {}),
				...(search
					? {
							OR: [
								{ title: { contains: search, mode: "insensitive" } },
								{ documentNumber: { contains: search, mode: "insensitive" } },
							],
						}
					: {}),
			};

			const [items, total] = await prisma.$transaction([
				prisma.request.findMany({
					orderBy: { createdAt: "desc" },
					select: STAFF_ROW_SELECT,
					skip: (page - 1) * pageSize,
					take: pageSize,
					where,
				}),
				prisma.request.count({ where }),
			]);

			return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
		}),

	/**
	 * Recommend it onward - the only one of the four outcomes that moves the
	 * request forwards, and the only one that WRITES anything besides a status.
	 *
	 * ## Six columns and an audit entry, in one transaction
	 *
	 * `finalTitle`, `reference`, `approverNote`, `processor`, the two statuses and
	 * the start date all commit together or none of them do. A failure halfway
	 * would leave a request carrying a final title with its status unchanged: still
	 * in IDO's queue, already retitled, and the next officer to open it cannot tell
	 * which of the two facts is the stale one.
	 *
	 * ## `title` is never overwritten
	 *
	 * `finalTitle` is a second column, not a correction of the first. The requestor
	 * wrote the original and it is the string they will search for; the detail page
	 * shows the final title with the original beneath it. This resolves the open
	 * question IRMS-old left in TASKS.md.
	 *
	 * ## The budget branch is a server-side count, never input
	 *
	 * Whether the request goes to a budget officer or straight to the director is
	 * decided by whether there IS a budget officer, and the browser has no say. It
	 * counts ACTIVE accounts: `protectedProcedure` refuses a suspended or inactive
	 * user on every call, so routing a request to a desk staffed only by accounts
	 * that cannot sign in strands it with no procedure able to move it on. `User.status`
	 * also defaults to `inactive`, which is what makes the distinction real rather
	 * than theoretical.
	 *
	 * The count is read at recommendation time and never revisited. Creating a
	 * budget officer tomorrow does not re-route requests already sent to the
	 * director, and that is correct - see the spec's edge cases.
	 *
	 * ## `masterStatus` does not expose the split
	 *
	 * It becomes `UNDER_DIRECTOR_REVIEW` on both branches. The requestor's view
	 * says the request is with the approvers; which internal desk holds it is
	 * `directorReviewStatus`, and mixing the two is how a request becomes
	 * actionable at two desks at once.
	 */
	recommend: roleProcedure(...IDO_REVIEW_ROLES)
		.input(idoRecommendSchema)
		.mutation(async ({ ctx, input }) => {
			const { finalTitle, id, note, reference } = input;
			const { user } = ctx;

			const existing = await loadIdoActionableRequest(id, user.id);

			const budgetOfficerCount = await prisma.user.count({
				where: { role: "BUDGET_OFFICER", status: "active" },
			});

			const directorReviewStatus = budgetOfficerCount > 0 ? "UNDER_BUDGET_OFFICER_REVIEW" : "UNDER_DIRECTOR_REVIEW";

			return await prisma.$transaction(async (tx) => {
				const request = await tx.request.update({
					where: { id },
					data: {
						approverNote: note ?? null,
						directorReviewStatus,
						finalTitle,
						idoEvaluationStatus: "RECOMMENDED_BY_IDO",
						masterStatus: "UNDER_DIRECTOR_REVIEW",
						processor: reviewerName(user),
						reference: reference ?? null,
						/*
						 * Written ONLY when it was null, through an absent key rather than by
						 * passing the old value back. The status guard above should already
						 * make a second recommendation impossible, and this is the second
						 * lock on the same door: `requestStartAt` is when the work actually
						 * began, and a re-recommendation that moved it would silently rewrite
						 * a date the completion report is measured against.
						 */
						...(existing.requestStartAt ? {} : { requestStartAt: new Date() }),
					},
					select: { id: true, idoEvaluationStatus: true },
				});

				await tx.auditLog.create({
					data: {
						action: "RECOMMENDED_BY_IDO",
						actorId: user.id,
						fromStatus: existing.masterStatus,
						note: note ?? null,
						requestId: id,
						toStatus: "UNDER_DIRECTOR_REVIEW",
					},
				});

				return request;
			});
		}),

	/**
	 * Send it back to the requestor to be fixed.
	 *
	 * Not a refusal: `RETURNED` is one of the two `EDITABLE_STATUSES`, so the
	 * requestor can edit and resubmit, and `request.submit` reissues no document
	 * number - the request keeps the one it was filed under. The note is required
	 * because it IS the instruction; it lands in the audit log and the requestor
	 * reads it as the banner on their detail page.
	 */
	returnToRequestor: roleProcedure(...IDO_REVIEW_ROLES)
		.input(idoReturnSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, note } = input;
			const existing = await loadIdoActionableRequest(id, ctx.user.id);

			return await applyIdoOutcome("return", { actorId: ctx.user.id, fromStatus: existing.masterStatus, id, note });
		}),

	/**
	 * Refuse it at the first checkpoint. Terminal - there is no re-opening action,
	 * and the requestor has to file a new request.
	 *
	 * The note is required for the same reason it is on a return, and it matters
	 * more here: this is the last thing anybody will say about the request.
	 */
	rejectByIdo: roleProcedure(...IDO_REVIEW_ROLES)
		.input(idoRejectSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, note } = input;
			const existing = await loadIdoActionableRequest(id, ctx.user.id);

			return await applyIdoOutcome("reject", { actorId: ctx.user.id, fromStatus: existing.masterStatus, id, note });
		}),

	/**
	 * Set it aside for next year's PPMP - the Project Procurement Management Plan.
	 *
	 * Terminal like a rejection and the opposite of one in meaning: the request was
	 * valid, and the budget calendar rather than a reviewer's judgement is what
	 * stopped it. That is why the note is optional - there may genuinely be nothing
	 * to explain beyond the year - and why the audit entry renders on the neutral
	 * `system` rail rather than the red one.
	 */
	deferToNextYearPpmp: roleProcedure(...IDO_REVIEW_ROLES)
		.input(idoDeferSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, note } = input;
			const existing = await loadIdoActionableRequest(id, ctx.user.id);

			return await applyIdoOutcome("defer", { actorId: ctx.user.id, fromStatus: existing.masterStatus, id, note });
		}),

	/**
	 * The budget desk says yes, and the request moves to the Campus Director.
	 *
	 * ## `masterStatus` is deliberately NOT touched
	 *
	 * It is already `UNDER_DIRECTOR_REVIEW` and it stays there. The requestor's
	 * view reads "Director Review" from the moment IDO recommends until the
	 * director acts, and the budget sub-stage is invisible to them throughout -
	 * which is why the audit entry below writes the SAME status into `fromStatus`
	 * and `toStatus`. That looks like a bug and is not one: the entry records who
	 * did what, and this action genuinely moved no headline status.
	 *
	 * ## The signature is COPIED, never joined
	 *
	 * `budgetOfficerSignatureUrl` is written from `ctx.user.signatureUrl` onto the
	 * row. A join to the user would mean the officer replacing the image on their
	 * profile next March silently changes what an approval stamped last year
	 * prints as - the record has to keep the signature that was actually used.
	 *
	 * `ctx.user.signatureUrl` comes from `protectedProcedure`, which reads the ROW
	 * rather than the session, so an officer who uploaded one two minutes ago is
	 * not refused by a stale cookie.
	 */
	approveBudget: roleProcedure("BUDGET_OFFICER")
		.input(budgetApproveSchema)
		.mutation(async ({ ctx, input }) => {
			const { id } = input;
			const { user } = ctx;

			const existing = await loadBudgetActionableRequest(id, user.id);

			/*
			 * The gate, not a courtesy. The page disables Approve when the profile has
			 * no signature, and this is what makes that true rather than merely
			 * displayed - an approval with no image stamps a blank box onto the
			 * printed form (spec 016), which is a signed instrument that nobody signed.
			 *
			 * Rejecting deliberately does not check this. A refusal is not a signed
			 * instrument, and an officer with no signature must still be able to stop
			 * a request rather than being forced to approve it.
			 */
			if (!user.signatureUrl) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Your profile is missing a signature. Please complete your profile before approving.",
				});
			}

			return await prisma.$transaction(async (tx) => {
				const request = await tx.request.update({
					where: { id },
					data: {
						budgetOfficerSignatureUrl: user.signatureUrl,
						budgetOfficerSignedAt: new Date(),
						directorReviewStatus: "UNDER_DIRECTOR_REVIEW",
					},
					select: { id: true, budgetOfficerSignedAt: true, directorReviewStatus: true },
				});

				await tx.auditLog.create({
					data: {
						action: "APPROVED_BY_BUDGET_OFFICER",
						actorId: user.id,
						// Same status on both sides, on purpose - see the note above.
						fromStatus: existing.masterStatus,
						note: null,
						requestId: id,
						toStatus: existing.masterStatus,
					},
				});

				return request;
			});
		}),

	/**
	 * The budget desk says no. Terminal.
	 *
	 * ## This one DOES set `masterStatus`
	 *
	 * The asymmetry with `approveBudget` is the whole point. An approval is
	 * internal - the request carries on to the next desk and the requestor has
	 * nothing to do about it. A rejection stops the request dead, and a requestor
	 * whose headline status still read "Director Review" would be waiting for a
	 * reply that is never coming. So both columns go to `BUDGET_OFFICER_REJECTED`,
	 * and the note travels with the audit entry as the reason their detail page
	 * shows them.
	 *
	 * ## No signature required
	 *
	 * A refusal is not a signed instrument, and an officer who has not yet
	 * uploaded a signature must still be able to stop a request.
	 */
	rejectBudget: roleProcedure("BUDGET_OFFICER")
		.input(budgetRejectSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, note } = input;
			const { user } = ctx;

			const existing = await loadBudgetActionableRequest(id, user.id);

			/*
			 * One transaction, for the reason `applyIdoOutcome` gives: the audit log is
			 * the only history this app has, and a request that stopped with no entry
			 * saying who stopped it is a record nobody can account for. The reverse is
			 * worse - an entry for a rejection that never committed.
			 */
			return await prisma.$transaction(async (tx) => {
				const request = await tx.request.update({
					where: { id },
					data: {
						directorReviewStatus: "BUDGET_OFFICER_REJECTED",
						masterStatus: "BUDGET_OFFICER_REJECTED",
					},
					select: { id: true, directorReviewStatus: true },
				});

				await tx.auditLog.create({
					data: {
						action: "REJECTED_BY_BUDGET_OFFICER",
						actorId: user.id,
						fromStatus: existing.masterStatus,
						note,
						requestId: id,
						toStatus: "BUDGET_OFFICER_REJECTED",
					},
				});

				return request;
			});
		}),
	/**
	 * The Campus Director says yes, and the request leaves the approvers for the
	 * IDO Chairperson's final review.
	 *
	 * ## The guard that accepts TWO stages, on purpose
	 *
	 * `loadDirectorActionableRequest(..., "approve")` takes
	 * `UNDER_BUDGET_OFFICER_REVIEW` as well as `UNDER_DIRECTOR_REVIEW`. A director
	 * may therefore approve while the budget stage is still open, and doing so
	 * ENDS that stage: `directorReviewStatus` moves to `DIRECTOR_APPROVED`, and
	 * `approveBudget`'s own guard - which accepts exactly
	 * `UNDER_BUDGET_OFFICER_REVIEW` - then refuses the officer. Both halves of the
	 * race are correct, and whichever transaction commits first wins.
	 *
	 * `rejectByDirector` below is deliberately narrower. Do not unify them.
	 *
	 * ## `masterStatus` moves here, for the first time since submission
	 *
	 * IDO's recommendation set it to `UNDER_DIRECTOR_REVIEW` and the budget stage
	 * left it alone, so the requestor has seen "Director Review" throughout. This
	 * is the action that changes what they are shown - which is why the mutation
	 * hook invalidates the requestor's list and counters as well as the staff
	 * queue.
	 *
	 * ## Five columns and the audit entry, in ONE transaction
	 *
	 * `directorReviewStatus`, `directorSignatureUrl`, `directorSignedAt`,
	 * `idoFinalStatus` and `masterStatus` commit together or not at all. A partial
	 * failure would leave a request carrying a stamped signature with a status
	 * that never moved - signed by the director and sitting in nobody's queue.
	 *
	 * ## The signature is COPIED, never joined
	 *
	 * Written from `ctx.user.signatureUrl` onto the row, for the reason
	 * `approveBudget` gives: a director who replaces the image on their profile
	 * next March must not silently rewrite what last year's approval prints as.
	 * `protectedProcedure` reads the ROW rather than the session, so a signature
	 * uploaded two minutes ago is not refused by a stale cookie.
	 */
	approveByDirector: roleProcedure("DIRECTOR")
		.input(directorApproveSchema)
		.mutation(async ({ ctx, input }) => {
			const { id } = input;
			const { user } = ctx;

			const existing = await loadDirectorActionableRequest(id, user.id, "approve");

			/*
			 * The gate, not a courtesy. The page disables Approve when the profile has
			 * no signature, and this is what makes that true rather than merely
			 * displayed - an approval with no image stamps a blank box onto the printed
			 * form (spec 016), which is a signed instrument nobody signed.
			 *
			 * Rejecting deliberately does not check this: a refusal is not a signed
			 * instrument, and a director with no signature must still be able to stop a
			 * request rather than being forced to approve it.
			 */
			if (!user.signatureUrl) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Your profile is missing a signature. Please complete your profile before approving.",
				});
			}

			return await prisma.$transaction(async (tx) => {
				const request = await tx.request.update({
					where: { id },
					data: {
						directorReviewStatus: "DIRECTOR_APPROVED",
						directorSignatureUrl: user.signatureUrl,
						directorSignedAt: new Date(),
						idoFinalStatus: "UNDER_IDO_FINAL_REVIEW",
						masterStatus: "UNDER_IDO_FINAL_REVIEW",
					},
					select: { id: true, directorReviewStatus: true, directorSignedAt: true, idoFinalStatus: true },
				});

				await tx.auditLog.create({
					data: {
						action: "APPROVED_BY_DIRECTOR",
						actorId: user.id,
						/*
						 * The status the request was ACTUALLY in, which on the early-approval
						 * path is the budget stage's `UNDER_DIRECTOR_REVIEW` headline rather
						 * than anything naming the budget desk. Reading it from the row rather
						 * than assuming one is what keeps the timeline honest about where the
						 * request came from.
						 */
						fromStatus: existing.masterStatus,
						note: null,
						requestId: id,
						toStatus: "UNDER_IDO_FINAL_REVIEW",
					},
				});

				return request;
			});
		}),

	/**
	 * The Campus Director says no. Terminal.
	 *
	 * ## Narrower than the approval, and that IS the rule
	 *
	 * `loadDirectorActionableRequest(..., "reject")` accepts exactly
	 * `UNDER_DIRECTOR_REVIEW`. A request the budget officer is still holding
	 * cannot be rejected here: the director has not been asked yet, and killing it
	 * from that stage would end a request the desk before them might have stopped
	 * for its own reason - or approved, leaving the director to decide with the
	 * budget answer in hand. The page HIDES Reject in that state rather than
	 * disabling it, because there is nothing the director can do to enable it.
	 *
	 * The spec calls this the single most fragile rule in the workflow. Widening
	 * this guard to match the approval's would break it silently.
	 *
	 * ## Both columns move, unlike the budget approval
	 *
	 * `masterStatus` becomes `DIRECTOR_REJECTED` alongside the stage column. A
	 * requestor whose headline status still read "Director Review" would be
	 * waiting for a reply that is never coming; the note travels with the audit
	 * entry as the reason their detail page shows them.
	 *
	 * ## No signature required
	 *
	 * A refusal is not a signed instrument - the same rule `rejectBudget` states.
	 */
	rejectByDirector: roleProcedure("DIRECTOR")
		.input(directorRejectSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, note } = input;
			const { user } = ctx;

			const existing = await loadDirectorActionableRequest(id, user.id, "reject");

			/*
			 * One transaction, for the reason `applyIdoOutcome` gives: the audit log is
			 * the only history this app has, and a request that stopped with no entry
			 * saying who stopped it is a record nobody can account for. The reverse - an
			 * entry for a rejection that never committed - is worse.
			 */
			return await prisma.$transaction(async (tx) => {
				const request = await tx.request.update({
					where: { id },
					data: {
						directorReviewStatus: "DIRECTOR_REJECTED",
						masterStatus: "DIRECTOR_REJECTED",
					},
					select: { id: true, directorReviewStatus: true },
				});

				await tx.auditLog.create({
					data: {
						action: "REJECTED_BY_DIRECTOR",
						actorId: user.id,
						fromStatus: existing.masterStatus,
						note,
						requestId: id,
						toStatus: "DIRECTOR_REJECTED",
					},
				});

				return request;
			});
		}),
} satisfies TRPCRouterRecord;
