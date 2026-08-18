import { AppCard, AppList, formatAbsolute, type ListItem, toDate } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { CheckCircle2, ClipboardCheck, Gavel, type LucideIcon, MinusCircle, Wallet } from "lucide-react";
import { StampedSignature } from "@/features/request-detail/components/StampedSignature";

interface SignatureSummaryProps {
	request: {
		budgetOfficerSignatureUrl: string | null;
		budgetOfficerSignedAt: Date | string | null;
		directorSignatureUrl: string | null;
		directorSignedAt: Date | string | null;
		idoFinalSignatureUrl: string | null;
		idoFinalSignedAt: Date | string | null;
	};
}

/**
 * The three signatures this approval countersigns.
 *
 * ## Why it is the centre of the page
 *
 * Every other stage decides something about the request. This one decides about
 * the DOCUMENT: signing here releases all four signatures onto the printed form,
 * so what the director is being asked is "do I put my name under these three?".
 * A summary that only listed who had approved would answer a different question
 * - the images are the thing being countersigned, and they belong on the screen
 * where the decision is taken rather than one tab away in the PDF.
 *
 * ## Why the rows and the images are separate
 *
 * `AppList` truncates both its lines and has no slot for an image, so the rows
 * carry the fact - who, what, when - and the signatures sit below them at a size
 * they can be read at. The same split `ApprovalTrail` makes, for the same
 * reason.
 *
 * ## Why every row is always rendered
 *
 * Including the ones that were never signed. A missing line is not something
 * people notice, and "the budget officer never signed this" is exactly the fact
 * a director countersigning three signatures needs to see before they add the
 * fourth. An absent row would read as a page that had not finished loading.
 *
 * ## Why it reads the REQUEST and never a profile
 *
 * Each of the three URLs was copied onto the row at its own approval time. A
 * signer who replaces the image on their profile next March must not change what
 * was countersigned here - so this component takes the request's stored columns,
 * and there is nothing in it that could reach a `User` row.
 */
export function SignatureSummary({ request }: SignatureSummaryProps) {
	const {
		budgetOfficerSignatureUrl,
		budgetOfficerSignedAt,
		directorSignatureUrl,
		directorSignedAt,
		idoFinalSignatureUrl,
		idoFinalSignedAt,
	} = request;

	const items: ListItem[] = [
		signatureRow({
			icon: Wallet,
			key: "budget",
			primary: "Budget officer",
			signedAt: budgetOfficerSignedAt,
			signedSecondary: "Confirmed the PPMP allocation",
			// The one row whose absence is normal rather than a gap, so the unsigned
			// copy states the FACT and claims nothing about why. `recommend` routes
			// straight to the director when no ACTIVE budget officer exists, and once
			// the director has approved there is no column left that can say which of
			// the two happened.
			unsignedSecondary: "No budget approval on this request",
		}),
		signatureRow({
			icon: Gavel,
			key: "director",
			primary: "Campus Director",
			signedAt: directorSignedAt,
			signedSecondary: "Your first approval",
			unsignedSecondary: "Not signed at the first approval",
		}),
		signatureRow({
			icon: ClipboardCheck,
			key: "chairperson",
			primary: "IDO Chairperson",
			signedAt: idoFinalSignedAt,
			signedSecondary: "Signed off at the final review",
			unsignedSecondary: "Not yet signed",
		}),
	];

	const stamped = [
		{ dataCy: "signature-summary-budget", label: "The budget officer's signature", url: budgetOfficerSignatureUrl },
		{
			dataCy: "signature-summary-director",
			label: "Your signature, from the first approval",
			url: directorSignatureUrl,
		},
		{ dataCy: "signature-summary-chairperson", label: "The IDO Chairperson's signature", url: idoFinalSignatureUrl },
	].filter((entry): entry is { dataCy: string; label: string; url: string } => Boolean(entry.url));

	return (
		<AppCard
			data-cy="signature-summary"
			description="The signatures already on this request. Signing below puts your name under all of them and releases the form."
			headingLevel={2}
			title="What you are countersigning"
		>
			<div className="flex flex-col gap-6">
				<AppList
					data-cy="signature-summary-list"
					items={items}
					label="Signatures collected so far"
				/>

				{/* Up to three, so `sm:grid-cols-2 lg:grid-cols-3` rather than the
				    two-column grid the approval trail uses: three signatures stacked in
				    one column would push the decision panel beside them off the fold on
				    the one page where the images ARE the decision. */}
				{stamped.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{stamped.map((entry) => (
							<StampedSignature
								data-cy={entry.dataCy}
								key={entry.dataCy}
								label={entry.label}
								url={entry.url}
							/>
						))}
					</div>
				) : (
					// Not an empty state so much as an alarm. A request reaches this stage
					// only after the chairperson has signed it, so no signatures at all
					// means something upstream went wrong, and a blank space would hide it.
					<Typography
						color="muted"
						data-cy="signature-summary-empty"
						type="body-sm"
					>
						No signatures are stored on this request. That should not be possible at this stage — check with the IDO
						before you sign.
					</Typography>
				)}
			</div>
		</AppCard>
	);
}

interface SignatureRowInput {
	icon: LucideIcon;
	key: string;
	primary: string;
	signedAt: Date | string | null;
	signedSecondary: string;
	unsignedSecondary: string;
}

/**
 * One desk's row, in the two states it has here.
 *
 * Signed is a date and a green chip; unsigned is a neutral one that says so in
 * the caller's own words, because "not signed" means something different for
 * each desk - a budget stage that may never have existed, a first approval that
 * must have happened, and a chairperson's signature without which this page
 * would not be reachable.
 */
function signatureRow({
	icon,
	key,
	primary,
	signedAt,
	signedSecondary,
	unsignedSecondary,
}: SignatureRowInput): ListItem {
	const signedOn = signedAt ? formatAbsolute(toDate(signedAt)) : null;

	if (signedOn) {
		return {
			key,
			chip: { icon: CheckCircle2, label: "Signed", tone: "success" },
			leading: { icon, kind: "icon" },
			meta: signedOn,
			primary,
			secondary: signedSecondary,
		};
	}

	return {
		key,
		chip: { icon: MinusCircle, label: "Not signed", tone: "default" },
		leading: { icon, kind: "icon" },
		primary,
		secondary: unsignedSecondary,
	};
}
