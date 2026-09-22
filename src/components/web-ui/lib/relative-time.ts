/**
 * Instants formatted for reading: "3h ago" in the text, the full date in the
 * markup.
 *
 * Every function here works by hand from the date's own fields and never
 * through `Intl`. A `DateTimeFormat` built during SSR is built against the
 * SERVER's time zone - the trap `AppDateRangeFilter` documents - and these are
 * the strings a user is expected to read a clock off, so getting them an hour
 * wrong is not a cosmetic failure.
 *
 * Shared by `AppTimeline` and `AppCommentSection`, which are told the same
 * thing by the same rule: relative in the text, absolute in the markup. Two
 * copies of it would eventually disagree about what "just now" means.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function toDate(value: Date | string): Date {
	return value instanceof Date ? value : new Date(value);
}

/**
 * Pre-mount, UTC is the one day boundary both machines agree on. Rendering a
 * local date on the server and a different local date in the browser is a
 * hydration mismatch on every timestamp on the page.
 */
export function formatUtcDate(date: Date): string {
	return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** The year is dropped only when it is the one the reader is already in. */
export function formatDate(date: Date, currentYear?: number): string {
	const year = date.getFullYear();
	const head = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
	return year === currentYear ? head : `${head} ${year}`;
}

/** The full local instant, for a `title` or an "edited" marker. */
export function formatAbsolute(date: Date): string {
	const hours = date.getHours();
	const suffix = hours >= 12 ? "PM" : "AM";
	const hour12 = hours % 12 === 0 ? 12 : hours % 12;
	const minutes = String(date.getMinutes()).padStart(2, "0");

	return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()} at ${hour12}:${minutes} ${suffix}`;
}

/**
 * Past a week it stops being relative: "43d ago" is arithmetic homework, and by
 * then the date is the more useful of the two anyway.
 */
export function formatRelative(date: Date, now: Date): string {
	const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

	// Also covers a stamp slightly in the future, which clock skew will produce.
	if (seconds < 45) return "just now";
	if (seconds < HOUR) return `${Math.round(seconds / MINUTE)}m ago`;
	if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h ago`;
	if (seconds < WEEK) return `${Math.floor(seconds / DAY)}d ago`;
	return formatDate(date, now.getFullYear());
}
