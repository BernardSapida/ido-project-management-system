import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Area chart";

/**
 * Area chart lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/area-chart")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: AreaChartLab,
});

function AreaChartLab() {
	return (
		<LabStub
			description={"A filled trend over time, and what the fill claims that a line does not."}
			scope={["Single series", "Stacked series", "The shared chart tooltip on hover"]}
			title={TITLE}
		/>
	);
}
