import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribe to a media query.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`, because the
 * navigation renders ONE nav at a time rather than rendering both and hiding
 * one with `hidden md:flex` - which means the answer is needed during the first
 * render, not after a paint. The effect version answered `false` for a frame on
 * every mount, which is how a desktop got the phone's tab bar for one frame
 * before swapping to the sidebar.
 *
 * `serverValue` is what SSR sees. There is no viewport on the server, so it is
 * a bet: pass whatever the surface's traffic mostly is. Hydration does not warn
 * either way - `useSyncExternalStore` is defined to render the server snapshot
 * for the hydration pass and re-render with the client's immediately after,
 * which is the whole reason for using it here rather than a mounted flag.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
	const subscribe = useCallback(
		(onChange: () => void) => {
			const media = window.matchMedia(query);
			media.addEventListener("change", onChange);
			return () => media.removeEventListener("change", onChange);
		},
		[query],
	);

	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(query).matches,
		() => serverValue,
	);
}
