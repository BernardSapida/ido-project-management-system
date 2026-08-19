import { AppCard, AppKpi, AppKpiSkeleton, AppRatingSummary } from "@bernardsapida/web-ui";
import { Skeleton, Typography } from "@heroui/react";
import { Hourglass, MessageSquareQuote } from "lucide-react";
import type { AdminCsmSummaryData } from "../types";

interface AdminCsmSummaryProps {
	data: AdminCsmSummaryData | undefined;
	isLoading: boolean;
}

/**
 * What the report says before anybody reads a single record.
 *
 * ## The average is the hero, and the count is what makes it honest
 *
 * `AppRatingSummary` takes both plus the breakdown, and all three are passed:
 * 5.0 from two people is not 4.6 from four hundred, and a bare average with no
 * distribution hides the shape that matters most here - a office averaging 4
 * because everybody said 4 is a different place from one averaging 4 because
 * half said 5 and half said 3.
 *
 * ## Why the two counters are not three
 *
 * `rated` is already under the stars as the response count, so a tile repeating
 * it would be the same number twice. The two here are the ones the average
 * cannot carry: how many forms have come back at all, and how many are still
 * out. The second is the only figure on this screen that is about WORK - an
 * approved request nobody has answered for is not a low score, it is a request
 * that has not finished.
 *
 * No delta on either tile. A delta needs a named comparison period and there is
 * none: nothing here is bucketed by month, and inventing one would put a number
 * on the screen that no query behind it means.
 */
export function AdminCsmSummary({ data, isLoading }: AdminCsmSummaryProps) {
	if (isLoading || !data) {
		return (
			// aria-busy on the grid rather than on each tile: AppKpiSkeleton is
			// aria-hidden, so two of them would announce nothing at all while the row
			// reads as two empty boxes.
			<div
				aria-busy="true"
				className="grid gap-4 lg:grid-cols-3"
			>
				<Skeleton className="h-48 w-full rounded-lg lg:col-span-2" />

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
					<AppKpiSkeleton hasDelta={false} />
					<AppKpiSkeleton hasDelta={false} />
				</div>
			</div>
		);
	}

	return (
		<div
			className="grid gap-4 lg:grid-cols-3"
			data-cy="admin-csm-summary"
		>
			<AppCard
				className="lg:col-span-2"
				description="Across every request that has been closed by its requestor."
				headingLevel={2}
				title="Overall satisfaction"
			>
				<div className="flex flex-col gap-4">
					<AppRatingSummary
						count={data.rated}
						data-cy="admin-csm-average"
						distribution={data.distribution}
						noun="ratings"
						value={data.average}
					/>

					{/*
					 * The rows the average cannot include, said out loud.
					 *
					 * They were answered - they have a `submittedAt` - under the
					 * acknowledgement contract that predates the rating, so counting them
					 * as ratings would drag the figure towards a score nobody gave, and
					 * leaving them unmentioned makes "128 ratings" disagree with the 134
					 * answered rows in the table below it.
					 */}
					{data.unrated > 0 ? (
						<Typography
							color="muted"
							data-cy="admin-csm-unrated"
							type="body-xs"
						>
							{data.unrated} earlier {data.unrated === 1 ? "response was" : "responses were"} submitted before the
							rating was part of the form, and {data.unrated === 1 ? "is" : "are"} not counted in the average.
						</Typography>
					) : null}
				</div>
			</AppCard>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
				<AppKpi
					data-cy="admin-csm-answered"
					icon={MessageSquareQuote}
					title="Forms answered"
					value={String(data.submitted)}
				/>

				<AppKpi
					data-cy="admin-csm-awaiting"
					icon={Hourglass}
					title="Awaiting response"
					value={String(data.awaiting)}
				/>
			</div>
		</div>
	);
}
