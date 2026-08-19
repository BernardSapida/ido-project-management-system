import { AppButton } from "@bernardsapida/web-ui";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import type { RequestPdfData, SignaturesBase64 } from "../types/request-pdf.types";
import { RequestFormPDFDocument } from "./RequestFormPDFDocument";

/**
 * The only module in the app that touches the PDF engine at import time.
 *
 * **It must never be imported directly.** `RequestPdfViewer` and
 * `RequestPdfDownload` reach it through `React.lazy`, which is what keeps
 * `@react-pdf/renderer` out of the SSR bundle: it is a browser build that
 * expects `window`, `Blob` and a canvas, and a static import anywhere in the
 * route tree fails the server build on a dependency it cannot resolve. A `lazy`
 * boundary is also the only mechanism that survives a production build - a
 * `typeof window` guard around a static import does not, because the bundler has
 * already followed the import by then.
 *
 * Both exports live here rather than in two files so they share ONE chunk: the
 * page mounts the download control and the preview together, and splitting them
 * would fetch the same 400KB engine twice on the same paint.
 *
 * The two are separate COMPONENTS because they sit in different places - the
 * download is the page header's action, the preview fills the page below it.
 * They each build their own `<Document>` element, and that costs nothing extra:
 * `PDFDownloadLink` and `PDFViewer` never share a render pass anyway, since one
 * produces a blob to save and the other an object URL to display.
 */

interface DocumentProps {
	request: RequestPdfData;
	signatures: SignaturesBase64;
}

/**
 * What the file is called once it is on somebody's desktop.
 *
 * The document number, and nothing else - it is what the office files the form
 * under, and it is what somebody searching a downloads folder six months later
 * will type. The id is the fallback for a request with no number yet, which is
 * only ever a draft.
 *
 * Everything outside `[A-Za-z0-9_-]` becomes an underscore. A document number is
 * `YYYY-NNNN` today and cannot contain anything dangerous, but this string is
 * handed to the browser as a filename, and the rule that makes that safe belongs
 * next to the filename rather than in the format's history.
 */
function fileNameFor(request: RequestPdfData): string {
	const stem = request.documentNumber ?? request.id;

	return `${stem.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
}

function buildDocument({ request, signatures }: DocumentProps) {
	return (
		<RequestFormPDFDocument
			finalDirectorSignatureBase64={signatures.finalDirectorSignatureBase64}
			idoFinalSignatureBase64={signatures.idoFinalSignatureBase64}
			// The server has already redacted on these rules. Re-derived here so the
			// renderer never draws a signature the payload happens to carry - one flag
			// per desk, because the two sign at different points in the workflow.
			isFinalApproved={request.finalDirectorStatus === "APPROVED"}
			isIdoSigned={request.idoFinalStatus === "IDO_FINAL_APPROVED"}
			request={request}
			requestorSignatureBase64={signatures.requestorSignatureBase64}
		/>
	);
}

/**
 * The Download control, for the page header's action slot.
 *
 * A real control rather than leaving the reader to the browser's own PDF chrome:
 * that toolbar is inside an iframe, it looks different in every browser, and on
 * a phone it is often not there at all.
 *
 * Disabled while `PDFDownloadLink` is still producing the blob - the first press
 * on a document of this size lands a second or two before the file exists, and a
 * link that silently does nothing reads as a broken button.
 */
export function RequestPdfDownload({ request, signatures }: DocumentProps) {
	return (
		<PDFDownloadLink
			document={buildDocument({ request, signatures })}
			fileName={fileNameFor(request)}
		>
			{({ loading }) => (
				<AppButton
					data-cy="request-pdf-download"
					icon={Download}
					isDisabled={loading}
					variant="primary"
				>
					{loading ? "Preparing…" : "Download"}
				</AppButton>
			)}
		</PDFDownloadLink>
	);
}

/**
 * The preview itself.
 *
 * A viewport-height box rather than an aspect-ratio one: an A4 page is taller
 * than any screen it is read on, so the useful measure is "as much of the window
 * as is left once the frame has taken its share". `minHeight` keeps it usable on
 * a short laptop window, where the subtraction would otherwise leave a strip.
 */
export function RequestPdfPreview({ request, signatures }: DocumentProps) {
	return (
		<div
			className="w-full"
			data-cy="request-pdf-preview"
			style={{ height: "calc(100vh - 260px)", minHeight: 600 }}
		>
			<PDFViewer
				height="100%"
				width="100%"
			>
				{buildDocument({ request, signatures })}
			</PDFViewer>
		</div>
	);
}
