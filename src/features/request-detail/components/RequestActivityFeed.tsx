import { AppTimeline, type TimelineEntry } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { auditActionLabel, auditActionTimelineType } from "@/lib/status-maps/audit-action";
import { masterStatusMap } from "@/lib/status-maps/request-status";

export interface AuditLogActor {
	firstname: string;
	id: string;
	lastname: string;
	role: string;
}

export interface AuditLogEntry {
	action: string;
	actor: AuditLogActor;
	createdAt: Date | string;
	fromStatus: string | null;
	id: string;
	note: string | null;
	toStatus: string | null;
}

interface RequestActivityFeedProps {
	auditLogs: AuditLogEntry[];
	isLoading?: boolean;
}

/** "Submitted → Returned by IDO", through the same map the chips read. */
function transitionSummary(fromStatus: string | null, toStatus: string | null): string | undefined {
	const to = toStatus ? (masterStatusMap[toStatus]?.label ?? toStatus) : null;

	if (!to) return undefined;

	const from = fromStatus ? (masterStatusMap[fromStatus]?.label ?? fromStatus) : null;

	return from ? `${from} → ${to}` : to;
}

/**
 * Who did what to this request, and when.
 *
 * `AppTimeline` replaces the hand-built `ol` / rail / dot markup this came from
 * - IRMS-old logged that as a UI defect, and it was one in the ordinary way:
 * absolute-positioned dots, a rail whose height was guessed, and a set of
 * `bg-*-500` classes chosen per action by substring-matching the action name.
 * None of that is written here. The rail, the day grouping, the relative stamps
 * and the collapsed bodies are the component's.
 *
 * ## Newest-first, and the reversal is ours to do
 *
 * The question being asked of this card is "what just happened to my request",
 * and the answer to it should not be at the bottom of a trail that grows every
 * time someone touches the request.
 *
 * `AppTimeline` does not sort. It renders `entries` in array order, and `order`
 * only tells it which end new arrivals land at, for the "new entries" pill. So
 * the reverse happens here, on the mapped copy - `request.getById` still returns
 * these ascending, and `latestNegativeLog` and the banner above read that same
 * ascending array back-to-front. Reversing the *prop* would break both.
 *
 * ## Every reader sees the same trail
 *
 * There is no per-role filter. The requestor's page used to hide everything but
 * the returns and rejections, and the result was a feed that contradicted the
 * stepper above it - a request sitting in Director Review whose activity card
 * claimed one thing had ever happened to it. An audit trail that shows a
 * different history depending on who is reading is not one.
 */
export function RequestActivityFeed({ auditLogs, isLoading }: RequestActivityFeedProps) {
	// `map` copies, so the `reverse` below turns the copy and never `auditLogs`.
	const entries: TimelineEntry[] = auditLogs
		.map((log) => ({
			actor: `${log.actor.firstname} ${log.actor.lastname}`.trim() || "Someone",
			detail: log.note?.trim() ? <Typography type="body-sm">{log.note}</Typography> : undefined,
			key: log.id,
			summary: transitionSummary(log.fromStatus, log.toStatus),
			timestamp: log.createdAt,
			title: auditActionLabel(log.action),
			type: auditActionTimelineType(log.action),
		}))
		.reverse();

	return (
		<AppTimeline
			data-cy="request-activity"
			empty={{ reason: "no-data" }}
			entries={entries}
			// h3: the page's title is the h1 and the section heading above this feed
			// is the h2, so the day headers inside it are the third level. A document
			// that skips one is unnavigable by heading.
			headingLevel={3}
			isLoading={isLoading}
			label="Request activity"
			order="newest-first"
		/>
	);
}
