import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Radar chart";

/**
 * Radar chart lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/radar-chart")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: RadarChartLab,
});

function RadarChartLab() {
	return (
		<LabStub
			description={"Several measures on one shape, for comparing profiles rather than reading values."}
			scope={["One profile", "Two profiles overlaid"]}
			title={TITLE}
		/>
	);
}
