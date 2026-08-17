import { AppAuthPageShell } from "@bernardsapida/web-ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { seo } from "@/config/seo.config";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const Route = createFileRoute("/reset-password")({
	validateSearch: z.object({
		token: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{ title: seo.title("Reset Password") },
			{ content: seo.description, name: "description" },
			{ content: "noindex", name: "robots" },
		],
		links: [{ href: `${seo.url}/reset-password`, rel: "canonical" }],
	}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const navigate = useNavigate();
	const { token } = Route.useSearch();
	return (
		<AppAuthPageShell>
			<ResetPasswordForm
				onSuccess={() => navigate({ to: "/sign-in" })}
				token={token}
			/>
		</AppAuthPageShell>
	);
}
