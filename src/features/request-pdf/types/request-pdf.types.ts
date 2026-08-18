/**
 * The two shapes the printed form is built from.
 *
 * TypeScript types rather than Zod schemas, and that is the decision this file
 * records: both are SERVER PROJECTIONS, not user input. Nothing here ever
 * arrives from a browser - `getForPdf` and `getSignaturesAsBase64` build them
 * out of a row the server just read, and the only value that crosses the wire
 * inwards is an id, which the procedures validate with `z.string().min(1)`.
 * A Zod schema here would be a runtime check on data that cannot be wrong,
 * paid for on every render of a document that is already slow to draw.
 *
 * They are declared apart from the procedures so `RequestFormPDFDocument` can
 * name what it needs without importing the tRPC router - the renderer is one of
 * the few modules in the app that must stay loadable on its own, because it is
 * lazy-loaded into its own chunk.
 */

/**
 * Everything the form PRINTS, and nothing else.
 *
 * The four approval fields - both signature URLs and both signed-at stamps -
 * are `null` on the wire until `finalDirectorStatus === "APPROVED"`. That
 * redaction happens in `getForPdf`, not here and not in the renderer: a type
 * cannot enforce it, and a check in the renderer publishes the values to
 * anybody who opens the network tab.
 *
 * Dates are ISO strings rather than `Date`. superjson would carry a `Date`
 * through, but the renderer formats every one of them to `MMMM DD, YYYY`
 * anyway, and a string is the shape that survives being handed to a lazy chunk.
 */
export type RequestPdfData = {
	approverNote: string | null;
	details: string;
	documentNumber: string | null;
	finalDirectorSignatureUrl: string | null;
	finalDirectorSignedAt: string | null;
	finalDirectorStatus: string | null;
	finalTitle: string | null;
	id: string;
	idoEvaluationStatus: string | null;
	idoFinalSignatureUrl: string | null;
	idoFinalSignedAt: string | null;
	masterStatus: string;
	/** `finalTitle ?? title` - the name the form's second row prints, resolved on
	 *  the server so the renderer never has to decide which title is current. */
	nameOfBuildingArea: string;
	/** The STORED enum. `positionLabel` turns it into what the form prints. */
	position: string;
	reference: string | null;
	requestedBy: string;
	requestorSignatureUrl: string | null;
	/**
	 * The first `SUBMITTED` audit log's `createdAt`, NOT the request's own.
	 *
	 * A draft written in January and sent in March prints March, because the DATE
	 * and TIME cells under the requestor mean "when this was filed". `null` on a
	 * request that has never been submitted, which prints as two empty cells.
	 */
	requestSubmittedAt: string | null;
	title: string;
	typeOfRequest: string;
};

/**
 * The three signature images, inlined.
 *
 * Data URIs rather than S3 URLs, because `@react-pdf/renderer` fetches images
 * itself while laying the page out: a remote URL either races the render or
 * fails silently into a blank cell, and a presigned URL would be dead before
 * anybody prints the file. `getSignaturesAsBase64` does the fetching.
 *
 * Any one of them is `null` when there is no signature to draw - an approval
 * that has not happened, a profile with no signature on file, or an image whose
 * object has gone missing. The renderer treats all three the same way: an empty
 * cell, and the rest of the document still prints.
 */
export type SignaturesBase64 = {
	finalDirectorSignatureBase64: string | null;
	idoFinalSignatureBase64: string | null;
	requestorSignatureBase64: string | null;
};
