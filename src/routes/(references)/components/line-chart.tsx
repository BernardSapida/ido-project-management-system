import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Line chart";

/**
 * Line chart lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/line-chart")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: LineChartLab,
});

function LineChartLab() {
	return (
		<LabStub
			description={"One or more series over time, with the gaps that mean missing rather than zero."}
			scope={["Single and multi series", "Gaps for missing data - never dropped to zero"]}
			title={TITLE}
		/>
	);
}
