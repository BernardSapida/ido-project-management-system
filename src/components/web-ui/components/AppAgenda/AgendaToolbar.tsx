import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { AppButton } from "../AppButton";
import type { AgendaView } from "./agenda.types";

interface AgendaToolbarProps {
	view: AgendaView;
	onViewChange: (view: AgendaView) => void;
	onPrev: () => void;
	onNext: () => void;
	onToday: () => void;
	onAdd: () => void;
	/** The visible range, e.g. "January 2026" or "Jan 6 - 12, 2026". */
	rangeLabel: string;
	/** True while the visible range already contains today - the "Today" button is then disabled. */
	isOnCurrentPeriod: boolean;
	searchSlot?: ReactNode;
}

const VIEWS: { label: string; value: AgendaView }[] = [
	{ label: "Day", value: "day" },
	{ label: "Week", value: "week" },
	{ label: "Month", value: "month" },
];

/**
 * Two labelled zones, not one row of mixed verbs. LEFT is WHEN - prev, Today,
 * next - and Today is disabled while the range already holds today, which
 * removes the "show today vs go to today" ambiguity for free. RIGHT is HOW - a
 * Day/Week/Month segmented control, so "Month" alone is unambiguous once it
 * visibly switches. Add is the only way to create an entry.
 */
export function AgendaToolbar({
	view,
	onViewChange,
	onPrev,
	onNext,
	onToday,
	onAdd,
	rangeLabel,
	isOnCurrentPeriod,
	searchSlot,
}: AgendaToolbarProps) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3">
			<div className="flex items-center gap-2">
				<div className="flex items-center gap-1">
					<AppButton
						aria-label="Previous period"
						icon={ChevronLeft}
						isIconOnly
						onPress={onPrev}
						size="sm"
						variant="ghost"
					/>
					<AppButton isDisabled={isOnCurrentPeriod} onPress={onToday} size="sm" variant="outline">
						Today
					</AppButton>
					<AppButton
						aria-label="Next period"
						icon={ChevronRight}
						isIconOnly
						onPress={onNext}
						size="sm"
						variant="ghost"
					/>
				</div>
				<p className="font-medium text-sm">{rangeLabel}</p>
			</div>

			<div className="flex items-center gap-2">
				{searchSlot}
				<div className="flex overflow-hidden rounded-lg border border-default-200" role="group">
					{VIEWS.map(({ label, value }) => (
						<button
							aria-pressed={view === value}
							className={cn(
								"px-3 py-1.5 text-sm transition-colors",
								view === value
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-default-100",
							)}
							key={value}
							onClick={() => onViewChange(value)}
							type="button"
						>
							{label}
						</button>
					))}
				</div>
				<AppButton icon={Plus} onPress={onAdd} size="sm">
					Add agenda
				</AppButton>
			</div>
		</div>
	);
}
