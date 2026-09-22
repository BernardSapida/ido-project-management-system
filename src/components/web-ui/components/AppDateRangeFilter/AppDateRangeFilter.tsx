import { useMediaQuery } from "../../internal";
import { Button, DateField, Drawer, Popover, RangeCalendar } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import { endOfMonth, getLocalTimeZone, today } from "@internationalized/date";
import { CalendarRange, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { AppButton } from "../AppButton";
import { cn } from "../../lib/cn";

export interface DateRangeValue {
	end: CalendarDate;
	start: CalendarDate;
}

export interface DateRangePreset {
	key: string;
	label: string;
	/** Resolved against today, so "Last 7 days" cannot go stale in a module constant. */
	resolve: (today: CalendarDate) => DateRangeValue;
}

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

/*
 * Formatted by hand rather than through `DateFormatter`. A CalendarDate has to
 * be turned into a JS Date to reach Intl, and that conversion needs a time zone
 * - which on the server is the server's. The trigger label renders during SSR,
 * so an Intl round trip is a hydration mismatch waiting for the first user in
 * another zone. These strings are pure functions of the calendar fields.
 */
const formatDay = (date: CalendarDate) => `${MONTHS_SHORT[date.month - 1]} ${date.day}, ${date.year}`;
const formatMonth = (date: CalendarDate) => `${MONTHS_LONG[date.month - 1]} ${date.year}`;

const isSameDate = (a: CalendarDate, b: CalendarDate) => a.compare(b) === 0;
const isSameRange = (a: DateRangeValue | null, b: DateRangeValue | null) =>
	a != null && b != null && isSameDate(a.start, b.start) && isSameDate(a.end, b.end);

/** Whole months from `a` to `b`, signed. The unit the month group navigates in. */
const monthsBetween = (a: CalendarDate, b: CalendarDate) => (b.year - a.year) * 12 + (b.month - a.month);

/**
 * How many columns of years the picker offers, by month count. The same
 * convention as `AppDatePicker`: three per month grid at every size, so a year
 * cell is the same width whether one month is showing or three.
 *
 * Written out rather than computed - Tailwind scans source text for class names,
 * and a template literal produces no CSS at all.
 */
const YEAR_GRID_COLUMNS = ["grid-cols-3", "grid-cols-6", "grid-cols-9"];

/** How many month grids the range touches - 1 Jan to 2 Feb is two, not one. */
const monthSpan = (range: DateRangeValue) => monthsBetween(range.start, range.end) + 1;

/**
 * A range that is exactly a calendar period gets that period's name.
 *
 * A preset is a name, not a set of dates, and the reverse holds too: "Q1 2026"
 * is what someone asked for, while "Jan 1, 2026 - Mar 31, 2026" is what they
 * have to decode back into it. Only exact periods qualify - a range one day
 * short of a quarter is not that quarter and must not claim to be.
 */
function namePeriod(range: DateRangeValue): string | null {
	const { end, start } = range;
	if (start.year !== end.year || start.day !== 1 || end.day !== endOfMonth(end).day) {
		return null;
	}
	if (start.month === 1 && end.month === 12) {
		return `${start.year}`;
	}
	if (start.month === end.month) {
		return formatMonth(start);
	}
	const quarter = Math.floor((start.month - 1) / 3) + 1;
	if (start.month === (quarter - 1) * 3 + 1 && end.month === quarter * 3) {
		return `Q${quarter} ${start.year}`;
	}
	return null;
}

/**
 * Both ends, with the year written ONCE.
 *
 * "Aug 2, 2026 - Oct 23, 2026" says 2026 twice and puts a comma in the middle of
 * each end, so the eye has to parse four numbers to find the two that differ.
 * A range inside one year is "Aug 2 - Oct 23, 2026"; only a range that crosses
 * a year boundary needs both years, and then it has earned them.
 */
function formatRange(range: DateRangeValue): string {
	const { end, start } = range;
	if (isSameDate(start, end)) {
		return formatDay(start);
	}
	if (start.year !== end.year) {
		return `${formatDay(start)} - ${formatDay(end)}`;
	}
	return `${MONTHS_SHORT[start.month - 1]} ${start.day} - ${MONTHS_SHORT[end.month - 1]} ${end.day}, ${end.year}`;
}

/** "Q1 2026" where the range is exactly a period, the dates otherwise. */
function describeRange(range: DateRangeValue): string {
	return namePeriod(range) ?? formatRange(range);
}

/* -------------------------------------------------------------------------- */
/* Presets                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The answer roughly nine times in ten. Nobody wants to click twice on a grid to
 * say "this month", and every one of these is a range whose ends a user would
 * otherwise have to work out from a calendar.
 */
export const DEFAULT_DATE_RANGE_PRESETS: DateRangePreset[] = [
	{ key: "today", label: "Today", resolve: (now) => ({ end: now, start: now }) },
	{
		key: "yesterday",
		label: "Yesterday",
		resolve: (now) => ({ end: now.subtract({ days: 1 }), start: now.subtract({ days: 1 }) }),
	},
	{ key: "last-7", label: "Last 7 days", resolve: (now) => ({ end: now, start: now.subtract({ days: 6 }) }) },
	{ key: "last-30", label: "Last 30 days", resolve: (now) => ({ end: now, start: now.subtract({ days: 29 }) }) },
	{
		key: "last-quarter",
		label: "Last quarter",
		resolve: (now) => {
			// The previous COMPLETE quarter, not the last three months: someone
			// asking for a quarter wants a period a report can be run against.
			const currentQuarterStart = now.set({ day: 1, month: Math.floor((now.month - 1) / 3) * 3 + 1 });
			const start = currentQuarterStart.subtract({ months: 3 });
			return { end: endOfMonth(start.add({ months: 2 })), start };
		},
	},
];

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

interface AppDateRangeFilterProps {
	className?: string;
	"data-cy"?: string;
	isDisabled?: boolean;
	/** Names the control for assistive tech and heads the mobile sheet. */
	label?: string;
	maxValue?: CalendarDate;
	minValue?: CalendarDate;
	onChange: (value: DateRangeValue | null) => void;
	presets?: DateRangePreset[];
	/** The committed range. `null` is "no range set", which is not the same as today. */
	value: DateRangeValue | null;
}

/**
 * The date range picker: a trigger showing the resolved range, a typed field
 * beside it, and a popover holding a presets rail and one to three month grids.
 *
 * Not to be confused with `components/form/AppDateRangePicker`, which is the
 * react-hook-form field. This one is the standalone control - it commits on
 * Apply and reports a plain value, which is what a filter above a table or a
 * date scope on a dashboard needs.
 *
 * Three things make it worth its size over a pair of date inputs:
 *
 * - The month count is RESPONSIVE - 3 wide, 2 at laptop width, 1 on a phone -
 *   because a range crosses a month boundary more often than not, and a single
 *   grid makes the user page forward mid-gesture, clicking an arrow with a start
 *   date already down on a grid that has just repainted under the cursor. Three
 *   is the ceiling: it covers a quarter, and a fourth grid makes the popover
 *   wider than the table it is filtering.
 * - The presets are the answer most of the time, and each one repositions the
 *   grids to frame the range it just set - a preset that leaves the user hunting
 *   for the months holding its result is two clicks, not one.
 * - Nothing is written until Apply. A range is two values; committing on the
 *   first click filters the table to a one-day range while the user is still
 *   mid-gesture.
 */
export function AppDateRangeFilter({
	className,
	"data-cy": dataCy,
	isDisabled,
	label = "Date range",
	maxValue,
	minValue,
	onChange,
	presets = DEFAULT_DATE_RANGE_PRESETS,
	value,
}: AppDateRangeFilterProps) {
	const [isOpen, setIsOpen] = useState(false);
	const hintId = useId();

	/*
	 * Three queries rather than one: the count is the ONLY thing that changes
	 * across breakpoints - same cell size, same rail, same header. A picker that
	 * also shrinks its cells to fit three months has three unusable grids where
	 * it could have had two good ones, so it drops a grid instead.
	 *
	 * 90rem for the third grid, not 80, matching `AppDatePicker`. The panel is
	 * the rail (144 + 12 + a border), a 16 gap, three 252 grids with 16 between
	 * them, and the popover dialog's own 16 either side - 993px, and it is
	 * anchored to the LEFT EDGE OF THE TRIGGER rather than to the page. A filter
	 * bar inside a sidebar layout starts around 330px in, so at 1280 the third
	 * grid runs off the right of the window; 1440 is the first width that clears
	 * it. A full-width page gives up a month of context between those two
	 * widths, which is the cheaper of the two losses.
	 */
	const isPhone = useMediaQuery("(width < 40rem)");
	const isWide = useMediaQuery("(width >= 90rem)");
	const isRoomForTwo = useMediaQuery("(width >= 48rem)");
	const monthCount = isPhone ? 1 : isWide ? 3 : isRoomForTwo ? 2 : 1;

	const hint = describeBounds(minValue, maxValue);

	/*
	 * Raw Button, deliberately - the only one left in this file. On desktop this
	 * element is handed to `Popover.Trigger`, which supplies the press handling
	 * and the expanded/controls wiring through React Aria's trigger context.
	 * AppButton passes an explicit prop list rather than spreading, so a trigger
	 * wrapped in it would render, typecheck, and silently never open.
	 *
	 * Everything else here - the presets, Cancel and Apply - is an AppButton.
	 */
	const trigger = (
		<Button
			aria-describedby={hint ? hintId : undefined}
			className="justify-between gap-2 font-normal"
			isDisabled={isDisabled}
			// On a phone the sheet is opened by hand; inside a Popover the
			// DialogTrigger supplies the press handler and this stays undefined.
			onPress={isPhone ? () => setIsOpen(true) : undefined}
			variant="secondary"
		>
			<CalendarRange
				aria-hidden="true"
				className="size-4 shrink-0 text-muted"
			/>
			{/*
			 * The DATES, not the period's name - deliberately the opposite of the
			 * header chip inside the popover. The chip names the period because it
			 * is confirming what a preset resolved to; the trigger is the only thing
			 * on the page saying what the filter is actually set to, and if both said
			 * "Q1 2026" nothing would ever tell the user which days that is.
			 *
			 * Nothing truncates either. A range cut off at "Aug 2 - Oct..." is a
			 * filter you have to open to read. The one-year form is short enough that
			 * the checklist's "fall back to the preset name when it will not fit"
			 * never gets to fire, so there is no budget here to tune.
			 */}
			<span className="whitespace-nowrap">{value ? formatRange(value) : `Select ${label.toLowerCase()}`}</span>
			<ChevronDown
				aria-hidden="true"
				className="size-4 shrink-0 text-muted"
			/>
		</Button>
	);

	const panelProps = {
		// The panel renders in a portal, outside this component's DOM, so it
		// carries its own hook rather than being reachable through the wrapper's.
		dataCy: dataCy ? `${dataCy}-panel` : undefined,
		label,
		maxValue,
		minValue,
		monthCount,
		onApply: (next: DateRangeValue | null) => {
			onChange(next);
			setIsOpen(false);
		},
		onCancel: () => setIsOpen(false),
		presets,
		value,
	};

	return (
		<div
			className={cn("flex flex-col gap-1.5", className)}
			data-cy={dataCy}
		>
			<div className="flex flex-wrap items-center gap-2">
				{isPhone ? (
					<>
						{trigger}
						{/*
						 * A sheet, not the popover. A 7-column grid at half the width of a
						 * phone has ~20px cells, so two grids side by side is not an option
						 * here - and a popover anchored to a trigger near the bottom of the
						 * screen has nowhere to go.
						 */}
						<Drawer.Backdrop
							isOpen={isOpen}
							onOpenChange={setIsOpen}
						>
							<Drawer.Content placement="bottom">
								{/* `max-h` as well as `h`: HeroUI caps a bottom drawer at 85vh in
								    the components layer, and a utility is the only thing that
								    outranks it. A range picker is one of the few sheets that
								    genuinely wants the height. */}
								<Drawer.Dialog className="h-[90dvh] max-h-[90dvh] gap-0 p-0">
									<RangePanel
										{...panelProps}
										isSheet
									/>
								</Drawer.Dialog>
							</Drawer.Content>
						</Drawer.Backdrop>
					</>
				) : (
					<Popover
						isOpen={isOpen}
						onOpenChange={setIsOpen}
					>
						<Popover.Trigger>{trigger}</Popover.Trigger>
						{/*
						 * `bottom start`, not the default centred `bottom`. This panel is
						 * far wider than its trigger, so centring hangs it off both sides
						 * and a trigger near the left of a filter bar pushes it off-screen.
						 * Aligning the left edges keeps it under the control it belongs to.
						 */}
						<Popover.Content
							className="max-w-[calc(100vw-2rem)]"
							placement="bottom start"
						>
							<Popover.Dialog>
								<RangePanel
									{...panelProps}
									isSheet={false}
								/>
							</Popover.Dialog>
						</Popover.Content>
					</Popover>
				)}

				<TypedRange
					isDisabled={isDisabled}
					maxValue={maxValue}
					minValue={minValue}
					onChange={onChange}
					value={value}
				/>
			</div>

			{/*
			 * The bound goes on the FIELD, not in a tooltip on the greyed days. A
			 * user who has just been refused a date is looking at the date, and a
			 * disabled cell is exactly the thing that cannot be hovered on touch.
			 */}
			{hint ? (
				<p
					className="text-xs text-muted"
					id={hintId}
				>
					{hint}
				</p>
			) : null}
		</div>
	);
}

function describeBounds(minValue?: CalendarDate, maxValue?: CalendarDate): string | null {
	if (minValue && maxValue) {
		return `Pick a range between ${formatDay(minValue)} and ${formatDay(maxValue)}.`;
	}
	if (minValue) {
		return `Dates before ${formatDay(minValue)} are not available.`;
	}
	if (maxValue) {
		return `Dates after ${formatDay(maxValue)} are not available.`;
	}
	return null;
}

/* -------------------------------------------------------------------------- */
/* Typed range                                                                 */
/* -------------------------------------------------------------------------- */

interface TypedRangeProps {
	isDisabled?: boolean;
	maxValue?: CalendarDate;
	minValue?: CalendarDate;
	onChange: (value: DateRangeValue | null) => void;
	value: DateRangeValue | null;
}

/**
 * Two segmented date fields beside the trigger.
 *
 * This is the only route to a date two years back that does not involve
 * twenty-four presses of a chevron, and the only one that works with no mouse
 * at all. It writes through as soon as both ends are set and in order - there is
 * no Apply here, because unlike the grid a typed date is one deliberate value
 * rather than the first half of a gesture.
 */
function TypedRange({ isDisabled, maxValue, minValue, onChange, value }: TypedRangeProps) {
	const [draft, setDraft] = useState<{ end: CalendarDate | null; start: CalendarDate | null }>(() => ({
		end: value?.end ?? null,
		start: value?.start ?? null,
	}));

	/*
	 * Reset during render rather than in an effect, and keyed on the dates' string
	 * form rather than on `value` itself. Callers build that object inline, so
	 * watching its identity would re-run on every render of the parent and fight
	 * whatever is half-typed in the fields.
	 */
	const committedKey = value ? `${value.start}/${value.end}` : "";
	const [lastCommittedKey, setLastCommittedKey] = useState(committedKey);
	if (lastCommittedKey !== committedKey) {
		setLastCommittedKey(committedKey);
		setDraft({ end: value?.end ?? null, start: value?.start ?? null });
	}

	const isBackwards = draft.start != null && draft.end != null && draft.end.compare(draft.start) < 0;

	const commit = (next: { end: CalendarDate | null; start: CalendarDate | null }) => {
		setDraft(next);
		if (next.start && next.end && next.end.compare(next.start) >= 0) {
			onChange({ end: next.end, start: next.start });
		}
	};

	return (
		<div className="flex items-center gap-2">
			<DateField
				aria-label="Range start"
				isDisabled={isDisabled}
				maxValue={maxValue}
				minValue={minValue}
				onChange={(next) => commit({ ...draft, start: next as CalendarDate | null })}
				value={draft.start}
			>
				<DateField.Group>
					<DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
				</DateField.Group>
			</DateField>
			<span
				aria-hidden="true"
				className="text-muted"
			>
				-
			</span>
			<DateField
				aria-label="Range end"
				isDisabled={isDisabled}
				isInvalid={isBackwards}
				maxValue={maxValue}
				minValue={minValue}
				onChange={(next) => commit({ ...draft, end: next as CalendarDate | null })}
				value={draft.end}
			>
				<DateField.Group>
					<DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
				</DateField.Group>
			</DateField>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Where the month group parks itself: the month it pivots on, and where in the
 * group that month sits.
 *
 * Both halves are needed because `visibleDuration` alone says nothing about
 * WHICH months are visible - React Aria derives that from the focused date and
 * `selectionAlignment` together, so a frame that names only the month lands
 * somewhere different at two grids than at three.
 */
interface Frame {
	align: "center" | "start";
	date: CalendarDate;
}

/**
 * Frame a range in `monthCount` grids.
 *
 * The pivot is always the range's START. It holds for every case, which is what
 * makes it predictable: an empty picker pivots on the current month, and a
 * preset pivots on the month its range begins in. A range whose beginning is
 * off-screen looks like the wrong range - the user can scroll forward to an end
 * they already know is there, but they cannot scroll to a start they never saw.
 *
 * The alignment is what makes the whole range visible whenever it fits. A range
 * at least as long as the group fills it from the left, so the start is the
 * first grid and the months after it are the ones the range actually covers. A
 * SHORTER range centres instead: pinning a single month to the left of three
 * grids spends the other two on months the range does not reach, and for a
 * backward-looking preset those two are the future. Centring spends one of them
 * on the month before, which is the one a user narrowing "this month" reaches
 * for next.
 */
function frameRange(range: DateRangeValue, monthCount: number): Frame {
	return { align: monthSpan(range) >= monthCount ? "start" : "center", date: range.start };
}

interface RangePanelProps {
	dataCy?: string;
	isSheet: boolean;
	label: string;
	maxValue?: CalendarDate;
	minValue?: CalendarDate;
	monthCount: number;
	onApply: (value: DateRangeValue | null) => void;
	onCancel: () => void;
	presets: DateRangePreset[];
	value: DateRangeValue | null;
}

/**
 * The contents of the popover or the sheet.
 *
 * Mounted only while open, which is what lets it hold a draft: closing by
 * Escape, by a click outside or by Cancel throws the draft away without a line
 * of code, and `today` is read on the client where it is actually correct.
 */
function RangePanel({
	dataCy,
	isSheet,
	label,
	maxValue,
	minValue,
	monthCount,
	onApply,
	onCancel,
	presets,
	value,
}: RangePanelProps) {
	const [now] = useState(() => today(getLocalTimeZone()));
	const [draft, setDraft] = useState<DateRangeValue | null>(value);
	const [frame, setFrame] = useState<Frame>(() => frameRange(value ?? { end: now, start: now }, monthCount));
	/*
	 * Bumping this remounts the calendar, which is how a preset repositions the
	 * group. React Aria only moves the visible range when focus leaves it, and
	 * when it does move it puts the focused month at whichever END focus came in
	 * from - so focusing April from June frames Feb-Apr, the exact opposite of
	 * what "Last quarter" is asking for. `selectionAlignment` is read on mount,
	 * so a remount is the one place it can be stated. Focus is on the preset
	 * button at the time, so nothing loses it.
	 */
	const [navKey, setNavKey] = useState(0);
	/*
	 * Held here rather than left to the calendar, because pressing a preset has
	 * to put the months back - the rail stays lit while the year list is open,
	 * so it is reachable from it. Nothing resets it on close: this panel is
	 * mounted only while the popover is open, so closing throws the state away
	 * along with the draft.
	 */
	const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	/*
	 * The sheet is a continuous run of months rather than a paged grid: crossing a
	 * month boundary is a scroll, which is the gesture the surface is already in.
	 * Nine is enough to scroll in either direction without a page turn and cheap
	 * enough to mount at once.
	 */
	const gridCount = isSheet ? 9 : monthCount;
	const alignment = isSheet ? "center" : frame.align;

	// Bring the anchor month to the top of the sheet's scroller. Set directly
	// rather than smooth-scrolled: the sheet is still sliding up at this point.
	useEffect(() => {
		if (!isSheet) {
			return;
		}
		const container = scrollRef.current;
		const target = container?.querySelector<HTMLElement>("[data-anchor-month]");
		if (container && target) {
			container.scrollTop = target.offsetTop - container.offsetTop;
		}
	}, [isSheet, navKey]);

	const applyPreset = (preset: DateRangePreset) => {
		const next = preset.resolve(now);
		setDraft(next);
		// A preset names the months it wants shown, so the year list has nothing
		// left to answer - leaving it open would hide the range it just framed.
		setIsYearPickerOpen(false);
		// Framed against the number of grids the user can SEE, not the nine the
		// sheet mounts - on a phone that is one, so the sheet always scrolls to the
		// month the range starts in.
		setFrame(frameRange(next, monthCount));
		setNavKey((key) => key + 1);
	};

	/*
	 * DERIVED, never stored. Touching the grid has to silently drop the preset,
	 * and the only way that cannot be forgotten is for there to be nothing to
	 * forget: the pill is lit by the draft matching a preset, so a hand-picked
	 * range simply matches none.
	 */
	const activePresetKey = presets.find((preset) => isSameRange(preset.resolve(now), draft))?.key ?? null;

	const presetRail = (
		<PresetRail
			activeKey={activePresetKey}
			hasDraft={draft != null}
			isSheet={isSheet}
			onSelect={applyPreset}
			presets={presets}
		/>
	);

	const header = (
		<div className="flex items-center justify-between gap-3">
			<span className="text-xs font-semibold tracking-wide text-muted uppercase">Selection</span>
			{/*
			 * The resolved range, spanning the whole group rather than one per grid.
			 * A preset is a name; without this the user has to read three grids to
			 * find out what "Last quarter" actually meant.
			 */}
			<span
				aria-live="polite"
				className={cn(
					"rounded-full px-2.5 py-1 text-xs font-medium",
					draft ? "bg-muted-surface text-foreground" : "text-muted",
				)}
			>
				{draft ? describeRange(draft) : "No range selected"}
			</span>
		</div>
	);

	const calendar = (
		<RangeCalendar
			aria-label={label}
			/*
			 * `@container-normal` is not a tidy-up - without it the popover renders
			 * at the width of the presets rail and every month grid spills out of it
			 * onto the page behind.
			 *
			 * `.range-calendar` declares `container-type: inline-size` (for a
			 * container query HeroUI does not actually ship - nothing in its CSS
			 * queries it). Inline-size containment means the box's inline size is
			 * computed AS IF IT HAD NO CONTENTS, so its max-content contribution is
			 * zero - and a popover is shrink-to-fit, sized by exactly that
			 * contribution. One month or three, the calendar measured as nothing.
			 * The width utilities beside this only undo `w-63`; the measuring is a
			 * separate bug and needs the containment gone.
			 */
			className={cn("@container-normal max-w-none", isSheet ? "w-full" : "w-auto")}
			defaultFocusedValue={frame.date}
			isYearPickerOpen={isYearPickerOpen}
			key={navKey}
			maxValue={maxValue}
			minValue={minValue}
			onChange={(next) => setDraft(next as DateRangeValue)}
			onYearPickerOpenChange={setIsYearPickerOpen}
			/*
			 * One month per press regardless of how many are shown. Paging by the
			 * group size means a range spanning March and April can never be seen
			 * whole - every press swaps both months at once.
			 */
			pageBehavior="single"
			selectionAlignment={alignment}
			value={draft}
			visibleDuration={{ months: gridCount }}
		>
			{({ state }) => {
				const anchorIndex = monthsBetween(state.visibleRange.start, frame.date);
				return (
					<>
						<div className={cn(isSheet ? "flex flex-col gap-6" : "flex gap-4")}>
							{Array.from({ length: gridCount }, (_, index) => (
								<MonthGrid
									index={index}
									isAnchor={index === anchorIndex}
									isSheet={isSheet}
									isYearPickerOpen={isYearPickerOpen}
									key={index}
									month={state.visibleRange.start.add({ months: index })}
									showNext={!isSheet && index === gridCount - 1}
									showPrevious={!isSheet && index === 0}
								/>
							))}
						</div>

						{/*
						 * One list for the whole group, drawn over the grids - HeroUI
						 * measures the first one and matches its top and height, so the
						 * panel never changes size when it opens.
						 *
						 * Popover only. The sheet is a continuous nine-month scroller with
						 * no arrows, and this overlay is sized from ONE grid: on a phone it
						 * would cover January and leave the other eight months showing
						 * underneath it. Reaching another year from the sheet is what the
						 * typed fields beside the trigger are for.
						 *
						 * `visibleYears` is left alone. It defaults to the whole span
						 * between `minValue` and `maxValue` (1900-2099 unless the caller
						 * narrows it), and there is no paging control inside the list -
						 * capping it would put a year out of reach entirely.
						 */}
						{isSheet ? null : (
							<RangeCalendar.YearPickerGrid className={YEAR_GRID_COLUMNS[monthCount - 1]}>
								<RangeCalendar.YearPickerGridBody />
							</RangeCalendar.YearPickerGrid>
						)}
					</>
				);
			}}
		</RangeCalendar>
	);

	const footer = (
		<div className="flex items-center justify-end gap-2">
			<AppButton
				onPress={onCancel}
				size="sm"
				variant="ghost"
			>
				Cancel
			</AppButton>
			<AppButton
				isDisabled={draft == null}
				onPress={() => onApply(draft)}
				size="sm"
				variant="primary"
			>
				Apply
			</AppButton>
		</div>
	);

	if (isSheet) {
		return (
			<>
				<Drawer.Header className="shrink-0 border-b border-border p-4">
					<Drawer.Heading className="text-base font-semibold">{label}</Drawer.Heading>
				</Drawer.Header>
				{/*
				 * A plain scroller rather than Drawer.Body: this one needs a ref to
				 * park itself on the right month, and `relative` so the month blocks'
				 * offsetTop is measured against it.
				 */}
				<div
					className="relative flex flex-1 flex-col gap-5 overflow-y-auto p-4"
					data-cy={dataCy}
					ref={scrollRef}
				>
					{presetRail}
					{header}
					{calendar}
				</div>
				{/* Above the safe area, and the only fixed thing at the bottom of the sheet. */}
				<Drawer.Footer className="shrink-0 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
					{footer}
				</Drawer.Footer>
			</>
		);
	}

	return (
		<div
			className="flex flex-col gap-4"
			data-cy={dataCy}
		>
			<div className="flex gap-4">
				{presetRail}
				{/* No `min-w-0` here: this column has to report its real content width
				    or the popover shrink-to-fits below the grids all over again. */}
				<div className="flex flex-col gap-3">
					{header}
					{calendar}
				</div>
			</div>
			<div className="border-t border-border pt-3">{footer}</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Presets rail                                                                */
/* -------------------------------------------------------------------------- */

interface PresetRailProps {
	activeKey: string | null;
	/** Whether there is a range at all. An empty picker is in no state to name. */
	hasDraft: boolean;
	isSheet: boolean;
	onSelect: (preset: DateRangePreset) => void;
	presets: DateRangePreset[];
}

function PresetRail({ activeKey, hasDraft, isSheet, onSelect, presets }: PresetRailProps) {
	const isCustom = hasDraft && activeKey === null;

	/*
	 * The rail floors at `w-36` rather than fixing at it. 144px is the number
	 * that makes two grids plus the rail plus the popover's own padding clear
	 * `48rem`, the width at which the second grid appears - at w-40 it came to
	 * four pixels over - so it stays as the floor. But a FIXED rail is a fixed
	 * guess about how long a preset's name is, and `presets` is a public prop:
	 * `AppDatePicker` shipped a default whose name ran through this divider and
	 * over the first month's grid. Auto width above the floor means a long name
	 * widens the rail instead of escaping it, and every name that fits today
	 * still renders at exactly 144.
	 */
	return (
		<div className={cn("flex flex-col gap-1.5", isSheet ? "w-full" : "min-w-36 shrink-0 border-r border-border pr-3")}>
			<span className="px-1 text-xs font-semibold tracking-wide text-muted uppercase">Presets</span>
			<div className={cn(isSheet ? "grid grid-cols-2 gap-2" : "flex flex-col gap-1")}>
				{presets.map((preset) => {
					const isActive = preset.key === activeKey;
					return (
						<AppButton
							aria-pressed={isActive}
							className={cn(
								"justify-start font-normal",
								// The same gradient pill as the active nav item and the active
								// page number: one "this is the one you are on" across the app.
								isActive && "gradient-brand shadow-glow",
							)}
							key={preset.key}
							onPress={() => onSelect(preset)}
							size="sm"
							variant={isActive ? "primary" : "ghost"}
						>
							{preset.label}
						</AppButton>
					);
				})}
				{/*
				 * "Custom range" is not a preset and is deliberately not a button.
				 * There is nothing for it to set - it is the state you are already in
				 * the moment you touch a grid, and a control that does nothing when
				 * pressed is worse than a label that tells you where you are.
				 *
				 * It lights only once there IS a range. An empty picker matches no
				 * preset either, and lighting this on open would announce a custom
				 * range before a single day had been chosen.
				 */}
				<p
					className={cn(
						"rounded-xl px-3 py-1.5 text-sm",
						isCustom ? "gradient-brand font-medium shadow-glow" : "text-muted",
					)}
				>
					Custom range
				</p>
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Month grid                                                                  */
/* -------------------------------------------------------------------------- */

interface MonthGridProps {
	index: number;
	isAnchor: boolean;
	isSheet: boolean;
	isYearPickerOpen: boolean;
	month: CalendarDate;
	showNext: boolean;
	showPrevious: boolean;
}

/**
 * One month, with its own title and - on the first and last grid only - the
 * group's navigation.
 *
 * The arrows belong to the GROUP, not to a month: there is one pair on screen
 * however many grids are shown, and the months stay adjacent and ascending. Two
 * sets of arrows would let a user put July next to February.
 *
 * In the popover the TITLE is the year picker's trigger, and every grid's title
 * is one - a year applies to the group rather than to one of its months, so one
 * clickable title among three plain ones would be a control the user has to find
 * rather than one they can reach for. The arrows are withdrawn while that list
 * is open, because there are no months on screen to page. On the sheet the title
 * stays plain text: there is no year list there to open.
 */
function MonthGrid({ index, isAnchor, isSheet, isYearPickerOpen, month, showNext, showPrevious }: MonthGridProps) {
	const title = formatMonth(month);

	return (
		<div
			className={cn(isSheet ? "w-full" : "w-63 shrink-0")}
			data-anchor-month={isAnchor ? "" : undefined}
		>
			<div className="flex h-8 items-center justify-between gap-2 px-0.5">
				{showPrevious && !isYearPickerOpen ? (
					<RangeCalendar.NavButton slot="previous" />
				) : (
					<span
						aria-hidden="true"
						className="size-8 shrink-0"
					/>
				)}
				{isSheet ? (
					<span className="text-sm font-semibold">{title}</span>
				) : (
					/*
					 * The label is spelled out rather than left to HeroUI, which names
					 * every trigger after the FIRST visible month - so all three would
					 * announce "July 2026" while reading "August" and "September".
					 */
					<RangeCalendar.YearPickerTrigger
						aria-label={`${title}, choose a year`}
						className="justify-center"
					>
						<RangeCalendar.YearPickerTriggerHeading className="font-semibold">
							{title}
						</RangeCalendar.YearPickerTriggerHeading>
						<RangeCalendar.YearPickerTriggerIndicator />
					</RangeCalendar.YearPickerTrigger>
				)}
				{showNext && !isYearPickerOpen ? (
					<RangeCalendar.NavButton slot="next" />
				) : (
					<span
						aria-hidden="true"
						className="size-8 shrink-0"
					/>
				)}
			</div>
			{/*
			 * `offset` is what makes several grids one date space: every grid reads
			 * the same visible range, so arrow keys walk out of the last day of one
			 * and into the first of the next rather than trapping focus in a widget.
			 */}
			<RangeCalendar.Grid offset={{ months: index }}>
				<RangeCalendar.GridHeader>
					{(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
				</RangeCalendar.GridHeader>
				<RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
			</RangeCalendar.Grid>
		</div>
	);
}
