import { AppButton, AppCard, AppChip, AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ApprovalTrail } from "@/features/director-review/components/ApprovalTrail";
import { DirectorActionButtons } from "@/features/director-review/components/DirectorActionButtons";
import { useDirectorReviewRequest } from "@/features/director-review/hooks/use-director-review-queries";
import { RequestCommentThread } from "@/features/request-comments/components/RequestCommentThread";
import { RequestActivityFeed } from "@/features/request-detail/components/RequestActivityFeed";
import { RequestDetailSkeleton } from "@/features/request-detail/components/RequestDetailSkeleton";
import { RequestForm } from "@/features/request-form/components/RequestForm";
import { toRequestFormValues } from "@/features/request-form/validations/schema/request.schema";
import { BUDGET_ACTIONABLE_DIRECTOR_STATUS, directorReviewStatusMap } from "@/lib/status-maps/request-status";
import { USER_ROLES } from "@/utils/config";

/** One role, and it appears TWICE in the workflow. This page is the director's
 *  first approval; their final one is spec 014 and a different page with a
 *  different guard. `resolveReviewRoute` tells the two apart by
 *  `finalDirectorStatus`, never by the role. */
const DIRECTOR_REVIEW_ROLES = [USER_ROLES.DIRECTOR];

export const Route = createFileRoute("/_authenticated/requests/$requestId/director-review")({
	/**
	 * Role-gated, and it only ORGANISES.
	 *
	 * Both procedures are `roleProcedure("DIRECTOR")` over
	 * `assertPermission(APPROVE_DIRECTOR)` over the stage check, so a BUDGET_OFFICER
	 * or an IDO desk who reaches this page by any route - a shared link, a role
	 * changed while the tab sat open - gets a page whose every button answers
	 * FORBIDDEN. The gate is here so they are sent somewhere useful instead of
	 * discovering it one press at a time.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({ data: { allowedRoles: DIRECTOR_REVIEW_ROLES } });
	},
	head: () => ({
		meta: [{ title: seo.title("Director Review") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Director Review",
		mainWidth: "wide",
	},
	component: DirectorReviewPage,
});

function DirectorReviewPage() {
	const { requestId } = Route.useParams();
	const { user } = useAuth();
	const { data: request, error, isError, isPending, refetch } = useDirectorReviewRequest(requestId);

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
				data-cy="director-review-error"
				error={error}
				onRetry={() => void refetch()}
			/>
		);
	}

	/*
	 * The SUB-STAGE chip, not `masterStatus`.
	 *
	 * `masterStatus` reads "Director Review" for the budget desk's stage AND for
	 * this one, so a chip built from it could not tell the director whether the
	 * budget officer is still holding the request - which is the single fact this
	 * page exists to put in front of them. `directorReviewStatusMap` is what it
	 * reads, and `getById` sends the column to the two approver desks only.
	 */
	const stage = request.directorReviewStatus ? directorReviewStatusMap[request.directorReviewStatus] : undefined;

	/*
	 * The one fact that shapes this whole page: is the budget officer still
	 * holding it?
	 *
	 * It decides whether Reject is offered at all - `rejectByDirector` accepts
	 * exactly `UNDER_DIRECTOR_REVIEW`, while `approveByDirector` also accepts this
	 * status - and what the approval dialog says the approval will do. Computed
	 * here, once, and handed to both components rather than each deriving it: two
	 * copies of this comparison is how the trail and the buttons end up disagreeing
	 * about which stage the request is in.
	 */
	const isBudgetPending = request.directorReviewStatus === BUDGET_ACTIONABLE_DIRECTOR_STATUS;

	/*
	 * The signature is read from the SESSION, not from the request.
	 *
	 * Two different facts, and the page needs both. "Do I have a signature to
	 * stamp?" is about the director and lives on their profile;
	 * `directorSignatureUrl` on the request is the copy of whatever was stamped at
	 * approval time, deliberately frozen, and says nothing about whether a new
	 * approval is possible. The session carries `signatureUrl` as a Better Auth
	 * additional field and `profile.updateMyProfile` mints a fresh cookie on save,
	 * so this is current the moment they come back from /profile.
	 *
	 * It decides nothing. `approveByDirector` re-reads the user row and refuses.
	 */
	const hasSignature = Boolean(user?.signatureUrl);

	/* The PDF opens in a NEW TAB: it is a document to read beside the request, and
	   a router navigation would lose the request behind it. Still an `href` - the
	   route ships in spec 016 and a typed `to` cannot name one that does not exist
	   yet. */
	const openPdf = () => {
		window.open(`/requests/${requestId}/pdf`, "_blank", "noopener,noreferrer");
	};

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				action={
					<div className="flex flex-wrap items-center gap-3">
						{/* Which document, and where it is. A director arrives here from a
						    queue row and the page title says only "Director Review", so
						    without these two the screen never names the thing being decided. */}
						{stage ? (
							<AppChip
								data-cy="director-review-status"
								icon={stage.icon}
								label={stage.label}
								tone={stage.tone}
							/>
						) : null}

						{request.documentNumber ? (
							<Typography
								color="muted"
								data-cy="director-review-document-number"
								type="body-sm"
							>
								{request.documentNumber}
							</Typography>
						) : null}

						<AppButton
							data-cy="director-review-pdf"
							icon={FileText}
							onPress={openPdf}
							variant="tertiary"
						>
							View PDF
						</AppButton>
					</div>
				}
				subtitle="Approve the recommended request, or reject it."
				title="Director Review"
			/>

			{/* The same component the requestor filled in, read-only - so the director
			    is looking at the document rather than at a summary of it. `canSubmit`
			    is false: only the owner may send a request, and a Submit button here
			    could only answer FORBIDDEN. */}
			<RequestForm
				canSubmit={false}
				defaultValues={toRequestFormValues(request)}
				forceReadOnly
				idoEvaluationStatus={request.idoEvaluationStatus}
				masterStatus={request.masterStatus}
				mode="edit"
				processor={request.processor}
				requestId={requestId}
			/>

			{/* The trail takes the width and the actions sit beside it, because what
			    the desks before this one decided is the INPUT to the decision being
			    taken here - it is read first and read longest. The same two-column
			    rhythm as the IDO and budget review pages. */}
			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
				<ApprovalTrail
					isBudgetPending={isBudgetPending}
					request={request}
				/>

				<DirectorActionButtons
					canApprove={request.canApproveDirector}
					directorReviewStatus={request.directorReviewStatus}
					directorSignatureUrl={request.directorSignatureUrl}
					directorSignedAt={request.directorSignedAt}
					hasSignature={hasSignature}
					isBudgetPending={isBudgetPending}
					requestId={requestId}
				/>
			</div>

			<AppCard
				description="Every step this request has been through."
				headingLevel={2}
				title="Activity"
			>
				{/* No filter. `REQUESTOR_VISIBLE_ACTIONS` narrows the feed to the things
				    that ask the requestor for something; an approver needs the whole
				    history, including what the IDO and budget desks have already
				    recorded. */}
				<RequestActivityFeed auditLogs={request.auditLogs} />
			</AppCard>

			{/* Where a director asks a question without rejecting the request - which
			    is the only alternative this system has, there being no email, and the
			    only thing they CAN do while the budget stage is still open and Reject
			    is not offered. Below the activity feed for the reason the detail page
			    puts it there: what has HAPPENED, then what is being ASKED. */}
			<RequestCommentThread requestId={requestId} />
		</div>
	);
}
