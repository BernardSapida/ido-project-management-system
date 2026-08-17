import { AppAuthPageShell } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { redirectAuthenticatedUserFn } from "@/features/auth/functions/auth.functions";

export const Route = createFileRoute("/sign-up")({
	beforeLoad: async () => {
		return await redirectAuthenticatedUserFn();
	},
	head: () => ({
		meta: [
			{ title: seo.title("Sign Up") },
			{ content: seo.description, name: "description" },
			{ content: "noindex", name: "robots" },
		],
		links: [{ href: `${seo.url}/sign-up`, rel: "canonical" }],
	}),
	component: SignUpPage,
});

function SignUpPage() {
	return (
		<AppAuthPageShell>
			<SignUpForm />
		</AppAuthPageShell>
	);
}
