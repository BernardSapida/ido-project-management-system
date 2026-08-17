import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/features/auth/utils/better-auth";
import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";

async function handler({ request }: { request: Request }) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(request) });
	}

	const body = await request.json().catch(() => null);
	if (!body?.currentPassword || !body?.newPassword) {
		return Response.json(
			{ error: "currentPassword and newPassword are required" },
			{ status: 400, headers: getCorsHeaders(request) },
		);
	}

	try {
		await auth.api.changePassword({
			body: {
				currentPassword: body.currentPassword,
				newPassword: body.newPassword,
				revokeOtherSessions: false,
			},
			headers: request.headers,
		});
		return Response.json({ message: "Password changed" }, { headers: getCorsHeaders(request) });
	} catch {
		return Response.json({ error: "Invalid current password" }, { status: 400, headers: getCorsHeaders(request) });
	}
}

export const Route = createFileRoute("/api/auth/change-password")({
	server: {
		handlers: {
			POST: handler,
			OPTIONS: ({ request }) => corsOptionsResponse(request),
		},
	},
});
