import { Skeleton } from "@heroui/react";
import { AppGlassCard } from "../AppGlassCard";
import { cn } from "../../lib/cn";

interface AppKpiSkeletonProps {
	/** Matches the `chart` the real tile will have, so the height does not move. */
	chart?: "line" | "progress";
	className?: string;
	/** @default true - most tiles carry one, and a missing line is a visible jump. */
	hasDelta?: boolean;
	hasFooter?: boolean;
}

/**
 * The tile's own layout at the tile's real height - never a spinner in an empty
 * box, which makes the whole dashboard jump when the numbers land.
 *
 * This is the piece that decides whether `AppKpi` can just be imported and used.
 * A KPI always arrives from a query, so the loading state is not an edge case,
 * it is the first thing every consumer renders - and left unshipped, each of
 * them hand-rolls a different one and the row reflows on arrival.
 *
 * `chart` is passed rather than inferred because the skeleton renders BEFORE
 * there is anything to infer from. Get it wrong and you have moved the jump
 * rather than removed it: a tile that loads a sparkline into a box sized for a
 * plain value grows 92px the moment it resolves.
 *
 * It is `aria-hidden`: a row of six of these would otherwise be six
 * announcements of the same fact. Put `aria-busy="true"` on the grid instead.
 */
export function AppKpiSkeleton({ chart, className, hasDelta = true, hasFooter = false }: AppKpiSkeletonProps) {
	return (
		// No padding here either - `.card` owns it, exactly as it does for the real
		// tile. A skeleton on a different inset is a skeleton that lies about the
		// layout it is standing in for.
		<AppGlassCard
			aria-hidden="true"
			className={cn("h-full gap-4", className)}
		>
			<div className="flex items-center gap-3">
				{/* The `sm` tile's own footprint - see AppGradientIconTile. */}
				<Skeleton className="size-10 shrink-0 rounded-xl" />
				<Skeleton className="h-5 w-28 max-w-full rounded-md" />
			</div>

			<div className="flex flex-1 flex-col gap-3">
				<div>
					<Skeleton className="h-8 w-32 max-w-full rounded-md" />
					{hasDelta ? <Skeleton className="mt-2 h-5 w-40 max-w-full rounded-md" /> : null}
				</div>

				{/* `mt-auto` on both, because the real ones have it. */}
				{chart === "line" ? (
					// The readout strip is 28px of reserved space above the plot, and it
					// is reserved here too - it is part of the height either way.
					<div className="mt-auto pt-7">
						<Skeleton className="h-16 w-full rounded-xl" />
					</div>
				) : null}

				{chart === "progress" ? (
					<div className="mt-auto flex flex-col gap-2">
						<Skeleton className="h-1.5 w-full rounded-full" />
						<div className="flex items-center justify-between gap-3">
							<Skeleton className="h-4 w-32 max-w-full rounded-md" />
							<Skeleton className="h-4 w-8 shrink-0 rounded-md" />
						</div>
					</div>
				) : null}
			</div>

			{hasFooter ? <Skeleton className="mt-auto h-8 w-32 rounded-full" /> : null}
		</AppGlassCard>
	);
}
