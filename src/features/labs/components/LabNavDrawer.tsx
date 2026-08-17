import { useAppLayout } from "@bernardsapida/web-ui";
import { Drawer } from "@heroui/react";
import { LabNavPanel } from "@/features/labs/components/LabNavPanel";

/**
 * The labs' nav below `md`, for `AppLayout`'s `sidebarDrawer` slot.
 *
 * The same list as the column, off-canvas, for the width where a column would
 * leave the specimen nothing. It arrives from the LEFT, where the column stands:
 * left is navigation's edge, and a nav that slides in from the opposite side to
 * the one it replaces is a different object arriving rather than the same one
 * returning.
 *
 * `AppMobileDrawer` is the component that normally does this, and it is not
 * usable here for the same reason `AppSidebar` is not - it takes a user, a role
 * and a sign-out, and these pages have no session. So this is HeroUI's `Drawer`
 * directly, which `biome.json` exempts this file for, and it is exempted rather
 * than routed to `AppDrawer` because that one is the right-hand detail panel and
 * deliberately offers no placement prop.
 *
 * No `isOpen` prop: the trigger that opens this lives in the frame's compact
 * navbar, which is a different slot, so both sides find each other through
 * `AppLayoutContext` the way `AppMobileDrawer` does inside the same frame.
 */
export function LabNavDrawer() {
	const layout = useAppLayout();

	return (
		<Drawer.Backdrop
			isOpen={layout?.isDrawerOpen ?? false}
			onOpenChange={(isOpen) => layout?.setDrawerOpen(isOpen)}
		>
			<Drawer.Content placement="left">
				{/* Opaque, not glass: it sits over live specimens, and frosted colour
				    swatches showing through a nav read as a rendering fault. */}
				<Drawer.Dialog
					className="flex h-full w-80 max-w-[85vw] flex-col bg-surface p-0"
					data-cy="lab-nav-drawer"
				>
					<Drawer.Header className="shrink-0 border-b border-border p-4">
						<Drawer.Heading className="text-base font-semibold">Component labs</Drawer.Heading>
					</Drawer.Header>

					{/*
					 * `min-h-0` and no scrolling of its own: the panel's list owns the
					 * scrollport, so the field above it stays put. A filter that scrolls
					 * away with the list it filters is a filter you have to scroll back up
					 * to correct.
					 */}
					<Drawer.Body className="mt-0 flex min-h-0 flex-1 flex-col p-3">
						<LabNavPanel
							data-cy="lab-drawer-nav"
							onNavigate={() => layout?.setDrawerOpen(false)}
						/>
					</Drawer.Body>
				</Drawer.Dialog>
			</Drawer.Content>
		</Drawer.Backdrop>
	);
}
