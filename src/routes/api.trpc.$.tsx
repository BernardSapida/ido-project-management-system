import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcRouter } from "@/integrations/trpc/router";
import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";

function handler({ request }: { request: Request }) {
	return fetchRequestHandler({
		createContext: () => ({ headers: request.headers }),
		endpoint: "/api/trpc",
		req: request,
		router: trpcRouter,
		responseMeta: () => ({ headers: getCorsHeaders(request) }),
	});
}

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: handler,
			OPTIONS: ({ request }) => corsOptionsResponse(request),
			POST: handler,
		},
	},
});
