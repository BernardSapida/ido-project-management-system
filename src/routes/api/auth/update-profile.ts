import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/features/auth/utils/better-auth";
import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";

async function handler({ request }: { request: Request }) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(request) });
	}

	const body = await request.json().catch(() => null);
	if (!body?.firstname || !body?.lastname) {
		return Response.json(
			{ error: "firstname and lastname are required" },
			{ status: 400, headers: getCorsHeaders(request) },
		);
	}

	await auth.api.updateUser({
		body: {
			firstname: body.firstname,
			lastname: body.lastname,
			name: `${body.firstname} ${body.lastname}`.trim(),
		},
		headers: request.headers,
	});

	// `updateUser` answers `{ status: boolean }` - it does not echo the row back.
	// The updated user is read back from the session so this endpoint keeps its
	// `{ user }` response shape, which the mobile client depends on.
	const updated = await auth.api.getSession({ headers: request.headers });

	return Response.json({ user: updated?.user ?? null }, { headers: getCorsHeaders(request) });
}

export const Route = createFileRoute("/api/auth/update-profile")({
	server: {
		handlers: {
			PATCH: handler,
			OPTIONS: ({ request }) => corsOptionsResponse(request),
		},
	},
});
