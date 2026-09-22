import { ChevronDown } from "lucide-react";
import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { SiteHeaderLink } from "./SiteHeaderLink";
import type { SiteNavLink, SiteNavMenu } from "./site-header.types";

/**
 * How long the panel survives the pointer leaving it.
 *
 * The gap between a trigger and its panel is crossed diagonally, and a menu
 * that closes the instant the pointer is over neither is a menu you cannot
 * reach. The panel's own padding bridges the visual gap; this covers the rest.
 */
const CLOSE_DELAY_MS = 160;

interface SiteHeaderMenuProps {
	activeHref?: string;
	isActive: boolean;
	menu: SiteNavMenu;
	onNavigate?: (link: SiteNavLink, event: MouseEvent<HTMLAnchorElement>) => void;
	triggerClassName: string;
	/** Decides the panel's shape - see the note on the panel below. */
	variant: "flush" | "floating";
}

/**
 * A label on the bar that opens a panel of links.
 *
 * ## Hover is the shortcut, not the mechanism
 *
 * It opens on hover because that is what a marketing header does, and it opens
 * on click, on Enter, on Space and on ArrowDown because hover does not exist on
 * a touch screen and cannot be reached from a keyboard. A menu that only opens
 * on hover is invisible to every phone and every keyboard user, which is the
 * single most common defect in this pattern.
 *
 * ## It is a disclosure, not a `role="menu"`
 *
 * `menu` and `menuitem` describe a list of ACTIONS - a right-click menu, a row
 * of commands - and they take over the arrow keys and remove the links from a
 * screen reader's link list. This panel holds navigation, so it stays a button
 * with `aria-expanded` over a plain list of anchors, and every assistive
 * shortcut for "list the links on this page" keeps working.
 *
 * ## The trigger does not navigate
 *
 * There is no href on it, deliberately. A control that navigates on click AND
 * opens on hover does two things with one press, and on a touch screen - where
 * the first tap has to be the open - it does the wrong one. If the section has
 * a landing page, it is the first link in the panel.
 */
export function SiteHeaderMenu({
	activeHref,
	isActive,
	menu,
	onNavigate,
	triggerClassName,
	variant,
}: SiteHeaderMenuProps) {
	const panelId = useId();
	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const closeTimerRef = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

	function open() {
		window.clearTimeout(closeTimerRef.current);
		setIsOpen(true);
	}

	function closeAfterDelay() {
		window.clearTimeout(closeTimerRef.current);
		closeTimerRef.current = window.setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS);
	}

	/* Mouse only: on a touch screen the "enter" is the tap itself, so hovering there would open the panel and leave it open. */
	function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
		if (event.pointerType === "mouse") open();
	}

	function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
		if (event.pointerType === "mouse") closeAfterDelay();
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === "Escape" && isOpen) {
			event.preventDefault();
			window.clearTimeout(closeTimerRef.current);
			setIsOpen(false);
			/* Back to the trigger, or Escape strands the keyboard on a panel that is no longer there. */
			triggerRef.current?.focus();
			return;
		}

		if (event.key === "ArrowDown" && event.target === triggerRef.current) {
			event.preventDefault();
			open();
			/* After the panel has painted, or there is nothing to move to yet. */
			requestAnimationFrame(() => panelRef.current?.querySelector("a")?.focus());
		}
	}

	/*
	 * Closes when focus leaves the trigger AND the panel. Tabbing out of the last
	 * link has to close it: a panel standing open behind the focus ring is a
	 * 400px box over the page with nothing in it that the user is looking at.
	 */
	function handleBlur(event: FocusEvent<HTMLDivElement>) {
		if (!event.currentTarget.contains(event.relatedTarget)) {
			window.clearTimeout(closeTimerRef.current);
			setIsOpen(false);
		}
	}

	const isFloating = variant === "floating";

	return (
		/*
		 * NOT `relative`, deliberately, and that is what makes the panel full
		 * width. The panel is `absolute inset-x-0`, so it resolves against the
		 * nearest POSITIONED ancestor - which `AppSiteHeader` makes the bar itself.
		 * Anchor it here instead and the panel is as wide as the word "Products",
		 * which is the centred-tooltip shape this replaced.
		 *
		 * The panel stays a DOM descendant of this wrapper even though it is drawn
		 * across the bar, which is what keeps the hover and focus bookkeeping
		 * honest: `pointerleave` does not fire while the pointer is inside a
		 * descendant, and `contains(relatedTarget)` still sees focus moving into
		 * the panel.
		 */
		<div
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
			onPointerEnter={handlePointerEnter}
			onPointerLeave={handlePointerLeave}
		>
			<button
				aria-controls={panelId}
				aria-expanded={isOpen}
				aria-haspopup="true"
				className={cn(triggerClassName, "cursor-pointer gap-1")}
				data-active={isActive || undefined}
				data-site-nav-trigger={menu.label}
				onClick={() => (isOpen ? setIsOpen(false) : open())}
				ref={triggerRef}
				type="button"
			>
				{menu.label}
				<ChevronDown
					aria-hidden="true"
					className={cn("size-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
				/>
			</button>

			{isOpen ? (
				/*
				 * Spans the BAR, not the trigger. `inset-x-0` against the positioned
				 * header; `pt-2` rather than a margin so the gap between the bar and
				 * the panel is part of the hoverable box - a margin there is dead space
				 * the pointer crosses on the way down, and the panel closes underneath
				 * it.
				 */
				<div
					className="absolute inset-x-0 top-full z-50 pt-2"
					id={panelId}
					ref={panelRef}
				>
					<div
						className={cn(
							/*
							 * `text-foreground` is not decoration - it is the panel refusing to
							 * inherit. The panel is drawn ACROSS the bar but it is a DOM
							 * descendant of it (see the note on the wrapper above, which is what
							 * keeps the hover and focus bookkeeping honest), so on
							 * `tone="brand"` it inherits the bar's pale `color` - and every link
							 * label that does not set its own colour arrives as pale ink on this
							 * near-white surface. The panel is its own surface and owes its own
							 * foreground.
							 */
							"rise-in border border-border bg-surface text-foreground shadow-lg",
							/*
							 * Floating is an object on the page, so the panel is a card the
							 * width of the bar above it. Flush is an edge, so the panel is a
							 * band across the viewport with a hairline under it and no
							 * radius - the same distinction the bar itself draws.
							 */
							isFloating ? "rounded-2xl" : "border-x-0 border-t-0",
						)}
						data-site-nav-panel={menu.label}
					>
						{/*
						 * A tall panel scrolls inside itself rather than off the bottom of
						 * the window. A menu you cannot reach the end of is worse than a
						 * menu with fewer items in it.
						 */}
						<div
							className={cn(
								"max-h-[min(70vh,34rem)] overflow-y-auto p-3",
								/*
								 * Flush spans the viewport, so its CONTENT still has to line up
								 * with the bar's own column or the first link sits under the
								 * browser edge while the logo sits at 1/6 of the way in.
								 */
								!isFloating && "mx-auto max-w-6xl px-4 @2xl:px-6",
							)}
						>
							{/*
							 * `auto-fit` with a MINIMUM, not a fixed column count. A fraction
							 * grid divides whatever width there is, so `grid-cols-4` in a
							 * narrow container gave 60px columns and one letter per line. A
							 * column has a width below which it stops being readable; under
							 * that the answer is fewer columns, never thinner ones - and
							 * auto-fit drops to three, then two, then one on its own.
							 */}
							<div
								className="grid gap-x-2 gap-y-4"
								style={{ gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}
							>
								{menu.groups.map((group) => (
									<div
										className="min-w-0"
										key={group.label ?? group.links[0]?.href}
									>
										{group.label ? (
											<p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
												{group.label}
											</p>
										) : null}
										<ul className="flex flex-col">
											{group.links.map((link) => {
												const isCurrent = !link.isExternal && link.href === activeHref;

												return (
													// `label`, not `href` - same fix as the flat nav and the
													// mobile sheet: a menu's links are mostly in-page anchors
													// that share one `href`.
													<li key={link.label}>
														<SiteHeaderLink
															/*
															 * The current row is the BRAND colour and semibold, not a
															 * pale wash of it. A 10% tint behind ordinary body text is
															 * the version of this that ships everywhere and it says
															 * nothing: it is a shade a reader cannot name against the
															 * rows either side, and it carries no contrast of its own.
															 * The colour is on the anchor so the label and the icon
															 * both inherit it - the description stays muted, because it
															 * is the second line either way.
															 */
															className={cn(
																"flex items-start gap-3 rounded-xl px-3 py-2 transition",
																"hover:bg-muted-surface focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none",
																isCurrent && "bg-app-brand/10 font-semibold text-app-brand",
															)}
															isActive={isCurrent}
															link={link}
															onNavigate={(navigated, event) => {
																setIsOpen(false);
																onNavigate?.(navigated, event);
															}}
														>
															{link.icon ? (
																<link.icon
																	aria-hidden="true"
																	className={cn("mt-0.5 size-4 shrink-0", isCurrent ? "text-app-brand" : "text-muted")}
																/>
															) : null}
															<span className="min-w-0 flex-1">
																<span className={cn("block text-sm", isCurrent ? "font-semibold" : "font-medium")}>
																	{link.label}
																</span>
																{link.description ? (
																	<span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted">
																		{link.description}
																	</span>
																) : null}
															</span>
														</SiteHeaderLink>
													</li>
												);
											})}
										</ul>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
