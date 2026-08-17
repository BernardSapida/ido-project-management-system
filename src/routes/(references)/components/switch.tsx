import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Switch";

/**
 * Switch lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/switch")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: SwitchLab,
});

function SwitchLab() {
	return (
		<LabStub
			description={"A setting that applies the moment it moves - no Save, and no confirmation."}
			scope={["On, off, disabled", "With a description under the label", "Why this is not a checkbox"]}
			title={TITLE}
		/>
	);
}
