import { Skeleton } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, Circle, Clock, Mail } from "lucide-react";
import { AppAvatar } from "../AppAvatar";
import type { ChipTone } from "../AppChip";
import { AppChip } from "../AppChip";
import type { EmptyReason } from "../AppEmptyState";
import { AppEmptyState } from "../AppEmptyState";
import { cn } from "../../lib/cn";

export type UserPresence = "away" | "offline" | "online";

export interface UserListItem {
	/** Optional photo. Falls back to initials - never a broken image. */
	avatarSrc?: string;
	/** Always shown: it is the only thing that separates two people with the same name. */
	email: string;
	key: string;
	/** Read for anyone not online. "3h ago" renders as "Last seen 3h ago". */
	lastSeen?: string;
	name: string;
	presence: UserPresence;
	/** What they do here. "Product Designer", "Warehouse staff". */
	role: string;
}

interface UserListAction {
	label: string;
	onPress: () => void;
}

interface UserListEmpty {
	action?: UserListAction;
	/** Overrides the preset copy when this list has something better to say. */
	description?: string;
	/** Echoed back in the no-results copy. */
	query?: string;
	reason: EmptyReason;
}

interface AppUserListProps {
	className?: string;
	/**
	 * Test hook on the surface, in all three of its states - loading, empty and
	 * loaded. The empty state inside it derives `-empty`.
	 */
	"data-cy"?: string;
	/** Why the list is empty, and the way out of it. */
	empty?: UserListEmpty;
	isLoading?: boolean;
	/** Names the list for a screen reader - "Team members", not "List". */
	label: string;
	/** Given one, every row becomes a button and gains the chevron. */
	onSelectUser?: (user: UserListItem) => void;
	users: UserListItem[];
}

/**
 * A roster of people: avatar, name, role, email, presence, one action per row.
 *
 * Deliberately not AppTable. A table is for comparing values down a column; a
 * roster is for finding one person, so identity gets the room a cell would
 * never give it and there is exactly one action per row. If you find yourself
 * wanting a fourth column here, you want the table.
 *
 * The component owns its surface and its row padding rather than being dropped
 * into someone else's Card. The hover and focus highlight has to reach the
 * card's edge, and it can only do that if the padding lives on the row.
 *
 * Presence is a typed prop rather than a slot for a chip, because a roster is
 * read at a glance and a row that says "Online" in grey - or says nothing at
 * all - is worse than one that omits presence entirely.
 */
export function AppUserList({
	className,
	"data-cy": dataCy,
	empty,
	isLoading = false,
	label,
	onSelectUser,
	users,
}: AppUserListProps) {
	const surface = cn("overflow-hidden rounded-3xl border border-border bg-surface", className);

	if (isLoading) {
		return (
			<div
				className={surface}
				data-cy={dataCy}
				data-state="loading"
			>
				<UserListSkeleton label={label} />
			</div>
		);
	}

	if (users.length === 0) {
		return (
			<div
				className={surface}
				data-cy={dataCy}
				data-state="empty"
			>
				{/*
				 * The table's empty state, not a second copy of it. The reasons are
				 * about *why* a list is empty, which is the same question here.
				 */}
				<AppEmptyState
					action={empty?.action}
					data-cy={dataCy ? `${dataCy}-empty` : undefined}
					description={empty?.description}
					query={empty?.query}
					reason={empty?.reason ?? "no-data"}
				/>
			</div>
		);
	}

	return (
		<div
			className={surface}
			data-cy={dataCy}
			data-state="ready"
		>
			<ul
				aria-label={label}
				className="divide-y divide-border"
			>
				{users.map((user) => (
					<UserRow
						key={user.key}
						onSelect={onSelectUser}
						user={user}
					/>
				))}
			</ul>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface PresencePreset {
	/** `fill-current` turns Lucide's outlined circle into the solid status dot. */
	chipClassName?: string;
	dot: string;
	icon: LucideIcon;
	label: string;
	tone: ChipTone;
}

const PRESENCE: Record<UserPresence, PresencePreset> = {
	away: { dot: "bg-warning", icon: Clock, label: "Away", tone: "warning" },
	offline: {
		chipClassName: "[&_svg]:fill-current",
		dot: "bg-muted/50",
		icon: Circle,
		label: "Offline",
		tone: "default",
	},
	online: { chipClassName: "[&_svg]:fill-current", dot: "bg-success", icon: Circle, label: "Online", tone: "success" },
};

function UserRow({ onSelect, user }: { onSelect?: (user: UserListItem) => void; user: UserListItem }) {
	const content = (
		<>
			<UserAvatar user={user} />

			{/*
			 * One wrapping row rather than two layouts. On a phone the presence chip
			 * drops under the identity block; it never shrinks into an ellipsis,
			 * which is what a plain `justify-between` would do to it.
			 */}
			<div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
				<div className="min-w-0 flex-1 basis-48">
					<p className="flex flex-wrap items-baseline gap-x-1.5">
						<span className="min-w-0 truncate font-semibold">{user.name}</span>
						<span
							aria-hidden="true"
							className="text-muted"
						>
							•
						</span>
						<span className="min-w-0 truncate text-sm font-semibold text-accent">{user.role}</span>
					</p>
					<p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
						<Mail
							aria-hidden="true"
							className="size-3.5 shrink-0"
						/>
						<span className="truncate">{user.email}</span>
					</p>
				</div>

				<PresenceChip
					lastSeen={user.lastSeen}
					presence={user.presence}
				/>
			</div>

			{/* Decoration. The row is already a button; announcing "chevron" twice
			    per person is noise in a list forty people long. */}
			{onSelect ? (
				<ChevronRight
					aria-hidden="true"
					className="size-4 shrink-0 text-muted"
				/>
			) : null}
		</>
	);

	if (!onSelect) {
		return (
			<li
				className="flex items-center gap-3 px-4 py-4"
				data-presence={user.presence}
				data-pressable="false"
				data-user-key={user.key}
			>
				{content}
			</li>
		);
	}

	return (
		<li
			data-presence={user.presence}
			data-pressable="true"
			data-user-key={user.key}
		>
			{/*
			 * A real button, so Enter and Space work without being wired up, and the
			 * accessible name is the row's own content - name, role, email, presence.
			 *
			 * The focus ring is an inset outline rather than a ring with an offset:
			 * the list clips its corners, and an outward ring on the first and last
			 * row would be cut in half by that clip.
			 *
			 * The hover is a few per cent of the brand red over the surface, the same
			 * recipe AppRadioGroup uses - NOT `bg-surface-hover`. HeroUI derives that
			 * one as `color-mix(--surface 92%, --surface-foreground 8%)`, and this palette's
			 * `--surface-foreground` is a dark red rather than a neutral, so 8% of it
			 * lands as a muddy brown wash: heavy enough to read as "selected" instead
			 * of "hoverable", and dark enough to swallow the soft chip sitting in the
			 * row. Pressed is the same mix, stronger, so the press is felt on touch
			 * where there is no hover to feel.
			 */}
			<button
				className={cn(
					"flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition-colors",
					"hover:bg-[color-mix(in_oklab,var(--accent)_4%,var(--surface))]",
					"active:bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))]",
					"focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus",
				)}
				onClick={() => onSelect(user)}
				type="button"
			>
				{content}
			</button>
		</li>
	);
}

/**
 * The gradient ring from the rest of the app, plus a presence dot.
 *
 * Two nested rounded boxes rather than a `ring` utility, because the ring is a
 * gradient and `ring-*` only takes a flat colour. The inner box carries the
 * surface colour so there is a hairline gap between ring and photo.
 */
function UserAvatar({ user }: { user: UserListItem }) {
	return (
		<span
			className="relative shrink-0"
			data-user-avatar=""
		>
			{/* A plain avatar - no gradient ring. A row of them was a column of brand
			    halos down the left of the list, which is a lot of colour spent on
			    "this is a person" when the face already says so. */}
			<AppAvatar
				name={user.name}
				size="md"
				src={user.avatarSrc}
			/>
			{/* Decorative: the chip beside it says the same thing in words. */}
			<span
				aria-hidden="true"
				className={cn(
					"absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface",
					PRESENCE[user.presence].dot,
				)}
			/>
		</span>
	);
}

/**
 * Presence in words as well as colour. Anyone not online shows their last-seen
 * time if there is one, because "Offline" answers a different question than
 * "will they see this in the next ten minutes".
 */
function PresenceChip({ lastSeen, presence }: { lastSeen?: string; presence: UserPresence }) {
	const preset = PRESENCE[presence];
	const label = presence !== "online" && lastSeen ? `Last seen ${lastSeen}` : preset.label;

	return (
		<AppChip
			className={cn("shrink-0", preset.chipClassName)}
			emphasis="soft"
			icon={preset.icon}
			label={label}
			size="sm"
			tone={preset.tone}
		/>
	);
}

/** Three rows at the real row height, so nothing jumps when the data lands. */
function UserListSkeleton({ label }: { label: string }) {
	return (
		<ul
			aria-busy="true"
			aria-label={`${label}, loading`}
			className="divide-y divide-border"
		>
			{[0, 1, 2].map((row) => (
				<li
					className="flex items-center gap-3 px-4 py-4"
					key={row}
				>
					<Skeleton className="size-12 shrink-0 rounded-full" />
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-4 w-48 max-w-full rounded-md" />
						<Skeleton className="h-3 w-64 max-w-full rounded-md" />
					</div>
					<Skeleton className="h-6 w-20 shrink-0 rounded-full" />
				</li>
			))}
		</ul>
	);
}
