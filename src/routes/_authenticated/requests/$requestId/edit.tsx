import { AppAlert, AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TRPCClientError } from "@trpc/client";
import { Lock, RotateCcw } from "lucide-react";
import { useState } from "react";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { RejectionNotice } from "@/features/request-detail/components/RejectionNotice";
import { RequestDetailSkeleton } from "@/features/request-detail/components/RequestDetailSkeleton";
import { RequestForm } from "@/features/request-form/components/RequestForm";
import { useRequestById } from "@/features/request-form/hooks/use-user-request-queries";
import { toRequestFormValues } from "@/features/request-form/validations/schema/request.schema";
import { latestNegativeLog } from "@/lib/status-maps/audit-action";
import { isEditableStatus, isNegativeStatus, masterStatusMap } from "@/lib/status-maps/request-status";
import { USER_ROLES } from "@/utils/config";

export const Route = createFileRoute("/_authenticated/requests/$requestId/edit")({
	/**
	 * Requestors only, and unlike the detail page beside it this one IS role-gated.
	 *
	 * The two pages answer different questions. `/requests/$requestId` asks who may
	 * READ this request, which is a per-request question - its owner and the four
	 * review desks - and only `getById` can answer it. This page asks who may
	 * change a requestor's own words, and that answer is the same for every request
	 * in the system: nobody but the requestor. A reviewer's influence on the record
	 * is `finalTitle`, `reference` and their notes, through their own procedures
	 * (specs 010-014).
	 *
	 * It still only ORGANISES. `saveDraft` and `submit` check ownership and status
	 * themselves, so a USER deep-linking to somebody else's id reaches a page whose
	 * query has already refused them.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({ data: { allowedRoles: [USER_ROLES.USER] } });
	},
	head: () => ({
		meta: [{ title: seo.title("Edit Request") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Edit Request",
		mainWidth: "wide",
	},
	component: RequestEditPage,
});

function RequestEditPage() {
	const { requestId } = Route.useParams();
	const navigate = useNavigate();

	/*
	 * Refetch-on-focus is OFF here, and it is the form binding that requires it:
	 * the fields follow the query through RHF's `values`, so a refetch that comes
	 * back different resets the whole form. Switching to another tab to copy a
	 * quotation reference and back must not empty the paragraph being written
	 * around it. See the note on the hook.
	 */
	const {
		data: request,
		error,
		isError,
		isPending,
		refetch,
	} = useRequestById(requestId, { refetchOnWindowFocus: false });

	/**
	 * The server's answer when the request moved on while this page was open.
	 *
	 * Held as state rather than shown as a toast because it is a CONDITION, not an
	 * event: from the moment it arrives every further press of Save Draft fails the
	 * same way, and the only thing that clears it is reloading the request. A line
	 * that fades after four seconds leaves somebody pressing a button that cannot
	 * work, with nothing on screen saying why.
	 */
	const [staleMessage, setStaleMessage] = useState<string | null>(null);

	const goToRequest = () => void navigate({ params: { requestId }, to: "/requests/$requestId" });

	if (isPending) return <RequestDetailSkeleton />;

	/*
	 * FORBIDDEN on somebody else's request and NOT_FOUND on a mistyped id, told
	 * apart by `AppQueryError` - the same two failures the detail page handles, for
	 * the same reason. A USER is not in `REQUEST_READER_ROLES`, so this is where a
	 * deep link to another requestor's id lands.
	 */
	if (isError) {
		return (
			<AppQueryError
				data-cy="request-edit-error"
				error={error}
				onRetry={() => void refetch()}
			/>
		);
	}

	const status = masterStatusMap[request.masterStatus];

	/*
	 * A request under review is not an editable form, and it is not an error
	 * either - somebody followed a bookmark, or pressed Edit and IDO picked the
	 * request up in between. So: what happened, what it means, and the way back to
	 * the page that can still show them everything. Rendering the form read-only
	 * instead would be a screen full of fields and no way to save any of them.
	 */
	if (!isEditableStatus(request.masterStatus)) {
		return (
			<div className="flex flex-col gap-8">
				<AppPageHeader
					subtitle="This request has moved past the point where it can be changed."
					title="Edit Request"
				/>

				<AppAlert
					action={{ label: "Open the request", onPress: goToRequest }}
					data-cy="request-not-editable"
					description={`It is ${status?.label ?? request.masterStatus} and is with a reviewer. Only a draft, or a request returned to you, can be edited — anything else would change the document under the desk that is reading it.`}
					icon={Lock}
					status="warning"
					title="This request can no longer be edited"
				/>
			</div>
		);
	}

	// RETURNED is the only negative status that reaches this far - the rest are
	// terminal, and a terminal request was sent back up the page. It is also why
	// this page shows the note at all: it is what the edit is being made AGAINST,
	// so it stays on screen while the fixing happens.
	const negativeLog = isNegativeStatus(request.masterStatus) ? latestNegativeLog(request.auditLogs) : null;

	/**
	 * Takes a save failure this page can say something better about.
	 *
	 * Only FORBIDDEN, and here it can only mean one thing: ownership was settled
	 * when the query loaded, so a refusal now is the status having changed
	 * underneath. Everything else - a dead connection, a rejected upload - is
	 * genuinely "try again" and is left to the hook's toast. Returning `true` is
	 * what suppresses that toast; see `SaveArgs.onError`.
	 */
	const handleSaveError = (saveError: unknown) => {
		if (saveError instanceof TRPCClientError && saveError.data?.code === "FORBIDDEN") {
			setStaleMessage(saveError.message);

			return true;
		}

		return false;
	};

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				subtitle="Update your request, then save it or submit it when it is ready."
				title="Edit Request"
			/>

			{/* Above everything, the reviewer's note included: nothing else on the
			    page matters while the save is refusing. Reload is the way out, and it
			    is a press rather than an automatic refetch - what was typed is still
			    in the fields, and replacing it has to be a decision somebody made. */}
			{staleMessage ? (
				<AppAlert
					action={{ label: "Reload the request", onPress: () => void refetch() }}
					data-cy="request-stale-notice"
					description={`${staleMessage}. Your answers are still on this page — copy anything you need before reloading, because reloading replaces them with what is now saved.`}
					icon={RotateCcw}
					onClose={() => setStaleMessage(null)}
					status="warning"
					title="Somebody has acted on this request"
				/>
			) : null}

			{negativeLog ? (
				<RejectionNotice
					action={negativeLog.action}
					actorName={`${negativeLog.actor.firstname} ${negativeLog.actor.lastname}`.trim()}
					note={negativeLog.note}
					occurredAt={negativeLog.createdAt}
				/>
			) : null}

			<RequestForm
				defaultValues={toRequestFormValues(request)}
				idoEvaluationStatus={request.idoEvaluationStatus}
				masterStatus={request.masterStatus}
				mode="edit"
				onCancel={goToRequest}
				onSaveError={handleSaveError}
				processor={request.processor}
				requestId={requestId}
			/>
		</div>
	);
}
