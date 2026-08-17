import type { DrawerSize } from "@bernardsapida/web-ui";
import { AppButton, AppDrawer, AppGlassCard, AppPageHeader, AppToast } from "@bernardsapida/web-ui";
import { Input, Label, TextField } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Drawer lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * The one to poke at is the first: type into a field, then try every way out of
 * the drawer there is - Escape, the backdrop, the X, Cancel, and a swipe toward
 * the panel's own edge. All five have to arrive at the same question, because a
 * dirty drawer that can be dismissed by picking the right gesture is a drawer
 * with no protection at all.
 *
 * Narrow the window past 640px and every one of them becomes a bottom sheet
 * with a grabber. That is not a style change - the drag direction, the height
 * and the radius all follow the edge it belongs to.
 */
export const Route = createFileRoute("/(references)/components/drawer")({
	head: () => ({
		meta: [{ title: seo.title("Drawer lab") }, { content: "noindex", name: "robots" }],
	}),
	component: DrawerLabPage,
	validateSearch: (search: Record<string, unknown>): { record?: string } => ({
		record: typeof search.record === "string" ? search.record : undefined,
	}),
});

function DrawerLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A task done beside the list rather than on top of it - and the question a dirty one has to ask."
				title="Drawer lab"
			/>
			<DirtySection />
			<SizesSection />
			<ReadOnlySection />
			<LoadingSection />
			<AddressableSection />
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

/* -------------------------------------------------------------------------- */

const WAREHOUSE = {
	contact: "Amara Reyes",
	email: "orders@bgc-fulfilment.example",
	name: "BGC Fulfilment Centre",
};

/**
 * The edit drawer, which is the shape this component was built for: a record
 * open beside the list that produced it, with unsaved work in it.
 */
function DirtySection() {
	const [isOpen, setIsOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [draft, setDraft] = useState(WAREHOUSE);

	const isDirty =
		draft.contact !== WAREHOUSE.contact || draft.email !== WAREHOUSE.email || draft.name !== WAREHOUSE.name;

	const close = () => {
		setIsOpen(false);
		setDraft(WAREHOUSE);
	};

	return (
		<LabSection
			description="Type into a field, then try Escape, the backdrop, the X, Cancel and a swipe. All five ask the same question; none of them discards silently."
			title="Edit, with unsaved work in it"
		>
			<div className="flex flex-wrap items-center gap-3">
				<AppButton
					data-cy="open-dirty"
					onPress={() => setIsOpen(true)}
					variant="secondary"
				>
					Edit warehouse
				</AppButton>
				<p className="text-sm text-muted">
					Currently <span className="font-semibold">{isDirty ? "dirty" : "clean"}</span>
				</p>
			</div>

			<AppDrawer
				data-cy="drawer-dirty"
				description="Warehouse · Quezon City"
				isDirty={isDirty}
				isOpen={isOpen}
				onClose={close}
				primaryAction={{
					isPending: isSaving,
					label: "Save changes",
					onPress: () => {
						setIsSaving(true);
						window.setTimeout(() => {
							setIsSaving(false);
							close();
							AppToast.success("Warehouse updated", {
								description: "BGC Fulfilment Centre now shows the details you saved.",
								icon: Building2,
							});
						}, 900);
					},
				}}
				title={WAREHOUSE.name}
			>
				<div className="flex flex-col gap-4">
					<TextField
						className="w-full"
						onChange={(name) => setDraft((current) => ({ ...current, name }))}
						value={draft.name}
					>
						<Label>Warehouse name</Label>
						<Input variant="secondary" />
					</TextField>
					<TextField
						className="w-full"
						onChange={(contact) => setDraft((current) => ({ ...current, contact }))}
						value={draft.contact}
					>
						<Label>Primary contact</Label>
						<Input variant="secondary" />
					</TextField>
					<TextField
						className="w-full"
						onChange={(email) => setDraft((current) => ({ ...current, email }))}
						type="email"
						value={draft.email}
					>
						<Label>Requests inbox</Label>
						<Input variant="secondary" />
					</TextField>
					<Filler paragraphs={4} />
				</div>
			</AppDrawer>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const SIZES: { blurb: string; size: DrawerSize }[] = [
	{ blurb: "384px - a status panel, a short form", size: "sm" },
	{ blurb: "480px - the default", size: "md" },
	{ blurb: "560px - the cap, and the end of it", size: "lg" },
];

/** Three widths and no fourth. Past the cap it is a page that forgot its URL. */
function SizesSection() {
	const [open, setOpen] = useState<DrawerSize | null>(null);

	return (
		<LabSection
			description="Content-driven inside a hard cap. There is no full-bleed option, because a drawer covering the whole desktop has spent the context that was the reason to open it."
			title="Sizes"
		>
			<div className="flex flex-wrap gap-2">
				{SIZES.map(({ size }) => (
					<AppButton
						key={size}
						onPress={() => setOpen(size)}
						variant="secondary"
					>
						{size}
					</AppButton>
				))}
			</div>
			<ul className="space-y-1 text-sm text-muted">
				{SIZES.map(({ blurb, size }) => (
					<li key={size}>
						<span className="font-mono text-xs font-semibold">{size}</span> — {blurb}
					</li>
				))}
			</ul>

			<AppDrawer
				data-cy="drawer-sizes"
				description={SIZES.find((entry) => entry.size === open)?.blurb}
				isOpen={open !== null}
				onClose={() => setOpen(null)}
				primaryAction={{ label: "Done", onPress: () => setOpen(null) }}
				size={open ?? "md"}
				title={`Size: ${open ?? "md"}`}
			>
				<Filler paragraphs={3} />
			</AppDrawer>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** No footer at all - a read-only panel's only way out is the X, and that is enough. */
function ReadOnlySection() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<LabSection
			description="Long enough to scroll. Only the body moves: the title stays legible at the top and there is no footer to be scrolled to, because there is nothing to press."
			title="Read only, and scrolling"
		>
			<AppButton
				data-cy="open-readonly"
				onPress={() => setIsOpen(true)}
				variant="secondary"
			>
				View request ORD-25841
			</AppButton>

			<AppDrawer
				data-cy="drawer-readonly"
				description="Order · Express · 2 items · Posted 3h ago"
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				title="ORD-25841"
			>
				<Filler paragraphs={14} />
			</AppDrawer>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/**
 * The panel arrives on the press and fills a moment later. Waiting for the data
 * before opening anything is what makes a click feel unregistered.
 */
function LoadingSection() {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!isLoading) return;
		const id = window.setTimeout(() => setIsLoading(false), 1400);
		return () => window.clearTimeout(id);
	}, [isLoading]);

	return (
		<LabSection
			description="A skeleton in the drawer's own layout, at the heights the real fields will take - not a spinner in an empty panel, which makes the whole thing jump when the data lands."
			title="Loading"
		>
			<AppButton
				onPress={() => {
					setIsLoading(true);
					setIsOpen(true);
				}}
				variant="secondary"
			>
				Open, then load
			</AppButton>

			<AppDrawer
				description={isLoading ? "Loading…" : "Customer · Express · Last ordered 14 Mar"}
				isLoading={isLoading}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				primaryAction={{
					isDisabled: isLoading,
					label: "Contact customer",
					onPress: () => setIsOpen(false),
				}}
				title="Marisol Ferrer"
			>
				<Filler paragraphs={4} />
			</AppDrawer>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const RECORDS = ["ORD-25841", "ORD-25902", "ORD-26014"];

/**
 * A drawer holding a record is a thing that can be linked to. It writes to the
 * URL, so a refresh comes back to the same panel and Back closes it rather than
 * leaving the page and taking the list's scroll and filters with it.
 *
 * Opening PUSHES and closing REPLACES: that is what makes Back a close rather
 * than a second thing to press before the page actually changes.
 */
function AddressableSection() {
	const { record } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	return (
		<LabSection
			description="Open one and watch the address bar. Refresh - it comes back. Press Back - it closes, and the page underneath keeps everything it had."
			title="Addressable"
		>
			<div className="flex flex-wrap gap-2">
				{RECORDS.map((id) => (
					<AppButton
						key={id}
						onPress={() => navigate({ search: { record: id } })}
						variant="secondary"
					>
						{id}
					</AppButton>
				))}
			</div>
			<p className="text-sm text-muted">
				Search param: <span className="font-mono text-xs">{record ? `?record=${record}` : "(none)"}</span>
			</p>

			<AppDrawer
				description="Request · Addressable, so this panel survives a refresh"
				isOpen={record !== undefined}
				onClose={() => navigate({ replace: true, search: {} })}
				primaryAction={{
					label: "Accept request",
					onPress: () => navigate({ replace: true, search: {} }),
				}}
				title={record ?? ""}
			>
				<Filler paragraphs={5} />
			</AppDrawer>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** Body copy, purely so there is something for the body to scroll. */
function Filler({ paragraphs }: { paragraphs: number }) {
	return (
		<div className="space-y-3 text-sm text-muted">
			{Array.from({ length: paragraphs }, (_, index) => (
				<p key={index}>
					The list that opened this panel is still there, to the left, with its scroll position and its filters intact.
					That is the whole reason this is a drawer and not a page: closing it puts the user back exactly where they
					were, rather than somewhere that merely looks similar.
				</p>
			))}
		</div>
	);
}
