import { AppProgressCircle, AppQueryError } from "@bernardsapida/web-ui";
import { lazy, Suspense, useEffect, useState } from "react";
import type { RequestPdfData, SignaturesBase64 } from "../types/request-pdf.types";

/**
 * The preview, and the client-only boundary that lets it exist.
 *
 * `@react-pdf/renderer` is a browser build - `window`, `Blob`, a canvas - so it
 * cannot be in the SSR bundle and cannot be in the first client render either,
 * or React reports a hydration mismatch on a subtree the server never drew. Two
 * guards, both load-bearing:
 *
 * 1. **`lazy` + dynamic `import()`** puts the engine in its own chunk, fetched
 *    only when this component actually renders. A static import here would pull
 *    it into the route bundle and fail the server build.
 * 2. **`isMounted`** holds the first paint on the loading state, so server and
 *    client agree about what the tree looks like at hydration time.
 *
 * The engine is deliberately NOT wrapped in an `AppCard`. The viewer paints its
 * own grey document frame - a card around it would be a second border around a
 * thing that already looks like a page in a folder, and it would take width off
 * a preview the page set `mainWidth: "full"` to give room to.
 */

const RequestPdfPreview = lazy(() =>
	import("./RequestPdfInner").then((module) => ({ default: module.RequestPdfPreview })),
);

interface Props {
	/**
	 * The raw error from whichever query failed, for `AppQueryError` to classify.
	 *
	 * Raw rather than a message: FORBIDDEN on somebody else's request and a
	 * dropped connection are different things to be told, and only one of them is
	 * worth pressing Retry over. `isError` alone cannot make that distinction.
	 */
	error: unknown;
	isError: boolean;
	isLoading: boolean;
	onRetry?: () => void;
	request: RequestPdfData | undefined;
	signatures: SignaturesBase64 | undefined;
}

/**
 * The wait, with the document NAMED.
 *
 * Generating a PDF takes visible time - a second or two of engine chunk, then
 * the layout pass - and a bare spinner in that window reads as a page that has
 * hung. The label says which document is being drawn, which is also what a
 * screen reader announces.
 */
function PdfLoading() {
	return (
		<div
			className="flex min-h-150 w-full items-center justify-center"
			data-cy="request-pdf-loading"
		>
			<AppProgressCircle
				isIndeterminate
				label="Preparing the Request Form"
				size="lg"
			/>
		</div>
	);
}

export function RequestPdfViewer({ error, isError, isLoading, onRetry, request, signatures }: Props) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Before the data: a failure is worth showing even while the other query is
	// still in flight, because the one that failed is usually the access check.
	if (isError) {
		return (
			<AppQueryError
				data-cy="request-pdf-error"
				error={error}
				onRetry={onRetry}
			/>
		);
	}

	if (!isMounted || isLoading || !request || !signatures) return <PdfLoading />;

	return (
		<Suspense fallback={<PdfLoading />}>
			<RequestPdfPreview
				request={request}
				signatures={signatures}
			/>
		</Suspense>
	);
}
