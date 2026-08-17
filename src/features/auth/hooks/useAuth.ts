import type { Session, User } from "@/types/auth.types";
import { authClient } from "../utils/auth-client";

export const useAuth = () => {
	const { data: session, isPending, error, refetch } = authClient.useSession();

	return {
		user: (session?.user as unknown as User) ?? null,
		session: (session?.session as unknown as Session) ?? null,
		isPending,
		error,
		refetchSession: refetch,
	};
};
