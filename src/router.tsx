import { AppNotFound } from "@bernardsapida/web-ui";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import type { ReactNode } from "react";
import TanStackQueryProvider, { getContext } from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	// Built once per router. On the server `getContext()` returns a fresh context
	// per request, so it must not be called a second time deeper in the tree.
	const context = getContext();

	const router = createTanStackRouter({
		routeTree,
		context,
		trailingSlash: "never",
		scrollRestoration: true,
		defaultPreload: "intent",
		// Preload-on-intent fires a route's beforeLoad on every hover. With a
		// staleTime of 0 nothing is reused, so each hover re-ran the session check.
		// 30s keeps preloading snappy without hammering the server (TanStack Query
		// still owns freshness for actual route data).
		defaultPreloadStaleTime: 30_000,
		defaultNotFoundComponent: AppNotFound,

		// Mounted here rather than inside `__root`'s shell so the query/tRPC
		// providers sit outside the router's render tree and keep a stable identity
		// across navigations.
		Wrap: ({ children }: { children: ReactNode }) => (
			<TanStackQueryProvider context={context}>{children}</TanStackQueryProvider>
		),
	});

	// Dehydrates the query cache into the SSR payload and streams each query into
	// the HTML as it resolves, so hydration reuses server data instead of
	// refetching it. Also navigates the router when a query or mutation throws
	// `redirect()`. This wraps `Wrap` above with the QueryClientProvider, which is
	// why root-provider no longer mounts one.
	setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
