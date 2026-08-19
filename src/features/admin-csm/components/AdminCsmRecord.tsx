import {
	AppButton,
	AppCard,
	AppChip,
	AppRatingSummary,
	AppReadOnlyField,
	formatAbsolute,
	toDate,
} from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { Undo2 } from "lucide-react";
import { statusChip } from "../lib/csm-options";
import type { AdminCsmRow } from "../types";

interface AdminCsmRecordProps {
	/** Back to the report. The page owns the destination. */
	onBack: () => void;
	record: AdminCsmRow;
}

/**
 * One satisfaction record, in full.
 *
 * ## What is NOT here
 *
 * A link to the request. An administrator cannot read one - they are left out of
 * `REQUEST_READER_ROLES` deliberately - so the document number and title on this
 * card are an identity, not a destination, and a control leading somewhere that
 * can only answer FORBIDDEN would be worse than the four fields it sits beside.
 * The same reason there is no attachment, no signature and no comment thread on
 * this screen: see the note at the top of `admin-csm.router.ts`.
 *
 * ## The comment gets the room, because it is the only thing here that is prose
 *
 * Everything else on this card is a value that belongs in a row of fields. The
 * comment is somebody's sentences, so it is the one thing given its own block
 * and its own line breaks - `whitespace-pre-line`, because the paragraphs they
 * typed are the record.
 */
export function AdminCsmRecord({ onBack, record }: AdminCsmRecordProps) {
	const status = statusChip(record.submittedAt);

	return (
		<AppCard
			data-cy="admin-csm-record"
			description={
				record.submittedAt
					? `Answered on ${formatAbsolute(toDate(record.submittedAt))}.`
					: `Sent on ${formatAbsolute(toDate(record.createdAt))}. The requestor has not answered it yet.`
			}
			headingLevel={2}
			title={record.documentNumber ?? "No document number"}
		>
			<div className="flex flex-col gap-6">
				{/* The state, inside the card rather than beside the title: `AppCard`
				    has no header action slot - its `actions` prop is a dropdown - and
				    the chip belongs to the record rather than to the chrome. The same
				    placement `CsmCompletedState` gives its own. */}
				<AppChip
					data-cy="admin-csm-record-status"
					icon={status.icon}
					label={status.label}
					tone={status.tone}
				/>

				{/* Two columns on anything but a phone: four short values read as a
				    block of facts, and one per row would push the comment - the thing
				    worth reading - below the fold on a laptop. */}
				<div className="grid gap-4 sm:grid-cols-2">
					<AppReadOnlyField
						label="Request"
						value={record.requestTitle}
					/>

					<AppReadOnlyField
						label="Requestor"
						value={record.requestorName}
					/>

					<AppReadOnlyField
						label="Email"
						value={record.requestorEmail}
					/>

					<AppReadOnlyField
						description="When the request was approved and the form was sent."
						label="Form created"
						value={formatAbsolute(toDate(record.createdAt))}
					/>
				</div>

				{/*
				 * Three states, and the difference between the last two matters.
				 *
				 * An unanswered form has no rating because nobody has been asked yet;
				 * an answered one with no rating was filled in under the old
				 * acknowledgement contract, before the rating existed. Both would draw
				 * as zero stars, which is the one thing a summary must never do with
				 * "unrated" - zero is the worst possible score, not a missing answer.
				 */}
				{record.rating === null ? (
					<Typography
						color="muted"
						data-cy="admin-csm-record-no-rating"
						type="body-sm"
					>
						{record.submittedAt
							? "This response was submitted before the rating was part of the form, so it carries no score."
							: "There is no rating yet. Only the requestor can answer, and nothing here can be sent to remind them."}
					</Typography>
				) : (
					<AppRatingSummary
						count={1}
						data-cy="admin-csm-record-rating"
						noun="response"
						showRing={false}
						value={record.rating}
					/>
				)}

				{record.submittedAt ? (
					<div className="flex flex-col gap-1">
						<Typography
							color="muted"
							type="body-xs"
						>
							What they said
						</Typography>

						{record.comment ? (
							<Typography
								className="whitespace-pre-line"
								data-cy="admin-csm-record-comment"
								type="body-sm"
							>
								{record.comment}
							</Typography>
						) : (
							/* Said, rather than left blank. The comment was always optional,
							   and an empty space here reads as a record that failed to load
							   rather than as an answer somebody chose not to write. */
							<Typography
								color="muted"
								data-cy="admin-csm-record-no-comment"
								type="body-sm"
							>
								No comment was left. It was always optional.
							</Typography>
						)}
					</div>
				) : null}

				<div>
					<AppButton
						data-cy="admin-csm-record-back"
						icon={Undo2}
						onPress={onBack}
						variant="tertiary"
					>
						Back to the report
					</AppButton>
				</div>
			</div>
		</AppCard>
	);
}
