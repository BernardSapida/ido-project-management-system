import type { DropdownSection } from "@bernardsapida/web-ui";
import { AppCard, AppCardSkeleton, AppGlassCard, AppPageHeader, AppToast } from "@bernardsapida/web-ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Copy, HeartHandshake, MapPin, Package, Pin, ShieldCheck, Trash2, Users } from "lucide-react";
import type { ReactNode } from "react";
import { seo } from "@/config/seo.config";

/**
 * Card lab. Developer reference under /components, which owns the backdrop and
 * the nav; every page there is noindex.
 *
 * The two things worth checking here are the ones a card usually ships wrong:
 * the grid keeps one baseline whatever the descriptions do, and the link card is
 * a real link - Tab to it, middle-click it, and watch the ring land on the whole
 * card rather than on three words of its title.
 */
export const Route = createFileRoute("/(references)/components/card")({
	head: () => ({
		meta: [{ title: seo.title("Card lab") }, { content: "noindex", name: "robots" }],
	}),
	component: CardLabPage,
});

function CardLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="One subject per card: icon, title, description, then media, meta and actions in that order."
				title="Card lab"
			/>
			<AnatomySection />
			<SlotsSection />
			<TitleRoleSection />
			<TargetSection />
			<OverflowSection />
			<GridSection />
			<MediaSection />
			<LoadingSection />
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

/**
 * Which parts a caller may restyle, and which it may not.
 *
 * AppCard is the first component in the package to carry a slot map, so this
 * section is the pattern every other Anatomy table copies - see
 * markdowns/Web/Slot API Checklist.md for which components have adopted it and
 * libs/web/ui/src/lib/slots.ts for the standard itself.
 *
 * The "no slot" rows are the half that matters. A table of ten things you CAN
 * change reads as permission; the four you cannot are what stop this becoming a
 * way to defeat the rules the component exists to hold, and they are listed with
 * the reason rather than merely omitted.
 */
const SLOTS: readonly { landsOn: string; note: string; slot: string }[] = [
	{
		landsOn: "The card surface",
		note: "className targets this too, and wins - so a caller restyling only the root never has to learn the map.",
		slot: "base",
	},
	{ landsOn: "The block holding title and description", note: "", slot: "header" },
	{
		landsOn: "The gradient icon tile",
		note: "Forwards to AppGradientIconTile's own className, so no data-app-slot is stamped on it.",
		slot: "icon",
	},
	{ landsOn: "The heading, at headingLevel", note: "", slot: "title" },
	{
		landsOn: "The supporting line",
		note: "The line clamp is appended after yours - descriptionLines is the prop for that, and it wins.",
		slot: "description",
	},
	{ landsOn: "The image frame", note: "", slot: "media" },
	{ landsOn: "The dot-separated facts row", note: "", slot: "meta" },
	{
		landsOn: "A wrapper around children",
		note: "display: contents until you style it, so a card that ignores this slot lays out exactly as before the element existed.",
		slot: "content",
	},
	{ landsOn: "The action row", note: "", slot: "footer" },
	{
		landsOn: "The overflow menu",
		note: "Forwards to AppDropdown's own className, so no data-app-slot here either.",
		slot: "actions",
	},
];

const NO_SLOTS: readonly { part: string; why: string }[] = [
	{
		part: "Padding and the gap between parts",
		why: "The reason to reach for this over a div. A wrapper you hand a p-* to is one that gets a different p-* on the next screen; if the number is wrong it is wrong everywhere.",
	},
	{
		part: "The description clamp",
		why: "descriptionLines is a closed set on purpose. Ragged descriptions are what make a grid of cards look broken rather than varied.",
	},
	{
		part: "The stretched ::after and its focus ring",
		why: "A whole-card link's hit area and the ring the keyboard lands on are the accessibility contract of the `to` branch, not decoration on it.",
	},
];

function SlotsSection() {
	return (
		<LabSection
			description="Ten parts a caller can restyle, through classNames. Values are TOKENS - bg-app-brand-50, text-muted - never a raw hex, or that call site quietly opts out of the theme customizer, the eight palettes and dark mode. A caller who needs a different element ORDER is not looking for a class; that is a node slot or a different component. Every part the card renders itself also carries data-app-slot, so it can be reached from outside without a class - prefixed because HeroUI already owns plain data-slot and overwrites it."
			title="Slots - classNames"
		>
			<div className="overflow-x-auto">
				<table className="w-full min-w-xl text-left text-sm">
					<thead>
						<tr className="border-border border-b text-muted text-xs">
							<th className="py-2 pr-4 font-medium">Slot</th>
							<th className="py-2 pr-4 font-medium">Lands on</th>
							<th className="py-2 font-medium">Notes</th>
						</tr>
					</thead>
					<tbody>
						{SLOTS.map((entry) => (
							<tr
								className="border-border/60 border-b last:border-0"
								key={entry.slot}
							>
								<td className="py-2 pr-4 align-top font-mono text-xs">{entry.slot}</td>
								<td className="py-2 pr-4 align-top">{entry.landsOn}</td>
								<td className="py-2 align-top text-muted text-xs">{entry.note || "—"}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div>
				<h3 className="font-semibold text-sm">No slot, deliberately</h3>
				<p className="mt-1 text-muted text-sm">
					Each of these is a decision the component exists to hold, so a slot for it would be a way to break the rule
					rather than a way to style it.
				</p>
				<ul className="mt-2 space-y-2">
					{NO_SLOTS.map((entry) => (
						<li
							className="text-sm"
							key={entry.part}
						>
							<span className="font-medium">{entry.part}</span>
							<span className="mt-0.5 block text-muted text-xs">{entry.why}</span>
						</li>
					))}
				</ul>
			</div>

			{/* The specimen is two cards rather than one, because a slot override is
          only legible next to what it changed. The right-hand one uses the brand
          ramp for its tint, which is the case the ramp exists for: a designer
          drew this panel against a specific brand tint and no semantic token
          expresses it. */}
			<div className="grid gap-4 sm:grid-cols-2">
				<AppCard
					data-cy="slots-default"
					description="No classNames passed. This is the baseline the card ships with."
					icon={Package}
					meta={[{ icon: MapPin, label: "Pasig" }]}
					title="Default"
				>
					<p className="text-muted text-sm">Children land here, in the card's own flex column.</p>
				</AppCard>

				<AppCard
					classNames={{
						base: "border-app-brand-300 bg-app-brand-50",
						content: "rounded-xl bg-app-brand-100 p-3",
						description: "text-app-brand-700",
						meta: "text-app-brand-600",
						title: "text-app-brand-900",
					}}
					data-cy="slots-overridden"
					description="Five slots overridden - base, title, description, meta and content."
					icon={Package}
					meta={[{ icon: MapPin, label: "Pasig" }]}
					title="Overridden"
				>
					<p className="text-app-brand-700 text-sm">
						content is a real box now. Untouched it is display: contents and adds nothing.
					</p>
				</AppCard>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** Everything a card can hold, in the order it holds it. */
function AnatomySection() {
	return (
		<LabSection
			description="Icon, title, description, then meta and actions. The headings here are h3s under this section's h2 - the level is a prop, because the same card sits under an h1 on a detail page and inside an h2 section on a dashboard, and a document that skips levels cannot be navigated by heading."
			title="The card"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppCard
					data-cy="anatomy"
					description="Pickups, drop-offs and freight, seven days a week. Walk-ins accepted until an hour before closing."
					icon={Package}
					meta={[
						{ icon: MapPin, label: "Quezon City North Depot, Banlat Road" },
						{ icon: CalendarClock, label: "24/7" },
					]}
					primaryAction={{
						label: "Book a slot",
						onPress: () =>
							AppToast.success("Slot requested", {
								description: "You would hear back within a day. The lab books nothing.",
								icon: CalendarClock,
							}),
					}}
					secondaryAction={{
						label: "Directions",
						onPress: () =>
							AppToast.info("Opening directions", {
								description: "The lab does not navigate anywhere.",
								icon: MapPin,
							}),
					}}
					title="Quezon City North Depot"
				/>
				<AppCard
					data-cy="anatomy-actions"
					description="No meta, no media, one action. A card is allowed to be this small - what it is not allowed to be is two subjects."
					icon={ShieldCheck}
					primaryAction={{
						label: "Verify now",
						onPress: () =>
							AppToast.warning("Verification pending", {
								description: "Nothing was actually sent.",
								icon: ShieldCheck,
							}),
					}}
					title="Verify your account"
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** The one decision that turns a content card into a dashboard tile. */
function TitleRoleSection() {
	return (
		<LabSection
			description="Same props, one difference. On the left the title is the SUBJECT - it gets the heading treatment and the tile sits above it as the card's badge. On the right the title is a LABEL for the number under it, so it drops to small and muted and the tile shrinks in beside it. Read them side by side and it is obvious which one you are meant to look at first, which is the entire job: shipping `Monthly revenue` at 16px semibold over `$21,300` is the hierarchy inverted, and it is the most common defect in a dashboard. The tag does not change - both titles are still real headings at `headingLevel`."
			title="Title role - subject or label"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppCard
					data-cy="role-subject"
					description="The default. The card is about this thing, so the title is the loudest text in it."
					icon={Package}
					meta={[{ icon: MapPin, label: "Quezon City" }]}
					title="Warehouse North"
				/>
				<AppCard
					data-cy="role-label"
					footerLink={{ label: "View report", to: "/components/kpi" }}
					icon={HeartHandshake}
					title="Monthly revenue"
					titleRole="label"
				>
					<p className="text-3xl leading-none font-semibold tracking-tight">$21,300</p>
				</AppCard>
			</div>
			<p className="text-sm text-muted">
				The right-hand card is `AppKpi` with its insides taken out - see the{" "}
				<Link
					className="underline underline-offset-2"
					to="/components/kpi"
				>
					KPI lab
				</Link>{" "}
				for the component that fills it in. `footerLink` is the tertiary rung of the ladder: a ghost, and a real link,
				so it can be middle-clicked and opened in a tab. It pulls itself left by its own padding when it stands alone,
				so its label starts on the same edge as the title above it.
			</p>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** The rule that the type system enforces: link OR actions, never both. */
function TargetSection() {
	return (
		<LabSection
			description="The left card is a link: the anchor is on the title and a stretched ::after grows its hit area to the whole card, so it can be Tabbed to, middle-clicked and opened in a new tab - none of which a div with an onClick can do. The right card has buttons, so the card itself is inert; the moment a card holds a second interactive element it stops being the target. Passing both is a type error, not a review comment."
			title="Whole-card link, or actions - never both"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppCard
					data-cy="linked"
					description="The whole card is the target. Tab to it and the focus ring lands on the card, not on the three words of the title carrying the link."
					icon={HeartHandshake}
					meta={[{ icon: Users, label: "23 shipments this week" }]}
					title="Open orders"
					to="/components"
				/>
				<AppCard
					data-cy="actioned"
					description="Two buttons, so the card is not pressable at all. One primary at most: a card with three buttons is a form that has lost its layout."
					icon={Users}
					meta={[{ icon: Users, label: "60 members" }]}
					primaryAction={{
						label: "Invite someone",
						onPress: () =>
							AppToast.success("Invite sent", {
								description: "Not really - this is a lab.",
								icon: Users,
							}),
					}}
					secondaryAction={{
						label: "Manage",
						onPress: () =>
							AppToast.info("Manage members", {
								description: "There is nobody here to manage.",
								icon: Users,
							}),
					}}
					title="Your team"
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** The corner menu, and where it sits in each of the two title roles. */
function OverflowSection() {
	return (
		<LabSection
			description="`actions` takes AppDropdown's own sections rather than a menu shape invented here, which is what keeps the destructive item hoisted to the end behind a separator, the disabled one in the menu with its reason, and the whole thing rendered as a bottom sheet on a touch device. It is on the actions branch of the union only: a whole-card link's stretched ::after would swallow the menu's clicks, so link-plus-menu is a type error rather than a bug you find by pressing it."
			title="Overflow menu"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<AppCard
					actions={CARD_MENU}
					data-cy="menu-subject"
					description="In the subject role the menu sits opposite the tile, on the tile's own line."
					icon={Package}
					meta={[{ icon: MapPin, label: "Quezon City" }]}
					title="Warehouse North"
				/>
				<AppCard
					actions={CARD_MENU}
					data-cy="menu-label"
					icon={HeartHandshake}
					title="Monthly revenue"
					titleRole="label"
				>
					<p className="text-3xl leading-none font-semibold tracking-tight">$21,300</p>
				</AppCard>
			</div>
			<p className="text-sm text-muted">
				The trigger names its card - `More actions for Monthly revenue`. Nine tiles with an unnamed "More" button are
				nine controls with one name between them, which is a list a screen-reader user cannot navigate.
			</p>
		</LabSection>
	);
}

const CARD_MENU: DropdownSection[] = [
	{
		items: [
			{
				icon: Pin,
				key: "pin",
				label: "Pin to top",
				onAction: () =>
					AppToast.success("Pinned", {
						description: "Nothing moved - this is a lab.",
						icon: Pin,
					}),
			},
			{
				disabledReason: "Only the workspace owner can duplicate this",
				icon: Copy,
				isDisabled: true,
				key: "duplicate",
				label: "Duplicate",
				onAction: () => undefined,
			},
			{
				icon: Trash2,
				isDestructive: true,
				key: "remove",
				label: "Remove",
				onAction: () =>
					AppToast.success("Removed", {
						description: "Also nothing - the card is still there.",
						icon: Trash2,
					}),
			},
		],
		key: "card",
	},
];

/* -------------------------------------------------------------------------- */

/** The grid cards all do the same nothing, so they share one reporter. */
function openWarehouse(name: string) {
	AppToast.info(name, {
		description: "The lab opens nothing - it only reports the press.",
		icon: Package,
	});
}

/** The one that usually ships broken: a row of cards with ragged heights. */
function GridSection() {
	return (
		<LabSection
			description="Three cards whose content lengths disagree on purpose - a one-line description, a five-line one, and one with no meta row at all. The descriptions clamp at two lines and the footers are pushed down, so the row keeps a single baseline. Ragged heights are what make a grid look broken rather than varied."
			title="In a grid"
		>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<AppCard
					data-cy="grid-short"
					description="Short."
					icon={Package}
					meta={[{ icon: MapPin, label: "Makati" }]}
					primaryAction={{
						label: "Open",
						onPress: () => openWarehouse("Makati Central Hub"),
					}}
					title="Makati Central Hub"
				/>
				<AppCard
					data-cy="grid-long"
					description="A description long enough to run past the clamp, which is the point of the clamp: it keeps going about opening hours, the walk-in policy, the parking situation behind the annex, and which entrance the loading dock is actually on, none of which belongs on a card."
					icon={Package}
					meta={[
						{
							icon: MapPin,
							label: "Barangay Bagong Silangan, Quezon City, Metro Manila",
						},
						{ icon: CalendarClock, label: "Mon-Sat" },
					]}
					primaryAction={{
						label: "Open",
						onPress: () => openWarehouse("Manila Bayside Warehouse"),
					}}
					title="Manila Bayside Warehouse - Quezon City Annex"
				/>
				<AppCard
					data-cy="grid-plain"
					description="No meta row on this one, and a title short enough to fit on one line. The footer still lines up with the two beside it."
					icon={Package}
					primaryAction={{
						label: "Open",
						onPress: () => openWarehouse("BGC Fulfilment Centre"),
					}}
					title="BGC Fulfilment Centre"
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** Media at two ratios, and the two ways an image fails to arrive. */
function MediaSection() {
	return (
		<LabSection
			description="Every frame is a fixed ratio with the placeholder already painted, and the image sits on top of it. A slow image fades in over a box that was already the right size; the 404 and the missing src leave that box exactly as it was. The layout cannot move in any of the four cases, which is the whole point. The fallback glyph is the card's own icon where it has one."
			title="Media, and when it does not arrive"
		>
			{/*
			 * The two rasters here are the only ones this app ships - the wordmark
			 * logo and the 192px app icon, neither of them photography. That is
			 * fine for what this section has to prove: the frame's height comes
			 * from the ratio and not from the file, so the wide logo cropped into
			 * 16/9 and the square icon cropped into 1/1 leave the card exactly the
			 * same height.
			 */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<AppCard
					data-cy="media-ok"
					description="A real file at 16/9. object-cover crops it to the frame rather than the frame growing to the file."
					icon={Package}
					media={{ alt: "The app logo", src: "/images/logo.png" }}
					title="Image loads"
				/>
				<AppCard
					data-cy="media-square"
					description="A different file at 1/1, so the crop is doing the opposite thing. Same card height as the one beside it."
					icon={Package}
					media={{ alt: "The app icon", ratio: "1/1", src: "/logo192.png" }}
					title="A squarer frame"
				/>
				<AppCard
					data-cy="media-404"
					description="The src 404s. The placeholder it was drawn over is still there, at the same height."
					icon={Package}
					media={{
						alt: "A photo that does not exist",
						src: "/assets/does-not-exist.png",
					}}
					title="Image 404s"
				/>
				<AppCard
					data-cy="media-none"
					description="No src at all - a record that has never had a photo, drawn at the 4/3 its neighbours would have used."
					icon={Package}
					media={{ alt: "No photo on file", ratio: "4/3" }}
					title="No image"
				/>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** The skeleton, beside the thing it stands in for. */
function LoadingSection() {
	return (
		<LabSection
			description="The skeleton is the card's own layout at the card's real height - icon tile, title, two description lines, media frame, meta, footer - so the grid does not jump when the data lands. It is aria-hidden: nine of these would otherwise be nine announcements of one fact, so aria-busy goes on the grid instead."
			title="Loading"
		>
			<div
				aria-busy="true"
				className="grid gap-4 sm:grid-cols-3"
			>
				<AppCardSkeleton
					hasActions
					hasIcon
					hasMeta
				/>
				<AppCardSkeleton
					hasIcon
					mediaRatio="16/9"
				/>
				<AppCard
					data-cy="loaded"
					description="What the two beside it are about to become, for comparison."
					icon={Package}
					meta={[{ icon: MapPin, label: "Pasig" }]}
					primaryAction={{
						label: "Open",
						onPress: () => openWarehouse("The loaded card"),
					}}
					title="The loaded card"
				/>
			</div>
		</LabSection>
	);
}
