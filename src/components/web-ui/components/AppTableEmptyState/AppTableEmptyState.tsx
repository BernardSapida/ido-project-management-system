import type { LucideIcon } from "lucide-react";
import { Database, FilterX, SearchX } from "lucide-react";
import { AppButton } from "../AppButton";
import { AppGradientIconTile } from "../AppGradientIconTile";

/**
 * Why the table is empty. These are not interchangeable, and shipping one
 * "No data" for all three is the single most common table defect: a user whose
 * filters hid everything is told the system has nothing, and goes away.
 */
export type EmptyReason = "no-data" | "no-results" | "filtered";

interface EmptyPreset {
	description: (query?: string) => string;
	icon: LucideIcon;
	title: string;
}

const PRESETS: Record<EmptyReason, EmptyPreset> = {
	filtered: {
		description: () => "Every row is hidden by the filters you have set. Clear them to see the full list again.",
		icon: FilterX,
		title: "No rows match these filters",
	},
	"no-data": {
		description: () => "Nothing has been added yet. Once there is, it will show up here.",
		icon: Database,
		title: "Nothing here yet",
	},
	"no-results": {
		description: (query) =>
			query
				? `Nothing matched “${query}”. Check the spelling, or search for less of it.`
				: "Nothing matched that search.",
		icon: SearchX,
		title: "No matches",
	},
};

interface TableEmptyStateProps {
	"data-cy"?: string;
	/** The way out. Never "refresh" - it is the next thing the user would do. */
	action?: { label: string; onPress: () => void };
	/** Overrides the preset copy when the table has something better to say. */
	description?: string;
	/** Echoed back in the no-results copy so the user sees what was searched. */
	query?: string;
	reason: EmptyReason;
	title?: string;
}

/**
 * The empty state under a table: icon, title, description, and one action.
 *
 * The reason picks the copy and the glyph, so a caller cannot accidentally tell
 * a filtered-out user that the database is empty. Every one of them carries an
 * action, because a dead end here loses the user at the worst moment.
 */
export function AppTableEmptyState({
	action,
	"data-cy": dataCy,
	description,
	query,
	reason,
	title,
}: TableEmptyStateProps) {
	const preset = PRESETS[reason];

	return (
		<div
			className="flex flex-col items-center gap-3 px-6 py-12 text-center"
			data-cy={dataCy}
			data-reason={reason}
		>
			<AppGradientIconTile
				icon={preset.icon}
				size="lg"
			/>
			<div className="max-w-sm space-y-1">
				<p className="font-semibold">{title ?? preset.title}</p>
				<p className="text-sm text-muted">{description ?? preset.description(query)}</p>
			</div>
			{action && (
				<AppButton
					className="mt-1"
					onPress={action.onPress}
					size="sm"
					variant="secondary"
				>
					{action.label}
				</AppButton>
			)}
		</div>
	);
}
