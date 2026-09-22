import { useRouterState } from "@tanstack/react-router";
import NProgress from "nprogress";
import { useEffect } from "react";

NProgress.configure({
	showSpinner: false,
	trickleSpeed: 200,
	minimum: 0.08,
});

/**
 * The router's loading bar, driven by NProgress.
 *
 * It renders `null` and takes no props - including no `data-cy`. There is no
 * element of ours to hang one on: NProgress appends its own `#nprogress` div to
 * `<body>` and removes it again when the navigation settles, so that id IS the
 * test hook, and its presence or absence is the whole assertion.
 *
 * The promise worth pinning is the second one: a navigation fast enough to
 * finish inside NProgress's own delay must never flash a bar at all, because a
 * bar that appears and vanishes in one frame reads as a glitch rather than as
 * progress.
 */
export function AppRouteProgress() {
	const isLoading = useRouterState({ select: (s) => s.isLoading });

	useEffect(() => {
		if (isLoading) {
			NProgress.start();
		} else {
			NProgress.done();
		}
	}, [isLoading]);

	return null;
}
