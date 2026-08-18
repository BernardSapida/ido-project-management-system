import { AppAlert } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { CalendarClock, type LucideIcon, Undo2, XCircle } from "lucide-react";
import { type NegativeKind, negativeKindOf } from "@/lib/status-maps/audit-action";

interface RejectionNoticeProps {
	/** The audit log's `action` - the notice decides from it whether it renders at all. */
	action: string;
	actorName: string;
	note: string | null;
	occurredAt: Date | string;
}

interface NoticePreset {
	/** What to say when the reviewer recorded no note. */
	fallback: string;
	icon: LucideIcon;
	status: "accent" | "danger" | "warning";
	title: string;
}

/**
 * One preset per kind, and the tone is the whole message at a glance.
 *
 * `accent` for the deferral rather than a red: `FOR_NEXT_YEAR_PPMP` means the
 * request was accepted and the year's budget was already spent. Painting that
 * the same colour as a rejection tells a requestor their proposal was refused
 * when it was in fact approved and queued.
 *
 * The spec calls this one "info"; `AlertStatus` has no such value, and `accent`
 * is the palette's neutral-blue - the same tone the status chip already gives
 * `FOR_NEXT_YEAR_PPMP`, which is what keeps the chip and the banner agreeing.
 */
const PRESETS: Record<NegativeKind, NoticePreset> = {
	deferral: {
		fallback: "No note was recorded. The request stands and will be raised again for next year's PPMP.",
		icon: CalendarClock,
		status: "accent",
		title: "Deferred to next year's PPMP",
	},
	rejection: {
		fallback: "No reason was recorded. Ask the reviewing office before you file this request again.",
		icon: XCircle,
		status: "danger",
		title: "This request was rejected",
	},
	return: {
		fallback: "No note was recorded. Ask IDO what to change before you resubmit.",
		icon: Undo2,
		status: "warning",
		title: "This request was returned to you",
	},
};

/** A date a person reads, in the format the requests table already uses. */
function formatOccurredAt(value: Date | string): string {
	return new Date(value).toLocaleString("en-PH", {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
		year: "numeric",
	});
}

/**
 * WHY the request stopped, said above the form and without an interaction.
 *
 * This is the IRMS-old open task "rejection notes visible to requestor". In that
 * app the reviewer's note existed only as a row in an activity log below the
 * fold, so the single question a returned request raises - what do I have to
 * change - was answered by scrolling past the whole document and reading a
 * timeline. A banner is the answer to that: the reason a request stopped is not
 * history, it is the instruction.
 *
 * It renders nothing for an action that moved the request forwards, so a caller
 * may hand it the newest audit entry without checking first. WHETHER to look for
 * one at all is the page's decision - see `isNegativeStatus`: a request that was
 * returned in March and resubmitted in April is under review, and a banner still
 * repeating March's complaint describes a document that no longer exists.
 */
export function RejectionNotice({ action, actorName, note, occurredAt }: RejectionNoticeProps) {
	const kind = negativeKindOf(action);

	if (!kind) return null;

	const preset = PRESETS[kind];

	return (
		<AppAlert
			data-cy="request-rejection-notice"
			description={
				<div className="flex flex-col gap-1">
					{/* The note is printed WHOLE - no clamp, no accordion. It is the one
					    piece of text on this page the requestor came for, and a reviewer
					    who wrote three sentences meant all three. */}
					<Typography type="body-sm">{note?.trim() || preset.fallback}</Typography>

					<Typography
						color="muted"
						type="body-xs"
					>
						{actorName} · {formatOccurredAt(occurredAt)}
					</Typography>
				</div>
			}
			icon={preset.icon}
			status={preset.status}
			title={preset.title}
		/>
	);
}
