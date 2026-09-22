import { GripVertical, X } from "lucide-react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { AppButton } from "../AppButton";

interface AppTableSelectionBarProps {
	/**
	 * The action buttons for the current selection - Export, Archive, Delete,
	 * whatever the feature needs. Kept as a slot rather than a prop list because
	 * the bar has no opinion on what you do with the rows; it only owns the
	 * count and the way out.
	 */
	children: ReactNode;
	className?: string;
	/** How many rows are selected. The bar is meant to be unmounted at 0, not
	 *  rendered empty - `AppDataTable` does exactly that. */
	count: number;
	"data-cy"?: string;
	/**
	 * Lets the user drag the bar clear of whatever it is covering, by its grip
	 * handle (and nudge it with the arrow keys while the grip is focused; Escape
	 * or Home snaps it back). On by default - the bar floats over the rows and
	 * the pager, so it needs a way out from under them. The position is local to
	 * this mount, so it resets when the selection clears.
	 */
	isDraggable?: boolean;
	/**
	 * Plural noun for the rows, for the announced label ("3 orders selected").
	 * Not shown - the visible text is just the count and "selected". Defaults
	 * to "rows".
	 */
	noun?: string;
	/** Clears the selection - wired to the dismiss button. */
	onClear: () => void;
}

/** Arrow-key nudge, in px. A touch coarser than a mouse pixel so the keyboard
 *  can actually shift the bar across a table in a few presses. */
const NUDGE_STEP = 12;

/**
 * The bar shown while rows are selected: a count, the actions that apply to
 * them, and a dismiss control.
 *
 * It sits on a zero-height line, so it adds no layout height at all - nothing
 * around it moves as selection toggles. At rest that line is at the very bottom
 * of the table block, so the pill overlaps the pagination row; that is by
 * design, and the grip handle is how the user slides it off whatever it is
 * covering. It is also `sticky bottom-4`: on a table taller than the viewport it
 * pins itself into view and floats over the rows as you scroll
 * (`pointer-events-none` on the line, `auto` on the pill, so a click landing on
 * a row THROUGH the bar still reaches the row).
 *
 * Drag is clamped to the table block, the same bound `sticky` gives it, so the
 * pill cannot be parked over whatever follows the table. Keep `overflow: hidden`
 * off the ancestor chain or `sticky` sticks to the wrong box.
 *
 * Presentational only - no selection state, no opinion on the actions.
 * `AppDataTable` renders this from its `bulkActions` slot; reach for it directly
 * only when composing a bare `AppTable` as that block's last child.
 */
export function AppTableSelectionBar({
	children,
	className,
	count,
	"data-cy": dataCy,
	isDraggable = true,
	noun = "rows",
	onClear,
}: AppTableSelectionBarProps) {
	const countLabel = `${count} ${noun} selected`;
	const wrapperRef = useRef<HTMLDivElement>(null);
	const pillRef = useRef<HTMLDivElement>(null);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	// Read inside `clamp`, which runs from pointer handlers where the state
	// closure is a frame stale.
	const offsetRef = useRef(offset);
	offsetRef.current = offset;
	const dragOrigin = useRef<{ baseX: number; baseY: number; pointerX: number; pointerY: number } | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	/**
	 * Holds the pill inside the table block. Measured live because both the
	 * block's width and the pill's own width move with the viewport, so a value
	 * cached on mount would be wrong after any resize.
	 */
	function clamp(next: { x: number; y: number }) {
		const block = wrapperRef.current?.parentElement?.getBoundingClientRect();
		const pill = pillRef.current?.getBoundingClientRect();
		if (!block || !pill) return next;
		// The pill's rect already has the current offset baked in; back it out to
		// find where the pill rests unshifted, then solve for the allowed range.
		const current = offsetRef.current;
		const restLeft = pill.left - current.x;
		const restTop = pill.top - current.y;
		const restRight = pill.right - current.x;
		const restBottom = pill.bottom - current.y;
		const margin = 8;
		return {
			x: Math.min(Math.max(next.x, block.left + margin - restLeft), block.right - margin - restRight),
			y: Math.min(Math.max(next.y, block.top + margin - restTop), block.bottom - margin - restBottom),
		};
	}

	function onGripPointerDown(event: PointerEvent<HTMLButtonElement>) {
		if (!isDraggable || event.button !== 0) return;
		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		dragOrigin.current = {
			baseX: offsetRef.current.x,
			baseY: offsetRef.current.y,
			pointerX: event.clientX,
			pointerY: event.clientY,
		};
		setIsDragging(true);
	}

	function onGripPointerMove(event: PointerEvent<HTMLButtonElement>) {
		const origin = dragOrigin.current;
		if (!origin) return;
		setOffset(
			clamp({
				x: origin.baseX + (event.clientX - origin.pointerX),
				y: origin.baseY + (event.clientY - origin.pointerY),
			}),
		);
	}

	function onGripPointerEnd(event: PointerEvent<HTMLButtonElement>) {
		if (!dragOrigin.current) return;
		dragOrigin.current = null;
		event.currentTarget.releasePointerCapture?.(event.pointerId);
		setIsDragging(false);
	}

	function onGripKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		if (!isDraggable) return;
		if (event.key === "Escape" || event.key === "Home") {
			event.preventDefault();
			setOffset({ x: 0, y: 0 });
			return;
		}
		const step: Record<string, { x: number; y: number }> = {
			ArrowDown: { x: 0, y: NUDGE_STEP },
			ArrowLeft: { x: -NUDGE_STEP, y: 0 },
			ArrowRight: { x: NUDGE_STEP, y: 0 },
			ArrowUp: { x: 0, y: -NUDGE_STEP },
		};
		const delta = step[event.key];
		if (!delta) return;
		event.preventDefault();
		setOffset((prev) => clamp({ x: prev.x + delta.x, y: prev.y + delta.y }));
	}

	return (
		<div
			className={cn(
				// Zero-height line: costs no layout height, and `items-end` sits the
				// pill on it so the pill grows upward. At rest the line is at the
				// block's bottom, so the pill lands over the pagination - moved off
				// with the grip. `sticky bottom-4` pins it into view on a long table.
				"pointer-events-none sticky bottom-4 z-30 flex h-0 items-end justify-center",
				className,
			)}
			data-cy={dataCy}
			ref={wrapperRef}
		>
			<div
				aria-label={countLabel}
				className={cn(
					"pointer-events-auto flex select-none items-center gap-1 rounded-full border border-border/60",
					"bg-surface/95 py-1.5 pl-1.5 pr-1.5 shadow-lg backdrop-blur",
					isDragging && "shadow-xl",
				)}
				data-dragging={isDragging || undefined}
				ref={pillRef}
				role="group"
				style={offset.x || offset.y ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
			>
				{isDraggable ? (
					<button
						aria-label="Drag to move the selection bar. Arrow keys nudge it; Escape resets its position."
						className={cn(
							"grid size-7 shrink-0 touch-none place-items-center rounded-full text-muted",
							"hover:bg-muted-surface hover:text-foreground",
							isDragging ? "cursor-grabbing" : "cursor-grab",
						)}
						onKeyDown={onGripKeyDown}
						onPointerCancel={onGripPointerEnd}
						onPointerDown={onGripPointerDown}
						onPointerMove={onGripPointerMove}
						onPointerUp={onGripPointerEnd}
						type="button"
					>
						<GripVertical
							aria-hidden="true"
							className="size-4"
						/>
					</button>
				) : null}

				<span className="flex items-center gap-2 pl-1 pr-2">
					<span
						aria-hidden="true"
						className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
					>
						{count}
					</span>
					{/* The number alone is a rebus once the bar drifts from the table;
					    the noun keeps it legible. Hidden on the narrowest screens,
					    where the buttons need the room - the `aria-label` above still
					    carries it for assistive tech. */}
					<span className="hidden whitespace-nowrap text-sm text-muted sm:inline">selected</span>
				</span>

				<span
					aria-hidden="true"
					className="mx-0.5 h-5 w-px bg-border/70"
				/>

				<div className="flex items-center gap-1">{children}</div>

				<span
					aria-hidden="true"
					className="mx-0.5 h-5 w-px bg-border/70"
				/>

				<AppButton
					aria-label="Clear selection"
					icon={X}
					isIconOnly
					onPress={onClear}
					size="sm"
					variant="ghost"
				/>
			</div>
		</div>
	);
}
