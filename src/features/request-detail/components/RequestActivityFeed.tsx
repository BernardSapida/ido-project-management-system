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
	/**
	 * The actions this reader may see. Omit it and every entry renders, which is
	 * what the staff review pages (specs 010-014) want; the requestor's page
	 * passes `REQUESTOR_VISIBLE_ACTIONS`.
	 */
	visibleActions?: ReadonlySet<string>;
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
 * ## Oldest-first, and it is not a preference
 *
 * A request is a process being followed through, not a feed being watched. The
 * order matches `request.getById`'s `orderBy` rather than re-sorting, because a
 * feed that sorts its own input can only end up disagreeing with the array the
 * banner above it picked its entry from.
 *
 * ## The filter is a whitelist, and it is derived
 *
 * A requestor is shown the returns, the rejections and the deferral - the things
 * that ask them for something - and not the internal recommendations and
 * per-stage approvals, which are a reviewer's working notes about somebody
 * else's desk. `REQUESTOR_VISIBLE_ACTIONS` is computed from which actions are
 * declared negative rather than listed by hand, so a rejection added by a later
 * spec does not silently vanish from the feed of the person it happened to.
 *
 * That whitelist is also why the empty copy changes with it: a filtered feed
 * that is empty is GOOD NEWS for a requestor, and "No activity yet" on a request
 * three desks have already signed would be a plain lie.
 */
export function RequestActivityFeed({ auditLogs, isLoading, visibleActions }: RequestActivityFeedProps) {
	const visible = visibleActions ? auditLogs.filter((log) => visibleActions.has(log.action)) : auditLogs;

	const entries: TimelineEntry[] = visible.map((log) => ({
		actor: `${log.actor.firstname} ${log.actor.lastname}`.trim() || "Someone",
		detail: log.note?.trim() ? <Typography type="body-sm">{log.note}</Typography> : undefined,
		key: log.id,
		summary: transitionSummary(log.fromStatus, log.toStatus),
		timestamp: log.createdAt,
		title: auditActionLabel(log.action),
		type: auditActionTimelineType(log.action),
	}));

	return (
		<AppTimeline
			data-cy="request-activity"
			empty={{
				description: visibleActions
					? "Nothing has been sent back to you. Anything a reviewer returns, rejects or defers will appear here."
					: undefined,
				reason: "no-data",
			}}
			entries={entries}
			// h3: the page's title is the h1 and the section heading above this feed
			// is the h2, so the day headers inside it are the third level. A document
			// that skips one is unnavigable by heading.
			headingLevel={3}
			isLoading={isLoading}
			label="Request activity"
			order="oldest-first"
		/>
	);
}
