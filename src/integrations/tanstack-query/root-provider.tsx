import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { createTRPCClient, httpBatchStreamLink, type TRPCClient, TRPCClientError } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { ReactNode } from "react";
import superjson from "superjson";
import { queryClientConfig } from "@/config/query-client";
import { env } from "@/env";
import type { TRPCRouter } from "@/integrations/trpc/router";
import { TRPCProvider } from "../trpc/react";
import { getServerHeaders } from "./get-headers.server";

const getHeaders = createIsomorphicFn()
	.client(() => ({}))
	.server(getServerHeaders);

export type AppContext = {
	queryClient: QueryClient;
	trpc: ReturnType<typeof createTRPCOptionsProxy<TRPCRouter>>;
	trpcClient: TRPCClient<TRPCRouter>;
};

// Singleton client context on the browser
let clientContext: AppContext | undefined;

function getUrl() {
	const base = (() => {
		if (typeof window !== "undefined") return "";
		return env.VITE_BASE_URL;
	})();
	return `${base}/api/trpc`;
}

function handleQueryError(error: unknown) {
	if (typeof window === "undefined") return;
	if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") {
		window.location.assign("/sign-in");
	}
}

// In SSR, we need fresh instances per request. In CSR, we want a singleton.
export function getContext(): AppContext {
	// Only reuse the context in the browser
	if (typeof window !== "undefined" && clientContext) {
		return clientContext;
	}

	const trpcClient = createTRPCClient<TRPCRouter>({
		links: [
			httpBatchStreamLink({
				headers: getHeaders,
				transformer: superjson,
				url: getUrl(),
			}),
		],
	});

	const queryClient = new QueryClient({
		...queryClientConfig,
		queryCache: new QueryCache({ onError: handleQueryError }),
		defaultOptions: {
			...queryClientConfig.defaultOptions,
			dehydrate: { serializeData: superjson.serialize },
			hydrate: { deserializeData: superjson.deserialize },
		},
	});

	const trpc = createTRPCOptionsProxy({
		client: trpcClient,
		queryClient: queryClient,
	});

	const context: AppContext = {
		queryClient,
		trpc,
		trpcClient,
	};

	if (typeof window !== "undefined") {
		clientContext = context;
	}

	return context;
}

// The context is built once in `getRouter` and handed down. Calling `getContext()`
// here instead would mint a SECOND QueryClient and tRPC client on every SSR request
// - the singleton guard above is client-only - so nothing the router context
// prefetched would be visible to the components rendering under this provider.
//
// `QueryClientProvider` is not mounted here: `setupRouterSsrQueryIntegration` wraps
// `router.options.Wrap` with one, using this same queryClient.
export default function TanStackQueryProvider({ children, context }: { children: ReactNode; context: AppContext }) {
	const { queryClient, trpcClient } = context;

	return (
		<TRPCProvider
			queryClient={queryClient}
			trpcClient={trpcClient}
		>
			{children}
		</TRPCProvider>
	);
}
