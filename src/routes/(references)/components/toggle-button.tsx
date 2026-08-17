import {
	AppButton,
	AppCheckbox,
	AppGlassCard,
	AppPageHeader,
	AppSwitch,
	AppToast,
	AppToggleButton,
} from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Bold,
	Italic,
	LayoutGrid,
	Link2,
	List,
	Underline,
	Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { seo } from "@/config/seo.config";
import { cn } from "@/utils/cn";

/**
 * Toggle button lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The toolbar at the top is the point of the page. A toggle button only makes
 * sense beside the things it is not - marks that stay pressed, an alignment row
 * where exactly one does, and two plain buttons that fire and come straight back
 * up - and a toolbar is the one place all three sit together.
 *
 * Two things to check by hand:
 *
 * 1. Tab to any toggle and press Space. The pressed state must survive - the
 *    component is controlled-only, so if the caller forgets to write the state
 *    back, the button visibly refuses to stay down rather than silently
 *    disagreeing with the value it is meant to show.
 * 2. With a screen reader on, land on an icon-only toggle. It announces a name
 *    AND a pressed state. The name is now required by the type, so there is no
 *    longer a way to ship one without it.
 */
export const Route = createFileRoute("/(references)/components/toggle-button")({
	head: () => ({
		meta: [{ title: seo.title("Toggle button lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Toggle button" },
	component: ToggleButtonLabPage,
});

function ToggleButtonLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A button that stays pressed - in the toolbar it was built for."
				title="Toggle button lab"
			/>
			<ToolbarSection />
			<NotACheckboxSection />
			<VariantSection />
			<SizeSection />
			<StatesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* The assembly                                                               */
/* -------------------------------------------------------------------------- */

type Alignment = "left" | "center" | "right";

const ALIGNMENTS: { icon: typeof AlignLeft; key: Alignment; label: string }[] = [
	{ icon: AlignLeft, key: "left", label: "Align left" },
	{ icon: AlignCenter, key: "center", label: "Align centre" },
	{ icon: AlignRight, key: "right", label: "Align right" },
];

const ALIGNMENT_CLASS: Record<Alignment, string> = {
	center: "text-center",
	left: "text-left",
	right: "text-right",
};

/**
 * Where this component actually lives. Everything below this section is
 * reference; this is the screen.
 */
function ToolbarSection() {
	const [marks, setMarks] = useState<Set<string>>(new Set(["bold"]));
	const [align, setAlign] = useState<Alignment>("left");

	const toggleMark = (key: string) => (isSelected: boolean) => {
		setMarks((current) => {
			const next = new Set(current);
			if (isSelected) next.add(key);
			else next.delete(key);
			return next;
		});
	};

	const reset = () => {
		setMarks(new Set());
		setAlign("left");
	};

	return (
		<LabSection
			description="An editor toolbar, which is the one place every kind of control sits side by side. The three marks are independent - any combination is legal, including none. The three alignments are exclusive, and that is enforced by the caller's state rather than by the component: pressing the active one again does nothing, because 'aligned to nothing' is not a state a paragraph can be in. The two on the right are plain buttons: they fire and come straight back up, because they do not describe a state the paragraph is in."
			title="In a toolbar"
			usedIn={["Rich-text editors", "Map layer controls", "Chart and view-mode switches"]}
		>
			<div className="overflow-hidden rounded-2xl border border-border">
				<div
					aria-label="Formatting"
					className="flex flex-wrap items-center gap-1 border-b border-border bg-muted-surface/50 p-2"
					data-cy="toolbar"
					role="toolbar"
				>
					<AppToggleButton
						aria-label="Bold"
						data-cy="mark-bold"
						isIconOnly
						isSelected={marks.has("bold")}
						onChange={toggleMark("bold")}
						size="sm"
						variant="ghost"
					>
						<Bold
							aria-hidden="true"
							className="size-4"
						/>
					</AppToggleButton>
					<AppToggleButton
						aria-label="Italic"
						data-cy="mark-italic"
						isIconOnly
						isSelected={marks.has("italic")}
						onChange={toggleMark("italic")}
						size="sm"
						variant="ghost"
					>
						<Italic
							aria-hidden="true"
							className="size-4"
						/>
					</AppToggleButton>
					<AppToggleButton
						aria-label="Underline"
						data-cy="mark-underline"
						isIconOnly
						isSelected={marks.has("underline")}
						onChange={toggleMark("underline")}
						size="sm"
						variant="ghost"
					>
						<Underline
							aria-hidden="true"
							className="size-4"
						/>
					</AppToggleButton>

					<Divider />

					{ALIGNMENTS.map((option) => (
						<AppToggleButton
							aria-label={option.label}
							data-cy={`align-${option.key}`}
							isIconOnly
							isSelected={align === option.key}
							key={option.key}
							// Re-pressing the active one is a no-op, not a clear.
							onChange={() => setAlign(option.key)}
							size="sm"
							variant="ghost"
						>
							<option.icon
								aria-hidden="true"
								className="size-4"
							/>
						</AppToggleButton>
					))}

					<Divider />

					<AppButton
						data-cy="insert-link"
						icon={Link2}
						onPress={() =>
							AppToast.info("Insert link", {
								description: "The lab inserts nothing.",
								icon: Link2,
							})
						}
						size="sm"
						variant="ghost"
					>
						Link
					</AppButton>
					<AppButton
						data-cy="reset"
						icon={Undo2}
						onPress={reset}
						size="sm"
						variant="ghost"
					>
						Reset
					</AppButton>
				</div>

				{/*
				 * The marks and the alignment are mirrored onto data attributes as
				 * well as onto classes. A spec that asserted `font-bold` would be
				 * asserting a styling decision - rename the utility and the test goes
				 * red over nothing - so the state is exposed as data and the classes
				 * are left to be a styling concern.
				 */}
				<p
					className={cn(
						"p-4 text-sm",
						ALIGNMENT_CLASS[align],
						marks.has("bold") && "font-bold",
						marks.has("italic") && "italic",
						marks.has("underline") && "underline",
					)}
					data-align={align}
					data-cy="preview"
					data-marks={marks.size === 0 ? "none" : [...marks].sort().join(" ")}
				>
					A toggle button applies to something you can see, the moment you press it. Watch this paragraph rather than
					the toolbar - if pressing a control does not change anything on screen until you press Save, it was never a
					toggle button.
				</p>
			</div>

			<p className="text-sm text-muted">
				Marks:{" "}
				<span
					className="font-medium"
					data-cy="marks-state"
				>
					{marks.size === 0 ? "none" : [...marks].join(", ")}
				</span>{" "}
				· Align:{" "}
				<span
					className="font-medium"
					data-cy="align-state"
				>
					{align}
				</span>
			</p>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */
/* Reference                                                                  */
/* -------------------------------------------------------------------------- */

/** The choice this component gets substituted for most often. */
function NotACheckboxSection() {
	const [isGrid, setIsGrid] = useState(true);
	/*
	 * AppCheckbox and AppSwitch are RHF-bound by design - `control` and `name`
	 * are required, which is what stops an unwired consent box from ever
	 * existing. A form with two fields is the cheapest honest way to stand them
	 * beside a toggle here; reaching for HeroUI's raw Checkbox to avoid it would
	 * make this section a demonstration of the wrong thing.
	 */
	// `useForm`, not `useAppForm`, deliberately: a `control` for the specimen, not
	// a form. Nothing here is submitted. See the note in date-picker.tsx.
	const { control } = useForm({
		defaultValues: { defaultToGrid: true, notify: false },
	});

	return (
		<LabSection
			description="Three controls that all hold a boolean, and are not interchangeable. The toggle applies NOW to something on screen. The checkbox states an intention that a Save button later commits. The switch is a setting that stays on after you leave. Picking the wrong one changes what the user thinks pressing it did."
			title="Not a checkbox, not a switch"
			usedIn={["Any screen where a boolean control is about to be chosen"]}
		>
			<div className="grid gap-4 md:grid-cols-3">
				<Specimen caption="Toggle button - the list below changes as you press it.">
					<AppToggleButton
						data-cy="mode-toggle"
						isSelected={isGrid}
						onChange={setIsGrid}
					>
						{isGrid ? (
							<LayoutGrid
								aria-hidden="true"
								className="size-4"
							/>
						) : (
							<List
								aria-hidden="true"
								className="size-4"
							/>
						)}
						{isGrid ? "Grid" : "List"}
					</AppToggleButton>
					<div
						className={isGrid ? "grid grid-cols-3 gap-2" : "flex flex-col gap-2"}
						data-cy="mode-result"
					>
						{[1, 2, 3].map((item) => (
							<div
								className="rounded-lg bg-muted-surface px-3 py-2 text-xs text-muted"
								key={item}
							>
								Item {item}
							</div>
						))}
					</div>
				</Specimen>
				<Specimen caption="Checkbox - nothing happens until Save. Uncheck it and nothing on screen has changed yet.">
					<AppCheckbox
						control={control}
						label="Default to grid view"
						name="defaultToGrid"
					/>
				</Specimen>
				<Specimen caption="Switch - a setting, committed on the spot, that outlives this screen.">
					<AppSwitch
						control={control}
						label="Email me about imports"
						name="notify"
					/>
				</Specimen>
			</div>
		</LabSection>
	);
}

function VariantSection() {
	const [selected, setSelected] = useState<Set<string>>(new Set(["default"]));

	const toggle = (key: string) => (isSelected: boolean) => {
		setSelected((current) => {
			const next = new Set(current);
			if (isSelected) next.add(key);
			else next.delete(key);
			return next;
		});
	};

	return (
		<LabSection
			description="Two variants, and only two. AppButton's seven are semantic - they name what an action does to the user's data, and a toggle does none of those things; it flips a mode. `ghost` has no resting border, so it only becomes visible when pressed or hovered - use it inside a toolbar that already has its own frame, as the section above does, and not as a lone control on a plain surface, where an unpressed ghost toggle is indistinguishable from a label."
			title="Variant"
			usedIn={["ghost: inside a framed toolbar", "default: a lone toggle on a plain surface"]}
		>
			<Row>
				{(["default", "ghost"] as const).map((variant) => (
					<div
						className="flex flex-col items-center gap-2"
						key={variant}
					>
						<AppToggleButton
							data-cy={`variant-${variant}`}
							isSelected={selected.has(variant)}
							onChange={toggle(variant)}
							variant={variant}
						>
							<LayoutGrid
								aria-hidden="true"
								className="size-4"
							/>
							{variant}
						</AppToggleButton>
						<span className="text-xs text-muted">{selected.has(variant) ? "pressed" : "not pressed"}</span>
					</div>
				))}
			</Row>
		</LabSection>
	);
}

function SizeSection() {
	const [size, setSize] = useState<string | null>("md");

	return (
		<LabSection
			description="Three sizes. On a touch surface `sm` is below the 44px target the rest of the app holds to, so it belongs in a desktop toolbar - which is exactly where the section at the top of this page uses it - rather than in anything a thumb has to hit."
			title="Size"
			usedIn={["sm: desktop toolbars", "md: everywhere else", "lg: touch targets"]}
		>
			<Row>
				{(["sm", "md", "lg"] as const).map((option) => (
					<AppToggleButton
						data-cy={`size-${option}`}
						isSelected={size === option}
						key={option}
						onChange={() => setSize(option)}
						size={option}
					>
						<List
							aria-hidden="true"
							className="size-4"
						/>
						{option}
					</AppToggleButton>
				))}
			</Row>
		</LabSection>
	);
}

function StatesSection() {
	const [isSelected, setIsSelected] = useState(true);

	return (
		<LabSection
			description="Disabled in both states. A disabled toggle still has to say which state it is stuck in - a greyed-out control that also loses its pressed styling reads as 'off', and it is just as likely to be on. Both of these still report aria-pressed, so a screen reader gets the half the styling cannot carry."
			title="Disabled"
			usedIn={["A formatting control the current selection cannot take", "A layer the map is too zoomed out to draw"]}
		>
			<Row>
				<AppToggleButton
					data-cy="disabled-off"
					isDisabled
					isSelected={false}
					onChange={() => undefined}
				>
					<Bold
						aria-hidden="true"
						className="size-4"
					/>
					Disabled, off
				</AppToggleButton>
				<AppToggleButton
					data-cy="disabled-on"
					isDisabled
					isSelected
					onChange={() => undefined}
				>
					<Bold
						aria-hidden="true"
						className="size-4"
					/>
					Disabled, on
				</AppToggleButton>
				<AppToggleButton
					data-cy="enabled"
					isSelected={isSelected}
					onChange={setIsSelected}
				>
					<Bold
						aria-hidden="true"
						className="size-4"
					/>
					Enabled, for comparison
				</AppToggleButton>
			</Row>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function Divider() {
	return (
		<span
			aria-hidden="true"
			className="mx-1 h-5 w-px shrink-0 bg-border"
		/>
	);
}

function Specimen({ caption, children }: { caption: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
			<div className="flex flex-1 flex-col gap-3">{children}</div>
			<p className="text-xs text-muted">{caption}</p>
		</div>
	);
}

function Row({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap items-center gap-3">{children}</div>;
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
