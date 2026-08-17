import { createFileRoute } from "@tanstack/react-router";
import Pusher from "pusher";
import { env } from "@/env";
import { auth } from "@/features/auth/utils/better-auth";
import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";

function getPusher() {
	if (!env.PUSHER_APP_ID || !env.VITE_PUSHER_KEY || !env.PUSHER_APP_SECRET) {
		return null;
	}
	return new Pusher({
		appId: env.PUSHER_APP_ID,
		cluster: env.VITE_PUSHER_CLUSTER,
		key: env.VITE_PUSHER_KEY,
		secret: env.PUSHER_APP_SECRET,
	});
}

export const Route = createFileRoute("/api/pusher/auth")({
	server: {
		handlers: {
			OPTIONS: ({ request }) => corsOptionsResponse(request),
			POST: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session) {
					return new Response("Unauthorized", { status: 401 });
				}

				const pusher = getPusher();
				if (!pusher) {
					return new Response("Pusher not configured", { status: 503 });
				}

				const body = await request.formData();
				const socketId = body.get("socket_id") as string | null;
				const channelName = body.get("channel_name") as string | null;

				if (!socketId || !channelName) {
					return new Response("Missing socket_id or channel_name", { status: 400 });
				}

				const expectedChannel = `private-user-${session.user.id}`;
				if (channelName !== expectedChannel) {
					return new Response("Forbidden", { status: 403 });
				}

				const authResponse = pusher.authorizeChannel(socketId, channelName);
				return new Response(JSON.stringify(authResponse), {
					headers: {
						...getCorsHeaders(request),
						"Content-Type": "application/json",
					},
				});
			},
		},
	},
});
