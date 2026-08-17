import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Command";

/**
 * Command lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/command")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: CommandLab,
});

function CommandLab() {
	return (
		<LabStub
			description={"The keyboard palette: one field over every destination and action, grouped and ranked."}
			scope={["Grouped results", "Keyboard-only operation end to end", "Empty and no-results states"]}
			title={TITLE}
		/>
	);
}
