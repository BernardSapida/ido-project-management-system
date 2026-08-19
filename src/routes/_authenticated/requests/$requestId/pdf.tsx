import { AppPageHeader } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedFn } from "@/features/auth/functions/auth.functions";
import { RequestPdfDownload } from "@/features/request-pdf/components/RequestPdfDownload";
import { RequestPdfViewer } from "@/features/request-pdf/components/RequestPdfViewer";
import { useRequestForPdf, useSignaturesForPdf } from "@/features/request-pdf/hooks/use-user-request-pdf-queries";

export const Route = createFileRoute("/_authenticated/requests/$requestId/pdf")({
	/**
	 * Signed in, and that is all - the same gate as the detail page, for the same
	 * reason.
	 *
	 * Five roles legitimately read this document: the requestor and the four
	 * review desks. A role list here would either lock a reviewer out of a link
	 * from their own queue or let every requestor through to everybody else's
	 * forms. `getForPdf` and `getSignaturesAsBase64` both decide per request,
	 * which is the only place that can: whether this document may be read depends
	 * on who OWNS the row, not on what the reader is.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedFn();
	},
	head: () => ({
		meta: [{ title: seo.title("View PDF") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "View PDF",
		/*
		 * `full`, and the width IS the feature. An A4 page squeezed into the
		 * `wide` measure renders at a size nobody can read the details cell at,
		 * and the reader's next move is the browser zoom.
		 */
		mainWidth: "full",
	},
	component: RequestPdfPage,
});

function RequestPdfPage() {
	const { requestId } = Route.useParams();

	const {
		data: request,
		error: requestError,
		isError: isRequestError,
		isLoading: isRequestLoading,
		refetch: refetchRequest,
	} = useRequestForPdf(requestId);

	/*
	 * Gated on the first query, so a reader who is not allowed this request pays
	 * for one refusal rather than two - and so the S3 fetches never start for a
	 * request nobody may see. The server re-checks access regardless.
	 */
	const {
		data: signatures,
		error: signaturesError,
		isError: isSignaturesError,
		isLoading: isSignaturesLoading,
		refetch: refetchSignatures,
	} = useSignaturesForPdf(requestId, Boolean(request));

	const isError = isRequestError || isSignaturesError;
	const isLoading = isRequestLoading || isSignaturesLoading;

	const retry = () => {
		void refetchRequest();
		void refetchSignatures();
	};

	/*
	 * The document number, once one exists. A draft has none - and a draft is not
	 * linked to this page - but it is reachable by URL, so the subtitle degrades
	 * to the sentence without it rather than printing "null —".
	 */
	const subtitle = request?.documentNumber
		? `${request.documentNumber} — the printed form as it stands today.`
		: "The printed form as it stands today.";

	/*
	 * Said BEFORE the reader hunts for it. Four empty signature cells on an
	 * otherwise complete form read as a rendering bug; one line saying the
	 * signatures arrive with the Campus Director's final approval turns the same
	 * blanks into the status of the request. Suppressed once approved, where it
	 * would be a note about something that has already happened.
	 */
	const isAwaitingSignatures = Boolean(request) && request?.finalDirectorStatus !== "APPROVED";

	return (
		<div className="flex w-full flex-col gap-4">
			<AppPageHeader
				action={
					<RequestPdfDownload
						request={request}
						signatures={signatures}
					/>
				}
				subtitle={subtitle}
				title="Request Form"
			/>

			{isAwaitingSignatures ? (
				<Typography
					color="muted"
					data-cy="request-pdf-awaiting-signatures"
					type="body-sm"
				>
					The IDO and Campus Director signatures appear on this form once the Campus Director gives final approval.
				</Typography>
			) : null}

			<RequestPdfViewer
				error={requestError ?? signaturesError}
				isError={isError}
				isLoading={isLoading}
				onRetry={retry}
				request={request}
				signatures={signatures}
			/>
		</div>
	);
}
