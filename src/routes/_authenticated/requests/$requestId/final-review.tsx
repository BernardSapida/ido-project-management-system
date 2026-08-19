import { AppCard, AppChip, AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ApprovalTrail } from "@/features/director-review/components/ApprovalTrail";
import { IdoFinalActionButtons } from "@/features/ido-final-review/components/IdoFinalActionButtons";
import { IdoFinalApproverForm } from "@/features/ido-final-review/components/IdoFinalApproverForm";
import { useIdoFinalReviewMutations } from "@/features/ido-final-review/hooks/use-ido-final-review-mutations";
import { useIdoFinalReviewRequest } from "@/features/ido-final-review/hooks/use-ido-final-review-queries";
import {
	type IdoFinalApproveFormValues,
	idoFinalApproveFormSchema,
} from "@/features/ido-final-review/validations/schema/ido-final-approver.schema";
import { RequestCommentThread } from "@/features/request-comments/components/RequestCommentThread";
import { RequestActivityFeed } from "@/features/request-detail/components/RequestActivityFeed";
import { RequestDetailSkeleton } from "@/features/request-detail/components/RequestDetailSkeleton";
import { RequestForm } from "@/features/request-form/components/RequestForm";
import { toRequestFormValues } from "@/features/request-form/validations/schema/request.schema";
import { useAppForm } from "@/hooks/use-app-form";
import { idoFinalStatusMap, isIdoFinalActionableStatus } from "@/lib/status-maps/request-status";
import { USER_ROLES } from "@/utils/config";

/**
 * The narrowest gate in the app: ONE role.
 *
 * Every other IDO page takes both desks. This stage is the one an ordinary
 * officer can never do, and the separation is by ROLE rather than by permission -
 * both roles hold `REVIEW_REQUEST`, so a permission-based gate here would open
 * the final review to every officer in the office.
 */
const IDO_FINAL_REVIEW_ROLES = [USER_ROLES.IDO_CHAIRPERSON];

export const Route = createFileRoute("/_authenticated/requests/$requestId/final-review")({
	/**
	 * Role-gated, and it only ORGANISES.
	 *
	 * Both procedures are `roleProcedure("IDO_CHAIRPERSON")` over
	 * `assertPermission(REVIEW_REQUEST)` over the stage check, so an IDO officer who
	 * reaches this page by any route - a shared link, a role changed while the tab
	 * sat open - gets a page whose every button answers FORBIDDEN. The gate is here
	 * so they are sent to /unauthorized instead of discovering it one press at a
	 * time.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({ data: { allowedRoles: IDO_FINAL_REVIEW_ROLES } });
	},
	head: () => ({
		meta: [{ title: seo.title("IDO Final Review") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "IDO Final Review",
		mainWidth: "wide",
	},
	component: IdoFinalReviewPage,
});

function IdoFinalReviewPage() {
	const { requestId } = Route.useParams();
	const { user } = useAuth();
	const { data: request, error, isError, isPending, refetch } = useIdoFinalReviewRequest(requestId);
	const { idoFinalApprove } = useIdoFinalReviewMutations(requestId);

	/*
	 * The override lives HERE, not inside the form card.
	 *
	 * The card renders the field and the action card sends it, so neither of them
	 * can own it - a value held in the card and passed to the buttons as a prop is
	 * how an override silently fails to send, which is the failure the spec's edge
	 * case names. The page holds one form, hands `control` to the field and
	 * `handleSubmit` to the button, and there is exactly one copy of the value.
	 *
	 * `useAppForm` rather than a `useState`, per `CLAUDE.md`: `.max(255)` has to be
	 * reported under the input while it is being typed, and only a resolver-backed
	 * form does that. Seeded EMPTY - see `IdoFinalApproverForm` for why an override
	 * must not be pre-filled.
	 *
	 * Hooks run before the early returns below, which is why this sits above them.
	 */
	const { control, handleSubmit } = useAppForm<IdoFinalApproveFormValues>(idoFinalApproveFormSchema, {
		defaultValues: { finalTitle: "" },
	});

	/*
	 * Approve, through the form's own validation.
	 *
	 * `handleSubmit` resolves whether or not the schema passed - the field's error
	 * is the report - so an over-long title has to be turned into a REJECTION here,
	 * or `AppDialog` would close over a decision that never committed and the
	 * chairperson would go back to a page that looks unchanged for no stated
	 * reason.
	 */
	const onApprove = async () => {
		let submitted = false;

		await handleSubmit(async (values) => {
			submitted = true;

			await idoFinalApprove(values.finalTitle);
		})();

		if (!submitted) throw new Error("Check the final title");
	};

	if (isPending) return <RequestDetailSkeleton />;

	/*
	 * NOT_FOUND on a mistyped id, told apart from FORBIDDEN by `AppQueryError`.
	 * IDO_CHAIRPERSON is in `REQUEST_READER_ROLES`, so a FORBIDDEN here is close to
	 * unreachable - an account whose role changed while this tab sat open is the
	 * case that produces one, and it needs the same answer.
	 */
	if (isError) {
		return (
			<AppQueryError
				data-cy="ido-final-review-error"
				error={error}
				onRetry={() => void refetch()}
			/>
		);
	}

	/*
	 * The SUB-STAGE chip, not `masterStatus`.
	 *
	 * `masterStatus` reads "IDO Final Review" while this desk holds the request and
	 * "Final Review" once it has signed, so it can say where the request is but
	 * never what this desk decided - and `IDO_FINAL_APPROVED` has no headline twin
	 * at all. `idoFinalStatusMap` is what it reads, and `getById` sends the column
	 * to this desk alone.
	 */
	const stage = request.idoFinalStatus ? idoFinalStatusMap[request.idoFinalStatus] : undefined;

	/* The same list the server guard reads. It decides nothing - both procedures
	   re-check it - and it is what lets the page render as a record of what was
	   decided rather than offering two buttons whose only reply is FORBIDDEN. */
	const isActionable = isIdoFinalActionableStatus(request.idoFinalStatus);

	/*
	 * The signature is read from the SESSION, not from the request.
	 *
	 * Two different facts. "Do I have a signature to stamp?" is about the
	 * chairperson and lives on their profile; `idoFinalSignatureUrl` on the request
	 * is the copy of whatever was stamped at approval time, deliberately frozen,
	 * and says nothing about whether a new approval is possible.
	 *
	 * It decides nothing. `idoFinalApprove` re-reads the user row and refuses.
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
					/* Which STAGE it is at, and nothing else. The document number used to
					   sit beside it as a muted string; it is a field of the request, so it
					   is read in the Request information card with the rest of them, and
					   View PDF sits in the form's rail where every other role's does. */
					stage ? (
						<AppChip
							data-cy="ido-final-review-status"
							icon={stage.icon}
							label={stage.label}
							tone={stage.tone}
						/>
					) : null
				}
				subtitle="Confirm the final title and sign, or reject."
				title="IDO Final Review"
			/>

			{/* The same component the requestor filled in, read-only - so the
			    chairperson is looking at the document rather than at a summary of it.
			    `canSubmit` is false: only the owner may send a request, and a Submit
			    button here could only answer FORBIDDEN. */}
			<RequestForm
				canSubmit={false}
				defaultValues={toRequestFormValues(request)}
				documentNumber={request.documentNumber}
				forceReadOnly
				idoEvaluationStatus={request.idoEvaluationStatus}
				masterStatus={request.masterStatus}
				mode="edit"
				onViewPdf={openPdf}
				processor={request.processor}
				requestId={requestId}
			/>

			{/* The trail and the title take the width and the actions sit beside them:
			    who has signed so far is the INPUT to this decision, and the title is the
			    one thing being decided. The same two-column rhythm as the three review
			    pages before it. */}
			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
				<div className="flex flex-col gap-6">
					<ApprovalTrail request={request} />

					<IdoFinalApproverForm
						control={control}
						currentFinalTitle={request.finalTitle}
						isReadOnly={!isActionable}
					/>
				</div>

				<IdoFinalActionButtons
					canReview={request.canReview}
					control={control}
					currentFinalTitle={request.finalTitle}
					hasSignature={hasSignature}
					idoFinalSignatureUrl={request.idoFinalSignatureUrl}
					idoFinalSignedAt={request.idoFinalSignedAt}
					idoFinalStatus={request.idoFinalStatus}
					onApprove={onApprove}
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

			{/* Where a chairperson asks a question without rejecting the request -
			    which is the only alternative this system has, there being no email.
			    Below the activity feed for the reason the detail page puts it there:
			    what has HAPPENED, then what is being ASKED. */}
			<RequestCommentThread requestId={requestId} />
		</div>
	);
}
