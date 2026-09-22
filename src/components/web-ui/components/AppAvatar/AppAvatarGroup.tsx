import { cn } from "../../lib/cn";
import type { AvatarSize } from "./AppAvatar";
import { AppAvatar } from "./AppAvatar";

export interface AvatarGroupMember {
	/** Only needed when two people in the same stack share a name. Defaults to `name`. */
	key?: string;
	name: string;
	src?: string;
}

interface AppAvatarGroupProps {
	className?: string;
	/** Test hook on the list itself - the outermost element. */
	"data-cy"?: string;
	/**
	 * Names the stack for a screen reader - "Project members", "Attending".
	 * Required: a row of six faces is otherwise announced as an unlabelled list
	 * of six names, which says who but never what they have in common.
	 */
	label: string;
	/**
	 * Faces before the rest become a count.
	 *
	 * @default 4
	 */
	max?: number;
	members: AvatarGroupMember[];
	size?: AvatarSize;
}

/**
 * How far each face slides under the one before it, per size.
 *
 * A fixed `-space-x-3` was what the theme customizer used, and it is right for
 * exactly one of the three sizes: on `sm` (32px) it eats 37% of each disc and
 * the initials start disappearing under their neighbour, while on `lg` (48px) it
 * is a 25% bite that reads as a gappy row rather than a stack. Roughly 30% of
 * the diameter holds the same overlap at every size.
 */
const OVERLAP: Record<NonNullable<AvatarSize>, string> = {
	lg: "-space-x-3.5",
	md: "-space-x-3",
	sm: "-space-x-2",
};

/**
 * Several people as one object: overlapping faces, then a count.
 *
 * The stack is for the question "who is on this" asked in passing - a card
 * footer, a row, a project header. It is deliberately NOT a list of people you
 * can act on: nothing here is pressable, and there is no per-face tooltip,
 * because at 40px overlapped by a third the hit targets are crescents. A roster
 * someone has to read or act on is `AppUserList`.
 *
 * **The overflow chip is an `AppAvatar`, not a span dressed as one.** That is
 * the load-bearing part of having this component at all. Sharing the component
 * is the only version of "same shape, same size" that survives a token change:
 * a hand-rolled `size-10 rounded-full` count matched the stack at the default
 * theme and nowhere else, because `.avatar` used to be `rounded-3xl` and every
 * radius step moved the faces and left the count behind. Avatars are pinned to
 * a circle now, which retires that specific failure and none of the ones after
 * it - size, ring, and whatever the face grows next.
 *
 * **Later faces paint over earlier ones**, which is DOM order and not a
 * decision worth reversing with z-index: it puts the count on top of the last
 * face, and the count is the one disc in the row that must never be clipped.
 *
 * Each face carries a hairline ring in the page colour so two overlapping
 * photographs read as two discs rather than as one torn image. It is a ring
 * rather than a border because a border would be inside `overflow-hidden` and
 * crop the photo it is meant to separate.
 */
export function AppAvatarGroup({ className, "data-cy": dataCy, label, max = 4, members, size }: AppAvatarGroupProps) {
	if (members.length === 0) return null;

	const scale = size ?? "md";

	/*
	 * "+1" is never worth drawing. Five people at max=4 would spend the same disc
	 * on a face or on the number one - and the face says who, which is the whole
	 * question a stack answers. So the cutoff moves by one rather than the group
	 * rendering a count that stands for a single person.
	 */
	const shown = members.length === max + 1 ? members : members.slice(0, max);
	const remaining = members.length - shown.length;
	const overflowName = `${remaining} more ${remaining === 1 ? "person" : "people"}`;

	return (
		<ul
			aria-label={label}
			className={cn("flex items-center", OVERLAP[scale], className)}
			data-cy={dataCy}
		>
			{shown.map((member) => (
				<li
					className="shrink-0"
					data-avatar-member={member.key ?? member.name}
					key={member.key ?? member.name}
				>
					{/*
					 * The face is hidden from the accessibility tree and the name is
					 * given as text beside it. Without this the stack is announced as its
					 * monograms - "MS, GH, AT" - because the fallback's initials are real
					 * text, and a photograph would be read as its alt while its
					 * neighbour is read as two letters. One name per person, either way.
					 */}
					<span aria-hidden="true">
						<AppAvatar
							className="ring-2 ring-surface"
							name={member.name}
							size={scale}
							src={member.src}
						/>
					</span>
					<span className="sr-only">{member.name}</span>
				</li>
			))}

			{remaining > 0 ? (
				<li
					className="shrink-0"
					data-avatar-overflow={remaining}
				>
					{/* Same split as a face: "+3" is drawn, "3 more people" is what is
					    said. Announcing the glyph would put a person called "+3" at the
					    end of the list. */}
					<span aria-hidden="true">
						<AppAvatar
							className="ring-2 ring-surface"
							name={overflowName}
							overflowLabel={`+${remaining}`}
							size={scale}
						/>
					</span>
					<span className="sr-only">{overflowName}</span>
				</li>
			) : null}
		</ul>
	);
}
