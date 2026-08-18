/**
 * One row of the account table.
 *
 * It mirrors `ACCOUNT_ROW_SELECT` in `admin-accounts.router.ts` rather than the
 * Prisma `User` model, and the difference is the point: the select is an
 * allow-list, so a field added to `User` later - a token, a hash, anything from
 * the account table - cannot arrive here by being added upstream.
 */
export interface AdminUserRow {
	createdAt: Date;
	email: string;
	firstname: string;
	id: string;
	lastname: string;
	name: string;
	position: string | null;
	profileComplete: boolean;
	role: string;
	status: string;
}
