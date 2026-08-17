import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Pie chart";

/**
 * Pie chart lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/pie-chart")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: PieChartLab,
});

function PieChartLab() {
	return (
		<LabStub
			description={"Parts of one whole, and the slice count past which this is the wrong chart."}
			scope={["Pie and donut", "The slice count where a bar chart wins"]}
			title={TITLE}
		/>
	);
}
