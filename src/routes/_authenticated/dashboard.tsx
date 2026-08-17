import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedFn } from "@/features/auth/functions/auth.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
	beforeLoad: async () => {
		return await assertAuthenticatedFn();
	},
	head: () => ({
		meta: [{ title: seo.title("Dashboard") }, { name: "robots", content: "noindex" }],
	}),
	staticData: {
		breadcrumb: "Dashboard",
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_authenticated/dashboard"!</div>;
}
