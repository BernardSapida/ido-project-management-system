import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Time picker";

/**
 * Time picker lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/time-picker")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: TimePickerLab,
});

function TimePickerLab() {
	return (
		<LabStub
			description={"A wheel for HH : MM AM/PM, for the case where segments are the wrong input on a phone."}
			scope={["Wheel for HH : MM AM/PM", "How it differs from the segmented AppTimeField"]}
			title={TITLE}
		/>
	);
}
