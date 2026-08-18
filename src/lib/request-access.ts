import { TRPCError } from "@trpc/server";

/**
 * Who may read somebody else's request.
 *
 * ADMIN is deliberately absent. An administrator manages accounts - they hold no
 * `REVIEW_REQUEST` or `APPROVE_*` grant either (see `ROLE_DEFAULT_PERMISSIONS`),
 * and letting the role that can reset anybody's password also read everybody's
 * requests would make it the one account with no limit at all.
 */
export const REQUEST_READER_ROLES = ["IDO_OFFICER", "IDO_CHAIRPERSON", "BUDGET_OFFICER", "DIRECTOR"] as const;

/**
 * The read rule for one request, in ONE place.
 *
 * It lives here rather than inside `request.getById` because the comment thread
 * (spec 008) hangs off the request and has to inherit its visibility exactly. Two
 * copies of this rule is the failure that matters: widen `getById` and forget the
 * thread and the messages ABOUT a request stay readable to somebody who can no
 * longer open the request itself, which is the worse half of the leak - a
 * reviewer's returned-for-clarification note says more than the form does.
 *
 * ## The order of the two checks, and what it costs
 *
 * Existence first, then access - so a missing id is `NOT_FOUND` and an id that
 * exists but is not yours is `FORBIDDEN`. Those two ARE distinguishable, and
 * that is a decision rather than an oversight: cuids are not guessable in bulk,
 * so the set of ids anybody can probe is the set they were already given, and
 * the alternative - answering `NOT_FOUND` to a reviewer whose grant was revoked
 * this morning - sends them to look for a request that is sitting right there.
 * What neither answer carries is anything ABOUT the request: no title, no
 * owner, no status. That is the part that would be a leak.
 *
 * Takes the row rather than an id so a caller that has already fetched the
 * request does not read it twice - `getById` selects it in full and passes what
 * it got, `comment.list` selects `{ userId }` alone.
 */
export function assertCanReadRequest(
	request: { userId: string } | null,
	user: { id: string; role: string },
): asserts request is { userId: string } {
	if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });

	const isReader = (REQUEST_READER_ROLES as readonly string[]).includes(user.role);

	if (!isReader && request.userId !== user.id) {
		throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
	}
}
