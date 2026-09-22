import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const configure = vi.fn();

vi.mock("nprogress", () => ({
	default: { configure, done: vi.fn(), start: vi.fn() },
}));

vi.mock("@tanstack/react-router", () => ({
	useRouterState: () => false,
}));

/**
 * The thinnest test file here, and deliberately so rather than by omission.
 *
 * This component's real promise - `start()` on a navigation, `done()` when it
 * settles - lives in a `useEffect`, and an effect does not run under
 * `react-dom/server`. Without a DOM in this package (see `vitest.config.ts`)
 * there is no way to drive it. So what is pinned here is the half that IS
 * reachable: the module-level configuration, and the fact that the component
 * contributes no markup of its own.
 *
 * NOT covered, and the first thing to write when a DOM arrives:
 *
 * - `NProgress.start()` on the loading edge and `done()` on the settling one.
 * - The promise the component's own docblock makes: a navigation fast enough to
 *   finish inside NProgress's delay never paints a bar at all.
 */
describe("AppRouteProgress", () => {
	beforeEach(() => {
		vi.resetModules();
		configure.mockClear();
	});

	it("turns the spinner off and sets the trickle before any navigation happens", async () => {
		/*
		 * Configuration is module-level, so importing the component IS the call.
		 * The values are the visual contract: a spinner alongside the bar is two
		 * loading indicators for one navigation, and `minimum` is what stops the
		 * bar appearing to start from nothing on a fast route.
		 */
		await import("./AppRouteProgress");

		expect(configure).toHaveBeenCalledWith({
			minimum: 0.08,
			showSpinner: false,
			trickleSpeed: 200,
		});
	});

	it("renders nothing of its own", async () => {
		/*
		 * It drives a singleton that appends its own node to <body>. If this ever
		 * starts emitting an element, that element is unstyled, unplaced, and in
		 * the document on every page.
		 */
		const { AppRouteProgress } = await import("./AppRouteProgress");
		expect(renderToStaticMarkup(<AppRouteProgress />)).toBe("");
	});
});
