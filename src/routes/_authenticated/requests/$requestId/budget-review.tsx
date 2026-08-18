import { AppButton, AppCard, AppChip, AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { BudgetActionButtons } from "@/features/budget-review/components/BudgetActionButtons";
import { IdoDecisionSummary } from "@/features/budget-review/components/IdoDecisionSummary";
import { useBudgetReviewRequest } from "@/features/budget-review/hooks/use-budget-review-queries";
import { RequestCommentThread } from "@/features/request-comments/components/RequestCommentThread";
import { RequestActivityFeed } from "@/features/request-detail/components/RequestActivityFeed";
import { RequestDetailSkeleton } from "@/features/request-detail/components/RequestDetailSkeleton";
import { RequestForm } from "@/features/request-form/components/RequestForm";
import { toRequestFormValues } from "@/features/request-form/validations/schema/request.schema";
import { directorReviewStatusMap } from "@/lib/status-maps/request-status";
import { USER_ROLES } from "@/utils/config";

/** One desk, one stage. Unlike the IDO review, no second role stands in here -
 *  the chairperson and the director each have their own pages. */
const BUDGET_REVIEW_ROLES = [USER_ROLES.BUDGET_OFFICER];

export const Route = createFileRoute("/_authenticated/requests/$requestId/budget-review")({
	/**
	 * Role-gated, and it only ORGANISES.
	 *
	 * Both procedures are `roleProcedure("BUDGET_OFFICER")` over
	 * `assertPermission(APPROVE_BUDGET)` over the stage check, so a DIRECTOR or an
	 * IDO officer who reaches this page by any route - a shared link, a role
	 * changed while the tab sat open - gets a page whose every button answers
	 * FORBIDDEN. The gate is there so they are sent somewhere useful instead of
	 * discovering it one press at a time.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({ data: { allowedRoles: BUDGET_REVIEW_ROLES } });
	},
	head: () => ({
		meta: [{ title: seo.title("Budget Review") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Budget Review",
		mainWidth: "wide",
	},
	component: BudgetReviewPage,
});

function BudgetReviewPage() {
	const { requestId } = Route.useParams();
	const { user } = useAuth();
	const { data: request, error, isError, isPending, refetch } = useBudgetReviewRequest(requestId);

	if (isPending) return <RequestDetailSkeleton />;

	/*
	 * NOT_FOUND on a mistyped id, told apart from FORBIDDEN by `AppQueryError`.
	 * BUDGET_OFFICER is in `REQUEST_READER_ROLES`, so a FORBIDDEN here is close to
	 * unreachable - an account whose role changed while this tab sat open is the
	 * case that produces one, and it needs the same answer.
	 */
	if (isError) {
		return (
			<AppQueryError
				data-cy="budget-review-error"
				error={error}
				onRetry={() => void refetch()}
			/>
		);
	}

	/*
	 * The SUB-STAGE chip, not `masterStatus`.
	 *
	 * `masterStatus` reads "Director Review" for this stage and for the director's
	 * own, so a chip built from it would tell a budget officer the request is with
	 * the Campus Director while they are being asked to approve it. This is the one
	 * page in the app where that distinction is the whole subject, so
	 * `directorReviewStatusMap` is what it reads. `getById` sends the column to the
	 * two approver desks and to nobody else - the director needs it too, to know
	 * whether they would be approving ahead of this one (spec 012).
	 */
	const stage = request.directorReviewStatus ? directorReviewStatusMap[request.directorReviewStatus] : undefined;

	/*
	 * The signature is read from the SESSION, not from the request.
	 *
	 * These are two different facts and the page needs both. "Do I have a signature
	 * to stamp?" is about the officer and lives on their profile;
	 * `budgetOfficerSignatureUrl` on the request is the copy of whatever was
	 * stamped at approval time, which is deliberately frozen and says nothing about
	 * whether a new approval is possible. The session carries `signatureUrl` as a
	 * Better Auth additional field, and `profile.updateMyProfile` mints a fresh
	 * cookie on save, so this is current the moment they come back from /profile.
	 *
	 * It decides nothing. `approveBudget` re-reads the user row and refuses.
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
						{/* Which document, and where it is. An officer arrives here from a
						    queue row and the page title says only "Budget Review", so without
						    these two the screen never names the thing being decided. */}
						{stage ? (
							<AppChip
								data-cy="budget-review-status"
								icon={stage.icon}
								label={stage.label}
								tone={stage.tone}
							/>
						) : null}

						{request.documentNumber ? (
							<Typography
								color="muted"
								data-cy="budget-review-document-number"
								type="body-sm"
							>
								{request.documentNumber}
							</Typography>
						) : null}

						<AppButton
							data-cy="budget-review-pdf"
							icon={FileText}
							onPress={openPdf}
							variant="tertiary"
						>
							View PDF
						</AppButton>
					</div>
				}
				subtitle="Confirm the PPMP allocation, then approve or reject."
				title="Budget Review"
			/>

			{/* The same component the requestor filled in, read-only - so the officer
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

			{/* The IDO decision takes the width and the actions sit beside it, because
			    the decision is the INPUT to the one being made here - it is read first
			    and read longest. Same two-column rhythm as the IDO review page. */}
			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
				<IdoDecisionSummary
					approverNote={request.approverNote}
					finalTitle={request.finalTitle}
					idoEvaluationStatus={request.idoEvaluationStatus}
					processor={request.processor}
					reference={request.reference}
				/>

				<BudgetActionButtons
					budgetOfficerSignatureUrl={request.budgetOfficerSignatureUrl}
					budgetOfficerSignedAt={request.budgetOfficerSignedAt}
					canApprove={request.canApproveBudget}
					directorReviewStatus={request.directorReviewStatus}
					hasSignature={hasSignature}
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
				    history, including what the IDO desk has already recorded. */}
				<RequestActivityFeed auditLogs={request.auditLogs} />
			</AppCard>

			{/* Where an officer asks a question without rejecting the request - which
			    is the only alternative this system has, there being no email. Below the
			    activity feed for the reason the detail page puts it there: what has
			    HAPPENED, then what is being ASKED. */}
			<RequestCommentThread requestId={requestId} />
		</div>
	);
}
