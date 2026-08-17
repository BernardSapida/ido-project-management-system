import type { Session as BaseSession, User as BaseUser } from "better-auth";
import type { Role } from "./common.types";

export type User = BaseUser & {
	role: Role;
	firstname: string;
	lastname: string;
	status: string;
};

export type Session = BaseSession & {
	user: User;
};
