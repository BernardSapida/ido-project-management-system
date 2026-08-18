import { AppAlert } from "@bernardsapida/web-ui";
import { useRouter } from "@tanstack/react-router";
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
	const router = useRouter();

	if (completionStatus !== "CSM_PENDING") return null;

	return (
		<AppAlert
			action={{
				label: "Fill out the form",
				/*
				 * `href`, not `to`. `/requests/$requestId/csm` is spec 015 and is not in
				 * the route tree yet, so a typed navigation to it would not compile
				 * today. Convert this when that spec lands; nothing fails if it is left,
				 * which is the reason it is written down here.
				 */
				onPress: () => void router.navigate({ href: `/requests/${requestId}/csm` }),
			}}
			data-cy="csm-prompt"
			description="Tell us how it went. The satisfaction form is the last step and it takes a minute."
			icon={ClipboardCheck}
			status="success"
			title="Your request has been approved"
		/>
	);
}
