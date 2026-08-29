import { AppAlert, AppCard, AppChip, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { AppQueryError } from "@/components/project";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { IdoActionButtons } from "@/features/ido-review/components/IdoActionButtons";
import { IdoApproverPanel } from "@/features/ido-review/components/IdoApproverPanel";
import { useIdoReviewRequest } from "@/features/ido-review/hooks/use-ido-review-queries";
import { RequestCommentThread } from "@/features/request-comments/components/RequestCommentThread";
import { RequestActivityFeed } from "@/features/request-detail/components/RequestActivityFeed";
import { RequestDetailSkeleton } from "@/features/request-detail/components/RequestDetailSkeleton";
import { RequestForm } from "@/features/request-form/components/RequestForm";
import { toRequestFormValues } from "@/features/request-form/validations/schema/request.schema";
import { isIdoActionableStatus, masterStatusMap } from "@/lib/status-maps/request-status";
import { USER_ROLES } from "@/utils/config";

/** Both IDO desks. The chairperson may do an ordinary officer's review; their own
 *  final stage is spec 013 and a different page. The four procedures name the same
 *  two roles in `IDO_REVIEW_ROLES`, and that copy is the one that enforces. */
const IDO_REVIEW_ROLES = [USER_ROLES.IDO_OFFICER, USER_ROLES.IDO_CHAIRPERSON];

export const Route = createFileRoute("/_authenticated/requests/$requestId/review")({
	/**
	 * Role-gated, unlike the detail page beside it.
	 *
	 * `/requests/$requestId` asks who may READ this request, which only `getById`
	 * can answer because it depends on who owns the row. This page asks who may act
	 * at the IDO's first checkpoint, and that answer is the same for every request
	 * in the system: the two IDO desks.
	 *
	 * It still only ORGANISES. All four procedures are `roleProcedure`s over the
	 * same two roles, then `assertPermission(REVIEW_REQUEST)`, then the status
	 * check — so a DIRECTOR or a USER who gets past this by any route reaches a page
	 * whose every button answers FORBIDDEN.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({ data: { allowedRoles: IDO_REVIEW_ROLES } });
	},
	head: () => ({
		meta: [{ title: seo.title("IDO Review") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "IDO Review",
	},
	component: IdoReviewPage,
});

function IdoReviewPage() {
	const { requestId } = Route.useParams();
	const { data: request, error, isError, isPending, refetch } = useIdoReviewRequest(requestId);

	if (isPending) return <RequestDetailSkeleton />;

	/*
	 * NOT_FOUND on a mistyped id, told apart from FORBIDDEN by `AppQueryError`. A
	 * FORBIDDEN is close to unreachable here — both IDO roles are in
	 * `REQUEST_READER_ROLES` — but an account whose role was changed while this tab
	 * sat open is exactly the case that produces one, and it needs the same answer.
	 */
	if (isError) {
		return (
			<AppQueryError
				data-cy="ido-review-error"
				error={error}
				onRetry={() => void refetch()}
			/>
		);
	}

	const status = masterStatusMap[request.masterStatus];

	/*
	 * The two facts that decide every control on this page, and neither is a gate.
	 * `isActionable` is the same list the server guard reads (`IDO_ACTIONABLE_STATUSES`),
	 * and `canReview` is the `REVIEW_REQUEST` grant answered by `getById`. Both
	 * exist so the page can explain itself rather than offer a button whose only
	 * possible reply is FORBIDDEN.
	 */
	const isActionable = isIdoActionableStatus(request.masterStatus);
	const { canReview } = request;

	/* The PDF opens in a NEW TAB: it is a document to read beside the request, and
	   a router navigation would lose the request behind it. Still an `href` — the
	   route ships in spec 016 and a typed `to` cannot name a route that does not
	   exist yet. */
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
					status ? (
						<AppChip
							data-cy="ido-review-status"
							icon={status.icon}
							label={status.label}
							tone={status.tone}
						/>
					) : null
				}
				subtitle="Read the request and take one action."
				title="IDO Review"
			/>

			{/* Above the request, because it changes what everything below it means.
			    The panel and the actions card each say it again in their own words —
			    this is the one a reviewer sees before they start reading. */}
			{isActionable ? null : (
				<AppAlert
					data-cy="ido-review-read-only"
					description={`It is ${status?.label ?? request.masterStatus} and has moved on to the next desk. You can still read it, its history and its discussion, but the decision at this stage has already been made.`}
					icon={Lock}
					status="default"
					title="This request has left the IDO review stage"
				/>
			)}

			{/* The same component the requestor filled in, read-only — so a reviewer
			    is looking at the document rather than at a summary of it. `canSubmit`
			    is false: five roles can open a request and only its owner may send
			    one, and a Submit button here could only answer FORBIDDEN. */}
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

			{/* The decision, in one row: the recommendation takes the width because it
			    is the outcome that moves the request forwards, and the three that stop
			    it sit beside rather than beneath it — nothing destructive shares an
			    edge with the page's one primary button. */}
			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
				<IdoApproverPanel
					canReview={canReview}
					defaultValues={{
						// Seeded with the requestor's own title when IDO has not set one,
						// so the common case — the title was already right — is one press
						// rather than one retype.
						finalTitle: request.finalTitle ?? request.title,
						note: request.approverNote ?? "",
						reference: request.reference ?? "",
					}}
					isActionable={isActionable}
					requestId={requestId}
				/>

				<IdoActionButtons
					canReview={canReview}
					currentStatus={request.masterStatus}
					isActionable={isActionable}
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

			{/* Where a reviewer asks a question without returning the request — which
			    is the only alternative this system has, there being no email. Below the
			    activity feed for the reason the detail page puts it there: what has
			    HAPPENED, then what is being ASKED. */}
			<RequestCommentThread requestId={requestId} />
		</div>
	);
}
