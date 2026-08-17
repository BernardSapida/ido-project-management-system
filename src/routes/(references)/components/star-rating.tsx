import { AppGlassCard, AppRatingSummary, AppStarRating } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Star rating reference. Developer reference, beside toaster and users-list;
 * not linked from any navigation and marked noindex.
 *
 * Two components, and the point of the page is that they are two: the stars you
 * press and the average someone else produced. Things to check by hand - the
 * fill follows the cursor before any click and snaps back when it leaves; the
 * fractions below are clipped to the real number rather than rounded to a half
 * glyph; the stars light left to right on first paint and do not re-run when a
 * value changes. Then turn on reduced motion and confirm every one of them is
 * already at its final fill.
 */
export const Route = createFileRoute("/(references)/components/star-rating")({
	head: () => ({
		meta: [{ title: seo.title("Star rating") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Star rating" },
	component: StarRatingReferencePage,
});

function StarRatingReferencePage() {
	return (
		<div className="px-4 py-10">
			<div className="mb-8 flex flex-col gap-1">
				<h1 className="text-2xl font-bold text-text-primary">Star rating</h1>
				<p className="text-sm text-text-secondary">
					Stars to rate, a ring to summarise. Two components, because an input and an average are not the same thing.
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<InputSection />
				<HonestySection />
				<ProductSection />
				<StatesSection />
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

function InputSection() {
	const [rating, setRating] = useState(0);

	return (
		<LabSection
			description="Hover across the row before clicking: the fill follows the cursor, and leaving the row snaps it back to whatever was actually chosen. Press the selected star again - or use Clear - to go back to unrated."
			title="Input"
		>
			<AppStarRating
				data-cy="rating-input"
				description="Whole stars only. Half stars are a display concern."
				label="Rate this product"
				onChange={setRating}
				value={rating}
			/>
			<p className="text-sm text-text-secondary">
				Value: <span className="font-medium">{rating === 0 ? "unrated" : rating}</span>
			</p>

			<div className="flex flex-wrap gap-8 border-t border-border pt-4">
				<AppStarRating
					defaultValue={3}
					label="Small"
					size="sm"
				/>
				<AppStarRating
					defaultValue={4}
					isDisabled
					label="Disabled"
				/>
			</div>
		</LabSection>
	);
}

/** The whole argument for clipping, side by side. */
function HonestySection() {
	return (
		<LabSection
			description="Three averages that rounding would flatten into the same five stars. The fifth star is clipped to the real fraction, so 4.4 and 4.7 cannot look alike."
			title="Fractions, not rounding"
		>
			<div className="flex flex-col gap-4">
				{[4.4, 4.7, 5].map((value) => (
					<AppRatingSummary
						count={212}
						data-cy={`summary-${value}`}
						key={value}
						showRing={false}
						value={value}
					/>
				))}
			</div>
		</LabSection>
	);
}

function ProductSection() {
	return (
		<LabSection
			description="The full summary: stars for the shape of the answer, the number for its precision, the count for whether it is worth believing, and the breakdown so a flat 4.5 cannot pass for a wall of fives."
			title="Summary"
		>
			<AppRatingSummary
				count={212}
				data-cy="summary-full"
				distribution={[4, 8, 19, 53, 128]}
				noun="ratings"
				value={4.5}
			/>
		</LabSection>
	);
}

function StatesSection() {
	return (
		<LabSection
			description="No ratings is its own state. It is not 0.0 with five empty stars - that is what the input looks like, and a summary wearing it reads as a control the user failed to use."
			title="Unrated"
		>
			<AppRatingSummary
				count={0}
				data-cy="summary-unrated"
				value={0}
			/>
		</LabSection>
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
			<AppGlassCard.Content className="flex flex-col gap-4 p-5">
				<div>
					<h2 className="text-lg font-semibold text-text-primary">{title}</h2>
					<p className="mt-1 text-sm text-text-secondary">{description}</p>
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
