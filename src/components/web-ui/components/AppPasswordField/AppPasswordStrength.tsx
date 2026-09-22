import { Check } from "lucide-react";
import { cn } from "../../lib/cn";
import { type PasswordScore, PASSWORD_HINTS, scorePassword } from "./password-strength";

export interface AppPasswordStrengthProps {
	/** The current password. The only input - everything shown is derived. */
	value: string;
	/**
	 * Id for the field to point `aria-describedby` at, so a screen reader reads
	 * the guidance as part of the field rather than as loose text after it.
	 */
	id?: string;
	className?: string;
}

/** Text colour of the verdict word, per band. Neutral until there is one. */
const TONE: Record<PasswordScore, string> = {
	0: "text-danger",
	1: "text-danger",
	2: "text-warning",
	3: "text-success",
	4: "text-success",
};

/** Fill of a lit meter segment, per band. */
const BAR_TONE: Record<PasswordScore, string> = {
	0: "bg-danger",
	1: "bg-danger",
	2: "bg-warning",
	3: "bg-success",
	4: "bg-success",
};

/**
 * The meter and the "better to have" checklist that sit under a password field
 * when `AppPasswordField` is given `strength`.
 *
 * Rendered inline, never in a tooltip: the point of the checklist is to be
 * readable *while* typing, and it has to be reachable by a screen reader through
 * the field's `aria-describedby`. A popover that only opens on focus fails both,
 * and on a phone it lands on top of the field it describes.
 *
 * It coaches rather than gates. An empty field shows the list greyed, not a red
 * "weak" - a meter that only ever punishes is one users learn to ignore. The
 * spoken announcement is the band name alone ("Password strength: fair"), which
 * changes across five values, not on every keystroke.
 *
 * The verdict word leads, then the gauge, then the checklist - you read what the
 * password IS before you read the bar, and the ticked-off items drop back so the
 * eye lands on what is still missing. A met item gets a filled checkbox in the
 * brand colour, held apart from the danger-to-success of the meter so "done" and
 * "strong" never blur into one green.
 */
export function AppPasswordStrength({ value, id, className }: AppPasswordStrengthProps) {
	const hasValue = value.length > 0;
	const { score, label } = scorePassword(value);
	const segments = [0, 1, 2, 3] as const;
	const litUpTo = hasValue ? Math.max(score, 1) : 0;

	return (
		<div
			className={cn("flex flex-col gap-2.5", className)}
			id={id}
		>
			<div className="flex flex-col gap-1.5">
				<p className={cn("text-xs font-semibold", hasValue ? TONE[score] : "text-muted")}>
					{hasValue ? label : "Password strength"}
				</p>
				<div
					aria-hidden="true"
					className="flex gap-1.5"
				>
					{segments.map((segment) => (
						<span
							className={cn(
								"h-1.5 flex-1 rounded-full transition-colors",
								segment < litUpTo ? BAR_TONE[score] : "bg-border",
							)}
							key={segment}
						/>
					))}
				</div>
			</div>

			<div className="text-xs text-muted">
				<p className="mb-1.5">It&rsquo;s better to have:</p>
				<ul className="flex flex-col gap-1.5">
					{PASSWORD_HINTS.map((hint) => {
						const met = hint.met(value);
						return (
							<li
								className="flex items-center gap-2"
								key={hint.id}
							>
								<span
									aria-hidden="true"
									className={cn(
										"grid size-4 shrink-0 place-items-center rounded-[0.25rem] border transition-colors",
										met ? "border-brand-fill bg-brand-fill text-brand-fill-foreground" : "border-border",
									)}
								>
									{met ? <Check className="size-3" strokeWidth={3} /> : null}
								</span>
								<span className={cn("transition-colors", met ? "text-muted-foreground/50 line-through" : "text-foreground/75")}>
									{hint.label}
								</span>
							</li>
						);
					})}
				</ul>
			</div>

			{/* Polite, and deliberately just the band name: the visual list above
			    updates every keystroke, but a screen reader only needs to hear when
			    the password crosses from weak to fair to strong. */}
			<span
				aria-live="polite"
				className="sr-only"
			>
				{hasValue ? `Password strength: ${label}` : ""}
			</span>
		</div>
	);
}
