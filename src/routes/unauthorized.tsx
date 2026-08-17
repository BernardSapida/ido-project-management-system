import { Button, Card } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, ShieldAlert } from "lucide-react";

import { seo } from "@/config/seo.config";

export const Route = createFileRoute("/unauthorized")({
	head: () => ({
		meta: [{ title: seo.title("Unauthorized") }, { name: "robots", content: "noindex" }],
	}),
	component: UnauthorizedPage,
});

function UnauthorizedPage() {
	return (
		<div className="min-h-screen grid items-center justify-center p-6 bg-app-base relative overflow-hidden">
			{/* Background Glow */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[120%] -z-10 opacity-30 pointer-events-none">
				<div className="absolute top-[10%] left-[20%] h-96 w-96 rounded-full bg-red-100 blur-3xl animate-pulse" />
				<div className="absolute bottom-[20%] right-[30%] h-64 w-64 rounded-full bg-app-brand/20 blur-3xl animate-pulse delay-500" />
			</div>

			<div className="w-full max-w-lg mb-24 rise-in text-center flex flex-col items-center">
				<div className="mb-12 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-600 shadow-xl shadow-red-100/30 group hover:-translate-y-1 transition-transform">
					<ShieldAlert className="h-10 w-10 text-red-500" />
				</div>

				<h1 className="text-5xl font-serif font-bold text-text-primary mb-6">Restricted Access</h1>

				<p className="text-lg text-text-secondary font-medium leading-relaxed mb-12 max-w-md">
					You tried to access a protected area without the necessary permissions. Please contact your administrator if
					you believe this is an error.
				</p>

				<Card className="p-8 lg:p-12 shadow-2xl rounded-3xl w-full mb-12 border-none shadow-none font-sans">
					<Card.Content className="p-0 gap-6 flex flex-col">
						<div className="flex flex-col gap-4">
							{/* Link components must be handled carefully with Button in v3 */}
							<Link
								className="w-full"
								to="/dashboard"
							>
								<Button
									className="h-14 rounded-2xl text-lg font-bold shadow-xl shadow-app-brand/20 w-full"
									size="lg"
									type="button"
									variant="primary"
								>
									Back to Dashboard
								</Button>
							</Link>
							<Link
								className="w-full"
								to="/"
							>
								<Button
									className="h-14 border-text-primary/10 hover:border-text-primary/20 font-bold text-text-primary flex items-center gap-3 w-full"
									size="lg"
									type="button"
									variant="outline"
								>
									Back to Home
								</Button>
							</Link>
						</div>
					</Card.Content>
				</Card>

				<Link
					className="text-sm font-bold text-text-secondary/70 flex items-center gap-2 group transition-opacity opacity-70 hover:opacity-100"
					to="/"
				>
					<Layout className="h-4 w-4" />
					Monolith Project
				</Link>
			</div>
		</div>
	);
}
