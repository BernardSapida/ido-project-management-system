import { AppButton, AppPageHeader, AppSelect, AppStepper } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedFn } from "@/features/auth/functions/auth.functions";
import { RequestPdfViewer } from "@/features/request-pdf/components/RequestPdfViewer";
import {
	type DemoScenario,
	PDF_DEMO_SCENARIOS,
	requestAtStage,
	signaturesAtStage,
} from "@/features/request-pdf/lib/pdf-demo-scenarios";

export const Route = createFileRoute("/_authenticated/requests/pdf/demo")({
	/**
	 * Signed in, and nothing narrower.
	 *
	 * There is no request behind this page - the document is synthesised from
	 * `PDF_DEMO_SCENARIOS` and the server is never asked for anything - so there
	 * is no owner to check and no per-request rule to apply. It is a reference
	 * page about the FORM, and every role that ever touches a request has reason
	 * to read it.
	 *
	 * A static path, deliberately: `/requests/pdf/demo` cannot collide with
	 * `/requests/$requestId/pdf`, because that one wants `pdf` as its LAST
	 * segment and this one wants it as the first of two.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedFn();
	},
	head: () => ({
		meta: [{ title: seo.title("PDF walkthrough") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "PDF walkthrough",
	},
	component: RequestPdfDemoPage,
});

function RequestPdfDemoPage() {
	const [scenarioKey, setScenarioKey] = useState(PDF_DEMO_SCENARIOS[0].key);
	const [stageIndex, setStageIndex] = useState(0);

	const scenario: DemoScenario = PDF_DEMO_SCENARIOS.find((entry) => entry.key === scenarioKey) ?? PDF_DEMO_SCENARIOS[0];

	/*
	 * Clamped rather than reset to 0 when the scenario changes. The paths share
	 * their opening stages, so somebody comparing "what does Draft look like on a
	 * rejected request" keeps their place instead of being sent back to the start
	 * of the new path.
	 */
	const currentStage = Math.min(stageIndex, scenario.stages.length - 1);
	const stage = scenario.stages[currentStage];

	const request = useMemo(() => requestAtStage(scenario, currentStage), [scenario, currentStage]);
	const signatures = useMemo(() => signaturesAtStage(request), [request]);

	const isFirst = currentStage === 0;
	const isLast = currentStage === scenario.stages.length - 1;

	const changeScenario = (value: string | null) => {
		if (!value) return;

		setScenarioKey(value);
		setStageIndex((index) =>
			Math.min(index, (PDF_DEMO_SCENARIOS.find((e) => e.key === value)?.stages.length ?? 1) - 1),
		);
	};

	return (
		<div className="flex w-full flex-col gap-4">
			<AppPageHeader
				subtitle="The printed form at each stage of a request, without filing one. Nothing here touches the database."
				title="Building Design Request Form — walkthrough"
			/>

			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div className="w-full md:max-w-100">
					<AppSelect
						data-cy="pdf-demo-scenario"
						description={scenario.description}
						items={PDF_DEMO_SCENARIOS.map((entry) => ({ label: entry.label, value: entry.key }))}
						label="Scenario"
						onChange={changeScenario}
						value={scenario.key}
					/>
				</div>

				{/* Prev and Next as a pair, and the STEPPER is the other way to move -
				    `onStepChange` lets a reader jump straight back to a stage they have
				    already passed, which is what somebody comparing two stages wants. */}
				<div className="flex items-center gap-2">
					<AppButton
						data-cy="pdf-demo-prev"
						icon={ChevronLeft}
						isDisabled={isFirst}
						onPress={() => setStageIndex(currentStage - 1)}
						variant="secondary"
					>
						Previous
					</AppButton>
					<Typography
						color="muted"
						type="body-sm"
					>
						{`${currentStage + 1} of ${scenario.stages.length}`}
					</Typography>
					<AppButton
						data-cy="pdf-demo-next"
						icon={ChevronRight}
						isDisabled={isLast}
						onPress={() => setStageIndex(currentStage + 1)}
						variant="primary"
					>
						Next
					</AppButton>
				</div>
			</div>

			<AppStepper
				currentStep={currentStage}
				data-cy="pdf-demo-stepper"
				onStepChange={setStageIndex}
				steps={scenario.stages.map((entry) => ({ icon: entry.icon, key: entry.key, label: entry.label }))}
			/>

			{/* The sentence that makes the page worth having. Three of the seven happy
			    path stages change nothing on the sheet, and a reader watching an
			    unchanged preview needs to be told that is the answer rather than a
			    page that failed to update. */}
			<Typography
				color="muted"
				data-cy="pdf-demo-note"
				type="body-sm"
			>
				<strong>{stage.label}. </strong>
				{stage.note}
			</Typography>

			<RequestPdfViewer
				error={null}
				isError={false}
				isLoading={false}
				request={request}
				signatures={signatures}
			/>
		</div>
	);
}
