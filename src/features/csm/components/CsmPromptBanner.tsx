import { AppAlert } from "@bernardsapida/web-ui";
import { useNavigate } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";

interface CsmPromptBannerProps {
	/** The request's own `completionStatus`. The banner decides from it. */
	completionStatus: string | null;
	requestId: string;
}

/**
 * The last thing a requestor is asked for: the satisfaction form.
 *
 * It renders only while `completionStatus` is `CSM_PENDING`, so a caller may
 * mount it unconditionally. WHO may see it is the page's decision - the owner
 * and nobody else - and that is a display rule, not a gate: the CSM route and
 * every one of its procedures check ownership themselves (spec 015), because a
 * banner a staff reader cannot see is still a URL they can type.
 *
 * `AppAlert`'s own `action` rather than an `AppButton` beside it. The banner has
 * one thing to ask for and the component already lays that out and wears the
 * status gradient; a second button placed next to it is a second primary on a
 * screen that is meant to have one.
 */
export function CsmPromptBanner({ completionStatus, requestId }: CsmPromptBannerProps) {
	const navigate = useNavigate();

	if (completionStatus !== "CSM_PENDING") return null;

	return (
		<AppAlert
			action={{
				label: "Fill out the form",
				/*
				 * A typed navigation now that spec 015 has put the route in the tree. It
				 * was an `href` until then, because a `to` cannot name a route that does
				 * not exist yet. The destination checks ownership itself and redirects
				 * back here if the request has no satisfaction record - so this banner
				 * being hidden for a non-owner is a display rule, never the gate.
				 */
				onPress: () => void navigate({ params: { requestId }, to: "/requests/$requestId/csm" }),
			}}
			data-cy="csm-prompt"
			description="Tell us how it went. The satisfaction form is the last step and it takes a minute."
			icon={ClipboardCheck}
			status="success"
			title="Your request has been approved"
		/>
	);
}
