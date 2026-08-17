import { AppAuthPageShell } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { redirectAuthenticatedUserFn } from "@/features/auth/functions/auth.functions";

export const Route = createFileRoute("/forgot-password")({
	beforeLoad: async () => {
		return await redirectAuthenticatedUserFn();
	},
	head: () => ({
		meta: [
			{ title: seo.title("Forgot Password") },
			{ content: seo.description, name: "description" },
			{ content: "noindex", name: "robots" },
		],
		links: [{ href: `${seo.url}/forgot-password`, rel: "canonical" }],
	}),
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	return (
		<AppAuthPageShell>
			<ForgotPasswordForm />
		</AppAuthPageShell>
	);
}
