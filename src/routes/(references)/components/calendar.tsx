import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Calendar";

/**
 * Calendar lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/calendar")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: CalendarLab,
});

function CalendarLab() {
	return (
		<LabStub
			description={"The month grid on its own, as a page-level control rather than a popover."}
			scope={["Single month", "Bounds and disabled days said out loud, not greyed in silence"]}
			title={TITLE}
		/>
	);
}
