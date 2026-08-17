import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "../utils/better-auth";

export const getSession = async () => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });
	return session;
};
