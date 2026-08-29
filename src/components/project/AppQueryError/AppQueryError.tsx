import { AppErrorState, classifyError } from "@bernardsapida/web-ui";

/**
 * Compatibility wrapper for the `AppQueryError` that `@bernardsapida/web-ui`
 * removed in 1.0.0. It was a three-line component - `classifyError(error)` piped
 * into `<AppErrorState variant="section" />` - and this reproduces it exactly so
 * the ~18 call sites that used it did not each have to inline the same three
 * lines. New code should call `classifyError` + `AppErrorState` directly.
 */
interface AppQueryErrorProps {
	error: unknown;
	onRetry?: () => void;
	"data-cy"?: string;
}

export function AppQueryError({ error, onRetry, "data-cy": dataCy }: AppQueryErrorProps) {
	const { detail, kind, reference } = classifyError(error);

	return (
		<AppErrorState
			data-cy={dataCy}
			detail={detail}
			kind={kind}
			onRetry={onRetry}
			reference={reference}
			variant="section"
		/>
	);
}
