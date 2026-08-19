import { Typography } from "@heroui/react";
import { cn } from "@/utils/cn";

interface RequestDocumentFieldProps {
	className?: string;
	/** Kept as a pass-through so a moved field keeps the hook it had in its old home. */
	"data-cy"?: string;
	label: string;
	value: string;
}

/** What a field with nothing in it prints, here and on the form itself. */
const EMPTY = "—";

/**
 * One labelled fact in a request that can no longer be typed in.
 *
 * **Not `AppReadOnlyField`, and the reason is Details and Work Scope.** That
 * component is a disabled `TextField`, which is a SINGLE-LINE input: the two
 * paragraphs a requestor writes - the ones every desk after them reads to make
 * its decision - arrived cut off at the width of a half-column box, with the
 * rest reachable only by clicking into a field that says it is disabled. A
 * document is not a form somebody is locked out of, so it renders as text:
 * `whitespace-pre-wrap` keeps the requestor's own line breaks, and nothing here
 * has a border, because eight grey boxes are eight things the eye has to open
 * before it can read one.
 *
 * The short fields use it too. Mixing text and input-shaped values in one card
 * would say the two kinds differ in some way the reader is meant to act on.
 */
export function RequestDocumentField({ className, "data-cy": dataCy, label, value }: RequestDocumentFieldProps) {
	const isEmpty = !value.trim() || value === EMPTY;

	return (
		<div
			className={cn("flex min-w-0 flex-col gap-1", className)}
			data-cy={dataCy}
		>
			<Typography
				color="muted"
				type="body-sm"
			>
				{label}
			</Typography>

			<Typography
				className={cn("whitespace-pre-wrap break-words", isEmpty && "italic")}
				color={isEmpty ? "muted" : undefined}
				type="body"
			>
				{isEmpty ? EMPTY : value}
			</Typography>
		</div>
	);
}
