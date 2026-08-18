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
 * `isApproved` decides what is DRAWN, and it is the second belt. The first is on
 * the server: `getForPdf` nulls the four approval fields and
 * `getSignaturesAsBase64` refuses to convert the two approval images until the
 * Campus Director has finally approved. Moving the gate here - "the renderer
 * already checks" - would ship every unapproved signature to anybody who opens
 * the network tab.
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
	/* A grey box, exactly as IRMS-old shipped it. Swap it for the real TUP mark
	   before this form is filed anywhere - a placeholder on an official document
	   is a defect somebody will report. */
	logoPlaceholder: {
		backgroundColor: "#E8E8E8",
		borderColor: BORDER,
		borderWidth: BW,
		height: 40,
		width: 40,
	},
	subCell: { borderColor: BORDER, borderRightWidth: BW, padding: 3, width: "15%" },
	subCellCenter: {
		alignItems: "center",
		borderColor: BORDER,
		borderRightWidth: BW,
		padding: 3,
		width: "70%",
	},
	subCellRight: { alignItems: "flex-end", padding: 3, width: "15%" },
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
	cellLast: { padding: 3 },
	row: { borderBottomColor: BORDER, borderBottomWidth: BW, flexDirection: "row" },
	rowLast: { flexDirection: "row" },
	section: { borderColor: BORDER, borderWidth: BW, marginTop: -BW },
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
	isApproved: boolean;
	request: RequestPdfData;
	requestorSignatureBase64: string | null;
}

export function RequestFormPDFDocument({
	finalDirectorSignatureBase64,
	idoFinalSignatureBase64,
	isApproved,
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
	 * The requestor signs ONE row of this form, and which row is decided by the
	 * position they hold. Every cell below asks these three the same question, so
	 * a request can never print the same signature in two representative rows.
	 */
	const signatureFor = (position: string) => (request.position === position ? requestorSignatureBase64 : null);
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
						<View style={S.logoPlaceholder} />
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
					<View style={S.row}>
						<View style={[S.cell, { width: "25%" }]}>
							<Text style={S.bold}>REQUESTED BY</Text>
						</View>
						<View style={[S.cell, { width: "35%" }]}>
							<Text>{request.requestedBy}</Text>
						</View>
						<View style={[S.cell, { alignItems: "center", width: "10%" }]}>
							<Text style={[S.bold, S.textCenter]}>SIGNATURE</Text>
						</View>
						<View style={[S.cellLast, { alignItems: "center", width: "15%" }]}>
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
						<View style={[S.cell, { width: "35%" }]}>
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
						<View style={[S.cellLast, { width: "7%" }]}>
							<Text>{submittedTime}</Text>
						</View>
					</View>
				</View>

				{/* -- 4 - Related Personnel ------------------------------------------ */}
				<View style={S.section}>
					<View style={[S.row, { padding: 3 }]}>
						<Text style={[S.italic, S.sz7]}>NOTE: To be accomplished by Related Personnel (At least 2)</Text>
					</View>
					{REPRESENTATIVE_POSITIONS.map((representative, index) => {
						const signature = signatureFor(representative.value);
						const isLast = index === REPRESENTATIVE_POSITIONS.length - 1;

						return (
							<View key={representative.value}>
								<View style={S.row}>
									<View style={[S.cell, { width: "40%" }]}>
										<Text style={S.bold}>{representative.label}</Text>
									</View>
									{/* The name cell stays blank on purpose. The system knows one
									    person - the requestor - and the other representatives sign
									    the printed sheet by hand. */}
									<View style={[S.cell, { width: "25%" }]} />
									<View style={[S.cell, { alignItems: "center", width: "10%" }]}>
										<Text style={[S.bold, S.textCenter]}>SIGNATURE</Text>
									</View>
									<View style={[S.cellLast, { alignItems: "center", width: "25%" }]}>
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
						<View style={[S.cell, { width: "40%" }]}>
							<Text style={S.bold}>DEPT. HEAD/IMMEDIATE SUPERVISOR</Text>
						</View>
						<View style={[S.cell, { width: "25%" }]} />
						<View style={[S.cell, { alignItems: "center", width: "10%" }]}>
							<Text style={[S.bold, S.textCenter]}>SIGNATURE</Text>
						</View>
						<View style={[S.cellLast, { alignItems: "center", width: "25%" }]}>
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
				<View style={[S.section, { flexDirection: "row" }]}>
					<View style={{ borderColor: BORDER, borderRightWidth: BW, width: "50%" }}>
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
						<View style={S.row}>
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
						<View style={S.row}>
							<View style={[S.cell, { width: "25%" }]}>
								<Text style={S.bold}>IDO</Text>
							</View>
							<View style={[S.cell, { width: "25%" }]}>
								<Text style={[S.bold, S.textCenter]}>SIGNATURE</Text>
							</View>
							<View style={[S.cellLast, { alignItems: "center", width: "50%" }]}>
								{isApproved && idoFinalSignatureBase64 ? (
									<Image
										src={idoFinalSignatureBase64}
										style={S.sig}
									/>
								) : null}
							</View>
						</View>
						<View style={S.rowLast}>
							<View style={[S.cell, { width: "25%" }]}>
								<Text style={S.bold}>DATE</Text>
							</View>
							<View style={[S.cell, { width: "25%" }]}>
								<Text>{isApproved ? idoSignedDate : ""}</Text>
							</View>
							<View style={[S.cell, { width: "25%" }]}>
								<Text style={S.bold}>TIME</Text>
							</View>
							<View style={[S.cellLast, { width: "25%" }]}>
								<Text>{isApproved ? idoSignedTime : ""}</Text>
							</View>
						</View>
					</View>

					<View style={{ width: "50%" }}>
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
										{/* Never ticked. There is no "resubmit" outcome at the final
										    director stage - a request sent back goes through the IDO
										    desk, which is this section's left column. The box exists
										    because the paper form has it. */}
										<Checkbox checked={false} />
										<Text>Resubmit Request</Text>
									</View>
								</View>
							</View>
						</View>
						<View style={S.row}>
							<View style={[S.cellLast, { padding: 3 }]}>
								<Text>
									<Bold>Notes: </Bold>
									{request.approverNote ?? ""}
								</Text>
							</View>
						</View>
						<View style={S.row}>
							<View style={[S.cell, { paddingBottom: 4, paddingTop: 4, width: "25%" }]}>
								<Text style={S.bold}>{"CAMPUS\nDIRECTOR"}</Text>
							</View>
							<View style={[S.cell, { width: "25%" }]}>
								<Text style={[S.bold, S.textCenter]}>SIGNATURE</Text>
							</View>
							<View style={[S.cellLast, { alignItems: "center", width: "50%" }]}>
								{isApproved && finalDirectorSignatureBase64 ? (
									<Image
										src={finalDirectorSignatureBase64}
										style={S.sig}
									/>
								) : null}
							</View>
						</View>
						<View style={S.rowLast}>
							<View style={[S.cell, { width: "25%" }]}>
								<Text style={S.bold}>DATE</Text>
							</View>
							<View style={[S.cell, { width: "25%" }]}>
								<Text>{isApproved ? directorSignedDate : ""}</Text>
							</View>
							<View style={[S.cell, { width: "25%" }]}>
								<Text style={S.bold}>TIME</Text>
							</View>
							<View style={[S.cellLast, { width: "25%" }]}>
								<Text>{isApproved ? directorSignedTime : ""}</Text>
							</View>
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
						<View style={[S.cell, { width: "20%" }]}>
							<Text style={S.bold}>CAMPUS DIRECTOR</Text>
						</View>
						<View style={[S.cell, { width: "30%" }]} />
						<View style={[S.cell, { alignItems: "center", width: "20%" }]}>
							<Text style={[S.bold, S.textCenter]}>SIGNATURE</Text>
						</View>
						{/* `"30%"`, not `"30"` - IRMS-old shipped the unitless value here and
						    the cell collapsed, pushing the signature against the border. */}
						<View style={[S.cellLast, { alignItems: "center", width: "30%" }]}>
							{isApproved && finalDirectorSignatureBase64 ? (
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
							<Text>{isApproved ? directorSignedDate : ""}</Text>
						</View>
						<View style={[S.cell, { width: "20%" }]}>
							<Text style={S.bold}>TIME</Text>
						</View>
						<View style={[S.cellLast, { width: "30%" }]}>
							<Text>{isApproved ? directorSignedTime : ""}</Text>
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
