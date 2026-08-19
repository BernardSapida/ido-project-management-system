import { AppButton, AppCard } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { FileSignature, Hourglass } from "lucide-react";

interface CsmAwaitingStateProps {
	/** Opens the signed form. The page's, so one place knows where it lives. */
	onViewPdf: () => void;
}

/**
 * What a REVIEWER sees on a satisfaction record the requestor has not answered
 * yet. The owner gets the form instead; there is no state in which both are on
 * screen.
 *
 * ## Why this exists rather than a redirect
 *
 * A `Csm` row with no `submittedAt` used to be unreachable by anybody but its
 * owner, so the page had one answer for every "nothing to show here" - bounce
 * back to the request. That answer is wrong for a reviewer, who arrives by
 * typing a URL or following an old link: silently landing them back where they
 * started reads as a broken page, and they cannot tell it apart from the request
 * having no feedback at all. Saying so costs one card.
 *
 * It leaks nothing. Whoever can see this can already read the request's own
 * status, which says the same thing in the chip at the top of it.
 */
export function CsmAwaitingState({ onViewPdf }: CsmAwaitingStateProps) {
	return (
		<AppCard
			data-cy="csm-awaiting"
			description="The request was approved and the form has been sent. Nothing has been answered yet."
			headingLevel={2}
			icon={Hourglass}
			title="Awaiting the requestor's feedback"
		>
			<div className="flex flex-col gap-6">
				{/* Named because "not yet" invites the next question, and the answer is
				    one nobody can act on from here: only the requestor can fill this in,
				    and there is no reminder to send them. */}
				<Typography
					color="muted"
					type="body-sm"
				>
					Only the requestor can complete it, and it is the last step before the request is marked complete.
				</Typography>

				{/* The only thing to DO from here. The way back out is the page's, at
				    the top - it has to be reachable in the loading and error states too,
				    and this card renders in neither. */}
				<div>
					<AppButton
						data-cy="csm-awaiting-pdf"
						icon={FileSignature}
						onPress={onViewPdf}
						variant="secondary"
					>
						Open the signed form
					</AppButton>
				</div>
			</div>
		</AppCard>
	);
}
