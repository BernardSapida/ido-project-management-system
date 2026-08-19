import { AppCard, AppChip, AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FinalDirectorActionButtons } from "@/features/final-director-approval/components/FinalDirectorActionButtons";
import { SignatureSummary } from "@/features/final-director-approval/components/SignatureSummary";
import { useFinalDirectorApprovalRequest } from "@/features/final-director-approval/hooks/use-final-director-approval-queries";
import { RequestCommentThread } from "@/features/request-comments/components/RequestCommentThread";
import { RequestActivityFeed } from "@/features/request-detail/components/RequestActivityFeed";
import { RequestDetailSkeleton } from "@/features/request-detail/components/RequestDetailSkeleton";
import { RequestForm } from "@/features/request-form/components/RequestForm";
import { toRequestFormValues } from "@/features/request-form/validations/schema/request.schema";
import { finalDirectorStatusMap } from "@/lib/status-maps/request-status";
import { USER_ROLES } from "@/utils/config";

/** One role, and it appears TWICE in the workflow. This page is the director's
 *  FINAL approval; their first one is spec 012 and a different page with a
 *  different guard. `resolveReviewRoute` tells the two apart by
 *  `finalDirectorStatus`, never by the role - and so does every guard behind
 *  this page. */
const FINAL_DIRECTOR_ROLES = [USER_ROLES.DIRECTOR];

export const Route = createFileRoute("/_authenticated/requests/$requestId/final-director-approval")({
	/**
	 * Role-gated, and it only ORGANISES.
	 *
	 * Both procedures are `roleProcedure("DIRECTOR")` over
	 * `assertPermission(APPROVE_DIRECTOR)` over the stage check on
	 * `finalDirectorStatus`, so an IDO_CHAIRPERSON who reaches this page by any
	 * route - a shared link, a role changed while the tab sat open - gets a page
	 * whose every button answers FORBIDDEN, even though they signed the request
	 * moments before. The gate is here so they are sent to /unauthorized instead
	 * of discovering it one press at a time.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({ data: { allowedRoles: FINAL_DIRECTOR_ROLES } });
	},
	head: () => ({
		meta: [{ title: seo.title("Final Approval") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Final Approval",
	},
	component: FinalDirectorApprovalPage,
});

function FinalDirectorApprovalPage() {
	const { requestId } = Route.useParams();
	const { user } = useAuth();
	const { data: request, error, isError, isPending, refetch } = useFinalDirectorApprovalRequest(requestId);

	if (isPending) return <RequestDetailSkeleton />;

	/*
	 * NOT_FOUND on a mistyped id, told apart from FORBIDDEN by `AppQueryError`.
	 * DIRECTOR is in `REQUEST_READER_ROLES`, so a FORBIDDEN here is close to
	 * unreachable - an account whose role changed while this tab sat open is the
	 * case that produces one, and it needs the same answer.
	 */
	if (isError) {
		return (
			<AppQueryError
				data-cy="final-director-error"
				error={error}
				onRetry={() => void refetch()}
			/>
		);
	}

	/*
	 * The SUB-STAGE chip, and here it is the only honest one available.
	 *
	 * `masterStatus` reads "Final Review" while this desk holds the request and
	 * "Approved" once it has signed - which is where the request IS, but never
	 * which of the director's TWO decisions produced it. `finalDirectorStatus` is
	 * the column this page's guard reads and the one the printed form's signatures
	 * hang on, and `getById` sends it to this desk alone.
	 */
	const stage = request.finalDirectorStatus ? finalDirectorStatusMap[request.finalDirectorStatus] : undefined;

	/*
	 * The signature is read from the SESSION, not from the request.
	 *
	 * Two different facts. "Do I have a signature to stamp?" is about the director
	 * and lives on their profile; `finalDirectorSignatureUrl` on the request is
	 * the copy of whatever was stamped at approval time, deliberately frozen, and
	 * says nothing about whether a new approval is possible. The session carries
	 * `signatureUrl` as a Better Auth additional field and `profile.updateMyProfile`
	 * mints a fresh cookie on save, so this is current the moment they come back
	 * from /profile.
	 *
	 * It decides nothing. `finalDirectorApprove` re-reads the user row and
	 * refuses.
	 */
	const hasSignature = Boolean(user?.signatureUrl);

	/* The PDF opens in a NEW TAB: it is a document to read beside the request, and
	   a router navigation would lose the request behind it. Still an `href` - the
	   route ships in spec 016 and a typed `to` cannot name one that does not exist
	   yet. Held here rather than in the action card so there is one place that
	   knows where the document lives. */
	const openPdf = () => {
		window.open(`/requests/${requestId}/pdf`, "_blank", "noopener,noreferrer");
	};

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				action={
					/* Which STAGE it is at, and nothing else. The document number used to
					   sit beside it as a muted string; it is a field of the request, so it
					   is read in the Request information card with the rest of them, and
					   View PDF sits in the form's rail where every other role's does. */
					stage ? (
						<AppChip
							data-cy="final-director-status"
							icon={stage.icon}
							label={stage.label}
							tone={stage.tone}
						/>
					) : null
				}
				subtitle="The last approval. Signing here approves the request and releases the signed form."
				title="Final Approval"
			/>

			{/* The same component the requestor filled in, read-only - so the director
			    is looking at the document rather than at a summary of it. `canSubmit`
			    is false: only the owner may send a request, and a Submit button here
			    could only answer FORBIDDEN. */}
			<RequestForm
				canSubmit={false}
				defaultValues={toRequestFormValues(request)}
				documentNumber={request.documentNumber}
				forceReadOnly
				idoEvaluationStatus={request.idoEvaluationStatus}
				masterStatus={request.masterStatus}
				mode="edit"
				processor={request.processor}
				requestId={requestId}
			/>

			{/* The summary takes the width and the actions sit beside it. The same
			    two-column rhythm as the four review pages before it, and here it
			    carries more weight than anywhere else: the three signatures ARE what is
			    being decided about, so they get the measure and the decision panel sits
			    within reach of them. */}
			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
				<SignatureSummary request={request} />

				<FinalDirectorActionButtons
					canApprove={request.canApproveDirector}
					finalDirectorSignatureUrl={request.finalDirectorSignatureUrl}
					finalDirectorSignedAt={request.finalDirectorSignedAt}
					finalDirectorStatus={request.finalDirectorStatus}
					hasSignature={hasSignature}
					onViewPdf={openPdf}
					requestId={requestId}
				/>
			</div>

			<AppCard
				description="Every step this request has been through."
				headingLevel={2}
				title="Activity"
			>
				<RequestActivityFeed auditLogs={request.auditLogs} />
			</AppCard>

			{/* Where a director asks a question without rejecting the request - which is
			    the only alternative this system has, there being no email, and the last
			    chance anybody gets to raise one. Below the activity feed for the reason
			    the detail page puts it there: what has HAPPENED, then what is being
			    ASKED. */}
			<RequestCommentThread requestId={requestId} />
		</div>
	);
}
