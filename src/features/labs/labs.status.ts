import type { ChipTone } from "@bernardsapida/web-ui";
import type { LucideIcon } from "lucide-react";
import { CircleCheck, Hammer } from "lucide-react";
import statusFile from "@/features/labs/labs.status.json";

/**
 * Reads `labs.status.json` - the hand-kept ledger of which labs are DONE.
 *
 * This is deliberately not derivable from the code. `labs.registry.ts` says what
 * exists and `isStub` says whether a page has anything on it, but neither can
 * say whether the component behind it is finished: a lab renders fine long
 * before its states, its responsive behaviour and its aria-labels are all
 * settled. So the ledger is a human's signature, and the default is `pending` -
 * a lab is on progress until someone says otherwise, never the reverse. Nothing
 * in the build may write to that file.
 *
 * A lab with no entry is `pending` too, which is why the file only has to carry
 * the groups that have been reviewed rather than a copy of the whole registry.
 * `to` is the join key: it is the one field the registry and the ledger must
 * spell identically, and a label rename cannot quietly clear a status.
 */
export type LabStatus = "complete" | "pending";

/** The one-line features a finished lab proves. Empty while it is being shaped. */
export type LabHighlights = readonly string[];

interface LabStatusFile {
	groups: {
		components: {
			highlights: string[];
			label: string;
			status: LabStatus;
			to: string;
		}[];
		heading: string;
	}[];
	statuses: Record<LabStatus, { label: string; tone: ChipTone }>;
}

const FILE = statusFile as LabStatusFile;

/** The status a lab has until the ledger says otherwise. */
const DEFAULT_STATUS: LabStatus = "pending";

const BY_ROUTE = new Map(
	FILE.groups.flatMap((group) => group.components.map((component) => [component.to, component] as const)),
);

/**
 * Copy and colour per status, read from the ledger rather than hardcoded here,
 * so the words on the chip and the tone of the dot are decided in one file. The
 * icons stay in code - JSON cannot hold a component.
 */
const STATUS_ICON: Record<LabStatus, LucideIcon> = {
	complete: CircleCheck,
	pending: Hammer,
};

export interface LabStatusMeta {
	icon: LucideIcon;
	label: string;
	status: LabStatus;
	tone: ChipTone;
}

/** What a lab's dot or chip should say and what colour it should be. */
export function getLabStatusMeta(to: string): LabStatusMeta {
	const status = BY_ROUTE.get(to)?.status ?? DEFAULT_STATUS;
	const meta = FILE.statuses[status];

	return { icon: STATUS_ICON[status], label: meta.label, status, tone: meta.tone };
}

/** The lab's feature highlights, or none - which is the case for every lab today. */
export function getLabHighlights(to: string): LabHighlights {
	return BY_ROUTE.get(to)?.highlights ?? [];
}

/** For the index page's "N of M complete". */
export function countComplete(routes: readonly string[]): number {
	return routes.filter((to) => getLabStatusMeta(to).status === "complete").length;
}
