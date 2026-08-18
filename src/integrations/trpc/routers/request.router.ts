import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import {
	createRequestSchema,
	saveDraftRequestSchema,
	submitRequestSchema,
} from "@/features/request-form/validations/schema/request.schema";
import { assertPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { assertCanReadRequest } from "@/lib/request-access";
import {
	isEditableStatus,
	masterStatusMap,
	PENDING_STATUSES,
	REJECTED_STATUSES,
	STATUS_GROUPS,
} from "@/lib/status-maps/request-status";
import { protectedProcedure } from "../init";

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

		const request = await prisma.request.findUnique({
			where: { id: input.id },
			select: {
				...REQUEST_DETAIL_SELECT,
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
		});

		assertCanReadRequest(request, user);

		return request;
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
} satisfies TRPCRouterRecord;
