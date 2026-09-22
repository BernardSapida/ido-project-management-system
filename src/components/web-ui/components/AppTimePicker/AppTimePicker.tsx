import { Time } from "@internationalized/date";
import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";
import { useMediaQuery } from "../../internal";
import { cn } from "../../lib/cn";

/* -------------------------------------------------------------------------- */
/* Wheel geometry                                                             */
/* -------------------------------------------------------------------------- */

/**
 * One row is 40px and five are visible, so the column is 200px tall and the
 * centre row sits at rows 3. Written as numbers rather than Tailwind classes
 * because the scroll maths needs them - `scrollTop` for row `i` to be centred is
 * exactly `i * ROW_H` once the top spacer is `PAD_ROWS * ROW_H`.
 */
const ROW_H = 40;
const VISIBLE_ROWS = 5;
const PAD_ROWS = Math.floor(VISIBLE_ROWS / 2);
const COLUMN_H = ROW_H * VISIBLE_ROWS;

/* -------------------------------------------------------------------------- */
/* Time <-> wheel conversion                                                  */
/* -------------------------------------------------------------------------- */

type Period = "AM" | "PM";

interface WheelParts {
	hour12: number;
	minute: number;
	period: Period;
}

/** 24h `Time` -> the three things the wheels show. */
function toWheel(time: Time): WheelParts {
	const period: Period = time.hour < 12 ? "AM" : "PM";
	const hour12 = time.hour % 12 === 0 ? 12 : time.hour % 12;
	return { hour12, minute: time.minute, period };
}

/** The three wheel values -> a 24h `Time`. */
function fromWheel({ hour12, minute, period }: WheelParts): Time {
	const base = hour12 % 12; // 12 -> 0
	const hour24 = period === "AM" ? base : base + 12;
	return new Time(hour24, minute);
}

/** "9:05 AM" - the readout under the wheels and the accessible value text. */
function formatTime(time: Time): string {
	const { hour12, minute, period } = toWheel(time);
	return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

interface Option {
	label: string;
	value: string;
}

const HOUR_OPTIONS: Option[] = Array.from({ length: 12 }, (_, index) => {
	const hour = index + 1;
	return { label: hour.toString(), value: hour.toString() };
});

const PERIOD_OPTIONS: Option[] = [
	{ label: "AM", value: "AM" },
	{ label: "PM", value: "PM" },
];

/**
 * Minutes at the requested granularity. A step that does not divide 60 (7, say)
 * simply stops before it would pass 59 rather than wrapping to a smaller last
 * gap - the caller asked for coarse minutes, not a ragged wheel.
 */
function minuteOptions(step: number): Option[] {
	const safeStep = Number.isFinite(step) && step >= 1 ? Math.floor(step) : 1;
	const options: Option[] = [];
	for (let minute = 0; minute < 60; minute += safeStep) {
		options.push({ label: minute.toString().padStart(2, "0"), value: minute.toString() });
	}
	return options;
}

/* -------------------------------------------------------------------------- */
/* One column                                                                 */
/* -------------------------------------------------------------------------- */

interface WheelColumnProps {
	"data-cy"?: string;
	isDisabled?: boolean;
	label: string;
	onSelect: (index: number) => void;
	options: Option[];
	selectedIndex: number;
	/** Arrow keys past an end come round the other side. Off for AM/PM. */
	wrap?: boolean;
}

/**
 * A drum: a scroll container with CSS snap, a fixed centre band, and one tab
 * stop that behaves as a `spinbutton`.
 *
 * Three input routes reach the same `onSelect(index)`:
 *
 * - **Scroll / flick / wheel** - native momentum scroll with `snap-mandatory`
 *   does the settling; a debounced `scroll` handler reads the row that landed
 *   under the band and reports it.
 * - **Click a row** - each row is a `<button>` (removed from the tab order, so
 *   the column stays one stop) that selects its own index.
 * - **Arrow / Home / End / PageUp-Down** on the focused column.
 *
 * The value flows back in through `selectedIndex`: an effect scrolls the band to
 * that row whenever it changes for a reason other than the user's own scroll,
 * which is what lets a keyboard press and an external form value move the wheel.
 */
function WheelColumn({
	"data-cy": dataCy,
	isDisabled,
	label,
	onSelect,
	options,
	selectedIndex,
	wrap,
}: WheelColumnProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	/*
	 * Raised while THIS component is scrolling the column itself, so the
	 * `scroll` handler does not read a programmatic scroll back as a user
	 * choice and start a feedback loop.
	 */
	const isSelfScrolling = useRef(false);
	const hasAligned = useRef(false);

	const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

	const alignTo = useCallback(
		(index: number, animate: boolean) => {
			const el = scrollRef.current;
			if (!el) return;
			const top = index * ROW_H;
			if (Math.abs(el.scrollTop - top) < 1) return;
			isSelfScrolling.current = true;
			// `scrollTo` is absent under jsdom and on old engines - fall back to
			// setting `scrollTop`, which every one of them honours.
			if (typeof el.scrollTo === "function") {
				el.scrollTo({ behavior: animate && !reducedMotion ? "smooth" : "auto", top });
			} else {
				el.scrollTop = top;
			}
			window.clearTimeout(settleTimer.current);
			settleTimer.current = setTimeout(
				() => {
					isSelfScrolling.current = false;
				},
				animate && !reducedMotion ? 320 : 0,
			);
		},
		[reducedMotion],
	);

	// Keep the band on the selected row when the value moves under us (keyboard,
	// external form value, a minute snapping onto the step grid). The first run
	// jumps without animation so the wheel does not slide in on mount.
	useEffect(() => {
		alignTo(selectedIndex, hasAligned.current);
		hasAligned.current = true;
	}, [selectedIndex, alignTo]);

	function handleScroll() {
		if (isSelfScrolling.current) return;
		window.clearTimeout(settleTimer.current);
		settleTimer.current = setTimeout(() => {
			const el = scrollRef.current;
			if (!el) return;
			const landed = Math.max(0, Math.min(options.length - 1, Math.round(el.scrollTop / ROW_H)));
			// Correct the sub-pixel drift snap leaves behind, then report.
			alignTo(landed, false);
			if (landed !== selectedIndex) onSelect(landed);
		}, 120);
	}

	function step(delta: number) {
		const count = options.length;
		let next = selectedIndex + delta;
		if (wrap) next = ((next % count) + count) % count;
		else next = Math.max(0, Math.min(count - 1, next));
		if (next !== selectedIndex) onSelect(next);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (isDisabled) return;
		switch (event.key) {
			case "ArrowUp":
				event.preventDefault();
				step(-1);
				break;
			case "ArrowDown":
				event.preventDefault();
				step(1);
				break;
			case "PageUp":
				event.preventDefault();
				step(-5);
				break;
			case "PageDown":
				event.preventDefault();
				step(5);
				break;
			case "Home":
				event.preventDefault();
				if (selectedIndex !== 0) onSelect(0);
				break;
			case "End":
				event.preventDefault();
				if (selectedIndex !== options.length - 1) onSelect(options.length - 1);
				break;
			default:
				break;
		}
	}

	const selected = options[selectedIndex];

	return (
		<div className="relative">
			{/*
			 * The centre band. `pointer-events-none` so a click passes through to
			 * the row button underneath; it is only the rule that says which row
			 * counts.
			 */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-10 -translate-y-1/2 border-y border-border bg-primary/5"
			/>
			<div
				aria-label={label}
				aria-valuemax={options.length - 1}
				aria-valuemin={0}
				aria-valuenow={selectedIndex}
				aria-valuetext={selected?.label}
				className={cn(
					"relative w-16 snap-y snap-mandatory overflow-y-scroll outline-none",
					"scrollbar-none mask-[linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]",
					"focus-visible:ring-2 focus-visible:ring-focus rounded-xl",
					isDisabled && "pointer-events-none opacity-50",
				)}
				data-cy={dataCy}
				onKeyDown={handleKeyDown}
				onScroll={handleScroll}
				ref={scrollRef}
				role="spinbutton"
				style={{ height: COLUMN_H }}
				tabIndex={isDisabled ? -1 : 0}
			>
				<div aria-hidden="true" style={{ height: PAD_ROWS * ROW_H }} />
				{options.map((option, index) => (
					<button
						className={cn(
							"flex h-10 w-full snap-center items-center justify-center text-base tabular-nums transition-colors",
							index === selectedIndex ? "font-semibold text-foreground" : "text-muted",
						)}
						key={option.value}
						onClick={() => {
							if (index !== selectedIndex) onSelect(index);
						}}
						tabIndex={-1}
						type="button"
					>
						{option.label}
					</button>
				))}
				<div aria-hidden="true" style={{ height: PAD_ROWS * ROW_H }} />
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

interface AppTimePickerProps<T extends FieldValues> {
	className?: string;
	control: Control<T>;
	"data-cy"?: string;
	/**
	 * What the wheels rest on before the field holds a value. The wheel has no
	 * empty state - something is always under the band - so this is only what
	 * shows; nothing is written to the form until the user turns a wheel.
	 * Defaults to 9:00 AM.
	 */
	defaultTime?: Time;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	label: string;
	/** Minutes granularity. `5` gives 00, 05, 10 ...; default `1`. */
	minuteStep?: number;
	name: Path<T>;
}

/**
 * AppTimePicker - a wheel for HH : MM AM/PM.
 *
 * Return type: `Time` (`@internationalized/date`), the SAME as `AppTimeField`,
 * so a form can swap one wrapper for the other without touching its schema:
 * `z.custom<Time>((v) => v instanceof Time, "Select a time")`.
 *
 * ## When this and not `AppTimeField`
 *
 * `AppTimeField` is typed segments - fast for someone at a keyboard who knows
 * the time, and it has a real empty state. This is the answer when the input is
 * a phone: a thumb spins a drum, where the same thumb hunting a two-digit
 * segment and a caret is the wrong motion. It also reads well when the choice is
 * coarse - `minuteStep={15}` for a booking that only takes quarter hours.
 *
 * ## The empty-state trade
 *
 * A drum always shows a value. This one keeps an internal draft so the wheels
 * always have something under the band, but it does NOT write that draft to the
 * form - the field stays `null` until a wheel is turned, and `isRequired` then
 * reports through the schema like any other field. The cost is that a
 * required-but-untouched wheel looks identical to an answered one; the "Not set"
 * note under the readout is the only tell. Where an unset time has to be
 * visually obvious, that is `AppTimeField`.
 */
export function AppTimePicker<T extends FieldValues>({
	className,
	control,
	"data-cy": dataCy,
	defaultTime = new Time(9, 0),
	description,
	isDisabled,
	isRequired,
	label,
	minuteStep = 1,
	name,
}: AppTimePickerProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	const committed = (field.value as Time | null | undefined) ?? null;

	// The resolved value the wheels display. Seeded from the field or the
	// default, and re-synced whenever a real value arrives from outside (an edit
	// form's `values`, a preset button).
	const [draft, setDraft] = useState<Time>(committed ?? defaultTime);
	useEffect(() => {
		if (committed) setDraft(committed);
	}, [committed]);

	const minutes = minuteOptions(minuteStep);
	const parts = toWheel(draft);

	const hourIndex = parts.hour12 - 1;
	// The draft minute may sit between two steps (a value arrived from a finer
	// source); show the nearest row without rewriting it until the user acts.
	const minuteIndex = Math.max(
		0,
		Math.min(minutes.length - 1, Math.round(parts.minute / Math.max(1, Math.floor(minuteStep)))),
	);
	const periodIndex = parts.period === "AM" ? 0 : 1;

	const labelId = useId();
	const readoutId = useId();
	const descriptionId = useId();

	function commit(next: WheelParts) {
		const time = fromWheel(next);
		setDraft(time);
		field.onChange(time);
		field.onBlur();
	}

	return (
		<div
			aria-describedby={description ? descriptionId : undefined}
			aria-labelledby={labelId}
			className={cn("flex w-fit flex-col gap-1.5", className)}
			data-cy={dataCy}
			role="group"
		>
			<span className="text-sm font-medium text-foreground" id={labelId}>
				{label}
				{isRequired ? (
					<span aria-hidden="true" className="text-danger">
						{" *"}
					</span>
				) : null}
			</span>

			<div
				className={cn(
					"flex items-center gap-1 rounded-2xl border bg-content1 px-3 py-2",
					invalid ? "border-danger" : "border-border",
				)}
			>
				<WheelColumn
					data-cy={dataCy ? `${dataCy}-hour` : undefined}
					isDisabled={isDisabled}
					label="Hour"
					onSelect={(index) => commit({ ...parts, hour12: index + 1 })}
					options={HOUR_OPTIONS}
					selectedIndex={hourIndex}
					wrap
				/>
				<span aria-hidden="true" className="text-lg font-semibold text-muted">
					:
				</span>
				<WheelColumn
					data-cy={dataCy ? `${dataCy}-minute` : undefined}
					isDisabled={isDisabled}
					label="Minute"
					onSelect={(index) => commit({ ...parts, minute: Number(minutes[index]?.value ?? 0) })}
					options={minutes}
					selectedIndex={minuteIndex}
					wrap
				/>
				<WheelColumn
					data-cy={dataCy ? `${dataCy}-period` : undefined}
					isDisabled={isDisabled}
					label="AM or PM"
					onSelect={(index) => commit({ ...parts, period: PERIOD_OPTIONS[index]?.value as Period })}
					options={PERIOD_OPTIONS}
					selectedIndex={periodIndex}
				/>
			</div>

			<p className="text-xs text-muted" id={readoutId}>
				{committed ? (
					<>
						Selected <span className="font-medium text-foreground">{formatTime(committed)}</span>
					</>
				) : (
					<>Not set - showing {formatTime(draft)}</>
				)}
			</p>

			{description ? (
				<p className="text-xs text-muted" id={descriptionId}>
					{description}
				</p>
			) : null}

			{invalid && error?.message ? (
				<p className="text-sm text-danger" role="alert">
					{error.message}
				</p>
			) : null}
		</div>
	);
}
