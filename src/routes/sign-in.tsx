import { AppAuthPageShell } from "@bernardsapida/web-ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { redirectAuthenticatedUserFn } from "@/features/auth/functions/auth.functions";

export const Route = createFileRoute("/sign-in")({
	beforeLoad: async () => {
		return await redirectAuthenticatedUserFn();
	},
	head: () => ({
		meta: [
			{ title: seo.title("Sign In") },
			{ content: seo.description, name: "description" },
			{ content: "noindex", name: "robots" },
		],
		links: [{ href: `${seo.url}/sign-in`, rel: "canonical" }],
	}),
	component: SignInPage,
});

function SignInPage() {
	const navigate = useNavigate();
	return (
		<AppAuthPageShell>
			<SignInForm onSuccess={() => navigate({ to: "/dashboard" })} />
		</AppAuthPageShell>
	);
}
