import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Number field";

/**
 * Number field lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/number-field")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: NumberFieldLab,
});

function NumberFieldLab() {
	return (
		<LabStub
			description={"A number with a locale-aware format, min/max, and no way to type letters into it."}
			scope={[
				"Min, max and step",
				"Currency and percentage formatting",
				"Label, validation, isRequired and an ErrorMessage, wired through useAppForm like every other App* field",
			]}
			title={TITLE}
		/>
	);
}
