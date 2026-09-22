import { Button, Input, Label, Modal, Spinner, TextField } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { AppButton } from "../AppButton";
import { cn } from "../../lib/cn";

type DialogSize = ComponentProps<typeof Modal.Container>["size"];

/**
 * Three, not the toast and banner's five.
 *
 * A dialog asks a question, and `success` is not a question - a green tile over
 * "Send this request?" paints the answer before it has been given. The toast and
 * the banner report on something that already happened, which is what makes the
 * full severity set right for them and wrong here. What is left is the only
 * distinction a decision actually has: routine, the brand's own action, and the
 * one there is no way back from.
 */
export type DialogTone = "accent" | "danger" | "default";

/**
 * Tone lives in a class rather than in a branch, so the component never reads
 * its own tone to pick a colour. Each one sets `--dialog-rail`, `--dialog-tint`
 * and `--dialog-emphasis`; the first two are read by the icon tile in styles.css
 * and the last by the typed confirmation phrase, which is why a danger dialog
 * asks for its phrase in red without anything here knowing that.
 */
const TONE: Record<DialogTone, string> = {
	accent: "dialog--accent",
	danger: "dialog--danger",
	default: "dialog--default",
};

interface AppDialogProps {
	/** The way out. Named for what it preserves where that reads better - "Keep my account". */
	cancelLabel?: string;
	/** Anything the user needs in front of them to decide - a summary row, a count, a date. */
	children?: ReactNode;
	"data-cy"?: string;
	/**
	 * Type-to-confirm, for the actions with no way back. The confirm button
	 * stays disabled until this is typed exactly, so autopilot cannot reach it.
	 * Use the resource's own name - the thing being destroyed, not "DELETE".
	 *
	 * The phrase is printed in the dialog's own tone as well as in bold, so on
	 * the destructive dialogs this is mostly used for it reads as red ink.
	 */
	confirmationText?: string;
	/**
	 * Names the action - "Delete account", "Cancel request". Never "Yes" or
	 * "OK": the verb is what the user reads, and it is the last warning they
	 * get.
	 */
	confirmLabel: string;
	/** What will happen, and to what. One or two sentences. */
	description: string;
	/** The glyph in the tone tile. Says the severity to anyone who cannot see it. */
	icon: LucideIcon;
	isOpen: boolean;
	/** Called on cancel, Escape, backdrop, and after `onConfirm` resolves. */
	onClose: () => void;
	/**
	 * The action. Return a promise and the confirm button shows a spinner and
	 * every exit locks until it settles. On rejection the dialog stays open with
	 * the typed text intact so the user can retry - report the failure yourself,
	 * from the mutation's `onError`; this swallows it rather than closing over a
	 * write that never happened.
	 */
	onConfirm: () => Promise<void> | void;
	/** The confirm label while the promise is in flight - "Deleting…". Defaults to `confirmLabel`. */
	pendingLabel?: string;
	size?: DialogSize;
	/** The question, as a statement - "Delete this request?". */
	title: string;
	tone?: DialogTone;
}

/**
 * The decision surface: a question that has to be answered before anything else
 * can happen - and the one or two small inputs that answering it may need.
 *
 * ## Where it sits
 *
 * | Surface | For |
 * |---|---|
 * | `AppDialog` | anything the user DOES in an overlay - the decision, plus a password, a reason, a confirmation phrase |
 * | `AppModal` | anything the user READS. No action, one Close button |
 * | `AppDrawer` | a real form, with the list it came from still behind it |
 * | a page | content with its own subject and a URL |
 *
 * "Small" is the load-bearing word, and the test is not a field count - it is
 * whether losing what was typed would matter. A password, a rejection reason, a
 * typed confirmation: all cheap to retype, so this component does not guard
 * them, and Escape simply closes. The moment the answer to "what if they lose
 * this?" stops being "nothing", the surface is an `AppDrawer`, which has the
 * discard guard, the skeleton and the room.
 *
 * It is the loudest of the three status surfaces and therefore the rarest.
 * Something transient is a toast; a condition that persists beside the work is
 * an AppAlert banner; a dialog stops the app dead, so it is only correct when
 * there is genuinely no way back - and per `destructive.md` the default for
 * anything reversible is to act now and offer Undo in the toast instead. "Are
 * you sure?" punishes everyone for one person's mistake.
 *
 * Aligned with the rest of the system rather than styled fresh: the tile carries
 * the same `--rail-*` gradient the toast and banner use, so a danger dialog and
 * a danger toast are recognisably the same danger, and severity is stated by the
 * tile's colour *and* its glyph, never by colour alone. Only the tile is
 * saturated - the panel stays plain white, because a tinted sheet at this size
 * is a mood, not a status.
 *
 * ## When the decision needs an answer first
 *
 * Mark the field `isRequired` and the confirm button is disabled until it is
 * filled, then enables itself on the keystroke that fills it. Nothing to wire:
 * the gate reads the required fields in the body, so the flag that draws the
 * asterisk is the same one that holds the button.
 *
 * It is deliberately "filled in at all" and not "valid". A dialog is not the
 * place to litigate a format - a field reports that next to itself, where the
 * fix is - and a confirm button that stays dead for a reason stated somewhere
 * else is the version of this that gets sworn at.
 *
 * `confirmationText` is the stricter sibling and still stacks: type-to-confirm
 * demands an exact phrase, this demands only that the question was answered.
 *
 * ## While it is processing
 *
 * `onConfirm` returning a promise is what puts the button into its loading
 * state, and the same promise locks every other way out: the backdrop, Escape,
 * and Cancel all stop working until it settles. That is deliberate. A confirm
 * dialog that can be dismissed mid-flight leaves the user unable to say whether
 * the thing happened, and on a destructive action that is the worst state the
 * screen can be in. It also makes double-firing impossible, since the button is
 * disabled for the whole round trip.
 *
 * ## Two things it deliberately does not do
 *
 * - **No corner X.** A decision has exactly two answers and they are both in the
 *   footer. A third exit that means the same as Cancel is one more thing to read
 *   under pressure. (`AppModal` has one for the opposite reason: nothing there
 *   can be lost by leaving.)
 * - **No reordering of the footer.** Cancel comes first in the DOM and first on
 *   screen, stacked on a phone and to the left on a desktop. Flipping the visual
 *   order with `flex-row-reverse` is where Tab starts disagreeing with the eye.
 *
 * ## Where the focus lands
 *
 * The first field in the body, whether that is the confirmation input or one the
 * caller passed as `children` - it is the only thing that can be acted on until
 * it is filled, and landing anywhere else costs a Tab before they can start.
 *
 * With nothing to type into, a danger dialog puts focus on Cancel instead, so a
 * stray Enter on a freshly opened one dismisses rather than destroys. A field
 * beats that rule rather than fighting it: Enter inside an input does not press
 * Cancel, so the protection it offers is not the one being given up.
 */
export function AppDialog({
	cancelLabel = "Cancel",
	children,
	confirmationText,
	confirmLabel,
	"data-cy": dataCy,
	description,
	icon: Icon,
	isOpen,
	onClose,
	onConfirm,
	pendingLabel,
	size = "sm",
	title,
	tone = "default",
}: AppDialogProps) {
	const [isPending, setIsPending] = useState(false);
	const [typed, setTyped] = useState("");
	/*
	 * Reported by RequiredFieldGate from the live DOM rather than held here.
	 * The fields arrive through `children`, so their values belong to the caller
	 * and this component never sees them - the same reason InitialFocus queries
	 * the body instead of taking a prop.
	 */
	const [hasUnansweredField, setHasUnansweredField] = useState(false);
	const descriptionId = useId();

	// Reopening must not inherit the last attempt's typing. The phrase IS the
	// friction, and a prefilled one is no friction at all.
	useEffect(() => {
		if (isOpen) setTyped("");
	}, [isOpen]);

	const isDestructive = tone === "danger";
	const needsTyping = confirmationText !== undefined;
	const isUnconfirmed = needsTyping && typed.trim() !== confirmationText;

	const handleConfirm = async () => {
		setIsPending(true);
		try {
			await onConfirm();
		} catch {
			// Left open on purpose - see `onConfirm` above.
			setIsPending(false);
			return;
		}
		setIsPending(false);
		onClose();
	};

	return (
		<Modal.Backdrop
			/* HeroUI's default `opaque` backdrop - a dim, no blur. A confirmation
			   is answered by reading the page behind it, and any blur takes the
			   sentence you are confirming away at the moment it is needed. */
			isDismissable={!isPending}
			isKeyboardDismissDisabled={isPending}
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<Modal.Container size={size}>
				<Modal.Dialog
					aria-describedby={descriptionId}
					className={cn("dialog", TONE[tone])}
					data-cy={dataCy}
					/*
					 * `alertdialog` interrupts a screen reader instead of waiting for
					 * a pause, which is the whole point of the destructive ones. Using
					 * it for a routine confirmation would be crying wolf.
					 */
					role={isDestructive ? "alertdialog" : "dialog"}
				>
					<InitialFocus fallbackToCancel={isDestructive} />

					<Modal.Header>
						<Modal.Icon className="dialog__icon">
							<Icon
								aria-hidden="true"
								className="size-5"
							/>
						</Modal.Icon>
						<Modal.Heading className="text-lg font-semibold text-foreground">{title}</Modal.Heading>
					</Modal.Header>

					<Modal.Body className="space-y-4">
						<RequiredFieldGate onUnansweredChange={setHasUnansweredField} />

						<p
							className="leading-relaxed text-muted"
							id={descriptionId}
						>
							{description}
						</p>

						{children}

						{needsTyping && (
							<TextField
								className="w-full"
								isDisabled={isPending}
								onChange={setTyped}
								value={typed}
							>
								<Label>
									Type <span className="dialog__confirm-phrase font-semibold">{confirmationText}</span> to confirm
								</Label>
								{/* Focus is not set here - `InitialFocus` takes the first field
								    in the body, which is this one unless the caller passed an
								    earlier one through `children`. */}
								<Input
									autoComplete="off"
									placeholder={confirmationText}
								/>
							</TextField>
						)}
					</Modal.Body>

					<Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
						{/* First in the footer, and the fallback focus target below finds
						    it by that position. Cancel leads deliberately: the confirm is
						    often destructive and must never be what focus lands on. */}
						<AppButton
							className="w-full sm:w-auto"
							isDisabled={isPending}
							onPress={onClose}
							variant="tertiary"
						>
							{cancelLabel}
						</AppButton>
						{/* Raw Button, deliberately - Cancel beside it is an AppButton.
						    This one takes a render-prop child so the pending spinner can
						    read `isPending` back off React Aria's own render state rather
						    than from a second copy of it. AppButton's children are a plain
						    ReactNode, and duplicating the flag to avoid that would put the
						    spinner and the disabled state on separate sources of truth. */}
						<Button
							className="w-full sm:w-auto"
							isDisabled={isPending || isUnconfirmed || hasUnansweredField}
							isPending={isPending}
							onPress={handleConfirm}
							variant={isDestructive ? "danger" : "primary"}
						>
							{({ isPending: pending }) => (
								<>
									{pending && (
										<Spinner
											color="current"
											size="sm"
										/>
									)}
									{pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
								</>
							)}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * A field the caller marked required - `isRequired` on any HeroUI field, or the
 * bare attribute on raw markup.
 *
 * Both spellings, because React Aria emits one or the other depending on
 * `validationBehavior`: `required` under the default `native`, `aria-required`
 * under `aria`. Matching only the first would make the gate depend on a prop
 * nobody sets deliberately.
 */
const REQUIRED_SELECTOR = '[required],[aria-required="true"]';

/**
 * Whether a required control has been answered.
 *
 * Not `checkValidity()`, which would also fail a half-typed email and put the
 * confirm button on a rule the user cannot see. The question here is only
 * "has this been filled in at all" - format is the field's own job to report,
 * next to itself, where the fix is.
 */
function isAnswered(element: Element): boolean {
	if (element instanceof HTMLInputElement) {
		if (element.type === "checkbox" || element.type === "radio") return element.checked;
		return element.value.trim() !== "";
	}
	if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
		return element.value.trim() !== "";
	}

	/*
	 * A GROUP - a radiogroup, a checkbox group, or a custom widget that puts
	 * aria-required on its wrapper rather than on a control. `some`, because one
	 * checked radio answers the whole group.
	 *
	 * A wrapper with no readable control inside counts as answered. A gate that
	 * cannot see the answer must not be the thing that blocks it: locking the
	 * only button on the screen is a worse failure than letting a submit through
	 * to the validation the caller already has.
	 */
	const controls = element.querySelectorAll("input,textarea,select");
	if (controls.length === 0) return true;
	return Array.from(controls).some(isAnswered);
}

/**
 * Disables the confirm button while a required field in the body is empty, and
 * enables it the moment it is filled.
 *
 * Reads the DOM instead of taking a prop for the same reason InitialFocus does:
 * the fields arrive through `children`, so their values belong to the caller and
 * the dialog cannot see them. What it CAN see is the attribute the caller
 * already sets to mark the field required - so the gate needs no second prop
 * that could disagree with it.
 *
 * Its own component so the effect runs on the DIALOG's mount, which is the only
 * point at which the body exists to be queried.
 *
 * The listeners are on the body rather than on each field: `input` and `change`
 * both bubble, so one pair covers fields that arrive later - a branch that opens,
 * a query that resolves - without rebinding. The MutationObserver is for the
 * arrival itself, since a field appearing already-empty fires no event at all
 * and would otherwise leave the button enabled over an unanswered question.
 */
function RequiredFieldGate({ onUnansweredChange }: { onUnansweredChange: (hasUnanswered: boolean) => void }) {
	const anchorRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const body = anchorRef.current?.closest<HTMLElement>('[data-slot="modal-body"]');
		if (!body) return;

		const read = () => {
			const required = Array.from(body.querySelectorAll(REQUIRED_SELECTOR));
			onUnansweredChange(!required.every(isAnswered));
		};

		read();
		body.addEventListener("input", read);
		body.addEventListener("change", read);

		const observer = new MutationObserver(read);
		observer.observe(body, {
			attributeFilter: ["required", "aria-required"],
			attributes: true,
			childList: true,
			subtree: true,
		});

		return () => {
			body.removeEventListener("input", read);
			body.removeEventListener("change", read);
			observer.disconnect();
			/*
			 * Closing clears the flag. The dialog unmounts but AppDialog does not,
			 * so a `true` left behind here would follow the state into the next
			 * open and disable a confirm button with nothing to fill in.
			 */
			onUnansweredChange(false);
		};
	}, [onUnansweredChange]);

	return (
		<span
			hidden
			ref={anchorRef}
		/>
	);
}

/** What "first field" means. Buttons are not fields. */
const FIELD_SELECTOR = [
	'input:not([type="hidden"]):not([disabled]):not([readonly])',
	"textarea:not([disabled]):not([readonly])",
	"select:not([disabled])",
	'[contenteditable="true"]',
].join(",");

/**
 * Moves focus into the dialog on open: the first field in the body, or - when
 * there is nothing to type into and the decision is destructive - Cancel.
 *
 * Its own component so the effect runs on the DIALOG's mount; the dialog only
 * exists while open, so an effect in the parent would fire once and never again.
 * The frame delay is what makes it stick: React Aria's FocusScope is an
 * ancestor, so its autoFocus runs after this subtree's effects and would
 * otherwise take the focus straight back.
 *
 * A DOM query rather than an `autoFocus` prop because the field may arrive
 * through `children` - the component cannot know at render time whether the
 * caller passed one, and two competing `autoFocus` props resolve by DOM order,
 * which is not a rule anybody can read off the source.
 */
function InitialFocus({ fallbackToCancel }: { fallbackToCancel: boolean }) {
	const anchorRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const frame = requestAnimationFrame(() => {
			const dialog = anchorRef.current?.closest<HTMLElement>('[data-slot="modal-dialog"]');
			if (!dialog) return;

			const body = dialog.querySelector<HTMLElement>('[data-slot="modal-body"]');
			const field = body?.querySelector<HTMLElement>(FIELD_SELECTOR);
			if (field) {
				field.focus();
				return;
			}

			// The footer's first button - Cancel. Found by slot and position rather
			// than by an attribute on the button, because the buttons are this
			// component's own markup and the footer only ever holds those two.
			if (fallbackToCancel) dialog.querySelector<HTMLElement>('[data-slot="modal-footer"] button')?.focus();
		});

		return () => cancelAnimationFrame(frame);
	}, [fallbackToCancel]);

	return (
		<span
			hidden
			ref={anchorRef}
		/>
	);
}
