// Deep imports, not `@/components/custom` - see the note in `LabNavPanel`.
import { AppButton, useAppLayout } from "@bernardsapida/web-ui";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LabNavPanel } from "@/features/labs/components/LabNavPanel";
import { cn } from "@/utils/cn";

/**
 * The labs' standing nav column, for `AppLayout`'s `sidebar` slot.
 *
 * Not `AppSidebar`: that one is the signed-in app's nav and needs a user, a
 * role and a sign-out to render its foot. These pages have no session by
 * design, and a fake identity card with a Sign out button under a developer
 * reference would be furniture pretending to be an app. What it shares with
 * `AppSidebar` is everything that is a rule rather than a component - the two
 * widths, the tooltips on the rail, the grouping surviving the loss of its
 * headings, the toggle on the title row.
 *
 * It reads the frame through `useAppLayout` and takes no state props, because
 * unlike the components in `custom/` it is never mounted as a specimen: there is
 * exactly one of these and it is always inside the frame.
 *
 * The column REPLACED a drawer that opened from a button, and the case for the
 * change is that the labs are browsed rather than visited. Getting from one lab
 * to the next was press, read, click - and the press was spent re-opening a list
 * the reader had just been reading. A standing column makes that one click, and
 * `AppLayout` still gives the drawer back below `md`, where there is no room for
 * a column. What the old drawer was protecting - the full width for wide
 * specimens - is what the collapse toggle is for, and every lab page already
 * caps its own content well inside the width that leaves.
 */
export function LabSidebar({ className }: { className?: string }) {
	const layout = useAppLayout();
	const isCollapsed = layout?.isSidebarCollapsed ?? false;

	return (
		<aside
			className={cn(
				// `glass-strong`, not the flush skin: these pages have an AppBackdrop
				// behind them, which is exactly the surface a translucent panel is for.
				"glass-strong flex flex-col rounded-3xl p-4 transition-[width] duration-200 ease-out",
				isCollapsed ? "w-18 items-center px-2" : "w-65",
				className,
			)}
			data-collapsed={isCollapsed}
			data-cy="lab-sidebar"
		>
			{/*
			 * The title row, and the only thing above the nav. Collapsed, the title
			 * gives the slot up to the toggle: the top of a nav has to be the nav, and
			 * a heading stacked above a button is a row the rail cannot afford. The
			 * index is reachable either way - it is the first row of the list below,
			 * not a mark up here.
			 */}
			<div className={cn("flex shrink-0 items-center gap-2", isCollapsed ? "justify-center pb-2" : "pb-4")}>
				{isCollapsed ? null : <h2 className="min-w-0 flex-1 truncate text-base font-semibold">Component labs</h2>}

				{/*
				 * The one control for the column's width. It carries an aria-label and
				 * aria-pressed and no tooltip: a tooltip is how a DESTINATION keeps its
				 * name on the rail, and this changes the furniture rather than going
				 * anywhere. The glyph is a panel with an arrow, which says which way the
				 * column is about to move without a word beside it.
				 */}
				{layout ? (
					<AppButton
						aria-label={isCollapsed ? "Expand lab navigation" : "Collapse lab navigation"}
						aria-pressed={isCollapsed}
						className="shrink-0 text-muted"
						data-cy="lab-sidebar-toggle"
						icon={isCollapsed ? PanelLeftOpen : PanelLeftClose}
						isIconOnly
						onPress={layout.toggleSidebar}
						size="sm"
						variant="ghost"
					/>
				) : null}
			</div>

			<LabNavPanel
				data-cy="lab-sidebar-nav"
				isCollapsed={isCollapsed}
			/>
		</aside>
	);
}
