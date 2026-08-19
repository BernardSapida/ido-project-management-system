import { Skeleton } from "@heroui/react";

/**
 * The shape of the page, at the size the page will be.
 *
 * A spinner would be shorter to write and would tell the reader nothing: this
 * screen is a header, a stepper, a two-column form and a feed, and a centred
 * dot in the middle of that height says only "wait". Blocking out the real
 * layout also means nothing jumps when the request lands - the header does not
 * push the form down the page on arrival.
 */
export function RequestDetailSkeleton() {
	return (
		<div
			className="flex flex-col gap-8"
			data-cy="request-detail-skeleton"
		>
			<div className="flex flex-col gap-3">
				<Skeleton className="h-8 w-72 rounded-lg" />
				<Skeleton className="h-4 w-96 max-w-full rounded-lg" />
			</div>

			<Skeleton className="h-16 w-full rounded-lg" />

			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
				<Skeleton className="h-96 rounded-lg" />

				{/* The rail in the order it actually arrives in: the actions, then the
				    attachments under their heading, then the processor card. It was
				    three equal blocks in the old order, so the buttons appeared where
				    the skeleton had drawn a card and the page moved under the cursor. */}
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-10 rounded-lg" />
						<Skeleton className="h-10 rounded-lg" />
					</div>

					<div className="flex flex-col gap-2">
						<Skeleton className="h-5 w-32 rounded-lg" />
						<Skeleton className="h-16 rounded-lg" />
					</div>

					<Skeleton className="h-28 rounded-lg" />
				</div>
			</div>
		</div>
	);
}
