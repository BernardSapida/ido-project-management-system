import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { useTRPC } from "@/integrations/trpc/react";

export const Route = createFileRoute("/test")({
	head: () => ({
		meta: [{ title: seo.title("DB Connection Test") }, { name: "robots", content: "noindex" }],
	}),
	staticData: {
		breadcrumb: "Test",
	},
	component: TestPage,
});

function TestPage() {
	const trpc = useTRPC();
	const { data, error, isLoading } = useQuery(trpc.post.list.queryOptions());

	return (
		<div className="min-h-screen bg-app-base px-6 py-16">
			<div className="mx-auto w-full max-w-3xl">
				<h1 className="text-2xl font-bold text-text-primary">Database Connection Test</h1>
				<p className="mt-2 text-text-secondary">
					Raw <code>post.list</code> payload from the monolith database. If you see rows below, the web app is
					connected.
				</p>

				<pre className="mt-8 overflow-x-auto rounded-2xl border border-text-primary/10 bg-black/5 p-6 text-sm text-text-primary dark:bg-white/5">
					{isLoading ? "Loading…" : error ? `Error: ${error.message}` : JSON.stringify(data, null, 2)}
				</pre>
			</div>
		</div>
	);
}
