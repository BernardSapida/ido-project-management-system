import type { Session as BaseSession, User as BaseUser } from "better-auth";
import type { Role } from "./common.types";

/**
 * The session user, with every `additionalFields` column declared in
 * `better-auth.ts` spelled out.
 *
 * They are on the session object at runtime whether or not they are in this
 * type — Better Auth returns declared additional fields — so leaving them out
 * only meant every caller reached for a cast. `profileComplete` in particular is
 * read by the `_authenticated` gate, and a gate that depends on an `as unknown
 * as` is a gate nothing typechecks.
 */
export type User = BaseUser & {
	role: Role;
	firstname: string;
	lastname: string;
	status: string;
	/** Requestors only. Staff may leave it null forever — see spec 003. */
	position: string | null;
	/** The image stamped onto the printed request form and every approval. */
	signatureUrl: string | null;
	/** Derived on the server from `signatureUrl`. Never sent by the client. */
	profileComplete: boolean;
};

export type Session = BaseSession & {
	user: User;
};
