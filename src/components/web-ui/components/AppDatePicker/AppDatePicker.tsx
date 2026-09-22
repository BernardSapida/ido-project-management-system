import { useMediaQuery } from "../../internal";
import { Calendar, DateField, DatePicker, FieldError, Label } from "@heroui/react";
import type { CalendarDate, DateValue } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";
import { X } from "lucide-react";
import { useId, useState } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";
import { AppButton } from "../AppButton";
import { cn } from "../../lib/cn";

/* -------------------------------------------------------------------------- */
/* Presets                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A named day, not a date. The name is what the user is choosing - "tomorrow"
 * on the 31st means the 1st, and a preset that stored the resolved date would
 * be wrong the moment the picker outlived midnight.
 */
export interface DatePreset {
	key: string;
	label: string;
	resolve: (now: CalendarDate) => CalendarDate;
}

/**
 * The answers that are worth a click over hunting a grid for them.
 *
 * Deliberately short. A rail longer than the calendar is beside it stops being
 * a shortcut and becomes a second thing to read - and unlike a range, a single
 * date is usually only one or two grid clicks away anyway.
 */
export const DEFAULT_DATE_PRESETS: DatePreset[] = [
	{ key: "today", label: "Today", resolve: (now) => now },
	{ key: "tomorrow", label: "Tomorrow", resolve: (now) => now.add({ days: 1 }) },
	{ key: "yesterday", label: "Yesterday", resolve: (now) => now.subtract({ days: 1 }) },
	{ key: "in-a-week", label: "In a week", resolve: (now) => now.add({ weeks: 1 }) },
	{
		key: "next-month",
		label: "Start of next month",
		resolve: (now) => now.add({ months: 1 }).set({ day: 1 }),
	},
];

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * How many columns of years the picker offers, by month count.
 *
 * Three per month grid at every size, so a year cell is the same width whether
 * one month is showing or three - the overlay spans the whole grid area, and a
 * fixed three columns would give 260px-wide year buttons at three months.
 *
 * Written out rather than computed: Tailwind scans source text for class names,
 * and a template literal produces no CSS at all.
 */
const YEAR_GRID_COLUMNS = ["grid-cols-3", "grid-cols-6", "grid-cols-9"];

interface AppDatePickerProps<T extends FieldValues> {
	className?: string;
	control: Control<T>;
	"data-cy"?: string;
	/**
	 * Days that exist on the grid but cannot be chosen - a fully booked slot, a
	 * closed weekend. Distinct from `minValue`/`maxValue`, which cut the range
	 * off at an end; this punches holes in the middle of it.
	 */
	isDateUnavailable?: (date: DateValue) => boolean;
	isDisabled?: boolean;
	isRequired?: boolean;
	label: string;
	maxValue?: CalendarDate;
	minValue?: CalendarDate;
	name: Path<T>;
	/**
	 * Set `[]` to hide the rail entirely - right when every day is equally
	 * likely, a birth date being the obvious one, where "Tomorrow" is noise.
	 */
	presets?: DatePreset[];
}

/**
 * The date field: typed segments, a preset rail, and one to three month grids.
 *
 * This is the default way to pick a day. A bare `DateField` is not - segments
 * with no calendar make the user know the format before they can answer, and
 * give them nothing to count weekends on.
 *
 * It follows `AppDateRangeFilter`'s shape on purpose, so the two read as one
 * control at different arities:
 *
 * - The month count is RESPONSIVE - 3 wide, 2 at laptop width, 1 on a phone.
 *   Three is previous / current / next, so the month the user is on sits in the
 *   MIDDLE with a month of context either side. Choosing a date near a boundary
 *   - "the Monday after next" - is the case a single grid handles worst, because
 *   it makes them page forward and lose the days they were comparing against.
 * - Every month title is a YEAR PICKER. The arrows move one month, which is the
 *   right unit for an appointment and the wrong one for a birth date - twelve
 *   presses per year is not navigation, it is a toll. Pressing a title swaps the
 *   grids for a list of years and pressing a year jumps straight to it.
 * - The presets are the answer most of the time.
 * - Unlike the range, it commits IMMEDIATELY. A date is one value, so the first
 *   click is the whole answer and an Apply button would be a second click that
 *   confirms what the user just said. The range needs one because it is two
 *   values and the first click alone is a one-day range.
 * - The field is ALWAYS clearable once it holds a value. Clearing is not a
 *   feature of some dates and not others - a user who typed the wrong day needs
 *   it as much as one filling in an optional field, and hiding it behind a prop
 *   only meant most call sites shipped without it.
 *
 * A preset that resolves outside `minValue`/`maxValue`, or onto a day
 * `isDateUnavailable` rejects, is DISABLED rather than hidden - a rail whose
 * contents change per screen is one the user cannot learn.
 */
export function AppDatePicker<T extends FieldValues>({
	className,
	control,
	"data-cy": dataCy,
	isDateUnavailable,
	isDisabled,
	isRequired,
	label,
	maxValue,
	minValue,
	name,
	presets = DEFAULT_DATE_PRESETS,
}: AppDatePickerProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });
	const hintId = useId();

	// Read once. A picker left open across midnight must not have "Today" quietly
	// mean a different day than the grid it is sitting next to.
	const [now] = useState(() => today(getLocalTimeZone()));

	/*
	 * Held here rather than inside the popover, because the trigger for it is in
	 * the month header and the grid it covers is a sibling of that header. It is
	 * reset when the popover closes: this state outlives the popover's contents,
	 * so without that the next open would land on the year list.
	 */
	const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

	/*
	 * Three queries rather than one: the count is the ONLY thing that changes
	 * across breakpoints - same cell size, same rail, same header. Shrinking the
	 * cells to fit three months gives three unusable grids where there could have
	 * been two good ones, so it drops a grid instead.
	 *
	 * 90rem for the third grid, not 80. The panel is the rail (~150 once its
	 * longest preset is measured, plus 12 and a border), a 16 gap, three 252
	 * grids with 16 between them, and the popover's own 12 either side - a shade
	 * under 1000px, anchored to the LEFT EDGE OF THE FIELD rather than to the
	 * page. A form inside this app's sidebar layout starts around 330px in, so
	 * at 1280 the third grid runs off the right of the window; 1440 is the first
	 * width where it clears it. This costs a full-width page its third grid
	 * between 1280 and 1440, which is a month of context - the alternative was a
	 * panel with its last week cut off.
	 */
	const isPhone = useMediaQuery("(width < 40rem)");
	const isWide = useMediaQuery("(width >= 90rem)");
	const isRoomForTwo = useMediaQuery("(width >= 48rem)");
	const monthCount = isPhone ? 1 : isWide ? 3 : isRoomForTwo ? 2 : 1;

	const selected = (field.value as CalendarDate | null) ?? null;
	/*
	 * The month the group is built around - and it is passed STRAIGHT through,
	 * with no offset. React Aria centres the focused month inside the visible
	 * range by itself (`selectionAlignment` defaults to `center`), and its idea
	 * of centre is already the one this component wants: the month itself at one
	 * or two grids, the middle slot at three. Anchoring a month back on top of
	 * that shifted the group twice, which put TODAY in the last slot with two
	 * months of the past beside it and none of the future - the wrong half of
	 * the calendar for a control whose default preset is "Tomorrow".
	 */
	const focusStart = selected ?? now;

	const hint = describeBounds(minValue, maxValue);

	function commit(next: CalendarDate | null) {
		field.onChange(next);
		field.onBlur();
	}

	return (
		<DatePicker
			className={cn("w-full", className)}
			data-cy={dataCy}
			isDateUnavailable={isDateUnavailable}
			isDisabled={isDisabled}
			isInvalid={invalid}
			isRequired={isRequired}
			maxValue={maxValue}
			minValue={minValue}
			onBlur={field.onBlur}
			onChange={(value) => commit(value as CalendarDate | null)}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					setIsYearPickerOpen(false);
				}
			}}
			value={selected}
		>
			<Label>{label}</Label>
			<DateField.Group fullWidth>
				<DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
				{/*
				 * `gap-1`, because HeroUI's suffix has none - it was built for one
				 * glyph. The calendar trigger stays exactly where it sits on an empty
				 * field: the suffix is anchored to the right, so the clear button is
				 * inserted to its LEFT and nothing after it moves.
				 */}
				<DateField.Suffix className="gap-1">
					{/*
					 * No `isClearable` gate. A date that is set can always be unset -
					 * the segments can be emptied by hand anyway, so a picker without
					 * this is not a stricter control, only a slower one. It hides while
					 * disabled, where it would be the one live control in a dead field.
					 *
					 * `size-6` overrides the sm icon button's 32px box down to the 24px
					 * the calendar trigger beside it occupies. Two affordances in one
					 * field have to be the same weight - at 32 the clear button read as
					 * the field's main control and the calendar as its decoration.
					 */}
					{selected && !isDisabled ? (
						<AppButton
							aria-label={`Clear ${label}`}
							className="size-6"
							icon={X}
							isIconOnly
							onPress={() => commit(null)}
							size="sm"
							variant="ghost"
						/>
					) : null}
					{/*
					 * `w-auto`, undoing HeroUI's `w-full`. That width is a no-op while
					 * the trigger is the suffix's only child - 100% of a box it is the
					 * whole content of - but the clear button makes it a second child,
					 * and the trigger then claims the width of BOTH. It is a flex row
					 * aligned to the start, so the surplus lands after the glyph: the
					 * calendar icon walked left and left a gap against the field's edge
					 * the moment a date was set.
					 */}
					<DatePicker.Trigger className="w-auto shrink-0">
						<DatePicker.TriggerIndicator />
					</DatePicker.Trigger>
				</DateField.Suffix>
			</DateField.Group>

			{/*
			 * `bottom start`, not the default centred `bottom`. At three months this
			 * panel is far wider than its trigger, so centring hangs it off both
			 * sides and a field near the left of a form pushes it off-screen.
			 */}
			<DatePicker.Popover
				className="max-w-[calc(100vw-2rem)]"
				placement="bottom start"
			>
				<div className={cn("flex gap-4", isPhone && "flex-col")}>
					{presets.length > 0 ? (
						<PresetRail
							isDateUnavailable={isDateUnavailable}
							isPhone={isPhone}
							maxValue={maxValue}
							minValue={minValue}
							now={now}
							onPick={commit}
							presets={presets}
							selected={selected}
						/>
					) : null}

					<Calendar
						aria-label={label}
						/*
						 * `@container-normal` is not a tidy-up. `.calendar` declares
						 * `container-type: inline-size`, and inline-size containment means
						 * the box's inline size is computed AS IF IT HAD NO CONTENTS - so
						 * its max-content contribution is zero, and a popover is
						 * shrink-to-fit, sized by exactly that contribution. One month or
						 * three, the calendar would measure as nothing and every grid
						 * would spill onto the page behind it.
						 */
						className="@container-normal w-auto max-w-none"
						defaultFocusedValue={focusStart}
						isDateUnavailable={isDateUnavailable}
						isYearPickerOpen={isYearPickerOpen}
						maxValue={maxValue}
						minValue={minValue}
						onChange={(value) => commit(value as CalendarDate)}
						onYearPickerOpenChange={setIsYearPickerOpen}
						/*
						 * One month per press regardless of how many are shown. Paging by
						 * the group size means the month either side of the current one
						 * can never stay in view - every press swaps all three at once,
						 * which is the context the three grids exist to provide.
						 */
						pageBehavior="single"
						value={selected}
						visibleDuration={{ months: monthCount }}
					>
						{({ state }) => (
							<>
								<div className={cn(isPhone ? "flex flex-col gap-6" : "flex gap-4")}>
									{Array.from({ length: monthCount }, (_, index) => (
										<MonthGrid
											index={index}
											isPhone={isPhone}
											isYearPickerOpen={isYearPickerOpen}
											key={index}
											month={state.visibleRange.start.add({ months: index })}
											showNext={index === monthCount - 1}
											showPrevious={index === 0}
										/>
									))}
								</div>

								{/*
								 * One list for the whole group, not one per grid. It is drawn
								 * over the day grids rather than beside them - HeroUI measures
								 * the first grid and matches its top and height - so the panel
								 * never changes size when it opens, and the year that is
								 * currently showing is scrolled to and focused.
								 *
								 * `visibleYears` is left alone deliberately. It defaults to the
								 * whole span between `minValue` and `maxValue` (1900-2099 unless
								 * the caller narrows it), and there is no paging control inside
								 * the list - capping it would make a year outside the window
								 * unreachable without closing the picker and typing.
								 */}
								<Calendar.YearPickerGrid className={YEAR_GRID_COLUMNS[monthCount - 1]}>
									<Calendar.YearPickerGridBody />
								</Calendar.YearPickerGrid>
							</>
						)}
					</Calendar>
				</div>
			</DatePicker.Popover>

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
			<FieldError>{error?.message}</FieldError>
		</DatePicker>
	);
}

/* -------------------------------------------------------------------------- */

interface PresetRailProps {
	isDateUnavailable?: (date: DateValue) => boolean;
	isPhone: boolean;
	maxValue?: CalendarDate;
	minValue?: CalendarDate;
	now: CalendarDate;
	onPick: (date: CalendarDate) => void;
	presets: DatePreset[];
	selected: CalendarDate | null;
}

/**
 * The named days, down the left - or across the top on a phone, where a vertical
 * rail beside a grid would leave neither enough width.
 */
function PresetRail({
	isDateUnavailable,
	isPhone,
	maxValue,
	minValue,
	now,
	onPick,
	presets,
	selected,
}: PresetRailProps) {
	/*
	 * `min-w-36`, not `w-36`. A fixed rail is a fixed guess about how long a
	 * preset's name is, and "Start of next month" - one of the defaults - is
	 * longer than the guess: it ran through the divider and over the first
	 * month's grid. `presets` is a public prop, so the next label to break it is
	 * one a caller writes. Auto width sizes the rail to its longest name and
	 * keeps 144px as the floor, so a rail of short names looks unchanged.
	 */
	return (
		<div
			className={cn(
				"shrink-0",
				isPhone ? "flex flex-wrap gap-1.5" : "flex min-w-36 flex-col gap-1 border-r border-border pr-3",
			)}
		>
			{!isPhone ? <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Presets</p> : null}
			{presets.map((preset) => {
				const date = preset.resolve(now);
				// Disabled, not hidden: a rail whose contents change per screen is one
				// the user cannot learn. The reason it is unavailable is the same
				// reason the grid greys the day out.
				const isOutOfBounds =
					(minValue && date.compare(minValue) < 0) ||
					(maxValue && date.compare(maxValue) > 0) ||
					Boolean(isDateUnavailable?.(date));

				return (
					<AppButton
						className={cn(!isPhone && "justify-start", selected?.compare(date) === 0 && "font-semibold text-primary")}
						isDisabled={isOutOfBounds}
						key={preset.key}
						onPress={() => onPick(date)}
						size="sm"
						variant="ghost"
					>
						{preset.label}
					</AppButton>
				);
			})}
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface MonthGridProps {
	index: number;
	isPhone: boolean;
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
 * The TITLE is the year picker's trigger, and every grid's title is one. They
 * all drive the same list, which is the truth - a year applies to the group, not
 * to one of its months - and one clickable title among three plain ones would be
 * a control the user has to find rather than one they can reach for.
 *
 * The arrows are withdrawn while that list is open. They page months, and there
 * are no months on screen to page.
 */
function MonthGrid({ index, isPhone, isYearPickerOpen, month, showNext, showPrevious }: MonthGridProps) {
	const title = formatMonth(month);

	return (
		<div className={cn(isPhone ? "w-full" : "w-63 shrink-0")}>
			<div className="flex h-8 items-center justify-between gap-2 px-0.5">
				{showPrevious && !isYearPickerOpen ? (
					<Calendar.NavButton slot="previous" />
				) : (
					<span
						aria-hidden="true"
						className="size-8 shrink-0"
					/>
				)}
				{/*
				 * The label is spelled out rather than left to HeroUI, which names
				 * every trigger after the FIRST visible month - so all three would
				 * announce "July 2026" while reading "August" and "September".
				 */}
				<Calendar.YearPickerTrigger
					aria-label={`${title}, choose a year`}
					className="justify-center"
				>
					<Calendar.YearPickerTriggerHeading className="font-semibold">{title}</Calendar.YearPickerTriggerHeading>
					<Calendar.YearPickerTriggerIndicator />
				</Calendar.YearPickerTrigger>
				{showNext && !isYearPickerOpen ? (
					<Calendar.NavButton slot="next" />
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
			<Calendar.Grid offset={{ months: index }}>
				<Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
				<Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
			</Calendar.Grid>
		</div>
	);
}

/* -------------------------------------------------------------------------- */

const MONTHS = [
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

function formatMonth(date: CalendarDate): string {
	return `${MONTHS[date.month - 1]} ${date.year}`;
}

function formatDay(date: CalendarDate): string {
	return `${MONTHS[date.month - 1].slice(0, 3)} ${date.day}, ${date.year}`;
}

/** Says the bound in words, because a greyed cell does not say why it is grey. */
function describeBounds(minValue?: CalendarDate, maxValue?: CalendarDate): string | null {
	if (minValue && maxValue) return `Pick a date between ${formatDay(minValue)} and ${formatDay(maxValue)}.`;
	if (minValue) return `Dates before ${formatDay(minValue)} are not available.`;
	if (maxValue) return `Dates after ${formatDay(maxValue)} are not available.`;
	return null;
}
