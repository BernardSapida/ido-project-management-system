import type { CSSProperties, ReactNode } from "react";
import { MAIN_CONTENT_ID } from "../AppSkipToContent";
import { cn } from "../../lib/cn";

/**
 * How wide the content column is allowed to get.
 *
 * This is the ONE decision this component makes, and it is a real one: a
 * dashboard of tiles wants the whole screen, a settings page wants a column
 * narrow enough to scan, and an article wants a measure. Stretching any of them
 * to a 2560px monitor reads as clutter and hurts comprehension.
 *
 * It belongs to the ROUTE rather than to the frame, which is why App Layout
 * reads it from `staticData.mainWidth` - the same mechanism `breadcrumb`
 * already uses - instead of every page wrapping its own container.
 */
export type MainWidth = "default" | "full" | "prose" | "wide";

const WIDTH: Record<MainWidth, string> = {
	/** Most screens. Wide enough for a two- or three-column grid, short enough to scan. */
	default: "max-w-6xl",
	/** Dashboards and data tables, where the width IS the feature. No cap. */
	full: "",
	/** Reading. ~65 characters, the measure prose stops being comfortable past. */
	prose: "max-w-prose",
	/** Dense grids that still want a margin on a very large monitor. */
	wide: "max-w-[90rem]",
};

/** Kept in step with AppTabBar's `min-h-14` slots; pages stack sticky CTAs on it. */
const TAB_BAR_HEIGHT = "3.5rem";

export interface AppMainProps {
	/** The page. Its own layout is its own business - see the component note. */
	children: ReactNode;
	className?: string;
	"data-cy"?: string;
	/**
	 * Change it and the content cross-fades. App Layout passes the active
	 * SECTION rather than the pathname: moving between destinations is a change
	 * of place and reads better with a beat, moving around inside one is not.
	 *
	 * A fade rather than a slide, because destinations are peers - a horizontal
	 * slide claims one is "after" another, which is the transition a drill-down
	 * owns.
	 */
	fadeKey?: string;
	/**
	 * Reserves room at the foot for a fixed bottom bar plus the device's safe
	 * area. Only the frames that HAVE such a bar pass it; without it the last row
	 * of every list sits under the bar, unreachable at the exact moment the user
	 * scrolled to reach it.
	 */
	hasBottomBar?: boolean;
	/**
	 * The skip link's target. Leave it alone in the app - there is one main
	 * region and `AppSkipToContent` points at this id.
	 *
	 * The component lab overrides it because it puts two specimens on one page,
	 * and three elements sharing `id="main-content"` is invalid HTML and a skip
	 * link that lands on whichever the browser found first. Same escape hatch,
	 * for the same reason, as `AppSidebar`'s `navLabel`.
	 */
	id?: string;
	/** The landmark's name. Overridden by the lab for the reason `id` is. */
	label?: string;
	width?: MainWidth;
}

/**
 * The content region: the landmark, the measure, and nothing else.
 *
 * ## It does not lay out the page
 *
 * There is deliberately no grid in here, and no `space-y`. What goes inside is
 * the page's - a KPI row, a table, a form, a reading column - and those have
 * nothing in common except that they sit in the middle. A frame that imposed a
 * grid would be overridden by the first screen that wanted two columns of
 * different widths, and then every page after it would carry an override for a
 * rule that never fitted. **The frame gives you a canvas of the right width; the
 * page draws on it.**
 *
 * What it DOES own is the handful of things that are the frame's job and that no
 * page should have to remember:
 *
 * 1. **One `<main>` landmark**, carrying `MAIN_CONTENT_ID` so the skip link has
 *    somewhere to land, and `tabIndex={-1}` so focus can actually go there. Two
 *    `<main>`s on a page is a screen reader with two "main content"s to choose
 *    between; none is a skip link pointing at nothing.
 * 2. **The measure.** See `MainWidth` - the one real decision, and it belongs to
 *    the route rather than the frame.
 * 3. **The transition on a change of destination**, keyed rather than animated
 *    by hand, so a page cannot forget it or run a different one.
 * 4. **The room a fixed bottom bar needs**, including `env(safe-area-inset-bottom)`,
 *    exposed as `--tab-bar-height` so a sticky page CTA can stack ABOVE the bar
 *    by reading the same number instead of guessing at it.
 */
export function AppMain({
	children,
	className,
	"data-cy": dataCy,
	fadeKey,
	hasBottomBar = false,
	id = MAIN_CONTENT_ID,
	label = "Application content",
	width = "default",
}: AppMainProps) {
	return (
		<main
			aria-label={label}
			className={cn(
				"min-w-0 flex-1",
				/*
				 * No focus ring on the landmark itself.
				 *
				 * `tabIndex={-1}` makes this a skip TARGET, but Chrome and Edge also
				 * focus a `tabindex="-1"` element when you click inside it. Focus then
				 * sits here silently until the next keypress flips the browser into
				 * keyboard modality - at which point `:focus-visible` paints a ring
				 * around the whole content column. Click a page, press any key, and two
				 * long vertical lines appear down the sides of the app for no reason
				 * the reader can connect to anything they did.
				 *
				 * Nothing is lost by suppressing it: this is not an interactive control,
				 * and the skip link's effect is already obvious - the viewport moves and
				 * the next Tab lands inside the content.
				 */
				"outline-none",
				hasBottomBar && "pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+1rem)]",
				className,
			)}
			data-cy={dataCy}
			data-width={width}
			id={id}
			style={hasBottomBar ? ({ "--tab-bar-height": TAB_BAR_HEIGHT } as CSSProperties) : undefined}
			// Focusable only as a skip TARGET, never in the tab order.
			tabIndex={-1}
		>
			{/*
			 * The cap is on an inner element rather than on `<main>` itself, so the
			 * landmark still spans the region while the content is centred inside it.
			 * Put `max-w-*` on the landmark and a page's own full-bleed section - a
			 * hero, a sticky toolbar - has nothing left to bleed into.
			 */}
			<div
				className={cn("mx-auto w-full", WIDTH[width], fadeKey === undefined ? undefined : "nav-fade")}
				key={fadeKey}
			>
				{children}
			</div>
		</main>
	);
}
