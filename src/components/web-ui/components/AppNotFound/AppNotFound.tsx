import { useAppUI } from "../../internal";
import { useNavigate } from "@tanstack/react-router";
import { AppBackdrop } from "../AppBackdrop";
import { AppErrorState } from "../AppErrorState";

/**
 * The router's 404, for an address that matches no route.
 *
 * It is `AppErrorState` in a full-height shell rather than a hand-written page,
 * so the one thing a 404 has to do - say what happened, say what to do, and give
 * the user a reference if they think the link should have worked - is the same
 * here as it is on a failed query inside the app.
 *
 * "Go back" is the built-in primary because the overwhelming majority of 404s
 * are a stale link followed from somewhere the user still wants to be. Home is
 * the secondary, for the ones that arrived cold.
 */
/*
 * No props, deliberately - not even a `data-cy`. This is bound straight to the
 * router's `notFoundComponent` in both `router.tsx` and `__root.tsx`, and that
 * slot types its component as `(props: NotFoundRouteProps) => any`. Adding an
 * options bag of our own makes the assignment fail, so the lab hangs its test
 * hook on the frame it renders this inside.
 */
export function AppNotFound() {
	const { appName } = useAppUI();
	const navigate = useNavigate();

	return (
		<div
			className="relative min-h-screen overflow-hidden bg-background"
			data-cy="not-found"
		>
			<AppBackdrop variant="app" />
			<AppErrorState
				className="relative z-10 min-h-screen"
				kind="not-found"
				secondaryAction={{ label: `Go to ${appName} home`, onPress: () => void navigate({ to: "/" }) }}
				variant="page"
			/>
		</div>
	);
}
