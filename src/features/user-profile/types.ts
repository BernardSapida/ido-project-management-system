import type { UserRole } from "@/utils/config";

/**
 * The profile as `profile.getMyProfile` returns it.
 *
 * Written out rather than inferred from the router so the components can be read
 * — and typechecked — without pulling a tRPC type through three generics. It is
 * the same select, and the router is where it is enforced.
 */
export interface ProfileUser {
	createdAt: Date;
	email: string;
	firstname: string;
	id: string;
	lastname: string;
	name: string;
	position: string | null;
	profileComplete: boolean;
	role: UserRole;
	signatureUrl: string | null;
	status: string;
}
