import { useEffect, useState } from "react";

/** How far down the page counts as "scrolled". One line of text is enough to prove the page moved. */
export const SCROLLED_PX = 16;

/**
 * Whether the page has moved at all.
 *
 * Every bar pinned to the top of a page takes its border and shadow on SCROLL
 * rather than at rest: a line under a header sitting on a hero cuts the page in
 * two before there is anything to separate it from. Both `AppSiteHeader` and
 * `AppHeader` want that, and two copies of it is how one of them ends up with a
 * different threshold than the other.
 *
 * `passive: true` because this handler never calls `preventDefault`, and a
 * non-passive scroll listener on the window blocks the compositor - the one
 * measurable way a header can make the whole page scroll badly. The state only
 * flips at the threshold, so the listener runs on every frame of a scroll but
 * React re-renders twice in a session.
 */
export function useIsScrolled(threshold: number = SCROLLED_PX): boolean {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const sync = () => setIsScrolled(window.scrollY > threshold);

		sync();
		window.addEventListener("scroll", sync, { passive: true });

		return () => window.removeEventListener("scroll", sync);
	}, [threshold]);

	return isScrolled;
}
