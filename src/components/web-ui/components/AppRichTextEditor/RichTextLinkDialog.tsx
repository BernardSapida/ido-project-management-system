import { InputGroup, Label, TextField } from "@heroui/react";
import { Link2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppButton } from "../AppButton";
import { AppDialog } from "../AppDialog";
import { ALLOWED_LINK_PROTOCOLS } from "./rich-text-document";

interface RichTextLinkDialogProps {
	/** The URL already on the selection, so editing starts from what is there. */
	initialUrl: string;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (url: string) => void;
}

/**
 * Where a link's URL is typed.
 *
 * `AppDialog` and not `AppDrawer`: one small input, and losing what was typed
 * costs a retype. That is exactly the line the two components are split on.
 *
 * The field is `isRequired`, which is the entire wiring for the confirm button -
 * `AppDialog` disables it until every required field in its body is answered, so
 * there is no local `isDisabled` here to drift out of step with the input.
 *
 * It does NOT remove links. That lives on the hover panel, beside the link it
 * acts on - a "Remove link" button sitting next to a text input is one word away
 * from the field that clears the same input, and under pressure the two are a
 * coin toss.
 */
export function RichTextLinkDialog({ initialUrl, isOpen, onClose, onConfirm }: RichTextLinkDialogProps) {
	const [url, setUrl] = useState(initialUrl);
	const [error, setError] = useState<string | null>(null);

	// Reopening starts from the selection's current href rather than from
	// whatever the last edit happened to leave behind.
	useEffect(() => {
		if (isOpen) {
			setUrl(initialUrl);
			setError(null);
		}
	}, [initialUrl, isOpen]);

	const handleConfirm = () => {
		const normalised = normaliseUrl(url.trim());
		if (!normalised) {
			/*
			 * Said out loud rather than dropped. A rejected URL that simply closes
			 * the dialog reads as the link having been added, and the author finds
			 * out when a reader tells them.
			 */
			setError(`Use a ${ALLOWED_LINK_PROTOCOLS.join(", ")} address.`);
			throw new Error("Invalid URL");
		}
		onConfirm(normalised);
	};

	return (
		<AppDialog
			cancelLabel="Cancel"
			confirmLabel={initialUrl ? "Update link" : "Add link"}
			data-cy="rich-text-link-dialog"
			description="Where should this text point? The address is checked before it is stored."
			icon={Link2}
			isOpen={isOpen}
			onClose={onClose}
			onConfirm={handleConfirm}
			title={initialUrl ? "Edit this link" : "Add a link"}
			tone="accent"
		>
			<TextField
				className="w-full"
				isInvalid={error !== null}
				isRequired
				onChange={(next) => {
					setUrl(next);
					setError(null);
				}}
				value={url}
			>
				<Label>Address</Label>
				<InputGroup>
					<InputGroup.Input
						autoComplete="off"
						data-cy="link-url"
						placeholder="https://example.com"
						spellCheck={false}
					/>
					{/*
					 * Clearing the field is not the same act as removing the link, and
					 * the dialog used to offer both - a "Remove link" button beside an
					 * input, where the button unlinked the text and the field did not.
					 * Two controls one word apart doing different irreversible-looking
					 * things is a coin toss under pressure.
					 *
					 * So: this clears what is TYPED, and it is the ordinary suffix
					 * affordance every text field in the app uses for that. Removing the
					 * link itself lives on the hover panel, next to the link it removes.
					 */}
					{url ? (
						<InputGroup.Suffix>
							<AppButton
								aria-label="Clear the address"
								data-cy="link-url-clear"
								icon={X}
								isIconOnly
								onPress={() => {
									setUrl("");
									setError(null);
								}}
								size="sm"
								variant="ghost"
							/>
						</InputGroup.Suffix>
					) : null}
				</InputGroup>
			</TextField>

			{/* Rendered here rather than through FieldError: the message belongs to
			    the dialog's validation pass, and a FieldError outside its own field
			    context renders nothing at all - silently. */}
			{error ? (
				<p
					className="text-sm text-danger"
					data-slot="field-error"
				>
					{error}
				</p>
			) : null}
		</AppDialog>
	);
}

/**
 * "example.com" is what people type; `https://example.com` is what may be
 * stored. Anything whose protocol is not on the allowlist returns null and is
 * refused - `javascript:` most of all.
 */
function normaliseUrl(raw: string): string | null {
	if (raw === "") return null;

	const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
	try {
		const protocol = new URL(candidate).protocol.replace(":", "");
		if (!(ALLOWED_LINK_PROTOCOLS as readonly string[]).includes(protocol)) return null;
		return candidate;
	} catch {
		return null;
	}
}
