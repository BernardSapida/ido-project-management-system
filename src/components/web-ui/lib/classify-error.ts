import { TRPCClientError } from "@trpc/client";
import type { ErrorKind, ErrorReference } from "../components/AppErrorState";

/**
 * What `AppErrorState` needs to render a specific failure, derived from the
 * thing TanStack Query actually hands a component: an `unknown`.
 */
export interface ClassifiedError {
	/** The api's own sentence, when it gave one worth showing. */
	detail?: string;
	kind: ErrorKind;
	reference: ErrorReference;
}

/**
 * tRPC's codes, mapped to the kinds a user can act on.
 *
 * The mapping is not one-to-one on purpose: `GATEWAY_TIMEOUT` and `TIMEOUT` are
 * the same problem to the person waiting, and `PRECONDITION_FAILED` is what a
 * stale write looks like from the server's side. The user does not care which
 * of two codes came back; they care whether to wait, reload, or go somewhere
 * else, and that is what the kind decides.
 */
const KIND_BY_TRPC_CODE: Record<string, ErrorKind> = {
	BAD_GATEWAY: "server",
	CLIENT_CLOSED_REQUEST: "timeout",
	CONFLICT: "conflict",
	FORBIDDEN: "forbidden",
	GATEWAY_TIMEOUT: "timeout",
	INTERNAL_SERVER_ERROR: "server",
	NOT_FOUND: "not-found",
	NOT_IMPLEMENTED: "server",
	PRECONDITION_FAILED: "conflict",
	SERVICE_UNAVAILABLE: "maintenance",
	TIMEOUT: "timeout",
	TOO_MANY_REQUESTS: "rate-limited",
	UNAUTHORIZED: "unauthenticated",
};

/**
 * Turns whatever a failed query threw into a kind, a code and - when the api
 * bothered to say something specific - a sentence.
 *
 * This exists so no screen has to decide for itself what a 403 looks like.
 * Every caller that renders a failure runs it through here, which is what makes
 * "not found" look the same on the warehouses table as it does on a customer
 * profile, and what stops a dropped wifi being reported as a server fault.
 */
export function classifyError(error: unknown): ClassifiedError {
	if (error instanceof TRPCClientError) {
		const code = typeof error.data?.code === "string" ? error.data.code : undefined;

		return {
			detail: toDetail(error.message, code),
			kind: (code && KIND_BY_TRPC_CODE[code]) ?? "unknown",
			reference: { code: code ?? "TRPC_UNKNOWN", requestId: readRequestId(error.data) },
		};
	}

	/*
	 * `fetch` rejects with a TypeError when the request never left - DNS, CORS, a
	 * dropped connection. It is the only failure here with no response at all,
	 * and AppErrorState will demote it further to "offline" if the browser says
	 * the device has no connection.
	 */
	if (error instanceof TypeError) {
		return { kind: "network", reference: { code: "FETCH_FAILED" } };
	}

	return {
		detail: error instanceof Error ? toDetail(error.message) : undefined,
		kind: "unknown",
		reference: { code: "UNHANDLED" },
	};
}

/**
 * tRPC falls back to the code itself as the message, so an unhandled 401 throws
 * with `message === "UNAUTHORIZED"`. Rendering that as the explanation would put
 * a machine token where the sentence goes, so anything that is only the code
 * back again - or too short to be a sentence at all - is dropped and the kind's
 * own copy takes over.
 */
function toDetail(message: string, code?: string): string | undefined {
	const trimmed = message.trim();
	if (!trimmed || trimmed === code) return undefined;
	if (!trimmed.includes(" ")) return undefined;
	return trimmed;
}

/**
 * The api may attach a request id to the error shape. It is not in tRPC's own
 * type, so it is read defensively rather than asserted - a missing id costs a
 * line in the reference block, a wrong cast costs a crash inside an error
 * handler.
 */
function readRequestId(data: unknown): string | undefined {
	if (typeof data !== "object" || data === null) return undefined;

	for (const key of ["requestId", "request_id", "traceId"]) {
		const value = Reflect.get(data, key);
		if (typeof value === "string" && value) return value;
	}

	return undefined;
}
