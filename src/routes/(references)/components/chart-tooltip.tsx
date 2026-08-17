import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Chart tooltip";

/**
 * Chart tooltip lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/chart-tooltip")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: ChartTooltipLab,
});

function ChartTooltipLab() {
	return (
		<LabStub
			description={"The readout every chart here shares: one hovered point, every series, aligned units."}
			scope={["One row per series at the hovered point", "Follows the pointer without covering the mark"]}
			title={TITLE}
		/>
	);
}
