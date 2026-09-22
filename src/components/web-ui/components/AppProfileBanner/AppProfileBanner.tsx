import { BadgeCheck, ShieldAlert } from "lucide-react";
import { AppAvatar } from "../AppAvatar";
import { AppButton } from "../AppButton";
import { AppChip } from "../AppChip";
import { cn } from "../../lib/cn";

interface ProfileBannerAction {
	label: string;
	onPress: () => void;
}

interface AppProfileBannerProps {
	/** The one thing that fixes an unverified profile. Ignored once verified. */
	action?: ProfileBannerAction;
	/** Optional photo. Falls back to initials - never a broken image. */
	avatarSrc?: string;
	className?: string;
	/** Test hook on the strip. Its action derives `-action`. */
	"data-cy"?: string;
	/**
	 * The claim itself. A boolean rather than a slot, so no caller can hand this
	 * component a green tick for a profile nobody has checked.
	 */
	isVerified: boolean;
	name: string;
	/** Role and organisation. "Logistics Coordinator · Northwind Freight". */
	subtitle: string;
	/** What is outstanding. Only read when `isVerified` is false. */
	unverifiedNote?: string;
}

/**
 * The identity strip that introduces a person: avatar, name, verification, and
 * what they do and where.
 *
 * Verification is the whole point of the component, which is why it has exactly
 * two states and both of them say something. The common failure is to render
 * the green tick when verified and *nothing* when not - a reader then cannot
 * tell an unverified profile from an old build of the badge, and the safe
 * assumption is the wrong one. Unverified therefore carries its own chip and the
 * action that clears it. Both states sit on the same plain surface: a coloured
 * wash behind a profile you are only reading looks like a fault you caused.
 *
 * It is not a status Banner (see AppAlert): that one reports on the system and
 * can be dismissed. This reports on a person, is part of the page's content,
 * and never goes away.
 */
export function AppProfileBanner({
	action,
	avatarSrc,
	className,
	"data-cy": dataCy,
	isVerified,
	name,
	subtitle,
	unverifiedNote,
}: AppProfileBannerProps) {
	return (
		<div
			className={cn(
				// One surface for both states. The difference is carried by the chip
				// (words + glyph) and `data-verified`, never by a wash behind the
				// text - an amber tint on a profile you are only reading reads as an
				// error the reader caused.
				"flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4",
				className,
			)}
			data-cy={dataCy}
			/* The claim itself, as data. It is otherwise only readable as a chip's
			   words plus a border colour, and the whole component exists to make
			   the difference between its two states unmistakable. */
			data-verified={isVerified}
		>
			{/* A plain avatar - the gradient ring that used to wrap it is gone, here
			    and in the roster rows it matched.

			    The wrapper stays, because `data-profile-avatar` is the hook
			    AppProfileBanner.cy.ts addresses the avatar by. Deleting the ring and
			    the element it hung on together would have taken a passing spec with
			    it - the sort of removal that looks clean in the diff and fails in
			    CI. */}
			<span
				className="block shrink-0"
				data-profile-avatar=""
			>
				<AppAvatar
					name={name}
					size="md"
					src={avatarSrc}
				/>
			</span>

			<div className="min-w-0 flex-1 basis-48">
				{/* Wraps rather than shrinks: on a phone the chip drops under the name
				    instead of being squeezed to "Not ver…", which is the one word in
				    it that must never be cut. */}
				<p className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<span className="min-w-0 truncate font-semibold">{name}</span>
					{isVerified ? (
						<AppChip
							className="shrink-0"
							emphasis="soft"
							icon={BadgeCheck}
							label="Verified"
							size="sm"
							tone="success"
						/>
					) : (
						<AppChip
							className="shrink-0"
							emphasis="soft"
							icon={ShieldAlert}
							label="Not verified"
							size="sm"
							tone="warning"
						/>
					)}
				</p>
				<p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>
				{!isVerified && unverifiedNote ? <p className="mt-1 text-sm text-muted">{unverifiedNote}</p> : null}
			</div>

			{!isVerified && action ? (
				/*
				 * `ms-auto`: on a wide strip it sits at the trailing edge as usual, and
				 * when the row wraps on a phone it drops onto its own line pushed to the
				 * RIGHT rather than sitting under the avatar - a button hanging off the
				 * left margin under an unrelated glyph reads as belonging to the avatar.
				 */
				<AppButton
					className="ms-auto shrink-0"
					data-cy={dataCy ? `${dataCy}-action` : undefined}
					onPress={action.onPress}
					size="sm"
					variant="secondary"
				>
					{action.label}
				</AppButton>
			) : null}
		</div>
	);
}
