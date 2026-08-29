import { AppCard, AppChip, AppPageHeader } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppQueryError } from "@/components/project";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedFn } from "@/features/auth/functions/auth.functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { CsmPromptBanner } from "@/features/csm/components/CsmPromptBanner";
import { RequestCommentThread } from "@/features/request-comments/components/RequestCommentThread";
import { RejectionNotice } from "@/features/request-detail/components/RejectionNotice";
import { RequestActivityFeed } from "@/features/request-detail/components/RequestActivityFeed";
import { RequestDetailSkeleton } from "@/features/request-detail/components/RequestDetailSkeleton";
import { requestStatusSubtitle } from "@/features/request-detail/lib/status-subtitle";
import { RequestForm } from "@/features/request-form/components/RequestForm";
import { useRequestById } from "@/features/request-form/hooks/use-user-request-queries";
import { toRequestFormValues } from "@/features/request-form/validations/schema/request.schema";
import { latestNegativeLog } from "@/lib/status-maps/audit-action";
import { isEditableStatus, isNegativeStatus, masterStatusMap } from "@/lib/status-maps/request-status";

export const Route = createFileRoute("/_authenticated/requests/$requestId/")({
	/**
	 * Signed in, and that is all.
	 *
	 * Deliberately NOT role-gated, unlike `/requests` and `/requests/new`: five
	 * roles may legitimately open one request - its owner and the four review
	 * desks - and a role list here would either lock a reviewer out of a link from
	 * their own queue or let every requestor through to everybody else's requests.
	 * `request.getById` is the gate that decides, per request, and it is the only
	 * one that can: whether this page may be read depends on WHO OWNS the row, not
	 * on what the reader is.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedFn();
	},
	head: () => ({
		meta: [{ title: seo.title("Request Detail") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Request Detail",
	},
	component: RequestDetailPage,
});

function RequestDetailPage() {
	const { requestId } = Route.useParams();
	const router = useRouter();
	const { user } = useAuth();
	const { data: request, error, isError, isPending, refetch } = useRequestById(requestId);

	if (isPending) return <RequestDetailSkeleton />;

	/*
	 * The error state, not a blank form. FORBIDDEN on somebody else's id and
	 * NOT_FOUND on a mistyped one are the two failures this query has, and
	 * `AppQueryError` classifies them apart - "you are not allowed" and "there is
	 * nothing here" are different things to be told, and only one of them is worth
	 * pressing Retry over.
	 */
	if (isError) {
		return (
			<AppQueryError
				data-cy="request-detail-error"
				error={error}
				onRetry={() => void refetch()}
			/>
		);
	}

	const status = masterStatusMap[request.masterStatus];

	/*
	 * Ownership decides every requestor control on this page, and none of them are
	 * a gate. `request.submit` re-checks the owner and the status; the CSM route
	 * and its procedures check ownership themselves (spec 015). Hiding a control
	 * is about not offering somebody a button that can only answer FORBIDDEN.
	 */
	const isOwner = Boolean(user) && request.userId === user.id;
	const canAct = isOwner && isEditableStatus(request.masterStatus);

	/*
	 * Anything past DRAFT has been sent, has a document number, and therefore has
	 * a form worth printing - RETURNED included, which is a request that was
	 * submitted and came back. Every role that can READ the request can open it,
	 * which is an explicit IRMS-old fix: a reviewer following a link used to reach
	 * the page and find the one control they wanted missing.
	 */
	const isSubmitted = request.masterStatus !== "DRAFT";

	/*
	 * There is feedback to read, and `completionStatus` is the only column that
	 * says so from this payload.
	 *
	 * `COMPLETED` is written in ONE place - the transaction inside `csm.submitCsm`
	 * that fills the `Csm` row - so it cannot be true of a request whose form
	 * nobody has answered. `CSM_PENDING` is the state before that, and it belongs
	 * to the banner above rather than to this action: a link to a form the reader
	 * cannot fill in is not something to offer a reviewer.
	 *
	 * No ownership check, deliberately - unlike Edit, Submit and the banner. Every
	 * role that got as far as reading this request may read the feedback it
	 * earned, which is the set `csm.getForRequest` serves, and the destination
	 * re-checks it rather than trusting this line.
	 */
	const hasFeedback = request.completionStatus === "COMPLETED";

	// Only while the request is STILL sitting on the bad answer. The audit entry
	// stays in the log forever - that is what a log is - but a request returned in
	// March, fixed and resubmitted is under review, and a banner still repeating
	// that complaint describes a document which no longer exists.
	const negativeLog = isNegativeStatus(request.masterStatus) ? latestNegativeLog(request.auditLogs) : null;

	/*
	 * Edit is a typed navigation now that spec 007 has put the route in the tree.
	 *
	 * The PDF stays a plain URL, and now that spec 016 has added the route that is
	 * a deliberate choice rather than a gap: it opens in a NEW TAB, because it is a
	 * document to be read or printed beside the request, and `router.navigate` has
	 * no way to open one in a second tab.
	 */
	const goToEdit = () => void router.navigate({ params: { requestId }, to: "/requests/$requestId/edit" });
	const goToFeedback = () => void router.navigate({ params: { requestId }, to: "/requests/$requestId/csm" });
	const openPdf = () => window.open(`/requests/${requestId}/pdf`, "_blank", "noopener,noreferrer");

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<AppPageHeader
					action={
						status ? (
							/* The status alone. The document number moved into the Request
							   information card below, where the rest of the document's fields
							   are - and where a draft, which has no number yet, simply shows
							   one field fewer instead of a gap beside the chip. */
							<AppChip
								data-cy="request-status"
								icon={status.icon}
								label={status.label}
								tone={status.tone}
							/>
						) : null
					}
					subtitle={requestStatusSubtitle(request.masterStatus)}
					title={request.finalTitle ?? request.title}
				/>

				{/* IDO may retitle a request. The requestor has to be able to see BOTH
				    that it happened and what it was - the title they wrote is the one
				    they will go looking for. Suppressed when the two are equal, where
				    the line would be noise about a change nobody made. */}
				{request.finalTitle && request.finalTitle !== request.title ? (
					<Typography
						color="muted"
						data-cy="request-original-title"
						type="body-sm"
					>
						Original title: <span className="italic">{request.title}</span>
					</Typography>
				) : null}
			</div>

			{isOwner ? (
				<CsmPromptBanner
					completionStatus={request.completionStatus}
					requestId={requestId}
				/>
			) : null}

			{/* Above the form, and a banner rather than a row in the feed below it.
			    The reason a request stopped is the one thing the requestor opened this
			    page for; making them read a timeline to find it is the defect this
			    replaces. */}
			{negativeLog ? (
				<RejectionNotice
					action={negativeLog.action}
					actorName={`${negativeLog.actor.firstname} ${negativeLog.actor.lastname}`.trim()}
					note={negativeLog.note}
					occurredAt={negativeLog.createdAt}
				/>
			) : null}

			<RequestForm
				canSubmit={canAct}
				defaultValues={toRequestFormValues(request)}
				documentNumber={request.documentNumber}
				forceReadOnly
				idoEvaluationStatus={request.idoEvaluationStatus}
				masterStatus={request.masterStatus}
				mode="edit"
				onEdit={canAct ? goToEdit : undefined}
				onViewFeedback={hasFeedback ? goToFeedback : undefined}
				onViewPdf={isSubmitted ? openPdf : undefined}
				processor={request.processor}
				requestId={requestId}
			/>

			<AppCard
				description="Every step this request has been through."
				headingLevel={2}
				title="Activity"
			>
				<RequestActivityFeed auditLogs={request.auditLogs} />
			</AppCard>

			{/* Below the activity feed, because the two answer different questions in
			    that order: what has HAPPENED to this request, and then what is being
			    ASKED about it. No ownership check - every role that reached this page
			    may read the thread, and `comment.list` decides that, not this page. */}
			<RequestCommentThread requestId={requestId} />
		</div>
	);
}
