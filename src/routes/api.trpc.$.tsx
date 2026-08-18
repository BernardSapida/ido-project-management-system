import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcRouter } from "@/integrations/trpc/router";
import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";

function handler({ request }: { request: Request }) {
	/*
	 * One per request, handed to the context and read back in `responseMeta`.
	 *
	 * `responseMeta` runs after every procedure in the batch has resolved, which
	 * is what makes this work: a resolver appends a `set-cookie` here (see
	 * `profile.updateMyProfile`, which re-reads the session to refresh
	 * `profileComplete`) and it is on the response by the time it is built.
	 * Without it a resolver has no way to reach the response at all.
	 */
	const responseHeaders = new Headers();

	return fetchRequestHandler({
		createContext: () => ({ headers: request.headers, responseHeaders }),
		endpoint: "/api/trpc",
		req: request,
		router: trpcRouter,
		responseMeta: () => {
			const headers = new Headers(getCorsHeaders(request));

			// `append`, and `getSetCookie` rather than `get`: a session refresh can
			// set more than one cookie, and `set` would collapse them into one
			// comma-joined header the browser drops on the floor.
			for (const cookie of responseHeaders.getSetCookie()) headers.append("set-cookie", cookie);

			return { headers };
		},
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
