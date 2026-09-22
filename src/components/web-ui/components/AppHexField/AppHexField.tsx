import { Input, Label, Popover, TextField } from "@heroui/react";
import type { ReactNode } from "react";
import { hexToOklch, oklchToHex } from "../../lib/oklch";
import { cn } from "../../lib/cn";

interface AppHexFieldProps {
	className?: string;
	"data-cy"?: string;
	/** Shown under the field. For saying where a value came from, not for errors. */
	footnote?: ReactNode;
	label: ReactNode;
	onChange: (next: string) => void;
	placeholder?: string;
	isRequired?: boolean;
	/**
	 * A colour to show in the swatch when the field itself is empty.
	 *
	 * For a value that was computed rather than typed: the swatch shows what the
	 * reader is getting while the input stays empty, so a derived colour never
	 * looks like one they entered.
	 */
	fallback?: string | null;
	/**
	 * Values to offer beside the picker, each with a reason.
	 *
	 * Deliberately a plain shape rather than the caller's own type: this component
	 * knows nothing about palettes or roles, and should not start to. A swatch is
	 * a hex and a sentence saying what choosing it would buy.
	 */
	swatches?: readonly { hex: string; why?: string }[];
	value: string;
}

/**
 * A hex colour, typed rather than picked, with a swatch of whatever it currently
 * resolves to.
 *
 * Not a plain text input with a swatch bolted on: the parsing, the short-form
 * expansion and the swatch below are the component. `AppInputGroup` has a
 * standalone (non-RHF) mode that covers the value plumbing, but nothing about
 * the rest of this.
 *
 * ## The swatch is the validation
 *
 * There is no error state and no red border for a bad value. A hex field is
 * something people type into one character at a time, so `#78B` is a real colour
 * (the short form) and `#78` is simply not finished yet - flagging the second as
 * an error would mean flagging every field for as long as it took to fill in.
 * The swatch appears when the value resolves and stays dashed-empty until it
 * does, which says the same thing without ever being wrong.
 */
export function AppHexField({
	className,
	"data-cy": dataCy,
	fallback,
	footnote,
	isRequired,
	label,
	onChange,
	placeholder = "#000000",
	swatches,
	value,
}: AppHexFieldProps) {
	const parsed = hexToOklch(value);
	const swatch = parsed ? oklchToHex(parsed) : (fallback ?? null);

	return (
		<TextField
			className={cn("space-y-1.5", className)}
			onChange={onChange}
			value={value}
		>
			<Label className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
				{label}
				{isRequired ? (
					<>
						{/* The asterisk is decoration; the word is what gets announced.
						    An aria-label on a bare span is not a supported pairing - the
						    element has no role for it to name. */}
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

			{/* `min-w-0` on the row and on the input are both load-bearing. A bare
			    `<input>` has an intrinsic width of roughly 20 characters, and a flex
			    item's default `min-width: auto` refuses to shrink below it - so the
			    field kept its ~13rem whatever column it was put in, pushed past the
			    card and gave the whole page a horizontal scrollbar. */}
			<div className="flex min-w-0 items-center gap-2">
				{/* The swatch IS the trigger when there are options to offer - a
				    colour beside a field is the thing people click at anyway, and a
				    separate button would be a second control for one job. */}
				{swatches && swatches.length > 1 ? (
					<Popover>
						<Popover.Trigger
							aria-label="Choose from suggested values"
							className={cn(
								"size-8 shrink-0 cursor-pointer rounded-lg border outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
								swatch ? "border-border" : "border-border border-dashed",
							)}
							style={swatch ? { background: swatch } : undefined}
						/>
						<Popover.Content className="w-72 p-3">
							<Popover.Dialog aria-label="Suggested values">
								<p className="mb-2 text-muted text-xs">
									Your value stays until you pick one. These are what the alternatives would change - not corrections.
								</p>
								<ul className="space-y-1">
									{swatches.map((option) => (
										<li key={option.hex}>
											<button
												className={cn(
													"flex w-full items-center gap-2 rounded-lg p-1.5 text-left outline-none focus-visible:outline-2 focus-visible:outline-focus",
													option.hex === swatch ? "bg-muted-surface" : "hover:bg-muted-surface",
												)}
												onClick={() => onChange(option.hex)}
												type="button"
											>
												<span
													aria-hidden="true"
													className="size-5 shrink-0 rounded border border-border"
													style={{ background: option.hex }}
												/>
												<span className="min-w-0">
													<span className="block font-mono text-[11px]">{option.hex}</span>
													<span className="block text-[10px] text-muted">{option.why || "what you have now"}</span>
												</span>
											</button>
										</li>
									))}
								</ul>
							</Popover.Dialog>
						</Popover.Content>
					</Popover>
				) : (
					<span
						aria-hidden="true"
						className={cn(
							"size-8 shrink-0 rounded-lg border",
							swatch ? "border-border" : "border-border border-dashed",
						)}
						style={swatch ? { background: swatch } : undefined}
					/>
				)}
				<Input
					className="min-w-0 flex-1 font-mono text-sm"
					data-cy={dataCy}
					placeholder={placeholder}
					spellCheck={false}
				/>
			</div>

			{footnote ? <p className="text-[10px] text-muted">{footnote}</p> : null}
		</TextField>
	);
}
