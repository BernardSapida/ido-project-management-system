import type { LucideIcon } from "lucide-react";
import { Database, FilterX, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { AppButton } from "../AppButton";
import { AppGradientIconTile } from "../AppGradientIconTile";

/**
 * Why the surface is empty. These are not interchangeable, and shipping one
 * "No data" for all three is the single most common list defect: a user whose
 * filters hid everything is told the system has nothing, and goes away.
 *
 * A fully custom empty state - a feature's first run, say - passes no `reason`
 * at all and supplies its own `icon` and `title` instead.
 */
export type EmptyReason = "filtered" | "no-data" | "no-results";

interface EmptyPreset {
	description: (query?: string) => string;
	icon: LucideIcon;
	title: string;
}

const PRESETS: Record<EmptyReason, EmptyPreset> = {
	filtered: {
		description: () => "Everything is hidden by the filters you've set. Clear them to see the full list again.",
		icon: FilterX,
		title: "Nothing matches these filters",
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

export interface EmptyStateAction {
	label: string;
	onPress: () => void;
}

type AppEmptyStateBaseProps = {
	"data-cy"?: string;
	/** The way out. Never "refresh" - it is the next thing the user would do. */
	action?: EmptyStateAction;
	/**
	 * Extra content between the description and the actions: a short list of what
	 * the feature makes possible on a first run, a secondary link, a form. Kept a
	 * slot rather than a `bullets` prop so it stays out of the way of the common
	 * case, which is the three lines above it and one button below.
	 */
	children?: ReactNode;
	className?: string;
	/** Where the title sits in the page outline. Defaults to 1 for a page, 2 for a panel. */
	headingLevel?: 1 | 2 | 3;
	/** Echoed back in the no-results copy so the user sees what was searched. */
	query?: string;
	secondaryAction?: EmptyStateAction;
	/**
	 * Two DESIGNS, not two sizes.
	 *
	 * `panel` is the block that sits inside a table, a list or a card while the
	 * rest of the page still works. It is compact and reads as a note about the
	 * region it is filling - the default, and what every collection here renders.
	 *
	 * `page` is for a route or a tab that could not put anything on screen at all.
	 * It has the whole viewport, so it is centred, taller, leads with a larger
	 * heading, and paints no surface of its own.
	 */
	variant?: "page" | "panel";
};

export type AppEmptyStateProps = AppEmptyStateBaseProps &
	(
		| {
				reason: EmptyReason;
				icon?: LucideIcon;
				title?: string;
				/** Overrides the preset sentence when the surface has something better to say. */
				description?: string;
		  }
		| {
				reason?: undefined;
				icon: LucideIcon;
				title: string;
				/** Required with no `reason`: a title with no sentence under it is the blank panel this component exists to prevent. */
				description: string;
		  }
	);

/**
 * The surface shown when a collection has no rows to show: nothing added yet, a
 * search that matched nothing, or filters that hid everything - and, with no
 * `reason`, a feature's own first-run screen.
 *
 * Two things are true of every one of them and the component, not the caller,
 * is what makes them true:
 *
 * 1. **The reason picks the copy and the glyph.** A caller cannot accidentally
 *    tell a filtered-out user that the database is empty - the three states read
 *    differently on purpose, because the user's next move differs.
 * 2. **It is never a blank panel.** There is always an icon, a title and a
 *    sentence; an `action` is how it stops being a dead end, and it should carry
 *    one wherever there is a next step to offer.
 *
 * `AppErrorState` is the sibling for when something *failed* rather than merely
 * came back empty - a 404, a 500, a dropped connection.
 */
export function AppEmptyState({
	action,
	children,
	className,
	"data-cy": dataCy,
	description,
	headingLevel,
	icon,
	query,
	reason,
	secondaryAction,
	title,
	variant = "panel",
}: AppEmptyStateProps) {
	const preset = reason ? PRESETS[reason] : null;
	const Icon = icon ?? preset?.icon;
	const resolvedTitle = title ?? preset?.title;
	const resolvedDescription = description ?? preset?.description(query);

	// The union guarantees all three at compile time; this is the runtime
	// backstop for a caller reaching past the types.
	if (!Icon || !resolvedTitle || !resolvedDescription) return null;

	const isPage = variant === "page";
	const Heading = `h${headingLevel ?? (isPage ? 1 : 2)}` as const;

	return (
		<div
			className={cn(
				"flex flex-col items-center text-center",
				isPage ? "min-h-[60vh] justify-center gap-4 px-6 py-16" : "gap-3 px-6 py-12",
				className,
			)}
			data-cy={dataCy}
			data-reason={reason}
			data-variant={variant}
		>
			<AppGradientIconTile
				className={isPage ? "size-14 rounded-3xl" : undefined}
				icon={Icon}
				size="lg"
			/>
			<div className={cn("space-y-1", isPage ? "max-w-md" : "max-w-sm")}>
				<Heading className={cn("font-semibold", isPage ? "text-2xl font-bold tracking-tight" : "text-base")}>
					{resolvedTitle}
				</Heading>
				<p className={cn("text-muted", isPage ? "text-base" : "text-sm")}>{resolvedDescription}</p>
			</div>

			{children && <div className={cn(isPage ? "max-w-md" : "max-w-sm")}>{children}</div>}

			{(action || secondaryAction) && (
				<div className="mt-1 flex flex-wrap items-center justify-center gap-2">
					{action && (
						<AppButton
							onPress={action.onPress}
							size="sm"
							variant={isPage ? "primary" : "secondary"}
						>
							{action.label}
						</AppButton>
					)}
					{secondaryAction && (
						<AppButton
							onPress={secondaryAction.onPress}
							size="sm"
							variant="ghost"
						>
							{secondaryAction.label}
						</AppButton>
					)}
				</div>
			)}
		</div>
	);
}
