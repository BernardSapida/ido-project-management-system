import { AppErrorState } from "@bernardsapida/web-ui";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Component, type ReactNode } from "react";
import { classifyError } from "./classify-error";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

/**
 * The last line before a white screen, for a render that threw.
 *
 * Its fallback is a `section` error state rather than a page one: a boundary is
 * usually wrapped around a region, and blanking the whole screen because one
 * widget threw takes away the parts that still work.
 */
export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	/**
	 * A remount is the only recovery a render error has - the component that
	 * threw has to be given a second chance to build its tree. Reloading the
	 * whole document would work too and costs the user everything else on screen.
	 */
	private reset = () => {
		this.setState({ hasError: false, error: undefined });
	};

	render() {
		if (this.state.hasError) {
			const { detail, kind, reference } = classifyError(this.state.error);

			return (
				this.props.fallback ?? (
					<AppErrorState
						action={{ label: "Try again", onPress: this.reset }}
						detail={detail}
						kind={kind}
						reference={reference}
						variant="section"
					/>
				)
			);
		}
		return this.props.children;
	}
}

/**
 * The router's `errorComponent`: a route that threw in a loader or in render.
 *
 * `reset` is TanStack's own retry, which re-runs the loader rather than
 * reloading the document, so it is wired as the primary and the built-in
 * recovery is not used.
 */
export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
	const { detail, kind, reference } = classifyError(error);

	return (
		<AppErrorState
			action={{ label: "Try again", onPress: reset }}
			detail={detail}
			kind={kind}
			reference={reference}
			variant="page"
		/>
	);
}
