import { AppAuthPageShell } from "@bernardsapida/web-ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "lucide-react";
import { useEffect } from "react";
import { seo } from "@/config/seo.config";
import { VerifyEmailCard } from "@/features/auth/components/VerifyEmailCard";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const Route = createFileRoute("/verify-email")({
	head: () => ({
		meta: [
			{ title: seo.title("Verify Email") },
			{ content: seo.description, name: "description" },
			{ content: "noindex", name: "robots" },
		],
	}),
	component: VerifyEmailPage,
});

function VerifyEmailPage() {
	const navigate = useNavigate();
	const { isPending, user } = useAuth();

	useEffect(() => {
		if (!isPending && !user) {
			navigate({ to: "/sign-in" });
		} else if (!isPending && user?.emailVerified) {
			navigate({ to: "/dashboard" });
		}
	}, [isPending, navigate, user]);

	if (isPending || !user) return null;

	return (
		<AppAuthPageShell>
			<div className="w-full max-w-xl mb-24 rise-in text-center flex flex-col items-center">
				<div className="flex flex-col items-center mb-12">
					<Link
						className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-app-brand text-white shadow-xl shadow-app-brand/20 group hover:-translate-y-1 transition-transform"
						to="/"
					>
						<Layout className="h-7 w-7" />
					</Link>
					<h1 className="text-4xl font-serif font-bold text-text-primary/90 mb-3 text-center">Verify your email</h1>
					<p className="text-text-secondary/70 font-medium text-center w-full">
						We sent a verification link to <span className="font-bold text-text-primary">{user.email}</span>. Click the
						link in your inbox to continue.
					</p>
				</div>
				<VerifyEmailCard userEmail={user.email} />
			</div>
		</AppAuthPageShell>
	);
}
