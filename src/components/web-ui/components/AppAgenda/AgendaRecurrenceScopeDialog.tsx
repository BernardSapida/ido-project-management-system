import { Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import { AppDialog } from "../AppDialog";
import { AppRadioGroup } from "../AppRadioGroup";
import type { RecurrenceScope } from "./agenda.types";

interface AgendaRecurrenceScopeDialogProps {
	isOpen: boolean;
	action: "edit" | "delete";
	onConfirm: (scope: RecurrenceScope) => void;
	onClose: () => void;
}

const ITEMS: { label: string; value: RecurrenceScope }[] = [
	{ label: "This event", value: "this" },
	{ label: "This and following events", value: "thisAndFollowing" },
	{ label: "All events", value: "all" },
];

/**
 * This event / This and following / All events. The choice is the difference
 * between an override row and mutating the RRULE - a data-model requirement, not
 * a nicety. A non-recurring occurrence skips it.
 *
 * NOTE: `AppAgenda` no longer uses this. It now runs the same choice as a step
 * INSIDE the side-panel `AppModal` (`AgendaSidePanel`'s `ScopeStep`), because an
 * `AppDialog` over that modal is two stacked overlays. This standalone dialog is
 * kept exported for a consumer driving its own edit flow.
 */
export function AgendaRecurrenceScopeDialog({
	isOpen,
	action,
	onConfirm,
	onClose,
}: AgendaRecurrenceScopeDialogProps) {
	const [scope, setScope] = useState<RecurrenceScope>("this");

	useEffect(() => {
		if (isOpen) setScope("this");
	}, [isOpen]);

	return (
		<AppDialog
			confirmLabel={action === "delete" ? "Delete" : "Save"}
			description={`Choose which occurrences this ${action} applies to.`}
			icon={Repeat}
			isOpen={isOpen}
			onClose={onClose}
			onConfirm={() => onConfirm(scope)}
			title={action === "delete" ? "Delete recurring event" : "Edit recurring event"}
			tone={action === "delete" ? "danger" : "default"}
		>
			<AppRadioGroup
				items={ITEMS}
				label="Apply to"
				onChange={(value) => setScope(value as RecurrenceScope)}
				orientation="vertical"
				value={scope}
			/>
		</AppDialog>
	);
}
