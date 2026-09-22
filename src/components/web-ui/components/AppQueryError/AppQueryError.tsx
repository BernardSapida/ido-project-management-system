import { AppErrorState } from "../AppErrorState";
import { classifyError } from "../../lib/classify-error";

interface QueryErrorProps {
	className?: string;
	/** Test hook, forwarded to the error state underneath. */
	"data-cy"?: string;
	/** The query's own `error`. Passed raw - classification happens here. */
	error: unknown;
	/** The query's `refetch`. Without it the only way out is a page reload. */
	onRetry?: () => void;
}

/**
 * The failure state for one query, standing in for the region that query feeds
 * while the rest of the page keeps working.
 *
 * It takes the raw `error` rather than a message, and that is the whole point of
 * it: every call site used to hand over `error instanceof Error ? error.message
 * : undefined`, which threw away the status code and left one headline -
 * "Data Synchronization Failed" - covering a 404, a 403, an expired session and
 * a dropped wifi alike. Three of those four have nothing to do with the server
 * and none of them are fixed by the retry button it offered.
 *
 * `classifyError` reads the code back out, `AppErrorState` renders the kind, and
 * the caller writes nothing. Use this for a query; for a whole route that could
 * not load, use `AppErrorState` with `variant="page"` directly.
 */
export function AppQueryError({ className, "data-cy": dataCy, error, onRetry }: QueryErrorProps) {
	const { detail, kind, reference } = classifyError(error);

	return (
		<AppErrorState
			className={className}
			data-cy={dataCy}
			detail={detail}
			kind={kind}
			onRetry={onRetry}
			reference={reference}
			variant="section"
		/>
	);
}
