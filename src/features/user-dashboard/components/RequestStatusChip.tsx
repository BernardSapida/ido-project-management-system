import { AppChip } from "@bernardsapida/web-ui";
import { CircleHelp } from "lucide-react";
import { masterStatusMap } from "@/lib/status-maps/request-status";

interface RequestStatusChipProps {
	"data-cy"?: string;
	masterStatus: string;
}

/**
 * The one place a `masterStatus` becomes words and a colour.
 *
 * Every table, timeline and detail page in the app renders a status through
 * this, so "Returned by IDO" in a list and "Returned" on a detail page cannot
 * happen - they are two statuses as far as the reader is concerned, and the
 * reader is the person deciding whether to act.
 *
 * A status the map has never heard of renders as itself under a question mark
 * rather than crashing the row. The database can hold a value shipped after this
 * map was last edited, and a blank cell in the Status column of a request the
 * user is trying to track is the worst possible answer to that.
 */
export function RequestStatusChip({ "data-cy": dataCy, masterStatus }: RequestStatusChipProps) {
	const entry = masterStatusMap[masterStatus];

	return (
		<AppChip
			data-cy={dataCy}
			icon={entry?.icon ?? CircleHelp}
			label={entry?.label ?? masterStatus}
			size="sm"
			tone={entry?.tone ?? "default"}
		/>
	);
}
