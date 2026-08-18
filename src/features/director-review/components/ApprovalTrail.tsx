import { AppCard, AppList, AppReadOnlyField, formatAbsolute, type ListItem, toDate } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { CheckCircle2, MinusCircle, UserCheck, Wallet } from "lucide-react";

interface ApprovalTrailProps {
	/**
	 * Whether the budget stage is STILL OPEN, rather than never having existed.
	 *
	 * Not in the spec's prop list, and the component cannot do its job without
	 * it. `budgetOfficerSignedAt` being null has two completely different
	 * meanings: a budget officer is holding this request right now, or there was
	 * never one to hold it - `recommend` routes straight to the director when no
	 * ACTIVE budget officer exists. The spec's rule is that approving ahead of the
	 * budget desk must be a VISIBLE choice, and a card that printed "not signed"
	 * for both would make the case it exists for indistinguishable from the case
	 * where there is nothing to approve ahead of.
	 */
	isBudgetPending: boolean;
	request: {
		approverNote: string | null;
		budgetOfficerSignatureUrl: string | null;
		budgetOfficerSignedAt: Date | string | null;
		/** Replaces the requestor's title from the IDO stage onwards. */
		finalTitle: string | null;
		processor: string | null;
		reference: string | null;
	};
}

/**
 * What has already been decided, and what has not.
 *
 * ## Why it is on the page
 *
 * The director is not judging a request from scratch: they are signing off on
 * something IDO has already recommended and a budget officer may or may not have
 * cleared. Both are the INPUT to the decision being taken here, and buried in the
 * activity feed they are four scrolls down, mixed in with a creation and a
 * submission. This card is also the ONLY place the final title and the reference
 * appear on this page - `RequestForm` renders the requestor's own document and
 * knows nothing about the columns IDO wrote.
 *
 * ## Why the budget row says the absence out loud
 *
 * `approveByDirector` accepts an open budget stage on purpose, and approving from
 * there ENDS it without a budget approval. A card that simply omitted the budget
 * row when nobody had signed would leave the director to notice a missing line,
 * which is not a thing people notice. The row is always rendered and always names
 * its state - signed, still open, or never applicable.
 *
 * ## Why two components and not one
 *
 * `AppList` truncates both its lines - they are built for "a count, a size, a
 * date" - so the two APPROVALS are list rows, where an actor, a state and a date
 * is exactly the shape, and the three pieces of IDO's own text are
 * `AppReadOnlyField`s, which wrap. A final title cut off at the card's edge on
 * the one page where it appears would be the page hiding the thing being
 * approved. `AppReadOnlyField` is also what `RequestForm` and the budget page's
 * `IdoDecisionSummary` use, so the whole screen reads at one level of
 * editability.
 */
export function ApprovalTrail({ isBudgetPending, request }: ApprovalTrailProps) {
	const { approverNote, budgetOfficerSignatureUrl, budgetOfficerSignedAt, finalTitle, processor, reference } = request;

	const budgetSignedOn = budgetOfficerSignedAt ? formatAbsolute(toDate(budgetOfficerSignedAt)) : null;

	const items: ListItem[] = [
		{
			key: "ido",
			chip: { icon: CheckCircle2, label: "Recommended", tone: "success" },
			leading: { icon: UserCheck, kind: "icon" },
			primary: processor || "IDO",
			secondary: "Reviewed and recommended it",
		},
		budgetRow(budgetSignedOn, isBudgetPending),
	];

	return (
		<AppCard
			data-cy="director-approval-trail"
			description="What the desks before you have decided. None of it is yours to change."
			headingLevel={2}
			title="Approval trail"
		>
			<div className="flex flex-col gap-6">
				<AppList
					data-cy="director-approval-trail-list"
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

				{/* The signature as it was STAMPED, from the request. It is the evidence
				    behind the row above, and it goes onto the same printed form the
				    director is about to sign - so it belongs beside their own decision
				    rather than two pages away in the PDF. */}
				{budgetOfficerSignatureUrl ? (
					<div className="flex flex-col gap-2">
						<Typography
							color="muted"
							type="body-xs"
						>
							The budget officer's signature on this request
						</Typography>

						{/* A white plate regardless of theme: a signature is black ink on
						    paper and disappears entirely on a dark surface. */}
						<div className="flex min-h-24 items-center justify-center rounded-xl border border-default-200 bg-white p-4">
							<img
								alt="The budget officer's signature on this request"
								className="max-h-20 object-contain"
								src={budgetOfficerSignatureUrl}
							/>
						</div>
					</div>
				) : null}
			</div>
		</AppCard>
	);
}

/**
 * The budget desk's row, in the three states it genuinely has.
 *
 * Signed is a date. Open is a warning that names what approving now would do.
 * And "there was never a budget stage" is its own answer rather than a quieter
 * version of open - telling a director that a desk which does not exist has not
 * replied would send them looking for it.
 *
 * Both lines are TRUNCATED by `AppList`, so each is a phrase rather than the
 * explanation. The explanation is `DirectorActionButtons`' alert and the
 * approval dialog, which are where a decision is actually taken.
 */
function budgetRow(signedOn: string | null, isBudgetPending: boolean): ListItem {
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

	if (isBudgetPending) {
		return {
			key: "budget",
			chip: { icon: Wallet, label: "Not signed yet", tone: "warning" },
			leading: { icon: Wallet, kind: "icon" },
			primary: "Budget officer",
			secondary: "Still at the budget desk",
		};
	}

	return {
		key: "budget",
		chip: { icon: MinusCircle, label: "Not applicable", tone: "default" },
		leading: { icon: Wallet, kind: "icon" },
		primary: "Budget officer",
		secondary: "This request never had a budget stage",
	};
}
