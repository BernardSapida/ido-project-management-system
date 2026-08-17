import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabStub } from "@/features/labs/components/LabStub";

const TITLE = "Gallery";

/**
 * Gallery lab - a stub. Title, scope, no specimen.
 *
 * It is in the labs nav so the checklist and the app agree on what exists;
 * see `features/labs/labs.registry.ts`. To finish it: replace `LabStub` with
 * real sections and drop `isStub` from this lab's registry entry.
 */
export const Route = createFileRoute("/(references)/components/gallery")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: GalleryLab,
});

function GalleryLab() {
	return (
		<LabStub
			description={"A grid of images - fixed squares, and a dynamic-size layout that keeps every aspect ratio."}
			scope={[
				"Square tiles - every image fitted to the same box",
				"Dynamic sizes - tiles that keep each image's ratio",
			]}
			title={TITLE}
		/>
	);
}
