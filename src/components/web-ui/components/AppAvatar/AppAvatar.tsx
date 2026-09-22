import { Avatar } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import type { BadgeColor } from "../AppBadge";
import { AppBadge } from "../AppBadge";

/** Exported so a component that stacks avatars can type its own `size` prop
 *  against this rather than reaching back into HeroUI for the union. */
export type AvatarSize = ComponentProps<typeof Avatar>["size"];

interface AppAvatarProps {
	name: string;
	src?: string;
	/** Test hook on the outermost element - the badge anchor when there is one. */
	"data-cy"?: string;
	/**
	 * The status dot or count on the corner of the face.
	 *
	 * `label` is the noun it stands for - "online", "3 unread messages" - and is
	 * required for the reason {@link AppBadge} states: the badge is invisible to
	 * a screen reader unless something names it, and this component has the dot
	 * but not the meaning.
	 */
	badge?: { color?: BadgeColor; content?: ReactNode; label: string };
	size?: AvatarSize;
	className?: string;
	/**
	 * The overflow chip at the end of an avatar group - "+5", "12".
	 *
	 * It exists because that chip has to be the SAME SHAPE AND SIZE as the
	 * avatars it trails, and being the same component is the only way to
	 * guarantee that. A hand-rolled `size-10 rounded-full` span used to drift
	 * the moment --radius moved - the five faces squared off and the sixth
	 * stayed a pill. Avatars are pinned to a circle now (see the avatar block in
	 * `styles.css`), so that particular drift is gone, but size, ring and every
	 * later change still have one source only if this is an Avatar.
	 *
	 * It is not a "custom initials" hatch. `name` is still required and still
	 * carries the accessible name, so the count is announced as what it is
	 * rather than as a person called "+5".
	 */
	overflowLabel?: string;
}

/**
 * First and last initial, not the first two letters.
 *
 * "Maria Santos" is MS, which is what a reader expects; "Ma" is what they get
 * from a naive slice, and it reads as a truncated word rather than as a
 * monogram. A single-word name keeps one letter for the same reason - "Ma" from
 * "Maria" would look like a bug.
 */
function getInitials(name: string): string {
	const words = name.trim().split(/\s+/);
	if (words.length === 1) return words[0].charAt(0).toUpperCase();
	return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * A person, as a picture or as their initials.
 *
 * `name` is required even when `src` is given: it is the image's alt text and
 * the fallback both, so an avatar can never end up as an unlabelled circle. A
 * broken URL degrades to the monogram rather than to empty space.
 *
 * The badge is the presence/status dot. It is only wrapped in `AppBadge`
 * when one is asked for - an anchor around every avatar would add a positioning
 * context that the plain case has no use for.
 *
 * The monogram is painted, not tinted. `Avatar.Fallback` mounts only when there
 * is no image or it failed to load, so styling it is exactly the no-photo case;
 * a person with a picture is untouched. It gets the full-strength
 * `gradient-brand` rather than a tint because at avatar sizes a pale fill reads
 * as a photo that has not finished loading - which is worst in the place
 * avatars are most common, a list, where a column of near-white circles looks
 * like a half-rendered page.
 *
 * It used to need a gradient of its OWN, because the initials were white and
 * neither brand gradient could carry white text - `hero` started at 3.28:1.
 * That is no longer a problem worth a third ramp: `gradient-brand` brings its
 * own paired foreground and clears 7:1 at every stop, so the monogram is
 * legible wherever the 135deg lands on the circle, in both themes.
 */
export function AppAvatar({ name, src, badge, size, className, "data-cy": dataCy, overflowLabel }: AppAvatarProps) {
	const avatar = (
		<Avatar
			className={className}
			/* Only when there is no badge - otherwise the anchor below takes it, so
			   the hook is always on the outermost element and a spec addressing it
			   does not have to know whether this avatar happens to wear a dot. */
			data-cy={badge ? undefined : dataCy}
			size={size}
		>
			{src && (
				<Avatar.Image
					alt={name}
					src={src}
				/>
			)}
			{/*
			 * The SAME fill as the monograms it trails, and that is a reversal.
			 *
			 * It was `bg-muted-surface` - "a neutral well, not a brand fill: it is not
			 * a person, and painting it in the brand puts a sixth identity in a row of
			 * five". The intent was right and the value could not carry it: measured
			 * against the card it sits on, that token is 1.17:1 in dark and 1.05:1 in
			 * light. The chip was not reading as a quieter chip, it was not reading as
			 * a chip at all - a hole at the end of the row in both themes.
			 *
			 * There is no neutral that fixes it either, which is what forced the
			 * reversal rather than a re-tint: a pale well dies on the near-white card
			 * and a dark one dies on the dark card, so the only values that clear both
			 * grounds are the ones that INVERT per theme. The brand fill is that, and
			 * it is already on screen five times beside this.
			 *
			 * What still separates a count from a person is the type, which is doing
			 * the work it was always doing: a step down in size and a lighter weight
			 * than the initials. `gradient-brand` carries its own paired ink, so the
			 * label cannot be mismatched to the fill.
			 */}
			{overflowLabel ? (
				<Avatar.Fallback className="gradient-brand font-medium text-[0.6875rem] leading-none">
					{overflowLabel}
				</Avatar.Fallback>
			) : (
				<Avatar.Fallback className="gradient-brand font-semibold">{getInitials(name)}</Avatar.Fallback>
			)}
		</Avatar>
	);

	if (!badge) return avatar;

	/* AppBadge, not a raw Badge.Anchor pair. The hand-rolled version rendered the
	   dot with nothing to announce it: a badge is not part of its anchor's
	   accessible name, so a face wearing a green dot was spoken as the person's
	   name and the status was silent. AppBadge demands the noun and pairs it with
	   the count in visually-hidden text, which is why `label` is required in the
	   object below rather than optional. */
	return (
		<AppBadge
			color={badge.color ?? "success"}
			content={badge.content}
			data-cy={dataCy}
			label={badge.label}
			placement="bottom-right"
		>
			{avatar}
		</AppBadge>
	);
}
