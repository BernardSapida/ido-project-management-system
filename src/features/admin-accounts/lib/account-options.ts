import type { ChipTone } from "@bernardsapida/web-ui";
import { CircleCheck, CircleSlash, type LucideIcon, Shield, ShieldCheck, ShieldX } from "lucide-react";
import { getRoleLabel } from "@/config/navigation.config";
import type { UserRole } from "@/utils/config";

/**
 * Every closed list this screen offers, named once.
 *
 * The role LABELS are not redefined here - `getRoleLabel` in
 * `navigation.config.ts` already decides that "DIRECTOR" reads as "Campus
 * Director", and the sidebar shows the same word to the person whose row this
 * is. Two lists would drift the moment somebody is retitled.
 */

/**
 * The four roles `createStaffAccount` will mint.
 *
 * USER is absent because self-registration is the only path to it (spec 002),
 * ADMIN because administrators are seeded deliberately. The server rejects both
 * regardless - this array only decides what the dropdown offers.
 */
export const STAFF_ROLE_VALUES = ["IDO_OFFICER", "IDO_CHAIRPERSON", "DIRECTOR", "BUDGET_OFFICER"] as const;

export type StaffRoleValue = (typeof STAFF_ROLE_VALUES)[number];

/**
 * The five roles an existing account may be MOVED to.
 *
 * USER is here and not above: demoting a staff member back to a requestor is a
 * real thing an admin does, while creating a requestor from this page is not.
 * ADMIN is absent from both, and that is the guard against an administrator
 * minting a second one to work around the self-check.
 */
export const ASSIGNABLE_ROLE_VALUES = ["USER", ...STAFF_ROLE_VALUES] as const;

export type AssignableRoleValue = (typeof ASSIGNABLE_ROLE_VALUES)[number];

export const STATUS_VALUES = ["active", "inactive", "suspended"] as const;

export type StatusValue = (typeof STATUS_VALUES)[number];

/** Ready for `AppSelect`'s `items`. */
export const STAFF_ROLE_OPTIONS = STAFF_ROLE_VALUES.map((value) => ({
	label: getRoleLabel(value as UserRole),
	value,
}));

export const ASSIGNABLE_ROLE_OPTIONS = ASSIGNABLE_ROLE_VALUES.map((value) => ({
	label: getRoleLabel(value as UserRole),
	value,
}));

/** All six, for the table's Role filter - an ADMIN row still has to be findable. */
export const ROLE_FILTER_OPTIONS = (["ADMIN", ...ASSIGNABLE_ROLE_VALUES] as UserRole[]).map((value) => ({
	label: getRoleLabel(value),
	value,
}));

/**
 * The stored role as it should read on screen.
 *
 * Through `getRoleLabel`, with a fallback for the same reason `statusChip` has
 * one: the database can hold a role shipped after this map was last edited, and
 * a blank Role cell on the page that decides who may do what is the worst
 * possible answer to "what is this person?".
 */
export function roleLabel(value: string): string {
	return getRoleLabel(value as UserRole) ?? value;
}

/**
 * What each status MEANS for the person, not what it is called.
 *
 * The radio group in the status modal renders `description` under `label`, and
 * that sentence is the whole reason the control is a radio group rather than a
 * select: an admin choosing between three states has to be able to read what
 * each one does to somebody's working day.
 */
export const STATUS_OPTIONS: { description: string; label: string; value: StatusValue }[] = [
	{
		description: "They can sign in and do everything their role and permissions allow.",
		label: "Active",
		value: "active",
	},
	{
		description: "They can still sign in, but every action fails until an administrator reactivates them.",
		label: "Inactive",
		value: "inactive",
	},
	{
		description: "The same as inactive, and Better Auth also refuses to mint them a new session at sign-in.",
		label: "Suspended",
		value: "suspended",
	},
];

/** Ready for `AppSelect` / the table's Status filter - label and value only. */
export const STATUS_FILTER_OPTIONS = STATUS_OPTIONS.map(({ label, value }) => ({ label, value }));

const STATUS_CHIPS: Record<StatusValue, { icon: LucideIcon; tone: ChipTone }> = {
	active: { icon: ShieldCheck, tone: "success" },
	inactive: { icon: Shield, tone: "default" },
	suspended: { icon: ShieldX, tone: "danger" },
};

/**
 * A status the map has never heard of renders as itself rather than blanking the
 * cell - the same rule `RequestStatusChip` follows, and for the same reason: an
 * empty Status column on an account page is the worst possible answer to "can
 * this person sign in?".
 */
export function statusChip(value: string): { icon: LucideIcon; label: string; tone: ChipTone } {
	const entry = STATUS_CHIPS[value as StatusValue];
	const label = STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;

	return { icon: entry?.icon ?? Shield, label, tone: entry?.tone ?? "default" };
}

/**
 * Whether the person has a signature on file.
 *
 * It is a column rather than a detail because an approver without one is a queue
 * that will stall: `_authenticated.tsx` sends them to /profile and they cannot
 * reach a review page until they have uploaded one.
 */
export function profileChip(isComplete: boolean): { icon: LucideIcon; label: string; tone: ChipTone } {
	return isComplete
		? { icon: CircleCheck, label: "Complete", tone: "success" }
		: { icon: CircleSlash, label: "Incomplete", tone: "warning" };
}
