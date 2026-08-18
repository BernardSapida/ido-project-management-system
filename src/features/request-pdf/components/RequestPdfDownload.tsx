import { AppButton } from "@bernardsapida/web-ui";
import { Download } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import type { RequestPdfData, SignaturesBase64 } from "../types/request-pdf.types";

/**
 * The page header's Download action, behind the same client-only boundary as the
 * preview.
 *
 * It is a separate component from `RequestPdfViewer` only because it renders in
 * a different place - `AppPageHeader`'s action slot, above the content. Both
 * lazy-load the SAME module, so the engine still arrives as one chunk; see the
 * note in `RequestPdfInner`.
 *
 * While the data is loading, and during the first paint before hydration, this
 * renders a DISABLED button rather than nothing. A control that appears late
 * moves the header under the reader's cursor, and an empty action slot on a page
 * whose whole purpose is a document invites a second look for the download.
 */

const RequestPdfDownloadLink = lazy(() =>
	import("./RequestPdfInner").then((module) => ({ default: module.RequestPdfDownload })),
);

interface Props {
	request: RequestPdfData | undefined;
	signatures: SignaturesBase64 | undefined;
}

function PendingDownload() {
	return (
		<AppButton
			data-cy="request-pdf-download"
			icon={Download}
			isDisabled
			variant="primary"
		>
			Download
		</AppButton>
	);
}

export function RequestPdfDownload({ request, signatures }: Props) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted || !request || !signatures) return <PendingDownload />;

	return (
		<Suspense fallback={<PendingDownload />}>
			<RequestPdfDownloadLink
				request={request}
				signatures={signatures}
			/>
		</Suspense>
	);
}
