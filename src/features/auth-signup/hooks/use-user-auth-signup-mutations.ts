import { AppToast, reason } from "@bernardsapida/web-ui";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CircleAlert, UserPlus } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authClient } from "@/features/auth/utils/auth-client";
import { useTRPC } from "@/integrations/trpc/react";

/**
 * Register, then sign in, then land on the profile.
 *
 * The sign-in is a second call rather than a session handed back by the
 * mutation: `auth.api.signUpEmail` runs server-side inside tRPC, so the
 * Set-Cookie it produces never reaches the browser. `authClient.signIn.email`
 * is what actually puts the session cookie in the document.
 *
 * `/profile` is the destination because `profileComplete` is false until a
 * signature is uploaded (spec 003) - a brand new account cannot file a request
 * yet, so sending them to the dashboard would only show them what they cannot
 * do.
 */
export function useUserAuthSignupMutations() {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const { refetchSession } = useAuth();

	const signUp = useMutation({
		...trpc.authSignup.signUp.mutationOptions(),
		onSuccess: async (_data, variables) => {
			// The address the account was created under, not the one as typed -
			// the schema lowercases it server-side and this has to match.
			const email = variables.email.trim().toLowerCase();

			const { error: signInError } = await authClient.signIn.email({ email, password: variables.password });

			if (signInError) {
				// The account exists; only the automatic sign-in failed. Say that,
				// rather than reporting a signup failure that did not happen.
				AppToast.warning("Account created", {
					description: "Sign in with your new account to continue.",
					icon: UserPlus,
				});
				navigate({ to: "/sign-in" });
				return;
			}

			await refetchSession();

			AppToast.success("Account created", {
				description: "Complete your profile to continue.",
				icon: UserPlus,
			});
			navigate({ to: "/profile" });
		},
		onError: (error) => {
			AppToast.error("Signup failed", {
				description: reason(error, "Please try again."),
				icon: CircleAlert,
			});
		},
	});

	return { signUp };
}
