import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Empty state";

/**
 * Empty state lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/empty-state")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: EmptyStateLab,
});

function EmptyStateLab() {
	return (
		<LabStub
			description={"Nothing here, and what to do about it: icon, title, description, one action. Never a blank panel."}
			scope={[
				"Icon, title, description and a call to action",
				"Nothing yet vs filtered to nothing - two different states",
			]}
			title={TITLE}
		/>
	);
}
