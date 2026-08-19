import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { positionLabel, TYPE_OF_REQUEST_OPTIONS } from "@/features/request-form/lib/request-options";
import { formatPdfDate, formatPdfTime } from "../lib/format-pdf-date";
import type { RequestPdfData } from "../types/request-pdf.types";

/**
 * TUPC-F-OCD-IDO-01, the Building Design Request Form, reproduced from a record.
 *
 * This is the artefact the whole workflow exists to produce, and it is the one
 * component in the migration that uses NO lab component and no HeroUI. That is a
 * property of the target format rather than a shortcut: these are
 * `@react-pdf/renderer` primitives, which share no runtime with the DOM - there
 * is no CSS, no cascade, no `className`, and an `AppCard` dropped in here would
 * render as nothing at all. The paper original is in `IRMS-old/documents/` and is
 * the acceptance reference; where the two disagree, the paper wins.
 *
 * ## Why the module is isolated
 *
 * Importing this file imports the PDF engine, which must never reach the SSR
 * bundle. Nothing outside `RequestPdfInner` may import it, and `RequestPdfInner`
 * is itself only ever reached through `React.lazy` - see the note there.
 *
 * ## The signature gate is NOT here
 *
 * `isIdoSigned` and `isFinalApproved` decide what is DRAWN, and they are the
 * second belt. The first is on the server: `getForPdf` nulls each desk's
 * approval fields and `getSignaturesAsBase64` refuses to convert that desk's
 * image until it has signed. Moving the gate here - "the renderer already
 * checks" - would ship every unsigned signature to anybody who opens the network
 * tab.
 *
 * TWO booleans rather than one, because the two desks sign at different times:
 * the IDO Chairperson's block fills at their own approval, and the Campus
 * Director's at theirs. A single flag printed an empty IDO block on a request
 * the chairperson had already signed.
 *
 * ## How the grid holds together
 *
 * Every section is a bordered box with `marginTop: -BW`, so its top edge lands
 * exactly on the previous section's bottom edge instead of drawing a
 * double-thickness line down the page. Cells carry a right border and the last
 * cell in a row carries none; rows carry a bottom border and the last row in a
 * section carries none. That pairing is what makes the whole page read as one
 * table rather than as a stack of boxes.
 */

const BORDER = "#000000";
const BW = 0.5;
const SHADE = "#000000";

const S = StyleSheet.create({
	page: { fontFamily: "Helvetica", fontSize: 8, padding: 30 },

	/* Section 1 - header */
	headerWrap: { borderColor: BORDER, borderWidth: BW, flexDirection: "row" },
	infoCell: { alignItems: "center", padding: 4, width: "80%" },
	logoCell: {
		alignItems: "center",
		borderColor: BORDER,
		borderRightWidth: BW,
		justifyContent: "center",
		padding: 6,
		width: "20%",
	},
	/* The TUP mark, square in the source, so the box is square too - letting
	   react-pdf letterbox it would leave the seal floating off-centre in the
	   header cell. */
	logo: {
		height: 40,
		objectFit: "contain",
		width: 40,
	},
	/* 20% to put its right border under the logo cell's, and the right cell
	   matches so the title stays centred on the page. */
	subCell: { borderColor: BORDER, borderRightWidth: BW, padding: 3, width: "20%" },
	subCellCenter: {
		alignItems: "center",
		borderColor: BORDER,
		borderRightWidth: BW,
		padding: 3,
		width: "60%",
	},
	subCellRight: { alignItems: "flex-end", padding: 3, width: "20%" },
	subRow: {
		borderColor: BORDER,
		borderLeftWidth: BW,
		borderRightWidth: BW,
		borderTopWidth: BW,
		flexDirection: "row",
		marginTop: -BW,
	},

	/* The table grid */
	cell: { borderColor: BORDER, borderRightWidth: BW, padding: 3 },
	/* Vertical centring for the cells of a row a SIGNATURE image has made tall.
	   Applied per cell rather than to the row, because `alignItems` on the row
	   would stop the cells stretching and their right borders would then span
	   their own content instead of the full height of the row.

	   NOT folded into `cell` itself: the DETAILS cell is tall for a different
	   reason - a long paragraph - and a paragraph centred in its box instead of
	   starting at the top reads as a caption. */
	cellMiddle: { justifyContent: "center" },
	cellLast: { padding: 3 },
	row: { borderBottomColor: BORDER, borderBottomWidth: BW, flexDirection: "row" },
	rowLast: { flexDirection: "row" },
	section: { borderColor: BORDER, borderWidth: BW, marginTop: -BW },
	/* Two headings side by side over a signature block that spans both - see the
	   note in section 6. The bottom rule is here rather than on either column,
	   because the two end at different heights. */
	splitLeft: { borderColor: BORDER, borderRightWidth: BW, width: "50%" },
	splitRight: { width: "50%" },
	splitRow: { borderBottomColor: BORDER, borderBottomWidth: BW, flexDirection: "row" },
	shadedRow: {
		backgroundColor: SHADE,
		borderBottomColor: BORDER,
		borderBottomWidth: BW,
		color: "#FFFFFF",
		padding: 3,
	},

	/* Type */
	bold: { fontFamily: "Helvetica-Bold" },
	italic: { fontFamily: "Helvetica-Oblique" },
	sz7: { fontSize: 7 },
	sz10: { fontSize: 10 },
	textCenter: { textAlign: "center" },

	/* Checkboxes and signatures */
	checkbox: {
		alignItems: "center",
		borderColor: BORDER,
		borderWidth: BW,
		height: 8,
		justifyContent: "center",
		marginRight: 2,
		width: 8,
	},
	checkItem: { alignItems: "center", flexDirection: "row", marginRight: 10 },
	checkRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap" },
	sig: { maxHeight: 30, objectFit: "contain" },

	footer: { fontSize: 7, marginTop: 8 },
});

/**
 * A ticked box is FILLED, not marked with a glyph.
 *
 * A tick drawn as text needs a font that carries the character, and Helvetica -
 * the one font this document embeds - does not. It would print as a hollow box
 * in one reader and as a question mark in the next.
 */
function Checkbox({ checked }: { checked: boolean }) {
	return <View style={[S.checkbox, checked ? { backgroundColor: BORDER } : {}]} />;
}

/** Bold text INSIDE a sentence. `@react-pdf` inherits styles down nested `Text`,
 *  which is the only way to get "Reason: " bold and the note beside it plain
 *  without laying the two out as separate cells. */
function Bold({ children }: { children: string }) {
	return <Text style={S.bold}>{children}</Text>;
}

/**
 * The checkbox row over the six kinds of work.
 *
 * The values come from `TYPE_OF_REQUEST_OPTIONS`, so a seventh kind added to the
 * form's select grows a seventh box here rather than printing a request with
 * nothing ticked. Only the LABEL of `OTHER` differs: the select says "Other",
 * the paper form says "Others (Please Specify)", and this reproduces the paper.
 */
const TYPE_CHECKBOXES = TYPE_OF_REQUEST_OPTIONS.map((option) =>
	option.value === "OTHER" ? { label: "Others (Please Specify)", value: option.value } : option,
);

/**
 * The four representative rows of section 4, in the order the paper form prints
 * them. `DEPARTMENT_HEAD` is deliberately absent - that position signs section 5
 * instead, so a requestor who holds it leaves all four of these blank.
 */
const REPRESENTATIVE_POSITIONS = [
	{ label: "STUDENT REPRESENTATIVE", value: "STUDENT_REPRESENTATIVE" },
	{ label: "ADMINISTRATION REPRESENTATIVE", value: "ADMINISTRATION_REPRESENTATIVE" },
	{ label: "FACULTY REPRESENTATIVE", value: "FACULTY_REPRESENTATIVE" },
	{ label: "ALUMNI REPRESENTATIVE", value: "ALUMNI_REPRESENTATIVE" },
] as const;

interface Props {
	finalDirectorSignatureBase64: string | null;
	idoFinalSignatureBase64: string | null;
	/** `finalDirectorStatus === "APPROVED"`. The server has already redacted on
	 *  the same rule; this only decides what is drawn. */
	isFinalApproved: boolean;
	/** `idoFinalStatus === "IDO_FINAL_APPROVED"` - the chairperson's own signature,
	 *  which lands one desk before the final approval. */
	isIdoSigned: boolean;
	request: RequestPdfData;
	requestorSignatureBase64: string | null;
}

export function RequestFormPDFDocument({
	finalDirectorSignatureBase64,
	idoFinalSignatureBase64,
	isFinalApproved,
	isIdoSigned,
	request,
	requestorSignatureBase64,
}: Props) {
	const submittedDate = formatPdfDate(request.requestSubmittedAt);
	const submittedTime = formatPdfTime(request.requestSubmittedAt);
	const idoSignedDate = formatPdfDate(request.idoFinalSignedAt);
	const idoSignedTime = formatPdfTime(request.idoFinalSignedAt);
	const directorSignedDate = formatPdfDate(request.finalDirectorSignedAt);
	const directorSignedTime = formatPdfTime(request.finalDirectorSignedAt);

	const isRecommended = request.idoEvaluationStatus === "RECOMMENDED_BY_IDO";
	const directorStatus = request.finalDirectorStatus;
	/*
	 * The IDO Chairperson's own verdict, and it drives section 6's ACTION column.
	 *
	 * The two ACTION blocks belong to two different desks, which is easy to miss
	 * because they carry the same three boxes: section 6's sits beside the IDO
	 * recommendation and over the chairperson's signature, and section 7's is the
	 * Campus Director's. Both used to read `finalDirectorStatus`, so the IDO's
	 * Approved box stayed empty on a request they had already approved and signed,
	 * and then ticked itself when somebody else acted.
	 */
	const idoFinalStatus = request.idoFinalStatus;

	/*
	 * Section 6's three ACTION boxes, which record what the IDO DESK did - across
	 * both of its reviews, not just the final one.
	 *
	 * The desk acts twice: the first review can recommend, return, reject or defer,
	 * and the final review can approve or reject. The paper form gives that one row
	 * of three boxes, so the two reviews share it:
	 *
	 *   - Approved   - the chairperson signed off at the final review. Recommending
	 *                  at the FIRST review is not this; that is the Yes box on the
	 *                  left, and the request still has to come back here.
	 *   - Disapproved - IDO refused it, at EITHER review. Which of the two said no
	 *                  does not change that the answer came from this desk, and a
	 *                  first-review rejection with nothing ticked here would print a
	 *                  refused form that looks unactioned.
	 *   - Resubmit   - returned to the requestor to be fixed. Only the first review
	 *                  can do this; there is no return from the final one.
	 *
	 * Deferring to next year's PPMP ticks nothing, because the form has no box for
	 * it - the reason travels in the Reason cell instead.
	 */
	const isIdoApproved = idoFinalStatus === "IDO_FINAL_APPROVED";
	const isIdoDisapproved = idoFinalStatus === "IDO_FINAL_REJECTED" || request.idoEvaluationStatus === "REJECTED_BY_IDO";
	const isIdoResubmit = request.idoEvaluationStatus === "RETURNED_TO_REQUESTOR";

	/*
	 * The requestor signs ONE row of this form, and which row is decided by the
	 * position they hold. Every cell below asks these three the same question, so
	 * a request can never print the same signature in two representative rows.
	 */
	const signatureFor = (position: string) => (request.position === position ? requestorSignatureBase64 : null);
	const nameFor = (position: string) => (request.position === position ? request.requestedBy : "");
	const dateFor = (position: string) => (request.position === position ? submittedDate : "");
	const timeFor = (position: string) => (request.position === position ? submittedTime : "");

	const departmentHeadSignature = signatureFor("DEPARTMENT_HEAD");

	return (
		<Document>
			<Page
				size="A4"
				style={S.page}
			>
				{/* -- 1 - Header ----------------------------------------------------- */}
				<View style={S.headerWrap}>
					<View style={S.logoCell}>
						<Image
							src="/images/logo.png"
							style={S.logo}
						/>
					</View>
					<View style={S.infoCell}>
						<Text style={[S.bold, S.textCenter]}>Technological University of the Philippines</Text>
						<Text style={[S.bold, S.textCenter]}>Cavite Campus</Text>
						<Text style={S.textCenter}>{"Governor's Drive, Barangay Bancal, Carmona, Cavite"}</Text>
						<Text style={S.textCenter}>Telefax: (046) 430-4321</Text>
						<Text style={S.textCenter}>Email: tupcavite@tup.edu.ph | www.tup.edu.ph</Text>
					</View>
				</View>
				<View style={S.subRow}>
					<View style={S.subCell}>
						<Text style={S.bold}>IDO</Text>
					</View>
					<View style={S.subCellCenter}>
						<Text style={[S.bold, S.sz10, S.textCenter]}>BUILDING DESIGN REQUEST FORM</Text>
					</View>
					<View style={S.subCellRight}>
						{/* One page by design - the details cell grows, it does not spill
						    onto a continuation sheet. See the spec's out-of-scope. */}
						<Text>Page 1/1</Text>
					</View>
				</View>

				{/* -- 2 - Details of Request ----------------------------------------- */}
				<View style={S.section}>
					<View style={S.shadedRow}>
						<Text style={S.bold}>DETAILS OF REQUEST</Text>
					</View>
					<View style={S.row}>
						<View style={[S.cell, { width: "25%" }]}>
							<Text style={S.bold}>TYPE OF REQUEST</Text>
						</View>
						<View style={[S.cellLast, { width: "75%" }]}>
							<View style={S.checkRow}>
								{TYPE_CHECKBOXES.map((option) => (
									<View
										key={option.value}
										style={S.checkItem}
									>
										<Checkbox checked={request.typeOfRequest === option.value} />
										<Text>{option.label}</Text>
									</View>
								))}
							</View>
						</View>
					</View>
					<View style={S.row}>
						<View style={[S.cell, { width: "25%" }]}>
							<Text style={S.bold}>NAME OF BUILDING/AREA {"&"} LOCATION</Text>
						</View>
						<View style={[S.cellLast, { width: "75%" }]}>
							{/* Already resolved to `finalTitle ?? title` on the server: IDO may
							    retitle a request, and the printed form carries the title the
							    office approved rather than the one first typed. */}
							<Text>{request.nameOfBuildingArea}</Text>
						</View>
					</View>
					<View style={S.rowLast}>
						<View style={[S.cell, { width: "25%" }]}>
							<Text style={S.bold}>DETAILS</Text>
							<Text style={[S.italic, S.sz7]}>(Use a separate sheet if necessary)</Text>
						</View>
						{/* `minHeight` rather than a fixed height: this cell holds a two-line
						    request and a twenty-line one, and the page grows to fit. */}
						<View style={[S.cellLast, { minHeight: 80, width: "75%" }]}>
							<Text>{request.details}</Text>
						</View>
					</View>
				</View>

				{/* -- 3 - Requestor -------------------------------------------------- */}
				<View style={S.section}>
					{/*
					 * 25/30/10/35, and the two rows of this section have to agree on the
					 * first three: they are the same vertical rules drawn twice, and a
					 * width changed on one row alone puts a kink in the table.
					 *
					 * The last cell runs to 100% rather than stopping at 85% the way it
					 * used to. The missing 15% drew no border, so it read as part of the
					 * signature cell while the image was centred in the wrong half of it.
					 */}
					<View style={S.row}>
						<View style={[S.cell, S.cellMiddle, { width: "25%" }]}>
							<Text style={S.bold}>REQUESTED BY</Text>
						</View>
						<View style={[S.cell, S.cellMiddle, { width: "30%" }]}>
							<Text>{request.requestedBy}</Text>
						</View>
						<View style={[S.cell, S.cellMiddle, { width: "10%" }]}>
							<Text style={S.bold}>SIGNATURE</Text>
						</View>
						<View style={[S.cellLast, S.cellMiddle, { alignItems: "center", width: "35%" }]}>
							{/* Blank when the profile carries no signature, and the rest of the
							    form still prints - that is a form to be signed by hand, not a
							    document that failed to render. */}
							{requestorSignatureBase64 ? (
								<Image
									src={requestorSignatureBase64}
									style={S.sig}
								/>
							) : null}
						</View>
					</View>
					<View style={S.rowLast}>
						<View style={[S.cell, { width: "25%" }]}>
							<Text style={S.bold}>POSITION/DESIGNATION</Text>
						</View>
						<View style={[S.cell, { width: "30%" }]}>
							{/* The LABEL, never the stored enum. "FACULTY_REPRESENTATIVE" on a
							    filed form is a bug the office reports. */}
							<Text>{positionLabel(request.position)}</Text>
						</View>
						<View style={[S.cell, { width: "10%" }]}>
							<Text style={S.bold}>DATE</Text>
						</View>
						<View style={[S.cell, { width: "15%" }]}>
							<Text>{submittedDate}</Text>
						</View>
						<View style={[S.cell, { width: "8%" }]}>
							<Text style={S.bold}>TIME</Text>
						</View>
						{/* 12%, not 7%. At 7% the cell had about 31pt of room and "09:00 AM"
						    needs roughly 36pt, so every filed form wrapped the time onto a
						    second line and grew the row. The width came out of the position
						    cell, which had the most to spare. */}
						<View style={[S.cellLast, { width: "12%" }]}>
							<Text>{submittedTime}</Text>
						</View>
					</View>
				</View>

				{/* -- 4 - Related Personnel ------------------------------------------ */}
				<View style={S.section}>
					{/* An empty shaded bar, which the paper form puts here to break the
					    requestor's own block off from the representatives' one. The space
					    is the whole content - the `Text` holds a single space so the bar
					    takes the same height as every other shaded row rather than
					    collapsing to its padding. */}
					<View style={S.shadedRow}>
						<Text> </Text>
					</View>
					<View style={[S.row, { padding: 3 }]}>
						<Text style={[S.bold, S.sz7]}>NOTE: To be accomplished by Related Personnel (At least 2)</Text>
					</View>
					{REPRESENTATIVE_POSITIONS.map((representative, index) => {
						const signature = signatureFor(representative.value);
						const isLast = index === REPRESENTATIVE_POSITIONS.length - 1;

						return (
							<View key={representative.value}>
								<View style={S.row}>
									<View style={[S.cell, S.cellMiddle, { width: "40%" }]}>
										<Text style={S.bold}>{representative.label}</Text>
									</View>
									{/* Blank on every row but the requestor's own. The system knows
									    one person, and the other representatives sign the printed
									    sheet by hand - but on the row that IS theirs the name has to
									    print, because `dateFor` and `timeFor` below already fill
									    against the same match. A row carrying a date and a time under
									    a nameless heading reads as a form somebody started and
									    abandoned. */}
									<View style={[S.cell, S.cellMiddle, { width: "25%" }]}>
										<Text>{nameFor(representative.value)}</Text>
									</View>
									<View style={[S.cell, S.cellMiddle, { width: "10%" }]}>
										<Text style={S.bold}>SIGNATURE</Text>
									</View>
									<View style={[S.cellLast, S.cellMiddle, { alignItems: "center", width: "25%" }]}>
										{signature ? (
											<Image
												src={signature}
												style={S.sig}
											/>
										) : null}
									</View>
								</View>
								<View style={isLast ? S.rowLast : S.row}>
									<View style={[S.cell, { width: "40%" }]}>
										<Text style={S.bold}>DATE</Text>
									</View>
									<View style={[S.cell, { width: "25%" }]}>
										<Text>{dateFor(representative.value)}</Text>
									</View>
									<View style={[S.cell, { width: "10%" }]}>
										<Text style={S.bold}>TIME</Text>
									</View>
									<View style={[S.cellLast, { width: "25%" }]}>
										<Text>{timeFor(representative.value)}</Text>
									</View>
								</View>
							</View>
						);
					})}
				</View>

				{/* -- 5 - Noted, Department Head ------------------------------------- */}
				<View style={S.section}>
					<View style={S.shadedRow}>
						<Text style={S.bold}>NOTED</Text>
					</View>
					<View style={S.row}>
						<View style={[S.cell, S.cellMiddle, { width: "40%" }]}>
							<Text style={S.bold}>DEPT. HEAD/IMMEDIATE SUPERVISOR</Text>
						</View>
						{/* Fills on the same rule as section 4: only when the requestor holds
						    this position, which is the one case the system can name. */}
						<View style={[S.cell, S.cellMiddle, { width: "25%" }]}>
							<Text>{nameFor("DEPARTMENT_HEAD")}</Text>
						</View>
						<View style={[S.cell, S.cellMiddle, { width: "10%" }]}>
							<Text style={S.bold}>SIGNATURE</Text>
						</View>
						<View style={[S.cellLast, S.cellMiddle, { alignItems: "center", width: "25%" }]}>
							{departmentHeadSignature ? (
								<Image
									src={departmentHeadSignature}
									style={S.sig}
								/>
							) : null}
						</View>
					</View>
					<View style={S.rowLast}>
						<View style={[S.cell, { width: "40%" }]}>
							<Text style={S.bold}>DATE</Text>
						</View>
						<View style={[S.cell, { width: "25%" }]}>
							<Text>{dateFor("DEPARTMENT_HEAD")}</Text>
						</View>
						<View style={[S.cell, { width: "10%" }]}>
							<Text style={S.bold}>TIME</Text>
						</View>
						<View style={[S.cellLast, { width: "25%" }]}>
							<Text>{timeFor("DEPARTMENT_HEAD")}</Text>
						</View>
					</View>
				</View>

				{/* -- 6 - Recommendation by IDO | Action ----------------------------- */}
				{/*
				 * The two headings sit over their own cells, and the signature block
				 * below spans BOTH of them.
				 *
				 * That is what the paper form does, and it is easy to get wrong: `IDO`
				 * and `DATE` are on the left, `SIGNATURE` and `TIME` on the right, and
				 * the rule between them is the same 50% line the two headings share. It
				 * reads as one four-cell row, not as a signature block per column.
				 * Giving the ACTION column its own CAMPUS DIRECTOR / DATE / TIME rows
				 * printed the director's signature twice - once here, and once in
				 * section 7 where the form actually asks for it.
				 *
				 * The bottom border belongs to the CONTAINER rather than to each
				 * column's last row. The two columns hold different amounts of text and
				 * end at different heights, so a border per column draws two short lines
				 * at two heights instead of the one straight rule the rows below start
				 * from.
				 */}
				<View style={S.section}>
					<View style={S.splitRow}>
						<View style={S.splitLeft}>
							<View style={S.shadedRow}>
								<Text style={S.bold}>RECOMMENDATION BY IDO</Text>
							</View>
							<View style={S.row}>
								<View style={[S.cellLast, { padding: 3 }]}>
									<Text style={S.bold}>Recommending Approval?</Text>
									<View style={[S.checkRow, { marginTop: 2 }]}>
										<View style={S.checkItem}>
											<Checkbox checked={isRecommended} />
											<Text>Yes</Text>
										</View>
										<View style={S.checkItem}>
											{/* "No" means the IDO has DECIDED and did not recommend, so
											    neither box is ticked while the stage is still open. A
											    RETURNED request therefore prints as No, which is the
											    existing IRMS-old behaviour - confirm with the office
											    before changing it. */}
											<Checkbox checked={!isRecommended && request.idoEvaluationStatus !== null} />
											<Text>No</Text>
										</View>
									</View>
								</View>
							</View>
							<View style={S.rowLast}>
								<View style={[S.cellLast, { padding: 3 }]}>
									{/* `approverNote` is ONE column printed in three cells - here and
									    in both Notes cells below. A later stage that overwrites it
									    changes all three together. */}
									<Text>
										<Bold>Reason: </Bold>
										{request.approverNote ?? ""}
									</Text>
								</View>
							</View>
						</View>

						<View style={S.splitRight}>
							<View style={S.shadedRow}>
								<Text style={S.bold}>ACTION</Text>
							</View>
							<View style={S.row}>
								<View style={[S.cellLast, { padding: 3 }]}>
									<View style={S.checkRow}>
										<View style={S.checkItem}>
											<Checkbox checked={isIdoApproved} />
											<Text>Approved</Text>
										</View>
										<View style={S.checkItem}>
											<Checkbox checked={isIdoDisapproved} />
											<Text>Disapproved</Text>
										</View>
										<View style={S.checkItem}>
											<Checkbox checked={isIdoResubmit} />
											<Text>Resubmit Request</Text>
										</View>
									</View>
								</View>
							</View>
							<View style={S.rowLast}>
								<View style={[S.cellLast, { padding: 3 }]}>
									<Text>
										<Bold>Notes: </Bold>
										{request.approverNote ?? ""}
									</Text>
								</View>
							</View>
						</View>
					</View>

					{/* 15/35 twice, so the divider between the name and the signature halves
					    lands on the same 50% line as the two headings above. */}
					<View style={S.row}>
						<View style={[S.cell, S.cellMiddle, { width: "15%" }]}>
							<Text style={S.bold}>IDO</Text>
						</View>
						<View style={[S.cell, S.cellMiddle, { width: "35%" }]}>
							<Text>{request.idoFinalApproverName ?? ""}</Text>
						</View>
						<View style={[S.cell, S.cellMiddle, { width: "15%" }]}>
							<Text style={S.bold}>SIGNATURE</Text>
						</View>
						<View style={[S.cellLast, S.cellMiddle, { alignItems: "center", width: "35%" }]}>
							{isIdoSigned && idoFinalSignatureBase64 ? (
								<Image
									src={idoFinalSignatureBase64}
									style={S.sig}
								/>
							) : null}
						</View>
					</View>
					<View style={S.rowLast}>
						<View style={[S.cell, { width: "15%" }]}>
							<Text style={S.bold}>DATE</Text>
						</View>
						<View style={[S.cell, { width: "35%" }]}>
							<Text>{isIdoSigned ? idoSignedDate : ""}</Text>
						</View>
						<View style={[S.cell, { width: "15%" }]}>
							<Text style={S.bold}>TIME</Text>
						</View>
						<View style={[S.cellLast, { width: "35%" }]}>
							<Text>{isIdoSigned ? idoSignedTime : ""}</Text>
						</View>
					</View>
				</View>
				{/* -- 7 - Action, Campus Director, full width ------------------------ */}
				<View style={S.section}>
					<View style={S.shadedRow}>
						<Text style={S.bold}>ACTION</Text>
					</View>
					<View style={S.row}>
						<View style={[S.cellLast, { padding: 3 }]}>
							<View style={S.checkRow}>
								<View style={S.checkItem}>
									<Checkbox checked={directorStatus === "APPROVED"} />
									<Text>Approved</Text>
								</View>
								<View style={S.checkItem}>
									<Checkbox checked={directorStatus === "FINAL_REJECTED"} />
									<Text>Disapproved</Text>
								</View>
								<View style={S.checkItem}>
									<Checkbox checked={false} />
									<Text>Resubmit Request</Text>
								</View>
							</View>
						</View>
					</View>
					<View style={S.row}>
						<View style={[S.cell, { width: "15%" }]}>
							<Text style={S.bold}>Notes:</Text>
						</View>
						<View style={[S.cellLast, { width: "85%" }]}>
							<Text>{request.approverNote ?? ""}</Text>
						</View>
					</View>
					<View style={S.row}>
						<View style={[S.cell, S.cellMiddle, { width: "20%" }]}>
							<Text style={S.bold}>CAMPUS DIRECTOR</Text>
						</View>
						{/* Their NAME, beside their signature. It comes from the audit entry
						    for the final approval rather than from a column on the request -
						    `processor` is the officer who did the first review, which is a
						    different desk. Redacted with the signatures, so it is blank on a
						    form nobody has finally approved. */}
						<View style={[S.cell, S.cellMiddle, { width: "30%" }]}>
							<Text>{request.finalDirectorName ?? ""}</Text>
						</View>
						<View style={[S.cell, S.cellMiddle, { width: "20%" }]}>
							<Text style={S.bold}>SIGNATURE</Text>
						</View>
						{/* `"30%"`, not `"30"` - IRMS-old shipped the unitless value here and
						    the cell collapsed, pushing the signature against the border. */}
						<View style={[S.cellLast, S.cellMiddle, { alignItems: "center", width: "30%" }]}>
							{isFinalApproved && finalDirectorSignatureBase64 ? (
								<Image
									src={finalDirectorSignatureBase64}
									style={S.sig}
								/>
							) : null}
						</View>
					</View>
					<View style={S.rowLast}>
						<View style={[S.cell, { width: "20%" }]}>
							<Text style={S.bold}>DATE</Text>
						</View>
						<View style={[S.cell, { width: "30%" }]}>
							<Text>{isFinalApproved ? directorSignedDate : ""}</Text>
						</View>
						<View style={[S.cell, { width: "20%" }]}>
							<Text style={S.bold}>TIME</Text>
						</View>
						<View style={[S.cellLast, { width: "30%" }]}>
							<Text>{isFinalApproved ? directorSignedTime : ""}</Text>
						</View>
					</View>
				</View>

				{/* The controlled-document number. It identifies the FORM, not the
				    request - every printed copy carries the same one. */}
				<Text style={S.footer}>TUPC-F-OCD-IDO-01 Ø2 (07.12.19)</Text>
			</Page>
		</Document>
	);
}
