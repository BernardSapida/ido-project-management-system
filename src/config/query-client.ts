import type { QueryClientConfig } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

export const queryClientConfig: QueryClientConfig = {
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			gcTime: 10 * 60 * 1000, // 10 minutes
			retry: 3,
		},
	},
};

export const queryClient = new QueryClient(queryClientConfig);
