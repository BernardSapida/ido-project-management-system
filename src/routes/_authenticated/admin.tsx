import { AppQueryError } from "@bernardsapida/web-ui";
import { Button, Card } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useState } from "react";
import { seo } from "@/config/seo.config";
import { AdminHeader } from "@/features/admin/components/AdminHeader";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { UserTable } from "@/features/admin/components/UserTable";
import { UserTableSkeleton } from "@/features/admin/components/UserTableSkeleton";
import { useAdminAdminQueries } from "@/features/admin/hooks/use-admin-admin-queries";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { USER_ROLES } from "@/utils/config";

const PAGE_LIMIT = 10;

export const Route = createFileRoute("/_authenticated/admin")({
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({
			data: { allowedRoles: [USER_ROLES.ADMIN] },
		});
	},
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(context.trpc.admin.listUsers.queryOptions({ page: 1, limit: PAGE_LIMIT }));
	},
	head: () => ({
		meta: [{ title: seo.title("Admin") }, { name: "robots", content: "noindex" }],
	}),
	staticData: {
		breadcrumb: "Admin",
	},
	component: AdminPage,
});

function AdminPage() {
	const [page, setPage] = useState(1);
	const { users: usersQuery } = useAdminAdminQueries(page, PAGE_LIMIT);
	const { data, isLoading, isError, error, refetch } = usersQuery;

	const userList = data?.users ?? [];
	const totalPages = data?.totalPages ?? 1;
	const total = data?.total ?? 0;

	return (
		<div className="flex flex-col gap-12">
			<AdminHeader />

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<AdminStatCard
					icon={<Users />}
					title="Total Active Users"
					value={isLoading ? "..." : isError ? "--" : total.toLocaleString()}
				/>
			</div>

			<Card className="p-8 lg:p-12 border-none shadow-none">
				<Card.Content className="p-0">
					<div className="flex justify-between items-center mb-10 px-2 text-text-primary">
						<h3 className="text-2xl font-serif font-bold">User Access Management</h3>
					</div>

					{isError ? (
						<AppQueryError
							error={error}
							onRetry={() => refetch()}
						/>
					) : isLoading ? (
						<UserTableSkeleton />
					) : (
						<>
							<UserTable users={userList} />

							{totalPages > 1 && (
								<div className="flex items-center justify-between mt-8 px-2">
									<p className="text-xs font-medium text-text-secondary">
										Page {page} of {totalPages}
									</p>
									<div className="flex items-center gap-2">
										<Button
											isDisabled={page <= 1}
											isIconOnly
											onPress={() => setPage((p) => p - 1)}
											size="sm"
											variant="outline"
										>
											<ChevronLeft className="h-4 w-4" />
										</Button>
										<Button
											isDisabled={page >= totalPages}
											isIconOnly
											onPress={() => setPage((p) => p + 1)}
											size="sm"
											variant="outline"
										>
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</Card.Content>
			</Card>

			<div className="flex justify-center mt-12">
				<Link
					className="w-full max-w-xs"
					to="/"
				>
					<Button
						className="h-14 border-text-primary/10 hover:border-text-primary/20 font-bold text-text-primary flex items-center gap-3 w-full"
						size="lg"
						variant="outline"
					>
						Back to Home
					</Button>
				</Link>
			</div>
		</div>
	);
}
