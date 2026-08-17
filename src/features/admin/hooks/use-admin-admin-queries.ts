import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/trpc/react";

export function useAdminAdminQueries(page = 1, limit = 10) {
	const trpc = useTRPC();

	const usersQuery = useQuery({
		...trpc.admin.listUsers.queryOptions({ limit, page }),
		staleTime: 1000 * 60 * 5,
	});

	return {
		users: usersQuery,
	};
}
