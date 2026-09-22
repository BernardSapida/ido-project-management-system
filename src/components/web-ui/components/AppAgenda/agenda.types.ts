/**
 * The Agenda components are PURE: props in, callbacks out, no data fetching and
 * no import of app code (`libs/web/ui` is published). A consumer wires these
 * types to `scheduler.*` procedures, or to anything else.
 */

export type AgendaView = "day" | "week" | "month";

/** Which slice of a recurring series an edit or delete applies to. */
export type RecurrenceScope = "this" | "thisAndFollowing" | "all";

/** How an entry came to exist. `system` is created programmatically, not via the Add button. */
export type AgendaEntrySource = "manual" | "system";

/**
 * One already-expanded occurrence. Expansion is the server's job - AppAgenda
 * never receives a raw RRULE on the read path, so the recurrence logic lives in
 * one place.
 */
export interface AgendaOccurrence {
	entryId: string;
	calendarId: string;
	/** The ORIGINAL series start that identifies this occurrence (== startsAt for a one-off). */
	occurrenceStart: Date;
	/** Effective time after any override is applied. */
	startsAt: Date;
	endsAt: Date;
	timeZone: string;
	isAllDay: boolean;
	title: string;
	description?: string | null;
	location?: string | null;
	/** Hex; falls back to the calendar colour when absent. */
	color?: string | null;
	source: AgendaEntrySource;
	subjectType?: string | null;
	subjectId?: string | null;
	isRecurring: boolean;
	isOverridden: boolean;
}

/**
 * What AppAgenda hands back on create or edit. A consumer turns this into a
 * `scheduler.createEntry` / `scheduler.updateEntry` input.
 */
export interface AgendaEntryDraft {
	/** Present on an edit, absent on a create. */
	entryId?: string;
	title: string;
	description?: string;
	location?: string;
	color?: string;
	isAllDay: boolean;
	/** ISO 8601. */
	startsAt: string;
	/** ISO 8601. */
	endsAt: string;
	/** RFC 5545 RRULE with no DTSTART line; absent for a one-off. */
	recurrenceRule?: string;
	/** For an edit of a recurring entry - which slice. */
	scope?: RecurrenceScope;
	/** For an edit of a recurring entry - which occurrence, ISO 8601. */
	occurrenceStart?: string;
}
