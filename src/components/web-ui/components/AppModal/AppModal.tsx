import { Modal } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { AppButton } from "../AppButton";
import { cn } from "../../lib/cn";
import { IS_DEV_BUILD } from "../../lib/is-dev-build";

/**
 * HeroUI's own set, passed straight through: `xs` / `sm` / `md` / `lg` cap the
 * width and leave a centred card; `cover` fills the screen but keeps the card
 * (radius, shadow, a strip of backdrop); `full` fills it edge to edge with no
 * radius and no shadow. `md` is the default.
 */
export type AppModalSize = ComponentProps<typeof Modal.Container>["size"];

/** How the modal lands on a phone. */
type MobilePresentation = "fullscreen" | "sheet";

interface AppModalProps {
	/** The one button. Defaults to "Close" - and there is nothing else it can honestly say. */
	closeLabel?: string;
	"data-cy"?: string;
	children: ReactNode;
	className?: string;
	/** One line under the heading saying what this is. */
	description?: string;
	/**
	 * Drops the footer, leaving the corner X as the only button.
	 *
	 * For a viewer whose body is one edge-to-edge picture, where a footer is a
	 * strip of chrome under the thing you opened this to look at and the X is
	 * right there. Not a general "I don't like the button" switch - see the
	 * "two ways out" note above before reaching for it, because a modal with a
	 * body you have to READ still wants the footer.
	 */
	hideFooter?: boolean;
	icon?: LucideIcon;
	isOpen: boolean;
	/**
	 * Full-screen on a phone by default; `"sheet"` for anything that fits in a
	 * few lines. There is no third option, because a centred card with 16px of
	 * backdrop either side is a page wearing a wasted frame.
	 */
	mobile?: MobilePresentation;
	onClose: () => void;
	/**
	 * HeroUI's Modal size. `xs` / `sm` / `md` / `lg` for a centred card, `cover`
	 * or `full` to fill the screen - `full` drops the border radius and shadow.
	 * Defaults to `"md"`.
	 */
	size?: AppModalSize;
	title: string;
}

/**
 * The viewer: something to LOOK at, full size, without losing the page behind
 * it. A photo, a document, a record's detail. It shows, and it closes.
 *
 * ## It has no action, and that is the whole point
 *
 * There is no `primaryAction` prop and there will not be one. The split this
 * component lives under is:
 *
 * | Surface | For |
 * |---|---|
 * | `AppDialog` | anything the user DOES - a decision, and the one or two small inputs a decision needs |
 * | `AppModal` | anything the user READS - and the only button is Close |
 * | `AppDrawer` | a task with a real form, with the list it came from still behind it |
 * | a page | content with its own subject and a URL |
 *
 * The reason this one is narrow: an overlay with a body to read AND a verb to
 * press is two jobs, and the second one always wins the layout. Every long
 * modal in this app started as a preview that later grew a Save button, and the
 * previewing got worse each time. If the thing being shown needs to be acted
 * on, the action belongs to whatever opened this - a row action, a dialog, the
 * page underneath - not to the frame around the picture.
 *
 * What it still decides for you:
 *
 * - **The body scrolls and the frame does not.** A close button you have to
 *   scroll to is a trap, and this component is often full-bleed.
 * - **Full-screen on a phone**, or a bottom sheet when the content is short.
 * - **Focus moves to the heading on open**, is trapped, and returns to the
 *   opener. There are no fields in here to focus instead - that is a dialog.
 * - **Two ways out, both meaning the same thing.** The corner X and the footer
 *   Close. That is safe HERE precisely because nothing can be lost by leaving;
 *   `AppDialog` deliberately has no X for the opposite reason. `hideFooter`
 *   gives up the second one for a full-bleed viewer, where the footer is chrome
 *   under the picture and the X sits directly over it.
 *
 * NEVER open one of these from another one. Two focus traps in the DOM leave
 * the keyboard in the wrong one, and the second layer is telling you the first
 * should have been a page. In dev this warns.
 */
export function AppModal({
	children,
	className,
	closeLabel = "Close",
	"data-cy": dataCy,
	description,
	hideFooter = false,
	icon: Icon,
	isOpen,
	mobile = "fullscreen",
	onClose,
	size = "md",
	title,
}: AppModalProps) {
	const descriptionId = useId();

	useStackGuard(isOpen, title);

	return (
		<Modal.Backdrop
			/*
			 * Both left on. Nothing in a viewer can be lost by dismissing it, so
			 * every gesture that means "leave" is allowed to just work - the dirty
			 * guard that used to live here went with the forms, to AppDrawer.
			 */
			isDismissable
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			{/* max-sm:p-0 so the phone presentation below can reach the screen edge. */}
			<Modal.Container
				className="max-sm:p-0"
				scroll="inside"
				size={size}
			>
				<Modal.Dialog
					aria-describedby={description ? descriptionId : undefined}
					className={cn(
						/*
						 * max-w-none in both: `size` caps the dialog through a max-w-*
						 * class that applies at every width, so a size="sm" modal would
						 * otherwise stop 6px short of the edge of a 390px phone and look
						 * like a full screen that missed.
						 */
						"max-sm:w-full max-sm:max-w-none",
						mobile === "sheet"
							? "max-sm:mt-auto max-sm:max-h-[85dvh] max-sm:rounded-b-none"
							: "max-sm:h-full max-sm:min-h-full max-sm:rounded-none max-sm:shadow-none",
						className,
					)}
					data-cy={dataCy}
				>
					<InitialFocus />

					<AppButton
						aria-label="Close"
						className="absolute end-4 top-4"
						icon={X}
						isIconOnly
						onPress={onClose}
						size="sm"
						variant="ghost"
					/>

					{/* pe-10 keeps the heading out from under that button. */}
					<Modal.Header className="pe-10">
						{Icon && (
							<Modal.Icon className="gradient-brand rounded-2xl shadow-glow">
								<Icon
									aria-hidden="true"
									className="size-5"
								/>
							</Modal.Icon>
						)}
						<div className="space-y-1">
							{/* tabIndex so focus can land here - there is never a field to take it. */}
							<Modal.Heading
								className="text-lg font-semibold text-foreground outline-none"
								tabIndex={-1}
							>
								{title}
							</Modal.Heading>
							{description && (
								<p
									className="text-sm leading-relaxed text-muted"
									id={descriptionId}
								>
									{description}
								</p>
							)}
						</div>
					</Modal.Header>

					<Modal.Body>{children}</Modal.Body>

					{!hideFooter && (
						<Modal.Footer className="flex-col-reverse gap-2 sm:flex-row">
							<AppButton
								className="flex-1 sm:flex-none"
								onPress={onClose}
								variant="tertiary"
							>
								{closeLabel}
							</AppButton>
						</Modal.Footer>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * Moves focus to the dialog's heading on open.
 *
 * Its own component so the effect runs on the DIALOG's mount - the dialog only
 * exists while open, so an effect in the parent would fire once and never again.
 * The frame delay is what makes it stick: React Aria's FocusScope is an
 * ancestor, so its autoFocus runs after this subtree's effects and would
 * otherwise take the focus straight back onto the close button.
 *
 * It reaches the dialog through a hidden anchor rather than a ref, because
 * HeroUI's Modal.Dialog does not forward one, and `display: none` keeps the
 * anchor out of the flex column it sits in.
 */
function InitialFocus() {
	const anchorRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const frame = requestAnimationFrame(() => {
			const dialog = anchorRef.current?.closest<HTMLElement>('[data-slot="modal-dialog"]');
			dialog?.querySelector<HTMLElement>('[data-slot="modal-heading"]')?.focus();
		});

		return () => cancelAnimationFrame(frame);
	}, []);

	return (
		<span
			hidden
			ref={anchorRef}
		/>
	);
}

/* -------------------------------------------------------------------------- */

let openModalCount = 0;

/**
 * Complains in dev when a second modal opens over the first.
 *
 * Nothing in React stops it, and the symptom - Tab cycling through the modal
 * underneath, Escape closing the wrong one - reads as a keyboard bug rather than
 * as a layering mistake. Counted rather than contexted so it catches two modals
 * mounted in unrelated corners of the tree, which is how it actually happens.
 */
function useStackGuard(isOpen: boolean, title: string) {
	useEffect(() => {
		if (!isOpen) return;

		openModalCount += 1;
		if (IS_DEV_BUILD && openModalCount > 1) {
			console.error(
				`AppModal: "${title}" opened while another modal is already open. Never stack modals - if the second layer is needed, the first should have been a page.`,
			);
		}

		return () => {
			openModalCount -= 1;
		};
	}, [isOpen, title]);
}
