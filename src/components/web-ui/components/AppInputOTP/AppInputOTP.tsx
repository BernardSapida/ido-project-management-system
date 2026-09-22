import { Description, InputOTP, Label } from "@heroui/react";
import { Fragment } from "react";
import type { FieldValues } from "react-hook-form";
import type { BoundField, FieldBindingProps } from "../field-binding";
import { FieldBinding } from "../field-binding";
import { cn } from "../../lib/cn";

interface AppInputOTPBaseProps {
	className?: string;
	"data-cy"?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	label: string;
	/**
	 * How many digits, and where the gap falls. 6 splits 3+3, 4 stays whole -
	 * the grouping is a readability aid for a number people are copying off a
	 * phone, not a data concern, so it is derived rather than configured.
	 */
	length?: 4 | 6;
	/**
	 * Fired the moment the last slot is filled. This is the one control where
	 * "done" is unambiguous, so a code screen should submit from here rather
	 * than making the user find a button they have already earned.
	 */
	onComplete?: (value: string) => void;
}

type AppInputOTPProps<T extends FieldValues> = AppInputOTPBaseProps & FieldBindingProps<string, T>;

/**
 * A one-time code across separate slots.
 *
 * Deliberately NOT an `AppInputGroup` with `maxLength`. The slots are what make
 * a 6-digit code readable at a glance while retyping it from a phone, and the
 * underlying input handles the three things a plain field gets wrong: paste
 * fills every slot at once, backspace walks backwards, and the mobile keyboard
 * comes up numeric with SMS autofill attached.
 */
export function AppInputOTP<T extends FieldValues>({
	className,
	"data-cy": dataCy,
	description,
	isDisabled,
	isRequired,
	label,
	length = 6,
	onComplete,
	...binding
}: AppInputOTPProps<T>) {
	return (
		<FieldBinding
			binding={binding}
			emptyValue=""
		>
			{(field) => (
				<InputOTPField
					className={className}
					data-cy={dataCy}
					description={description}
					field={field}
					isDisabled={isDisabled}
					isRequired={isRequired}
					label={label}
					length={length}
					onComplete={onComplete}
				/>
			)}
		</FieldBinding>
	);
}

function InputOTPField({
	className,
	"data-cy": dataCy,
	description,
	field,
	isDisabled,
	isRequired,
	label,
	length = 6,
	onComplete,
}: AppInputOTPBaseProps & { field: BoundField<string> }) {
	const groups =
		length === 6
			? [
					[0, 1, 2],
					[3, 4, 5],
				]
			: [[0, 1, 2, 3]];

	return (
		<div
			className={cn("flex flex-col gap-2", className)}
			data-cy={dataCy}
		>
			<Label isDisabled={isDisabled}>
				{label}
				{isRequired ? (
					<>
						<span
							aria-hidden="true"
							className="ml-0.5 text-danger"
						>
							*
						</span>
						<span className="sr-only">(required)</span>
					</>
				) : null}
			</Label>
			{description ? <Description>{description}</Description> : null}
			<InputOTP
				isDisabled={isDisabled}
				maxLength={length}
				onChange={(next) => {
					field.onChange(next);
					if (next.length === length) {
						// Filling the last slot IS finishing, so it also marks the field
						// touched - otherwise `mode: "onBlur"` never checks a code the
						// user completed and then submitted without leaving.
						field.onBlur();
						onComplete?.(next);
					}
				}}
				value={field.value}
			>
				{groups.map((group, groupIndex) => (
					<Fragment key={group[0]}>
						{groupIndex > 0 ? <InputOTP.Separator /> : null}
						<InputOTP.Group>
							{group.map((index) => (
								<InputOTP.Slot
									index={index}
									key={index}
								/>
							))}
						</InputOTP.Group>
					</Fragment>
				))}
			</InputOTP>
			{/* Same reason as AppSwitch: HeroUI's FieldError needs a Field context,
			    and InputOTP is not one - outside it the component renders nothing at
			    all, which would leave a wrong code with no message. */}
			{field.errorMessage ? (
				<p
					className="text-sm text-danger"
					data-slot="field-error"
				>
					{field.errorMessage}
				</p>
			) : null}
		</div>
	);
}
