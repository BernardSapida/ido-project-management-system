import { CalendarClock, MapPin, Repeat, Sparkles } from "lucide-react";
import { type ReactNode, useState } from "react";
import { AppButton } from "../AppButton";
import { AppModal } from "../AppModal";
import { AppRadioGroup } from "../AppRadioGroup";
import { AgendaEntryForm } from "./AgendaEntryForm";
import type {
	AgendaEntryDraft,
	AgendaOccurrence,
	RecurrenceScope,
} from "./agenda.types";
import { summariseRecurrence } from "./recurrence-summary";

export type AgendaSidePanelMode = "closed" | "read" | "scope" | "edit" | "create";

interface AgendaSidePanelProps {
	mode: AgendaSidePanelMode;
	occurrence?: AgendaOccurrence | null;
	/** IANA zone the entry form composes instants against. */
	timeZone?: string;
	/** The scope chosen in the recurrence step, threaded into the edit draft. */
	pendingScope?: RecurrenceScope | null;
	/** Whether the `scope` step is gating an edit or a delete. */
	scopeAction?: "edit" | "delete";
	onEdit: () => void;
	onDelete: () => void;
	onClose: () => void;
	/** Chosen scope from the in-modal recurrence step. */
	onResolveScope: (scope: RecurrenceScope) => void;
	/** Back out of the recurrence step to the read view. */
	onCancelScope: () => void;
	onSubmit: (draft: AgendaEntryDraft) => void | Promise<void>;
}

const RANGE = new Intl.DateTimeFormat(undefined, {
	weekday: "short",
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
});
const DAY_ONLY = new Intl.DateTimeFormat(undefined, {
	weekday: "short",
	month: "short",
	day: "numeric",
});

const SCOPE_ITEMS: { label: string; value: RecurrenceScope }[] = [
	{ label: "This event", value: "this" },
	{ label: "This and following events", value: "thisAndFollowing" },
	{ label: "All events", value: "all" },
];

/**
 * The one surface for read, the recurrence-scope step, edit and create - one
 * `AppModal`, never a second overlay on top of it (two focus traps in the DOM is
 * the bug `AppModal`'s own stack guard warns about). Editing or deleting a
 * recurring occurrence swaps the body to {@link ScopeStep} in place; a
 * non-recurring one goes straight to the form. `AppModal` runs with the footer
 * hidden, so every step carries its own buttons.
 */
export function AgendaSidePanel({
	mode,
	occurrence,
	timeZone,
	pendingScope,
	scopeAction = "edit",
	onEdit,
	onDelete,
	onClose,
	onResolveScope,
	onCancelScope,
	onSubmit,
}: AgendaSidePanelProps) {
	if (mode === "closed") return null;

	if (mode === "scope") {
		return (
			<AppModal
				hideFooter
				isOpen
				onClose={onClose}
				title={scopeAction === "delete" ? "Delete recurring event" : "Edit recurring event"}
			>
				<ScopeStep action={scopeAction} onCancel={onCancelScope} onConfirm={onResolveScope} />
			</AppModal>
		);
	}

	if (mode === "read") {
		if (!occurrence) return null;
		const when = occurrence.isAllDay
			? `${DAY_ONLY.format(occurrence.startsAt)} - all day`
			: `${RANGE.format(occurrence.startsAt)} - ${RANGE.format(occurrence.endsAt)}`;
		const recurrence = summariseRecurrence(
			occurrence.isRecurring ? "FREQ=WEEKLY" : null,
		);

		return (
			<AppModal hideFooter isOpen onClose={onClose} title={occurrence.title}>
				<dl className="flex flex-col gap-3 text-sm">
					<Row icon={<CalendarClock className="size-4" />} text={when} />
					{occurrence.location && (
						<Row icon={<MapPin className="size-4" />} text={occurrence.location} />
					)}
					{occurrence.isRecurring && recurrence && (
						<Row icon={<Repeat className="size-4" />} text={recurrence} />
					)}
					{occurrence.source === "system" && (
						<Row
							icon={<Sparkles className="size-4" />}
							text={`Tracked programmatically${occurrence.subjectType ? ` (${occurrence.subjectType})` : ""}`}
						/>
					)}
					{occurrence.description && (
						<p className="whitespace-pre-wrap text-muted-foreground">{occurrence.description}</p>
					)}
				</dl>

				<div className="flex justify-end gap-2 pt-4">
					<AppButton onPress={onDelete} type="button" variant="danger-soft">
						Delete
					</AppButton>
					<AppButton onPress={onEdit} type="button">
						Edit
					</AppButton>
				</div>
			</AppModal>
		);
	}

	return (
		<AppModal
			hideFooter
			isOpen
			onClose={onClose}
			title={mode === "create" ? "New agenda entry" : "Edit entry"}
		>
			<AgendaEntryForm
				initial={mode === "edit" && occurrence ? toDraft(occurrence, pendingScope) : undefined}
				mode={mode}
				onCancel={onClose}
				onSubmit={onSubmit}
				timeZone={timeZone}
			/>
		</AppModal>
	);
}

/**
 * This event / This and following / All events - the choice that decides
 * whether an edit writes an override row or mutates the RRULE. Its own state,
 * mounted only while `mode === "scope"`, so it resets to "this" every time.
 */
function ScopeStep({
	action,
	onConfirm,
	onCancel,
}: {
	action: "edit" | "delete";
	onConfirm: (scope: RecurrenceScope) => void;
	onCancel: () => void;
}) {
	const [scope, setScope] = useState<RecurrenceScope>("this");

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted-foreground text-sm">
				Choose which occurrences this {action} applies to.
			</p>
			<AppRadioGroup
				items={SCOPE_ITEMS}
				label="Apply to"
				onChange={(value) => setScope(value as RecurrenceScope)}
				orientation="vertical"
				value={scope}
			/>
			<div className="flex justify-end gap-2 pt-2">
				<AppButton onPress={onCancel} type="button" variant="tertiary">
					Cancel
				</AppButton>
				<AppButton
					onPress={() => onConfirm(scope)}
					type="button"
					variant={action === "delete" ? "danger" : "primary"}
				>
					{action === "delete" ? "Delete" : "Save"}
				</AppButton>
			</div>
		</div>
	);
}

function Row({ icon, text }: { icon: ReactNode; text: string }) {
	return (
		<div className="flex items-center gap-2 text-muted-foreground">
			<span className="shrink-0 text-foreground">{icon}</span>
			<span>{text}</span>
		</div>
	);
}

function toDraft(
	occurrence: AgendaOccurrence,
	scope?: RecurrenceScope | null,
): AgendaEntryDraft {
	return {
		entryId: occurrence.entryId,
		title: occurrence.title,
		description: occurrence.description ?? undefined,
		location: occurrence.location ?? undefined,
		color: occurrence.color ?? undefined,
		isAllDay: occurrence.isAllDay,
		startsAt: occurrence.startsAt.toISOString(),
		endsAt: occurrence.endsAt.toISOString(),
		recurrenceRule: occurrence.isRecurring ? "FREQ=WEEKLY" : undefined,
		scope: scope ?? undefined,
		occurrenceStart: occurrence.occurrenceStart.toISOString(),
	};
}
