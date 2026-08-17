import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Alert";

/**
 * Alert lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/alert")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: AlertLab,
});

function AlertLab() {
	return (
		<LabStub
			description={"The inline severity block - the one the error state is built from, on its own."}
			scope={["One specimen per severity", "With and without an action", "What the error state lab reuses from it"]}
			title={TITLE}
		/>
	);
}
