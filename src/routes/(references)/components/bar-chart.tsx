import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Bar chart";

/**
 * Bar chart lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/bar-chart")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: BarChartLab,
});

function BarChartLab() {
	return (
		<LabStub
			description={"Categories against a common baseline - grouped, stacked, and horizontal when the labels are long."}
			scope={["Grouped", "Stacked", "Horizontal, for long category labels"]}
			title={TITLE}
		/>
	);
}
