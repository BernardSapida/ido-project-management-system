import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/features/auth/utils/better-auth";
import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

async function handler({ request }: { request: Request }) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(request) });
	}

	const body = await request.json().catch(() => null);
	if (!body?.password) {
		return Response.json({ error: "password is required" }, { status: 400, headers: getCorsHeaders(request) });
	}

	try {
		await auth.api.signInEmail({
			body: { email: session.user.email, password: body.password },
			headers: request.headers,
		});
	} catch {
		return Response.json({ error: "Invalid password" }, { status: 400, headers: getCorsHeaders(request) });
	}

	const userId = session.user.id;
	await prisma.session.deleteMany({ where: { userId } });
	await prisma.account.deleteMany({ where: { userId } });
	await prisma.user.delete({ where: { id: userId } });

	return Response.json({ message: "Account deleted" }, { headers: getCorsHeaders(request) });
}

export const Route = createFileRoute("/api/auth/delete-account")({
	server: {
		handlers: {
			DELETE: handler,
			OPTIONS: ({ request }) => corsOptionsResponse(request),
		},
	},
});
