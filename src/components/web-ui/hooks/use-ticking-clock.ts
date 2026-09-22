import { useEffect, useState } from "react";

/**
 * `null` until mounted, then the current minute.
 *
 * The null is the point. Anything relative needs to know "now" and the viewer's
 * time zone, and the server has neither - so a component reading this renders
 * an absolute UTC date on the first pass and swaps to "3h ago" once the clock
 * arrives, instead of producing a hydration mismatch on every timestamp.
 *
 * It ticks because a feed or a thread is the kind of page left open: without it
 * "just now" is still claiming to be just now an hour later. A minute is the
 * resolution of the smallest unit on show, so anything faster is renders nobody
 * can see.
 */
export function useTickingClock(): Date | null {
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		setNow(new Date());
		const id = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(id);
	}, []);

	return now;
}
