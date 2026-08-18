/**
 * The two date formats the printed form uses, and the only place either is spelt.
 *
 * `MMMM DD, YYYY` and `hh:mm AM/PM`, both zero-padded. That is not a preference:
 * the form is a controlled document that an office files, and "March 3, 2026"
 * beside "March 03, 2026" in the same folder is the kind of inconsistency that
 * gets a form sent back. IRMS-old fixed the time format explicitly after the
 * first batch printed 24-hour times.
 *
 * Written out rather than delegated to `toLocaleDateString`, and that is the
 * decision worth recording: the locale formatter's output depends on the
 * MACHINE it runs on. The same request printed from the office desktop and from
 * a reviewer's laptop would carry two different dates on a document that is
 * supposed to be one document. `moment` is in the project and would do the same
 * job, but it is 70KB inside a chunk that already carries a PDF engine.
 *
 * Both take `null` and return `""`, because every caller is a table cell that
 * may legitimately be blank - an unsubmitted request, an approval that has not
 * happened. `"Invalid Date"` printed onto an official form is the failure this
 * signature exists to make impossible.
 *
 * The times are LOCAL to wherever this runs, which is the browser: the reader
 * is in the same office as the requestor, and a UTC stamp on a Philippine form
 * would read eight hours early.
 */

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
] as const;

/** A parsed date, or `null` for anything that is not one. Keeps the two
 *  formatters below from each repeating the guard - and from each answering a
 *  garbage string differently. */
function parse(iso: string | null | undefined): Date | null {
	if (!iso) return null;

	const date = new Date(iso);

	return Number.isNaN(date.getTime()) ? null : date;
}

/** `"March 03, 2026"`. Empty string for a missing or unparseable value. */
export function formatPdfDate(iso: string | null | undefined): string {
	const date = parse(iso);

	if (!date) return "";

	return `${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
}

/**
 * `"02:05 PM"`. Empty string for a missing or unparseable value.
 *
 * Midnight is `12:00 AM` and noon is `12:00 PM` - the `% 12 || 12` is what
 * stops both printing as `00:00`, which is the one hour a 12-hour clock gets
 * wrong when it is written by hand.
 */
export function formatPdfTime(iso: string | null | undefined): string {
	const date = parse(iso);

	if (!date) return "";

	const hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const period = hours >= 12 ? "PM" : "AM";

	return `${String(hours % 12 || 12).padStart(2, "0")}:${minutes} ${period}`;
}
