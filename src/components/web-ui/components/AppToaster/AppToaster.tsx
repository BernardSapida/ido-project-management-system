import { useMediaQuery } from "../../internal";
import {
	Toast,
	ToastContent,
	type ToastContentValue,
	ToastDescription,
	ToastIndicator,
	ToastTitle,
} from "@heroui/react";
import type { PointerEvent } from "react";

/**
 * The app's single toast region.
 *
 * Mount this instead of a bare `<Toast.Provider />`: it takes over the render
 * function for HeroUI's default queue, so every `AppToast.success(...)` call
 * site picks the body up without being touched.
 *
 * The layout is a coloured rail down the start edge that continues as a bar
 * under the panel, then a white panel carrying the text. Status is signalled by
 * rail colour *and* the icon inside it, never by colour alone - a tinted
 * background is invisible to a colour-blind user (see ui-ux/feedback.md). The
 * rail colour lives in styles.css as `--toast-rail`, keyed off the `.toast--*`
 * variant class, so nothing here branches on variant.
 *
 * The close button is pinned inline and always visible rather than revealed on
 * hover, because hover does not exist on touch and an error toast that cannot
 * be dismissed is a modal in disguise.
 *
 * Placement follows the viewport: bottom-right on desktop, where the corner is
 * dead space, and top on mobile, where the bottom edge is thumb territory and
 * the OS home indicator (see ui-ux/feedback.md).
 */
/**
 * Hands focus back when the pointer leaves, so the dismiss timer restarts.
 *
 * react-aria pauses every toast's timer while focus is inside the region, and it
 * checks plain focus rather than `:focus-visible` (useToastRegion's
 * `onFocusWithin`). The toast is a focusable `alertdialog`, so *clicking* one -
 * anywhere, including the text - pins it: hover ends when the mouse leaves, but
 * focus does not, and the toast then sits there frozen until something else on
 * the page is clicked. The progress bar freezes with it and looks broken.
 *
 * Keyboard focus must still pause - a user tabbing to the action or close button
 * cannot have the toast vanish mid-reach (WCAG 2.2.1). `:focus-visible` is
 * exactly that distinction, so only pointer-induced focus is released here.
 */
function releasePointerFocus(event: PointerEvent<HTMLDivElement>) {
	const focused = document.activeElement;

	if (focused instanceof HTMLElement && event.currentTarget.contains(focused) && !focused.matches(":focus-visible")) {
		focused.blur();
	}
}

export function AppToaster() {
	// Tailwind's `sm` breakpoint. Resolves to false during SSR and the first
	// paint, which is harmless: nothing is queued before the user acts.
	const isMobile = useMediaQuery("(width < 40rem)");

	return (
		<Toast.Provider
			maxVisibleToasts={3}
			placement={isMobile ? "top" : "bottom end"}
		>
			{({ toast: queued }) => {
				const { actionProps, description, indicator, isLoading, title, variant } =
					(queued.content as ToastContentValue) ?? {};

				// react-stately keeps the auto-dismiss delay on the queued toast, so
				// the bar can be driven straight off the real timer rather than a
				// second copy of the duration that would drift from it. Errors and
				// loading toasts pass 0 and get a static bar instead.
				const timeoutMs = queued.timeout ?? 0;

				return (
					<Toast
						/* The severity as DATA, not as a class. HeroUI already puts it in
						   `toast--success` and friends, but a spec asserting on that is
						   asserting on styling - the one thing allowed to change freely.
						   This is the test contract instead. */
						data-variant={variant ?? "neutral"}
						onPointerLeave={releasePointerFocus}
						toast={queued}
						variant={variant}
					>
						{/* Rail. The badge is never empty: AppToast requires an icon on
					    every toast it can produce, and anything reaching the queue
					    without one falls back to the variant glyph.

					    A loading toast spins a ring *around* that icon rather than
					    replacing it with a bare spinner, so "what is loading" survives
					    the wait - and so the title/description/icon contract has no
					    loading-shaped exception to it. */}
						<div className="flex w-16 shrink-0 items-center justify-center self-stretch">
							<span className="relative flex size-10 items-center justify-center">
								{isLoading ? (
									<span
										aria-hidden="true"
										className="absolute inset-0 animate-spin rounded-full border-2 border-white/25 border-t-white"
									/>
								) : null}
								<span
									className={`flex size-10 items-center justify-center rounded-full bg-white/20 text-white ${
										isLoading ? "" : "ring-1 ring-white/25"
									}`}
								>
									<ToastIndicator
										className="p-0 text-white [&_svg]:size-5"
										variant={variant}
									>
										{indicator}
									</ToastIndicator>
								</span>
							</span>
						</div>

						{/* Panel. The 4px bottom margin is what leaves the rail
						    showing as the bar the progress indicator drains. */}
						<div className="mb-1 flex min-w-0 flex-1 items-center gap-3 rounded-ee-[16px] bg-surface py-4 pe-3 ps-4">
							<ToastContent className="min-w-0 gap-1">
								{title ? (
									<ToastTitle className="text-base leading-5 font-bold text-foreground">{title}</ToastTitle>
								) : null}
								{description ? <ToastDescription className="leading-snug">{description}</ToastDescription> : null}
							</ToastContent>

							{/* THE TOAST'S OWN STATUS, via the semantic pair rather than the
							    rail - a warning toast whose only button is brand blue is the
							    one element in it that disagrees with the other four. The
							    `.toast .toast-action` block in styles.css explains why the
							    fill is --warning and not --toast-rail (a rail is solved for a
							    glyph at 3:1 and puts a label under the AA floor), and this is
							    the same fix .banner-action already carries. Nothing here
							    branches on variant; the class reads the token the `.toast--*`
							    class already set.

							    Caller-supplied props land last on purpose: an
							    actionProps.className is meant to win. */}
							{actionProps?.children ? (
								<Toast.ActionButton
									className="toast-action mt-0 h-9 shrink-0 rounded-full px-4 text-sm font-semibold shadow-none hover:opacity-90"
									size="sm"
									{...actionProps}
								/>
							) : null}

							<Toast.CloseButton />
						</div>

						{/* Drains the bar from the right as the timer runs, so a toast
						    that is about to disappear says so. Purely decorative -
						    the timer itself is react-aria's. */}
						{timeoutMs > 0 ? (
							<span
								aria-hidden="true"
								className="toast__progress"
								style={{ animationDuration: `${timeoutMs}ms` }}
							/>
						) : null}
					</Toast>
				);
			}}
		</Toast.Provider>
	);
}
