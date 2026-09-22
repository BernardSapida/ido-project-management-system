import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "../../lib/cn";

export interface AppAsideProps {
	/**
	 * The pane's contents. Filters, activity, related records, contextual help -
	 * things that are meaningful only in RELATION to the main content.
	 */
	children: ReactNode;
	className?: string;
	/** Test hook on the `<aside>`. */
	"data-cy"?: string;
	/**
	 * Heads the pane, and names its landmark. Strongly preferred: a second column
	 * of unexplained content beside the main one is a panel the reader has to
	 * work out. Without it the landmark falls back to "Supporting information",
	 * which is honest but says nothing about THIS pane.
	 */
	title?: string;
}

/**
 * The supporting pane: a second column beside the main content, holding things
 * that only mean something next to it.
 *
 * ## What belongs in it, and what does not
 *
 * Material's canonical layouts draw the line at whether the content stands
 * alone. A supporting pane holds what is meaningful only in relation to the
 * primary content - the filters acting on this list, the activity on this
 * record, the help for this form. Three ways to get it wrong:
 *
 * - **It stands on its own** → it is a page, and it needs a URL. A pane cannot
 *   be linked to, bookmarked or shared, so putting a subject in one hides it.
 * - **It is one question** → it is `AppDialog`. A pane that exists to be
 *   answered and dismissed is a dialog that forgot to be modal.
 * - **It is the record you selected** → that is list-detail, not a supporting
 *   pane, and the detail deserves the larger half rather than a third.
 *
 * ## Where it goes
 *
 * On the RIGHT, always. Left is navigation's edge - `AppDrawer` states the same
 * rule - and a supporting pane arriving there competes with the sidebar for what
 * that side of the screen means.
 *
 * ## What happens when there is no room
 *
 * It STACKS BELOW the main content rather than disappearing or becoming a second
 * overlay. Material offers a sheet as the compact option; the App Layout family
 * has already spent its overlay on navigation, and a drawer opening over a
 * drawer is the shape those layouts exist to avoid. Stacked, the content is
 * still there and still in reading order - after the thing it supports, which is
 * the order it should be read in anyway.
 *
 * The breakpoint is `@4xl` (56rem, of the ROW) rather than Material's `md`, and that is a
 * consequence of the frame around it: this layout has already given ~260px to a
 * sidebar, so three columns do not fit at 48rem the way two would. Below `xl`
 * the pane is full width and in the flow; at `xl` and up it is a 20rem column,
 * sticky, scrolling inside itself so it can never be taller than the viewport.
 *
 * ## It is always floating
 *
 * Unlike `AppSidebar` and `AppHeader`, there is no `flush` variant - the pane is
 * always a `glass-strong` card. Those two are edges of the frame and take its
 * surface; a supporting pane is a distinct object sitting beside the content, and
 * meeting an edge with a hairline would make it read as another one.
 *
 * ## It is optional, and its absence costs nothing
 *
 * The layout must not reserve the column when there is no pane - an empty third
 * of the screen reads worse than a page that never had one. Because this
 * component carries its own width, a caller that renders nothing simply has a
 * two-column row.
 */
export function AppAside({ children, className, "data-cy": dataCy, title }: AppAsideProps) {
	const headingId = useId();

	return (
		<aside
			aria-label={title ? undefined : "Supporting information"}
			aria-labelledby={title ? headingId : undefined}
			className={cn(
				"min-w-0 shrink-0",
				/*
				 * A CONTAINER query, not a viewport one. The pane's row is often much
				 * narrower than the window - inside a lab frame, or beside a 260px
				 * sidebar - and a viewport `xl:` there says "plenty of room" while the
				 * actual space is 475px, so the pane sat beside a squeezed column
				 * instead of stacking under it. The row it lives in declares the
				 * container; see `AppLayout`.
				 */
				"w-full @4xl:w-80",
				/*
				 * `dvh`, not `vh`: on mobile browsers the collapsing URL bar makes
				 * 100vh overshoot the visible area. Only sticky from `xl`, because a
				 * stacked pane sticking to the top of the viewport would follow the
				 * reader up a page it sits at the bottom of.
				 */
				"@4xl:sticky @4xl:top-6 @4xl:max-h-[calc(100dvh-3rem)] @4xl:overflow-y-auto",
				/*
				 * Always a floating glass card. There is no flush variant: a supporting
				 * pane is a distinct object beside the content, not another edge of the
				 * frame, so it reads as one wherever the frame around it lands.
				 */
				"glass-strong rounded-3xl p-4",
				className,
			)}
			data-cy={dataCy}
		>
			{title ? (
				<h2
					className="mb-3 text-sm font-semibold text-foreground"
					id={headingId}
				>
					{title}
				</h2>
			) : null}
			{children}
		</aside>
	);
}
