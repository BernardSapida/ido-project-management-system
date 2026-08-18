import { AppCard, AppList, AppReadOnlyField, formatAbsolute, type ListItem, toDate } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { CheckCircle2, Gavel, MinusCircle, UserCheck, Wallet } from "lucide-react";
import { StampedSignature } from "@/features/request-detail/components/StampedSignature";
import { BUDGET_ACTIONABLE_DIRECTOR_STATUS, DIRECTOR_REJECTABLE_STATUS } from "@/lib/status-maps/request-status";

interface ApprovalTrailProps {
	request: {
		approverNote: string | null;
		budgetOfficerSignatureUrl: string | null;
		budgetOfficerSignedAt: Date | string | null;
		/**
		 * The sub-stage column, and the only thing that can tell the budget row's
		 * four states apart. Not in spec 012's prop list, and the card cannot be
		 * honest without it - see `budgetRow`.
		 */
		directorReviewStatus: string | null;
		directorSignatureUrl: string | null;
		directorSignedAt: Date | string | null;
		/** Replaces the requestor's title from the IDO stage onwards. */
		finalTitle: string | null;
		processor: string | null;
		reference: string | null;
	};
}

/**
 * What has already been decided, and by whom.
 *
 * ## Why it is on the page
 *
 * Neither the Campus Director nor the IDO Chairperson is judging a request from
 * scratch: they are signing off on something the desks before them have already
 * passed. Those decisions are the INPUT to the one being taken, and buried in
 * the activity feed they are four scrolls down, mixed in with a creation and a
 * submission. This card is also the ONLY place the final title and the reference
 * appear on either page - `RequestForm` renders the requestor's own document and
 * knows nothing about the columns IDO wrote.
 *
 * ## Why the rows appear as they are earned
 *
 * The IDO row is always there - nothing reaches either page without a
 * recommendation. The budget row is always there too, because its ABSENCE is
 * information the director needs and a missing line is not a thing people
 * notice. The director row appears only once they have signed: on their own page
 * before they act there is nothing to report, and reporting "not signed" about
 * the person reading it would be nonsense.
 *
 * ## Why two components and not one
 *
 * `AppList` truncates both its lines - they are built for "a count, a size, a
 * date" - so the APPROVALS are list rows, where an actor, a state and a date is
 * exactly the shape, and the three pieces of IDO's own text are
 * `AppReadOnlyField`s, which wrap. A final title cut off at the card's edge on
 * the one page where it appears would be the page hiding the thing being
 * approved.
 *
 * Shared by spec 012's page and spec 013's, which is why it takes one `request`
 * object rather than a prop per field: the two pages hand it the same slice of
 * `getById` and neither has to know which fields the other uses.
 */
export function ApprovalTrail({ request }: ApprovalTrailProps) {
	const {
		approverNote,
		budgetOfficerSignatureUrl,
		budgetOfficerSignedAt,
		directorReviewStatus,
		directorSignatureUrl,
		directorSignedAt,
		finalTitle,
		processor,
		reference,
	} = request;

	const directorSignedOn = directorSignedAt ? formatAbsolute(toDate(directorSignedAt)) : null;

	const items: ListItem[] = [
		{
			key: "ido",
			chip: { icon: CheckCircle2, label: "Recommended", tone: "success" },
			leading: { icon: UserCheck, kind: "icon" },
			primary: processor || "IDO",
			secondary: "Reviewed and recommended it",
		},
		budgetRow(budgetOfficerSignedAt, directorReviewStatus),
	];

	if (directorSignedOn) {
		items.push({
			key: "director",
			chip: { icon: CheckCircle2, label: "Approved", tone: "success" },
			leading: { icon: Gavel, kind: "icon" },
			meta: directorSignedOn,
			primary: "Campus Director",
			secondary: "Approved and signed",
		});
	}

	return (
		<AppCard
			data-cy="approval-trail"
			description="What the desks before you have decided. None of it is yours to change."
			headingLevel={2}
			title="Approval trail"
		>
			<div className="flex flex-col gap-6">
				<AppList
					data-cy="approval-trail-list"
					items={items}
					label="What has been decided so far"
				/>

				{/* Two columns from `sm` up and one below it: a title and a reference are
				    short labelled facts, and a single column on a wide screen would be a
				    column of air. */}
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<AppReadOnlyField
						description="Carried from here on, including onto the printed form."
						label="Title (Final)"
						value={finalTitle || "—"}
					/>

					<AppReadOnlyField
						label="Reference"
						value={reference || "—"}
					/>
				</div>

				{/* The note gets the full width and its own block: it is the only free
				    text here, and squeezing a paragraph into half a row beside a one-line
				    reference is what makes a reason look like a field label. */}
				<div className="flex flex-col gap-2">
					<AppReadOnlyField
						label="IDO note"
						value={approverNote || "—"}
					/>

					{approverNote ? null : (
						<Typography
							color="muted"
							type="body-xs"
						>
							The IDO left no note. That is not a flag — a note is optional at that stage.
						</Typography>
					)}
				</div>

				{/* The signatures already on the record, from the REQUEST rather than
				    from anybody's profile. They go onto the same printed form the reader
				    is about to sign, so they belong beside their own decision rather than
				    two pages away in the PDF. Side by side from `sm` up, because they are
				    read as a set - "who has signed this so far". */}
				{budgetOfficerSignatureUrl || directorSignatureUrl ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{budgetOfficerSignatureUrl ? (
							<StampedSignature
								data-cy="approval-trail-budget-signature"
								label="The budget officer's signature"
								url={budgetOfficerSignatureUrl}
							/>
						) : null}

						{directorSignatureUrl ? (
							<StampedSignature
								data-cy="approval-trail-director-signature"
								label="The Campus Director's signature"
								url={directorSignatureUrl}
							/>
						) : null}
					</div>
				) : null}
			</div>
		</AppCard>
	);
}

/**
 * The budget desk's row, in the four states it genuinely has.
 *
 * Signed is a date. Still open is a warning that says who has it. "Never had a
 * budget stage" is its own answer rather than a quieter version of open -
 * `recommend` routes straight to the director when no ACTIVE budget officer
 * exists, and telling a director that a desk which does not exist has not
 * replied would send them looking for it.
 *
 * The fourth is the honest one. Once the director has approved, an unsigned
 * budget stage is UNRECOVERABLE from the row: the director may have approved
 * past an open stage, or there may never have been one, and
 * `directorReviewStatus` has been overwritten with the same value either way.
 * So the copy states the fact - no budget approval - and claims nothing about
 * why. The alternative is a card that tells the chairperson a budget officer
 * never existed when one was mid-approval an hour ago.
 */
function budgetRow(signedAt: Date | string | null, directorReviewStatus: string | null): ListItem {
	const signedOn = signedAt ? formatAbsolute(toDate(signedAt)) : null;

	if (signedOn) {
		return {
			key: "budget",
			chip: { icon: CheckCircle2, label: "Approved", tone: "success" },
			leading: { icon: Wallet, kind: "icon" },
			meta: signedOn,
			primary: "Budget officer",
			secondary: "Confirmed the PPMP allocation",
		};
	}

	if (directorReviewStatus === BUDGET_ACTIONABLE_DIRECTOR_STATUS) {
		return {
			key: "budget",
			chip: { icon: Wallet, label: "Not signed yet", tone: "warning" },
			leading: { icon: Wallet, kind: "icon" },
			primary: "Budget officer",
			secondary: "Still at the budget desk",
		};
	}

	// The request is sitting at the director's own stage unsigned by the budget
	// desk, which can only mean it was never routed there.
	if (directorReviewStatus === DIRECTOR_REJECTABLE_STATUS) {
		return {
			key: "budget",
			chip: { icon: MinusCircle, label: "Not applicable", tone: "default" },
			leading: { icon: Wallet, kind: "icon" },
			primary: "Budget officer",
			secondary: "This request never had a budget stage",
		};
	}

	return {
		key: "budget",
		chip: { icon: MinusCircle, label: "None", tone: "default" },
		leading: { icon: Wallet, kind: "icon" },
		primary: "Budget officer",
		secondary: "No budget approval on this request",
	};
}
