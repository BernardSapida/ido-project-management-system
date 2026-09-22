import { useMediaQuery } from "../../internal";
import { Drawer, Skeleton } from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AppButton } from "../AppButton";
import { AppDialog } from "../AppDialog";
import { cn } from "../../lib/cn";

/**
 * Content-driven, capped. A drawer covering the whole desktop is a page that
 * forgot to change the URL, and it spends the context that was the reason to
 * open a drawer rather than navigate.
 */
export type DrawerSize = "lg" | "md" | "sm";

const WIDTH: Record<DrawerSize, string> = {
	lg: "w-[35rem]",
	md: "w-[30rem]",
	sm: "w-[24rem]",
};

export interface DrawerAction {
	isDisabled?: boolean;
	isPending?: boolean;
	/** Names its verb - "Save changes", never "Submit". */
	label: string;
	onPress: () => void;
}

interface AppDrawerProps {
	"data-cy"?: string;
	/** The body. A form, a detail sheet - one subject, and the list stays behind it. */
	children: ReactNode;
	className?: string;
	/** Beside the primary, and it asks first when the drawer is dirty. */
	cancelLabel?: string;
	/** One line under the title: WHAT this record is, not what to do with it. */
	description?: string;
	/**
	 * Far LEFT of the footer, away from the two the thumb travels to. The footer
	 * is pinned, so it is the one thing a user can hit blind.
	 */
	destructiveAction?: DrawerAction;
	/**
	 * Unsaved work. Escape, the backdrop, a swipe, the close button and Cancel
	 * all stop closing and start asking.
	 */
	isDirty?: boolean;
	/** Skeleton in the drawer's own layout - the panel opens now and fills later. */
	isLoading?: boolean;
	isOpen: boolean;
	onClose: () => void;
	/** Right-most in the footer. One of these, ever. */
	primaryAction?: DrawerAction;
	size?: DrawerSize;
	title: string;
}

/**
 * A task done IN CONTEXT: the list it came from stays behind it, and the user
 * comes back to their scroll position and their filters.
 *
 * The test for whether this is the right component is what the content is. If
 * it stands on its own it is a page and it needs a URL; if it is one question
 * it is `AppDialog`; if it is a short task that may cost the page behind
 * it, it is `AppModal`. A drawer's whole value is the context it does not
 * destroy, so a drawer that covers everything has thrown its own reason away.
 *
 * It slides from the RIGHT on a desktop - where reading order ends, and where
 * the row that opened it was pointing. There is deliberately no `placement`
 * prop: LEFT is navigation's edge, and a detail panel arriving there competes
 * with the sidebar's meaning. The one drawer that opens from the left in this
 * app is `AppMobileDrawer`, which is navigation.
 *
 * Settled: on a phone it becomes a bottom SHEET with a grabber, not a 90%-wide
 * panel from the side - a side panel on a 390px screen leaves a 40px strip of
 * dead backdrop that is the only way out of it. The switch is a media query in
 * JS rather than two panels with `hidden sm:flex`, because `placement` has to
 * be one value and the drag direction follows it.
 *
 * Settled: the sheet's height is FIXED at 85% rather than driven by content.
 * A content-driven sheet grows as the skeleton is replaced by real fields,
 * which moves the pinned footer under the thumb that was already travelling
 * toward it.
 *
 * Settled: every route out of this drawer - Escape, the backdrop, a swipe, the
 * close button, Cancel - lands in `requestClose`. `isOpen` is controlled, so a
 * dirty drawer can refuse the close React Aria asked for and put the question
 * up instead; nothing else has to know which gesture it was.
 */
export function AppDrawer({
	cancelLabel = "Cancel",
	children,
	className,
	"data-cy": dataCy,
	description,
	destructiveAction,
	isDirty = false,
	isLoading = false,
	isOpen,
	onClose,
	primaryAction,
	size = "md",
	title,
}: AppDrawerProps) {
	/**
	 * Desktop is the server's bet. Either way this renders nothing until it is
	 * opened, which is a user gesture and therefore long after hydration.
	 */
	const isPhone = !useMediaQuery("(min-width: 640px)", true);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const bodyRef = useRef<HTMLDivElement>(null);
	const headingRef = useRef<HTMLHeadingElement>(null);

	/**
	 * Focus moves IN on open: the first field, or the heading when there is
	 * nothing to type into. This runs as a passive effect, after React Aria's
	 * own `FocusScope` autofocus has landed on the close button in a layout
	 * effect - which is why it wins, and why it is not fighting anything.
	 *
	 * It deliberately does not re-run when `isLoading` clears. Moving focus out
	 * from under someone a second later is worse than the heading holding it.
	 */
	useEffect(() => {
		if (!isOpen) return;
		const field = bodyRef.current?.querySelector<HTMLElement>(FIELD_SELECTOR);
		(field ?? headingRef.current)?.focus();
	}, [isOpen]);

	const requestClose = () => {
		if (!isDirty) {
			onClose();
			return;
		}
		restoreDraggedPanel(bodyRef.current);
		setIsConfirmOpen(true);
	};

	return (
		<Drawer.Backdrop
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) requestClose();
			}}
		>
			<Drawer.Content placement={isPhone ? "bottom" : "right"}>
				<Drawer.Dialog
					className={cn(
						/* The dialog owns no padding: the header and footer are pinned and
						   need their own, and the body's has to scroll with it. */
						"p-0",
						isPhone ? "h-[85%] w-full" : cn("h-full max-w-[calc(100vw-3rem)]", WIDTH[size]),
						className,
					)}
					data-cy={dataCy}
				>
					{/* The grabber - and only on the sheet, where dragging down is the
					    gesture. On the desktop panel it would be advertising an
					    affordance pointing the wrong way. */}
					{isPhone ? <Drawer.Handle className="pt-3 pb-2" /> : null}

					<Drawer.Header className="flex flex-row items-start gap-3 border-b border-border px-5 py-4">
						<div className="min-w-0 flex-1">
							{/* `tabIndex={-1}` so it can take focus when there is no field,
							    without becoming a tab stop on the way back out. */}
							<Drawer.Heading
								className="truncate text-base font-semibold outline-none"
								ref={headingRef}
								tabIndex={-1}
							>
								{title}
							</Drawer.Heading>
							{description ? <p className="mt-0.5 truncate text-sm text-muted">{description}</p> : null}
						</div>
						{/* `slot="close"` routes through the same `onOpenChange` as every
						    other way out, so the dirty question cannot be walked around by
						    picking a different gesture. */}
						<Drawer.CloseTrigger className="static shrink-0" />
					</Drawer.Header>

					<Drawer.Body
						aria-busy={isLoading}
						className="mt-0 px-5 py-4 text-foreground"
						ref={bodyRef}
					>
						{isLoading ? <DrawerSkeleton /> : children}
					</Drawer.Body>

					{primaryAction || destructiveAction ? (
						<Drawer.Footer className="mt-0 flex flex-row flex-wrap items-center gap-2 border-t border-border px-5 py-4">
							{destructiveAction ? (
								<AppButton
									className="mr-auto"
									isDisabled={destructiveAction.isDisabled || destructiveAction.isPending}
									isPending={destructiveAction.isPending}
									onPress={destructiveAction.onPress}
									variant="danger"
								>
									{destructiveAction.label}
								</AppButton>
							) : null}
							<AppButton
								className={destructiveAction ? undefined : "ml-auto"}
								onPress={requestClose}
								variant="tertiary"
							>
								{cancelLabel}
							</AppButton>
							{primaryAction ? (
								<AppButton
									isDisabled={primaryAction.isDisabled || primaryAction.isPending}
									isPending={primaryAction.isPending}
									onPress={primaryAction.onPress}
									variant="primary"
								>
									{primaryAction.label}
								</AppButton>
							) : null}
						</Drawer.Footer>
					) : null}

					{/*
					 * Rendered INSIDE the drawer's own tree on purpose. React Aria nests
					 * focus scopes by React tree position, so a confirmation mounted as a
					 * sibling of the drawer would be a second scope fighting the first
					 * for the keyboard rather than a child of it.
					 */}
					<AppDialog
						cancelLabel="Keep editing"
						confirmLabel="Discard changes"
						/* Derived from the drawer's own hook so two drawers on one page
						   keep their guards apart, and absent entirely without one. */
						data-cy={dataCy ? `${dataCy}-discard` : undefined}
						description="This panel has edits that have not been saved. Discarding them cannot be undone."
						icon={AlertTriangle}
						isOpen={isConfirmOpen}
						onClose={() => setIsConfirmOpen(false)}
						onConfirm={onClose}
						title="Discard changes?"
						tone="danger"
					/>
				</Drawer.Dialog>
			</Drawer.Content>
		</Drawer.Backdrop>
	);
}

/* -------------------------------------------------------------------------- */

/** What "first field" means. Buttons are not fields, and neither is the close X. */
const FIELD_SELECTOR = [
	'input:not([type="hidden"]):not([disabled])',
	"textarea:not([disabled])",
	"select:not([disabled])",
	'[contenteditable="true"]',
].join(", ");

/**
 * Undo a swipe that was refused.
 *
 * HeroUI's drag-to-dismiss leaves its inline transform on the panel on purpose:
 * it is meant to compound with the exit animation so the drawer carries on from
 * where the finger left it. A dirty drawer has no exit animation, because the
 * close was vetoed - so without this the panel stays parked off-screen with the
 * question sitting over an empty backdrop.
 */
function restoreDraggedPanel(withinBody: HTMLElement | null) {
	const panel = withinBody?.closest<HTMLElement>('[data-slot="drawer-dialog"]');
	if (!panel?.style.transform) return;

	panel.style.transition = "";
	panel.style.transform = "";
}

/**
 * The drawer's own layout at its real heights, not a spinner in an empty panel.
 * Opening only once the data lands makes the click that opened it feel
 * unregistered; filling a panel that is already there does not.
 */
function DrawerSkeleton() {
	return (
		<div className="space-y-5">
			{[0, 1, 2, 3].map((row) => (
				<div
					className="space-y-2"
					key={row}
				>
					<Skeleton className="h-3 w-24 rounded-md" />
					<Skeleton className="h-9 w-full rounded-xl" />
				</div>
			))}
		</div>
	);
}
