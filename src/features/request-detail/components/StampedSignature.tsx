import { Typography } from "@heroui/react";

interface StampedSignatureProps {
	"data-cy"?: string;
	/** Whose signature it is, in the caller's own words - "The signature stamped
	 *  on this request", "The Campus Director's signature". It is both the label
	 *  and the image's alt text, so the two can never disagree. */
	label: string;
	/** The URL copied onto the REQUEST at approval time. Never the signer's
	 *  current profile image - see the note below. */
	url: string;
}

/**
 * A signature as it was stamped, on a plate it can actually be read on.
 *
 * ## Why the plate is white in both themes
 *
 * A signature is black ink on paper. Rendered on the app's dark surface it is
 * black on near-black and disappears completely - not dimmed, invisible - so the
 * plate is `bg-white` regardless of theme. This is the one place in the app that
 * hard-codes a colour rather than taking a token, and it is because the content
 * is an image the theme cannot recolour.
 *
 * ## Why every caller passes a URL from the REQUEST
 *
 * The four approval stages each copy the signer's `signatureUrl` onto the row at
 * approval time. Drawing the signer's CURRENT profile image here instead would
 * quietly claim that whatever is on their profile today is what the approval
 * carries, which is the one thing the copy-on-approve rule exists to prevent.
 * This component cannot enforce that - it only takes a string - so it is worth
 * saying at every call site.
 *
 * Shared by the budget, director and IDO-final review pages, which is why it
 * lives beside `RequestActivityFeed` rather than inside any one of them.
 */
export function StampedSignature({ "data-cy": dataCy, label, url }: StampedSignatureProps) {
	return (
		<div
			className="flex flex-col gap-2"
			data-cy={dataCy}
		>
			<Typography
				color="muted"
				type="body-xs"
			>
				{label}
			</Typography>

			<div className="flex min-h-24 items-center justify-center rounded-xl border border-default-200 bg-white p-4">
				<img
					alt={label}
					className="max-h-20 object-contain"
					src={url}
				/>
			</div>
		</div>
	);
}
