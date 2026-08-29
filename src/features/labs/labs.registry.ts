import type { LucideIcon } from "lucide-react";
import {
	AlertTriangle,
	AppWindow,
	BadgeCheck,
	Bell,
	BellDot,
	Calendar,
	CalendarDays,
	CalendarRange,
	ChartArea,
	ChartColumn,
	ChartLine,
	ChartPie,
	ChevronDown,
	ChevronsUpDown,
	CircleAlert,
	CircleDashed,
	CircleDot,
	CircleDotDashed,
	CircleHelp,
	CircleUser,
	Clock,
	CloudUpload,
	Command,
	Compass,
	Crosshair,
	FileQuestion,
	Fingerprint,
	GalleryHorizontal,
	Gauge,
	Globe,
	HardDriveUpload,
	Hash,
	History,
	Images,
	Inbox,
	KeyRound,
	Layers,
	LayoutTemplate,
	List,
	ListChecks,
	ListFilter,
	ListOrdered,
	Loader,
	Lock,
	MessageSquareText,
	MessagesSquare,
	Milestone,
	MousePointerClick,
	Newspaper,
	OctagonAlert,
	Palette,
	PanelBottom,
	PanelLeft,
	PanelRight,
	PanelsTopLeft,
	PanelTop,
	PenLine,
	Plus,
	Radar,
	Rows3,
	Search,
	SkipForward,
	Slash,
	Square,
	SquareCheck,
	SquarePen,
	SquareStack,
	Star,
	SunMoon,
	SwatchBook,
	Table2,
	Tag,
	Tags,
	TextCursorInput,
	ToggleLeft,
	ToggleRight,
	TrendingUp,
	Users,
	X,
} from "lucide-react";

/**
 * THE index of the component labs. There is no second list.
 *
 * Both surfaces that enumerate the labs read this file: the nav in
 * `features/labs/components/LabNavPanel.tsx` - the standing column and the
 * compact drawer are one component - and the card grid in
 * `routes/(references)/components/index.tsx`. They used to keep their own
 * arrays, which meant every new lab had to be added twice and the two had
 * already drifted. Add a lab route, add one entry here.
 *
 * The group HEADINGS mirror `markdowns/Web/Labs Component Checklist.md` - that
 * file is the plan, this one is what has been built against it, and keeping the
 * headings identical is what lets the two be read side by side. Their ORDER no
 * longer matches: see `LAB_GROUPS`. Entries whose page is still a `LabStub` are
 * marked `isStub`, so the checklist's `[]` boxes and the app's placeholders
 * cannot disagree.
 *
 * Whether a lab is DONE is NOT here - `isStub` only says whether the page has
 * anything on it. That is a judgement, kept by hand in `labs.status.json` and
 * read through `labs.status.ts`, joined to these entries by `to`.
 */
export interface LabEntry {
	/** One line on the index card and nowhere else. Say what the lab shows. */
	blurb: string;
	icon: LucideIcon;
	/** True while the route renders a `LabStub` - a title and a scope, no specimen. */
	isStub?: boolean;
	label: string;
	to: string;
}

export interface LabGroup {
	heading: string;
	labs: LabEntry[];
}

/**
 * Alphabetical, both levels: groups A-Z, and labs A-Z inside each group.
 *
 * Alphabetical is the only ordering a reader can predict once a list passes
 * about six rows, and this one is fifteen groups and eighty-odd labs. The
 * groups used to follow the checklist's order, which was a second axis nobody
 * browsing could guess - and the tell was that its tail ("Unknowns", then
 * "Reusable", "Utilities", "Reference") had already drifted out of any order at
 * all. The GROUPING still carries the meaning; only its sequence is mechanical.
 *
 * Keep both sorted when adding a lab. Nothing enforces it.
 *
 * ## The one group that is not in that order
 *
 * `Project Components` is PINNED FIRST, above the alphabetical run, and holds
 * the labs for this project's own components - the ones in
 * `components/project/`. It is the only group that does not mirror the
 * checklist, because it does not sort by what a component IS: it is the line
 * between what this project owns and what it installs from
 * `@bernardsapida/web-ui`.
 *
 * Filed under `Data display` instead, a project component would sit between two
 * package components and read as one - which is how somebody ends up trying to
 * fix it by editing the package, or losing an edit to the next `pnpm up`. The
 * sidebar is the only place that distinction is visible, so it gets a heading
 * rather than an inference.
 */
export const LAB_GROUPS: LabGroup[] = [
	{
		/*
		 * THIS PROJECT'S OWN. Nothing here is published, and nothing here is
		 * replaced by an upgrade - see the rule in CLAUDE.md before adding one.
		 */
		heading: "Project Components",
		labs: [
			{
				blurb: "The account card in the sidebar foot, and the menu it opens.",
				icon: CircleUser,
				label: "Card user",
				to: "/components/card-user",
			},
		],
	},
	{
		heading: "Buttons",
		labs: [
			{
				blurb: "Every variant, size and state, plus the async loading button.",
				icon: MousePointerClick,
				label: "Button",
				to: "/components/button",
			},
			{
				blurb: "The dismiss affordance overlays and chips share, at the one size a thumb can still hit.",
				icon: X,
				isStub: true,
				label: "Close button",
				to: "/components/close-button",
			},
			{
				blurb: "Light, dark, or follow the system - and the control that proves every token moves with it.",
				icon: SunMoon,
				label: "Theme toggle",
				to: "/components/theme-toggle",
			},
			{
				blurb: "A button that stays pressed, and the two controls it keeps getting substituted for.",
				icon: ToggleLeft,
				label: "Toggle button",
				to: "/components/toggle-button",
			},
		],
	},
	{
		heading: "Charts",
		labs: [
			{
				blurb: "A filled trend over time, and what the fill claims that a line does not.",
				icon: ChartArea,
				isStub: true,
				label: "Area chart",
				to: "/components/area-chart",
			},
			{
				blurb: "Categories against a common baseline - grouped, stacked, and horizontal when the labels are long.",
				icon: ChartColumn,
				isStub: true,
				label: "Bar chart",
				to: "/components/bar-chart",
			},
			{
				blurb: "The readout every chart here shares: one hovered point, every series, aligned units.",
				icon: Crosshair,
				isStub: true,
				label: "Chart tooltip",
				to: "/components/chart-tooltip",
			},
			{
				blurb: "One or more series over time, with the gaps that mean missing rather than zero.",
				icon: ChartLine,
				isStub: true,
				label: "Line chart",
				to: "/components/line-chart",
			},
			{
				blurb: "Parts of one whole, and the slice count past which this is the wrong chart.",
				icon: ChartPie,
				isStub: true,
				label: "Pie chart",
				to: "/components/pie-chart",
			},
			{
				blurb: "Several measures on one shape, for comparing profiles rather than reading values.",
				icon: Radar,
				isStub: true,
				label: "Radar chart",
				to: "/components/radar-chart",
			},
			{
				blurb: "Progress wound into an arc, with the value read from the centre rather than the sweep.",
				icon: CircleDotDashed,
				isStub: true,
				label: "Radial chart",
				to: "/components/radial-chart",
			},
		],
	},
	{
		heading: "Collections",
		labs: [
			{
				blurb: "Actions on one subject, with sections, icons and the destructive item set apart.",
				icon: ChevronDown,
				label: "Dropdown menu",
				to: "/components/dropdown",
			},
			{
				blurb: "A setting that applies the moment it moves - no Save, and no confirmation.",
				icon: ToggleRight,
				isStub: true,
				label: "Switch",
				to: "/components/switch",
			},
			{
				blurb: "A row of tags as labels, as a multi-select, or as removable chips.",
				icon: Tags,
				label: "Tag group",
				to: "/components/tag-group",
			},
		],
	},
	{
		heading: "Data display",
		labs: [
			{
				blurb: "A count or a dot pinned to a corner, and why zero has to unmount rather than fade.",
				icon: BellDot,
				label: "Badge",
				to: "/components/badge",
			},
			{
				blurb:
					"A deck of pictures in a square that never resizes - every shape fitted whole, never cropped - and the full-size viewer behind it.",
				icon: GalleryHorizontal,
				label: "Carousel",
				to: "/components/carousel",
			},
			{
				blurb: "The smallest label in the app. Icon and text, always both.",
				icon: Tag,
				label: "Chip",
				to: "/components/chip",
			},
			{
				blurb: "Nothing here, and what to do about it: icon, title, description, one action. Never a blank panel.",
				icon: Inbox,
				isStub: true,
				label: "Empty state",
				to: "/components/empty-state",
			},
			{
				blurb: "A grid of images - fixed squares, and a dynamic-size layout that keeps every aspect ratio.",
				icon: Images,
				isStub: true,
				label: "Gallery",
				to: "/components/gallery",
			},
			{
				blurb:
					"One number a dashboard leads with: a trend line with a readout on hover, a bar against a ceiling, or nothing at all.",
				icon: TrendingUp,
				label: "KPI",
				to: "/components/kpi",
			},
			{
				blurb:
					"The row primitive the users list is one configuration of. Four slots, one surface, and a keyboard route for reordering.",
				icon: List,
				label: "List",
				to: "/components/list",
			},
			{
				blurb: "The router's 404. Back before home, and never a dead end.",
				icon: FileQuestion,
				label: "Not found",
				to: "/components/not-found",
			},
			{
				blurb: "Who someone is, and whether anyone has checked. Verified and not verified.",
				icon: BadgeCheck,
				label: "Profile banner",
				to: "/components/profile-banner",
			},
			{
				blurb: "Progress through a multi-step form: circles on desktop, a progress bar on mobile.",
				icon: ListOrdered,
				label: "Stepper",
				to: "/components/stepper",
			},
			{
				blurb: "Filter bar, rows of ten, sticky actions, and an empty state per reason.",
				icon: Table2,
				label: "Table",
				to: "/components/table",
			},
			{
				blurb: "What happened and who did it. One rail, sticky day headers, and relative time over an exact instant.",
				icon: History,
				label: "Timeline",
				to: "/components/timeline",
			},
			{
				blurb: "A vertical run of steps reporting on something happening elsewhere.",
				icon: Milestone,
				label: "Tracking",
				to: "/components/tracking",
			},
			{
				blurb: "A roster of people: avatar, name, role, email, presence, one action per row.",
				icon: Users,
				label: "Users list",
				to: "/components/users-list",
			},
		],
	},
	{
		heading: "Date and time",
		labs: [
			{
				blurb: "The month grid on its own, as a page-level control rather than a popover.",
				icon: Calendar,
				isStub: true,
				label: "Calendar",
				to: "/components/calendar",
			},
			{
				blurb: "One to three months by width, presets, and bounds said out loud rather than greyed in silence.",
				icon: CalendarDays,
				label: "Date picker",
				to: "/components/date-picker",
			},
			{
				blurb: "Presets on the left, one to three months on the right, and nothing written until Apply.",
				icon: CalendarRange,
				label: "Date range",
				to: "/components/date-range-picker",
			},
			{
				blurb: "A wheel for HH : MM AM/PM, for the case where segments are the wrong input on a phone.",
				icon: Clock,
				isStub: true,
				label: "Time picker",
				to: "/components/time-picker",
			},
		],
	},
	{
		heading: "Feedback",
		labs: [
			{
				blurb: "The inline severity block - the one the error state is built from, on its own.",
				icon: CircleAlert,
				isStub: true,
				label: "Alert",
				to: "/components/alert",
			},
			{
				blurb: "The persistent surface. A gradient status tile, text, and up to two actions.",
				icon: AlertTriangle,
				label: "Banner",
				to: "/components/banner",
			},
			{
				blurb: "A failure a person can act on: what broke, why, and the way out.",
				icon: OctagonAlert,
				label: "Error state",
				to: "/components/error-state",
			},
			{
				blurb: "Determinate progress along a line - and why indeterminate is not the same as zero.",
				icon: Gauge,
				label: "Progress bar",
				to: "/components/progress-bar",
			},
			{
				blurb: "The same measurement wound into a ring, and the layout that makes a ring the wrong answer.",
				icon: CircleDashed,
				label: "Progress circle",
				to: "/components/progress-circle",
			},
			{
				blurb: "A rating as stars and as a distribution summary, filled to a real fraction rather than a half-glyph.",
				icon: Star,
				label: "Star rating",
				to: "/components/star-rating",
			},
		],
	},
	{
		heading: "Forms",
		labs: [
			{
				blurb: "One choice from a long or fetched list. Closed it reads as a Select; the search lives in the popover.",
				icon: ListFilter,
				label: "Autocomplete",
				to: "/components/autocomplete",
			},
			{
				blurb: "A single boolean, and the button-group variant that is a checkbox wearing a card.",
				icon: SquareCheck,
				label: "Checkbox",
				to: "/components/checkbox",
			},
			{
				blurb: "Several booleans under one label, one legend, and one error message.",
				icon: ListChecks,
				label: "Checkbox group",
				to: "/components/checkbox-group",
			},
			{
				blurb: "A list you can type PAST, not just into - the one thing Autocomplete structurally cannot do.",
				icon: TextCursorInput,
				label: "ComboBox",
				to: "/components/combo-box",
			},
			{
				blurb: "Drag and drop with a click fallback, per-file progress, and a retry that keeps the file.",
				icon: CloudUpload,
				label: "Drop zone",
				to: "/components/drop-zone",
			},
			{
				blurb: "Canonical react-hook-form + HeroUI wiring for every App* field, on one page.",
				icon: TextCursorInput,
				label: "Form reference",
				to: "/components/form-reference",
			},
			{
				blurb: "The standard text input and its affixes, bound to a form or standing alone. Both are optional.",
				icon: TextCursorInput,
				label: "Input group",
				to: "/components/input-group",
			},
			{
				blurb: "A one-time code across separate boxes, with paste filling all of them at once.",
				icon: KeyRound,
				label: "Input OTP",
				to: "/components/input-otp",
			},
			{
				blurb: "A number with a locale-aware format, min/max, and no way to type letters into it.",
				icon: Hash,
				isStub: true,
				label: "Number field",
				to: "/components/number-field",
			},
			{
				blurb: "Plus and minus around a quantity, for the case where typing the number is the rare path.",
				icon: Plus,
				label: "Number stepper",
				to: "/components/number-stepper",
			},
			{
				blurb: "An input group with a visibility toggle in the suffix, and the rules that come with hiding a value.",
				icon: Lock,
				label: "Password",
				to: "/components/password",
			},
			{
				blurb: "One choice from a visible few, plain and as a card group with descriptions.",
				icon: CircleDot,
				label: "Radio button group",
				to: "/components/radio-group",
			},
			{
				blurb: "A Tiptap editor bound to RHF, with the document it stores visible underneath as you type.",
				icon: PenLine,
				label: "Rich text editor",
				to: "/components/text-editor",
			},
			{
				blurb: "A field, and a panel under it that is never blank: recents, results, no results.",
				icon: Search,
				label: "Search bar",
				to: "/components/search-bar",
			},
			{
				blurb: "One choice from a short, closed list. No typing - the whole list is visible at once.",
				icon: ChevronsUpDown,
				label: "Select",
				to: "/components/select",
			},
			{
				blurb: "Multi-line text: where it grows, where it scrolls, and where the counter goes.",
				icon: SquarePen,
				label: "Textarea",
				to: "/components/textarea",
			},
		],
	},
	{
		heading: "Layout",
		labs: [
			{
				blurb:
					"The supporting pane. What is allowed in it, which side it takes, and where it goes when there is no room.",
				icon: PanelRight,
				label: "App aside",
				to: "/components/app-aside",
			},
			{
				blurb:
					"The assembly: header, optional sidebar, main, optional aside - and the decisions only the frame can make.",
				icon: LayoutTemplate,
				label: "App layout",
				to: "/components/app-layout",
			},
			{
				blurb: "The content region: one landmark, one measure, and deliberately no grid - that part is the page's.",
				icon: Square,
				label: "App main",
				to: "/components/app-main",
			},
			{
				blurb:
					"The standing nav column: labels or an icon rail, floating or flush, and the drawer it becomes on a phone.",
				icon: PanelLeft,
				label: "App sidebar",
				to: "/components/app-sidebar",
			},
			{
				blurb:
					"One subject, one surface. A whole-card link or actions - never both - and a grid that keeps its baseline.",
				icon: SquareStack,
				label: "Card",
				to: "/components/card",
			},
			{
				blurb:
					"SIGNED-IN. Breadcrumbs, page actions, and the trigger that toggles the sidebar between rail, labels and drawer.",
				icon: PanelTop,
				label: "Dashboard header",
				to: "/components/app-header",
			},
			{
				blurb: "SIGNED-OUT. Logo, destinations, actions - plain links, or menus opening a panel that spans the bar.",
				icon: Globe,
				label: "Site header",
				to: "/components/app-site-header",
			},
			{
				blurb: "The elevation primitive under every card and panel, and the context it hands its children.",
				icon: Layers,
				isStub: true,
				label: "Surface",
				to: "/components/surface",
			},
		],
	},
	{
		heading: "Media",
		labs: [
			{
				blurb:
					"A person at every size, the gradient initials that stand in when there is no photo, and the stack that makes a team one object.",
				icon: CircleUser,
				label: "Avatar",
				to: "/components/avatar",
			},
		],
	},
	{
		heading: "Navigation",
		labs: [
			{
				blurb: "Single, multiple and controlled - plus the content that breaks it.",
				icon: Rows3,
				label: "Accordion",
				to: "/components/accordion",
			},
			{
				blurb: "Where you are, past two levels of it. Collapses in the middle, and to one back link on a phone.",
				icon: Slash,
				label: "Breadcrumbs",
				to: "/components/breadcrumbs",
			},
			{
				blurb: "The keyboard palette: one field over every destination and action, grouped and ranked.",
				icon: Command,
				isStub: true,
				label: "Command",
				to: "/components/command",
			},
			{
				blurb:
					"Bottom tabs, a sidebar, a rail and a drawer for the signed-in app - and the public site header, floating or solid, for everyone else.",
				icon: Compass,
				label: "Navigation",
				to: "/components/navigation",
			},
			{
				blurb: "Peer views of one subject, and the guard that stops re-clicking the active tab from refetching.",
				icon: PanelsTopLeft,
				label: "Tabs",
				to: "/components/tabs",
			},
		],
	},
	{
		heading: "Overlays",
		labs: [
			{
				blurb: "The decision surface. Five tones, type-to-confirm, and what it locks while the answer is processing.",
				icon: CircleHelp,
				label: "Dialog",
				to: "/components/dialog",
			},
			{
				blurb: "A task done beside the list, not on top of it. Right on a desktop, a bottom sheet on a phone.",
				icon: PanelRight,
				label: "Drawer",
				to: "/components/drawer",
			},
			{
				blurb: "A short task on top of the page: one primary action, an internal scroll, and a dirty guard.",
				icon: AppWindow,
				label: "Modal",
				to: "/components/modal",
			},
			{
				blurb: "The transient surface. Five severities, stacking, timing and the loading states.",
				icon: Bell,
				label: "Toast",
				to: "/components/toaster",
			},
			{
				blurb: "A plain label, and the enriched card that replaces it when there is more to say.",
				icon: MessageSquareText,
				label: "Tooltip & popover",
				to: "/components/tooltip",
			},
		],
	},
	{
		/*
		 * NOT component labs. Both document the palette every lab draws from
		 * rather than a single component, and they answer opposite questions.
		 * Design tokens is what the tokens ARE as committed - the page you open
		 * when something looks wrong, and the URL AppDesignReference.cy.ts pins,
		 * which makes it the only regression harness the token layer has. Theme
		 * customizer is what the tokens COULD be, opened once at the start of a
		 * project. Deleting either leaves a real gap.
		 */
		heading: "Reference",
		labs: [
			{
				blurb: "Every token, gradient and surface the app is built from, on one page.",
				icon: Palette,
				label: "Design tokens",
				to: "/components/design-reference",
			},
			{
				blurb:
					"The real bucket, end to end - presign, upload, public URL. Open it first after filling in the AWS keys.",
				icon: HardDriveUpload,
				label: "S3 upload",
				to: "/components/s3-upload",
			},
			{
				blurb:
					"Pick the palette, face and radius scales, with the contrast of every pairing measured beside the preview.",
				icon: SwatchBook,
				label: "Theme customizer",
				to: "/components/theme-customizer",
			},
		],
	},
	{
		/*
		 * ASSEMBLIES, not components. Each is built from parts that already have
		 * labs above - what is being reviewed is the arrangement, and an
		 * arrangement has nowhere else to live. A developer who cannot find one of
		 * these rebuilds it in their own feature folder, and then there are two.
		 */
		heading: "Reusable",
		labs: [
			{
				blurb:
					"The whole reading view of a post - banner, byline, body, comments - assembled from parts that each have a lab.",
				icon: Newspaper,
				label: "Blog post",
				to: "/components/blog-post",
			},
			{
				blurb: "A conversation that reads down, one level of replies, @mentions, and text that never goes missing.",
				icon: MessagesSquare,
				label: "Comments",
				to: "/components/comments",
			},
			{
				blurb: "The closing band: brand, social, columns and the small print - and why it centres on a phone.",
				icon: PanelBottom,
				label: "Site footer",
				to: "/components/app-site-footer",
			},
		],
	},
	{
		heading: "Utilities",
		labs: [
			{
				blurb: "The press response every interactive surface shares - scale, ripple, and hold-to-confirm.",
				icon: Fingerprint,
				isStub: true,
				label: "Pressable feedback",
				to: "/components/pressable-feedback",
			},
			{
				blurb: "The thin bar at the top during a navigation. Renders null; drives a singleton.",
				icon: Loader,
				label: "Route progress",
				to: "/components/route-progress",
			},
			{
				blurb:
					"The first focusable thing on every page, and the only component here you cannot see without a keyboard.",
				icon: SkipForward,
				label: "Skip to content",
				to: "/components/skip-to-content",
			},
		],
	},
];

/** Every lab, flattened. For search, for the "you are here" label, for counts. */
export const ALL_LABS: LabEntry[] = LAB_GROUPS.flatMap((group) => group.labs);
