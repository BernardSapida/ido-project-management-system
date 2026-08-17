import { env } from "@/env";

const ALLOWED_ORIGINS = [env.VITE_BASE_URL, env.MOBILE_DEV_URL ?? "http://localhost:8081"];

export function getCorsHeaders(request: Request): Record<string, string> {
	const origin = request.headers.get("Origin");
	// Expo Go sends "null" as a string origin — treat it as the mobile dev URL
	const resolvedOrigin =
		!origin || origin === "null"
			? (env.MOBILE_DEV_URL ?? "http://localhost:8081")
			: ALLOWED_ORIGINS.includes(origin)
				? origin
				: env.VITE_BASE_URL;

	console.log("resolvedOrigin", resolvedOrigin);

	return {
		"Access-Control-Allow-Origin": resolvedOrigin,
		"Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization, Origin",
		"Access-Control-Allow-Credentials": "true",
	};
}

export function corsOptionsResponse(request: Request): Response {
	return new Response(null, { headers: getCorsHeaders(request), status: 204 });
}
