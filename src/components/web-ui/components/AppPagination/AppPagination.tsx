import { Pagination } from "@heroui/react";
import { cn } from "../../lib/cn";

interface AppPaginationProps {
	"data-cy"?: string;
	className?: string;
	/**
	 * What the rows are - "orders", "warehouses". Pluralise it yourself; it is
	 * dropped straight into "Showing 1-10 of 53 orders".
	 */
	noun?: string;
	onPageChange: (page: number) => void;
	page: number;
	rowsPerPage?: number;
	total: number;
}

/**
 * Page controls plus the count tracker.
 *
 * The tracker now renders whether or not there is a second page. It used to sit
 * behind an early return on `total <= rowsPerPage`, so a 7-row table said
 * nothing at all about how much there was - and "is that everything?" is
 * precisely the question the tracker exists to answer. Only the page buttons
 * are conditional.
 *
 * Rows per page is fixed by the caller rather than offered as a control: a page
 * size picker is a preference almost nobody sets and every table then has to
 * remember.
 *
 * The tracker is `Pagination.Summary` inside the Pagination rather than a `<p>`
 * in a wrapper next to it. `.pagination` is itself `w-full` and
 * `justify-between`, so nesting it in another `justify-between` row left it
 * stretched across the leftover width with its buttons floating in the middle
 * of it - the space to the right of "Next" was the Pagination's own, and no
 * amount of alignment on the wrapper could reach inside it. Using the slot the
 * component ships for exactly this puts the two ends where they belong.
 */
export function AppPagination({
	className,
	"data-cy": dataCy,
	noun,
	onPageChange,
	page,
	rowsPerPage = 10,
	total,
}: AppPaginationProps) {
	const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
	const from = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
	const to = Math.min(page * rowsPerPage, total);
	const suffix = noun ? ` ${noun}` : "";
	const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

	return (
		<Pagination
			className={className}
			data-cy={dataCy}
		>
			{/*
			 * Polite, not assertive: the count changes on every keystroke of a
			 * search, and an assertive region would talk over the typing.
			 */}
			<Pagination.Summary
				aria-live="polite"
				className="min-w-max"
			>
				{total === 0 ? `No${suffix}` : `Showing ${from}-${to} of ${total}${suffix}`}
			</Pagination.Summary>
			{totalPages > 1 && (
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.Previous
							isDisabled={page === 1}
							onPress={() => onPageChange(page - 1)}
						>
							<Pagination.PreviousIcon />
							<span>Previous</span>
						</Pagination.Previous>
					</Pagination.Item>
					{pageNumbers.map((p) => (
						<Pagination.Item key={p}>
							{/*
							 * The current page wears the same gradient pill as the active
							 * nav item, so "where am I" reads the same way in both places.
							 * HeroUI's flat `--pagination-link-bg` is a grey that is one
							 * step off the hover grey, which is close to no marker at all.
							 * `aria-current="page"` comes from `isActive` and carries this
							 * for anyone not looking at the colour.
							 */}
							<Pagination.Link
								className={cn(p === page && "gradient-brand shadow-glow")}
								isActive={p === page}
								onPress={() => onPageChange(p)}
							>
								{p}
							</Pagination.Link>
						</Pagination.Item>
					))}
					<Pagination.Item>
						<Pagination.Next
							isDisabled={page === totalPages}
							onPress={() => onPageChange(page + 1)}
						>
							<span>Next</span>
							<Pagination.NextIcon />
						</Pagination.Next>
					</Pagination.Item>
				</Pagination.Content>
			)}
		</Pagination>
	);
}
