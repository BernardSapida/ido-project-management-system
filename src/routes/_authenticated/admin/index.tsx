import { AppButton, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { AppQueryError } from "@/components/project";
import { seo } from "@/config/seo.config";
import { AdminAccountsTable } from "@/features/admin-accounts/components/AdminAccountsTable";
import { CreateStaffAccountModal } from "@/features/admin-accounts/components/CreateStaffAccountModal";
import { UpdateUserRoleModal } from "@/features/admin-accounts/components/UpdateUserRoleModal";
import { UpdateUserStatusModal } from "@/features/admin-accounts/components/UpdateUserStatusModal";
import { UserPermissionsModal } from "@/features/admin-accounts/components/UserPermissionsModal";
import { useAdminAccountsQueries } from "@/features/admin-accounts/hooks/use-admin-accounts-queries";
import type { AdminUserRow } from "@/features/admin-accounts/types";
import { useAuth } from "@/features/auth/hooks/useAuth";

/**
 * Filter, search and page live in the URL, not in component state.
 *
 * `.catch` throughout rather than a plain default: a hand-edited `?page=abc` has
 * to land on something, and a thrown validation error here would replace the
 * whole screen with an error boundary over a typo in a query string.
 */
const searchSchema = z.object({
	page: z.number().int().min(1).catch(1),
	pageSize: z.number().int().min(1).max(100).catch(10),
	role: z.string().optional(),
	search: z.string().optional(),
	status: z.string().optional(),
});

type AdminSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/admin/")({
	head: () => ({
		meta: [{ title: seo.title("Account Management") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Accounts",
	},
	validateSearch: searchSchema,
	component: AdminAccountsPage,
});

/** Which overlay is open, and over whom. One piece of state rather than four
 *  booleans, because exactly one of them may ever be open at a time. */
type OpenDialog = { kind: "create" } | { kind: "permissions" | "role" | "status"; row: AdminUserRow } | null;

function AdminAccountsPage() {
	const navigate = Route.useNavigate();
	const { page, pageSize, role, search, status } = Route.useSearch();
	const { user } = useAuth();
	const [open, setOpen] = useState<OpenDialog>(null);

	const { users } = useAdminAccountsQueries({ page, pageSize, role, search, status });

	/**
	 * Any change to WHICH rows exist resets the page.
	 *
	 * Without it, filtering from page 4 down to two results leaves the admin on
	 * page 4 of a two-row set - an empty table under a tracker that disagrees with
	 * it, which reads as "this person does not exist".
	 */
	const setFilters = (next: Partial<AdminSearch>) => {
		void navigate({ search: (prev) => ({ ...prev, ...next, page: 1 }) });
	};

	const setPage = (next: number) => {
		void navigate({ search: (prev) => ({ ...prev, page: next }) });
	};

	const close = () => setOpen(null);
	const openRow = open && open.kind !== "create" ? open.row : null;

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				action={
					<AppButton
						data-cy="new-staff-account"
						icon={UserPlus}
						onPress={() => setOpen({ kind: "create" })}
						variant="primary"
					>
						New Staff Account
					</AppButton>
				}
				subtitle="Create staff accounts, set roles and control what each person may do."
				title="Account Management"
			/>

			{users.isError ? (
				<AppQueryError
					error={users.error}
					onRetry={() => void users.refetch()}
				/>
			) : (
				<AdminAccountsTable
					// The signed-in admin's own row: its role and status actions are dead,
					// with the reason in the menu. The server refuses the same two calls.
					currentUserId={user?.id ?? ""}
					isLoading={users.isPending}
					onCreate={() => setOpen({ kind: "create" })}
					onUpdatePermissions={(row) => setOpen({ kind: "permissions", row })}
					onUpdateRole={(row) => setOpen({ kind: "role", row })}
					onUpdateStatus={(row) => setOpen({ kind: "status", row })}
					rows={users.data?.items ?? []}
					/*
					 * The controlled contract, assembled here because this is the thing
					 * that owns the URL every one of these values lives in.
					 *
					 * `onPageChange` is the only handler that does not reset the page, for
					 * the obvious reason. The other three do it in the same write that
					 * changes the filter - one navigation rather than two, so the back
					 * button undoes one filter change per press.
					 */
					server={{
						filters: { role: role ?? null, status: status ?? null },
						isFetching: users.isFetching,
						onFiltersChange: (next) => setFilters({ role: next.role ?? undefined, status: next.status ?? undefined }),
						onPageChange: setPage,
						onReset: () => setFilters({ role: undefined, search: undefined, status: undefined }),
						// Already trimmed by the table. Empty means "no search", not "search
						// for nothing" - left as `""` the parameter stays in the URL and the
						// query key changes for a filter that narrows nothing.
						onSearchChange: (next) => setFilters({ search: next || undefined }),
						page,
						search: search ?? "",
						total: users.data?.total ?? 0,
					}}
				/>
			)}

			<CreateStaffAccountModal
				isOpen={open?.kind === "create"}
				onClose={close}
			/>

			{/* Rendered unconditionally so each surface owns its own exit animation,
			    and keyed on the row so re-opening on a different person is a fresh
			    form rather than the previous account's values for a beat. */}
			<UpdateUserRoleModal
				currentRole={openRow?.role ?? "USER"}
				isOpen={open?.kind === "role"}
				key={`role-${openRow?.id ?? "none"}`}
				onClose={close}
				userId={openRow?.id ?? ""}
				userName={openRow?.name ?? ""}
			/>

			<UpdateUserStatusModal
				currentStatus={openRow?.status ?? "active"}
				isOpen={open?.kind === "status"}
				key={`status-${openRow?.id ?? "none"}`}
				onClose={close}
				userId={openRow?.id ?? ""}
				userName={openRow?.name ?? ""}
			/>

			<UserPermissionsModal
				isOpen={open?.kind === "permissions"}
				key={`permissions-${openRow?.id ?? "none"}`}
				onClose={close}
				userId={openRow?.id ?? null}
				userName={openRow?.name ?? ""}
				userRole={openRow?.role ?? "USER"}
			/>
		</div>
	);
}
