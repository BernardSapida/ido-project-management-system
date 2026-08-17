import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";
import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";

export const Route = createFileRoute("/api/app/config")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const body = JSON.stringify({
					currentVersion: env.APP_VERSION,
					maintenanceMessage: env.MAINTENANCE_MESSAGE ?? null,
					maintenanceMode: env.MAINTENANCE_MODE === "true",
					minimumVersion: env.MINIMUM_APP_VERSION,
				});
				return new Response(body, {
					headers: {
						...getCorsHeaders(request),
						"Content-Type": "application/json",
					},
				});
			},
			OPTIONS: ({ request }) => corsOptionsResponse(request),
		},
	},
});
