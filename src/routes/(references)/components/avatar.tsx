import { AppAvatar, AppAvatarGroup, AppPageHeader, type AvatarGroupMember } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { LabSection, SpecimenLabel } from "@/features/labs/components/LabSection";

const TITLE = "Avatar";

/**
 * Avatar lab.
 *
 * The component is two things wearing one name: a photograph, and - far more
 * often, because most rows in most apps have no photograph - a monogram on the
 * brand gradient. The second is what this page is really about, and it is why
 * `name` is required even when `src` is given: it is the alt text and the
 * fallback both, so an avatar can never end up as an unlabelled circle.
 *
 * Things to check by hand, because none of them survive a screenshot:
 *
 * 1. **The broken image, in "When the photo does not arrive".** Its `src` is a
 *    real request for a file that is not there. It settles on the monogram
 *    rather than on a torn-image glyph or a hole - which is the state a list of
 *    users on a flaky connection is actually in.
 * 2. **Switch the theme.** The monogram's ink is paired to the gradient by the
 *    `gradient-brand` utility, so it flips with the fill. A hand-written
 *    `text-white` beside it is the defect this replaced, and it measured 1.98:1.
 * 3. **Move the radius scale** in the theme customizer, all the way to None.
 *    Every card on the page squares off and nothing here does: an avatar is the
 *    one shape in the app that does not answer to `--radius`, because a face
 *    drawn as a rounded square reads as a picture that failed to crop rather
 *    than as a squarer theme. The stack's overflow count holds with them, being
 *    the same component.
 * 4. **Tab nothing.** There is no focusable element on this page. An avatar is
 *    a picture of a person, never a control - whatever is pressable around one
 *    is the row, the card or the menu trigger it sits inside.
 */
export const Route = createFileRoute("/(references)/components/avatar")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: AvatarLab,
});

/* Real photographs at 96px, which is over twice the largest size prop - so the
   `lg` specimen and the `size-24` profile head are both sampling down rather
   than stretching, the way an upload from a phone would. */
const PHOTO = {
	ada: "https://picsum.photos/seed/avatar-ada/96/96",
	alan: "https://picsum.photos/seed/avatar-alan/96/96",
	grace: "https://picsum.photos/seed/avatar-grace/96/96",
	katherine: "https://picsum.photos/seed/avatar-katherine/96/96",
};

const TEAM: AvatarGroupMember[] = [
	{ name: "Ada Lovelace", src: PHOTO.ada },
	{ name: "Grace Hopper", src: PHOTO.grace },
	{ name: "Alan Turing" },
	{ name: "Katherine Johnson", src: PHOTO.katherine },
	{ name: "Edsger Dijkstra" },
	{ name: "Barbara Liskov" },
	{ name: "Donald Knuth" },
];

function AvatarLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A person, as a picture or as their initials. The initials are the common case."
				title={TITLE}
			/>
			<SizeSection />
			<FallbackSection />
			<InitialsSection />
			<BadgeSection />
			<GroupSection />
		</div>
	);
}

/* ── 1. Sizes ─────────────────────────────────────────────────────────────── */

function SizeSection() {
	return (
		<LabSection
			description="Three sizes, and each answers a layout rather than a taste: sm (32px) is a byline, md (40px) is a list row and the app's default, lg (48px) is a card header. Anything larger is not a prop - see below."
			title="Sizes"
		>
			<div className="flex flex-wrap items-end gap-8">
				{(["sm", "md", "lg"] as const).map((size) => (
					<div
						className="flex flex-col items-center gap-2"
						key={size}
					>
						<AppAvatar
							data-cy={`size-${size}`}
							name="Maria Santos"
							size={size}
							src={PHOTO.grace}
						/>
						<code className="text-text-secondary text-xs">size="{size}"</code>
					</div>
				))}

				<div className="flex flex-col items-center gap-2">
					<AppAvatar
						className="size-24"
						data-cy="size-profile"
						name="Maria Santos"
						src={PHOTO.grace}
					/>
					<code className="text-text-secondary text-xs">className="size-24"</code>
				</div>
			</div>

			<p className="text-sm text-text-secondary">
				There is no <code className="text-text-primary">xl</code>, and adding one would be a fourth name for a number
				that only ever appears once per screen. A profile head is a one-off, so it takes the sanctioned escape hatch - a
				size utility through <code className="text-text-primary">className</code>, which merges with the component's own
				layout rather than replacing it. Pass the size and nothing else: a{" "}
				<code className="text-text-primary">rounded-*</code> beside it is a later layer than the stylesheet and would
				win, which is the one way to get a squared-off face back.
			</p>
		</LabSection>
	);
}

/* ── 2. The gradient fallback ─────────────────────────────────────────────── */

function FallbackSection() {
	return (
		<LabSection
			description="Avatar.Fallback mounts only when there is no image or it failed to load, so the monogram IS the no-photo case - a person with a picture is untouched by any of this."
			title="When the photo does not arrive"
		>
			<div className="grid gap-6 sm:grid-cols-3">
				<div className="flex flex-col items-start gap-3">
					<SpecimenLabel
						summary="src given, and it loads."
						title="A photograph"
					/>
					<AppAvatar
						data-cy="fallback-photo"
						name="Ada Lovelace"
						size="lg"
						src={PHOTO.ada}
					/>
				</div>

				<div className="flex flex-col items-start gap-3">
					<SpecimenLabel
						summary="No src at all - most rows, most apps."
						title="No photograph"
					/>
					<AppAvatar
						data-cy="fallback-none"
						name="Ada Lovelace"
						size="lg"
					/>
				</div>

				<div className="flex flex-col items-start gap-3">
					<SpecimenLabel
						summary="A real request for a file that is not there."
						title="A broken URL"
					/>
					<AppAvatar
						data-cy="fallback-broken"
						name="Ada Lovelace"
						size="lg"
						src="/images/does-not-exist.png"
					/>
				</div>
			</div>

			<p className="text-sm text-text-secondary">
				The monogram is <span className="font-medium text-text-primary">painted, not tinted</span>. It takes the
				full-strength <code className="text-text-primary">gradient-brand</code> because at avatar sizes a pale fill
				reads as a photo that has not finished loading - which is worst exactly where avatars are most common, a list,
				where a column of near-white circles looks like a half-rendered page. The utility sets the paired ink as well as
				the fill, so the initials clear 7:1 at every stop of the ramp in both themes; a{" "}
				<code className="text-text-primary">text-white</code> written beside it cannot flip and used to measure 1.98:1.
			</p>
		</LabSection>
	);
}

/* ── 3. Initials ──────────────────────────────────────────────────────────── */

const INITIALS_CASES = [
	{
		name: "Maria Santos",
		note: "First and last, never the first two letters.",
	},
	{
		name: "Maria Isabel Dela Cruz",
		note: "Middle names are skipped - first and last only.",
	},
	{
		name: "Prince",
		note: "One word keeps one letter. 'Pr' would look like a bug.",
	},
	{
		name: "  ada   lovelace  ",
		note: "Trimmed, collapsed, upper-cased by the component.",
	},
	{
		name: "Mark Sanchez",
		note: "Same monogram as Maria Santos. A monogram is not an identity.",
	},
];

function InitialsSection() {
	return (
		<LabSection
			description="One rule, applied to the cases that break the naive version of it. The last row is the honest limit of the whole idea."
			title="What the initials are"
		>
			<ul className="flex flex-col gap-3">
				{INITIALS_CASES.map((item) => (
					<li
						className="flex items-center gap-3"
						key={item.name}
					>
						<AppAvatar
							data-cy={`initials-${item.name.trim().toLowerCase().replace(/\s+/g, "-")}`}
							name={item.name}
						/>
						<div className="min-w-0">
							<p className="truncate font-medium text-sm">"{item.name}"</p>
							<p className="text-text-secondary text-xs">{item.note}</p>
						</div>
					</li>
				))}
			</ul>

			<p className="text-sm text-text-secondary">
				Two people can share a monogram, and in a team of forty they will. That is a reason to keep the name beside the
				face in any list a person has to read - it is not a reason to widen the monogram to three letters, which fails
				at the same rate one row later and fits worse.
			</p>
		</LabSection>
	);
}

/* ── 4. Presence and counts ───────────────────────────────────────────────── */

function BadgeSection() {
	return (
		<LabSection
			description="The badge is only wrapped on when one is asked for - an anchor around every avatar in the app would add a positioning context the plain case has no use for. Its `label` is required, and that is the point: a badge is not part of its anchor's accessible name, so a face wearing a green dot is otherwise announced as the person with the status silent."
			title="Presence and counts"
		>
			<div className="flex flex-wrap items-end gap-8">
				<div className="flex flex-col items-center gap-2">
					<AppAvatar
						badge={{ label: "online" }}
						data-cy="badge-online"
						name="Ada Lovelace"
						size="lg"
						src={PHOTO.ada}
					/>
					<code className="text-text-secondary text-xs">label only</code>
				</div>

				<div className="flex flex-col items-center gap-2">
					<AppAvatar
						badge={{ color: "warning", label: "away" }}
						data-cy="badge-away"
						name="Alan Turing"
						size="lg"
					/>
					<code className="text-text-secondary text-xs">color="warning"</code>
				</div>

				<div className="flex flex-col items-center gap-2">
					<AppAvatar
						badge={{ color: "danger", content: 12, label: "unread messages" }}
						data-cy="badge-count"
						name="Grace Hopper"
						size="lg"
						src={PHOTO.grace}
					/>
					<code className="text-text-secondary text-xs">content={"{12}"}</code>
				</div>

				<div className="flex flex-col items-center gap-2">
					<AppAvatar
						badge={{ content: 128, label: "unread messages" }}
						data-cy="badge-overflow"
						name="Katherine Johnson"
						size="lg"
						src={PHOTO.katherine}
					/>
					<code className="text-text-secondary text-xs">content={"{128}"} → 99+</code>
				</div>
			</div>

			<p className="text-sm text-text-secondary">
				Colour defaults to <code className="text-text-primary">success</code> here rather than to AppBadge's brand,
				because the overwhelmingly common badge on a face is presence and green is the one colour that already means it.
				A count is a different claim - pass the colour that matches what the number is: brand for messages, danger only
				when the count IS the problem.
			</p>
		</LabSection>
	);
}

/* ── 5. The stack ─────────────────────────────────────────────────────────── */

function GroupSection() {
	return (
		<LabSection
			description="Several people as one object, for the question 'who is on this' asked in passing. Nothing in it is pressable and there are no per-face tooltips: at 40px overlapped by a third, the hit targets are crescents. A roster somebody has to read or act on is the users list."
			title="Stacked"
		>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="Seven members, max 4. Three become a count."
						title="The default"
					/>
					<AppAvatarGroup
						data-cy="group-default"
						label="Project members"
						members={TEAM}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="Five members, max 4 - and no '+1' anywhere."
						title="One over the limit"
					/>
					<AppAvatarGroup
						data-cy="group-plus-one"
						label="Reviewers"
						members={TEAM.slice(0, 5)}
					/>
					<p className="text-sm text-text-secondary">
						The cutoff moves by one rather than spending a disc on the number one. A face says who; "+1" says there is
						somebody, which the empty space already said.
					</p>
				</div>

				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="The overlap is a share of the diameter, not a fixed 12px."
						title="At every size"
					/>
					<div className="flex flex-wrap items-center gap-8">
						{(["sm", "md", "lg"] as const).map((size) => (
							<div
								className="flex flex-col items-start gap-2"
								key={size}
							>
								<AppAvatarGroup
									data-cy={`group-${size}`}
									label={`Project members, ${size}`}
									members={TEAM}
									size={size}
								/>
								<code className="text-text-secondary text-xs">size="{size}"</code>
							</div>
						))}
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<SpecimenLabel
						summary="max={2}, and everyone in the count."
						title="Tight"
					/>
					<AppAvatarGroup
						data-cy="group-tight"
						label="Attending"
						max={2}
						members={TEAM}
						size="sm"
					/>
				</div>
			</div>

			<p className="text-sm text-text-secondary">
				Each face is hidden from the accessibility tree and its name given as text beside it, so the stack is announced
				as a labelled list of people rather than as a run of monograms - "MS, GH, AT" is what the fallback's initials
				would otherwise be read as, while a neighbour with a photograph would be read as its alt. The count is announced
				as "3 more people", never as a person called "+3".
			</p>
		</LabSection>
	);
}
