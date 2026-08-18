import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { getMyCsmSchema, submitCsmSchema } from "@/features/csm/validations/schema/submit-csm.schema";
import { assertPermission, hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { protectedProcedure } from "../init";

/**
 * The satisfaction form: the last thing that happens to a request, and the only
 * step in the workflow the REQUESTOR takes after their request was approved.
 *
 * ## Ownership is the gate, and it is the only one
 *
 * There is no role check anywhere in this router, deliberately. A DIRECTOR who
 * calls `submitCsm` on somebody's request is refused for the same reason another
 * USER is - they do not own it - and not for being a director. A role gate here
 * would be both wrong (a staff member can also file their own request, and then
 * they DO own it) and beside the point: the measure is worthless the moment
 * anybody but the person who was served can answer it.
 *
 * ## Neither procedure creates a `Csm` row
 *
 * The row is created empty by `request.finalDirectorApprove` (spec 014). This
 * router only ever reads it and updates it, which is what keeps "was this ever
 * approved?" answerable from the table: a request with no row was never
 * approved, and no amount of visiting this page can give it one.
 */

/** Everything the CSM page draws, and nothing about the request beyond its id.
 *  The page reads the request itself through `request.getById`. */
const CSM_SELECT = {
	comment: true,
	id: true,
	rating: true,
	requestId: true,
	submittedAt: true,
} as const;

export const csmRouter = {
	/**
	 * The caller's own satisfaction record for one request, or `null`.
	 *
	 * ## Why `null` and not an error
	 *
	 * Three different situations arrive here - no such request, a request that
	 * belongs to somebody else, and a request that was never finally approved and
	 * so has no `Csm` row - and the page's correct answer to all three is the same
	 * silent redirect back to the request. Answering `NOT_FOUND` for one and
	 * `FORBIDDEN` for another would turn this endpoint into a way to ask whether a
	 * given request id exists and who owns it, which is a question a stranger has
	 * no business getting an answer to.
	 *
	 * ## Why it carries `canSubmit`
	 *
	 * `SUBMIT_CSM` is a per-user grant an admin can revoke without touching the
	 * role, so the browser has no way to know it is gone - the session carries a
	 * role and nothing else. Without this the page would offer a live button whose
	 * only possible answer is FORBIDDEN. It decides nothing: `submitCsm` asserts
	 * the grant itself. The same courtesy `comment.list` pays with `canComment`,
	 * and for the same reason - one indexed lookup on a query the page already
	 * makes, rather than a second round trip for one boolean.
	 */
	getMyCsm: protectedProcedure.input(getMyCsmSchema).query(async ({ ctx, input }) => {
		const { user } = ctx;

		const request = await prisma.request.findUnique({
			where: { id: input.requestId },
			select: { userId: true },
		});

		if (!request || request.userId !== user.id) return null;

		// In parallel, after ownership: the grant is only READ here, so asking for
		// it beside the record costs one indexed lookup and saves a round trip on
		// the path that matters - the one where the form is about to be drawn.
		const [csm, canSubmit] = await Promise.all([
			prisma.csm.findUnique({ where: { requestId: input.requestId }, select: CSM_SELECT }),
			hasPermission(user.id, "SUBMIT_CSM"),
		]);

		if (!csm) return null;

		return { ...csm, canSubmit };
	}),

	/**
	 * Answer the form, and complete the request.
	 *
	 * ## Four guards, in this order
	 *
	 * Ownership, then the grant, then the stage, then whether it has already been
	 * answered. The order is the same one `comment.create` uses and for the same
	 * reason: a caller who does not own the request must not be able to learn from
	 * the error whether they merely lack `SUBMIT_CSM`, because "you don't have
	 * permission to do that here" confirms there is a "here".
	 *
	 * `CSM_PENDING` is the second half of a two-part contract with spec 014, which
	 * is the only thing that ever writes it. Loosening this check is how an
	 * unapproved request gets marked complete - there is no other guard between a
	 * `Csm` row and `COMPLETED`.
	 *
	 * ## Why `masterStatus` moves too
	 *
	 * `completionStatus` is the workflow's own bookkeeping; `masterStatus` is what
	 * the requestor's list and every status chip in the app read. Writing one
	 * without the other leaves a finished request still reading "Approved" on the
	 * page the requestor is looking at, with the banner gone and nothing
	 * explaining why.
	 *
	 * ## Why one transaction, and why `updateMany` for the guard
	 *
	 * The `Csm` row and the request move together or not at all - a request marked
	 * COMPLETED whose feedback never saved is the failure this exists to stop.
	 * The `submittedAt: null` condition rides ON the update rather than being read
	 * first, so two simultaneous submissions cannot both pass a check and then
	 * both write: the second matches zero rows and is turned into the CONFLICT
	 * below, rolling its half of the transaction back with it.
	 */
	submitCsm: protectedProcedure.input(submitCsmSchema).mutation(async ({ ctx, input }) => {
		const { comment, rating, requestId } = input;
		const { user } = ctx;

		const request = await prisma.request.findUnique({
			where: { id: requestId },
			select: { completionStatus: true, masterStatus: true, userId: true },
		});

		/*
		 * NOT_FOUND for both "no such request" and "not yours", which is what makes
		 * a DIRECTOR calling this indistinguishable from a mistyped id. Ownership,
		 * not role - see the note at the top of this file.
		 */
		if (!request || request.userId !== user.id) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
		}

		await assertPermission(user.id, "SUBMIT_CSM");

		if (request.completionStatus !== "CSM_PENDING") {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "The feedback form is not available for this request",
			});
		}

		return await prisma.$transaction(async (tx) => {
			const existing = await tx.csm.findUnique({
				where: { requestId },
				select: { id: true, submittedAt: true },
			});

			/*
			 * Unreachable through the app, and it still cannot be folded into the
			 * CONFLICT below. `CSM_PENDING` and the row are written by one transaction
			 * in spec 014, so a request in that state with no row is a broken record
			 * rather than a second submission - and telling somebody their feedback was
			 * "already submitted" when nothing was ever created is the one sentence
			 * here that could be false.
			 */
			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "There is no feedback form for this request" });
			}

			if (existing.submittedAt) {
				throw new TRPCError({ code: "CONFLICT", message: "Feedback has already been submitted" });
			}

			const submittedAt = new Date();

			const claimed = await tx.csm.updateMany({
				where: { requestId, submittedAt: null },
				// An empty comment is stored as `null`, not as "". The column means
				// "they said something", and an empty string is a comment that reads
				// blank everywhere it is rendered.
				data: { comment: comment || null, rating, submittedAt },
			});

			/*
			 * The read above is the message; THIS is the guard. Two presses that both
			 * got past it are separated here rather than there, because only the write
			 * is atomic - the loser matches zero rows, throws, and takes its own half
			 * of the transaction back out with it.
			 */
			if (claimed.count === 0) {
				throw new TRPCError({ code: "CONFLICT", message: "Feedback has already been submitted" });
			}

			const updated = await tx.request.update({
				where: { id: requestId },
				data: { completionStatus: "COMPLETED", masterStatus: "COMPLETED" },
				select: { completionStatus: true },
			});

			return { id: existing.id, requestCompletionStatus: updated.completionStatus, submittedAt };
		});
	}),
} satisfies TRPCRouterRecord;
