import { Input, Label, TextField } from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface AppTextInputProps {
	className?: string;
	"data-cy"?: string;
	/** Shown under the field. For guidance, not for errors. */
	footnote?: ReactNode;
	isRequired?: boolean;
	label: ReactNode;
	onChange: (next: string) => void;
	placeholder?: string;
	value: string;
}

/**
 * A labelled text input that owns nothing.
 *
 * The plain sibling of {@link AppHexField}. Both predate `AppInputGroup`'s
 * standalone mode, which now also takes `value`/`onChange` for a value that has
 * another owner - so for a NEW field, reach for that one. What keeps these two
 * is the theme customizer's compact scale: an `xs` label that accepts a node
 * and a 10px footnote, neither of which belongs on the app's standard field.
 *
 * Deliberately no error state, and that is the other half of it. Every caller so
 * far is a field somebody is part way through typing, where "invalid" and
 * "unfinished" are the same thing and flagging one flags the other. A field that
 * does need to report a rule wants `AppInputGroup` with `errorMessage`.
 */
export function AppTextInput({
	className,
	"data-cy": dataCy,
	footnote,
	isRequired,
	label,
	onChange,
	placeholder,
	value,
}: AppTextInputProps) {
	return (
		<TextField
			className={cn("space-y-1.5", className)}
			/* Passed DOWN, not just drawn. This used to render the asterisk and
			   stop there, so the field was required to a sighted reader and to a
			   screen reader and not to anything that had to act on it - including
			   AppDialog, which gates its confirm button on the required fields it
			   can find in the body. */
			isRequired={isRequired}
			onChange={onChange}
			value={value}
		>
			<Label className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
				{label}
				{isRequired ? (
					<>
						{/* The asterisk is decoration; the word is what is announced. An
						    aria-label on a bare span names nothing - the element has no
						    role to carry it. */}
						<span
							aria-hidden="true"
							className="text-danger"
						>
							*
						</span>
						<span className="sr-only">(required)</span>
					</>
				) : null}
			</Label>

			<Input
				className="text-sm"
				data-cy={dataCy}
				placeholder={placeholder}
				spellCheck={false}
			/>

			{footnote ? <p className="text-[10px] text-muted">{footnote}</p> : null}
		</TextField>
	);
}
