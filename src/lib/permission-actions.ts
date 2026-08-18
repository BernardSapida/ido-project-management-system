/**
 * The seven capabilities as words, and nothing in this file talks to a database.
 *
 * It was split out of `lib/permissions.ts` for the reason `utils/config.ts`
 * gives about the roles: that module imports `@/lib/prisma` and `@trpc/server`,
 * so the admin permissions modal (spec 017) - a browser component whose whole
 * job is to LABEL the seven switches - could not read `ACTION_LABELS` without
 * pulling Prisma into the client bundle.
 *
 * `ACTION_VALUES` mirrors the `Action` enum in
 * `prisma/models/user-permission.prisma`. It is a union of the same seven
 * literals, so the server keeps using these constants against Prisma's `Action`
 * with no cast, and the browser never reaches into `prisma/generated`. An eighth
 * action added there and not here is a switch the admin page cannot draw.
 */

/** In WORKFLOW order, not alphabetical - it is the order the switches render in,
 *  and the order a request actually travels through them. */
export const ACTION_VALUES = [
	"CREATE_REQUEST",
	"SUBMIT_REQUEST",
	"ADD_COMMENT",
	"REVIEW_REQUEST",
	"APPROVE_BUDGET",
	"APPROVE_DIRECTOR",
	"SUBMIT_CSM",
] as const;

export type PermissionAction = (typeof ACTION_VALUES)[number];

export const ALL_ACTIONS: PermissionAction[] = [...ACTION_VALUES];

/** Label and description per action - read by the admin permissions modal. */
export const ACTION_LABELS: Record<PermissionAction, { description: string; label: string }> = {
	ADD_COMMENT: { label: "Add Comments", description: "Post comments on requests" },
	APPROVE_BUDGET: { label: "Approve Budget", description: "Approve or reject budget officer stage" },
	APPROVE_DIRECTOR: { label: "Approve as Director", description: "Approve or reject at director stage" },
	CREATE_REQUEST: { label: "Create Request", description: "Create new request drafts" },
	REVIEW_REQUEST: {
		label: "Review Request",
		description: "Recommend, return, reject, or defer requests at IDO stage",
	},
	SUBMIT_CSM: { label: "Submit CSM Feedback", description: "Submit client satisfaction feedback after approval" },
	SUBMIT_REQUEST: { label: "Submit Request", description: "Submit draft requests for review" },
};

/**
 * What each role starts with. ADMIN gets nothing on purpose - an administrator
 * manages accounts and never touches a request.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, PermissionAction[]> = {
	ADMIN: [],
	BUDGET_OFFICER: ["ADD_COMMENT", "APPROVE_BUDGET"],
	DIRECTOR: ["ADD_COMMENT", "APPROVE_DIRECTOR"],
	IDO_CHAIRPERSON: ["ADD_COMMENT", "REVIEW_REQUEST"],
	IDO_OFFICER: ["ADD_COMMENT", "REVIEW_REQUEST"],
	USER: ["CREATE_REQUEST", "SUBMIT_REQUEST", "ADD_COMMENT", "SUBMIT_CSM"],
};
