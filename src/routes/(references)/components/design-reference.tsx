import { AppPageHeader, AppTokenSwatchGrid } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";

// Developer reference under /components, which owns the backdrop and the nav.
export const Route = createFileRoute("/(references)/components/design-reference")({
	head: () => ({
		meta: [{ title: seo.title("Design reference") }, { content: "noindex", name: "robots" }],
	}),
	component: DesignReferencePage,
});

function DesignReferencePage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Every token, gradient and surface on one page."
				title="Design reference"
			/>
			<AppTokenSwatchGrid />
		</div>
	);
}
