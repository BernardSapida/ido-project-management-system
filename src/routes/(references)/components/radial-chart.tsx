import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Radial chart";

/**
 * Radial chart lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/radial-chart")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: RadialChartLab,
});

function RadialChartLab() {
	return (
		<LabStub
			description={"Progress wound into an arc, with the value read from the centre rather than the sweep."}
			scope={["Single arc with a centre readout", "Stacked arcs"]}
			title={TITLE}
		/>
	);
}
