import { AppButton, AppGlassCard, AppModal, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Image as ImageIcon, ScrollText } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Modal lab. Developer reference under /components, which owns the backdrop and
 * the nav; every page there is noindex.
 *
 * This page is short on purpose. `AppModal` is the VIEWER - it shows something
 * and it closes - so there is no form here, no primary action and no discard
 * guard to demonstrate. Those moved out with the split:
 *
 *   AppDialog   what the user DOES - a decision, plus the small input it needs
 *   AppModal    what the user READS - one Close button
 *   AppDrawer   a real form, with the list it came from still behind it
 *   a page      content with its own subject and a URL
 *
 * Two things here are worth doing rather than reading about:
 *
 * 1. Open the long one and scroll. The header and footer stay put; only the body
 *    moves. On a full-bleed viewer, a close button you have to scroll to is a
 *    trap.
 * 2. Narrow the window past 640px and open either. They go full-screen, or to a
 *    bottom sheet where the content is short. A centred card with 16px of
 *    backdrop either side is a page wearing a wasted frame.
 *
 * Only one modal can be open at a time on this page, by construction - the state
 * below is one slot, not three booleans. That is the same rule the component
 * warns about in dev.
 */
export const Route = createFileRoute("/(references)/components/modal")({
	head: () => ({
		meta: [{ title: seo.title("Modal lab") }, { content: "noindex", name: "robots" }],
	}),
	component: ModalLabPage,
});

type LabModal = "long" | "preview" | "sheet";

function ModalLabPage() {
	const [open, setOpen] = useState<LabModal | null>(null);
	const close = () => setOpen(null);

	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The viewer: something to look at, full size, without losing the page behind it."
				title="Modal lab"
			/>

			<LabSection
				description="Icon, title, an optional line of description, the thing itself, and one button that says Close. There is no primaryAction prop and there will not be one - an overlay with a body to read AND a verb to press is two jobs, and the second one always wins the layout. Focus lands on the heading, because there is never a field in here to take it."
				title="The default"
			>
				<AppButton
					data-cy="open-preview"
					onPress={() => setOpen("preview")}
					variant="secondary"
				>
					Open the preview
				</AppButton>
				<PreviewModal
					isOpen={open === "preview"}
					onClose={close}
				/>
			</LabSection>

			<LabSection
				description="Sized to its content with a cap, and past that cap it scrolls INTERNALLY. Scroll the body and watch the header and footer stay where they are - on something this tall, a Close button that scrolls away is the only way out disappearing."
				title="Long content"
			>
				<AppButton
					data-cy="open-long"
					onPress={() => setOpen("long")}
					variant="secondary"
				>
					Open the long one
				</AppButton>
				<LongModal
					isOpen={open === "long"}
					onClose={close}
				/>
			</LabSection>

			<LabSection
				description='Full-screen is the default on a phone. A viewer short enough to read at a glance gets mobile="sheet" instead: flush to the bottom edge, capped at 85% of the viewport. There is no third option. Narrow the window past 640px to see either.'
				title="On a phone"
			>
				<AppButton
					data-cy="open-sheet"
					onPress={() => setOpen("sheet")}
					variant="secondary"
				>
					Open the bottom sheet
				</AppButton>
				<SheetModal
					isOpen={open === "sheet"}
					onClose={close}
				/>
			</LabSection>

			<ElsewhereSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
}

function LabSection({ children, description, title }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

interface LabModalProps {
	isOpen: boolean;
	onClose: () => void;
}

/* -------------------------------------------------------------------------- */

/** The canonical shape: something to look at, and a way out. */
function PreviewModal({ isOpen, onClose }: LabModalProps) {
	return (
		<AppModal
			data-cy="modal-preview"
			icon={ImageIcon}
			isOpen={isOpen}
			onClose={onClose}
			size="lg"
			title="proof-of-delivery-front.jpg"
		>
			<div className="flex flex-col items-center gap-3">
				<div className="grid h-56 w-full place-items-center rounded-2xl border border-border bg-surface text-sm text-muted">
					A preview would render here
				</div>
				<p className="text-xs text-muted">248 KB · JPEG image</p>
			</div>
		</AppModal>
	);
}

/* -------------------------------------------------------------------------- */

const CLAUSES = Array.from({ length: 14 }, (_, index) => index + 1);

/**
 * Long enough to need the internal scroll, so the pinned frame is visible.
 *
 * Note what this one does NOT have: an "Accept the terms" button. Reading a
 * document and agreeing to it are two different acts, and the agreement is a
 * decision - `AppDialog`, raised by whatever needed the agreement. A viewer that
 * grows one verb grows a second one a month later.
 */
function LongModal({ isOpen, onClose }: LabModalProps) {
	return (
		<AppModal
			data-cy="modal-long"
			description="Scroll this. The header and the footer do not move."
			icon={ScrollText}
			isOpen={isOpen}
			onClose={onClose}
			title="Carrier agreement"
		>
			<div className="space-y-3">
				{CLAUSES.map((clause) => (
					<p key={clause}>
						<span className="font-medium text-foreground">Clause {clause}.</span> A submitted request is matched to a
						handler by category and by distance, and each party sees only what it needs to complete it. Nothing here is
						a real term of service; this paragraph exists to make the body taller than the dialog can be.
					</p>
				))}
			</div>
		</AppModal>
	);
}

/* -------------------------------------------------------------------------- */

/** Short content, so on a phone it is a sheet rather than a full screen. */
function SheetModal({ isOpen, onClose }: LabModalProps) {
	return (
		<AppModal
			data-cy="modal-sheet"
			description="Read-only. Editing this is the drawer's job, from the row it came from."
			icon={Building2}
			isOpen={isOpen}
			mobile="sheet"
			onClose={onClose}
			size="sm"
			title="Makati Central Hub"
		>
			<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
				<dt className="text-muted">DOH licence</dt>
				<dd className="font-medium text-foreground">DOH-MKT-2019-0142</dd>
				<dt className="text-muted">Contact</dt>
				<dd className="font-medium text-foreground">+63 2 8723 0101</dd>
				<dt className="text-muted">City</dt>
				<dd className="font-medium text-foreground">Makati, Metro Manila</dd>
			</dl>
		</AppModal>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * The section arguing for using something else - which, for most of what used to
 * be on this page, is the answer.
 */
function ElsewhereSection() {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">What is not a modal</h2>
					<p className="mt-1 text-sm text-muted">
						This page used to hold a form, a dirty guard and a destructive confirmation. None of them were viewers, and
						each is better served by the surface that was built for it.
					</p>
				</div>
				<ul className="space-y-2 text-sm">
					<li>
						<Link
							className="font-medium text-foreground underline underline-offset-4"
							to="/components/dialog"
						>
							AppDialog
						</Link>
						<span className="text-muted">
							{" "}
							- a decision, and the one or two small inputs answering it needs: a password, a reason, a typed
							confirmation.
						</span>
					</li>
					<li>
						<Link
							className="font-medium text-foreground underline underline-offset-4"
							to="/components/drawer"
						>
							AppDrawer
						</Link>
						<span className="text-muted">
							{" "}
							- a real form, with the list it came from still behind it. It has the discard guard, because losing what
							was typed there would actually cost something.
						</span>
					</li>
					<li>
						<span className="font-medium text-foreground">A page</span>
						<span className="text-muted">
							{" "}
							- content with its own subject that someone could link to. A modal in that position is hiding a missing
							route.
						</span>
					</li>
				</ul>
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
