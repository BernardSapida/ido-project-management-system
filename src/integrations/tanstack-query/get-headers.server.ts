import { getRequestHeaders } from "@tanstack/react-start/server";

export function getServerHeaders(): Record<string, string> {
	return Object.fromEntries(getRequestHeaders().entries());
}
