import { AppAvatar, AppBadge, AppButton, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Inbox, MessageSquare, ShoppingCart } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Badge lab. Developer reference under /components, which owns the backdrop and
 * the nav; every page there is noindex.
 *
 * The bar at the top is the point of the page. A badge is never designed on its
 * own - it is designed against the thing it is pinned to, and the four anchors
 * it is ever pinned to are all up there at their real sizes.
 *
 * The two things worth checking by hand:
 *
 * 1. Take the cart to zero. The badge must LEAVE, not fade - `isInvisible`
 *    unmounts it, so a screen reader stops finding an empty element pinned to
 *    the icon rather than announcing one that says nothing.
 * 2. With a screen reader on, land on the bell. It announces the button's own
 *    name AND what the count means - "Notifications, 3 unread notifications" -
 *    because `label` is required and rendered as visually-hidden text. The
 *    visible number is aria-hidden, so it is never read twice.
 */
export const Route = createFileRoute("/(references)/components/badge")({
	head: () => ({
		meta: [{ title: seo.title("Badge lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Badge" },
	component: BadgeLabPage,
});

function BadgeLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A count or a dot pinned to the corner of something else."
				title="Badge lab"
			/>
			<TopBarSection />
			<WrongToolSection />
			<ZeroSection />
			<CapSection />
			<DotSection />
			<PlacementSection />
			<ColourSection />
			<SizeSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* The assembly                                                               */
/* -------------------------------------------------------------------------- */

/** Where badges actually live. Everything below this is reference. */
function TopBarSection() {
	const [cart, setCart] = useState(2);

	return (
		<LabSection
			description="Four anchors, at the sizes they really are. Three 40px icon buttons and a 40px avatar - which is why the badge defaults to 16px rather than to HeroUI's 28px, a size that would cover most of the glyph it exists to annotate. The presence dot goes through this component too rather than through the avatar's own badge prop, so it gets the same size default and the same required label."
			title="In a top bar"
			usedIn={["App headers", "Toolbars", "Anywhere with a notification icon"]}
		>
			<div
				className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted-surface/50 p-3"
				data-cy="top-bar"
			>
				<span className="text-sm font-semibold">Acme Logistics</span>
				<div className="flex items-center gap-3">
					<AppBadge
						content={3}
						data-cy="bar-bell"
						label="unread notifications"
					>
						<AppButton
							aria-label="Notifications"
							icon={Bell}
							isIconOnly
							variant="secondary"
						/>
					</AppBadge>
					<AppBadge
						content={12}
						data-cy="bar-messages"
						label="unread messages"
					>
						<AppButton
							aria-label="Messages"
							icon={MessageSquare}
							isIconOnly
							variant="secondary"
						/>
					</AppBadge>
					<AppBadge
						content={cart}
						data-cy="bar-cart"
						isInvisible={cart === 0}
						label="items in your cart"
					>
						<AppButton
							aria-label="Cart"
							icon={ShoppingCart}
							isIconOnly
							variant="secondary"
						/>
					</AppBadge>
					<AppBadge
						color="success"
						data-cy="bar-avatar"
						label="online"
						placement="bottom-right"
					>
						<AppAvatar name="Maria Santos" />
					</AppBadge>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<AppButton
					data-cy="cart-add"
					onPress={() => setCart((n) => n + 1)}
					size="sm"
					variant="secondary"
				>
					Add to cart
				</AppButton>
				<AppButton
					data-cy="cart-empty"
					isDisabled={cart === 0}
					onPress={() => setCart(0)}
					size="sm"
					variant="secondary"
				>
					Empty it
				</AppButton>
				<span
					className="text-sm text-muted"
					data-cy="cart-state"
				>
					{cart === 0 ? "empty - badge unmounted" : `${cart} in cart`}
				</span>
			</div>
		</LabSection>
	);
}

/**
 * The section that stops this component being reached for by reflex. A lab that
 * only shows the happy use teaches the wrong lesson.
 */
function WrongToolSection() {
	const rows = [
		{ count: 4, icon: Inbox, label: "Inbox" },
		{ count: 0, icon: MessageSquare, label: "Messages" },
		{ count: 128, icon: Bell, label: "Activity" },
	];

	return (
		<LabSection
			description="A corner badge needs a corner. On a full-width row there is not one - the count belongs at the end of the row, as text, where it lines up with every other row's count and can be read without hunting. This is the shape a sidebar wants; reaching for a badge here produces a number floating over the middle of nothing."
			title="When a badge is the wrong tool"
			usedIn={["Sidebar navigation", "Settings lists", "Any full-width row"]}
		>
			<ul
				className="divide-y divide-border overflow-hidden rounded-2xl border border-border"
				data-cy="nav-list"
			>
				{rows.map((row) => (
					<li
						className="flex items-center gap-3 px-4 py-3"
						key={row.label}
					>
						<row.icon
							aria-hidden="true"
							className="size-4 shrink-0 text-muted"
						/>
						<span className="flex-1 text-sm">{row.label}</span>
						{row.count > 0 ? (
							<span className="text-sm tabular-nums text-muted">
								{row.count}
								<span className="sr-only"> unread</span>
							</span>
						) : null}
					</li>
				))}
			</ul>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */
/* Reference                                                                  */
/* -------------------------------------------------------------------------- */

/** The state that has to be absent rather than empty. */
function ZeroSection() {
	const [count, setCount] = useState(2);

	return (
		<LabSection
			description="Take this to zero. The badge unmounts rather than fading to nothing, so at zero the bell is a plain button again - an empty badge left in the DOM is an element a screen reader still finds and still announces beside its anchor. The hidden label goes with it: '0 unread' is a thing to say out loud, not a thing to leave lying in the page."
			title="Zero is not a count"
			usedIn={["Every counter that can reach zero"]}
		>
			<Row>
				<AppBadge
					content={count}
					data-cy="zero-badge"
					isInvisible={count === 0}
					label="unread notifications"
				>
					<AppButton
						aria-label="Notifications"
						icon={Bell}
						isIconOnly
						variant="secondary"
					/>
				</AppBadge>
				<AppButton
					data-cy="zero-read"
					isDisabled={count === 0}
					onPress={() => setCount((n) => Math.max(0, n - 1))}
					size="sm"
					variant="secondary"
				>
					Read one
				</AppButton>
				<AppButton
					data-cy="zero-new"
					onPress={() => setCount((n) => n + 1)}
					size="sm"
					variant="secondary"
				>
					New message
				</AppButton>
			</Row>
			<p className="text-sm text-muted">
				Count:{" "}
				<span
					className="font-medium"
					data-cy="zero-state"
				>
					{count === 0 ? "none - badge unmounted" : count}
				</span>
			</p>
		</LabSection>
	);
}

/** The overflow every platform solves the same way. */
function CapSection() {
	return (
		<LabSection
			description="Numbers over `max` render as 99+, because past two digits a badge stops being a count and starts being a width problem - it widens past its anchor and pushes the row around. The spoken form keeps the real number: 99+ is a layout compromise, and there is no reason to make a screen reader inherit it when the actual figure is right there. A node passes through untouched; it was chosen for a reason this component cannot see."
			title="The cap"
			usedIn={["Inboxes", "Anything that can run away from you"]}
		>
			<Row>
				{[
					{ content: 9, cy: "cap-9", note: "under" },
					{ content: 99, cy: "cap-99", note: "at the cap" },
					{ content: 100, cy: "cap-100", note: "over - 99+" },
					{ content: 1204, cy: "cap-1204", note: "far over - still 99+" },
				].map((entry) => (
					<div
						className="flex flex-col items-center gap-2"
						key={entry.cy}
					>
						<AppBadge
							content={entry.content}
							data-cy={entry.cy}
							label="unread messages"
						>
							<AppButton
								aria-label={`Notifications, ${entry.note}`}
								icon={Bell}
								isIconOnly
								variant="secondary"
							/>
						</AppBadge>
						<span className="text-xs text-muted">{entry.note}</span>
					</div>
				))}
				<div className="flex flex-col items-center gap-2">
					<AppBadge
						content={100}
						data-cy="cap-custom"
						label="items"
						max={999}
					>
						<AppButton
							aria-label="A higher cap"
							icon={ShoppingCart}
							isIconOnly
							variant="secondary"
						/>
					</AppBadge>
					<span className="text-xs text-muted">max=999</span>
				</div>
			</Row>
		</LabSection>
	);
}

/** No content at all - the "something changed" case. */
function DotSection() {
	return (
		<LabSection
			description="Omit `content` and the badge is a dot. Use it when the number would be a lie or noise - 'there is something new here' is often the whole message, and a dot cannot be misread as a quantity. `label` still carries it, because a dot that says nothing to a screen reader says nothing at all."
			title="Dots"
			usedIn={["'New' markers", "Presence and status", "Unsaved-changes indicators"]}
		>
			<Row>
				<AppBadge
					data-cy="dot-default"
					label="unread items"
				>
					<AppButton
						aria-label="Notifications"
						icon={Bell}
						isIconOnly
						variant="secondary"
					/>
				</AppBadge>
				<AppBadge
					color="success"
					data-cy="dot-success"
					label="cart updated"
				>
					<AppButton
						aria-label="Cart"
						icon={ShoppingCart}
						isIconOnly
						variant="secondary"
					/>
				</AppBadge>
				<AppBadge
					color="accent"
					data-cy="dot-accent"
					label="new settings available"
				>
					<span className="rounded-xl border border-border px-3 py-2 text-sm">Settings</span>
				</AppBadge>
			</Row>
		</LabSection>
	);
}

function PlacementSection() {
	const placements = ["top-right", "top-left", "bottom-right", "bottom-left"] as const;

	return (
		<LabSection
			description="Four corners. `top-right` is the default and should stay the default - it is where every platform puts a count, and a badge that moves per screen is one the eye has to hunt for. The other three exist for anchors whose own content occupies that corner."
			title="Placement"
			usedIn={["bottom-right: presence dots on avatars", "the rest: anchors with a busy corner"]}
		>
			<Row>
				{placements.map((placement) => (
					<div
						className="flex flex-col items-center gap-2"
						key={placement}
					>
						<AppBadge
							content={5}
							data-cy={`placement-${placement}`}
							label="unread notifications"
							placement={placement}
						>
							<AppButton
								aria-label={`Notifications, badge ${placement}`}
								icon={Bell}
								isIconOnly
								variant="secondary"
							/>
						</AppBadge>
						<span className="text-xs text-muted">{placement}</span>
					</div>
				))}
			</Row>
		</LabSection>
	);
}

function ColourSection() {
	// Default first, so the row reads as "this is what you get, and here is what
	// you would be choosing instead".
	const colors = ["accent", "danger", "warning", "success", "default"] as const;
	const variants = ["primary", "secondary", "soft"] as const;

	return (
		<LabSection
			description="Five colours across three variants. Check the soft row in both themes - it is the one that gets close enough to the surface to lose its edge, and a badge that cannot be seen is worse than no badge because the count still exists."
			title="Colour and variant"
			usedIn={["accent: the default - loud without claiming a fault", "danger: only when the count IS the problem"]}
		>
			<div className="flex flex-col gap-5">
				{variants.map((variant) => (
					<div
						className="flex flex-col gap-2"
						key={variant}
					>
						<span className="text-xs font-medium tracking-wide text-muted uppercase">{variant}</span>
						<Row>
							{colors.map((color) => (
								<div
									className="flex flex-col items-center gap-2"
									key={color}
								>
									<AppBadge
										color={color}
										content={9}
										data-cy={`colour-${variant}-${color}`}
										label="unread notifications"
										variant={variant}
									>
										<AppButton
											aria-label={`${color} ${variant}`}
											icon={Bell}
											isIconOnly
											variant="secondary"
										/>
									</AppBadge>
									<span className="text-xs text-muted">{color}</span>
								</div>
							))}
						</Row>
					</div>
				))}
			</div>
		</LabSection>
	);
}

function SizeSection() {
	const sizes = [
		{ note: "16px - the default", size: "sm" },
		{ note: "28px - HeroUI's default", size: "md" },
		{ note: "32px", size: "lg" },
	] as const;

	return (
		<LabSection
			description="The badge sizes independently of what it is pinned to, which is a hazard as much as a feature. On the 40px icon button in the top row, md covers 70% of the anchor and lg covers 80% - they swallow the glyph the badge exists to annotate, which is why AppBadge overrides HeroUI's md default down to sm."
			title="Size"
			usedIn={["sm: icon buttons", "md and lg: avatars, tiles, thumbnails"]}
		>
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<span className="text-xs font-medium tracking-wide text-muted uppercase">On a 40px icon button</span>
					<Row>
						{sizes.map((entry) => (
							<div
								className="flex flex-col items-center gap-2"
								key={entry.size}
							>
								<AppBadge
									content={7}
									data-cy={`size-button-${entry.size}`}
									label="unread notifications"
									size={entry.size}
								>
									<AppButton
										aria-label={`Notifications, ${entry.size} badge`}
										icon={Bell}
										isIconOnly
										variant="secondary"
									/>
								</AppBadge>
								<span className="text-xs text-muted">
									{entry.size} · {entry.note}
								</span>
							</div>
						))}
					</Row>
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-xs font-medium tracking-wide text-muted uppercase">On a 96px tile</span>
					<Row>
						{sizes.map((entry) => (
							<div
								className="flex flex-col items-center gap-2"
								key={entry.size}
							>
								<AppBadge
									content={7}
									data-cy={`size-tile-${entry.size}`}
									label="unread notifications"
									size={entry.size}
								>
									<div className="flex size-24 items-center justify-center rounded-2xl bg-muted-surface">
										<Bell
											aria-hidden="true"
											className="size-8 text-muted"
										/>
									</div>
								</AppBadge>
								<span className="text-xs text-muted">{entry.size}</span>
							</div>
						))}
					</Row>
				</div>
			</div>
			<p className="text-sm text-muted">
				The bottom row is what `md` and `lg` are for. A badge is sized against its ANCHOR, not against the page - the
				same 28px that drowns a button is barely visible on a thumbnail.
			</p>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function Row({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap items-center gap-6">{children}</div>;
}

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
	/** Where this shape is used on a real screen. A specimen with no stated
	 *  purpose is a screenshot. */
	usedIn?: string[];
}

function LabSection({ children, description, title, usedIn }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
					{usedIn ? (
						<ul className="mt-2 flex flex-wrap gap-1.5">
							{usedIn.map((use) => (
								<li
									className="rounded-full bg-muted-surface px-2.5 py-0.5 text-xs text-muted"
									key={use}
								>
									{use}
								</li>
							))}
						</ul>
					) : null}
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
