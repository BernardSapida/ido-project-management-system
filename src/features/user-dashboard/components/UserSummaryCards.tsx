import { AppKpi, AppKpiSkeleton, cn, usePressFeedback } from "@bernardsapida/web-ui";
import { CheckCircle2, Clock, FileText, type LucideIcon, XCircle } from "lucide-react";
import type { RequestSummary, StatusGroupKey } from "../types";

interface UserSummaryCardsProps {
	/**
	 * The status currently in the URL, or `null` for none.
	 *
	 * A plain string rather than `StatusGroupKey`, because the dropdown can set
	 * values no tile represents - Draft, Completed. Those must select NO tile;
	 * narrowing this type would make them select Total, which claims the list is
	 * unfiltered while it is not.
	 */
	activeGroup: string | null;
	isLoading: boolean;
	/** Handed the tile's group. Pressing the ACTIVE tile sends `null` - see below. */
	onCardClick: (group: StatusGroupKey) => void;
	summary: RequestSummary | undefined;
}

interface Counter {
	group: StatusGroupKey;
	icon: LucideIcon;
	read: (summary: RequestSummary) => number;
	title: string;
}

/**
 * Total first, because it is the set the other three are cut from, then the
 * three outcomes in the order a request meets them.
 */
const COUNTERS: Counter[] = [
	{ group: null, icon: FileText, read: (summary) => summary.total, title: "Total" },
	{ group: "PENDING", icon: Clock, read: (summary) => summary.pending, title: "Pending" },
	{ group: "APPROVED", icon: CheckCircle2, read: (summary) => summary.approved, title: "Approved" },
	{ group: "REJECTED", icon: XCircle, read: (summary) => summary.rejected, title: "Rejected" },
];

/**
 * The four counters, which are the page's status filter rather than decoration.
 *
 * A number on a dashboard that cannot be pressed sends the reader hunting for
 * the dropdown that produces the five rows it just told them about; these ARE
 * that control, and they write the same URL parameter the dropdown does, so the
 * two can never disagree about what is filtered.
 *
 * No delta chip. `AppKpi` will draw one, but a delta needs a named comparison
 * period and there is none here - "34 requests, up 12%" against what? Drawn
 * anyway it would be a movement the app cannot substantiate, sitting in the
 * largest type on the screen.
 */
export function UserSummaryCards({ activeGroup, isLoading, onCardClick, summary }: UserSummaryCardsProps) {
	if (isLoading || !summary) {
		return (
			// aria-busy on the grid rather than on each tile: AppKpiSkeleton is
			// aria-hidden, so four of them would otherwise announce nothing at all
			// while the row reads as four empty boxes.
			<div
				aria-busy="true"
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
			>
				{COUNTERS.map((counter) => (
					<AppKpiSkeleton
						hasDelta={false}
						key={counter.title}
					/>
				))}
			</div>
		);
	}

	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
			data-cy="user-summary-cards"
		>
			{COUNTERS.map((counter) => (
				<CounterTile
					counter={counter}
					isActive={counter.group === activeGroup}
					key={counter.title}
					onPress={onCardClick}
					value={counter.read(summary)}
				/>
			))}
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
 * gives under a press by the same amount every other pressable surface in the
 * app does.
 *
 * `effect: "scale"` and not the default `both`: the ripple layer paints behind
 * its host's content, and the card inside this button has an opaque background,
 * so a ripple would be drawn and then covered by the tile it was meant to be on.
 *
 * `aria-pressed` rather than a styled ring alone. A toggle whose only "on"
 * signal is a colour is a filter a screen-reader user cannot tell is applied,
 * which is the same dead end as a filtered table with no visible reason.
 */
function CounterTile({
	counter,
	isActive,
	onPress,
	value,
}: {
	counter: Counter;
	isActive: boolean;
	onPress: (group: StatusGroupKey) => void;
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
				// keyboard user tabbing across four tiles sees each of them claim to be
				// the active filter in turn.
				isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
				press.pressClassName,
			)}
			data-cy={`counter-${counter.group ?? "total"}`}
			onClick={(event) => {
				// `detail === 0` is a click with no pointer behind it - Enter or Space on
				// the focused button - and it is the only way to give a keyboard press
				// the same acknowledgement a mouse press gets.
				if (event.detail === 0) press.spawnFromCenter(event.currentTarget);
				// Pressing the ACTIVE tile clears the filter. A toggle that only ever
				// sets leaves the user with no way back to the full list except the
				// dropdown they were not using.
				onPress(isActive ? null : counter.group);
			}}
			type="button"
		>
			<AppKpi
				className="h-full"
				icon={counter.icon}
				title={counter.title}
				value={value.toLocaleString("en-PH")}
			/>
		</button>
	);
}
