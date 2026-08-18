import { AppKpi, AppKpiSkeleton, cn, usePressFeedback } from "@bernardsapida/web-ui";
import { Archive, Gavel, type LucideIcon, Search } from "lucide-react";
import type { UserRole } from "@/utils/config";
import type { StaffQueueCounts, StageKey } from "../types";

interface StaffQueueSummaryProps {
	/** Which tile is pressed, or `null` for neither - the whole queue. */
	activeStage: StageKey;
	counts: StaffQueueCounts | undefined;
	isLoading: boolean;
	/** Handed the tile's stage. Pressing the ACTIVE tile sends `null`. */
	onStageClick: (stage: StageKey) => void;
	role: UserRole;
}

/**
 * The glyph on the "Waiting on you" tile, by what the desk actually does.
 *
 * A dashboard is read by shape before it is read by word, and the two IDO desks
 * review while the other two decide - so a chairperson and a director looking at
 * the same layout are not reading the same tile. The counterpart tile is
 * `Archive` for everyone, because "already dealt with" means one thing.
 */
const WAITING_ICONS: Record<UserRole, LucideIcon> = {
	ADMIN: Search,
	BUDGET_OFFICER: Gavel,
	DIRECTOR: Gavel,
	IDO_CHAIRPERSON: Search,
	IDO_OFFICER: Search,
	USER: Search,
};

/**
 * The two counters, which are this page's stage filter rather than decoration.
 *
 * IPMS-new. The old staff dashboard had no counters at all, so a desk could not
 * tell a queue of forty from a queue of two without paging through it - and
 * because the queue deliberately includes everything the desk has already
 * finished with, the length of the table says nothing about how much work is
 * left. Splitting the two IS the answer to "what do I have to do today".
 *
 * They are pressable for the reason the requestor's tiles are: a number on a
 * dashboard that cannot be pressed sends the reader hunting for the control that
 * produces the rows it just told them about. These write the same `stage` search
 * param the table reads, so tile and table cannot disagree.
 *
 * No delta chip. A delta needs a named comparison period and there is none here.
 */
export function StaffQueueSummary({ activeStage, counts, isLoading, onStageClick, role }: StaffQueueSummaryProps) {
	if (isLoading || !counts) {
		return (
			// aria-busy on the grid rather than on each tile: AppKpiSkeleton is
			// aria-hidden, so two of them would announce nothing at all while the row
			// reads as two empty boxes.
			<div
				aria-busy="true"
				className="grid grid-cols-1 gap-4 sm:grid-cols-2"
			>
				<AppKpiSkeleton hasDelta={false} />
				<AppKpiSkeleton hasDelta={false} />
			</div>
		);
	}

	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2"
			data-cy="staff-queue-summary"
		>
			<StageTile
				icon={WAITING_ICONS[role]}
				isActive={activeStage === "waiting"}
				onPress={onStageClick}
				stage="waiting"
				title="Waiting on you"
				value={counts.waiting}
			/>
			<StageTile
				icon={Archive}
				isActive={activeStage === "handled"}
				onPress={onStageClick}
				stage="handled"
				title="Handled"
				value={counts.handled}
			/>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * One pressable tile.
 *
 * `AppKpi` is a display component and owns no press behaviour, so the button is
 * here rather than in the package - a project component wrapping a lab one,
 * which is the sanctioned way to make a lab component behave differently. The
 * press RESPONSE still comes from the package (`usePressFeedback`), so this tile
 * gives under a press by the same amount every other pressable surface does.
 *
 * `effect: "scale"` and not the default `both`: the ripple layer paints behind
 * its host's content and the card inside this button is opaque, so a ripple
 * would be drawn and then covered by the tile it was meant to be on.
 *
 * `aria-pressed` rather than a ring alone. A toggle whose only "on" signal is a
 * colour is a filter a screen-reader user cannot tell is applied.
 */
function StageTile({
	icon,
	isActive,
	onPress,
	stage,
	title,
	value,
}: {
	icon: LucideIcon;
	isActive: boolean;
	onPress: (stage: StageKey) => void;
	stage: Exclude<StageKey, null>;
	title: string;
	value: number;
}) {
	const press = usePressFeedback({ effect: "scale" });

	return (
		<button
			aria-pressed={isActive}
			className={cn(
				"rounded-xl text-start",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
				// A different colour from the focus ring on purpose. Sharing one means a
				// keyboard user tabbing across the tiles sees each of them claim to be
				// the active filter in turn.
				isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
				press.pressClassName,
			)}
			data-cy={`stage-${stage}`}
			onClick={(event) => {
				// `detail === 0` is a click with no pointer behind it - Enter or Space on
				// the focused button - and it is the only way to give a keyboard press
				// the same acknowledgement a mouse press gets.
				if (event.detail === 0) press.spawnFromCenter(event.currentTarget);
				// Pressing the ACTIVE tile clears the filter. A toggle that only ever
				// sets leaves the user with no way back to the whole queue.
				onPress(isActive ? null : stage);
			}}
			type="button"
		>
			<AppKpi
				className="h-full"
				icon={icon}
				title={title}
				value={value.toLocaleString("en-PH")}
			/>
		</button>
	);
}
