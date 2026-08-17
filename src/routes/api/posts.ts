import { createFileRoute } from "@tanstack/react-router";
import { corsOptionsResponse, getCorsHeaders } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

export const Route = createFileRoute("/api/posts")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const posts = await prisma.post.findMany({
					orderBy: { createdAt: "asc" },
					select: {
						id: true,
						title: true,
						description: true,
						author: true,
						createdAt: true,
					},
				});

				return new Response(JSON.stringify(posts), {
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
