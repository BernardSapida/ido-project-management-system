import { AppAlert, AppPageHeader } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
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
	},
	component: RequestPdfPage,
});

/**
 * The sentence naming which boxes are blank and why.
 *
 * Written out per count rather than assembled from fragments: one box can fail
 * on its own, and "the requestor's signature is" against "the requestor's and
 * the Campus Director's signatures are" is the difference between a notice
 * somebody acts on and one they have to decode. Three is the most there can be.
 */
function unavailableSignatureMessage(labels: string[]): string {
	const joined = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
	// Sentence case here rather than in the labels, because any one of the three
	// can be the one that failed and so any one of them can come first.
	const named = `${joined.charAt(0).toUpperCase()}${joined.slice(1)}`;
	const subject = labels.length === 1 ? "signature is" : "signatures are";
	const boxes = labels.length === 1 ? "that box prints" : "those boxes print";

	return `${named} ${subject} on file, but the image could not be read from storage, so ${boxes} blank. Upload it again on the Profile page, then reopen this form.`;
}

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

	/*
	 * A signature the payload PROMISED and the server could not deliver.
	 *
	 * The two are different states with the same picture. `null` on both sides is
	 * an unsigned desk, and the line above already explains that. A URL on the row
	 * with no image behind it is a fault - the object has gone from the bucket, or
	 * was written against a different one - and it printed as the same blank box
	 * with nothing anywhere to say so: the demo route kept working throughout,
	 * because its signatures are baked `data:` URIs rather than stored files.
	 *
	 * Read off the two payloads rather than from a flag, so it cannot go stale:
	 * `getSignaturesAsBase64` resolves every failure to `null` (see
	 * `signatureAsDataUri`), which makes "URL present, image absent" the exact
	 * shape of the fault.
	 */
	const unloadableSignatures = [
		{ base64: signatures?.requestorSignatureBase64, label: "the requestor's", url: request?.requestorSignatureUrl },
		{ base64: signatures?.idoFinalSignatureBase64, label: "the IDO Chairperson's", url: request?.idoFinalSignatureUrl },
		{
			base64: signatures?.finalDirectorSignatureBase64,
			label: "the Campus Director's",
			url: request?.finalDirectorSignatureUrl,
		},
	]
		.filter(({ base64, url }) => Boolean(url) && !base64)
		.map(({ label }) => label);

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

			{unloadableSignatures.length > 0 ? (
				<AppAlert
					data-cy="request-pdf-signature-unavailable"
					description={unavailableSignatureMessage(unloadableSignatures)}
					icon={ImageOff}
					status="warning"
					title="A signature could not be loaded"
				/>
			) : null}

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
