import { AppChip, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlertTriangle,
	Ban,
	CalendarClock,
	CheckCircle2,
	Clock,
	MapPin,
	Package,
	ShieldCheck,
	Truck,
	Warehouse,
} from "lucide-react";
import type { ReactNode } from "react";
import { seo } from "@/config/seo.config";

/**
 * Chip lab. Developer reference under /components, which owns the backdrop and
 * the nav; every page there is noindex.
 *
 * The chip is the smallest label in the app and the one that appears the most
 * often - a table of 10 rows can carry 30 of them - so the things worth
 * checking here are density and alignment: a row of chips at three sizes, a
 * glyph that must never outgrow its text, and a label long enough to test that
 * a chip wraps as a unit rather than breaking mid-word.
 */
export const Route = createFileRoute("/(references)/components/chip")({
	head: () => ({
		meta: [{ title: seo.title("Chip lab") }, { content: "noindex", name: "robots" }],
	}),
	component: ChipLabPage,
});

function ChipLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="Icon and label, always both."
				title="Chip lab"
			/>
			<ColorSection />
			<VariantSection />
			<SizeSection />
			<InContextSection />
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

function Row({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

/* -------------------------------------------------------------------------- */

const TONES = ["default", "accent", "success", "warning", "danger"] as const;
const EMPHASES = ["soft", "solid"] as const;

/** Every tone, in the emphasis tables use most. */
function ColorSection() {
	return (
		<LabSection
			description="Five tones: default, accent, success, warning, danger. They are the app's own flat pairs, not HeroUI's - see the note in AppChip. The glyph is aria-hidden, because the label next to it already says the same thing and announcing both would double every chip in a table."
			title="Tones"
		>
			<Row>
				<AppChip
					data-cy="chip-default"
					icon={Clock}
					label="Draft"
					tone="default"
				/>
				<AppChip
					data-cy="chip-accent"
					icon={CalendarClock}
					label="Scheduled"
					tone="accent"
				/>
				<AppChip
					data-cy="chip-success"
					icon={CheckCircle2}
					label="Fulfilled"
					tone="success"
				/>
				<AppChip
					data-cy="chip-warning"
					icon={AlertTriangle}
					label="Expiring"
					tone="warning"
				/>
				<AppChip
					data-cy="chip-danger"
					icon={Ban}
					label="Cancelled"
					tone="danger"
				/>
			</Row>
		</LabSection>
	);
}

/** Both emphases against every tone - the grid where contrast breaks. */
function VariantSection() {
	return (
		<LabSection
			description="Two emphases across five tones. `soft` is the default and the one for a dense table; `solid` at 30 chips a page turns the screen into a paint chart. Both fills are opaque, so a chip is the same colour on a white card, a glass panel and a tinted footer - which is exactly what HeroUI's translucent chip colours could not promise."
			title="Emphasis"
		>
			<div className="space-y-3">
				{EMPHASES.map((emphasis) => (
					<div
						className="flex flex-wrap items-center gap-2"
						key={emphasis}
					>
						<span className="w-20 shrink-0 text-xs font-medium text-muted">{emphasis}</span>
						{TONES.map((tone) => (
							<AppChip
								emphasis={emphasis}
								icon={Package}
								key={tone}
								label={tone}
								tone={tone}
							/>
						))}
					</div>
				))}
			</div>
		</LabSection>
	);
}

/** Three sizes, with the glyph scaled to each. */
function SizeSection() {
	return (
		<LabSection
			description="The glyph scales with the chip - size-3 / size-3.5 / size-4 - so it never stands taller than the text beside it. That mismatch is what makes a chip look bolted together."
			title="Sizes"
		>
			<Row>
				<AppChip
					icon={ShieldCheck}
					label="Verified"
					size="sm"
					tone="accent"
				/>
				<AppChip
					icon={ShieldCheck}
					label="Verified"
					size="md"
					tone="accent"
				/>
				<AppChip
					icon={ShieldCheck}
					label="Verified"
					size="lg"
					tone="accent"
				/>
			</Row>
		</LabSection>
	);
}

/** Where they actually appear: several per row, and one over-long label. */
function InContextSection() {
	return (
		<LabSection
			description="Four in a row, as a table cell would carry them, plus a label longer than any real one. A chip wraps as a whole unit; it never breaks mid-word."
			title="In context"
		>
			<div className="space-y-3">
				<Row>
					<AppChip
						emphasis="soft"
						icon={Package}
						label="O-"
						size="sm"
						tone="danger"
					/>
					<AppChip
						emphasis="soft"
						icon={Warehouse}
						label="Quezon City General"
						size="sm"
						tone="default"
					/>
					<AppChip
						emphasis="soft"
						icon={MapPin}
						label="2.4 km"
						size="sm"
						tone="default"
					/>
					<AppChip
						emphasis="soft"
						icon={Truck}
						label="In transit"
						size="sm"
						tone="success"
					/>
				</Row>
				<div className="max-w-[260px]">
					<AppChip
						emphasis="soft"
						icon={AlertTriangle}
						label="Awaiting warehouse confirmation since Tuesday"
						tone="warning"
					/>
				</div>
			</div>
		</LabSection>
	);
}
