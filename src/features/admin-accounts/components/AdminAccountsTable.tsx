import {
	AppAvatar,
	AppChip,
	AppDataTable,
	AppDropdown,
	AppTableHighlight,
	type ColumnDef,
	type DataTableServer,
	type DropdownSection,
	type FilterDef,
} from "@bernardsapida/web-ui";
import { Button, Typography } from "@heroui/react";
import { MoreHorizontal, ShieldCheck, ToggleLeft, UserCog } from "lucide-react";
import {
	profileChip,
	ROLE_FILTER_OPTIONS,
	roleLabel,
	STATUS_FILTER_OPTIONS,
	statusChip,
} from "@/features/admin-accounts/lib/account-options";
import { positionLabel } from "@/features/request-form/lib/request-options";
import type { AdminUserRow } from "../types";

interface AdminAccountsTableProps {
	/** The signed-in admin's id. The row it matches is the one whose role and
	 *  status actions are dead - see `rowMenu`. */
	currentUserId: string;
	isLoading: boolean;
	onCreate: () => void;
	onUpdatePermissions: (row: AdminUserRow) => void;
	onUpdateRole: (row: AdminUserRow) => void;
	onUpdateStatus: (row: AdminUserRow) => void;
	rows: AdminUserRow[];
	/** The controlled contract: values in, edits out. Assembled by the page, which
	 *  is the thing that owns the URL they live in. */
	server: DataTableServer;
}

const ROLE_FILTER: FilterDef = {
	allLabel: "All roles",
	icon: UserCog,
	key: "role",
	label: "Role",
	options: ROLE_FILTER_OPTIONS,
};

const STATUS_FILTER: FilterDef = {
	allLabel: "All statuses",
	icon: ShieldCheck,
	key: "status",
	label: "Status",
	options: STATUS_FILTER_OPTIONS,
};

/** `dd MMM yyyy`, en-PH. Client-side only - these rows never render on the server. */
function formatCreatedAt(value: Date): string {
	return new Date(value).toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * The account list.
 *
 * `AppDataTable` in CONTROLLED server mode, so every filter lives in the URL and
 * a filtered view is a link. The page owns those values; this file owns the
 * columns, the two filter definitions and the row menu.
 *
 * ## Why the self row's actions are disabled rather than hidden
 *
 * An admin looking at their own row and finding a shorter menu than everybody
 * else's learns nothing. `disabledReason` puts the sentence in the menu, where
 * the press would have been - and the server refuses the same two calls anyway
 * (`assertNotSelf`), so this is the explanation and not the gate.
 *
 * Permissions is NOT disabled on the self row. An ADMIN holds no grants by
 * design, so opening it shows seven switches all off, which is a true and useful
 * answer to "why can I not open a request?".
 */
export function AdminAccountsTable({
	currentUserId,
	isLoading,
	onCreate,
	onUpdatePermissions,
	onUpdateRole,
	onUpdateStatus,
	rows,
	server,
}: AdminAccountsTableProps) {
	const rowMenu = (row: AdminUserRow): DropdownSection[] => {
		const isSelf = row.id === currentUserId;
		const selfReason =
			"You cannot change your own role or status — it is what stops the last administrator locking themselves out.";

		return [
			{
				items: [
					{
						disabledReason: isSelf ? selfReason : undefined,
						icon: UserCog,
						isDisabled: isSelf,
						key: "role",
						label: "Change role",
						onAction: () => onUpdateRole(row),
					},
					{
						disabledReason: isSelf ? selfReason : undefined,
						icon: ToggleLeft,
						isDisabled: isSelf,
						key: "status",
						label: "Change status",
						onAction: () => onUpdateStatus(row),
					},
					{
						icon: ShieldCheck,
						key: "permissions",
						label: "Permissions",
						onAction: () => onUpdatePermissions(row),
					},
				],
				key: "account",
			},
		];
	};

	const columns: ColumnDef<AdminUserRow>[] = [
		{
			key: "name",
			label: "Name",
			// The email under the name rather than in its own column: it is what tells
			// two people with the same name apart, so it has to be read WITH the name
			// and not four columns away from it.
			render: (row) => (
				<div className="flex items-center gap-3">
					<AppAvatar
						name={row.name}
						size="sm"
					/>
					<div className="flex flex-col">
						<AppTableHighlight>{row.name}</AppTableHighlight>
						<Typography
							color="muted"
							type="body-xs"
						>
							<AppTableHighlight>{row.email}</AppTableHighlight>
						</Typography>
					</div>
				</div>
			),
			// Both lines are searchable, and the search box matches on this string.
			searchValue: (row) => `${row.name} ${row.email}`,
		},
		{
			key: "role",
			label: "Role",
			// A chip, not text. An admin scanning forty accounts is reading the SHAPE
			// of the org — how many directors, how many officers — and six words in
			// one column are the same shape at a glance.
			render: (row) => (
				<AppChip
					icon={UserCog}
					label={roleLabel(row.role)}
					size="sm"
					tone="accent"
				/>
			),
		},
		{
			key: "status",
			label: "Status",
			render: (row) => (
				<AppChip
					{...statusChip(row.status)}
					size="sm"
				/>
			),
		},
		{ key: "position", label: "Position", render: (row) => positionLabel(row.position) },
		{
			key: "profileComplete",
			label: "Profile",
			// Here because an approver with no signature is a queue that will stall:
			// the profile gate in `_authenticated.tsx` parks them at /profile, and
			// nothing in their queue moves until they upload one.
			render: (row) => (
				<AppChip
					{...profileChip(row.profileComplete)}
					size="sm"
				/>
			),
		},
		{ key: "createdAt", label: "Created", render: (row) => formatCreatedAt(row.createdAt) },
		{
			key: "actions",
			label: "",
			render: (row) => (
				<AppDropdown
					label="Account actions"
					sections={rowMenu(row)}
					trigger={
						<Button
							aria-label={`Actions for ${row.name}`}
							isIconOnly
							size="sm"
							variant="ghost"
						>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					}
				/>
			),
		},
	];

	return (
		<AppDataTable
			columns={columns}
			data-cy="admin-accounts-table"
			description="Everyone with an account, including the requestors who registered themselves."
			// The way out of an empty table is the same button as the page header's,
			// and it has to be here too: on an empty table the header action is the
			// furthest control from where the eye has landed.
			emptyAction={{ label: "New Staff Account", onPress: onCreate }}
			filters={[ROLE_FILTER, STATUS_FILTER]}
			hasColumnPicker
			// h2: this table is the page's only section, directly under the
			// AppPageHeader's h1.
			headingLevel={2}
			isLoading={isLoading}
			noun="accounts"
			rows={rows}
			searchPlaceholder="Search by name or email"
			server={server}
			storageKey="admin-accounts"
			title="Accounts"
		/>
	);
}
