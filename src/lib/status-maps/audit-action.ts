import type { TimelineEntry } from "@bernardsapida/web-ui";

/**
 * The fourteen things that can be written to an `AuditLog`, and what each one
 * means to a reader.
 *
 * It sits beside `masterStatusMap` for the same reason that map exists: an
 * action that reads "Returned To Requestor" on one screen and "returned it for
 * changes" on another is two events as far as the person reading them is
 * concerned. The status map answers "where is it"; this one answers "what
 * happened".
 *
 * Only `CREATED` and `SUBMITTED` are written today - the other twelve are
 * written by the review pages (specs 010-014) and are declared here now so the
 * feed those specs feed into is already able to render them. An action missing
 * from here still renders, through `auditActionLabel`'s fallback; it simply
 * renders less well.
 */

/** Why a request stopped, in the three ways it can. */
export type NegativeKind = "deferral" | "rejection" | "return";

export interface AuditActionEntry {
	/**
	 * The rest of the sentence after the actor's name - "created this request",
	 * not "Created". The timeline renders `{actor} {title}`, so a label that
	 * starts with a capital or a noun reads as two fragments glued together.
	 */
	label: string;
	/**
	 * Set only on the actions that stop or reverse a request. It is what
	 * `RejectionNotice` keys its tone off, and what the requestor's activity
	 * filter is derived from - so a negative action added later is visible to a
	 * requestor by virtue of being declared negative, rather than by somebody
	 * remembering to add it to a second list.
	 */
	negative?: NegativeKind;
	timelineType: TimelineEntry["type"];
}

/**
 * `timelineType` is picked for its COLOUR, because that is the only part of it
 * the reader decodes at a glance: `created` is green, `updated` is accent,
 * `deleted` is red, `system` is amber, `commented` is muted.
 *
 * - Approvals take `created` (green) - the glyph is a plus rather than a tick,
 *   which is the one place this mapping is approximate, and the colour is worth
 *   more than the glyph on a rail being skimmed.
 * - A return takes `updated`, not `deleted`: nothing was refused, the document
 *   is back on the requestor's desk to be edited.
 * - A deferral takes `system`, the one type the timeline reserves for events
 *   nobody argued with. `FOR_NEXT_YEAR_PPMP` is exactly that - the request was
 *   valid and the budget calendar, not a reviewer's judgement, is what stopped
 *   it.
 * - The five rejections take `deleted`, the only red on the rail.
 */
export const auditActionMap: Record<string, AuditActionEntry> = {
	CREATED: { label: "created this request", timelineType: "created" },
	SUBMITTED: { label: "submitted it to IDO", timelineType: "updated" },
	RECOMMENDED_BY_IDO: { label: "recommended it for review", timelineType: "created" },
	RETURNED_TO_REQUESTOR: { label: "returned it for changes", negative: "return", timelineType: "updated" },
	REJECTED_BY_IDO: { label: "rejected it at the IDO stage", negative: "rejection", timelineType: "deleted" },
	DEFERRED_TO_NEXT_YEAR_PPMP: {
		label: "deferred it to next year's PPMP",
		negative: "deferral",
		timelineType: "system",
	},
	APPROVED_BY_BUDGET_OFFICER: { label: "approved the budget", timelineType: "created" },
	REJECTED_BY_BUDGET_OFFICER: {
		label: "rejected it at the budget stage",
		negative: "rejection",
		timelineType: "deleted",
	},
	APPROVED_BY_DIRECTOR: { label: "approved it as Campus Director", timelineType: "created" },
	REJECTED_BY_DIRECTOR: { label: "rejected it at the director stage", negative: "rejection", timelineType: "deleted" },
	IDO_FINAL_APPROVED: { label: "approved it at the IDO final review", timelineType: "created" },
	IDO_FINAL_REJECTED: {
		label: "rejected it at the IDO final review",
		negative: "rejection",
		timelineType: "deleted",
	},
	FINAL_DIRECTOR_APPROVED: { label: "gave the final approval", timelineType: "created" },
	FINAL_DIRECTOR_REJECTED: {
		label: "rejected it at the final approval",
		negative: "rejection",
		timelineType: "deleted",
	},
};

/**
 * What to print for an action nobody has declared yet.
 *
 * `RECOMMENDED_BY_IDO` → "recommended by ido". Not good, and deliberately not
 * good: a blank row would hide that a stage is writing an action this file has
 * never heard of, and the whole point of an audit log is that nothing in it
 * disappears.
 */
export function auditActionLabel(action: string): string {
	return auditActionMap[action]?.label ?? action.toLowerCase().replace(/_/g, " ");
}

export function auditActionTimelineType(action: string): TimelineEntry["type"] {
	return auditActionMap[action]?.timelineType ?? "updated";
}

/** `null` for the actions that moved the request forwards. */
export function negativeKindOf(action: string): NegativeKind | null {
	return auditActionMap[action]?.negative ?? null;
}

/**
 * What a requestor is shown on their own request: the returns, the rejections
 * and the deferral, and nothing else. Internal recommendations and per-stage
 * approvals are staff detail and stay on the staff pages.
 *
 * DERIVED from `negative` rather than written out, which is the answer to the
 * failure this list would otherwise have. A hand-kept whitelist is one a new
 * rejection is added without, and the symptom is silent - the requestor's feed
 * simply never mentions the thing that stopped their request.
 */
export const REQUESTOR_VISIBLE_ACTIONS: ReadonlySet<string> = new Set(
	Object.entries(auditActionMap)
		.filter(([, entry]) => entry.negative)
		.map(([action]) => action),
);

/**
 * The newest entry that stopped or reversed the request, or `null`.
 *
 * Newest and not first: a request can be returned, fixed, resubmitted and
 * returned again, and it is the latest complaint the requestor has to act on.
 * The list arrives oldest-first from `request.getById`, so this walks backwards
 * rather than sorting - re-sorting here would quietly disagree with the order
 * the feed above it renders in.
 */
export function latestNegativeLog<T extends { action: string }>(auditLogs: readonly T[]): T | null {
	for (let index = auditLogs.length - 1; index >= 0; index -= 1) {
		const log = auditLogs[index];

		if (log && negativeKindOf(log.action)) return log;
	}

	return null;
}
