import { AppPageHeader, AppPressable, type PressEffect, type PressIntensity } from "@bernardsapida/web-ui";
import { Typography } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Heart, Star } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";
import { LabSection } from "@/features/labs/components/LabSection";
import { cn } from "@/utils/cn";

const TITLE = "Pressable feedback";

/**
 * Pressable feedback lab - the press response a surface gives back.
 *
 * WHO USES THIS: a developer, once, at the moment they need a tile or a row to
 * answer a tap. WORST MISTAKE THEY CAN MAKE: wrapping something that is already
 * a control - an `AppButton`, a `Link` - which nests two press targets, draws
 * two focus rings, and clips the ripple to the OUTER box so it misses the inner
 * one's corners. That is why the first section on this page is the radius
 * behaviour and why the `as="div"` section says out loud what the div is for.
 *
 * Things to check by hand, none of which a screenshot shows:
 *
 * 1. **Press each radius specimen near a corner.** The circle is cut by the
 *    element's own curve - including the asymmetric one, where only the top two
 *    corners are round. Nothing is passed to make that happen; the clip layer
 *    inherits the radius.
 * 2. **Tab to a specimen and hold Space.** The scale holds while the key is
 *    down and the ripple starts from the CENTRE, because a keyboard press has
 *    no coordinates. Release to fire. Tab away mid-hold and the pressed look
 *    clears rather than sticking.
 * 3. **Press the brand tile and the plain tile.** The ripple is `currentColor`,
 *    so it is pale on the filled surface and dark on the plain one, from one
 *    rule.
 * 4. **Turn on reduced motion at the OS level and reload.** No scale, no
 *    ripple - the press answers with a fade instead. It must still answer.
 */
export const Route = createFileRoute("/(references)/components/pressable-feedback")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: PressableFeedbackLab,
});

function PressableFeedbackLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A surface that answers a press - a scale, a ripple from where the pointer landed, or both. For the things that are not already components: a tile, a list row, a selectable card."
				title={TITLE}
			/>
			<EffectsSection />
			<IntensitySection />
			<RadiusSection />
			<DivSection />
			<DisabledSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

/** The plain specimen surface. Every press style below is the caller's, not the component's. */
const TILE = "flex h-24 w-full items-center justify-center rounded-2xl border border-border bg-surface px-4";

function EffectsSection() {
	const effects: { effect: PressEffect; summary: string }[] = [
		{ effect: "both", summary: "The default." },
		{ effect: "scale", summary: "Small controls, where there is no room to be ambiguous about where." },
		{ effect: "ripple", summary: "A surface that must not move - a row inside a scrolling list." },
		{ effect: "none", summary: "Opted out, still a control." },
	];

	return (
		<LabSection
			description="Scale says the press landed; ripple says where. They are separate props because a 32px icon button has no 'where' worth drawing, and a row inside a scrolling list must not move under the thumb."
			title="The two effects, and each on its own"
		>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{effects.map(({ effect, summary }) => (
					<div key={effect}>
						<AppPressable
							className={TILE}
							data-cy={`pressable-effect-${effect}`}
							effect={effect}
						>
							<Typography type="body-sm">{`effect="${effect}"`}</Typography>
						</AppPressable>
						<Typography
							className="mt-2 block"
							color="muted"
							type="body-xs"
						>
							{summary}
						</Typography>
					</div>
				))}
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function IntensitySection() {
	const intensities: PressIntensity[] = ["firm", "soft"];

	return (
		<LabSection
			description="How far the surface gives. Press the wide row at firm and then at soft: 4% on something this size does not read as a press, it reads as the row collapsing. The rule of thumb is soft above roughly 400px wide."
			title="Intensity"
		>
			<div className="flex flex-col gap-5">
				{intensities.map((intensity) => (
					<div
						className="flex flex-col gap-2"
						key={intensity}
					>
						<Typography
							type="body-sm"
							weight="medium"
						>
							{`intensity="${intensity}"`}
						</Typography>
						<div className="flex flex-wrap items-center gap-3">
							<AppPressable
								className="rounded-xl border border-border bg-surface px-4 py-2"
								data-cy={`pressable-intensity-${intensity}-small`}
								intensity={intensity}
							>
								<Typography type="body-sm">A small control</Typography>
							</AppPressable>
							<AppPressable
								className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
								data-cy={`pressable-intensity-${intensity}-row`}
								intensity={intensity}
							>
								<Typography type="body-sm">A full-width row - the case soft exists for</Typography>
								<Star
									aria-hidden="true"
									className="size-4 text-muted"
								/>
							</AppPressable>
						</div>
					</div>
				))}
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function RadiusSection() {
	const shapes = [
		{ className: "rounded-none", label: "Square", slug: "square" },
		{ className: "rounded-2xl", label: "rounded-2xl", slug: "rounded" },
		{ className: "rounded-t-2xl", label: "Top corners only", slug: "asymmetric" },
		{ className: "border-4", label: "A 4px border", slug: "thick-border" },
	];

	return (
		<LabSection
			description="Press each one near a corner. The ripple is cut by the element's own curve, and nothing is passed to make that happen - the clip layer inherits whatever radius the caller set, which is why the asymmetric one works where a single radius prop could not."
			title="Radius, including the corners you did not think about"
		>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{shapes.map(({ className, label, slug }) => (
					<div key={slug}>
						<AppPressable
							/* cn, not concatenation: `TILE` already carries a radius, and two
							   radius utilities in one class list are resolved by stylesheet
							   order rather than by which was written last. */
							className={cn(TILE, className)}
							data-cy={`pressable-radius-${slug}`}
						>
							<Typography type="body-sm">{label}</Typography>
						</AppPressable>
					</div>
				))}
			</div>

			<div className="flex flex-wrap items-center gap-4">
				<AppPressable
					aria-label="A circular pressable"
					className="grid size-16 place-items-center rounded-full border border-border bg-surface"
					data-cy="pressable-radius-circle"
				>
					<Heart
						aria-hidden="true"
						className="size-5"
					/>
				</AppPressable>
				<AppPressable
					aria-label="A brand-filled pressable"
					className="grid size-16 place-items-center rounded-full gradient-brand"
					data-cy="pressable-radius-brand"
				>
					<Bookmark
						aria-hidden="true"
						className="size-5"
					/>
				</AppPressable>
				<Typography
					className="max-w-md"
					color="muted"
					type="body-sm"
				>
					Both circles run the same rule. The ripple is <code>currentColor</code>, so it is dark on the plain surface
					and pale on the brand fill - a fixed accent would be invisible on one and wrong on the other.
				</Typography>
			</div>

			<Note>
				The one case the clip approximates is the 4px border above: it sits on the padding box while the radius it
				inherited was measured on the border box, so it over-rounds by the border width and leaves a hairline gap at
				each corner. At the 1px borders used everywhere else in this package it cannot be seen.
			</Note>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function DivSection() {
	const [count, setCount] = useState(0);

	return (
		<LabSection
			description="A <button> may not contain a link or another button - it is invalid HTML and the inner control stops being reachable. So a pressable card holding a 'Read more' link has to be a div, and everything the button got free has to be rebuilt: focusability, Enter on the way down, Space on release, and the pressed look while Space is held."
			title="as='div', for content a button may not hold"
		>
			<AppPressable
				as="div"
				className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 text-left"
				data-cy="pressable-div-card"
				intensity="soft"
				onPress={() => setCount((current) => current + 1)}
			>
				<Typography type="h5">A pressable card</Typography>
				<Typography
					color="muted"
					type="body-sm"
				>
					Pressing the card counts. The link below is a real link and goes somewhere else - reachable by Tab, and not
					swallowed by the card.
				</Typography>
				<Link
					className="w-fit text-accent text-sm underline underline-offset-4"
					to="/components/button"
				>
					Read more
				</Link>
			</AppPressable>

			<Typography
				color="muted"
				type="body-sm"
			>
				Card pressed <span data-cy="pressable-div-count">{count}</span> times.
			</Typography>

			<Note>
				Tab to the card and hold Space: it takes the pressed look now and fires on release, which is what lets you move
				away mid-press and back out. Enter fires immediately. Both start the ripple from the centre, because a keyboard
				press has no coordinates to start it from - the alternative is a ripple pinned to the top-left corner, which is
				what happens when this case is forgotten.
			</Note>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function DisabledSection() {
	return (
		<LabSection
			description="No scale, no ripple, and no press. It is the same surface with nothing to say back, which is the point - a disabled control that still animates reads as one that worked."
			title="Disabled"
		>
			<div className="flex flex-wrap gap-3">
				<AppPressable
					className={cn(TILE, "w-auto px-6 opacity-50")}
					data-cy="pressable-disabled-button"
					isDisabled
				>
					<Typography type="body-sm">Disabled button</Typography>
				</AppPressable>
				<AppPressable
					as="div"
					className={cn(TILE, "w-auto px-6 opacity-50")}
					data-cy="pressable-disabled-div"
					isDisabled
				>
					<Typography type="body-sm">Disabled div - out of the tab order</Typography>
				</AppPressable>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

/** A caveat that belongs beside the specimen rather than in the section's one-line description. */
function Note({ children }: { children: ReactNode }) {
	return (
		<div className="rounded-xl border border-border border-dashed bg-muted-surface/40 p-4">
			<Typography
				color="muted"
				type="body-sm"
			>
				{children}
			</Typography>
		</div>
	);
}
